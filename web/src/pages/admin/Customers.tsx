import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { formatPhoneNumber, getWhatsAppUrl } from '../../lib/utils';
import { useAuth } from '../../lib/auth';

interface Customer {
  id: string;
  customer_name: string;
  phone: string;
  shop_name: string | null;
  customer_type: string | null;
  lead_source: string | null;
  status: string;
  created_at: string;
  created_by_agent_id: string;
  agent?: {
    name: string;
    email: string;
  };
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignToAgent, setReassignToAgent] = useState('');

  useEffect(() => {
    loadCustomers();
    loadAgents();
  }, [filterAgent]);

  const loadCustomers = async () => {
    try {
      let query = supabase
        .from('customers')
        .select(`
          *,
          users!customers_created_by_agent_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filterAgent !== 'all') {
        query = query.eq('created_by_agent_id', filterAgent);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data?.map((c: any) => ({
        ...c,
        agent: c.users,
      })) || [];

      setCustomers(formattedData);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'agent')
        .order('name');

      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  };

  const handleSelectCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(c => c.id)));
    }
  };

  const handleReassign = async () => {
    if (!reassignToAgent || selectedCustomers.size === 0) {
      alert('Please select customers and a target agent');
      return;
    }

    try {
      const customerIds = Array.from(selectedCustomers);
      const oldAgentIds = customers
        .filter(c => customerIds.includes(c.id))
        .map(c => c.created_by_agent_id);

      // Log audit entry for each reassignment
      for (let i = 0; i < customerIds.length; i++) {
        await supabase.from('audit_log').insert({
          admin_id: user!.id,
          action_type: 'reassign_customer',
          target_entity: 'customer',
          target_id: customerIds[i],
          old_value: { agent_id: oldAgentIds[i] },
          new_value: { agent_id: reassignToAgent },
          description: `Reassigned customer to ${agents.find(a => a.id === reassignToAgent)?.name}`,
        });
      }

      // Update all selected customers
      const { error } = await supabase
        .from('customers')
        .update({ created_by_agent_id: reassignToAgent })
        .in('id', customerIds);

      if (error) throw error;

      alert(`Successfully reassigned ${selectedCustomers.size} customers!`);
      setShowReassignModal(false);
      setSelectedCustomers(new Set());
      setReassignToAgent('');
      loadCustomers();
    } catch (error: any) {
      alert('Error reassigning customers: ' + error.message);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search);
    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Master Customer Database</h1>
          {selectedCustomers.size > 0 && (
            <button
              onClick={() => setShowReassignModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              Reassign ({selectedCustomers.size})
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Customers</p>
            <p className="text-2xl font-bold text-purple-900">{customers.length}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600">Selected</p>
            <p className="text-2xl font-bold text-purple-900">{selectedCustomers.size}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600">Active Agents</p>
            <p className="text-2xl font-bold text-green-900">{agents.length}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600">Filtered</p>
            <p className="text-2xl font-bold text-blue-900">{filteredCustomers.length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Agent</label>
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Agents</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="New">New</option>
                <option value="Interested">Interested</option>
                <option value="Matured">Matured</option>
                <option value="Cold">Cold</option>
                <option value="Follow up">Follow up</option>
              </select>
            </div>
          </div>

          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />

          {filteredCustomers.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              {selectedCustomers.size === filteredCustomers.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>

        {/* Customer List */}
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={`bg-white rounded-lg shadow p-4 ${selectedCustomers.has(customer.id) ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div className="flex gap-4">
                <input
                  type="checkbox"
                  checked={selectedCustomers.has(customer.id)}
                  onChange={() => handleSelectCustomer(customer.id)}
                  className="mt-1"
                />

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        to={`/admin/customers/${customer.id}`}
                        className="text-lg font-semibold text-purple-600 hover:underline"
                      >
                        {customer.customer_name}
                      </Link>
                      <p className="text-sm text-gray-600">{formatPhoneNumber(customer.phone)}</p>
                      {customer.shop_name && (
                        <p className="text-sm text-gray-500">{customer.shop_name}</p>
                      )}

                      <div className="flex gap-2 mt-2">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {customer.customer_type}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          {customer.status}
                        </span>
                        {customer.agent && (
                          <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                            👤 {customer.agent.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={getWhatsAppUrl(customer.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </div>

        {/* Reassign Modal */}
        {showReassignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Reassign Customers</h2>
              <p className="text-sm text-gray-600 mb-4">
                You are about to reassign <strong>{selectedCustomers.size}</strong> customers to a new agent.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select New Agent</label>
                <select
                  value={reassignToAgent}
                  onChange={(e) => setReassignToAgent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  <strong>Warning:</strong> This action will be logged in the audit trail. The customers will immediately appear in the new agent's panel.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleReassign}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  Confirm Reassign
                </button>
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setReassignToAgent('');
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

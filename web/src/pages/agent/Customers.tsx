import { useState, useEffect } from 'react';
import AgentLayout from '../../components/AgentLayout';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';
import { formatPhoneNumber, getWhatsAppUrl } from '../../lib/utils';

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [filter]);

  const loadCustomers = async () => {
    try {
      let query = supabase
        .from('customers')
        .select('*')
        .eq('created_by_agent_id', user!.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <AgentLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Customers</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Add Customer
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2 overflow-x-auto">
            {['all', 'New', 'Interested', 'Matured', 'Cold', 'Follow up'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-4 w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Customer List */}
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to={`/customers/${customer.id}`}
                    className="text-lg font-semibold text-blue-600 hover:underline"
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
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
}

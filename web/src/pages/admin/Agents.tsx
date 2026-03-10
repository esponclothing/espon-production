import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getCurrentMonth } from '../../lib/utils';

interface Agent {
  id: string;
  name: string;
  email: string;
  base_salary: number;
  is_active: boolean;
  created_at: string;
}

interface AgentTarget {
  id?: string;
  agent_id: string;
  month_year: string;
  target_amount: number;
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentMonth] = useState(getCurrentMonth());

  useEffect(() => {
    loadAgents();
    loadTargets();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'agent')
        .order('name');

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTargets = async () => {
    try {
      const { data } = await supabase
        .from('agent_targets')
        .select('*')
        .eq('month_year', currentMonth);

      if (data) {
        const targetsMap: Record<string, number> = {};
        data.forEach((t: AgentTarget) => {
          targetsMap[t.agent_id] = t.target_amount;
        });
        setTargets(targetsMap);
      }
    } catch (error) {
      console.error('Error loading targets:', error);
    }
  };

  const handleUpdateAgent = async (agent: Agent) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: agent.name,
          base_salary: agent.base_salary,
          is_active: agent.is_active,
        })
        .eq('id', agent.id);

      if (error) throw error;

      alert('Agent updated successfully!');
      setEditingAgent(null);
      loadAgents();
    } catch (error: any) {
      alert('Error updating agent: ' + error.message);
    }
  };

  const handleUpdateTarget = async (agentId: string, targetAmount: number) => {
    try {
      const { error } = await supabase
        .from('agent_targets')
        .upsert({
          agent_id: agentId,
          month_year: currentMonth,
          target_amount: targetAmount,
        });

      if (error) throw error;

      alert('Target updated successfully!');
      loadTargets();
    } catch (error: any) {
      alert('Error updating target: ' + error.message);
    }
  };

  const handleAddAgent = async (email: string, password: string, name: string, baseSalary: number) => {
    try {
      // Note: In production, you'd use Supabase Admin API or Edge Function
      // For now, agents must be created in Supabase dashboard
      alert('Please create user in Supabase Authentication first, then add profile here.');
      setShowAddForm(false);
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
          >
            + Add Agent
          </button>
        </div>

        {/* Current Month Info */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-800">
            <strong>Current Month:</strong> {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            Targets shown are for this month. Update targets at the start of each month.
          </p>
        </div>

        {/* Agents List */}
        <div className="grid gap-4">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow p-6">
              {editingAgent?.id === agent.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={editingAgent.name}
                      onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Salary (₹)</label>
                    <input
                      type="number"
                      value={editingAgent.base_salary}
                      onChange={(e) => setEditingAgent({ ...editingAgent, base_salary: Number(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingAgent.is_active}
                      onChange={(e) => setEditingAgent({ ...editingAgent, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Active</label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateAgent(editingAgent)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingAgent(null)}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${agent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {agent.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingAgent(agent)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Base Salary</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(agent.base_salary)}</p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="text-sm text-purple-600">Monthly Target</p>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="number"
                          value={targets[agent.id] || 0}
                          onChange={(e) => setTargets({ ...targets, [agent.id]: Number(e.target.value) })}
                          className="w-32 px-2 py-1 border rounded text-sm"
                          placeholder="0"
                        />
                        <button
                          onClick={() => handleUpdateTarget(agent.id, targets[agent.id] || 0)}
                          className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {agents.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No agents found</p>
            </div>
          )}
        </div>

        {/* Add Agent Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Add New Agent</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> First create the user in Supabase Authentication, then add their profile here.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Steps:</label>
                  <ol className="list-decimal list-inside text-sm text-gray-600 mt-2 space-y-1">
                    <li>Go to Supabase → Authentication → Users</li>
                    <li>Click "Add User"</li>
                    <li>Enter email and password</li>
                    <li>Copy the User ID</li>
                    <li>Go to Table Editor → users → Insert row</li>
                    <li>Fill in all fields with role='agent'</li>
                  </ol>
                </div>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

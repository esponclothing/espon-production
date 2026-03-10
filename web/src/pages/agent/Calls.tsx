import { useState, useEffect } from 'react';
import AgentLayout from '../../components/AgentLayout';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { formatPhoneNumber, getWhatsAppUrl } from '../../lib/utils';
import { format } from 'date-fns';

interface CallForm {
  customer_id: string;
  call_type: string;
  call_date: string;
  call_duration: number;
  call_outcome: string;
  notes: string;
  follow_up_date: string;
}

export default function Calls() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<CallForm>({
    customer_id: '',
    call_type: 'Fresh',
    call_date: new Date().toISOString().split('T')[0],
    call_duration: 0,
    call_outcome: 'No Response',
    notes: '',
    follow_up_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCalls();
    loadCustomers();
  }, []);

  const loadCalls = async () => {
    try {
      const { data } = await supabase
        .from('call_logs')
        .select(`
          *,
          customers (
            id,
            customer_name,
            phone,
            shop_name
          )
        `)
        .eq('agent_id', user!.id)
        .order('call_date', { ascending: false })
        .order('created_at', { ascending: false });

      setCalls(data || []);
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from('customers')
        .select('id, customer_name, phone, shop_name')
        .eq('created_by_agent_id', user!.id)
        .order('customer_name');

      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('call_logs').insert({
        ...formData,
        agent_id: user!.id,
        call_duration: Number(formData.call_duration),
        follow_up_date: formData.follow_up_date || null,
      });

      if (error) throw error;

      alert('Call logged successfully!');
      setShowAddForm(false);
      setFormData({
        customer_id: '',
        call_type: 'Fresh',
        call_date: new Date().toISOString().split('T')[0],
        call_duration: 0,
        call_outcome: 'No Response',
        notes: '',
        follow_up_date: '',
      });
      loadCalls();
    } catch (error: any) {
      alert('Error logging call: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getOutcomeColor = (outcome: string) => {
    const colors: any = {
      'Interested': 'bg-green-100 text-green-800',
      'Not Interested': 'bg-red-100 text-red-800',
      'No Response': 'bg-gray-100 text-gray-800',
      'Follow-up Required': 'bg-yellow-100 text-yellow-800',
      'Order Placed': 'bg-blue-100 text-blue-800',
    };
    return colors[outcome] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <AgentLayout>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </AgentLayout>
    );
  }

  return (
    <AgentLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            + Log Call
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Calls</p>
            <p className="text-2xl font-bold text-blue-900">{calls.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Fresh</p>
            <p className="text-2xl font-bold text-green-900">
              {calls.filter((c) => c.call_type === 'Fresh').length}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Follow-up</p>
            <p className="text-2xl font-bold text-purple-900">
              {calls.filter((c) => c.call_type === 'Follow-up').length}
            </p>
          </div>
        </div>

        {/* Add Call Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Log Call</h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer *
                    </label>
                    <select
                      required
                      value={formData.customer_id}
                      onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a customer</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.customer_name} {c.shop_name && `(${c.shop_name})`} - {formatPhoneNumber(c.phone)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Call Type *
                      </label>
                      <select
                        value={formData.call_type}
                        onChange={(e) => setFormData({ ...formData, call_type: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Fresh</option>
                        <option>Follow-up</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Call Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.call_date}
                        onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.call_duration}
                        onChange={(e) => setFormData({ ...formData, call_duration: Number(e.target.value) })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Outcome *
                      </label>
                      <select
                        value={formData.call_outcome}
                        onChange={(e) => setFormData({ ...formData, call_outcome: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Interested</option>
                        <option>Not Interested</option>
                        <option>No Response</option>
                        <option>Follow-up Required</option>
                        <option>Order Placed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Add any notes about the call..."
                    />
                  </div>

                  {formData.call_outcome === 'Follow-up Required' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Follow-up Date
                      </label>
                      <input
                        type="date"
                        value={formData.follow_up_date}
                        onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                    >
                      {submitting ? 'Logging...' : 'Log Call'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Call List */}
        <div className="grid gap-4">
          {calls.map((call) => (
            <div key={call.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {call.customers?.customer_name}
                    </h3>
                    {call.customers?.shop_name && (
                      <span className="text-sm text-gray-500">({call.customers.shop_name})</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">
                      📞 {formatPhoneNumber(call.customers?.phone)}
                    </span>
                    <a
                      href={getWhatsAppUrl(call.customers?.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {call.call_type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getOutcomeColor(call.call_outcome)}`}>
                      {call.call_outcome}
                    </span>
                    {call.call_duration > 0 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                        {call.call_duration} min
                      </span>
                    )}
                  </div>

                  {call.notes && (
                    <p className="text-sm text-gray-600 mb-2">📝 {call.notes}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {format(new Date(call.call_date), 'MMM dd, yyyy')}</span>
                    {call.follow_up_date && (
                      <span className="text-orange-600 font-medium">
                        🔔 Follow-up: {format(new Date(call.follow_up_date), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {calls.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No calls logged yet</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                Log your first call
              </button>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
}

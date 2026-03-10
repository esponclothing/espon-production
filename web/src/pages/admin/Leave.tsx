import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { formatDate } from '../../lib/utils';

interface LeaveRequest {
  id: string;
  from_date: string;
  to_date: string;
  leave_type: string;
  reason: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  agent: {
    name: string;
    email: string;
  };
}

export default function Leave() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [reviewingLeave, setReviewingLeave] = useState<LeaveRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadLeaves();
  }, [filter]);

  const loadLeaves = async () => {
    try {
      let query = supabase
        .from('leaves')
        .select(`
          *,
          users!leaves_agent_id_fkey (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedData = data?.map((leave: any) => ({
        ...leave,
        agent: leave.users,
      })) || [];

      setLeaves(formattedData);
    } catch (error) {
      console.error('Error loading leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (leaveId: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase
        .from('leaves')
        .update({
          status,
          reviewed_by_admin_id: user!.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', leaveId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_log').insert({
        admin_id: user!.id,
        action_type: `${status.toLowerCase()}_leave`,
        target_entity: 'leave',
        target_id: leaveId,
        description: `${status} leave request`,
      });

      alert(`Leave ${status.toLowerCase()} successfully!`);
      setReviewingLeave(null);
      setAdminNotes('');
      loadLeaves();
    } catch (error: any) {
      alert('Error updating leave: ' + error.message);
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

  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          {pendingCount > 0 && (
            <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
              {pendingCount} Pending
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'Pending', 'Approved', 'Rejected'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="grid gap-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              className={`bg-white rounded-lg shadow p-6 ${
                leave.status === 'Pending' ? 'ring-2 ring-orange-300' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{leave.agent.name}</h3>
                  <p className="text-sm text-gray-600">{leave.agent.email}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    leave.status === 'Pending'
                      ? 'bg-orange-100 text-orange-800'
                      : leave.status === 'Approved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {leave.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">From Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(leave.from_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">To Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(leave.to_date)}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">Leave Type</p>
                <p className="font-semibold text-gray-900">{leave.leave_type}</p>
              </div>

              {leave.reason && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="text-gray-900">{leave.reason}</p>
                </div>
              )}

              {leave.admin_notes && (
                <div className="mb-4 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Admin Notes</p>
                  <p className="text-gray-900">{leave.admin_notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Applied: {formatDate(leave.created_at)}</span>
                {leave.reviewed_at && <span>Reviewed: {formatDate(leave.reviewed_at)}</span>}
              </div>

              {leave.status === 'Pending' && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setReviewingLeave(leave);
                      setAdminNotes('');
                    }}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          ))}

          {leaves.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No leave requests found</p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {reviewingLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Review Leave Request</h2>

              <div className="mb-4 bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900">{reviewingLeave.agent.name}</p>
                <p className="text-sm text-gray-600">{reviewingLeave.agent.email}</p>
                <p className="text-sm text-gray-900 mt-2">
                  <strong>From:</strong> {formatDate(reviewingLeave.from_date)}
                </p>
                <p className="text-sm text-gray-900">
                  <strong>To:</strong> {formatDate(reviewingLeave.to_date)}
                </p>
                <p className="text-sm text-gray-900">
                  <strong>Type:</strong> {reviewingLeave.leave_type}
                </p>
                {reviewingLeave.reason && (
                  <p className="text-sm text-gray-900 mt-2">
                    <strong>Reason:</strong> {reviewingLeave.reason}
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Add any notes or comments..."
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(reviewingLeave.id, 'Approved')}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReview(reviewingLeave.id, 'Rejected')}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  ✗ Reject
                </button>
              </div>

              <button
                onClick={() => {
                  setReviewingLeave(null);
                  setAdminNotes('');
                }}
                className="w-full mt-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

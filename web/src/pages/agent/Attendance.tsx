import { useState, useEffect } from 'react';
import AgentLayout from '../../components/AgentLayout';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { formatWorkTime } from '../../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

export default function Attendance() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    loadAttendance();
  }, [currentMonth]);

  const loadAttendance = async () => {
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('agent_id', user!.id)
        .gte('session_date', monthStart)
        .lte('session_date', monthEnd)
        .order('session_date', { ascending: false })
        .order('punch_in', { ascending: false });

      setSessions(data || []);
    } catch (error) {
      console.error('Error loading attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalWorkMinutes = sessions.reduce((sum, s) => sum + (s.work_minutes || 0), 0);
  const totalWorkDays = new Set(sessions.map(s => s.session_date)).size;
  const avgWorkHours = totalWorkDays > 0 ? (totalWorkMinutes / 60 / totalWorkDays).toFixed(1) : '0';

  const previousMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };

  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
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
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={format(currentMonth, 'yyyy-MM') >= format(new Date(), 'yyyy-MM')}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Days Worked</p>
            <p className="text-2xl font-bold text-blue-900">{totalWorkDays}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Hours</p>
            <p className="text-2xl font-bold text-green-900">
              {formatWorkTime(totalWorkMinutes)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Avg Hours/Day</p>
            <p className="text-2xl font-bold text-purple-900">{avgWorkHours}h</p>
          </div>
        </div>

        {/* Attendance List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Punch In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Punch Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Work Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {format(new Date(session.session_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {format(new Date(session.punch_in), 'hh:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {session.punch_out ? (
                        format(new Date(session.punch_out), 'hh:mm a')
                      ) : (
                        <span className="text-green-600 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {session.work_minutes ? (
                        formatWorkTime(session.work_minutes)
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No attendance records for this month</p>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
}

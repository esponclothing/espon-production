import { useState, useEffect } from 'react';
import AgentLayout from '../../components/AgentLayout';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getCurrentMonth, calculatePercentage, getProgressColor, _formatWorkTime } from '../../lib/utils';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayCalls: 0,
    freshCalls: 0,
    followupCalls: 0,
    todayOrders: 0,
    todaySales: 0,
    monthTarget: 0,
    monthSales: 0,
    monthIncentive: 0,
    targetLeft: 0,
  });
  const [attendance, setAttendance] = useState<any>(null);
  const [isPunchedIn, setIsPunchedIn] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadAttendance();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthYear = getCurrentMonth();

      // Get monthly target
      const { data: targetData } = await supabase
        .from('agent_targets')
        .select('target_amount')
        .eq('agent_id', user!.id)
        .eq('month_year', monthYear)
        .single();

      // Get today's calls
      const { data: callsData } = await supabase
        .from('call_logs')
        .select('call_type')
        .eq('agent_id', user!.id)
        .eq('call_date', today);

      const freshCalls = callsData?.filter((c) => c.call_type === 'Fresh').length || 0;
      const followupCalls = callsData?.filter((c) => c.call_type === 'Follow-up').length || 0;

      // Get today's orders
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_sale')
        .eq('agent_id', user!.id)
        .eq('order_date', today);

      // Get month's data
      const monthStart = `${monthYear}-01`;
      const monthEnd = `${monthYear}-31`;

      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total_sale, incentive_amount')
        .eq('agent_id', user!.id)
        .gte('order_date', monthStart)
        .lte('order_date', monthEnd);

      const monthSales = monthOrders?.reduce((sum, o) => sum + Number(o.total_sale), 0) || 0;
      const monthIncentive = monthOrders?.reduce((sum, o) => sum + Number(o.incentive_amount), 0) || 0;
      const target = Number(targetData?.target_amount || 0);

      setStats({
        todayCalls: (callsData?.length || 0),
        freshCalls,
        followupCalls,
        todayOrders: todayOrders?.length || 0,
        todaySales: todayOrders?.reduce((sum, o) => sum + Number(o.total_sale), 0) || 0,
        monthTarget: target,
        monthSales,
        monthIncentive,
        targetLeft: Math.max(0, target - monthSales),
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('agent_id', user!.id)
        .eq('session_date', today)
        .is('punch_out', null)
        .order('punch_in', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setAttendance(data);
        setIsPunchedIn(true);
      }
    } catch (error) {
      // No active session
    }
  };

  const handlePunchIn = async () => {
    try {
      const { error } = await supabase.from('attendance_sessions').insert({
        agent_id: user!.id,
        punch_in: new Date().toISOString(),
        session_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      await loadAttendance();
      alert('Punched in successfully!');
    } catch (error: any) {
      alert('Error punching in: ' + error.message);
    }
  };

  const handlePunchOut = async () => {
    if (!attendance) return;

    try {
      const punchOutTime = new Date();
      const punchInTime = new Date(attendance.punch_in);
      const workMinutes = Math.floor((punchOutTime.getTime() - punchInTime.getTime()) / 60000);

      const { error } = await supabase
        .from('attendance_sessions')
        .update({
          punch_out: punchOutTime.toISOString(),
          work_minutes: workMinutes,
        })
        .eq('id', attendance.id);

      if (error) throw error;

      setIsPunchedIn(false);
      setAttendance(null);
      alert('Punched out successfully!');
    } catch (error: any) {
      alert('Error punching out: ' + error.message);
    }
  };

  const targetPercentage = calculatePercentage(stats.monthSales, stats.monthTarget);
  const progressColor = getProgressColor(targetPercentage);

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
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
          <p className="text-gray-600 mt-1">Here's your performance overview for today and this month</p>
        </div>

        {/* Attendance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">⏰ Attendance</h2>
          
          {isPunchedIn ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Punched in at</p>
                  <p className="text-xl font-bold">{format(new Date(attendance.punch_in), 'hh:mm a')}</p>
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-lg">
                  <p className="text-sm">Status</p>
                  <p className="font-bold">🟢 Active</p>
                </div>
              </div>
              
              <button
                onClick={handlePunchOut}
                className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition"
              >
                Punch Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-blue-100">You haven't punched in today. Click below to start your work session.</p>
              <button
                onClick={handlePunchIn}
                className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-blue-50 transition"
              >
                Punch In Now
              </button>
            </div>
          )}
        </div>

        {/* Today's Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Today's Activity</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total Calls</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.todayCalls}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Fresh Calls</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.freshCalls}</p>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Follow-ups</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.followupCalls}</p>
            </div>
            
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">Orders</p>
              <p className="text-3xl font-bold text-orange-900 mt-1">{stats.todayOrders}</p>
            </div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-700 font-medium">Today's Sales</p>
            <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(stats.todaySales)}</p>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 Monthly Target Progress</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Target: {formatCurrency(stats.monthTarget)}</span>
                <span className="font-bold text-gray-900">{targetPercentage}%</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className={`${progressColor} h-4 rounded-full transition-all`}
                  style={{ width: `${Math.min(targetPercentage, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">Achieved</p>
                <p className="text-xl font-bold text-blue-900 mt-1">{formatCurrency(stats.monthSales)}</p>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">Target Left</p>
                <p className="text-xl font-bold text-orange-900 mt-1">{formatCurrency(stats.targetLeft)}</p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">Incentive Earned</p>
                <p className="text-xl font-bold text-green-900 mt-1">{formatCurrency(stats.monthIncentive)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">⚡ Quick Actions</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/customers"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition text-center"
            >
              <span className="text-3xl mb-2">👥</span>
              <span className="text-sm font-medium text-blue-900">My Customers</span>
            </a>
            
            <a
              href="/calls"
              className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition text-center"
            >
              <span className="text-3xl mb-2">📞</span>
              <span className="text-sm font-medium text-green-900">Log Call</span>
            </a>
            
            <a
              href="/orders"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition text-center"
            >
              <span className="text-3xl mb-2">🛒</span>
              <span className="text-sm font-medium text-purple-900">Create Order</span>
            </a>
            
            <a
              href="/leave"
              className="flex flex-col items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition text-center"
            >
              <span className="text-3xl mb-2">📅</span>
              <span className="text-sm font-medium text-orange-900">Request Leave</span>
            </a>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}

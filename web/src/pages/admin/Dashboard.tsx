import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatRelativeDate, getCurrentMonth } from '../../lib/utils';

interface AgentStats {
  agent_id: string;
  agent_name: string;
  email: string;
  status: 'active' | 'break' | 'absent';
  punch_in_time: string | null;
  total_calls: number;
  total_orders: number;
  total_sales: number;
  total_incentive: number;
  target_amount: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'call';
  agent_name: string;
  customer_name: string;
  amount?: number;
  timestamp: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    todayCalls: 0,
    todayOrders: 0,
    todaySales: 0,
    monthSales: 0,
  });
  const [agentStats, setAgentStats] = useState<AgentStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const monthYear = getCurrentMonth();
      const monthStart = `${monthYear}-01`;
      const monthEnd = `${monthYear}-31`;

      // Get all agents
      const { data: agents } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'agent')
        .eq('is_active', true);

      if (!agents) return;

      // Get today's attendance
      const { data: attendance } = await supabase
        .from('attendance_sessions')
        .select('agent_id, punch_in, punch_out')
        .eq('session_date', today);

      // Get agent stats
      const agentStatsPromises = agents.map(async (agent) => {
        // Get calls
        const { data: calls } = await supabase
          .from('call_logs')
          .select('id')
          .eq('agent_id', agent.id)
          .gte('call_date', monthStart)
          .lte('call_date', monthEnd);

        // Get orders
        const { data: orders } = await supabase
          .from('orders')
          .select('total_sale, incentive_amount')
          .eq('agent_id', agent.id)
          .gte('order_date', monthStart)
          .lte('order_date', monthEnd);

        // Get target
        const { data: target } = await supabase
          .from('agent_targets')
          .select('target_amount')
          .eq('agent_id', agent.id)
          .eq('month_year', monthYear)
          .single();

        // Check attendance status
        const agentAttendance = attendance?.find((a) => a.agent_id === agent.id);
        let status: 'active' | 'break' | 'absent' = 'absent';
        if (agentAttendance && !agentAttendance.punch_out) {
          status = 'active'; // Could check for breaks here
        }

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          email: agent.email,
          status,
          punch_in_time: agentAttendance?.punch_in || null,
          total_calls: calls?.length || 0,
          total_orders: orders?.length || 0,
          total_sales: orders?.reduce((sum, o) => sum + Number(o.total_sale), 0) || 0,
          total_incentive: orders?.reduce((sum, o) => sum + Number(o.incentive_amount), 0) || 0,
          target_amount: Number(target?.target_amount || 0),
        };
      });

      const agentStatsData = await Promise.all(agentStatsPromises);
      setAgentStats(agentStatsData);

      // Calculate global stats
      const activeCount = agentStatsData.filter((a) => a.status === 'active').length;

      // Get today's global stats
      const { data: todayCalls } = await supabase
        .from('call_logs')
        .select('id')
        .eq('call_date', today);

      const { data: todayOrders } = await supabase
        .from('orders')
        .select('total_sale')
        .eq('order_date', today);

      const { data: monthOrders } = await supabase
        .from('orders')
        .select('total_sale')
        .gte('order_date', monthStart)
        .lte('order_date', monthEnd);

      setStats({
        totalAgents: agents.length,
        activeAgents: activeCount,
        todayCalls: todayCalls?.length || 0,
        todayOrders: todayOrders?.length || 0,
        todaySales: todayOrders?.reduce((sum, o) => sum + Number(o.total_sale), 0) || 0,
        monthSales: monthOrders?.reduce((sum, o) => sum + Number(o.total_sale), 0) || 0,
      });

      // Get recent activity
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          id,
          total_sale,
          created_at,
          customers (customer_name),
          users!orders_agent_id_fkey (name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      const recentActivities: RecentActivity[] = (recentOrders || []).map((order: any) => ({
        id: order.id,
        type: 'order' as const,
        agent_name: order.users?.name || 'Unknown',
        customer_name: order.customers?.customer_name || 'Unknown',
        amount: Number(order.total_sale),
        timestamp: order.created_at,
      }));

      setRecentActivity(recentActivities);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
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

  // Sort agents by sales for leaderboard
  const leaderboard = [...agentStats].sort((a, b) => b.total_sales - a.total_sales);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

        {/* Global Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Total Agents</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">{stats.totalAgents}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Active Now</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{stats.activeAgents}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Today's Calls</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{stats.todayCalls}</p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Today's Orders</p>
            <p className="text-3xl font-bold text-orange-900 mt-1">{stats.todayOrders}</p>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Today's Sales</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{formatCurrency(stats.todaySales)}</p>
          </div>
        </div>

        {/* Month Summary */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-lg font-semibold mb-2">Monthly Performance</h2>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-purple-100">Total Sales (All Agents)</p>
              <p className="text-3xl font-bold">{formatCurrency(stats.monthSales)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-purple-100">Combined Target</p>
              <p className="text-2xl font-bold">
                {formatCurrency(agentStats.reduce((sum, a) => sum + a.target_amount, 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Agent Status Map */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Live Agent Status</h2>
          <div className="grid gap-4">
            {agentStats.map((agent) => (
              <div key={agent.agent_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    agent.status === 'active' ? 'bg-green-500' :
                    agent.status === 'break' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="font-semibold text-gray-900">{agent.agent_name}</p>
                    <p className="text-sm text-gray-600">{agent.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {agent.status === 'active' ? '🟢 Active' :
                     agent.status === 'break' ? '🟡 Break' : '🔴 Absent'}
                  </p>
                  {agent.punch_in_time && (
                    <p className="text-xs text-gray-500">
                      Since {new Date(agent.punch_in_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Monthly Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((agent, index) => (
                <div key={agent.agent_id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' :
                    index === 1 ? 'bg-gray-300 text-gray-800' :
                    index === 2 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{agent.agent_name}</p>
                    <div className="flex gap-4 text-xs text-gray-600">
                      <span>📞 {agent.total_calls} calls</span>
                      <span>🛒 {agent.total_orders} orders</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-purple-900">{formatCurrency(agent.total_sales)}</p>
                    <p className="text-xs text-gray-500">+{formatCurrency(agent.total_incentive)} incentive</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Recent Activity</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    activity.type === 'order' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {activity.type === 'order' ? '💰' : '📞'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.agent_name} {activity.type === 'order' ? 'closed an order' : 'logged a call'}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      Customer: {activity.customer_name}
                    </p>
                    {activity.amount && (
                      <p className="text-sm font-semibold text-green-700 mt-1">
                        {formatCurrency(activity.amount)}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {formatRelativeDate(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-gray-500 py-8">No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

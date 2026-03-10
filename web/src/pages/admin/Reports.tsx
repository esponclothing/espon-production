import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { formatCurrency, getCurrentMonth } from '../../lib/utils';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface AgentReport {
  agent_id: string;
  agent_name: string;
  email: string;
  base_salary: number;
  target_amount: number;
  total_calls: number;
  total_orders: number;
  total_sales: number;
  total_incentive: number;
  work_days: number;
  work_hours: number;
  customer_count: number;
}

export default function Reports() {
  const [reports, setReports] = useState<AgentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [reportType, setReportType] = useState<'performance' | 'attendance' | 'customers'>('performance');

  useEffect(() => {
    loadReports();
  }, [selectedMonth, reportType]);

  const loadReports = async () => {
    try {
      const monthStart = `${selectedMonth}-01`;
      const monthEnd = `${selectedMonth}-31`;

      // Get all agents
      const { data: agents } = await supabase
        .from('users')
        .select('id, name, email, base_salary')
        .eq('role', 'agent')
        .eq('is_active', true)
        .order('name');

      if (!agents) return;

      // Get data for each agent
      const agentReportsPromises = agents.map(async (agent) => {
        // Get target
        const { data: target } = await supabase
          .from('agent_targets')
          .select('target_amount')
          .eq('agent_id', agent.id)
          .eq('month_year', selectedMonth)
          .single();

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

        // Get attendance
        const { data: attendance } = await supabase
          .from('attendance_sessions')
          .select('work_minutes')
          .eq('agent_id', agent.id)
          .gte('session_date', monthStart)
          .lte('session_date', monthEnd);

        // Get customers
        const { data: customers } = await supabase
          .from('customers')
          .select('id')
          .eq('created_by_agent_id', agent.id);

        const workMinutes = attendance?.reduce((sum, a) => sum + (a.work_minutes || 0), 0) || 0;
        const workDays = new Set(attendance?.map(a => a.session_date)).size || 0;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          email: agent.email,
          base_salary: agent.base_salary,
          target_amount: Number(target?.target_amount || 0),
          total_calls: calls?.length || 0,
          total_orders: orders?.length || 0,
          total_sales: orders?.reduce((sum, o) => sum + Number(o.total_sale), 0) || 0,
          total_incentive: orders?.reduce((sum, o) => sum + Number(o.incentive_amount), 0) || 0,
          work_days: workDays,
          work_hours: Math.round(workMinutes / 60 * 10) / 10,
          customer_count: customers?.length || 0,
        };
      });

      const agentReports = await Promise.all(agentReportsPromises);
      setReports(agentReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Agent Name',
      'Email',
      'Base Salary',
      'Target',
      'Total Calls',
      'Total Orders',
      'Total Sales',
      'Total Incentive',
      'Work Days',
      'Work Hours',
      'Total Customers',
    ];

    const rows = reports.map((r) => [
      r.agent_name,
      r.email,
      r.base_salary,
      r.target_amount,
      r.total_calls,
      r.total_orders,
      r.total_sales,
      r.total_incentive,
      r.work_days,
      r.work_hours,
      r.customer_count,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${selectedMonth}-${reportType}.csv`;
    link.click();
  };

  const previousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(format(date, 'yyyy-MM'));
  };

  const nextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    if (date <= new Date()) {
      setSelectedMonth(format(date, 'yyyy-MM'));
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

  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
  const totalIncentive = reports.reduce((sum, r) => sum + r.total_incentive, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.total_orders, 0);
  const totalCalls = reports.reduce((sum, r) => sum + r.total_calls, 0);

  return (
    <AdminLayout>
      <div className="space-y-6 pb-20 lg:pb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={selectedMonth >= getCurrentMonth()}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Report Type Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setReportType('performance')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                reportType === 'performance'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Performance
            </button>
            <button
              onClick={() => setReportType('attendance')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                reportType === 'attendance'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏰ Attendance
            </button>
            <button
              onClick={() => setReportType('customers')}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                reportType === 'customers'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              👥 Customers
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Sales</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(totalSales)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-blue-900">{totalOrders}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Total Incentive</p>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(totalIncentive)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">Total Calls</p>
            <p className="text-2xl font-bold text-orange-900">{totalCalls}</p>
          </div>
        </div>

        {/* Performance Report */}
        {reportType === 'performance' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Incentive</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Comp</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const totalComp = report.base_salary + report.total_incentive;
                    const targetPercentage = report.target_amount > 0 
                      ? Math.round((report.total_sales / report.target_amount) * 100)
                      : 0;

                    return (
                      <tr key={report.agent_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.agent_name}</div>
                            <div className="text-xs text-gray-500">{report.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {formatCurrency(report.base_salary)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(report.target_amount)}
                          </div>
                          <div className="text-xs text-gray-500">{targetPercentage}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                          {formatCurrency(report.total_sales)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {report.total_orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-purple-700">
                          {formatCurrency(report.total_incentive)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          {formatCurrency(totalComp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Attendance Report */}
        {reportType === 'attendance' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Work Days</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Hours</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Hours/Day</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Calls</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const avgHours = report.work_days > 0 ? (report.work_hours / report.work_days).toFixed(1) : '0.0';

                    return (
                      <tr key={report.agent_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.agent_name}</div>
                            <div className="text-xs text-gray-500">{report.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          {report.work_days}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-700">
                          {report.work_hours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {avgHours}h
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {report.total_calls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {report.total_orders}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Customer Report */}
        {reportType === 'customers' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Customers</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Month Calls</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Month Orders</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg/Customer</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => {
                    const avgPerCustomer = report.customer_count > 0 
                      ? formatCurrency(report.total_sales / report.customer_count)
                      : '₹0';

                    return (
                      <tr key={report.agent_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{report.agent_name}</div>
                            <div className="text-xs text-gray-500">{report.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-purple-700">
                          {report.customer_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {report.total_calls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {report.total_orders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-700">
                          {avgPerCustomer}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import AgentDashboard from './pages/agent/Dashboard';
import AgentCustomers from './pages/agent/Customers';
import AgentCalls from './pages/agent/Calls';
import AgentOrders from './pages/agent/Orders';
import AgentAttendance from './pages/agent/Attendance';
import AgentLeave from './pages/agent/Leave';
import CustomerProfile from './pages/agent/CustomerProfile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminReports from './pages/admin/Reports';
import AdminLeave from './pages/admin/Leave';
import AdminSettings from './pages/admin/Settings';
import AdminAgents from './pages/admin/Agents';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {user.role === 'agent' ? (
            <>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<AgentDashboard />} />
              <Route path="/customers" element={<AgentCustomers />} />
              <Route path="/customers/:id" element={<CustomerProfile />} />
              <Route path="/calls" element={<AgentCalls />} />
              <Route path="/orders" element={<AgentOrders />} />
              <Route path="/attendance" element={<AgentAttendance />} />
              <Route path="/leave" element={<AgentLeave />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/customers" element={<AdminCustomers />} />
              <Route path="/admin/customers/:id" element={<CustomerProfile />} />
              <Route path="/admin/agents" element={<AdminAgents />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/leave" element={<AdminLeave />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </>
          )}
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

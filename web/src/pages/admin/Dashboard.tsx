import AdminLayout from '../../components/AdminLayout';

export default function Dashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Live leaderboard, agent status map, activity feed, global metrics</p>
        </div>
      </div>
    </AdminLayout>
  );
}

import AdminLayout from '../../components/AdminLayout';

export default function Agents() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Agent Management</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Manage agents, set targets, update salaries, view performance</p>
        </div>
      </div>
    </AdminLayout>
  );
}

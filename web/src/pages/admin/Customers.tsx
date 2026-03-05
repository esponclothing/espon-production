import AdminLayout from '../../components/AdminLayout';

export default function Customers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Master Customer Database</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">View all customers, filter by agent, reassign customers, bulk operations</p>
        </div>
      </div>
    </AdminLayout>
  );
}

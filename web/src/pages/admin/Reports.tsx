import AdminLayout from '../../components/AdminLayout';

export default function Reports() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Monthly incentive reports, attendance reports, customer monthly reports, export functionality</p>
        </div>
      </div>
    </AdminLayout>
  );
}

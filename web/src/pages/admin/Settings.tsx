import AdminLayout from '../../components/AdminLayout';

export default function Settings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Configure incentive slabs, manage targets, edit dropdown options, system settings</p>
        </div>
      </div>
    </AdminLayout>
  );
}

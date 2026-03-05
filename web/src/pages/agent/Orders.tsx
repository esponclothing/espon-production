import AgentLayout from '../../components/AgentLayout';

export default function Orders() {
  return (
    <AgentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Create and manage orders with automatic incentive calculation</p>
        </div>
      </div>
    </AgentLayout>
  );
}

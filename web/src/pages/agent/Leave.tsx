import AgentLayout from '../../components/AgentLayout';

export default function Leave() {
  return (
    <AgentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Leave Requests</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Apply for leave and track your leave requests</p>
        </div>
      </div>
    </AgentLayout>
  );
}

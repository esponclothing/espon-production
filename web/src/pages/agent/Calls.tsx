import AgentLayout from '../../components/AgentLayout';

export default function Calls() {
  return (
    <AgentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Call Logs</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Call logging functionality - log calls, add notes, schedule follow-ups</p>
        </div>
      </div>
    </AgentLayout>
  );
}

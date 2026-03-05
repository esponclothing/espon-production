import AgentLayout from '../../components/AgentLayout';

export default function Attendance() {
  return (
    <AgentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">View your attendance history and work hours</p>
        </div>
      </div>
    </AgentLayout>
  );
}

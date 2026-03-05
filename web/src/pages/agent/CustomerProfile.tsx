import AgentLayout from '../../components/AgentLayout';
import { useParams } from 'react-router-dom';

export default function CustomerProfile() {
  const { id } = useParams();

  return (
    <AgentLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Customer Profile</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">360° customer profile with timeline, WhatsApp button, call history, orders</p>
          <p className="text-sm text-gray-500 mt-2">Customer ID: {id}</p>
        </div>
      </div>
    </AgentLayout>
  );
}

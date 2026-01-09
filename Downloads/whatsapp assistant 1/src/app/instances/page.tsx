import { InstancesClient } from "./instances-client";

export default function InstancesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">WhatsApp Instances</h1>
          <p className="text-gray-400 mt-1">Manage all your connected WhatsApp accounts in one place</p>
        </div>
        <InstancesClient />
      </div>
    </div>
  );
}

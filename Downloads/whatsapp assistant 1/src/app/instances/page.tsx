import { InstancesClient } from "./instances-client";

export default function InstancesPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            WhatsApp Instances
          </h1>
          <p className="text-gray-400 mt-1">Manage your connected WhatsApp accounts</p>
        </div>
        <InstancesClient />
      </div>
    </div>
  );
}

import { CampaignsClient } from "./campaigns-client";

export default function CampaignsPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                        Campaigns
                    </h1>
                    <p className="text-gray-400 mt-1">Upload contacts and launch outreach campaigns</p>
                </div>
                <CampaignsClient />
            </div>
        </div>
    );
}

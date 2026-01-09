import { SettingsClient } from "./settings-client";

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400 mt-1">Manage your account preferences and AI configuration</p>
                </div>
                <SettingsClient />
            </div>
        </div>
    );
}

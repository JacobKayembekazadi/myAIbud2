"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Users, Send, Loader2, Calendar, CheckCircle2, Clock } from "lucide-react";
import Papa from "papaparse";

export function CampaignsClient() {
    const { userId } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [campaignName, setCampaignName] = useState("");
    const [message, setMessage] = useState("");
    const [contacts, setContacts] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    const [uploadedContactIds, setUploadedContactIds] = useState<any[]>([]);
    const [showCampaignForm, setShowCampaignForm] = useState(false);

    const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
    const instances = useQuery(api.instances.listInstances, tenant ? { tenantId: tenant._id } : "skip");
    const campaigns = useQuery(api.campaigns.listCampaigns, tenant ? { tenantId: tenant._id } : "skip");
    const upsertContact = useMutation(api.contacts.upsertContact);
    const createCampaign = useMutation(api.campaigns.createCampaign);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseCSV(selectedFile);
        }
    };

    const parseCSV = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const parsed = results.data.map((row: any) => ({
                    name: row.Name || row.name || "",
                    surname: row.Surname || row.surname || "",
                    phone: row.Phone || row.phone || "",
                    notes: row.Notes || row.notes || "",
                }));
                setContacts(parsed);
            },
            error: (err) => {
                setError(`CSV parsing error: ${err.message}`);
            },
        });
    };

    const handleUpload = async () => {
        if (!tenant || !instances || instances.length === 0) {
            setError("Please connect a WhatsApp instance first");
            return;
        }

        if (contacts.length === 0) {
            setError("No contacts to upload");
            return;
        }

        setUploading(true);
        setError("");

        try {
            const instanceId = instances[0].instanceId;
            const contactIds = [];

            for (const contact of contacts) {
                if (!contact.phone) continue;

                const contactId = await upsertContact({
                    tenantId: tenant._id,
                    instanceId,
                    phone: contact.phone,
                    name: `${contact.name} ${contact.surname}`.trim() || undefined,
                });
                contactIds.push(contactId);
            }

            setUploadedContactIds(contactIds);
            setShowCampaignForm(true);
            setFile(null);
            setContacts([]);
        } catch (err) {
            setError("Failed to upload contacts");
        }

        setUploading(false);
    };

    const handleCreateCampaign = async () => {
        if (!tenant || !instances || instances.length === 0) {
            setError("Please connect a WhatsApp instance first");
            return;
        }

        if (!campaignName || !message) {
            setError("Campaign name and message are required");
            return;
        }

        if (uploadedContactIds.length === 0) {
            setError("No contacts selected");
            return;
        }

        setCreating(true);
        setError("");

        try {
            await createCampaign({
                tenantId: tenant._id,
                instanceId: instances[0].instanceId,
                name: campaignName,
                message,
                contactIds: uploadedContactIds,
                status: "draft",
            });

            setCampaignName("");
            setMessage("");
            setUploadedContactIds([]);
            setShowCampaignForm(false);
            alert("Campaign created successfully!");
        } catch (err) {
            setError("Failed to create campaign");
        }

        setCreating(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case "sending":
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case "scheduled":
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <Calendar className="w-4 h-4 text-gray-500" />;
        }
    };

    if (!tenant) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Upload Card */}
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Upload className="w-5 h-5 text-green-500" />
                        Upload Contacts
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">
                            CSV File (Name, Surname, Phone, Notes)
                        </label>
                        <Input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="bg-gray-800 border-gray-700 text-white"
                        />
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-gray-500">
                                Required columns: Name, Surname, Phone (Notes optional)
                            </p>
                            <a
                                href="/sample-contacts.csv"
                                download
                                className="text-xs text-green-400 hover:text-green-300 underline"
                            >
                                Download Template
                            </a>
                        </div>
                    </div>

                    {contacts.length > 0 && (
                        <div className="bg-gray-800 p-4 rounded-lg">
                            <p className="text-green-400 flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                {contacts.length} contacts ready to upload
                            </p>
                            <div className="mt-2 max-h-40 overflow-y-auto">
                                {contacts.slice(0, 5).map((c, i) => (
                                    <div key={i} className="text-xs text-gray-400">
                                        {c.name} {c.surname} - {c.phone}
                                    </div>
                                ))}
                                {contacts.length > 5 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        ...and {contacts.length - 5} more
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-red-400 text-sm">{error}</p>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={uploading || contacts.length === 0}
                        className="bg-green-600 hover:bg-green-700 w-full"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload {contacts.length} Contacts
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Campaign Creation Form */}
            {showCampaignForm && (
                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-500" />
                            Create Campaign
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Campaign Name</label>
                            <Input
                                placeholder="e.g., January Outreach"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white"
                            />
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">
                                Message Template
                            </label>
                            <Textarea
                                placeholder="Hi {Name}, I noticed your property at..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="bg-gray-800 border-gray-700 text-white min-h-32"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Use {"{Name}"} for personalization
                            </p>
                        </div>

                        <div className="bg-gray-800 p-3 rounded-lg">
                            <p className="text-sm text-gray-400">
                                Recipients: <span className="text-white font-medium">{uploadedContactIds.length} contacts</span>
                            </p>
                        </div>

                        <Button
                            onClick={handleCreateCampaign}
                            disabled={creating}
                            className="bg-blue-600 hover:bg-blue-700 w-full"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Create Campaign
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Campaigns List */}
            {campaigns && campaigns.length > 0 && (
                <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Your Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {campaigns.map((campaign) => (
                                <div
                                    key={campaign._id}
                                    className="bg-gray-800 p-4 rounded-lg flex items-center justify-between"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(campaign.status)}
                                            <h3 className="text-white font-medium">{campaign.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {campaign.sentCount} / {campaign.totalContacts} sent
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-xs px-2 py-1 rounded ${campaign.status === "completed" ? "bg-green-600/20 text-green-400" :
                                                campaign.status === "sending" ? "bg-blue-600/20 text-blue-400" :
                                                    campaign.status === "scheduled" ? "bg-yellow-600/20 text-yellow-400" :
                                                        "bg-gray-600/20 text-gray-400"
                                            }`}>
                                            {campaign.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

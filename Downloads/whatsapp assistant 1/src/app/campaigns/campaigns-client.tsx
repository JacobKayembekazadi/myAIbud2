"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Users, Send, Loader2, Calendar, CheckCircle2, Clock, FileText, AlertCircle } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { startCampaign } from "./actions";
import { toast } from "sonner";

export function CampaignsClient() {
    const { userId } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [campaignName, setCampaignName] = useState("");
    const [message, setMessage] = useState("");
    const [contacts, setContacts] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [uploadedContactIds, setUploadedContactIds] = useState<any[]>([]);
    const [showCampaignForm, setShowCampaignForm] = useState(false);
    const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);

    const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
    const instances = useQuery(api.instances.listInstances, tenant ? { tenantId: tenant._id } : "skip");
    const campaigns = useQuery(api.campaigns.listCampaigns, tenant ? { tenantId: tenant._id } : "skip");
    const upsertContact = useMutation(api.contacts.upsertContact);
    const createCampaign = useMutation(api.campaigns.createCampaign);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const fileName = selectedFile.name.toLowerCase();

            if (fileName.endsWith('.csv')) {
                parseCSV(selectedFile);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                parseExcel(selectedFile);
            } else {
                toast.error("Unsupported file format. Please upload CSV or Excel (.xlsx, .xls)");
            }
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
                })).filter((c: any) => c.phone);

                setContacts(parsed);
                if (parsed.length > 0) {
                    toast.success(`Successfully parsed ${parsed.length} contacts from CSV`);
                } else {
                    toast.error("No valid contacts found in CSV. Ensure 'Phone' column exists.");
                }
            },
            error: (err) => {
                toast.error(`CSV parsing error: ${err.message}`);
            },
        });
    };

    const parseExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const parsed = jsonData.map((row: any) => ({
                    name: row.Name || row.name || "",
                    surname: row.Surname || row.surname || "",
                    phone: row.Phone || row.phone || String(row.phone || ""),
                    notes: row.Notes || row.notes || "",
                })).filter((c: any) => c.phone);

                setContacts(parsed);
                if (parsed.length > 0) {
                    toast.success(`Successfully parsed ${parsed.length} contacts from Excel`);
                } else {
                    toast.error("No valid contacts found in Excel. Ensure 'Phone' column exists.");
                }
            } catch (err) {
                toast.error("Failed to parse Excel file");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleUpload = async () => {
        if (!tenant || !instances || instances.length === 0) {
            toast.error("Please connect a WhatsApp instance first");
            return;
        }

        if (contacts.length === 0) {
            toast.error("No contacts to upload");
            return;
        }

        setUploading(true);

        try {
            const instanceId = instances[0].instanceId;
            const contactIds = [];

            for (const contact of contacts) {
                if (!contact.phone) continue;

                const contactId = await upsertContact({
                    tenantId: tenant._id,
                    instanceId,
                    phone: String(contact.phone),
                    name: `${contact.name} ${contact.surname}`.trim() || undefined,
                });
                contactIds.push(contactId);
            }

            setUploadedContactIds(contactIds);
            setShowCampaignForm(true);
            setFile(null);
            setContacts([]);
            toast.success(`${contactIds.length} contacts uploaded successfully!`);
        } catch (err) {
            toast.error("Failed to upload contacts");
        }

        setUploading(false);
    };

    const handleCreateCampaign = async () => {
        if (!tenant || !instances || instances.length === 0) {
            toast.error("Please connect a WhatsApp instance first");
            return;
        }

        if (!campaignName || !message) {
            toast.error("Campaign name and message are required");
            return;
        }

        if (uploadedContactIds.length === 0) {
            toast.error("No contacts selected");
            return;
        }

        setCreating(true);

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
            toast.success("Campaign created successfully!");
        } catch (err) {
            toast.error("Failed to create campaign");
        }

        setCreating(false);
    };

    const handleSendCampaign = async (campaignId: string) => {
        if (!tenant) return;
        setSendingCampaign(campaignId);
        const result = await startCampaign(campaignId, tenant._id);
        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success("Campaign started! Messages are being sent.");
        }
        setSendingCampaign(null);
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
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Upload className="w-5 h-5 text-green-500" />
                            <CardTitle className="text-white">Upload Contacts</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-blue-400 border-blue-600 bg-blue-950/20">
                            CSV / Excel Support
                        </Badge>
                    </div>
                    <CardDescription>Upload your contact list to start a campaign</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-green-600/50 transition-colors relative">
                        <Input
                            type="file"
                            accept=".csv, .xlsx, .xls"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-3">
                            <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto">
                                <FileText className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-white font-medium">
                                    {file ? file.name : "Click to upload or drag and drop"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supported formats: .csv, .xlsx, .xls
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <AlertCircle className="w-3 h-3 text-amber-500" />
                            Required columns: Name, Surname, Phone
                        </div>
                        <a
                            href="/sample-contacts.csv"
                            download
                            className="text-xs text-green-400 hover:text-green-300 underline"
                        >
                            Download Template
                        </a>
                    </div>

                    {contacts.length > 0 && (
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-green-400 text-sm flex items-center gap-2 font-medium">
                                    <Users className="w-4 h-4" />
                                    {contacts.length} contacts ready
                                </p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setContacts([])}
                                    className="text-gray-500 hover:text-red-400 h-7"
                                >
                                    Clear
                                </Button>
                            </div>
                            <Separator className="bg-gray-700/50 mb-3" />
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {contacts.slice(0, 5).map((c, i) => (
                                    <div key={i} className="text-xs text-gray-400 flex justify-between">
                                        <span className="truncate">{c.name} {c.surname}</span>
                                        <span className="text-gray-500 font-mono">+{c.phone}</span>
                                    </div>
                                ))}
                                {contacts.length > 5 && (
                                    <p className="text-[10px] text-gray-500 text-center pt-1 italic">
                                        ...and {contacts.length - 5} more contacts
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleUpload}
                        disabled={uploading || contacts.length === 0}
                        className="bg-green-600 hover:bg-green-700 w-full rounded-xl transition-all active:scale-[0.98]"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Import Contacts
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Campaign Creation Form */}
            {showCampaignForm && (
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Send className="w-5 h-5 text-blue-500" />
                            Create Campaign
                        </CardTitle>
                        <CardDescription>Set up the details for your new message campaign</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 block">Campaign Name</label>
                            <Input
                                placeholder="e.g., January Property Outreach"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white rounded-xl focus:ring-green-500/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300 block">
                                Message Template
                            </label>
                            <Textarea
                                placeholder="Hi {Name}, I noticed your property at..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white min-h-32 rounded-xl focus:ring-green-500/50"
                            />
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="bg-gray-800 text-gray-400 font-mono text-[10px]">{"{Name}"}</Badge>
                                <span className="text-xs text-gray-500 leading-none">tag will be replaced with recipient's name</span>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-600/10 border border-blue-600/20 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <Users className="w-4 h-4 text-blue-400" />
                                </div>
                                <span className="text-sm text-gray-300">Total Recipients</span>
                            </div>
                            <span className="text-blue-400 font-bold">{uploadedContactIds.length}</span>
                        </div>

                        <Button
                            onClick={handleCreateCampaign}
                            disabled={creating}
                            className="bg-blue-600 hover:bg-blue-700 w-full rounded-xl transition-all active:scale-[0.98]"
                        >
                            {creating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Confirm & Create Draft
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Campaigns List */}
            {campaigns && campaigns.length > 0 && (
                <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-white">Active Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {campaigns.map((campaign) => (
                                <div
                                    key={campaign._id}
                                    className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-gray-600 transition-colors"
                                >
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(campaign.status)}
                                            <h3 className="text-white font-medium">{campaign.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs text-gray-400">
                                                {campaign.sentCount} / {campaign.totalContacts} sent
                                            </p>
                                            <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 transition-all duration-500"
                                                    style={{ width: `${(campaign.sentCount / (campaign.totalContacts || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-center">
                                        {campaign.status === "draft" && (
                                            <Button
                                                size="sm"
                                                onClick={() => handleSendCampaign(campaign._id)}
                                                disabled={sendingCampaign === campaign._id}
                                                className="bg-green-600 hover:bg-green-700 h-8 px-4 rounded-lg text-xs"
                                            >
                                                {sendingCampaign === campaign._id ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-3 h-3 mr-2" />
                                                        Start Now
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] uppercase font-bold px-2 py-0 h-6 ${campaign.status === "completed" ? "text-green-400 border-green-600 bg-green-950/20" :
                                                    campaign.status === "sending" ? "text-blue-400 border-blue-600 bg-blue-950/20" :
                                                        campaign.status === "scheduled" ? "text-yellow-400 border-yellow-600 bg-yellow-950/20" :
                                                            "text-gray-400 border-gray-600 bg-gray-900/50"
                                                }`}
                                        >
                                            {campaign.status}
                                        </Badge>
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

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Bot, Bell, Zap, Trash2, Plus, Loader2, Users, Sparkles, Clock, X, Building2, Briefcase, Home, Car, ShoppingBag, Hotel, Stethoscope, Scale } from "lucide-react";
import { useRouter } from "next/navigation";
import TeamUpgradeWizard from "@/components/onboarding/TeamUpgradeWizard";

export function SettingsClient() {
    const router = useRouter();
    const { userId } = useAuth();
    const { user } = useUser();
    const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
    const settings = useQuery(api.settings.getSettings, tenant ? { tenantId: tenant._id } : "skip");
    const quickReplies = useQuery(api.settings.listQuickReplies, tenant ? { tenantId: tenant._id } : "skip");
    const instances = useQuery(api.instances.listInstances, tenant ? { tenantId: tenant._id } : "skip");
    const usage = useQuery(api.subscriptionUsage.getUsage, tenant ? { tenantId: tenant._id } : "skip");

    const updateSettings = useMutation(api.settings.updateSettings);
    const createQuickReply = useMutation(api.settings.createQuickReply);
    const deleteQuickReply = useMutation(api.settings.deleteQuickReply);

    const [newReply, setNewReply] = useState({ label: "", content: "", category: "" });
    const [saving, setSaving] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    const [newKeyword, setNewKeyword] = useState("");
    const [newService, setNewService] = useState("");

    const isSoloAccount = !tenant?.organizationId || tenant?.accountType !== "team";

    const handleUpdateSettings = async (updates: any) => {
        if (!tenant) return;
        setSaving(true);
        try {
            await updateSettings({ tenantId: tenant._id, ...updates });
            toast.success("Settings updated successfully!");
        } catch (error) {
            toast.error("Failed to update settings");
        }
        setSaving(false);
    };

    const handleAddQuickReply = async () => {
        if (!tenant || !newReply.label || !newReply.content) {
            toast.error("Label and content are required");
            return;
        }
        try {
            await createQuickReply({
                tenantId: tenant._id,
                label: newReply.label,
                content: newReply.content,
                category: newReply.category || undefined,
            });
            setNewReply({ label: "", content: "", category: "" });
            toast.success("Quick reply added!");
        } catch (error) {
            toast.error("Failed to add quick reply");
        }
    };

    const handleDeleteQuickReply = async (id: any) => {
        try {
            await deleteQuickReply({ id });
            toast.success("Quick reply deleted");
        } catch (error) {
            toast.error("Failed to delete quick reply");
        }
    };

    const handleAddKeyword = () => {
        if (!newKeyword.trim()) return;
        const currentKeywords = settings?.activationKeywords || [];
        if (currentKeywords.includes(newKeyword.trim().toLowerCase())) {
            toast.error("Keyword already exists");
            return;
        }
        handleUpdateSettings({
            activationKeywords: [...currentKeywords, newKeyword.trim().toLowerCase()]
        });
        setNewKeyword("");
    };

    const handleRemoveKeyword = (keyword: string) => {
        const currentKeywords = settings?.activationKeywords || [];
        handleUpdateSettings({
            activationKeywords: currentKeywords.filter((k: string) => k !== keyword)
        });
    };

    const handleToggleDay = (day: number) => {
        const currentDays = settings?.businessDays || [1, 2, 3, 4, 5];
        if (currentDays.includes(day)) {
            handleUpdateSettings({ businessDays: currentDays.filter((d: number) => d !== day) });
        } else {
            handleUpdateSettings({ businessDays: [...currentDays, day].sort() });
        }
    };

    const handleAddService = () => {
        if (!newService.trim()) return;
        const currentServices = settings?.servicesOffered || [];
        if (currentServices.includes(newService.trim())) {
            toast.error("Service already exists");
            return;
        }
        handleUpdateSettings({
            servicesOffered: [...currentServices, newService.trim()]
        });
        setNewService("");
    };

    const handleRemoveService = (service: string) => {
        const currentServices = settings?.servicesOffered || [];
        handleUpdateSettings({
            servicesOffered: currentServices.filter((s: string) => s !== service)
        });
    };

    if (!tenant || !settings) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
        );
    }

    const creditsUsed = usage?.creditsUsed ?? 0;
    const creditsLimit = usage?.creditsLimit ?? 400;
    const creditsRemaining = creditsLimit - creditsUsed;

    return (
        <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800 flex-wrap">
                <TabsTrigger value="profile" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                </TabsTrigger>
                <TabsTrigger value="business-profile" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Building2 className="w-4 h-4 mr-2" />
                    Business Profile
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Config
                </TabsTrigger>
                <TabsTrigger value="agent-activation" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Agent Activation
                </TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
                </TabsTrigger>
                <TabsTrigger value="quick-replies" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Zap className="w-4 h-4 mr-2" />
                    Quick Replies
                </TabsTrigger>
                {isSoloAccount && (
                    <TabsTrigger value="team" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                        <Users className="w-4 h-4 mr-2" />
                        Team
                    </TabsTrigger>
                )}
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Account Information</CardTitle>
                        <CardDescription>Your profile details from Clerk</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-gray-300">Email</Label>
                            <Input
                                value={user?.primaryEmailAddress?.emailAddress || ""}
                                disabled
                                className="bg-gray-800/50 border-gray-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-gray-300">Name</Label>
                            <Input
                                value={user?.fullName || ""}
                                disabled
                                className="bg-gray-800/50 border-gray-700 text-white"
                            />
                        </div>
                        <Separator className="bg-gray-800" />
                        <div className="space-y-2">
                            <Label className="text-gray-300">Subscription Plan</Label>
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-green-400 border-green-600 bg-green-950/20">
                                    Pro Plan
                                </Badge>
                                <span className="text-sm text-gray-400">
                                    {creditsRemaining} / {creditsLimit} credits remaining
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Business Profile Tab */}
            <TabsContent value="business-profile" className="space-y-6">
                {/* Industry Templates - Quick Setup */}
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            Quick Setup
                            <Badge variant="outline" className="text-emerald-400 border-emerald-600">Recommended</Badge>
                        </CardTitle>
                        <CardDescription>
                            Select your industry to instantly configure AI settings optimized for your business type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { id: "real_estate", label: "Real Estate", icon: Home, services: ["Property Sales", "Rentals", "Valuations", "Property Management"], keywords: ["property", "house", "apartment", "rent", "buy", "sell", "viewing", "price"] },
                                { id: "automotive", label: "Car Sales", icon: Car, services: ["New Vehicles", "Used Vehicles", "Financing", "Trade-ins", "Test Drives"], keywords: ["car", "vehicle", "price", "test drive", "finance", "trade"] },
                                { id: "retail", label: "Retail", icon: ShoppingBag, services: ["Product Sales", "Deliveries", "Returns", "Orders"], keywords: ["order", "price", "stock", "delivery", "return", "available"] },
                                { id: "hospitality", label: "Hospitality", icon: Hotel, services: ["Bookings", "Room Service", "Events", "Tours"], keywords: ["book", "reservation", "room", "available", "price", "check-in"] },
                                { id: "healthcare", label: "Healthcare", icon: Stethoscope, services: ["Appointments", "Consultations", "Referrals"], keywords: ["appointment", "doctor", "available", "consultation", "prescription"] },
                                { id: "professional_services", label: "Professional", icon: Scale, services: ["Consultations", "Quotations", "Appointments"], keywords: ["consultation", "quote", "appointment", "service", "price"] },
                            ].map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        handleUpdateSettings({
                                            industry: template.id,
                                            servicesOffered: template.services,
                                            activationKeywords: template.keywords,
                                            aiPersonality: template.id === "hospitality" ? "friendly" : "professional",
                                        });
                                        toast.success(`Applied ${template.label} template! Review settings below.`);
                                    }}
                                    className={`p-4 rounded-lg border text-left transition-all hover:border-emerald-500/50 hover:bg-emerald-500/5 ${
                                        settings.industry === template.id
                                            ? "border-emerald-500 bg-emerald-500/10"
                                            : "border-gray-700 bg-gray-800/30"
                                    }`}
                                >
                                    <template.icon className={`w-6 h-6 mb-2 ${
                                        settings.industry === template.id ? "text-emerald-400" : "text-gray-400"
                                    }`} />
                                    <p className="font-medium text-white text-sm">{template.label}</p>
                                    <p className="text-xs text-gray-500 mt-1">{template.services.slice(0, 2).join(", ")}</p>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Business Profile</CardTitle>
                        <CardDescription>
                            Tell the AI about your business so it can represent you accurately
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Business Name */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Business Name</Label>
                            <Input
                                placeholder="e.g., ABC Realty, Mike's Auto Sales"
                                value={settings.businessName || ""}
                                onChange={(e) => handleUpdateSettings({ businessName: e.target.value })}
                                className="bg-gray-800/50 border-gray-700 text-white"
                            />
                            <p className="text-xs text-gray-500">The AI will introduce itself as representing this business</p>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Industry */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Industry</Label>
                            <Select
                                value={settings.industry || "general"}
                                onValueChange={(value) => handleUpdateSettings({ industry: value })}
                            >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800">
                                    <SelectItem value="real_estate">Real Estate</SelectItem>
                                    <SelectItem value="automotive">Automotive / Car Sales</SelectItem>
                                    <SelectItem value="retail">Retail / E-commerce</SelectItem>
                                    <SelectItem value="hospitality">Hospitality / Tourism</SelectItem>
                                    <SelectItem value="healthcare">Healthcare / Medical</SelectItem>
                                    <SelectItem value="professional_services">Professional Services</SelectItem>
                                    <SelectItem value="general">General Business</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Helps the AI understand your industry context and terminology</p>
                        </div>

                        {/* Business Description */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Business Description</Label>
                            <Textarea
                                placeholder="e.g., We are a property agency specializing in residential sales and rentals in the Cape Town area. We help first-time buyers and investors find their perfect property."
                                value={settings.businessDescription || ""}
                                onChange={(e) => handleUpdateSettings({ businessDescription: e.target.value })}
                                className="bg-gray-800/50 border-gray-700 text-white min-h-24"
                            />
                            <p className="text-xs text-gray-500">Describe what your business does - the AI will use this context</p>
                        </div>

                        {/* Services Offered */}
                        <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-emerald-400" />
                                <Label className="text-gray-300 font-medium">Services Offered</Label>
                            </div>
                            <p className="text-sm text-gray-500">
                                List the services you offer - the AI will mention these when relevant
                            </p>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add a service..."
                                    value={newService}
                                    onChange={(e) => setNewService(e.target.value)}
                                    onKeyPress={(e) => e.key === "Enter" && handleAddService()}
                                    className="bg-gray-800/50 border-gray-700 text-white"
                                />
                                <Button onClick={handleAddService} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {(settings.servicesOffered || []).map((service: string) => (
                                    <Badge
                                        key={service}
                                        variant="secondary"
                                        className="bg-gray-700 text-white px-3 py-1 flex items-center gap-1"
                                    >
                                        {service}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                                            onClick={() => handleRemoveService(service)}
                                        />
                                    </Badge>
                                ))}
                                {(settings.servicesOffered || []).length === 0 && (
                                    <span className="text-gray-500 text-sm">No services added yet</span>
                                )}
                            </div>
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">Business Location</Label>
                            <Input
                                placeholder="e.g., Cape Town, South Africa"
                                value={settings.businessLocation || ""}
                                onChange={(e) => handleUpdateSettings({ businessLocation: e.target.value })}
                                className="bg-gray-800/50 border-gray-700 text-white"
                            />
                            <p className="text-xs text-gray-500">Area you serve or operate in</p>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* AI Personality */}
                        <div className="space-y-2">
                            <Label className="text-gray-300">AI Personality</Label>
                            <Select
                                value={settings.aiPersonality || "professional"}
                                onValueChange={(value) => handleUpdateSettings({ aiPersonality: value })}
                            >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800">
                                    <SelectItem value="professional">Professional & Formal</SelectItem>
                                    <SelectItem value="friendly">Friendly & Warm</SelectItem>
                                    <SelectItem value="casual">Casual & Relaxed</SelectItem>
                                    <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-500">Sets the tone of AI responses</p>
                        </div>

                        {/* Use Quick Replies as Knowledge */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-gray-300">Use Quick Replies as Knowledge Base</Label>
                                <p className="text-sm text-gray-500">
                                    AI will reference your Quick Replies when answering questions
                                </p>
                            </div>
                            <Switch
                                checked={settings.useQuickRepliesAsKnowledge ?? true}
                                onCheckedChange={(checked) => handleUpdateSettings({ useQuickRepliesAsKnowledge: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced: Custom System Prompt */}
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            Custom System Prompt
                            <Badge variant="outline" className="text-amber-400 border-amber-600">Advanced</Badge>
                        </CardTitle>
                        <CardDescription>
                            Override the AI's instructions entirely (for advanced users)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-lg">
                            <p className="text-sm text-amber-300">
                                If you provide a custom prompt, it will replace the auto-generated one.
                                Leave blank to use the smart defaults based on your business profile above.
                            </p>
                        </div>
                        <Textarea
                            placeholder="You are an AI assistant for [Business Name]. Your role is to..."
                            value={settings.customSystemPrompt || ""}
                            onChange={(e) => handleUpdateSettings({ customSystemPrompt: e.target.value })}
                            className="bg-gray-800/50 border-gray-700 text-white min-h-32 font-mono text-sm"
                        />
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="bg-emerald-950/30 border-emerald-800/50">
                    <CardContent className="p-4">
                        <h4 className="text-emerald-400 font-medium mb-2">AI Introduction Preview</h4>
                        <p className="text-sm text-gray-300">
                            {settings.businessName
                                ? `"Hi! I'm the AI assistant for ${settings.businessName}. ${settings.businessDescription ? settings.businessDescription.slice(0, 100) + '...' : 'How can I help you today?'}"`
                                : `"Hi! I'm an AI assistant. Set your business name above to personalize this greeting."`
                            }
                        </p>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* AI Config Tab */}
            <TabsContent value="ai" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">AI Configuration</CardTitle>
                        <CardDescription>Configure how the AI assistant responds to messages</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-gray-300">Auto-Reply Enabled</Label>
                                <p className="text-sm text-gray-500">Automatically respond to incoming messages</p>
                            </div>
                            <Switch
                                checked={settings.autoReplyEnabled}
                                onCheckedChange={(checked) => handleUpdateSettings({ autoReplyEnabled: checked })}
                            />
                        </div>

                        <Separator className="bg-gray-800" />

                        <div className="space-y-2">
                            <Label className="text-gray-300">AI Model</Label>
                            <Select
                                value={settings.aiModel}
                                onValueChange={(value) => handleUpdateSettings({ aiModel: value })}
                            >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800">
                                    <SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Fast & Cheap)</SelectItem>
                                    <SelectItem value="gemini-exp-1206">Gemini Experimental (Most Powerful)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Temperature ({settings.aiTemperature})</Label>
                            <p className="text-xs text-gray-500">Higher = more creative, Lower = more focused</p>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={settings.aiTemperature}
                                onChange={(e) => handleUpdateSettings({ aiTemperature: parseFloat(e.target.value) })}
                                className="w-full accent-green-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-300">Max Tokens</Label>
                            <Input
                                type="number"
                                value={settings.aiMaxTokens}
                                onChange={(e) => handleUpdateSettings({ aiMaxTokens: parseInt(e.target.value) })}
                                className="bg-gray-800/50 border-gray-700 text-white"
                            />
                        </div>

                        {instances && instances.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-gray-300">Default WhatsApp Instance</Label>
                                <Select
                                    value={settings.defaultInstanceId || ""}
                                    onValueChange={(value) => handleUpdateSettings({ defaultInstanceId: value })}
                                >
                                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                        <SelectValue placeholder="Select instance" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-gray-800">
                                        {instances.map((instance) => (
                                            <SelectItem key={instance._id} value={instance.instanceId}>
                                                {instance.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Agent Activation Tab */}
            <TabsContent value="agent-activation" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Agent Activation Mode</CardTitle>
                        <CardDescription>
                            Control when the AI agent responds to messages. Perfect for personal numbers or selective automation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Activation Mode Selector */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">When should the AI respond?</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { value: "always_on", label: "Always On", desc: "AI responds to all messages (best for business lines)" },
                                    { value: "keyword_triggered", label: "Keyword Triggered", desc: "AI only responds when specific keywords are detected" },
                                    { value: "new_contacts_only", label: "New Contacts Only", desc: "AI only responds to unknown/new contacts" },
                                    { value: "business_hours", label: "Business Hours", desc: "AI only responds during set business hours" },
                                ].map((mode) => (
                                    <div
                                        key={mode.value}
                                        onClick={() => handleUpdateSettings({ agentActivationMode: mode.value })}
                                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                            settings.agentActivationMode === mode.value
                                                ? "border-emerald-500 bg-emerald-500/10"
                                                : "border-gray-700 bg-gray-800/30 hover:border-gray-600"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`w-3 h-3 rounded-full ${
                                                settings.agentActivationMode === mode.value
                                                    ? "bg-emerald-500"
                                                    : "bg-gray-600"
                                            }`} />
                                            <span className="font-medium text-white">{mode.label}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 ml-5">{mode.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Keyword Settings - shown when keyword_triggered is selected */}
                        {settings.agentActivationMode === "keyword_triggered" && (
                            <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-400" />
                                    <Label className="text-gray-300 font-medium">Activation Keywords</Label>
                                </div>
                                <p className="text-sm text-gray-500">
                                    The AI will only respond when a message contains one of these keywords (case-insensitive).
                                </p>

                                {/* Keyword Input */}
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Add a keyword..."
                                        value={newKeyword}
                                        onChange={(e) => setNewKeyword(e.target.value)}
                                        onKeyPress={(e) => e.key === "Enter" && handleAddKeyword()}
                                        className="bg-gray-800/50 border-gray-700 text-white"
                                    />
                                    <Button onClick={handleAddKeyword} className="bg-emerald-600 hover:bg-emerald-700">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Keyword Tags */}
                                <div className="flex flex-wrap gap-2">
                                    {(settings.activationKeywords || []).map((keyword: string) => (
                                        <Badge
                                            key={keyword}
                                            variant="secondary"
                                            className="bg-gray-700 text-white px-3 py-1 flex items-center gap-1"
                                        >
                                            {keyword}
                                            <X
                                                className="w-3 h-3 cursor-pointer hover:text-red-400"
                                                onClick={() => handleRemoveKeyword(keyword)}
                                            />
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Business Hours Settings - shown when business_hours is selected */}
                        {settings.agentActivationMode === "business_hours" && (
                            <div className="space-y-4 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-emerald-400" />
                                    <Label className="text-gray-300 font-medium">Business Hours</Label>
                                </div>
                                <p className="text-sm text-gray-500">
                                    Set when the AI is active. Outside these hours, you can send a fallback message.
                                </p>

                                {/* Time Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 text-sm">Start Time</Label>
                                        <Select
                                            value={String(settings.businessHoursStart ?? 8)}
                                            onValueChange={(value) => handleUpdateSettings({ businessHoursStart: parseInt(value) })}
                                        >
                                            <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-gray-800">
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {i.toString().padStart(2, "0")}:00
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-400 text-sm">End Time</Label>
                                        <Select
                                            value={String(settings.businessHoursEnd ?? 18)}
                                            onValueChange={(value) => handleUpdateSettings({ businessHoursEnd: parseInt(value) })}
                                        >
                                            <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-900 border-gray-800">
                                                {Array.from({ length: 24 }, (_, i) => (
                                                    <SelectItem key={i} value={String(i)}>
                                                        {i.toString().padStart(2, "0")}:00
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Days of Week */}
                                <div className="space-y-2">
                                    <Label className="text-gray-400 text-sm">Active Days</Label>
                                    <div className="flex gap-2">
                                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                                            <button
                                                key={day}
                                                onClick={() => handleToggleDay(index)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    (settings.businessDays || [1, 2, 3, 4, 5]).includes(index)
                                                        ? "bg-emerald-600 text-white"
                                                        : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <Separator className="bg-gray-800" />

                        {/* Fallback Message Settings */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-gray-300">Send Fallback Message</Label>
                                    <p className="text-sm text-gray-500">
                                        When AI doesn't activate, send an optional message to let them know
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.sendFallbackWhenInactive ?? false}
                                    onCheckedChange={(checked) => handleUpdateSettings({ sendFallbackWhenInactive: checked })}
                                />
                            </div>

                            {settings.sendFallbackWhenInactive && (
                                <Textarea
                                    placeholder="e.g., Hi! Type 'help' to speak with our AI assistant, or wait for a human response."
                                    value={settings.fallbackMessage || ""}
                                    onChange={(e) => handleUpdateSettings({ fallbackMessage: e.target.value })}
                                    className="bg-gray-800/50 border-gray-700 text-white min-h-20"
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Helpful Tips Card */}
                <Card className="bg-emerald-950/30 border-emerald-800/50">
                    <CardContent className="p-4">
                        <h4 className="text-emerald-400 font-medium mb-2">Which mode should I use?</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• <strong className="text-white">Always On:</strong> Best for dedicated business WhatsApp numbers</li>
                            <li>• <strong className="text-white">Keyword Triggered:</strong> Perfect for personal numbers where you want AI for specific inquiries</li>
                            <li>• <strong className="text-white">New Contacts Only:</strong> Great for lead qualification without bothering existing contacts</li>
                            <li>• <strong className="text-white">Business Hours:</strong> Ideal when you want human-only support outside work hours</li>
                        </ul>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Notification Preferences</CardTitle>
                        <CardDescription>Choose how you want to be notified</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-gray-300">Email Notifications</Label>
                                <p className="text-sm text-gray-500">Receive email alerts for new messages</p>
                            </div>
                            <Switch
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) => handleUpdateSettings({ emailNotifications: checked })}
                            />
                        </div>

                        <Separator className="bg-gray-800" />

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-gray-300">SMS Notifications</Label>
                                <p className="text-sm text-gray-500">Receive SMS alerts for urgent messages</p>
                            </div>
                            <Switch
                                checked={settings.smsNotifications}
                                onCheckedChange={(checked) => handleUpdateSettings({ smsNotifications: checked })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Quick Replies Tab */}
            <TabsContent value="quick-replies" className="space-y-6">
                {/* AI Knowledge Base Notice */}
                <Card className="bg-emerald-950/30 border-emerald-800/50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="text-emerald-400 font-medium mb-1">AI Knowledge Base</h4>
                                <p className="text-sm text-gray-400">
                                    Quick replies act as your AI's knowledge base. Add FAQs, pricing info, business hours,
                                    and common answers here - the AI will reference this information when responding to customers.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Replies</CardTitle>
                        <CardDescription>Add information the AI should know about your business</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Suggested Categories */}
                        <div className="space-y-2">
                            <Label className="text-gray-400 text-sm">Suggested categories:</Label>
                            <div className="flex flex-wrap gap-2">
                                {["pricing", "hours", "location", "services", "faq", "policies"].map((cat) => (
                                    <Badge
                                        key={cat}
                                        variant="outline"
                                        className="text-gray-400 border-gray-600 cursor-pointer hover:bg-gray-800"
                                        onClick={() => setNewReply({ ...newReply, category: cat })}
                                    >
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                            <h3 className="text-sm font-medium text-white">Add New Quick Reply</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    placeholder="Label (e.g., Business Hours)"
                                    value={newReply.label}
                                    onChange={(e) => setNewReply({ ...newReply, label: e.target.value })}
                                    className="bg-gray-800/50 border-gray-700 text-white"
                                />
                                <Input
                                    placeholder="Category (e.g., hours)"
                                    value={newReply.category}
                                    onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}
                                    className="bg-gray-800/50 border-gray-700 text-white"
                                />
                            </div>
                            <Textarea
                                placeholder="e.g., We're open Monday to Friday from 8am to 6pm, and Saturdays from 9am to 1pm."
                                value={newReply.content}
                                onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
                                className="bg-gray-800/50 border-gray-700 text-white min-h-24"
                            />
                            <Button onClick={handleAddQuickReply} className="bg-green-600 hover:bg-green-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Quick Reply
                            </Button>
                        </div>

                        <Separator className="bg-gray-800" />

                        <div className="space-y-3">
                            {quickReplies && quickReplies.length > 0 ? (
                                quickReplies.map((reply) => (
                                    <div
                                        key={reply._id}
                                        className="p-4 bg-gray-800/30 rounded-xl border border-gray-700 flex items-start justify-between"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-white">{reply.label}</h4>
                                                {reply.category && (
                                                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                                        {reply.category}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-600">
                                                    AI Knowledge
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-400">{reply.content}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteQuickReply(reply._id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-950/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Zap className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                                    <p className="mb-2">No quick replies yet</p>
                                    <p className="text-sm">Add your first one to train the AI about your business!</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Helpful Examples */}
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white text-base">Example Quick Replies</CardTitle>
                        <CardDescription>Common information to add to your AI's knowledge base</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                <p className="font-medium text-white mb-1">Business Hours</p>
                                <p className="text-gray-500">"Mon-Fri 8am-6pm, Sat 9am-1pm, Closed Sundays"</p>
                            </div>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                <p className="font-medium text-white mb-1">Pricing</p>
                                <p className="text-gray-500">"Our consultation fee is R500, includes full assessment"</p>
                            </div>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                <p className="font-medium text-white mb-1">Contact Info</p>
                                <p className="text-gray-500">"Call us at 012-345-6789 or email info@business.co.za"</p>
                            </div>
                            <div className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                                <p className="font-medium text-white mb-1">Location</p>
                                <p className="text-gray-500">"123 Main Street, Cape Town. Free parking available"</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Team Tab (Solo Users Only) */}
            {isSoloAccount && (
                <TabsContent value="team" className="space-y-6">
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-white">Upgrade to Team Account</CardTitle>
                            <CardDescription>
                                Collaborate with your team and manage contacts together
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-6">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Team Features
                                </h3>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Invite Team Members</div>
                                            <div className="text-sm text-gray-400">
                                                Add agents, admins, and viewers to your workspace
                                            </div>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Contact Assignment</div>
                                            <div className="text-sm text-gray-400">
                                                Assign contacts to specific agents for better organization
                                            </div>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Shared WhatsApp Instances</div>
                                            <div className="text-sm text-gray-400">
                                                Multiple agents can manage the same WhatsApp number
                                            </div>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Shared Credit Pool</div>
                                            <div className="text-sm text-gray-400">
                                                All team members share the same subscription credits
                                            </div>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Role-Based Permissions</div>
                                            <div className="text-sm text-gray-400">
                                                Control what each team member can access and modify
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="flex justify-center">
                                <Button
                                    size="lg"
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                    onClick={() => setUpgradeDialogOpen(true)}
                                >
                                    <Users className="w-5 h-5 mr-2" />
                                    Upgrade to Team Account
                                </Button>

                                {tenant && (
                                    <TeamUpgradeWizard
                                        tenantId={tenant._id}
                                        open={upgradeDialogOpen}
                                        onOpenChange={setUpgradeDialogOpen}
                                        onSuccess={() => router.push("/team")}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}
        </Tabs>
    );
}

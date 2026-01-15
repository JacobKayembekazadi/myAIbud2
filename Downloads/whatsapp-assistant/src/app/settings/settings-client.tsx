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
import { User, Bot, Bell, Zap, Trash2, Plus, Loader2, Users, Sparkles, Clock, X, Building2, Briefcase, Home, Car, ShoppingBag, Hotel, Stethoscope, Scale, MessageSquare, Link2, Copy, Check, ExternalLink } from "lucide-react";
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
    const [magicDescription, setMagicDescription] = useState("");
    const [magicLoading, setMagicLoading] = useState(false);
    const [newQuestion, setNewQuestion] = useState("");
    const [copiedLink, setCopiedLink] = useState(false);
    const [prefilledMessage, setPrefilledMessage] = useState("Hi, I'm interested in learning more about your services.");

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

    // Magic Setup - parse business description and auto-fill fields
    const handleMagicSetup = async () => {
        if (!magicDescription.trim() || !tenant) return;

        setMagicLoading(true);

        // Smart parsing of the description
        const desc = magicDescription.toLowerCase();

        // Detect industry from keywords
        let industry = "general";
        let personality = "professional";
        const services: string[] = [];

        if (desc.includes("property") || desc.includes("real estate") || desc.includes("houses") || desc.includes("rental") || desc.includes("apartment")) {
            industry = "real_estate";
            services.push("Property Sales", "Rentals", "Valuations");
        } else if (desc.includes("car") || desc.includes("vehicle") || desc.includes("auto") || desc.includes("dealership")) {
            industry = "automotive";
            personality = "friendly";
            services.push("Vehicle Sales", "Test Drives", "Financing");
        } else if (desc.includes("shop") || desc.includes("store") || desc.includes("products") || desc.includes("retail") || desc.includes("sell")) {
            industry = "retail";
            personality = "friendly";
            services.push("Product Sales", "Deliveries", "Orders");
        } else if (desc.includes("hotel") || desc.includes("resort") || desc.includes("booking") || desc.includes("accommodation") || desc.includes("tourism")) {
            industry = "hospitality";
            personality = "friendly";
            services.push("Bookings", "Room Service", "Events");
        } else if (desc.includes("doctor") || desc.includes("clinic") || desc.includes("medical") || desc.includes("health") || desc.includes("patient")) {
            industry = "healthcare";
            services.push("Appointments", "Consultations", "Referrals");
        } else if (desc.includes("lawyer") || desc.includes("legal") || desc.includes("accountant") || desc.includes("consulting") || desc.includes("professional")) {
            industry = "professional_services";
            services.push("Consultations", "Quotations", "Appointments");
        }

        // Extract business name (look for patterns like "we are X" or "at X" or company-like names)
        let businessName = "";
        const namePatterns = [
            /(?:we are|i am|this is|welcome to|at)\s+([A-Z][A-Za-z\s&']+?)(?:\.|,|!|\s+and|\s+we|\s+where|$)/i,
            /^([A-Z][A-Za-z\s&']+?)(?:\s+is|\s+are|\s+-|\s+–)/i,
        ];
        for (const pattern of namePatterns) {
            const match = magicDescription.match(pattern);
            if (match && match[1]) {
                businessName = match[1].trim();
                break;
            }
        }

        // Generate keywords from services
        const keywords = services.map(s => s.toLowerCase().split(" ")[0]);
        keywords.push("help", "info", "price");

        try {
            await updateSettings({
                tenantId: tenant._id,
                businessDescription: magicDescription,
                industry,
                aiPersonality: personality,
                servicesOffered: services,
                activationKeywords: keywords,
                ...(businessName && { businessName }),
            });
            toast.success("Magic setup complete! Your AI is configured.");
            setMagicDescription("");
        } catch {
            toast.error("Failed to apply settings");
        }

        setMagicLoading(false);
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
                <TabsTrigger value="welcome-message" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Welcome Message
                </TabsTrigger>
                <TabsTrigger value="share" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Link2 className="w-4 h-4 mr-2" />
                    Share
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
                {/* Magic Setup - Describe Your Business */}
                <Card className="bg-gradient-to-br from-emerald-950/50 to-gray-900/50 border-emerald-800/50">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-emerald-400" />
                            Magic Setup
                            <Badge variant="outline" className="text-emerald-400 border-emerald-600">Easiest</Badge>
                        </CardTitle>
                        <CardDescription>
                            Just describe your business in one sentence - we'll configure everything automatically
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="e.g., We are Cape Town Realty, a property agency helping people buy and rent homes in the Western Cape area."
                            value={magicDescription}
                            onChange={(e) => setMagicDescription(e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white min-h-20"
                        />
                        <Button
                            onClick={handleMagicSetup}
                            disabled={!magicDescription.trim() || magicLoading}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400"
                        >
                            {magicLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Setting up...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Configure My AI
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                            We'll detect your industry, services, and configure the AI personality for you
                        </p>
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Separator className="flex-1 bg-gray-800" />
                    <span className="text-gray-500 text-sm">or pick a template</span>
                    <Separator className="flex-1 bg-gray-800" />
                </div>

                {/* Industry Templates - Quick Setup */}
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            Industry Templates
                        </CardTitle>
                        <CardDescription>
                            One-click setup optimized for your industry
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {[
                                { id: "real_estate", label: "Real Estate", icon: Home, description: "We help clients buy, sell, and rent properties. Our team provides property valuations, arranges viewings, and guides clients through the entire process.", services: ["Property Sales", "Rentals", "Valuations", "Property Management"], keywords: ["property", "house", "apartment", "rent", "buy", "sell", "viewing", "price"], personality: "professional" },
                                { id: "automotive", label: "Car Sales", icon: Car, description: "We sell quality new and pre-owned vehicles. Our services include financing options, trade-ins, and test drives.", services: ["New Vehicles", "Used Vehicles", "Financing", "Trade-ins", "Test Drives"], keywords: ["car", "vehicle", "price", "test drive", "finance", "trade"], personality: "friendly" },
                                { id: "retail", label: "Retail", icon: ShoppingBag, description: "We offer quality products with fast delivery. Customers can browse our catalog, place orders, and track deliveries.", services: ["Product Sales", "Deliveries", "Returns", "Orders"], keywords: ["order", "price", "stock", "delivery", "return", "available"], personality: "friendly" },
                                { id: "hospitality", label: "Hospitality", icon: Hotel, description: "We provide excellent accommodation and hospitality services. Guests can make reservations, request room service, and arrange tours.", services: ["Bookings", "Room Service", "Events", "Tours"], keywords: ["book", "reservation", "room", "available", "price", "check-in"], personality: "friendly" },
                                { id: "healthcare", label: "Healthcare", icon: Stethoscope, description: "We provide professional healthcare services. Patients can book appointments and request consultations.", services: ["Appointments", "Consultations", "Referrals"], keywords: ["appointment", "doctor", "available", "consultation", "prescription"], personality: "professional" },
                                { id: "professional_services", label: "Professional", icon: Scale, description: "We offer professional consulting services. Clients can book consultations and request quotations.", services: ["Consultations", "Quotations", "Appointments"], keywords: ["consultation", "quote", "appointment", "service", "price"], personality: "professional" },
                            ].map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => {
                                        handleUpdateSettings({
                                            industry: template.id,
                                            businessDescription: template.description,
                                            servicesOffered: template.services,
                                            activationKeywords: template.keywords,
                                            aiPersonality: template.personality,
                                        });
                                        toast.success(`${template.label} template applied!`);
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

            {/* Welcome Message Tab */}
            <TabsContent value="welcome-message" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-emerald-400" />
                            Welcome Message
                        </CardTitle>
                        <CardDescription>
                            Automatically greet new customers when they first message you on WhatsApp
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Enable/Disable Welcome Message */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-gray-300">Enable Welcome Message</Label>
                                <p className="text-sm text-gray-500">
                                    Send an automatic greeting to first-time contacts
                                </p>
                            </div>
                            <Switch
                                checked={settings.welcomeMessageEnabled ?? true}
                                onCheckedChange={(checked) => handleUpdateSettings({ welcomeMessageEnabled: checked })}
                            />
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Custom Welcome Message */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">Custom Welcome Message (Optional)</Label>
                            <p className="text-sm text-gray-500">
                                Leave empty to auto-generate from your business profile, or write your own.
                            </p>
                            <Textarea
                                placeholder={`Hi! Welcome to ${settings.businessName || "our business"}. 👋\n\nWe can help you with: ${(settings.servicesOffered || []).slice(0, 3).join(", ") || "our services"}.\n\nHow can I assist you today?`}
                                value={settings.welcomeMessage || ""}
                                onChange={(e) => handleUpdateSettings({ welcomeMessage: e.target.value })}
                                className="bg-gray-800/50 border-gray-700 text-white min-h-32"
                            />
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Suggested Questions */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">Suggested Questions</Label>
                            <p className="text-sm text-gray-500">
                                Help customers get started by showing them what they can ask
                            </p>

                            {/* Add Question Input */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., What are your prices?"
                                    value={newQuestion}
                                    onChange={(e) => setNewQuestion(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter" && newQuestion.trim()) {
                                            const current = settings.suggestedQuestions || [];
                                            handleUpdateSettings({
                                                suggestedQuestions: [...current, newQuestion.trim()]
                                            });
                                            setNewQuestion("");
                                        }
                                    }}
                                    className="bg-gray-800/50 border-gray-700 text-white"
                                />
                                <Button
                                    onClick={() => {
                                        if (newQuestion.trim()) {
                                            const current = settings.suggestedQuestions || [];
                                            handleUpdateSettings({
                                                suggestedQuestions: [...current, newQuestion.trim()]
                                            });
                                            setNewQuestion("");
                                        }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Question Tags */}
                            <div className="flex flex-wrap gap-2">
                                {(settings.suggestedQuestions || []).map((question: string, index: number) => (
                                    <Badge
                                        key={index}
                                        variant="secondary"
                                        className="bg-gray-700 text-white px-3 py-1 flex items-center gap-1"
                                    >
                                        {question}
                                        <X
                                            className="w-3 h-3 cursor-pointer hover:text-red-400"
                                            onClick={() => {
                                                const current = settings.suggestedQuestions || [];
                                                handleUpdateSettings({
                                                    suggestedQuestions: current.filter((_: string, i: number) => i !== index)
                                                });
                                            }}
                                        />
                                    </Badge>
                                ))}
                                {(settings.suggestedQuestions || []).length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No suggested questions yet</p>
                                )}
                            </div>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Response Delay */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">Response Delay</Label>
                            <p className="text-sm text-gray-500">
                                Small delay makes responses feel more natural (1-3 seconds recommended)
                            </p>
                            <Select
                                value={String(settings.welcomeMessageDelay ?? 1000)}
                                onValueChange={(value) => handleUpdateSettings({ welcomeMessageDelay: parseInt(value) })}
                            >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800">
                                    <SelectItem value="0">Instant</SelectItem>
                                    <SelectItem value="500">0.5 seconds</SelectItem>
                                    <SelectItem value="1000">1 second</SelectItem>
                                    <SelectItem value="2000">2 seconds</SelectItem>
                                    <SelectItem value="3000">3 seconds</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Preview Card */}
                <Card className="bg-emerald-950/30 border-emerald-800/50">
                    <CardHeader>
                        <CardTitle className="text-white text-base">Preview</CardTitle>
                        <CardDescription>This is what customers will see when they first message you</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                            <p className="text-white whitespace-pre-line">
                                {settings.welcomeMessage || `Hi! Welcome to ${settings.businessName || "us"}. 👋${
                                    (settings.servicesOffered || []).length > 0
                                        ? `\n\nWe can help you with: ${(settings.servicesOffered || []).slice(0, 3).join(", ")}${(settings.servicesOffered || []).length > 3 ? ", and more" : ""}.`
                                        : ""
                                }\n\nHow can I assist you today?`}
                            </p>
                            {(settings.suggestedQuestions || []).length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-700">
                                    <p className="text-gray-400 text-sm">💡 *Quick questions you can ask:*</p>
                                    {(settings.suggestedQuestions || []).slice(0, 3).map((q: string, i: number) => (
                                        <p key={i} className="text-gray-400 text-sm">• {q}</p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Share Tab - WhatsApp Link Generator */}
            <TabsContent value="share" className="space-y-6">
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                            <Link2 className="w-5 h-5 text-emerald-400" />
                            WhatsApp Link Generator
                        </CardTitle>
                        <CardDescription>
                            Create click-to-chat links for your website, social media, or email signatures
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Instance Selection */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">Select WhatsApp Number</Label>
                            <Select
                                value={settings.defaultInstanceId || ""}
                                onValueChange={(value) => handleUpdateSettings({ defaultInstanceId: value })}
                            >
                                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                                    <SelectValue placeholder="Select an instance" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900 border-gray-800">
                                    {(instances || []).map((instance: any) => (
                                        <SelectItem key={instance._id} value={instance.instanceId}>
                                            {instance.name} ({instance.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Pre-filled Message */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">Pre-filled Message (Optional)</Label>
                            <p className="text-sm text-gray-500">
                                Customer's chat will open with this message pre-typed
                            </p>
                            <Textarea
                                placeholder="Hi, I'm interested in learning more about your services."
                                value={prefilledMessage}
                                onChange={(e) => setPrefilledMessage(e.target.value)}
                                className="bg-gray-800/50 border-gray-700 text-white min-h-20"
                            />
                        </div>

                        <Separator className="bg-gray-800" />

                        {/* Generated Link */}
                        <div className="space-y-3">
                            <Label className="text-gray-300">Your WhatsApp Link</Label>
                            {settings.defaultInstanceId ? (
                                <>
                                    <div className="flex gap-2">
                                        <Input
                                            readOnly
                                            value={`https://wa.me/${(instances || []).find((i: any) => i.instanceId === settings.defaultInstanceId)?.instanceId?.replace(/[^0-9]/g, "") || ""}${prefilledMessage ? `?text=${encodeURIComponent(prefilledMessage)}` : ""}`}
                                            className="bg-gray-800/50 border-gray-700 text-white"
                                        />
                                        <Button
                                            onClick={() => {
                                                const link = `https://wa.me/${(instances || []).find((i: any) => i.instanceId === settings.defaultInstanceId)?.instanceId?.replace(/[^0-9]/g, "") || ""}${prefilledMessage ? `?text=${encodeURIComponent(prefilledMessage)}` : ""}`;
                                                navigator.clipboard.writeText(link);
                                                setCopiedLink(true);
                                                toast.success("Link copied to clipboard!");
                                                setTimeout(() => setCopiedLink(false), 2000);
                                            }}
                                            className="bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                        onClick={() => {
                                            const link = `https://wa.me/${(instances || []).find((i: any) => i.instanceId === settings.defaultInstanceId)?.instanceId?.replace(/[^0-9]/g, "") || ""}${prefilledMessage ? `?text=${encodeURIComponent(prefilledMessage)}` : ""}`;
                                            window.open(link, "_blank");
                                        }}
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Test Link
                                    </Button>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Select a WhatsApp instance above to generate a link</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Usage Tips */}
                <Card className="bg-emerald-950/30 border-emerald-800/50">
                    <CardContent className="p-4">
                        <h4 className="text-emerald-400 font-medium mb-2">Where to use your WhatsApp link</h4>
                        <ul className="text-sm text-gray-400 space-y-1">
                            <li>• <strong className="text-white">Website:</strong> Add a "Chat with us" button that opens WhatsApp</li>
                            <li>• <strong className="text-white">Email signature:</strong> Include it so customers can reach you instantly</li>
                            <li>• <strong className="text-white">Social media:</strong> Add to your bio on Instagram, Facebook, LinkedIn</li>
                            <li>• <strong className="text-white">Business cards:</strong> Generate a QR code from this link</li>
                            <li>• <strong className="text-white">Google Business:</strong> Add as your messaging link</li>
                        </ul>
                    </CardContent>
                </Card>

                {/* HTML Snippet */}
                {settings.defaultInstanceId && (
                    <Card className="bg-gray-900/50 border-gray-800">
                        <CardHeader>
                            <CardTitle className="text-white text-base">HTML Button Code</CardTitle>
                            <CardDescription>Copy this code to add a WhatsApp button to your website</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <pre className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto">
{`<a href="https://wa.me/${(instances || []).find((i: any) => i.instanceId === settings.defaultInstanceId)?.instanceId?.replace(/[^0-9]/g, "") || ""}${prefilledMessage ? `?text=${encodeURIComponent(prefilledMessage)}` : ""}"
   target="_blank"
   style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  </svg>
  Chat on WhatsApp
</a>`}
                                </pre>
                                <Button
                                    size="sm"
                                    className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600"
                                    onClick={() => {
                                        const code = `<a href="https://wa.me/${(instances || []).find((i: any) => i.instanceId === settings.defaultInstanceId)?.instanceId?.replace(/[^0-9]/g, "") || ""}${prefilledMessage ? `?text=${encodeURIComponent(prefilledMessage)}` : ""}" target="_blank" style="display:inline-flex;align-items:center;gap:8px;background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>Chat on WhatsApp</a>`;
                                        navigator.clipboard.writeText(code);
                                        toast.success("HTML code copied!");
                                    }}
                                >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
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

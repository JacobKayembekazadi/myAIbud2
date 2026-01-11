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
import { User, Bot, Bell, Zap, Trash2, Plus, Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    const upgradeToTeam = useMutation(api.tenants.upgradeToTeam);

    const [newReply, setNewReply] = useState({ label: "", content: "", category: "" });
    const [saving, setSaving] = useState(false);
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
    const [orgName, setOrgName] = useState("");
    const [upgrading, setUpgrading] = useState(false);

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

    const handleUpgradeToTeam = async () => {
        if (!tenant || !orgName.trim()) {
            toast.error("Organization name is required");
            return;
        }

        setUpgrading(true);
        try {
            const result = await upgradeToTeam({
                tenantId: tenant._id,
                organizationName: orgName,
            });
            toast.success("Successfully upgraded to team account!");
            setUpgradeDialogOpen(false);
            // Redirect to team page
            router.push("/team");
        } catch (error) {
            console.error("Failed to upgrade:", error);
            toast.error(error instanceof Error ? error.message : "Failed to upgrade to team");
        } finally {
            setUpgrading(false);
        }
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
            <TabsList className="bg-gray-900 border border-gray-800">
                <TabsTrigger value="profile" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                </TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400">
                    <Bot className="w-4 h-4 mr-2" />
                    AI Config
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
                <Card className="bg-gray-900/50 border-gray-800">
                    <CardHeader>
                        <CardTitle className="text-white">Quick Replies</CardTitle>
                        <CardDescription>Pre-defined responses the AI can reference</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4 p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                            <h3 className="text-sm font-medium text-white">Add New Quick Reply</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    placeholder="Label (e.g., Pricing Info)"
                                    value={newReply.label}
                                    onChange={(e) => setNewReply({ ...newReply, label: e.target.value })}
                                    className="bg-gray-800/50 border-gray-700 text-white"
                                />
                                <Input
                                    placeholder="Category (optional)"
                                    value={newReply.category}
                                    onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}
                                    className="bg-gray-800/50 border-gray-700 text-white"
                                />
                            </div>
                            <Textarea
                                placeholder="Response content..."
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
                                    <p>No quick replies yet. Add one above!</p>
                                </div>
                            )}
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
                                <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                                            <Users className="w-5 h-5 mr-2" />
                                            Upgrade to Team Account
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-gray-900 border-gray-800 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Upgrade to Team Account</DialogTitle>
                                            <DialogDescription className="text-gray-400">
                                                This will convert your solo account into a team organization. All your existing data will be preserved.
                                            </DialogDescription>
                                        </DialogHeader>

                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="org-name">Organization Name</Label>
                                                <Input
                                                    id="org-name"
                                                    placeholder="My Company"
                                                    value={orgName}
                                                    onChange={(e) => setOrgName(e.target.value)}
                                                    className="bg-gray-800 border-gray-700 text-white"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Choose a name for your team organization
                                                </p>
                                            </div>
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setUpgradeDialogOpen(false)}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleUpgradeToTeam}
                                                disabled={upgrading || !orgName.trim()}
                                                className="bg-emerald-600 hover:bg-emerald-700"
                                            >
                                                {upgrading ? "Upgrading..." : "Upgrade Now"}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            )}
        </Tabs>
    );
}

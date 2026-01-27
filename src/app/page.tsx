"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth, SignedIn, SignedOut } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Smartphone,
  Users,
  Zap,
  ArrowRight,
  MessageSquare,
  Bot,
  Send,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
  Play,
  Rocket,
  RefreshCw,
} from "lucide-react";

import { SetupWizard } from "@/components/onboarding/SetupWizard";
import { DashboardErrorBoundary } from "@/components/DashboardErrorBoundary";

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Skeleton */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 bg-gray-800" />
            <Skeleton className="h-5 w-80 mt-2 bg-gray-800" />
          </div>
          <Skeleton className="h-6 w-32 bg-gray-800" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-32 bg-gray-700" />
                <Skeleton className="h-9 w-9 rounded-lg bg-gray-700" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-16 bg-gray-700" />
                <Skeleton className="h-5 w-24 mt-2 bg-gray-700" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-32 bg-gray-800" />
                <Skeleton className="h-4 w-64 mt-1 bg-gray-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                    <Skeleton className="h-12 w-12 rounded-xl bg-gray-700" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 bg-gray-700" />
                      <Skeleton className="h-4 w-48 mt-1 bg-gray-700" />
                    </div>
                    <Skeleton className="h-8 w-8 bg-gray-700" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-36 bg-gray-800" />
                <Skeleton className="h-4 w-48 mt-1 bg-gray-800" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-gray-700" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 bg-gray-700" />
                      <Skeleton className="h-3 w-32 mt-1 bg-gray-700" />
                    </div>
                    <Skeleton className="h-5 w-12 bg-gray-700" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Onboarding Progress Widget
function OnboardingProgress({
  tenant,
  onOpenWizard,
}: {
  tenant: {
    _id: any;
    hasCreatedInstance?: boolean;
    hasConnectedWhatsApp?: boolean;
    hasSyncedContacts?: boolean;
    hasTestedAI?: boolean;
    onboardingCompleted?: boolean;
  };
  onOpenWizard: () => void;
}) {
  const steps = [
    { key: "create", label: "Create Instance", done: tenant.hasCreatedInstance },
    { key: "connect", label: "Connect WhatsApp", done: tenant.hasConnectedWhatsApp },
    { key: "sync", label: "Sync Contacts", done: tenant.hasSyncedContacts },
    { key: "test", label: "Test AI", done: tenant.hasTestedAI },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const progressPercent = (completedCount / steps.length) * 100;

  if (tenant.onboardingCompleted) return null;

  return (
    <Card className="bg-gradient-to-br from-emerald-950/50 to-gray-900 border-emerald-800/50 mb-6 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Complete Your Setup</h3>
              <p className="text-sm text-gray-400">
                {completedCount === 0
                  ? "Get started with MyChatFlow"
                  : `${completedCount} of ${steps.length} steps completed`}
              </p>
            </div>
          </div>
          <Button
            onClick={onOpenWizard}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          >
            <Play className="w-4 h-4 mr-2" />
            Continue Setup
          </Button>
        </div>

        <div className="space-y-3">
          <Progress value={progressPercent} className="h-2 bg-gray-800" />
          <div className="grid grid-cols-4 gap-2">
            {steps.map((step, idx) => (
              <div
                key={step.key}
                className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                  step.done
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-gray-800/50 text-gray-500"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                )}
                <span className="text-xs font-medium truncate">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  variant = "default",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  variant?: "default" | "primary";
}) {
  return (
    <div className="text-center py-8">
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
          variant === "primary"
            ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20"
            : "bg-gray-800"
        )}
      >
        <Icon className={cn("w-8 h-8", variant === "primary" ? "text-white" : "text-gray-500")} />
      </div>
      <h4 className="text-white font-medium mb-1">{title}</h4>
      <p className="text-gray-500 text-sm mb-4 max-w-xs mx-auto">{description}</p>
      <Button
        asChild
        className={cn(
          variant === "primary"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-gray-800 hover:bg-gray-700"
        )}
      >
        <Link href={actionHref}>
          {actionLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

function Dashboard() {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const instances = useQuery(api.instances.listInstances, tenant ? { tenantId: tenant._id } : "skip");
  const contacts = useQuery(api.contacts.listContacts, tenant ? { tenantId: tenant._id } : "skip");
  const usage = useQuery(api.subscriptionUsage.getUsage, tenant ? { tenantId: tenant._id } : "skip");
  const campaigns = useQuery(api.campaigns.listCampaigns, tenant ? { tenantId: tenant._id } : "skip");

  const [wizardOpen, setWizardOpen] = useState(false);

  // Handle no user ID case
  if (!userId) {
    return <DashboardSkeleton />;
  }

  // Show skeleton while loading tenant
  if (tenant === undefined) {
    return <DashboardSkeleton />;
  }

  // Handle case where tenant doesn't exist (first-time user)
  if (tenant === null) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Setting up your account</h1>
            <p className="text-gray-400 mb-6">
              We're creating your account. This should only take a moment...
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show skeleton while loading other data (but tenant is loaded)
  if (instances === undefined || contacts === undefined) {
    return <DashboardSkeleton />;
  }

  const creditsUsed = usage?.creditsUsed ?? 0;
  const creditsLimit = usage?.creditsLimit ?? 400;
  const creditsRemaining = creditsLimit - creditsUsed;
  const creditPercentage = (creditsUsed / creditsLimit) * 100;

  const connectedInstances = instances?.filter(i => i.status === 'connected').length ?? 0;
  const recentContacts = contacts?.filter(c => !c.isDemo).slice(0, 5) ?? [];
  const showOnboarding = tenant && !tenant.onboardingCompleted;

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome to your AI-powered WhatsApp assistant</p>
          </div>
          <Badge variant="outline" className="text-green-400 border-green-600 bg-green-950/50">
            <Activity className="w-3 h-3 mr-1" />
            System Active
          </Badge>
        </div>

        {/* Onboarding Progress Widget */}
        {showOnboarding && tenant && (
          <OnboardingProgress tenant={tenant} onOpenWizard={() => setWizardOpen(true)} />
        )}

        {/* Stats Grid - 4 columns now */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-green-600/50 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">WhatsApp Instances</CardTitle>
              <div className="p-2 bg-green-600/20 rounded-lg">
                <Smartphone className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{instances?.length ?? 0}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-600/20 text-green-400 text-xs">
                  {connectedInstances} connected
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-600/50 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">Total Contacts</CardTitle>
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{contacts?.filter(c => !c.isDemo).length ?? 0}</p>
              <div className="flex items-center gap-2 mt-2">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-500">People reached</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-purple-600/50 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">Campaigns</CardTitle>
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Send className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{campaigns?.length ?? 0}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-400 text-xs">
                  {campaigns?.filter(c => c.status === 'completed').length ?? 0} completed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-amber-600/50 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">AI Credits</CardTitle>
              <div className="p-2 bg-amber-600/20 rounded-lg">
                <Zap className="w-5 h-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${creditsRemaining > 100 ? 'text-green-500' : creditsRemaining > 20 ? 'text-amber-500' : 'text-red-500'}`}>
                {creditsRemaining}
              </p>
              <div className="mt-2">
                <Progress
                  value={100 - creditPercentage}
                  className="h-2 bg-gray-700"
                />
                <p className="text-xs text-gray-500 mt-1">{creditsUsed} / {creditsLimit} used</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
                <CardDescription>Get started with your WhatsApp assistant</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="p-3 bg-green-600/20 rounded-xl">
                    <Smartphone className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">Connect WhatsApp</h3>
                    <p className="text-sm text-gray-400">Create a new instance and scan QR code</p>
                  </div>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <Link href="/instances">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                <Separator className="bg-gray-800" />

                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="p-3 bg-blue-600/20 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">View Conversations</h3>
                    <p className="text-sm text-gray-400">See all your WhatsApp chats and AI responses</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-gray-700 hover:bg-gray-700">
                    <Link href="/chat">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>

                <Separator className="bg-gray-800" />

                <div className="flex items-center gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                  <div className="p-3 bg-purple-600/20 rounded-xl">
                    <Send className="w-6 h-6 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-medium">Create Campaign</h3>
                    <p className="text-sm text-gray-400">Send bulk messages to your contacts</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="border-gray-700 hover:bg-gray-700">
                    <Link href="/campaigns">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Campaigns */}
            {campaigns && campaigns.length > 0 ? (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Recent Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.slice(0, 3).map((campaign) => (
                      <div key={campaign._id} className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg">
                        <div className={`p-2 rounded-lg ${campaign.status === 'completed' ? 'bg-green-600/20' :
                          campaign.status === 'sending' ? 'bg-blue-600/20' :
                            'bg-gray-600/20'
                          }`}>
                          {campaign.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : campaign.status === 'sending' ? (
                            <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
                          ) : (
                            <Clock className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{campaign.name}</p>
                          <p className="text-xs text-gray-500">{campaign.sentCount} / {campaign.totalContacts} sent</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            campaign.status === 'completed' ? 'text-green-400 border-green-600' :
                              campaign.status === 'sending' ? 'text-blue-400 border-blue-600' :
                                'text-gray-400 border-gray-600'
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900/50 border-gray-800">
                <CardContent className="py-8">
                  <EmptyState
                    icon={Send}
                    title="No Campaigns Yet"
                    description="Create your first campaign to reach multiple contacts at once with personalized messages."
                    actionLabel="Create Campaign"
                    actionHref="/campaigns"
                    variant="default"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Contacts - 1/3 width */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Recent Contacts</CardTitle>
                <CardDescription>Latest people who messaged you</CardDescription>
              </CardHeader>
              <CardContent>
                {recentContacts.length > 0 ? (
                  <div className="space-y-4">
                    {recentContacts.map((contact) => (
                      <Link
                        key={contact._id}
                        href={`/chat/${contact._id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Avatar className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                            {contact.name?.charAt(0) || contact.phone.slice(-2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">
                            {contact.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            +{contact.phone}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-gray-800 text-gray-400 text-xs">
                          {contact.status}
                        </Badge>
                      </Link>
                    ))}
                    <Button asChild variant="ghost" className="w-full text-gray-400 hover:text-white">
                      <Link href="/contacts">View all contacts →</Link>
                    </Button>
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No Contacts Yet"
                    description="Connect WhatsApp to start syncing your contacts automatically."
                    actionLabel="Connect WhatsApp"
                    actionHref="/instances"
                    variant="primary"
                  />
                )}
              </CardContent>
            </Card>

            {/* Instance Status */}
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Instance Status</CardTitle>
              </CardHeader>
              <CardContent>
                {instances && instances.length > 0 ? (
                  <div className="space-y-3">
                    {instances.slice(0, 3).map((instance) => (
                      <div key={instance._id} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${instance.status === 'connected' ? 'bg-green-500' :
                          instance.status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-500'
                          }`} />
                        <span className="text-white text-sm flex-1">{instance.name}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${instance.status === 'connected' ? 'text-green-400 border-green-600' :
                            instance.status === 'connecting' ? 'text-yellow-400 border-yellow-600' :
                              'text-gray-400 border-gray-600'
                            }`}
                        >
                          {instance.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Smartphone}
                    title="No Instances"
                    description="Create your first WhatsApp instance to get started."
                    actionLabel="Create Instance"
                    actionHref="/instances"
                    variant="primary"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Setup Wizard Modal */}
      {tenant && (
        <SetupWizard
          tenantId={tenant._id}
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          initialStep={tenant.onboardingStep ?? 0}
        />
      )}
    </div>
  );
}

// Navigation Component
function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#02040a]/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">MyChatFlow</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
          <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">How It Works</a>
          <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
          <a href="#faq" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">FAQ</a>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-gray-400 hover:text-white">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-500 text-white">
            <Link href="/sign-up">Start Free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-6">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-8">
          <Sparkles className="w-4 h-4" />
          AI That Works For Any Business
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-6">
          Your Business, <br />
          <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            Always Online
          </span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Stop losing customers to slow response times. MyChatFlow uses AI to instantly engage your WhatsApp contacts, answer questions, and qualify leads—24/7, while you focus on what matters.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button asChild size="lg" className="h-14 px-10 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] border-0 transition-all hover:scale-105 active:scale-95 group">
            <Link href="/sign-up" className="flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="ghost" className="h-14 px-10 text-gray-400 hover:text-white hover:bg-white/5 font-semibold text-lg rounded-xl transition-all border border-gray-800/50">
            <a href="#how-it-works" className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              See How It Works
            </a>
          </Button>
        </div>

        {/* Industry pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {["Real Estate", "Car Sales", "Healthcare", "Retail", "Hospitality", "Services"].map((industry) => (
            <span key={industry} className="px-3 py-1 rounded-full bg-gray-800/50 text-gray-400 text-xs border border-gray-700/50">
              {industry}
            </span>
          ))}
        </div>

        <p className="text-sm text-gray-500">No credit card required. Free 14-day trial.</p>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Smartphone,
      label: "Connect in 60 Seconds",
      desc: "Scan a QR code and your AI assistant is live. No technical setup, no API keys, no headaches.",
      color: "emerald"
    },
    {
      icon: Bot,
      label: "AI That Knows Your Business",
      desc: "Pick your industry and the AI adapts instantly. It speaks your language and understands your customers.",
      color: "blue"
    },
    {
      icon: Clock,
      label: "24/7 Customer Engagement",
      desc: "Never miss another inquiry—even at 3 AM. Instant responses keep customers engaged until you're ready.",
      color: "amber"
    },
    {
      icon: Users,
      label: "Team Collaboration",
      desc: "Assign leads to team members, track performance, and manage everyone from one dashboard.",
      color: "purple"
    },
    {
      icon: Send,
      label: "Bulk Campaigns",
      desc: "Send personalized messages to hundreds of contacts with smart rate limiting to protect your number.",
      color: "pink"
    },
    {
      icon: TrendingUp,
      label: "Analytics & Insights",
      desc: "Track response rates, identify hot leads, and measure ROI with detailed reporting.",
      color: "cyan"
    },
  ];

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Scale</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From instant AI responses to team management, MyChatFlow gives businesses the tools to convert more leads and delight customers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <Card key={i} className="bg-gray-900/40 border-gray-800/50 hover:border-emerald-500/30 transition-all group">
              <CardContent className="p-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  feature.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                  feature.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                  feature.color === 'amber' ? "bg-amber-500/10 text-amber-500" :
                  feature.color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                  feature.color === 'pink' ? "bg-pink-500/10 text-pink-500" :
                  "bg-cyan-500/10 text-cyan-500"
                )}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold mb-2">{feature.label}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      title: "Connect Your WhatsApp",
      description: "Scan a QR code with your phone—just like WhatsApp Web. Your account is connected in under 60 seconds.",
      icon: Smartphone,
    },
    {
      step: "02",
      title: "Customize Your AI",
      description: "Set your business context, response style, and quick replies. The AI learns how you want to communicate.",
      icon: Bot,
    },
    {
      step: "03",
      title: "Watch Leads Convert",
      description: "Your AI engages leads instantly, answers questions, and qualifies prospects while you focus on closing deals.",
      icon: TrendingUp,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 bg-gray-900/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Up and Running in Minutes</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            No technical skills required. If you can use WhatsApp, you can use MyChatFlow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, i) => (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-emerald-500/50 to-transparent" />
              )}
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-green-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <item.icon className="w-10 h-10 text-emerald-400" />
                </div>
                <div className="text-emerald-400 font-bold text-sm mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      period: "14-day trial",
      description: "Perfect for trying out MyChatFlow",
      features: [
        "1 WhatsApp instance",
        "100 AI responses/month",
        "Basic analytics",
        "Email support",
      ],
      cta: "Start Free Trial",
      highlighted: false,
    },
    {
      name: "Professional",
      price: "$49",
      period: "/month",
      description: "For individual agents and small teams",
      features: [
        "3 WhatsApp instances",
        "1,000 AI responses/month",
        "Advanced analytics",
        "Bulk campaigns",
        "Priority support",
        "Custom AI training",
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "For brokerages and large teams",
      features: [
        "Unlimited instances",
        "Unlimited AI responses",
        "White-label option",
        "API access",
        "Dedicated support",
        "Custom integrations",
      ],
      cta: "Contact Sales",
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Start free, upgrade when you're ready. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <Card
              key={i}
              className={cn(
                "relative overflow-hidden transition-all",
                plan.highlighted
                  ? "bg-gradient-to-br from-emerald-950/80 to-gray-900 border-emerald-500/50 scale-105"
                  : "bg-gray-900/40 border-gray-800/50 hover:border-gray-700"
              )}
            >
              {plan.highlighted && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              )}
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-gray-300 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  className={cn(
                    "w-full",
                    plan.highlighted
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-white"
                  )}
                >
                  <Link href="/sign-up">{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  const testimonials = [
    {
      quote: "MyChatFlow helped me respond to leads instantly. I've closed 3 more property deals this month just from faster follow-ups.",
      name: "Sarah Martinez",
      role: "Real Estate Agent, Cape Town",
      avatar: "SM",
    },
    {
      quote: "Customers message us at all hours asking about vehicle availability. Now they get instant answers and book test drives automatically.",
      name: "Michael Chen",
      role: "Car Dealership Owner, Johannesburg",
      avatar: "MC",
    },
    {
      quote: "Our clinic was missing appointment requests after hours. Now patients can book 24/7 and we wake up to a full schedule.",
      name: "Dr. Jennifer Adams",
      role: "Medical Practice, Durban",
      avatar: "JA",
    },
  ];

  return (
    <section className="py-20 px-6 bg-gray-900/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Loved by Businesses Everywhere</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            See how businesses across industries are using MyChatFlow to convert more leads and serve customers better.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="bg-gray-900/40 border-gray-800/50">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((star) => (
                    <Sparkles key={star} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="text-white font-medium text-sm">{testimonial.name}</p>
                    <p className="text-gray-500 text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection() {
  const faqs = [
    {
      question: "Is my WhatsApp account safe?",
      answer: "Yes. MyChatFlow uses the official WhatsApp Web protocol. Your account stays on your phone, and you can disconnect anytime. We never store your WhatsApp credentials.",
    },
    {
      question: "Will WhatsApp ban my number?",
      answer: "We use smart rate limiting and human-like response patterns to keep your account safe. Thousands of messages are sent daily through MyChatFlow without issues.",
    },
    {
      question: "Can I customize the AI responses?",
      answer: "Absolutely. You can set your business context, preferred tone, quick replies, and even specific responses for common questions. The AI adapts to your communication style.",
    },
    {
      question: "What happens when the AI can't answer?",
      answer: "You'll get a notification, and the conversation is flagged for human follow-up. You can also set specific keywords that automatically route to you.",
    },
    {
      question: "Can I use this with my team?",
      answer: "Yes! MyChatFlow supports teams with role-based access. Assign leads to agents, track performance, and collaborate from one dashboard.",
    },
    {
      question: "Is there a contract or commitment?",
      answer: "No contracts. Pay monthly, cancel anytime. Start with a free 14-day trial—no credit card required.",
    },
  ];

  return (
    <section id="faq" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-400">
            Got questions? We've got answers.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <Card key={i} className="bg-gray-900/40 border-gray-800/50">
              <CardContent className="p-6">
                <h3 className="text-white font-semibold mb-2">{faq.question}</h3>
                <p className="text-gray-400 text-sm">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-gradient-to-br from-emerald-950/80 to-gray-900 rounded-3xl p-12 border border-emerald-500/20">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Grow Your Business?</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Join thousands of businesses who are converting more leads with AI-powered WhatsApp automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="h-14 px-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl">
              <Link href="/sign-up" className="flex items-center gap-2">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">No credit card required. Free 14-day trial.</p>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="border-t border-gray-800/50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">MyChatFlow</span>
            </Link>
            <p className="text-gray-500 text-sm">
              AI-powered WhatsApp automation for any business.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="text-gray-400 hover:text-white text-sm">Features</a></li>
              <li><a href="#pricing" className="text-gray-400 hover:text-white text-sm">Pricing</a></li>
              <li><a href="#faq" className="text-gray-400 hover:text-white text-sm">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-white text-sm">About</Link></li>
              <li><a href="mailto:support@mychatflow.com" className="text-gray-400 hover:text-white text-sm">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="bg-gray-800 mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} MyChatFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-gray-500 text-xs">Powered by advanced AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#02040a] relative overflow-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SignedIn>
        <DashboardErrorBoundary>
          <Dashboard />
        </DashboardErrorBoundary>
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

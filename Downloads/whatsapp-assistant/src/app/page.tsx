"use client";

import Link from "next/link";
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
  Activity
} from "lucide-react";

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

function Dashboard() {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const instances = useQuery(api.instances.listInstances, tenant ? { tenantId: tenant._id } : "skip");
  const contacts = useQuery(api.contacts.listContacts, tenant ? { tenantId: tenant._id } : "skip");
  const usage = useQuery(api.subscriptionUsage.getUsage, tenant ? { tenantId: tenant._id } : "skip");
  const campaigns = useQuery(api.campaigns.listCampaigns, tenant ? { tenantId: tenant._id } : "skip");

  // Show skeleton while loading
  if (tenant === undefined || instances === undefined || contacts === undefined) {
    return <DashboardSkeleton />;
  }

  const creditsUsed = usage?.creditsUsed ?? 0;
  const creditsLimit = usage?.creditsLimit ?? 400;
  const creditsRemaining = creditsLimit - creditsUsed;
  const creditPercentage = (creditsUsed / creditsLimit) * 100;

  const connectedInstances = instances?.filter(i => i.status === 'connected').length ?? 0;
  const recentContacts = contacts?.slice(0, 5) ?? [];

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
              <p className="text-4xl font-bold text-white">{contacts?.length ?? 0}</p>
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
            {campaigns && campaigns.length > 0 && (
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
                      <Link href="/chat">View all contacts →</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No contacts yet</p>
                    <p className="text-gray-600 text-xs mt-1">Connect WhatsApp to sync contacts</p>
                  </div>
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
                  <div className="text-center py-4">
                    <Smartphone className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No instances</p>
                    <Button asChild size="sm" className="mt-2 bg-green-600 hover:bg-green-700">
                      <Link href="/instances">Create Instance</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#02040a] relative overflow-hidden flex items-center justify-center py-20">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Zap className="w-3 h-3" />
          Next-Gen Automation
        </div>

        {/* Hero Section */}
        <div className="mb-12">
          <div className="w-20 h-20 mx-auto mb-8 bg-gradient-to-tr from-emerald-500 to-green-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse">
            <Bot className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white mb-6">
            Everything flows with <br />
            <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
              MyChatFlow
            </span>
          </h1>

          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Automate your WhatsApp conversations with premium AI. Scale your Business, engage your leads, and save thousands of hours with the industry standard.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: Smartphone, label: "Smart Connect", desc: "One-click WhatsApp linking", color: "emerald" },
            { icon: MessageSquare, label: "AI Conversations", desc: "Gemini 2.0 Powered engine", color: "blue" },
            { icon: Zap, label: "Zero Latency", desc: "Instant automated responses", color: "amber" }
          ].map((feature, i) => (
            <Card key={i} className="bg-gray-900/40 border-gray-800/50 backdrop-blur-md hover:border-emerald-500/30 transition-all group overflow-hidden">
              <CardContent className="pt-6">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  feature.color === 'emerald' ? "bg-emerald-500/10 text-emerald-500" :
                    feature.color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                      "bg-amber-500/10 text-amber-500"
                )}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold mb-1">{feature.label}</h3>
                <p className="text-xs text-gray-500">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button asChild size="lg" className="h-14 px-10 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] border-0 transition-all hover:scale-105 active:scale-95 group">
            <Link href="/sign-in" className="flex items-center gap-2">
              Launch Platform
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="ghost" className="h-14 px-10 text-gray-400 hover:text-white hover:bg-white/5 font-semibold text-lg rounded-xl transition-all border border-gray-800/50">
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </div>

        {/* Trust & Badges */}
        <div className="mt-16 pt-8 border-t border-gray-800/30">
          <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 text-white font-bold tracking-widest text-[10px] uppercase">
              <Bot className="w-4 h-4" />
              Gemini 2.0 Exp
            </div>
            <div className="flex items-center gap-2 text-white font-bold tracking-widest text-[10px] uppercase">
              <Zap className="w-4 h-4" />
              WAHA Plus
            </div>
            <div className="flex items-center gap-2 text-white font-bold tracking-widest text-[10px] uppercase">
              <Activity className="w-4 h-4" />
              Convex Realtime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <SignedOut>
        <LandingPage />
      </SignedOut>
    </>
  );
}

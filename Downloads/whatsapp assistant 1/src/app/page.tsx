"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useAuth, SignedIn, SignedOut } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Users, Zap, ArrowRight, MessageSquare, Bot } from "lucide-react";

function Dashboard() {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const instances = useQuery(api.instances.listInstances, tenant ? { tenantId: tenant._id } : "skip");
  const contacts = useQuery(api.contacts.listContacts, tenant ? { tenantId: tenant._id } : "skip");
  const usage = useQuery(api.subscriptionUsage.getUsage, tenant ? { tenantId: tenant._id } : "skip");

  const creditsRemaining = usage ? usage.creditsLimit - usage.creditsUsed : 400;

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Welcome to your AI-powered WhatsApp assistant</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-green-600/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">WhatsApp Instances</CardTitle>
              <Smartphone className="w-5 h-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{instances?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Connected accounts</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-600/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">Total Contacts</CardTitle>
              <Users className="w-5 h-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-white">{contacts?.length ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">People reached</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-amber-600/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-gray-400 text-sm font-medium">Credits Remaining</CardTitle>
              <Zap className="w-5 h-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className={`text-4xl font-bold ${creditsRemaining > 100 ? 'text-green-500' : creditsRemaining > 20 ? 'text-amber-500' : 'text-red-500'}`}>
                {creditsRemaining}
              </p>
              <p className="text-xs text-gray-500 mt-1">AI responses available</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-500" />
                Connect WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Create a new WhatsApp instance and scan the QR code to connect your phone.
              </p>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/instances" className="flex items-center gap-2">
                  Manage Instances <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                View Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                See all your WhatsApp conversations and AI responses in one place.
              </p>
              <Button asChild variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                <Link href="/chat" className="flex items-center gap-2">
                  View Chats <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center max-w-2xl mx-auto px-6">
        {/* Logo & Branding */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-4">
            My Aibud
          </h1>
          <p className="text-xl text-gray-400">
            AI-Powered WhatsApp Assistant for Real Estate
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mb-10">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-600/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm text-gray-400">Connect WhatsApp</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-500" />
            </div>
            <p className="text-sm text-gray-400">Auto-Reply</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm text-gray-400">AI-Powered</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800 text-lg px-8">
            <Link href="/sign-up">Create Account</Link>
          </Button>
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

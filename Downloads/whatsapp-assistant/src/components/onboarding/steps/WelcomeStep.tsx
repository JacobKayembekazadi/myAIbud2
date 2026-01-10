"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Smartphone,
  MessageSquare,
  Zap,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const features = [
    {
      icon: Smartphone,
      title: "Connect WhatsApp",
      description: "Link your WhatsApp Business account in seconds",
      color: "emerald",
    },
    {
      icon: Bot,
      title: "AI-Powered Responses",
      description: "Gemini 2.0 handles conversations automatically",
      color: "blue",
    },
    {
      icon: MessageSquare,
      title: "Manage Conversations",
      description: "View all chats in one beautiful dashboard",
      color: "purple",
    },
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Be up and running in under 5 minutes",
      color: "amber",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          Welcome to MyChatFlow
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Let&apos;s Get You Started! 🎉
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          In just a few steps, you&apos;ll have an AI assistant handling your WhatsApp messages automatically.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="bg-gray-800/50 border-gray-700/50 hover:border-gray-600 transition-colors"
          >
            <CardContent className="p-4">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                  feature.color === "emerald"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : feature.color === "blue"
                    ? "bg-blue-500/20 text-blue-400"
                    : feature.color === "purple"
                    ? "bg-purple-500/20 text-purple-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-white font-medium text-sm mb-1">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-xs">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="pt-4">
        <Button
          onClick={onNext}
          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-semibold text-lg rounded-xl shadow-lg shadow-emerald-500/20"
        >
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}



"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Smartphone,
  MessageCircle,
  Users,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface ConfigureAgentStepProps {
  tenantId: Id<"tenants">;
  onNext: () => void;
  onSkip: () => void;
}

const ACTIVATION_MODES = [
  {
    id: "always_on",
    icon: Smartphone,
    title: "Business Line",
    subtitle: "AI responds to all messages",
    description: "Best for dedicated business WhatsApp numbers where you want automated responses to every inquiry.",
    color: "emerald",
  },
  {
    id: "keyword_triggered",
    icon: MessageCircle,
    title: "Keyword Triggered",
    subtitle: "AI responds when keywords detected",
    description: "Perfect for personal numbers. AI only activates when messages contain words like 'help', 'info', or 'property'.",
    color: "blue",
  },
  {
    id: "new_contacts_only",
    icon: Users,
    title: "New Contacts Only",
    subtitle: "AI handles unknown contacts",
    description: "Great for lead qualification. AI responds to new contacts while you handle existing relationships.",
    color: "purple",
  },
  {
    id: "business_hours",
    icon: Clock,
    title: "Business Hours",
    subtitle: "AI active during set hours",
    description: "AI only responds during your work hours. Outside hours, you can send a custom away message.",
    color: "amber",
  },
];

export function ConfigureAgentStep({
  tenantId,
  onNext,
  onSkip,
}: ConfigureAgentStepProps) {
  const [selectedMode, setSelectedMode] = useState<string>("always_on");
  const [saving, setSaving] = useState(false);
  const updateSettings = useMutation(api.settings.updateSettings);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        tenantId,
        agentActivationMode: selectedMode as "always_on" | "keyword_triggered" | "new_contacts_only" | "business_hours",
      });
      toast.success("Agent activation mode saved!");
      onNext();
    } catch (error) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          How will you use this number?
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Choose when the AI assistant should respond to messages. You can change this anytime in Settings.
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-3">
        {ACTIVATION_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          return (
            <Card
              key={mode.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500"
                  : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
              }`}
              onClick={() => setSelectedMode(mode.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      mode.color === "emerald"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : mode.color === "blue"
                        ? "bg-blue-500/20 text-blue-400"
                        : mode.color === "purple"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    <mode.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold">{mode.title}</h3>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-1">{mode.subtitle}</p>
                    <p className="text-xs text-gray-500">{mode.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="flex-1 text-gray-400 hover:text-white"
        >
          Skip for now
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400"
        >
          {saving ? "Saving..." : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-gray-500">
        Tip: "Keyword Triggered" is recommended for personal numbers
      </p>
    </div>
  );
}

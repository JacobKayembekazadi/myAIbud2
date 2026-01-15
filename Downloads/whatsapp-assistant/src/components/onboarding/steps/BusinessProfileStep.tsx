"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  Home,
  Car,
  ShoppingBag,
  Hotel,
  Stethoscope,
  Scale,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface BusinessProfileStepProps {
  tenantId: Id<"tenants">;
  onNext: () => void;
  onSkip: () => void;
}

const INDUSTRY_TEMPLATES = [
  {
    id: "real_estate",
    icon: Home,
    title: "Real Estate",
    subtitle: "Property sales & rentals",
    services: ["Property Sales", "Rentals", "Valuations", "Property Management"],
    keywords: ["property", "house", "apartment", "rent", "buy", "sell", "viewing", "price"],
    color: "emerald",
  },
  {
    id: "automotive",
    icon: Car,
    title: "Car Sales",
    subtitle: "Vehicle dealership",
    services: ["New Vehicles", "Used Vehicles", "Financing", "Trade-ins", "Test Drives"],
    keywords: ["car", "vehicle", "price", "test drive", "finance", "trade"],
    color: "blue",
  },
  {
    id: "retail",
    icon: ShoppingBag,
    title: "Retail",
    subtitle: "Products & e-commerce",
    services: ["Product Sales", "Deliveries", "Returns", "Orders"],
    keywords: ["order", "price", "stock", "delivery", "return", "available"],
    color: "purple",
  },
  {
    id: "hospitality",
    icon: Hotel,
    title: "Hospitality",
    subtitle: "Hotels & tourism",
    services: ["Bookings", "Room Service", "Events", "Tours"],
    keywords: ["book", "reservation", "room", "available", "price", "check-in"],
    color: "amber",
  },
  {
    id: "healthcare",
    icon: Stethoscope,
    title: "Healthcare",
    subtitle: "Medical practice",
    services: ["Appointments", "Consultations", "Referrals"],
    keywords: ["appointment", "doctor", "available", "consultation", "prescription"],
    color: "red",
  },
  {
    id: "professional_services",
    icon: Scale,
    title: "Professional",
    subtitle: "Legal, accounting, etc.",
    services: ["Consultations", "Quotations", "Appointments"],
    keywords: ["consultation", "quote", "appointment", "service", "price"],
    color: "cyan",
  },
  {
    id: "general",
    icon: Building2,
    title: "Other",
    subtitle: "General business",
    services: [],
    keywords: ["help", "info", "price", "available", "appointment"],
    color: "gray",
  },
];

export function BusinessProfileStep({
  tenantId,
  onNext,
  onSkip,
}: BusinessProfileStepProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [saving, setSaving] = useState(false);
  const updateSettings = useMutation(api.settings.updateSettings);

  const handleSave = async () => {
    if (!selectedIndustry) {
      toast.error("Please select an industry");
      return;
    }

    setSaving(true);
    try {
      const template = INDUSTRY_TEMPLATES.find((t) => t.id === selectedIndustry);
      await updateSettings({
        tenantId,
        industry: selectedIndustry,
        businessName: businessName || undefined,
        servicesOffered: template?.services || [],
        activationKeywords: template?.keywords || [],
        aiPersonality: selectedIndustry === "hospitality" ? "friendly" : "professional",
      });
      toast.success("Business profile saved!");
      onNext();
    } catch (error) {
      toast.error("Failed to save profile");
    }
    setSaving(false);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) return "bg-gray-500/20 text-gray-400";
    switch (color) {
      case "emerald": return "bg-emerald-500/20 text-emerald-400";
      case "blue": return "bg-blue-500/20 text-blue-400";
      case "purple": return "bg-purple-500/20 text-purple-400";
      case "amber": return "bg-amber-500/20 text-amber-400";
      case "red": return "bg-red-500/20 text-red-400";
      case "cyan": return "bg-cyan-500/20 text-cyan-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          What type of business do you run?
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          This helps us configure the AI to understand your industry and speak your language.
        </p>
      </div>

      {/* Business Name Input */}
      <div className="space-y-2">
        <Label className="text-gray-300">Business Name (optional)</Label>
        <Input
          placeholder="e.g., ABC Realty, Mike's Auto Sales"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className="bg-gray-800/50 border-gray-700 text-white"
        />
      </div>

      {/* Industry Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INDUSTRY_TEMPLATES.map((template) => {
          const isSelected = selectedIndustry === template.id;
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500"
                  : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
              }`}
              onClick={() => setSelectedIndustry(template.id)}
            >
              <CardContent className="p-4 text-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${getColorClasses(
                    template.color,
                    isSelected
                  )}`}
                >
                  <template.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <h3 className="text-white font-medium text-sm">{template.title}</h3>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{template.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Industry Info */}
      {selectedIndustry && selectedIndustry !== "general" && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
          <p className="text-sm text-emerald-300">
            Your AI will be optimized for{" "}
            {INDUSTRY_TEMPLATES.find((t) => t.id === selectedIndustry)?.title.toLowerCase()}{" "}
            conversations, including industry-specific terminology and common questions.
          </p>
        </div>
      )}

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
          disabled={saving || !selectedIndustry}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400"
        >
          {saving ? "Saving..." : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-gray-500">
        You can always change this later in Settings &gt; Business Profile
      </p>
    </div>
  );
}

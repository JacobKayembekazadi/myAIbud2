"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
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
    description: "We help clients buy, sell, and rent properties. Our team provides property valuations, arranges viewings, and guides clients through the entire process.",
    services: ["Property Sales", "Rentals", "Valuations", "Property Management"],
    keywords: ["property", "house", "apartment", "rent", "buy", "sell", "viewing", "price"],
    personality: "professional",
    color: "emerald",
  },
  {
    id: "automotive",
    icon: Car,
    title: "Car Sales",
    subtitle: "Vehicle dealership",
    description: "We sell quality new and pre-owned vehicles. Our services include financing options, trade-ins, and test drives. We help customers find their perfect vehicle.",
    services: ["New Vehicles", "Used Vehicles", "Financing", "Trade-ins", "Test Drives"],
    keywords: ["car", "vehicle", "price", "test drive", "finance", "trade"],
    personality: "friendly",
    color: "blue",
  },
  {
    id: "retail",
    icon: ShoppingBag,
    title: "Retail",
    subtitle: "Products & e-commerce",
    description: "We offer quality products with fast delivery. Customers can browse our catalog, place orders, track deliveries, and process returns easily.",
    services: ["Product Sales", "Deliveries", "Returns", "Orders"],
    keywords: ["order", "price", "stock", "delivery", "return", "available"],
    personality: "friendly",
    color: "purple",
  },
  {
    id: "hospitality",
    icon: Hotel,
    title: "Hospitality",
    subtitle: "Hotels & tourism",
    description: "We provide excellent accommodation and hospitality services. Guests can make reservations, request room service, book events, and arrange tours.",
    services: ["Bookings", "Room Service", "Events", "Tours"],
    keywords: ["book", "reservation", "room", "available", "price", "check-in"],
    personality: "friendly",
    color: "amber",
  },
  {
    id: "healthcare",
    icon: Stethoscope,
    title: "Healthcare",
    subtitle: "Medical practice",
    description: "We provide professional healthcare services. Patients can book appointments, request consultations, and get information about our medical services.",
    services: ["Appointments", "Consultations", "Referrals"],
    keywords: ["appointment", "doctor", "available", "consultation", "prescription"],
    personality: "professional",
    color: "red",
  },
  {
    id: "professional_services",
    icon: Scale,
    title: "Professional",
    subtitle: "Legal, accounting, etc.",
    description: "We offer professional consulting services. Clients can book consultations, request quotations, and get expert advice for their needs.",
    services: ["Consultations", "Quotations", "Appointments"],
    keywords: ["consultation", "quote", "appointment", "service", "price"],
    personality: "professional",
    color: "cyan",
  },
  {
    id: "general",
    icon: Building2,
    title: "Other",
    subtitle: "General business",
    description: "",
    services: [],
    keywords: ["help", "info", "price", "available", "appointment"],
    personality: "professional",
    color: "gray",
  },
];

export function BusinessProfileStep({
  tenantId,
  onNext,
  onSkip,
}: BusinessProfileStepProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const updateSettings = useMutation(api.settings.updateSettings);

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

  // Quick select handler - one click to save and continue
  const handleQuickSelect = async (templateId: string) => {
    setSelectedIndustry(templateId);

    // Auto-save after a brief delay for visual feedback
    setSaving(true);
    try {
      const template = INDUSTRY_TEMPLATES.find((t) => t.id === templateId);
      await updateSettings({
        tenantId,
        industry: templateId,
        businessDescription: template?.description || undefined,
        servicesOffered: template?.services || [],
        activationKeywords: template?.keywords || [],
        aiPersonality: template?.personality || "professional",
      });
      toast.success(`${template?.title} profile applied!`);
      // Small delay for visual feedback before moving on
      setTimeout(() => onNext(), 300);
    } catch (error) {
      toast.error("Failed to save profile");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-white mb-2">
          Pick your industry
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          One tap and your AI is ready. We'll configure everything automatically.
        </p>
      </div>

      {/* Industry Selection - Now with instant setup */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {INDUSTRY_TEMPLATES.map((template) => {
          const isSelected = selectedIndustry === template.id;
          const isProcessing = isSelected && saving;
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "bg-emerald-500/10 border-emerald-500"
                  : "bg-gray-800/50 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800/70"
              } ${isProcessing ? "pointer-events-none" : ""}`}
              onClick={() => !saving && handleQuickSelect(template.id)}
            >
              <CardContent className="p-4 text-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 ${getColorClasses(
                    template.color,
                    isSelected
                  )}`}
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <template.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <h3 className="text-white font-medium text-sm">{template.title}</h3>
                  {isSelected && !isProcessing && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{template.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* What gets configured - Shows when nothing selected */}
      {!selectedIndustry && (
        <div className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
          <p className="text-sm text-gray-400 text-center">
            Picking an industry auto-configures: AI personality, keywords, services, and conversation style
          </p>
        </div>
      )}

      {/* Skip option */}
      <div className="flex justify-center pt-2">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-gray-500 hover:text-gray-300 text-sm"
          disabled={saving}
        >
          Skip - I'll set this up later
        </Button>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-gray-500">
        Add your business name in Settings after setup
      </p>
    </div>
  );
}

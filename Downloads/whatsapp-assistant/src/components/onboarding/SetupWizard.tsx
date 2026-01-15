"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, CheckCircle2 } from "lucide-react";

import { WelcomeStep } from "./steps/WelcomeStep";
import { BusinessProfileStep } from "./steps/BusinessProfileStep";
import { CreateInstanceStep } from "./steps/CreateInstanceStep";
import { ScanQRStep } from "./steps/ScanQRStep";
import { ConfigureAgentStep } from "./steps/ConfigureAgentStep";
import { TestAIStep } from "./steps/TestAIStep";

interface SetupWizardProps {
  tenantId: Id<"tenants">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep?: number;
}

const STEPS = [
  { id: 0, title: "Welcome", description: "Get started with MyChatFlow" },
  { id: 1, title: "Business Profile", description: "Tell us about your business" },
  { id: 2, title: "Create Instance", description: "Set up your WhatsApp instance" },
  { id: 3, title: "Connect WhatsApp", description: "Scan QR code to link" },
  { id: 4, title: "Configure AI", description: "Choose when AI responds" },
  { id: 5, title: "Test AI", description: "Try your AI assistant" },
];

export function SetupWizard({
  tenantId,
  open,
  onOpenChange,
  initialStep = 0,
}: SetupWizardProps) {
  const instances = useQuery(api.instances.listInstances, { tenantId });
  const completeOnboarding = useMutation(api.tenants.completeOnboarding);
  const updateStep = useMutation(api.tenants.updateOnboardingStep);

  // Clamp initialStep to valid range (0 to STEPS.length - 1)
  const safeInitialStep = Math.min(Math.max(0, initialStep), STEPS.length - 1);
  const [currentStep, setCurrentStep] = useState(safeInitialStep);
  const [createdInstanceId, setCreatedInstanceId] = useState<string | null>(null);

  // Find connected instance
  const connectedInstance = instances?.find(i => i.status === "connected");
  const latestInstance = instances?.[0];

  useEffect(() => {
    // Auto-advance based on actual progress
    if (instances && instances.length > 0 && currentStep === 2) {
      setCurrentStep(3); // Skip Create Instance if already have one
    }
    if (connectedInstance && currentStep === 3) {
      setCurrentStep(4); // Move to Configure AI step
    }
  }, [instances, connectedInstance, currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateStep({ tenantId, step: nextStep });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    await completeOnboarding({ tenantId });
    onOpenChange(false);
  };

  const handleInstanceCreated = (instanceId: string) => {
    setCreatedInstanceId(instanceId);
    handleNext();
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={handleNext} />;
      case 1:
        return (
          <BusinessProfileStep
            tenantId={tenantId}
            onNext={handleNext}
            onSkip={handleNext}
          />
        );
      case 2:
        return (
          <CreateInstanceStep
            tenantId={tenantId}
            onInstanceCreated={handleInstanceCreated}
            onSkip={() => setCurrentStep(3)}
          />
        );
      case 3:
        return (
          <ScanQRStep
            instanceId={createdInstanceId || latestInstance?.instanceId || ""}
            onConnected={handleNext}
            onSkip={handleNext}
          />
        );
      case 4:
        return (
          <ConfigureAgentStep
            tenantId={tenantId}
            onNext={handleNext}
            onSkip={handleNext}
          />
        );
      case 5:
        return (
          <TestAIStep
            tenantId={tenantId}
            instanceId={createdInstanceId || latestInstance?.instanceId || ""}
            onComplete={handleComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <span className="text-xl">🚀</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {STEPS[currentStep].title}
                </h2>
                <p className="text-sm text-gray-400">
                  {STEPS[currentStep].description}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-2 bg-gray-800" />
            <div className="flex justify-between">
              {STEPS.map((step, idx) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-1.5 text-xs ${
                    idx <= currentStep ? "text-emerald-400" : "text-gray-600"
                  }`}
                >
                  {idx < currentStep ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium ${
                        idx === currentStep
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-700 text-gray-500"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  )}
                  <span className="hidden sm:inline">{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">{renderStep()}</div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="text-gray-400 hover:text-white"
          >
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-300"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}



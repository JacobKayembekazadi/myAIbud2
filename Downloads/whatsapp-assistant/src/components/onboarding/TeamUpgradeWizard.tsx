"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Users, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface TeamUpgradeWizardProps {
  tenantId: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Step = 0 | 1 | 2 | 3;

export default function TeamUpgradeWizard({
  tenantId,
  open,
  onOpenChange,
  onSuccess,
}: TeamUpgradeWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState<"team" | "partnership">("team");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isUpgrading, setIsUpgrading] = useState(false);

  const upgradeToTeam = useMutation(api.tenants.upgradeToTeam);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleUpgrade = async () => {
    if (!organizationName.trim()) {
      toast.error("Please enter an organization name");
      return;
    }

    setIsUpgrading(true);
    try {
      await upgradeToTeam({
        tenantId,
        organizationName: organizationName.trim(),
      });

      toast.success("Successfully upgraded to team account!");
      setCurrentStep(3); // Go to success step

      // Redirect after short delay
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to upgrade:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upgrade account");
    } finally {
      setIsUpgrading(false);
    }
  };

  const steps = [
    {
      title: "Choose Organization Type",
      description: "Select the type that best fits your needs",
      icon: Building2,
    },
    {
      title: "Name Your Organization",
      description: "What should we call your team?",
      icon: Users,
    },
    {
      title: "Review & Confirm",
      description: "Review what will be migrated",
      icon: CheckCircle2,
    },
    {
      title: "Success!",
      description: "Your team account is ready",
      icon: Sparkles,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
          <DialogDescription className="text-gray-400">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.slice(0, 3).map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStep
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStep ? "bg-emerald-600" : "bg-gray-800"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div
                onClick={() => setOrganizationType("team")}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  organizationType === "team"
                    ? "border-emerald-600 bg-emerald-600/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Team</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      Perfect for businesses with multiple customer service agents. Admin
                      manages everything, agents handle assigned contacts.
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Hierarchical structure (admin + agents)</li>
                      <li>• Contact assignment and delegation</li>
                      <li>• Shared credit pool</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setOrganizationType("partnership")}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  organizationType === "partnership"
                    ? "border-emerald-600 bg-emerald-600/10"
                    : "border-gray-700 hover:border-gray-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Partnership</h3>
                    <p className="text-gray-400 text-sm mb-3">
                      For equal partners working together. Both have full admin access,
                      separate WhatsApp numbers, shared subscription.
                    </p>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Equal partnership (multiple admins)</li>
                      <li>• Private & shared instances</li>
                      <li>• Shared billing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  placeholder="e.g., Acme Corp, Smith & Partners"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  This will be visible to all team members
                </p>
              </div>

              <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">
                  💡 Pro Tip
                </h4>
                <p className="text-sm text-gray-400">
                  Choose a name that reflects your business. You can change this later in
                  organization settings.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Organization Type</span>
                  <span className="text-white font-medium capitalize">
                    {organizationType}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Organization Name</span>
                  <span className="text-white font-medium">{organizationName}</span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white">What will be migrated:</h4>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>All your contacts and conversations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>WhatsApp instances and settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>Campaigns and quick replies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>You'll become the organization admin</span>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-600/10 border border-amber-600/30 rounded-lg p-4">
                <p className="text-sm text-amber-400">
                  ⚠️ This action cannot be undone. Your account will be permanently
                  converted to a team workspace.
                </p>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-600/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Welcome to Team Mode!
              </h3>
              <p className="text-gray-400 text-center mb-6 max-w-md">
                Your account has been successfully upgraded. You can now invite team
                members and start collaborating.
              </p>
              <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-4 w-full max-w-md">
                <h4 className="text-sm font-medium text-emerald-400 mb-2">
                  What's Next?
                </h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Invite team members from the Team page</li>
                  <li>• Assign contacts to agents</li>
                  <li>• Set up shared instances</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep < 3 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <Button
              variant="ghost"
              onClick={() => currentStep === 0 ? onOpenChange(false) : handleBack()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 0 ? "Cancel" : "Back"}
            </Button>

            {currentStep < 2 ? (
              <Button
                onClick={handleNext}
                disabled={currentStep === 1 && !organizationName.trim()}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isUpgrading ? "Upgrading..." : "Upgrade to Team"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

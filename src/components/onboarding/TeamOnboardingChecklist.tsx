"use client";

import { CheckCircle2, Circle, UserPlus, Users2, Share2, Settings2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface TeamOnboardingChecklistProps {
  organizationId: any;
  stats: {
    totalMembers: number;
    totalContacts: number;
    totalInstances: number;
  };
  onDismiss?: () => void;
}

export default function TeamOnboardingChecklist({
  organizationId,
  stats,
  onDismiss,
}: TeamOnboardingChecklistProps) {
  const router = useRouter();

  const checklistItems = [
    {
      id: "invite-members",
      label: "Invite team members",
      description: "Add agents to help manage customer conversations",
      completed: stats.totalMembers > 1,
      icon: UserPlus,
      action: () => router.push("/team"),
      actionLabel: "Go to Team",
    },
    {
      id: "assign-contacts",
      label: "Assign contacts to agents",
      description: "Delegate contacts to specific team members",
      completed: false, // Would need additional tracking
      icon: Users2,
      action: () => router.push("/contacts"),
      actionLabel: "Manage Contacts",
    },
    {
      id: "shared-instances",
      label: "Set up shared instances",
      description: "Configure WhatsApp instances for team access",
      completed: stats.totalInstances > 0,
      icon: Share2,
      action: () => router.push("/instances"),
      actionLabel: "View Instances",
    },
    {
      id: "permissions",
      label: "Configure team permissions",
      description: "Set roles and access levels for members",
      completed: false,
      icon: Settings2,
      action: () => router.push("/organization"),
      actionLabel: "Organization Settings",
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const progressPercent = (completedCount / checklistItems.length) * 100;

  return (
    <div className="bg-gradient-to-br from-emerald-600/10 to-blue-600/10 border border-emerald-600/30 rounded-lg p-6 relative">
      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          aria-label="Dismiss checklist"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          🎉 Welcome to Team Mode!
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          Complete these steps to get the most out of your team workspace
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              {completedCount} of {checklistItems.length} completed
            </span>
            <span className="text-emerald-400 font-medium">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {checklistItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                item.completed
                  ? "bg-emerald-600/10 border border-emerald-600/30"
                  : "bg-gray-800/50 border border-gray-700 hover:border-gray-600"
              }`}
            >
              {/* Icon & Checkbox */}
              <div className="flex-shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      item.completed
                        ? "bg-emerald-600/20"
                        : "bg-gray-700"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        item.completed ? "text-emerald-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-medium ${
                        item.completed ? "text-emerald-400" : "text-white"
                      }`}
                    >
                      {item.label}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!item.completed && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={item.action}
                  className="flex-shrink-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-600/10"
                >
                  {item.actionLabel}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedCount === checklistItems.length && (
        <div className="mt-4 p-4 bg-emerald-600/10 border border-emerald-600/30 rounded-lg">
          <p className="text-sm text-emerald-400 text-center">
            ✨ Great job! You've completed all onboarding steps.
          </p>
        </div>
      )}
    </div>
  );
}

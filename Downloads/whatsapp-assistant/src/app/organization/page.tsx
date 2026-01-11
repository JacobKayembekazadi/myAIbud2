"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, CreditCard, Settings, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function OrganizationPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");

  // Redirect if not a team account
  if (tenant && tenant.accountType !== "team") {
    router.push("/settings");
    return null;
  }

  if (!tenant || !tenant.organizationId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return <OrganizationPageContent organizationId={tenant.organizationId} />;
}

function OrganizationPageContent({ organizationId }: { organizationId: any }) {
  const organization = useQuery(api.organizations.getOrganizationWithStats, { organizationId });
  const myMembership = useQuery(api.teamMembers.getMyMembership, { organizationId });
  const assignmentStats = useQuery(api.contacts.getAssignmentStats, { organizationId });

  if (!organization || !myMembership) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading organization...</div>
      </div>
    );
  }

  const isAdmin = myMembership.role === "admin";

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Organization Settings</h1>
          <p className="text-gray-400">Manage your organization profile and subscription</p>
        </div>

        {/* Organization Profile */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Profile</h2>
          </div>

          <OrganizationProfileForm organization={organization} isAdmin={isAdmin} />
        </div>

        {/* Subscription & Credits */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Subscription</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <div>
                <div className="text-sm text-gray-400">Current Plan</div>
                <div className="text-lg font-semibold text-white capitalize">{organization.tier}</div>
              </div>
              {isAdmin && (
                <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  Upgrade Plan
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Credits Used</div>
                <div className="text-2xl font-bold text-white">{organization.creditsUsed}</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Credits Remaining</div>
                <div className="text-2xl font-bold text-emerald-400">
                  {organization.stats.creditsRemaining}
                </div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Credit Limit</div>
                <div className="text-2xl font-bold text-white">{organization.creditsLimit}</div>
              </div>
            </div>

            {/* Usage Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Usage this period</span>
                <span className="text-sm font-medium text-white">
                  {organization.stats.creditsUsagePercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.min(organization.stats.creditsUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-gray-500">
              Period: {new Date(organization.periodStart).toLocaleDateString()} -{" "}
              {new Date(organization.periodEnd).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Team Analytics */}
        {assignmentStats && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">Team Analytics</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Contacts</div>
                <div className="text-2xl font-bold text-white">{assignmentStats.total}</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Assigned</div>
                <div className="text-2xl font-bold text-emerald-400">{assignmentStats.assigned}</div>
              </div>
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Unassigned</div>
                <div className="text-2xl font-bold text-amber-400">{assignmentStats.unassigned}</div>
              </div>
            </div>

            {/* Agent Workload */}
            {assignmentStats.byAgent.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Agent Workload</h3>
                <div className="space-y-3">
                  {assignmentStats.byAgent.map((agent) => (
                    <div key={agent.memberId} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {agent.memberName}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-gray-400">{agent.contactCount} contacts</div>
                        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${(agent.contactCount / assignmentStats.total) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OrganizationProfileForm({
  organization,
  isAdmin,
}: {
  organization: any;
  isAdmin: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(organization.name);
  const [isSaving, setIsSaving] = useState(false);

  const updateOrganization = useMutation(api.organizations.updateOrganization);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateOrganization({
        organizationId: organization._id,
        name,
      });
      setIsEditing(false);
      toast.success("Organization updated successfully");
    } catch (error) {
      console.error("Failed to update organization:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update organization");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(organization.name);
    setIsEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="org-name" className="text-gray-300">
          Organization Name
        </Label>
        {isEditing && isAdmin ? (
          <Input
            id="org-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
          />
        ) : (
          <div className="text-white font-medium">{organization.name}</div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Organization Type</Label>
        <div className="text-white capitalize">{organization.type}</div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Created</Label>
        <div className="text-gray-400">
          {new Date(organization.createdAt).toLocaleDateString()}
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Edit Profile
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserPlus, MoreVertical, Shield, Users as UsersIcon, Eye, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TeamPage() {
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

  return <TeamPageContent organizationId={tenant.organizationId} />;
}

function TeamPageContent({ organizationId }: { organizationId: any }) {
  const members = useQuery(api.teamMembers.listMembers, {
    organizationId,
    includeInvited: true,
  });
  const myMembership = useQuery(api.teamMembers.getMyMembership, { organizationId });
  const orgWithStats = useQuery(api.organizations.getOrganizationWithStats, { organizationId });

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  if (!members || !myMembership || !orgWithStats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading team...</div>
      </div>
    );
  }

  const isAdmin = myMembership.role === "admin";

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingInvites = members.filter((m) => m.status === "invited");

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{orgWithStats.name}</h1>
              <p className="text-gray-400">Manage your team members and permissions</p>
            </div>
            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <InviteMemberDialog
                  organizationId={organizationId}
                  onClose={() => setInviteDialogOpen(false)}
                />
              </Dialog>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Team Members</div>
              <div className="text-2xl font-bold text-white">{orgWithStats.stats.totalMembers}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Total Contacts</div>
              <div className="text-2xl font-bold text-white">{orgWithStats.stats.totalContacts}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Instances</div>
              <div className="text-2xl font-bold text-white">{orgWithStats.stats.totalInstances}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <div className="text-gray-400 text-sm mb-1">Credits Remaining</div>
              <div className="text-2xl font-bold text-emerald-400">
                {orgWithStats.stats.creditsRemaining}
              </div>
            </div>
          </div>
        </div>

        {/* Active Members Table */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden mb-6">
          <div className="p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-emerald-500" />
              Active Members ({activeMembers.length})
            </h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800 hover:bg-gray-800/50">
                <TableHead className="text-gray-400">Name</TableHead>
                <TableHead className="text-gray-400">Email</TableHead>
                <TableHead className="text-gray-400">Role</TableHead>
                <TableHead className="text-gray-400">Joined</TableHead>
                <TableHead className="text-gray-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.map((member) => (
                <TableRow key={member._id} className="border-gray-800 hover:bg-gray-800/50">
                  <TableCell className="text-white font-medium">
                    {member.name || "—"}
                  </TableCell>
                  <TableCell className="text-gray-400">{member.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} />
                  </TableCell>
                  <TableCell className="text-gray-400">
                    {member.joinedAt
                      ? new Date(member.joinedAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && member._id !== myMembership._id && (
                      <MemberActionsMenu member={member} organizationId={organizationId} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                Pending Invitations ({pendingInvites.length})
              </h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-gray-800/50">
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Role</TableHead>
                  <TableHead className="text-gray-400">Invited</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingInvites.map((member) => (
                  <TableRow key={member._id} className="border-gray-800 hover:bg-gray-800/50">
                    <TableCell className="text-gray-400">{member.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={member.role} />
                    </TableCell>
                    <TableCell className="text-gray-400">
                      {member.invitedAt
                        ? new Date(member.invitedAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          Cancel Invite
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: "admin" | "agent" | "viewer" }) {
  const variants = {
    admin: {
      icon: Shield,
      className: "bg-amber-600/20 text-amber-400 border-amber-600/30",
      label: "Admin",
    },
    agent: {
      icon: UsersIcon,
      className: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30",
      label: "Agent",
    },
    viewer: {
      icon: Eye,
      className: "bg-blue-600/20 text-blue-400 border-blue-600/30",
      label: "Viewer",
    },
  };

  const variant = variants[role];
  const Icon = variant.icon;

  return (
    <Badge className={`${variant.className} border text-xs`}>
      <Icon className="w-3 h-3 mr-1" />
      {variant.label}
    </Badge>
  );
}

function InviteMemberDialog({
  organizationId,
  onClose,
}: {
  organizationId: any;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inviteMember = useMutation(api.teamMembers.inviteMember);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await inviteMember({
        organizationId,
        email,
        role,
      });
      onClose();
      setEmail("");
      setRole("agent");
    } catch (error) {
      console.error("Failed to invite member:", error);
      alert(error instanceof Error ? error.message : "Failed to invite member");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="bg-gray-900 border-gray-800 text-white">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription className="text-gray-400">
            Send an invitation to join your organization
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                <SelectItem value="agent">Agent - Can manage assigned contacts</SelectItem>
                <SelectItem value="admin">Admin - Full access to everything</SelectItem>
                <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSubmitting ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function MemberActionsMenu({ member, organizationId }: { member: any; organizationId: any }) {
  const removeMember = useMutation(api.teamMembers.removeMember);
  const suspendMember = useMutation(api.teamMembers.suspendMember);

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.email} from the organization?`)) return;

    try {
      await removeMember({ memberId: member._id });
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert(error instanceof Error ? error.message : "Failed to remove member");
    }
  };

  const handleSuspend = async () => {
    if (!confirm(`Suspend ${member.email}?`)) return;

    try {
      await suspendMember({ memberId: member._id });
    } catch (error) {
      console.error("Failed to suspend member:", error);
      alert(error instanceof Error ? error.message : "Failed to suspend member");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-800 border-gray-700 text-white">
        <DropdownMenuItem
          onClick={handleSuspend}
          className="hover:bg-gray-700 cursor-pointer"
        >
          Suspend Member
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleRemove}
          className="hover:bg-red-600/20 text-red-400 cursor-pointer"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remove Member
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

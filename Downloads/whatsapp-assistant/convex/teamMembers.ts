import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Invite a team member to an organization
 * Generates an invite token for the new member to accept
 */
export const inviteMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("agent"), v.literal("viewer")),
    permissions: v.optional(
      v.object({
        canManageTeam: v.boolean(),
        canManageInstances: v.boolean(),
        canViewAllContacts: v.boolean(),
        canExportData: v.boolean(),
        canManageBilling: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify inviter is an admin
    const inviter = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", args.organizationId)
      )
      .first();

    if (!inviter || inviter.role !== "admin") {
      throw new Error("Only admins can invite team members");
    }

    // Check if user is already a member
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (existing) {
      throw new Error("User is already a member of this organization");
    }

    // Generate invite token
    const inviteToken = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    const now = Date.now();

    // Set default permissions based on role
    const defaultPermissions = {
      canManageTeam: args.role === "admin",
      canManageInstances: args.role !== "viewer",
      canViewAllContacts: args.role === "admin",
      canExportData: args.role !== "viewer",
      canManageBilling: args.role === "admin",
    };

    const memberId = await ctx.db.insert("teamMembers", {
      organizationId: args.organizationId,
      clerkId: "", // Will be filled when they accept
      email: args.email,
      name: undefined,
      role: args.role,
      status: "invited",
      invitedBy: inviter._id,
      inviteToken,
      invitedAt: now,
      permissions: args.permissions || defaultPermissions,
      createdAt: now,
      updatedAt: now,
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${inviteToken}`;

    // Note: Email sending is handled by the frontend after successful invitation
    // The frontend will trigger the Inngest "team.member.invited" event
    // See: src/inngest/functions/send-invite-email.ts

    return {
      memberId,
      inviteToken,
      inviteUrl,
      // Return data needed for email sending
      invitedEmail: args.email,
      role: args.role,
    };
  },
});

/**
 * Accept an invitation to join an organization
 * Called when a user clicks the invite link
 */
export const acceptInvite = mutation({
  args: {
    inviteToken: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Find the invitation
    const invitation = await ctx.db
      .query("teamMembers")
      .withIndex("by_invite_token", (q) => q.eq("inviteToken", args.inviteToken))
      .first();

    if (!invitation) {
      throw new Error("Invalid or expired invite token");
    }

    if (invitation.status !== "invited") {
      throw new Error("Invitation has already been accepted or is no longer valid");
    }

    // Update the member record with Clerk ID
    await ctx.db.patch(invitation._id, {
      clerkId: identity.subject,
      name: identity.name,
      status: "active",
      joinedAt: Date.now(),
      inviteToken: undefined, // Clear the token
      updatedAt: Date.now(),
    });

    return {
      success: true,
      organizationId: invitation.organizationId,
    };
  },
});

/**
 * Cancel a pending team invitation
 * Deletes the invitation record before it's been accepted
 */
export const cancelInvite = mutation({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Invitation not found");

    // Verify requester is an admin of this organization
    const requester = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q
          .eq("clerkId", identity.subject)
          .eq("organizationId", targetMember.organizationId)
      )
      .first();

    if (!requester || requester.role !== "admin") {
      throw new Error("Only admins can cancel invitations");
    }

    // Verify the member is still in invited status
    if (targetMember.status !== "invited") {
      throw new Error("Cannot cancel invitation that has already been accepted or is no longer pending");
    }

    // Delete the invitation
    await ctx.db.delete(args.memberId);

    return { success: true };
  },
});

/**
 * List all team members of an organization
 */
export const listMembers = query({
  args: {
    organizationId: v.id("organizations"),
    includeInvited: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify user is a member of this organization
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", args.organizationId)
      )
      .first();

    if (!member || member.status !== "active") {
      throw new Error("Unauthorized");
    }

    // Get all members
    let query = ctx.db
      .query("teamMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId));

    const members = await query.collect();

    // Filter based on includeInvited flag
    if (!args.includeInvited) {
      return members.filter((m) => m.status === "active");
    }

    return members;
  },
});

/**
 * Get current user's membership in an organization
 */
export const getMyMembership = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", args.organizationId)
      )
      .first();

    return member;
  },
});

/**
 * Update a team member's role or permissions
 */
export const updateMember = mutation({
  args: {
    memberId: v.id("teamMembers"),
    role: v.optional(v.union(v.literal("admin"), v.literal("agent"), v.literal("viewer"))),
    permissions: v.optional(
      v.object({
        canManageTeam: v.boolean(),
        canManageInstances: v.boolean(),
        canViewAllContacts: v.boolean(),
        canExportData: v.boolean(),
        canManageBilling: v.boolean(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Member not found");

    // Verify requester is an admin of this organization
    const requester = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q
          .eq("clerkId", identity.subject)
          .eq("organizationId", targetMember.organizationId)
      )
      .first();

    if (!requester || requester.role !== "admin") {
      throw new Error("Only admins can update team members");
    }

    const updates: any = { updatedAt: Date.now() };
    if (args.role) updates.role = args.role;
    if (args.permissions) updates.permissions = args.permissions;

    await ctx.db.patch(args.memberId, updates);

    return { success: true };
  },
});

/**
 * Remove a team member from an organization
 */
export const removeMember = mutation({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Member not found");

    const org = await ctx.db.get(targetMember.organizationId);
    if (!org) throw new Error("Organization not found");

    // Verify requester is an admin
    const requester = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q
          .eq("clerkId", identity.subject)
          .eq("organizationId", targetMember.organizationId)
      )
      .first();

    if (!requester || requester.role !== "admin") {
      throw new Error("Only admins can remove team members");
    }

    // Prevent removing the organization owner (last admin)
    if (targetMember.clerkId === org.ownerClerkId) {
      const admins = await ctx.db
        .query("teamMembers")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .filter((q) => q.eq(q.field("role"), "admin"))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect();

      if (admins.length <= 1) {
        throw new Error("Cannot remove the last admin of the organization");
      }
    }

    // Delete the member
    await ctx.db.delete(args.memberId);

    return { success: true };
  },
});

/**
 * Suspend a team member (soft delete)
 */
export const suspendMember = mutation({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Member not found");

    // Verify requester is an admin
    const requester = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q
          .eq("clerkId", identity.subject)
          .eq("organizationId", targetMember.organizationId)
      )
      .first();

    if (!requester || requester.role !== "admin") {
      throw new Error("Only admins can suspend team members");
    }

    await ctx.db.patch(args.memberId, {
      status: "suspended",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Reactivate a suspended team member
 */
export const reactivateMember = mutation({
  args: { memberId: v.id("teamMembers") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const targetMember = await ctx.db.get(args.memberId);
    if (!targetMember) throw new Error("Member not found");

    // Verify requester is an admin
    const requester = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q
          .eq("clerkId", identity.subject)
          .eq("organizationId", targetMember.organizationId)
      )
      .first();

    if (!requester || requester.role !== "admin") {
      throw new Error("Only admins can reactivate team members");
    }

    await ctx.db.patch(args.memberId, {
      status: "active",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

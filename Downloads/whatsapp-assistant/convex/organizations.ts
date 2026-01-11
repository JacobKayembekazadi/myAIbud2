import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a new organization
 * Used when a user wants to create a team workspace
 */
export const createOrganization = mutation({
  args: {
    name: v.string(),
    type: v.union(v.literal("solo"), v.literal("team"), v.literal("partnership")),
    tier: v.string(), // "starter", "pro", "enterprise"
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const now = Date.now();
    const periodDuration = 30 * 24 * 60 * 60 * 1000; // 30 days

    // Determine credit limit based on tier
    let creditsLimit = 400; // starter
    if (args.tier === "pro") creditsLimit = 2000;
    if (args.tier === "enterprise") creditsLimit = 10000;

    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      type: args.type,
      ownerClerkId: identity.subject,
      tier: args.tier,
      creditsLimit,
      creditsUsed: 0,
      periodStart: now,
      periodEnd: now + periodDuration,
      createdAt: now,
      updatedAt: now,
    });

    return organizationId;
  },
});

/**
 * Get organization by ID
 */
export const getOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    return org;
  },
});

/**
 * Get organizations where the current user is a member
 */
export const listMyOrganizations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // Find all team memberships for this user
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get the organizations
    const organizations = await Promise.all(
      memberships.map((m) => ctx.db.get(m.organizationId))
    );

    return organizations.filter((org) => org !== null);
  },
});

/**
 * Update organization settings
 */
export const updateOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.optional(v.string()),
    tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // Verify user is an admin of this organization
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", args.organizationId)
      )
      .first();

    if (!member || member.role !== "admin") {
      throw new Error("Only admins can update organization settings");
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name) updates.name = args.name;
    if (args.tier) {
      updates.tier = args.tier;
      // Update credit limit based on new tier
      if (args.tier === "starter") updates.creditsLimit = 400;
      if (args.tier === "pro") updates.creditsLimit = 2000;
      if (args.tier === "enterprise") updates.creditsLimit = 10000;
    }

    await ctx.db.patch(args.organizationId, updates);

    return { success: true };
  },
});

/**
 * Get organization with usage stats
 */
export const getOrganizationWithStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    // Count team members
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Count contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    // Count instances
    const instances = await ctx.db
      .query("instances")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    return {
      ...org,
      stats: {
        totalMembers: members.length,
        totalContacts: contacts.length,
        totalInstances: instances.length,
        creditsRemaining: org.creditsLimit - org.creditsUsed,
        creditsUsagePercent: (org.creditsUsed / org.creditsLimit) * 100,
      },
    };
  },
});

/**
 * Track credit usage for an organization
 */
export const trackCreditUsage = mutation({
  args: {
    organizationId: v.id("organizations"),
    creditsUsed: v.number(),
    action: v.string(),
  },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const newCreditsUsed = org.creditsUsed + args.creditsUsed;

    // Check if over limit
    if (newCreditsUsed > org.creditsLimit) {
      throw new Error("Credit limit exceeded");
    }

    await ctx.db.patch(args.organizationId, {
      creditsUsed: newCreditsUsed,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      remaining: org.creditsLimit - newCreditsUsed,
    };
  },
});

/**
 * Check if organization has available credits
 */
export const checkCredits = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const org = await ctx.db.get(args.organizationId);
    if (!org) throw new Error("Organization not found");

    const remaining = org.creditsLimit - org.creditsUsed;
    return {
      hasCredits: remaining > 0,
      remaining,
      limit: org.creditsLimit,
      used: org.creditsUsed,
    };
  },
});

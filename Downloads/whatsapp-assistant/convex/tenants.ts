import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { BILLING_CONFIG, getCreditsLimit } from "./config";

export const getOrCreateTenant = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tenants")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const now = Date.now();
    return await ctx.db.insert("tenants", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      tier: "starter",
      onboardingCompleted: false,
      onboardingStep: 0,
      hasCreatedInstance: false,
      hasConnectedWhatsApp: false,
      hasSyncedContacts: false,
      hasTestedAI: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getTenant = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tenants")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Onboarding mutations
export const updateOnboardingStep = mutation({
  args: {
    tenantId: v.id("tenants"),
    step: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      onboardingStep: args.step,
      updatedAt: Date.now(),
    });
  },
});

export const markInstanceCreated = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      hasCreatedInstance: true,
      onboardingStep: 1,
      updatedAt: Date.now(),
    });
  },
});

export const markWhatsAppConnected = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      hasConnectedWhatsApp: true,
      onboardingStep: 2,
      updatedAt: Date.now(),
    });
  },
});

export const markContactsSynced = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      hasSyncedContacts: true,
      onboardingStep: 3,
      updatedAt: Date.now(),
    });
  },
});

export const markAITested = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      hasTestedAI: true,
      onboardingStep: 3, // Keep at last valid step (0-3), completion tracked by onboardingCompleted
      updatedAt: Date.now(),
    });
  },
});

export const completeOnboarding = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      onboardingCompleted: true,
      onboardingStep: 3, // Keep at last valid step (0-3)
      updatedAt: Date.now(),
    });
  },
});

export const resetOnboarding = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      onboardingCompleted: false,
      onboardingStep: 0,
      hasCreatedInstance: false,
      hasConnectedWhatsApp: false,
      hasSyncedContacts: false,
      hasTestedAI: false,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Upgrade a solo tenant account to a team organization
 * Creates an organization and converts all tenant data to belong to it
 */
export const upgradeToTeam = mutation({
  args: {
    tenantId: v.id("tenants"),
    organizationName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("Tenant not found");

    // Verify ownership
    if (tenant.clerkId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    // Check if already upgraded
    if (tenant.organizationId) {
      throw new Error("Account has already been upgraded to team");
    }

    const now = Date.now();
    const creditsLimit = getCreditsLimit(tenant.tier);

    // Create organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.organizationName,
      type: "team",
      ownerClerkId: tenant.clerkId,
      tier: tenant.tier,
      creditsLimit,
      creditsUsed: 0,
      periodStart: now,
      periodEnd: now + BILLING_CONFIG.periodDurationMs,
      createdAt: now,
      updatedAt: now,
    });

    // Create team member record for the owner (admin)
    await ctx.db.insert("teamMembers", {
      organizationId,
      clerkId: tenant.clerkId,
      email: tenant.email,
      name: tenant.name,
      role: "admin",
      status: "active",
      joinedAt: now,
      permissions: {
        canManageTeam: true,
        canManageInstances: true,
        canViewAllContacts: true,
        canExportData: true,
        canManageBilling: true,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Link tenant to organization
    await ctx.db.patch(args.tenantId, {
      organizationId,
      accountType: "team",
      updatedAt: now,
    });

    // Migrate all contacts to organization
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const contact of contacts) {
      await ctx.db.patch(contact._id, {
        organizationId,
      });
    }

    // Migrate all instances to organization
    const instances = await ctx.db
      .query("instances")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const instance of instances) {
      await ctx.db.patch(instance._id, {
        organizationId,
        visibility: "shared", // Default to shared for upgraded accounts
      });
    }

    // Migrate all interactions to organization
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const interaction of interactions) {
      await ctx.db.patch(interaction._id, {
        organizationId,
      });
    }

    // Migrate all campaigns to organization
    const campaigns = await ctx.db
      .query("campaigns")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const campaign of campaigns) {
      await ctx.db.patch(campaign._id, {
        organizationId,
      });
    }

    // Migrate settings to organization
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (settings) {
      await ctx.db.patch(settings._id, {
        organizationId,
      });
    }

    // Migrate quick replies to organization
    const quickReplies = await ctx.db
      .query("quickReplies")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    for (const reply of quickReplies) {
      await ctx.db.patch(reply._id, {
        organizationId,
      });
    }

    return {
      success: true,
      organizationId,
    };
  },
});

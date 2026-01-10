import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
      onboardingStep: 4,
      updatedAt: Date.now(),
    });
  },
});

export const completeOnboarding = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.tenantId, {
      onboardingCompleted: true,
      onboardingStep: 4,
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

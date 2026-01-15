import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { BILLING_CONFIG, SUBSCRIPTION_TIERS } from "./config";

export const getUsage = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();
  },
});

export const checkCredits = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!usage) {
      return { hasCredits: true, remaining: BILLING_CONFIG.defaultCredits };
    }

    const remaining = usage.creditsLimit - usage.creditsUsed;
    return { hasCredits: remaining > 0, remaining };
  },
});

export const decrementCredits = mutation({
  args: { tenantId: v.id("tenants"), amount: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const usage = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (!usage) {
      const now = Date.now();
      const periodEnd = now + BILLING_CONFIG.periodDurationMs;
      return await ctx.db.insert("subscriptionUsage", {
        tenantId: args.tenantId,
        creditsLimit: BILLING_CONFIG.defaultCredits,
        creditsUsed: args.amount ?? 1,
        periodStart: now,
        periodEnd,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(usage._id, {
      creditsUsed: usage.creditsUsed + (args.amount ?? 1),
      updatedAt: Date.now(),
    });
  },
});

export const initializeUsage = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscriptionUsage")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    if (existing) return existing._id;

    const now = Date.now();
    const periodEnd = now + BILLING_CONFIG.periodDurationMs;
    return await ctx.db.insert("subscriptionUsage", {
      tenantId: args.tenantId,
      creditsLimit: BILLING_CONFIG.defaultCredits,
      creditsUsed: 0,
      periodStart: now,
      periodEnd,
      createdAt: now,
      updatedAt: now,
    });
  },
});

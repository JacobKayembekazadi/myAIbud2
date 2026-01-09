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

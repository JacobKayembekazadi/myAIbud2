import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listInstances = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instances")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

export const getInstance = query({
  args: { instanceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("instances")
      .withIndex("by_instanceId", (q) => q.eq("instanceId", args.instanceId))
      .first();
  },
});

export const createInstance = mutation({
  args: {
    tenantId: v.id("tenants"),
    name: v.string(),
    instanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("instances", {
      tenantId: args.tenantId,
      name: args.name,
      instanceId: args.instanceId,
      status: "disconnected",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateInstanceStatus = mutation({
  args: {
    instanceId: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const instance = await ctx.db
      .query("instances")
      .withIndex("by_instanceId", (q) => q.eq("instanceId", args.instanceId))
      .first();

    if (instance) {
      await ctx.db.patch(instance._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }
  },
});

export const deleteInstance = mutation({
  args: {
    instanceId: v.id("instances"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.instanceId);
  },
});

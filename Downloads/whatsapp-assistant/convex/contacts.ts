import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listContacts = query({
  args: { tenantId: v.id("tenants"), instanceId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("contacts").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));
    if (args.instanceId) {
      q = q.filter((q) => q.eq(q.field("instanceId"), args.instanceId));
    }
    return await q.order("desc").collect();
  },
});

export const getContact = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contactId);
  },
});

export const upsertContact = mutation({
  args: {
    tenantId: v.id("tenants"),
    instanceId: v.string(),
    phone: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone).eq("instanceId", args.instanceId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name ?? existing.name,
        lastInteraction: now,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("contacts", {
      tenantId: args.tenantId,
      instanceId: args.instanceId,
      phone: args.phone,
      name: args.name,
      status: "new",
      lastInteraction: now,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const pauseContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

export const resumeContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, {
      status: "active",
      updatedAt: Date.now(),
    });
  },
});


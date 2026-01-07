import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getMessages = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("interactions")
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .order("asc")
      .collect();
  },
});

export const addInteraction = mutation({
  args: {
    contactId: v.id("contacts"),
    tenantId: v.id("tenants"),
    type: v.string(),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    cost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("interactions", {
      contactId: args.contactId,
      tenantId: args.tenantId,
      type: args.type,
      content: args.content,
      metadata: args.metadata,
      cost: args.cost ?? 1,
      createdAt: Date.now(),
    });
  },
});

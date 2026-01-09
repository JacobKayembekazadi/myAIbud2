import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get settings for a tenant
export const getSettings = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("settings")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .first();

        // Return defaults if no settings exist
        if (!settings) {
            return {
                autoReplyEnabled: true,
                aiModel: "gemini-1.5-flash",
                aiTemperature: 0.7,
                aiMaxTokens: 1000,
                emailNotifications: true,
                smsNotifications: false,
                defaultInstanceId: undefined,
            };
        }

        return settings;
    },
});

// Update settings
export const updateSettings = mutation({
    args: {
        tenantId: v.id("tenants"),
        autoReplyEnabled: v.optional(v.boolean()),
        defaultInstanceId: v.optional(v.string()),
        aiModel: v.optional(v.string()),
        aiTemperature: v.optional(v.number()),
        aiMaxTokens: v.optional(v.number()),
        emailNotifications: v.optional(v.boolean()),
        smsNotifications: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { tenantId, ...updates } = args;

        const existing = await ctx.db
            .query("settings")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            return await ctx.db.insert("settings", {
                tenantId,
                autoReplyEnabled: updates.autoReplyEnabled ?? true,
                aiModel: updates.aiModel ?? "gemini-1.5-flash",
                aiTemperature: updates.aiTemperature ?? 0.7,
                aiMaxTokens: updates.aiMaxTokens ?? 1000,
                emailNotifications: updates.emailNotifications ?? true,
                smsNotifications: updates.smsNotifications ?? false,
                defaultInstanceId: updates.defaultInstanceId,
                updatedAt: Date.now(),
            });
        }
    },
});

// Get quick replies
export const listQuickReplies = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quickReplies")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .collect();
    },
});

// Create quick reply
export const createQuickReply = mutation({
    args: {
        tenantId: v.id("tenants"),
        label: v.string(),
        content: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("quickReplies", {
            ...args,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Update quick reply
export const updateQuickReply = mutation({
    args: {
        id: v.id("quickReplies"),
        label: v.optional(v.string()),
        content: v.optional(v.string()),
        category: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete quick reply
export const deleteQuickReply = mutation({
    args: { id: v.id("quickReplies") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

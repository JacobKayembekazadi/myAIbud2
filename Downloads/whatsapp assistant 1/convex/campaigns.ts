import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createCampaign = mutation({
    args: {
        tenantId: v.id("tenants"),
        instanceId: v.string(),
        name: v.string(),
        message: v.string(),
        contactIds: v.array(v.id("contacts")),
        scheduledFor: v.optional(v.number()),
        status: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const campaignId = await ctx.db.insert("campaigns", {
            tenantId: args.tenantId,
            instanceId: args.instanceId,
            name: args.name,
            message: args.message,
            contactIds: args.contactIds,
            scheduledFor: args.scheduledFor,
            status: args.status || "draft",
            createdAt: Date.now(),
            sentCount: 0,
            totalContacts: args.contactIds.length,
        });
        return campaignId;
    },
});

export const listCampaigns = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("campaigns")
            .filter((q) => q.eq(q.field("tenantId"), args.tenantId))
            .order("desc")
            .collect();
    },
});

export const getCampaign = query({
    args: { campaignId: v.id("campaigns") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.campaignId);
    },
});

export const updateCampaignStatus = mutation({
    args: {
        campaignId: v.id("campaigns"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.campaignId, {
            status: args.status,
        });
    },
});

export const incrementSentCount = mutation({
    args: { campaignId: v.id("campaigns") },
    handler: async (ctx, args) => {
        const campaign = await ctx.db.get(args.campaignId);
        if (campaign) {
            await ctx.db.patch(args.campaignId, {
                sentCount: campaign.sentCount + 1,
            });
        }
    },
});

import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Get message analytics for a tenant
 * Returns counts of inbound/outbound messages over time
 */
export const getMessageAnalytics = query({
  args: {
    tenantId: v.id("tenants"),
    days: v.optional(v.number()), // Default 30 days
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    // Get all interactions in the time range
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.gte(q.field("createdAt"), startTime))
      .collect();

    // Group by day
    const dailyStats = new Map<string, { inbound: number; outbound: number }>();

    for (const interaction of interactions) {
      const date = new Date(interaction.createdAt).toISOString().split("T")[0];
      const existing = dailyStats.get(date) || { inbound: 0, outbound: 0 };

      if (interaction.type === "inbound") {
        existing.inbound++;
      } else {
        existing.outbound++;
      }

      dailyStats.set(date, existing);
    }

    // Convert to sorted array
    const dailyData = Array.from(dailyStats.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals
    const totalInbound = interactions.filter((i) => i.type === "inbound").length;
    const totalOutbound = interactions.filter((i) => i.type === "outbound").length;

    return {
      dailyData,
      totals: {
        inbound: totalInbound,
        outbound: totalOutbound,
        total: totalInbound + totalOutbound,
        avgPerDay: Math.round((totalInbound + totalOutbound) / days),
      },
    };
  },
});

/**
 * Get contact funnel analytics
 * Shows how contacts progress through stages
 */
export const getContactFunnel = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const funnel = {
      new: 0,
      active: 0,
      paused: 0,
      converted: 0,
      total: contacts.length,
    };

    for (const contact of contacts) {
      const status = contact.status || "new";
      if (status in funnel) {
        funnel[status as keyof typeof funnel]++;
      }
    }

    // Calculate conversion rates
    const conversionRate = funnel.total > 0
      ? ((funnel.converted / funnel.total) * 100).toFixed(1)
      : "0.0";

    const engagementRate = funnel.total > 0
      ? (((funnel.active + funnel.converted) / funnel.total) * 100).toFixed(1)
      : "0.0";

    return {
      funnel,
      rates: {
        conversion: conversionRate,
        engagement: engagementRate,
      },
    };
  },
});

/**
 * Get contact growth over time
 */
export const getContactGrowth = query({
  args: {
    tenantId: v.id("tenants"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Group new contacts by day
    const dailyNew = new Map<string, number>();

    for (const contact of contacts) {
      if (contact.createdAt >= startTime) {
        const date = new Date(contact.createdAt).toISOString().split("T")[0];
        dailyNew.set(date, (dailyNew.get(date) || 0) + 1);
      }
    }

    // Convert to sorted array with cumulative total
    const sortedDates = Array.from(dailyNew.entries())
      .map(([date, count]) => ({ date, newContacts: count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Add cumulative count
    let cumulative = contacts.filter((c) => c.createdAt < startTime).length;
    const growthData = sortedDates.map((item) => {
      cumulative += item.newContacts;
      return { ...item, total: cumulative };
    });

    return {
      growthData,
      summary: {
        totalContacts: contacts.length,
        newThisPeriod: sortedDates.reduce((sum, d) => sum + d.newContacts, 0),
        avgNewPerDay: Math.round(
          sortedDates.reduce((sum, d) => sum + d.newContacts, 0) / days
        ),
      },
    };
  },
});

/**
 * Get response time analytics
 * Calculates average time between inbound and outbound messages
 */
export const getResponseTimeAnalytics = query({
  args: {
    tenantId: v.id("tenants"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const now = Date.now();
    const startTime = now - days * 24 * 60 * 60 * 1000;

    // Get all contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const responseTimes: number[] = [];

    // For each contact, analyze interaction patterns
    for (const contact of contacts) {
      const interactions = await ctx.db
        .query("interactions")
        .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
        .filter((q) => q.gte(q.field("createdAt"), startTime))
        .collect();

      // Sort by time
      interactions.sort((a, b) => a.createdAt - b.createdAt);

      // Find response times (time from inbound to next outbound)
      for (let i = 0; i < interactions.length - 1; i++) {
        if (interactions[i].type === "inbound" && interactions[i + 1].type === "outbound") {
          const responseTime = interactions[i + 1].createdAt - interactions[i].createdAt;
          responseTimes.push(responseTime);
        }
      }
    }

    if (responseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        avgResponseTimeFormatted: "N/A",
        medianResponseTime: 0,
        totalResponses: 0,
      };
    }

    // Calculate stats
    const sum = responseTimes.reduce((a, b) => a + b, 0);
    const avg = sum / responseTimes.length;

    // Median
    responseTimes.sort((a, b) => a - b);
    const median = responseTimes[Math.floor(responseTimes.length / 2)];

    // Format time
    const formatTime = (ms: number): string => {
      const seconds = Math.round(ms / 1000);
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.round(seconds / 60);
      if (minutes < 60) return `${minutes}m`;
      const hours = Math.round(minutes / 60);
      return `${hours}h`;
    };

    return {
      avgResponseTime: Math.round(avg),
      avgResponseTimeFormatted: formatTime(avg),
      medianResponseTime: Math.round(median),
      medianResponseTimeFormatted: formatTime(median),
      totalResponses: responseTimes.length,
    };
  },
});

/**
 * Get top performing contacts (most interactions)
 */
export const getTopContacts = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Get interaction count for each contact
    const contactsWithStats = await Promise.all(
      contacts.map(async (contact) => {
        const interactions = await ctx.db
          .query("interactions")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        return {
          ...contact,
          interactionCount: interactions.length,
          lastInteraction: interactions.length > 0
            ? Math.max(...interactions.map((i) => i.createdAt))
            : contact.createdAt,
        };
      })
    );

    // Sort by interaction count and take top N
    return contactsWithStats
      .sort((a, b) => b.interactionCount - a.interactionCount)
      .slice(0, limit);
  },
});

/**
 * Get dashboard summary stats
 */
export const getDashboardSummary = query({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get contacts
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Get recent interactions
    const recentInteractions = await ctx.db
      .query("interactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.gte(q.field("createdAt"), weekAgo))
      .collect();

    const todayInteractions = recentInteractions.filter((i) => i.createdAt >= dayAgo);
    const todayInbound = todayInteractions.filter((i) => i.type === "inbound").length;
    const todayOutbound = todayInteractions.filter((i) => i.type === "outbound").length;

    // Contact status breakdown
    const statusCounts = {
      new: contacts.filter((c) => c.status === "new" || !c.status).length,
      active: contacts.filter((c) => c.status === "active").length,
      paused: contacts.filter((c) => c.status === "paused").length,
      converted: contacts.filter((c) => c.status === "converted").length,
    };

    // New contacts this week
    const newThisWeek = contacts.filter((c) => c.createdAt >= weekAgo).length;

    return {
      totalContacts: contacts.length,
      newThisWeek,
      statusCounts,
      today: {
        inbound: todayInbound,
        outbound: todayOutbound,
        total: todayInbound + todayOutbound,
      },
      thisWeek: {
        inbound: recentInteractions.filter((i) => i.type === "inbound").length,
        outbound: recentInteractions.filter((i) => i.type === "outbound").length,
        total: recentInteractions.length,
      },
    };
  },
});

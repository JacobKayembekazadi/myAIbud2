import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default handoff keywords
export const DEFAULT_HANDOFF_KEYWORDS = [
  "speak to human",
  "talk to a person",
  "real person",
  "agent please",
  "human please",
  "speak to someone",
  "customer service",
  "manager",
  "representative",
  "help me",
  "I need help",
  "not helpful",
  "frustrated",
  "complaint",
];

// Get notifications for a tenant
export const listNotifications = query({
  args: {
    tenantId: v.id("tenants"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let q = ctx.db
      .query("notifications")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .order("desc");

    if (args.unreadOnly) {
      q = ctx.db
        .query("notifications")
        .withIndex("by_tenant_unread", (q) =>
          q.eq("tenantId", args.tenantId).eq("isRead", false)
        )
        .order("desc");
    }

    const notifications = await q.take(limit);
    return notifications;
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_tenant_unread", (q) =>
        q.eq("tenantId", args.tenantId).eq("isRead", false)
      )
      .collect();

    return unread.length;
  },
});

// Create a notification
export const createNotification = mutation({
  args: {
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    type: v.union(
      v.literal("handoff_request"),
      v.literal("new_lead"),
      v.literal("appointment_booked"),
      v.literal("follow_up_due"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    contactId: v.optional(v.id("contacts")),
    appointmentId: v.optional(v.id("appointments")),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    actionUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Mark notification as read
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, {
      isRead: true,
      readAt: Date.now(),
    });
  },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_tenant_unread", (q) =>
        q.eq("tenantId", args.tenantId).eq("isRead", false)
      )
      .collect();

    const now = Date.now();
    for (const notification of unread) {
      await ctx.db.patch(notification._id, {
        isRead: true,
        readAt: now,
      });
    }

    return unread.length;
  },
});

// Delete a notification
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.notificationId);
  },
});

// Delete old notifications (cleanup)
export const deleteOldNotifications = mutation({
  args: {
    tenantId: v.id("tenants"),
    olderThanDays: v.number(),
  },
  handler: async (ctx, args) => {
    const cutoff = Date.now() - args.olderThanDays * 24 * 60 * 60 * 1000;

    const old = await ctx.db
      .query("notifications")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .collect();

    for (const notification of old) {
      await ctx.db.delete(notification._id);
    }

    return old.length;
  },
});

// Get handoff queue (contacts awaiting human attention)
export const getHandoffQueue = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_handoff", (q) =>
        q.eq("tenantId", args.tenantId).eq("handoffRequested", true)
      )
      .collect();

    // Sort by handoff time (oldest first - FIFO queue)
    return contacts.sort((a, b) => (a.handoffAt || 0) - (b.handoffAt || 0));
  },
});

// Request handoff for a contact
export const requestHandoff = mutation({
  args: {
    contactId: v.id("contacts"),
    reason: v.string(),
    createNotification: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const now = Date.now();

    // Update contact with handoff request
    await ctx.db.patch(args.contactId, {
      handoffRequested: true,
      handoffReason: args.reason,
      handoffAt: now,
      status: "paused", // Pause AI responses
      updatedAt: now,
    });

    // Create notification if requested (default true)
    if (args.createNotification !== false) {
      await ctx.db.insert("notifications", {
        tenantId: contact.tenantId,
        organizationId: contact.organizationId,
        type: "handoff_request",
        title: "Human Assistance Needed",
        message: `${contact.name || contact.phone}: ${args.reason}`,
        contactId: args.contactId,
        priority: "high",
        isRead: false,
        actionUrl: `/dashboard/contacts/${args.contactId}`,
        createdAt: now,
      });
    }

    return { success: true };
  },
});

// Resolve handoff (human takes over)
export const resolveHandoff = mutation({
  args: {
    contactId: v.id("contacts"),
    resolvedBy: v.optional(v.id("teamMembers")),
    resumeAI: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.contactId, {
      handoffRequested: false,
      handoffResolvedAt: now,
      handoffResolvedBy: args.resolvedBy,
      status: args.resumeAI ? "active" : "paused",
      updatedAt: now,
    });

    return { success: true };
  },
});

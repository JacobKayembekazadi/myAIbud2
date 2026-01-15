import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List appointments for a tenant
export const listAppointments = query({
  args: {
    tenantId: v.id("tenants"),
    status: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let appointments = await ctx.db
      .query("appointments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Filter by status
    if (args.status) {
      appointments = appointments.filter(a => a.status === args.status);
    }

    // Filter by date range
    if (args.startDate) {
      appointments = appointments.filter(a => a.scheduledAt >= args.startDate!);
    }
    if (args.endDate) {
      appointments = appointments.filter(a => a.scheduledAt <= args.endDate!);
    }

    // Sort by scheduled time
    return appointments.sort((a, b) => a.scheduledAt - b.scheduledAt);
  },
});

// Get appointments for a specific contact
export const getContactAppointments = query({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();
  },
});

// Get a single appointment
export const getAppointment = query({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.appointmentId);
  },
});

// Get upcoming appointments (for dashboard)
export const getUpcomingAppointments = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const limit = args.limit ?? 10;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_scheduled", (q) => q.eq("tenantId", args.tenantId).gte("scheduledAt", now))
      .take(limit);

    return appointments.filter(a => a.status === "confirmed" || a.status === "pending");
  },
});

// Get today's appointments
export const getTodaysAppointments = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_scheduled", (q) =>
        q.eq("tenantId", args.tenantId).gte("scheduledAt", startOfDay).lte("scheduledAt", endOfDay)
      )
      .collect();

    return appointments.filter(a => a.status === "confirmed" || a.status === "pending");
  },
});

// Create an appointment
export const createAppointment = mutation({
  args: {
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    contactId: v.id("contacts"),
    instanceId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    scheduledAt: v.number(),
    duration: v.number(),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    bookedVia: v.union(v.literal("ai"), v.literal("manual")),
    assignedTo: v.optional(v.id("teamMembers")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create the appointment
    const appointmentId = await ctx.db.insert("appointments", {
      tenantId: args.tenantId,
      organizationId: args.organizationId,
      contactId: args.contactId,
      instanceId: args.instanceId,
      title: args.title,
      description: args.description,
      scheduledAt: args.scheduledAt,
      duration: args.duration,
      status: "pending",
      location: args.location,
      notes: args.notes,
      bookedVia: args.bookedVia,
      assignedTo: args.assignedTo,
      createdAt: now,
      updatedAt: now,
    });

    // Create notification
    const contact = await ctx.db.get(args.contactId);
    await ctx.db.insert("notifications", {
      tenantId: args.tenantId,
      organizationId: args.organizationId,
      type: "appointment_booked",
      title: "New Appointment Booked",
      message: `${contact?.name || contact?.phone}: ${args.title} on ${new Date(args.scheduledAt).toLocaleDateString()}`,
      contactId: args.contactId,
      appointmentId,
      priority: "medium",
      isRead: false,
      actionUrl: `/appointments/${appointmentId}`,
      createdAt: now,
    });

    return appointmentId;
  },
});

// Update appointment status
export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("no_show")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Update appointment details
export const updateAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    assignedTo: v.optional(v.id("teamMembers")),
  },
  handler: async (ctx, args) => {
    const { appointmentId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.title !== undefined) filteredUpdates.title = updates.title;
    if (updates.description !== undefined) filteredUpdates.description = updates.description;
    if (updates.scheduledAt !== undefined) filteredUpdates.scheduledAt = updates.scheduledAt;
    if (updates.duration !== undefined) filteredUpdates.duration = updates.duration;
    if (updates.location !== undefined) filteredUpdates.location = updates.location;
    if (updates.notes !== undefined) filteredUpdates.notes = updates.notes;
    if (updates.assignedTo !== undefined) filteredUpdates.assignedTo = updates.assignedTo;

    await ctx.db.patch(appointmentId, filteredUpdates);
    return { success: true };
  },
});

// Delete an appointment
export const deleteAppointment = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.appointmentId);
    return { success: true };
  },
});

// Check availability for a time slot
export const checkAvailability = query({
  args: {
    tenantId: v.id("tenants"),
    date: v.number(), // Start of day timestamp
    duration: v.optional(v.number()), // Duration in minutes
  },
  handler: async (ctx, args) => {
    const duration = args.duration ?? 30;
    const startOfDay = args.date;
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    // Get settings for business hours
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const startHour = settings?.businessHoursStart ?? 8;
    const endHour = settings?.businessHoursEnd ?? 18;
    const buffer = settings?.appointmentBuffer ?? 15;

    // Get existing appointments for the day
    const existingAppointments = await ctx.db
      .query("appointments")
      .withIndex("by_scheduled", (q) =>
        q.eq("tenantId", args.tenantId).gte("scheduledAt", startOfDay).lte("scheduledAt", endOfDay)
      )
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "confirmed"),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    // Generate available slots
    const slots: Array<{ start: number; end: number; available: boolean }> = [];
    const slotDuration = duration + buffer;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = startOfDay + hour * 60 * 60 * 1000 + minute * 60 * 1000;
        const slotEnd = slotStart + duration * 60 * 1000;

        // Skip if slot is in the past
        if (slotStart < Date.now()) {
          slots.push({ start: slotStart, end: slotEnd, available: false });
          continue;
        }

        // Check for conflicts
        const hasConflict = existingAppointments.some((apt) => {
          const aptStart = apt.scheduledAt;
          const aptEnd = apt.scheduledAt + apt.duration * 60 * 1000 + buffer * 60 * 1000;
          return (slotStart < aptEnd && slotEnd > aptStart);
        });

        slots.push({ start: slotStart, end: slotEnd, available: !hasConflict });
      }
    }

    return slots;
  },
});

// Get appointments needing reminders
export const getAppointmentsNeedingReminders = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    // Get settings for reminder timing
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .first();

    const reminderHours = settings?.appointmentReminderHours ?? 24;
    const now = Date.now();
    const reminderWindow = now + reminderHours * 60 * 60 * 1000;

    // Get upcoming appointments that haven't had reminders sent
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_scheduled", (q) =>
        q.eq("tenantId", args.tenantId).gte("scheduledAt", now).lte("scheduledAt", reminderWindow)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "confirmed"),
          q.eq(q.field("reminderSent"), false)
        )
      )
      .collect();

    return appointments;
  },
});

// Mark reminder as sent
export const markReminderSent = mutation({
  args: { appointmentId: v.id("appointments") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, {
      reminderSent: true,
      reminderSentAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Get appointment statistics
export const getAppointmentStats = query({
  args: {
    tenantId: v.id("tenants"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const startDate = args.startDate ?? thirtyDaysAgo;
    const endDate = args.endDate ?? now;

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledAt"), startDate),
          q.lte(q.field("scheduledAt"), endDate)
        )
      )
      .collect();

    const stats = {
      total: appointments.length,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      pending: 0,
      aiBooked: 0,
      manualBooked: 0,
    };

    for (const apt of appointments) {
      switch (apt.status) {
        case "confirmed": stats.confirmed++; break;
        case "completed": stats.completed++; break;
        case "cancelled": stats.cancelled++; break;
        case "no_show": stats.noShow++; break;
        case "pending": stats.pending++; break;
      }
      if (apt.bookedVia === "ai") stats.aiBooked++;
      else stats.manualBooked++;
    }

    const completionRate = stats.total > 0
      ? Math.round(((stats.completed) / (stats.total - stats.pending - stats.cancelled)) * 100)
      : 0;

    return { ...stats, completionRate };
  },
});

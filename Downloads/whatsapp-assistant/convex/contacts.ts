import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listContacts = query({
  args: { tenantId: v.id("tenants"), instanceId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let q = ctx.db.query("contacts").withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));
    if (args.instanceId) {
      q = q.filter((q) => q.eq(q.field("instanceId"), args.instanceId));
    }
    const contacts = await q.collect();

    // Sort by lastInteraction (most recent first), then by createdAt
    return contacts.sort((a, b) => {
      const aTime = a.lastInteraction || a.createdAt;
      const bTime = b.lastInteraction || b.createdAt;
      return bTime - aTime;
    });
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

// Update contact details
export const updateContact = mutation({
  args: {
    contactId: v.id("contacts"),
    name: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { contactId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = { updatedAt: Date.now() };
    
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.tags !== undefined) filteredUpdates.tags = updates.tags;
    if (updates.notes !== undefined) filteredUpdates.notes = updates.notes;
    if (updates.status !== undefined) filteredUpdates.status = updates.status;
    
    await ctx.db.patch(contactId, filteredUpdates);
    return contactId;
  },
});

// Delete a single contact
export const deleteContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contactId);
  },
});

// Bulk pause contacts
export const bulkPauseContacts = mutation({
  args: { contactIds: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.contactIds) {
      await ctx.db.patch(id, { status: "paused", updatedAt: now });
    }
    return args.contactIds.length;
  },
});

// Bulk resume contacts
export const bulkResumeContacts = mutation({
  args: { contactIds: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const id of args.contactIds) {
      await ctx.db.patch(id, { status: "active", updatedAt: now });
    }
    return args.contactIds.length;
  },
});

// Bulk delete contacts
export const bulkDeleteContacts = mutation({
  args: { contactIds: v.array(v.id("contacts")) },
  handler: async (ctx, args) => {
    for (const id of args.contactIds) {
      await ctx.db.delete(id);
    }
    return args.contactIds.length;
  },
});

// Import contacts from CSV
export const importContacts = mutation({
  args: {
    tenantId: v.id("tenants"),
    instanceId: v.string(),
    contacts: v.array(v.object({
      phone: v.string(),
      name: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      notes: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let imported = 0;
    let updated = 0;
    
    for (const contact of args.contacts) {
      const existing = await ctx.db
        .query("contacts")
        .withIndex("by_phone", (q) => q.eq("phone", contact.phone).eq("instanceId", args.instanceId))
        .first();
      
      if (existing) {
        await ctx.db.patch(existing._id, {
          name: contact.name ?? existing.name,
          tags: contact.tags ?? existing.tags,
          notes: contact.notes ?? existing.notes,
          updatedAt: now,
        });
        updated++;
      } else {
        await ctx.db.insert("contacts", {
          tenantId: args.tenantId,
          instanceId: args.instanceId,
          phone: contact.phone,
          name: contact.name,
          tags: contact.tags,
          notes: contact.notes,
          status: "new",
          createdAt: now,
          updatedAt: now,
        });
        imported++;
      }
    }
    
    return { imported, updated };
  },
});

// Get contacts for export
export const getContactsForExport = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
    
    return contacts.map(c => ({
      phone: c.phone,
      name: c.name ?? "",
      status: c.status,
      tags: c.tags?.join(";") ?? "",
      notes: c.notes ?? "",
      createdAt: new Date(c.createdAt).toISOString(),
      lastInteraction: c.lastInteraction ? new Date(c.lastInteraction).toISOString() : "",
    }));
  },
});

// Create demo contact for testing AI
export const createDemoContact = mutation({
  args: {
    tenantId: v.id("tenants"),
    instanceId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if demo contact already exists
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) => q.eq(q.field("isDemo"), true))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    return await ctx.db.insert("contacts", {
      tenantId: args.tenantId,
      instanceId: args.instanceId,
      phone: "demo-test-contact",
      name: "🤖 Test AI Assistant",
      status: "active",
      tags: ["demo", "test"],
      notes: "This is a demo contact for testing AI responses",
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});


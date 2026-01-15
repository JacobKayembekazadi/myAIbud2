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

/**
 * Paginated contact list for better performance with large datasets
 */
export const listContactsPaginated = query({
  args: {
    tenantId: v.id("tenants"),
    instanceId: v.optional(v.string()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
    search: v.optional(v.string()),
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let q = ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));

    if (args.instanceId) {
      q = q.filter((q) => q.eq(q.field("instanceId"), args.instanceId));
    }

    // Collect all matching contacts (we'll filter and paginate in memory)
    let contacts = await q.collect();

    // Apply status filter
    if (args.status) {
      contacts = contacts.filter((c) => c.status === args.status);
    }

    // Apply search filter
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      contacts = contacts.filter(
        (c) =>
          c.name?.toLowerCase().includes(searchLower) ||
          c.phone.includes(args.search!) ||
          c.tags?.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    // Sort by lastInteraction (most recent first)
    contacts.sort((a, b) => {
      const aTime = a.lastInteraction || a.createdAt;
      const bTime = b.lastInteraction || b.createdAt;
      return bTime - aTime;
    });

    // Find cursor position
    let startIndex = 0;
    if (args.cursor) {
      const cursorIndex = contacts.findIndex((c) => c._id === args.cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    // Get page of contacts
    const pageContacts = contacts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < contacts.length;
    const nextCursor = hasMore ? pageContacts[pageContacts.length - 1]?._id : null;

    return {
      contacts: pageContacts,
      nextCursor,
      hasMore,
      totalCount: contacts.length,
    };
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
    aiEnabled: v.optional(v.boolean()),
    isPersonal: v.optional(v.boolean()),
    // Language fields
    detectedLanguage: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
    // Lead scoring fields
    leadScore: v.optional(v.number()),
    leadGrade: v.optional(v.string()),
    // Handoff fields
    handoffRequested: v.optional(v.boolean()),
    handoffReason: v.optional(v.string()),
    handoffAt: v.optional(v.number()),
    handoffResolvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { contactId, ...updates } = args;
    const filteredUpdates: Record<string, unknown> = { updatedAt: Date.now() };

    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.tags !== undefined) filteredUpdates.tags = updates.tags;
    if (updates.notes !== undefined) filteredUpdates.notes = updates.notes;
    if (updates.status !== undefined) filteredUpdates.status = updates.status;
    if (updates.aiEnabled !== undefined) filteredUpdates.aiEnabled = updates.aiEnabled;
    if (updates.isPersonal !== undefined) filteredUpdates.isPersonal = updates.isPersonal;
    if (updates.detectedLanguage !== undefined) filteredUpdates.detectedLanguage = updates.detectedLanguage;
    if (updates.preferredLanguage !== undefined) filteredUpdates.preferredLanguage = updates.preferredLanguage;
    if (updates.leadScore !== undefined) filteredUpdates.leadScore = updates.leadScore;
    if (updates.leadGrade !== undefined) filteredUpdates.leadGrade = updates.leadGrade;
    if (updates.handoffRequested !== undefined) filteredUpdates.handoffRequested = updates.handoffRequested;
    if (updates.handoffReason !== undefined) filteredUpdates.handoffReason = updates.handoffReason;
    if (updates.handoffAt !== undefined) filteredUpdates.handoffAt = updates.handoffAt;
    if (updates.handoffResolvedAt !== undefined) filteredUpdates.handoffResolvedAt = updates.handoffResolvedAt;

    await ctx.db.patch(contactId, filteredUpdates);
    return contactId;
  },
});

// Toggle AI enabled for a contact
export const toggleContactAI = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const newValue = contact.aiEnabled === false ? true : false;
    await ctx.db.patch(args.contactId, {
      aiEnabled: newValue,
      updatedAt: Date.now(),
    });
    return newValue;
  },
});

// Mark contact as personal (AI won't respond)
export const toggleContactPersonal = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const newValue = !contact.isPersonal;
    await ctx.db.patch(args.contactId, {
      isPersonal: newValue,
      updatedAt: Date.now(),
    });
    return newValue;
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

// ===== TEAM WORKSPACE FUNCTIONS =====

/**
 * List contacts with team-aware filtering
 * Supports both solo and team modes
 */
export const listContactsTeamAware = query({
  args: {
    tenantId: v.id("tenants"),
    instanceId: v.optional(v.string()),
    viewMode: v.optional(v.union(v.literal("my"), v.literal("all"), v.literal("unassigned"))),
  },
  handler: async (ctx, args) => {
    const tenant = await ctx.db.get(args.tenantId);
    if (!tenant) throw new Error("Tenant not found");

    // SOLO MODE: Return all contacts (backward compatible)
    if (!tenant.organizationId || tenant.accountType === "solo") {
      let q = ctx.db
        .query("contacts")
        .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId));

      if (args.instanceId) {
        q = q.filter((q) => q.eq(q.field("instanceId"), args.instanceId));
      }

      const contacts = await q.collect();
      return contacts.sort((a, b) => {
        const aTime = a.lastInteraction || a.createdAt;
        const bTime = b.lastInteraction || b.createdAt;
        return bTime - aTime;
      });
    }

    // TEAM MODE: Apply role-based filtering
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    // TypeScript narrowing: we know organizationId exists here
    const organizationId = tenant.organizationId!;

    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", organizationId)
      )
      .first();

    if (!member || member.status !== "active") {
      throw new Error("Unauthorized");
    }

    // Get all contacts for the organization
    let q = ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));

    if (args.instanceId) {
      q = q.filter((q) => q.eq(q.field("instanceId"), args.instanceId));
    }

    let contacts = await q.collect();

    // Apply view mode filtering
    if (args.viewMode === "my" || (member.role === "agent" && !args.viewMode)) {
      // Agents see only their assigned contacts (unless viewMode=all)
      contacts = contacts.filter(
        (c) => c.assignedTo === member._id || !c.assignedTo
      );
    } else if (args.viewMode === "unassigned") {
      // Show only unassigned contacts
      contacts = contacts.filter((c) => !c.assignedTo);
    }
    // viewMode="all" or admin role: show all contacts

    // Sort by recent activity
    return contacts.sort((a, b) => {
      const aTime = a.lastInteraction || a.createdAt;
      const bTime = b.lastInteraction || b.createdAt;
      return bTime - aTime;
    });
  },
});

/**
 * Assign a contact to a team member
 */
export const assignContact = mutation({
  args: {
    contactId: v.id("contacts"),
    assignedTo: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.organizationId) {
      throw new Error("Contact not found or not in a team workspace");
    }

    // TypeScript narrowing: we know organizationId exists here
    const organizationId = contact.organizationId;

    // Verify assigner is an admin
    const assigner = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", organizationId)
      )
      .first();

    if (!assigner || assigner.role !== "admin") {
      throw new Error("Only admins can assign contacts");
    }

    // Verify assignee belongs to same organization
    const assignee = await ctx.db.get(args.assignedTo);
    if (!assignee || assignee.organizationId !== organizationId) {
      throw new Error("Cannot assign to member of different organization");
    }

    await ctx.db.patch(args.contactId, {
      assignedTo: args.assignedTo,
      assignedBy: assigner._id,
      assignedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Unassign a contact (make it available in the pool)
 */
export const unassignContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.organizationId) {
      throw new Error("Contact not found or not in a team workspace");
    }

    // TypeScript narrowing: we know organizationId exists here
    const organizationId = contact.organizationId;

    // Verify user is an admin
    const member = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", organizationId)
      )
      .first();

    if (!member || member.role !== "admin") {
      throw new Error("Only admins can unassign contacts");
    }

    await ctx.db.patch(args.contactId, {
      assignedTo: undefined,
      assignedBy: undefined,
      assignedAt: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Transfer a contact from one agent to another
 */
export const transferContact = mutation({
  args: {
    contactId: v.id("contacts"),
    fromAgentId: v.id("teamMembers"),
    toAgentId: v.id("teamMembers"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.organizationId) {
      throw new Error("Contact not found or not in a team workspace");
    }

    // TypeScript narrowing: we know organizationId exists here
    const organizationId = contact.organizationId;

    // Verify user is an admin
    const admin = await ctx.db
      .query("teamMembers")
      .withIndex("by_clerk_org", (q) =>
        q.eq("clerkId", identity.subject).eq("organizationId", organizationId)
      )
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can transfer contacts");
    }

    // Verify both agents belong to same organization
    const fromAgent = await ctx.db.get(args.fromAgentId);
    const toAgent = await ctx.db.get(args.toAgentId);

    if (
      !fromAgent ||
      !toAgent ||
      fromAgent.organizationId !== organizationId ||
      toAgent.organizationId !== organizationId
    ) {
      throw new Error("Invalid agent IDs");
    }

    await ctx.db.patch(args.contactId, {
      assignedTo: args.toAgentId,
      assignedBy: admin._id,
      assignedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Get assignment statistics for an organization
 * Optimized: Uses Map for O(n) instead of O(n*m) nested loops
 */
export const getAssignmentStats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .collect();

    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .filter((q) => q.eq(q.field("role"), "agent"))
      .collect();

    // Use Map for O(n) aggregation instead of O(n*m) nested loops
    const assignmentCounts = new Map<string, number>();
    let unassigned = 0;

    for (const contact of contacts) {
      if (contact.assignedTo) {
        const currentCount = assignmentCounts.get(contact.assignedTo) || 0;
        assignmentCounts.set(contact.assignedTo, currentCount + 1);
      } else {
        unassigned++;
      }
    }

    const byAgent = members.map((member) => ({
      memberId: member._id,
      memberName: member.name || member.email,
      contactCount: assignmentCounts.get(member._id) || 0,
    }));

    return {
      total: contacts.length,
      unassigned,
      assigned: contacts.length - unassigned,
      byAgent,
    };
  },
});


import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default follow-up sequence templates
export const DEFAULT_SEQUENCE_TEMPLATES = {
  standard: {
    name: "Standard Follow-up",
    steps: [
      { delayHours: 24, message: "Hi! Just checking in - did you have any questions about our services?", stopOnReply: true },
      { delayHours: 72, message: "Hope you're doing well! I wanted to follow up and see if there's anything I can help you with.", stopOnReply: true },
      { delayHours: 168, message: "Hi there! It's been a week since we last spoke. If you're still interested, I'm here to help whenever you're ready.", stopOnReply: true },
    ],
  },
  hotLead: {
    name: "Hot Lead Nurture",
    steps: [
      { delayHours: 4, message: "Thanks for your interest! Is there anything specific you'd like to know more about?", stopOnReply: true },
      { delayHours: 24, message: "Hi! Just following up - I wanted to make sure you have all the information you need.", stopOnReply: true },
      { delayHours: 48, message: "Hope I'm not being a bother! Let me know if you have any questions or would like to schedule a call.", stopOnReply: true },
    ],
  },
  appointment: {
    name: "After Appointment",
    steps: [
      { delayHours: 24, message: "Thanks for meeting with us! How did everything go? Let me know if you have any follow-up questions.", stopOnReply: true },
      { delayHours: 72, message: "Hi! Just wanted to check in after our meeting. Is there anything else I can help you with?", stopOnReply: true },
    ],
  },
};

// List all sequences for a tenant
export const listSequences = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("followUpSequences")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});

// Get a single sequence
export const getSequence = query({
  args: { sequenceId: v.id("followUpSequences") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sequenceId);
  },
});

// Get default sequence for tenant
export const getDefaultSequence = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("followUpSequences")
      .withIndex("by_default", (q) => q.eq("tenantId", args.tenantId).eq("isDefault", true))
      .first();
  },
});

// Create a new sequence
export const createSequence = mutation({
  args: {
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    name: v.string(),
    steps: v.array(
      v.object({
        delayHours: v.number(),
        message: v.string(),
        stopOnReply: v.boolean(),
      })
    ),
    triggerCondition: v.optional(
      v.union(
        v.literal("no_response"),
        v.literal("after_first_contact"),
        v.literal("after_quote"),
        v.literal("manual")
      )
    ),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // If setting as default, clear other defaults
    if (args.isDefault) {
      const existingDefault = await ctx.db
        .query("followUpSequences")
        .withIndex("by_default", (q) => q.eq("tenantId", args.tenantId).eq("isDefault", true))
        .first();

      if (existingDefault) {
        await ctx.db.patch(existingDefault._id, { isDefault: false, updatedAt: now });
      }
    }

    return await ctx.db.insert("followUpSequences", {
      tenantId: args.tenantId,
      organizationId: args.organizationId,
      name: args.name,
      isActive: true,
      isDefault: args.isDefault ?? false,
      steps: args.steps,
      triggerCondition: args.triggerCondition ?? "no_response",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update a sequence
export const updateSequence = mutation({
  args: {
    sequenceId: v.id("followUpSequences"),
    name: v.optional(v.string()),
    steps: v.optional(
      v.array(
        v.object({
          delayHours: v.number(),
          message: v.string(),
          stopOnReply: v.boolean(),
        })
      )
    ),
    triggerCondition: v.optional(
      v.union(
        v.literal("no_response"),
        v.literal("after_first_contact"),
        v.literal("after_quote"),
        v.literal("manual")
      )
    ),
    isActive: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { sequenceId, ...updates } = args;
    const sequence = await ctx.db.get(sequenceId);
    if (!sequence) throw new Error("Sequence not found");

    const now = Date.now();

    // If setting as default, clear other defaults
    if (updates.isDefault === true) {
      const existingDefault = await ctx.db
        .query("followUpSequences")
        .withIndex("by_default", (q) => q.eq("tenantId", sequence.tenantId).eq("isDefault", true))
        .first();

      if (existingDefault && existingDefault._id !== sequenceId) {
        await ctx.db.patch(existingDefault._id, { isDefault: false, updatedAt: now });
      }
    }

    const filteredUpdates: Record<string, unknown> = { updatedAt: now };
    if (updates.name !== undefined) filteredUpdates.name = updates.name;
    if (updates.steps !== undefined) filteredUpdates.steps = updates.steps;
    if (updates.triggerCondition !== undefined) filteredUpdates.triggerCondition = updates.triggerCondition;
    if (updates.isActive !== undefined) filteredUpdates.isActive = updates.isActive;
    if (updates.isDefault !== undefined) filteredUpdates.isDefault = updates.isDefault;

    await ctx.db.patch(sequenceId, filteredUpdates);
    return sequenceId;
  },
});

// Delete a sequence
export const deleteSequence = mutation({
  args: { sequenceId: v.id("followUpSequences") },
  handler: async (ctx, args) => {
    // TODO: Also remove sequence from contacts using it
    await ctx.db.delete(args.sequenceId);
  },
});

// Assign a sequence to a contact
export const assignSequenceToContact = mutation({
  args: {
    contactId: v.id("contacts"),
    sequenceId: v.id("followUpSequences"),
    startFromStep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sequence = await ctx.db.get(args.sequenceId);
    if (!sequence) throw new Error("Sequence not found");
    if (!sequence.isActive) throw new Error("Sequence is not active");

    const contact = await ctx.db.get(args.contactId);
    if (!contact) throw new Error("Contact not found");

    const now = Date.now();
    const startStep = args.startFromStep ?? 0;
    const firstDelay = sequence.steps[startStep]?.delayHours ?? 24;
    const nextFollowUpAt = now + firstDelay * 60 * 60 * 1000;

    await ctx.db.patch(args.contactId, {
      followUpSequenceId: args.sequenceId,
      followUpStep: startStep,
      lastFollowUpAt: now,
      nextFollowUpAt,
      updatedAt: now,
    });

    return { success: true, nextFollowUpAt };
  },
});

// Remove sequence from contact
export const removeSequenceFromContact = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, {
      followUpSequenceId: undefined,
      followUpStep: undefined,
      lastFollowUpAt: undefined,
      nextFollowUpAt: undefined,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Get contacts due for follow-up (for cron job)
export const getContactsDueForFollowUp = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get all contacts with active follow-up sequences due now
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_next_followup", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) =>
        q.and(
          q.neq(q.field("followUpSequenceId"), undefined),
          q.lte(q.field("nextFollowUpAt"), now)
        )
      )
      .collect();

    return contacts;
  },
});

// Advance follow-up step after sending
export const advanceFollowUpStep = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.followUpSequenceId) {
      throw new Error("Contact not found or not in sequence");
    }

    const sequence = await ctx.db.get(contact.followUpSequenceId);
    if (!sequence) {
      // Sequence was deleted, clear from contact
      await ctx.db.patch(args.contactId, {
        followUpSequenceId: undefined,
        followUpStep: undefined,
        nextFollowUpAt: undefined,
        updatedAt: Date.now(),
      });
      return { completed: true, reason: "sequence_deleted" };
    }

    const currentStep = contact.followUpStep ?? 0;
    const nextStep = currentStep + 1;
    const now = Date.now();

    // Check if sequence is complete
    if (nextStep >= sequence.steps.length) {
      // Sequence complete
      await ctx.db.patch(args.contactId, {
        followUpSequenceId: undefined,
        followUpStep: undefined,
        nextFollowUpAt: undefined,
        lastFollowUpAt: now,
        updatedAt: now,
      });
      return { completed: true, reason: "sequence_finished" };
    }

    // Calculate next follow-up time
    const nextDelay = sequence.steps[nextStep].delayHours;
    const nextFollowUpAt = now + nextDelay * 60 * 60 * 1000;

    await ctx.db.patch(args.contactId, {
      followUpStep: nextStep,
      lastFollowUpAt: now,
      nextFollowUpAt,
      updatedAt: now,
    });

    return { completed: false, nextStep, nextFollowUpAt };
  },
});

// Stop sequence when customer replies
export const stopSequenceOnReply = mutation({
  args: { contactId: v.id("contacts") },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact || !contact.followUpSequenceId) {
      return { stopped: false, reason: "no_active_sequence" };
    }

    const sequence = await ctx.db.get(contact.followUpSequenceId);
    if (!sequence) {
      await ctx.db.patch(args.contactId, {
        followUpSequenceId: undefined,
        followUpStep: undefined,
        nextFollowUpAt: undefined,
        updatedAt: Date.now(),
      });
      return { stopped: true, reason: "sequence_deleted" };
    }

    const currentStep = contact.followUpStep ?? 0;
    const currentStepConfig = sequence.steps[currentStep];

    // Check if current step has stopOnReply enabled
    if (currentStepConfig?.stopOnReply) {
      await ctx.db.patch(args.contactId, {
        followUpSequenceId: undefined,
        followUpStep: undefined,
        nextFollowUpAt: undefined,
        updatedAt: Date.now(),
      });
      return { stopped: true, reason: "customer_replied" };
    }

    return { stopped: false, reason: "stop_on_reply_disabled" };
  },
});

// Create default sequences for new tenant
export const createDefaultSequences = mutation({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const created = [];

    for (const [key, template] of Object.entries(DEFAULT_SEQUENCE_TEMPLATES)) {
      const id = await ctx.db.insert("followUpSequences", {
        tenantId: args.tenantId,
        name: template.name,
        isActive: true,
        isDefault: key === "standard",
        steps: template.steps,
        triggerCondition: "no_response",
        createdAt: now,
        updatedAt: now,
      });
      created.push(id);
    }

    return created;
  },
});

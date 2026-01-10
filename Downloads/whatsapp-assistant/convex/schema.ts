import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tenants: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    tier: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  instances: defineTable({
    tenantId: v.id("tenants"),
    name: v.string(),
    instanceId: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_instanceId", ["instanceId"])
    .index("by_tenant", ["tenantId"]),

  contacts: defineTable({
    tenantId: v.id("tenants"),
    instanceId: v.string(),
    phone: v.string(),
    name: v.optional(v.string()),
    status: v.string(),
    tags: v.optional(v.array(v.string())),
    lastInteraction: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phone", ["phone", "instanceId"])
    .index("by_tenant", ["tenantId"]),

  subscriptionUsage: defineTable({
    tenantId: v.id("tenants"),
    creditsLimit: v.number(),
    creditsUsed: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]),

  interactions: defineTable({
    contactId: v.id("contacts"),
    tenantId: v.id("tenants"),
    type: v.string(),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    cost: v.number(),
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"])
    .index("by_tenant", ["tenantId"]),

  campaigns: defineTable({
    tenantId: v.id("tenants"),
    instanceId: v.string(),
    name: v.string(),
    message: v.string(),
    contactIds: v.array(v.id("contacts")),
    scheduledFor: v.optional(v.number()),
    status: v.string(), // draft, scheduled, sending, completed, failed
    sentCount: v.number(),
    totalContacts: v.number(),
    createdAt: v.number(),
  }).index("by_tenant", ["tenantId"]),

  failedJobs: defineTable({
    eventId: v.optional(v.string()),
    functionId: v.optional(v.string()),
    error: v.optional(v.string()),
    context: v.optional(v.any()),
    resolved: v.boolean(),
    createdAt: v.number(),
  }),

  settings: defineTable({
    tenantId: v.id("tenants"),
    autoReplyEnabled: v.boolean(),
    defaultInstanceId: v.optional(v.string()),
    aiModel: v.string(), // "gemini-1.5-pro", "gemini-1.5-flash"
    aiTemperature: v.number(),
    aiMaxTokens: v.number(),
    emailNotifications: v.boolean(),
    smsNotifications: v.boolean(),
    updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]),

  quickReplies: defineTable({
    tenantId: v.id("tenants"),
    label: v.string(),
    content: v.string(),
    category: v.optional(v.string()), // "pricing", "hours", "general"
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_tenant", ["tenantId"]),
});


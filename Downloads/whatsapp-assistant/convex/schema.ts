import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Organizations: Represents a company/team or solo workspace
  organizations: defineTable({
    name: v.string(),
    type: v.union(v.literal("solo"), v.literal("team"), v.literal("partnership")),
    ownerClerkId: v.string(), // Original creator/owner
    tier: v.string(), // "starter", "pro", "enterprise"
    // Subscription/Credits (shared across team)
    creditsLimit: v.number(),
    creditsUsed: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerClerkId"]),

  // Team Members: Users who belong to an organization
  teamMembers: defineTable({
    organizationId: v.id("organizations"),
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("agent"), v.literal("viewer")),
    status: v.union(v.literal("active"), v.literal("invited"), v.literal("suspended")),
    invitedBy: v.optional(v.id("teamMembers")),
    inviteToken: v.optional(v.string()), // For accepting invitations
    invitedAt: v.optional(v.number()),
    joinedAt: v.optional(v.number()),
    permissions: v.optional(
      v.object({
        canManageTeam: v.boolean(),
        canManageInstances: v.boolean(),
        canViewAllContacts: v.boolean(),
        canExportData: v.boolean(),
        canManageBilling: v.boolean(),
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_clerk_id", ["clerkId"])
    .index("by_invite_token", ["inviteToken"])
    .index("by_clerk_org", ["clerkId", "organizationId"]),

  // Tenants: Legacy single-user accounts (kept for backward compatibility)
  tenants: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    tier: v.string(),
    // Team migration fields
    organizationId: v.optional(v.id("organizations")), // Linked org if upgraded to team
    accountType: v.optional(v.union(v.literal("solo"), v.literal("team"))), // Default: "solo"
    // Onboarding tracking
    onboardingCompleted: v.optional(v.boolean()),
    onboardingStep: v.optional(v.number()),
    hasCreatedInstance: v.optional(v.boolean()),
    hasConnectedWhatsApp: v.optional(v.boolean()),
    hasSyncedContacts: v.optional(v.boolean()),
    hasTestedAI: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_organization", ["organizationId"]),

  instances: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")), // For team accounts
    name: v.string(),
    instanceId: v.string(),
    status: v.string(),
    visibility: v.optional(v.union(v.literal("private"), v.literal("shared"))), // For team instances
    ownedBy: v.optional(v.id("teamMembers")), // For private instances in teams
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_instanceId", ["instanceId"])
    .index("by_tenant", ["tenantId"])
    .index("by_organization", ["organizationId"]),

  contacts: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")), // For team accounts
    instanceId: v.string(),
    phone: v.string(),
    name: v.optional(v.string()),
    status: v.string(),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    isDemo: v.optional(v.boolean()),
    lastInteraction: v.optional(v.number()),
    // Lead scoring fields
    leadScore: v.optional(v.number()), // 0-100 score
    leadGrade: v.optional(v.string()), // A, B, C, D, F
    // AI Control fields
    aiEnabled: v.optional(v.boolean()), // Default true - AI can respond to this contact
    isPersonal: v.optional(v.boolean()), // Mark as personal contact (AI won't respond)
    // Team assignment fields
    assignedTo: v.optional(v.id("teamMembers")), // Agent assigned to this contact
    assignedBy: v.optional(v.id("teamMembers")), // Who made the assignment
    assignedAt: v.optional(v.number()),
    lastHandledBy: v.optional(v.id("teamMembers")), // Last agent to interact
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_phone", ["phone", "instanceId"])
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["tenantId", "status"])
    .index("by_organization", ["organizationId"])
    .index("by_assigned_to", ["assignedTo"])
    .index("by_org_assigned", ["organizationId", "assignedTo"]),

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
    organizationId: v.optional(v.id("organizations")), // For team accounts
    type: v.string(),
    content: v.optional(v.string()),
    metadata: v.optional(v.any()),
    cost: v.number(),
    // Team tracking
    handledBy: v.optional(v.id("teamMembers")), // Which agent handled this interaction
    isAiResponse: v.optional(v.boolean()), // True if AI-generated, false if manual
    createdAt: v.number(),
  })
    .index("by_contact", ["contactId"])
    .index("by_tenant", ["tenantId"])
    .index("by_organization", ["organizationId"])
    .index("by_handled_by", ["handledBy"]),

  campaigns: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")), // For team accounts
    instanceId: v.string(),
    name: v.string(),
    message: v.string(),
    contactIds: v.array(v.id("contacts")),
    scheduledFor: v.optional(v.number()),
    status: v.string(), // draft, scheduled, sending, completed, failed
    sentCount: v.number(),
    totalContacts: v.number(),
    createdBy: v.optional(v.id("teamMembers")), // Which team member created this campaign
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_organization", ["organizationId"]),

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
    organizationId: v.optional(v.id("organizations")), // For team accounts (org-level settings)
    memberId: v.optional(v.id("teamMembers")), // For member-specific overrides
    autoReplyEnabled: v.boolean(),
    defaultInstanceId: v.optional(v.string()),
    aiModel: v.string(), // "gemini-1.5-pro", "gemini-1.5-flash"
    aiTemperature: v.number(),
    aiMaxTokens: v.number(),
    emailNotifications: v.boolean(),
    smsNotifications: v.boolean(),
    // Agent Activation Settings
    agentActivationMode: v.optional(
      v.union(
        v.literal("always_on"),
        v.literal("keyword_triggered"),
        v.literal("new_contacts_only"),
        v.literal("business_hours")
      )
    ), // Default: "always_on"
    activationKeywords: v.optional(v.array(v.string())), // Keywords that trigger AI response
    fallbackMessage: v.optional(v.string()), // Message when AI doesn't activate
    sendFallbackWhenInactive: v.optional(v.boolean()), // Send fallback when AI skips
    // Business Hours Settings (for "business_hours" mode)
    businessHoursStart: v.optional(v.number()), // Hour 0-23
    businessHoursEnd: v.optional(v.number()), // Hour 0-23
    businessDays: v.optional(v.array(v.number())), // 0=Sun, 1=Mon, etc.
    businessTimezone: v.optional(v.string()), // e.g., "Africa/Johannesburg"
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_organization", ["organizationId"])
    .index("by_member", ["memberId"]),

  quickReplies: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")), // For team accounts
    label: v.string(),
    content: v.string(),
    category: v.optional(v.string()), // "pricing", "hours", "general"
    isActive: v.boolean(),
    createdBy: v.optional(v.id("teamMembers")), // Who created this quick reply
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_organization", ["organizationId"]),
});


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
    // Human Handoff fields
    handoffRequested: v.optional(v.boolean()), // AI requested human intervention
    handoffReason: v.optional(v.string()), // Why handoff was triggered
    handoffAt: v.optional(v.number()), // When handoff was requested
    handoffResolvedAt: v.optional(v.number()), // When human took over
    handoffResolvedBy: v.optional(v.id("teamMembers")), // Which team member resolved
    // Language preference
    detectedLanguage: v.optional(v.string()), // Auto-detected language code (e.g., "en", "es", "fr")
    preferredLanguage: v.optional(v.string()), // User-set language preference
    // Follow-up sequence fields
    followUpSequenceId: v.optional(v.id("followUpSequences")), // Active sequence
    followUpStep: v.optional(v.number()), // Current step in sequence (0, 1, 2...)
    lastFollowUpAt: v.optional(v.number()), // When last follow-up was sent
    nextFollowUpAt: v.optional(v.number()), // When next follow-up is scheduled
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
    .index("by_org_assigned", ["organizationId", "assignedTo"])
    .index("by_handoff", ["tenantId", "handoffRequested"])
    .index("by_next_followup", ["tenantId", "nextFollowUpAt"]),

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
    // Business Profile Settings
    businessName: v.optional(v.string()), // e.g., "ABC Realty"
    industry: v.optional(v.string()), // e.g., "real_estate", "automotive", "general"
    businessDescription: v.optional(v.string()), // What the business does
    servicesOffered: v.optional(v.array(v.string())), // List of services
    businessLocation: v.optional(v.string()), // e.g., "Cape Town, South Africa"
    aiPersonality: v.optional(v.string()), // e.g., "professional", "friendly", "casual"
    customSystemPrompt: v.optional(v.string()), // Advanced: fully custom prompt
    useQuickRepliesAsKnowledge: v.optional(v.boolean()), // Use quick replies as AI knowledge base
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
    // Welcome Message Settings (for first-time contacts)
    welcomeMessageEnabled: v.optional(v.boolean()), // Send welcome message to new contacts
    welcomeMessage: v.optional(v.string()), // Custom welcome message
    welcomeMessageDelay: v.optional(v.number()), // Delay in ms before sending (feels more natural)
    suggestedQuestions: v.optional(v.array(v.string())), // Quick questions customers can ask
    // Human Handoff Settings
    handoffEnabled: v.optional(v.boolean()), // Enable AI to request handoff
    handoffKeywords: v.optional(v.array(v.string())), // Phrases that trigger handoff (e.g., "speak to human")
    handoffMessage: v.optional(v.string()), // Message sent when handoff triggered
    handoffNotifyEmail: v.optional(v.boolean()), // Send email notification
    handoffNotifyPush: v.optional(v.boolean()), // Send push/in-app notification
    // Multi-language Settings
    multiLanguageEnabled: v.optional(v.boolean()), // Auto-detect and respond in customer's language
    defaultLanguage: v.optional(v.string()), // Default language code (e.g., "en")
    supportedLanguages: v.optional(v.array(v.string())), // List of supported language codes
    // Follow-up Sequence Settings
    followUpEnabled: v.optional(v.boolean()), // Enable auto follow-ups
    defaultFollowUpSequenceId: v.optional(v.id("followUpSequences")), // Default sequence
    // Appointment Booking Settings
    appointmentBookingEnabled: v.optional(v.boolean()), // Enable AI to book appointments
    appointmentDuration: v.optional(v.number()), // Default duration in minutes
    appointmentBuffer: v.optional(v.number()), // Buffer between appointments in minutes
    appointmentReminderHours: v.optional(v.number()), // Hours before to send reminder
    // Lead Scoring Settings
    leadScoringEnabled: v.optional(v.boolean()), // Enable automatic lead scoring
    hotLeadThreshold: v.optional(v.number()), // Score threshold for "hot" (default 80)
    warmLeadThreshold: v.optional(v.number()), // Score threshold for "warm" (default 50)
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

  // Notifications for human handoff alerts
  notifications: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    type: v.union(
      v.literal("handoff_request"), // AI needs human help
      v.literal("new_lead"), // Hot lead detected
      v.literal("appointment_booked"), // New appointment
      v.literal("follow_up_due"), // Follow-up reminder
      v.literal("system") // System notifications
    ),
    title: v.string(),
    message: v.string(),
    contactId: v.optional(v.id("contacts")), // Related contact
    appointmentId: v.optional(v.id("appointments")), // Related appointment
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    isRead: v.boolean(),
    readAt: v.optional(v.number()),
    readBy: v.optional(v.id("teamMembers")),
    actionUrl: v.optional(v.string()), // Deep link to relevant page
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_unread", ["tenantId", "isRead"])
    .index("by_organization", ["organizationId"])
    .index("by_type", ["tenantId", "type"]),

  // Follow-up sequences for automated follow-ups
  followUpSequences: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    name: v.string(), // e.g., "Default Follow-up", "Hot Lead Nurture"
    isActive: v.boolean(),
    isDefault: v.optional(v.boolean()), // Default sequence for new contacts
    steps: v.array(
      v.object({
        delayHours: v.number(), // Hours after last interaction (24, 72, 168 for 1d, 3d, 7d)
        message: v.string(), // Template message
        stopOnReply: v.boolean(), // Stop sequence if customer replies
      })
    ),
    triggerCondition: v.optional(
      v.union(
        v.literal("no_response"), // No response from customer
        v.literal("after_first_contact"), // After first interaction
        v.literal("after_quote"), // After sending a quote/price
        v.literal("manual") // Manually triggered
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_organization", ["organizationId"])
    .index("by_default", ["tenantId", "isDefault"]),

  // Appointments for booking integration
  appointments: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    contactId: v.id("contacts"),
    instanceId: v.string(),
    title: v.string(), // e.g., "Property Viewing", "Test Drive"
    description: v.optional(v.string()),
    scheduledAt: v.number(), // Appointment time
    duration: v.number(), // Duration in minutes
    status: v.union(
      v.literal("pending"), // Awaiting confirmation
      v.literal("confirmed"),
      v.literal("cancelled"),
      v.literal("completed"),
      v.literal("no_show")
    ),
    reminderSent: v.optional(v.boolean()),
    reminderSentAt: v.optional(v.number()),
    location: v.optional(v.string()), // Physical address or "virtual"
    notes: v.optional(v.string()),
    // Tracking
    bookedVia: v.union(v.literal("ai"), v.literal("manual")), // How it was booked
    assignedTo: v.optional(v.id("teamMembers")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_contact", ["contactId"])
    .index("by_scheduled", ["tenantId", "scheduledAt"])
    .index("by_status", ["tenantId", "status"])
    .index("by_organization", ["organizationId"]),

  // Analytics events for tracking metrics
  analyticsEvents: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    eventType: v.union(
      v.literal("message_received"), // Inbound message
      v.literal("message_sent"), // AI response sent
      v.literal("handoff_triggered"), // Handoff to human
      v.literal("handoff_resolved"), // Handoff resolved
      v.literal("lead_converted"), // Lead status changed to customer
      v.literal("appointment_booked"), // Appointment created
      v.literal("follow_up_sent"), // Follow-up message sent
      v.literal("ai_success"), // AI successfully handled query
      v.literal("ai_uncertain") // AI was uncertain
    ),
    contactId: v.optional(v.id("contacts")),
    instanceId: v.optional(v.string()),
    metadata: v.optional(v.any()), // Additional event data
    // Metrics for response time tracking
    responseTimeMs: v.optional(v.number()), // Time to respond
    // Daily aggregation helper
    dateKey: v.string(), // YYYY-MM-DD format for easy grouping
    createdAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_date", ["tenantId", "dateKey"])
    .index("by_tenant_type", ["tenantId", "eventType"])
    .index("by_organization", ["organizationId"]),

  // Daily analytics summary (pre-aggregated for dashboard)
  analyticsSummary: defineTable({
    tenantId: v.id("tenants"),
    organizationId: v.optional(v.id("organizations")),
    dateKey: v.string(), // YYYY-MM-DD
    // Message metrics
    messagesReceived: v.number(),
    messagesSent: v.number(),
    uniqueContacts: v.number(),
    // AI metrics
    aiResponses: v.number(),
    aiSuccessRate: v.number(), // 0-100%
    avgResponseTimeMs: v.number(),
    // Handoff metrics
    handoffsTriggered: v.number(),
    handoffsResolved: v.number(),
    // Lead metrics
    newLeads: v.number(),
    hotLeads: v.number(),
    conversions: v.number(),
    // Appointment metrics
    appointmentsBooked: v.number(),
    appointmentsCompleted: v.number(),
    // Popular topics (for word cloud)
    topTopics: v.optional(v.array(v.object({
      topic: v.string(),
      count: v.number(),
    }))),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_date", ["tenantId", "dateKey"])
    .index("by_organization", ["organizationId"]),
});


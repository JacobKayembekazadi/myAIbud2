import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Default activation keywords for new users
const DEFAULT_ACTIVATION_KEYWORDS = [
    "help", "hi", "hello", "info", "inquiry", "property",
    "price", "available", "interested", "assistant", "AI", "bot"
];

// Default handoff keywords
const DEFAULT_HANDOFF_KEYWORDS = [
    "speak to human", "talk to a person", "real person", "agent please",
    "human please", "speak to someone", "customer service", "manager",
    "representative", "I need help", "not helpful", "frustrated", "complaint"
];

// Supported languages
const DEFAULT_SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "pt", "it", "nl", "zu", "af"];

// Get settings for a tenant
export const getSettings = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, args) => {
        const settings = await ctx.db
            .query("settings")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .first();

        // Return defaults if no settings exist
        if (!settings) {
            return {
                autoReplyEnabled: true,
                aiModel: "gemini-2.0-flash",
                aiTemperature: 0.7,
                aiMaxTokens: 1000,
                emailNotifications: true,
                smsNotifications: false,
                defaultInstanceId: undefined,
                // Business Profile defaults
                businessName: undefined,
                industry: "general",
                businessDescription: undefined,
                servicesOffered: [],
                businessLocation: undefined,
                aiPersonality: "professional",
                customSystemPrompt: undefined,
                useQuickRepliesAsKnowledge: true,
                // Agent activation defaults
                agentActivationMode: "always_on" as const,
                activationKeywords: DEFAULT_ACTIVATION_KEYWORDS,
                fallbackMessage: "Hi! I'm currently not available. Type 'help' to speak with our AI assistant.",
                sendFallbackWhenInactive: false,
                businessHoursStart: 8,
                businessHoursEnd: 18,
                businessDays: [1, 2, 3, 4, 5], // Mon-Fri
                businessTimezone: "Africa/Johannesburg",
                // Welcome message defaults
                welcomeMessageEnabled: true,
                welcomeMessage: undefined, // Will be auto-generated from business profile
                welcomeMessageDelay: 1000, // 1 second delay feels natural
                suggestedQuestions: [],
                // Human Handoff defaults
                handoffEnabled: true,
                handoffKeywords: DEFAULT_HANDOFF_KEYWORDS,
                handoffMessage: "I'm connecting you with a team member who can better assist you. They'll be with you shortly!",
                handoffNotifyEmail: true,
                handoffNotifyPush: true,
                // Multi-language defaults
                multiLanguageEnabled: true,
                defaultLanguage: "en",
                supportedLanguages: DEFAULT_SUPPORTED_LANGUAGES,
                // Follow-up defaults
                followUpEnabled: true,
                defaultFollowUpSequenceId: undefined,
                // Appointment booking defaults
                appointmentBookingEnabled: false, // Disabled by default until configured
                appointmentDuration: 30, // 30 minutes default
                appointmentBuffer: 15, // 15 minute buffer
                appointmentReminderHours: 24, // Remind 24 hours before
                // Lead scoring defaults
                leadScoringEnabled: true,
                hotLeadThreshold: 80,
                warmLeadThreshold: 50,
            };
        }

        // Merge with defaults for missing fields
        return {
            ...settings,
            // Business Profile defaults
            industry: settings.industry ?? "general",
            servicesOffered: settings.servicesOffered ?? [],
            aiPersonality: settings.aiPersonality ?? "professional",
            useQuickRepliesAsKnowledge: settings.useQuickRepliesAsKnowledge ?? true,
            // Agent activation defaults
            agentActivationMode: settings.agentActivationMode ?? "always_on",
            activationKeywords: settings.activationKeywords ?? DEFAULT_ACTIVATION_KEYWORDS,
            fallbackMessage: settings.fallbackMessage ?? "Hi! I'm currently not available. Type 'help' to speak with our AI assistant.",
            sendFallbackWhenInactive: settings.sendFallbackWhenInactive ?? false,
            businessHoursStart: settings.businessHoursStart ?? 8,
            businessHoursEnd: settings.businessHoursEnd ?? 18,
            businessDays: settings.businessDays ?? [1, 2, 3, 4, 5],
            businessTimezone: settings.businessTimezone ?? "Africa/Johannesburg",
            // Welcome message defaults
            welcomeMessageEnabled: settings.welcomeMessageEnabled ?? true,
            welcomeMessage: settings.welcomeMessage,
            welcomeMessageDelay: settings.welcomeMessageDelay ?? 1000,
            suggestedQuestions: settings.suggestedQuestions ?? [],
            // Human Handoff defaults
            handoffEnabled: settings.handoffEnabled ?? true,
            handoffKeywords: settings.handoffKeywords ?? DEFAULT_HANDOFF_KEYWORDS,
            handoffMessage: settings.handoffMessage ?? "I'm connecting you with a team member who can better assist you. They'll be with you shortly!",
            handoffNotifyEmail: settings.handoffNotifyEmail ?? true,
            handoffNotifyPush: settings.handoffNotifyPush ?? true,
            // Multi-language defaults
            multiLanguageEnabled: settings.multiLanguageEnabled ?? true,
            defaultLanguage: settings.defaultLanguage ?? "en",
            supportedLanguages: settings.supportedLanguages ?? DEFAULT_SUPPORTED_LANGUAGES,
            // Follow-up defaults
            followUpEnabled: settings.followUpEnabled ?? true,
            defaultFollowUpSequenceId: settings.defaultFollowUpSequenceId,
            // Appointment booking defaults
            appointmentBookingEnabled: settings.appointmentBookingEnabled ?? false,
            appointmentDuration: settings.appointmentDuration ?? 30,
            appointmentBuffer: settings.appointmentBuffer ?? 15,
            appointmentReminderHours: settings.appointmentReminderHours ?? 24,
            // Lead scoring defaults
            leadScoringEnabled: settings.leadScoringEnabled ?? true,
            hotLeadThreshold: settings.hotLeadThreshold ?? 80,
            warmLeadThreshold: settings.warmLeadThreshold ?? 50,
        };
    },
});

// Update settings
export const updateSettings = mutation({
    args: {
        tenantId: v.id("tenants"),
        autoReplyEnabled: v.optional(v.boolean()),
        defaultInstanceId: v.optional(v.string()),
        aiModel: v.optional(v.string()),
        aiTemperature: v.optional(v.number()),
        aiMaxTokens: v.optional(v.number()),
        emailNotifications: v.optional(v.boolean()),
        smsNotifications: v.optional(v.boolean()),
        // Business Profile settings
        businessName: v.optional(v.string()),
        industry: v.optional(v.string()),
        businessDescription: v.optional(v.string()),
        servicesOffered: v.optional(v.array(v.string())),
        businessLocation: v.optional(v.string()),
        aiPersonality: v.optional(v.string()),
        customSystemPrompt: v.optional(v.string()),
        useQuickRepliesAsKnowledge: v.optional(v.boolean()),
        // Agent activation settings
        agentActivationMode: v.optional(
            v.union(
                v.literal("always_on"),
                v.literal("keyword_triggered"),
                v.literal("new_contacts_only"),
                v.literal("business_hours")
            )
        ),
        activationKeywords: v.optional(v.array(v.string())),
        fallbackMessage: v.optional(v.string()),
        sendFallbackWhenInactive: v.optional(v.boolean()),
        businessHoursStart: v.optional(v.number()),
        businessHoursEnd: v.optional(v.number()),
        businessDays: v.optional(v.array(v.number())),
        businessTimezone: v.optional(v.string()),
        // Welcome message settings
        welcomeMessageEnabled: v.optional(v.boolean()),
        welcomeMessage: v.optional(v.string()),
        welcomeMessageDelay: v.optional(v.number()),
        suggestedQuestions: v.optional(v.array(v.string())),
        // Human Handoff settings
        handoffEnabled: v.optional(v.boolean()),
        handoffKeywords: v.optional(v.array(v.string())),
        handoffMessage: v.optional(v.string()),
        handoffNotifyEmail: v.optional(v.boolean()),
        handoffNotifyPush: v.optional(v.boolean()),
        // Multi-language settings
        multiLanguageEnabled: v.optional(v.boolean()),
        defaultLanguage: v.optional(v.string()),
        supportedLanguages: v.optional(v.array(v.string())),
        // Follow-up settings
        followUpEnabled: v.optional(v.boolean()),
        defaultFollowUpSequenceId: v.optional(v.id("followUpSequences")),
        // Appointment booking settings
        appointmentBookingEnabled: v.optional(v.boolean()),
        appointmentDuration: v.optional(v.number()),
        appointmentBuffer: v.optional(v.number()),
        appointmentReminderHours: v.optional(v.number()),
        // Lead scoring settings
        leadScoringEnabled: v.optional(v.boolean()),
        hotLeadThreshold: v.optional(v.number()),
        warmLeadThreshold: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { tenantId, ...updates } = args;

        const existing = await ctx.db
            .query("settings")
            .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            return await ctx.db.insert("settings", {
                tenantId,
                autoReplyEnabled: updates.autoReplyEnabled ?? true,
                aiModel: updates.aiModel ?? "gemini-1.5-flash",
                aiTemperature: updates.aiTemperature ?? 0.7,
                aiMaxTokens: updates.aiMaxTokens ?? 1000,
                emailNotifications: updates.emailNotifications ?? true,
                smsNotifications: updates.smsNotifications ?? false,
                defaultInstanceId: updates.defaultInstanceId,
                // Business Profile defaults
                businessName: updates.businessName,
                industry: updates.industry ?? "general",
                businessDescription: updates.businessDescription,
                servicesOffered: updates.servicesOffered ?? [],
                businessLocation: updates.businessLocation,
                aiPersonality: updates.aiPersonality ?? "professional",
                customSystemPrompt: updates.customSystemPrompt,
                useQuickRepliesAsKnowledge: updates.useQuickRepliesAsKnowledge ?? true,
                // Agent activation defaults
                agentActivationMode: updates.agentActivationMode ?? "always_on",
                activationKeywords: updates.activationKeywords ?? DEFAULT_ACTIVATION_KEYWORDS,
                fallbackMessage: updates.fallbackMessage,
                sendFallbackWhenInactive: updates.sendFallbackWhenInactive ?? false,
                businessHoursStart: updates.businessHoursStart ?? 8,
                businessHoursEnd: updates.businessHoursEnd ?? 18,
                businessDays: updates.businessDays ?? [1, 2, 3, 4, 5],
                businessTimezone: updates.businessTimezone ?? "Africa/Johannesburg",
                // Welcome message defaults
                welcomeMessageEnabled: updates.welcomeMessageEnabled ?? true,
                welcomeMessage: updates.welcomeMessage,
                welcomeMessageDelay: updates.welcomeMessageDelay ?? 1000,
                suggestedQuestions: updates.suggestedQuestions ?? [],
                // Human Handoff defaults
                handoffEnabled: updates.handoffEnabled ?? true,
                handoffKeywords: updates.handoffKeywords ?? DEFAULT_HANDOFF_KEYWORDS,
                handoffMessage: updates.handoffMessage ?? "I'm connecting you with a team member who can better assist you. They'll be with you shortly!",
                handoffNotifyEmail: updates.handoffNotifyEmail ?? true,
                handoffNotifyPush: updates.handoffNotifyPush ?? true,
                // Multi-language defaults
                multiLanguageEnabled: updates.multiLanguageEnabled ?? true,
                defaultLanguage: updates.defaultLanguage ?? "en",
                supportedLanguages: updates.supportedLanguages ?? DEFAULT_SUPPORTED_LANGUAGES,
                // Follow-up defaults
                followUpEnabled: updates.followUpEnabled ?? true,
                defaultFollowUpSequenceId: updates.defaultFollowUpSequenceId,
                // Appointment booking defaults
                appointmentBookingEnabled: updates.appointmentBookingEnabled ?? false,
                appointmentDuration: updates.appointmentDuration ?? 30,
                appointmentBuffer: updates.appointmentBuffer ?? 15,
                appointmentReminderHours: updates.appointmentReminderHours ?? 24,
                // Lead scoring defaults
                leadScoringEnabled: updates.leadScoringEnabled ?? true,
                hotLeadThreshold: updates.hotLeadThreshold ?? 80,
                warmLeadThreshold: updates.warmLeadThreshold ?? 50,
                updatedAt: Date.now(),
            });
        }
    },
});

// Get quick replies
export const listQuickReplies = query({
    args: { tenantId: v.id("tenants") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("quickReplies")
            .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
            .collect();
    },
});

// Create quick reply
export const createQuickReply = mutation({
    args: {
        tenantId: v.id("tenants"),
        label: v.string(),
        content: v.string(),
        category: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("quickReplies", {
            ...args,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Update quick reply
export const updateQuickReply = mutation({
    args: {
        id: v.id("quickReplies"),
        label: v.optional(v.string()),
        content: v.optional(v.string()),
        category: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

// Delete quick reply
export const deleteQuickReply = mutation({
    args: { id: v.id("quickReplies") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

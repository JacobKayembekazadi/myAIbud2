/**
 * Centralized configuration for the application
 * All magic numbers and configurable values should be defined here
 */

/**
 * Subscription tier configuration
 */
export const SUBSCRIPTION_TIERS = {
  starter: {
    name: "Starter",
    creditsLimit: 400,
    priceMonthly: 0, // Free tier
    features: [
      "400 AI messages/month",
      "1 WhatsApp number",
      "Basic analytics",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    creditsLimit: 2000,
    priceMonthly: 49,
    features: [
      "2,000 AI messages/month",
      "3 WhatsApp numbers",
      "Advanced analytics",
      "Lead scoring",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    creditsLimit: 10000,
    priceMonthly: 199,
    features: [
      "10,000 AI messages/month",
      "Unlimited WhatsApp numbers",
      "Custom AI training",
      "API access",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

/**
 * Get credits limit for a tier
 */
export function getCreditsLimit(tier: string): number {
  const tierConfig = SUBSCRIPTION_TIERS[tier as SubscriptionTier];
  return tierConfig?.creditsLimit ?? SUBSCRIPTION_TIERS.starter.creditsLimit;
}

/**
 * Billing configuration
 */
export const BILLING_CONFIG = {
  /** Duration of a billing period in milliseconds (30 days) */
  periodDurationMs: 30 * 24 * 60 * 60 * 1000,

  /** Default credits for new users without a subscription */
  defaultCredits: 400,

  /** Number of days before period end to send warning */
  warningDaysBeforeExpiry: 7,

  /** Credit cost for different operations */
  creditCosts: {
    textMessage: 1,
    imageAnalysis: 2,
    voiceMessage: 3,
    documentAnalysis: 2,
  },
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMITS = {
  /** Webhook rate limit per IP */
  webhook: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },

  /** API rate limit per user */
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  /** Campaign sending rate (to avoid WhatsApp bans) */
  campaignSending: {
    messagesPerMinute: 30,
    delayBetweenMessages: {
      minMs: 2000,
      maxMs: 5000,
    },
  },
} as const;

/**
 * AI configuration
 */
export const AI_CONFIG = {
  /** Default AI model */
  defaultModel: "gemini-1.5-flash",

  /** Default temperature for AI responses */
  defaultTemperature: 0.7,

  /** Maximum conversation history to include in prompts */
  maxHistoryMessages: 10,

  /** Vision analysis settings */
  vision: {
    maxImagesPerMinute: 10,
    creditCost: 2,
  },
} as const;

/**
 * Lead scoring configuration
 */
export const LEAD_SCORING_CONFIG = {
  /** Maximum score */
  maxScore: 100,

  /** Score thresholds for grades */
  gradeThresholds: {
    A: 80,
    B: 60,
    C: 40,
    D: 20,
    F: 0,
  },

  /** Points per category */
  maxPoints: {
    engagement: 25,
    recency: 25,
    intent: 25,
    response: 15,
    depth: 10,
  },
} as const;

/**
 * Pagination defaults
 */
export const PAGINATION_CONFIG = {
  /** Default page size for contacts */
  contactsDefaultLimit: 50,

  /** Maximum page size */
  maxPageSize: 100,

  /** Default page size for interactions */
  interactionsDefaultLimit: 20,
} as const;

/**
 * Analytics configuration
 */
export const ANALYTICS_CONFIG = {
  /** Default time range in days */
  defaultDays: 30,

  /** Available time ranges */
  timeRanges: [7, 14, 30, 90] as const,
} as const;

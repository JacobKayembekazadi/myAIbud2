import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Simple keyword-based sentiment analysis for WhatsApp messages
 *
 * In production, this could be enhanced with:
 * - AI-powered sentiment analysis via Gemini/GPT
 * - More sophisticated NLP
 * - Multi-language support
 */

// Positive sentiment indicators
const POSITIVE_WORDS = [
  "thank", "thanks", "great", "excellent", "amazing", "wonderful",
  "perfect", "love", "happy", "pleased", "appreciate", "helpful",
  "fantastic", "awesome", "good", "nice", "yes", "sure", "definitely",
  "interested", "excited", "looking forward", "brilliant",
];

// Negative sentiment indicators
const NEGATIVE_WORDS = [
  "bad", "terrible", "awful", "horrible", "hate", "angry", "upset",
  "disappointed", "frustrat", "annoyed", "problem", "issue", "wrong",
  "never", "worst", "useless", "waste", "stupid", "ridiculous",
  "slow", "waiting", "delay", "cancel", "refund", "complaint",
];

// Urgency indicators
const URGENCY_WORDS = [
  "urgent", "asap", "immediately", "now", "today", "quick", "fast",
  "hurry", "emergency", "important", "priority", "soon",
];

// Question indicators
const QUESTION_INDICATORS = ["?", "what", "when", "where", "how", "why", "can you", "could you", "do you"];

export type SentimentScore = "positive" | "neutral" | "negative";
export type UrgencyLevel = "high" | "medium" | "low";

interface SentimentAnalysis {
  sentiment: SentimentScore;
  urgency: UrgencyLevel;
  confidence: number;
  isQuestion: boolean;
  keywords: {
    positive: string[];
    negative: string[];
    urgency: string[];
  };
}

/**
 * Analyze sentiment of a single message
 */
function analyzeMessage(content: string): SentimentAnalysis {
  const text = content.toLowerCase();

  // Find matching keywords
  const foundPositive = POSITIVE_WORDS.filter((w) => text.includes(w));
  const foundNegative = NEGATIVE_WORDS.filter((w) => text.includes(w));
  const foundUrgency = URGENCY_WORDS.filter((w) => text.includes(w));

  // Check for questions
  const isQuestion = QUESTION_INDICATORS.some((q) => text.includes(q));

  // Calculate sentiment score
  const positiveScore = foundPositive.length;
  const negativeScore = foundNegative.length * 1.5; // Weight negative higher

  let sentiment: SentimentScore;
  let confidence: number;

  if (positiveScore > negativeScore + 1) {
    sentiment = "positive";
    confidence = Math.min(1, positiveScore / 3);
  } else if (negativeScore > positiveScore + 0.5) {
    sentiment = "negative";
    confidence = Math.min(1, negativeScore / 3);
  } else {
    sentiment = "neutral";
    confidence = 0.5;
  }

  // Calculate urgency
  let urgency: UrgencyLevel;
  if (foundUrgency.length >= 2) {
    urgency = "high";
  } else if (foundUrgency.length === 1) {
    urgency = "medium";
  } else {
    urgency = "low";
  }

  return {
    sentiment,
    urgency,
    confidence,
    isQuestion,
    keywords: {
      positive: foundPositive,
      negative: foundNegative,
      urgency: foundUrgency,
    },
  };
}

/**
 * Analyze sentiment for a contact's recent messages
 */
export const analyzeContactSentiment = query({
  args: {
    contactId: v.id("contacts"),
    messageLimit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.messageLimit ?? 10;

    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    // Get recent inbound interactions
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .order("desc")
      .take(limit * 2); // Get more to ensure enough inbound

    const inboundMessages = interactions
      .filter((i) => i.type === "inbound" && i.content)
      .slice(0, limit);

    if (inboundMessages.length === 0) {
      return {
        contactId: args.contactId,
        overallSentiment: "neutral" as SentimentScore,
        urgency: "low" as UrgencyLevel,
        confidence: 0,
        messageCount: 0,
        trend: "stable",
        recentMessages: [],
      };
    }

    // Analyze each message
    const analyses = inboundMessages.map((msg) => ({
      ...analyzeMessage(msg.content || ""),
      messageId: msg._id,
      content: msg.content?.substring(0, 100),
      createdAt: msg.createdAt,
    }));

    // Calculate overall sentiment
    const sentimentCounts = {
      positive: analyses.filter((a) => a.sentiment === "positive").length,
      neutral: analyses.filter((a) => a.sentiment === "neutral").length,
      negative: analyses.filter((a) => a.sentiment === "negative").length,
    };

    let overallSentiment: SentimentScore;
    if (sentimentCounts.positive > sentimentCounts.negative * 1.5) {
      overallSentiment = "positive";
    } else if (sentimentCounts.negative > sentimentCounts.positive) {
      overallSentiment = "negative";
    } else {
      overallSentiment = "neutral";
    }

    // Calculate urgency (max of recent messages)
    const hasHighUrgency = analyses.some((a) => a.urgency === "high");
    const hasMediumUrgency = analyses.some((a) => a.urgency === "medium");
    const overallUrgency: UrgencyLevel = hasHighUrgency ? "high" : hasMediumUrgency ? "medium" : "low";

    // Calculate trend (compare first half vs second half)
    const halfPoint = Math.floor(analyses.length / 2);
    if (analyses.length >= 4) {
      const recentNegative = analyses.slice(0, halfPoint).filter((a) => a.sentiment === "negative").length;
      const olderNegative = analyses.slice(halfPoint).filter((a) => a.sentiment === "negative").length;

      var trend: "improving" | "declining" | "stable";
      if (recentNegative < olderNegative) {
        trend = "improving";
      } else if (recentNegative > olderNegative) {
        trend = "declining";
      } else {
        trend = "stable";
      }
    } else {
      trend = "stable";
    }

    // Average confidence
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    return {
      contactId: args.contactId,
      overallSentiment,
      urgency: overallUrgency,
      confidence: Math.round(avgConfidence * 100) / 100,
      messageCount: inboundMessages.length,
      sentimentCounts,
      trend,
      recentMessages: analyses.slice(0, 5).map((a) => ({
        sentiment: a.sentiment,
        urgency: a.urgency,
        content: a.content,
        createdAt: a.createdAt,
      })),
    };
  },
});

/**
 * Get contacts that need attention (negative sentiment or high urgency)
 */
export const getContactsNeedingAttention = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    const contactsWithSentiment = await Promise.all(
      contacts.map(async (contact) => {
        // Get last few messages
        const interactions = await ctx.db
          .query("interactions")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .order("desc")
          .take(5);

        const inboundMessages = interactions.filter((i) => i.type === "inbound" && i.content);

        if (inboundMessages.length === 0) {
          return { ...contact, needsAttention: false, reason: null, sentiment: "neutral" };
        }

        // Quick sentiment check on most recent message
        const lastMessage = inboundMessages[0];
        const analysis = analyzeMessage(lastMessage.content || "");

        const needsAttention = analysis.sentiment === "negative" || analysis.urgency === "high";
        let reason = null;
        if (analysis.sentiment === "negative") {
          reason = "Negative sentiment detected";
        } else if (analysis.urgency === "high") {
          reason = "High urgency message";
        }

        return {
          ...contact,
          needsAttention,
          reason,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          lastMessage: lastMessage.content?.substring(0, 100),
          lastMessageAt: lastMessage.createdAt,
        };
      })
    );

    // Filter and sort by those needing attention
    return contactsWithSentiment
      .filter((c) => c.needsAttention)
      .sort((a, b) => {
        // High urgency first, then negative sentiment
        if (a.urgency === "high" && b.urgency !== "high") return -1;
        if (b.urgency === "high" && a.urgency !== "high") return 1;
        return (b.lastMessageAt || 0) - (a.lastMessageAt || 0);
      })
      .slice(0, limit);
  },
});

/**
 * Get sentiment distribution for a tenant
 */
export const getSentimentDistribution = query({
  args: {
    tenantId: v.id("tenants"),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const days = args.days ?? 30;
    const startTime = Date.now() - days * 24 * 60 * 60 * 1000;

    // Get all recent inbound interactions
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "inbound"),
          q.gte(q.field("createdAt"), startTime)
        )
      )
      .collect();

    // Analyze each
    const distribution = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    const urgencyCounts = {
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const interaction of interactions) {
      if (!interaction.content) continue;
      const analysis = analyzeMessage(interaction.content);
      distribution[analysis.sentiment]++;
      urgencyCounts[analysis.urgency]++;
    }

    const total = distribution.positive + distribution.neutral + distribution.negative;

    return {
      distribution,
      percentages: {
        positive: total > 0 ? Math.round((distribution.positive / total) * 100) : 0,
        neutral: total > 0 ? Math.round((distribution.neutral / total) * 100) : 0,
        negative: total > 0 ? Math.round((distribution.negative / total) * 100) : 0,
      },
      urgencyCounts,
      totalMessages: total,
    };
  },
});

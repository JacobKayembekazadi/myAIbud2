import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Lead Scoring Model for Real Estate
 *
 * Scoring factors:
 * - Engagement frequency: How often they message
 * - Recency: How recently they engaged
 * - Conversation depth: Length and quality of messages
 * - Intent signals: Keywords indicating buying/selling intent
 * - Response rate: Do they respond to outbound messages?
 */

// Intent keywords for real estate
const HIGH_INTENT_KEYWORDS = [
  "buy", "buying", "purchase", "interested",
  "sell", "selling", "list", "listing",
  "view", "viewing", "schedule", "appointment",
  "price", "budget", "afford", "mortgage",
  "move", "moving", "relocate", "relocating",
  "bedroom", "bathroom", "garage", "garden",
  "area", "location", "suburb", "neighborhood",
];

const MEDIUM_INTENT_KEYWORDS = [
  "looking", "search", "find", "want",
  "information", "details", "question",
  "market", "property", "house", "apartment", "flat",
  "rent", "renting", "lease",
];

/**
 * Calculate lead score for a contact
 */
export const calculateLeadScore = query({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    const contact = await ctx.db.get(args.contactId);
    if (!contact) return null;

    // Get all interactions for this contact
    const interactions = await ctx.db
      .query("interactions")
      .withIndex("by_contact", (q) => q.eq("contactId", args.contactId))
      .collect();

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    // Initialize score components
    let engagementScore = 0;
    let recencyScore = 0;
    let intentScore = 0;
    let responseScore = 0;
    let depthScore = 0;

    // 1. Engagement Score (0-25 points)
    // Based on number of inbound messages
    const inboundMessages = interactions.filter((i) => i.type === "inbound");
    if (inboundMessages.length >= 10) engagementScore = 25;
    else if (inboundMessages.length >= 5) engagementScore = 20;
    else if (inboundMessages.length >= 3) engagementScore = 15;
    else if (inboundMessages.length >= 1) engagementScore = 10;
    else engagementScore = 0;

    // 2. Recency Score (0-25 points)
    // Based on last interaction time
    const lastInteraction = interactions.length > 0
      ? Math.max(...interactions.map((i) => i.createdAt))
      : contact.createdAt;
    const daysSinceLastContact = (now - lastInteraction) / dayMs;

    if (daysSinceLastContact < 1) recencyScore = 25;
    else if (daysSinceLastContact < 3) recencyScore = 20;
    else if (daysSinceLastContact < 7) recencyScore = 15;
    else if (daysSinceLastContact < 14) recencyScore = 10;
    else if (daysSinceLastContact < 30) recencyScore = 5;
    else recencyScore = 0;

    // 3. Intent Score (0-25 points)
    // Based on keywords in messages
    const allContent = inboundMessages
      .map((i) => (i.content || "").toLowerCase())
      .join(" ");

    let highIntentCount = 0;
    let mediumIntentCount = 0;

    for (const keyword of HIGH_INTENT_KEYWORDS) {
      if (allContent.includes(keyword)) highIntentCount++;
    }
    for (const keyword of MEDIUM_INTENT_KEYWORDS) {
      if (allContent.includes(keyword)) mediumIntentCount++;
    }

    intentScore = Math.min(25, highIntentCount * 5 + mediumIntentCount * 2);

    // 4. Response Score (0-15 points)
    // How well they respond to outbound messages
    const outboundMessages = interactions.filter((i) => i.type === "outbound");
    if (outboundMessages.length > 0 && inboundMessages.length > 0) {
      const responseRate = inboundMessages.length / outboundMessages.length;
      if (responseRate >= 0.8) responseScore = 15;
      else if (responseRate >= 0.5) responseScore = 10;
      else if (responseRate >= 0.3) responseScore = 5;
      else responseScore = 0;
    }

    // 5. Depth Score (0-10 points)
    // Based on average message length
    const avgMessageLength =
      inboundMessages.length > 0
        ? inboundMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0) / inboundMessages.length
        : 0;

    if (avgMessageLength > 100) depthScore = 10;
    else if (avgMessageLength > 50) depthScore = 7;
    else if (avgMessageLength > 20) depthScore = 4;
    else depthScore = 0;

    // Calculate total score
    const totalScore = engagementScore + recencyScore + intentScore + responseScore + depthScore;

    // Determine lead grade
    let grade: "A" | "B" | "C" | "D" | "F";
    if (totalScore >= 80) grade = "A";
    else if (totalScore >= 60) grade = "B";
    else if (totalScore >= 40) grade = "C";
    else if (totalScore >= 20) grade = "D";
    else grade = "F";

    // Determine recommended action
    let recommendedAction: string;
    if (grade === "A") {
      recommendedAction = "High priority - Schedule viewing or call immediately";
    } else if (grade === "B") {
      recommendedAction = "Follow up within 24 hours with personalized message";
    } else if (grade === "C") {
      recommendedAction = "Nurture with relevant property listings";
    } else if (grade === "D") {
      recommendedAction = "Add to drip campaign for future engagement";
    } else {
      recommendedAction = "Low priority - Continue automated responses";
    }

    return {
      contactId: args.contactId,
      totalScore,
      grade,
      breakdown: {
        engagement: engagementScore,
        recency: recencyScore,
        intent: intentScore,
        response: responseScore,
        depth: depthScore,
      },
      stats: {
        totalMessages: interactions.length,
        inboundMessages: inboundMessages.length,
        outboundMessages: outboundMessages.length,
        daysSinceLastContact: Math.round(daysSinceLastContact),
        avgMessageLength: Math.round(avgMessageLength),
      },
      recommendedAction,
      calculatedAt: now,
    };
  },
});

/**
 * Update stored lead score for a contact
 */
export const updateLeadScore = mutation({
  args: {
    contactId: v.id("contacts"),
    score: v.number(),
    grade: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, {
      leadScore: args.score,
      leadGrade: args.grade,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get all contacts with their lead scores, sorted by score
 */
export const getLeaderboard = query({
  args: {
    tenantId: v.id("tenants"),
    limit: v.optional(v.number()),
    minScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const minScore = args.minScore ?? 0;

    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    // Get scores for all contacts
    const contactsWithScores = await Promise.all(
      contacts.map(async (contact) => {
        // Get interactions for scoring
        const interactions = await ctx.db
          .query("interactions")
          .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
          .collect();

        // Quick score calculation
        const inboundCount = interactions.filter((i) => i.type === "inbound").length;
        const lastInteraction = interactions.length > 0
          ? Math.max(...interactions.map((i) => i.createdAt))
          : contact.createdAt;

        // Simplified scoring for list view
        const daysSince = (Date.now() - lastInteraction) / (24 * 60 * 60 * 1000);
        let quickScore = contact.leadScore ?? 0;

        // If no stored score, calculate a quick estimate
        if (!contact.leadScore) {
          quickScore = Math.min(100, inboundCount * 10 + Math.max(0, 25 - daysSince));
        }

        return {
          ...contact,
          quickScore,
          interactionCount: interactions.length,
          lastInteraction,
        };
      })
    );

    // Filter and sort
    return contactsWithScores
      .filter((c) => c.quickScore >= minScore)
      .sort((a, b) => b.quickScore - a.quickScore)
      .slice(0, limit);
  },
});

/**
 * Bulk recalculate scores for all contacts in a tenant
 * Should be run periodically (e.g., daily)
 */
export const recalculateAllScores = internalMutation({
  args: {
    tenantId: v.id("tenants"),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();

    let updated = 0;

    for (const contact of contacts) {
      // Get interactions
      const interactions = await ctx.db
        .query("interactions")
        .withIndex("by_contact", (q) => q.eq("contactId", contact._id))
        .collect();

      // Calculate score (simplified version of the main calculation)
      const inboundMessages = interactions.filter((i) => i.type === "inbound");
      const now = Date.now();
      const lastInteraction = interactions.length > 0
        ? Math.max(...interactions.map((i) => i.createdAt))
        : contact.createdAt;
      const daysSince = (now - lastInteraction) / (24 * 60 * 60 * 1000);

      // Quick scoring
      let score = 0;
      score += Math.min(25, inboundMessages.length * 5); // Engagement
      score += Math.max(0, 25 - Math.floor(daysSince)); // Recency
      score += Math.min(25, inboundMessages.length * 3); // Rough intent proxy
      score += Math.min(25, interactions.length > 1 ? 15 : 0); // Response

      const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : score >= 20 ? "D" : "F";

      await ctx.db.patch(contact._id, {
        leadScore: Math.min(100, score),
        leadGrade: grade,
        updatedAt: now,
      });

      updated++;
    }

    return { updated };
  },
});

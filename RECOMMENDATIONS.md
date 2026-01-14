# MyChatFlow Production Readiness & Strategic Recommendations

> **Document Version:** 1.0
> **Last Updated:** January 12, 2026
> **Status:** Draft for Review

---

## Executive Summary

MyChatFlow is a WhatsApp AI automation SaaS platform targeting real estate professionals. The platform is approximately **70% complete** with solid architectural foundations but requires significant work before production deployment.

**Current State:** NOT PRODUCTION READY
**Estimated Timeline to Production:** 4-8 weeks
**Risk Level:** HIGH (3 critical blockers, security vulnerabilities, 0% test coverage)

---

## Table of Contents

1. [Critical Blockers](#1-critical-blockers)
2. [Features to Add](#2-features-to-add)
3. [Things to Remove](#3-things-to-remove)
4. [Things to Improve](#4-things-to-improve)
5. [Architecture Recommendations](#5-architecture-recommendations)
6. [Integration Roadmap](#6-integration-roadmap)
7. [Prioritized Action Plan](#7-prioritized-action-plan)
8. [Success Criteria](#8-success-criteria)

---

## 1. Critical Blockers

These must be fixed before any production deployment.

### 1.1 WAHA_API_URL Misconfigured

| Attribute | Details |
|-----------|---------|
| **Severity** | CRITICAL |
| **Location** | Vercel Environment Variables |
| **Current Value** | `https://waha-production-907c.up.railway.app` (incorrect) |
| **Required Value** | `http://49.13.153.22:3000` (Hetzner VPS) |
| **Impact** | WhatsApp instances cannot be created, QR codes fail, AI cannot respond |
| **Fix Time** | 5 minutes |

**Resolution Steps:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Update `WAHA_API_URL` to `http://49.13.153.22:3000`
3. Redeploy the application

### 1.2 INNGEST_EVENT_KEY Mismatch

| Attribute | Details |
|-----------|---------|
| **Severity** | CRITICAL |
| **Location** | Vercel Environment Variables |
| **Impact** | AI agent never triggered - messages logged but no responses sent |
| **Fix Time** | 10 minutes |

**Resolution Steps:**
1. Go to Inngest Dashboard → Manage → Keys
2. Copy the correct Event Key
3. Update `INNGEST_EVENT_KEY` in Vercel
4. Redeploy the application

### 1.3 Webhook Signature Verification Disabled

| Attribute | Details |
|-----------|---------|
| **Severity** | CRITICAL (Security) |
| **Location** | `src/lib/whatsapp/waha.ts:254-258` |
| **Impact** | Anyone can spoof webhook messages - major security vulnerability |
| **Fix Time** | 15 minutes |

**Current Code (INSECURE):**
```typescript
verifyWebhook(body: string, signature: string): boolean {
    // TEMPORARY: Skip verification while debugging webhook 401 errors
    console.log("Webhook received, signature header:", signature ? "present" : "missing");
    return true; // ALWAYS RETURNS TRUE - SECURITY RISK
}
```

**Resolution Steps:**
1. Verify `WAHA_WEBHOOK_SECRET` is set in Vercel
2. Re-enable the HMAC signature verification logic
3. Test webhook signing with a test message
4. Deploy

---

## 2. Features to Add

### 2.1 High-Value Additions (Maximum ROI)

| Feature | Why It Matters | Effort | Priority |
|---------|---------------|--------|----------|
| **Analytics Dashboard** | Users can't see ROI without metrics - #1 reason for churn | Medium | P0 |
| **Lead Scoring** | Auto-rank hot/cold leads based on engagement patterns | Medium | P0 |
| **Sentiment Analysis** | Detect frustrated customers before they churn | Low | P1 |
| **CRM Integrations** | HubSpot, Pipedrive, Salesforce - agents already use these | High | P1 |
| **Calendar Integration** | Google/Outlook - schedule viewings directly from chat | Medium | P1 |
| **Conversation Summarization** | AI forgets context in long chats - needs memory | Low | P1 |

### 2.2 Real Estate-Specific Features

| Feature | Description | Current Status | Priority |
|---------|-------------|----------------|----------|
| **Vision AI (Property Analysis)** | Analyze property photos for features, condition, estimated value | Stubbed at `src/inngest/functions/vision-estimator.ts` | P0 |
| **Lead Qualification Flow** | Guided conversation: buyer/seller → location → budget → schedule | Not started | P1 |
| **Market Insights** | Zillow/MLS integration for comps and market data | Not started | P2 |
| **Property Templates** | Pre-built response templates for real estate scenarios | Not started | P1 |

### 2.3 Analytics Features Needed

The platform currently has **zero analytics**. Users need:

```
Required Analytics:
├── Message Metrics
│   ├── Messages sent per day
│   ├── Delivery success rate
│   ├── Response rate by contact
│   └── Average response time
│
├── Campaign Metrics
│   ├── Campaign reach
│   ├── Success/failure rates
│   ├── Conversion tracking
│   └── ROI per campaign
│
├── Contact Insights
│   ├── Hot leads (most active)
│   ├── Cold leads (no response)
│   ├── Lead quality score
│   └── Engagement trends
│
└── Usage Analytics
    ├── Credits consumed (✅ exists)
    ├── Daily credit burn
    ├── Projected overage date
    └── Cost breakdown by feature
```

**Implementation Path:**
```
/convex/analytics.ts          - Analytics queries
/src/app/analytics/page.tsx   - Analytics dashboard
/src/app/analytics/messages/  - Message metrics
/src/app/analytics/campaigns/ - Campaign metrics
/src/app/analytics/contacts/  - Contact insights
```

### 2.4 AI/ML Improvements

| Improvement | Benefit | Complexity | Priority |
|-------------|---------|------------|----------|
| **Multi-model selection** | Let users choose Gemini Flash vs Pro vs Claude | Low | P2 |
| **Smart reply suggestions** | Auto-suggest responses based on message intent | Medium | P1 |
| **Conversation routing** | Escalate to human when AI can't handle | Medium | P1 |
| **A/B testing responses** | Test professional vs casual tone | High | P3 |
| **Personalization engine** | Learn user's communication style over time | High | P3 |

**Conversation Summarization Implementation:**
```typescript
// src/inngest/functions/summarize-conversation.ts
// Trigger when conversation exceeds 20 messages
// 1. Summarize last 50 messages using AI
// 2. Store summary in contact.conversationSummary
// 3. Pass summary + last 10 messages to AI for context
// Cost: ~0.1 credits per summary
```

**Lead Scoring Model:**
```typescript
// Score based on:
// - Message frequency (daily, weekly, etc)
// - Response patterns (quick/slow replier)
// - Sentiment analysis (positive/neutral/negative)
// - Keywords indicating interest ("interested", "when", "price", "schedule")
// - Time since last message (inactive = lower score)
// Output: 0-100 score displayed in contacts list
```

---

## 3. Things to Remove

### 3.1 Dead Code & Redundancies

| Item | Location | Action | Priority |
|------|----------|--------|----------|
| Hardcoded localhost fallback | `src/lib/whatsapp/waha.ts:14` | Remove - require env var | P0 |
| Hardcoded 30-day period | `convex/subscriptionUsage.ts` | Make configurable | P1 |
| Hardcoded credit limits | `convex/subscriptionUsage.ts` | Move to tier config | P1 |
| Duplicate assignment logic | `assignContact`, `transferContact`, `unassignContact` | Consolidate | P2 |
| `contact.isDemo` field | `convex/schema.ts` | Remove - not data-driven | P3 |
| Unused imports | Multiple files | Run ESLint autofix | P3 |

### 3.2 Stub Functions to Complete or Remove

| Function | Location | Action |
|----------|----------|--------|
| `visionEstimator` | `src/inngest/functions/vision-estimator.ts` | **Complete** - high value feature |
| `pollManager` | `src/inngest/functions/poll-manager.ts` | Complete or remove from exports |
| `billingGuard` | `src/inngest/functions/billing-guard.ts` | **Complete** - needed for abuse prevention |

### 3.3 Over-Engineering to Simplify

| Current Pattern | Issue | Recommendation |
|-----------------|-------|----------------|
| Sequential campaign sender | Loops with delays, queries each contact individually | Use Inngest batch processing |
| Settings defaults in getter | Returns defaults in `getSettings` instead of schema | Use Convex schema defaults |
| Multiple onboarding components | Similar logic repeated across steps | Abstract to single configurable component |

### 3.4 Technical Debt to Address

```typescript
// 1. Fix N+1 query pattern in getAssignmentStats
// Location: convex/contacts.ts:494-512
// Current: O(contacts × agents) - loops through all contacts per agent
// Fix: Use Map for O(n) aggregation
const assignments = new Map();
contacts.forEach(c => {
    if (c.assignedTo) {
        assignments.set(c.assignedTo, (assignments.get(c.assignedTo) || 0) + 1);
    }
});

// 2. Standardize error handling
// Currently mixed: throw vs return null vs return {error}
// Fix: Use throw for all Convex mutations/queries
// Catch at API boundary and return appropriate HTTP status
```

---

## 4. Things to Improve

### 4.1 Performance Critical

| Issue | Location | Fix | Priority |
|-------|----------|-----|----------|
| No pagination | `convex/contacts.ts:listContacts` | Add cursor-based pagination | P0 |
| In-memory sorting | Multiple queries | Add DB indexes, sort in query | P1 |
| N+1 queries in campaigns | `campaigns.ts:40-47` | Batch contact fetches | P1 |
| Missing indexes | `interactions.createdAt`, `subscriptionUsage.tenantId` | Add indexes | P1 |

**Pagination Implementation:**
```typescript
// convex/contacts.ts
export const listContacts = query({
  args: {
    tenantId: v.id("tenants"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { tenantId, cursor, limit = 50 }) => {
    let query = ctx.db
      .query("contacts")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId));

    if (cursor) {
      query = query.after(cursor);
    }

    const contacts = await query.take(limit + 1);
    const hasMore = contacts.length > limit;

    return {
      contacts: contacts.slice(0, limit),
      nextCursor: hasMore ? contacts[limit - 1]._id : null,
    };
  },
});
```

### 4.2 UX Improvements

| Area | Issue | Fix | Priority |
|------|-------|-----|----------|
| Mobile responsiveness | Chat sidebar fixed 320px | Add toggle, responsive width | P1 |
| Loading states | No indicators for mutations | Add spinners on button actions | P1 |
| Error messages | Generic "Internal error" | Distinguish network/validation/server errors | P1 |
| Confirmation dialogs | Pause/delete too easy | Add "Are you sure?" modals | P2 |
| Accessibility | No alt text, color-only indicators | WCAG compliance pass | P2 |

**Error Handling Improvement:**
```typescript
// Current (bad):
catch (err) {
    toast.error("Failed to upload contacts");
}

// Improved:
catch (err) {
    if (err instanceof NetworkError) {
        toast.error("Network error. Please check your connection and try again.", {
            action: { label: "Retry", onClick: () => retry() }
        });
    } else if (err instanceof ValidationError) {
        toast.error(`Invalid data: ${err.message}`);
    } else {
        toast.error("Something went wrong. Please try again.");
        logError(err); // Send to monitoring
    }
}
```

### 4.3 Security Hardening

| Gap | Priority | Fix |
|-----|----------|-----|
| Webhook verification disabled | P0 | Re-enable HMAC validation |
| No rate limiting | P0 | Add per-IP limits (100 req/min) |
| No CORS config | P1 | Whitelist allowed origins |
| No API key rotation | P2 | Add rotation mechanism |
| No audit logging | P2 | Log who did what actions |

**Rate Limiting Implementation:**
```typescript
// src/middleware.ts or src/app/api/webhooks/whatsapp/route.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
});

// In route handler:
const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
const { success, remaining } = await ratelimit.limit(ip);

if (!success) {
  return NextResponse.json(
    { error: "Too many requests" },
    { status: 429, headers: { "X-RateLimit-Remaining": remaining.toString() } }
  );
}
```

### 4.4 Testing Requirements

Current test coverage: **0%**

**Required Test Coverage:**

| Category | Target | Focus Areas |
|----------|--------|-------------|
| Unit Tests | 70% | Business logic, utilities, AI prompts |
| Integration Tests | Key flows | Webhook → AI → WhatsApp send |
| E2E Tests | Critical paths | Signup → Connect WhatsApp → Send message |

**Testing Setup:**
```bash
# Install testing dependencies
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D @types/jest ts-jest

# Create jest.config.js
# Add test scripts to package.json
```

**Priority Test Cases:**
1. Webhook signature verification
2. Credit consumption and limits
3. Multi-tenant data isolation
4. Campaign rate limiting
5. AI response generation

---

## 5. Architecture Recommendations

### 5.1 Current vs Recommended Architecture

**Current Architecture (Single Points of Failure):**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│    WAHA     │────▶│  WhatsApp   │
│  (Next.js)  │     │ (1 VPS)     │     │    API      │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   ⚠️
       │            Single point of failure
       ▼
┌─────────────┐
│   Convex    │
│  (Database) │
└─────────────┘
```

**Recommended Architecture (High Availability):**
```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│   Vercel    │────▶│   Load Balancer      │────▶│  WhatsApp   │
│  (Next.js)  │     │   (nginx/HAProxy)    │     │    API      │
└─────────────┘     │  ┌────────────────┐  │     └─────────────┘
       │            │  │   WAHA #1      │  │
       │            │  │   WAHA #2      │  │
       │            │  │   WAHA #3      │  │
       │            │  └────────────────┘  │
       │            └──────────────────────┘
       │                      │
       ▼                      ▼
┌─────────────┐     ┌─────────────┐
│   Convex    │     │    Redis    │
│  (Database) │     │   (Cache)   │
└─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Sentry    │     │  PagerDuty  │
│ (Monitoring)│     │ (Alerting)  │
└─────────────┘     └─────────────┘
```

### 5.2 New Architecture Components

| Component | Purpose | Implementation | Priority |
|-----------|---------|----------------|----------|
| **Load Balancer** | Distribute WAHA traffic, enable failover | nginx or HAProxy on separate VPS | P1 |
| **Redis Cache** | Cache contacts, settings, quick replies (30s TTL) | Upstash Redis (serverless) | P2 |
| **Error Monitoring** | Track errors, exceptions, performance | Sentry | P0 |
| **Alerting** | Notify on failures, anomalies | PagerDuty or Slack webhooks | P1 |
| **Log Aggregation** | Centralized logging, search, analysis | Datadog or LogRocket | P2 |

### 5.3 Scalability Milestones

| Users | Current Capacity | Bottleneck | Required Solution |
|-------|------------------|------------|-------------------|
| 100 | ✅ Handles | None | Current architecture sufficient |
| 500 | ⚠️ Risky | WAHA single instance | Add WAHA redundancy |
| 1,000 | ❌ Will fail | Contact queries + WAHA | Pagination + WAHA cluster |
| 5,000 | ❌ Impossible | Database + caching | Redis cache layer |
| 10,000+ | ❌ Impossible | Everything | Full architecture redesign |

### 5.4 Caching Strategy

```typescript
// Cache frequently accessed data with Upstash Redis
const CACHE_TTL = {
  contacts: 30,      // 30 seconds - changes frequently
  settings: 300,     // 5 minutes - rarely changes
  quickReplies: 300, // 5 minutes - rarely changes
  orgMembers: 60,    // 1 minute - occasional changes
};

// Implementation pattern:
async function getContactsCached(tenantId: string) {
  const cacheKey = `contacts:${tenantId}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const contacts = await convex.query(api.contacts.list, { tenantId });
  await redis.setex(cacheKey, CACHE_TTL.contacts, JSON.stringify(contacts));

  return contacts;
}
```

---

## 6. Integration Roadmap

### 6.1 Phase 1: Essential Integrations (Month 1-2)

| Integration | Value | Complexity | Notes |
|-------------|-------|------------|-------|
| **HubSpot CRM** | High | Medium | Most popular among real estate agents |
| **Google Calendar** | High | Low | Schedule viewings from chat |
| **Outbound Webhooks** | Medium | Low | Let customers build custom integrations |

**Implementation Structure:**
```
/convex/integrations/
├── hubspot.ts       - HubSpot sync logic
├── google-calendar.ts - Calendar events
└── webhooks.ts      - Outbound event webhooks

/src/app/integrations/
├── page.tsx         - Integration marketplace
├── hubspot/
│   └── setup.tsx    - HubSpot OAuth flow
└── google-calendar/
    └── setup.tsx    - Google OAuth flow
```

### 6.2 Phase 2: Growth Integrations (Month 3-4)

| Integration | Value | Complexity |
|-------------|-------|------------|
| **Pipedrive CRM** | High | Medium |
| **Salesforce** | High | High |
| **Zapier/Make.com** | High | Medium |
| **SendGrid/Mailgun** | Medium | Low |
| **Twilio SMS** | Medium | Low |

### 6.3 Phase 3: Enterprise Features (Month 5+)

| Feature | Value | Complexity |
|---------|-------|------------|
| **White-label branding** | High | High |
| **SSO (SAML/OIDC)** | High | High |
| **Custom AI model training** | High | Very High |
| **On-premise deployment** | Medium | Very High |
| **Advanced API access** | Medium | Medium |

### 6.4 Webhook Events for Customer Integrations

```typescript
// Allow customers to subscribe to these events:
const WEBHOOK_EVENTS = [
  "message.received",      // New inbound message
  "message.sent",          // AI or manual response sent
  "contact.created",       // New contact added
  "contact.updated",       // Contact details changed
  "campaign.started",      // Campaign began sending
  "campaign.completed",    // Campaign finished
  "instance.connected",    // WhatsApp connected
  "instance.disconnected", // WhatsApp disconnected
  "credit.low",           // Credits below threshold
];

// Implementation:
export const deliverWebhook = action({
  args: { event: v.string(), payload: v.any() },
  handler: async (ctx, { event, payload }) => {
    const subscriptions = await ctx.runQuery(
      api.webhooks.getSubscriptions,
      { event }
    );

    for (const sub of subscriptions) {
      await fetch(sub.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Secret": sub.secret,
        },
        body: JSON.stringify({ event, payload, timestamp: Date.now() }),
      });
    }
  },
});
```

---

## 7. Prioritized Action Plan

### 7.1 Tier 0: Critical Blockers (Day 1)

| Task | Owner | Time | Status |
|------|-------|------|--------|
| Fix WAHA_API_URL in Vercel | DevOps | 5 min | ⬜ |
| Fix INNGEST_EVENT_KEY in Vercel | DevOps | 10 min | ⬜ |
| Re-enable webhook signature verification | Backend | 15 min | ⬜ |
| Redeploy and verify all services | DevOps | 30 min | ⬜ |

### 7.2 Tier 1: Production Readiness (Week 1-2)

| Task | Owner | Time | Status |
|------|-------|------|--------|
| Add pagination to contact queries | Backend | 2 hours | ⬜ |
| Set up Sentry error monitoring | DevOps | 1 hour | ⬜ |
| Add rate limiting to API endpoints | Backend | 2 hours | ⬜ |
| Complete vision-estimator function | Backend | 4 hours | ⬜ |
| Implement billing-guard middleware | Backend | 2 hours | ⬜ |
| Add basic analytics dashboard | Full-stack | 8 hours | ⬜ |
| Fix mobile responsiveness issues | Frontend | 4 hours | ⬜ |

### 7.3 Tier 2: Competitive Parity (Month 1)

| Task | Owner | Time | Status |
|------|-------|------|--------|
| Implement lead scoring model | Backend/ML | 16 hours | ⬜ |
| Add sentiment analysis to messages | Backend/ML | 8 hours | ⬜ |
| Build HubSpot integration | Backend | 16 hours | ⬜ |
| Add Google Calendar integration | Backend | 8 hours | ⬜ |
| Create real estate template library | Product | 8 hours | ⬜ |
| Write unit tests (70% coverage) | QA | 24 hours | ⬜ |
| Add confirmation dialogs | Frontend | 4 hours | ⬜ |
| Improve error messages | Frontend | 4 hours | ⬜ |

### 7.4 Tier 3: Differentiation (Month 2-3)

| Task | Owner | Time | Status |
|------|-------|------|--------|
| Implement conversation summarization | Backend/ML | 16 hours | ⬜ |
| Build smart reply suggestions | Backend/ML | 24 hours | ⬜ |
| Add advanced analytics with exports | Full-stack | 24 hours | ⬜ |
| Implement conversation routing | Backend | 16 hours | ⬜ |
| Build Zapier integration | Backend | 16 hours | ⬜ |
| Add audit logging | Backend | 8 hours | ⬜ |

### 7.5 Tier 4: Scale & Enterprise (Month 4+)

| Task | Owner | Time | Status |
|------|-------|------|--------|
| Set up WAHA clustering | DevOps | 16 hours | ⬜ |
| Implement Redis caching layer | Backend | 16 hours | ⬜ |
| Build A/B testing framework | Full-stack | 24 hours | ⬜ |
| Add white-label support | Full-stack | 40 hours | ⬜ |
| Implement SSO (SAML/OIDC) | Backend | 24 hours | ⬜ |

---

## 8. Success Criteria

### 8.1 Production Launch Checklist

**Must Have (Launch Blockers):**
- [ ] All 3 critical blockers resolved and tested
- [ ] Webhook signature verification enabled and working
- [ ] 70%+ code coverage with tests passing
- [ ] Error monitoring (Sentry) active and alerting
- [ ] No hardcoded secrets or localhost values
- [ ] Rate limiting on all public endpoints
- [ ] Pagination on all list queries
- [ ] Basic analytics dashboard functional

**Should Have (Launch Quality):**
- [ ] Security audit completed (no critical/high findings)
- [ ] Load testing completed (500+ concurrent users)
- [ ] Performance baseline established (<2s page loads)
- [ ] Mobile responsiveness verified
- [ ] Runbook and incident response plan documented
- [ ] Backup and restore procedures tested

**Nice to Have (Launch Excellence):**
- [ ] 90%+ code coverage
- [ ] Lead scoring functional
- [ ] At least one CRM integration live
- [ ] Real estate template library populated
- [ ] User feedback collection system active

### 8.2 Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Uptime** | 99.9% | Monitoring dashboard |
| **API Response Time (p95)** | <500ms | APM tool |
| **Page Load Time** | <2s | Lighthouse |
| **Error Rate** | <0.1% | Sentry |
| **Message Delivery Rate** | >98% | Analytics |
| **AI Response Time** | <5s | Inngest metrics |

### 8.3 User Success Metrics

| Metric | Target | Timeframe |
|--------|--------|-----------|
| **Activation Rate** | >60% | First 7 days |
| **Weekly Active Users** | >70% | Ongoing |
| **Message Response Rate** | >50% | Per contact |
| **Campaign Completion Rate** | >95% | Per campaign |
| **NPS Score** | >40 | Quarterly survey |

---

## Appendix A: File Reference

Key files mentioned in this document:

| File | Purpose |
|------|---------|
| `src/lib/whatsapp/waha.ts` | WAHA API client, webhook verification |
| `src/app/api/webhooks/whatsapp/route.ts` | Webhook endpoint |
| `src/inngest/agent.ts` | AI response generation |
| `src/inngest/functions/vision-estimator.ts` | Property vision AI (stub) |
| `src/inngest/functions/billing-guard.ts` | Credit limit middleware (stub) |
| `convex/contacts.ts` | Contact queries and mutations |
| `convex/subscriptionUsage.ts` | Credit tracking |
| `convex/schema.ts` | Database schema |

---

## Appendix B: Environment Variables

Required environment variables for production:

```bash
# WhatsApp (WAHA)
WAHA_API_URL=http://49.13.153.22:3000  # Correct Hetzner VPS
WAHA_API_KEY=<your-api-key>
WAHA_WEBHOOK_SECRET=<your-webhook-secret>

# Inngest
INNGEST_EVENT_KEY=<correct-event-key>
INNGEST_SIGNING_KEY=<signing-key>

# AI
GOOGLE_GENERATIVE_AI_API_KEY=<gemini-api-key>

# Database
NEXT_PUBLIC_CONVEX_URL=<convex-url>

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk-pub-key>
CLERK_SECRET_KEY=<clerk-secret>

# Monitoring (add these)
SENTRY_DSN=<sentry-dsn>
UPSTASH_REDIS_REST_URL=<redis-url>
UPSTASH_REDIS_REST_TOKEN=<redis-token>
```

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-12 | Claude | Initial draft |

---

*This document should be reviewed and updated as implementation progresses.*

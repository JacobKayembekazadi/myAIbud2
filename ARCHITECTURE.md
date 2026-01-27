# MyChatFlow Technical Architecture

> **Version**: 1.0
> **Last Updated**: January 2026
> **Classification**: Internal Technical Documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [High-Level Architecture](#high-level-architecture)
4. [Component Deep Dive](#component-deep-dive)
5. [Data Architecture](#data-architecture)
6. [Integration Architecture](#integration-architecture)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Deployment Architecture](#deployment-architecture)
10. [Monitoring & Observability](#monitoring--observability)
11. [Disaster Recovery](#disaster-recovery)

---

## System Overview

MyChatFlow is an enterprise-grade WhatsApp AI automation platform built on a modern serverless architecture. The system processes thousands of messages daily, providing intelligent AI responses with sub-2-second latency.

### Key Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Message Processing Latency | < 2s | ~1.2s |
| System Uptime | 99.9% | 99.95% |
| Concurrent Conversations | 10,000+ | Tested 5,000 |
| AI Response Accuracy | > 95% | ~97% |

### Technology Stack Summary

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION                               │
│           Next.js 15.5 │ React 19 │ Tailwind CSS │ Radix UI        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                          APPLICATION                                 │
│          API Routes │ Server Actions │ React Server Components      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                      EVENT PROCESSING                                │
│                    Inngest (Event-Driven)                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES                                     │
│    LLM (OpenAI/Gemini/Claude) │ WAHA │ Clerk │ Resend │ Redis      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                           DATA                                       │
│                Convex (Real-time Serverless DB)                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Principles

### 1. Serverless-First
All compute is serverless, eliminating infrastructure management and enabling automatic scaling.

### 2. Event-Driven
Message processing uses event-driven architecture via Inngest, ensuring reliable, async processing with automatic retries.

### 3. Multi-Tenant Isolation
Each customer's data is logically isolated using tenant IDs at the database level, with row-level security patterns.

### 4. Provider-Agnostic
LLM providers are abstracted behind a unified interface with automatic fallback, preventing vendor lock-in.

### 5. Real-Time by Default
Convex provides real-time subscriptions, enabling live dashboards and instant message updates.

### 6. Fail-Safe Design
Circuit breakers, fallback providers, and graceful degradation ensure system reliability.

---

## High-Level Architecture

### Message Processing Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   WhatsApp   │────▶│    WAHA      │────▶│   Webhook    │
│   Customer   │     │   Gateway    │     │   Endpoint   │
└──────────────┘     └──────────────┘     └──────────────┘
                                                  │
                                                  ▼
                     ┌─────────────────────────────────────┐
                     │         Inngest Event Bus           │
                     │     (message.upsert triggered)      │
                     └─────────────────────────────────────┘
                                                  │
                     ┌────────────────────────────┼────────────────────────────┐
                     │                            │                            │
                     ▼                            ▼                            ▼
            ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
            │  AI Response   │          │  Lead Scoring  │          │  Analytics     │
            │  Generation    │          │  & Enrichment  │          │  Recording     │
            └────────────────┘          └────────────────┘          └────────────────┘
                     │
                     ▼
            ┌────────────────┐
            │  Multi-LLM     │
            │  Orchestrator  │
            │                │
            │ ┌────────────┐ │
            │ │  OpenAI    │◀┼── Primary (fastest)
            │ └────────────┘ │
            │       │        │
            │       ▼        │
            │ ┌────────────┐ │
            │ │  Gemini    │◀┼── Fallback
            │ └────────────┘ │
            │       │        │
            │       ▼        │
            │ ┌────────────┐ │
            │ │  Claude    │◀┼── Tertiary
            │ └────────────┘ │
            └────────────────┘
                     │
                     ▼
            ┌────────────────┐     ┌──────────────┐     ┌──────────────┐
            │  WAHA API      │────▶│   WhatsApp   │────▶│   Customer   │
            │  Send Message  │     │   Delivery   │     │   Receives   │
            └────────────────┘     └──────────────┘     └──────────────┘
```

### Dashboard Real-Time Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │◀───▶│   Convex     │◀───▶│   Convex     │
│   (React)    │     │   Client     │     │   Backend    │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │
       │    WebSocket       │
       │    Real-time       │
       │    Subscription    │
       ▼                    ▼
┌─────────────────────────────────────┐
│         Live Dashboard              │
│  • New messages appear instantly    │
│  • Lead scores update in real-time  │
│  • Analytics refresh automatically  │
└─────────────────────────────────────┘
```

---

## Component Deep Dive

### 1. Webhook Handler (`/api/webhooks/whatsapp`)

**Purpose**: Receives and validates incoming WhatsApp messages from WAHA.

**Security Features**:
- HMAC-SHA256 signature verification
- Replay attack prevention (timestamp validation)
- Rate limiting (100 req/min per IP)

**Flow**:
```typescript
// Simplified flow
1. Receive POST request from WAHA
2. Verify X-Webhook-Signature header
3. Parse message payload
4. Emit Inngest event: message.upsert
5. Return 200 OK immediately (async processing)
```

**Error Handling**:
- Invalid signature → 401 Unauthorized
- Malformed payload → 400 Bad Request
- Processing error → 500 (logged to Sentry)

### 2. AI Agent (`/src/inngest/agent.ts`)

**Purpose**: Core message processing and AI response generation.

**Processing Steps**:

```
Step 1: Validate Message
    ├── Check tenant exists
    ├── Check instance is active
    └── Validate message format

Step 2: Upsert Contact
    ├── Create new contact if first message
    └── Update existing contact metadata

Step 3: Store Interaction
    ├── Save incoming message to database
    └── Update contact lastMessageAt

Step 4: Check Activation
    ├── Always On → Continue
    ├── Keyword Triggered → Check keywords
    ├── Business Hours → Check schedule
    └── New Contacts Only → Check if first message

Step 5: Detect Language
    ├── Auto-detect from message content
    └── Update contact preferred language

Step 6: Check Handoff Keywords
    ├── Match against handoff triggers
    └── Create notification if matched

Step 7: Score Lead
    ├── Calculate engagement score
    ├── Detect buying intent
    └── Assign A-F grade

Step 8: Build Context
    ├── Retrieve recent conversation history
    ├── Build system prompt with business context
    └── Include quick replies as knowledge base

Step 9: Generate AI Response
    ├── Primary: OpenAI GPT-4o-mini
    ├── Fallback: Google Gemini 2.0 Flash
    └── Tertiary: Anthropic Claude 3.5 Haiku

Step 10: Send Response
    ├── Call WAHA API to send message
    └── Store outgoing interaction

Step 11: Schedule Follow-ups
    ├── Check if follow-up sequence configured
    └── Schedule next follow-up if applicable
```

### 3. Multi-LLM Orchestrator (`/src/lib/llm/index.ts`)

**Purpose**: Provider-agnostic LLM with automatic failover.

**Features**:
- Circuit breaker pattern (3 failures → open circuit)
- Automatic retry with exponential backoff
- Latency tracking and monitoring
- Token usage reporting

**Circuit Breaker States**:
```
CLOSED ──(3 failures)──▶ OPEN
   ▲                        │
   │                        │ (60s cooldown)
   │                        ▼
   └───(success)─── HALF-OPEN
```

**Configuration**:
```typescript
const LLMPresets = {
  fast: {
    primary: { provider: "openai", model: "gpt-4o-mini" },
    fallback: { provider: "anthropic", model: "claude-3-5-haiku-latest" },
    tertiary: { provider: "gemini", model: "gemini-2.0-flash" },
  },
  quality: {
    primary: { provider: "openai", model: "gpt-4o" },
    fallback: { provider: "anthropic", model: "claude-3-5-sonnet-latest" },
    tertiary: { provider: "gemini", model: "gemini-1.5-pro" },
  },
  vision: {
    primary: { provider: "gemini", model: "gemini-2.0-flash" },
    fallback: { provider: "openai", model: "gpt-4o" },
  },
};
```

### 4. Lead Scoring Engine (`/convex/leadScoring.ts`)

**Purpose**: Automatically qualify and prioritize leads.

**Scoring Algorithm**:

```
Base Score: 0-100

Engagement Signals (+points):
  • Message count: +2 per message (max 30)
  • Response speed: +10 if < 5 min
  • Conversation depth: +5 per question asked

Intent Signals (+points):
  • Price inquiry: +15
  • Availability check: +15
  • Scheduling request: +20
  • Urgent language: +10

Recency Decay (-points):
  • Last message > 24h: -5
  • Last message > 72h: -15
  • Last message > 7d: -30

Grade Mapping:
  A: 80-100 (Hot Lead)
  B: 60-79  (Warm Lead)
  C: 40-59  (Interested)
  D: 20-39  (Cold)
  F: 0-19   (Inactive)
```

### 5. Analytics Engine (`/convex/analytics.ts`)

**Purpose**: Real-time metrics and reporting.

**Tracked Events**:
| Event | Description |
|-------|-------------|
| `message_received` | Incoming customer message |
| `message_sent` | Outgoing AI response |
| `lead_scored` | Lead score calculated |
| `handoff_triggered` | Escalation to human |
| `appointment_booked` | Calendar booking |
| `followup_sent` | Automated follow-up |

**Aggregation Strategy**:
- Real-time: Stored as individual events
- Hourly: Aggregated summaries created
- Daily: Dashboard rollups computed

---

## Data Architecture

### Database: Convex

Convex is a serverless, real-time database with built-in TypeScript support.

**Key Characteristics**:
- Real-time subscriptions (WebSocket)
- Automatic caching
- ACID transactions
- Serverless scaling

### Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           TENANT LAYER                               │
├─────────────────────────────────────────────────────────────────────┤
│  organizations ◄──┬──► teamMembers ◄──► users (Clerk)               │
│        │          │                                                  │
│        ▼          │                                                  │
│    tenants ◄──────┘                                                 │
│        │                                                             │
│        ├──────────────────┬──────────────────┬─────────────────┐    │
│        ▼                  ▼                  ▼                 ▼    │
│   instances          settings          quickReplies      campaigns  │
│        │                                                             │
│        ▼                                                             │
│   contacts ◄───────────────────────────────────────────────────┐    │
│        │                                                        │    │
│        ├─────────────┬─────────────┬─────────────┐             │    │
│        ▼             ▼             ▼             ▼             │    │
│  interactions   appointments   followups   notifications       │    │
│        │                                                        │    │
│        ▼                                                        │    │
│  analyticsEvents ──────────────────────────────► analyticsSummary   │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Tables

#### `tenants`
Primary account entity. Each paying customer has one tenant.

```typescript
{
  _id: Id<"tenants">,
  clerkUserId: string,          // Links to Clerk auth
  email: string,
  name: string,
  plan: "free" | "starter" | "pro" | "enterprise",
  credits: number,              // Usage credits
  createdAt: number,
  updatedAt: number,
}
```

#### `organizations`
Team workspaces for multi-user accounts.

```typescript
{
  _id: Id<"organizations">,
  clerkOrganizationId: string,
  name: string,
  ownerId: Id<"tenants">,
  plan: "team" | "business" | "enterprise",
  createdAt: number,
}
```

#### `instances`
WhatsApp connections (phone numbers).

```typescript
{
  _id: Id<"instances">,
  tenantId: Id<"tenants">,
  organizationId?: Id<"organizations">,
  instanceId: string,           // WAHA instance ID
  name: string,                 // Display name
  phoneNumber?: string,
  status: "connected" | "disconnected" | "pending",
  qrCode?: string,
  webhookConfigured: boolean,
  createdAt: number,
}
```

#### `contacts`
Customer records from WhatsApp.

```typescript
{
  _id: Id<"contacts">,
  tenantId: Id<"tenants">,
  instanceId: string,
  waId: string,                 // WhatsApp ID (phone@c.us)
  name?: string,
  profilePictureUrl?: string,
  // Lead management
  leadScore: number,
  leadGrade: "A" | "B" | "C" | "D" | "F",
  isHandedOff: boolean,
  handoffReason?: string,
  // Preferences
  preferredLanguage?: string,
  tags: string[],
  notes?: string,
  // Timestamps
  firstMessageAt: number,
  lastMessageAt: number,
  createdAt: number,
}
```

#### `interactions`
Message history (incoming and outgoing).

```typescript
{
  _id: Id<"interactions">,
  tenantId: Id<"tenants">,
  contactId: Id<"contacts">,
  instanceId: string,
  messageId: string,            // WAHA message ID
  direction: "incoming" | "outgoing",
  type: "text" | "image" | "document" | "audio" | "video",
  content: string,
  mediaUrl?: string,
  // AI metadata
  aiGenerated: boolean,
  llmProvider?: string,
  llmModel?: string,
  latencyMs?: number,
  // Status
  status: "sent" | "delivered" | "read" | "failed",
  timestamp: number,
}
```

#### `settings`
Tenant configuration.

```typescript
{
  _id: Id<"settings">,
  tenantId: Id<"tenants">,
  // AI Configuration
  autoReplyEnabled: boolean,
  aiTemperature: number,
  aiMaxTokens: number,
  // LLM Providers
  primaryLlmProvider: "openai" | "gemini" | "anthropic",
  primaryLlmModel: string,
  fallbackLlmProvider: "openai" | "gemini" | "anthropic",
  fallbackLlmModel: string,
  llmTimeoutMs: number,
  // Business Profile
  businessName?: string,
  industry: string,
  businessDescription?: string,
  // Activation
  agentActivationMode: "always_on" | "keyword_triggered" | "business_hours" | "new_contacts_only",
  activationKeywords: string[],
  // Language
  multiLanguageEnabled: boolean,
  defaultLanguage: string,
  supportedLanguages: string[],
  // Features
  handoffEnabled: boolean,
  handoffKeywords: string[],
  followUpEnabled: boolean,
  leadScoringEnabled: boolean,
  appointmentBookingEnabled: boolean,
  // ... more settings
}
```

### Indexes

```typescript
// Performance-critical indexes
contacts: {
  by_tenant: ["tenantId"],
  by_tenant_and_wa_id: ["tenantId", "waId"],
  by_lead_grade: ["tenantId", "leadGrade"],
}

interactions: {
  by_contact: ["contactId"],
  by_tenant: ["tenantId"],
  by_tenant_and_time: ["tenantId", "timestamp"],
}

analyticsEvents: {
  by_tenant_and_time: ["tenantId", "timestamp"],
  by_tenant_and_type: ["tenantId", "eventType"],
}
```

---

## Integration Architecture

### External Service Integrations

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MyChatFlow Core                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│    │  Clerk   │    │   WAHA   │    │ Inngest  │    │  Resend  │   │
│    │  (Auth)  │    │(WhatsApp)│    │  (Jobs)  │    │ (Email)  │   │
│    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘   │
│         │               │               │               │          │
│         ▼               ▼               ▼               ▼          │
│    ┌─────────────────────────────────────────────────────────────┐ │
│    │                    Service Layer                             │ │
│    └─────────────────────────────────────────────────────────────┘ │
│         │               │               │               │          │
│         ▼               ▼               ▼               ▼          │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐   │
│    │  OpenAI  │    │  Gemini  │    │  Claude  │    │  Redis   │   │
│    │  (LLM)   │    │  (LLM)   │    │  (LLM)   │    │ (Cache)  │   │
│    └──────────┘    └──────────┘    └──────────┘    └──────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### WAHA Integration

**Protocol**: HTTP REST API

**Endpoints Used**:
| Endpoint | Purpose |
|----------|---------|
| `POST /api/sendText` | Send text message |
| `POST /api/sendImage` | Send image with caption |
| `GET /api/{session}/me` | Get account info |
| `GET /api/sessions` | List active sessions |
| `POST /api/sessions/start` | Start new session |
| `GET /api/{session}/auth/qr` | Get QR code for pairing |

**Webhook Events Received**:
| Event | Trigger |
|-------|---------|
| `message` | New incoming message |
| `message.ack` | Delivery/read receipt |
| `session.status` | Connection status change |

### Clerk Integration

**Authentication Flow**:
```
1. User signs in via Clerk UI
2. Clerk issues JWT token
3. Token sent with API requests
4. API validates via Clerk SDK
5. User ID extracted for tenant lookup
```

**Webhook Events**:
| Event | Action |
|-------|--------|
| `user.created` | Create tenant record |
| `user.updated` | Sync profile changes |
| `organization.created` | Create organization record |
| `organization.membership.created` | Add team member |

### Inngest Integration

**Event-Driven Processing**:
```typescript
// Event emission (webhook handler)
await inngest.send({
  name: "message.upsert",
  data: { tenantId, instanceId, message },
});

// Event handler (agent function)
inngest.createFunction(
  { id: "ai-agent", retries: 3 },
  { event: "message.upsert" },
  async ({ event, step }) => {
    // Process message with retries
  }
);
```

**Scheduled Jobs**:
| Schedule | Function | Purpose |
|----------|----------|---------|
| `0 * * * *` | `analytics.aggregate` | Hourly metrics rollup |
| `0 0 * * *` | `retention.cleanup` | Data retention enforcement |
| `*/5 * * * *` | `followup.check` | Send due follow-ups |

---

## Security Architecture

### Authentication & Authorization

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Security Layers                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Layer 1: Edge (Vercel)                                             │
│  ├── TLS 1.3 encryption                                             │
│  ├── DDoS protection                                                │
│  └── Geographic routing                                              │
│                                                                      │
│  Layer 2: Authentication (Clerk)                                    │
│  ├── JWT token validation                                           │
│  ├── Session management                                             │
│  ├── MFA support                                                     │
│  └── OAuth providers                                                 │
│                                                                      │
│  Layer 3: Authorization (Application)                               │
│  ├── Role-based access control                                      │
│  ├── Tenant isolation                                               │
│  └── Resource-level permissions                                      │
│                                                                      │
│  Layer 4: Data (Convex)                                             │
│  ├── Row-level security patterns                                    │
│  ├── Encrypted at rest                                              │
│  └── Audit logging                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Owner** | Full access, billing, delete account |
| **Admin** | Manage team, settings, all conversations |
| **Agent** | View/respond conversations, use dashboard |
| **Viewer** | Read-only access to dashboard |

### Webhook Security

**HMAC-SHA256 Verification**:
```typescript
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}
```

### Data Protection

| Data Type | Protection |
|-----------|------------|
| Messages | Encrypted at rest (Convex) |
| API Keys | Environment variables only |
| Passwords | Managed by Clerk (bcrypt) |
| PII | Access logged, retention policies |

### Compliance Readiness

| Standard | Status | Notes |
|----------|--------|-------|
| GDPR | Ready | Data export, deletion APIs |
| HIPAA | Architecture Ready | Requires BAA with providers |
| SOC2 | Architecture Ready | Audit logging in place |

---

## Scalability & Performance

### Auto-Scaling Architecture

```
                    ┌─────────────────┐
                    │  Load Balancer  │
                    │   (Vercel Edge) │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ Function │  │ Function │  │ Function │
        │ Instance │  │ Instance │  │ Instance │
        └──────────┘  └──────────┘  └──────────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Convex  │  │ Inngest  │  │   LLM    │
        │ (scales) │  │ (scales) │  │  APIs    │
        └──────────┘  └──────────┘  └──────────┘
```

### Performance Optimizations

| Component | Optimization |
|-----------|--------------|
| LLM Calls | Circuit breaker, timeouts, fallback |
| Database | Indexed queries, pagination |
| Real-time | WebSocket multiplexing |
| API Routes | Edge caching where applicable |
| Images | CDN delivery, lazy loading |

### Rate Limiting

```typescript
// Redis-backed rate limiting
const rateLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, "1m"),
  analytics: true,
});

// Per-IP limiting for webhooks
const { success, limit, remaining } = await rateLimiter.limit(clientIP);
```

### Capacity Planning

| Tier | Messages/Day | Concurrent Users | LLM Calls/Day |
|------|--------------|------------------|---------------|
| Starter | 500 | 10 | 500 |
| Pro | 5,000 | 100 | 5,000 |
| Enterprise | 50,000+ | 1,000+ | 50,000+ |

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Vercel (Application Hosting)                                       │
│  ├── Edge Network (Global CDN)                                      │
│  ├── Serverless Functions (API Routes)                              │
│  ├── Static Assets (React App)                                      │
│  └── Environment Variables (Secrets)                                │
│                                                                      │
│  Convex (Database)                                                  │
│  ├── Production Deployment                                          │
│  ├── Real-time Subscriptions                                        │
│  └── File Storage                                                   │
│                                                                      │
│  WAHA (WhatsApp API)                                                │
│  ├── Docker Container (DigitalOcean/AWS)                            │
│  ├── Persistent Session Storage                                     │
│  └── Webhook Endpoint Configured                                    │
│                                                                      │
│  External Services                                                  │
│  ├── Clerk (Authentication)                                         │
│  ├── Inngest (Background Jobs)                                      │
│  ├── Upstash Redis (Rate Limiting)                                  │
│  ├── Sentry (Error Monitoring)                                      │
│  └── Resend (Email)                                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Commit  │────▶│   CI/CD  │────▶│  Preview │────▶│Production│
│  (main)  │     │ (GitHub) │     │  Deploy  │     │  Deploy  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                       │
                       ├── Type Check
                       ├── Lint
                       ├── Build
                       └── Deploy
```

### Environment Configuration

| Environment | Branch | URL | Purpose |
|-------------|--------|-----|---------|
| Production | `main` | mychatflow.app | Live customers |
| Preview | `feature/*` | *.vercel.app | PR previews |
| Development | local | localhost:3000 | Local dev |

---

## Monitoring & Observability

### Metrics Collection

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Observability Stack                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Application Metrics (Vercel Analytics)                             │
│  ├── Request latency (p50, p95, p99)                                │
│  ├── Error rates                                                     │
│  ├── Cold start frequency                                           │
│  └── Geographic distribution                                         │
│                                                                      │
│  Error Tracking (Sentry)                                            │
│  ├── Exception capture                                              │
│  ├── Stack traces                                                   │
│  ├── User context                                                   │
│  └── Release tracking                                               │
│                                                                      │
│  Business Metrics (Custom Analytics)                                │
│  ├── Messages processed                                             │
│  ├── AI response latency                                            │
│  ├── Lead conversion rates                                          │
│  └── Feature usage                                                  │
│                                                                      │
│  Infrastructure (Inngest Dashboard)                                 │
│  ├── Function execution times                                       │
│  ├── Retry rates                                                    │
│  └── Queue depths                                                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 1% 5xx errors | Critical |
| Slow AI Response | p95 > 5s | Warning |
| Circuit Breaker Open | Any provider | Warning |
| Webhook Failures | > 5 in 5min | Critical |
| Database Errors | Any mutation failure | Critical |

### Logging Strategy

```typescript
// Structured logging format
{
  level: "info" | "warn" | "error",
  message: "AI response generated",
  tenantId: "j57...",
  contactId: "k28...",
  provider: "openai",
  model: "gpt-4o-mini",
  latencyMs: 1234,
  tokensUsed: 456,
  usedFallback: false,
  timestamp: "2024-01-15T10:30:00Z"
}
```

---

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Continuous | 30 days | Convex Cloud |
| File Storage | Real-time | 90 days | Convex Storage |
| Configuration | Per-deploy | Unlimited | Git |

### Recovery Procedures

**Scenario 1: LLM Provider Outage**
```
1. Circuit breaker opens automatically
2. Traffic routes to fallback provider
3. Alert sent to operations
4. Monitor until primary recovers
5. Circuit breaker resets after 60s
```

**Scenario 2: WAHA Instance Down**
```
1. Webhooks fail with timeout
2. Inngest retries (3 attempts)
3. Alert triggered after 3 failures
4. Manual intervention: restart WAHA
5. Messages queued, processing resumes
```

**Scenario 3: Database Issue**
```
1. Convex handles failover automatically
2. Queries may have brief latency spike
3. No data loss (ACID transactions)
4. Monitor dashboard for anomalies
```

### RTO/RPO Targets

| Scenario | RTO (Recovery Time) | RPO (Data Loss) |
|----------|---------------------|-----------------|
| LLM Outage | < 1 second (auto-failover) | 0 |
| WAHA Restart | < 5 minutes | 0 (queued) |
| Full Restore | < 1 hour | < 1 minute |

---

## Appendix

### A. Technology Versions

| Technology | Version |
|------------|---------|
| Next.js | 15.5.x |
| React | 19.x |
| TypeScript | 5.9.x |
| Convex | Latest |
| Inngest | 3.x |
| Tailwind CSS | 4.x |

### B. API Rate Limits

| Service | Limit |
|---------|-------|
| OpenAI | 10,000 RPM (tier 2) |
| Gemini | 1,500 RPM |
| Anthropic | 4,000 RPM |
| WAHA | No limit (self-hosted) |

### C. Environment Variables Reference

See `.env.example` for complete list.

---

*Document maintained by MyChatFlow Engineering Team*

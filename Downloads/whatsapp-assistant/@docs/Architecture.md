# System Architecture - MyChatFlow

> **Last Updated:** January 10, 2026  
> **Current Stack:** Next.js 15.5.9 + Convex + WAHA Plus 2026.x + Clerk

---

## High-Level Architecture Overview

MyChatFlow is a serverless-first SaaS application using modern web technologies and event-driven architecture. The system processes WhatsApp messages through AI-powered agents while enforcing credit-based subscription limits.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│   │  Dashboard  │    │   Chats     │    │  Campaigns  │                     │
│   │   (Home)    │    │   (Inbox)   │    │   (Bulk)    │                     │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                     │
│          │                   │                  │                            │
│          └───────────────────┴──────────────────┘                            │
│                              │                                               │
│                    ┌─────────┴─────────┐                                     │
│                    │   Next.js 15.5.9  │                                     │
│                    │   (Vercel)        │                                     │
│                    └─────────┬─────────┘                                     │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────────┐
│                          API LAYER                                           │
├──────────────────────────────┼───────────────────────────────────────────────┤
│                              │                                               │
│   ┌──────────────────────────┴──────────────────────────┐                   │
│   │                                                      │                   │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐     │                   │
│   │  │  Clerk     │  │ Server     │  │ Webhooks   │     │                   │
│   │  │  (Auth)    │  │ Actions    │  │ (WhatsApp) │     │                   │
│   │  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘     │                   │
│   │        │               │               │             │                   │
│   └────────┴───────────────┴───────────────┴─────────────┘                   │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────────┐
│                        DATA/SERVICE LAYER                                    │
├──────────────────────────────┼───────────────────────────────────────────────┤
│                              │                                               │
│   ┌─────────────┐   ┌───────┴───────┐   ┌─────────────┐                     │
│   │   Convex    │◀──│   Inngest     │──▶│   Gemini    │                     │
│   │  (Database) │   │   (Queue)     │   │   (AI)      │                     │
│   └─────────────┘   └───────────────┘   └─────────────┘                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                      │
├──────────────────────────────┼───────────────────────────────────────────────┤
│                              │                                               │
│   ┌─────────────────────────────────────────────────────┐                   │
│   │                    WAHA Plus 2026.x                 │                   │
│   │              (Hetzner VPS: 49.13.153.22)            │                   │
│   │   ┌─────────────┐   ┌─────────────┐                 │                   │
│   │   │  Session 1  │   │  Session 2  │   ...           │                   │
│   │   │  (Agent A)  │   │  (Agent B)  │                 │                   │
│   │   └──────┬──────┘   └──────┬──────┘                 │                   │
│   │          │                  │                        │                   │
│   │          └────────┬─────────┘                        │                   │
│   │                   │                                  │                   │
│   └───────────────────┼──────────────────────────────────┘                   │
│                       │                                                      │
│              ┌────────┴────────┐                                             │
│              │    WhatsApp     │                                             │
│              │    (Mobile)     │                                             │
│              └─────────────────┘                                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend Layer (Next.js 15.5.9)

**Deployment:** Vercel (automatic scaling, CDN, edge functions)

**Key Features:**
- **Skeleton Loading States:** All pages show loading skeletons during data fetch
- **Real-time Updates:** Convex subscriptions for live data
- **Toast Notifications:** Success/error feedback via Sonner
- **Collapsible Sidebar:** localStorage-persisted navigation
- **Premium Auth UI:** Split-screen Sign-In/Sign-Up

### 2. Authentication Layer (Clerk)

**Configuration:**
- **Custom Domain:** clerk.mychatflow.app
- **Convex Integration:** JWT validation with custom issuer
- **OAuth:** Google Sign-In configured

### 3. Database Layer (Convex)

**Schema Tables:**
- `tenants` - User accounts (indexed by clerkId)
- `instances` - WhatsApp instances (indexed by tenantId, instanceId)
- `contacts` - WhatsApp contacts (indexed by tenantId, phone+instanceId)
- `interactions` - Message history (indexed by contactId, tenantId)
- `subscriptionUsage` - Credit tracking (indexed by tenantId)
- `campaigns` - Bulk message campaigns (indexed by tenantId)
- `settings` - Per-tenant AI configuration (indexed by tenantId)
- `quickReplies` - Response templates (indexed by tenantId)

### 4. WhatsApp Layer (WAHA Plus 2026.x)

**Server Setup:**
- **IP:** 49.13.153.22 (Hetzner VPS)
- **Port:** 3000
- **API Key:** Header-based authentication

**Key Endpoints (WAHA 2026.x):**
- `POST /api/sessions/` - Create session
- `GET /api/sessions/{session}` - Get session status
- `GET /api/{session}/auth/qr` - Get QR code (returns PNG binary)
- `POST /api/sessions/{session}/messages/send/text` - Send message
- `GET /api/sessions/{session}/chats` - List chats

**Webhook Events:**
- `message` - Incoming messages
- `session.status` - Connection status changes

---

## Data Flow Diagrams

### QR Code Connection Flow

```
User clicks "Show QR"
        │
        ▼
┌───────────────────┐
│ fetchQRCode()     │
│ (Server Action)   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ GET /api/{session}│
│ /auth/qr          │
│ (WAHA 2026.x)     │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ PNG Binary        │
│ → Base64 Data URL │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Display in <img>  │
│ with 60s timer    │
└────────┬──────────┘
         │
    User scans QR
         │
         ▼
┌───────────────────┐
│ WAHA sends        │
│ session.status    │
│ webhook           │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Update Convex     │
│ instance status   │
└───────────────────┘
```

### Incoming Message & AI Response Flow

```
WhatsApp → WAHA Server → Webhook POST → Vercel API
                                │
                        Verify signature
                                │
                                ▼
                   ┌────────────────────────┐
                   │ Check event type       │
                   │ session.status?        │
                   │ message?               │
                   └───────────┬────────────┘
                               │
        ┌──────────────────────┴──────────────────────┐
        │                                              │
        ▼                                              ▼
┌───────────────┐                           ┌───────────────┐
│ session.status│                           │ message       │
│ → Update      │                           │ → Process     │
│   instance    │                           │   message     │
└───────────────┘                           └───────┬───────┘
                                                    │
                                                    ▼
                                        ┌───────────────────┐
                                        │ Upsert contact    │
                                        │ Log interaction   │
                                        └─────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │ Trigger Inngest   │
                                        │ message.upsert    │
                                        └─────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │ Check credits     │
                                        │ Check if paused   │
                                        └─────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │ Generate AI       │
                                        │ response (Gemini) │
                                        └─────────┬─────────┘
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │ Send via WAHA     │
                                        │ Decrement credits │
                                        └───────────────────┘
```

---

## Infrastructure Details

### Vercel Environment Configuration

All production environment variables managed in Vercel project settings:
- WAHA API credentials
- Gemini API key
- Convex deployment URLs
- Clerk secrets
- Inngest keys
- App URL for webhooks

### Convex Auth Configuration

```typescript
// convex/auth.config.ts
export default {
  providers: [
    {
      domain: "https://clerk.mychatflow.app",
      applicationID: "convex",
    },
  ],
};
```

---

## Multi-Tenant Architecture

### Tenant Isolation

All queries are scoped by `tenantId`:
- Instances: `withIndex("by_tenant", q => q.eq("tenantId", tenantId))`
- Contacts: `withIndex("by_tenant", q => q.eq("tenantId", tenantId))`
- Interactions: `withIndex("by_tenant", q => q.eq("tenantId", tenantId))`
- Campaigns: `withIndex("by_tenant", q => q.eq("tenantId", tenantId))`

### Credit System

- Each tenant has a `subscriptionUsage` record
- Default: 400 credits/month (Starter tier)
- 1 credit = 1 AI interaction (inbound + outbound)
- AI agent checks credits before responding
- System blocks when credits exhausted

---

*This architecture document reflects the current state of MyChatFlow as of January 10, 2026.*

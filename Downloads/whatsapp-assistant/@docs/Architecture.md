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
- `tenants` - User accounts with onboarding tracking (indexed by clerkId)
  - Includes: `onboardingCompleted`, `onboardingStep`, `hasCreatedInstance`, `hasConnectedWhatsApp`, `hasSyncedContacts`, `hasTestedAI`
- `instances` - WhatsApp instances (indexed by tenantId, instanceId)
- `contacts` - WhatsApp contacts with notes/tags (indexed by tenantId, phone+instanceId, status)
  - Includes: `notes`, `isDemo`, `tags[]`
  - New index: `by_status` for filtered queries
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

---

## Onboarding System Architecture

The onboarding system provides a guided setup experience for new users.

### Components

```
SetupWizard (Modal)
    ├── WelcomeStep       → Feature overview, Get Started button
    ├── CreateInstanceStep → Inline form to create WhatsApp instance
    ├── ScanQRStep        → QR code display with auto-detect connection
    └── TestAIStep        → Demo conversation with simulated AI
```

### Onboarding State (Tenant Record)

```typescript
tenants: {
  onboardingCompleted: boolean,  // True when all steps complete
  onboardingStep: number,        // Current step (0-4)
  hasCreatedInstance: boolean,   // Step 1 complete
  hasConnectedWhatsApp: boolean, // Step 2 complete
  hasSyncedContacts: boolean,    // Step 3 complete
  hasTestedAI: boolean,          // Step 4 complete
}
```

### Progress Widget

Located on dashboard, shows:
- Completion percentage
- Checklist of 4 steps with checkmarks
- "Continue Setup" button to resume wizard

---

## Contacts Management Architecture

Full contact management system with CRUD, bulk actions, and import/export.

### Contact Mutations

```typescript
// convex/contacts.ts
updateContact({ contactId, name?, tags?, notes?, status? })
deleteContact({ contactId })
bulkPauseContacts({ contactIds[] })
bulkResumeContacts({ contactIds[] })
bulkDeleteContacts({ contactIds[] })
importContacts({ tenantId, instanceId, contacts[] })
getContactsForExport({ tenantId })
createDemoContact({ tenantId, instanceId })
```

### UI Components

```
src/components/contacts/
    ├── ContactDetailsDialog.tsx  → Edit contact modal
    ├── ImportContactsDialog.tsx  → CSV import with preview
    └── ExportContactsButton.tsx  → One-click CSV export

src/app/contacts/page.tsx        → Full contacts table with bulk actions
src/app/chat/layout.tsx          → Search/filter sidebar
```

### Contact Status Flow

```
new → active ←→ paused
        ↓
     (deleted)
```

---

*This architecture document reflects the current state of MyChatFlow as of January 10, 2026.*

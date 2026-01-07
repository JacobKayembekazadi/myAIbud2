# System Architecture - My Aibud WhatsApp System

> **Last Updated:** January 7, 2026  
> **Current Stack:** Next.js 16 + Convex + WAHA Plus + Clerk

---

## High-Level Architecture Overview

My Aibud is a serverless-first SaaS application using modern web technologies and event-driven architecture. The system processes WhatsApp messages through AI-powered agents while enforcing credit-based subscription limits.

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
│                    │   Next.js 16      │                                     │
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
│   │                    WAHA Plus                         │                   │
│   │              (Hetzner VPS + Coolify)                 │                   │
│   │   ┌─────────────┐   ┌─────────────┐                  │                   │
│   │   │  Session 1  │   │  Session 2  │   ...            │                   │
│   │   │  (Agent A)  │   │  (Agent B)  │                  │                   │
│   │   └──────┬──────┘   └──────┬──────┘                  │                   │
│   │          │                  │                         │                   │
│   │          └────────┬─────────┘                         │                   │
│   │                   │                                   │                   │
│   └───────────────────┼───────────────────────────────────┘                   │
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

### 1. Frontend Layer (Next.js 16)

**Deployment:** Vercel (automatic scaling, CDN, edge functions)

**Key Features:**
- Server Components for optimal performance
- Server Actions for form handling
- Real-time updates via Convex subscriptions
- Responsive dark-themed UI (Shadcn/ui)

**Route Structure:**
```
/                    → Dashboard (stats, quick actions)
/instances           → WhatsApp instance management
/chat                → Contact list sidebar
/chat/[contactId]    → Individual conversation view
/campaigns           → Bulk messaging campaigns
/sign-in             → Clerk authentication
/sign-up             → Clerk registration
```

### 2. Authentication Layer (Clerk)

**Features:**
- OAuth providers (Google, GitHub)
- Email/password authentication
- Session management
- Multi-tenant user isolation

**Integration Points:**
- Middleware: Route protection
- TenantProvider: User context
- Convex: User ID for data isolation

### 3. Database Layer (Convex)

**Why Convex:**
- Real-time subscriptions (no polling)
- TypeScript-first with auto-generated types
- Serverless (no connection management)
- Built-in file storage

**Schema Overview:**
```
tenants          → SaaS customers (linked to Clerk users)
instances        → WhatsApp connections per tenant
contacts         → Leads/contacts with status tracking
interactions     → Complete message history
campaigns        → Bulk messaging campaigns
```

**Key Queries/Mutations:**
```typescript
// Queries (read)
api.tenants.getTenant({ clerkId })
api.instances.listInstances({ tenantId })
api.contacts.listContacts({ tenantId })

// Mutations (write)
api.instances.createInstance({ tenantId, name, instanceId })
api.instances.deleteInstance({ instanceId })
api.contacts.upsertContact({ tenantId, phone, name })
```

### 4. WhatsApp Layer (WAHA Plus)

**Why WAHA Plus:**
- ✅ Unlimited instances (vs 1 in free version)
- ✅ Reliable QR code generation
- ✅ Active maintenance
- ✅ Docker-based deployment
- 💰 $19/month

**Server Setup:**
- **Host:** Hetzner Cloud VPS (CX11 - €4.51/month)
- **Management:** Coolify (open-source PaaS)
- **Container:** Docker with persistent volumes

**API Endpoints Used:**
```
POST /api/sessions/              → Create session
POST /api/sessions/{name}/stop   → Delete session
GET  /api/sessions/{name}        → Get status
GET  /api/{session}/auth/qr      → Get QR code
GET  /api/{session}/chats        → List chats
POST /api/sendText               → Send message
```

### 5. Background Processing (Inngest)

**Purpose:** Durable event-driven workflows

**Current Events:**
```typescript
"message.upsert"     → New WhatsApp message received
"session.status"     → Instance connection status change
```

**Planned Functions:**
```typescript
classifyMessage()    → Route message to appropriate handler
processImage()       → Vision AI for property photos
sendResponse()       → AI-generated reply
checkCredits()       → Billing enforcement
```

### 6. AI Layer (Google Gemini)

**Models:**
- **Gemini 2.0 Flash:** Fast text responses
- **Gemini 1.5 Pro:** Complex reasoning, vision

**Use Cases:**
- Lead qualification responses
- Property photo analysis
- Appointment scheduling
- Natural conversation handling

---

## Data Flow Diagrams

### Instance Creation Flow
```
User → Dashboard → createWhatsAppInstance() → WAHA API
                           ↓
                   Create Convex record
                           ↓
                   Return instance ID
                           ↓
                   Show QR code dialog
                           ↓
User scans QR → WhatsApp links → Status: connected
```

### Incoming Message Flow
```
WhatsApp → WAHA Server → Webhook POST → Vercel API
                                ↓
                        Verify signature
                                ↓
                        Parse message
                                ↓
                        Upsert contact (Convex)
                                ↓
                        Store interaction
                                ↓
                        Trigger Inngest event
                                ↓
                        AI processing
                                ↓
                        Send reply via WAHA
```

### Chat Sync Flow
```
User clicks "Sync Chats" → Server Action
                               ↓
                    WAHA: GET /api/{session}/chats
                               ↓
                    For each chat:
                      - Extract phone number
                      - Upsert contact in Convex
                               ↓
                    Show imported count
```

---

## Infrastructure Details

### Hetzner VPS Configuration

| Resource | Specification |
|----------|--------------|
| Plan | CX11 (shared vCPU) |
| vCPU | 1 core |
| RAM | 2 GB |
| Storage | 20 GB SSD |
| Location | Falkenstein, Germany |
| Cost | €4.51/month |

### Coolify Setup

- **Access:** http://49.13.153.22:8000
- **Services:** WAHA Plus container
- **Volumes:** `waha_data` for session persistence
- **Networking:** Port 3000 exposed

### Environment Variables (Production)

```bash
# Vercel
NEXT_PUBLIC_CONVEX_URL=https://brazen-retriever-972.convex.cloud
CONVEX_DEPLOYMENT=prod:brazen-retriever-972
WHATSAPP_PROVIDER=waha
WAHA_API_URL=http://49.13.153.22:3000
WAHA_API_KEY=myaibud-waha-key-2025
WAHA_WEBHOOK_SECRET=my-aibud-waha-webhook-secret
# ... other variables
```

---

## Security Architecture

### Defense Layers

```
1. Edge (Cloudflare via Vercel)
   ├── DDoS protection
   └── SSL/TLS termination

2. Application (Next.js)
   ├── Clerk authentication
   ├── Server-side validation
   └── CORS policies

3. Data (Convex)
   ├── Tenant isolation (clerkId)
   ├── Input validation (Zod)
   └── Encrypted at rest

4. External (WAHA)
   ├── API key authentication
   └── Webhook signature verification
```

### Critical Security Controls

| Control | Implementation |
|---------|----------------|
| Authentication | Clerk JWT (all routes protected) |
| Authorization | Tenant isolation via clerkId |
| Input Validation | Zod schemas + Convex validators |
| Secrets | Environment variables only |
| Webhook Security | HMAC signature verification |

---

## Scalability Considerations

### Current Limits
- **WAHA Plus:** Unlimited instances
- **Convex:** 1M free reads/month, then pay-as-you-go
- **Vercel:** Serverless, auto-scaling

### Future Scaling
- **Multi-region WAHA:** Deploy to multiple VPS for latency
- **Message queuing:** Inngest handles backpressure
- **Database sharding:** Convex handles automatically

---

## Monitoring & Observability

### Current
- **Errors:** Browser console + Vercel logs
- **WAHA:** Container logs via Coolify

### Planned
- **Sentry:** Error tracking
- **Inngest Dashboard:** Job monitoring
- **Custom Analytics:** Usage metrics in Convex

---

## Deployment Strategy

### Development → Production

```
Local Dev → GitHub Push → Vercel Build → Production
              │
              └──→ Convex Deploy (manual: npx convex deploy)
```

### Rollback
- **Vercel:** Instant rollback to previous deployment
- **Convex:** Schema migrations are additive

---

*This architecture document reflects the current state of the My Aibud system as of January 2026.*

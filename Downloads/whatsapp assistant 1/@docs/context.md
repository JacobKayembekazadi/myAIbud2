# Context Engineering - My Aibud WhatsApp System

> **Last Updated:** January 7, 2026  
> **Current State:** MVP Development - Core Features Working

---

## 🎯 Product Overview

**My Aibud** is a subscription-based AI Real Estate Assistant that automates consistent prospecting via WhatsApp, preventing leads from going cold. The system provides AI-powered conversation management for real estate agents to qualify leads, collect property photos, and schedule appointments through WhatsApp interactions.

### Business Model
- **Target Market:** Real estate agents in South Africa
- **Value Proposition:** Automated WhatsApp lead nurturing with AI
- **Revenue Model:** Monthly subscription per WhatsApp "Seat" (Instance)

---

## ✅ Current Implementation Status

### Working Features
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenant Auth | ✅ Working | Clerk + Convex integration |
| WhatsApp Instance CRUD | ✅ Working | Create, Read, Delete instances |
| QR Code Generation | ✅ Working | Links WhatsApp via QR scan |
| Instance Status Sync | ✅ Working | Real-time status from WAHA |
| Contact Import | ✅ Working | Sync existing WhatsApp chats |
| Chat/Contact List UI | ✅ Working | View imported contacts |
| Dashboard UI | ✅ Working | Modern dark theme |

### Pending Features
| Feature | Status | Priority |
|---------|--------|----------|
| Real-time Webhooks | ⏳ Pending | Deploy to Vercel first |
| AI Auto-responses | ⏳ Pending | After webhooks work |
| Campaign/Bulk Messaging | ⏳ Pending | Core feature |
| Credit/Subscription System | ⏳ Pending | Monetization |
| Poll-based Qualification | ⏳ Pending | Lead scoring |
| Vision AI (Property Photos) | ⏳ Pending | Premium feature |

---

## 🏗️ Technical Architecture

### Current Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16 | App Router, Server Actions |
| **Database** | Convex | Real-time serverless database |
| **Auth** | Clerk | Authentication & user management |
| **WhatsApp API** | WAHA Plus | Multi-instance WhatsApp API |
| **AI** | Google Gemini | Text & vision AI processing |
| **Queue** | Inngest | Background job orchestration |
| **Hosting** | Vercel + Hetzner | Frontend + WAHA server |
| **UI** | Shadcn/ui | Component library |

### Infrastructure

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │    │  WAHA Plus      │    │   Vercel        │
│   Mobile App    │◀──▶│  (Hetzner VPS)  │◀──▶│   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                       │
                              ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Webhooks      │    │   Convex        │
                       │   (Real-time)   │───▶│   Database      │
                       └─────────────────┘    └─────────────────┘
```

### Server Configuration

**WAHA Plus Server (Hetzner VPS)**
- **IP:** 49.13.153.22
- **Port:** 3000
- **Management:** Coolify
- **Cost:** $12/month (Hetzner) + $19/month (WAHA Plus)

```yaml
# Docker Compose (Coolify)
version: '3.8'
services:
  waha:
    image: 'devlikeapro/waha-plus:latest'
    container_name: waha
    restart: always
    ports:
      - '3000:3000'
    environment:
      WHATSAPP_API_KEY: myaibud-waha-key-2025
      WHATSAPP_API_PORT: '3000'
      WHATSAPP_HOOK_URL: 'https://my-aibud.vercel.app/api/webhooks/whatsapp'
      WHATSAPP_HOOK_EVENTS: 'message,session.status'
    volumes:
      - 'waha_data:/app/.sessions'
```

---

## 📁 Project Structure

```
whatsapp-assistant/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── inngest/       # Inngest webhook handler
│   │   │   └── webhooks/      # WhatsApp webhooks
│   │   ├── campaigns/         # Campaign management
│   │   ├── chat/              # Chat interface
│   │   │   ├── [contactId]/   # Individual chat view
│   │   │   ├── layout.tsx     # Chat layout with contact list
│   │   │   └── page.tsx       # Chat index
│   │   ├── instances/         # WhatsApp instance management
│   │   ├── sign-in/           # Clerk auth
│   │   ├── sign-up/           # Clerk auth
│   │   └── page.tsx           # Dashboard home
│   ├── components/            # UI components
│   │   ├── ui/                # Shadcn components
│   │   ├── Sidebar.tsx        # Navigation
│   │   └── TenantProvider.tsx # Multi-tenant context
│   ├── inngest/               # Background jobs
│   │   ├── client.ts          # Inngest client
│   │   └── functions.ts       # Job definitions
│   └── lib/
│       └── whatsapp/          # WhatsApp provider abstraction
│           ├── index.ts       # Factory & exports
│           ├── types.ts       # Interfaces
│           └── providers/
│               ├── waha.ts    # WAHA Plus provider ✅
│               ├── evolution.ts # Evolution API (backup)
│               └── cloud.ts   # Meta Cloud API (future)
├── convex/                    # Convex database
│   ├── schema.ts              # Database schema
│   ├── tenants.ts             # Tenant queries/mutations
│   ├── instances.ts           # Instance management
│   ├── contacts.ts            # Contact management
│   ├── interactions.ts        # Message history
│   └── campaigns.ts           # Campaign management
├── @docs/                     # Project documentation
└── .env.local                 # Environment variables
```

---

## 🔧 Environment Variables

```bash
# ===========================================
# WhatsApp Provider Configuration
# ===========================================
WHATSAPP_PROVIDER=waha

# WAHA Plus (Active)
WAHA_API_URL=http://49.13.153.22:3000
WAHA_API_KEY=myaibud-waha-key-2025
WAHA_WEBHOOK_SECRET=my-aibud-waha-webhook-secret

# ===========================================
# Database (Convex)
# ===========================================
NEXT_PUBLIC_CONVEX_URL=https://brazen-retriever-972.convex.cloud
CONVEX_DEPLOYMENT=prod:brazen-retriever-972

# ===========================================
# Authentication (Clerk)
# ===========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_ISSUER_URL=https://known-lamprey-22.clerk.accounts.dev

# ===========================================
# AI (Google Gemini)
# ===========================================
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# ===========================================
# Background Jobs (Inngest)
# ===========================================
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

---

## 📊 Database Schema (Convex)

### Core Tables

```typescript
// convex/schema.ts

tenants: {
  clerkId: string,      // Clerk user ID
  email: string,
  name: string,
  plan: "starter" | "pro" | "business" | "enterprise",
  creditsLimit: number,
  creditsUsed: number,
  createdAt: number,
  updatedAt: number,
}

instances: {
  tenantId: Id<"tenants">,
  instanceId: string,   // WAHA session name
  name: string,         // Display name
  status: "connected" | "disconnected" | "connecting",
  createdAt: number,
  updatedAt: number,
}

contacts: {
  tenantId: Id<"tenants">,
  instanceId: string,
  phone: string,
  name?: string,
  status: "new" | "active" | "paused" | "archived",
  lastInteraction: number,
  createdAt: number,
  updatedAt: number,
}

interactions: {
  contactId: Id<"contacts">,
  tenantId: Id<"tenants">,
  type: "inbound" | "outbound",
  content: string,
  metadata?: object,
  createdAt: number,
}

campaigns: {
  tenantId: Id<"tenants">,
  instanceId: string,
  name: string,
  message: string,
  status: "draft" | "scheduled" | "running" | "completed",
  scheduledAt?: number,
  createdAt: number,
  updatedAt: number,
}
```

---

## 🔌 WhatsApp Provider Interface

The system uses a provider abstraction to support multiple WhatsApp APIs:

```typescript
// src/lib/whatsapp/types.ts

interface IWhatsAppClient {
  // Instance management
  createInstance(name: string): Promise<CreateInstanceResult>;
  deleteInstance(instanceId: string): Promise<{ success: boolean }>;
  getQRCode(instanceId: string): Promise<QRCodeResult>;
  getInstanceStatus(instanceId: string): Promise<InstanceInfo | null>;
  listInstances(): Promise<InstanceInfo[]>;
  
  // Chats
  getChats(instanceId: string): Promise<ChatInfo[]>;
  
  // Messaging
  sendText(instanceId: string, to: string, message: string): Promise<SendMessageResult>;
  sendPoll(instanceId: string, to: string, question: string, options: string[]): Promise<SendMessageResult>;
  
  // Webhook
  parseWebhook(body: unknown, signature?: string): WebhookPayload | null;
  verifyWebhook(body: string, signature: string): boolean;
}
```

### Switching Providers

Change `WHATSAPP_PROVIDER` in `.env.local`:
- `waha` - WAHA Plus (current, recommended)
- `evolution` - Evolution API (backup, QR issues)
- `cloud` - Meta Cloud API (future)

---

## 🚀 Development Workflow

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Push Convex schema (if changed)
npx convex deploy
```

### Deployment

```bash
# 1. Push to GitHub (triggers Vercel deploy)
git add .
git commit -m "Your changes"
git push

# 2. Deploy Convex functions
npx convex deploy
```

---

## 🔐 Security Considerations

1. **Authentication:** All routes protected by Clerk middleware
2. **Tenant Isolation:** Users can only access their own data
3. **Webhook Verification:** HMAC signature validation
4. **API Keys:** Stored in environment variables, never in code
5. **Rate Limiting:** TODO - implement Upstash Redis

---

## 📝 Next Steps (Priority Order)

1. **Deploy to Vercel** - Enable webhooks for real-time messages
2. **Test Webhook Flow** - Verify incoming messages are processed
3. **Implement AI Responses** - Inngest functions for auto-replies
4. **Build Campaign System** - Bulk messaging with templates
5. **Add Credit System** - Subscription enforcement

---

## 🐛 Known Issues

1. **Webhooks only work on Vercel** - Local dev can't receive webhooks
2. **Status may need manual sync** - Auto-sync on page load
3. **Delete may show error briefly** - WAHA returns empty response (handled)

---

## 📚 Related Documentation

- [Architecture.md](./Architecture.md) - System architecture details
- [Quick-Start-Guide.md](./Quick-Start-Guide.md) - Developer onboarding
- [updates.md](./updates.md) - Changelog and recent updates
- [security.md](./security.md) - Security guidelines

---

*This context document provides comprehensive information for any LLM or developer to understand and continue work on the My Aibud WhatsApp automation system.*

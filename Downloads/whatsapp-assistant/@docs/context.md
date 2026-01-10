# Context Engineering - MyChatFlow (My Aibud)

> **Last Updated:** January 10, 2026  
> **Current State:** ✅ PRODUCTION LIVE - Multi-user ready

---

## 🎯 Product Overview

**MyChatFlow** (internally "My Aibud") is a subscription-based AI WhatsApp Assistant SaaS that automates consistent prospecting via WhatsApp, preventing leads from going cold. The system provides AI-powered conversation management for real estate agents to qualify leads, collect property photos, and schedule appointments through WhatsApp interactions.

### Business Model
- **Target Market:** Real estate agents in South Africa
- **Value Proposition:** Automated WhatsApp lead nurturing with AI
- **Revenue Model:** Monthly subscription with credit-based usage limits

---

## ✅ Current Implementation Status

### Working Features
| Feature | Status | Notes |
|---------|--------|-------|
| Multi-tenant Auth | ✅ Working | Clerk + Convex + Custom domain (clerk.mychatflow.app) |
| WhatsApp Instance CRUD | ✅ Working | Create, Read, Delete instances via WAHA Plus |
| QR Code Generation | ✅ Working | WAHA 2026.x endpoint with auto-refresh timer |
| Instance Status Polling | ✅ Working | 5-second polling + webhook-based updates |
| Session Status Webhooks | ✅ Working | Real-time status updates from WAHA |
| Contact Import | ✅ Working | Sync existing WhatsApp chats |
| Chat/Contact List UI | ✅ Working | View imported contacts with search & filters |
| Dashboard UI | ✅ Working | Modern dark theme with analytics cards |
| Collapsible Sidebar | ✅ Working | localStorage-persisted navigation |
| Settings Page | ✅ Working | AI Config, Profile, Notifications |
| Quick Replies | ✅ Working | AI-referencable response templates |
| Campaigns (Excel) | ✅ Working | Bulk messaging with CSV/XLSX support |
| Vercel Deployment | ✅ Working | Production live at mychatflow.app |
| Skeleton Loading States | ✅ Working | Dashboard and Instances pages |
| Toast Notifications | ✅ Working | Success/error feedback via Sonner |
| **Onboarding Wizard** | ✅ Working | 4-step setup wizard for new users |
| **Contacts Management** | ✅ Working | Full CRUD, bulk actions, search/filter |
| **Contact Details Dialog** | ✅ Working | Edit name, tags, notes, status |
| **CSV Import/Export** | ✅ Working | Bulk contact import and export |
| **Progress Widget** | ✅ Working | Dashboard onboarding progress tracker |
| **Enhanced Empty States** | ✅ Working | Better CTAs throughout the app |

### Pending Features
| Feature | Status | Priority |
|---------|--------|----------|
| Vision AI (Property Photos) | ⏳ Pending | Medium - Premium feature |
| Poll-based Qualification | ⏳ Pending | Medium - Lead scoring |
| Stripe Billing Integration | ⏳ Pending | High - Revenue enablement |
| Analytics Charts | ⏳ Pending | Medium - Usage visualization |

---

## 🏗️ Technical Architecture

### Current Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15.5.9 | App Router, Server Actions |
| **Database** | Convex | Real-time serverless database |
| **Auth** | Clerk | Authentication with custom domain |
| **WhatsApp API** | WAHA Plus 2026.x | Multi-instance WhatsApp API |
| **AI** | Google Gemini | Text processing (gemini-1.5-flash) |
| **Queue** | Inngest | Background job orchestration |
| **Hosting** | Vercel + Hetzner | Frontend + WAHA server |
| **UI** | Shadcn/ui + Tailwind 4 | Component library |

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
                              │
                              ▼
                       ┌─────────────────┐
                       │   Inngest       │
                       │   (AI Agent)    │
                       └─────────────────┘
```

---

## 📁 Project Structure (Key Directories)

- `src/app/`: Next.js pages and server actions
  - `src/app/contacts/`: Dedicated contacts management page
  - `src/app/chat/`: Chat interface with search/filter sidebar
- `src/components/`: Reusable UI components (Sidebar, Layout, etc.)
  - `src/components/contacts/`: Contact management dialogs
  - `src/components/onboarding/`: Setup wizard and step components
- `src/lib/whatsapp/`: WhatsApp provider abstraction (WAHA focus)
- `src/inngest/`: Background job definitions (AI Agent, Campaigns)
- `convex/`: Real-time database schema and functions
- `@docs/`: Comprehensive project documentation

---

## 🔧 Environment Variables (Production)

| Variable | Value/Format | Description |
|----------|--------------|-------------|
| `WAHA_API_URL` | `http://49.13.153.22:3000` | WAHA Plus API Endpoint |
| `WAHA_API_KEY` | `myaibud-waha-key-2025` | Security Key for WAHA |
| `WAHA_WEBHOOK_SECRET` | `my-aibud-waha-webhook-secret` | Webhook signature verification |
| `GOOGLE_GENERATIVE_AI_API_KEY` | `AIzaSy...` | Gemini AI API Key |
| `NEXT_PUBLIC_CONVEX_URL` | `https://optimistic-ermine-644.convex.cloud` | Convex Dev URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | Clerk Public Key |
| `CLERK_SECRET_KEY` | `sk_test_...` | Clerk Secret Key |
| `NEXT_PUBLIC_APP_URL` | `https://www.mychatflow.app` | Production URL |
| `INNGEST_EVENT_KEY` | `7E5s...` | Inngest Event Key |
| `INNGEST_SIGNING_KEY` | `signkey-prod-...` | Inngest Signing Key |

---

## 🚨 Known Limitations / Gotchas

1. **WAHA 2026.x QR Endpoint**: Uses `/api/{session}/auth/qr` (not `/api/sessions/{session}/auth/qr`)
2. **QR Response Format**: Returns PNG binary directly, not base64 JSON
3. **Clerk Custom Domain**: Must use `clerk.mychatflow.app` in Convex auth config
4. **Convex Auth Issuer**: Custom domain, not default Clerk URL
5. **QR Expiry**: WhatsApp QR codes expire after ~60 seconds

---

## 📊 Feature Status & Roadmap

1. **Phase 1: Foundation** ✅ Complete - Basic WhatsApp & CRUD
2. **Phase 2: UI/UX** ✅ Complete - Dashboard, Sidebar, Premium Auth
3. **Phase 3: Automation** ✅ Complete - AI responses, Webhooks, Status sync
4. **Phase 4: Multi-User** ✅ Complete - Tenant isolation, Credit system
5. **Phase 5: Monetization** ⏳ Pending - Stripe integration

---

## 📚 Related Documentation

- [Architecture.md](./Architecture.md) - Deep dive into system design
- [CRITICAL-ISSUES.md](./CRITICAL-ISSUES.md) - Current blockers and fixes
- [Development-Roadmap.md](./Development-Roadmap.md) - Implementation timeline
- [Quick-Start-Guide.md](./Quick-Start-Guide.md) - Developer setup guide
- [security.md](./security.md) - Security protocols
- [updates.md](./updates.md) - Detailed changelog

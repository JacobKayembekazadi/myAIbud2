<p align="center">
  <img src="public/logo.svg" alt="MyChatFlow Logo" width="80" height="80" />
</p>

<h1 align="center">MyChatFlow</h1>

<p align="center">
  <strong>Enterprise-Grade WhatsApp AI Automation Platform</strong>
</p>

<p align="center">
  Transform your business communications with intelligent, multi-language AI assistants that work 24/7.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#api-reference">API</a> •
  <a href="#documentation">Docs</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Convex-Serverless-orange?style=flat-square" alt="Convex" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

---

## Overview

MyChatFlow is a production-ready SaaS platform that enables businesses to deploy intelligent AI assistants on WhatsApp. Built for scale, security, and reliability, it serves industries including **Real Estate**, **Automotive**, **Legal Services**, **Healthcare**, **Hospitality**, and **E-commerce**.

### Why MyChatFlow?

| Challenge | MyChatFlow Solution |
|-----------|---------------------|
| Missed leads after hours | 24/7 AI responds instantly in seconds |
| Staff overwhelmed with repetitive questions | AI handles FAQs, books appointments |
| Customers lost in long response times | Sub-2-second response times |
| Language barriers | Auto-detect and respond in 9+ languages |
| No visibility into conversations | Real-time dashboard with analytics |
| Compliance concerns | HIPAA/SOC2 ready architecture |

---

## Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| **Intelligent AI Responses** | Context-aware conversations powered by OpenAI, Gemini, and Claude |
| **Multi-Language Support** | Auto-detects and responds in 9+ languages (EN, ES, FR, DE, PT, IT, NL, ZU, AF) |
| **Lead Scoring** | Automatic A-F grading based on engagement, intent, and recency |
| **Human Handoff** | Seamless escalation when AI detects complex situations |
| **Follow-up Sequences** | Automated nurture campaigns (24h, 3d, 7d intervals) |
| **Appointment Booking** | AI-powered scheduling with availability checking |
| **Vision Analysis** | Analyze property photos, documents, and floor plans |
| **Analytics Dashboard** | Real-time metrics, response times, conversion tracking |

### Enterprise Features

| Feature | Description |
|---------|-------------|
| **Multi-Tenant Architecture** | Isolated data per customer with team support |
| **Provider-Agnostic LLM** | Switch between OpenAI, Gemini, and Claude with auto-fallback |
| **Circuit Breaker Pattern** | Automatic failover for 99.9% uptime |
| **Rate Limiting** | Redis-backed protection against abuse |
| **Webhook Security** | HMAC-SHA256 signature verification |
| **Audit Logging** | Complete trail for compliance requirements |
| **Team Management** | Roles (Admin, Agent, Viewer) with permissions |

### Industry Templates

| Industry | Key Features |
|----------|-------------|
| **Real Estate** | Property search, viewing bookings, price inquiries, neighborhood guides |
| **Automotive** | Inventory lookup, test drive scheduling, trade-in estimates, service booking |
| **Legal** | Case type routing, consultation booking, intake questionnaires |
| **Healthcare** | Appointment reminders, symptom triage, insurance verification |
| **Hospitality** | Room availability, reservations, concierge services, multi-language |
| **E-commerce** | Product search, order status, returns processing, inventory checks |

---

## Quick Start

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- WAHA Plus license (WhatsApp API)
- Accounts: Clerk, Convex, Vercel

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/mychatflow.git
cd mychatflow

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure environment variables (see below)

# Start development server
npm run dev
```

### Environment Configuration

```bash
# App URL (REQUIRED for webhooks)
NEXT_PUBLIC_APP_URL=https://www.mychatflow.app

# Convex (Database)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# WAHA Plus (WhatsApp API)
WAHA_API_URL=http://your-waha-server:3000
WAHA_API_KEY=your-waha-api-key
WAHA_WEBHOOK_SECRET=your-webhook-secret

# LLM Providers (Platform-level - you pay, customers use credits)
OPENAI_API_KEY=sk-proj-...          # Primary (fastest)
GOOGLE_GENERATIVE_AI_API_KEY=AIza... # Fallback
ANTHROPIC_API_KEY=sk-ant-...        # Tertiary

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=signkey-prod-...

# Resend (Email Service)
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=onboarding@yourdomain.com

# Optional: Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Optional: Sentry (Error Monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript check
npm run lint         # Run ESLint
npx convex deploy    # Deploy Convex functions
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│   Next.js 15.5 • React 19 • Tailwind CSS • Radix UI             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│   API Routes • Inngest (Event-Driven) • Webhooks (WAHA)         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICE LAYER                             │
│   LLM (OpenAI/Gemini/Claude) • WAHA • Clerk • Resend • Redis   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                              │
│          Convex (Real-time • Type-safe • Serverless)            │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | Next.js 15.5, React 19 | Server-rendered dashboard |
| Database | Convex | Real-time serverless database |
| Auth | Clerk | User authentication & teams |
| Jobs | Inngest | Background processing, cron |
| WhatsApp | WAHA Plus | WhatsApp Business API |
| AI | OpenAI, Gemini, Claude | Multi-provider LLM with fallback |
| Cache | Upstash Redis | Rate limiting, caching |
| Email | Resend | Transactional emails |
| Monitoring | Sentry | Error tracking |

> **See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed technical documentation.**

---

## Deployment

### Vercel (Recommended)

```bash
# Link project
vercel link

# Set environment variables in Vercel Dashboard
# Settings → Environment Variables

# Deploy
vercel --prod
```

### Infrastructure Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Vercel | Hobby | Pro ($20/mo) |
| Convex | Free | Pro ($25/mo) |
| WAHA | 1 instance | 2+ (HA) |
| Redis | Optional | Upstash ($10/mo) |

---

## API Reference

### Webhook Endpoint

```http
POST /api/webhooks/whatsapp
Content-Type: application/json
X-Webhook-Signature: sha256=<hmac>

{
  "event": "message",
  "session": "instance-id",
  "payload": {
    "from": "27821234567@c.us",
    "body": "Hello!",
    "type": "text"
  }
}
```

### Inngest Events

| Event | Description |
|-------|-------------|
| `message.upsert` | New message received |
| `followup.send` | Send follow-up message |
| `campaign.send` | Bulk message campaign |
| `vision.analyze` | Analyze image |

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `organizations` | Team workspaces |
| `teamMembers` | Users with roles |
| `tenants` | Solo accounts |
| `instances` | WhatsApp connections |
| `contacts` | Customer records |
| `interactions` | Message history |
| `settings` | Tenant configuration |
| `quickReplies` | Knowledge base |
| `notifications` | Alerts & handoffs |
| `followUpSequences` | Automated sequences |
| `appointments` | Bookings |
| `campaigns` | Bulk messaging |
| `analyticsEvents` | Event tracking |
| `analyticsSummary` | Aggregated metrics |

---

## Security

### Authentication & Authorization

- **Clerk Integration** - Enterprise-grade auth with MFA
- **Role-Based Access** - Admin, Agent, Viewer roles
- **Row-Level Security** - Data isolated per tenant

### Data Protection

- **TLS 1.3** - All traffic encrypted in transit
- **HMAC-SHA256** - Webhooks cryptographically signed
- **Rate Limiting** - 100 req/min per IP
- **Audit Logging** - Complete trail

### Compliance Readiness

| Standard | Status |
|----------|--------|
| GDPR | Ready |
| HIPAA | Architecture Ready |
| SOC2 | Architecture Ready |

---

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical deep-dive |
| [SOP.md](./SOP.md) | Standard Operating Procedures |
| [.env.example](./.env.example) | Environment template |

---

## Roadmap

### Current (v1.x)
- [x] Multi-language AI responses
- [x] Lead scoring & analytics
- [x] Human handoff system
- [x] Follow-up sequences
- [x] Appointment booking
- [x] Multi-LLM support (OpenAI, Gemini, Claude)
- [x] Provider-agnostic architecture

### Next (v2.x)
- [ ] RAG with vector database (Pinecone)
- [ ] Conversation memory
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Calendar sync (Google, Outlook)
- [ ] Voice message transcription

### Future (v3.x)
- [ ] Custom AI training per tenant
- [ ] Multi-channel (Instagram, Telegram)
- [ ] White-label solution

---

## Support

### Resources
- **Issues**: [GitHub Issues](https://github.com/your-org/mychatflow/issues)
- **Email**: support@mychatflow.app

### Enterprise
For enterprise support, SLAs, and custom development:
- Email: enterprise@mychatflow.app

---

## License

Proprietary - All rights reserved.

---

<p align="center">
  Built with ❤️ by the MyChatFlow Team
</p>

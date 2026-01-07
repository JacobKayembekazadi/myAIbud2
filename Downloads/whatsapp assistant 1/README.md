# My Aibud - WhatsApp AI Assistant

> **AI-Powered Real Estate Lead Automation via WhatsApp**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Database-orange)](https://convex.dev/)
[![WAHA Plus](https://img.shields.io/badge/WAHA-Plus-green)](https://waha.devlike.pro/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-purple)](https://clerk.com/)

---

## 🎯 What is My Aibud?

My Aibud is a SaaS platform that helps real estate agents automate WhatsApp conversations with leads. The AI assistant:

- 📱 **Manages multiple WhatsApp instances** per user
- 🤖 **Auto-responds to leads** using AI (Gemini)
- 📊 **Qualifies leads** through polls and conversations
- 📸 **Analyzes property photos** with Vision AI
- 📢 **Sends bulk campaigns** to contact lists

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account
- Clerk account
- WAHA Plus subscription (for WhatsApp)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/my-aibud.git
cd my-aibud

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` with:

```bash
# WhatsApp Provider
WHATSAPP_PROVIDER=waha
WAHA_API_URL=http://your-waha-server:3000
WAHA_API_KEY=your-api-key
WAHA_WEBHOOK_SECRET=your-webhook-secret

# Database (Convex)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=prod:your-deployment

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI (Google Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key

# Background Jobs (Inngest)
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
```

---

## 🏗️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 16 (App Router) |
| **Database** | Convex |
| **Auth** | Clerk |
| **WhatsApp API** | WAHA Plus |
| **AI** | Google Gemini |
| **Queue** | Inngest |
| **UI** | Shadcn/ui + Tailwind |
| **Hosting** | Vercel + Hetzner |

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (webhooks, inngest)
│   ├── campaigns/         # Campaign management
│   ├── chat/              # Chat interface
│   ├── instances/         # WhatsApp instances
│   └── page.tsx           # Dashboard
├── components/            # UI components
├── inngest/               # Background job definitions
└── lib/
    └── whatsapp/          # WhatsApp provider abstraction
        └── providers/
            ├── waha.ts    # WAHA Plus (active)
            ├── evolution.ts
            └── cloud.ts

convex/                    # Convex database
├── schema.ts              # Database schema
├── tenants.ts             # Tenant operations
├── instances.ts           # Instance management
├── contacts.ts            # Contact operations
└── interactions.ts        # Message history

@docs/                     # Documentation
├── context.md             # Context engineering
├── Architecture.md        # System architecture
├── updates.md             # Changelog
└── ...
```

---

## 🔧 Development

### Local Development

```bash
# Start Next.js dev server
npm run dev

# In another terminal, deploy Convex (if schema changed)
npx convex deploy
```

### Deploying

```bash
# Push to GitHub (triggers Vercel)
git add .
git commit -m "Your changes"
git push

# Deploy Convex functions
npx convex deploy
```

---

## 📚 Documentation

Detailed documentation is available in the `@docs/` folder:

- **[context.md](@docs/context.md)** - Context engineering for LLMs
- **[Architecture.md](@docs/Architecture.md)** - System architecture
- **[updates.md](@docs/updates.md)** - Changelog and updates
- **[Quick-Start-Guide.md](@docs/Quick-Start-Guide.md)** - Developer onboarding
- **[security.md](@docs/security.md)** - Security guidelines

---

## 🌐 Infrastructure

### WAHA Plus Server

The WhatsApp API runs on a separate server:

- **Host:** Hetzner VPS
- **Management:** Coolify
- **Cost:** ~$12/month + $19/month WAHA Plus

See [Architecture.md](@docs/Architecture.md) for setup details.

---

## ✅ Current Features

- [x] Multi-tenant authentication (Clerk)
- [x] WhatsApp instance management (CRUD)
- [x] QR code linking
- [x] Status synchronization
- [x] Contact import from WhatsApp
- [x] Chat/contact list UI

## 🚧 Roadmap

- [ ] Real-time incoming messages
- [ ] AI auto-responses
- [ ] Campaign/bulk messaging
- [ ] Credit/subscription system
- [ ] Poll-based lead qualification
- [ ] Property photo analysis (Vision AI)

---

## 🔐 Security

- All routes protected by Clerk authentication
- Tenant data isolation
- Webhook signature verification
- Environment variables for secrets

See [security.md](@docs/security.md) for details.

---

## 📄 License

Proprietary - All rights reserved.

---

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

---

*Built with ❤️ for real estate professionals*

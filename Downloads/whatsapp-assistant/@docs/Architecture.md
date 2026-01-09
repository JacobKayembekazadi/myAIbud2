# System Architecture - My Aibud WhatsApp System

> **Last Updated:** January 8, 2026  
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
- **Premium UI Overhaul:** Modern dark theme with analytics cards and glassmorphism.
- **Collapsible Sidebar:** Optimized navigation with localStorage state management.
- **Premium Auth:** Split-screen Sign-In and Sign-Up pages with feature showcasing.
- **Real-time Updates:** Seamless state synchronization via Convex.

### 2. Authentication Layer (Clerk)

**Redesigned Pages:**
- `/sign-in` and `/sign-up` now feature a multi-panel marketing and auth experience.
- Deep level Clerk UI customization to match the app's aesthetic.

### 3. Database Layer (Convex)

**Schema (New Tables Added Jan 8):**
- `settings`: Per-tenant AI and notification configurations.
- `quickReplies`: Scalable templates for AI responses.

### 4. WhatsApp Layer (WAHA Plus)

**Server Setup:**
- **IP:** 49.13.153.22 (Hetzner VPS)
- **Status:** Active & Configured for multi-instance support.

---

## Data Flow Diagrams

### Incoming Message & AI response Flow
```
WhatsApp → WAHA Server → Webhook POST → Vercel API
                                ↓
                        Verify signature
                                ↓
                        Parse message
                                ↓
                        Upsert contact & Interaction (Convex)
                                ↓
                        Trigger Inngest event
                                ↓
                        Check Tenant Settings (Auto-reply?)
                                ↓
                        AI processing (Gemini Flash/Pro)
                                ↓
                        Send reply via WAHA API
```

---

## Infrastructure Details

### Vercel Environment Configuration
All production environment variables are managed at the Vercel project level, including WAHA API keys, Gemini credentials, and Convex/Clerk secrets.

---

*This architecture document reflects the current state of the My Aibud system as of January 8, 2026, following the production deployment and UI overhaul.*

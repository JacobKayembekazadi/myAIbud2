# Claude Context - MyChatFlow (My Aibud)

> This file provides complete context for AI assistants working on this codebase.

## Project Overview

**MyChatFlow** is a SaaS WhatsApp AI assistant for real estate agents. It automates lead nurturing by using AI (Google Gemini) to respond to WhatsApp messages, qualify leads, and maintain engagement.

### Business Model
- **Target:** Real estate agents in South Africa
- **Value:** Automated prospecting prevents leads from going cold
- **Revenue:** Monthly subscription with credit-based usage limits
- **Tiers:** Starter (400 credits), Pro (1500 credits), Enterprise (unlimited)

---

## Tech Stack

| Layer | Technology | Version/Notes |
|-------|------------|---------------|
| **Framework** | Next.js | 15.5.9 (App Router) |
| **Language** | TypeScript | Strict mode |
| **Styling** | Tailwind CSS | 4.x |
| **Components** | Shadcn/ui | Dark theme |
| **Database** | Convex | Real-time serverless |
| **Auth** | Clerk | Custom domain: clerk.mychatflow.app |
| **WhatsApp** | WAHA Plus | 2026.x on Hetzner VPS |
| **AI** | Google Gemini | gemini-1.5-flash |
| **Queue** | Inngest | Background job processing |
| **Hosting** | Vercel | Production deployment |

---

## Key Files

### Entry Points
- `src/app/layout.tsx` - Root layout with providers
- `src/app/page.tsx` - Dashboard (signed in) / Landing (signed out)
- `src/components/Sidebar.tsx` - Collapsible navigation

### WhatsApp Integration
- `src/lib/whatsapp/waha.ts` - WAHA Plus provider implementation
- `src/lib/whatsapp/types.ts` - TypeScript interfaces
- `src/app/instances/instances-client.tsx` - Instance management UI
- `src/app/instances/actions.ts` - Server actions for WAHA

### AI Agent
- `src/inngest/functions/agent.ts` - Message processing & AI response
- `src/inngest/client.ts` - Inngest client configuration

### Database
- `convex/schema.ts` - Database schema definition
- `convex/tenants.ts` - Tenant CRUD operations
- `convex/instances.ts` - Instance management
- `convex/contacts.ts` - Contact management
- `convex/interactions.ts` - Message history
- `convex/subscriptionUsage.ts` - Credit tracking
- `convex/auth.config.ts` - Clerk integration

### Webhooks
- `src/app/api/webhooks/whatsapp/route.ts` - WAHA webhook handler
- `src/app/api/inngest/route.ts` - Inngest webhook handler

---

## Environment Variables

### Required for Production

```bash
# WAHA Plus (WhatsApp)
WAHA_API_URL=http://49.13.153.22:3000
WAHA_API_KEY=myaibud-waha-key-2025
WAHA_WEBHOOK_SECRET=my-aibud-waha-webhook-secret

# Convex (Database)
NEXT_PUBLIC_CONVEX_URL=https://optimistic-ermine-644.convex.cloud
CONVEX_DEPLOYMENT=dev:optimistic-ermine-644

# Clerk (Auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=https://www.mychatflow.app
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=https://www.mychatflow.app

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...

# Inngest (Background Jobs)
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=signkey-prod-...

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://www.mychatflow.app
```

---

## Common Tasks

### Creating a New Page

1. Create `src/app/[route]/page.tsx` with metadata
2. Create `src/app/[route]/[route]-client.tsx` for client logic
3. Add navigation item to `src/components/Sidebar.tsx`
4. Add any new Convex queries/mutations to `convex/`

### Adding a Convex Query

```typescript
// convex/[table].ts
export const myQuery = query({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("myTable")
      .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
      .collect();
  },
});
```

### Modifying AI Behavior

Edit `src/inngest/functions/agent.ts`:
- Modify system prompt in `generateText` call
- Adjust temperature/maxTokens in model config
- Add/modify tools for function calling

### WAHA API Interactions

```typescript
// All WAHA calls go through wahaFetch helper
const response = await wahaFetch(`/api/sessions/${instanceId}`, {
  method: "GET", // or POST, DELETE
  body: JSON.stringify({ ... }), // for POST
});
```

---

## Gotchas & Known Issues

### WAHA 2026.x Specifics

1. **QR Endpoint Changed:**
   - Correct: `/api/{session}/auth/qr`
   - Wrong: `/api/sessions/{session}/auth/qr`

2. **QR Response Format:**
   - Returns PNG binary directly
   - NOT JSON with base64 string
   - Must convert: `Buffer.from(arrayBuffer).toString('base64')`

3. **Webhook Events:**
   - Use `["message", "session.status"]`
   - Old format `["message.upsert"]` may not work

### Clerk Configuration

1. **Custom Domain:**
   - Production uses `clerk.mychatflow.app`
   - Convex auth config must match this domain
   - Don't use development Clerk URL in production

2. **Deprecated Props:**
   - Use `fallbackRedirectUrl` not `afterSignInUrl`
   - Environment variable: `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`

### Convex Multi-Tenancy

1. **Always filter by tenantId:**
   ```typescript
   .withIndex("by_tenant", (q) => q.eq("tenantId", args.tenantId))
   ```

2. **Never expose raw IDs in URLs without ownership check**

3. **Credit checks before AI response:**
   - Check in Inngest agent function
   - Decrement atomically after successful send

### Build & Deploy

1. **Node.js Version:** Must use 20.x (specified in `engines` field)
2. **Next.js Version:** Stay on 15.5.9 (16.x has Turbopack issues with Vercel)
3. **Convex Deploy:** Run `npx convex deploy` after schema changes

---

## Code Conventions

### Server Actions
- Prefer server actions for mutations
- File: `src/app/[route]/actions.ts`
- Mark with `"use server"` directive

### Convex Over API Routes
- Use Convex queries/mutations for data access
- API routes only for webhooks and external integrations

### Toast Notifications
- Use Sonner: `import { toast } from "sonner"`
- Success: `toast.success("Message")`
- Error: `toast.error("Message")`

### Tenant Scoping
- Always pass `tenantId` to Convex operations
- Never trust client-provided tenantId without verification

### Component Patterns
- Use Shadcn/ui components from `@/components/ui/`
- Add `DialogDescription` to all Dialog components
- Include skeleton loading states for async data

---

## Architecture Diagram

```
User → Vercel (Next.js) → Clerk Auth
                       ↓
                    Convex (Database)
                       ↓
User creates instance → WAHA Plus (Hetzner)
                       ↓
User scans QR → WhatsApp Web connects
                       ↓
Incoming message → WAHA webhook → Vercel API
                                    ↓
                               Inngest (Queue)
                                    ↓
                               Gemini AI → Response
                                    ↓
                               WAHA → WhatsApp
```

---

## Testing Checklist

- [ ] User can sign up with Google
- [ ] Tenant record created in Convex
- [ ] User can create WhatsApp instance
- [ ] QR code displays with countdown timer
- [ ] Phone scan updates status to "connected"
- [ ] Incoming message triggers AI response
- [ ] Credits decrement after AI response
- [ ] Multiple users have isolated data

---

## Related Documentation

- `@docs/context.md` - High-level project context
- `@docs/Architecture.md` - System architecture details
- `@docs/CRITICAL-ISSUES.md` - Resolved blockers
- `@docs/updates.md` - Change history
- `@docs/security.md` - Security implementation
- `@docs/Quick-Start-Guide.md` - Developer setup

---

*Last Updated: January 10, 2026*


# My Aibud - Updates & Changelog

> **Document Purpose:** Track all significant changes, migrations, and updates to the My Aibud WhatsApp System.

---

## 📅 January 7, 2026 - WAHA Plus Migration

### 🎯 Summary
Major infrastructure migration from Evolution API to WAHA Plus to resolve persistent QR code generation issues and enable multi-instance support.

### ✅ Changes Made

#### Infrastructure
- **Migrated WhatsApp API:** Evolution API v2.x → WAHA Plus (latest)
- **Docker Image:** `devlikeapro/waha-plus:latest`
- **Multi-Instance Support:** Now supports unlimited WhatsApp instances per tenant
- **Server:** Hetzner VPS (49.13.153.22) managed via Coolify

#### Code Changes

**New/Modified Files:**
| File | Change |
|------|--------|
| `src/lib/whatsapp/providers/waha.ts` | Added `getChats()`, fixed session creation, dynamic instance names |
| `src/lib/whatsapp/types.ts` | Added `ChatInfo` interface and `getChats()` method |
| `src/lib/whatsapp/index.ts` | Added `getChats` proxy method |
| `src/app/instances/actions.ts` | Added `getInstanceStatus()` and `syncChats()` server actions |
| `src/app/instances/instances-client.tsx` | Added status sync, Sync Chats button, delete confirmation |
| `convex/instances.ts` | Added `deleteInstance` mutation |
| `.env.local` | Updated for WAHA, added `CONVEX_DEPLOYMENT` |

**Key Bug Fixes:**
1. Fixed JSON parse error on empty responses from WAHA
2. Fixed instance creation using proper `/api/sessions/` POST endpoint
3. Added session restart logic for stopped sessions before QR generation
4. Fixed Convex deployment variable missing

#### Docker Configuration (Coolify)
```yaml
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
      WAHA_DASHBOARD_ENABLED: 'false'
      WAHA_SWAGGER_ENABLED: 'false'
    volumes:
      - 'waha_data:/app/.sessions'
```

### 🔧 How to Deploy WAHA Plus

1. **Get Docker Hub Access:**
   - Subscribe to WAHA Plus ($19/month): https://waha.devlike.pro
   - Get Docker Hub Personal Access Token

2. **On Hetzner Server (via Coolify terminal):**
   ```bash
   docker login -u devlikeapro -p YOUR_TOKEN
   docker pull devlikeapro/waha-plus:latest
   ```

3. **Update Coolify Docker Compose** with config above

4. **Restart service** in Coolify

### 📊 Feature Status After Migration

| Feature | Before | After |
|---------|--------|-------|
| QR Code Generation | ❌ Broken | ✅ Working |
| Multi-Instance | ❌ 1 only | ✅ Unlimited |
| Instance CRUD | ⚠️ Partial | ✅ Full |
| Status Sync | ❌ Manual | ✅ Auto |
| Chat Import | ❌ None | ✅ Working |

---

## 📅 Previous Updates

### December 2025 - Initial Evolution API Integration
- Set up Evolution API on Hetzner VPS
- Implemented basic instance management
- QR codes never worked reliably (known issue with Evolution API)

### November 2025 - Convex Migration
- Migrated from PostgreSQL/Drizzle to Convex
- Implemented multi-tenant architecture
- Set up Clerk authentication

### October 2025 - Project Initialization
- Created Next.js 15 project
- Set up Shadcn/ui components
- Designed initial database schema
- Created PRD and architecture docs

---

## 🐛 Known Issues (Current)

| Issue | Status | Workaround |
|-------|--------|------------|
| Webhooks only work on Vercel | Expected | Deploy to Vercel for real-time |
| Delete shows brief error | Fixed | Empty response handling added |
| Status doesn't auto-update | Fixed | Auto-sync on page load |

---

## 🚧 Pending Work

### High Priority
1. **Deploy to Vercel** - Enable webhook reception
2. **Test real-time messages** - Verify webhook → Convex flow
3. **Implement AI responses** - Inngest function for auto-replies

### Medium Priority
4. **Campaign system** - Bulk messaging with templates
5. **Credit system** - Subscription enforcement
6. **Poll-based qualification** - Lead scoring

### Low Priority
7. **Vision AI** - Property photo analysis
8. **Analytics dashboard** - Usage metrics
9. **Internationalization** - Multi-language support

---

## 📝 Deployment Checklist

Before deploying to production:

- [ ] Push code to GitHub
- [ ] Verify Vercel deployment succeeds
- [ ] Run `npx convex deploy`
- [ ] Test instance creation flow
- [ ] Test QR code scanning
- [ ] Test chat sync
- [ ] Send test message to verify webhook

---

## 🔗 Resources

- **WAHA Docs:** https://waha.devlike.pro/docs
- **Convex Docs:** https://docs.convex.dev
- **Clerk Docs:** https://clerk.com/docs
- **Inngest Docs:** https://www.inngest.com/docs

---

*This changelog helps track the evolution of the My Aibud system and provides context for future development.*

# My Aibud - Updates & Changelog

> **Document Purpose:** Track all significant changes, migrations, and updates to the My Aibud WhatsApp System.

---

## 📅 January 10, 2026 - PRODUCTION LAUNCH 🎉

### 🎯 Summary
All critical deployment blockers resolved. MyChatFlow is now **production-ready** with full multi-user support.

### ✅ Critical Issues Resolved

1. **Vercel Build Failure**
   - Downgraded Next.js from 16.0.7 to 15.5.9
   - Updated eslint-config-next to 15.1.6
   - Build now succeeds on Vercel

2. **Clerk SSL Certificate**
   - Fixed DNS proxy configuration for clk2 CNAME
   - SSL certificate successfully provisioned
   - clerk.mychatflow.app now working

3. **Convex Auth Provider**
   - Updated `convex/auth.config.ts` to use custom Clerk domain
   - JWT validation now works correctly

4. **WAHA Instance Creation (422 Error)**
   - Corrected `WAHA_API_URL` in Vercel to point to Hetzner (not Railway)
   - Added `NEXT_PUBLIC_APP_URL` for webhook URL generation
   - Fixed webhook events to `["message", "session.status"]`

5. **QR Code Generation (404 Error)**
   - Updated endpoint to WAHA 2026.x format: `/api/{session}/auth/qr`
   - Handle PNG binary response (not JSON)
   - Convert to base64 data URL for display

6. **Clerk Deprecated Props**
   - Replaced `afterSignInUrl` with `fallbackRedirectUrl` environment variables

### ✅ New Features Implemented

1. **Instance Status Polling**
   - 5-second interval polling for real-time status updates
   - Status changes trigger toast notifications

2. **Session Status Webhooks**
   - WAHA now sends `session.status` events
   - Webhook handler updates Convex instance status
   - Immediate feedback when phone connects

3. **QR Code Expiry Timer**
   - 60-second countdown displayed on QR modal
   - Auto-refresh when timer expires
   - Manual refresh button available

4. **Skeleton Loading States**
   - Dashboard shows loading skeleton during data fetch
   - Instances page shows skeleton while loading

5. **Toast Notifications**
   - Instance created/deleted feedback
   - Status change notifications
   - Sync operation results

6. **Tenant Isolation Audit**
   - All Convex queries now use `withIndex("by_tenant", ...)`
   - Added indexes for instances, contacts, interactions, subscriptionUsage

### 🗃️ Database Schema Updates

Added indexes for performance and tenant scoping:
```typescript
instances: .index("by_tenant", ["tenantId"])
contacts: .index("by_tenant", ["tenantId"])
subscriptionUsage: .index("by_tenant", ["tenantId"])
interactions: .index("by_contact", ["contactId"]).index("by_tenant", ["tenantId"])
```

### 📝 Documentation Updates

- Updated `context.md` - Changed status to "PRODUCTION LIVE"
- Updated `Architecture.md` - Added WAHA 2026.x details and flow diagrams
- Updated `CRITICAL-ISSUES.md` - Marked all blockers as resolved

### 🐛 Bug Fixes

1. Fixed missing `DialogDescription` accessibility warning
2. Fixed QR code not refreshing after scan
3. Fixed status not updating after phone connects
4. Fixed unused import warnings in ESLint

---

## 📅 January 9, 2026 - CRITICAL DEPLOYMENT ISSUES

### 🚨 BLOCKER: Vercel Build Failure

**Error:**
```
RangeError: Invalid count value: -1
    at String.repeat (<anonymous>)
```

**Facts:**
- ✅ Local build succeeds (`npm run build` works)
- ❌ Vercel build fails during "Creating an optimized production build"
- Vercel shows: `Next.js 16.0.7 (Turbopack)`
- Node.js: 20.x (specified in `engines` field)

**Root Cause Hypothesis:**
Next.js 16 + Vercel Turbopack incompatibility

**Attempted Fixes (All Failed):**
1. Added `engines: { node: "20.x" }` to package.json
2. Set Root Directory to `Downloads/whatsapp assistant 1` in Vercel
3. Reverted config changes

**Recommended Next Steps:**
1. Try adding `--no-turbo` to build command in Vercel settings
2. Or downgrade Next.js to 15.x if Turbopack issues persist
3. Check `src/app/page.tsx` (landing page) for issues

### 🚨 BLOCKER: Clerk SSL Certificate Not Issued

**Problem:** `https://clerk.mychatflow.app` returns `ERR_SSL_VERSION_OR_CIPHER_MISMATCH`

**DNS Status:**
- All 5 records added to Namecheap
- 4/5 verified in Clerk, 1 was pending
- DNS propagation confirmed

**Solution:** Contact Clerk Support to manually issue SSL certificates

### ⚠️ Features Added Today (Intact in Code, Not Deployed)
- MyChatFlow rebranding (landing page, sidebar)
- Human-in-the-Loop feature (pause/resume AI for contacts)

---

## 📅 January 8, 2026 - Production Deployment & UI Overhaul

### 🎯 Summary
Successfully deployed WhatsApp AI Assistant to Vercel production with complete UI redesign, collapsible sidebar, settings management, and Excel upload support.

### ✅ Changes Made

#### Deployment
- **GitHub Repository:** `https://github.com/JacobKayembekazadi/myAIbud2`
- **Production URL:** Deployed to Vercel (awaiting environment variable configuration)
- **Build Status:** ✅ Successful (fixed TypeScript errors)
- **Deployment Method:** Vercel CLI (`vercel --prod`)

#### New Features

**1. Collapsible Sidebar**
- Toggle button to collapse/expand sidebar (64px ↔ 256px)
- localStorage persistence for user preference
- Smooth animations and transitions
- Hover tooltips in collapsed mode
- Premium glassmorphism design

**2. Settings Page** (`/settings`)
- **Profile Tab:** Account info, subscription status, credits remaining
- **AI Config Tab:** 
  - Auto-reply toggle
  - Model selection (Gemini Flash vs Pro)
  - Temperature slider (0-1)
  - Max tokens configuration
  - Default WhatsApp instance selector
- **Notifications Tab:** Email/SMS notification preferences
- **Quick Replies Tab:** Pre-defined responses for AI to reference

**3. Excel Upload Support**
- Campaigns now accept `.xlsx` and `.xls` files (in addition to CSV)
- Uses `xlsx` library for parsing
- Real-time preview of parsed contacts
- Toast notifications for upload feedback

**4. Premium UI Redesign**
- **Dashboard:** Analytics cards, progress bars, quick actions, recent activity
- **Sidebar:** Glassmorphism, active state indicators, refined navigation
- **Instances:** Consistent styling with dashboard aesthetic
- **Campaigns:** Drag-and-drop UI, progress bars, refined cards

**5. Premium Authentication UI**
- Split-screen landing experience for Sign-In and Sign-Up
- Feature showcase sections with custom icons
- High-end Clerk integration with matching dark theme
- Fully responsive and animated transitions

#### Code Changes


**New Files:**
| File | Purpose |
|------|---------|
| `src/components/SidebarContext.tsx` | Context provider for sidebar collapse state |
| `src/components/LayoutContent.tsx` | Dynamic margin adjustment based on sidebar |
| `src/app/settings/page.tsx` | Settings page wrapper |
| `src/app/settings/settings-client.tsx` | Settings management with tabs |
| `convex/settings.ts` | Settings and Quick Replies queries/mutations |
| `src/components/ToasterClient.tsx` | Client-side toast wrapper |

**Modified Files:**
| File | Changes |
|------|---------|
| `src/components/Sidebar.tsx` | Complete redesign with collapse functionality |
| `src/app/layout.tsx` | Added SidebarProvider and LayoutContent |
| `src/app/page.tsx` | Dashboard redesign with analytics cards |
| `src/app/campaigns/campaigns-client.tsx` | Excel support + visual upgrades |
| `src/app/instances/instances-client.tsx` | Glassmorphism styling |
| `convex/schema.ts` | Added `settings` and `quickReplies` tables |
| `.gitignore` | Added `.gemini` to exclude IDE files |

**Dependencies Added:**
- `xlsx` - Excel file parsing
- `sonner` - Toast notifications (already installed)

#### Database Schema Updates

**New Tables:**
```typescript
settings: {
  tenantId: Id<"tenants">,
  autoReplyEnabled: boolean,
  defaultInstanceId?: string,
  aiModel: string,
  aiTemperature: number,
  aiMaxTokens: number,
  emailNotifications: boolean,
  smsNotifications: boolean,
  updatedAt: number
}

quickReplies: {
  tenantId: Id<"tenants">,
  label: string,
  content: string,
  category?: string,
  isActive: boolean,
  createdAt: number,
  updatedAt: number
}
```

### 🐛 Bug Fixes
1. **TypeScript Build Error:** Fixed `defaultInstanceId` optional field in settings defaults
2. **Server-Side Rendering:** Fixed Sonner toast by creating client wrapper
3. **Sidebar Scrollbar:** Added custom dark scrollbar styles
4. **Git Issues:** Excluded `.gemini` directory from version control

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

| Issue | Status | Notes |
|-------|--------|-------|
| QR codes expire in 60s | Limitation | Auto-refresh implemented |
| Session may disconnect | Limitation | Polling detects disconnection |

---

## 🚧 Pending Work

### High Priority
1. ✅ ~~Deploy to Vercel~~ - **DONE**
2. ✅ ~~Configure environment variables on Vercel~~ - **DONE**
3. ✅ ~~Set up webhook URL in WAHA~~ - **DONE**
4. ✅ ~~Test real-time messages~~ - **DONE**
5. **Stripe Billing Integration** - Revenue enablement

### Medium Priority
6. **Analytics Dashboard** - Usage metrics and charts
7. **Vision AI** - Property photo analysis
8. **Contact Management** - Bulk import/export, tagging

### Low Priority
9. **Internationalization** - Multi-language support
10. **Mobile App** - React Native version

---

## 📝 Deployment Checklist

Production deployment status:

- [x] Push code to GitHub
- [x] Verify Vercel deployment succeeds
- [x] Fix TypeScript build errors
- [x] Configure environment variables on Vercel
- [x] Set webhook URL in WAHA
- [x] Run Convex schema updates
- [x] Test instance creation flow
- [x] Test QR code scanning
- [x] Test chat sync
- [x] Test status polling
- [ ] Test real-time webhook messages
- [ ] Verify AI auto-response

---

## 🔗 Resources

- **GitHub Repo:** https://github.com/JacobKayembekazadi/myAIbud2
- **WAHA Docs:** https://waha.devlike.pro/docs
- **Convex Docs:** https://docs.convex.dev
- **Clerk Docs:** https://clerk.com/docs
- **Inngest Docs:** https://www.inngest.com/docs
- **Vercel Docs:** https://vercel.com/docs

---

*This changelog helps track the evolution of the My Aibud system and provides context for future development.*

# ProPilot Hub → My Aibud Migration Checklist

## Pre-Migration Checklist

### ✅ Prerequisites
- [ ] ProPilot Hub repository cloned
- [ ] My Aibud project runs successfully (`npm run dev`)
- [ ] Git branch created for migration (`git checkout -b feature/propilot-ui-migration`)
- [ ] Backup created of current codebase

---

## Phase 1: Component Library Migration

### Step 1: Install Dependencies

Run these commands in the **My Aibud** directory:

```bash
npm install @tanstack/react-query recharts react-resizable-panels next-themes sonner cmdk embla-carousel-react react-day-picker react-hook-form @hookform/resolvers date-fns @hello-pangea/dnd vaul
```

**Checklist:**
- [ ] Dependencies installed without errors
- [ ] No version conflicts reported
- [ ] `npm run dev` still works

### Step 2: Copy UI Components

**From:** `propilot-hub-temp/src/components/ui/`  
**To:** `whatsapp assistant 1/src/components/ui/`

#### Essential Components (Copy First):
- [ ] `card.tsx` - Dashboard cards
- [ ] `badge.tsx` - Status indicators
- [ ] `button.tsx` - Already have, but check for enhancements
- [ ] `input.tsx` - Form inputs
- [ ] `label.tsx` - Form labels
- [ ] `table.tsx` - Data tables
- [ ] `tabs.tsx` - Tabbed interfaces
- [ ] `select.tsx` - Dropdown selects
- [ ] `textarea.tsx` - Multi-line inputs
- [ ] `switch.tsx` - Toggle switches
- [ ] `skeleton.tsx` - Loading states
- [ ] `toast.tsx` & `toaster.tsx` - Notifications
- [ ] `sonner.tsx` - Better toast alternative
- [ ] `separator.tsx` - Visual dividers
- [ ] `scroll-area.tsx` - Custom scrollbars

#### Secondary Components (Copy as Needed):
- [ ] `accordion.tsx` - Expandable sections
- [ ] `alert.tsx` & `alert-dialog.tsx` - Alerts and confirmations
- [ ] `avatar.tsx` - User avatars
- [ ] `breadcrumb.tsx` - Navigation breadcrumbs
- [ ] `calendar.tsx` - Date picker
- [ ] `carousel.tsx` - Image carousels
- [ ] `chart.tsx` - Chart components
- [ ] `checkbox.tsx` - Checkboxes
- [ ] `collapsible.tsx` - Collapsible content
- [ ] `command.tsx` - Command palette (Cmd+K)
- [ ] `context-menu.tsx` - Right-click menus
- [ ] `drawer.tsx` - Mobile-friendly drawers
- [ ] `dropdown-menu.tsx` - Dropdown menus
- [ ] `form.tsx` - Form wrapper with validation
- [ ] `hover-card.tsx` - Hover tooltips
- [ ] `input-otp.tsx` - OTP input fields
- [ ] `menubar.tsx` - Application menu bar
- [ ] `navigation-menu.tsx` - Complex navigation
- [ ] `pagination.tsx` - Pagination controls
- [ ] `popover.tsx` - Popover panels
- [ ] `progress.tsx` - Progress bars
- [ ] `radio-group.tsx` - Radio buttons
- [ ] `resizable.tsx` - Resizable panels
- [ ] `sheet.tsx` - Side sheets
- [ ] `sidebar.tsx` - Sidebar component (NEW shadcn version)
- [ ] `slider.tsx` - Range sliders
- [ ] `toggle.tsx` & `toggle-group.tsx` - Toggle buttons
- [ ] `tooltip.tsx` - Tooltips

### Step 3: Update `lib/utils.ts`

Check if ProPilot has additional utility functions:

```bash
# Compare the files
diff propilot-hub-temp/src/lib/utils.ts src/lib/utils.ts
```

- [ ] Reviewed differences
- [ ] Merged useful utilities
- [ ] Tested `cn()` function still works

---

## Phase 2: Layout Components Migration

### Step 1: Enhanced Sidebar

**Create:** `src/components/layout/AppSidebar.tsx`

**Copy from:** `propilot-hub-temp/src/components/layout/AppSidebar.tsx`

**Adaptations needed:**
- [ ] Replace React Router's `Link` with Next.js `Link`
- [ ] Replace `useLocation()` with `usePathname()`
- [ ] Keep Clerk `UserButton` integration
- [ ] Update navigation items for My Aibud:
  ```typescript
  const navGroups = [
    {
      label: "Overview",
      items: [
        { href: "/", label: "Dashboard", icon: Home },
      ]
    },
    {
      label: "WhatsApp",
      items: [
        { href: "/instances", label: "Instances", icon: Smartphone },
        { href: "/chat", label: "Chats", icon: MessageSquare },
        { href: "/contacts", label: "Contacts", icon: Users },
      ]
    },
    {
      label: "Management",
      items: [
        { href: "/analytics", label: "Analytics", icon: BarChart },
        { href: "/settings", label: "Settings", icon: Settings },
      ]
    }
  ];
  ```

- [ ] Tested sidebar navigation
- [ ] Verified active states work
- [ ] Checked mobile responsiveness
- [ ] Dark theme styling matches

### Step 2: Header Component

**Create:** `src/components/layout/Header.tsx`

**Copy from:** `propilot-hub-temp/src/components/layout/Header.tsx`

**Adaptations needed:**
- [ ] Update branding ("My Aibud")
- [ ] Add credit usage display
- [ ] Add notification bell (future)
- [ ] Keep responsive mobile toggle

### Step 3: Main Layout

**Update:** `src/app/layout.tsx` or create layout wrapper

**Copy from:** `propilot-hub-temp/src/components/layout/Layout.tsx`

**Adaptations needed:**
- [ ] Adapt to Next.js App Router patterns
- [ ] Integrate with Clerk auth
- [ ] Add TenantProvider if missing
- [ ] Test layout responsiveness

---

## Phase 3: Page Templates Migration

### Dashboard Overview

**Create:** `src/app/(dashboard)/page.tsx`

**Inspired by:** `propilot-hub-temp/src/pages/dashboard/DashboardOverview.tsx`

**Components to build:**
- [ ] Stats cards (total instances, active contacts, credits used, messages today)
- [ ] Recent activity feed
- [ ] Quick actions panel
- [ ] Usage chart (line chart)

**Data to fetch:**
- [ ] Connect to Convex for real-time stats
- [ ] Fetch recent interactions
- [ ] Calculate credit usage

### Instances Page

**Create:** `src/app/(dashboard)/instances/page.tsx`

**Inspired by:** ProPilot's campaigns or settings page

**Components to build:**
- [ ] Instance cards (status, QR code, connection info)
- [ ] Add new instance button
- [ ] QR code modal
- [ ] Instance status badges
- [ ] Delete instance dialog

**Data to fetch:**
- [ ] Instance list from database
- [ ] Real-time connection status
- [ ] QR code generation

### Contacts Page

**Create:** `src/app/(dashboard)/contacts/page.tsx`

**Inspired by:** `propilot-hub-temp/src/pages/dashboard/LeadsPage.tsx`

**Components to build:**
- [ ] Contact table with search/filter
- [ ] Status badges (new, qualified, engaged, paused)
- [ ] Contact details dialog
- [ ] Bulk actions (pause, resume, export)
- [ ] Pagination

**Data to fetch:**
- [ ] Contact list from database
- [ ] Message counts per contact
- [ ] Last interaction timestamp

### Chat View

**Create:** `src/app/(dashboard)/chat/page.tsx`

**Inspired by:** `propilot-hub-temp/src/pages/dashboard/AIChatPage.tsx`

**Components to build:**
- [ ] Contact list sidebar
- [ ] Message thread view
- [ ] Manual intervention input
- [ ] Message status indicators
- [ ] Scroll to bottom on new messages

**Data to fetch:**
- [ ] Interactions from database
- [ ] Real-time message updates
- [ ] Contact status

### Analytics Page

**Create:** `src/app/(dashboard)/analytics/page.tsx`

**Copy from:** `propilot-hub-temp/src/pages/dashboard/AnalyticsPage.tsx`

**Components to build:**
- [ ] Line chart - Messages over time
- [ ] Bar chart - Credits by instance
- [ ] Pie chart - Contact status distribution
- [ ] Table - Top performing instances
- [ ] Date range picker

**Data to fetch:**
- [ ] Aggregate interaction stats
- [ ] Credit usage history
- [ ] Contact status counts

### Settings Page

**Create:** `src/app/(dashboard)/settings/page.tsx`

**Copy from:** `propilot-hub-temp/src/pages/dashboard/SettingsPage.tsx`

**Components to build:**
- [ ] Tabs (General, API Keys, Billing, Notifications)
- [ ] Form inputs with validation
- [ ] Save/cancel buttons
- [ ] Toast notifications on save

**Data to fetch:**
- [ ] User preferences
- [ ] API key display (masked)
- [ ] Subscription details

---

## Phase 4: Advanced Features (Optional)

### Kanban Board for Contacts

**Create:** `src/app/(dashboard)/contacts/kanban/page.tsx`

**Copy from:** `propilot-hub-temp/src/pages/dashboard/LeadsKanbanPage.tsx`

**Dependencies:**
- [ ] `@hello-pangea/dnd` installed
- [ ] Drag and drop working
- [ ] Status updates on drop
- [ ] Optimistic UI updates

**Columns:**
- New Leads
- Qualified
- Engaged
- Converted
- Paused

### Automation Builder (Future)

**Create:** `src/app/(dashboard)/automation/page.tsx`

**Copy from:** `propilot-hub-temp/src/pages/dashboard/AutomationPage.tsx`

**Dependencies:**
- [ ] `@xyflow/react` installed
- [ ] Flow builder working
- [ ] Node configuration dialogs
- [ ] Save/load workflows

---

## Phase 5: Styling & Theme

### Dark Mode Setup

**Install theme provider:**
```bash
npm install next-themes
```

**Steps:**
- [ ] Copy `propilot-hub-temp/src/index.css` color variables
- [ ] Update `src/app/globals.css` with theme variables
- [ ] Wrap app with `ThemeProvider`
- [ ] Add theme toggle button
- [ ] Test light/dark mode switching

### Tailwind Config

**Update:** `tailwind.config.ts`

**Copy from:** `propilot-hub-temp/tailwind.config.ts`

**Additions:**
- [ ] Custom color palette
- [ ] Animation definitions
- [ ] Typography plugin settings
- [ ] Border radius values

---

## Testing Checklist

### Functionality Tests
- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] Forms submit successfully
- [ ] Data displays correctly
- [ ] Real-time updates work
- [ ] Authentication flows work

### UI/UX Tests
- [ ] Responsive on mobile (375px)
- [ ] Responsive on tablet (768px)
- [ ] Responsive on desktop (1920px)
- [ ] Dark mode looks good
- [ ] Light mode looks good
- [ ] Loading states display
- [ ] Error states display
- [ ] Animations are smooth
- [ ] Hover effects work

### Performance Tests
- [ ] Page load time < 2s
- [ ] No console errors
- [ ] No console warnings
- [ ] Lighthouse score > 90
- [ ] No layout shift (CLS)

---

## Cleanup Tasks

- [ ] Remove unused ProPilot components
- [ ] Delete temporary clone (`propilot-hub-temp/`)
- [ ] Remove unused dependencies
- [ ] Update README with new features
- [ ] Document new components
- [ ] Update environment variables example

---

## Deployment Checklist

- [ ] All features working locally
- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Build succeeds locally (`npm run build`)
- [ ] Preview deployment tested
- [ ] Production deployment successful
- [ ] Post-deployment smoke tests pass

---

## Rollback Plan

If something goes wrong:

```bash
# Revert to previous commit
git reset --hard HEAD~1

# Or checkout the backup branch
git checkout main

# Or restore specific files
git checkout HEAD -- src/components/
```

**Emergency contacts:**
- Backend still working? → UI issue only
- Backend broken? → Check Inngest/Convex changes
- Can't login? → Check Clerk configuration

---

## Success Metrics

**You'll know the migration is successful when:**

1. ✅ **All pages load** - No 404s or blank screens
2. ✅ **Navigation flows** - Users can access all features
3. ✅ **Data displays** - Real data from backend shows correctly
4. ✅ **Actions work** - Creating instances, viewing chats, etc.
5. ✅ **Performance maintained** - No significant slowdowns
6. ✅ **Mobile friendly** - Responsive on all devices
7. ✅ **Visually polished** - Looks professional and modern
8. ✅ **Customers happy** - User feedback positive

---

## Timeline Estimate

| Phase | Task | Time Estimate |
|-------|------|---------------|
| 1 | Install dependencies | 30 minutes |
| 1 | Copy UI components | 1 hour |
| 1 | Test components | 2 hours |
| 2 | Migrate layout | 4 hours |
| 2 | Test layout | 2 hours |
| 3 | Dashboard page | 4 hours |
| 3 | Instances page | 4 hours |
| 3 | Contacts page | 6 hours |
| 3 | Chat page | 6 hours |
| 3 | Analytics page | 6 hours |
| 3 | Settings page | 4 hours |
| 4 | Theme setup | 2 hours |
| 5 | Testing | 8 hours |
| 5 | Bug fixes | 8 hours |
| **TOTAL** | | **~60 hours (~2 weeks)** |

**Accelerated timeline:** If you work full-time on this, you could complete in 7-10 days.

---

## Need Help?

**Common issues and solutions:**

1. **Component not rendering**
   - Check import paths
   - Verify all dependencies installed
   - Check for TypeScript errors

2. **Styling looks wrong**
   - Copy the exact Tailwind classes
   - Check CSS variables are defined
   - Verify theme provider is wrapping app

3. **Next.js routing issues**
   - Use `usePathname()` not `useLocation()`
   - Use Next.js `Link` not React Router `Link`
   - Check App Router file structure

4. **Real-time data not updating**
   - Verify Convex subscriptions
   - Check network tab for WebSocket connection
   - Ensure component remounts on data change

---

**Ready to start? Let me know which phase you'd like to begin with!**

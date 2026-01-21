# MyChatFlow Standard Operating Procedures

> **Version**: 1.0
> **Last Updated**: January 2026
> **Classification**: Internal Operations Manual

---

## Table of Contents

1. [Customer Onboarding](#1-customer-onboarding)
2. [WhatsApp Instance Setup](#2-whatsapp-instance-setup)
3. [AI Configuration & Training](#3-ai-configuration--training)
4. [Daily Operations](#4-daily-operations)
5. [Incident Response](#5-incident-response)
6. [Deployment Procedures](#6-deployment-procedures)
7. [Customer Support Escalation](#7-customer-support-escalation)
8. [Security Procedures](#8-security-procedures)
9. [Data Management](#9-data-management)
10. [Maintenance Windows](#10-maintenance-windows)

---

## 1. Customer Onboarding

### 1.1 Pre-Onboarding Checklist

Before starting customer onboarding, verify:

- [ ] Customer has signed service agreement
- [ ] Payment method configured
- [ ] Business information collected (name, industry, description)
- [ ] WhatsApp Business number available
- [ ] Primary contact email confirmed

### 1.2 Account Creation

**Step 1: Customer Signs Up**
```
1. Customer visits app.mychatflow.app
2. Signs up via Clerk (email or OAuth)
3. System automatically creates tenant record
4. Welcome email sent via Resend
```

**Step 2: Initial Configuration Wizard**
```
1. Business profile setup
   - Business name
   - Industry selection
   - Business description
   - Services offered

2. AI personality configuration
   - Professional / Friendly / Casual
   - Custom system prompt (optional)

3. Operating hours
   - Business days
   - Start/end times
   - Timezone

4. Notification preferences
   - Email notifications
   - Handoff alerts
```

### 1.3 WhatsApp Connection

**Prerequisites:**
- Dedicated business phone number (or new SIM)
- Phone with WhatsApp installed
- Stable internet connection during setup

**Procedure:**
```
1. Navigate to Settings → WhatsApp Instances
2. Click "Add New Instance"
3. Enter instance name (e.g., "Main Sales Line")
4. System generates QR code via WAHA
5. Open WhatsApp on phone → Settings → Linked Devices
6. Scan QR code displayed in dashboard
7. Wait for "Connected" status (30-60 seconds)
8. Verify webhook configuration shows "Active"
```

**Troubleshooting Connection Issues:**
| Issue | Solution |
|-------|----------|
| QR code expired | Refresh page, scan new QR |
| "Already linked" error | Unlink existing devices from phone |
| Stuck on "Connecting" | Check WAHA server status |
| Disconnects frequently | Ensure phone has stable internet |

### 1.4 Knowledge Base Setup

**Step 1: Add Quick Replies**
```
1. Navigate to Settings → Quick Replies
2. Add FAQ items for common questions:
   - Business hours
   - Pricing information
   - Location/address
   - Services offered
   - Contact methods

Example format:
   Label: "Business Hours"
   Content: "We're open Monday to Friday, 8 AM to 6 PM.
            Saturday 9 AM to 1 PM. Closed on Sundays."
```

**Step 2: Configure Industry-Specific Settings**

| Industry | Recommended Quick Replies |
|----------|--------------------------|
| Real Estate | Property listings, viewing booking, price ranges |
| Car Dealership | Inventory highlights, test drive booking, trade-in info |
| Law Firm | Practice areas, consultation booking, fee structure |
| Healthcare | Services, appointment booking, insurance accepted |

### 1.5 Go-Live Checklist

Before activating AI responses:

- [ ] WhatsApp instance connected and stable
- [ ] Quick replies populated (minimum 10)
- [ ] Business profile complete
- [ ] Welcome message configured
- [ ] Handoff keywords reviewed
- [ ] Test conversation completed internally
- [ ] Customer approved AI responses

---

## 2. WhatsApp Instance Setup

### 2.1 WAHA Server Configuration

**Server Requirements:**
- 2 vCPU, 4GB RAM minimum
- Docker installed
- Persistent storage for sessions
- Static IP or domain name

**Docker Deployment:**
```bash
# Pull WAHA Plus image
docker pull devlikeapro/waha-plus:latest

# Run with persistent storage
docker run -d \
  --name waha \
  -p 3000:3000 \
  -v waha_sessions:/app/.sessions \
  -e WHATSAPP_RESTART_ALL_SESSIONS=True \
  -e WAHA_DASHBOARD_ENABLED=true \
  devlikeapro/waha-plus:latest
```

**Environment Variables:**
```bash
# MyChatFlow configuration
WAHA_API_URL=https://waha.yourdomain.com
WAHA_API_KEY=your-secure-api-key
WAHA_WEBHOOK_SECRET=your-webhook-secret
```

### 2.2 Webhook Configuration

**Configure via API:**
```bash
curl -X PUT "https://waha.yourdomain.com/api/sessions/{session}/webhooks" \
  -H "Authorization: Bearer ${WAHA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://app.mychatflow.app/api/webhooks/whatsapp",
    "events": ["message", "message.ack", "session.status"],
    "hmac": {
      "key": "${WAHA_WEBHOOK_SECRET}"
    }
  }'
```

### 2.3 Session Management

**Starting a Session:**
```bash
curl -X POST "https://waha.yourdomain.com/api/sessions/start" \
  -H "Authorization: Bearer ${WAHA_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "customer-instance-id",
    "config": {
      "webhooks": [{"url": "...", "events": [...]}]
    }
  }'
```

**Checking Session Status:**
```bash
curl "https://waha.yourdomain.com/api/sessions/{session}" \
  -H "Authorization: Bearer ${WAHA_API_KEY}"
```

**Restarting a Session:**
```bash
curl -X POST "https://waha.yourdomain.com/api/sessions/{session}/restart" \
  -H "Authorization: Bearer ${WAHA_API_KEY}"
```

---

## 3. AI Configuration & Training

### 3.1 System Prompt Best Practices

**Template Structure:**
```
You are [AI_NAME], a professional AI assistant for [BUSINESS_NAME].

ABOUT THE BUSINESS:
[BUSINESS_DESCRIPTION]

SERVICES OFFERED:
[LIST_OF_SERVICES]

YOUR PERSONALITY:
- [PERSONALITY_TRAITS]
- Always be helpful and professional
- If unsure, offer to connect with a human

IMPORTANT RULES:
1. Never make up information about products/services
2. Never discuss competitors negatively
3. Always recommend booking appointments for complex inquiries
4. Respect customer privacy
```

### 3.2 Temperature Settings

| Use Case | Temperature | Behavior |
|----------|-------------|----------|
| Factual Q&A | 0.3 | Precise, consistent |
| General Chat | 0.7 | Balanced, natural |
| Creative Content | 0.9 | Varied, engaging |

**Recommendation:** Start at 0.7 and adjust based on customer feedback.

### 3.3 Handoff Configuration

**Default Handoff Keywords:**
- "speak to human"
- "real person"
- "agent please"
- "manager"
- "not helpful"
- "frustrated"
- "complaint"

**Industry-Specific Additions:**

| Industry | Additional Keywords |
|----------|-------------------|
| Healthcare | "emergency", "urgent", "in pain" |
| Legal | "need lawyer", "legal advice", "court" |
| Financial | "dispute", "fraud", "unauthorized" |

### 3.4 Language Configuration

**Supported Languages:**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Portuguese (pt)
- Italian (it)
- Dutch (nl)
- Zulu (zu)
- Afrikaans (af)

**Configuration:**
```
Settings → Multi-Language
  ✓ Auto-detect language
  ✓ Respond in detected language
  Default: English (fallback)
```

---

## 4. Daily Operations

### 4.1 Morning Checklist (9:00 AM)

- [ ] Check dashboard for overnight conversations
- [ ] Review handoff notifications
- [ ] Verify all WhatsApp instances connected
- [ ] Review lead pipeline (hot leads prioritized)
- [ ] Check for pending follow-ups

### 4.2 Monitoring Dashboard

**Key Metrics to Track:**

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Response Time | < 2s | > 5s |
| Message Volume | Baseline ±20% | > 50% variance |
| AI Success Rate | > 95% | < 90% |
| Handoff Rate | < 10% | > 20% |
| Lead Conversion | > 15% | < 10% |

### 4.3 Conversation Review

**Daily Review Process:**
```
1. Filter: Last 24 hours
2. Sort by: Lead score (highest first)
3. Review: Hot leads (Grade A)
4. Action: Assign follow-ups
5. Note: Common questions for knowledge base
```

### 4.4 Lead Management

**Lead Response SLA:**

| Lead Grade | Response Time | Action Required |
|------------|---------------|-----------------|
| A (Hot) | < 1 hour | Personal call |
| B (Warm) | < 4 hours | Personalized message |
| C (Interested) | < 24 hours | Follow-up sequence |
| D (Cold) | Automated | Nurture campaign |
| F (Inactive) | 7 days | Re-engagement or archive |

### 4.5 End of Day Checklist (5:00 PM)

- [ ] All hot leads contacted
- [ ] Pending handoffs resolved
- [ ] Analytics reviewed
- [ ] Knowledge base updated if needed
- [ ] After-hours mode enabled (if applicable)

---

## 5. Incident Response

### 5.1 Incident Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| P1 | Complete outage | 15 minutes | CEO, CTO |
| P2 | Major feature broken | 1 hour | Engineering Lead |
| P3 | Minor feature issue | 4 hours | Support Team |
| P4 | Cosmetic/low impact | 24 hours | Backlog |

### 5.2 P1 Incident Procedure

**Immediate Actions (0-15 min):**
```
1. Acknowledge incident in Slack #incidents
2. Check Vercel status page
3. Check Convex status
4. Check WAHA server status
5. Check LLM provider status (OpenAI, Google, Anthropic)
```

**Diagnosis (15-30 min):**
```
1. Review Sentry for errors
2. Check Inngest dashboard for failed functions
3. Review recent deployments
4. Check environment variables
```

**Communication:**
```
1. Update status page
2. Email affected customers
3. Post in Slack with ETA
```

**Resolution:**
```
1. Apply fix or rollback
2. Verify service restored
3. Update status page
4. Send all-clear notification
```

**Post-Incident:**
```
1. Schedule post-mortem (within 24 hours)
2. Document root cause
3. Create preventive action items
4. Update runbooks if needed
```

### 5.3 Common Issues & Fixes

**Issue: WhatsApp Disconnected**
```
Symptoms:
  - Messages not being received
  - Instance shows "Disconnected" status

Fix:
  1. Check WAHA server health
  2. Restart WAHA Docker container
  3. Re-scan QR code if session expired
  4. Verify phone has internet connection
```

**Issue: AI Not Responding**
```
Symptoms:
  - Messages received but no AI response
  - Inngest showing failed functions

Fix:
  1. Check LLM provider status
  2. Verify API keys in Vercel env vars
  3. Check circuit breaker status
  4. Review Inngest function logs
```

**Issue: Slow Responses**
```
Symptoms:
  - Response time > 5 seconds
  - Users complaining about delays

Fix:
  1. Check primary LLM latency
  2. Verify fallback is working
  3. Check database query performance
  4. Review for unusual traffic spikes
```

### 5.4 LLM Provider Failover

**Automatic Failover (No Action Required):**
```
Primary (OpenAI) fails → Fallback (Gemini) activates → Tertiary (Claude)
Circuit breaker opens after 3 failures
Circuit resets after 60 seconds
```

**Manual Provider Override:**
```
Settings → AI Configuration → LLM Provider
  Primary: [Select alternative]
  Save changes
```

---

## 6. Deployment Procedures

### 6.1 Standard Deployment

**Automated via Vercel:**
```
1. Create PR to main branch
2. Automated checks run (lint, typecheck, build)
3. Preview deployment created
4. Review preview URL
5. Merge PR
6. Production deployment automatic
```

### 6.2 Convex Deployment

**Deploy Backend Functions:**
```bash
# Deploy to production
npx convex deploy

# Deploy to specific environment
npx convex deploy --prod
```

### 6.3 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] TypeScript type check clean
- [ ] No ESLint errors
- [ ] Preview tested manually
- [ ] Database migrations planned
- [ ] Rollback plan documented

### 6.4 Rollback Procedure

**Vercel Rollback:**
```
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback
```

**Convex Rollback:**
```bash
# View deployment history
npx convex deployments list

# Rollback to previous version
npx convex deploy --preview <deployment-id>
```

### 6.5 Environment Variable Updates

**Adding New Variables:**
```
1. Add to Vercel Dashboard → Settings → Environment Variables
2. Select environments: Production, Preview, Development
3. Update .env.example for documentation
4. Redeploy for changes to take effect
```

**Rotating API Keys:**
```
1. Generate new key from provider
2. Update in Vercel (do NOT delete old key yet)
3. Trigger redeployment
4. Verify new key working in logs
5. Delete old key from provider
```

---

## 7. Customer Support Escalation

### 7.1 Support Tiers

| Tier | Handler | Response SLA | Issues |
|------|---------|--------------|--------|
| L1 | Support Team | 4 hours | FAQ, how-to, basic config |
| L2 | Senior Support | 8 hours | Complex config, integration |
| L3 | Engineering | 24 hours | Bugs, feature requests |

### 7.2 Escalation Matrix

| Issue Type | Initial Tier | Escalate After |
|------------|--------------|----------------|
| Login issues | L1 | 1 hour |
| AI not responding | L2 | 4 hours |
| Billing disputes | L1 → Finance | Immediate |
| Data concerns | L2 → Legal | Immediate |
| Security issues | L3 | Immediate |

### 7.3 Support Request Template

```
Customer: [Name]
Account: [Tenant ID]
Priority: [P1/P2/P3/P4]
Issue: [Description]
Steps to Reproduce:
  1.
  2.
  3.
Expected Behavior:
Actual Behavior:
Screenshots/Logs:
```

### 7.4 Customer Communication Templates

**Initial Response:**
```
Hi [Name],

Thank you for contacting MyChatFlow support. I've received your request
regarding [ISSUE].

I'm looking into this now and will update you within [SLA TIME].

Ticket Reference: #[TICKET_ID]

Best regards,
[Agent Name]
MyChatFlow Support
```

**Resolution:**
```
Hi [Name],

Great news! The issue with [ISSUE] has been resolved.

Here's what we did:
- [ACTION TAKEN]

To prevent this in the future:
- [RECOMMENDATION]

Please let me know if you have any other questions.

Best regards,
[Agent Name]
MyChatFlow Support
```

---

## 8. Security Procedures

### 8.1 Access Control

**Production Access:**
- Only authorized personnel via Vercel team
- 2FA required for all accounts
- Access reviewed quarterly

**Database Access:**
- Convex dashboard access limited to engineering
- No direct database modifications in production
- All changes via deployed functions

### 8.2 API Key Management

**Storage Rules:**
- Never commit API keys to Git
- Store only in Vercel environment variables
- Use separate keys for dev/staging/production
- Rotate keys quarterly or after personnel changes

**Key Rotation Schedule:**
| Service | Rotation Frequency |
|---------|-------------------|
| OpenAI | Quarterly |
| Clerk | Annually |
| WAHA | Annually |
| Inngest | Annually |

### 8.3 Security Incident Response

**If Suspected Breach:**
```
1. IMMEDIATE: Rotate affected API keys
2. IMMEDIATE: Notify security team
3. 15 MIN: Identify scope of exposure
4. 1 HOUR: Notify affected customers
5. 24 HOURS: Complete incident report
6. 1 WEEK: Implement preventive measures
```

### 8.4 Data Access Requests

**GDPR Subject Access Request:**
```
1. Verify requester identity
2. Locate all data for user
3. Export data within 30 days
4. Provide in machine-readable format
```

**Data Deletion Request:**
```
1. Verify requester identity
2. Confirm deletion scope
3. Delete from Convex database
4. Delete from WAHA (if applicable)
5. Confirm deletion in writing
```

---

## 9. Data Management

### 9.1 Data Retention Policy

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Messages | 90 days | Configurable per tenant |
| Analytics | 365 days | Aggregated only |
| Audit Logs | 2 years | Compliance requirement |
| Deleted Accounts | 30 days | Soft delete period |

### 9.2 Backup Procedures

**Automated Backups (Convex):**
- Continuous backup by Convex infrastructure
- Point-in-time recovery available
- 30-day retention

**Manual Export (If Required):**
```
1. Convex Dashboard → Data → Export
2. Select tables
3. Download JSON format
4. Store in secure location
```

### 9.3 Data Migration

**Exporting Customer Data:**
```typescript
// Use Convex action for data export
export const exportTenantData = action({
  args: { tenantId: v.id("tenants") },
  handler: async (ctx, { tenantId }) => {
    // Export all tables for tenant
    const contacts = await ctx.runQuery(api.contacts.list, { tenantId });
    const interactions = await ctx.runQuery(api.interactions.list, { tenantId });
    // ... etc
    return { contacts, interactions };
  },
});
```

### 9.4 Data Anonymization

**For Analytics/Testing:**
```
Replace:
  - Phone numbers: +27XXXXXXXXX → +27000000001
  - Names: "John Smith" → "Contact #12345"
  - Email: "john@example.com" → "user_12345@example.com"
  - Message content: Summarize, don't preserve
```

---

## 10. Maintenance Windows

### 10.1 Scheduled Maintenance

**Standard Window:**
- Time: Sundays, 02:00 - 04:00 SAST
- Frequency: Monthly (if needed)
- Notice: 7 days advance

**Communication Template:**
```
Subject: Scheduled Maintenance - [DATE]

Dear MyChatFlow Customer,

We will be performing scheduled maintenance on [DATE] from [TIME] to [TIME] (SAST).

During this time:
- AI responses may be delayed
- Dashboard may be temporarily unavailable
- Messages will be queued and processed after maintenance

What to expect:
- [CHANGES/UPDATES]

No action is required on your part.

Thank you for your patience.

MyChatFlow Team
```

### 10.2 Emergency Maintenance

**Procedure:**
```
1. Assess urgency (can it wait for scheduled window?)
2. If urgent: minimum 1-hour notice to customers
3. Enable maintenance mode (if available)
4. Perform maintenance
5. Verify system health
6. Disable maintenance mode
7. Send all-clear notification
```

### 10.3 Database Migrations

**Safe Migration Checklist:**
- [ ] Test migration on staging
- [ ] Backup production data
- [ ] Schedule during low-traffic period
- [ ] Prepare rollback script
- [ ] Monitor after migration

**Convex Migration:**
```bash
# Deploy schema changes
npx convex deploy

# Convex handles migrations automatically
# No manual SQL required
```

### 10.4 WAHA Updates

**Update Procedure:**
```bash
# Pull latest image
docker pull devlikeapro/waha-plus:latest

# Stop current container
docker stop waha

# Remove old container
docker rm waha

# Start new container
docker run -d \
  --name waha \
  -p 3000:3000 \
  -v waha_sessions:/app/.sessions \
  -e WHATSAPP_RESTART_ALL_SESSIONS=True \
  devlikeapro/waha-plus:latest

# Verify sessions reconnect
docker logs waha
```

---

## Appendix

### A. Contact Information

| Role | Contact | Escalation |
|------|---------|------------|
| Support Lead | support@mychatflow.app | Primary |
| Engineering | engineering@mychatflow.app | L3 Issues |
| Security | security@mychatflow.app | Incidents |

### B. External Service Status Pages

| Service | Status URL |
|---------|------------|
| Vercel | status.vercel.com |
| Convex | status.convex.dev |
| OpenAI | status.openai.com |
| Clerk | status.clerk.com |
| Inngest | status.inngest.com |

### C. Quick Reference Commands

```bash
# Check WAHA health
curl https://waha.yourdomain.com/api/sessions

# Deploy Convex
npx convex deploy

# View Inngest logs
npx inngest-cli dev

# Check Vercel deployment
vercel ls
```

### D. Glossary

| Term | Definition |
|------|------------|
| Tenant | A customer account in the system |
| Instance | A connected WhatsApp phone number |
| Handoff | Transfer from AI to human agent |
| Lead Score | Numerical qualification of contact |
| Circuit Breaker | Pattern to prevent cascading failures |

---

*Document maintained by MyChatFlow Operations Team*
*Last reviewed: January 2026*

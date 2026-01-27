# Deployment Runbook

This runbook provides operational procedures for deploying, monitoring, and troubleshooting the WhatsApp AI Assistant in production.

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedures](#deployment-procedures)
3. [Health Checks](#health-checks)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Incident Response](#incident-response)
6. [Rollback Procedures](#rollback-procedures)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Pre-Deployment Checklist

Before deploying to production, verify all required services and configurations:

### Environment Variables

```bash
# Required Core Variables
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=production:your-deployment
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
WAHA_API_URL=https://waha.example.com
WAHA_API_KEY=your-waha-api-key
WAHA_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Optional But Recommended
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
INNGEST_EVENT_KEY=your-inngest-key
INNGEST_SIGNING_KEY=your-signing-key
SENTRY_DSN=https://your-sentry-dsn
RESEND_API_KEY=re_your-key
```

### Pre-Deploy Tests

```bash
# Run test suite
npm test

# Run linter
npm run lint

# Build the application
npm run build
```

### Service Health

- [ ] Convex database is accessible
- [ ] WAHA API is responding
- [ ] Clerk authentication is configured
- [ ] Redis (Upstash) is connected (if configured)
- [ ] Inngest is configured (if using background jobs)
- [ ] Sentry is capturing errors (if configured)
- [ ] Resend is configured for emails (if configured)

---

## Deployment Procedures

### Standard Deployment

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Install Dependencies**
   ```bash
   npm ci
   ```

3. **Run Database Migrations** (if applicable)
   ```bash
   npx convex deploy --prod
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Deploy to Vercel/Platform**
   ```bash
   vercel --prod
   # or use your platform's deployment command
   ```

6. **Verify Deployment**
   - Check health endpoint: `curl https://your-domain.com/api/health`
   - Verify all services show "up" status
   - Test webhook endpoint with sample payload
   - Check Sentry for any deployment errors

### Emergency Hotfix Deployment

For critical production issues:

1. Create hotfix branch from production
   ```bash
   git checkout -b hotfix/critical-fix production
   ```

2. Make minimal changes to fix the issue

3. Run smoke tests
   ```bash
   npm test
   npm run build
   ```

4. Deploy immediately
   ```bash
   vercel --prod
   ```

5. Monitor for 15 minutes post-deployment

6. Merge hotfix back to main
   ```bash
   git checkout main
   git merge hotfix/critical-fix
   git push origin main
   ```

---

## Health Checks

### Health Endpoint

**Endpoint:** `GET /api/health`

**Expected Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-13T10:30:00.000Z",
  "services": {
    "database": { "status": "up", "responseTime": 45 },
    "redis": { "status": "up" },
    "inngest": { "status": "configured" },
    "sentry": { "status": "configured" },
    "email": { "status": "configured" },
    "waha": { "status": "up", "responseTime": 120 }
  }
}
```

**Status Codes:**
- `200 OK` - All services healthy
- `503 Service Unavailable` - One or more critical services down

### Manual Health Checks

```bash
# Check health endpoint
curl https://your-domain.com/api/health

# Check webhook endpoint (should require signature)
curl -X POST https://your-domain.com/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Expected: 401 Unauthorized (signature missing)

# Check Convex connection
npx convex doctor --prod

# Check Inngest functions
curl https://your-domain.com/api/inngest
```

### Automated Monitoring

Set up uptime monitors for:
- `/api/health` - Check every 1 minute
- Alert if status is not "healthy" for 2 consecutive checks
- Alert if response time > 5 seconds

**Recommended Tools:**
- UptimeRobot (free tier available)
- Pingdom
- Datadog
- Better Stack

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Application Metrics**
   - Request latency (p50, p95, p99)
   - Error rate (target: < 1%)
   - Webhook processing time
   - API response times

2. **Infrastructure Metrics**
   - CPU usage (alert > 80%)
   - Memory usage (alert > 85%)
   - Database query time (alert > 500ms)
   - Redis connection pool

3. **Business Metrics**
   - Messages processed per minute
   - Credit consumption rate
   - Active users/tenants
   - Failed webhooks

### Sentry Error Monitoring

**Critical Errors (Page Immediately):**
- Database connection failures
- WAHA API unreachable
- Webhook signature verification failures
- Credit system failures

**Warning Errors (Review Daily):**
- Rate limit exceeded
- Slow requests (> 3 seconds)
- Invalid webhook payloads
- Non-critical API errors

### Log Monitoring

All logs are structured JSON with the following fields:

```json
{
  "level": "info|warn|error",
  "msg": "Human-readable message",
  "time": 1705147800000,
  "requestId": "abc123",
  "webhook": true,
  "event": "received|verified|processed|failed",
  "security": true,
  "action": "rate_limit|unauthorized|invalid_signature"
}
```

**Key Log Queries:**
```bash
# Find all failed webhooks in last hour
level="error" AND webhook=true AND event="failed"

# Find rate limit events
level="warn" AND security=true AND action="rate_limit"

# Find slow requests (> 1 second)
level="warn" AND msg="Slow request detected"

# Find unauthorized access attempts
level="warn" AND security=true AND action="unauthorized"
```

---

## Incident Response

### Severity Levels

**P0 - Critical (Respond immediately)**
- Service completely down
- Database unreachable
- WAHA API failing
- Data loss or corruption

**P1 - High (Respond within 1 hour)**
- Degraded performance (> 3s response time)
- Partial feature outage
- Elevated error rate (> 5%)

**P2 - Medium (Respond within 4 hours)**
- Non-critical feature broken
- Slow background jobs
- Minor UI issues

**P3 - Low (Respond within 24 hours)**
- Cosmetic issues
- Documentation errors
- Enhancement requests

### Incident Response Workflow

1. **Acknowledge**
   - Acknowledge alert in monitoring system
   - Post in team channel: "Investigating incident"

2. **Assess**
   - Check health endpoint
   - Review Sentry errors
   - Check logs for patterns
   - Identify affected components

3. **Mitigate**
   - If database issue: Check Convex status page
   - If WAHA issue: Check WAHA API status
   - If deployment issue: Consider rollback
   - If rate limit issue: Adjust limits or scale Redis

4. **Communicate**
   - Update status page
   - Notify affected users (if applicable)
   - Post updates every 30 minutes

5. **Resolve**
   - Deploy fix or rollback
   - Verify resolution
   - Monitor for 30 minutes

6. **Post-Mortem**
   - Document what happened
   - Identify root cause
   - Create action items to prevent recurrence

### Emergency Contacts

```
On-Call Engineer: [Your Contact]
Database (Convex): https://status.convex.dev
WAHA Support: [Support Email]
Vercel Support: support@vercel.com
```

---

## Rollback Procedures

### Quick Rollback (Vercel)

If the latest deployment is causing issues:

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [previous-deployment-url]
```

### Manual Rollback

1. **Identify Last Good Commit**
   ```bash
   git log --oneline -10
   ```

2. **Create Rollback Branch**
   ```bash
   git checkout -b rollback/emergency [good-commit-sha]
   ```

3. **Deploy Rollback**
   ```bash
   npm ci
   npm run build
   vercel --prod
   ```

4. **Verify Rollback**
   - Check health endpoint
   - Test critical paths
   - Monitor error rate

5. **Investigate Issue**
   - Review Sentry errors from failed deployment
   - Check logs for patterns
   - Create fix in separate branch

---

## Common Issues & Solutions

### Issue: Webhook Signature Verification Failing

**Symptoms:**
- 401 errors on webhook endpoint
- Logs show "Invalid webhook signature"

**Solution:**
1. Verify `WAHA_WEBHOOK_SECRET` matches WAHA configuration
2. Check webhook headers in WAHA admin panel
3. Test with sample payload:
   ```bash
   # Generate signature
   echo -n '{"test":"data"}' | openssl dgst -sha256 -hmac "your-secret"
   ```

### Issue: Rate Limit Exceeded

**Symptoms:**
- 429 errors
- Logs show "Rate limit exceeded for IP"

**Solution:**
1. Check if it's legitimate traffic or attack
2. If legitimate: Increase rate limits in `src/lib/ratelimit.ts`
3. If attack: Add IP to blocklist (implement if needed)
4. Consider upgrading Redis tier for distributed rate limiting

### Issue: Slow Response Times

**Symptoms:**
- Health check > 5 seconds
- Logs show "Slow request detected"

**Solution:**
1. Check database query performance in Convex dashboard
2. Review Sentry performance metrics
3. Check WAHA API response times
4. Consider adding caching for frequent queries
5. Review AI model response times

### Issue: Messages Not Being Processed

**Symptoms:**
- Webhooks received but no messages sent
- Inngest functions not running

**Solution:**
1. Check Inngest dashboard for failed functions
2. Verify `INNGEST_EVENT_KEY` is correct
3. Check tenant credit balance
4. Review billing guard logs for credit rejections
5. Verify WAHA API connectivity

### Issue: Database Connection Errors

**Symptoms:**
- "Failed to query database" errors
- Health check shows database down

**Solution:**
1. Check Convex status page: https://status.convex.dev
2. Verify `NEXT_PUBLIC_CONVEX_URL` is correct
3. Check Convex deployment is running
4. Review Convex function logs for errors
5. Verify no schema migrations failed

### Issue: Authentication Failures

**Symptoms:**
- Users can't log in
- "Unauthorized" errors in app

**Solution:**
1. Check Clerk status page
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is correct
3. Verify `CLERK_SECRET_KEY` is correct
4. Check Clerk dashboard for user session errors
5. Verify webhook sync between Clerk and Convex

### Issue: Email Delivery Failures

**Symptoms:**
- Invitation emails not sent
- Resend errors in Sentry

**Solution:**
1. Check Resend dashboard for delivery status
2. Verify `RESEND_API_KEY` is correct
3. Check sending domain DNS configuration
4. Review Resend API rate limits
5. Verify email templates are valid React Email components

---

## Additional Resources

- [Convex Documentation](https://docs.convex.dev)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [WAHA API Documentation](https://waha.devlike.pro/)
- [Sentry Error Tracking](https://docs.sentry.io/)
- [Upstash Redis Documentation](https://docs.upstash.com/)

---

## Maintenance Schedule

### Daily
- Review Sentry error dashboard
- Check health endpoint metrics
- Monitor webhook success rate

### Weekly
- Review slow query logs
- Check credit consumption trends
- Review rate limit patterns
- Update dependencies (patch versions)

### Monthly
- Full security audit
- Dependency updates (minor versions)
- Performance optimization review
- Capacity planning review

### Quarterly
- Disaster recovery drill
- Security penetration testing
- Major dependency upgrades
- Infrastructure cost optimization

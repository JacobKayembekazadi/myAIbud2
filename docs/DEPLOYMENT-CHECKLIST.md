# Production Deployment Checklist

## ✅ Phase 1: Security Hardening (COMPLETED)

All critical security fixes have been implemented and pushed to GitHub:
- ✅ Webhook signature verification
- ✅ API rate limiting
- ✅ Sentry error monitoring setup

**Commit:** `9c3793a` - feat: Add Phase 1 production security hardening

---

## 🚀 Deployment Steps for Vercel

### Step 1: Configure Optional Services (Recommended)

#### 1.1 Upstash Redis (For distributed rate limiting)
```bash
# 1. Create free account at https://console.upstash.com/
# 2. Create Redis database (choose region close to your Vercel deployment)
# 3. Copy REST API credentials
# 4. Add to Vercel environment variables:

UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**Why needed:** Prevents DDoS attacks and API abuse across multiple Vercel edge functions
**Fallback:** Uses in-memory rate limiter (only protects single function instance)

#### 1.2 Sentry (For error monitoring)
```bash
# 1. Create free account at https://sentry.io/signup/
# 2. Create new Next.js project
# 3. Copy DSN from project settings
# 4. Add to Vercel environment variables:

NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

**Why needed:** Real-time error tracking, performance monitoring, session replay for debugging
**Fallback:** Errors only logged to Vercel logs (not searchable, no alerting)

### Step 2: Deploy to Vercel

```bash
# From your local machine:
git push origin master

# Vercel will automatically:
# 1. Detect the push
# 2. Run build
# 3. Deploy to production
```

### Step 3: Verify Deployment

Run these checks after deployment:

#### 3.1 Check Environment Variables
```bash
npx vercel env ls
```

Ensure all critical variables are set:
- ✅ WAHA_API_URL
- ✅ WAHA_API_KEY
- ✅ WAHA_WEBHOOK_SECRET
- ✅ INNGEST_EVENT_KEY
- ✅ INNGEST_SIGNING_KEY
- ✅ CLERK_SECRET_KEY
- ✅ GOOGLE_GENERATIVE_AI_API_KEY
- ✅ RESEND_API_KEY
- ⚠️ NEXT_PUBLIC_SENTRY_DSN (optional but recommended)
- ⚠️ UPSTASH_REDIS_REST_URL (optional but recommended)

#### 3.2 Test Rate Limiting

```bash
# Test webhook rate limiting (should get 429 after 100 requests)
for i in {1..105}; do
  curl -X POST https://www.mychatflow.app/api/webhooks/whatsapp \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    -w "\nStatus: %{http_code}\n"
done
```

Expected result: First 100 succeed (200/401), then 429 "Too many requests"

#### 3.3 Test Webhook Signature Verification

```bash
# Test without signature (should return 401)
curl -X POST https://www.mychatflow.app/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected response: {"error": "Invalid signature"} with status 401
```

#### 3.4 Test Sentry Integration

1. Visit your app: https://www.mychatflow.app
2. Open browser console and run:
   ```javascript
   throw new Error("Test Sentry integration");
   ```
3. Check Sentry dashboard for the error event

### Step 4: Monitor First 24 Hours

#### Check Inngest Dashboard
Visit: https://app.inngest.com/

Look for:
- ✅ Functions registered (messageAgent, campaignSender, sendInviteEmail)
- ✅ Events being received
- ❌ No failed function runs

#### Check Sentry Dashboard (if configured)
Visit: https://sentry.io/organizations/your-org/issues/

Look for:
- ❌ No new errors
- ✅ Performance metrics within normal range
- ✅ Low error rate (<1%)

#### Check Vercel Logs
Visit: https://vercel.com/your-account/my-aibud/logs

Look for:
- ✅ `[Security]` logs showing rate limiting working
- ✅ Successful webhook signature verifications
- ❌ No `[ERROR]` logs

---

## ⚠️ Known Issues & Workarounds

### Issue 1: Webhook signature verification failing
**Symptoms:** All webhooks return 401
**Cause:** WAHA instances created before HMAC configuration don't have webhook signatures
**Fix:**
1. Check WAHA dashboard: http://49.13.153.22:3000/dashboard
2. Recreate instances with webhook HMAC enabled
3. Or temporarily set `NODE_ENV=development` to allow unsigned webhooks (NOT recommended for production)

### Issue 2: Rate limiting too aggressive
**Symptoms:** Legitimate traffic getting 429 errors
**Fix:** Adjust limits in `src/lib/ratelimit.ts`:
```typescript
// Increase from 100 to 300 requests per minute
limiter: Ratelimit.slidingWindow(300, "1 m"),
```

### Issue 3: Sentry quota exceeded
**Symptoms:** Sentry dashboard shows "quota exceeded" warning
**Fix:**
1. Adjust sample rates in sentry configs:
   ```typescript
   tracesSampleRate: 0.01, // Reduce from 0.1 to 1%
   replaysSessionSampleRate: 0.01, // Reduce from 0.1 to 1%
   ```
2. Add more error filters to ignore noise

---

## 📊 Success Metrics

After 7 days, verify:
- [ ] Zero successful webhook spoofing attempts (check logs for 401s)
- [ ] No DDoS incidents (check rate limit 429 responses)
- [ ] <5 production errors captured in Sentry
- [ ] 99%+ API success rate
- [ ] <500ms p95 response time

---

## 🔜 Phase 2: Observability (Next)

Once Phase 1 is stable, implement:
1. Structured logging with Pino/Winston
2. Request/response logging middleware
3. Inngest function monitoring dashboard
4. Uptime monitoring (UptimeRobot/Pingdom)

See [SECURITY-IMPROVEMENTS.md](./SECURITY-IMPROVEMENTS.md) for full roadmap.

---

## 🆘 Emergency Rollback

If critical issues occur:

```bash
# Rollback to previous version
vercel rollback

# Or revert the commit locally and push
git revert 9c3793a
git push origin master
```

---

## 📞 Support

- Vercel Issues: https://vercel.com/support
- Upstash Issues: https://upstash.com/support
- Sentry Issues: https://sentry.io/support
- GitHub Issues: https://github.com/JacobKayembekazadi/myAIbud2/issues

---

**Last Updated:** 2026-01-12
**Status:** ✅ Ready for production deployment

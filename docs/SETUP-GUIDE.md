# Step-by-Step Setup Guide for Production Services

This guide walks you through setting up Upstash Redis and Sentry with exact steps and screenshots.

---

## 🚀 Part 1: Upstash Redis Setup (5 minutes)

### Why You Need This:
- Distributes rate limiting across all Vercel edge functions
- Prevents DDoS attacks at scale
- Free tier: 10,000 commands/day (more than enough)

### Step 1: Create Upstash Account

1. **Go to:** https://console.upstash.com/
2. **Click:** "Sign Up" (top right)
3. **Choose:** Sign up with GitHub (easiest) or email
4. **Complete** the signup process

### Step 2: Create Redis Database

1. **After login**, you'll see the dashboard
2. **Click:** "Create Database" (big green button)
3. **Fill in the form:**
   ```
   Name: myaibud-ratelimit
   Type: Regional (selected by default)
   Region: Choose closest to your Vercel region
          (If Vercel is in US East, choose us-east-1)
   Primary Region: (auto-selected based on your choice)
   Read Region: None (leave empty for free tier)
   Eviction: No Eviction (default)
   TLS: Enabled (default - keep it)
   ```
4. **Click:** "Create" button at bottom

### Step 3: Copy Your Credentials

After database is created, you'll see the database details page:

1. **Scroll down** to "REST API" section (not "Redis" section)
2. **You'll see two fields:**
   ```
   UPSTASH_REDIS_REST_URL
   └─> Looks like: https://us1-merry-firefly-12345.upstash.io

   UPSTASH_REDIS_REST_TOKEN
   └─> Looks like: AXlkAAIncDE... (long string)
   ```
3. **Click the copy icon** next to each field to copy them

### Step 4: Add to Vercel

**Option A: Via Vercel Dashboard (Recommended)**

1. **Go to:** https://vercel.com/your-account/my-aibud/settings/environment-variables
2. **For each variable:**
   - Click "Add New" button
   - Key: `UPSTASH_REDIS_REST_URL`
   - Value: Paste the URL you copied
   - Environment: Check all 3 boxes (Production, Preview, Development)
   - Click "Save"

3. **Repeat for the token:**
   - Key: `UPSTASH_REDIS_REST_TOKEN`
   - Value: Paste the token you copied
   - Environment: Check all 3 boxes
   - Click "Save"

**Option B: Via CLI**

```bash
cd "c:\Users\jacob\Downloads\New folder (6)\myAIbud2\Downloads\whatsapp-assistant"

# Add URL
npx vercel env add UPSTASH_REDIS_REST_URL production
# When prompted, paste your URL and press Enter

# Add Token
npx vercel env add UPSTASH_REDIS_REST_TOKEN production
# When prompted, paste your token and press Enter

# Also add to preview and development
npx vercel env add UPSTASH_REDIS_REST_URL preview
npx vercel env add UPSTASH_REDIS_REST_TOKEN preview
```

### Step 5: Redeploy

```bash
# Trigger a new deployment to pick up the new env vars
npx vercel --prod
```

### ✅ Verification

Test that rate limiting is working:

```bash
# Run this command - should get 429 after 100+ requests
for i in {1..105}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    https://www.mychatflow.app/api/webhooks/whatsapp \
    -X POST -H "Content-Type: application/json" -d '{"test":true}'
done
```

**Expected output:**
```
Request 1: 401 (invalid signature - OK)
Request 2: 401
...
Request 100: 401
Request 101: 429 (Too Many Requests - Rate limit working!)
Request 102: 429
```

---

## 🔍 Part 2: Sentry Setup (10 minutes)

### Why You Need This:
- Real-time error alerts via email/Slack/Discord
- See exactly what users experienced when errors happen
- Performance monitoring (slow API calls)
- Free tier: 5,000 errors/month

### Step 1: Create Sentry Account

1. **Go to:** https://sentry.io/signup/
2. **Choose:** "Sign up with GitHub" (easiest) or email
3. **Complete** signup and verify email if needed

### Step 2: Create Project

After login, you'll see "Create Project" page:

1. **Select platform:** Next.js (scroll down to find it)
2. **Set alert frequency:** "I'll create my own alerts" (we'll configure later)
3. **Project name:** `myaibud-production`
4. **Team:** Your default team (pre-selected)
5. **Click:** "Create Project" button

### Step 3: Skip the Setup Wizard

You'll see a setup wizard with code snippets:

1. **Scroll all the way down**
2. **Click:** "Skip this onboarding" (small link at bottom)
   - Or click "Take me to my error dashboard" if you see that instead

### Step 4: Get Your DSN

1. **Click** the gear icon (⚙️) in the left sidebar (Settings)
2. **Click** "Projects" in the left menu
3. **Click** on your project name (`myaibud-production`)
4. **Click** "Client Keys (DSN)" in the left menu under "SDK SETUP"
5. **You'll see:**
   ```
   DSN: https://abc123def456@o123456.ingest.sentry.io/7891011
   ```
6. **Click the copy icon** to copy the DSN

### Step 5: Add to Vercel

**Option A: Via Vercel Dashboard**

1. **Go to:** https://vercel.com/your-account/my-aibud/settings/environment-variables
2. **Click** "Add New"
3. **Fill in:**
   ```
   Key: NEXT_PUBLIC_SENTRY_DSN
   Value: (paste your DSN from step 4)
   Environment: ✅ Production, ✅ Preview, ✅ Development
   ```
4. **Click** "Save"

**Option B: Via CLI**

```bash
cd "c:\Users\jacob\Downloads\New folder (6)\myAIbud2\Downloads\whatsapp-assistant"

npx vercel env add NEXT_PUBLIC_SENTRY_DSN production
# Paste your DSN when prompted

npx vercel env add NEXT_PUBLIC_SENTRY_DSN preview
# Paste again

npx vercel env add NEXT_PUBLIC_SENTRY_DSN development
# Paste again
```

### Step 6: Redeploy

```bash
npx vercel --prod
```

### Step 7: Configure Alerts (Optional but Recommended)

1. **Go back to Sentry dashboard**
2. **Click** "Alerts" in the left sidebar
3. **Click** "Create Alert Rule"
4. **Choose:** "Issues"
5. **Configure:**
   ```
   When: An event is seen
   If: All events
   Then: Send a notification to: (your email)
   Action Interval: 30 minutes (don't spam yourself)
   ```
6. **Name it:** "Production Errors"
7. **Click** "Save Rule"

### ✅ Verification

Test that Sentry is capturing errors:

**Method 1: Via Browser**
1. Open your app: https://www.mychatflow.app
2. Open browser console (F12)
3. Run this:
   ```javascript
   throw new Error("Test Sentry integration from browser");
   ```
4. Wait 10 seconds
5. Go to Sentry dashboard - you should see the error!

**Method 2: Trigger a Real Error**
1. Visit: https://www.mychatflow.app/api/webhooks/whatsapp
2. Send invalid data
3. Check Sentry dashboard for the error

**Method 3: Check Sentry Dashboard**
1. Go to: https://sentry.io/organizations/your-org/issues/
2. You should see test errors appear within 30 seconds

---

## 📊 Part 3: Verify Everything is Working

### Checklist

Run through this checklist after setup:

```bash
# 1. Check Vercel environment variables
npx vercel env ls

# Should show:
# ✅ UPSTASH_REDIS_REST_URL (Production, Preview, Development)
# ✅ UPSTASH_REDIS_REST_TOKEN (Production, Preview, Development)
# ✅ NEXT_PUBLIC_SENTRY_DSN (Production, Preview, Development)
```

### Test Rate Limiting (Upstash)

```bash
# Send 10 requests quickly
for i in {1..10}; do
  echo "Request $i:"
  curl -X POST https://www.mychatflow.app/api/webhooks/whatsapp \
    -H "Content-Type: application/json" \
    -d '{"test": true}' \
    -w "\nStatus: %{http_code}\n\n"
  sleep 0.5
done
```

**Expected:** Status 401 (invalid signature) but NO 500 errors

### Test Sentry Error Tracking

1. **Go to:** Your app in browser
2. **Open console** (F12)
3. **Run:**
   ```javascript
   fetch('/api/test-error', { method: 'POST' })
   ```
4. **Check Sentry dashboard** - error should appear in 30 seconds

### Monitor for 24 Hours

**Upstash Dashboard:**
- Visit: https://console.upstash.com/
- Click on your database
- Check "Metrics" tab
- Should see commands being executed

**Sentry Dashboard:**
- Visit: https://sentry.io/organizations/your-org/issues/
- Should see errors (if any)
- Check "Performance" tab for slow requests

---

## 🆘 Troubleshooting

### Problem: "Rate limiting not working (no 429 errors)"

**Solution 1:** Check environment variables
```bash
npx vercel env ls | grep UPSTASH
```

**Solution 2:** Check Vercel logs for errors
```bash
npx vercel logs --follow
# Look for "[Security] Rate limit" messages
```

**Solution 3:** Verify Upstash database is active
- Go to: https://console.upstash.com/
- Check database status (should be green)

### Problem: "Sentry not capturing errors"

**Solution 1:** Verify DSN is set
```bash
npx vercel env ls | grep SENTRY
```

**Solution 2:** Check Sentry project settings
- Go to: https://sentry.io/settings/your-org/projects/myaibud-production/
- Verify "Project Status" is "Active"

**Solution 3:** Force an error
```javascript
// In browser console
import('@sentry/nextjs').then(Sentry => {
  Sentry.captureException(new Error('Manual test error'));
});
```

### Problem: "Vercel deployment not picking up new env vars"

**Solution:** Force redeploy
```bash
cd "c:\Users\jacob\Downloads\New folder (6)\myAIbud2\Downloads\whatsapp-assistant"
git commit --allow-empty -m "Force redeploy for env vars"
git push
```

---

## 💰 Pricing (What You Get for Free)

### Upstash Redis Free Tier
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- ✅ TLS encryption
- ✅ Unlimited databases
- **Cost:** $0/month forever
- **Upgrade needed when:** >10K requests/day (~7 requests/min average)

### Sentry Free Tier
- ✅ 5,000 errors/month
- ✅ 10,000 performance units/month
- ✅ 1 team member
- ✅ 30-day event history
- ✅ Email alerts
- **Cost:** $0/month forever
- **Upgrade needed when:** >5K errors/month (you have bigger problems if this happens!)

---

## ✨ Quick Setup Script (Copy-Paste Ready)

If you want to speed through this, here's a script:

```bash
# 1. Open these URLs in browser:
echo "Open these in browser:"
echo "1. https://console.upstash.com/ (create Redis DB)"
echo "2. https://sentry.io/signup/ (create project)"
echo ""
echo "Press Enter after you've copied your credentials..."
read

# 2. Add to Vercel (will prompt for values)
cd "c:\Users\jacob\Downloads\New folder (6)\myAIbud2\Downloads\whatsapp-assistant"

echo "Paste UPSTASH_REDIS_REST_URL:"
npx vercel env add UPSTASH_REDIS_REST_URL production

echo "Paste UPSTASH_REDIS_REST_TOKEN:"
npx vercel env add UPSTASH_REDIS_REST_TOKEN production

echo "Paste NEXT_PUBLIC_SENTRY_DSN:"
npx vercel env add NEXT_PUBLIC_SENTRY_DSN production

# 3. Deploy
npx vercel --prod

echo "✅ Setup complete! Check deployment at https://www.mychatflow.app"
```

---

## 📞 Support Links

- **Upstash Issues:** https://github.com/upstash/issues/issues
- **Sentry Issues:** https://github.com/getsentry/sentry/issues
- **Vercel Issues:** https://github.com/vercel/vercel/issues
- **Need Help?** Create issue at: https://github.com/JacobKayembekazadi/myAIbud2/issues

---

**Last Updated:** 2026-01-12
**Estimated Time:** 15 minutes total
**Difficulty:** Easy (copy-paste credentials)

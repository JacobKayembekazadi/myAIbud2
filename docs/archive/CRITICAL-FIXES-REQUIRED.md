# CRITICAL FIXES REQUIRED FOR PRODUCTION

**Status:** 🔴 BLOCKING - AI responses not working
**Estimated Fix Time:** 10-15 minutes
**Impact:** Once fixed, entire system should work end-to-end

---

## Issue #1: WAHA_API_URL Points to Wrong Server (CRITICAL)

### Current State
- **Vercel Production:** `https://waha-production-907c.up.railway.app` ❌
- **Should Be:** `http://49.13.153.22:3000` ✅

### Why This Breaks Everything
- WhatsApp instances can't be created (wrong server)
- QR codes fail to generate
- AI responses can't be sent (WAHA not reachable)
- Webhooks might work but responses fail

### Fix Instructions

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to: https://vercel.com/your-team/my-aibud/settings/environment-variables
2. Find `WAHA_API_URL`
3. Click "Edit"
4. Change value to: `http://49.13.153.22:3000`
5. Click "Save"
6. Redeploy (Vercel → Deployments → Click "..." → Redeploy)

**Option B: Via Vercel CLI**
```bash
vercel env rm WAHA_API_URL production
vercel env add WAHA_API_URL production
# When prompted, enter: http://49.13.153.22:3000
vercel --prod
```

---

## Issue #2: INNGEST_EVENT_KEY Mismatch (CRITICAL)

### Current State
- **Local (.env.local):** `XlOyj6feaT-eZEKklEwunJnp6GaL1fnYbcwnIiYMmyfwE5hXQZXGvHVbEMeengYIzQVcM7PbXczl5FNJQYHXMA`
- **Vercel Production:** `7E5sTMhOWGFz9_97J0AkVYyfocTmW2txQShEKRSNRPJ4IM668SNjfQ_e0kJJVeJQYX-61RKld6CF1uFtWxPM0A`

### Why This Breaks AI Responses
1. Webhook receives message ✅
2. Webhook sends event to Inngest with local key
3. Inngest rejects event (wrong key) ❌
4. AI agent never triggers ❌
5. No response sent ❌

### How to Determine Correct Key

**Step 1: Check Inngest Dashboard**
1. Go to: https://app.inngest.com
2. Login to your account
3. Navigate to: Settings → Event Keys
4. Look for app named "my-aibud"
5. Note the event key shown

**Step 2: Update Based on Which Key is Correct**

**If the LOCAL key is correct (XlOyj6...):**
```bash
# Update Vercel to match local
vercel env rm INNGEST_EVENT_KEY production
vercel env add INNGEST_EVENT_KEY production
# Enter: XlOyj6feaT-eZEKklEwunJnp6GaL1fnYbcwnIiYMmyfwE5hXQZXGvHVbEMeengYIzQVcM7PbXczl5FNJQYHXMA
vercel --prod
```

**If the VERCEL key is correct (7E5sT...):**
```bash
# Update local to match Vercel (in this directory)
# Edit .env.local and change line 27 to:
INNGEST_EVENT_KEY=7E5sTMhOWGFz9_97J0AkVYyfocTmW2txQShEKRSNRPJ4IM668SNjfQ_e0kJJVeJQYX-61RKld6CF1uFtWxPM0A
```

### Verify Inngest App Registration

After fixing the key, verify your app is registered:

1. Go to: https://www.mychatflow.app/api/inngest
2. You should see: Inngest Dev Server UI or function list
3. If you see "App not found" or 404:
   - Go to Inngest Dashboard → Apps
   - Click "Add App"
   - Enter URL: `https://www.mychatflow.app/api/inngest`
   - Click "Sync"

---

## Issue #3: Webhook Signature Verification Disabled (MEDIUM)

### Current State
```typescript
// src/lib/whatsapp/waha.ts:253-256
verifyWebhook(body: string, signature: string): boolean {
    // TEMPORARY: Skip verification while debugging webhook 401 errors
    console.log("Webhook received, signature header:", signature ? "present" : "missing");
    return true; // ALWAYS RETURNS TRUE - SECURITY RISK
```

### Why This is Disabled
Was temporarily disabled to debug 401 errors. Now that other issues are fixed, this should be re-enabled.

### How to Re-enable (After fixing above issues)

**Step 1: Verify WAHA has correct HMAC secret**
```bash
# Check WAHA instance configuration
curl -H "X-Api-Key: myaibud-waha-key-2025" \
  http://49.13.153.22:3000/api/session-new-new-1768058272894

# Look for webhook configuration with secret: my-aibud-waha-webhook-secret
```

**Step 2: Uncomment verification code**

Edit `src/lib/whatsapp/waha.ts` and replace lines 253-256 with:
```typescript
verifyWebhook(body: string, signature: string): boolean {
    if (!WAHA_WEBHOOK_SECRET) {
      console.warn("WAHA_WEBHOOK_SECRET not configured, skipping verification");
      return true;
    }

    if (!signature) {
      console.error("No webhook signature provided");
      return false;
    }

    const expectedSignature = crypto
      .createHmac("sha256", WAHA_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error("Invalid webhook signature", {
        received: signature.substring(0, 10) + "...",
        expected: expectedSignature.substring(0, 10) + "..."
      });
    }

    return isValid;
  },
```

**Step 3: Test & Deploy**
```bash
git add src/lib/whatsapp/waha.ts
git commit -m "Re-enable webhook signature verification"
git push
```

---

## Verification Checklist

After applying fixes, verify in this order:

### 1. Environment Variables ✓
```bash
# Verify production env vars are correct
vercel env ls production

# Should show:
# WAHA_API_URL = http://49.13.153.22:3000
# INNGEST_EVENT_KEY = [matching Inngest dashboard]
```

### 2. WAHA Connection ✓
```bash
# Test WAHA is reachable from production
curl http://49.13.153.22:3000/api/sessions
# Should return list of sessions (not 404 or timeout)
```

### 3. Inngest Registration ✓
- Visit: https://www.mychatflow.app/api/inngest
- Should see: Function list or Inngest UI (not 404)

### 4. End-to-End Test ✓
1. Login to https://www.mychatflow.app
2. Go to Instances
3. Create new instance or use existing
4. Send test WhatsApp message to connected number
5. Check Vercel logs: `vercel logs --follow`
6. Should see:
   - ✅ Webhook received
   - ✅ Contact upserted
   - ✅ Inngest event sent
   - ✅ AI response generated
   - ✅ Message sent via WAHA

### 5. Inngest Dashboard ✓
- Go to: https://app.inngest.com
- Navigate to: Events
- Should see: `message.upsert` events
- Click on event → should show function run with status "Completed"

---

## Quick Fix Script

Run this to update Vercel env vars (requires Vercel CLI):

```bash
#!/bin/bash

echo "🔧 Fixing WAHA_API_URL..."
vercel env rm WAHA_API_URL production --yes 2>/dev/null
echo "http://49.13.153.22:3000" | vercel env add WAHA_API_URL production

echo "✅ WAHA_API_URL updated"
echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "   1. Check Inngest dashboard for correct event key"
echo "   2. Update either local or production to match"
echo ""
echo "🚀 Redeploying..."
vercel --prod

echo ""
echo "✅ Fixes deployed!"
echo "   Visit: https://www.mychatflow.app/api/inngest"
echo "   Then test by sending a WhatsApp message"
```

---

## Expected Timeline

- **Fix #1 (WAHA URL):** 2 minutes
- **Fix #2 (Inngest Key):** 5 minutes (includes verification)
- **Fix #3 (Webhook Sig):** 5 minutes (optional, can do later)
- **Verification:** 5 minutes

**Total:** ~15-20 minutes to fully working system

---

## Support

If issues persist after these fixes:

1. **Check Vercel Logs:**
   ```bash
   vercel logs --follow
   ```

2. **Check Inngest Dashboard:**
   - https://app.inngest.com → Events
   - Look for failed events or function errors

3. **Check WAHA Logs:**
   ```bash
   ssh to Hetzner VPS
   docker logs [waha-container-name]
   ```

4. **Verify Webhooks Arriving:**
   - Vercel logs should show: "📨 Webhook payload received"
   - If not, check WAHA webhook configuration

---

## Current Priority

🔴 **Fix #1 (WAHA_API_URL)** - Do this IMMEDIATELY
🔴 **Fix #2 (Inngest Key)** - Do this IMMEDIATELY
🟡 **Fix #3 (Webhook Sig)** - Can wait until basic flow works

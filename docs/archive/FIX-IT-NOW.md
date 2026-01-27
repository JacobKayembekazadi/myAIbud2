# FIX IT NOW - Step-by-Step Guide

**Time to fix:** 10 minutes
**Impact:** AI responses will work after this

---

## STEP 1: Fix WAHA_API_URL in Vercel (MOST CRITICAL)

### Go to Vercel Dashboard
1. Open: https://vercel.com
2. Login
3. Select project: **my-aibud**
4. Click: **Settings** tab
5. Click: **Environment Variables** in left sidebar

### Update WAHA_API_URL
1. Find row: `WAHA_API_URL`
2. Current value shows: `https://waha-production-907c.up.railway.app`
3. Click the **•••** (three dots) on the right
4. Click **Edit**
5. Change value to: `http://49.13.153.22:3000`
6. Click **Save**

---

## STEP 2: Verify INNGEST_EVENT_KEY

### Check Inngest Dashboard
1. Open: https://app.inngest.com
2. Login with your credentials
3. Look at top-left corner - note the app name (should be "my-aibud")
4. Click on **Settings** → **Event Keys** (left sidebar)
5. You should see an event key starting with either:
   - `XlOyj6...` (matches local)
   - `7E5sT...` (matches Vercel)

### Determine Which is Correct

**If you see `XlOyj6...` in Inngest Dashboard:**
- ✅ Local is correct
- ❌ Vercel is wrong
- Action: Update Vercel to match local

**If you see `7E5sT...` in Inngest Dashboard:**
- ✅ Vercel is correct
- ❌ Local is wrong
- Action: Update local .env.local to match Vercel

### Update Vercel (if needed)

If Inngest shows `XlOyj6...`:

1. In Vercel Environment Variables (same page as Step 1)
2. Find: `INNGEST_EVENT_KEY`
3. Click **•••** → **Edit**
4. Change to: `XlOyj6feaT-eZEKklEwunJnp6GaL1fnYbcwnIiYMmyfwE5hXQZXGvHVbEMeengYIzQVcM7PbXczl5FNJQYHXMA`
5. Click **Save**

### Update Local (if needed)

If Inngest shows `7E5sT...`:

1. Open: `.env.local` in this project
2. Find line 27: `INNGEST_EVENT_KEY=...`
3. Change to: `INNGEST_EVENT_KEY=7E5sTMhOWGFz9_97J0AkVYyfocTmW2txQShEKRSNRPJ4IM668SNjfQ_e0kJJVeJQYX-61RKld6CF1uFtWxPM0A`
4. Save file

---

## STEP 3: Register App in Inngest (if needed)

### Check if Already Registered
1. Visit: https://www.mychatflow.app/api/inngest
2. If you see "Inngest Dev Server" or function list → ✅ Already registered, skip this step
3. If you see 404 or error → ❌ Need to register

### Register the App
1. Go to Inngest Dashboard: https://app.inngest.com
2. Click **Apps** in left sidebar
3. Click **Sync New App** (or "+ New App")
4. Enter App URL: `https://www.mychatflow.app/api/inngest`
5. Click **Sync App** or **Create**
6. Wait for sync to complete
7. Verify functions appear: `message.agent`, `campaign.sender`

---

## STEP 4: Redeploy

### Trigger Vercel Redeploy
1. Go back to Vercel project page
2. Click **Deployments** tab
3. Find the latest deployment
4. Click **•••** (three dots) on the right
5. Click **Redeploy**
6. Select **Use existing Build Cache** (faster)
7. Click **Redeploy**
8. Wait ~2-3 minutes for deployment to complete

### Watch the Deploy
- You'll see: "Building..." → "Deploying..." → "Ready"
- When it shows ✓ Ready, the fixes are live!

---

## STEP 5: Verify Everything Works

### Run Verification Script (Windows)
```powershell
cd Downloads\whatsapp-assistant
powershell -ExecutionPolicy Bypass -File .\scripts\verify-production.ps1
```

### Or Manually Test:

**Test 1: WAHA is Reachable**
```bash
curl -H "X-Api-Key: myaibud-waha-key-2025" http://49.13.153.22:3000/api/sessions
```
Expected: JSON response with sessions

**Test 2: Inngest Endpoint Works**
Visit: https://www.mychatflow.app/api/inngest
Expected: Inngest UI or function list

**Test 3: Send Real WhatsApp Message**
1. Go to: https://www.mychatflow.app
2. Login
3. Navigate to **Instances**
4. If no instance or status is "disconnected":
   - Click **Create Instance**
   - Scan QR code with WhatsApp
   - Wait for "Connected" status
5. Send a test message to your WhatsApp number
6. **WAIT 10-15 SECONDS**
7. You should receive an AI response!

---

## STEP 6: Check Logs if Something Fails

### Vercel Logs (Real-time)
```bash
vercel logs --follow
# Or visit: https://vercel.com/your-team/my-aibud/logs
```

### Look for:
- ✅ `📨 Webhook payload received`
- ✅ `👤 Upserting contact...`
- ✅ `🚀 Triggering Inngest event...`
- ✅ `✅ Inngest event sent successfully`

### Inngest Dashboard
1. Go to: https://app.inngest.com
2. Click **Events** in left sidebar
3. Look for recent `message.upsert` events
4. Click on an event to see:
   - Event data
   - Function runs
   - Any errors

### Common Issues After Fix:

**Issue: Still no AI response**
- Check Inngest dashboard for events → If no events, webhook isn't working
- Check Vercel logs for errors
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set in Vercel

**Issue: "Contact not found" or "Instance not found"**
- Make sure you're sending to the correct WhatsApp number
- Verify instance status is "connected"

**Issue: Webhook 401 errors**
- Signature verification might be rejecting valid webhooks
- Temporarily OK (verification is disabled)
- Will fix later

---

## What You Just Fixed

### Before:
```
WhatsApp message → WAHA → Webhook → Convex ✓
                                    ↓
                         Inngest event sent ✗ (wrong URL)
                                    ↓
                         AI agent never runs ✗
                                    ↓
                         No response sent ✗
```

### After:
```
WhatsApp message → WAHA → Webhook → Convex ✓
                                    ↓
                         Inngest event sent ✓ (correct URL)
                                    ↓
                         AI agent runs ✓
                                    ↓
                         Response sent ✓
```

---

## Success Criteria

You'll know it's working when:

1. ✓ Send WhatsApp message
2. ✓ Within 10-15 seconds, receive AI response
3. ✓ Inngest dashboard shows successful event
4. ✓ Vercel logs show no errors
5. ✓ Contact appears in app with "Active" status

---

## Still Broken?

If you've done all the above and it still doesn't work:

1. **Screenshot the following and share:**
   - Vercel environment variables page (WAHA_API_URL and INNGEST_EVENT_KEY rows)
   - Inngest dashboard Events page
   - Vercel logs showing webhook received

2. **Run this and share output:**
   ```powershell
   .\scripts\verify-production.ps1
   ```

3. **Check these specific things:**
   - Is your Hetzner VPS running? (ping 49.13.153.22)
   - Is WAHA running on the VPS? (check Docker containers)
   - Is Inngest app ID "my-aibud" or something else?

---

## Next Steps After It Works

Once basic AI responses work:

1. **Re-enable webhook signature verification** (See CRITICAL-FIXES-REQUIRED.md #3)
2. **Test campaigns feature**
3. **Test contact management**
4. **Invite real users for testing**
5. **Monitor Inngest credits** (free tier has limits)
6. **Set up error alerts**

---

**Ready? Start with STEP 1 now! ⬆️**

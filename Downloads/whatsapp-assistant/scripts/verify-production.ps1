# Production Verification Script (PowerShell)
# Run this after applying critical fixes to verify everything works

Write-Host "🔍 MyChatFlow Production Verification" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ErrorCount = 0
$WarningCount = 0

# Test 1: WAHA API Reachability
Write-Host "1️⃣  Testing WAHA API Connection..."
try {
    $response = Invoke-WebRequest -Uri "http://49.13.153.22:3000/api/sessions" `
        -Headers @{"X-Api-Key"="myaibud-waha-key-2025"} `
        -TimeoutSec 10 `
        -UseBasicParsing
    Write-Host "   ✓ WAHA API is reachable" -ForegroundColor Green
} catch {
    Write-Host "   ✗ WAHA API is NOT reachable" -ForegroundColor Red
    Write-Host "      Check VPS is running and port 3000 is open" -ForegroundColor Yellow
    $ErrorCount++
}
Write-Host ""

# Test 2: Production App is Live
Write-Host "2️⃣  Testing Production App..."
try {
    $response = Invoke-WebRequest -Uri "https://www.mychatflow.app" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ✓ App is live at https://www.mychatflow.app" -ForegroundColor Green
} catch {
    Write-Host "   ✗ App is not reachable" -ForegroundColor Red
    $ErrorCount++
}
Write-Host ""

# Test 3: Inngest Endpoint
Write-Host "3️⃣  Testing Inngest Endpoint..."
try {
    $response = Invoke-WebRequest -Uri "https://www.mychatflow.app/api/inngest" -UseBasicParsing -TimeoutSec 10
    $statusCode = $response.StatusCode
    if ($statusCode -eq 200 -or $statusCode -eq 405) {
        Write-Host "   ✓ Inngest endpoint exists (HTTP $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Inngest endpoint returned HTTP $statusCode" -ForegroundColor Yellow
        $WarningCount++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 405) {
        Write-Host "   ✓ Inngest endpoint exists (HTTP 405 - Method Not Allowed)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Inngest endpoint error (HTTP $statusCode)" -ForegroundColor Red
        $ErrorCount++
    }
}
Write-Host ""

# Test 4: Webhook Endpoint
Write-Host "4️⃣  Testing Webhook Endpoint..."
try {
    $response = Invoke-WebRequest -Uri "https://www.mychatflow.app/api/webhooks/whatsapp" -UseBasicParsing -TimeoutSec 10
    Write-Host "   ⚠ Unexpected 200 response" -ForegroundColor Yellow
    $WarningCount++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 405 -or $statusCode -eq 401) {
        Write-Host "   ✓ Webhook endpoint exists (HTTP $statusCode)" -ForegroundColor Green
        Write-Host "      Note: 405/401 is expected for GET requests" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠ Webhook endpoint returned HTTP $statusCode" -ForegroundColor Yellow
        $WarningCount++
    }
}
Write-Host ""

# Test 5: Check Environment Variables
Write-Host "5️⃣  Checking Local Environment Variables..."
if (Test-Path ".env.local") {
    $wahaUrl = Get-Content ".env.local" | Select-String "^WAHA_API_URL=" | ForEach-Object { $_ -replace "WAHA_API_URL=", "" }
    $inngestKey = Get-Content ".env.local" | Select-String "^INNGEST_EVENT_KEY=" | ForEach-Object { ($_ -replace "INNGEST_EVENT_KEY=", "").Substring(0,20) + "..." }

    if ($wahaUrl -eq "http://49.13.153.22:3000") {
        Write-Host "   ✓ Local WAHA_API_URL is correct" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Local WAHA_API_URL: $wahaUrl" -ForegroundColor Yellow
    }

    Write-Host "   Local INNGEST_EVENT_KEY: $inngestKey" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   ⚠ Remember to verify Vercel production env vars match!" -ForegroundColor Yellow
    $WarningCount++
} else {
    Write-Host "   ⚠ .env.local not found" -ForegroundColor Yellow
    $WarningCount++
}
Write-Host ""

# Test 6: WAHA Instance Status
Write-Host "6️⃣  Checking WAHA Instance Status..."
$instanceId = "session-new-new-1768058272894"
try {
    $response = Invoke-RestMethod -Uri "http://49.13.153.22:3000/api/sessions/$instanceId" `
        -Headers @{"X-Api-Key"="myaibud-waha-key-2025"} `
        -TimeoutSec 10

    if ($response.status -eq "WORKING") {
        Write-Host "   ✓ Instance $instanceId is WORKING" -ForegroundColor Green
    } elseif ($response.status -eq "STOPPED") {
        Write-Host "   ⚠ Instance is STOPPED (needs to be started)" -ForegroundColor Yellow
        $WarningCount++
    } else {
        Write-Host "   ⚠ Instance status: $($response.status)" -ForegroundColor Yellow
        $WarningCount++
    }
} catch {
    Write-Host "   ⚠ Could not check instance status" -ForegroundColor Yellow
    Write-Host "      You may need to create a new instance" -ForegroundColor Gray
    $WarningCount++
}
Write-Host ""

# Summary
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Your system should be working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Verify Vercel environment variables are correct"
    Write-Host "  2. Login to https://www.mychatflow.app"
    Write-Host "  3. Send a test WhatsApp message"
    Write-Host "  4. Check if AI responds"
    Write-Host ""
} elseif ($ErrorCount -eq 0) {
    Write-Host "⚠ All critical checks passed with $WarningCount warning(s)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "System might work, but review warnings above."
    Write-Host ""
} else {
    Write-Host "✗ Found $ErrorCount error(s) and $WarningCount warning(s)" -ForegroundColor Red
    Write-Host ""
    Write-Host "❌ System will NOT work until errors are fixed." -ForegroundColor Red
    Write-Host ""
    Write-Host "See CRITICAL-FIXES-REQUIRED.md for fix instructions." -ForegroundColor Yellow
    Write-Host ""
}

if ($ErrorCount -gt 0) {
    exit 1
}

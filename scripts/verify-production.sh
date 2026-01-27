#!/bin/bash

# Production Verification Script
# Run this after applying critical fixes to verify everything works

set -e

echo "🔍 MyChatFlow Production Verification"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Test 1: WAHA API Reachability
echo "1️⃣  Testing WAHA API Connection..."
if curl -s -H "X-Api-Key: myaibud-waha-key-2025" http://49.13.153.22:3000/api/sessions > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} WAHA API is reachable"
else
    echo -e "   ${RED}✗${NC} WAHA API is NOT reachable"
    echo "      Check VPS is running and port 3000 is open"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 2: Production App is Live
echo "2️⃣  Testing Production App..."
if curl -s https://www.mychatflow.app > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} App is live at https://www.mychatflow.app"
else
    echo -e "   ${RED}✗${NC} App is not reachable"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 3: Inngest Endpoint
echo "3️⃣  Testing Inngest Endpoint..."
INNGEST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://www.mychatflow.app/api/inngest)
if [ "$INNGEST_RESPONSE" = "200" ] || [ "$INNGEST_RESPONSE" = "405" ]; then
    echo -e "   ${GREEN}✓${NC} Inngest endpoint exists (HTTP $INNGEST_RESPONSE)"
else
    echo -e "   ${RED}✗${NC} Inngest endpoint returned HTTP $INNGEST_RESPONSE"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Test 4: Webhook Endpoint
echo "4️⃣  Testing Webhook Endpoint..."
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://www.mychatflow.app/api/webhooks/whatsapp)
if [ "$WEBHOOK_RESPONSE" = "405" ] || [ "$WEBHOOK_RESPONSE" = "401" ]; then
    echo -e "   ${GREEN}✓${NC} Webhook endpoint exists (HTTP $WEBHOOK_RESPONSE)"
    echo "      Note: 405/401 is expected for GET requests"
else
    echo -e "   ${YELLOW}⚠${NC} Webhook endpoint returned HTTP $WEBHOOK_RESPONSE"
    echo "      Expected 405 (Method Not Allowed) for GET request"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 5: Check Vercel Environment Variables
echo "5️⃣  Checking Vercel Environment Variables..."
echo "   (This requires Vercel CLI: vercel env ls)"
if command -v vercel &> /dev/null; then
    echo ""
    echo "   Production Environment Variables:"
    vercel env ls production 2>/dev/null | grep -E "(WAHA_API_URL|INNGEST_EVENT_KEY|GOOGLE_GENERATIVE_AI_API_KEY)" || true
    echo ""

    # Check WAHA_API_URL value
    WAHA_URL=$(vercel env pull .env.verify 2>/dev/null && grep WAHA_API_URL .env.verify | cut -d '=' -f2 | tr -d '"' || echo "")
    if [ "$WAHA_URL" = "http://49.13.153.22:3000" ]; then
        echo -e "   ${GREEN}✓${NC} WAHA_API_URL is correct"
    elif [ -n "$WAHA_URL" ]; then
        echo -e "   ${RED}✗${NC} WAHA_API_URL is wrong: $WAHA_URL"
        echo "      Should be: http://49.13.153.22:3000"
        ERRORS=$((ERRORS + 1))
    else
        echo -e "   ${YELLOW}⚠${NC} Could not verify WAHA_API_URL"
        WARNINGS=$((WARNINGS + 1))
    fi

    rm -f .env.verify 2>/dev/null
else
    echo -e "   ${YELLOW}⚠${NC} Vercel CLI not installed, skipping env check"
    echo "      Install with: npm i -g vercel"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 6: WAHA Instance Status
echo "6️⃣  Checking WAHA Instance Status..."
INSTANCE_ID="session-new-new-1768058272894"
INSTANCE_STATUS=$(curl -s -H "X-Api-Key: myaibud-waha-key-2025" \
  "http://49.13.153.22:3000/api/sessions/$INSTANCE_ID" 2>/dev/null | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "UNKNOWN")

if [ "$INSTANCE_STATUS" = "WORKING" ]; then
    echo -e "   ${GREEN}✓${NC} Instance $INSTANCE_ID is WORKING"
elif [ "$INSTANCE_STATUS" = "STOPPED" ]; then
    echo -e "   ${YELLOW}⚠${NC} Instance is STOPPED (needs to be started)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "   ${YELLOW}⚠${NC} Instance status: $INSTANCE_STATUS"
    echo "      You may need to create a new instance"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "======================================"
echo "📊 Verification Summary"
echo "======================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "🎉 Your system should be working!"
    echo ""
    echo "Next steps:"
    echo "  1. Login to https://www.mychatflow.app"
    echo "  2. Send a test WhatsApp message"
    echo "  3. Check if AI responds"
    echo ""
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ All critical checks passed with $WARNINGS warning(s)${NC}"
    echo ""
    echo "System should work, but review warnings above."
else
    echo -e "${RED}✗ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
    echo ""
    echo "❌ System will NOT work until errors are fixed."
    echo ""
    echo "See CRITICAL-FIXES-REQUIRED.md for fix instructions."
fi

exit $ERRORS

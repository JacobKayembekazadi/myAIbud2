import { serve } from "inngest/next";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { messageAgent } from "@/inngest/agent";
import { campaignSender } from "@/inngest/functions/campaign-sender";
import { sendInviteEmail } from "@/inngest/functions/send-invite-email";
import { billingGuard, billingMonitor, creditExhaustedHandler } from "@/inngest/functions/billing-guard";
import { visionEstimator } from "@/inngest/functions/vision-estimator";
import { inngestRateLimiter, getRateLimitIdentifier } from "@/lib/ratelimit";
import { logSecurity } from "@/lib/logger";

// Create base handlers from Inngest
const baseHandlers = serve({
    client: inngest,
    functions: [
        messageAgent,
        campaignSender,
        sendInviteEmail,
        billingGuard,
        billingMonitor,
        creditExhaustedHandler,
        visionEstimator,
    ],
});

// Wrap handlers with rate limiting middleware
async function withRateLimit(
  handler: (...args: any[]) => Promise<Response>,
  request: NextRequest,
  context?: any
): Promise<Response> {
  // Apply rate limiting
  const identifier = getRateLimitIdentifier(request);
  const { success, limit, remaining, reset } = await inngestRateLimiter.limit(identifier);

  if (!success) {
    logSecurity("rate_limit", { ip: identifier, endpoint: "/api/inngest" });
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(reset).toISOString(),
        },
      }
    );
  }

  return handler(request, context);
}

// Export rate-limited handlers
export const GET = (req: NextRequest, ctx: any) => withRateLimit(baseHandlers.GET, req, ctx);
export const POST = (req: NextRequest, ctx: any) => withRateLimit(baseHandlers.POST, req, ctx);
export const PUT = (req: NextRequest, ctx: any) => withRateLimit(baseHandlers.PUT, req, ctx);

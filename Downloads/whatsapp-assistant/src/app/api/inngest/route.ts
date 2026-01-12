import { serve } from "inngest/next";
import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { messageAgent } from "@/inngest/agent";
import { campaignSender } from "@/inngest/functions/campaign-sender";
import { sendInviteEmail } from "@/inngest/functions/send-invite-email";
import { inngestRateLimiter, getRateLimitIdentifier } from "@/lib/ratelimit";

// Create base handlers from Inngest
const baseHandlers = serve({
    client: inngest,
    functions: [messageAgent, campaignSender, sendInviteEmail],
});

// Wrap handlers with rate limiting middleware
async function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  request: NextRequest
): Promise<Response> {
  // Apply rate limiting
  const identifier = getRateLimitIdentifier(request);
  const { success, limit, remaining, reset } = await inngestRateLimiter.limit(identifier);

  if (!success) {
    console.warn(`[Security] Rate limit exceeded for Inngest endpoint: ${identifier}`);
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

  return handler(request);
}

// Export rate-limited handlers
export const GET = (req: NextRequest) => withRateLimit(baseHandlers.GET, req);
export const POST = (req: NextRequest) => withRateLimit(baseHandlers.POST, req);
export const PUT = (req: NextRequest) => withRateLimit(baseHandlers.PUT, req);

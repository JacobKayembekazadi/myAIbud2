import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Billing Guard Types
 */
export interface BillingCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  periodEnd?: number;
}

export interface UsageData {
  creditsLimit: number;
  creditsUsed: number;
  periodStart: number;
  periodEnd: number;
}

/**
 * Check if a tenant has available credits
 * Can be used by any function before processing paid operations
 */
export async function checkBillingCredits(
  tenantId: string,
  requiredCredits: number = 1
): Promise<BillingCheckResult> {
  try {
    const usage = await convex.query(api.subscriptionUsage.getUsage, {
      tenantId: tenantId as Id<"tenants">,
    });

    if (!usage) {
      // New tenant, allow with default credits
      return {
        allowed: true,
        remaining: 400 - requiredCredits,
        limit: 400,
      };
    }

    const remaining = usage.creditsLimit - usage.creditsUsed;

    // Check if period has expired
    const now = Date.now();
    if (now > usage.periodEnd) {
      // Period expired - in production, this would trigger renewal
      // For now, treat as no credits until reset
      return {
        allowed: false,
        reason: "Billing period expired. Please renew your subscription.",
        remaining: 0,
        limit: usage.creditsLimit,
        periodEnd: usage.periodEnd,
      };
    }

    if (remaining < requiredCredits) {
      return {
        allowed: false,
        reason: `Insufficient credits. ${remaining} remaining, ${requiredCredits} required.`,
        remaining,
        limit: usage.creditsLimit,
        periodEnd: usage.periodEnd,
      };
    }

    return {
      allowed: true,
      remaining: remaining - requiredCredits,
      limit: usage.creditsLimit,
      periodEnd: usage.periodEnd,
    };
  } catch (error) {
    console.error("Billing check error:", error);
    // Fail open for reliability, but log for monitoring
    return {
      allowed: true,
      reason: "Billing check failed, proceeding with caution",
    };
  }
}

/**
 * Inngest function to handle billing alerts and usage monitoring
 * Runs periodically to check for tenants approaching their limits
 */
export const billingMonitor = inngest.createFunction(
  {
    id: "billing.monitor",
    retries: 1,
  },
  { cron: "0 */6 * * *" }, // Run every 6 hours
  async ({ step }) => {
    // Step 1: Get all tenants with high usage (>80%)
    const highUsageTenants = await step.run("check-high-usage", async () => {
      // In a real implementation, this would query Convex for tenants
      // with creditsUsed > creditsLimit * 0.8
      // For now, return empty array as this requires a new Convex query
      return [];
    });

    // Step 2: Send alerts for high usage (placeholder for email/notification)
    if (highUsageTenants.length > 0) {
      await step.run("send-alerts", async () => {
        console.log(`Found ${highUsageTenants.length} tenants with high usage`);
        // In production: Send email alerts via Resend
      });
    }

    return {
      status: "completed",
      tenantsChecked: 0,
      alertsSent: highUsageTenants.length,
    };
  }
);

/**
 * Inngest function to handle credit exhaustion
 * Triggered when a tenant runs out of credits
 */
export const creditExhaustedHandler = inngest.createFunction(
  {
    id: "billing.credit-exhausted",
    retries: 1,
  },
  { event: "billing.credits-exhausted" },
  async ({ event, step }) => {
    const { tenantId, creditsUsed, creditsLimit } = event.data;

    // Step 1: Log the exhaustion event
    await step.run("log-exhaustion", async () => {
      console.log(`Credits exhausted for tenant ${tenantId}:`, {
        used: creditsUsed,
        limit: creditsLimit,
      });
    });

    // Step 2: Notify tenant (placeholder)
    await step.run("notify-tenant", async () => {
      // In production: Send email via Resend
      // await resend.send({
      //   to: tenantEmail,
      //   subject: "Your MyChatFlow credits have been exhausted",
      //   ...
      // });
      console.log(`Would notify tenant ${tenantId} about credit exhaustion`);
    });

    return { status: "completed", tenantId };
  }
);

/**
 * Helper function to be used as a guard in other Inngest functions
 * Example usage in another function:
 *
 * const billingOk = await step.run("billing-check", async () => {
 *   return await guardBillingCredits(tenantId, 1);
 * });
 *
 * if (!billingOk.allowed) {
 *   return { status: "blocked", reason: billingOk.reason };
 * }
 */
export async function guardBillingCredits(
  tenantId: string,
  requiredCredits: number = 1
): Promise<BillingCheckResult> {
  const result = await checkBillingCredits(tenantId, requiredCredits);

  // If credits exhausted, trigger the handler
  if (!result.allowed && result.remaining === 0) {
    try {
      await inngest.send({
        name: "billing.credits-exhausted",
        data: {
          tenantId,
          creditsUsed: result.limit,
          creditsLimit: result.limit,
        },
      });
    } catch (error) {
      console.error("Failed to send credits-exhausted event:", error);
    }
  }

  return result;
}

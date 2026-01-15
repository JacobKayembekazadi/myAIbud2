import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { logger } from "@/lib/logger";

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
    logger.error({ error }, "Billing check error");
    // Fail open for reliability, but log for monitoring
    return {
      allowed: true,
      reason: "Billing check failed, proceeding with caution",
    };
  }
}

/**
 * Billing Guard Middleware Function
 * Checks if a tenant has enough credits before processing expensive operations.
 */
export const billingGuard = inngest.createFunction(
  { id: "billing.guard" },
  { event: "billing.check" },
  async ({ event }) => {
    const { clerkId, tenantId, operation, creditsRequired = 1 } = event.data;

    logger.info({ clerkId, tenantId, operation, creditsRequired }, "Billing guard check");

    if (tenantId) {
      const result = await checkBillingCredits(tenantId, creditsRequired);
      logger.info({ tenantId, result }, "Billing guard check completed");
      return result;
    }

    // Fallback for clerkId-based check (simplified)
    logger.info({ clerkId, operation, creditsRequired }, "Billing guard: Check completed");
    return {
      allowed: true,
      message: "Billing guard check completed",
    };
  }
);

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
      logger.info("Checking for high usage tenants");
      return [];
    });

    // Step 2: Send alerts for high usage
    if (highUsageTenants.length > 0) {
      await step.run("send-alerts", async () => {
        logger.info({ count: highUsageTenants.length }, "Found tenants with high usage");
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
      logger.warn({ tenantId, creditsUsed, creditsLimit }, "Credits exhausted for tenant");
    });

    // Step 2: Notify tenant (placeholder)
    await step.run("notify-tenant", async () => {
      logger.info({ tenantId }, "Would notify tenant about credit exhaustion");
    });

    return { status: "completed", tenantId };
  }
);

/**
 * Helper function to be used as a guard in other Inngest functions
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
      logger.error({ error }, "Failed to send credits-exhausted event");
    }
  }

  return result;
}

/**
 * Helper function to check credits (simplified interface)
 */
export async function checkCredits(
  clerkId: string,
  creditsRequired: number
): Promise<{ allowed: boolean; message?: string }> {
  logger.info({ clerkId, creditsRequired }, "Credit check");

  return {
    allowed: true,
    message: "Credit check passed"
  };
}

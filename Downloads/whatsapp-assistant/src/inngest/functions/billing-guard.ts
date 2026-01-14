import { inngest } from "../client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { logger } from "@/lib/logger";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Billing Guard Middleware
 *
 * Checks if a tenant has enough credits before processing expensive operations.
 * Used as a guard before AI generation, campaign sends, etc.
 *
 * Usage:
 *   await billingGuard.send({ data: { tenantId: "...", operation: "ai_generation", creditsRequired: 1 } });
 *
 * Returns:
 *   { allowed: true/false, remainingCredits: number }
 */

export const billingGuard = inngest.createFunction(
  { id: "billing.guard" },
  { event: "billing.check" },
  async ({ event, step }) => {
    const { tenantId, operation, creditsRequired = 1 } = event.data;

    logger.info({ tenantId, operation, creditsRequired }, "Billing guard check");

    // Step 1: Get tenant
    const tenant = await step.run("get-tenant", async () => {
      return await convex.query(api.tenant.getTenant, {
        tenantId,
      });
    });

    if (!tenant) {
      logger.warn({ tenantId }, "Billing guard: Tenant not found");
      return { allowed: false, reason: "Tenant not found", remainingCredits: 0 };
    }

    // Step 2: Check credits
    const hasEnoughCredits = tenant.credits >= creditsRequired;

    if (!hasEnoughCredits) {
      logger.warn(
        { tenantId, available: tenant.credits, required: creditsRequired },
        "Billing guard: Insufficient credits"
      );
      return {
        allowed: false,
        reason: "Insufficient credits",
        remainingCredits: tenant.credits,
        required: creditsRequired,
      };
    }

    // Step 3: Reserve credits (optimistic locking)
    const reserved = await step.run("reserve-credits", async () => {
      try {
        await convex.mutation(api.tenant.updateCredits, {
          tenantId,
          amount: -creditsRequired,
        });
        return true;
      } catch (error) {
        logger.error({ error, tenantId }, "Billing guard: Failed to reserve credits");
        return false;
      }
    });

    if (!reserved) {
      return {
        allowed: false,
        reason: "Failed to reserve credits",
        remainingCredits: tenant.credits,
      };
    }

    logger.info(
      { tenantId, creditsUsed: creditsRequired, remaining: tenant.credits - creditsRequired },
      "Billing guard: Credits reserved"
    );

    return {
      allowed: true,
      remainingCredits: tenant.credits - creditsRequired,
      creditsUsed: creditsRequired,
    };
  }
);

/**
 * Helper function to check credits before expensive operations
 *
 * @example
 * const canProceed = await checkCredits(tenantId, 5);
 * if (!canProceed.allowed) {
 *   throw new Error(canProceed.reason);
 * }
 */
export async function checkCredits(
  tenantId: string,
  creditsRequired: number
): Promise<{ allowed: boolean; reason?: string; remainingCredits: number }> {
  try {
    const tenant = await convex.query(api.tenant.getTenant, { tenantId });

    if (!tenant) {
      return { allowed: false, reason: "Tenant not found", remainingCredits: 0 };
    }

    if (tenant.credits < creditsRequired) {
      return {
        allowed: false,
        reason: `Insufficient credits. Required: ${creditsRequired}, Available: ${tenant.credits}`,
        remainingCredits: tenant.credits,
      };
    }

    return { allowed: true, remainingCredits: tenant.credits };
  } catch (error) {
    logger.error({ error, tenantId }, "Credit check failed");
    return { allowed: false, reason: "Credit check failed", remainingCredits: 0 };
  }
}

import { inngest } from "../client";
import { logger } from "@/lib/logger";

/**
 * Billing Guard Middleware
 *
 * Checks if a tenant has enough credits before processing expensive operations.
 * Used as a guard before AI generation, campaign sends, etc.
 *
 * Usage:
 *   await inngest.send({ name: "billing.check", data: { clerkId: "...", operation: "ai_generation", creditsRequired: 1 } });
 *
 * Returns:
 *   { allowed: true/false, message: string }
 *
 * NOTE: This is a simplified stub implementation. In production, this would:
 * - Query tenant credits from the database
 * - Deduct credits atomically
 * - Handle insufficient credits gracefully
 */

export const billingGuard = inngest.createFunction(
  { id: "billing.guard" },
  { event: "billing.check" },
  async ({ event }) => {
    const { clerkId, operation, creditsRequired = 1 } = event.data;

    logger.info({ clerkId, operation, creditsRequired }, "Billing guard check");

    // Simple implementation: just log the check
    // In production, this would integrate with Convex mutations to deduct credits
    logger.info(
      { clerkId, operation, creditsRequired },
      "Billing guard: Check completed (simplified implementation)"
    );

    return {
      allowed: true,
      message: "Billing guard check completed",
    };
  }
);

/**
 * Helper function to check credits before expensive operations
 *
 * NOTE: Stub implementation - always returns allowed: true
 *
 * @example
 * const canProceed = await checkCredits(clerkId, 5);
 * if (!canProceed.allowed) {
 *   throw new Error(canProceed.message);
 * }
 */
export async function checkCredits(
  clerkId: string,
  creditsRequired: number
): Promise<{ allowed: boolean; message?: string }> {
  logger.info({ clerkId, creditsRequired }, "Credit check (stub implementation)");

  // Stub implementation - always allow
  // In production, this would query the database and check actual credits
  return {
    allowed: true,
    message: "Credit check passed (stub implementation)"
  };
}

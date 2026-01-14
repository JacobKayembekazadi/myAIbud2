import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { isRateLimitConfigured } from "@/lib/ratelimit";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies.
 * Used by monitoring tools, load balancers, and uptime checkers.
 *
 * GET /api/health
 *
 * Response:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "timestamp": "2026-01-13T21:00:00.000Z",
 *   "services": {
 *     "database": { "status": "up" | "down", "responseTime": 123 },
 *     "redis": { "status": "up" | "down" | "not_configured" },
 *     "inngest": { "status": "configured" | "not_configured" },
 *     "sentry": { "status": "configured" | "not_configured" }
 *   },
 *   "version": "1.0.0"
 * }
 */

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: string; responseTime?: number; error?: string }> = {};

  // Check 1: Convex Database
  try {
    const dbStart = Date.now();
    // Simple health check - try to query tenants
    await convex.query(api.tenants.list);
    checks.database = {
      status: "up",
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    checks.database = {
      status: "down",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }

  // Check 2: Upstash Redis (Rate Limiting)
  checks.redis = {
    status: isRateLimitConfigured() ? "up" : "not_configured",
  };

  // Check 3: Inngest (Background Jobs)
  checks.inngest = {
    status:
      process.env.INNGEST_EVENT_KEY && process.env.INNGEST_SIGNING_KEY
        ? "configured"
        : "not_configured",
  };

  // Check 4: Sentry (Error Monitoring)
  checks.sentry = {
    status: process.env.NEXT_PUBLIC_SENTRY_DSN ? "configured" : "not_configured",
  };

  // Check 5: Email Service (Resend)
  checks.email = {
    status: process.env.RESEND_API_KEY ? "configured" : "not_configured",
  };

  // Check 6: WAHA (WhatsApp API)
  checks.waha = {
    status: process.env.WAHA_API_URL && process.env.WAHA_API_KEY ? "configured" : "not_configured",
  };

  // Determine overall health status
  const hasDownServices = Object.values(checks).some((check) => check.status === "down");
  const hasUnconfigured = Object.values(checks).some(
    (check) => check.status === "not_configured"
  );

  let overallStatus: "healthy" | "degraded" | "unhealthy";
  if (hasDownServices) {
    overallStatus = "unhealthy";
  } else if (hasUnconfigured) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    services: checks,
    version: process.env.npm_package_version || "unknown",
    environment: process.env.NODE_ENV || "unknown",
  };

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}

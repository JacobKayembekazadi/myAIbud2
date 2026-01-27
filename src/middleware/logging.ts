import { NextRequest, NextResponse } from "next/server";
import { logger, logPerformance } from "@/lib/logger";
import { nanoid } from "nanoid";

/**
 * Request/Response Logging Middleware
 *
 * Logs all API requests with:
 * - Request ID for correlation
 * - Method, URL, headers (sanitized)
 * - Response status, duration
 * - Performance metrics
 *
 * Usage: Apply to specific routes or globally in middleware.ts
 */

export async function withRequestLogging(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = nanoid(10);

  // Extract request details
  const method = request.method;
  const url = request.url;
  const pathname = new URL(url).pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
             request.headers.get("x-real-ip") ||
             "unknown";

  // Log incoming request
  logger.info(
    {
      requestId,
      method,
      pathname,
      ip,
      userAgent: request.headers.get("user-agent"),
    },
    "Incoming request"
  );

  try {
    // Execute the handler
    const response = await handler();

    // Calculate duration
    const duration = Date.now() - startTime;

    // Log successful response
    logger.info(
      {
        requestId,
        method,
        pathname,
        status: response.status,
        duration,
      },
      "Request completed"
    );

    // Log performance if slow
    if (duration > 1000) {
      logger.warn(
        {
          requestId,
          method,
          pathname,
          duration,
        },
        "Slow request detected"
      );
    }

    // Track performance metrics
    logPerformance(`${method} ${pathname}`, duration, {
      requestId,
      status: response.status,
    });

    // Add request ID to response headers for debugging
    response.headers.set("X-Request-ID", requestId);

    return response;
  } catch (error) {
    // Calculate duration even for errors
    const duration = Date.now() - startTime;

    // Log error
    logger.error(
      {
        requestId,
        method,
        pathname,
        duration,
        error,
      },
      "Request failed"
    );

    // Re-throw to let error handlers deal with it
    throw error;
  }
}

/**
 * Sanitize headers for logging
 * Removes sensitive headers like Authorization, Cookie, etc.
 */
export function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-webhook-signature",
    "x-hub-signature-256",
  ];

  headers.forEach((value, key) => {
    if (!sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = value;
    } else {
      sanitized[key] = "[REDACTED]";
    }
  });

  return sanitized;
}

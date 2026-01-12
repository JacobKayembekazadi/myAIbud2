import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting for API endpoints
 *
 * Uses Upstash Redis for distributed rate limiting across Vercel edge functions.
 * Fallback to memory-based limiter if Upstash not configured (development).
 */

// Initialize Redis client only if credentials are configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Webhook rate limiter
 *
 * Protects against webhook bombing and DDoS attacks.
 * Limits: 100 requests per minute per IP address
 */
export const webhookRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:webhook",
    })
  : new Ratelimit({
      redis: new Map(), // In-memory fallback for development
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: false,
      prefix: "ratelimit:webhook",
    });

/**
 * Inngest API rate limiter
 *
 * Protects the Inngest webhook endpoint.
 * Limits: 200 requests per minute per IP (higher limit for background job triggers)
 */
export const inngestRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "1 m"),
      analytics: true,
      prefix: "ratelimit:inngest",
    })
  : new Ratelimit({
      redis: new Map(), // In-memory fallback for development
      limiter: Ratelimit.slidingWindow(200, "1 m"),
      analytics: false,
      prefix: "ratelimit:inngest",
    });

/**
 * General API rate limiter
 *
 * For user-facing API routes (contacts, messages, etc.)
 * Limits: 60 requests per minute per user/tenant
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:api",
    })
  : new Ratelimit({
      redis: new Map(), // In-memory fallback for development
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: false,
      prefix: "ratelimit:api",
    });

/**
 * Helper to get rate limit identifier from request
 * Uses IP address or forwarded IP from Vercel
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get real IP from Vercel headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0] || realIp || "anonymous";
}

/**
 * Check if Upstash Redis is configured
 */
export function isRateLimitConfigured(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

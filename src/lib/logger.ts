import pino from "pino";

/**
 * Structured logger using Pino
 *
 * Replaces console.log with production-grade structured logging.
 * Logs are JSON in production, pretty-printed in development.
 *
 * Usage:
 *   logger.info({ userId: '123', action: 'login' }, 'User logged in');
 *   logger.error({ error: err }, 'Failed to process webhook');
 *   logger.debug({ requestId: 'abc' }, 'Processing request');
 */

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),

  // Pretty print in development, JSON in production
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
          singleLine: false,
        },
      }
    : undefined,

  // Base fields included in every log
  base: {
    env: process.env.NODE_ENV,
    service: "whatsapp-assistant",
  },

  // Redact sensitive fields
  redact: {
    paths: [
      "apiKey",
      "password",
      "secret",
      "token",
      "authorization",
      "cookie",
      "*.apiKey",
      "*.password",
      "*.secret",
      "*.token",
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['x-api-key']",
      "req.headers['x-webhook-signature']",
    ],
    censor: "[REDACTED]",
  },

  // Serialize errors properly
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/**
 * Create a child logger with additional context
 *
 * @example
 * const reqLogger = createLogger({ requestId: '123', userId: 'user-456' });
 * reqLogger.info('Processing request');
 * // Output: { requestId: '123', userId: 'user-456', msg: 'Processing request' }
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context);
}

/**
 * Helper to log webhook events with consistent format
 */
export function logWebhook(
  event: "received" | "verified" | "processed" | "failed",
  data: {
    instanceId?: string;
    from?: string;
    messageType?: string;
    error?: unknown;
  }
) {
  const baseLog = {
    webhook: true,
    event,
    ...data,
  };

  if (event === "failed") {
    logger.error(baseLog, `Webhook ${event}`);
  } else {
    logger.info(baseLog, `Webhook ${event}`);
  }
}

/**
 * Helper to log security events
 */
export function logSecurity(
  event: "rate_limit" | "invalid_signature" | "unauthorized",
  data: {
    ip?: string;
    endpoint?: string;
    reason?: string;
  }
) {
  logger.warn(
    {
      security: true,
      event,
      ...data,
    },
    `Security event: ${event}`
  );
}

/**
 * Helper to log performance metrics
 */
export function logPerformance(
  operation: string,
  durationMs: number,
  metadata?: Record<string, unknown>
) {
  logger.info(
    {
      performance: true,
      operation,
      durationMs,
      ...metadata,
    },
    `Performance: ${operation} took ${durationMs}ms`
  );
}

export default logger;

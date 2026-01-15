/**
 * Error logging utilities
 * TODO: Add Sentry integration when ready
 * npm install @sentry/nextjs && npx @sentry/wizard@latest -i nextjs
 */

interface ErrorContext {
  digest?: string;
  route?: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

/**
 * Log an error to console (and Sentry when configured)
 */
export function logError(error: Error, context?: ErrorContext): void {
  // Log to console with structured format
  console.error("[Error]", {
    message: error.message,
    name: error.name,
    stack: error.stack,
    ...context,
  });

  // TODO: Add Sentry integration
  // if (typeof window !== "undefined" && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

/**
 * Log a warning message
 */
export function logWarning(message: string, context?: ErrorContext): void {
  console.warn("[Warning]", message, context);
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: ErrorContext): void {
  console.info("[Info]", message, context);
}

/**
 * Create a standardized error with context
 */
export function createError(message: string, code?: string): Error {
  const error = new Error(message);
  error.name = code || "AppError";
  return error;
}

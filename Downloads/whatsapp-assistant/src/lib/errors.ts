/**
 * Error handling utilities for user-friendly error messages and centralized logging
 */

/**
 * Extract a user-friendly error message from any error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Map common Convex errors to user-friendly messages
    const message = error.message;

    // Unauthorized errors
    if (message.includes("Unauthorized") || message.includes("not authorized")) {
      return "You don't have permission to perform this action";
    }

    // Authentication errors
    if (message.includes("not signed in") || message.includes("No identity")) {
      return "Please sign in to continue";
    }

    // Not found errors
    if (message.includes("not found") || message.includes("does not exist")) {
      return "The requested item could not be found";
    }

    // Validation errors
    if (message.includes("already exists") || message.includes("already a member")) {
      return "This item already exists";
    }

    if (message.includes("Invalid") || message.includes("expired")) {
      return "Invalid or expired data. Please try again";
    }

    // Credit/billing errors
    if (message.includes("credit") || message.includes("limit exceeded")) {
      return "You've reached your usage limit. Please upgrade your plan";
    }

    // Network/timeout errors
    if (message.includes("network") || message.includes("timeout")) {
      return "Connection issue. Please check your internet and try again";
    }

    // Return the original error message if no mapping found
    return message;
  }

  if (typeof error === "string") {
    return error;
  }

  // Generic fallback
  return "Something went wrong. Please try again";
}

/**
 * Log errors to console and send to Sentry if configured
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorMessage = getErrorMessage(error);
  const timestamp = new Date().toISOString();

  console.error("[ERROR]", timestamp, errorMessage, {
    originalError: error,
    context,
    stack: error instanceof Error ? error.stack : undefined,
  });

  // Send to Sentry if configured
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Dynamically import Sentry to avoid bundling issues
    import("@sentry/nextjs").then(({ captureException }) => {
      captureException(error, {
        contexts: {
          custom: context || {},
        },
        tags: {
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
        level: "error",
      });
    }).catch((err) => {
      console.error("[ERROR] Failed to send error to Sentry:", err);
    });
  }
}

/**
 * Custom error classes for better type safety
 */
export class UnauthorizedError extends Error {
  constructor(message = "You don't have permission to perform this action") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(resource = "item") {
    super(`The requested ${resource} could not be found`);
    this.name = "NotFoundError";
  }
}

export class CreditLimitError extends Error {
  constructor(message = "You've reached your usage limit") {
    super(message);
    this.name = "CreditLimitError";
  }
}

/**
 * Handle async errors with toast notifications
 * Useful wrapper for mutation handlers
 */
export async function handleAsyncError<T>(
  promise: Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const result = await promise;
    options?.onSuccess?.(result);
    return { success: true, data: result };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logError(error);
    options?.onError?.(error);
    return { success: false, error: errorMessage };
  }
}

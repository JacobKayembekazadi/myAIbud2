import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV,

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["X-Api-Key"];
      delete event.request.headers["Cookie"];
      delete event.request.headers["x-webhook-signature"];
      delete event.request.headers["x-hub-signature-256"];
    }

    // Remove sensitive environment variables if they exist
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runtimeData = event.contexts?.runtime?.data as any;
      if (runtimeData && runtimeData.env) {
        const env = runtimeData.env;
        delete env.CLERK_SECRET_KEY;
        delete env.WAHA_API_KEY;
        delete env.WAHA_WEBHOOK_SECRET;
        delete env.INNGEST_EVENT_KEY;
        delete env.INNGEST_SIGNING_KEY;
        delete env.GOOGLE_GENERATIVE_AI_API_KEY;
        delete env.RESEND_API_KEY;
        delete env.UPSTASH_REDIS_REST_TOKEN;
      }
    } catch {
      // Ignore errors in filtering
    }

    return event;
  },

  // Ignore Convex internal errors (they have their own monitoring)
  ignoreErrors: [
    "ConvexError",
    "Convex function",
  ],
});

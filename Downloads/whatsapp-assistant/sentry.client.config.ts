import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://0e5f943d111d7213feb3d5d85a1672e9@o4509493232271360.ingest.us.sentry.io/4509493234761728",

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // Sample 10% in prod

  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Capture 100% of sessions with errors

  // Environment
  environment: process.env.NODE_ENV,

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["Authorization"];
      delete event.request.headers["X-Api-Key"];
      delete event.request.headers["Cookie"];
    }

    // Remove sensitive query params
    if (event.request?.query_string) {
      const params = new URLSearchParams(event.request.query_string);
      params.delete("token");
      params.delete("key");
      params.delete("secret");
      event.request.query_string = params.toString();
    }

    return event;
  },

  // Ignore common noise
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    "chrome-extension://",
    // Network errors
    "NetworkError",
    "Network request failed",
    // User cancellations
    "AbortError",
    "cancelled",
  ],
});

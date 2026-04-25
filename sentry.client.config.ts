import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  // Keep low-signal client noise out
  ignoreErrors: ["ResizeObserver loop limit exceeded"],
  beforeSend(event) {
    // Don't send events from local dev or preview deploys unless explicitly enabled
    return event;
  },
});

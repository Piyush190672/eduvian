import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  ignoreErrors: [
    // Known client-side noise we can't act on
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});

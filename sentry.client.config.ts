import * as Sentry from "@sentry/nextjs";
import { EXTENSION_DENY_URLS, NOISE_IGNORE_ERRORS } from "@/lib/sentry-noise";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === "production",
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  // Keep low-signal client noise out. Browser-extension errors (wallet
  // extensions injecting scripts/inpage.js into every page) were reaching
  // the dashboard as if they were ours — see src/lib/sentry-noise.ts.
  ignoreErrors: NOISE_IGNORE_ERRORS,
  denyUrls: EXTENSION_DENY_URLS,
  beforeSend(event) {
    // Don't send events from local dev or preview deploys unless explicitly enabled
    return event;
  },
});

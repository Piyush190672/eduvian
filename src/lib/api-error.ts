import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

// Belt-and-suspenders: Next 14's instrumentation hook is unreliable on
// Vercel for our config, so eagerly init Sentry here too. No-op if already
// initialized by instrumentation.ts.
if (!Sentry.getClient() && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
    ],
  });
}

export function captureApiError(err: unknown, context: { route: string; extra?: Record<string, unknown> }) {
  console.error(`[${context.route}]`, err);
  try {
    Sentry.captureException(err, {
      tags: { route: context.route },
      extra: context.extra,
    });
  } catch {
    // Sentry not configured; swallow
  }
}

export async function apiErrorResponse(
  err: unknown,
  context: { route: string; extra?: Record<string, unknown>; busyMessage?: string },
  fallbackMessage = "Something went wrong"
) {
  captureApiError(err, context);
  // CRITICAL on Vercel: serverless functions freeze the moment the response
  // returns, killing Sentry's in-flight HTTP send. Flush before responding.
  try {
    await Sentry.flush(2000);
  } catch {
    /* ignore */
  }
  const status = (err as { status?: number })?.status;
  if (status === 529) {
    return NextResponse.json(
      {
        error:
          context.busyMessage ??
          "AI service is busy right now. Please try again in a moment.",
      },
      { status: 503 }
    );
  }
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

// Use @sentry/node directly — webpack's server build mis-resolves
// @sentry/nextjs to its browser entry, which has a no-op init() stub.
// @sentry/node is a transitive dep and resolves correctly.
import * as Sentry from "@sentry/node";
import { NextResponse } from "next/server";

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

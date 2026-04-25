import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

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

export function apiErrorResponse(
  err: unknown,
  context: { route: string; extra?: Record<string, unknown>; busyMessage?: string },
  fallbackMessage = "Something went wrong"
) {
  captureApiError(err, context);
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

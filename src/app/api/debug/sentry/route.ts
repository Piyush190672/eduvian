import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

// Diagnostic endpoint to verify Sentry is wired correctly on Vercel.
// Hit GET /api/debug/sentry — returns what Sentry sees from the server.
export async function GET() {
  const dsnPresent = !!process.env.SENTRY_DSN;
  const dsnPrefix = process.env.SENTRY_DSN?.slice(0, 30) ?? null;
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  // Try to capture a real event
  let captureId: string | undefined;
  let flushed = false;
  let flushErr: string | undefined;
  try {
    captureId = Sentry.captureException(
      new Error(`debug-sentry-${new Date().toISOString()}`),
      { tags: { route: "debug/sentry" } }
    );
    flushed = await Sentry.flush(3000);
  } catch (e) {
    flushErr = (e as Error).message;
  }

  // Inspect the active Sentry client
  const client = Sentry.getClient();
  const clientActive = !!client;
  const clientDsn = client?.getDsn();
  const clientEnabled = client?.getOptions().enabled;

  return NextResponse.json({
    env: { dsnPresent, dsnPrefix, nodeEnv, vercelEnv },
    client: {
      active: clientActive,
      enabled: clientEnabled,
      hasDsn: !!clientDsn,
    },
    capture: { eventId: captureId, flushed, flushErr },
  });
}

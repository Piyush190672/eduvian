import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";

// Diagnostic endpoint to verify Sentry is wired correctly on Vercel.
// Hit GET /api/debug/sentry — returns what Sentry sees from the server.
export async function GET() {
  const dsnPresent = !!process.env.SENTRY_DSN;
  const dsnPrefix = process.env.SENTRY_DSN?.slice(0, 30) ?? null;
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  const nextRuntime = process.env.NEXT_RUNTIME;

  // Force-init Sentry inline to bypass instrumentation.ts entirely.
  // If THIS works but the auto-init didn't, we know the hook never fires.
  let inlineInitOk = false;
  let inlineErr: string | undefined;
  try {
    if (!Sentry.getClient()) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        enabled: true,
        environment: vercelEnv || nodeEnv,
      });
    }
    inlineInitOk = !!Sentry.getClient();
  } catch (e) {
    inlineErr = (e as Error).message + " | " + ((e as Error).stack ?? "").slice(0, 300);
  }
  // Sentry exports we can see
  const sentryKeys = Object.keys(Sentry).slice(0, 20).join(",");

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
    env: { dsnPresent, dsnPrefix, nodeEnv, vercelEnv, nextRuntime },
    inlineInitOk,
    inlineErr,
    sentryKeys,
    client: {
      active: clientActive,
      enabled: clientEnabled,
      hasDsn: !!clientDsn,
    },
    capture: { eventId: captureId, flushed, flushErr },
  });
}

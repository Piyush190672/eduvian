/**
 * Rate limiter — Upstash Redis sliding-window with in-memory fallback.
 *
 * On Vercel serverless, in-memory state resets on every cold start, which
 * makes the local Map version trivially bypassable (snapshot finding C3).
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, every
 * lookup hits the shared Redis namespace and the limit holds across all
 * function instances.
 *
 * The in-memory path is kept for local dev and as a safety net if Upstash
 * is briefly unreachable — better to soft-cap than to fully open the door.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const HAS_UPSTASH =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!HAS_UPSTASH) return null;
  if (!redis) redis = Redis.fromEnv();
  return redis;
}

// One Ratelimit instance per (limit, windowSecs) tuple, cached so we don't
// rebuild the sliding-window state machine on every call.
const limiterCache = new Map<string, Ratelimit>();
function getLimiter(limit: number, windowSecs: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const key = `${limit}:${windowSecs}`;
  let lim = limiterCache.get(key);
  if (!lim) {
    lim = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowSecs} s`),
      analytics: false,
      prefix: "rl",
    });
    limiterCache.set(key, lim);
  }
  return lim;
}

// ── In-memory fallback (dev / Upstash outage) ─────────────────────────────
interface Window { count: number; resetAt: number }

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, Window> | undefined;
}
const memStore: Map<string, Window> =
  globalThis.__rateLimitStore ?? (globalThis.__rateLimitStore = new Map());

let lastPurge = Date.now();
function maybePurge() {
  if (Date.now() - lastPurge < 5 * 60 * 1000) return;
  lastPurge = Date.now();
  for (const [k, w] of memStore) if (Date.now() > w.resetAt) memStore.delete(k);
}

function memCheck(identifier: string, limit: number, windowSecs: number): RateLimitResult {
  maybePurge();
  const now = Date.now();
  let win = memStore.get(identifier);
  if (!win || now > win.resetAt) {
    win = { count: 1, resetAt: now + windowSecs * 1000 };
    memStore.set(identifier, win);
    return { ok: true };
  }
  win.count += 1;
  if (win.count > limit) {
    return { ok: false, retryAfter: Math.ceil((win.resetAt - now) / 1000) };
  }
  return { ok: true };
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets */
  retryAfter?: number;
}

/**
 * Check rate limit. Hits Upstash when configured, falls back to in-memory
 * otherwise. On Upstash failure (network blip), we fall through to memory
 * rather than fail-open completely.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSecs: number
): Promise<RateLimitResult> {
  const lim = getLimiter(limit, windowSecs);
  if (lim) {
    try {
      const r = await lim.limit(identifier);
      if (r.success) return { ok: true };
      const reset = typeof r.reset === "number" ? r.reset : Date.now();
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { ok: false, retryAfter };
    } catch {
      // Fall through to in-memory check below.
    }
  }
  return memCheck(identifier, limit, windowSecs);
}

/** Get the real client IP from Next.js request headers. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Convenience wrapper for AI tool routes — keys on email when known,
 * IP otherwise. Returns a 429 NextResponse on hit, or null on pass.
 *
 * Usage:
 *   const limited = await aiToolLimit(req, "sop-assistant", user?.email);
 *   if (limited) return limited;
 */
import { NextResponse } from "next/server";
export async function aiToolLimit(
  req: { headers: Headers },
  tool: string,
  email: string | null | undefined,
  opts: { limit?: number; windowSecs?: number } = {}
): Promise<NextResponse | null> {
  const limit = opts.limit ?? 10;
  const windowSecs = opts.windowSecs ?? 3600;
  const id = (email && email.trim().toLowerCase()) || `ip:${getClientIp(req.headers)}`;
  const rl = await checkRateLimit(`ai:${tool}:${id}`, limit, windowSecs);
  if (rl.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
  );
}

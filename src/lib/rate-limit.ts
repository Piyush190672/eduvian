/**
 * Lightweight in-memory rate limiter.
 * Uses a sliding-window counter keyed by IP + endpoint.
 *
 * Works on Vercel Edge/Node runtimes. State resets on cold starts,
 * which is acceptable — it prevents sustained abuse, not one-off bursts.
 */

interface Window {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __rateLimitStore: Map<string, Window> | undefined;
}

const store: Map<string, Window> =
  globalThis.__rateLimitStore ??
  (globalThis.__rateLimitStore = new Map());

/** Purge expired windows every 5 minutes to prevent memory growth. */
let lastPurge = Date.now();
function maybePurge() {
  if (Date.now() - lastPurge < 5 * 60 * 1000) return;
  lastPurge = Date.now();
  for (const [key, win] of store) {
    if (Date.now() > win.resetAt) store.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets */
  retryAfter?: number;
}

/**
 * Check rate limit.
 * @param identifier  Usually `${ip}-${endpoint}`
 * @param limit       Max requests allowed in the window
 * @param windowSecs  Window duration in seconds
 */
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowSecs: number
): RateLimitResult {
  maybePurge();

  const now    = Date.now();
  const resetAt = now + windowSecs * 1000;

  let win = store.get(identifier);

  if (!win || now > win.resetAt) {
    win = { count: 1, resetAt };
    store.set(identifier, win);
    return { ok: true };
  }

  win.count += 1;

  if (win.count > limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((win.resetAt - now) / 1000),
    };
  }

  return { ok: true };
}

/** Get the real client IP from Next.js request headers. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}

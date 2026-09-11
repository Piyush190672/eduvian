/**
 * Client-side Sentry noise filters.
 *
 * Added 11 Sep 2026 after a production "error" turned out to be a crypto
 * wallet extension: `Error: MetaMask extension not found` thrown from
 * `app:///scripts/inpage.js` on /programs/australia/unsw-sydney/…
 * (Sentry d881f18d, Edge 152 / Windows). eduvianAI has no web3 surface —
 * `grep -ri "metamask|web3|ethereum" src/` returns nothing. MetaMask and
 * similar wallets inject `inpage.js` into EVERY page they load; when the
 * wallet probes for its own extension and fails, the throw lands in our
 * page's global error handler and Sentry reports it against us.
 *
 * Unfiltered this burns Sentry quota, and — worse — trains us to ignore a
 * dashboard full of errors we cannot fix, which is how a real regression
 * gets missed.
 *
 * SAFETY: these patterns must never match our own frames. Our client code
 * is served from `/_next/static/chunks/…` (so Sentry frames read
 * `app:///_next/static/chunks/…`), and `public/` contains no `scripts/`
 * directory — nothing of ours is ever served under `/scripts/`. Hence the
 * inpage.js rule is scoped to that exact filename rather than a blanket
 * `app:///` deny, which WOULD have swallowed our real errors.
 * Guarded by tests/sentry-noise.test.ts.
 */

/**
 * Stack-frame URLs whose errors are not ours. Sentry drops an event when
 * any frame matches.
 */
export const EXTENSION_DENY_URLS: RegExp[] = [
  // Wallet extensions (MetaMask et al.) inject this into every page.
  /\/scripts\/inpage\.js/i,
  // Extension protocols, by browser.
  /^chrome-extension:\/\//i,
  /^moz-extension:\/\//i,
  /^safari-web-extension:\/\//i,
  /^safari-extension:\/\//i,
];

/**
 * Error messages that are known third-party noise regardless of frame.
 * Kept narrow and literal — a loose pattern here silently hides real bugs.
 */
export const NOISE_IGNORE_ERRORS: (string | RegExp)[] = [
  // Benign browser layout chatter, not an app fault: the observer simply
  // could not deliver every notification within one animation frame.
  // Chrome emits the first wording, Firefox/Safari the second — we had
  // only ever filtered the first. (11 Sep 2026)
  "ResizeObserver loop limit exceeded",
  "ResizeObserver loop completed with undelivered notifications",
  /MetaMask extension not found/i,
  /Failed to connect to MetaMask/i,
];

/** True when a stack-frame URL belongs to a browser extension, not to us. */
export function isExtensionFrame(url: string): boolean {
  return EXTENSION_DENY_URLS.some((re) => re.test(url));
}

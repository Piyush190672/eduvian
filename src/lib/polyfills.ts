/**
 * Inline polyfills injected into <head> before any bundle evaluates.
 *
 * Added 9 Nov 2026 after Sentry 775dbd65: `ReferenceError: queueMicrotask
 * is not defined` thrown from our OWN chunk (7212) on the homepage, on a
 * Huawei P30 / Android 10 reporting "Chrome Mobile 89".
 *
 * Cause: framer-motion 11.18.2 calls `queueMicrotask(...)` bare — no
 * `typeof` guard — in three places (frame scheduling, the microtask
 * scheduler, and the Motion handoff). An undeclared global reference is a
 * ReferenceError, and it fires while the webpack MODULE FACTORY runs, so
 * the whole chunk fails to initialise. framer-motion is imported by 22
 * components including MobileNav and ChatWidget: on an affected device the
 * mobile navigation and chat silently stop working.
 *
 * Why a browser that reports Chrome 89 lacks a Chrome 71 API: the UA is
 * not trustworthy here. Huawei devices of this generation ship third-party
 * browsers and stripped WebView forks that spoof a Chrome version string.
 * We cannot fix their engine, so we restore the API instead.
 *
 * This MUST be inline in <head>, not an import: the failure happens during
 * chunk evaluation, so anything bundled is already too late.
 *
 * Guarded by tests/polyfills.test.ts.
 */

/**
 * queueMicrotask, per the WHATWG spec shape.
 *
 * The `setTimeout` rethrow is deliberate and not decoration: the spec says
 * a throwing callback is *reported as an uncaught exception*. A naive
 * `Promise.resolve().then(cb)` would instead surface it as an unhandled
 * promise rejection — the very mechanism that reported this bug to Sentry
 * in the first place. Rethrowing out of band keeps the real stack and the
 * correct error channel.
 *
 * Kept as a single-line-ish string because it is inlined into HTML on
 * every page; it is small enough that readability lives in this comment
 * rather than in shipped bytes.
 */
export const QUEUE_MICROTASK_POLYFILL =
  'if(typeof queueMicrotask!=="function"){' +
  "window.queueMicrotask=function(c){" +
  "Promise.resolve().then(c).catch(function(e){setTimeout(function(){throw e})})" +
  "}}";

/** Everything injected into <head>, in order. */
export const INLINE_POLYFILLS = QUEUE_MICROTASK_POLYFILL;

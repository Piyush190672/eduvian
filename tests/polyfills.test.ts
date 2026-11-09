import { describe, it, expect, vi } from "vitest";
import { QUEUE_MICROTASK_POLYFILL, INLINE_POLYFILLS } from "@/lib/polyfills";

/**
 * Runs the polyfill source in a sandbox that mimics a browser global
 * scope, so we test the string we actually ship rather than a re-written
 * copy of it. `queueMicrotask` is referenced bare inside the polyfill's
 * own guard, so the sandbox must expose it as a real identifier — hence
 * `with`-free Function construction over an explicit scope object.
 */
function runPolyfill(opts: { nativePresent: boolean }) {
  const win: Record<string, unknown> = {};
  const native = vi.fn();
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(
    "window",
    "queueMicrotask",
    "setTimeout",
    `${QUEUE_MICROTASK_POLYFILL}; return window.queueMicrotask;`,
  );
  const deferred: (() => void)[] = [];
  const installed = fn(
    win,
    opts.nativePresent ? native : undefined,
    (cb: () => void) => deferred.push(cb),
  );
  return { win, native, installed, deferred };
}

// Sentry 775dbd65 (7 Nov 2026): framer-motion calls queueMicrotask bare,
// so on a browser without it our chunk died at module-eval and took
// MobileNav + ChatWidget down with it.
describe("queueMicrotask polyfill", () => {
  it("installs a working implementation when the global is missing", async () => {
    const { win, installed } = runPolyfill({ nativePresent: false });
    expect(typeof installed).toBe("function");
    expect(typeof win.queueMicrotask).toBe("function");

    const ran = await new Promise<boolean>((resolve) => {
      (installed as (cb: () => void) => void)(() => resolve(true));
    });
    expect(ran).toBe(true);
  });

  it("runs the callback asynchronously, not inline", () => {
    const { installed } = runPolyfill({ nativePresent: false });
    const order: string[] = [];
    (installed as (cb: () => void) => void)(() => order.push("microtask"));
    order.push("sync");
    // The callback must NOT have run yet — that's the whole point.
    expect(order).toEqual(["sync"]);
  });

  it("does NOT overwrite a native implementation", () => {
    const { win } = runPolyfill({ nativePresent: true });
    expect(win.queueMicrotask).toBeUndefined();
  });

  it("reports a throwing callback as an uncaught exception, not an unhandled rejection", async () => {
    // Spec behaviour, and the reason the .catch/setTimeout rethrow exists:
    // a naive Promise.resolve().then(cb) would convert a thrown error into
    // an unhandled rejection — exactly the channel that reported this bug.
    const { installed, deferred } = runPolyfill({ nativePresent: false });
    const boom = new Error("callback blew up");
    (installed as (cb: () => void) => void)(() => { throw boom; });

    await Promise.resolve();
    await Promise.resolve();

    expect(deferred).toHaveLength(1);
    expect(() => deferred[0]()).toThrow(boom);
  });

  it("is valid standalone JavaScript (it is inlined raw into <head>)", () => {
    expect(() => new Function(INLINE_POLYFILLS)).not.toThrow();
    // No closing-tag sequence that would break out of the <script> element.
    expect(INLINE_POLYFILLS).not.toMatch(/<\/script/i);
  });
});

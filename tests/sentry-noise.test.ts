import { describe, it, expect } from "vitest";
import {
  isExtensionFrame,
  NOISE_IGNORE_ERRORS,
  EXTENSION_DENY_URLS,
} from "@/lib/sentry-noise";

const matchesIgnored = (message: string) =>
  NOISE_IGNORE_ERRORS.some((p) =>
    typeof p === "string" ? message.includes(p) : p.test(message),
  );

// Sentry d881f18d (11 Sep 2026): a crypto wallet extension threw
// "MetaMask extension not found" from app:///scripts/inpage.js on a
// /programs/... page and was reported against eduvian-web, which has no
// web3 code at all.
describe("Sentry noise filters — drop third-party extension errors", () => {
  it("drops the exact frames from the reported MetaMask issue", () => {
    expect(isExtensionFrame("app:///scripts/inpage.js")).toBe(true);
    expect(isExtensionFrame("app:///scripts/inpage.js:4:42708")).toBe(true);
  });

  it("drops extension protocol frames across browsers", () => {
    for (const url of [
      "chrome-extension://abcdefghijklmnop/inject.js",
      "moz-extension://1234-5678/content.js",
      "safari-web-extension://ABCD/inpage.js",
      "safari-extension://ABCD/inpage.js",
    ]) {
      expect(isExtensionFrame(url), url).toBe(true);
    }
  });

  it("matches the reported error messages", () => {
    expect(matchesIgnored("Error: MetaMask extension not found")).toBe(true);
    expect(matchesIgnored("i: Failed to connect to MetaMask")).toBe(true);
  });

  it("matches BOTH ResizeObserver wordings — Chrome's and Firefox/Safari's", () => {
    expect(matchesIgnored("ResizeObserver loop limit exceeded")).toBe(true);
    expect(
      matchesIgnored("ResizeObserver loop completed with undelivered notifications."),
    ).toBe(true);
  });
});

// The real risk of a noise filter is over-reach: silently swallowing our
// own production errors. These are the guards.
describe("Sentry noise filters — never suppress our own errors", () => {
  it("keeps our client bundle frames", () => {
    for (const url of [
      "app:///_next/static/chunks/app/results/[token]/page-abc123.js",
      "app:///_next/static/chunks/4521-d62d238294d636bf.js",
      "https://www.eduvianai.com/_next/static/chunks/main-app-d43cc41f9c0a8a86.js",
      "app:///_next/server/app/programs/page.js",
    ]) {
      expect(isExtensionFrame(url), url).toBe(false);
    }
  });

  it("does NOT blanket-deny the app:/// prefix", () => {
    // A naive /^app:\/\//: rule would have hidden every client error we have.
    expect(isExtensionFrame("app:///something-of-ours.js")).toBe(false);
    expect(EXTENSION_DENY_URLS.some((re) => re.source === "^app:\\/\\/")).toBe(false);
  });

  it("keeps real application errors with similar-looking messages", () => {
    for (const msg of [
      "Failed to connect to Supabase",
      "TypeError: Cannot read properties of undefined (reading 'qs_ranking')",
      "Results not found",
      "Feedback generation failed",
    ]) {
      expect(matchesIgnored(msg), msg).toBe(false);
    }
  });
});

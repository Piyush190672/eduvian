"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ShieldCheck } from "lucide-react";

const STORAGE_KEY = "eduvian_security_notice_dismissed_2026_05_h2";
// Show the notice for 21 days after deploy. After that, anyone with a
// 30-day-old legacy cookie is past the point of caring.
const SHOW_UNTIL_MS = Date.UTC(2026, 4 /* May */, 23, 0, 0, 0);

export default function SecurityNoticeBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (Date.now() > SHOW_UNTIL_MS) {
      setVisible(false);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "1") {
        setVisible(false);
        return;
      }
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const BANNER_H = "44px";
    if (visible) {
      // Stack below the beta banner (36px). Use both pieces additively.
      document.documentElement.style.setProperty("--security-notice-h", BANNER_H);
      const beta = getComputedStyle(document.documentElement).getPropertyValue("--beta-banner-h").trim();
      const total = beta ? `calc(${beta} + ${BANNER_H})` : BANNER_H;
      document.body.style.paddingTop = total;
    } else {
      document.documentElement.style.removeProperty("--security-notice-h");
      // Defer to BetaBanner to set its own padding back; if it's not visible, clear ours.
      const beta = getComputedStyle(document.documentElement).getPropertyValue("--beta-banner-h").trim();
      document.body.style.paddingTop = beta || "";
    }
    return () => {
      document.documentElement.style.removeProperty("--security-notice-h");
    };
  }, [mounted, visible]);

  if (!mounted || !visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      // Sit just below the beta banner (top-9 = 36px).
      className="fixed top-9 left-0 right-0 z-[99] w-full px-10 py-2.5 text-xs font-medium text-emerald-950 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 border-b border-emerald-600/40 shadow-sm"
    >
      <p className="text-center leading-snug">
        <ShieldCheck className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" aria-hidden="true" />
        <span className="font-bold">Security update:</span> we&rsquo;ve upgraded how we
        protect your account. If you were signed in before, please{" "}
        <Link href="/get-started" className="underline font-bold hover:text-emerald-900">
          sign in again
        </Link>{" "}
        to continue where you left off.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss security notice"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-emerald-500/20 text-emerald-900 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

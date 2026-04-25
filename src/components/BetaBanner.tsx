"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "eduvian_beta_banner_dismissed_2026_04";
const HIDE_FOR_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function BetaBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const ts = parseInt(raw, 10);
        if (!Number.isNaN(ts) && Date.now() - ts < HIDE_FOR_MS) {
          setVisible(false);
          return;
        }
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  // Push the rest of the page down by the banner's height so fixed top-0 navs
  // sit below the banner instead of behind it.
  useEffect(() => {
    if (!mounted) return;
    const BANNER_H = "36px";
    if (visible) {
      document.body.style.paddingTop = BANNER_H;
      document.documentElement.style.setProperty("--beta-banner-h", BANNER_H);
    } else {
      document.body.style.paddingTop = "";
      document.documentElement.style.removeProperty("--beta-banner-h");
    }
    return () => {
      document.body.style.paddingTop = "";
      document.documentElement.style.removeProperty("--beta-banner-h");
    };
  }, [mounted, visible]);

  // SSR-safe: render nothing until mounted to avoid hydration mismatch.
  if (!mounted || !visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-[100] w-full h-9 flex items-center justify-center px-10 text-xs font-medium text-amber-950 bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 border-b border-amber-500/40 shadow-md"
    >
      <p className="truncate text-center">
        <span aria-hidden="true">🧪</span>{" "}
        <span className="font-bold">Beta</span> — free access for the first 100 users each month.{" "}
        <Link href="/get-started" className="underline font-bold hover:text-amber-900">
          Claim your spot →
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss beta notice"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-amber-500/20 text-amber-900 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

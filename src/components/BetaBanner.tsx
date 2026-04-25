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
      className="relative w-full h-8 flex items-center justify-center px-3 text-xs text-white bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 backdrop-blur border-b border-white/10"
    >
      <p className="truncate">
        <span aria-hidden="true">🧪</span> Beta — limited free access for the first 100 users each month.{" "}
        <Link href="/get-started" className="underline font-medium">
          Claim your spot
        </Link>
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss beta notice"
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

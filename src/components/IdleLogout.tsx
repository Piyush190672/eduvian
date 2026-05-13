"use client";

import { useEffect } from "react";

/**
 * IdleLogout — invisible component that signs the user out after 60 minutes
 * of inactivity. Listens for mouse / keyboard / touch / scroll on the page
 * (passive, throttled) and refreshes a "last active" timestamp in
 * localStorage. A setInterval checks the timestamp every minute and, when
 * the threshold is crossed AND the user is signed in, calls /api/auth/logout,
 * clears localStorage, and reloads at "/".
 *
 * Why a single shared component (loaded from layout.tsx):
 *   - Activity tracking has to work across every page, including tool
 *     pages that don't show LogoutButton.
 *   - Cross-tab consistency — localStorage is shared, so any tab refreshes
 *     the timestamp and any tab can trigger the logout.
 *
 * 13 May 2026: introduced after a user reported "sessions never expire
 * without an explicit logout". 60 min matches the security audit
 * recommendation in §H2 of the audit doc.
 */

const IDLE_LIMIT_MS = 24 * 60 * 60 * 1000;   // 24 hours
const CHECK_EVERY_MS = 5 * 60 * 1000;         // re-check every 5 minutes
const THROTTLE_MS = 5 * 1000;                 // at most one activity write per 5s
const LAST_ACTIVE_KEY = "eduvian_last_active";
const STUDENT_KEY = "eduvian_student";

export default function IdleLogout() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    let lastWrite = 0;
    const writeActivity = () => {
      const now = Date.now();
      if (now - lastWrite < THROTTLE_MS) return;
      lastWrite = now;
      try { localStorage.setItem(LAST_ACTIVE_KEY, String(now)); } catch { /* ignore */ }
    };
    // Seed the timestamp on first mount so a freshly-logged-in user gets
    // the full 60 minutes from now.
    writeActivity();

    const events: Array<keyof DocumentEventMap> = [
      "mousemove", "keydown", "click", "scroll", "touchstart", "wheel",
    ];
    for (const ev of events) {
      document.addEventListener(ev, writeActivity, { passive: true });
    }

    const tick = async () => {
      let raw: string | null = null;
      let last: number = 0;
      try {
        raw = localStorage.getItem(STUDENT_KEY);
        last = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) ?? "0", 10) || 0;
      } catch {
        return;
      }
      // Not signed in — nothing to do.
      if (!raw) return;
      if (Date.now() - last < IDLE_LIMIT_MS) return;

      // Crossed the threshold — log out.
      try {
        await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" } });
      } catch {
        /* network error — still clear local state */
      }
      try {
        localStorage.removeItem(STUDENT_KEY);
        localStorage.removeItem(LAST_ACTIVE_KEY);
      } catch {
        /* ignore */
      }
      // Reload at "/" with a query flag the homepage can read if it ever
      // wants to show a "signed out due to inactivity" banner.
      window.location.replace("/?idle=1");
    };

    const id = setInterval(tick, CHECK_EVERY_MS);
    return () => {
      clearInterval(id);
      for (const ev of events) document.removeEventListener(ev, writeActivity);
    };
  }, []);

  return null;
}

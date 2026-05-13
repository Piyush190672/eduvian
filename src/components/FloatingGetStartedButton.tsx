"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

/**
 * FloatingGetStartedButton — fixed top-right CTA that appears once the
 * user scrolls past the hero (so the nav's own "Get started" button has
 * left the viewport). Stays visible through the rest of the page so the
 * user never has to scroll back up to start the flow.
 *
 * Hidden on /get-started and /profile (the destinations), and hidden until
 * mount to avoid SSR/hydration flicker.
 *
 * Sits below the BetaBanner + SecurityNoticeBanner stack — they use top: 0
 * and top: 36px with z-100 / z-99, so this needs a top offset of ~88px and
 * z-40 (below the banners, above page content).
 */
export default function FloatingGetStartedButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Don't render at all on the destination pages.
    const path = window.location.pathname;
    if (path.startsWith("/get-started") || path.startsWith("/profile")) return;

    const SHOW_AFTER = 600; // px scrolled past hero before button appears
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <Link
      href="/get-started"
      aria-label="Get started"
      className="fixed top-[88px] right-4 sm:right-6 z-40 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold shadow-lg shadow-violet-900/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
    >
      Get started
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

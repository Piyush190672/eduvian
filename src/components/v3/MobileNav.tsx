"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight } from "lucide-react";

/**
 * v3 mobile nav drawer (moodboard frame M-06). Plain useState toggle —
 * no framer-motion (locked mobile rule). Primary CTA lives inside the
 * drawer so it is never a desktop-only affordance.
 */
const LINKS = [
  { href: "/programs", label: "Find programs" },
  { href: "/destinations", label: "Destinations" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/why-eduvianai", label: "Why eduvianAI" },
  { href: "/methodology", label: "How it works" },
  { href: "/get-started", label: "Sign in" },
] as const;

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="w-11 h-11 -mr-2 flex items-center justify-center text-white/80 hover:text-white"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-16 z-50 bg-[#0F172A] border-t border-white/10 shadow-2xl">
          <nav className="px-6 py-4 flex flex-col" aria-label="Mobile">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-3 min-h-[44px] flex items-center text-[15px] font-medium text-white/80 hover:text-white border-b border-white/5 last:border-0"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="mt-4 mb-2 inline-flex items-center justify-center gap-2 w-full px-5 py-3.5 min-h-[48px] rounded-full bg-blue-900 text-white text-[15px] font-bold"
            >
              Check my readiness
              <ArrowRight className="w-4 h-4" />
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

/**
 * NextBestAction — high-contrast CTA panel rendered at the bottom of each
 * tool's primary output. Removes the "now what?" gap after a result.
 *
 * Design intent: read as a clear, eye-catching next step — dark violet
 * gradient with a glowing icon block, animated arrow, and a soft accent
 * bar above. Sized to sit prominently within a result column without
 * dominating the actual data.
 *
 * Usage:
 *   <NextBestAction
 *     label="Compare this offer with a lower-cost program"
 *     href="/results"
 *   />
 *
 * Pass `external` for an off-site link (visa portal, etc.) or `onClick`
 * for in-page actions (open a panel, scroll to a section).
 */
export function NextBestAction({
  label,
  href,
  external = false,
  onClick,
}: {
  label: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const inner = (
    <div className="relative group flex items-center gap-3 sm:gap-4 w-full">
      {/* Glowing icon block */}
      <div className="relative flex-shrink-0">
        <span aria-hidden className="absolute inset-0 rounded-xl bg-violet-400/40 blur-md group-hover:bg-violet-300/60 transition-colors" />
        <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
      </div>

      {/* Copy */}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200 mb-0.5 sm:mb-1 flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
          Next best action
        </p>
        <p className="text-sm sm:text-[15px] font-bold text-white leading-snug">
          {label}
        </p>
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white text-violet-700 flex items-center justify-center shadow-md group-hover:translate-x-1 group-hover:shadow-lg group-hover:bg-violet-50 transition-all">
        <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    </div>
  );

  const shellClass =
    "relative overflow-hidden block w-full bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-700 rounded-2xl px-5 py-4 shadow-lg shadow-violet-900/25 hover:shadow-violet-900/40 hover:-translate-y-0.5 transition-all";

  const accentBar = (
    <>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-fuchsia-300 to-transparent" />
      <span aria-hidden className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-fuchsia-400/20 blur-2xl" />
    </>
  );

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={shellClass}>
        {accentBar}
        {inner}
      </a>
    ) : (
      <Link href={href} className={shellClass}>
        {accentBar}
        {inner}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={shellClass}>
      {accentBar}
      {inner}
    </button>
  );
}

"use client";

import { Printer, Mail, Users, ArrowRight } from "lucide-react";

/**
 * ShareWithFamily — three-button panel rendered after any high-stakes
 * output. Lets the student turn the result into something a parent can
 * actually open, read and react to.
 *
 *   - Print / save as PDF (browser print, prints the current page)
 *   - Email (mailto: with a pre-filled subject + body referencing the page)
 *   - Parent-friendly view (route to a simpler / less-technical layout)
 *
 * Pass `parentViewHref` to point the third button somewhere meaningful for
 * the current output (e.g. `/sample-parent-report` for visa, the parent
 * decision tool for a shortlist). Omit it to hide that button.
 *
 * In South Asia especially, the final decision is usually a family
 * conversation. This pattern is the behaviour bridge, not just a CTA.
 */
export function ShareWithFamily({
  emailSubject,
  emailBody,
  parentViewHref,
  parentViewLabel = "Open parent-friendly view",
  className = "",
}: {
  emailSubject: string;
  emailBody: string;
  parentViewHref?: string;
  parentViewLabel?: string;
  className?: string;
}) {
  const mailto = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <section className={`rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 sm:px-6 sm:py-6 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-violet-700" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Share with family</p>
      </div>
      <p className="text-xs text-gray-600 leading-snug mb-4">
        Most study-abroad calls happen at the dinner table. Hand them something they can read in five minutes.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => { if (typeof window !== "undefined") window.print(); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-gray-800 text-xs font-bold hover:border-violet-300 hover:text-violet-700 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Print / save PDF
        </button>
        <a
          href={mailto}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-gray-800 text-xs font-bold hover:border-violet-300 hover:text-violet-700 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" /> Email this page
        </a>
        {parentViewHref && (
          <a
            href={parentViewHref}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5" /> {parentViewLabel} <ArrowRight className="w-3 h-3" />
          </a>
        )}
      </div>
    </section>
  );
}

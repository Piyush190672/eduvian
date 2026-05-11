"use client";

import { ShieldCheck, ExternalLink } from "lucide-react";

/**
 * SourceProof — a compact footer rendered inside every high-stakes output
 * (program match cards, ROI results, visa readiness, parent report, etc.).
 * Surfaces the "verified at source" promise at the point of decision —
 * not buried inside the methodology page.
 *
 * Each line names what kind of source the value came from. The last_verified
 * timestamp + the "View source" link give the reader a one-click escape to
 * confirm anything that matters.
 *
 * Keep the lines list short (3-5 entries). If the source itself is unknown
 * for a field, omit the line rather than fudging it — per the verification
 * pipeline rule that missing fields are blank, not invented.
 */
export interface ProofLine {
  field: string;     // e.g. "Fee"
  source: string;    // e.g. "Official university page"
}

export function SourceProof({
  lines,
  lastVerified,
  sourceUrl,
  sourceLabel = "View source",
  note = "Missing fields are shown blank, never estimated.",
  className = "",
}: {
  lines: ProofLine[];
  lastVerified?: string | Date | null;
  sourceUrl?: string;
  sourceLabel?: string;
  note?: string;
  className?: string;
}) {
  // Locale-stable format so server- and client-rendered output match
  // (Next.js hydrates against the server HTML; toLocaleDateString without
  // an explicit locale picks up the user's locale and triggers a mismatch).
  const verifiedDate = (() => {
    if (!lastVerified) return null;
    const d = typeof lastVerified === "string" ? new Date(lastVerified) : lastVerified;
    if (Number.isNaN(d.getTime())) return null;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  })();

  return (
    <div className={`mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800">Source proof</p>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-emerald-900/90">
        {lines.map((l) => (
          <div key={l.field} className="flex items-baseline gap-1.5 min-w-0">
            <dt className="font-semibold text-emerald-900 flex-shrink-0">{l.field}:</dt>
            <dd className="truncate text-emerald-800/80">{l.source}</dd>
          </div>
        ))}
        {verifiedDate && (
          <div className="flex items-baseline gap-1.5 min-w-0">
            <dt className="font-semibold text-emerald-900 flex-shrink-0">Last verified:</dt>
            <dd className="text-emerald-800/80">{verifiedDate}</dd>
          </div>
        )}
      </dl>
      <p className="mt-2 text-[10px] text-emerald-700/80 leading-snug">{note}</p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
        >
          {sourceLabel} <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}

"use client";

import { ShieldCheck, Sparkles, User, AlertTriangle, BookOpen } from "lucide-react";

/**
 * DataBadge — provenance label for a single value (e.g. a fee, a salary,
 * an ROI projection). Renders a small pill with an icon, a one-word label,
 * and a hover tooltip explaining what that provenance means.
 *
 * Placed next to decision-driving values only (fees, salaries, ROI, scholarships,
 * visa risk, payback period, safety scores). Static facts like "Toronto, ON"
 * don't need one.
 */
export type DataProvenance =
  | "official"            // Read from an official source (university page, govt portal)
  | "third_party"         // Named third-party dataset used where no official figure exists
  | "ai_estimate"         // Computed/inferred by EduvianAI (salary lookup, ROI math)
  | "user_provided"       // Entered by the user in the calculator
  | "needs_verification"  // Live data, but the user should re-confirm before relying
  | "illustrative";       // Sample / example data, not real

const META: Record<DataProvenance, { label: string; cls: string; Icon: typeof ShieldCheck; tooltip: string }> = {
  official:            { label: "Official source",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",  Icon: ShieldCheck,      tooltip: "Read directly from the official university or government source page." },
  third_party:         { label: "Third-party benchmark",  cls: "bg-white      text-slate-600   border-slate-300",    Icon: BookOpen,         tooltip: "From a named third-party dataset or survey — used only where no official figure exists, and always labelled." },
  ai_estimate:         { label: "EduvianAI estimate",     cls: "bg-blue-50  text-blue-800  border-blue-200",   Icon: Sparkles,         tooltip: "Computed by EduvianAI from sourced inputs — not a directly quoted figure." },
  user_provided:       { label: "User provided",          cls: "bg-blue-50  text-blue-800  border-blue-200",   Icon: User,             tooltip: "Entered by you in the calculator. Re-confirm with the university before acting on it." },
  needs_verification:  { label: "Needs verification",     cls: "bg-amber-50   text-amber-700   border-amber-200",    Icon: AlertTriangle,    tooltip: "Live data but the underlying rule changes often — verify with the official source before committing." },
  illustrative:        { label: "Illustrative sample",    cls: "bg-gray-100   text-gray-700    border-gray-200",     Icon: BookOpen,         tooltip: "Sample / illustrative numbers. Not a real recommendation for a real student." },
};

export function DataBadge({ kind, className = "" }: { kind: DataProvenance; className?: string }) {
  const m = META[kind];
  const Icon = m.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[11px] font-bold uppercase tracking-wide whitespace-nowrap ${m.cls} ${className}`}
      title={m.tooltip}
    >
      <Icon className="w-3 h-3" />
      <span>{m.label}</span>
    </span>
  );
}

"use client";

import { TrendingUp, ShieldCheck, FileCheck2, GraduationCap, Banknote, Trophy } from "lucide-react";

/**
 * TradeoffView — six-factor decision lens rendered alongside any
 * shortlisted program / parent report. Each factor takes one of three
 * verdict levels: Strong / Medium / Weak (varying labels per factor).
 *
 * Brand note: emerald = strong / good · amber = medium · rose = risk.
 * No gradient rainbow per stage — single semantic mapping per the brand spec.
 *
 * This component receives pre-computed verdicts. The math that derives them
 * lives in scoring.ts / visa-data.ts / parent-decision-calculator.ts —
 * each call site picks the inputs that make sense for its context (live
 * student profile, illustrative sample, etc.).
 */

export type TradeoffTone = "good" | "medium" | "warn";

export interface TradeoffFactor {
  key: string;
  label: string;
  verdict: string;
  tone: TradeoffTone;
  note?: string;
  Icon: typeof TrendingUp;
}

const TONE_CLASS: Record<TradeoffTone, string> = {
  good:   "bg-emerald-50 border-emerald-200 text-emerald-800",
  medium: "bg-amber-50   border-amber-200   text-amber-900",
  warn:   "bg-rose-50    border-rose-200    text-rose-800",
};

const VERDICT_PILL_CLASS: Record<TradeoffTone, string> = {
  good:   "bg-emerald-600 text-white",
  medium: "bg-amber-500   text-white",
  warn:   "bg-rose-500    text-white",
};

export function TradeoffView({
  factors,
  title = "Trade-offs",
  compareActions,
}: {
  factors: TradeoffFactor[];
  title?: string;
  /** Optional cross-program "Compare with..." chips. Each onClick can route
   *  to a filtered shortlist or fire a parent-handled callback. */
  compareActions?: { label: string; onClick?: () => void; href?: string }[];
}) {
  return (
    <section className="rounded-3xl border border-stone-200 bg-white px-5 py-5 sm:px-6 sm:py-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">{title}</p>
      </div>
      <ul className="divide-y divide-stone-100">
        {factors.map((f) => {
          const Icon = f.Icon;
          return (
            <li key={f.key} className="py-3 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl border flex-shrink-0 flex items-center justify-center ${TONE_CLASS[f.tone]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm font-bold text-gray-900">{f.label}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${VERDICT_PILL_CLASS[f.tone]}`}>
                    {f.verdict}
                  </span>
                </div>
                {f.note && <p className="text-xs text-gray-600 leading-snug mt-1">{f.note}</p>}
              </div>
            </li>
          );
        })}
      </ul>

      {compareActions && compareActions.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-100">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 mb-2">Compare with</p>
          <div className="flex flex-wrap gap-2">
            {compareActions.map((a) => {
              const cls = "text-xs font-semibold px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hover:border-violet-300 transition-colors";
              return a.href ? (
                <a key={a.label} href={a.href} className={cls}>{a.label}</a>
              ) : (
                <button key={a.label} onClick={a.onClick} className={cls}>{a.label}</button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/** Convenience preset for the icons each factor uses by convention. */
export const TRADEOFF_ICONS = {
  admission: GraduationCap,
  cost: Banknote,
  roi: TrendingUp,
  visa: FileCheck2,
  safety: ShieldCheck,
  scholarship: Trophy,
} as const;

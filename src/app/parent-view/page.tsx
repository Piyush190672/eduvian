"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Users, FileCheck2, TrendingUp, BookmarkCheck, Sparkles } from "lucide-react";
import { SourceProof } from "@/components/SourceProof";

/**
 * /parent-view — the hub a student lands on when they click "Parent-friendly
 * view" from any tool. The current Tier-3 first cut sent each tool to a
 * different target (ROI → /parent-decision, Visa Coach → /sample-parent-report,
 * etc.) which was inconsistent. This page consolidates the destinations
 * behind a single entry point and orients the parent on what they're about
 * to see.
 *
 * A full per-tool render-mode (?parentView=1 on each tool with parent-styled
 * typography + less jargon) is a follow-up; for now this hub at least gives
 * the parent a coherent landing surface.
 */

const ENTRIES: Array<{
  fromSlug: string;
  fromLabel: string;
  destHref: string;
  destLabel: string;
  blurb: string;
  Icon: typeof FileCheck2;
}> = [
  {
    fromSlug: "visa",
    fromLabel: "Visa readiness",
    destHref: "/sample-parent-report",
    destLabel: "See a sample parent report (visa + cost + verdict)",
    blurb: "What the parent decision report looks like for a student who's gathered everything for a Canadian SDS visa. Useful as a template for any country's visa stage.",
    Icon: FileCheck2,
  },
  {
    fromSlug: "roi",
    fromLabel: "Return-on-investment analysis",
    destHref: "/parent-decision",
    destLabel: "Open the Parent Decision Tool",
    blurb: "Re-runs the same math with a parent-grade verdict — budget fit, payback period, post-study work pathways, and a final recommendation card.",
    Icon: TrendingUp,
  },
  {
    fromSlug: "shortlist",
    fromLabel: "University shortlist",
    destHref: "/sample-parent-report",
    destLabel: "See a sample parent report for one of these picks",
    blurb: "Walks through how a parent would evaluate one specific program against the family's stated ceiling and the broader trade-offs.",
    Icon: BookmarkCheck,
  },
];

function findEntry(from: string | null) {
  if (!from) return null;
  return ENTRIES.find((e) => e.fromSlug === from || from.includes(e.fromSlug)) ?? null;
}

function ParentViewBody() {
  const sp = useSearchParams();
  const from = sp.get("from");
  const active = findEntry(from);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-3xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-violet-700 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-200">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Parent-friendly view</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
            Built so you can hand the screen over.
          </h1>
          <p className="text-base text-gray-600 leading-relaxed">
            Most study-abroad decisions are family conversations. We&apos;ve grouped the parent-grade outputs in one place — pick the one that matches what you&apos;ve just been looking at.
          </p>
        </header>

        {/* Recommended destination based on `from` */}
        {active && (
          <section className="mb-8 rounded-3xl border border-violet-200 bg-violet-50 px-6 py-6">
            <div className="flex items-center gap-2 mb-2 text-violet-700">
              <Sparkles className="w-3.5 h-3.5" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Recommended for you</p>
            </div>
            <p className="text-xs text-violet-700 mb-1">Coming from: {active.fromLabel}</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{active.destLabel}</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">{active.blurb}</p>
            <Link
              href={active.destHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors shadow-sm"
            >
              Open it now <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        )}

        <section className="space-y-3 mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700 mb-2">
            {active ? "Or pick a different angle" : "Choose what you'd like the parent to see"}
          </p>
          {ENTRIES.filter((e) => !active || e.fromSlug !== active.fromSlug).map((e) => {
            const Icon = e.Icon;
            return (
              <article key={e.fromSlug} className="rounded-2xl border border-stone-200 bg-white px-5 py-5 hover:border-violet-300 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-200 text-violet-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-violet-700 mb-1">For students arriving from {e.fromLabel}</p>
                    <p className="text-sm font-bold text-gray-900 mb-1">{e.destLabel}</p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-3">{e.blurb}</p>
                    <Link href={e.destHref} className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 hover:text-violet-900">
                      Open <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <SourceProof
          lines={[
            { field: "Program data", source: "Official university pages (verified at source)" },
            { field: "Fees & living costs", source: "Verified or marked as estimated / user-entered" },
            { field: "Visa requirements", source: "Country government / consulate portals" },
            { field: "ROI projections", source: "EduvianAI computed from market-data salaries" },
          ]}
          note="Decision-support outputs. Confirm anything load-bearing with the university or consulate directly before committing money."
        />
      </div>
    </main>
  );
}

export default function ParentViewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>}>
      <ParentViewBody />
    </Suspense>
  );
}

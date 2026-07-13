"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, ShieldCheck, FileCheck2, Banknote, Trophy, GraduationCap, ExternalLink } from "lucide-react";
import type { Lens, RankedProgram } from "@/lib/options-lenses";
import { getCountryFlag, formatCurrency } from "@/lib/utils";
import { SourceProof } from "@/components/SourceProof";
import { DataBadge } from "@/components/DataBadge";
import { NextBestAction } from "@/components/NextBestAction";

// Lens definitions — keep the slugs identical to what TradeoffView passes
// in its compareActions hrefs.

const LENS_META: Record<Lens, { title: string; tagline: string; Icon: typeof TrendingUp }> = {
  safer:       { title: "Safer admit options",            tagline: "Programs with broader admit windows — looser explicit cutoffs or lower selectivity than the average applicant assumes.", Icon: GraduationCap },
  cheaper:     { title: "Lower-cost options",             tagline: "Programs with the lowest verified international tuition. Add living cost for the full picture.",                          Icon: Banknote },
  roi:         { title: "Better-ROI options",             tagline: "Programs where the country's median graduate salary is highest relative to the tuition + living cost over the program length.", Icon: TrendingUp },
  "visa-low":  { title: "Lower visa-complexity options",  tagline: "Programs in countries whose student-visa process has the fewest critical risk flags, lowest financial floors and shortest processing windows.", Icon: FileCheck2 },
  scholarship: { title: "Stronger scholarship-fit options", tagline: "Programs in countries known for fully-funded or major-coverage scholarships (UK Chevening, German DAAD, Irish Hardiman, etc.).", Icon: Trophy },
};


function OptionsBody() {
  const sp = useSearchParams();
  const rawLens = sp.get("lens") || "safer";
  const lens = (["safer","cheaper","roi","visa-low","scholarship"] as Lens[]).includes(rawLens as Lens) ? (rawLens as Lens) : "safer";
  const meta = LENS_META[lens];
  const Icon = meta.Icon;

  // Rankings are computed server-side (GET /api/programs/lens) since the
  // Phase-1 bundle fix — running them client-side required importing the
  // full 10MB programs.ts into the browser bundle.
  const [ranked, setRanked] = useState<RankedProgram[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/programs/lens?lens=${lens}`)
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .then((d: { results?: RankedProgram[] }) => {
        if (!cancelled) setRanked(d.results ?? []);
      })
      .catch(() => {
        if (!cancelled) setRanked([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [lens]);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-blue-800 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center shadow-sm shadow-blue-200">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-800">Compare-with lens</p>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">{meta.title}</h1>
          <p className="text-base text-gray-600 leading-relaxed max-w-3xl">{meta.tagline}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <DataBadge kind={lens === "scholarship" ? "ai_estimate" : "official"} />
            <span className="text-[11px] text-gray-500">
              {lens === "cheaper" && "Ranked by verified annual tuition (excludes programs with no fee on file)"}
              {lens === "safer" && "Ranked by QS placement — unranked or 200+ first"}
              {lens === "roi" && "Ranked by country-median graduate salary ÷ total investment"}
              {lens === "visa-low" && "Ranked by visa complexity composite (lower = easier)"}
              {lens === "scholarship" && "Heuristic ranking by scholarship-availability per country"}
            </span>
          </div>
        </header>

        {/* Lens switcher */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(Object.keys(LENS_META) as Lens[]).map((k) => {
            const active = k === lens;
            return (
              <Link
                key={k}
                href={`/options?lens=${k}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${active ? "bg-blue-900 text-white border-blue-900" : "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"}`}
              >
                {LENS_META[k].title.replace(" options", "")}
              </Link>
            );
          })}
        </div>

        {/* Top results */}
        <section className="space-y-3 mb-10">
          {loading && (
            <div className="rounded-2xl border border-stone-200 bg-white px-6 py-8 text-sm text-gray-400 text-center">
              Ranking programs…
            </div>
          )}
          {!loading && ranked.length === 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-4 text-sm text-amber-800">
              No programs in the DB match this lens yet. The ranker depends on a field we don&apos;t fully cover — check back after the next data refresh.
            </div>
          )}
          {ranked.map((p, i) => (
            <article
              key={p.id}
              className="rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-xs font-bold text-gray-400 tabular-nums w-8 flex-shrink-0 mt-1">{i + 1}.</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                    <p className="text-sm font-bold text-gray-900">
                      <span className="mr-2">{getCountryFlag(p.country)}</span>
                      {p.university_name}
                    </p>
                    <p className="text-xs text-blue-800 font-bold whitespace-nowrap">{p.metric}</p>
                  </div>
                  <p className="text-sm text-gray-700">{p.program_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {p.city ? `${p.city} · ` : ""}{p.country}
                    {p.qs_ranking ? ` · QS #${p.qs_ranking}` : ""}
                    {p.degree_level ? ` · ${p.degree_level}` : ""}
                    {p.field_of_study ? ` · ${p.field_of_study}` : ""}
                  </p>
                  {p.metricSecondary && <p className="text-[11px] text-gray-500 mt-1">{p.metricSecondary}</p>}
                </div>
                {p.program_url && (
                  <a
                    href={p.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 text-xs font-semibold text-blue-800 hover:text-blue-950 inline-flex items-center gap-1"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Source proof */}
        <SourceProof
          lines={[
            { field: "Tuition fees", source: "Official university pages (verified) + estimate-fees backfill" },
            { field: "Salaries", source: "NACE / BLS / national statistics agencies" },
            { field: "Visa complexity", source: "Country consulate portals + EduvianAI risk model" },
            { field: "Scholarship signal", source: "EduvianAI country-level heuristic" },
          ]}
          note="Ranking is a decision-support aid. Confirm tuition, deadlines and admit requirements with the university before relying on the order shown here."
        />

        <div className="mt-8">
          <NextBestAction
            label="Build your own shortlist tailored to your profile"
            href="/get-started"
          />
        </div>
      </div>
    </main>
  );
}

export default function OptionsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500">Loading…</div>}>
      <OptionsBody />
    </Suspense>
  );
}

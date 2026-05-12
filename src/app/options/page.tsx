"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, TrendingUp, ShieldCheck, FileCheck2, Banknote, Trophy, GraduationCap, ExternalLink } from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { SALARY_LOOKUP } from "@/data/roi-data";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { VISA_COMPLEXITY_RANKED } from "@/data/visa-data";
import { getCountryFlag, formatCurrency } from "@/lib/utils";
import { isFeeUnavailable } from "@/lib/format-fee";
import { SourceProof } from "@/components/SourceProof";
import { DataBadge } from "@/components/DataBadge";
import { NextBestAction } from "@/components/NextBestAction";

// Lens definitions — keep the slugs identical to what TradeoffView passes
// in its compareActions hrefs.
type Lens = "safer" | "cheaper" | "roi" | "visa-low" | "scholarship";

const LENS_META: Record<Lens, { title: string; tagline: string; Icon: typeof TrendingUp }> = {
  safer:       { title: "Safer admit options",            tagline: "Programs with broader admit windows — looser explicit cutoffs or lower selectivity than the average applicant assumes.", Icon: GraduationCap },
  cheaper:     { title: "Lower-cost options",             tagline: "Programs with the lowest verified international tuition. Add living cost for the full picture.",                          Icon: Banknote },
  roi:         { title: "Better-ROI options",             tagline: "Programs where the country's median graduate salary is highest relative to the tuition + living cost over the program length.", Icon: TrendingUp },
  "visa-low":  { title: "Lower visa-complexity options",  tagline: "Programs in countries whose student-visa process has the fewest critical risk flags, lowest financial floors and shortest processing windows.", Icon: FileCheck2 },
  scholarship: { title: "Stronger scholarship-fit options", tagline: "Programs in countries known for fully-funded or major-coverage scholarships (UK Chevening, German DAAD, Irish Hardiman, etc.).", Icon: Trophy },
};

// Country mapping from program.country (data) → SalaryCountry (roi-data).
// SALARY_LOOKUP covers 11 destinations — Netherlands programs route to
// null here and are simply excluded from the ROI lens (acceptable; the
// missing-fee policy means we'd rather skip than fabricate a salary).
const SALARY_COUNTRY: Record<string, SalaryCountry | null> = {
  USA: "USA",         UK: "UK",           Canada: "Canada",     Germany: "Germany",
  Australia: "Australia", France: "France", Malaysia: "Malaysia",
  UAE: "UAE",         "New Zealand": "New Zealand", Ireland: "Ireland", Singapore: "Singapore",
  Netherlands: null,
};

// Visa complexity lookup. VISA_COMPLEXITY_RANKED has { country: VisaCountry,
// complexity, ... }. VisaCountry stores its display name in `country.country`.
// Build a country-name → complexity map.
const visaComplexityByCountry: Record<string, number> = {};
for (const v of VISA_COMPLEXITY_RANKED) visaComplexityByCountry[v.country.country] = v.complexity;

// Scholarship-rich countries — heuristic ranking based on well-known
// fully-funded / major-coverage programmes (UK Chevening, German DAAD,
// Irish Hardiman, Dutch Holland, Aussie Awards, US Fulbright). This is a
// pragmatic ranking, not a quantitative measurement; flagged as
// AI estimate in the UI for honesty.
const SCHOLARSHIP_RANK: Record<string, number> = {
  UK: 10, Germany: 10, Ireland: 9, Netherlands: 9, USA: 8, Australia: 8,
  Canada: 7, "New Zealand": 6, France: 6, Singapore: 5, UAE: 4, Malaysia: 4,
};

// Per-field-of-study selectivity bias for the "safer" lens. 1.0 = neutral.
// >1.0 widens the effective admit window (less selective fields), <1.0
// tightens it (more selective fields). Multiplier applies to the program's
// qs_ranking when ranking DESC so a less-selective field at the same uni
// ranks above a more-selective one. Values derived from typical published
// acceptance bands across destination universities (heuristic — flagged
// in UI copy as "AI estimate").
const FIELD_SELECTIVITY: Record<string, number> = {
  "Medicine & Public Health":                0.55,
  "MBA":                                     0.65,
  "Law":                                     0.70,
  "Artificial Intelligence & Data Science":  0.80,
  "Computer Science & IT":                   0.85,
  "Business & Management":                   0.90,
  "Economics & Finance":                     0.90,
  "Engineering (Mechanical/Civil/Electrical)": 1.00,
  "Biotechnology & Life Sciences":           1.05,
  "Natural Sciences":                        1.10,
  "Social Sciences & Humanities":            1.15,
  "Architecture":                            1.10,
  "Arts, Design & Architecture":             1.10,
  "Media & Communications":                  1.15,
  "Environmental & Sustainability Studies":  1.15,
  "Nursing & Allied Health":                 1.20,
  "Agriculture & Veterinary Sciences":       1.20,
  "Hospitality & Tourism":                   1.30,
};
const fieldSelectivity = (f: string | undefined): number =>
  (f && FIELD_SELECTIVITY[f]) ? FIELD_SELECTIVITY[f] : 1.0;

interface RankedProgram {
  id: string;
  university_name: string;
  program_name: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  degree_level: string;
  field_of_study: string;
  duration_months: number;
  annual_tuition_usd: number | null;
  avg_living_cost_usd: number | null;
  program_url?: string;
  metric: string;       // e.g. "$32k/yr tuition" — the headline for this lens
  metricSecondary?: string;
}

function getPrograms() {
  return PROGRAMS as unknown as Array<{
    id?: string;
    university_name: string;
    program_name: string;
    country: string;
    city?: string;
    qs_ranking?: number | null;
    degree_level?: string;
    field_of_study?: string;
    duration_months?: number;
    annual_tuition_usd?: number | null;
    avg_living_cost_usd?: number | null;
    tuition_fee_source?: "verified" | "estimated";
    program_url?: string;
  }>;
}

function rankForLens(lens: Lens): RankedProgram[] {
  const all = getPrograms();
  const out: RankedProgram[] = [];

  if (lens === "cheaper") {
    // Lowest verified tuition. Exclude null / 0.
    const candidates = all.filter((p) => !isFeeUnavailable(p.annual_tuition_usd) && (p.annual_tuition_usd as number) > 0);
    candidates.sort((a, b) => (a.annual_tuition_usd as number) - (b.annual_tuition_usd as number));
    for (const p of candidates.slice(0, 30)) {
      out.push({
        id: p.id || `${p.university_name}|${p.program_name}`,
        university_name: p.university_name,
        program_name: p.program_name,
        country: p.country,
        city: p.city || "",
        qs_ranking: p.qs_ranking ?? null,
        degree_level: p.degree_level || "",
        field_of_study: p.field_of_study || "",
        duration_months: p.duration_months || 24,
        annual_tuition_usd: p.annual_tuition_usd ?? null,
        avg_living_cost_usd: p.avg_living_cost_usd ?? null,
        program_url: p.program_url,
        metric: `${formatCurrency(p.annual_tuition_usd as number)} / yr tuition`,
        metricSecondary: p.avg_living_cost_usd ? `+ ${formatCurrency(p.avg_living_cost_usd)} living` : undefined,
      });
    }
    return out;
  }

  if (lens === "safer") {
    // Heuristic: programs where the university is outside the QS top 100
    // (or has no QS ranking at all) skew toward broader admit windows.
    // Effective sort key is (qs_ranking × FIELD_SELECTIVITY) DESC so a
    // less-selective field at a same-tier uni ranks above a more-selective
    // one. NULL ranks treated as 1500 (most-accessible). Filter widened
    // from top-200 to top-100 so genuinely safe options at well-ranked
    // unis in non-competitive fields aren't excluded outright.
    const candidates = all.filter((p) => !!p.field_of_study && (p.qs_ranking == null || p.qs_ranking > 100));
    const scored = candidates.map((p) => {
      const sel = fieldSelectivity(p.field_of_study);
      const effective = (p.qs_ranking ?? 1500) * sel;
      return { p, sel, effective };
    });
    scored.sort((a, b) => b.effective - a.effective);
    for (const { p, sel } of scored.slice(0, 30)) {
      const selLabel = sel >= 1.15 ? "typically less selective" : sel <= 0.85 ? "typically more selective" : "average selectivity";
      out.push({
        id: p.id || `${p.university_name}|${p.program_name}`,
        university_name: p.university_name,
        program_name: p.program_name,
        country: p.country,
        city: p.city || "",
        qs_ranking: p.qs_ranking ?? null,
        degree_level: p.degree_level || "",
        field_of_study: p.field_of_study || "",
        duration_months: p.duration_months || 24,
        annual_tuition_usd: p.annual_tuition_usd ?? null,
        avg_living_cost_usd: p.avg_living_cost_usd ?? null,
        program_url: p.program_url,
        metric: p.qs_ranking
          ? `QS ~${p.qs_ranking} · ${p.field_of_study} ${selLabel}`
          : `Unranked / regional · ${p.field_of_study} ${selLabel}`,
      });
    }
    return out;
  }

  if (lens === "roi") {
    // Per program, compute the salary-to-investment ratio. Salary from
    // SALARY_LOOKUP (country × field). Investment = tuition + living, times
    // duration in years.
    const candidates = all
      .filter((p) => !isFeeUnavailable(p.annual_tuition_usd) && (p.annual_tuition_usd as number) > 0 && !!p.field_of_study)
      .map((p) => {
        const sc = SALARY_COUNTRY[p.country] ?? null;
        const salary = sc ? SALARY_LOOKUP[sc]?.[p.field_of_study as FieldOfStudy] : null;
        if (!salary) return null;
        const years = Math.max(0.5, (p.duration_months || 24) / 12);
        const tuition = p.annual_tuition_usd as number;
        const living = p.avg_living_cost_usd ?? 0;
        const totalInvestment = (tuition + living) * years;
        const ratio = salary / Math.max(1, totalInvestment);
        return { p, salary, totalInvestment, ratio };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    candidates.sort((a, b) => b.ratio - a.ratio);
    for (const { p, salary, totalInvestment } of candidates.slice(0, 30)) {
      out.push({
        id: p.id || `${p.university_name}|${p.program_name}`,
        university_name: p.university_name,
        program_name: p.program_name,
        country: p.country,
        city: p.city || "",
        qs_ranking: p.qs_ranking ?? null,
        degree_level: p.degree_level || "",
        field_of_study: p.field_of_study || "",
        duration_months: p.duration_months || 24,
        annual_tuition_usd: p.annual_tuition_usd ?? null,
        avg_living_cost_usd: p.avg_living_cost_usd ?? null,
        program_url: p.program_url,
        metric: `Median start ${formatCurrency(salary)}/yr · investment ${formatCurrency(totalInvestment)}`,
        metricSecondary: `Salary-to-investment ratio: ${(salary / Math.max(1, totalInvestment)).toFixed(2)}`,
      });
    }
    return out;
  }

  if (lens === "visa-low") {
    const candidates = all
      .filter((p) => !!p.field_of_study && visaComplexityByCountry[p.country] != null)
      .sort((a, b) => visaComplexityByCountry[a.country] - visaComplexityByCountry[b.country]);
    for (const p of candidates.slice(0, 30)) {
      out.push({
        id: p.id || `${p.university_name}|${p.program_name}`,
        university_name: p.university_name,
        program_name: p.program_name,
        country: p.country,
        city: p.city || "",
        qs_ranking: p.qs_ranking ?? null,
        degree_level: p.degree_level || "",
        field_of_study: p.field_of_study || "",
        duration_months: p.duration_months || 24,
        annual_tuition_usd: p.annual_tuition_usd ?? null,
        avg_living_cost_usd: p.avg_living_cost_usd ?? null,
        program_url: p.program_url,
        metric: `Visa complexity: ${visaComplexityByCountry[p.country]} / 100 (lower = easier)`,
      });
    }
    return out;
  }

  // scholarship — country-rank is the dominant signal, but we now blend in
  // a per-program tuition signal so that lower-tuition programs in the same
  // scholarship-strong country rank ahead of premium ones (partial
  // scholarships cover proportionally more of the sticker, and most major
  // funding programmes — Chevening, DAAD, Hardiman, Holland — are partial).
  // Composite score (higher = better):
  //   country_rank × 10
  //   + tuitionBucket  (0–4: 4 = <$15k/yr verified, 0 = unknown/>$50k)
  //   + (verified fee  ? +1 : 0)
  // Tie-break by qs_ranking ASC so reputable funded options surface first.
  const tuitionBucket = (t: number | null | undefined): number => {
    if (isFeeUnavailable(t) || (t as number) <= 0) return 0;
    const v = t as number;
    if (v < 15000) return 4;
    if (v < 30000) return 3;
    if (v < 50000) return 2;
    return 1;
  };
  const scored = all
    .filter((p) => !!p.field_of_study && SCHOLARSHIP_RANK[p.country] != null)
    .map((p) => {
      const bucket = tuitionBucket(p.annual_tuition_usd);
      const verifiedBonus = p.tuition_fee_source && p.tuition_fee_source !== "estimated" ? 1 : 0;
      const composite = SCHOLARSHIP_RANK[p.country] * 10 + bucket + verifiedBonus;
      return { p, bucket, composite };
    });
  scored.sort((a, b) => b.composite - a.composite || (a.p.qs_ranking ?? 9999) - (b.p.qs_ranking ?? 9999));
  for (const { p, bucket } of scored.slice(0, 30)) {
    const tuitionTag = bucket === 4 ? "low tuition" : bucket === 3 ? "moderate tuition" : bucket >= 1 ? "premium tuition" : "tuition unverified";
    out.push({
      id: p.id || `${p.university_name}|${p.program_name}`,
      university_name: p.university_name,
      program_name: p.program_name,
      country: p.country,
      city: p.city || "",
      qs_ranking: p.qs_ranking ?? null,
      degree_level: p.degree_level || "",
      field_of_study: p.field_of_study || "",
      duration_months: p.duration_months || 24,
      annual_tuition_usd: p.annual_tuition_usd ?? null,
      avg_living_cost_usd: p.avg_living_cost_usd ?? null,
      program_url: p.program_url,
      metric: `${p.country} scholarship rank ${SCHOLARSHIP_RANK[p.country]}/10 · ${tuitionTag}`,
      metricSecondary: "Partial scholarships cover proportionally more of lower tuition. See /scholarships for named programmes.",
    });
  }
  return out;
}

function OptionsBody() {
  const sp = useSearchParams();
  const rawLens = sp.get("lens") || "safer";
  const lens = (["safer","cheaper","roi","visa-low","scholarship"] as Lens[]).includes(rawLens as Lens) ? (rawLens as Lens) : "safer";
  const meta = LENS_META[lens];
  const Icon = meta.Icon;
  const ranked = useMemo(() => rankForLens(lens), [lens]);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-violet-700 mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-sm shadow-violet-200">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Compare-with lens</p>
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
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${active ? "bg-violet-600 text-white border-violet-600" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
              >
                {LENS_META[k].title.replace(" options", "")}
              </Link>
            );
          })}
        </div>

        {/* Top results */}
        <section className="space-y-3 mb-10">
          {ranked.length === 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-4 text-sm text-amber-800">
              No programs in the DB match this lens yet. The ranker depends on a field we don&apos;t fully cover — check back after the next data refresh.
            </div>
          )}
          {ranked.map((p, i) => (
            <article
              key={p.id}
              className="rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-violet-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="text-xs font-bold text-gray-400 tabular-nums w-8 flex-shrink-0 mt-1">{i + 1}.</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
                    <p className="text-sm font-bold text-gray-900">
                      <span className="mr-2">{getCountryFlag(p.country)}</span>
                      {p.university_name}
                    </p>
                    <p className="text-xs text-violet-700 font-bold whitespace-nowrap">{p.metric}</p>
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
                    className="flex-shrink-0 text-xs font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1"
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

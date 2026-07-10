/**
 * Server-side lens rankings for /options ("compare-with" lenses).
 *
 * Moved out of src/app/options/page.tsx in the Phase-1 bundle fix — the
 * page ran these rankings client-side over the full imported programs.ts,
 * which shipped the 10MB database to the browser. The rankings have no
 * per-user inputs, so they now run server-side behind
 * GET /api/programs/lens and the client fetches the top-30 slim rows.
 */

import { INDEXED_PROGRAMS } from "@/data/programs-indexed";
import { SALARY_LOOKUP } from "@/data/roi-data";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { VISA_COMPLEXITY_RANKED } from "@/data/visa-data";
import { formatCurrency } from "@/lib/utils";
import { isFeeUnavailable } from "@/lib/format-fee";

export type Lens = "safer" | "cheaper" | "roi" | "visa-low" | "scholarship";

export const LENSES: readonly Lens[] = ["safer", "cheaper", "roi", "visa-low", "scholarship"];

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

// Visa complexity lookup — country-name → complexity.
const visaComplexityByCountry: Record<string, number> = {};
for (const v of VISA_COMPLEXITY_RANKED) visaComplexityByCountry[v.country.country] = v.complexity;

// Scholarship-rich countries — heuristic ranking based on well-known
// fully-funded / major-coverage programmes. Flagged as AI estimate in UI.
const SCHOLARSHIP_RANK: Record<string, number> = {
  UK: 10, Germany: 10, Ireland: 9, Netherlands: 9, USA: 8, Australia: 8,
  Canada: 7, "New Zealand": 6, France: 6, Singapore: 5, UAE: 4, Malaysia: 4,
};

// Per-field selectivity bias for the "safer" lens. 1.0 = neutral.
const FIELD_SELECTIVITY: Record<string, number> = {
  "Medicine & Public Health":                0.55,
  "MBA":                                     0.65,
  "Law":                                     0.70,
  "Artificial Intelligence":  0.80,
  "Computer Science & IT":                   0.85,
  "Business & Management":                   0.90,
  "Economics & Finance":                     0.90,
  "Engineering (Mechanical/Civil/Electrical)": 1.00,
  "Biotechnology & Life Sciences":           1.05,
  "Natural Sciences":                        1.10,
  "Social Sciences & Humanities":            1.15,
  "Architecture":                            1.10,
  "Arts and Design":                         1.10,
  "Media & Communications":                  1.15,
  "Environmental & Sustainability Studies":  1.15,
  "Nursing & Allied Health":                 1.20,
  "Agriculture & Veterinary Sciences":       1.20,
  "Hospitality & Tourism":                   1.30,
};
const fieldSelectivity = (f: string | undefined): number =>
  (f && FIELD_SELECTIVITY[f]) ? FIELD_SELECTIVITY[f] : 1.0;

export interface RankedProgram {
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
  metric: string;
  metricSecondary?: string;
}

interface LensRow {
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
}

function base(p: LensRow): Omit<RankedProgram, "metric" | "metricSecondary"> {
  return {
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
  };
}

export function rankForLens(lens: Lens): RankedProgram[] {
  const all = INDEXED_PROGRAMS as unknown as LensRow[];
  const out: RankedProgram[] = [];

  if (lens === "cheaper") {
    const candidates = all.filter((p) => !isFeeUnavailable(p.annual_tuition_usd) && (p.annual_tuition_usd as number) > 0);
    candidates.sort((a, b) => (a.annual_tuition_usd as number) - (b.annual_tuition_usd as number));
    for (const p of candidates.slice(0, 30)) {
      out.push({
        ...base(p),
        metric: `${formatCurrency(p.annual_tuition_usd as number)} / yr tuition`,
        metricSecondary: p.avg_living_cost_usd ? `+ ${formatCurrency(p.avg_living_cost_usd)} living` : undefined,
      });
    }
    return out;
  }

  if (lens === "safer") {
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
        ...base(p),
        metric: p.qs_ranking
          ? `QS ~${p.qs_ranking} · ${p.field_of_study} ${selLabel}`
          : `Unranked / regional · ${p.field_of_study} ${selLabel}`,
      });
    }
    return out;
  }

  if (lens === "roi") {
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
        ...base(p),
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
        ...base(p),
        metric: `Visa complexity: ${visaComplexityByCountry[p.country]} / 100 (lower = easier)`,
      });
    }
    return out;
  }

  // scholarship — country rank dominant, blended with a tuition bucket so
  // lower-tuition programs in scholarship-strong countries rank first.
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
      ...base(p),
      metric: `${p.country} scholarship rank ${SCHOLARSHIP_RANK[p.country]}/10 · ${tuitionTag}`,
      metricSecondary: "Partial scholarships cover proportionally more of lower tuition. See /scholarships for named programmes.",
    });
  }
  return out;
}

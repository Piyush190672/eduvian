import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { SALARY_LOOKUP, UNIVERSITY_SALARY_OVERRIDES } from "@/data/roi-data";

export interface ROIInputs {
  university_name: string;
  country: SalaryCountry;
  city: string;
  field_of_study: FieldOfStudy;
  annual_tuition_usd: number;
  avg_living_cost_usd: number;
  duration_months: number;
  scholarship_usd: number;
  expected_salary_usd: number;
  savings_rate_pct: number; // 0–50
}

export interface ROIOutputs {
  total_tuition_usd: number;
  total_living_usd: number;
  total_investment_usd: number;
  monthly_budget_usd: number;
  annual_savings_usd: number;
  monthly_savings_usd: number;
  payback_years: number;
  ten_year_roi_pct: number;
  breakeven_salary_usd: number;
  net_earnings_10yr_usd: number;
}

/**
 * University ranking premium multiplier.
 *
 * Calibrated to real employer-reported salary differentials between ranking
 * tiers. Note: elite institutions with published employment report data are
 * handled by UNIVERSITY_SALARY_OVERRIDES — these premiums apply to the
 * broader long-tail of ranked universities.
 *
 * Tier thresholds (QS World University Rankings):
 *   ≤ 10  → +60%  (MIT, Stanford, Oxford, Cambridge, Imperial, ETH, NUS)
 *   ≤ 25  → +45%  (Harvard #4, Cornell #13, Penn #12, Yale #16, Princeton #17)
 *   ≤ 50  → +32%  (UCL, Columbia, Edinburgh, LSE, Melbourne, UBC, ANU)
 *   ≤ 100 → +20%  (Warwick, Bristol, Manchester, Georgia Tech, Purdue)
 *   ≤ 200 → +10%  (Exeter, Bath, Newcastle, Texas A&M, USC)
 *   ≤ 500 → +4%   (mid-tier ranked: slight premium over the base)
 *   > 500 → −5%   (below-base: lower-ranked institutions earn slightly less)
 *
 * Sources: HESA LEO provider-level data 2022/23; Russell Group Graduate
 * Outcomes 2024; Glassdoor employer-school survey; NACE 2024 school tier
 * analysis; LinkedIn Salary Insights 2024.
 */
export function getRankingPremium(qs_ranking: number | null | undefined): number {
  if (!qs_ranking) return 1.00;
  if (qs_ranking <= 10)  return 1.60;
  if (qs_ranking <= 25)  return 1.45;
  if (qs_ranking <= 50)  return 1.32;
  if (qs_ranking <= 100) return 1.20;
  if (qs_ranking <= 200) return 1.10;
  if (qs_ranking <= 500) return 1.04;
  return 0.95;
}

/**
 * Look up expected starting salary for a given university/country/field.
 *
 * Priority order:
 *  1. UNIVERSITY_SALARY_OVERRIDES[university_name][field]  — most accurate
 *  2. SALARY_LOOKUP[country][field] × getRankingPremium(qs_ranking)  — formula
 *
 * The university_name parameter should be passed whenever available to unlock
 * the institution-specific values sourced from published employment reports.
 */
export function lookupSalary(
  country: SalaryCountry,
  field: FieldOfStudy,
  qs_ranking?: number | null,
  university_name?: string,
): number {
  // 1. Check institution-specific override first
  if (university_name) {
    const override = UNIVERSITY_SALARY_OVERRIDES[university_name]?.[field];
    if (override) return override;
  }

  // 2. Fall back to base salary × ranking premium
  const base =
    SALARY_LOOKUP[country]?.[field] ??
    SALARY_LOOKUP[country]?.["Computer Science & IT"] ??
    50000;
  return Math.round(base * getRankingPremium(qs_ranking));
}

export function calculateROI(inputs: ROIInputs): ROIOutputs {
  const years = inputs.duration_months / 12;

  const total_tuition_usd  = inputs.annual_tuition_usd  * years;
  const total_living_usd   = inputs.avg_living_cost_usd * years;
  const gross_cost         = total_tuition_usd + total_living_usd;
  const total_investment_usd = Math.max(0, gross_cost - inputs.scholarship_usd);

  const monthly_budget_usd  = (inputs.annual_tuition_usd + inputs.avg_living_cost_usd) / 12;
  const annual_savings_usd  = inputs.expected_salary_usd * (inputs.savings_rate_pct / 100);
  const monthly_savings_usd = annual_savings_usd / 12;

  const payback_years =
    annual_savings_usd > 0 ? total_investment_usd / annual_savings_usd : Infinity;

  const net_earnings_10yr_usd = inputs.expected_salary_usd * 10 - total_investment_usd;
  const ten_year_roi_pct =
    total_investment_usd > 0 ? (net_earnings_10yr_usd / total_investment_usd) * 100 : 0;

  const breakeven_salary_usd =
    inputs.savings_rate_pct > 0
      ? total_investment_usd / ((inputs.savings_rate_pct / 100) * 5)
      : 0;

  return {
    total_tuition_usd,
    total_living_usd,
    total_investment_usd,
    monthly_budget_usd,
    annual_savings_usd,
    monthly_savings_usd,
    payback_years,
    ten_year_roi_pct,
    breakeven_salary_usd,
    net_earnings_10yr_usd,
  };
}

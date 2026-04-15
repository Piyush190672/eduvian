import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { SALARY_LOOKUP } from "@/data/roi-data";

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
 * An Oxford graduate commands materially higher starting pay than a graduate
 * of a mid-ranked or post-92 institution — supported by HESA LEO (Longitudinal
 * Education Outcomes) provider-level data and the Russell Group Employability
 * Report 2024.
 *
 * Tier thresholds (QS World University Rankings):
 *   ≤ 10  → +35%  (Oxford, Cambridge, MIT, Stanford, Imperial ≈ top-10)
 *   ≤ 50  → +25%  (UCL, LSE, Edinburgh, Manchester top-50)
 *   ≤ 100 → +15%  (Warwick, Birmingham, Bristol, Leeds, Sheffield)
 *   ≤ 200 → +8%   (Exeter, Aberdeen, Cardiff, Leicester, Surrey)
 *   ≤ 500 → +3%   (De Montfort, Hertfordshire, Coventry, Lincoln zone)
 *   > 500 / unranked → 0%  (base figure with no premium)
 *
 * Sources: HESA LEO provider-level data 2022-23; Russell Group Graduate
 * Outcomes 2024; Glassdoor employer-school analysis.
 */
export function getRankingPremium(qs_ranking: number | null | undefined): number {
  if (!qs_ranking) return 1.00;
  if (qs_ranking <= 10)  return 1.35;
  if (qs_ranking <= 50)  return 1.25;
  if (qs_ranking <= 100) return 1.15;
  if (qs_ranking <= 200) return 1.08;
  if (qs_ranking <= 500) return 1.03;
  return 1.00;
}

export function lookupSalary(
  country: SalaryCountry,
  field: FieldOfStudy,
  qs_ranking?: number | null,
): number {
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

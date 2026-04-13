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

export function lookupSalary(country: SalaryCountry, field: FieldOfStudy): number {
  return SALARY_LOOKUP[country]?.[field] ?? SALARY_LOOKUP[country]?.["Computer Science & IT"] ?? 50000;
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

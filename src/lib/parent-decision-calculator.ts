import type { SalaryCountry } from "@/data/roi-data";
import { SALARY_LOOKUP } from "@/data/roi-data";
import { getRankingPremium } from "@/lib/roi-calculator";
import { PSW_RIGHTS, JOB_MARKET, SAFETY_RATINGS, STUDENT_LIFE } from "@/data/parent-decision-data";
import type { FieldOfStudy } from "@/data/roi-data";

export interface ParentDecisionInputs {
  university_name: string;
  country: SalaryCountry;
  city: string;
  field_of_study: FieldOfStudy;
  qs_ranking: number | null;
  annual_tuition_usd: number;
  avg_living_cost_usd: number;
  duration_months: number;
  budget_usd: number; // parent's annual budget
  scholarship_usd: number;
}

export interface ParentDecisionOutputs {
  // Computed fields
  total_tuition_usd: number;
  total_living_usd: number;
  total_cost_usd: number;
  net_cost_usd: number;
  expected_salary_usd: number;
  savings_per_year_usd: number; // at 30% savings rate
  payback_years: number;
  roi_positive: boolean;
  psw_available: boolean;
  psw_duration: string;
  psw_note: string;
  job_market_rating: "Excellent" | "Good" | "Concerning";
  job_market_detail: string;
  safety_rating: "Excellent" | "Good" | "Concerning";
  safety_detail: string;
  student_life_rating: "Excellent" | "Good" | "Concerning";
  student_life_detail: string;

  // Scoring
  budget_fit_score: number;       // /20
  ranking_score: number;          // /15
  psw_score: number;              // /15
  job_market_score: number;       // /15
  financial_roi_score: number;    // /15
  safety_score: number;           // /10
  student_life_score: number;     // /10
  total_score: number;            // /100
  total_pct: number;              // 0–100

  recommendation: "Excellent Choice" | "Good Choice" | "Re-evaluate";
  recommendation_color: "emerald" | "amber" | "rose";
  recommendation_icon: string;
}

const SAVINGS_RATE = 0.30; // 30% savings assumption

function ratingToScore(rating: "Excellent" | "Good" | "Concerning", max: number): number {
  if (rating === "Excellent") return max;
  if (rating === "Good") return Math.round(max * 0.67);
  return Math.round(max * 0.33);
}

export function calculateParentDecision(inputs: ParentDecisionInputs): ParentDecisionOutputs {
  const years = inputs.duration_months / 12;
  const total_tuition_usd = inputs.annual_tuition_usd * years;
  const total_living_usd = inputs.avg_living_cost_usd * years;
  const total_cost_usd = total_tuition_usd + total_living_usd;
  const net_cost_usd = Math.max(0, total_cost_usd - inputs.scholarship_usd);

  const base_salary_usd =
    SALARY_LOOKUP[inputs.country]?.[inputs.field_of_study] ??
    SALARY_LOOKUP[inputs.country]?.["Computer Science & IT"] ??
    50000;
  const expected_salary_usd = Math.round(base_salary_usd * getRankingPremium(inputs.qs_ranking));

  const savings_per_year_usd = expected_salary_usd * SAVINGS_RATE;
  const payback_years = savings_per_year_usd > 0 ? net_cost_usd / savings_per_year_usd : Infinity;
  const roi_positive = expected_salary_usd * 10 > net_cost_usd;

  const psw = PSW_RIGHTS[inputs.country];
  const job = JOB_MARKET[inputs.country];
  const safety = SAFETY_RATINGS[inputs.country];
  const life = STUDENT_LIFE[inputs.country];

  // ── Scoring ────────────────────────────────────────────────────────────────

  // Budget Fit (20): compare annual_cost vs annual budget
  const annual_cost = (inputs.annual_tuition_usd + inputs.avg_living_cost_usd);
  const budget_ratio = inputs.budget_usd > 0 ? annual_cost / inputs.budget_usd : 2;
  let budget_fit_score: number;
  if (budget_ratio <= 0.8) budget_fit_score = 20;
  else if (budget_ratio <= 1.0) budget_fit_score = 16;
  else if (budget_ratio <= 1.2) budget_fit_score = 10;
  else if (budget_ratio <= 1.5) budget_fit_score = 5;
  else budget_fit_score = 0;

  // QS Ranking (15): top-50=15, top-100=12, top-200=9, top-500=6, unranked/500+=3
  let ranking_score: number;
  if (inputs.qs_ranking === null) ranking_score = 6;
  else if (inputs.qs_ranking <= 50) ranking_score = 15;
  else if (inputs.qs_ranking <= 100) ranking_score = 12;
  else if (inputs.qs_ranking <= 200) ranking_score = 9;
  else if (inputs.qs_ranking <= 500) ranking_score = 6;
  else ranking_score = 3;

  // PSW Rights (15)
  const psw_score = psw.available ? 15 : 3;

  // Job Market (15)
  const job_market_score = ratingToScore(job.rating, 15);

  // Financial ROI (15): payback ≤3=15, ≤5=12, ≤7=9, ≤10=6, >10=3, no ROI=1
  let financial_roi_score: number;
  if (!roi_positive) financial_roi_score = 1;
  else if (payback_years <= 3) financial_roi_score = 15;
  else if (payback_years <= 5) financial_roi_score = 12;
  else if (payback_years <= 7) financial_roi_score = 9;
  else if (payback_years <= 10) financial_roi_score = 6;
  else financial_roi_score = 3;

  // Safety (10)
  const safety_score = ratingToScore(safety.rating, 10);

  // Student Life (10)
  const student_life_score = ratingToScore(life.rating, 10);

  const total_score =
    budget_fit_score + ranking_score + psw_score +
    job_market_score + financial_roi_score + safety_score + student_life_score;

  const total_pct = total_score; // already /100

  let recommendation: "Excellent Choice" | "Good Choice" | "Re-evaluate";
  let recommendation_color: "emerald" | "amber" | "rose";
  let recommendation_icon: string;

  if (total_pct >= 75) {
    recommendation = "Excellent Choice";
    recommendation_color = "emerald";
    recommendation_icon = "✅";
  } else if (total_pct >= 50) {
    recommendation = "Good Choice";
    recommendation_color = "amber";
    recommendation_icon = "👍";
  } else {
    recommendation = "Re-evaluate";
    recommendation_color = "rose";
    recommendation_icon = "⚠️";
  }

  return {
    total_tuition_usd,
    total_living_usd,
    total_cost_usd,
    net_cost_usd,
    expected_salary_usd,
    savings_per_year_usd,
    payback_years,
    roi_positive,
    psw_available: psw.available,
    psw_duration: psw.duration,
    psw_note: psw.note,
    job_market_rating: job.rating,
    job_market_detail: job.detail,
    safety_rating: safety.rating,
    safety_detail: safety.detail,
    student_life_rating: life.rating,
    student_life_detail: life.detail,
    budget_fit_score,
    ranking_score,
    psw_score,
    job_market_score,
    financial_roi_score,
    safety_score,
    student_life_score,
    total_score,
    total_pct,
    recommendation,
    recommendation_color,
    recommendation_icon,
  };
}

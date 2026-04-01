// ─── Student Profile ──────────────────────────────────────────────────────────

export type DegreeLevel = "undergraduate" | "postgraduate";
export type EnglishTest = "ielts" | "toefl" | "pte" | "duolingo" | "none";
export type StdTestUG = "sat" | "act" | "none";
export type StdTestPG = "gre" | "gmat" | "none";
export type BudgetRange =
  | "under_20k"
  | "20k_35k"
  | "35k_50k"
  | "50k_70k"
  | "above_70k";
export type FamilyIncomeINR =
  | "under_5L"
  | "5L_10L"
  | "10L_20L"
  | "20L_40L"
  | "above_40L";
export type VisaHistory =
  | "never_applied"
  | "approved_before"
  | "rejected_before";

export interface StudentProfile {
  // Step 1 — Personal
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  city: string;
  passport_available: "yes" | "in_progress" | "no";
  visa_history: VisaHistory;
  family_abroad: boolean;
  family_income_inr: FamilyIncomeINR;

  // Step 2 — Academic
  degree_level: DegreeLevel;
  current_degree: string; // e.g., "12th Grade", "B.Tech"
  major_stream: string;
  institution_name: string;
  graduation_year: number;
  academic_score_type: "gpa" | "percentage";
  academic_score: number; // GPA out of 4.0 OR percentage
  backlogs: boolean;
  backlog_count: number;
  academic_gap: boolean;
  // grad only
  work_experience_years?: number;
  work_experience_domain?: string;
  research_papers?: boolean;
  research_paper_count?: number;

  // Step 3 — Tests
  english_test: EnglishTest;
  english_score_overall?: number;
  english_score_listening?: number;
  english_score_reading?: number;
  english_score_writing?: number;
  english_score_speaking?: number;
  std_test_ug?: StdTestUG;
  std_test_ug_score?: number;
  std_test_pg?: StdTestPG;
  std_test_pg_score?: number;

  // Step 4 — Preferences
  country_preferences: string[]; // ordered array, up to 10 countries
  target_intake_year: number;
  target_intake_semester: "fall" | "spring" | "summer" | "winter";
  budget_range: BudgetRange;
  intended_field: string;
}

// ─── Program ──────────────────────────────────────────────────────────────────

export type ProgramLevel = "undergraduate" | "postgraduate" | "both";

export interface Program {
  id: string;
  university_name: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  program_name: string;
  degree_level: ProgramLevel;
  duration_months: number;
  field_of_study: string;
  specialization: string;
  annual_tuition_usd: number;
  avg_living_cost_usd: number;
  intake_semesters: string[]; // ["fall", "spring", etc.]
  application_deadline: string | null; // ISO date or "rolling"
  min_gpa: number | null;
  min_percentage: number | null;
  min_ielts: number | null;
  min_toefl: number | null;
  min_pte: number | null;
  min_duolingo: number | null;
  min_gre: number | null;
  min_gmat: number | null;
  min_sat: number | null;
  work_exp_required_years: number | null;
  program_url: string;
  is_active: boolean;
  last_updated: string;
}

// ─── Recommendation Result ────────────────────────────────────────────────────

export type ProgramTier = "safe" | "moderate" | "reach";

export interface ScoredProgram extends Program {
  match_score: number;
  tier: ProgramTier;
  score_breakdown: {
    academic: number;
    english: number;
    budget: number;
    country_rank: number;
    qs_ranking: number;
    intake: number;
    work_experience: number;
    std_test: number;
  };
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  token: string;
  profile: StudentProfile;
  shortlisted_ids: string[];
  created_at: string;
  email_sent: boolean;
}

// ─── Countries ────────────────────────────────────────────────────────────────

export const TARGET_COUNTRIES = [
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "GB", name: "UK", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
] as const;

export type CountryCode = (typeof TARGET_COUNTRIES)[number]["code"];

export const FIELDS_OF_STUDY = [
  "Computer Science & IT",
  "Artificial Intelligence & Data Science",
  "Business & Management",
  "MBA",
  "Engineering (Mechanical/Civil/Electrical)",
  "Biotechnology & Life Sciences",
  "Medicine & Public Health",
  "Law",
  "Architecture & Design",
  "Arts & Humanities",
  "Social Sciences",
  "Economics & Finance",
  "Media & Communications",
  "Education",
  "Environmental Science",
  "Psychology",
  "Nursing & Allied Health",
  "Hospitality & Tourism",
  "Other",
] as const;

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_20k: "Under $20,000/yr",
  "20k_35k": "$20,000 – $35,000/yr",
  "35k_50k": "$35,000 – $50,000/yr",
  "50k_70k": "$50,000 – $70,000/yr",
  above_70k: "$70,000+/yr",
};

export const BUDGET_VALUES: Record<BudgetRange, number> = {
  under_20k: 20000,
  "20k_35k": 35000,
  "35k_50k": 50000,
  "50k_70k": 70000,
  above_70k: 100000,
};

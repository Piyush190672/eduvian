import type { Program, StudentProfile } from "@/lib/types";

/** Strong PG CS profile — every matcher input populated. Override per test. */
export function mkProfile(overrides: Partial<StudentProfile> = {}): StudentProfile {
  return {
    full_name: "Test Student",
    email: "test@example.com",
    phone: "+911234567890",
    nationality: "India",
    city: "Delhi",
    degree_level: "postgraduate",
    intended_field: "Computer Science & IT",
    intended_field_extra: [],
    intended_field_custom: "",
    current_degree: "B.Tech",
    major_stream: "Computer Science & IT",
    institution_name: "Test University",
    graduation_year: 2025,
    academic_score: 85,
    academic_score_type: "percentage",
    backlogs: false,
    backlog_count: 0,
    academic_gap: false,
    research_papers: false,
    research_paper_count: 0,
    work_experience_years: 2,
    english_test: "ielts",
    english_score_overall: 7.5,
    std_test_pg: "gre",
    std_test_pg_score: 325,
    country_preferences: [],
    target_intake_year: 2027,
    target_intake_semester: "fall",
    budget_range: "50k_70k",
    qs_ranking_preference: "any",
    post_study_work_visa: false,
    scholarship_seeking: false,
    canada_college_types: [],
    ...overrides,
  } as unknown as StudentProfile;
}

let seq = 0;

/** Bucket-4 (unranked) CS PG program with a verified fee. Override per test. */
export function mkProgram(overrides: Partial<Program> = {}): Program {
  seq += 1;
  return {
    id: `test_${seq}`,
    university_name: `Test University ${seq}`,
    program_name: `MSc Computer Science ${seq}`,
    country: "UK",
    city: "London",
    qs_ranking: null,
    degree_level: "postgraduate",
    duration_months: 12,
    field_of_study: "Computer Science & IT",
    specialization: "General",
    annual_tuition_usd: 30000,
    annual_tuition_currency: "GBP",
    annual_tuition_amount: 24000,
    avg_living_cost_usd: 15000,
    intake_semesters: [],
    application_deadline: null,
    min_gpa: null,
    min_percentage: null,
    min_ielts: null,
    min_toefl: null,
    min_pte: null,
    min_duolingo: null,
    min_gre: null,
    min_gmat: null,
    min_sat: null,
    work_exp_required_years: 0,
    program_url: `https://example.edu/prog-${seq}`,
    apply_url: null,
    is_active: true,
    last_updated: "2026-07-10T00:00:00.000Z",
    verified_at: "2026-07-10T00:00:00.000Z",
    ...overrides,
  } as unknown as Program;
}

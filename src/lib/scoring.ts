import type {
  StudentProfile,
  Program,
  ScoredProgram,
  ProgramTier,
} from "./types";
import { BUDGET_VALUES, TARGET_COUNTRIES } from "./types";

// ─── Weight configuration ─────────────────────────────────────────────────────

const WEIGHTS = {
  academic: 0.30,
  english: 0.15,
  budget: 0.13,
  country_rank: 0.12,
  qs_ranking: 0.05,
  intake: 0.05,
  work_experience: 0.05,
  std_test: 0.05,
  backlogs: 0.06,
  gap_year: 0.04,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Convert GPA (0–4.0) to percentage (0–100) */
function toPercentage(profile: StudentProfile): number {
  if (profile.academic_score_type === "percentage") {
    return profile.academic_score;
  }
  return (profile.academic_score / 4.0) * 100;
}

/** Convert program's min_gpa to percentage scale */
function programMinToPercentage(program: Program): number {
  if (program.min_percentage !== null) return program.min_percentage;
  if (program.min_gpa !== null) return (program.min_gpa / 4.0) * 100;
  return 0; // no requirement
}

// ─── Individual signal scorers ────────────────────────────────────────────────

function scoreAcademic(profile: StudentProfile, program: Program): number {
  const studentPct = toPercentage(profile);
  const minPct = programMinToPercentage(program);

  if (minPct === 0) return 80; // no cutoff → decent default
  if (studentPct < minPct - 10) return 0; // well below cutoff
  if (studentPct < minPct) return 30; // slightly below
  // Above cutoff — reward margin
  const surplus = studentPct - minPct;
  return clamp(70 + surplus * 1.5);
}

function scoreEnglish(profile: StudentProfile, program: Program): number {
  if (profile.english_test === "none") {
    // No test yet — score based on whether program requires one
    const requiresTest =
      program.min_ielts ||
      program.min_toefl ||
      program.min_pte ||
      program.min_duolingo;
    return requiresTest ? 20 : 70;
  }

  let studentScore = profile.english_score_overall ?? 0;
  let minRequired: number | null = null;
  let maxPossible: number;

  switch (profile.english_test) {
    case "ielts":
      minRequired = program.min_ielts;
      maxPossible = 9;
      break;
    case "toefl":
      minRequired = program.min_toefl;
      maxPossible = 120;
      break;
    case "pte":
      minRequired = program.min_pte;
      maxPossible = 90;
      break;
    case "duolingo":
      minRequired = program.min_duolingo;
      maxPossible = 160;
      break;
    default:
      return 70;
  }

  if (!minRequired) return 80; // program has no english cutoff
  if (studentScore < minRequired) {
    const gap = minRequired - studentScore;
    const gapPct = gap / maxPossible;
    return clamp(40 - gapPct * 200);
  }
  const surplus = (studentScore - minRequired) / maxPossible;
  return clamp(75 + surplus * 100);
}

function scoreBudget(profile: StudentProfile, program: Program): number {
  const totalCost = program.annual_tuition_usd + program.avg_living_cost_usd;
  const budgetMax = BUDGET_VALUES[profile.budget_range];

  if (totalCost <= budgetMax * 0.7) return 100; // well within budget
  if (totalCost <= budgetMax) return 80; // within budget
  if (totalCost <= budgetMax * 1.1) return 50; // slightly over
  if (totalCost <= budgetMax * 1.25) return 25; // moderately over
  return 0; // too expensive
}

function scoreCountryRank(
  profile: StudentProfile,
  program: Program
): number {
  const idx = profile.country_preferences.findIndex(
    (c) =>
      TARGET_COUNTRIES.find((t) => t.code === c)?.name === program.country ||
      c === program.country
  );

  if (idx === -1) return 0; // not in preference list
  // Rank 1 → 100, Rank 2 → 85, Rank 3 → 72, ...
  return clamp(100 - idx * 15);
}

function scoreQsRanking(program: Program): number {
  if (!program.qs_ranking) return 50;
  if (program.qs_ranking <= 50) return 100;
  if (program.qs_ranking <= 100) return 90;
  if (program.qs_ranking <= 200) return 80;
  if (program.qs_ranking <= 400) return 65;
  if (program.qs_ranking <= 600) return 50;
  if (program.qs_ranking <= 800) return 35;
  return 20;
}

function scoreIntake(profile: StudentProfile, program: Program): number {
  const targetSemester = profile.target_intake_semester;
  return program.intake_semesters.includes(targetSemester) ? 100 : 0;
}

function scoreWorkExp(profile: StudentProfile, program: Program): number {
  const required = program.work_exp_required_years ?? 0;
  if (required === 0) return 80;
  const studentYears = profile.work_experience_years ?? 0;
  if (studentYears >= required) return 100;
  if (studentYears >= required - 1) return 60;
  return 20;
}

function scoreStdTest(profile: StudentProfile, program: Program): number {
  if (profile.degree_level === "undergraduate") {
    if (!profile.std_test_ug || profile.std_test_ug === "none") return 60;
    if (profile.std_test_ug === "sat" && program.min_sat) {
      const score = profile.std_test_ug_score ?? 0;
      if (score >= program.min_sat) return 100;
      if (score >= program.min_sat - 50) return 60;
      return 20;
    }
    return 70; // has a score, program doesn't require specific one
  } else {
    if (!profile.std_test_pg || profile.std_test_pg === "none") {
      return program.min_gre || program.min_gmat ? 30 : 70;
    }
    if (profile.std_test_pg === "gre" && program.min_gre) {
      const score = profile.std_test_pg_score ?? 0;
      if (score >= program.min_gre) return 100;
      if (score >= program.min_gre - 10) return 60;
      return 20;
    }
    if (profile.std_test_pg === "gmat" && program.min_gmat) {
      const score = profile.std_test_pg_score ?? 0;
      if (score >= program.min_gmat) return 100;
      if (score >= program.min_gmat - 20) return 60;
      return 20;
    }
    return 70;
  }
}

function scoreBacklogs(profile: StudentProfile): number {
  if (!profile.backlogs) return 100;
  const count = profile.backlog_count ?? 1;
  if (count === 1) return 50;
  if (count <= 3) return 25;
  return 0;
}

function scoreGapYear(profile: StudentProfile): number {
  return profile.academic_gap ? 50 : 100;
}

// ─── Hard disqualifiers ───────────────────────────────────────────────────────

function isHardDisqualified(
  profile: StudentProfile,
  program: Program
): boolean {
  // English score is required and student is significantly below cutoff
  if (profile.english_test !== "none" && profile.english_score_overall) {
    const ieltsOk =
      !program.min_ielts ||
      (profile.english_test === "ielts" &&
        profile.english_score_overall >= program.min_ielts - 1.0);
    const toeflOk =
      !program.min_toefl ||
      (profile.english_test === "toefl" &&
        profile.english_score_overall >= program.min_toefl - 10);
    const pteOk =
      !program.min_pte ||
      (profile.english_test === "pte" &&
        profile.english_score_overall >= program.min_pte - 8);
    const dOk =
      !program.min_duolingo ||
      (profile.english_test === "duolingo" &&
        profile.english_score_overall >= program.min_duolingo - 10);
    // Only disqualify if applicable test is massively below
    const testMap: Record<string, boolean> = {
      ielts: ieltsOk,
      toefl: toeflOk,
      pte: pteOk,
      duolingo: dOk,
    };
    if (!testMap[profile.english_test]) return true;
  }
  return false;
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function scoreProgram(
  profile: StudentProfile,
  program: Program
): ScoredProgram {
  const breakdown = {
    academic: scoreAcademic(profile, program),
    english: scoreEnglish(profile, program),
    budget: scoreBudget(profile, program),
    country_rank: scoreCountryRank(profile, program),
    qs_ranking: scoreQsRanking(program),
    intake: scoreIntake(profile, program),
    work_experience: scoreWorkExp(profile, program),
    std_test: scoreStdTest(profile, program),
    backlogs: scoreBacklogs(profile),
    gap_year: scoreGapYear(profile),
  };

  const match_score = Math.round(
    breakdown.academic * WEIGHTS.academic +
      breakdown.english * WEIGHTS.english +
      breakdown.budget * WEIGHTS.budget +
      breakdown.country_rank * WEIGHTS.country_rank +
      breakdown.qs_ranking * WEIGHTS.qs_ranking +
      breakdown.intake * WEIGHTS.intake +
      breakdown.work_experience * WEIGHTS.work_experience +
      breakdown.std_test * WEIGHTS.std_test +
      breakdown.backlogs * WEIGHTS.backlogs +
      breakdown.gap_year * WEIGHTS.gap_year
  );

  let tier: ProgramTier;
  if (match_score >= 80) tier = "safe";
  else if (match_score >= 50) tier = "reach";
  else tier = "ambitious";

  return { ...program, match_score, tier, score_breakdown: breakdown };
}

export function recommendPrograms(
  profile: StudentProfile,
  programs: Program[]
): ScoredProgram[] {
  // Only recommend programs matching degree level AND intended field of study
  const filtered = programs.filter(
    (p) =>
      p.is_active &&
      (p.degree_level === profile.degree_level || p.degree_level === "both") &&
      p.field_of_study === profile.intended_field
  );

  const scored = filtered
    .filter((p) => !isHardDisqualified(profile, p))
    .map((p) => scoreProgram(profile, p))
    .filter((p) => p.match_score >= 25)
    .sort((a, b) => b.match_score - a.match_score);

  // Cap to best 5 safe + 10 reach + 5 ambitious (20 total)
  const safe      = scored.filter((p) => p.tier === "safe").slice(0, 5);
  const reach     = scored.filter((p) => p.tier === "reach").slice(0, 10);
  const ambitious = scored.filter((p) => p.tier === "ambitious").slice(0, 5);

  return [...safe, ...reach, ...ambitious];
}

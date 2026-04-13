import type {
  StudentProfile,
  Program,
  ScoredProgram,
  ProgramTier,
} from "./types";
import { BUDGET_VALUES, TARGET_COUNTRIES, COUNTRY_REGIONS } from "./types";

// ─── Weight configuration ─────────────────────────────────────────────────────
// Academic 40%, Budget 20%, Std Test 10%, English/Scholarship/Intake/
// Backlogs/Gap Year each 5%. Work Exp 5% for PG only (normalized for UG).

const WEIGHTS_PG = {
  academic:        0.40,
  budget:          0.20,
  std_test:        0.10,
  english:         0.05,
  scholarship:     0.05,
  intake:          0.05,
  backlogs:        0.05,
  gap_year:        0.05,
  work_experience: 0.05,
};

// UG has no work_exp — normalize the remaining 8 signals to sum to 1.0
const UG_TOTAL = 0.95; // sum without work_experience
const WEIGHTS_UG = {
  academic:        0.40 / UG_TOTAL,
  budget:          0.20 / UG_TOTAL,
  std_test:        0.10 / UG_TOTAL,
  english:         0.05 / UG_TOTAL,
  scholarship:     0.05 / UG_TOTAL,
  intake:          0.05 / UG_TOTAL,
  backlogs:        0.05 / UG_TOTAL,
  gap_year:        0.05 / UG_TOTAL,
  work_experience: 0,
};

// ─── Countries offering strong Post-Study Work Visas ─────────────────────────
const PSW_COUNTRIES = new Set([
  "UK", "Australia", "Canada", "USA", "Germany", "Ireland", "New Zealand",
]);

// ─── Related fields (expand pool for students) ────────────────────────────────
const RELATED_FIELDS: Record<string, string[]> = {
  "Computer Science & IT":                   ["Artificial Intelligence & Data Science"],
  "Artificial Intelligence & Data Science":  ["Computer Science & IT"],
  "Business & Management":                   ["MBA", "Economics & Finance"],
  "MBA":                                     ["Business & Management"],
  "Economics & Finance":                     ["Business & Management"],
  "Biotechnology & Life Sciences":           ["Natural Sciences", "Medicine & Public Health"],
  "Natural Sciences":                        ["Biotechnology & Life Sciences", "Environmental & Sustainability Studies"],
  "Medicine & Public Health":                ["Nursing & Allied Health", "Biotechnology & Life Sciences"],
  "Nursing & Allied Health":                 ["Medicine & Public Health"],
  "Environmental & Sustainability Studies":  ["Natural Sciences"],
  "Media & Communications":                  ["Arts, Design & Architecture", "Social Sciences & Humanities"],
  "Arts, Design & Architecture":             ["Media & Communications"],
  "Social Sciences & Humanities":            ["Media & Communications"],
  "Agriculture & Veterinary Sciences":       ["Natural Sciences"],
  "Hospitality & Tourism":                   ["Business & Management"],
  "Engineering (Mechanical/Civil/Electrical)": [],
  "Law": [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Convert any score type to percentage (0–100) for comparison */
function toPercentage(profile: StudentProfile): number {
  switch (profile.academic_score_type) {
    case "percentage":
    case "igcse": // A*=95, A=85, B=75, C=65, D=55, E=45
      return profile.academic_score;
    case "ib":
      return (profile.academic_score / 45) * 100;
    case "gpa":
    default:
      return (profile.academic_score / 4.0) * 100;
  }
}

/** Convert program's min requirement to percentage scale */
function programMinToPercentage(program: Program): number {
  if (program.min_percentage !== null) return program.min_percentage;
  if (program.min_gpa !== null) return (program.min_gpa / 4.0) * 100;
  return 0;
}

// ─── Individual signal scorers ────────────────────────────────────────────────

function scoreAcademic(profile: StudentProfile, program: Program): number {
  const studentPct = toPercentage(profile);
  const minPct = programMinToPercentage(program);

  // Prestige penalty: top-ranked universities have holistic admissions —
  // meeting minimum GPA does NOT guarantee admission. Apply an offset to
  // reflect the reality that selection is highly competitive.
  const qs = program.qs_ranking ?? 9999;
  const prestigePenalty = qs <= 25 ? 20 : qs <= 50 ? 15 : qs <= 100 ? 10 : qs <= 200 ? 5 : 0;

  if (minPct === 0) return clamp(72 - prestigePenalty);
  if (studentPct < minPct - 12) return 0;
  if (studentPct < minPct - 5)  return clamp(20 - prestigePenalty);
  if (studentPct < minPct)      return clamp(40 - prestigePenalty);

  const surplus = studentPct - minPct;
  return clamp(58 - prestigePenalty + surplus * 1.4);
}

function scoreEnglish(profile: StudentProfile, program: Program): number {
  if (profile.english_test === "none") {
    const requiresTest = program.min_ielts || program.min_toefl || program.min_pte || program.min_duolingo;
    return requiresTest ? 20 : 70;
  }

  const s = profile.english_score_overall ?? 0;
  let minRequired: number | null = null;
  let maxPossible: number;

  switch (profile.english_test) {
    case "ielts":    minRequired = program.min_ielts;    maxPossible = 9;   break;
    case "toefl":    minRequired = program.min_toefl;    maxPossible = 120; break;
    case "pte":      minRequired = program.min_pte;      maxPossible = 90;  break;
    case "duolingo": minRequired = program.min_duolingo; maxPossible = 160; break;
    default: return 70;
  }

  if (!minRequired) return 80;
  if (s < minRequired) {
    const gapPct = (minRequired - s) / maxPossible;
    return clamp(40 - gapPct * 200);
  }
  const surplus = (s - minRequired) / maxPossible;
  return clamp(75 + surplus * 100);
}

function scoreBudget(profile: StudentProfile, program: Program): number {
  const totalCost = program.annual_tuition_usd + program.avg_living_cost_usd;
  const budgetMax = BUDGET_VALUES[profile.budget_range];
  const ratio = totalCost / budgetMax;

  if (ratio <= 0.70) return 100;
  if (ratio <= 1.00) return 82;
  if (ratio <= 1.15) return 58;
  if (ratio <= 1.35) return 35;
  if (ratio <= 1.60) return 18;
  if (ratio <= 2.00) return 8;
  return 2;
}

/**
 * Scholarship score — proxy based on QS ranking.
 * Top-ranked universities offer more merit aid; well-ranked programs are
 * more likely to bridge budget gaps with scholarships.
 */
function scoreScholarship(program: Program): number {
  if (!program.qs_ranking) return 45; // unranked colleges: moderate scholarship availability
  if (program.qs_ranking <= 50)  return 100;
  if (program.qs_ranking <= 100) return 90;
  if (program.qs_ranking <= 200) return 78;
  if (program.qs_ranking <= 400) return 62;
  if (program.qs_ranking <= 600) return 48;
  return 35;
}

function scoreIntake(profile: StudentProfile, program: Program): number {
  return program.intake_semesters.includes(profile.target_intake_semester) ? 100 : 0;
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
    return 70;
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

// ─── Hard disqualifiers (English floor) ──────────────────────────────────────

function isHardDisqualified(profile: StudentProfile, program: Program): boolean {
  if (profile.english_test !== "none" && profile.english_score_overall) {
    const s = profile.english_score_overall;
    const ok: Record<string, boolean> = {
      ielts:    !program.min_ielts    || (profile.english_test === "ielts"    && s >= program.min_ielts - 1.5),
      toefl:    !program.min_toefl    || (profile.english_test === "toefl"    && s >= program.min_toefl - 15),
      pte:      !program.min_pte      || (profile.english_test === "pte"      && s >= program.min_pte - 12),
      duolingo: !program.min_duolingo || (profile.english_test === "duolingo" && s >= program.min_duolingo - 15),
    };
    if (!ok[profile.english_test]) return true;
  }
  return false;
}

// ─── Main scoring function ────────────────────────────────────────────────────

export function scoreProgram(profile: StudentProfile, program: Program): ScoredProgram {
  const isPG = profile.degree_level === "postgraduate";
  const W = isPG ? WEIGHTS_PG : WEIGHTS_UG;

  const breakdown = {
    academic:        scoreAcademic(profile, program),
    english:         scoreEnglish(profile, program),
    budget:          scoreBudget(profile, program),
    scholarship:     scoreScholarship(program),
    intake:          scoreIntake(profile, program),
    work_experience: isPG ? scoreWorkExp(profile, program) : 0,
    std_test:        scoreStdTest(profile, program),
    backlogs:        scoreBacklogs(profile),
    gap_year:        scoreGapYear(profile),
  };

  const match_score = Math.round(
    breakdown.academic        * W.academic +
    breakdown.budget          * W.budget +
    breakdown.std_test        * W.std_test +
    breakdown.english         * W.english +
    breakdown.scholarship     * W.scholarship +
    breakdown.intake          * W.intake +
    breakdown.work_experience * W.work_experience +
    breakdown.backlogs        * W.backlogs +
    breakdown.gap_year        * W.gap_year
  );

  // ── Prestige-adjusted tier thresholds ──────────────────────────────────────
  // Higher-ranked universities have lower admit rates and holistic admissions —
  // a high match score does not mean "safe". These aggressive thresholds ensure
  // top-25 programs almost always appear as Reach/Ambitious even for strong profiles.
  const qs = program.qs_ranking ?? 9999;
  let safeMin: number;
  let reachMin: number;
  if      (qs <=  25) { safeMin = 92; reachMin = 70; }
  else if (qs <=  50) { safeMin = 89; reachMin = 66; }
  else if (qs <= 100) { safeMin = 86; reachMin = 62; }
  else if (qs <= 200) { safeMin = 82; reachMin = 57; }
  else if (qs <= 400) { safeMin = 78; reachMin = 52; }
  else if (qs <= 700) { safeMin = 74; reachMin = 47; }
  else                { safeMin = 68; reachMin = 42; }

  let tier: ProgramTier;
  if (match_score >= safeMin)  tier = "safe";
  else if (match_score >= reachMin) tier = "reach";
  else tier = "ambitious";

  return { ...program, match_score, tier, score_breakdown: breakdown };
}

// ─── Region matching helper ───────────────────────────────────────────────────

function matchesRegion(programCity: string, countryCode: string, selectedRegionCodes: string[]): boolean {
  if (!selectedRegionCodes || selectedRegionCodes.length === 0) return true;
  const regionDefs = COUNTRY_REGIONS[countryCode] ?? [];
  const city = programCity ?? "";

  for (const regionCode of selectedRegionCodes) {
    const def = regionDefs.find((r) => r.code === regionCode);
    if (!def || def.match.length === 0) return true;

    if (countryCode === "US") {
      const stateMatch = city.match(/,\s*([A-Z]{2})$/);
      const state = stateMatch ? stateMatch[1] : "";
      if (def.match.includes(state)) return true;
    } else {
      for (const keyword of def.match) {
        if (city.toLowerCase().includes(keyword.toLowerCase())) return true;
      }
    }
  }
  return false;
}

export function recommendPrograms(profile: StudentProfile, programs: Program[]): ScoredProgram[] {
  const TOTAL = 20;
  const QUOTA = { safe: 6, reach: 10, ambitious: 4 };

  // ── QS ranking preference threshold ──────────────────────────────────────
  const qsThresholdMap: Record<string, number> = {
    top_50: 50, top_100: 100, top_200: 200, top_500: 500,
  };
  const qsPref = profile.qs_ranking_preference ?? "any";
  const qsMax = qsThresholdMap[qsPref]; // undefined if "any"

  // ── Countries allowed ─────────────────────────────────────────────────────
  const allowedCountries = new Set(
    profile.country_preferences
      .map((code) => TARGET_COUNTRIES.find((t) => t.code === code)?.name)
      .filter(Boolean) as string[]
  );

  // ── PSW filter ────────────────────────────────────────────────────────────
  const requirePSW = profile.post_study_work_visa === true;

  // ── Canada selected — college types opted in by user
  const canadaSelected = profile.country_preferences.includes("CA");
  const canadaCollegeTypes = new Set(profile.canada_college_types ?? []);

  // ── Allowed fields ────────────────────────────────────────────────────────
  const relatedFields = RELATED_FIELDS[profile.intended_field] ?? [];
  const allowedFields = new Set([profile.intended_field, ...relatedFields]);

  // Build reverse map: country name → country code
  const nameToCode = Object.fromEntries(TARGET_COUNTRIES.map((t) => [t.name, t.code]));

  // ── Hard filters ──────────────────────────────────────────────────────────
  const filtered = programs.filter((p) => {
    if (!p.is_active) return false;

    // Degree level filter
    const isCanadian = p.country === "Canada";
    let degreeOk: boolean;
    if (p.degree_level === "both") {
      degreeOk = true;
    } else if (p.degree_level === "diploma" || p.degree_level === "pg_diploma") {
      // Diploma/PG diploma only shown for Canadian programs when user has opted in
      degreeOk = isCanadian && canadaSelected && canadaCollegeTypes.has(p.degree_level);
    } else {
      degreeOk = p.degree_level === profile.degree_level;
    }
    if (!degreeOk) return false;

    if (!allowedFields.has(p.field_of_study)) return false;
    if (allowedCountries.size > 0 && !allowedCountries.has(p.country)) return false;

    // Hard filter: QS ranking preference
    if (qsMax !== undefined) {
      if (p.qs_ranking === null || p.qs_ranking > qsMax) return false;
    }

    // Hard filter: Post-study work visa
    if (requirePSW && !PSW_COUNTRIES.has(p.country)) return false;

    // Hard filter: region preference
    const countryCode = nameToCode[p.country];
    if (countryCode && profile.country_region_preferences) {
      const selectedRegions = profile.country_region_preferences[countryCode] ?? [];
      if (!matchesRegion(p.city, countryCode, selectedRegions)) return false;
    }

    return true;
  });

  const scored = filtered
    .filter((p) => !isHardDisqualified(profile, p))
    .map((p) => scoreProgram(profile, p))
    .filter((p) => p.match_score >= 10)
    .sort((a, b) => b.match_score - a.match_score);

  const pools = {
    safe:      scored.filter((p) => p.tier === "safe"),
    reach:     scored.filter((p) => p.tier === "reach"),
    ambitious: scored.filter((p) => p.tier === "ambitious"),
  };

  const alloc = {
    safe:      Math.min(QUOTA.safe, pools.safe.length),
    reach:     Math.min(QUOTA.reach, pools.reach.length),
    ambitious: Math.min(QUOTA.ambitious, pools.ambitious.length),
  };

  let remaining = TOTAL - alloc.safe - alloc.reach - alloc.ambitious;
  const surplus = (t: keyof typeof alloc) => pools[t].length - alloc[t];
  for (const t of ["reach", "safe", "ambitious"] as const) {
    if (remaining <= 0) break;
    const extra = Math.min(remaining, surplus(t));
    if (extra > 0) { alloc[t] += extra; remaining -= extra; }
  }

  return [
    ...pools.safe.slice(0, alloc.safe),
    ...pools.reach.slice(0, alloc.reach),
    ...pools.ambitious.slice(0, alloc.ambitious),
  ];
}

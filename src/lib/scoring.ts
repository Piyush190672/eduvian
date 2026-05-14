import type {
  StudentProfile,
  Program,
  ScoredProgram,
  ProgramTier,
} from "./types";
import { BUDGET_VALUES, TARGET_COUNTRIES, COUNTRY_REGIONS, OTHER_FIELD_SENTINEL } from "./types";
import { getPrestigeBucket } from "./prestige";

// ─── Weight configuration ─────────────────────────────────────────────────────
// PG: Academic 35%, Budget 20%, Std Test 10%, English/Scholarship/Intake/
//     Backlogs/Gap Year/Work Exp/Research Paper each 5%. (Research Paper
//     added 13 May 2026; academic reduced 5% to fund it.)
// UG: Same as PG minus Work Exp and Research Paper, normalised to 1.0.

const WEIGHTS_PG = {
  academic:        0.35,
  budget:          0.20,
  std_test:        0.10,
  english:         0.05,
  scholarship:     0.05,
  intake:          0.05,
  backlogs:        0.05,
  gap_year:        0.05,
  work_experience: 0.05,
  research_paper:  0.05,
};

// UG has no work_exp and no research_paper — normalize the remaining 8
// signals to sum to 1.0.
const UG_TOTAL = 0.95; // sum without work_experience (research_paper is PG-only)
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
  research_paper:  0,
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
  "Media & Communications":                  ["Arts, Design & Architecture", "Architecture", "Social Sciences & Humanities"],
  "Arts, Design & Architecture":             ["Architecture", "Media & Communications"],
  // Architecture was split out as its own stream after the legacy compound
  // "Arts, Design & Architecture" tag had accumulated ~340 programs. The
  // related-set pulls in both the legacy compound and Engineering so that
  // students who pick the new "Architecture" stream still match against
  // existing tagged programs until they're re-classified.
  "Architecture":                            ["Arts, Design & Architecture", "Engineering (Mechanical/Civil/Electrical)"],
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

/** Convert program's min requirement to percentage scale.
 *  Prefers realistic_min_* over min_* when present (top-100 sweep,
 *  13 May 2026) — realistic_min_* is the typical median admit bar
 *  whereas min_* is the lenient published floor. */
function programMinToPercentage(program: Program): number {
  const pct = program.realistic_min_percentage ?? program.min_percentage;
  if (pct !== null && pct !== undefined) return pct;
  const gpa = program.realistic_min_gpa ?? program.min_gpa;
  if (gpa !== null && gpa !== undefined) return (gpa / 4.0) * 100;
  return 0;
}

/** Tiny helper: prefer realistic_* over min_* when present. */
function effectiveMin(
  program: Program,
  key: "min_ielts" | "min_toefl" | "min_gre" | "min_gmat" | "min_sat",
): number | null {
  const realisticKey = ("realistic_" + key) as
    | "realistic_min_ielts" | "realistic_min_toefl" | "realistic_min_gre"
    | "realistic_min_gmat"  | "realistic_min_sat";
  const r = program[realisticKey];
  if (r !== null && r !== undefined) return r;
  return program[key];
}

// ─── Individual signal scorers ────────────────────────────────────────────────

function scoreAcademic(profile: StudentProfile, program: Program): number {
  const studentPct = toPercentage(profile);
  const minPct = programMinToPercentage(program);

  // Prestige penalty: top-ranked universities have holistic admissions —
  // meeting minimum GPA does NOT guarantee admission. Apply an offset to
  // reflect the reality that selection is highly competitive. Uses real
  // acceptance_rate from the universities sidecar where available
  // (Stage 2 backfilled 134 USA unis from College Scorecard, 14 May
  // 2026); falls back to QS-bucket where not.
  const { prestigePenalty } = getPrestigeBucket(program);

  if (minPct === 0) return clamp(72 - prestigePenalty);
  if (studentPct < minPct - 12) return 0;
  if (studentPct < minPct - 5)  return clamp(20 - prestigePenalty);
  if (studentPct < minPct)      return clamp(40 - prestigePenalty);

  const surplus = studentPct - minPct;
  return clamp(58 - prestigePenalty + surplus * 1.4);
}

function scoreEnglish(profile: StudentProfile, program: Program): number {
  // User explicitly hasn't taken any English test. Render this as a gap
  // regardless of whether the program page publishes a minimum — every
  // international study program effectively requires one even when not
  // explicitly stated. The exact value 5 is a SENTINEL that the UI
  // (ProgramCard.getVerdict) treats specially to show
  // "Take an English test (IELTS / TOEFL / PTE / Duolingo)" rather than
  // the generic "Below requirement" copy.
  if (profile.english_test === "none") return 5;

  // Defensive: an empty number input fires parseFloat("") = NaN, and a
  // legacy row with english_score_overall = 0 used to drop straight into
  // the "score < min" branch and render the signal as a red gap. If the
  // user has selected a test type but no usable score is on file, treat
  // as "data not yet available" → neutral partial (70) instead of gap.
  const sRaw = Number(profile.english_score_overall);
  if (!Number.isFinite(sRaw) || sRaw <= 0) return 70;
  const s = sRaw;

  let minRequired: number | null = null;
  let maxPossible: number;

  switch (profile.english_test) {
    case "ielts":    minRequired = effectiveMin(program, "min_ielts"); maxPossible = 9;   break;
    case "toefl":    minRequired = effectiveMin(program, "min_toefl"); maxPossible = 120; break;
    case "pte":      minRequired = program.min_pte;                    maxPossible = 90;  break;
    case "duolingo": minRequired = program.min_duolingo;               maxPossible = 160; break;
    default: return 70;
  }

  // No minimum for the user's chosen test type. Two interpretations:
  //   a) Program lists NO English-test minima at all → not required → 80.
  //   b) Program lists OTHER tests (e.g. only TOEFL) but not the user's
  //      → the user's test isn't accepted → SENTINEL 7 (gap with
  //      "only XX accepted" verdict in the UI).
  if (!minRequired) {
    const programAcceptsAnyTest =
      (effectiveMin(program, "min_ielts") ?? 0) > 0 ||
      (effectiveMin(program, "min_toefl") ?? 0) > 0 ||
      (program.min_pte      ?? 0) > 0 ||
      (program.min_duolingo ?? 0) > 0;
    if (programAcceptsAnyTest) return 7; // mismatch — handled in UI
    return 80;                            // not required — partial/strong
  }
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
 * Scholarship signal.
 *
 * Previously this was a QS-ranking proxy ("higher rank → more aid"), which
 * silently inflated per-program scholarship scores even though we have no
 * per-program scholarship data. That was misleading.
 *
 * Until programs.ts carries explicit scholarship-availability data per
 * program / university, this signal returns a NEUTRAL 50 — it contributes
 * the same constant to every program's match_score and doesn't claim
 * availability one way or the other. The UI no longer shows this row in
 * the score breakdown (see CheckMatchPanel.tsx). Country-level scholarship
 * guidance remains at /options?lens=scholarship and /scholarships.
 */
function scoreScholarship(_program: Program): number {
  return 50;
}

function scoreIntake(profile: StudentProfile, program: Program): number {
  // Programs that fail the intake hard filter are excluded before scoring,
  // so by the time we get here the only cases are:
  //  - intake_semesters non-empty AND includes target → match (100)
  //  - intake_semesters empty (data missing on our side, hard filter
  //    deliberately let it through) → neutral 60 to avoid penalising the
  //    program for our data gap. The signal row labels this case as
  //    "Intake to be checked".
  // The explicit-false branch is defensive only — it shouldn't fire post-
  // filter but keeps the function correct if called in isolation.
  if (!Array.isArray(program.intake_semesters) || program.intake_semesters.length === 0) {
    return 60;
  }
  return program.intake_semesters.includes(profile.target_intake_semester) ? 100 : 0;
}

function scoreWorkExp(profile: StudentProfile, program: Program): number {
  const required = program.work_exp_required_years ?? 0;
  let base: number;
  if (required === 0) {
    base = 80;
  } else {
    const studentYears = profile.work_experience_years ?? 0;
    if (studentYears >= required) base = 100;
    else if (studentYears >= required - 1) base = 60;
    else base = 20;
  }

  // For MBA programs, blend the years-based signal with the leadership
  // signal (50 / 50). For non-MBA programs the base score is returned
  // unchanged. This is how the new MBA leadership / team-size questions
  // feed into match_score without requiring a new top-level signal +
  // weight redistribution.
  if (program.field_of_study === "MBA") {
    const leadership = scoreMbaLeadership(profile, program);
    return Math.round((base + leadership) / 2);
  }
  return base;
}

/**
 * MBA-specific leadership match. Returns a neutral 100 for any non-MBA
 * program so the signal effectively only affects MBA matches.
 *
 * Top MBA programs (Harvard, Wharton, INSEAD, LBS, etc.) explicitly weight
 * leadership experience and team size. We don't carry per-program "wants
 * leaders" data, so we use QS rank as a proxy: the higher the rank, the
 * stronger the assumed weight. Within that frame:
 *
 *   - User HAS team-leading experience    → boost top programs, neutral mid-tier
 *   - User has NO team-leading experience → drag top programs down,
 *                                            mid-tier stays viable
 *   - Larger team size adds extra credit for the leading=true branch.
 */
function scoreMbaLeadership(profile: StudentProfile, program: Program): number {
  if (program.field_of_study !== "MBA") return 100; // not applicable

  const qs = program.qs_ranking ?? 9999;
  const isTopMba    = qs <= 50;
  const isStrongMba = qs <= 200;
  const led         = profile.mba_team_leading_experience === true;
  const size        = profile.mba_max_team_size ?? 0;

  if (led) {
    let base = isTopMba ? 100 : isStrongMba ? 90 : 80;
    // Team-size bonus, capped — caps prevent over-fitting to one outlier.
    if (size >= 10)      base = Math.min(100, base + 5);
    else if (size >= 5)  base = Math.min(100, base + 2);
    return base;
  }

  // No team-leading experience
  if (isTopMba)    return 40;   // top MBAs strongly expect leadership
  if (isStrongMba) return 65;   // mid-top MBAs still prefer it
  return 80;                    // smaller / regional MBAs are more forgiving
}

function scoreStdTest(profile: StudentProfile, program: Program): number {
  // Score-on-file helper. Same NaN / 0 defence as scoreEnglish — if the
  // user selected a test type but the numeric score didn't make it into
  // the profile, don't render the signal as a red gap; return null and
  // let the caller fall back to the neutral-partial branch.
  const validScore = (raw: unknown): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  if (profile.degree_level === "undergraduate") {
    const minSat = effectiveMin(program, "min_sat");
    if (!minSat) return 100;
    if (!profile.std_test_ug || profile.std_test_ug === "none") return 30;
    if (profile.std_test_ug === "sat") {
      const score = validScore(profile.std_test_ug_score);
      if (score == null) return 70;
      if (score >= minSat) return 100;
      if (score >= minSat - 50) return 60;
      return 20;
    }
    return 70;
  } else {
    const minGre  = effectiveMin(program, "min_gre");
    const minGmat = effectiveMin(program, "min_gmat");
    const requiresGreOrGmat = (minGre ?? 0) > 0 || (minGmat ?? 0) > 0;
    if (!requiresGreOrGmat) return 100;
    if (!profile.std_test_pg || profile.std_test_pg === "none") return 30;
    if (profile.std_test_pg === "gre" && minGre) {
      const score = validScore(profile.std_test_pg_score);
      if (score == null) return 70;
      if (score >= minGre) return 100;
      if (score >= minGre - 10) return 60;
      return 20;
    }
    if (profile.std_test_pg === "gmat" && minGmat) {
      const score = validScore(profile.std_test_pg_score);
      if (score == null) return 70;
      if (score >= minGmat) return 100;
      if (score >= minGmat - 20) return 60;
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

/**
 * Research-paper signal (PG only). Published research is a meaningful
 * differentiator at competitive PG admissions, especially for research-
 * stream Masters and any PhD pipeline. Graduated by count rather than
 * binary because a sustained track record (3+ papers) is materially
 * stronger than a single co-authored undergrad publication.
 *
 * Returns 0 if research_papers is false / unset OR count is 0 — so a
 * student who didn't publish carries the full 5% drag rather than a
 * neutral mid-score that would understate the signal.
 */
function scoreResearchPaper(profile: StudentProfile): number {
  if (!profile.research_papers) return 0;
  const count = profile.research_paper_count ?? 0;
  if (count <= 0) return 0;
  if (count === 1) return 60;
  if (count === 2) return 85;
  return 100;
}

// ─── Hard disqualifiers (English floor + academic floor + budget ceiling) ────
//
// 12 May 2026: academic + budget moved from soft scoring to hard filters.
// Programs the student isn't academically eligible for, or whose total
// annual cost exceeds 110% of the user's selected budget, are now
// excluded from the matched results entirely rather than just penalised.

function isHardDisqualified(profile: StudentProfile, program: Program): boolean {
  // English floor — student must be within shouting distance of the
  // published minimum. Buffer reflects scale-conversion noise; tighter
  // than the academic floor below because English tests are deterministic.
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

  // Academic floor — strict. If the program publishes a minimum GPA or
  // percentage and the student's converted score is below it, exclude
  // the program. No buffer: the user asked for results that match the
  // stated eligibility criteria, not "close enough" results.
  const minPct = programMinToPercentage(program);
  if (minPct > 0) {
    const studentPct = toPercentage(profile);
    if (studentPct < minPct) return true;
  }

  // Budget ceiling — total annual cost (tuition + living) > 110% of the
  // user's budget. Programs with no fee data (annual_tuition_usd <= 0
  // or null-cast) are NOT disqualified — we can't make a budget claim
  // without a fee. The ROI / Parent tools surface the missing-fee state
  // separately via the editable-input path.
  const tuition = program.annual_tuition_usd;
  if (typeof tuition === "number" && tuition > 0) {
    const totalCost = tuition + (program.avg_living_cost_usd ?? 0);
    const budgetMax = BUDGET_VALUES[profile.budget_range];
    if (budgetMax > 0 && totalCost > budgetMax * 1.10) return true;
  }

  // Intake availability — exclude programs that explicitly DON'T offer
  // the user's target intake semester. Same data-honest pattern as the
  // academic / budget filters above: only fires when the program's
  // intake_semesters list is non-empty AND missing the target. Programs
  // with empty / missing intake data stay (surfaced as "Intake to be
  // checked" in the signal row).
  if (Array.isArray(program.intake_semesters) && program.intake_semesters.length > 0) {
    if (!program.intake_semesters.includes(profile.target_intake_semester)) return true;
  }

  // MBA-only: minimum work experience is a STRICT hard filter. Top MBA
  // programs explicitly require 2-5 years of work experience and routinely
  // reject below-floor applicants. Applied only to MBA programs; non-MBA
  // PG programs keep the existing soft work-exp signal. Data-honest: only
  // fires when work_exp_required_years is a positive number — programs
  // with null/0 don't publish a floor.
  if (program.field_of_study === "MBA") {
    const required = program.work_exp_required_years ?? 0;
    if (required > 0) {
      const studentYears = profile.work_experience_years ?? 0;
      if (studentYears < required) return true;
    }
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
    research_paper:  isPG ? scoreResearchPaper(profile) : 0,
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
    breakdown.gap_year        * W.gap_year +
    breakdown.research_paper  * W.research_paper
  );

  // ── Prestige-adjusted tier thresholds ──────────────────────────────────────
  // Higher-selectivity universities have holistic admissions — a high match
  // score does not mean "safe" at MIT or Oxford. The bucket below comes from
  // real acceptance_rate where the universities sidecar has it (134 USA unis
  // as of 14 May 2026), and falls back to QS rank where not. Aligned with
  // the prestigePenalty subtracted in scoreAcademic so a program lands in
  // the same selectivity band across both signals.
  const { safeMin, reachMin } = getPrestigeBucket(program);

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
  // STRICT 12 May 2026: only the user's exact intended_field qualifies.
  // The previous RELATED_FIELDS expansion bucketed MBA with Economics &
  // Finance, Computer Science with AI/DS, etc. — defensible for breadth
  // but the user asked for "strictly stick to the programs in the intended
  // stream only". RELATED_FIELDS is kept above the function for the rare
  // case a future flag wants to re-enable it; not used here.
  //
  // "Others" branch (13 May 2026): when the user picks "Others" in the
  // form and types a free-text stream (intended_field_custom), the strict
  // set-match doesn't work — no program in the DB has "Others" as
  // field_of_study. Fall back to a case-insensitive substring search
  // across each program's field_of_study + program_name. Empty custom
  // text excludes everything (the form should already block submit, but
  // be defensive).
  const isCustomField = profile.intended_field === OTHER_FIELD_SENTINEL;
  const customQuery   = isCustomField
    ? (profile.intended_field_custom ?? "").trim().toLowerCase()
    : "";
  const allowedFields = isCustomField ? null : new Set([profile.intended_field]);

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

    if (isCustomField) {
      if (!customQuery) return false;
      const haystack = `${p.field_of_study} ${p.program_name}`.toLowerCase();
      if (!haystack.includes(customQuery)) return false;
    } else if (!allowedFields!.has(p.field_of_study)) {
      return false;
    }

    // BPS GBC filter — when the user is pursuing Psychology at the
    // postgraduate level AND has confirmed their undergraduate degree is
    // NOT BPS-accredited, hide programs that require BPS (typically UK
    // Health / Clinical / Counselling / Forensic / Educational /
    // Occupational / Sport / Neuro Psychology Masters). Programs with
    // requires_bps_accreditation undefined or false are unaffected.
    if (
      profile.intended_field === "Psychology"
      && profile.degree_level === "postgraduate"
      && profile.bps_accredited === false
      && p.requires_bps_accreditation === true
    ) return false;
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

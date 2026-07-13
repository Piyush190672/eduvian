import type { StudentProfile } from "./types";

// ─── Profile Category Types ───────────────────────────────────────────────────

export type ProfileCategory =
  | "SUPER STRONG Profile"
  | "VERY STRONG Profile"
  | "STRONG Profile"
  | "AVERAGE Profile"
  | "Weak Profile";

export interface ProfileCriterion {
  label: string;
  passed: boolean;    // points > 0
  partial: boolean;   // 0 < points < maxPoints
  points: number;     // actual points awarded
  maxPoints: number;  // max possible for this criterion
  /** Share of the final 0-100 score this criterion is worth when fully met. */
  weight: number;
}

export type PillarKey = "admissibility" | "financial" | "visa";

export interface ProfilePillar {
  key: PillarKey;
  label: string;
  /** How much of the final 0-100 score this pillar carries. */
  weight: number;
  /** This pillar's own achievement, normalised 0-100. */
  score: number;
  criteria: ProfileCriterion[];
}

export interface ProfileScoreResult {
  /** Weighted score, 0-100. */
  score: number;
  /** Always 100 — kept for back-compat callers. */
  total: number;
  /** Same as `score`, kept for back-compat. */
  percentage: number;
  category: ProfileCategory;
  /** Flat list across all pillars — kept for back-compat (email / PDF). */
  criteria: ProfileCriterion[];
  /** The three labelled sub-scores (Phase 2 rework, 10 July 2026). */
  pillars: ProfilePillar[];
}

// ─── Per-criterion point helpers ─────────────────────────────────────────────

/** Academic score — 6-tier graded scale (0–5 points).
 *  Percentage / GPA / CGPA-10 / IGCSE (stored as % equivalent) each use a
 *  band table calibrated to the same rough percentile cuts. IB uses its
 *  own 0–45 scale. */
function academicPoints(profile: StudentProfile): number {
  const s = profile.academic_score;
  switch (profile.academic_score_type) {
    case "percentage":
    case "igcse": // stored as percentage equiv: A*=95, A=85, B=75
      if (s > 90)  return 5;
      if (s >= 85) return 4;
      if (s >= 75) return 3;
      if (s >= 65) return 2;
      if (s >= 60) return 1;
      return 0;
    case "gpa":
      if (s > 3.75) return 5;
      if (s >= 3.5) return 4;
      if (s >= 3.3) return 3;
      if (s >= 3.1) return 2;
      if (s >= 3.0) return 1;
      return 0;
    case "cgpa_10":
      // Indian 10-point CGPA (added 10 July 2026 — the ICP's most common
      // scale was previously forced through "percentage").
      if (s > 9.0)  return 5;
      if (s >= 8.5) return 4;
      if (s >= 7.5) return 3;
      if (s >= 6.5) return 2;
      if (s >= 6.0) return 1;
      return 0;
    case "ib":
      if (s > 42)  return 5;
      if (s >= 40) return 4;
      if (s >= 37) return 3;
      if (s >= 35) return 2;
      if (s >= 32) return 1;
      return 0;
    default:
      return 0;
  }
}

/** Family income — 4-tier graded scale (0–3 points).
 *  Current buckets (17 May 2026): under_12L=0, 12L_24L=1, 25L_49L=2, above_50L=3.
 *  Legacy buckets kept here so old submissions keep their historical scores:
 *    above_40L → 3, 20L_40L → 2, 10L_20L → 1, under_5L / 5L_10L → 0.
 *  (10L_20L stays at 1pt under the new banding too — close enough to 12-24L
 *  that re-mapping would shift active users' ratings; leaving as-is.) */
function incomePoints(profile: StudentProfile): number {
  switch (profile.family_income_inr) {
    // Current
    case "above_50L": return 3;
    case "25L_49L":   return 2;
    case "12L_24L":   return 1;
    case "under_12L": return 0;
    // Legacy
    case "above_40L": return 3;
    case "20L_40L":   return 2;
    case "10L_20L":   return 1;
    default:          return 0; // under_5L, 5L_10L, undefined
  }
}

/** Backlogs — 4-tier graded scale (0–3 points). */
function backlogPoints(profile: StudentProfile): number {
  if (!profile.backlogs) return 3;
  const count = profile.backlog_count ?? 1;
  if (count < 2) return 2;
  if (count <= 5) return 1;
  return 0;
}

/** English test — graded 0–4 band scale per test. Previously binary
 *  (IELTS ≥ 7 → 1 else 0) which scored an IELTS 6.5 the same as no test
 *  at all, and scored Duolingo 0 unconditionally. */
function englishPoints(profile: StudentProfile): number {
  if (profile.english_test === "none" || !profile.english_score_overall) return 0;
  const s = profile.english_score_overall;
  const bands = (cuts: [number, number, number, number]): number => {
    if (s >= cuts[0]) return 4;
    if (s >= cuts[1]) return 3;
    if (s >= cuts[2]) return 2;
    if (s >= cuts[3]) return 1;
    return 0;
  };
  switch (profile.english_test) {
    case "ielts":    return bands([7.5, 7.0, 6.5, 6.0]);
    case "toefl":    return bands([110, 100, 90, 80]);
    case "pte":      return bands([76, 66, 58, 50]);
    case "duolingo": return bands([135, 120, 105, 95]);
    default:         return 0;
  }
}

/** Standard test — graded 0–3 band scale on the test the student actually
 *  sat (SAT / ACT for UG, GRE / GMAT for PG). Previously binary AND scored
 *  ACT 0 unconditionally. GMAT bands are on the Focus scale (205–805). */
function stdTestPoints(profile: StudentProfile): number {
  const bands = (score: number, cuts: [number, number, number]): number => {
    if (score >= cuts[0]) return 3;
    if (score >= cuts[1]) return 2;
    if (score >= cuts[2]) return 1;
    return 0;
  };
  if (profile.degree_level === "undergraduate") {
    const score = profile.std_test_ug_score ?? 0;
    if (profile.std_test_ug === "sat") return bands(score, [1500, 1400, 1300]);
    if (profile.std_test_ug === "act") return bands(score, [33, 30, 27]);
    return 0;
  }
  const score = profile.std_test_pg_score ?? 0;
  if (profile.std_test_pg === "gre")  return bands(score, [330, 320, 310]);
  if (profile.std_test_pg === "gmat") return bands(score, [685, 645, 605]);
  return 0;
}

/** Research & experience — 0–2 points, same weight for UG and PG.
 *  PG: one point each for published research and real work experience.
 *  UG: research papers only (work experience isn't expected pre-degree);
 *  a second paper earns the second point. */
function researchExperiencePoints(profile: StudentProfile): number {
  const research = profile.research_papers === true ? 1 : 0;
  if (profile.degree_level === "postgraduate") {
    const work = (profile.work_experience_years ?? 0) > 0 ? 1 : 0;
    return research + work;
  }
  const secondPaper = research && (profile.research_paper_count ?? 1) >= 2 ? 1 : 0;
  return research + secondPaper;
}

/** Intake within 18 months — 1 pt if yes, 0 if further away. */
function intakeWithin18Months(profile: StudentProfile): number {
  const semesterMonth: Record<string, number> = {
    spring: 2, summer: 6, fall: 9, winter: 1,
  };
  const month = semesterMonth[profile.target_intake_semester] ?? 9;
  const intakeDate = new Date(profile.target_intake_year, month - 1, 1);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() + 18);
  return intakeDate <= cutoff ? 1 : 0;
}

/** Annual budget — 2 pts if > $35K, 1 pt if $25K–$35K, 0 below $25K. */
function budgetPoints(profile: StudentProfile): number {
  switch (profile.budget_range) {
    case "above_70k":
    case "50k_70k":
    case "35k_50k":  return 2;
    case "25k_35k":
    case "20k_35k":  return 1; // legacy 20k_35k mapped to same band
    default:         return 0; // under_25k + legacy under_20k
  }
}

/** Passport — graded: in hand 2, applied 1, none 0. */
function passportPoints(profile: StudentProfile): number {
  if (profile.passport_available === "yes") return 2;
  if (profile.passport_available === "in_progress") return 1;
  return 0;
}

/** Visa history — graded: approved before 2, first-timer 1, rejected 0. */
function visaHistoryPoints(profile: StudentProfile): number {
  if (profile.visa_history === "approved_before") return 2;
  if (profile.visa_history === "never_applied") return 1;
  return 0;
}

// ─── Weight allocation (Phase 2 rework, 10 July 2026) ────────────────────────
//
// Final score is a weighted 0-100 percentage, organised into three labelled
// pillars. Identical weights for UG and PG so ratings are comparable across
// degree levels. Changes vs the 15 May spec:
//   - Family income 10 → 5 (weak signal, not in the student's control)
//   - Backlogs 5 → 8 (admissions officers genuinely weigh these)
//   - English / standard tests graded 0-4 / 0-3 instead of binary
//   - "Already researched universities" (self-reported checkbox) and
//     "family abroad" dropped from the score entirely
//   - Passport / visa-history graded instead of binary
//
//   ADMISSIBILITY (70): academic 40 · english 10 · std test 7 ·
//                       backlogs 8 · no gap 2 · research/experience 3
//   FINANCIAL    (18): budget 10 · family income 5 · no scholarship need 3
//   VISA         (12): passport 5 · visa history 4 · intake ≤18mo 3
//   ─────────────────────────────────────────────────────────────
//   TOTAL        100

const PILLAR_LABELS: Record<PillarKey, string> = {
  admissibility: "Admissibility",
  financial: "Financial readiness",
  visa: "Visa readiness",
};

// ─── Scorer ───────────────────────────────────────────────────────────────────

function mk(label: string, points: number, maxPoints: number, weight: number): ProfileCriterion {
  return {
    label,
    points,
    maxPoints,
    weight,
    passed: points > 0,
    partial: points > 0 && points < maxPoints,
  };
}

function mkPillar(key: PillarKey, criteria: ProfileCriterion[]): ProfilePillar {
  const weight = criteria.reduce((s, c) => s + c.weight, 0);
  const achieved = criteria.reduce(
    (s, c) => s + (c.maxPoints > 0 ? c.points / c.maxPoints : 0) * c.weight,
    0,
  );
  return {
    key,
    label: PILLAR_LABELS[key],
    weight,
    score: Math.round((achieved / weight) * 100),
    criteria,
  };
}

export function scoreStudentProfile(profile: StudentProfile): ProfileScoreResult {
  const pillars: ProfilePillar[] = [
    mkPillar("admissibility", [
      mk("Academic score",         academicPoints(profile),           5, 40),
      mk("English test score",     englishPoints(profile),            4, 10),
      mk("Standard test score",    stdTestPoints(profile),            3,  7),
      mk("Backlogs",               backlogPoints(profile),            3,  8),
      mk("No academic gap year",   !profile.academic_gap ? 1 : 0,     1,  2),
      mk("Research & experience",  researchExperiencePoints(profile), 2,  3),
    ]),
    mkPillar("financial", [
      mk("Annual budget",          budgetPoints(profile),             2, 10),
      mk("Family income",          incomePoints(profile),             3,  5),
      mk("No scholarship required", profile.scholarship_seeking === false ? 1 : 0, 1, 3),
    ]),
    mkPillar("visa", [
      mk("Passport",               passportPoints(profile),           2,  5),
      mk("Visa history",           visaHistoryPoints(profile),        2,  4),
      mk("Target intake within next 18 months", intakeWithin18Months(profile), 1, 3),
    ]),
  ];

  const criteria = pillars.flatMap((p) => p.criteria);

  // Weighted sum of (points / maxPoints) × weight → 0–100.
  const weighted = criteria.reduce(
    (s, c) => s + (c.maxPoints > 0 ? c.points / c.maxPoints : 0) * c.weight,
    0,
  );
  const percentage = Math.round(weighted);

  return {
    score: percentage,
    total: 100,
    percentage,
    category: deriveCategory(percentage),
    criteria,
    pillars,
  };
}

/** Category buckets — anchored on weighted percentage (0-100). */
function deriveCategory(percentage: number): ProfileCategory {
  if (percentage >= 85) return "SUPER STRONG Profile";
  if (percentage >= 70) return "VERY STRONG Profile";
  if (percentage >= 55) return "STRONG Profile";
  if (percentage >= 40) return "AVERAGE Profile";
  return "Weak Profile";
}

/** Ordered list (weakest → strongest) for rating-scale UI rendering. */
export const CATEGORY_LADDER: ProfileCategory[] = [
  "Weak Profile",
  "AVERAGE Profile",
  "STRONG Profile",
  "VERY STRONG Profile",
  "SUPER STRONG Profile",
];

// ─── Improvement simulator (Phase 2 #14, 10 July 2026) ───────────────────────
//
// Simulates the profile with ONE actionable change applied, re-scores it,
// and reports the point delta. Only levers the student can actually pull
// are simulated — income, backlogs, gap years and visa history are history
// and are deliberately excluded.

export interface ImprovementLever {
  key: string;
  /** Short imperative headline, e.g. "Retake IELTS, target 7.0+". */
  label: string;
  /** One supporting sentence — what to do and why it moves the score. */
  detail: string;
  /** Points added to the overall 0-100 rating if achieved. */
  delta: number;
  /** In-app tool that helps with this lever, if one exists. */
  href?: string;
  linkLabel?: string;
}

/** Next English target: the lowest band-cut strictly above the current
 *  score, expressed in the test the student already sat (or IELTS 7.0 as
 *  the default recommendation when no test was taken). */
function nextEnglishTarget(profile: StudentProfile): { patch: Partial<StudentProfile>; label: string; detail: string } | null {
  const CUTS: Record<string, { cuts: number[]; name: string; fmt: (n: number) => string }> = {
    ielts:    { cuts: [6.0, 6.5, 7.0, 7.5], name: "IELTS",    fmt: (n) => n.toFixed(1) },
    toefl:    { cuts: [80, 90, 100, 110],   name: "TOEFL",    fmt: String },
    pte:      { cuts: [50, 58, 66, 76],     name: "PTE",      fmt: String },
    duolingo: { cuts: [95, 105, 120, 135],  name: "Duolingo", fmt: String },
  };
  if (profile.english_test === "none" || !profile.english_score_overall) {
    return {
      patch: { english_test: "ielts", english_score_overall: 7.0 },
      label: "Take an English test, target IELTS 7.0+",
      detail: "A verified English score is one of the fastest signals to add — most programs require one anyway.",
    };
  }
  const t = CUTS[profile.english_test];
  if (!t) return null;
  const target = t.cuts.find((c) => c > (profile.english_score_overall ?? 0));
  if (target === undefined) return null; // already top band
  return {
    patch: { english_score_overall: target },
    label: `Retake ${t.name}, target ${t.fmt(target)}+`,
    detail: `Moving from ${t.fmt(profile.english_score_overall)} to ${t.fmt(target)} lifts you a full band in the rating.`,
  };
}

/** Next standard-test target on the test the student sat, or a sensible
 *  first-attempt target when none was taken. */
function nextStdTestTarget(profile: StudentProfile): { patch: Partial<StudentProfile>; label: string; detail: string } | null {
  const isUG = profile.degree_level === "undergraduate";
  const CUTS: Record<string, number[]> = {
    sat: [1300, 1400, 1500], act: [27, 30, 33],
    gre: [310, 320, 330],    gmat: [605, 645, 685],
  };
  const test = isUG ? profile.std_test_ug : profile.std_test_pg;
  const score = (isUG ? profile.std_test_ug_score : profile.std_test_pg_score) ?? 0;
  if (!test || test === "none") {
    // Medicine UG: SAT/ACT is a US/Canada/Singapore-market test. UK/AU/NZ
    // medicine admission runs on UCAT (+ interviews) — pushing SAT at a
    // UK-bound medicine aspirant is wrong (founder report, 14 Jul 2026).
    if (isUG) {
      const fields = [profile.intended_field, ...(profile.intended_field_extra ?? [])];
      const isMedicine = fields.includes("Medicine") || fields.includes("Medicine & Public Health");
      const satMarkets = ["USA", "Canada", "Singapore"];
      const wantsSatMarket = (profile.country_preferences ?? []).some((c) => satMarkets.includes(c));
      if (isMedicine && !wantsSatMarket) return null;
    }
    return isUG
      ? {
          patch: { std_test_ug: "sat", std_test_ug_score: 1400 },
          label: "Take the SAT, target 1400+",
          detail: "A competitive SAT score strengthens US and Singapore applications in particular.",
        }
      : {
          patch: { std_test_pg: "gre", std_test_pg_score: 320 },
          label: "Take the GRE, target 320+",
          detail: "A 320+ GRE keeps selective US programs within reach and never hurts elsewhere.",
        };
  }
  const cuts = CUTS[test];
  if (!cuts) return null;
  const target = cuts.find((c) => c > score);
  if (target === undefined) return null;
  const name = test.toUpperCase();
  return {
    patch: isUG ? { std_test_ug_score: target } : { std_test_pg_score: target },
    label: `Retake ${name}, target ${target}+`,
    detail: `Moving from ${score} to ${target} lifts you a full band in the rating.`,
  };
}

export function computeImprovementLevers(profile: StudentProfile): ImprovementLever[] {
  const base = scoreStudentProfile(profile).score;
  const levers: ImprovementLever[] = [];

  const simulate = (patch: Partial<StudentProfile>): number =>
    scoreStudentProfile({ ...profile, ...patch }).score - base;

  const english = nextEnglishTarget(profile);
  if (english) {
    levers.push({
      key: "english",
      label: english.label,
      detail: english.detail,
      delta: simulate(english.patch),
      href: "/english-test-lab",
      linkLabel: "Practice in the English Test Lab",
    });
  }

  const stdTest = nextStdTestTarget(profile);
  if (stdTest) {
    levers.push({
      key: "std_test",
      label: stdTest.label,
      detail: stdTest.detail,
      delta: simulate(stdTest.patch),
    });
  }

  if (profile.research_papers !== true) {
    levers.push({
      key: "research",
      label: "Publish or co-author a research paper",
      detail: "Even a conference paper or a published capstone project counts as a research signal.",
      delta: simulate({ research_papers: true, research_paper_count: 1 }),
    });
  }

  if (profile.degree_level === "postgraduate" && (profile.work_experience_years ?? 0) === 0) {
    levers.push({
      key: "work",
      label: "Add work experience or a substantial internship",
      detail: "Even one year of relevant experience strengthens postgraduate applications.",
      delta: simulate({ work_experience_years: 1 }),
    });
  }

  if (profile.passport_available !== "yes") {
    levers.push({
      key: "passport",
      label: profile.passport_available === "in_progress" ? "Collect your passport" : "Apply for your passport now",
      detail: "A passport in hand removes the single most common last-minute application blocker.",
      delta: simulate({ passport_available: "yes" }),
    });
  }

  if (intakeWithin18Months(profile) === 0) {
    levers.push({
      key: "intake",
      label: "Target an intake within the next 18 months",
      detail: "A concrete near-term intake signals readiness to both universities and visa officers.",
      delta: simulate({
        target_intake_year: new Date().getFullYear() + 1,
        target_intake_semester: "fall",
      }),
    });
  }

  return levers
    .filter((l) => l.delta >= 1)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface CategoryStyle {
  bg: string;
  text: string;
  border: string;
  emoji: string;
  description: string;
  /** Short label used in the rating-scale ladder (1-2 words). */
  shortLabel: string;
}

// Emerald-forward ladder (Phase 2 rework): strength reads as green, not
// rose/orange "heat". Semantic palette only — emerald good, amber medium,
// rose needs-work. Descriptions state readiness signals, never admission
// or visa outcome likelihood (we can't honestly promise either).
export function getCategoryStyle(category: ProfileCategory): CategoryStyle {
  switch (category) {
    case "SUPER STRONG Profile":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-400",
        emoji: "🌟",
        description: "Exceptional readiness signals across academics, tests, finances and documentation",
        shortLabel: "Super Strong",
      };
    case "VERY STRONG Profile":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-300",
        emoji: "⭐",
        description: "Strong signals on most parameters — well positioned for selective programs",
        shortLabel: "Very Strong",
      };
    case "STRONG Profile":
      return {
        bg: "bg-teal-50",
        text: "text-teal-700",
        border: "border-teal-300",
        emoji: "💪",
        description: "Solid foundation — the right program selection matters more than profile gaps",
        shortLabel: "Strong",
      };
    case "AVERAGE Profile":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-300",
        emoji: "📊",
        description: "Some way to go — the improvement levers below show where points are waiting",
        shortLabel: "Some way to go",
      };
    case "Weak Profile":
      return {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-300",
        emoji: "📈",
        description: "Needs focused work — start with the highest-impact improvement levers below",
        shortLabel: "Needs Improvement",
      };
  }
}

/** Per-criterion colour scale, driven by points relative to maxPoints.
 *  Implements the user's spec (15 May 2026):
 *    - 5-pt criteria (Academic):
 *        5 dark green · 4 green · 3 light green · 2 light orange ·
 *        1 darker orange · 0 light red
 *    - 3-pt criteria (Family income, Backlogs):
 *        3 dark green · 2 light green · 1 light orange · 0 light red
 *    - 2-pt criteria (Budget, Universities researched):
 *        2 green · 1 light orange · 0 light red
 *    - 1-pt criteria (binary): present → green · absent → light red
 *
 *  Returns Tailwind class fragments for `bg` / `border` / `text` so the
 *  card can compose them onto a tile. */
export interface CriterionColor {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
}

export function getCriterionColor(points: number, maxPoints: number): CriterionColor {
  // Background-driven palette — the tile itself reads as the colour, with
  // a darker matching border and dark legible text. Earlier the scale
  // used very pale -50 shades that made the box look uncoloured.
  if (maxPoints >= 5) {
    // Academic — 6 tiers (0 light-red → 5 dark green). Second-from-top
    // dropped to emerald-200 (was emerald-300) so the gap from the
    // emerald-500 top tier reads clearly; 3-pt tier follows down to
    // emerald-100 to preserve the gradient.
    const scale: CriterionColor[] = [
      { bg: "bg-rose-300",    border: "border-rose-500",    text: "text-rose-950",    iconColor: "text-rose-800"    }, // 0 light red
      { bg: "bg-orange-400",  border: "border-orange-600",  text: "text-orange-950",  iconColor: "text-orange-900"  }, // 1 darker orange
      { bg: "bg-orange-300",  border: "border-orange-500",  text: "text-orange-950",  iconColor: "text-orange-800"  }, // 2 light orange
      { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-950", iconColor: "text-emerald-700" }, // 3 lightest green
      { bg: "bg-emerald-200", border: "border-emerald-400", text: "text-emerald-950", iconColor: "text-emerald-700" }, // 4 light green (one shade lighter than before)
      { bg: "bg-emerald-500", border: "border-emerald-700", text: "text-white",       iconColor: "text-emerald-50"  }, // 5 dark green
    ];
    return scale[Math.max(0, Math.min(5, points))];
  }
  if (maxPoints >= 4) {
    // English test — 5 tiers (0 light-red → 4 dark green).
    const scale: CriterionColor[] = [
      { bg: "bg-rose-300",    border: "border-rose-500",    text: "text-rose-950",    iconColor: "text-rose-800"    }, // 0
      { bg: "bg-orange-300",  border: "border-orange-500",  text: "text-orange-950",  iconColor: "text-orange-800"  }, // 1
      { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-950", iconColor: "text-emerald-700" }, // 2
      { bg: "bg-emerald-200", border: "border-emerald-400", text: "text-emerald-950", iconColor: "text-emerald-700" }, // 3
      { bg: "bg-emerald-500", border: "border-emerald-700", text: "text-white",       iconColor: "text-emerald-50"  }, // 4
    ];
    return scale[Math.max(0, Math.min(4, points))];
  }
  if (maxPoints >= 3) {
    // Family income, Backlogs, Standard test — 4 tiers (0 light-red → 3 dark green).
    // Second-from-top dropped to emerald-200 to keep clear separation
    // from the dark-green top tier.
    const scale: CriterionColor[] = [
      { bg: "bg-rose-300",    border: "border-rose-500",    text: "text-rose-950",    iconColor: "text-rose-800"    }, // 0 light red
      { bg: "bg-orange-300",  border: "border-orange-500",  text: "text-orange-950",  iconColor: "text-orange-800"  }, // 1 light orange
      { bg: "bg-emerald-200", border: "border-emerald-400", text: "text-emerald-950", iconColor: "text-emerald-700" }, // 2 light green (was emerald-300)
      { bg: "bg-emerald-500", border: "border-emerald-700", text: "text-white",       iconColor: "text-emerald-50"  }, // 3 dark green
    ];
    return scale[Math.max(0, Math.min(3, points))];
  }
  if (maxPoints >= 2) {
    const scale: CriterionColor[] = [
      { bg: "bg-rose-300",    border: "border-rose-500",    text: "text-rose-950",    iconColor: "text-rose-800"    }, // 0
      { bg: "bg-orange-300",  border: "border-orange-500",  text: "text-orange-950",  iconColor: "text-orange-800"  }, // 1
      { bg: "bg-emerald-300", border: "border-emerald-500", text: "text-emerald-950", iconColor: "text-emerald-800" }, // 2 (was emerald-400)
    ];
    return scale[Math.max(0, Math.min(2, points))];
  }
  // 1-pt binary.
  return points >= 1
    ? { bg: "bg-emerald-300", border: "border-emerald-500", text: "text-emerald-950", iconColor: "text-emerald-800" }
    : { bg: "bg-rose-300",    border: "border-rose-500",    text: "text-rose-950",    iconColor: "text-rose-800"    };
}

/** Inline HTML-safe category badge for emails / PDF. */
export function categoryBadgeHtml(category: ProfileCategory): string {
  // Emerald-forward, matching getCategoryStyle.
  const colors: Record<ProfileCategory, { bg: string; color: string }> = {
    "SUPER STRONG Profile": { bg: "#ecfdf5", color: "#047857" },
    "VERY STRONG Profile":  { bg: "#ecfdf5", color: "#059669" },
    "STRONG Profile":       { bg: "#f0fdfa", color: "#0f766e" },
    "AVERAGE Profile":      { bg: "#fffbeb", color: "#d97706" },
    "Weak Profile":         { bg: "#fff1f2", color: "#be123c" },
  };
  const styles = getCategoryStyle(category);
  const c = colors[category];
  return `<span style="display:inline-block;background:${c.bg};color:${c.color};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">${styles.emoji} ${styles.shortLabel}</span>`;
}

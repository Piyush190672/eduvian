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

export interface ProfileScoreResult {
  /** Weighted score, 0-100. */
  score: number;
  /** Always 100 — kept for back-compat callers. */
  total: number;
  /** Same as `score`, kept for back-compat. */
  percentage: number;
  category: ProfileCategory;
  criteria: ProfileCriterion[];
}

// ─── Per-criterion point helpers ─────────────────────────────────────────────

/** Academic score — 6-tier graded scale (0–5 points).
 *  Percentage / GPA / IGCSE (stored as % equivalent) use the same scale.
 *  IB uses its own 0–45 scale. */
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

/** English test — 1 pt if IELTS ≥ 7 / TOEFL ≥ 105 / PTE ≥ 60. */
function englishPoints(profile: StudentProfile): number {
  if (profile.english_test === "none" || !profile.english_score_overall) return 0;
  const s = profile.english_score_overall;
  switch (profile.english_test) {
    case "ielts":    return s >= 7.0 ? 1 : 0;
    case "toefl":    return s >= 105  ? 1 : 0;
    case "pte":      return s >= 60   ? 1 : 0;
    default:         return 0;
  }
}

/** Standard test — 1 pt for a competitive score on the test the student
 *  actually sat (SAT for UG, GRE / GMAT for PG). 0 if no test taken or
 *  score is below the competitive threshold. */
function stdTestPoints(profile: StudentProfile): number {
  if (profile.degree_level === "undergraduate") {
    if (profile.std_test_ug !== "sat") return 0;
    return (profile.std_test_ug_score ?? 0) >= 1400 ? 1 : 0;
  }
  if (profile.std_test_pg === "gre") {
    return (profile.std_test_pg_score ?? 0) >= 320 ? 1 : 0;
  }
  if (profile.std_test_pg === "gmat") {
    return (profile.std_test_pg_score ?? 0) >= 680 ? 1 : 0;
  }
  return 0;
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

// ─── Weight allocation (15 May 2026 user spec) ────────────────────────────────
//
// Final score is a weighted 0-100 percentage. The first five criteria have
// fixed weights; the remaining criteria share the "others_total" pool
// proportional to their maxPoints.
//
//   Academic           40
//   Family income      10
//   Standard test      10
//   Backlogs            5
//   English test       10
//   All others (sum)   25
//   ─────────────────────
//   TOTAL             100

const WEIGHT = {
  academic: 40,
  family_income: 10,
  std_test: 10,
  backlogs: 5,
  english: 10,
  others_total: 25,
} as const;

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

export function scoreStudentProfile(profile: StudentProfile): ProfileScoreResult {
  const isPG = profile.degree_level === "postgraduate";

  // "Other" criteria — share the 25% pool proportional to maxPoints.
  const others: Array<{ label: string; points: number; maxPoints: number }> = [
    { label: "Passport available",                       points: profile.passport_available === "yes" ? 1 : 0,        maxPoints: 1 },
    { label: "Visa approved previously",                 points: profile.visa_history === "approved_before" ? 1 : 0,  maxPoints: 1 },
    { label: "Family / friends studying or living abroad", points: profile.family_abroad === true ? 1 : 0,            maxPoints: 1 },
    { label: "No academic gap year",                     points: !profile.academic_gap ? 1 : 0,                       maxPoints: 1 },
    { label: "Annual budget",                            points: budgetPoints(profile),                               maxPoints: 2 },
    { label: "Target intake within next 18 months",      points: intakeWithin18Months(profile),                       maxPoints: 1 },
    { label: "Already researched some universities",     points: profile.universities_researched === true ? 2 : 0,    maxPoints: 2 },
    { label: "No scholarship required",                  points: profile.scholarship_seeking === false ? 1 : 0,       maxPoints: 1 },
  ];
  if (isPG) {
    others.push({ label: "Research paper published", points: profile.research_papers === true ? 1 : 0,        maxPoints: 1 });
    others.push({ label: "Work experience",          points: (profile.work_experience_years ?? 0) > 0 ? 1 : 0, maxPoints: 1 });
  }
  const othersMaxSum = others.reduce((s, o) => s + o.maxPoints, 0);

  const criteria: ProfileCriterion[] = [
    mk("Academic score",       academicPoints(profile),  5, WEIGHT.academic),
    mk("Family income",        incomePoints(profile),    3, WEIGHT.family_income),
    mk("Standard test score",  stdTestPoints(profile),   1, WEIGHT.std_test),
    mk("Backlogs",             backlogPoints(profile),   3, WEIGHT.backlogs),
    mk("English test score",   englishPoints(profile),   1, WEIGHT.english),
    ...others.map((o) =>
      mk(o.label, o.points, o.maxPoints, (o.maxPoints / othersMaxSum) * WEIGHT.others_total),
    ),
  ];

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

export function getCategoryStyle(category: ProfileCategory): CategoryStyle {
  switch (category) {
    case "SUPER STRONG Profile":
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-300",
        emoji: "🔥",
        description: "Exceptionally strong profile — high visa and admission success likelihood",
        shortLabel: "Super Strong",
      };
    case "VERY STRONG Profile":
      return {
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-300",
        emoji: "⭐",
        description: "Very strong profile — excellent chances across top-tier programs",
        shortLabel: "Very Strong",
      };
    case "STRONG Profile":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-300",
        emoji: "💪",
        description: "Strong profile — solid prospects with the right program selection",
        shortLabel: "Strong",
      };
    case "AVERAGE Profile":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-300",
        emoji: "📊",
        description: "Average profile — targeted preparation can significantly improve your outcomes",
        shortLabel: "Average",
      };
    case "Weak Profile":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-300",
        emoji: "📈",
        description: "Weak profile — focused improvement on academics, tests, or budget alignment is needed to strengthen the application",
        shortLabel: "Weak",
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
  if (maxPoints >= 3) {
    // Family income, Backlogs — 4 tiers (0 light-red → 3 dark green).
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
  const colors: Record<ProfileCategory, { bg: string; color: string }> = {
    "SUPER STRONG Profile": { bg: "#fef2f2", color: "#dc2626" },
    "VERY STRONG Profile":  { bg: "#fff7ed", color: "#ea580c" },
    "STRONG Profile":       { bg: "#f0fdf4", color: "#16a34a" },
    "AVERAGE Profile":      { bg: "#fffbeb", color: "#d97706" },
    "Weak Profile":         { bg: "#eff6ff", color: "#2563eb" },
  };
  const styles = getCategoryStyle(category);
  const c = colors[category];
  return `<span style="display:inline-block;background:${c.bg};color:${c.color};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">${styles.emoji} ${category}</span>`;
}

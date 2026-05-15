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
  points: number;     // actual points awarded (0, 1, or 2)
  maxPoints: number;  // max possible for this criterion (1 or 2)
}

export interface ProfileScoreResult {
  score: number;        // raw points earned
  total: number;        // max possible points
  percentage: number;   // 0–100
  category: ProfileCategory;
  criteria: ProfileCriterion[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function criterion(label: string, points: number, maxPoints: number): ProfileCriterion {
  return { label, points, maxPoints, passed: points > 0, partial: points > 0 && points < maxPoints };
}

/** Academic score — 4-tier graded scale (0–3 points).
 *  Percentage / GPA / IGCSE (stored as % equivalent) use the same scale.
 *  IB uses its own 0–45 scale. */
function academicPoints(profile: StudentProfile): number {
  const s = profile.academic_score;
  switch (profile.academic_score_type) {
    case "percentage":
    case "igcse": // stored as percentage equiv: A*=95, A=85, B=75
      if (s > 90) return 3;
      if (s >= 85) return 2;
      if (s >= 75) return 1;
      return 0;
    case "gpa":
      if (s > 3.75) return 3;
      if (s >= 3.5) return 2;
      if (s >= 3.2) return 1;
      return 0;
    case "ib":
      if (s > 42) return 3;
      if (s >= 40) return 2;
      if (s >= 36) return 1;
      return 0;
    default:
      return 0;
  }
}

/** Family income — 4-tier graded scale (0–3 points). */
function incomePoints(profile: StudentProfile): number {
  switch (profile.family_income_inr) {
    case "above_40L": return 3;
    case "20L_40L":   return 2;
    case "10L_20L":   return 1;
    default:          return 0; // under_5L, 5L_10L
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

/** English test — 1 pt if IELTS ≥ 7 / TOEFL ≥ 105 / PTE ≥ 60 */
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

/** Intake within 18 months — 1 pt if yes, 0 if further away */
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

/** Annual budget — 2 pts if > $35K, 1 pt if $25K–$35K, 0 below $25K */
function budgetPoints(profile: StudentProfile): number {
  switch (profile.budget_range) {
    case "above_70k":
    case "50k_70k":
    case "35k_50k":  return 2; // all ≥ $35K
    case "20k_35k":  return 1; // straddles $25K threshold
    default:         return 0; // under_20k
  }
}

// ─── Scorer ───────────────────────────────────────────────────────────────────

export function scoreStudentProfile(profile: StudentProfile): ProfileScoreResult {
  const isPostgrad = profile.degree_level === "postgraduate";

  const criteria: ProfileCriterion[] = [
    // 1. Passport (max 1)
    criterion(
      "Passport available",
      profile.passport_available === "yes" ? 1 : 0,
      1,
    ),

    // 2. Visa history (max 1)
    criterion(
      "Visa approved previously",
      profile.visa_history === "approved_before" ? 1 : 0,
      1,
    ),

    // 3. Family abroad (max 1)
    criterion(
      "Family / friends studying or living abroad",
      profile.family_abroad === true ? 1 : 0,
      1,
    ),

    // 4. Family income (max 3)
    criterion(
      "Family income (40L+ = 3, 20–40L = 2, 10–20L = 1)",
      incomePoints(profile),
      3,
    ),

    // 5. Academic score (max 3)
    criterion(
      "Academic score (>90% / >3.75 GPA / >42 IB = 3 · 85–90 / 3.5–3.75 / 40–42 = 2 · 75–85 / 3.2–3.5 / 36–39 = 1)",
      academicPoints(profile),
      3,
    ),

    // 6. Backlogs (max 3)
    criterion(
      "Backlogs (none = 3 · 1 = 2 · 2–5 = 1 · >5 = 0)",
      backlogPoints(profile),
      3,
    ),

    // 7. No gap year (max 1)
    criterion(
      "No academic gap year",
      !profile.academic_gap ? 1 : 0,
      1,
    ),

    // 8. English test (max 1)
    criterion(
      "English score (IELTS ≥ 7 / TOEFL ≥ 105 / PTE ≥ 60)",
      englishPoints(profile),
      1,
    ),

    // 9. Annual budget (max 2)
    criterion(
      "Annual budget (>$35K = full, $25–35K = partial)",
      budgetPoints(profile),
      2,
    ),

    // 10. Intake within 18 months (max 1)
    criterion(
      "Target intake within next 18 months",
      intakeWithin18Months(profile),
      1,
    ),

    // 11. Universities already researched (max 2)
    criterion(
      "Already researched some universities",
      profile.universities_researched === true ? 2 : 0,
      2,
    ),

    // 12. Scholarship not required (max 1)
    criterion(
      "No scholarship required",
      profile.scholarship_seeking === false ? 1 : 0,
      1,
    ),
  ];

  // 13. Research paper — postgrad only (max 1)
  if (isPostgrad) {
    criteria.push(criterion(
      "Research paper published",
      profile.research_papers === true ? 1 : 0,
      1,
    ));
  }

  // 14. Work experience — postgrad only (max 1)
  if (isPostgrad) {
    criteria.push(criterion(
      "Work experience",
      (profile.work_experience_years ?? 0) > 0 ? 1 : 0,
      1,
    ));
  }

  const score = criteria.reduce((sum, c) => sum + c.points, 0);
  const total = criteria.reduce((sum, c) => sum + c.maxPoints, 0);
  const percentage = Math.round((score / total) * 100);

  return {
    score,
    total,
    percentage,
    category: deriveCategory(score, total),
    criteria,
  };
}

/** Category buckets use the RAW score (not %). PG anchor boundaries
 *  per user spec (15 May 2026): ≥20 SUPER STRONG · 18–19 VERY STRONG ·
 *  15–17 STRONG · 10–14 AVERAGE · <10 Weak (max=22).
 *
 *  UG (max=20) scales each boundary by `total / 22` and rounds. That
 *  yields ≥18 SUPER STRONG · 16–17 VERY STRONG · 14–15 STRONG ·
 *  9–13 AVERAGE · <9 Weak — proportional to the PG ladder. */
function deriveCategory(score: number, total: number): ProfileCategory {
  const f = total / 22;
  if (score >= Math.round(20 * f)) return "SUPER STRONG Profile";
  if (score >= Math.round(18 * f)) return "VERY STRONG Profile";
  if (score >= Math.round(15 * f)) return "STRONG Profile";
  if (score >= Math.round(10 * f)) return "AVERAGE Profile";
  return "Weak Profile";
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface CategoryStyle {
  bg: string;
  text: string;
  border: string;
  emoji: string;
  description: string;
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
      };
    case "VERY STRONG Profile":
      return {
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-300",
        emoji: "⭐",
        description: "Very strong profile — excellent chances across top-tier programs",
      };
    case "STRONG Profile":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-300",
        emoji: "💪",
        description: "Strong profile — solid prospects with the right program selection",
      };
    case "AVERAGE Profile":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-300",
        emoji: "📊",
        description: "Average profile — targeted preparation can significantly improve your outcomes",
      };
    case "Weak Profile":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-300",
        emoji: "📈",
        description: "Weak profile — focused improvement on academics, tests, or budget alignment is needed to strengthen the application",
      };
  }
}

/** Inline HTML-safe category badge for emails / PDF */
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

import type { StudentProfile } from "./types";

// ─── Profile Category Types ───────────────────────────────────────────────────

export type ProfileCategory =
  | "SUPER HOT Profile"
  | "HOT Profile"
  | "STRONG Profile"
  | "Good Profile"
  | "AVERAGE Profile";

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

/** Academic score — 2 pts top tier, 1 pt mid tier, 0 below */
function academicPoints(profile: StudentProfile): number {
  const s = profile.academic_score;
  switch (profile.academic_score_type) {
    case "percentage":
    case "igcse": // stored as percentage equiv: A*=95, A=85, B=75
      if (s >= 85) return 2;
      if (s >= 75) return 1;
      return 0;
    case "gpa":
      if (s >= 3.5) return 2;
      if (s >= 3.2) return 1;
      return 0;
    case "ib":
      if (s >= 35) return 2;
      if (s >= 30) return 1;
      return 0;
    default:
      return 0;
  }
}

/** Family income — 2 pts if ≥ 30L, 1 pt if 15–30L, 0 below 15L */
function incomePoints(profile: StudentProfile): number {
  switch (profile.family_income_inr) {
    case "above_40L": return 2;
    case "20L_40L":   return 1; // 20–40L bracket; conservative = 1
    case "10L_20L":   return 1; // 10–20L straddles 15L; give benefit of doubt
    default:          return 0; // under_5L, 5L_10L
  }
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

    // 4. Family income (max 2)
    criterion(
      "Family income (30L+ = full, 15–30L = partial)",
      incomePoints(profile),
      2,
    ),

    // 5. Academic score (max 2)
    criterion(
      "Academic score (85%+ / 3.5 GPA / 35 IB / A IGCSE = full)",
      academicPoints(profile),
      2,
    ),

    // 6. No backlogs (max 1)
    criterion(
      "No academic backlogs",
      !profile.backlogs ? 1 : 0,
      1,
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
  ];

  // 11. Research paper — postgrad only (max 1)
  if (isPostgrad) {
    criteria.push(criterion(
      "Research paper published",
      profile.research_papers === true ? 1 : 0,
      1,
    ));
  }

  // 12. Work experience — postgrad only (max 1)
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
    category: deriveCategory(percentage),
    criteria,
  };
}

function deriveCategory(pct: number): ProfileCategory {
  if (pct >= 80) return "SUPER HOT Profile";
  if (pct >= 65) return "HOT Profile";
  if (pct >= 50) return "STRONG Profile";
  if (pct >= 35) return "Good Profile";
  return "AVERAGE Profile";
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
    case "SUPER HOT Profile":
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-300",
        emoji: "🔥",
        description: "Exceptionally strong profile — high visa and admission success likelihood",
      };
    case "HOT Profile":
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
    case "Good Profile":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-300",
        emoji: "📊",
        description: "Good profile — targeted preparation can significantly improve your outcomes",
      };
    case "AVERAGE Profile":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-300",
        emoji: "📈",
        description: "Average profile — focused improvement steps needed to strengthen your application",
      };
  }
}

/** Inline HTML-safe category badge for emails / PDF */
export function categoryBadgeHtml(category: ProfileCategory): string {
  const colors: Record<ProfileCategory, { bg: string; color: string }> = {
    "SUPER HOT Profile": { bg: "#fef2f2", color: "#dc2626" },
    "HOT Profile":       { bg: "#fff7ed", color: "#ea580c" },
    "STRONG Profile":    { bg: "#f0fdf4", color: "#16a34a" },
    "Good Profile":      { bg: "#fffbeb", color: "#d97706" },
    "AVERAGE Profile":   { bg: "#eff6ff", color: "#2563eb" },
  };
  const styles = getCategoryStyle(category);
  const c = colors[category];
  return `<span style="display:inline-block;background:${c.bg};color:${c.color};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">${styles.emoji} ${category}</span>`;
}

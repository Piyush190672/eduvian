import type { StudentProfile } from "./types";

// ─── Profile Category Types ───────────────────────────────────────────────────

export type ProfileCategory =
  | "Super Hot Profile"
  | "HOT Profile"
  | "Good Potential"
  | "Medium Potential"
  | "Low Potential"
  | "Unlikely";

export interface ProfileCriterion {
  label: string;
  passed: boolean;
}

export interface ProfileScoreResult {
  score: number;        // raw points earned
  total: number;        // max possible points
  percentage: number;   // 0–100
  category: ProfileCategory;
  criteria: ProfileCriterion[];
}

// ─── Scorer ───────────────────────────────────────────────────────────────────

export function scoreStudentProfile(profile: StudentProfile): ProfileScoreResult {
  const isPostgrad = profile.degree_level === "postgraduate";

  // ── Positive grid: 1 point for YES ────────────────────────────────────────
  const positive: ProfileCriterion[] = [
    {
      label: "Passport available",
      passed: profile.passport_available === "yes",
    },
    {
      label: "Visa approved previously",
      passed: profile.visa_history === "approved_before",
    },
    {
      label: "Family / friends studying or living abroad",
      passed: profile.family_abroad === true,
    },
    {
      label: "English proficiency test taken",
      passed: profile.english_test !== "none",
    },
    {
      label: "Family income > ₹25 lakhs per annum",
      // 20L_40L range midpoint (30L) > 25L → counts as YES
      passed:
        profile.family_income_inr === "20L_40L" ||
        profile.family_income_inr === "above_40L",
    },
    {
      label: "Standardised test taken (GRE / GMAT / SAT / ACT)",
      passed: isPostgrad
        ? !!(profile.std_test_pg && profile.std_test_pg !== "none")
        : !!(profile.std_test_ug && profile.std_test_ug !== "none"),
    },
    {
      label: "Annual budget > $25,000 USD (tuition + living)",
      // under_20k is the only range clearly below $25K
      passed: profile.budget_range !== "under_20k",
    },
  ];

  // Postgrad-only: research paper
  if (isPostgrad) {
    positive.push({
      label: "Research paper published",
      passed: profile.research_papers === true,
    });
  }

  // ── Negative grid: 1 point for NO ─────────────────────────────────────────
  const negative: ProfileCriterion[] = [
    {
      label: "No academic backlogs",
      passed: !profile.backlogs,
    },
    {
      label: "No academic gap year",
      passed: !profile.academic_gap,
    },
  ];

  const all = [...positive, ...negative];
  const score = all.filter((c) => c.passed).length;
  const total = all.length;
  const percentage = Math.round((score / total) * 100);

  return {
    score,
    total,
    percentage,
    category: deriveCategory(percentage),
    criteria: all,
  };
}

function deriveCategory(pct: number): ProfileCategory {
  if (pct >= 80) return "Super Hot Profile";
  if (pct >= 70) return "HOT Profile";
  if (pct >= 60) return "Good Potential";
  if (pct >= 40) return "Medium Potential";
  if (pct >= 30) return "Low Potential";
  return "Unlikely";
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
    case "Super Hot Profile":
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
    case "Good Potential":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-300",
        emoji: "💪",
        description: "Solid profile — good prospects with the right program selection",
      };
    case "Medium Potential":
      return {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-300",
        emoji: "📊",
        description: "Reasonable profile — targeted preparation can significantly improve outcomes",
      };
    case "Low Potential":
      return {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-300",
        emoji: "📈",
        description: "Profile has gaps — focused improvement steps needed before applying",
      };
    case "Unlikely":
      return {
        bg: "bg-gray-100",
        text: "text-gray-600",
        border: "border-gray-300",
        emoji: "⚠️",
        description: "Several critical gaps identified — significant preparation required",
      };
  }
}

/** Inline HTML-safe category badge for emails / PDF */
export function categoryBadgeHtml(category: ProfileCategory): string {
  const colors: Record<ProfileCategory, { bg: string; color: string }> = {
    "Super Hot Profile":  { bg: "#fef2f2", color: "#dc2626" },
    "HOT Profile":        { bg: "#fff7ed", color: "#ea580c" },
    "Good Potential":     { bg: "#f0fdf4", color: "#16a34a" },
    "Medium Potential":   { bg: "#fffbeb", color: "#d97706" },
    "Low Potential":      { bg: "#eff6ff", color: "#2563eb" },
    "Unlikely":           { bg: "#f9fafb", color: "#6b7280" },
  };
  const styles = getCategoryStyle(category);
  const c = colors[category];
  return `<span style="display:inline-block;background:${c.bg};color:${c.color};padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700;">${styles.emoji} ${category}</span>`;
}

/**
 * "Why did I get zero programs?" — measured, not guessed.
 *
 * Added 14 Jul 2026 (founder) after a real submission returned an empty
 * shortlist and the results page showed a blank state with no way forward.
 * The student had four one-tap escape routes and was shown none of them.
 *
 * Unlike empty-tier-reason.ts (a heuristic for a single empty TIER), this
 * runs when the WHOLE shortlist is empty and reports what actually
 * happened: `recommendPrograms` tallies which hard filter rejected each
 * program, and we then re-run the matcher with ONE filter relaxed at a
 * time to find which single change would produce results — and how many.
 *
 * Everything here is derived from a real matcher run. No invented numbers.
 */

import { recommendPrograms, type MatchDiagnostics } from "./scoring";
import type { Program, StudentProfile } from "./types";

/** A single change the student can make, with the measured payoff. */
export interface RelaxationOption {
  /** Stable key the results page passes back as ?relax=<key>. */
  key: RelaxKey;
  /** Button label — the action, in the student's words. */
  label: string;
  /** What this gives up, so the choice is informed. */
  tradeoff: string;
  /** Programs this single change would surface. Always > 0. */
  matches: number;
}

export type RelaxKey = "psw" | "qs" | "budget" | "countries" | "intake";

export interface NoMatchExplanation {
  /** Ordered plain-language causes, biggest blocker first. */
  causes: string[];
  /** Single changes that would actually produce results, best payoff first. */
  options: RelaxationOption[];
  /**
   * True when no single relaxation helps — the pool is empty for a
   * structural reason (usually too few programs in that field at that
   * degree level). The UI must not promise a quick fix in this case.
   */
  structural: boolean;
  /** Programs we hold for this field at this degree level, before any preference filter. */
  fieldPoolSize: number;
}

const QS_LABEL: Record<string, string> = {
  top_50: "QS Top 50",
  top_100: "QS Top 100",
  top_200: "QS Top 200",
  top_500: "QS Top 500",
};

/** Human sentence for each hard-filter stage, given how many it removed. */
function causeFor(stage: string, n: number, profile: StudentProfile): string | null {
  switch (stage) {
    case "field":
      // n here is the FIELD-POOL size (survivors), passed in by the caller —
      // not the reject tally, which is meaningless to a student.
      return n === 0
        ? "We don't yet carry any programs in this field at this study level. That's a gap in our database, not something you can fix by editing your profile."
        : `Our verified database currently holds ${n} program${n === 1 ? "" : "s"} in this field at this study level, so there was very little to match against. That's a coverage gap on our side.`;
    case "country":
      return `Your ${profile.country_preferences?.length ?? 0} selected destination${(profile.country_preferences?.length ?? 0) === 1 ? "" : "s"} removed ${n} otherwise-matching program${n === 1 ? "" : "s"}.`;
    case "qs":
      return `The ${QS_LABEL[profile.qs_ranking_preference ?? ""] ?? "ranking"} filter removed ${n} program${n === 1 ? "" : "s"} — including unranked universities, which carry no QS position at all.`;
    case "psw":
      return `Requiring a post-study work visa removed ${n} program${n === 1 ? "" : "s"}, because not every destination you picked runs one.`;
    case "academic":
      return `${n} program${n === 1 ? " publishes an entry requirement" : "s publish entry requirements"} above your current academic score.`;
    case "budget":
      return `${n} program${n === 1 ? " costs" : "s cost"} more than your stated budget.`;
    case "field_prereq":
      return `${n} program${n === 1 ? " requires" : "s require"} an undergraduate background different from the one on your profile.`;
    case "region":
      return `Your city/region preferences removed ${n} program${n === 1 ? "" : "s"}.`;
    default:
      return null;
  }
}

/** Apply one relaxation to a profile copy. Never mutates the original. */
export function applyRelaxation(profile: StudentProfile, key: RelaxKey): StudentProfile {
  switch (key) {
    case "psw":
      return { ...profile, post_study_work_visa: false };
    case "qs":
      return { ...profile, qs_ranking_preference: "any" };
    case "budget":
      return { ...profile, budget_range: "above_70k" };
    case "countries":
      return { ...profile, country_preferences: [], country_region_preferences: {} };
    case "intake":
      return { ...profile, target_intake_semester: undefined as never };
    default:
      return profile;
  }
}

const RELAXATIONS: { key: RelaxKey; label: string; tradeoff: string; applies: (p: StudentProfile) => boolean }[] = [
  {
    key: "psw",
    label: "Drop the post-study work visa requirement",
    tradeoff: "Shows programs in countries without a post-study work route.",
    applies: (p) => p.post_study_work_visa === true,
  },
  {
    key: "qs",
    label: "Remove the ranking filter",
    tradeoff: "Includes strong universities that carry no QS ranking.",
    applies: (p) => !!p.qs_ranking_preference && p.qs_ranking_preference !== "any",
  },
  {
    key: "countries",
    label: "Open up to all 12 destinations",
    tradeoff: "Shows matches outside the countries you picked.",
    applies: (p) => (p.country_preferences?.length ?? 0) > 0 && (p.country_preferences?.length ?? 0) < 12,
  },
  {
    key: "budget",
    label: "Ignore the budget ceiling",
    tradeoff: "Includes programs above what you said you can spend.",
    applies: (p) => !!p.budget_range && p.budget_range !== "above_70k",
  },
  {
    key: "intake",
    label: "Accept any intake",
    tradeoff: "Includes programs starting in a different semester.",
    applies: (p) => !!p.target_intake_semester,
  },
];

/**
 * Explain an empty shortlist. Runs the matcher once per candidate
 * relaxation (at most 5 in-memory passes) to measure real payoffs.
 */
export function explainNoMatches(
  profile: StudentProfile,
  programs: Program[],
  diag: MatchDiagnostics,
): NoMatchExplanation {
  const rejects = diag.rejects ?? {};

  // Order causes by how many programs each stage removed. "field" is
  // surfaced first when it dominates — it's the honest headline.
  // How many programs exist for this field AND degree level, before any
  // preference filter? This is the number that actually means something to
  // a student — the "field" reject tally counts everything else in the DB.
  const fieldLevelPool = programs.filter(
    (p) =>
      p.is_active !== false &&
      p.degree_level === profile.degree_level &&
      p.field_of_study === profile.intended_field,
  ).length;

  const causes: string[] = [];
  // Lead with the coverage gap when the field is genuinely thin — it's the
  // honest headline and it stops the student blaming their own profile.
  if (fieldLevelPool <= 10) {
    causes.push(causeFor("field", fieldLevelPool, profile)!);
  }
  for (const [stage, n] of Object.entries(rejects)
    .filter(([stage]) => !["inactive", "degree_level", "field"].includes(stage))
    .sort((a, b) => b[1] - a[1])) {
    const c = causeFor(stage, n, profile);
    if (c) causes.push(c);
    if (causes.length >= 3) break;
  }

  const options: RelaxationOption[] = [];
  for (const r of RELAXATIONS) {
    if (!r.applies(profile)) continue;
    const matches = recommendPrograms(applyRelaxation(profile, r.key), programs, 2).length;
    if (matches > 0) {
      options.push({ key: r.key, label: r.label, tradeoff: r.tradeoff, matches });
    }
  }
  options.sort((a, b) => b.matches - a.matches);

  return {
    causes,
    options,
    structural: options.length === 0,
    fieldPoolSize: fieldLevelPool,
  };
}

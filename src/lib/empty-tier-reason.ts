// Per-tier "why is this section empty?" explainer for /results/[token].
//
// Pure client-side heuristic — no API call, no algorithm change. Reads the
// user's profile + the matcher's returned shortlist and produces a short
// honest explanation + 2-3 actionable suggestions for filling the gap.
//
// Added 14 May 2026 after a real submission landed 0 Ambitious results
// because the academic hard floor (studentPct < minPct, no buffer)
// removed every "stretch" program before scoring. Rather than soften the
// filter, we surface the reason so users understand the outcome and know
// what to change. See STATE_SNAPSHOT §36 + the conversation in scoring.ts.

import type { ProgramTier, StudentProfile, ScoredProgram } from "./types";

export interface EmptyTierExplanation {
  title: string;
  body: string;
  suggestions: string[];
}

function toPercentageRough(profile: StudentProfile): number | null {
  if (typeof profile.academic_score !== "number") return null;
  switch (profile.academic_score_type) {
    case "percentage":
    case "igcse":
      return profile.academic_score;
    case "ib":
      return (profile.academic_score / 45) * 100;
    case "gpa":
    default:
      return (profile.academic_score / 4.0) * 100;
  }
}

const QS_PREF_LABEL: Record<string, string> = {
  top_50: "QS Top 50",
  top_100: "QS Top 100",
  top_200: "QS Top 200",
  top_500: "QS Top 500",
};

/**
 * Build a tier-specific empty-state explanation. Heuristic — gives the
 * most likely root cause first, then 2-3 things the user can change.
 */
export function explainEmptyTier(
  tier: ProgramTier,
  profile: StudentProfile,
  allReturnedPrograms: ScoredProgram[]
): EmptyTierExplanation {
  const countryCount = profile.country_preferences?.length ?? 0;
  const hasQsPref =
    !!profile.qs_ranking_preference && profile.qs_ranking_preference !== "any";
  const qsPrefLabel = hasQsPref
    ? QS_PREF_LABEL[profile.qs_ranking_preference!] ?? "QS preference"
    : "";
  const requiresPSW = profile.post_study_work_visa === true;
  const studentPct = toPercentageRough(profile);

  // Number of surviving programs across all tiers — gives signal of whether
  // the empty tier is part of a thin overall pool or a tier-specific gap.
  const totalReturned = allReturnedPrograms.length;
  const poolIsThin = totalReturned > 0 && totalReturned < 8;

  if (tier === "ambitious") {
    return {
      title: "No Ambitious matches for your current profile.",
      body: poolIsThin
        ? "Your filters narrowed the pool enough that nothing above your academic bar survived. Ambitious-tier programs are the ones where you'd be applying above the published minimum — none of those made it through your country / QS / budget filters."
        : "The schools whose published minimum GPA, English score or test cutoffs sit above your current numbers were excluded by the academic hard filter. That's the bucket Ambitious normally pulls from, so it ended up empty.",
      suggestions: [
        countryCount === 1
          ? "Add a second or third country to widen the pool — UK, Australia and Canada add many AI/CS/business programs your USA-only shortlist misses."
          : "Try removing one of the more restrictive filters (country, QS preference) to widen the pool.",
        hasQsPref
          ? `Drop the ${qsPrefLabel} filter — set QS preference to "any" — so highly-ranked schools become visible as stretch options.`
          : "Strengthen the weak signal: a higher IELTS / TOEFL, a GRE or GMAT, or one published research paper can lift you above the academic floor at competitive schools.",
        studentPct !== null && studentPct < 80
          ? "Improving your academic score (or adding a strong test score) is the biggest single lever — most Ambitious-tier programs publish minimums in the 80-90% / 3.3-3.7 GPA range."
          : "Widen your intake — Spring intake opens a different set of programs than Fall.",
      ],
    };
  }

  if (tier === "safe") {
    return {
      title: "No Safe matches for your current profile.",
      body: poolIsThin
        ? "Your filters returned a very small pool and none of it lands comfortably below your academic bar. Safe-tier programs are the ones where you'd be applying with margin to spare — so the section is empty when nothing in the surviving pool is well below your level."
        : "Every program that survived your country / budget / QS filters has a published minimum that's close to or above your current academic score, so nothing scored high enough to be classified as Safe.",
      suggestions: [
        hasQsPref
          ? `Drop the ${qsPrefLabel} filter so lower-ranked but appropriate programs surface — many regional / state schools are genuine Safe matches that get hidden by QS prestige filters.`
          : "Widen your country preferences — countries like Germany, France, Ireland, Malaysia and UAE often have programs with more lenient published minimums.",
        requiresPSW
          ? "Turn off the 'Post-study work visa required' filter — some Safe-tier programs are in countries without that benefit."
          : "Improve your IELTS or TOEFL by half a band — English is the most common gating signal at schools that would otherwise be Safe.",
        studentPct !== null && studentPct < 75
          ? "Consider applying to programs that explicitly accept lower academic profiles — diploma / PG diploma tracks in Canada, or foundation-style Masters in the UK."
          : "Broaden the field selection in your profile if you're open to adjacent streams (e.g. Data Science vs Computer Science) — the matcher uses your exact intended_field.",
      ],
    };
  }

  // tier === "reach"
  return {
    title: "No Reach matches for your current profile.",
    body: poolIsThin
      ? "Your filters returned a very small pool, and what survived clustered at either end of your fit — programs you comfortably qualify for or ones above your bar — with nothing in the natural middle."
      : "The surviving programs split into two groups: ones you comfortably qualify for (Safe) and ones with published minimums above your numbers (Ambitious). Nothing landed in the in-between band.",
    suggestions: [
      countryCount === 1
        ? "Add one more country preference — different countries often fill in the mid-tier band that's empty in your current selection."
        : "Try removing one country to see if a more focused pool produces a different shape.",
      hasQsPref
        ? `Drop the ${qsPrefLabel} filter to surface mid-ranked schools that often produce Reach-tier matches.`
        : "Widen your intake (Spring + Fall) — different cohorts open up different mid-tier programs.",
      "Adjust your budget range up or down by one bracket — the budget hard ceiling can clip out an entire mid-tier band of programs.",
    ],
  };
}

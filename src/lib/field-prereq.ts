/**
 * Field-of-study prerequisite gate.
 *
 * Some PG fields are gate-kept by undergraduate background — e.g. an
 * AI / Data Science / CS Master's effectively requires a STEM bachelor's,
 * Medicine requires a health-sciences bachelor's, etc. Programs in these
 * fields routinely reject applicants whose undergrad doesn't satisfy the
 * prerequisite, even when every other signal is strong. The matcher used
 * to surface them anyway because nothing checked academic preparation
 * alignment; this gate removes them at the hard-filter stage.
 *
 * Scope (deliberately narrow, 18 May 2026):
 *   - Applies ONLY when profile.degree_level === "postgraduate".
 *   - Applies ONLY to the STEM / professional fields below, where the
 *     prerequisite rule is well-defined and broadly true across the 12
 *     destination countries we serve. Conversion masters that explicitly
 *     accept any background exist for most of these (rare), but the
 *     hard filter is the right default — the user can re-pick a more
 *     permissive intended field (MBA, Marketing, etc.) if conversion is
 *     what they actually want.
 *   - Non-STEM PG fields (MBA, Marketing, Education, International
 *     Relations, Public Policy, Media, Hospitality, Arts and Design,
 *     Film & Animation, Social Sciences, Economics & Finance, FinTech,
 *     Business Analytics) are intentionally NOT gated. They commonly
 *     accept any undergrad — gating them would create false negatives.
 *
 * Implementation: each gated field carries a regex of acceptable
 * keywords that we test against the user's free-text `major_stream`
 * + `current_degree` (joined, lowercased). One match anywhere passes.
 */

import type { StudentProfile } from "./types";

/**
 * Acceptable undergrad-background keywords per gated PG field. A user
 * is eligible if either `major_stream` or `current_degree` (joined and
 * lowercased) matches the regex.
 *
 * The patterns are tuned permissively — they should pass any genuine
 * STEM background, not just the obvious labels. Common abbreviations
 * (BE, BTech, BSc, BS) are not in the regex because they appear on
 * non-STEM submissions too; the discipline keyword is the signal.
 */
const FIELD_PREREQUISITES: Record<string, RegExp> = {
  // ── Tech / Quant ─────────────────────────────────────────────────────────
  "Computer Science & IT":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|infotech|electron|electric|telecom|robotic|mechatron|engineer|math|statistic|physic)/i,
  "Artificial Intelligence":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|engineer|math|statistic|physic|data|machine\s*learn|\bai\b|electron|electric|cognit)/i,
  "Data Science":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|engineer|math|statistic|physic|data|econom|actuar|analytic|operations\s*research|business\s*analytic)/i,
  "Cybersecurity":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|engineer|network|electron|electric|cyber|securit)/i,

  // ── Engineering ──────────────────────────────────────────────────────────
  "Engineering (Mechanical/Civil/Electrical)":
    /\b(engineer|mechan|civil|electric|electron|chemical|aerospace|aeronaut|industrial|material|metallurg|petroleum|mining|telecom|robotic|mechatron|physic|math)/i,
  "Architecture":
    /\b(architect|civil|urban\s*plan|built\s*environ|interior\s*design|design)/i,
  "Renewable Energy":
    /\b(engineer|mechan|electric|electron|chemical|environment|sustainab|energy|physic|natural\s*scien|earth\s*scien)/i,

  // ── Life sciences / health ──────────────────────────────────────────────
  "Biotechnology & Life Sciences":
    /\b(biotech|bio(?:logy|chem|tech|medic|inform|engineer)?|chem|life\s*scien|microbiolog|genet|pharma|botany|zoolog|medic|health)/i,
  "Medicine & Public Health":
    /\b(medic|mbbs|bds|dental|pharma|nurs|health|public\s*health|epidem|biostat|allied\s*health|physiother|biotech|bio)/i,
  "Nursing & Allied Health":
    /\b(nurs|medic|mbbs|health|allied\s*health|physiother|midwif|paramed|pharma|biomed|biolog)/i,
  "Natural Sciences":
    /\b(physic|chem|bio|math|statistic|geolog|earth\s*scien|natural\s*scien|astronom|environ)/i,
  "Agriculture & Veterinary Sciences":
    /\b(agricultur|horticult|veterinar|animal\s*scien|botany|zoolog|forestry|aquacultur|food\s*scien|environ|bio)/i,

  // ── Professional ─────────────────────────────────────────────────────────
  "Law":
    /\b(law|legal|llb|llm|ba\.?llb|jurisprudence)/i,
  "Psychology":
    /\b(psycholog|behavi(?:ou)?ral|cognit|neurosci|counsel|social\s*work|sociolog|arts)/i,
};

/**
 * Returns true if the user's undergraduate background satisfies the
 * prerequisite for the given PG field, OR if the field has no defined
 * prerequisite (in which case we never block on background).
 *
 * Skips the gate entirely for UG applicants — the prereq concept is
 * about next-degree alignment.
 */
export function isAcademicallyEligibleForField(
  profile: StudentProfile,
  fieldOfStudy: string,
): boolean {
  if (profile.degree_level !== "postgraduate") return true;

  const re = FIELD_PREREQUISITES[fieldOfStudy];
  if (!re) return true; // field not gated → pass

  const haystack = `${profile.major_stream ?? ""} ${profile.current_degree ?? ""}`.toLowerCase();
  if (!haystack.trim()) return true; // no background info → don't block

  return re.test(haystack);
}

/** Internal export for tests / diagnostics. */
export const __FIELD_PREREQUISITES = FIELD_PREREQUISITES;

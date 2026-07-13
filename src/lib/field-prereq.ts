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
  // Keywords are tuned to ALSO match the canonical FIELDS_OF_STUDY
  // values now used in the PG Major/Stream dropdown (18 May 2026):
  // "Computer Science & IT", "Artificial Intelligence", "Data Science",
  // "Cybersecurity", "Engineering (Mechanical/Civil/Electrical)",
  // "Architecture", "Renewable Energy", "Biotechnology & Life Sciences",
  // "Natural Sciences", etc.
  "Computer Science & IT":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|infotech|intellig|\bai\b|cyber|securit|\bdata\b|electron|electric|telecom|robotic|mechatron|engineer|math|statistic|physic|natural\s*scien)/i,
  "Artificial Intelligence":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|infotech|intellig|\bai\b|cyber|securit|\bdata\b|engineer|math|statistic|physic|machine\s*learn|electron|electric|cognit|natural\s*scien)/i,
  "Data Science":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|infotech|intellig|\bai\b|cyber|securit|\bdata\b|engineer|math|statistic|physic|econom|actuar|analytic|operations\s*research|business\s*analytic|natural\s*scien)/i,
  "Cybersecurity":
    /\b(comput|cs\b|software|info(?:rmation)?\s*tech|\bit\b|infotech|intellig|\bai\b|cyber|securit|engineer|network|electron|electric)/i,

  // ── Engineering ──────────────────────────────────────────────────────────
  "Engineering (Mechanical/Civil/Electrical)":
    /\b(engineer|mechan|civil|electric|electron|chemical|aerospace|aeronaut|industrial|material|metallurg|petroleum|mining|telecom|robotic|mechatron|physic|math|renewable\s*energy|natural\s*scien)/i,
  "Architecture":
    /\b(architect|civil|urban\s*plan|built\s*environ|interior\s*design|design)/i,
  "Renewable Energy":
    /\b(engineer|mechan|electric|electron|chemical|environment|sustainab|energy|physic|natural\s*scien|earth\s*scien|renewable)/i,

  // ── Life sciences / health ──────────────────────────────────────────────
  "Biotechnology & Life Sciences":
    /\b(biotech|bio(?:logy|chem|tech|medic|inform|engineer)?|chem|life\s*scien|microbiolog|genet|pharma|botany|zoolog|medic|health|agricultur|veterinar|animal\s*scien)/i,
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

// ─── STEM gating (18 May 2026, user spec) ─────────────────────────────────────
//
// User-stated rule: a STEM PG program requires a STEM undergraduate. A STEM
// UG program requires Class XII Mathematics + Physics + Chemistry (PCM).
// These are blocking validation rules in the profile form — Continue is
// disabled when the picked intended_field violates them.

/**
 * Intended PG fields that are considered STEM for the purposes of the
 * "STEM PG must have STEM UG" gate. Each must also have a regex in
 * FIELD_PREREQUISITES above — the matcher uses the regex map, this set
 * is only for surfacing the user-facing blocking copy.
 */
export const STEM_PG_FIELDS: ReadonlySet<string> = new Set([
  "Computer Science & IT",
  "Artificial Intelligence",
  "Data Science",
  "Cybersecurity",
  "Engineering (Mechanical/Civil/Electrical)",
  "Architecture",
  "Renewable Energy",
  "Biotechnology & Life Sciences",
  "Medicine & Public Health",
  "Nursing & Allied Health",
  "Natural Sciences",
  "Agriculture & Veterinary Sciences",
]);

/**
 * Intended UG fields that are considered STEM and require Class XII
 * Mathematics + Physics + Chemistry (PCM). Architecture is included
 * even though it isn't always pure-STEM — UG Architecture admissions
 * in the 12 destination countries we serve do expect Math + Physics
 * in nearly all cases.
 */
export const STEM_UG_FIELDS: ReadonlySet<string> = new Set([
  "Computer Science & IT",
  "Artificial Intelligence",
  "Data Science",
  "Cybersecurity",
  "Engineering (Mechanical/Civil/Electrical)",
  "Architecture",
  "Renewable Energy",
  "Biotechnology & Life Sciences",
  "Natural Sciences",
  "Agriculture & Veterinary Sciences",
]);

/**
 * Required Class XII subjects for STEM UG admission — PCM.
 */
export const STEM_UG_REQUIRED_SUBJECTS: ReadonlyArray<string> = [
  "Mathematics",
  "Physics",
  "Chemistry",
];

/**
 * UG Medicine subject pool (founder rule, 14 Jul 2026): any 3 of the 4
 * qualify — Mathematics is NOT mandatory for Medicine, unlike the PCM
 * gate on the other STEM UG fields.
 */
export const MEDICINE_UG_SUBJECTS: ReadonlyArray<string> = [
  "Physics",
  "Chemistry",
  "Biology",
  "Mathematics",
];

/**
 * Centralised alignment check used by both the form (blocking Continue)
 * and the matcher (hard filter). Returns null when the picked field
 * aligns with the profile's qualifications, or a user-facing reason
 * string explaining the gap.
 *
 * Skipped — returns null — for the OTHER_FIELD_SENTINEL (custom typed
 * field) and when degree_level isn't yet set.
 */
import type { StudentProfile as _SP } from "./types";
export function getFieldAlignmentError(
  profile: Partial<_SP>,
  field: string | undefined,
): string | null {
  if (!field) return null;
  if (field === "Others") return null;
  if (!profile.degree_level) return null;

  if (profile.degree_level === "postgraduate") {
    if (!STEM_PG_FIELDS.has(field)) {
      // Non-STEM PG fields don't use this strict gate. The matcher's
      // FIELD_PREREQUISITES may still cover Law / Psychology as a soft
      // hard-filter but we don't surface them as form-blocking errors.
      return null;
    }
    // Gate on the STREAM being chosen, not the degree: current_degree is
    // picked first in the form, and a non-STEM degree label (e.g. "B.Com")
    // fired "not eligible" before the user reached the stream question
    // (founder report, 14 Jul 2026). The eligibility haystack still joins
    // degree + stream below, so a STEM degree name keeps its rescue power —
    // we just wait for the stream before scolding.
    const hasBackground = (profile.major_stream ?? "").trim().length > 0;
    if (!hasBackground) return null; // don't pre-scold

    if (isAcademicallyEligibleForField(profile as _SP, field)) return null;
    return "Your current qualification is not eligible for the selected program. Choose a suitable program.";
  }

  // Undergraduate path: STEM UG requires Class XII PCM.
  if (profile.degree_level === "undergraduate") {
    // Medicine (founder rule, 14 Jul 2026): Mathematics is NOT mandatory —
    // any 3 of Physics, Chemistry, Biology, Mathematics qualify.
    if (field === "Medicine & Public Health") {
      const subjects = (profile.major_stream ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (subjects.length === 0) return null; // don't pre-scold
      const have = MEDICINE_UG_SUBJECTS.filter((req) =>
        subjects.includes(req.toLowerCase()),
      ).length;
      if (have >= 3) return null;
      return `Medicine programs require at least 3 of Class XII ${MEDICINE_UG_SUBJECTS.join(", ")}. Update your subjects or choose a suitable program.`;
    }

    if (!STEM_UG_FIELDS.has(field)) return null;

    // major_stream is a comma-separated list of HS subjects in the UG
    // branch (StepAcademic.toggleSubject writes it that way). If empty,
    // don't pre-scold — they haven't reached that question yet.
    const subjects = (profile.major_stream ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (subjects.length === 0) return null;

    const missing = STEM_UG_REQUIRED_SUBJECTS.filter(
      (req) => !subjects.includes(req.toLowerCase()),
    );
    if (missing.length === 0) return null;
    return `STEM undergraduate programs require Class XII ${STEM_UG_REQUIRED_SUBJECTS.join(", ")}. Your subjects are missing: ${missing.join(", ")}. Choose a suitable program or update your subjects.`;
  }

  return null;
}

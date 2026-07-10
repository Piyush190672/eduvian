import { z } from "zod";

/**
 * Zod schemas for API input validation — closes security item M3
 * (Phase 1 item 5, 10 July 2026). Philosophy: validate types, lengths
 * and ranges strictly enough to kill injection/corruption vectors, but
 * stay permissive on unknown optional fields (.passthrough()) so the
 * evolving profile form never bricks production submissions.
 */

// ── /api/submit ───────────────────────────────────────────────────────────────

export const submitProfileSchema = z
  .object({
    full_name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(255),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    nationality: z.string().max(80).optional(),
    city: z.string().max(120).optional(),
    degree_level: z.enum(["undergraduate", "postgraduate"]),
    intended_field: z.string().min(1).max(80),
    intended_field_custom: z.string().max(80).optional(),
    intended_field_extra: z.array(z.string().max(80)).max(2).optional(),
    // Covers every scale in use: percentage 0-100, GPA 0-4/0-10 (Indian
    // 10-pt CGPA is entered under "gpa" today — a dedicated cgpa_10 type
    // is Phase-2 work), IB 0-45.
    academic_score: z.number().min(0).max(100),
    academic_score_type: z.string().max(20).optional(),
    english_test: z.enum(["ielts", "toefl", "pte", "duolingo", "none"]).optional(),
    // Widest legal range across tests (Duolingo tops at 160).
    english_score_overall: z.number().min(0).max(160).optional(),
    std_test_pg: z.enum(["gre", "gmat", "none"]).optional(),
    std_test_pg_score: z.number().min(0).max(805).optional(),
    std_test_ug: z.enum(["sat", "act", "none"]).optional(),
    std_test_ug_score: z.number().min(0).max(1600).optional(),
    backlogs: z.boolean().optional(),
    backlog_count: z.number().int().min(0).max(60).optional(),
    work_experience_years: z.number().min(0).max(45).optional(),
    research_paper_count: z.number().int().min(0).max(50).optional(),
    budget_range: z.enum([
      "under_25k", "25k_35k", "35k_50k", "50k_70k", "above_70k",
      // Legacy keys — old drafts/preloads still submit them.
      "under_20k", "20k_35k",
    ]),
    country_preferences: z.array(z.string().max(4)).min(1).max(12),
    target_intake_year: z.number().int().min(2024).max(2035),
    target_intake_semester: z.string().max(20),
    qs_ranking_preference: z.string().max(20).optional(),
    graduation_year: z.number().int().min(1980).max(2032).optional(),
    institution_name: z.string().max(200).optional(),
    major_stream: z.string().max(300).optional(),
    current_degree: z.string().max(120).optional(),
  })
  .passthrough(); // unknown optional profile fields flow through unchanged

// ── /api/results/[token] PATCH ────────────────────────────────────────────────

// Stable content-hash ids (p_<16hex>) or legacy positional ids (prog_N).
const PROGRAM_ID_RE = /^(p_[0-9a-f]{16}|prog_\d{1,5})$/;

export const resultsPatchSchema = z.object({
  shortlisted_ids: z.array(z.string().regex(PROGRAM_ID_RE)).max(80),
});

// ── /api/auth ─────────────────────────────────────────────────────────────────

export const authBodySchema = z
  .object({
    action: z.enum(["register", "login", "login_password"]),
    email: z.string().trim().max(255),
    name: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(30).optional(),
    source: z.string().max(60).optional().nullable(),
    source_stage: z.number().int().min(1).max(5).optional().nullable(),
    otp_code: z.string().regex(/^[0-9]{6}$/).optional(),
    marketing_opt_in: z.boolean().optional(),
    terms_accepted: z.boolean().optional(),
    password: z.string().max(200).optional(),
  })
  .passthrough();

// ── /api/chat ─────────────────────────────────────────────────────────────────

export const chatBodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(40),
  // Client-derived results context. Treated as UNTRUSTED data — the chat
  // route wraps it with wrapUserInput before it reaches the model.
  programsContext: z.string().max(8000).optional(),
});

/** Uniform 400 payload from a Zod failure — first issue only, no echo of input. */
export function zodErrorMessage(err: z.ZodError): string {
  const first = err.issues[0];
  if (!first) return "Invalid input";
  const path = first.path.join(".");
  return path ? `Invalid input: ${path} — ${first.message}` : `Invalid input: ${first.message}`;
}

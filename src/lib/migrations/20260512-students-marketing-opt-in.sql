-- Marketing email opt-in (Privacy Policy §11) — Tier-C #14
--
-- Adds an explicit opt-in flag + timestamp to the `students` table so future
-- marketing / promotional sends can be gated against it. Transactional sends
-- (welcome, match results, tool outputs) ignore this flag.
--
-- Defaults to FALSE per "explicitly opted in" wording in Privacy Policy §11.
-- The auth route (src/app/api/auth/route.ts) already writes this column on
-- register; it falls back gracefully if the column is missing, so this SQL
-- can be applied at any time without coordinated deploy.
--
-- Run in Supabase Studio (SQL Editor) — destructive ops still require user
-- approval per the project's Hard Rules (CLAUDE.md §8).

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS marketing_opt_in       boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at    timestamptz  NULL;

-- Helpful index for the (eventual) marketing-send worker that filters on the flag.
CREATE INDEX IF NOT EXISTS students_marketing_opt_in_idx
  ON public.students (marketing_opt_in)
  WHERE marketing_opt_in = true;

-- Verification:
--   SELECT marketing_opt_in, count(*) FROM public.students GROUP BY 1;

-- Terms + Privacy explicit acceptance (Legal P0 #5, handoff #19) — recorded at register.
--
-- Adds a timestamp + version column to `students` so we can prove which version
-- of the Terms / Privacy Policy a given account agreed to, and when. The auth
-- route writes both fields on register and falls back gracefully if the
-- columns are missing, so this SQL can be applied at any time without a
-- coordinated deploy.
--
-- `terms_version` is the value of TERMS_VERSION at the time of acceptance
-- (see src/lib/legal-version.ts). Bumping that constant invalidates implicit
-- acceptance for older accounts (a re-acceptance prompt is item #5b in §39).
--
-- Run in Supabase Studio (SQL Editor) — destructive ops still require user
-- approval per CLAUDE.md "Hard rules" §8.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS terms_accepted_at  timestamptz  NULL,
  ADD COLUMN IF NOT EXISTS terms_version      text         NULL;

-- Verification:
--   SELECT terms_version, count(*) FROM public.students
--   WHERE terms_accepted_at IS NOT NULL GROUP BY 1;

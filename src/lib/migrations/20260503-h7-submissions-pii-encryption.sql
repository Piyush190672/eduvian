-- H7 Phase A — Add shadow columns for PII encryption on submissions.profile.
--
-- Strategy: dual-write. The application starts populating
--   - email_hash         (deterministic HMAC, indexed for equality lookup)
--   - profile_encrypted  (AES-256-GCM blob, base64 TEXT)
-- alongside the existing plaintext profile JSONB. After a backfill sweep
-- and an observation window, readers switch to profile_encrypted and the
-- plaintext column is dropped (Phase C, separate migration).
--
-- This migration only ADDS columns + indexes — nothing is deleted, no
-- existing query is broken. Safe to run in production.
--
-- Run in Supabase SQL Editor.

BEGIN;

ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS email_hash         TEXT,
  ADD COLUMN IF NOT EXISTS profile_encrypted  TEXT,
  ADD COLUMN IF NOT EXISTS profile_enc_version SMALLINT;

CREATE INDEX IF NOT EXISTS idx_submissions_email_hash
  ON public.submissions(email_hash);

COMMIT;

-- Post-migration sanity check (run separately):
--   SELECT
--     count(*)                                  AS total,
--     count(*) FILTER (WHERE email_hash IS NOT NULL)         AS hashed,
--     count(*) FILTER (WHERE profile_encrypted IS NOT NULL)  AS encrypted
--   FROM public.submissions;
-- Right after this migration, both `hashed` and `encrypted` should be 0.
-- After the backfill script, both should equal `total`.

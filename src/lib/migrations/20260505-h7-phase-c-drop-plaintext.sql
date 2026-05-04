-- H7 Phase C — Drop the plaintext submissions.profile column.
--
-- ────────────────────────────────────────────────────────────────────────
-- ⚠ DO NOT RUN until ALL of the following are true:
--   1. Phase B has been live in production for at least 24 hours.
--   2. A fresh pg_dump (or confirmed Supabase Pro scheduled backup
--      from within the last 12 hours) is in hand.
--   3. The application code has been updated to:
--        a. Remove `profile` from SUBMISSION_PROFILE_COLUMNS in
--           src/lib/submissions-decrypt.ts
--        b. Remove the plaintext fallback inside decryptProfile()
--        c. Remove `profile` from the explicit SELECT in
--           src/app/api/admin/leads/route.ts
--      …and that code is deployed on Vercel and verified live.
--   4. Sanity check on prod data — every row has profile_encrypted set:
--        SELECT count(*) FILTER (WHERE profile_encrypted IS NULL) AS unencrypted,
--               count(*) FILTER (WHERE email_hash IS NULL)        AS unhashed,
--               count(*)                                          AS total
--        FROM public.submissions;
--      Both `unencrypted` and `unhashed` must be 0. If not, run the
--      backfill script before proceeding.
-- ────────────────────────────────────────────────────────────────────────
--
-- This migration is destructive — once the column is dropped, the
-- plaintext data is gone forever. The pg_dump is the only undo path.
--
-- Run in Supabase SQL Editor.

BEGIN;

-- Defensive: if any row is somehow missing encrypted data at this point,
-- abort the transaction rather than silently lose plaintext.
DO $$
DECLARE
  unencrypted_count BIGINT;
BEGIN
  SELECT count(*) INTO unencrypted_count
    FROM public.submissions
    WHERE profile_encrypted IS NULL;
  IF unencrypted_count > 0 THEN
    RAISE EXCEPTION 'Aborting: % submission row(s) still lack profile_encrypted. Run the backfill script first.', unencrypted_count;
  END IF;
END $$;

ALTER TABLE public.submissions
  DROP COLUMN IF EXISTS profile;

COMMIT;

-- Post-migration verification:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'submissions'
--   ORDER BY ordinal_position;
-- The `profile` column should NOT appear in the result.

-- Password authentication (alternative to email OTP) for registered users.
--
-- Adds two nullable columns to public.students:
--   - password_hash    : scrypt-formatted hash string ("scrypt$N$r$p$salt$key")
--                        produced by src/lib/password.ts hashPassword().
--   - password_set_at  : timestamptz the password was last set/changed.
--
-- Both columns stay NULL for accounts that never set a password — these
-- users continue to log in via the existing email-OTP flow. Users who set
-- a password get the choice of OTP or Password at login.
--
-- No data loss, no breaking changes. The /api/auth login_password action
-- falls back gracefully if the column doesn't exist yet (the lookup will
-- return undefined and the route responds with "no password set").
--
-- Run in Supabase Studio. Idempotent.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS password_hash    text         NULL,
  ADD COLUMN IF NOT EXISTS password_set_at  timestamptz  NULL;

-- Partial index helps the (eventual) admin-dashboard query "how many
-- registered users have a password set" without scanning the whole table.
CREATE INDEX IF NOT EXISTS students_password_set_idx
  ON public.students (password_set_at DESC)
  WHERE password_hash IS NOT NULL;

-- Verification:
--   SELECT count(*) FILTER (WHERE password_hash IS NOT NULL) AS with_password,
--          count(*) AS total
--   FROM public.students;

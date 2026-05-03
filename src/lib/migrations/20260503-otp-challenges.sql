-- Email OTP challenges for register + login flows.
--
-- One row per attempt. Code is stored as HMAC-SHA256 keyed on
-- PII_HASH_SECRET so a DB read alone doesn't reveal valid codes.
-- attempts is bumped on every wrong submission; once it crosses the
-- max, locked_until pushes the next attempt out by the cooldown
-- window. Idempotent — safe to re-run.
--
-- Run in Supabase SQL Editor.

BEGIN;

CREATE TABLE IF NOT EXISTS public.otp_challenges (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL,
  code_hash     TEXT        NOT NULL,
  purpose       TEXT        NOT NULL CHECK (purpose IN ('register', 'login')),
  attempts      SMALLINT    NOT NULL DEFAULT 0,
  used          BOOLEAN     NOT NULL DEFAULT false,
  expires_at    TIMESTAMPTZ NOT NULL,
  locked_until  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip            TEXT,
  user_agent    TEXT
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_email_created
  ON public.otp_challenges(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_expires
  ON public.otp_challenges(expires_at);

ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "otp_challenges_service_all" ON public.otp_challenges;
CREATE POLICY "otp_challenges_service_all"
  ON public.otp_challenges
  FOR ALL
  USING (auth.role() = 'service_role');

COMMIT;

-- Optional housekeeping (run later as a scheduled job):
--   DELETE FROM public.otp_challenges
--   WHERE created_at < now() - interval '7 days';

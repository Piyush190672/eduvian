-- H2 — Replace HMAC-encoded user cookies with opaque server-side session IDs.
--
-- Background: the legacy eduvianai_user cookie embedded the user's email
-- inside an HMAC-signed payload that was base64url-encoded but otherwise
-- plaintext. Anyone with read access to a user's browser storage (XSS,
-- shared device, malware) could decode the email even though they
-- couldn't forge new cookies. We're switching to opaque UUID session IDs
-- that resolve to email server-side via this table.
--
-- Side effect: every existing user gets logged out the moment the new
-- code goes live, because their old cookie format no longer parses. A
-- banner on the site warns users to sign back in / re-register.
--
-- Run this in the Supabase SQL editor against the production project.

BEGIN;

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent  TEXT,
  ip          TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_email   ON public.user_sessions(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON public.user_sessions(expires_at);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Service role only. The cookie-side flow always goes through API routes
-- holding the secret key, so anon must never see this table.
DROP POLICY IF EXISTS "user_sessions_service_all" ON public.user_sessions;
CREATE POLICY "user_sessions_service_all"
  ON public.user_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

COMMIT;

-- Optional housekeeping — run later as a scheduled job.
-- DELETE FROM public.user_sessions WHERE expires_at < now() - interval '7 days';

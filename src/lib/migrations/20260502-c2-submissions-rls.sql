-- C2 — Close submissions IDOR.
--
-- Background: the original schema declared
--   CREATE POLICY "submissions_token_read" ON submissions FOR SELECT USING (true);
-- which let anyone holding the publishable anon key SELECT * FROM submissions
-- and walk the entire table (every applicant profile, every shortlist).
--
-- All server code that needs to read submissions already goes through
-- createServiceClient() (bypasses RLS), so removing the anon SELECT path
-- breaks nothing in the app and slams the door on direct anon reads.
--
-- Run this in the Supabase SQL editor against the production project.
-- Audit your Supabase request logs for prior anon SELECTs against
-- submissions before/after running, to confirm the leak surface and that
-- nothing legitimate was relying on it.

BEGIN;

-- The leaky policy. Both names appear historically; drop both if present.
DROP POLICY IF EXISTS "submissions_token_read" ON public.submissions;
DROP POLICY IF EXISTS submissions_token_read ON public.submissions;

-- Belt + suspenders: explicitly deny anon/authenticated SELECT.
-- service_role bypasses RLS so this does not affect API routes.
DROP POLICY IF EXISTS "submissions_no_public_read" ON public.submissions;
CREATE POLICY "submissions_no_public_read"
  ON public.submissions
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- Confirm RLS is on (no-op if already enabled).
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Post-deploy verification (run as anon, e.g. from a fresh PostgREST request
-- with only the publishable key, NOT the service key):
--   SELECT count(*) FROM submissions;   -- expect: 0 rows or permission denied
-- And confirm app still works end-to-end: submit a profile, hit
-- /results/<token>, /api/email, /admin/leads.

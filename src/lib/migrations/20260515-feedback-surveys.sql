-- Feedback surveys — 1-5 star rating + optional free-text comment
-- captured after a user has used a real surface (results page, application
-- check, interview prep, visa coach). One row per submission. Read by the
-- admin dashboard for trend / per-surface breakdown.
--
-- Run in Supabase Studio (SQL Editor). Idempotent.

CREATE TABLE IF NOT EXISTS public.feedback_surveys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash   text         NULL,                                -- nullable for anon traffic
  rating       int          NOT NULL CHECK (rating BETWEEN 1 AND 5),
  surface      text         NOT NULL CHECK (surface IN (
                                'results',
                                'application-check',
                                'interview-prep',
                                'visa-coach'
                              )),
  comment      text         NULL,                                -- optional free text (<= 1000 chars enforced at API)
  ip           text         NULL,                                -- captured via getClientIp()
  ua           text         NULL,                                -- user-agent (first 500 chars)
  created_at   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_surveys_created_idx ON public.feedback_surveys (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_surveys_surface_idx ON public.feedback_surveys (surface, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_surveys_rating_idx  ON public.feedback_surveys (rating);

-- RLS: deny everything from anon / authenticated. Only the service role
-- (used by /api/feedback) writes; the admin dashboard reads via service
-- role too.
ALTER TABLE public.feedback_surveys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_surveys_no_anon ON public.feedback_surveys;
DROP POLICY IF EXISTS feedback_surveys_no_auth ON public.feedback_surveys;

-- Verification:
--   SELECT count(*), surface, avg(rating)::numeric(3,2) FROM public.feedback_surveys GROUP BY surface;
--   SELECT * FROM public.feedback_surveys ORDER BY created_at DESC LIMIT 20;

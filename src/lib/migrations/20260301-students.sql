-- Students table — original CREATE migration.
--
-- This file was reconstructed from a Supabase Studio snippet that had
-- never been version-controlled. The actual CREATE was run in
-- production sometime before 2026-04-25 (the date on tool_usage); the
-- "20260301" prefix is approximate, picked so this file sorts before
-- every other migration in src/lib/migrations/ (since it is the
-- foundational create for the students table that subsequent
-- migrations alter).
--
-- DO NOT RE-RUN unless you know the table is missing. The CREATE TABLE
-- uses IF NOT EXISTS so it's idempotent for the table itself, but the
-- DROP/CREATE POLICY pair is destructive against current policies and
-- would silently overwrite any policy hardening done since.
--
-- Subsequent migrations on this table:
--   - 20260512-students-marketing-opt-in.sql  adds marketing_opt_in
--     and marketing_opt_in_at columns + partial index.
--
-- Open follow-up (security): the "students_public_insert" policy below
-- grants INSERT to the anon role. The current /api/auth register
-- handler uses createServiceClient() and bypasses RLS anyway, so this
-- policy is unused in the legitimate flow but provides a write surface
-- to anyone holding the anon key (which is visible to every browser).
-- Consider dropping the public-insert policy after verifying no other
-- code path relies on it.

BEGIN;

CREATE TABLE IF NOT EXISTS public.students (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT        NOT NULL,
  email        TEXT        UNIQUE NOT NULL,
  phone        TEXT        DEFAULT '',
  source       TEXT,
  source_stage INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_email   ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_created ON public.students(created_at);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_public_insert" ON public.students;
CREATE POLICY "students_public_insert" ON public.students FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "students_service_all" ON public.students;
CREATE POLICY "students_service_all" ON public.students FOR ALL USING (auth.role() = 'service_role');

COMMIT;

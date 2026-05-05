-- Run this in your Supabase SQL editor to set up the database schema

-- ─── Programs table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  qs_ranking INTEGER,
  program_name TEXT NOT NULL,
  degree_level TEXT NOT NULL CHECK (degree_level IN ('undergraduate', 'postgraduate', 'both')),
  duration_months INTEGER NOT NULL,
  field_of_study TEXT NOT NULL,
  specialization TEXT NOT NULL,
  annual_tuition_usd NUMERIC NOT NULL,
  avg_living_cost_usd NUMERIC NOT NULL,
  intake_semesters TEXT[] NOT NULL DEFAULT '{}',
  application_deadline TEXT,
  min_gpa NUMERIC,
  min_percentage NUMERIC,
  min_ielts NUMERIC,
  min_toefl NUMERIC,
  min_pte NUMERIC,
  min_duolingo NUMERIC,
  min_gre NUMERIC,
  min_gmat NUMERIC,
  min_sat NUMERIC,
  work_exp_required_years INTEGER,
  program_url TEXT NOT NULL,
  apply_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Submissions table ────────────────────────────────────────────────────────
-- profile_encrypted holds the AES-256-GCM blob of the StudentProfile.
-- email_hash is the HMAC-SHA256 of the email for lookup without
-- decrypting the blob. The plaintext `profile` JSONB column existed
-- prior to H7 Phase C (migration 20260505-h7-phase-c-drop-plaintext.sql)
-- and was dropped after the encrypted backfill landed.
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  shortlisted_ids TEXT[] DEFAULT '{}',
  email_sent BOOLEAN DEFAULT false,
  profile_category TEXT,
  total_matched INTEGER DEFAULT 0,
  email_hash TEXT,
  profile_encrypted TEXT,
  profile_enc_version SMALLINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration: run these if the submissions table already exists
-- ALTER TABLE submissions ADD COLUMN IF NOT EXISTS profile_category TEXT;
-- ALTER TABLE submissions ADD COLUMN IF NOT EXISTS total_matched INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_token ON submissions(token);
CREATE INDEX IF NOT EXISTS idx_submissions_email_hash ON submissions(email_hash);
CREATE INDEX IF NOT EXISTS idx_programs_country ON programs(country);
CREATE INDEX IF NOT EXISTS idx_programs_field ON programs(field_of_study);
CREATE INDEX IF NOT EXISTS idx_programs_level ON programs(degree_level);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);

-- Enable Row Level Security
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Programs: public read, service-role write
CREATE POLICY "programs_public_read" ON programs FOR SELECT USING (true);
CREATE POLICY "programs_service_write" ON programs FOR ALL USING (auth.role() = 'service_role');

-- Submissions: public can INSERT only; reads are server-side via service-role.
-- (Token-scoped reads happen in API routes that hold the secret key. The
-- explicit anon SELECT denial guards against future RLS regressions; see
-- migrations/20260502-c2-submissions-rls.sql for the production fix.)
CREATE POLICY "submissions_public_insert" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_no_public_read" ON submissions FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "submissions_service_all" ON submissions FOR ALL USING (auth.role() = 'service_role');

-- ─── Students table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  source TEXT,
  source_stage INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_created ON students(created_at);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students_public_insert" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "students_service_all"   ON students FOR ALL   USING (auth.role() = 'service_role');

-- Migration: add source tracking to existing students table
-- Run this if the students table already exists without these columns:
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS source TEXT;
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS source_stage INTEGER;

-- ─── User sessions table (opaque cookie -> email lookup) ────────────────────
-- See migrations/20260502-h2-user-sessions.sql for the production fix.
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
CREATE POLICY "user_sessions_service_all" ON public.user_sessions FOR ALL USING (auth.role() = 'service_role');

-- ─── OTP challenges (email verification on register / login) ────────────────
-- See migrations/20260503-otp-challenges.sql.
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
CREATE INDEX IF NOT EXISTS idx_otp_challenges_email_created ON public.otp_challenges(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_expires ON public.otp_challenges(expires_at);
ALTER TABLE public.otp_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "otp_challenges_service_all" ON public.otp_challenges FOR ALL USING (auth.role() = 'service_role');

-- ─── Tool usage table (beta gate) ────────────────────────────────────────────
create table if not exists public.tool_usage (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tool text not null,
  ip text,
  cost_estimate_cents integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_tool_usage_created on public.tool_usage(created_at desc);
create index if not exists idx_tool_usage_email_created on public.tool_usage(email, created_at desc);
create index if not exists idx_tool_usage_email_tool_created on public.tool_usage(email, tool, created_at desc);
alter table public.tool_usage enable row level security;
-- Service role only; no public policies.

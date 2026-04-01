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
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Submissions table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  profile JSONB NOT NULL,
  shortlisted_ids TEXT[] DEFAULT '{}',
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_token ON submissions(token);
CREATE INDEX IF NOT EXISTS idx_submissions_email ON submissions((profile->>'email'));
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

-- Submissions: public insert + read, service-role all
CREATE POLICY "submissions_public_insert" ON submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_token_read" ON submissions FOR SELECT USING (true);
CREATE POLICY "submissions_service_all" ON submissions FOR ALL USING (auth.role() = 'service_role');

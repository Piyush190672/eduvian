-- Profile drafts — in-progress form state for the multi-step /profile
-- flow, autosaved as the user types so it syncs across devices.
--
-- One row per user (UNIQUE on email_hash). Encrypted blob holds the
-- whole StudentProfile-shaped payload (same H7 AES-256-GCM scheme as
-- the submissions table). When a user finally Submits, the matching
-- row in `submissions` is the source of truth — the draft can be
-- cleared (or just left to age out).
--
-- Run in Supabase Studio (SQL Editor). Idempotent.

CREATE TABLE IF NOT EXISTS public.profile_drafts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash         text         NOT NULL UNIQUE,
  profile_encrypted  text         NOT NULL,
  updated_at         timestamptz  NOT NULL DEFAULT now(),
  created_at         timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profile_drafts_updated_idx ON public.profile_drafts (updated_at DESC);

-- RLS: deny everything from anon / authenticated. Only the service
-- role (used by /api/profile-draft) reads + writes.
ALTER TABLE public.profile_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profile_drafts_no_anon ON public.profile_drafts;
DROP POLICY IF EXISTS profile_drafts_no_auth ON public.profile_drafts;

-- Verification:
--   SELECT count(*), max(updated_at) FROM public.profile_drafts;

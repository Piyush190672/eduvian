-- Admin audit log — closes M6 from the 2 May 2026 security audit.
--
-- Captures every action taken via an /admin or /api/admin/* surface so
-- that incidents can be reconstructed by actor, time, IP and UA. The
-- table is append-only — RLS deny-all from anon; only the service
-- role writes (via src/lib/admin-audit.ts), and only the admin
-- dashboard reads (via service role).
--
-- The `actor` column stores the admin's email when known (POST to
-- /api/admin/session captures it from the verified Supabase JWT). For
-- subsequent requests where only the session cookie is present, we
-- store the SHA-256 hash of the session token — joinable to the
-- session_started row that recorded the email.
--
-- Run in Supabase Studio (SQL Editor). Idempotent.

CREATE TABLE IF NOT EXISTS public.admin_audit (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor         text         NOT NULL,                  -- email OR session-token-hash
  actor_kind    text         NOT NULL CHECK (actor_kind IN ('email', 'session_hash')),
  action        text         NOT NULL,                  -- e.g. 'session_started', 'leads.read', 'beta_usage.read'
  target        text         NULL,                      -- optional: resource ID acted on
  metadata      jsonb        NULL,                      -- optional: { route, query, count, … }
  ip            text         NULL,                      -- client IP captured via getClientIp()
  ua            text         NULL,                      -- user-agent (first 500 chars)
  created_at    timestamptz  NOT NULL DEFAULT now()
);

-- Indexes — admin dashboard will commonly query the most recent rows
-- and filter by actor when reviewing a specific operator.
CREATE INDEX IF NOT EXISTS admin_audit_created_at_idx ON public.admin_audit (created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_actor_idx      ON public.admin_audit (actor, created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_action_idx     ON public.admin_audit (action, created_at DESC);

-- RLS: deny everything from anon / authenticated. Only the service role
-- (used by the API routes) writes; the admin dashboard reads via the
-- same service role.
ALTER TABLE public.admin_audit ENABLE ROW LEVEL SECURITY;

-- Drop any leftover permissive policy from a prior partial apply,
-- then declare the explicit deny-all stance for anon / authenticated.
DROP POLICY IF EXISTS admin_audit_no_anon  ON public.admin_audit;
DROP POLICY IF EXISTS admin_audit_no_auth  ON public.admin_audit;

-- Verification:
--   SELECT count(*), max(created_at) FROM public.admin_audit;
--   SELECT * FROM public.admin_audit ORDER BY created_at DESC LIMIT 20;

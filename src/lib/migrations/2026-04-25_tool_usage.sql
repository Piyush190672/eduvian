-- Beta gate: per-call usage log.
-- Run this once in the Supabase SQL editor before deploying the beta-gate code.

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

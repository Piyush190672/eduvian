# eduvianAI — Beta Access Controls

The free beta is gated server-side to keep AI spend bounded. Three layers of protection:

1. **Per-month unique-user cap** — capacity limit on how many distinct emails can use the beta in a calendar month.
2. **Per-user, per-tool monthly caps** — each user gets a fixed quota per tool.
3. **Global monthly spend cap** — hard ceiling on estimated Anthropic spend across all users. If the cap is reached, the entire beta is paused until the 1st.

Anthropic prompt caching is enabled on the heavy AI routes (SOP, CV, Application Check, LOR generate + assess) — the static rubric/system text is sent with `cache_control: { type: "ephemeral" }`, so repeat calls within the cache TTL only pay for the dynamic user content. Realistic monthly Anthropic spend at 100 active users is now ~$7–10 (versus ~$15 without caching). The hard ceiling via `MAX_MONTHLY_SPEND_CENTS` is $50 by default.

## Caps

- **100 unique users per calendar month** (UTC). The 101st new user this month is blocked until the 1st.
- Per-user, per-tool monthly caps (unchanged):

| Tool                  | Cap / user / month |
| --------------------- | ------------------ |
| sop-assistant         | 5                  |
| cv-assessment         | 3                  |
| application-check     | 3                  |
| lor-coach-generate    | 1                  |
| lor-coach-assess      | 5                  |
| interview-feedback    | 10                 |
| score-english         | 10                 |
| chat                  | 50                 |
| extract-text          | 20                 |

- **Global monthly spend cap**: when the sum of `cost_estimate_cents` across this month's `tool_usage` rows reaches `MAX_MONTHLY_SPEND_CENTS`, every non-owner request is blocked with `reason: "spend_cap_exceeded"` until the 1st.

## Owner bypass

Set `BETA_OWNER_EMAILS` (comma-separated, lowercase) — those emails skip every cap (unique-users, per-tool, AND the global spend cap).

```
BETA_OWNER_EMAILS=you@example.com,cofounder@example.com
```

## Required env vars

| Var                          | Purpose                                                             |
| ---------------------------- | ------------------------------------------------------------------- |
| `ADMIN_SESSION_SECRET`       | HMAC secret for admin AND user signed cookies (32+ chars)           |
| `BETA_OWNER_EMAILS`          | Comma-separated owner allowlist (bypasses all beta caps)            |
| `MAX_MONTHLY_SPEND_CENTS`    | Global monthly spend ceiling, in cents. Default `5000` ($50).       |
| `NEXT_PUBLIC_SUPABASE_URL`   | Supabase URL                                                        |
| `SUPABASE_SECRET_KEY`        | Supabase service-role key (used by `createServiceClient()`)         |
| `ANTHROPIC_API_KEY`          | Anthropic API key                                                   |

## Migration

Run this in the Supabase SQL editor **before deploying**:

```
src/lib/migrations/2026-04-25_tool_usage.sql
```

It creates the `tool_usage` table (including the `cost_estimate_cents` column) + indexes and enables RLS (service-role only).

## How it works

1. `POST /api/auth` (register or login) sets an HMAC-signed cookie `eduvianai_user` containing the email (30-day TTL).
2. Each AI route (`/api/sop-assistant`, `/api/cv-assessment`, `/api/application-check`, `/api/lor-coach`, `/api/interview-feedback`, `/api/score-english`, `/api/chat`, `/api/extract-text`) reads the cookie, then calls `checkBetaAccess(email, tool)`:
   - 401 with `reason: "no_user"` if no cookie.
   - 403 with `reason: "spend_cap_exceeded"` if this month's total `cost_estimate_cents` ≥ `MAX_MONTHLY_SPEND_CENTS`.
   - 403 with `reason: "beta_full"` if 100 unique users already this month and this email isn't one of them.
   - 403 with `reason: "tool_cap_exceeded"` if this user has hit the per-tool cap.
   - Otherwise the call proceeds and (on success) `logToolUsage` writes a row to `tool_usage` including the per-tool `cost_estimate_cents` from `TOOL_COST_CENTS`.
3. Owner emails skip step 2 entirely.

Per-tool cost estimates (cents, post-caching ballpark) live in `TOOL_COST_CENTS` in `src/lib/beta-gate.ts` — adjust as real-world spend data lands.

## Admin visibility

`/admin/dashboard` shows a "Beta Usage This Month" card with:
- Unique-user gauge (X / 100)
- Spend gauge ($X.XX of $50 used)
- Total calls + top 3 tools

It hits `GET /api/admin/beta-usage` (admin-cookie protected via existing middleware), which now also returns `spendCents` and `spendCapCents`.

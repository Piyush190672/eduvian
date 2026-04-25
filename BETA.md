# eduvianAI — Beta Access Controls

The free beta is gated server-side to keep AI spend bounded. Worst case: 20 unique users × per-tool caps × Anthropic pricing → designed to stay under ~$5/month.

## Caps

- **20 unique users per calendar month** (UTC). The 21st user this month is blocked until the 1st.
- Per-user, per-tool monthly caps:

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

## Owner bypass

Set `BETA_OWNER_EMAILS` (comma-separated, lowercase) — those emails skip every cap.

```
BETA_OWNER_EMAILS=you@example.com,cofounder@example.com
```

## Required env vars

| Var                     | Purpose                                                     |
| ----------------------- | ----------------------------------------------------------- |
| `ADMIN_SESSION_SECRET`  | HMAC secret for admin AND user signed cookies (32+ chars)   |
| `BETA_OWNER_EMAILS`     | Comma-separated owner allowlist (bypasses all beta caps)    |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL                                             |
| `SUPABASE_SECRET_KEY`   | Supabase service-role key (used by `createServiceClient()`) |
| `ANTHROPIC_API_KEY`     | Anthropic API key                                           |

## Migration

Run this in the Supabase SQL editor **before deploying**:

```
src/lib/migrations/2026-04-25_tool_usage.sql
```

It creates the `tool_usage` table + indexes and enables RLS (service-role only).

## How it works

1. `POST /api/auth` (register or login) sets an HMAC-signed cookie `eduvianai_user` containing the email (30-day TTL).
2. Each AI route (`/api/sop-assistant`, `/api/cv-assessment`, `/api/application-check`, `/api/lor-coach`, `/api/interview-feedback`, `/api/score-english`, `/api/chat`, `/api/extract-text`) reads the cookie, then calls `checkBetaAccess(email, tool)`:
   - 401 with `reason: "no_user"` if no cookie.
   - 403 with `reason: "beta_full"` if 20 unique users already this month and this email isn't one of them.
   - 403 with `reason: "tool_cap_exceeded"` if this user has hit the per-tool cap.
   - Otherwise the call proceeds and (on success) `logToolUsage` writes a row to `tool_usage`.
3. Owner emails skip steps 2 entirely.

## Admin visibility

`/admin/dashboard` shows a "Beta Usage This Month" card with the unique-user gauge (X / 20), total calls, and top 3 tools. It hits `GET /api/admin/beta-usage` (admin-cookie protected via existing middleware).

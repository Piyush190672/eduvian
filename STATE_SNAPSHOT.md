# EduvianAI — Comprehensive State Snapshot for Session Handoff

**Last updated:** 5 May 2026 late evening (handoff #6 — H7 Phase C fully closed, including a writer-side dev/preview gap discovered during cleanup)
**Purpose:** Zero-loss handoff between Claude Code sessions. A new session reading this should be able to continue *every* in-flight workstream correctly, respect all user preferences, and avoid all known gotchas.

> **H7 Phase C is now FULLY DONE.** Schema check (5 May late evening) showed the plaintext `profile` column was already absent — the destructive SQL had been run in the prior crashed session. Coverage check found 2 zombie rows (`profile_encrypted=NULL` AND `email_hash=NULL`) — both inserted today via a non-prod NODE_ENV path, deleted manually. **Writer patched** to skip the Supabase insert entirely when encryption inputs are missing (option 2B), closing the dev/preview hole regardless of NODE_ENV. Live submissions table is now clean: 5 rows, all encrypted + hashed.
>
> **Pinned next-session priority:** (b) port v2 brand language to the deep tool pages — `/application-check`, `/interview-prep`, `/english-test-lab`, `/roi-calculator`, `/visa-coach`, `/parent-decision`, `/get-started`. They still wear the pre-swap visuals. Brand spec is locked in CLAUDE.md "Brand direction" section.
>
> Secondary: (c) clean up the 63 still-unverified entries in `programs.ts` (§20.2 below has the recipe). Then marketing-opt-in / unsubscribe / sample-parent-report PDF.

> **Read this top-to-bottom before doing anything.** Then run the verification commands in §0 to confirm reality matches this document.

---

## §0 First-action verification

```bash
cd /Users/piyushkumar/Playground/eduvian

# 1. Where is the codebase?
git log --oneline -10
git status --short

# 2. What's running in the background? (no tier chain currently expected)
ps aux | grep -E "verify-program|verify-batch|websearch-seed|seed-crawler|re-verify" | grep -v grep

# 3. Database scale check (expected: 5,595 programs, 5,532 verified, 12 countries)
python3 -c "
import re
from collections import Counter
with open('src/data/programs.ts') as f: t=f.read()
n = len(re.findall(r'program_name:', t))
v = len(re.findall(r'verified_at:', t))
c = Counter(re.findall(r'country:\s*\"([^\"]+)\"', t))
print(f'Programs: {n}, verified: {v}, countries: {len(c)}')
print('Per-country:', dict(c.most_common()))"

# 4. Verify the live deploy matches the latest commit
git log --oneline -1
curl -s https://www.eduvianai.com/ | grep -oE 'main-app-[a-f0-9]+\.js' | head -1
# (different chunk hash from local build is fine — same hash means deploy is current)

# 5. Any open processes consuming API budget?
# Check Anthropic Console for current month spend if uncertain.
```

If counts deviate significantly from this document's numbers, the document is stale — refresh first by reading the most recent commits.

---

## §1 Operating principles (how I work for this user)

### 1.1 Communication style
- **Terse, structured, factual.** User prefers tables, bulleted summaries, code blocks. Avoid prose padding.
- **Lead with what changed**, not what I'm about to do.
- **Numbers always.** "138 programs" not "many programs."
- **Confirm destructive ops** before running. Especially: `git push --force`, `rm -rf`, `DROP`, anything that mass-deletes.
- **Don't ask permission for tool calls when intent is obvious** (read files, run grep, run npm install).
- **Never claim something is done until I've verified it.** Run `git log` after a commit, `tsc --noEmit` after a code change, `ps -p` to confirm a job started.

### 1.2 The ping pattern
The user pings periodically (literally typing "ping" or "status?") to check on long-running background jobs. Response shape:
1. PID + elapsed time
2. Last 3 log lines
3. Progress count + remaining ETA
4. Anything anomalous

Example response: "**170/452** done in 35 min. ok=147, rejected=15, err=8. ~80 min remaining."

### 1.3 Deploy semantics
The user separates "commit" from "deploy" (push). Defaults:
- Code that's been validated and intended for production: commit AND push
- Drafts (legal, pricing) or items needing human review: commit locally, **DO NOT PUSH**
- Always note explicitly in the response which path I took

### 1.4 What to never do without explicit user approval
1. Re-add Switzerland or any country outside the 12 in scope.
2. Deploy pricing infrastructure (it was ideation only).
3. Push the legal pages commit (`c9677666`) — awaiting attorney review.
4. Use Haiku 4.5 or Sonnet 4.6 in `verify-program.ts` (both fabricate values; Opus 4.7 only).
5. Override the `merge.ts` TARGET_COUNTRIES allowlist.
6. Use destructive git commands (`reset --hard`, `push --force`, `branch -D`).
7. Skip pre-commit hooks (`--no-verify`, `--no-gpg-sign`).
8. Modify Supabase schema in production (write SQL files; user runs them in Studio).

### 1.5 Commit message convention
Use a HEREDOC with this trailer:
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

Style: short imperative subject + 1-2 paragraph body explaining the *why*.

For tier commits, the chain runner generates the message automatically; for manual commits, follow the same shape.

### 1.6 Code style
- TypeScript strict mode. `tsc --noEmit` must pass before commit.
- Imports: `@/lib/...`, `@/components/...` aliases.
- React components: function components only, no classes.
- API routes: validate input, return `NextResponse.json`, use `apiErrorResponse()` from `src/lib/api-error.ts` for failures.
- Comments: prefer "why" over "what." Short paragraphs explaining design choices.

### 1.7 TodoWrite usage
- Used for tasks with 3+ steps or long-running ops.
- Mark items as `in_progress` BEFORE starting them, `completed` IMMEDIATELY after.
- Single `in_progress` item at a time.
- If reminded by system to use it, only use if relevant — don't force.

### 1.8 Context handling
- The user is aware we have a 1M context window but watches utilisation.
- They prefer compact, focused responses when possible.
- When context exceeds ~60%, recommend new session via this snapshot.

---

## §2 Platform overview

EduvianAI is a Next.js 14 (App Router) study-abroad recommendation platform deployed on Vercel at `https://www.eduvianai.com`. It serves prospective students with AI-powered program matching across 12 destination countries plus a suite of decision-support tools (ROI calculator, parent decision tool, visa coach, SOP/LOR/CV review, mock interview, English test practice).

### 2.1 Stack

| Layer | Component | Vendor |
|---|---|---|
| Web app | Next.js 14.2 App Router | Vercel |
| Runtime | Node 20 + Edge | Vercel |
| Database | Postgres 15 + Row-Level Security | Supabase Cloud (US) |
| AI / LLM | Claude API | Anthropic (US) |
| Email | Resend | Resend (US) |
| Error tracking | Sentry @sentry/node | Sentry (US) |
| Auth (admin) | Supabase Auth + custom HMAC cookie | mixed |
| Payments | None yet (planned: Razorpay + Stripe) | — |

### 2.2 Project layout

```
/Users/piyushkumar/Playground/eduvian/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # 22 API routes
│   │   ├── admin/             # Admin login + dashboard (RLS-protected)
│   │   ├── results/[token]/   # Token-scoped results
│   │   ├── terms/             # LOCAL-ONLY draft (commit c9677666)
│   │   ├── privacy/           # LOCAL-ONLY draft (commit c9677666)
│   │   ├── disclaimer/        # LOCAL-ONLY draft (commit c9677666)
│   │   ├── english-test-lab/
│   │   ├── lor-coach/
│   │   ├── sop-assistant/
│   │   ├── visa-coach/
│   │   ├── interview-prep/
│   │   ├── roi-calculator/
│   │   ├── parent-decision/
│   │   ├── application-tracker/
│   │   ├── application-check/
│   │   └── page.tsx           # Home page
│   ├── components/
│   │   ├── results/           # ProgramCard, ComparePanel, CheckMatchPanel etc.
│   │   ├── ChatWidget.tsx     # AISA — context-aware AI assistant
│   │   ├── ROICalculator.tsx
│   │   ├── ParentDecisionTool.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── types.ts           # Program, ScoredProgram, StudentProfile, FIELDS_OF_STUDY (17), TARGET_COUNTRIES (12)
│   │   ├── scoring.ts         # 9-signal recommendPrograms()
│   │   ├── format-fee.ts      # null-safe tuition rendering ("Verified fee not available")
│   │   ├── beta-gate.ts       # per-tool monthly caps + global $50 spend cap
│   │   ├── rate-limit.ts      # IN-MEMORY (broken on serverless; see C3)
│   │   ├── session.ts         # Admin HMAC cookie
│   │   ├── user-cookie.ts     # User HMAC cookie (email plaintext-encoded; see H2)
│   │   ├── supabase.ts        # Supabase client factory
│   │   ├── supabase-schema.sql # DB schema (RLS too permissive on submissions; C2)
│   │   ├── api-error.ts       # Sentry-flushed error response
│   │   ├── utils.ts           # cn(), formatCurrency(), getCountryFlag()
│   │   ├── application-tracker.ts
│   │   ├── lor-coach.ts
│   │   ├── parent-decision-calculator.ts
│   │   ├── profile-score.ts
│   │   ├── roi-calculator.ts
│   │   ├── store.ts           # In-memory submission cache
│   │   └── migrations/        # SQL migrations (manual execution in Supabase Studio)
│   ├── data/
│   │   ├── programs.ts        # 3,449 programs with @ts-nocheck (large data file)
│   │   ├── db-stats.ts        # Auto-computed counts from PROGRAMS
│   │   └── visa-coach.ts
│   └── middleware.ts          # Edge middleware — protects /admin/* and /api/admin/*
├── scripts/
│   ├── verify/                # Verification pipeline (see §4)
│   └── build-legal-docs.js    # Generates ~/Desktop/eduvian-legal-docs/
├── public/                    # Static assets
├── next.config.mjs            # Security headers, CSP, image domains
├── tsconfig.json
├── package.json               # Has tsx + playwright + docx as devDeps
├── tailwind.config.ts
├── sentry.client.config.ts    # Has DSN-aware enable; needs NEXT_PUBLIC_SENTRY_DSN env var
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── instrumentation.ts         # Sentry instrumentation hook (proven unreliable on Vercel; eager init in api-error.ts is the workaround)
├── VERIFICATION.md            # Pipeline documentation
└── STATE_SNAPSHOT.md          # ← this document
```

### 2.3 Database schema (Supabase Postgres)

Tables (all have RLS enabled):

| Table | Columns | Policies | Notes |
|---|---|---|---|
| `programs` | id (UUID), university_name, country, city, qs_ranking, program_name, degree_level, duration_months, field_of_study, specialization, annual_tuition_usd, avg_living_cost_usd, intake_semesters[], application_deadline, min_gpa, min_percentage, min_ielts/toefl/pte/duolingo/gre/gmat/sat, work_exp_required_years, program_url, apply_url, is_active, last_updated | public_read + service_write | Mostly read-from-static-file in practice; DB version is fallback |
| `submissions` | id, token, profile (JSONB), shortlisted_ids[], email_sent, profile_category, total_matched, **email_hash, profile_encrypted, profile_enc_version**, created_at, updated_at | public_insert + **submissions_no_public_read (anon, authenticated → false)** + service_all | **C2 closed.** H7 shadow columns added; dual-write live. |
| `students` | id, name, email UNIQUE, phone, source, source_stage, created_at | public_insert + service_all | Created 3 May 2026 (was missing — pre-existing registrations went through the in-memory fallback path with `id: "guest_..."`). Recovered via `/api/auth` login lazy-backfill from submissions.profile. |
| `user_sessions` | id (UUID PK), email, expires_at, created_at, user_agent, ip | service_role only | H2: opaque session lookup. Cookie value is `id`. |
| `otp_challenges` | id (UUID PK), email, code_hash, purpose ('register'/'login'), attempts, used, expires_at, locked_until, created_at, ip, user_agent | service_role only | OTP feature. 5-min expiry, 5-attempt lockout. |
| `tool_usage` | id, email, tool, ip, cost_estimate_cents, created_at | service_role only | Beta-gate counter table. |

### 2.4 Environment variables (set in Vercel)

```
ANTHROPIC_API_KEY                    server-only — rotated 3 May 2026
NEXT_PUBLIC_SUPABASE_URL              public
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  public anon key (in browser)
SUPABASE_SECRET_KEY                  server-only service-role key
RESEND_API_KEY                       server-only — marked Sensitive in Vercel
SENTRY_DSN                            server-only (for @sentry/node)
NEXT_PUBLIC_SENTRY_DSN               public — for client-side Sentry
ADMIN_SESSION_SECRET                 server-only HMAC key
BETA_OWNER_EMAILS                    comma-separated allowlist
MAX_MONTHLY_SPEND_CENTS              default 5000 ($50)
NEXT_PUBLIC_APP_URL                  https://www.eduvianai.com
UPSTASH_REDIS_REST_URL               server-only — C3 rate limiter
UPSTASH_REDIS_REST_TOKEN             server-only — C3 rate limiter
PII_ENCRYPTION_KEY                   server-only — H7 AES-256-GCM key (32-byte hex). LOSING THIS = ENCRYPTED ROWS UNRECOVERABLE.
PII_HASH_SECRET                      server-only — H7 + OTP HMAC secret (32-byte hex). Same warning.
```

`.env.local` mirrors these for development. **Database password rotated 3 May 2026** (separate from the env vars above).

### 2.5 17 Fields of Study (`FIELDS_OF_STUDY` in `src/lib/types.ts`)

```
1. Computer Science & IT
2. Artificial Intelligence & Data Science
3. Business & Management
4. MBA
5. Engineering (Mechanical/Civil/Electrical)
6. Biotechnology & Life Sciences
7. Medicine & Public Health
8. Law
9. Arts, Design & Architecture
10. Social Sciences & Humanities
11. Economics & Finance
12. Media & Communications
13. Environmental & Sustainability Studies
14. Natural Sciences
15. Nursing & Allied Health
16. Agriculture & Veterinary Sciences
17. Hospitality & Tourism
```

### 2.6 12 target countries (`TARGET_COUNTRIES`)

USA, UK, Australia, Canada, New Zealand, Ireland, Germany, France, UAE, Singapore, Malaysia, Netherlands.

**Switzerland was explicitly excluded by the user.** ETH Zurich was removed; `merge.ts` rejects out-of-scope countries.

---

## §3 Current platform state

| | Value |
|---|---:|
| Last commit on main | `5e8e664b` — H7 Phase C writer side: refuse plaintext on encryption failure (5 May evening) |
| Programs in DB | **5,595** |
| Verified at source | **5,532** (98.9%) |
| Universities | **506** total / **485** with at least one verified program |
| Countries | 12 |
| Build | green |
| Branch | main |
| Working tree | clean |
| Supabase plan | Pro (since 3 May 2026) |
| Live security posture | C1–C4 + H1–H6 closed; **H7 Phase A + Phase B + Phase C code all live** (reader `6ae64c39` + writer `5e8e664b`). The destructive `DROP COLUMN` SQL is the only remaining step — runbook in §20.1 |
| Brand redesign | **Live at /** (swapped from /v2 on 5 May, `66135a13`). Locked direction (palette · card pattern · hard avoids) and 8-section homepage structure live in §24. Pre-swap homepage backed up at `_archive/page-pre-v2-swap.tsx.bak`; pre-swap v2 preserved un-routed at `src/app/_v2-archive/page.tsx`. |
| Deep pages | All 5 created (5 May): `/match`, `/parent-report`, `/destinations`, `/scholarships`, `/methodology`. Existing tool pages (`/application-check`, `/interview-prep`, `/english-test-lab`, `/roi-calculator`, `/visa-coach`, `/parent-decision`, `/get-started`) still wear pre-swap visuals — visual update is open work item #2. |
| Email OTP on register/login | live |
| Admin TOTP MFA | enrolled and verified — `/admin` login challenges for code |
| Logout button | live on `/profile` and `/results/[token]` |
| Homepage SWOT-driven restructure | shipped — section reorder, parent-aware copy, single-source-of-truth count, sample parent report (`/sample-parent-report`), 5-stage modal parity, tool-card 5-line standardisation, 'How shortlist is built' premium cards, dual-CTA Decide stage |
| Mobile UX | shipped — ~3500-4500px shorter homepage via stage selector compaction, Stage 1 mockup hidden, 4 stage accordions (Show Stage X details), test-lab grid 2-up, decorative blur blobs hidden (root cause of GPU-compositing scroll-flash) |
| Google Postmaster Tools | verified for `eduvianai.com` — dashboards stay sparse at beta volume |

### 3.1 Country breakdown (post-tier-2 expansion, 4 May 2026)

Verified against `programs.ts` at the time of writing. Use §0 verification commands to refresh.

| Country | Universities | (verified) | Programs | (verified) |
|---|---:|---:|---:|---:|
| USA | 130 | 124 | 1,676 | 1,645 |
| UK | 110 | 109 | 1,355 | 1,347 |
| Canada | 67 | 59 | 585 | 571 |
| Germany | 52 | 52 | 545 | 543 |
| Australia | 39 | 38 | 457 | 456 |
| France | 36 | 34 | 281 | 279 |
| Malaysia | 18 | 17 | 174 | 173 |
| UAE | 18 | 16 | 145 | 142 |
| Netherlands | 10 | 10 | 140 | 140 |
| Ireland | 9 | 9 | 82 | 82 |
| New Zealand | 7 | 7 | 81 | 81 |
| Singapore | 10 | 10 | 74 | 73 |
| **Total** | **506** | **485** | **5,595** | **5,532** |

### 3.1.1 Still-unverified breakdown (63 entries — cleanup queued in §20)

After two re-verify passes today, 63 entries lack `verified_at`:
- **31 field_mismatch** — page doesn't describe the stated field. 24 of those are catalog/listing URLs (e.g., `<uni>.edu/graduate`) inherited from older auto-seeds; should be stripped via `audit-strip --include field_mismatch`. The remaining 7 are specific-page URLs pointing to wrong topics — manual review.
- **32 fetch_or_api_error** — playwright fetch failed. Of these: 2 are confirmed dead (De Montfort 404s, strip), 2 actually load in browser (Miami Comm + Utah BME, retry), 28 are DNS-unresolvable from the build network and are mostly catalog `<dept>.<edu>/graduate` placeholders (replace with real program URLs OR strip).

### 3.2 Running background processes

None. The 4 May verify-batch run (`PID 34840`) finished with 465 OK / 60 rejected / 23 errors at 85% pass rate; merged via `006ed0cd`. No verify-batch / chain-tiers / websearch-seed-finder processes are running. Re-confirm via `ps aux | grep -E "verify-program|chain-tiers|verify-batch"`.

---

## §4 Verification pipeline architecture

### 4.1 Why this pipeline exists

In April 2026, an audit discovered 6,222 synthetic placeholder programs in the database (e.g., "BSc Hospitality Management" at MIT, "MSc Agriculture" at Cambridge, "BSc Nursing" at Oxford — none of which those schools offer). They were removed and replaced with a verification-first pipeline that only adds programs with field data extracted from a live university URL.

### 4.2 Hard rules

1. **No hand-authored entries.** All adds go through the pipeline.
2. **No invented values.** If the official page doesn't state a fee/deadline/cutoff, the field is `null`.
3. **`verified_at` is sacred.** Set only by the pipeline after a successful live fetch.
4. **Re-verify every 6 months.** Admissions cycles roll over.
5. **`field_of_study` must be one of the 17 in `FIELDS_OF_STUDY`.**

### 4.3 Pipeline scripts (`scripts/verify/`)

| Script | Model | Purpose |
|---|---|---|
| `verify-program.ts` | **Opus 4.7** (NEVER change) | Single program URL → verified JSON. Playwright fetch + Claude extraction with strict prompt. |
| `verify-batch.ts` | (orchestrator) | Run verifier over a seed file. Args: `<seed.json> [--concurrency N] [--skip-existing]` |
| `seed-crawler.ts` | Sonnet 4.6 | Catalog page anchor scraper → seed JSON. Best for static catalog sites. |
| `websearch-seed-finder.ts` | Sonnet 4.6 + web_search tool (max 17 uses/call) | Discovers canonical program URLs per (uni × field). Best for SPA-rendered catalogs. |
| `merge.ts` | (parser) | Append verified outputs to programs.ts. Has TARGET_COUNTRIES allowlist. Skip duplicates. |
| `rename-from-page.ts` | (parser) | Apply `matchesLevelAndField` rule — auto-rewrite stored program names if page name has correct level + field keyword. |
| `stamp-verified.ts` | (parser) | Stamp existing DB rows by exact (uni, name) match against `output/`. |
| `stamp-landing-correct.ts` | (parser) | Stamp `no_better_anchor` and `claude_returned_same_url` cases — URL was right, name preserved. |
| `deepen-review.ts` | Sonnet 4.6 | In-domain crawl-deeper to find specific program detail pages from a landing. |
| `investigate-gaps.ts` | Sonnet 4.6 + web_search | Web-search-backed URL discovery for residual review items. |
| `audit-haiku-vs-opus.ts` | (test harness) | A/B integrity audit. Confirmed Haiku and Sonnet both fabricate; verifier MUST stay on Opus. |
| `re-verify.ts` | (orchestrator) | Re-check existing programs.ts entries against live URLs. Args: `[--limit N] [--offset N] [--country X] [--concurrency N]` |
| `audit-strip.ts` | (parser) | Remove entries flagged dead by re-verify. Default strips only `no_program_name`. |
| `repair-corruption.ts` | (parser) | Parse + emit only valid program objects. Use after botched edits to programs.ts. |
| `chain-tiers.sh` | (orchestrator) | Auto-runs tier seed → verify → merge → commit → push. Args: `tier-9 tier-10 ...` |

### 4.4 Pipeline data files

| Path | Purpose |
|---|---|
| `scripts/verify/catalogs/qs-2026-tier-{N}.json` | University lists per tier (curated input) |
| `scripts/verify/seeds/qs-2026-tier-{N}-auto.json` | Discovered seed entries (output of phase 1) |
| `scripts/verify/output/*.json` | Verified output JSONs (audit trail; .gitignored) |
| `scripts/verify/likely-synthetic.json` | Entries flagged as possibly synthetic |
| `scripts/verify/stripped-needs-reseed.json` | Entries removed during audit |
| `scripts/verify/rename-review.json` | Items needing human review for name mismatches |
| `scripts/verify/corruption-dropped.json` | Entries dropped during corruption-repair |
| `scripts/verify/reverify-report.jsonl` | Re-verify status per entry (line-delimited JSON) |

### 4.5 Cost-tuning history (DO NOT REGRESS)

Prior to integrity audit:
- All scripts on Opus 4.7 + adaptive thinking (~$15/tier batch)

Tested and rejected:
- **Haiku 4.5 in verify-program**: fabricated CMU apply_url → REJECTED
- **Sonnet 4.6 in verify-program**: fabricated Dalhousie deadline → REJECTED

Current settings:
- `verify-program.ts`: Opus 4.7, no thinking, 60K char content cap
- `seed-crawler.ts`: Sonnet 4.6, no thinking
- `websearch-seed-finder.ts`: Sonnet 4.6, web_search × 17 max
- `investigate-gaps.ts`: Sonnet 4.6, web_search × 3
- `deepen-review.ts`: Sonnet 4.6

Estimated per-tier cost: $5-15 depending on size.

### 4.6 Tier history

| Tier | What | Universities | Yield | Status |
|---|---|---:|---:|---|
| Tier-1 | QS top 12 catalog (MIT, Stanford, Oxford, etc.) | 12 | ~75 | merged |
| Tier-2 | UK/CA/AU/DE/NL/IE mid-tier catalog | ~30 | ~250 | merged |
| Tier-3 | USA mid-tier + France/NZ/UAE/SG/MY | ~32 | ~96 | merged |
| Tier-4 | USA catalog/bulletin retries | 20 | ~59 | merged |
| spa-fail | Web-search for SPA-heavy schools (MIT, Stanford, Caltech, etc.) | 33 | ~245 | merged |
| Tier-5 | QS 50-200 mid-tier | 37 | ~392 | merged |
| Tier-6 | QS 100-300 mid-tier | 51 | ~572 | merged |
| Tier-7 | USA mid-tier + UK post-92 | 50 | ~556 | merged |
| Tier-8 | Thin markets (UK Russell-fringe, NZ, AU, UAE, MY, IE) | 38 | ~447 | merged |
| Tier-9 | Germany + UK post-92 expansion | 35 | ~366 | merged |
| Tier-10 | USA mid-tier 100-700 + UK post-92 expansion | 70 | (in progress) | **running, PID 74973** |

### 4.7 Living-cost backfill

Many newly-verified entries have null `avg_living_cost_usd` because program pages don't state it. Backfilled per country with regional medians:

```js
USA: 18000, UK: 14000, Australia: 17000, Canada: 14000,
Germany: 12000, France: 18000, Netherlands: 14000,
Ireland: 16000, Singapore: 20000, Malaysia: 7000,
New Zealand: 14000, UAE: 16000
```

`chain-tiers.sh` runs this backfill automatically at phase 3.

### 4.8 Tuition rendering rule

**`annual_tuition_usd: null` is NOT $0.** All UI surfaces use `format-fee.ts`:
- `formatFee(amount)` → "Verified fee not available — check University website" if null/0
- `formatTotalCost(tuition, living)` → ditto, treats as unavailable
- `isFeeUnavailable(amount)` boolean check

Components updated to use these: `ProgramCard.tsx`, `ComparePanel.tsx`, `CheckMatchPanel.tsx`, `ShortlistSummary.tsx`, `InlineProgramROI.tsx`, `ROICalculator.tsx`, `ParentDecisionTool.tsx`. The `ChatWidget.tsx` was the original crash site — fixed.

### 4.9 Verified-at-source UI badge

Each program in results shows:
- ✓ **Verified** (green) — has `verified_at` field
- ⚠ **Listing only** (amber) — does not

Implemented in `ProgramCard.tsx` lines ~197-211.

### 4.10 Brace-walker hardening

History: An earlier corruption incident truncated ~163 entries because the brace walker in `deepen-review.ts`, `stamp-landing-correct.ts`, `investigate-gaps.ts` didn't track strings. Braces inside URLs broke depth tracking.

**Current state:** All three scripts have string-aware brace walkers. Pattern:
```ts
let depth = 1, e = s + 1, inStr = false, esc = false;
while (e < text.length && depth) {
  const c = text[e];
  if (esc) { esc = false; e++; continue; }
  if (c === "\\") { esc = true; e++; continue; }
  if (c === '"') { inStr = !inStr; e++; continue; }
  if (!inStr) { if (c === "{") depth++; else if (c === "}") depth--; }
  e++;
}
```

**Do not regress.** Any new parser must track strings.

### 4.11 Chain runner gotcha (tier-9 incident)

`chain-tiers.sh` failed at type-check phase for tier-9 because of stale `.next/types/app/pricing/page.ts` that referenced a deleted file. Always clear `.next/` if seeing TS errors about phantom files: `rm -rf .next/types/app/pricing` (or whatever path).

Also: `${TIER^}` for title-case is Bash 4+ only; macOS bash 3.2 fails. The script has been patched to use `tr` + cut.

---

## §5 Security audit — closed and remaining

Audit document: `~/Desktop/EduvianAI-Security-Architecture-Risk-Assessment.docx` (38 KB, ~25 pages).

**Status as of 3 May 2026 — most of the audit is closed.** Per-finding detail below; architectural notes for the live mitigations live in §14.

### 5.1 Closed (deployed + verified in prod)

| Sev | ID | What landed | Verified |
|---|---|---|---|
| C | C1 | `/api/admin/session` POST requires Bearer JWT + email in `BETA_OWNER_EMAILS` | curl returns 401 to anon; admin login flow ships JWT post-Supabase-auth |
| C | C2 | RLS migration removed `submissions_token_read` policy; service-role only | `pg_policy` confirms only `submissions_public_insert`, `submissions_no_public_read`, `submissions_service_all` |
| C | C3 | Upstash sliding-window rate limiter replacing in-memory Map; 9 AI routes plus auth/submit/email-welcome/admin-session | 25 req/IP test against admin-session: 1-20 → 401, 21-25 → 429 |
| C | C4 | `lib/llm-safety.ts`; `<user_input>` delimiters + `JAILBREAK_GUARDRAILS` system-prompt suffix on chat, sop-assistant, lor-coach, interview-feedback, check-match, application-check, cv-assessment, score-english | build green; no functional regression test, manual verification deferred |
| H | H2 | Opaque UUID session cookies via new `user_sessions` table; legacy HMAC-payload cookies invalidate | new logins write rows; round-trip passes |
| H | H3 | Same-origin Origin/Referer check in middleware on every state-changing `/api/*` request | cross-origin POST → 403 cross_origin; missing-Origin POST → 403 missing_origin |
| H | H4 | DPDPA s.13 endpoints: `GET /api/account/access`, `POST /api/account/correct`, `POST /api/account/delete` (with `confirm: "DELETE"` body) | unauthed → 401 across all three |
| H | H6 | `lib/html-escape.ts` (`escHtml`, `escHtmlBounded`, `safeUrl`); applied to all email templates and the printable `/api/pdf/[token]` HTML page (which previously rendered profile.full_name straight into eduvianai.com origin with `<script>` — a real XSS surface) | build green |
| H | H7 Phase A | AES-256-GCM shadow columns on `submissions`: `email_hash` (HMAC), `profile_encrypted` (versioned base64), `profile_enc_version`. Dual-write live. Backfill ran for all 4 existing rows. Round-trip verified | `verify-pii-roundtrip.ts` PASS for 4/4 |

### 5.2 Closed-with-rationale (no code change)

| ID | Why deferred / closed |
|---|---|
| H5 — Service-role overuse | The audit framed this as overuse pre-C2, when anon could SELECT * FROM submissions via the leaky RLS policy. Post-C2, anon cannot read submissions at all, so service-role is now the only legitimate path. Programs-table fallback in `/api/email` could move to anon, but the static `programs.ts` already covers it — no functional gain. |

### 5.3 Deferred (not yet done)

| ID | Title | Status / next steps |
|---|---|---|
| H7 Phase C | Drop plaintext `submissions.profile` | Migration sets plaintext column to NULL (or drops it) for rows that have `profile_encrypted`. Irreversible without a backup — **use the Supabase Pro scheduled backup or a fresh `pg_dump` first**. Wait 24-48h after Phase B has been clean in prod (Phase B shipped 3 May 2026). |

**H1 and H7 Phase B closed since the previous snapshot:**
- **H1** — `/admin/security` enrolment page, login flow now challenges for the 6-digit code, server enforces AAL2 in `/api/admin/session`. User is enrolled and verified in prod (TOTP factor recorded against the admin Supabase user).
- **H7 Phase B** — every route that reads submissions (auth, results, email, pdf, check-match, admin/leads, account/access, account/delete) now goes through `decryptProfile()` in `lib/submissions-decrypt.ts`. Encrypted blobs are stripped from outbound responses. The three email-equality lookups (auth login, account/access, account/delete) switched to the H7 `email_hash` column.

### 5.4 Recurring cost from completed work

- Upstash Redis: $0 (free tier)
- Resend: $0 (free tier; OTP volume well under cap)
- Supabase Pro: $25/mo (upgraded 3 May 2026 — primarily for no-pause + downloadable backups + future PITR)
- Anthropic: same as before; no Haiku classifier added (deferred) — would have been $25-40/mo extra

### 5.5 Operational reminders for the deferred phases

**H7 Phase B (when ready):**
- Each route updated separately so rollback per-route is one revert
- After Phase B is in for ~24h with no Sentry noise, plan Phase C
- The encryption keys (`PII_ENCRYPTION_KEY`, `PII_HASH_SECRET`) are critical — losing them means every encrypted row becomes unrecoverable

**H7 Phase C:**
- Take a Supabase backup or `pg_dump` first
- Drop plaintext only for rows with non-null `profile_encrypted`
- After Phase C, every existing reader path that still references the plaintext column must be updated or it'll break

**H1 enrolment UI:**
- Add `/admin/security` page with QR enrolment + verify
- Once enrolled, modify `/admin/page.tsx` to call `supabase.auth.mfa.challengeAndVerify()` after `signInWithPassword()`

---

## §6 Drafted but NOT deployed

### 6.1 Legal pages (commit `c9677666`)

Local-only commit on main. Files:
- `src/app/terms/page.tsx` (26 sections, DPDPA + GDPR + IT Act 2000)
- `src/app/privacy/page.tsx` (DPDPA + GDPR + UK-GDPR; Grievance Officer; rights)
- `src/app/disclaimer/page.tsx` (user-facing AI / data disclaimer)
- `src/app/page.tsx` footer rebuilt with legal links
- `scripts/build-legal-docs.js` (generates Word versions to `~/Desktop/eduvian-legal-docs/`)

**Status:** Awaiting attorney review. Bracketed placeholders to fill: `[City]` for jurisdiction, postal address, named Grievance Officer / DPO, corporate registration. Liability cap (₹5,000 / 12-month-fees) and dispute-resolution seat need counsel sign-off.

**To deploy:** push commit after counsel sign-off.

### 6.2 Pricing infrastructure (REMOVED, ideation only)

User said: "do not deploy any pricing change as my request was only for ideation purpose"

Files were deleted:
- `src/lib/pricing.ts`
- `src/app/pricing/page.tsx`
- `scripts/build-pricing-xlsx.py`
- Footer change adding /pricing link reverted

**Excel files on Desktop kept for ideation reference:**
- `~/Desktop/Eduvianai pricing and value tiers.xlsx` (user's original)
- `~/Desktop/Eduvianai-Recommended-Pricing.xlsx` (my recommendation)

### 6.3 Recommended pricing tiers (for reference, not implementation)

If pricing comes back in scope:

| Tier | Price | Validity | Match count |
|---|---:|---|---:|
| Free | ₹0 | unlimited | 5 (1/3/1) |
| Silver | ₹1,499 | 6 months | 15 (3/9/3) |
| Gold ★ | ₹3,499 | 6 months | 30 (6/18/6) |
| Platinum | ₹6,999 | 12 months | 50 (10/30/10) |
| Counsellor | ₹24,999 | 12 months + 3hr human | 50 + handpicked |

Key issue with user's original draft (still relevant if pricing returns): they had Silver-only Compare panel which dropped at Gold — must be additive going up tiers.

---

## §7 Compliance posture

### 7.1 DPDPA 2023 (primary target)

~60% ready. Privacy Policy drafted but not deployed. Critical gap: **C2 (mass PII leak) violates DPDPA s.8(5) "reasonable security safeguards"** — would be a reportable breach under s.8(6).

DPDPA Data Principal rights (s.13) — none implemented; H4 builds them.

Grievance Officer (s.27) — drafted in privacy policy, named officer placeholder.

### 7.2 GDPR / UK-GDPR

Privacy policy drafted with all required sections. Operational implementation gap matches DPDPA: no rights-fulfillment endpoints (H4).

### 7.3 ISO 27001 (long-term)

~25-30% ready. 18-month roadmap in audit doc §11.

### 7.4 PCI-DSS

N/A today (no payments). When Razorpay/Stripe added, scope is SAQ A (use hosted checkout, never touch raw card data).

---

## §8 Files on user's Desktop

| File | Purpose | Status |
|---|---|---|
| `~/Desktop/eduvian-legal-docs/EduvianAI-Terms-of-Use.docx` | Word version of terms | Draft — for legal review |
| `~/Desktop/eduvian-legal-docs/EduvianAI-Privacy-Policy.docx` | Word version of privacy policy | Draft — for legal review |
| `~/Desktop/eduvian-legal-docs/EduvianAI-Disclaimer.docx` | Word version of disclaimer | Draft |
| `~/Desktop/Eduvianai pricing and value tiers.xlsx` | User's original pricing draft | Reference |
| `~/Desktop/Eduvianai-Recommended-Pricing.xlsx` | Recommended pricing | Reference — NOT DEPLOYED |
| `~/Desktop/EduvianAI-Security-Architecture-Risk-Assessment.docx` | Security audit | Delivered, awaiting remediation |
| `~/Desktop/Complete_CV_Framework.docx` | (User's earlier upload) | Pre-existing |

---

## §9 Open questions (from §13 of audit)

User answered some during the audit; remaining open:

1. ✅ Compliance: DPDPA primary + ISO 27001 long-term (no GDPR full-bore)
2. ✅ Threat model: opportunistic + competitor (no state actors)
3. ✅ Payments: planned for near term — affects readiness assessment
4. ✅ No prior pen testing
5. ✅ Single admin (the user, in India)
6. ✅ Risk tolerance: score everything + highlight must-fix-now
7. ❓ Secrets rotation policy: not sure
8. ❓ Backup posture: most likely auto-backups only
9. ❓ Bug bounty: no
10. ✅ Deadline: 48 hours for audit (delivered)

Questions still relevant:
- Has any submission ever been processed in production? (Affects whether C2 is a confirmed historical breach.)
- Razorpay or Stripe India for payments?
- Any other admin user beyond Piyush?
- Dev/staging environments separate from production?
- Have any secrets ever been committed to git? (Run `git log -p | grep -iE 'sk-ant|sb-.*-secret|re_'`)
- Customer-data retention period — is 24 months aligned with business need?

---

## §10 Continuation playbook

**A new session reading this should:**

1. Run §0 verification commands. Confirm reality matches.
2. The big tier-build and security-audit phases are done — most "what's next?" questions now belong to one of three buckets:
   - **H7 Phase B / C** (PII reader switch + plaintext drop) — see §5.3 + §14.13
   - **H1 admin MFA enrolment UI** — see §5.3
   - **New feature work** — follow §1 operating principles, check §1.4 / §6 first
3. Routine tier expansions (`tier-N`) can run again when the user asks; the chain is healthy. Don't touch `programs.ts` while a chain is in flight.
4. Verification-pipeline rules in §4 still bind. `verify-program.ts` stays on Opus 4.7. `merge.ts` allowlist stays.
5. If user asks for something unrelated (legal, pricing):
   - Check §1.4 "what to never do without approval" first.
   - Check §6 "drafted but not deployed" for prior decisions.

**Common task → response pattern lookup:**

| User says | Response shape |
|---|---|
| "ping" / "status?" | PID + elapsed + last 3 log lines + ETA |
| "keep going" | Continue current workstream OR start next planned tier/phase |
| "deploy" | git push + Vercel monitor |
| "wait" | Stop background work; acknowledge |
| "go ahead" / "yes" | Proceed with previously-described plan |

**If unsure: ask. Never guess on destructive actions.**

---

## §11 Skills available in this session

- `claude-api` (build/optimize Claude API code)
- `docx` (create/edit Word docs)
- `xlsx` (create/edit spreadsheets)
- `pdf` (PDFs)
- `pptx` (PowerPoint)
- `simplify`, `fewer-permission-prompts`, `loop`, `schedule`, `update-config`

The legal/security/pricing Word docs and the pricing Excel were generated using these skills. To regenerate any:
- Word: `node scripts/build-legal-docs.js` or `node scripts/build-security-audit.js`
- Excel: previously had `scripts/build-pricing-xlsx.py` (deleted; can recreate)

---

## §11.5 What shipped between previous snapshot and this one

3 May 2026 evening session — listed by commit hash, latest first:

| Commit | What |
|---|---|
| this handoff | re-verify.ts `--only-unverified` patch + CLAUDE.md + STATE_SNAPSHOT.md updates |
| `700bfb9f` | "Verified is the moat" hero anchor + lead-card layout in Why-EduvianAI section + DB_STATS exposes `verifiedProgramsLabel` (4,413+) and `verifiedUniversitiesLabel` (381+) |
| `a2c9c495` | Hero stat label "Universities" → "TOP Global Universities" → later refined to "Verified Global Universities" |
| `0f17daf2` | Why-EduvianAI cards: deeper pastels + saturated icon tiles for contrast on the off-white bg |
| `666ef00f` | Why-EduvianAI bg → off-white (`bg-stone-50`) — was dark-on-dark with the surrounding outputs and CTA sections |
| `2afb528a` | New "Why EduvianAI is different" section (lead block + 4-card grid; later restructured to 1-up moat card + 3-up supporting) |
| `9d42d197` | One-line fix to remove "official public formats" wording on the english-test-lab top hero |
| `26a62df8` | Homepage trust pass — items 1, 3, 4, 5, 6, 9 from the homepage rework brief |
| `15c6a022` | Tier-11 auto-merged: +327 verified programs (4,295 → 4,622). 12 AU + 15 DE + 10 CA + 2 IE + 1 NZ. |
| `8fdb5375` | Spam-folder hint on the email-entry step (both `AuthGate.tsx` and `/get-started`) |
| `cd7d648b` | H1 admin TOTP MFA enrolment + login challenge + AAL2 enforcement |
| `d159c873` | Logout button + endpoint |
| `5525135b` | H7 Phase B — readers switch to encrypted column with plaintext fallback |
| `c9f7dae9` | CLAUDE.md: Postmaster Tools wired up + email-deliverability rules |
| `80ad725c` | STATE_SNAPSHOT.md major refresh after the security audit + OTP feature |

## §12 Recent commits worth knowing

Latest first (3 May 2026 → 2 May 2026 → earlier history):

```
b9291a88  Improve transactional email deliverability (especially Yahoo)
4d62c2fd  Email OTP verification on register + login
604f38fd  Add CLAUDE.md with operating rules + security state
a83702ba  H7 Phase A: round-trip verification script
f24e70f7  H7 Phase A: Encrypt submissions.profile alongside plaintext
70f72b3c  H6: Centralise output encoding for email + printable-PDF templates
3fa032cf  Mark account/* routes as force-dynamic (Phase 2 hotfix)
31bfd4eb  Hotfix: checkRateLimit must never throw (Phase 2 hotfix)
b628b8c5  Site banner: warn returning users that the cookie change logged them out
96b82c6e  H4: DPDPA data-rights endpoints (access, correct, delete)
b52eec91  H3: Same-origin CSRF defence at the edge
5038f3e1  H2: Replace HMAC user cookies with opaque server-side session IDs
4dced54d  C4: Harden LLM routes against prompt injection
adb9d7a2  C3: Move rate limiter to Upstash Redis + extend to AI tool routes
9e172e84  C2: Close submissions IDOR by removing anon SELECT policy
29e6373f  C1: Require Supabase JWT + owner allowlist for admin session cookie
25f3bf5b  Take legal pages (terms / privacy / disclaimer) offline pending counsel review
3794c206  Phase 5: Email infrastructure polish (replyTo + lead notifier + alias hardening)
bbb450e9  Tier-10: auto-merged 2026-05-02 (4295/4086 programs/verified)
129277d0  Tier-9: Germany + UK expansion
4149d9bf  Tier-8: thin-market expansion
```

---

## §13 Quick command reference

```bash
# Build verify
cd /Users/piyushkumar/Playground/eduvian
npx tsc --noEmit && npx next build

# Tier-N chain (after catalog file is curated)
set -a; source .env.local; set +a
nohup ./scripts/verify/chain-tiers.sh tier-N > /tmp/chain-tN.log 2>&1 &

# Country-wise database stats
python3 -c "
import re
from collections import defaultdict
with open('src/data/programs.ts') as f: text = f.read()
arr_open = text.find('[', text.find('PROGRAMS'))
arr_close = text.rfind(']) as ProgramEntry[]')
body = text[arr_open+1:arr_close]
entries = []
depth = 0; start = -1; in_str = False; esc = False
for i, c in enumerate(body):
    if esc: esc=False; continue
    if c == '\\\\': esc=True; continue
    if c == '\"': in_str = not in_str; continue
    if in_str: continue
    if c == '{':
        if depth == 0: start = i
        depth += 1
    elif c == '}':
        depth -= 1
        if depth == 0 and start != -1: entries.append(body[start:i+1]); start = -1
by_country = defaultdict(lambda: {'unis': set(), 'p': 0, 'v': 0})
for e in entries:
    co = re.search(r'country:\s*\"([^\"]+)\"', e)
    u = re.search(r'university_name:\s*\"([^\"]+)\"', e)
    if not co or not u: continue
    c = co.group(1)
    by_country[c]['p'] += 1
    by_country[c]['unis'].add(u.group(1))
    if 'verified_at:' in e: by_country[c]['v'] += 1
for c in sorted(by_country, key=lambda x: -by_country[x]['p']):
    d = by_country[c]
    pct = round(100*d['v']/d['p']) if d['p'] else 0
    print(f'{c:<15} unis={len(d[\"unis\"]):>3} programs={d[\"p\"]:>4} verified={d[\"v\"]:>4} ({pct}%)')"

# Restart sentry-flushed deploys
git push origin main

# Trigger Vercel preview without push
vercel deploy --prebuilt
```

---

*End of snapshot. The next Claude session should read this entirely, then run §0 verification, then proceed per §10.*

---

## §14 Architectural decisions, debugging history, and gotchas log

This section captures decisions that aren't visible in the code alone — the *why* behind the current shape of things.

### 14.1 Sentry architecture (resolved before this session)

**Problem encountered:** Server errors weren't reaching Sentry on Vercel.

**Root causes (two issues):**
1. **`@sentry/nextjs` webpack mis-resolution.** Webpack's server build resolved `@sentry/nextjs` to its browser-entry stub which has a no-op `init()`. Errors silently disappeared. The `sentryKeys` listing showed only browser-entry exports (`ErrorBoundary`, `createReduxEnhancer`).
2. **Vercel serverless freeze.** Vercel freezes the function the moment `NextResponse.json()` returns, killing in-flight HTTP sends — Sentry's network call to ingest never completes.

**Fix:**
- Use `@sentry/node` directly (transitive dep, resolves correctly server-side).
- Eagerly initialize Sentry as a side-effect in `src/lib/api-error.ts` (the `instrumentation.ts` hook is unreliable on Vercel — Next.js 14 doesn't always fire it).
- `await Sentry.flush(2000)` BEFORE returning the response from `apiErrorResponse()`.

**Code shape (`src/lib/api-error.ts`):**
```ts
import * as Sentry from "@sentry/node";

if (!Sentry.getClient() && process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: true,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    ignoreErrors: ["ResizeObserver loop limit exceeded", "Non-Error promise rejection captured"],
  });
}

export async function apiErrorResponse(err, context, fallbackMessage = "Something went wrong") {
  captureApiError(err, context);
  try { await Sentry.flush(2000); } catch {}
  // ... return NextResponse.json
}
```

**Client-side Sentry status:** `sentry.client.config.ts` exists but requires `NEXT_PUBLIC_SENTRY_DSN` env var. **User was advised to set this** but unclear if they have. Without it, client-side crashes (like the historical null-tuition crash in `ChatWidget.tsx`) aren't captured.

### 14.2 The tool_usage table (beta gate)

`src/lib/beta-gate.ts` enforces:
- `MONTHLY_UNIQUE_USER_CAP = 100` — max 100 distinct users per calendar month
- `MAX_MONTHLY_SPEND_CENTS = 5000` — global $50/month Anthropic spend ceiling
- Per-tool monthly caps (e.g., `sop-assistant: 5`, `lor-coach-generate: 1`, `chat: 50`)
- Owners listed in `BETA_OWNER_EMAILS` env var bypass everything

Schema (DB):
```sql
create table tool_usage (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  tool text not null,
  ip text,
  cost_estimate_cents integer,
  created_at timestamptz not null default now()
);
```

Indexed on `(created_at desc)` and `(email, tool, created_at desc)`. RLS enabled, service-role-only access.

**Used by:** `submit`, `chat`, `sop-assistant`, `cv-assessment`, `application-check`, `lor-coach`, `interview-feedback`, `score-english`, `extract-text`, `check-match` (10 routes).

### 14.3 PDF + email pipeline

- **PDFs:** `@react-pdf/renderer` v3.4.4 — used in `src/app/api/pdf/[token]/route.ts` and `src/app/api/pdf/tools/route.ts`. PDFs render the student's match results + a cover.
- **Emails:** Resend v4. Templates inline HTML strings in API routes (`src/app/api/email/route.ts`, `email/welcome/route.ts`, `email/tools/route.ts`). User input is HTML-escaped via the `sanitize()` function in `auth/route.ts`:
```ts
function sanitize(value: string, maxLen = 255): string {
  return value.slice(0, maxLen).replace(/[<>"'`]/g, "");
}
```
- **Issue:** `sanitize()` is defined in only one route; not consistently applied to all sinks. This is finding H6 in the security audit.

### 14.4 The submission flow (full path)

```
1. User fills out the multi-step form (StudentProfileForm component).
2. Submit → POST /api/submit
3. /api/submit:
   a. Rate-limit check (5/IP/hr — broken, see C3)
   b. Validate StudentProfile shape
   c. Run recommendPrograms() locally on PROGRAMS array
   d. Generate UUID token
   e. INSERT into submissions table (service-role)
   f. Set HMAC user cookie (eduvianai_user, 30-day TTL)
   g. POST to Resend → email with /results/<token> link
4. Redirect to /results/<token>
5. /results/<token>/page.tsx fetches /api/results/<token>:
   a. Service-role SELECT submissions WHERE token = ?
   b. Re-score against profile
   c. Returns { submission, programs: scored }
6. Render ProgramCard components with verified/listing-only badges
7. ChatWidget loaded with shortlist for AISA Q&A
```

In-memory `submissionStore` (`src/lib/store.ts`) caches recent submissions to avoid DB roundtrips on the same Vercel function instance — but cold-starts wipe it. This is actually fine; DB is the source of truth.

### 14.5 The data corruption incident (April 2026)

**What happened:**
- During an aggressive merge/strip pass on programs.ts, the brace-walker in `deepen-review.ts` and similar scripts didn't handle strings — braces inside URLs like `apply_url: "https://x{y}"` confused depth tracking.
- `audit-strip.ts` cut through entry boundaries, leaving 5+ entries with truncated heads (e.g., `}l, min_gre: null` left over from "min_duolingo: null").
- `repair-corruption.ts` rebuilt the file by parsing all valid object literals — but the parser ALSO got confused by mid-corruption depths, dropping ~163 valid entries silently.

**Recovery:**
- Checked git lost-found for blob backups — only the original 7,242-line pre-strip programs.ts existed (3.78MB blob). No mid-pipeline backup.
- Permanently lost ~163 entries. They were re-added via fresh tier crawls (Cambridge, Imperial, Stanford, etc.).

**Fix in scripts (now in place):**
- All brace walkers track strings: `inStr`, `esc` flags.
- Stamping/renaming uses block-bounded `replace()` rather than file-wide regex.
- `merge.ts` enforces TARGET_COUNTRIES allowlist.

**Lesson:** For high-stakes file edits (programs.ts is now 3,449 entries), prefer `repair-corruption.ts`-style parse-and-reemit over inline regex substitution. ALWAYS verify with `npx tsc --noEmit` AND `next build` before pushing.

### 14.6 The chain-tiers.sh history

**Bug 1: Bash 3.2 incompatibility.**
```bash
${TIER^}  # Bash 4+ only — title-cases first letter
```
macOS ships Bash 3.2 (license reasons). Fixed with portable `tr` + cut:
```bash
local TIER_TITLE="$(echo "${TIER:0:1}" | tr '[:lower:]' '[:upper:]')${TIER:1}"
```

**Bug 2: Stale Next.js type cache.**
After deleting `src/app/pricing/`, the chain failed at type-check because `.next/types/app/pricing/page.ts` still referenced the deleted module. Fix: `rm -rf .next/types/app/pricing` before re-running.

**Bug 3: Quoted heredoc + variable substitution.**
Unquoted `<<EOF` substitutes; quoted `<<'EOF'` doesn't. Used quoted to prevent the body from substituting, but then `${TIER}` literal appears in commit message. Acceptable.

### 14.7 The QS 2026 ranking dataset

We don't have a machine-readable QS 2026 dataset. University lists per tier are hand-curated by reading QS 2026 publication and selecting universities by:
- Country (must be one of the 12)
- QS rank (focus shifted from top 50 in tier-1/2/3 → mid-tier 100-300 in tier-5/6/7 → broader 200-700 in tier-10)
- Strategic gaps (thin markets in tier-8, common Indian-favourite post-92 in tier-7)

Tier 10 catalog universities (50 USA + 20 UK):
- USA mid-tier R1/R2: Case Western, Tulane, Lehigh, Wake Forest, Yeshiva, Brandeis, UConn, UMass Amherst, Buffalo SUNY, Cincinnati, FSU, Georgia State, FIU, UT Dallas, UT San Antonio, UT Arlington, USF, UCF, Houston, New Mexico, Mississippi, Alabama, Missouri, Kansas, Arkansas, Auburn, Clemson, Virginia Tech, Mississippi State, NJIT, Kansas State, Oklahoma State, Wichita State, SJSU, SDSU, CSU LB/Northridge/Fullerton, Loyola Marymount, Hofstra, Adelphi, Pace, USD, Pepperdine, Howard, NMSU, Pepperdine, WPI, IIT Chicago, Saint Louis U, Marquette
- UK regional/post-92: Bournemouth, Kingston, Sheffield Hallam, Middlesex, Leeds Beckett, East London, Derby, Northampton, South Wales, Staffordshire, Teesside, West London, Wolverhampton, Bath Spa, Buckingham, Roehampton, Canterbury Christ Church, Cumbria, Liverpool Hope, Chichester

### 14.8 CSP configuration (`next.config.mjs`)

Current CSP allows:
- `default-src 'self'`
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` (Next.js requires `unsafe-eval` for hydration)
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `font-src 'self' https://fonts.gstatic.com`
- `img-src 'self' data: blob: https://flagcdn.com https://*.supabase.co https://images.unsplash.com`
- `connect-src 'self' https://api.anthropic.com https://*.supabase.co https://*.sentry.io https://api.resend.com`
- `frame-ancestors 'none'`

Other headers: HSTS preload (1 year), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin.

**Gap:** `unsafe-inline` + `unsafe-eval` weaken XSS protection. Migration to nonce-based CSP is finding M1.

---

## §15 User's explicit rules accumulated over the session

These have been issued at various points and remain binding:

| When said | The rule |
|---|---|
| Earliest in session | "do not ask for any more permission for this task till it gets completed" (referring to UK QS 2026 push — completed) |
| When synthetic data was found | "remove all the synthetic placeholders and replace them with real flagship programs" |
| Same | "you CANNOT and MUST NOT produce artificial and false information on this website. This rule has to be strictly followed." |
| When integrity audit returned | "Ensure that the choice of model does not compromise the output integrity and quality" |
| When pricing ideation finished | "do not deploy any pricing change as my request was only for ideation purpose" |
| When seeing 13 countries | "Switzerland is not required" (remove ETH Zurich; allowlist enforces) |
| When asked about T&C | (T&C drafted but not yet pushed — awaiting attorney) |
| When seeing 13 countries again | (Re-removed; the merge.ts allowlist prevents recurrence) |
| For security audit | "Score every finding and recommend fixes while highlighting the must-fix-now items" |
| For security fixes | "Wait for Tier 9/10 chain to finish first" |
| For snapshot save | "save the file in the desktop folder called data for claude" |
| For snapshot quality | "ZERO-LOSS handoff is very CRITICAL and a MUST" |

**General principles inferred from the session:**
- Honesty over cosmetics ("Verified fee not available" beats showing $0)
- No fabrication, ever
- Integrity > cost (Opus stays in verifier despite expense)
- Prefer one-time payment over subscription (pricing ideation note)
- DPDPA primary, GDPR for international users, ISO 27001 long-term
- India-first content (₹ pricing, India-based legal jurisdiction)

---

## §16 Specific code-level facts to recall

### 16.1 Critical file paths (memorize)

| Path | What |
|---|---|
| `src/data/programs.ts` | THE database. **5,595 entries / 5,532 verified at source**. Has `// @ts-nocheck` directive (large data file). |
| `src/data/db-stats.ts` | Auto-computes counts from PROGRAMS. Don't edit; recomputed on load. Public surfaces standardise on `verifiedProgramsLabel` (5,532+) and `verifiedUniversitiesLabel` (485+). |
| `src/lib/types.ts` | Single source of truth for types. `TARGET_COUNTRIES` (12), `FIELDS_OF_STUDY` (17), `Program`, `StudentProfile`, `ScoredProgram`. |
| `src/lib/scoring.ts` | The 9-signal `recommendPrograms()`. Tier thresholds: Safe 75-100, Reach 50-74, Ambitious <50. |
| `src/lib/format-fee.ts` | The fee-unavailable rendering helpers. NEVER show $0. |
| `src/lib/beta-gate.ts` | Per-tool monthly caps + global spend cap. Uses tool_usage table. |
| `src/lib/api-error.ts` | Sentry-flushed error handler. Eager Sentry init here. |
| `src/lib/rate-limit.ts` | Upstash sliding-window with in-memory fallback. **Must never throw** (whole-body try/catch with fail-open last resort — see §14.12). |
| `src/lib/user-cookie.ts` | H2 opaque session lookup. Cookie value is a UUID; `verifyUserToken()` does a service-role SELECT. |
| `src/lib/pii-crypto.ts` | H7 AES-256-GCM helpers. `encryptJson` / `decryptJson` / `emailHash`. Versioned blob format `[v(1)][iv(12)][tag(16)][ct(N)]` so we can rotate. |
| `src/lib/otp.ts` | Email OTP. 6-digit codes hashed with HMAC-SHA256(`PII_HASH_SECRET`, `<email>:<code>`). Tunables in `OTP_CONFIG`. |
| `src/lib/html-escape.ts` | `escHtml`, `escHtmlBounded`, `safeUrl`. **Use for any user/DB content interpolated into HTML.** |
| `src/lib/llm-safety.ts` | `wrapUserInput`, `wrapLabelledInput`, `JAILBREAK_GUARDRAILS`, `MAX_OUTPUT_TOKENS`. Append guardrails to every system prompt; wrap user-typed content. |
| `src/middleware.ts` | Edge middleware: same-origin CSRF gate on every state-changing `/api/*` + admin route protection. `ALLOWED_HOSTS` is the safelist; `CSRF_EXEMPT` for routes that authenticate differently (currently only `/api/admin/session`). |
| `next.config.mjs` | CSP, HSTS, security headers, image domains. |

### 16.2 Component that was at the centre of the null-tuition crash

`src/components/ChatWidget.tsx:39` historically contained:
```ts
`Tuition: $${p.annual_tuition_usd.toLocaleString()}/yr`
```
Which crashed when `annual_tuition_usd` was null. Fixed by null-safe formatter:
```ts
const usd = (n) => (typeof n === "number" ? `$${n.toLocaleString()}` : "—");
```

### 16.3 The tier results pattern

Each tier ends with this incantation:
```bash
npx tsx scripts/verify/merge.ts                         # Merge verified outputs
npx tsx scripts/verify/rename-from-page.ts              # Auto-rewrite stamps
python3 (backfill living-cost defaults per country)     # Inline script, see chain-tiers.sh
npx tsc --noEmit                                        # Type check
git add scripts/verify/catalogs scripts/verify/seeds rename-review.json src/data/programs.ts
git commit -m "Tier-N: ..."
git push origin main
```

### 16.4 The user is on macOS Bash 3.2

Affects shell scripts: no `${VAR^}` (uppercase first), no `${VAR,,}` (lowercase), no associative arrays.

### 16.5 Vercel + GitHub URLs

- GitHub repo: `https://github.com/Piyush190672/eduvian`
- Vercel team: `pkaicontent-3902s-projects`
- Production URL: `https://www.eduvianai.com`
- Vercel project: `eduvian`
- Deployment URL pattern: `https://eduvian-<hash>-pkaicontent-3902s-projects.vercel.app`

### 16.6 Key dependencies (`package.json`)

Production:
- `@anthropic-ai/sdk` ^0.90.0
- `@supabase/supabase-js` ^2.45.0
- `@sentry/nextjs` (resolved server-side via `@sentry/node` workaround)
- `@react-pdf/renderer` ^3.4.4
- `next` ^14.2.0
- `react` ^18.3.0
- `resend` ^4.0.0
- `mammoth` ^1.12.0 (for docx text extraction in /api/extract-text)
- `pdf-parse` ^2.4.5

Dev:
- `tsx` ^4.19.0 (run TS scripts)
- `playwright` (Chromium for verifier)
- `docx` (Word doc generation)
- `openpyxl` via `pip3 install --user openpyxl` (for Excel via Python)

### 16.7 Common log/file paths

- `/tmp/chain-t10.log` — current tier-10 chain log
- `/tmp/chain.log`, `/tmp/chain2.log` — earlier chain logs (may have been rotated)
- `/tmp/tier{N}-search.log`, `/tmp/tier{N}-verify.log` — per-phase logs
- `~/Desktop/eduvian-legal-docs/` — Word legal docs for counsel
- `~/Desktop/data for claude/` — this snapshot location, plus user's prior knowledge files

### 16.8 Checked-in state file at top of programs.ts

```ts
// @ts-nocheck — large generated data file; type-checked at consumption point
import type { Program } from "@/lib/types";

type ProgramEntry = Omit<Program, "id" | "is_active" | "last_updated">;

export const PROGRAMS = ([
  // ─── USA ─────────...
  { ... },
  ...
]) as ProgramEntry[];
```

The `@ts-nocheck` is intentional — file is too large for the TS server to type-check efficiently. Type safety is enforced at consumption (in `scoring.ts`, `db-stats.ts`).

### 16.9 The Sentry instrumentation.ts file

Exists but **proven unreliable on Vercel**. Don't rely on it. The eager `Sentry.init()` in `api-error.ts` is what actually captures errors. Don't remove the eager init even if `instrumentation.ts` looks like the "proper" Next.js pattern.

---

## §17 Common pitfalls a new session might fall into

1. **Re-adding Switzerland.** `merge.ts` will block it but a manual edit to programs.ts could slip through. Don't.
2. **Using Haiku/Sonnet in verify-program.ts.** Both fabricate. Audit script `audit-haiku-vs-opus.ts` confirms. Stay on Opus 4.7.
3. **Pushing the legal pages commit.** Local-only until counsel approves. The bracketed placeholders are a tell.
4. **Re-implementing pricing.** User explicitly said "ideation only — do not deploy".
5. **Using regex replacements on programs.ts.** That's how the corruption happened. Use `repair-corruption.ts`-style parse-and-emit.
6. **Editing programs.ts while tier chain is running.** Merge conflicts. Wait for chain to commit.
7. **Skipping `npx tsc --noEmit` and `npx next build` before push.** Build will fail on Vercel and trigger an email storm.
8. **Pushing without testing the Vercel preview.** No staging — direct to prod.
9. **Adding API routes without rate limit + beta-gate.** They're cost-amplification vectors.
10. **Modifying RLS policies without checking the security audit (C2).** The submissions table is anon-no-read post-C2; service-role only. Same shape on `students`, `tool_usage`, `user_sessions`, `otp_challenges`.
11. **Forgetting to await `Sentry.flush(2000)`** in API error handlers. Errors silently disappear.
12. **Forgetting that NEXT_PUBLIC_* env vars are visible to the browser.** Don't put secrets there.
13. **Trusting `instrumentation.ts` to fire on Vercel.** It doesn't reliably. Use eager init.
14. **Manually editing chain-tiers.sh without testing on macOS Bash 3.2.** No Bash 4 syntax.
15. **Pasting env-var values *with the surrounding quotes* into Vercel.** The C3 hotfix and the Anthropic-key rotation both got bitten by this — values must be raw, no leading/trailing `"`.
16. **Adding routes that read the user cookie without `export const dynamic = "force-dynamic"`.** Prerender will try to evaluate them statically and Sentry will scream. See `/api/account/*` for the pattern.
17. **Pushing schema-dependent code before the migration runs.** H2 (`user_sessions` table), H7 (shadow columns on `submissions`), and OTP (`otp_challenges` table) all have writers that 500 if their tables don't exist. Migration → push, in that order.
18. **Losing `PII_ENCRYPTION_KEY` or `PII_HASH_SECRET`.** Every encrypted row becomes unrecoverable. Treat them like the DB password — keep in 1Password / Apple Keychain.
19. **Skipping the round-trip script after a re-encrypt or key rotation.** `npx tsx scripts/verify-pii-roundtrip.ts` is the one truth-teller for "do encrypted blobs decrypt back to plaintext".
20. **Leaking secrets into chat output during debugging.** When inspecting `.env.local`, redact values before pasting (use the `sed 's/=.*/=<set>/'` trick). The Anthropic key was leaked once and had to be rotated.


---

## §18 Email infrastructure (added May 2026)

### 18.1 Provider configuration

| Component | Provider | Status |
|---|---|---|
| Inbound mail (mailbox + aliases) | Google Workspace Business Starter | ✅ Active, `piyush@eduvianai.com` is the admin user |
| Outbound transactional mail | Resend (verified domain) | ✅ Active |
| DNS provider | GoDaddy | ✅ All records configured |

### 18.2 Active records on `eduvianai.com` (GoDaddy DNS)

| Type | Name | Value | Purpose |
|---|---|---|---|
| TXT | `@` | `google-site-verification=XwNwbuW...` | Google domain ownership |
| MX | `@` | `smtp.google.com` (priority 1) | Inbound mail to Gmail |
| TXT | `@` | `v=spf1 include:_spf.google.com include:amazonses.com ~all` | Combined SPF for Google + Resend |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@eduvianai.com; pct=100; aspf=r; adkim=r` | DMARC quarantine policy |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=...` (2048-bit) | Google DKIM signing |
| TXT | `resend._domainkey` | `v=DKIM1; k=rsa; p=...` | Resend DKIM signing |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (priority 10) | Resend bounce handler |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | Resend SPF on send subdomain |

### 18.3 Email aliases (all on `piyush@eduvianai.com` user, free with Workspace)

| Alias | Purpose |
|---|---|
| `hello@` | Front-facing |
| `support@` | Customer queries — reply-to address for outbound mail |
| `admissions@` | Counselling + lead notifications |
| `partnerships@` | B2B inquiries |
| `careers@` | Hiring |
| `legal@` | Legal queries (referenced in Terms §26) |
| `privacy@` | Privacy / DPDPA queries (referenced in Privacy Policy §14) |
| `grievance@` | Grievance Officer (DPDPA s.27 + IT Act 2000 requirement) |

`noreply@` is intentionally NOT an alias — it's a reserved sender-only address for transactional mail.

### 18.4 Code-level configuration

| Route | From-address default (if `RESEND_FROM_EMAIL` env var unset) | Reply-To |
|---|---|---|
| `/api/email` (results) | `results@eduvianai.com` | `support@eduvianai.com` |
| `/api/email/welcome` | `hello@eduvianai.com` | `support@eduvianai.com` |
| `/api/email/tools` | `results@eduvianai.com` | `support@eduvianai.com` |

`RESEND_FROM_EMAIL` env var is currently unset in Vercel — defaults apply. Setting it would override all three.

### 18.5 Lead notifications (added in this Phase 5 commit)

`/api/submit/route.ts` now calls `sendLeadNotification()` after every successful profile submission. Sends a fire-and-forget HTML email to `admissions@eduvianai.com` with the lead's profile summary and a link to their results page. Failures are silently swallowed — never blocks the student's response.

The `reply_to` on lead-notification emails points to the student's email (not `support@`), so admissions can reply directly to the student.

### 18.6 Outbound authentication test (May 2026)

Test from `piyush@eduvianai.com` → Yahoo Mail confirmed:
```
dkim=pass header.i=@eduvianai.com header.s=google
spf=pass smtp.mailfrom=eduvianai.com
dmarc=pass(p=QUARANTINE) header.from=eduvianai.com
```

All three pillars pass with the right signers — production-grade authentication.

### 18.7 What's NOT yet implemented

- Marketing email opt-in flow (Privacy Policy §11 promises this; not yet built)
- Visible unsubscribe link in transactional email body (the `List-Unsubscribe` *header* is added — see 18.8)
- HubSpot CRM integration on lead-notification (planned for later)
- Custom domain `mail.eduvianai.com` for webmail (low priority — `mail.google.com` works)
- Google Postmaster Tools verification (recommended next; user-facing setup, no code)
- Microsoft SNDS — does NOT apply to Resend customers (we don't own the sending IPs); monitor via Resend dashboard instead

### 18.8 Deliverability hardening (3 May 2026)

Real-user test on 3 May showed OTP emails landing in Yahoo Junk despite SPF/DKIM/DMARC all passing. Three structural fixes shipped in commit `b9291a88`:

1. **Code removed from OTP subject line.** `Your verification code: 123456` looks structurally like phishing. Subject is now plain `Your eduvianAI verification code` — code stays in body only.
2. **Plain-text alternative** added to every Resend send (`text` field in payload). Multipart MIME scores far better than HTML-only on Yahoo + Gmail. Applied to `/api/auth/send-otp`, `/api/email`, `/api/email/welcome`, `/api/email/tools` (ROI + Parent variants).
3. **`List-Unsubscribe` + `List-Unsubscribe-Post` headers** added to every transactional send (Yahoo + Gmail expect these even on transactional traffic; missing them costs reputation). `X-Entity-Ref-ID` tags each kind (`auth-otp`, `welcome`, `results`, `roi`, `parent`).

Reputation is also recipient-action-driven. After this commit, the user (and any test recipients) marking eduvianai.com mail as Not Junk in Yahoo will compound the deliverability gain.

### 18.9 Authentication via email OTP (3 May 2026)

`/api/auth` register and login now require a 6-digit code emailed via `/api/auth/send-otp`. Register flow: collect details → request OTP → enter code → student row inserted + cookie issued. See §19 for the full pipeline.

Closes the previous "type any email and you're in" hole. No Twilio/SMS integration — Resend free tier handles current volume well under cap.

---

## §19 Authentication pipeline

### 19.1 Email OTP flow

Both register and login go through the same two-step pipeline:

```
Step 1 — request OTP
  Browser POST /api/auth/send-otp { email, purpose, name? }
    → IP burst guard (10/hr) + per-email cooldown (60s)
    → INSERT otp_challenges row with code_hash = HMAC-SHA256(email + ":" + code)
    → Resend email with the plaintext 6-digit code

Step 2 — verify and complete
  Browser POST /api/auth { action, name?, email, phone?, otp_code }
    → look up most recent unused, non-expired challenge for (email, purpose)
    → constant-time compare hash; bump attempts; lock after 5 wrong tries
    → on success, mark used = true, then proceed to register/login
    → register: upsert students row, send welcome email (fire-and-forget)
    → login: fetch student row (or recover from submissions.profile if missing),
             create user_sessions row, set opaque eduvianai_user cookie
```

Tunables (in `lib/otp.ts` `OTP_CONFIG`): expiry 5 min, resend cooldown 60s, max attempts 5, lockout 15 min, IP burst 10/hr.

### 19.2 Authentication state at rest

| Cookie | What | Reads from |
|---|---|---|
| `eduvianai_user` | Opaque UUID, 30-day TTL, HttpOnly + SameSite=Lax | resolves to email via SELECT on `user_sessions.id` |
| `eduvianai_admin_session` | HMAC-signed JWT-style admin session, 8-hour TTL | verified by `verifySessionToken` in middleware |
| `otp_challenges` | One row per OTP request, 5-min TTL on `expires_at` | service-role only; pruned via housekeeping job (not yet scheduled) |

### 19.3 Frontend integration

Two surfaces use the OTP flow:

- `src/app/get-started/page.tsx` — public register/login page
- `src/components/AuthGate.tsx` — modal-style gate on Stage 2/3/4 tools

Both implement the same 2-step UX: collect details (name + email + phone) → request OTP → enter 6-digit code → submit. The OTP input has `autoComplete="one-time-code"` so iOS / Safari autofills from the email when it arrives. Resend button has a 60s countdown.

### 19.4 What's deliberately NOT done

- **SMS OTP** — requires Twilio (or MSG91 in India after DLT registration), real cost (~$10–15/mo at current scale), and isn't materially better than email for our threat model.
- **Magic link login** (passwordless via clickable link) — possible follow-up but the OTP flow already gets us the same security property.
- **Existing-account hint on send-otp** — deliberately suppressed to avoid email-enumeration. The response is the same shape whether the email is in `students` or not.


---

## §20 Pinned next-session work

These are concrete, ready-to-pick-up tasks. In priority order.

### 20.1 H7 Phase C — DONE  [closed 5 May late evening]

All four code-change steps shipped (`6ae64c39` reader, `5e8e664b` writer), and the destructive SQL had already been run during the earlier crashed session. The 5 May late-evening verification confirmed:

- Schema: `profile` column absent. Only `profile_encrypted`, `email_hash`, `profile_enc_version` remain for PII.
- Coverage: 5/5 live rows have both `profile_encrypted` and `email_hash` set.

**Writer-side gap discovered + patched.** Two zombie rows (`099afd25...` + `2e10fe35...`, both 5 May 2026) were inserted with `profile_encrypted=NULL` AND `email_hash=NULL`. Root cause: the writer at `src/app/api/submit/route.ts` only enforced encryption when `process.env.NODE_ENV === "production"`. A dev or Vercel-preview environment connected to prod Supabase via the shared service-role key could insert null-encrypted rows. Plaintext was unrecoverable (column already dropped).

Cleanup done:
1. Manually deleted both rows in Supabase Studio (`DELETE … WHERE id IN (…) AND profile_encrypted IS NULL AND email_hash IS NULL RETURNING …`).
2. Patched the writer to **skip the Supabase insert when `pii_profile_encrypted` or `pii_email_hash` is null**, regardless of NODE_ENV. The in-memory store is still populated so dev flows keep working without keys.

> **Lesson for the snapshot:** any future API route that writes encrypted PII should guard the `.insert()` on the encrypted-fields-present invariant, not on `NODE_ENV`. The shared service-role key means dev and prod hit the same DB, so prod-only guards leak.

### 20.2 Clean up the 63 still-unverified entries in `programs.ts`

Two re-verify passes today brought the unverified gap from 209 → 63. The remaining 63 are categorised in §3.1.1.

**Suggested cleanup pass (~$0 — no fresh verify calls; just stripping):**

```bash
# 1. Strip the 24 catalog-URL field_mismatch entries (the 24 obvious ones)
npx tsx scripts/verify/audit-strip.ts --include field_mismatch
# Inspect dry-run output first; the 7 specific-page mismatches need manual eyeball.

# 2. Manually strip the 2 De Montfort 404s (cyber-security-msc + software-engineering-bsc)
#    via a small ad-hoc python edit on programs.ts.

# 3. The 28 catalog-URL fetch_or_api_error entries (DNS-unresolvable from build network):
#    Either re-seed real program-detail URLs via websearch-seed-finder, or strip.
#    Stripping is the simpler call — the QS-tier seed-finder didn't find better URLs
#    for these on the 4 May run, and these are mostly low-value sub-departmental
#    `/graduate` placeholders.
```

After cleanup, the unverified gap should drop from 63 → ~5-10 (the survivors are real specific-page mismatches and the 2 retry candidates).

### 20.3 Marketing email opt-in flow

Privacy Policy §11 promises this; not yet built. Meaningful for DPDPA / GDPR alignment if we ever start sending non-transactional newsletters.

### 20.4 Visible unsubscribe link in email body

`List-Unsubscribe` header is in (commit `b9291a88`); a clickable unsubscribe link in the body itself is missing.

### 20.5 Real downloadable Sample Parent Report PDF

The current `/sample-parent-report` (committed in `6bf0eb8e`) is a static HTML page with a Save-as-PDF button (`window.print()`). For a more 'official' feel, generate an actual static PDF asset via the existing `/api/pdf/*` route infrastructure with a `?sample=1` param, store at `/public/sample-parent-report.pdf`, and update the homepage CTA to `<a href="/sample-parent-report.pdf" download>`.

---

## §21 Latest dataset shape (4 May 2026 night)

| | Count |
|---|---:|
| Programs total | **5,595** |
| Programs verified at source | **5,532** (98.9%) |
| Universities total | **506** |
| Universities with at least one verified program | **485** (96%) |
| Countries | 12 |
| Fields of study | 17 |

`DB_STATS` exposes both totals AND verified counts, but **all public-facing surfaces now standardise on `verifiedProgramsLabel`** (commit `f2cf997b`). The dual-number inconsistency that surfaced earlier in this session (one section showing 4,485+, another 4,866+ from a stale cached deploy) is closed: there is one number on the homepage now, and it's the verified one.

- `DB_STATS.verifiedProgramsLabel` ("5,532+") — used everywhere user-visible.
- `DB_STATS.verifiedUniversitiesLabel` ("485+") — for the "Verified Global Universities" stat.
- `DB_STATS.programsLabel` ("5,595+") — internal-only; only `src/app/api/chat/route.ts` (the AISA system prompt) references it now, for accuracy when the AI answers "how many programs do you have?". **Don't reintroduce this in copy.**

---

## §22 Homepage — 9-item rework brief: status

User shared 9 brand+UX items mid-session. My read was: ship 5 clean wins now, defer 3 structural ones until we see the live page, defer 1 (item 7) initially then ship after user pushed for it. Then user added items 1 + 7. Final state:

| # | Item | Status | Commit |
|---|---|---|---|
| 1 | Hero subtext shortened | ✅ "From shortlist to visa, one AI that thinks the whole journey through." | `26a62df8` |
| 2 | Section reorder + density cut | **Deferred.** My take: cut, dont reorder. Look at the live page first; "Why EduvianAI" might have reduced the urgency. |   |
| 3 | "Most used by successful applicants" → "Most useful before you apply" | ✅ | `26a62df8` |
| 4 | Demo numbers labelled "Sample output" | ✅ | `26a62df8` |
| 5 | "official-format questions" softened | ✅ on homepage `26a62df8` + on `/english-test-lab` page `9d42d197` |   |
| 6 | Visa stage softening — "minimize rejection" → "Get visa-ready with clarity" | ✅ | `26a62df8` |
| 7 | "Why EduvianAI is different" section (4 sub-points) | ✅ — also got the moat lead-card upgrade after user pushed | `2afb528a` → `666ef00f` → `0f17daf2` → `700bfb9f` |
| 8 | Destinations advisory rewrite | **Deferred.** My take: 6-word "best for..." taglines feel reductive without per-country depth backing them. Either commit fully or skip. |   |
| 9 | In-context disclaimers across tools | ✅ — new `DecisionDisclaimer` component with 5 variants wired into ROI Calculator, Visa Coach, English Test Lab, results page, scholarships section. | `26a62df8` |

**Deferred-on-purpose discussion (items 2 + 8):** my brand+UX read was that the pages real problem is *density*, not order. Reordering 8 sections wont make it feel premium; cutting 2-3 will. And the destinations advisory needs full per-country depth, not 6-word taglines. Both are bigger decisions than copy swaps and warrant a fresh look at the live page first.

**4 May update on items 2 + 8:** Item 2 was effectively executed in commit `0d6c1dc5` after a fresh SWOT-driven look at the live page. New section order: Hero → Stage selector → Sample outputs → Why different → How shortlist is built (NEW) → Five-stage detail → Destinations → Scholarships → Final CTA. Density also cut substantially in the same and follow-up commits. Item 8 (destinations advisory) still deferred — same reasoning still holds.

---

## §23 Session log — 4 May 2026 (homepage UX + tier-2 verify)

This session shipped 26 commits. Major themes:

**Verification pipeline:**
- `6054aad2` re-verify pass on the 209 unverified — net 95 verified, 74 dead URLs stripped → 4,548/4,485.
- `6022523a` +63 universities + 582 programs across UK / Germany / Canada / Australia (Edinburgh, Manchester, Kings, LSE, Leeds, Warwick, Nottingham, Durham, Bath; Monash, Adelaide; plus Fachhochschulen and polytechnics) → 5,130/5,067. **75% verify pass-rate** with fresh websearch-seed-finder seeds vs 5% with stale auto-seeds. **This is the new default for adding unis** — see CLAUDE.md verify-pipeline §7.
- `006ed0cd` +57 universities + 465 programs across France / UAE / Malaysia / Singapore (Sciences Po, ENS Paris, Paris-Saclay, ESSEC, SKEMA, etc.; AUS, AUD, MBZUAI; Monash Malaysia, Nottingham Malaysia; SMU, SUTD, SIT) → 5,595/5,532. **85% pass-rate.**

**Homepage SWOT-driven restructure (multi-pass):**
- `4ab44902` Why-different refocused on independence + agent-counselling contrast (4 cards: verified → independent → AI-driven → built-to-decide → transparent).
- `04f5cb6c` ETL chip 'Official-format' → 'Exam-style'.
- `0d6c1dc5` Section reorder (trust above stage detail), parent trust strip in hero, NEW 'How your shortlist is built' module, softer Visa Coach + Interview Coach copy, action-led stage labels, dual-CTA Decide stage with parent-aware framing, final CTA mentions visa.
- `f2cf997b` Single source of truth: all public surfaces standardise on `verifiedProgramsLabel`. Trust strip relabeled 'For students and families' + reordered.
- `9e501f18` SWOT round 2: softer 'agent-counselling' tone (heading 'Structured guidance, not guesswork'), F-1 interview line softer, tracker outcome line softer, sample Parent Decision Report card with 7-factor table inside Stage 4, dual section CTAs (Compare my offers / Create family decision report), CTA personalisation (Find my best-fit programs, Check my application strength, Practise my interview), Get-Started page copy refresh.
- `148cb94b` Auto-rotate 'See what you actually get' demos every 5s (5 tools, manual click resets dwell timer).
- `4966dd5e` Stage selector labels action-led (Find my best-fit programs / Strengthen my application / Practise tests & interviews / Compare offers with ROI / Get visa-ready).
- `94f0d578` Modals 5-stage parity: About + How It Works modals had 4 stages labelled A/B/C/D — now 1/2/3/4/5 with the missing Apply Visa stage added (incl. matching evidence panel for Stage 5 in the How It Works modal — UK Student visa story with £1,483/month × 9 months financial proof).
- `6bf0eb8e` `/sample-parent-report` page (static, illustrative, print-friendly Save-as-PDF). Linked from the Decide-stage 'See sample family report' CTA.
- `305f8b70` Standardise tool cards across stages 2/4/5 with the 5-line scan pattern (name / description / Output / Time / CTA). Stage 3 left compact (already 4-line scannable grids).
- `b5c6966d` Polished sample-output tabs: numbered (1-5), CSS-keyframe progress bar driving the 5s auto-rotate (CSS-driven to avoid React render throttling), Pause/Resume + 'X / 5' indicator.
- `17f420d0` Data-consistency + tone polish (5,067 → 5,532; 9 'signals' (was 12) → '9 Most Important Signals'; 'Our moat' → 'Why this is reliable'; parent report card tagline + secondary CTA).
- `6a6fb9a5` 'How your shortlist is built' premium card treatment (white card, gradient badge, hover-lift, Step 01 · Profile labels).

**Mobile compaction (5 passes, ending with the GPU fix):**
- `9018bcb9` Tightened section padding on mobile, hero trust strip 4-col → 2-col, stage detail card padding `p-10` → `p-6 sm:p-10 md:p-14`.
- `beae883b` Hide stage selector descriptions on mobile (5 cards), hide Stage 1's product mockup on mobile (~700px savings).
- `2cb73cc2` English Test Lab grid 2-up on mobile (was 1-col stack), Stage 5 country flag chips hidden on mobile.
- `859d244b` Hide chip strips in stages 4 + 5 on mobile, hide Interview Coach descriptions on mobile.
- `a4a6b188` Stage 3 mobile accordion (collapse English Test Lab + Interview Coach behind 'Show Stage 3 details' toggle).
- `eb60bbc7` Stages 2 + 4 + 5 mobile accordions (same pattern).
- `608f60af` Drop framer-motion `y: 30` translate, switch viewport `margin: "-80px"`, MotionConfig wrapper for `transition: { duration: 0 }` globally — *did not fix the scroll-flash*.
- `6e0a49b8` Strip ALL `whileInView` triggers + lazy-load destination images — *still didn't fix it*.
- `cce57e0a` **The actual fix: `hidden md:block` on all 23 decorative blur blobs.** Root cause was GPU compositing of `blur-3xl` filters, not React/animation overhead. CLAUDE.md updated with this lesson.

**Other:**
- `43218c71` empty-commit retrigger because Vercel coalesced two back-to-back pushes into one deployment. Vercel CLI's `--prod --yes` hit a free-tier upload limit, so empty-commit-and-push is the fallback. (Lesson added to CLAUDE.md environment quirks.)
- `src/lib/migrations/20260505-h7-phase-c-drop-plaintext.sql` written (committed via `006ed0cd` along with seed JSON files — see §20.1 for the runbook).

**Numbers shipped:**
| | Start of session | End of session |
|---|---:|---:|
| Programs total | 4,622 | **5,595** (+973) |
| Programs verified | 4,413 | **5,532** (+1,119) |
| Universities total | 425 | **506** (+81) |
| Universities verified | 381 | **485** (+104) |

**Estimated session API spend:** ~$170 (Strategy A killed = $7, seed-finder × 2 batches = $27, verify-batch UK/AUS/CAN/GER = $56, verify-batch FR/UAE/MY/SG = $44, plus re-verify earlier in session = ~$30+).



---

## §24 v2 prototype + final homepage structure (locked 5 May 2026)

This section captures the brand-redesign work from the 5 May session and the final homepage structure the user has signed off on. All future homepage work follows this brief — don't reinvent.

### 24.1 Why we did v2

User feedback after the 4 May SWOT-driven restructure: production homepage at `/` was *immensely useful* but felt cluttered, dense, and not premium enough for Tier-1 Indian metro target audience. User asked for a brand-UX redesign with three reference points:

- **Crimson Education** — premium ed-tech, restrained palette, charcoal + crimson, editorial photography, low density.
- **Coursera** — white-dominant, single-accent, generous whitespace, trust-through-clarity.
- **Lovable** — near-black hero with a warm accent, big italic-emphasis editorial type, design-forward SaaS feel.

Plus: Linear (cited later) — monochrome with one electric accent, generous editorial type scale, restrained motion.

Goal: make v2 the new homepage, retire the dense production homepage as a *content source* for deep pages.

### 24.2 Where v2 lives — **SWAPPED to / on 5 May 2026**

- **Production homepage now serves the v2 design at `/`** (swap commit `66135a13`, post-swap polish in `3c4d4929` + `259639da`).
- Pre-swap homepage backed up at `_archive/page-pre-v2-swap.tsx.bak` (in repo root, not under src/) — content source for any deep pages still to be extracted.
- Pre-swap v2 prototype preserved un-routed at `src/app/_v2-archive/page.tsx` (the underscore prefix keeps Next.js from creating a route for it).
- Iteration history: `6cff501f` (round 1) → `daff6839` (round 2) → `63b17ba8` (round 3) → `a75fc4c1` + `d77f2e06` (round 4 — heading change, parent strip, dashboard hero, violet accent, semantic palette, card 5-line pattern, bias-free statement) → `66135a13` (swap to /) → `3c4d4929` (post-swap polish + /methodology) → `259639da` (nav restoration + back-button placement).

### 24.3 Locked brand direction

**Positioning statement** (use across the website):

> EduvianAI gives students and families an independent, data-backed layer of clarity before they make high-stakes study abroad decisions.

**Visual style**: Premium AI advisor + youthful student energy + parent-grade credibility.

**Palette** (semantic, not decorative):

| Use | Colour |
|---|---|
| Page base | white + stone-50 alternating |
| Hero / dark moments only | `#0E1119` (warm near-black) |
| AI accent — selective | `violet-600` (`#7C3AED`) |
| Safe / approved / good fit | `emerald-600` |
| Medium risk / caution | `amber-600` |
| Risk flag / refusal | `rose-600` |

**Typography**: keep v2 pair — Space Grotesk (display) + Inter (body). Don't reintroduce display-script or decorative fonts. Italic emphasis on key 1–3 word phrases is on-brand (Linear-style); keep it sparing.

**Card pattern** — every tool / stage card on the homepage carries these 5 elements in this order:

1. Title
2. One-line benefit
3. Sample output (a real concrete example, not a description)
4. CTA
5. Trust cue

Example: AI Shortlist · "Find 20 best-fit programs from verified university data." · `6 Safe · 9 Reach · 5 Ambitious` · `Find my programs` · "Match is built only on verified-at-source program data."

**Imagery**: real dashboard mockups in the hero. No graduate photograph (round 1 had this, removed in round 4). Photography is allowed in Destinations section only.

**Hard avoids** (do not reintroduce):

- ❌ Superlatives that aren't independently verifiable: 'largest', 'best', 'most popular', 'top-rated', 'leading'.
- ❌ Decorative blur blobs on mobile (root cause of the 4 May scroll-flash bug — every `blur-3xl` / `blur-[Xpx]` div with `pointer-events-none` carries `hidden md:block`).
- ❌ Dual numbers for the same metric — `verifiedProgramsLabel` everywhere, `programsLabel` is internal-only.
- ❌ Per-stage rainbow gradients — single accent (violet) + semantic colours only.
- ❌ Emoji-as-icon overuse in headings; lucide icons single-weight, sparingly.
- ❌ `whileInView` framer-motion entrance animations — cause IntersectionObserver overhead per element. The page wraps the return in `<MotionConfig transition={{ duration: 0 }}>` as a safety net.

**Bias-free editorial line** (place under trust principles, exact wording locked):

> Built to reduce individual bias, guesswork, and commission-led recommendations.

### 24.4 Locked homepage structure (8 sections)

This is the structure the user signed off on. Apply to `src/app/v2/page.tsx`, then swap `/v2 → /`.

1. **Hero**
   - Headline: *"Choose your study abroad path with verified data you can trust."*
   - Subtext: the positioning statement (24.3).
   - Two CTAs: `Find my best-fit programs` (primary, violet) → `/get-started`. `Generate the family report` (secondary, ghost) → `/parent-decision`.
   - RHS: real sample-dashboard mockup (Top 20 shortlist with 5 sample rows, Safe/Reach/Ambitious tier pills using the semantic palette). NOT a photograph.
   - Bottom: thin trust strip — `Independent · no university commission · 5,532+ programs · 485+ universities · 12 countries · Decision-support estimates`.
   - **Directly under hero**: parent strip in stone-50 with two cards:
     - For students: *"Find the right-fit course, improve your application, prepare for interviews."*
     - For parents: *"Compare cost, ROI, safety, visa readiness, and long-term value."*

2. **Proof strip**
   - 5,532+ verified programs · 485+ universities · 12 countries · No university commission · Official-source data.
   - Editorial layout (large numbers + short description). White background, violet vertical accent bars on each stat.

3. **Five-stage journey** — each card linking to relevant deeper page.
   - Match → `/match` (alias of `/get-started` until /match exists)
   - Check → `/application-check`
   - Practice → `/interview-prep`
   - Decide → `/roi-calculator` (or `/parent-decision` for the family-decision flow)
   - Apply → `/visa-coach`
   - Each card uses the locked 5-line pattern (24.3).

4. **See actual outputs** — auto-rotating sample-output showcase on white background, colored left-borders per demo.
   - AI shortlist
   - SOP score
   - Visa interview feedback
   - ROI report
   - Parent decision report
   - 5s auto-rotate, click-to-focus, CSS-keyframe progress bar (carry the implementation pattern from production `/`).

5. **Why trust EduvianAI** — 4 principles in a 2x2 grid, big numerals.
   - Verified at source
   - Independent
   - Structured scoring
   - Transparent estimates
   - Followed by the bias-free editorial line (24.3).

6. **For families** — Parent Decision Report sample card (white background) with left column: positioning copy + dual CTAs (`Generate the report` → `/parent-decision`, `See sample report` → `/sample-parent-report`). Right column: 7-row sample table with colour-coded verdicts (Budget fit / Payback period / Safety / Job market / Visa readiness / Scholarship fit / Family verdict).

7. **Explore tools** — tool cards linking to deeper pages.
   - Same 5-line card pattern as journey cards (24.3).
   - Cards link to: `/match`, `/application-check`, `/interview-prep`, `/english-test-lab`, `/roi-calculator`, `/parent-report`, `/visa-coach`, `/destinations`, `/scholarships`.
   - This is the section that drives users to the deep pages instead of overloading the homepage with detail.

8. **Final CTA** — light cream section (stone-50), single italic accent, two clean CTAs.

### 24.5 Deep pages — current status

All routes the homepage links to. Updated post-swap.

| Path | Status | Notes |
|---|---|---|
| `/` | ✅ v2 brand language | Live, swap landed `66135a13` + post-swap polish `3c4d4929` + `259639da`. |
| `/match` | ✅ Created (5 May) | New route with v2 brand language. |
| `/parent-report` | ✅ Created (5 May) | New route. `/parent-decision` still exists (functional tool surface). |
| `/destinations` | ✅ Created (5 May) | New dedicated page; pre-swap homepage section content extracted here. |
| `/scholarships` | ✅ Created (5 May) | New dedicated page; pulls from the `SCHOLARSHIPS` array (was at `_archive/page-pre-v2-swap.tsx.bak` lines 39+, content source preserved). |
| `/methodology` | ✅ Created (5 May) | New page documenting the verification pipeline + 9-signal scoring — added during the post-swap polish pass. |
| `/application-check` | ⚠️ Exists, **pre-swap visuals** | Visual update to v2 brand language pending — open work item #2. |
| `/interview-prep` | ⚠️ Exists, **pre-swap visuals** | Same — open work item #2. |
| `/english-test-lab` | ⚠️ Exists, **pre-swap visuals** | Same. |
| `/roi-calculator` | ⚠️ Exists, **pre-swap visuals** | Same. |
| `/visa-coach` | ⚠️ Exists, **pre-swap visuals** | Same. |
| `/parent-decision` | ⚠️ Exists, **pre-swap visuals** | The full parent-decision tool. `/parent-report` is the new branded entry; this is the deep-tool surface. Visual update pending. |
| `/get-started` | ⚠️ Exists, **pre-swap visuals** | The match flow's actual entry. `/match` is the new branded entry; this is the deep-tool surface. |
| `/sample-parent-report` | ⚠️ Exists, **pre-swap visuals** | Static illustrative report. |
| `/application-tracker` | ⚠️ Exists, **pre-swap visuals** | Kanban board for managing applications. |
| `/sop-assistant`, `/lor-coach`, `/profile` | ⚠️ Exist, **pre-swap visuals** | Subordinate tool routes. |

### 24.6 Swap procedure — **DONE**

The swap landed on 5 May 2026. Recorded for posterity (also useful as a reference for the next big visual rework).

1. ✅ v2 file matched §24.4 (post round-4 fixes in `a75fc4c1` + `d77f2e06`).
2. ✅ Walk-through on phone + desktop verified.
3. ✅ Pre-swap homepage backed up to `_archive/page-pre-v2-swap.tsx.bak` (repo root).
4. ✅ Swap: `src/app/v2/page.tsx` content moved to `src/app/page.tsx`. v2 prototype preserved un-routed at `src/app/_v2-archive/page.tsx`.
5. ✅ Footer `Original →` link removed.
6. ✅ Nav `v2 prototype` micro-label dropped.
7. ✅ CLAUDE.md `Key code paths` table updated.
8. ✅ tsc + next build + commit + push (commits `66135a13`, `3c4d4929`, `259639da`).


---

## §25 Session log — 5 May 2026 evening (v2 swap, deep pages, H7 Phase C code)

This session shipped 6 commits. The session crashed on an API image-limit error (too many large screenshots accumulated in context); a follow-up turn from a fresh session shipped commit #6 (writer-side Phase C) and refreshed the docs. Major themes:

**Brand redesign — swap landed:**
- `66135a13` homepage: swap v2 brand redesign onto `/` · add deep pages (`/match`, `/parent-report`, `/destinations`, `/scholarships`).
- `3c4d4929` homepage: post-swap polish pass + new `/methodology` page.
- `259639da` homepage + auth: nav restoration + back-button placement.

Pre-swap homepage backed up at `_archive/page-pre-v2-swap.tsx.bak`. Pre-swap v2 prototype preserved un-routed at `src/app/_v2-archive/page.tsx`. Both retained as content sources for the visual update of the deep tool pages.

**H7 Phase C code-deploy:**
- `6ae64c39` reader side: `decryptProfile()` plaintext fallback removed; `SUBMISSION_PROFILE_COLUMNS` no longer references `profile`; `admin/leads` SELECT cleaned.
- `5e8e664b` writer side: `submit/route.ts` no longer dual-writes plaintext. In production, returns a 503 with a user-readable message if encryption is unavailable (key missing OR encrypt throws). Local/dev still falls through quietly so `npm run dev` keeps working without Vercel env vars. The race window between code-deploy and SQL-run is now safe — any submission during that window either succeeds (encrypted) or 503s; never lands as plaintext.

**Migration SQL update:**
The migration file `src/lib/migrations/20260505-h7-phase-c-drop-plaintext.sql` was updated to:
- Add a 4th item to the pre-deploy checklist (writer side: remove `profile` from `submit/route.ts` INSERT).
- Add a coordination note about the deploy-vs-SQL timing window.
- Add `ALTER COLUMN profile DROP NOT NULL` belt-and-suspenders inside the same transaction as the `DROP COLUMN`.

**Docs refresh (this turn):**
- CLAUDE.md `Open work` rewritten: top priority is now "run the H7 Phase C SQL"; v2-swap and deep-pages tasks moved to the "Done" list with commit references.
- STATE_SNAPSHOT.md header date / pinned-priority block / §3 current-state table / §3.1 country breakdown / §20.1 H7 runbook / §24.2 'where v2 lives' / §24.5 deep-pages table / §24.6 swap procedure all updated to reflect post-swap reality.

**Numbers:**

| | Start of 5 May session | End of 5 May session |
|---|---:|---:|
| Programs total | 5,595 | **5,595** (no change) |
| Programs verified | 5,532 | **5,532** (no change) |
| Universities | 506 | **506** (no change) |
| Routes in `src/app/` | 21 | **26** (+5 deep pages: /match, /parent-report, /destinations, /scholarships, /methodology) |
| Production homepage design | v1 (dense, multi-stage) | **v2 brand language** (8-section, low-density, editorial) |
| H7 Phase C status | Code pending, SQL pending | **Code shipped, SQL pending** |

**Estimated session API spend:** ~$5 (no verify-batch runs; just code generation + edits).


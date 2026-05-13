# EduvianAI — Comprehensive State Snapshot for Session Handoff

**Last updated:** 12 May 2026 (handoff #14 — 31 commits on top of handoff #13: password-auth flow, beta-cap to 50/mo, matching-algorithm rewrite (academic + budget + field + intake all hard filters), 4 tuition-data backfill layers, MBA leadership questions + hard filter, English signal honesty fixes, /api/version endpoint, security.txt + RLS hardening)
**Purpose:** Zero-loss handoff between Claude Code sessions. A new session reading this should be able to continue *every* in-flight workstream correctly, respect all user preferences, and avoid all known gotchas.

> **No background processes running.** The chained 7-country prior-year-tuition sweep (wrapper PID 38419, see 7889f120) was user-stopped after 92 / 2,933 entries (~$3.70 of $118 budget). Re-runnable at any time — the script's "already-estimated rows are skipped" rule means a fresh spawn picks up exactly where it left off.

> **Pinned next-session priority (handoff #14 → #15):** STATE_SNAPSHOT + CLAUDE.md refresh (this commit). Then user-driven QA: confirm the new password-login flow works end-to-end (set password from /account/security, log out, log in via Password toggle), eyeball the tightened matching results (academic + budget + field + intake hard filters may shrink some users' shortlists). API spend decisions: resume the 7-country tuition sweep (~$114 more for ~870 fills, or revise the QS-max boundary down to spend less). Tier-D leftovers from handoff #13: M1 CSP, M3 Zod, M5 secrets-rotation doc, M7/L3 legal-doc edits (don't push without attorney sign-off), L5 verified_at HMAC, I2/I3/I4 informational. Tier-B #9 (USA residential proxy) still skipped pending explicit user authorisation for paid subscription. See §34.

> **What's NEW since handoff #11 (21 commits on main):**
>
> - **estimate-fees USA + Germany landed (`6ac022be`)** — fee coverage: USA 31.9% → 78.1% (+1,410 estimates), Germany 19.7% → 31.0% (+89). Canada was stopped early at 138/552 — 19 estimates lost to SIGTERM since they were below the 20-flush threshold. Hardening (`a42b83f4`) added a SIGTERM handler that flushes before exit and dropped the threshold to 5.
> - **Block 2 D — Canada west/east (`d59732ec`)** — +72 verified programs across 13 regional Canadian unis (Thompson Rivers, Royal Roads, Athabasca, Lethbridge, Winnipeg, Suffolk, UAL, etc.). Brandon + Ontario Tech hit seed-finder JSON parse errors — descoped by user.
> - **Block 2 B-Phase 1 — SG/UAE/MY/IE depth (`47d39bd7`)** — +18 verified programs (UAE +12, MY +4, SG +1, IE +1). Seed-finder stalled at 30/55 unis due to Anthropic API rate-limit pressure; user authorised partial-commit. B-Phase 2 (~25 remaining unis) queued in Tier-B.
> - **Block 2 C1 — UK new universities (`1b081ce6`)** — +63 verified programs across 11 of 15 targeted new UK unis (UAL, Suffolk, Abertay, Queen Margaret, Royal Veterinary, St George's, etc.). 4 unis (Northumbria, Norwich UA, Open University, Bedfordshire) landed 0 programs — descoped by user.
> - **Block 2 C2 — UK UG deepening (`712aaaed`)** — +3 verified UG programs across 14 PG-heavy UK unis. Low yield was structural: seed-finder defaults to flagship PG / Master's pages; URL-keyword UG filter caught only 11 of 112 in-scope seeds. Closed at 3.
> - **Hero rewrite (`a85ac572` → `bc422dc7`)** — H1 swapped from feature-led ("verified data you can trust") to stakes-led ("You only get to decide this *once*"). Eyebrow now reads "INDEPENDENT AI-POWERED STUDY-ABROAD DECISION INTELLIGENCE". Both-sides cards subtexts rewritten as emotional benefits (`71fdd716`).
> - **Operating rules in CLAUDE.md (`c5f13551`)** — 10 non-negotiable rules above the project-specific Hard Rules: think before coding, simplicity first, surgical changes, goal-driven, factual-only, model-for-judgment-only, surface conflicts, read-before-write, checkpoint after each step, fail loud.
> - **Voice patch (`b83dae10`)** — SR pipeline prime + listening cue on `onaudiostart`. Holds the mic stream open for the session lifetime. Eliminates the ~500–1000ms cold-start that made users speak 2–3× before capture. Live-mic test still pending (Tier-A #1).
> - **ROI + Parent no-fee dead-end → editable input (`84ced1b8`)** — programs with no verified or estimated fee now render an "Enter the annual tuition" prompt instead of "Cannot calculate". Caveat banner mirrors the existing estimated-fee pattern.
> - **Tier 1 value-strengthening (`368e05c7`)** —
>   - Sample Parent Report cost inconsistency fix: split "Budget fit" into honest "Tuition budget fit" (Good) + "Total investment fit" (Needs discussion).
>   - `<NextBestAction />` shared component, high-contrast violet gradient, dropped into 5 result surfaces (ROI, Parent, Visa Coach, Shortlist Summary, Sample Parent Report).
>   - AISA chat trust frame banner + suggested-prompt refresh.
> - **Tier 2 transparency (`8c3c86b6`)** —
>   - `<DataBadge kind=... />` with 5 provenance types (official / ai_estimate / user_provided / needs_verification / illustrative). Scoped to decision-driving values only.
>   - `<SourceProof lines lastVerified sourceUrl />` emerald-tinted footer dropped into ROI / Parent / Visa Coach / Sample Parent Report. Pure-UTC date format to avoid SSR hydration mismatch.
> - **Tier 3 decision lens + family handoff (`a02d740d` + `b8af4373`)** —
>   - `<TradeoffView />` six-factor decision lens (Admission · Cost · ROI · Visa · Safety · Scholarship) with optional "Compare with..." chip row. Dropped into Sample Parent Report.
>   - `<ShareWithFamily />` three-button family handoff (Print/PDF · Email (mailto) · Parent-friendly view). Dropped into Visa Coach + Shortlist Summary. ROI/Parent got single "Parent-friendly view" buttons next to existing PDF/Email.
>   - **New `/options?lens=safer|cheaper|roi|visa-low|scholarship` route** — cross-program ranker behind the "Compare with..." chips. 5 lenses each with their own scoring rule + DataBadge + SourceProof.
> - **AISA currency fix (`57f59a18`)** — added explicit lakh/crore definitions + FX rates + worked examples to the system prompt. Was returning "40 lakhs INR ≈ $4,800" — now $48,200. Real fix (deterministic `convertINR()` helper) is Tier-A #2.
> - **AISA intake calendar (`0f5f1586`)** — `buildIntakeContext(now)` computes the active + following Fall intake from the request timestamp, injected per request so AISA stops referencing 2025 as "current".
>
> The DB grew from **7,800 / 7,737 verified → 7,987 / 7,924 verified** during this session (+187 programs, fee coverage 39.2% → 54.3%).

> **Read this top-to-bottom before doing anything.** Then run the verification commands in §0 to confirm reality matches this document. §31 has the full handoff-#12 open-work plan.

---

## §0 First-action verification

```bash
cd /Users/piyushkumar/Playground/eduvian

# 1. Where is the codebase?
git log --oneline -10
git status --short

# 2. What's running in the background? (no tier chain currently expected)
ps aux | grep -E "verify-program|verify-batch|websearch-seed|seed-crawler|re-verify" | grep -v grep

# 3. Database scale check (expected: 7,987 programs, 7,924 verified, 12 countries)
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
│   │   ├── types.ts           # Program, ScoredProgram, StudentProfile, FIELDS_OF_STUDY (18), TARGET_COUNTRIES (12)
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

### 2.5 18 Fields of Study (`FIELDS_OF_STUDY` in `src/lib/types.ts`)

```
1.  Computer Science & IT
2.  Artificial Intelligence & Data Science
3.  Business & Management
4.  MBA
5.  Engineering (Mechanical/Civil/Electrical)
6.  Architecture                              ← split out 6 May 2026
7.  Biotechnology & Life Sciences
8.  Medicine & Public Health
9.  Law
10. Arts, Design & Architecture               ← legacy compound; ~340 programs
                                                 still tagged here (architecture +
                                                 design + fine arts mixed). New
                                                 "Architecture" entry above is the
                                                 user-facing pick; scoring's
                                                 RELATED_FIELDS pulls existing
                                                 tagged programs in until they're
                                                 re-classified.
11. Social Sciences & Humanities
12. Economics & Finance
13. Media & Communications
14. Environmental & Sustainability Studies
15. Natural Sciences
16. Nursing & Allied Health
17. Agriculture & Veterinary Sciences
18. Hospitality & Tourism
```

### 2.6 12 target countries (`TARGET_COUNTRIES`)

USA, UK, Australia, Canada, New Zealand, Ireland, Germany, France, UAE, Singapore, Malaysia, Netherlands.

**Switzerland was explicitly excluded by the user.** ETH Zurich was removed; `merge.ts` rejects out-of-scope countries.

---

## §3 Current platform state

| | Value |
|---|---:|
| Last commit on main | `fa8723a5` — NBA review pass (handoff #12.5, 11 May) |
| Programs in DB | **7,986** |
| Verified at source | **7,986 (100.0%)** — every entry carries a verified_at stamp after the 11 May strip (`46274d08`) |
| With international tuition | **4,327+ (54.2%+)** — climbing as the Canada estimate-fees retry runs (PID 19626). Of which ~1,551 estimated via secondary sources (`tuition_fee_source: "estimated"`) |
| Universities | **534** total |
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

### 3.1 Country breakdown (post handoff #12, 11 May 2026)

The "Estimated" column counts entries with `tuition_fee_source: "estimated"` (Layer 2 secondary-source backfill); the rest of the fee% is verified-at-source.

| Country | Programs | Fee% | Estimated | Δ since handoff #11 |
|---|---:|---:|---:|---|
| USA | 2,402 | **78.1%** | 1,410 | +46.2pp · estimate-fees priority run |
| UK | 1,886 | 60.5% | 9 | +69 programs (C1 +63, C2 +3, leftovers +3) |
| Canada | 857 | 29.7% | 0 | +72 (Expansion D) |
| Germany | 785 | **31.0%** | 89 | +11.3pp · +12 programs (mostly leftovers) |
| Australia | 649 | 41.1% | 0 | — |
| France | 434 | 35.9% | 0 | +16 leftovers from prior NL/FR/DE runs |
| Malaysia | 229 | 48.9% | 0 | +4 (Expansion B-Phase 1) |
| UAE | 185 | 48.6% | 0 | +12 (Expansion B-Phase 1) |
| Netherlands | 177 | 28.8% | 0 | — |
| New Zealand | 158 | 33.5% | 0 | — |
| Ireland | 133 | 30.3% | 0 | +1 (Expansion B-Phase 1) |
| Singapore | 92 | 59.3% | 0 | +1 (Expansion B-Phase 1) |
| **Total** | **7,987** | **54.3%** | **1,508** | **+187 programs, +15.1pp fee%** |

USA's 1,410 estimated fees came from the 11 May estimate-fees priority run (~9 hours, ~$0.04–0.06/entry). Germany's 89 came from the same chain (low pass-rate ~14% — DE public unis don't disclose international tuition on secondary sources cleanly). Canada was stopped mid-run on user instruction; ~$28 / ~3 hr retry queued in Tier-B.

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
5. **`field_of_study` must be one of the 18 in `FIELDS_OF_STUDY`.**

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
- `MONTHLY_UNIQUE_USER_CAP = 50` — max 50 distinct users per calendar month (excluding owner emails; dropped from 100 on 12 May 2026)
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
| `src/data/programs.ts` | THE database. **7,800 entries / 7,737 verified at source**. Has `// @ts-nocheck` directive (large data file). |
| `src/data/db-stats.ts` | Auto-computes counts from PROGRAMS. Don't edit; recomputed on load. Public surfaces standardise on `verifiedProgramsLabel` (7,737+) and `verifiedUniversitiesLabel` (511+). |
| `src/lib/types.ts` | Single source of truth for types. `TARGET_COUNTRIES` (12), `FIELDS_OF_STUDY` (18), `Program`, `StudentProfile`, `ScoredProgram`. |
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

## §21 Latest dataset shape (11 May 2026 — post Expansion-A + estimate-fees mid-run)

| | Count |
|---|---:|
| Programs total | **7,800** |
| Programs verified at source | **7,737** (99.2%) |
| Universities total | **521** |
| Universities with at least one verified program | **511** (98%) |
| Countries | 12 |
| Fields of study | 18 |
| Postgraduate share | 69.1% (5,387) |
| Undergraduate share | 28.8% (2,247) |
| **With international tuition** | **3,060 (39.2%)** |
| → of which estimated (secondary-source) | **309** |
| → of which verified at source | **2,751** |

`DB_STATS` exposes both totals AND verified counts, but **all public-facing surfaces now standardise on `verifiedProgramsLabel`** (commit `f2cf997b`). The dual-number inconsistency that surfaced earlier in this session (one section showing 4,485+, another 4,866+ from a stale cached deploy) is closed: there is one number on the homepage now, and it's the verified one.

- `DB_STATS.verifiedProgramsLabel` ("7,737+") — used everywhere user-visible.
- `DB_STATS.verifiedUniversitiesLabel` ("511+") — for the "Verified Global Universities" stat.
- `DB_STATS.programsLabel` ("7,800+") — internal-only; only `src/app/api/chat/route.ts` (the AISA system prompt) references it now, for accuracy when the AI answers "how many programs do you have?". **Don't reintroduce this in copy.**

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
   - Bottom: thin trust strip — `Independent · no university commission · 7,737+ programs · 511+ universities · 12 countries · Decision-support estimates`.
   - **Directly under hero**: parent strip in stone-50 with two cards:
     - For students: *"Find the right-fit course, improve your application, prepare for interviews."*
     - For parents: *"Compare cost, ROI, safety, visa readiness, and long-term value."*

2. **Proof strip**
   - 7,737+ verified programs · 511+ universities · 12 countries · No university commission · Official-source data.
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
| `/match` | ✅ 307 redirect → `/get-started` | Brand-locked alias only. `src/app/match/page.tsx` is a one-liner that calls `redirect("/get-started")`. Real flow is unchanged. |
| `/parent-report` | ✅ 307 redirect → `/parent-decision` | Brand-locked alias only. Same pattern — `src/app/parent-report/page.tsx` redirects to the existing tool surface. |
| `/destinations` | ✅ Created (5 May) | New dedicated page; pre-swap homepage section content extracted here. |
| `/scholarships` | ✅ Created (5 May) | New dedicated page; pulls from the `SCHOLARSHIPS` array (was at `_archive/page-pre-v2-swap.tsx.bak` lines 39+, content source preserved). |
| `/methodology` | ✅ Created (5 May) | New page documenting the verification pipeline + 9-signal scoring — added during the post-swap polish pass. |
| `/v2` | ✅ 404 (intentional) | Old prototype route un-routed after the swap; pre-swap content preserved at `src/app/_v2-archive/page.tsx` for reference (not exported as a route). |
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

---

## §26 Post-swap polish increment — 5 May 2026 (commits `3c4d4929` + `259639da`)

§24.4 captured the *brief* as locked. The polish pass and nav-restoration commits diverged from / extended that brief in concrete ways. What actually shipped on `/`:

### 26.1 Hero

| Change | What landed |
|---|---|
| Hero badge | New top badge: *"Independent · source-verified · AI-powered"* |
| Audience split | New "**One platform. Two audiences.**" headline introducing two larger student/parent cards with icons and per-card CTAs (student → `/get-started`, parent → `/sample-parent-report`). Replaces the §24.4 "parent strip" of two flat copy cards. |
| Hero RHS | Single auto-rotating sample-output card with **4 dot indicators**, "**SAMPLE OUTPUT N OF 4 · ILLUSTRATIVE**" eyebrow, 3-second instant swap. Replaces §24.4 "real sample-dashboard mockup". |
| "How we verify" link | New inline link from hero / proof strip → `/methodology`. |

### 26.2 CTA copy

`Generate the report` / `Generate the family report` → **`Create a parent-ready decision report`** (2 instances replaced). When updating CTAs in deep pages, match this string.

### 26.3 Stage cards (Five-stage journey)

Per-card pattern locked at: stage name → user situation (e.g., *"No idea where to apply?"*) → benefit → sample → **1 primary CTA + "Why this is reliable" disclosure** (no secondary CTA). Stage 01 keeps a subordinate "*or Evaluate my Profile →*" link below the primary CTA.

This replaces the §24.3 "5-line card pattern" — disclosures are an addition; secondary CTAs were dropped.

### 26.4 Destination cards

New structure not in §24.4: **image header + 4 decision signals** (COST / POST-STUDY WORK / VISA COMPLEXITY, semantic colours emerald/amber/rose) + **"Best for"** line summarising fit.

Example: USA → COST=High (rose), POST-STUDY WORK=Strong (emerald), VISA COMPLEXITY=Medium (amber), Best for = *"AI · CS · Finance · Engineering"*.

### 26.5 "Why trust EduvianAI" — Independent principle copy

Replaced with: *"No university commissions. No marketing deals. Recommendations are based on your profile, goals, budget…"* (carry the verbatim phrasing if extending across deep pages).

### 26.6 Nav + footer

- **"How it works"** button in both top nav and footer → opens `HowItWorksModal` (`src/components/HowItWorksModal.tsx`).
- **"Principles" → "Why choose us"** rename in both top nav and footer.
- **Discreet admin link** added to footer pointing to `/admin`.
- **Back-to-home pill** in nav of `/destinations`, `/scholarships`, `/methodology`.

### 26.7 AuthGate

`AuthGate` (`src/components/AuthGate.tsx`) login-screen Back-to-home moved from bottom-center → **top-right**.

### 26.8 What this means for the open work

Open work item #1 (port v2 brand to the 7 deep tool pages) must mirror **§26 patterns**, not just §24.4. Specifically: stage-card disclosure pattern, destination-card 4-signal pattern, locked CTA copy, "How it works" modal accessibility, and AuthGate top-right back link. The HowItWorksModal already exists and can be reused on tool pages where appropriate.

### 26.9 Swap audit summary (post-deploy verification)

| Route status | Count |
|---|---:|
| 200 OK | 19 (public tool pages + `/admin` + `/profile` + `/sample-parent-report`) |
| 307 redirect | 3 — `/match → /get-started`, `/parent-report → /parent-decision`, `/lor-coach` (pre-existing auth gate, untouched) |
| 404 (intentional) | 1 — `/v2` |

**Internal-link coverage:** every route the pre-swap homepage linked to remains reachable from the new homepage (mapped via Hero CTAs, the 5 stage cards, For-families section, and Final CTA). `/admin` is reachable directly + via the new footer admin link.

**Cross-codebase integrity (verified):** zero files outside `src/app/_v2-archive/` reference `src/app/v2/...`; zero stray `/v2#` anchors, prototype badges, or "Original →" links anywhere. tsc + next build clean.

**Untouched by the swap:** all 22 API routes, `/admin/*` sub-routes, auth flow, profile editor, `/results/[token]`, `/lor-coach` + token route, the verification pipeline (`scripts/verify/*`), DB schema, every shared component (ChatWidget, CountryModal, ROICalculator, ParentDecisionTool, LogoutButton, EduvianLogo, AuthGate, DecisionDisclaimer, HowItWorksModal, multi-step form Steps).

---

## §27 Session log — 5 May 2026 night (handoff #7)

This session shipped 9 commits. Three workstreams: H7 Phase C close-out, partial brand port, and a 4-iteration interview-prep voice fix that the user did not get to verify before ending the day.

### 27.1 H7 Phase C close-out (3 commits)

| Commit | What |
|---|---|
| `dace04fa` | Close-out: schema check confirmed `profile` column already absent (dropped in prior crashed session). Coverage check found 2 zombie rows (`profile_encrypted=NULL` AND `email_hash=NULL`, both 5 May, unservable) — user deleted via Studio. **Writer patched (option 2B):** `/api/submit` now skips the Supabase insert entirely when `pii_profile_encrypted` or `pii_email_hash` is null, regardless of NODE_ENV. The original gate had a `process.env.NODE_ENV === "production"` check that let dev/preview environments connected to prod Supabase via the shared service-role key insert null-encrypted rows. Closes the leak. |
| `18c47658` | Sentry `8bfc0387` fix: `/api/results/[token]` was passing `submission.profile` (undefined when decryption fails) to `recommendPrograms()`, which crashed reading `qs_ranking_preference`. Now returns 410 Gone when `decryptProfile()` returns null. Stale "fall back to plaintext" comment also removed. |
| `d01ac551` + `335573af` | Docs: §26 captures post-swap polish + nav-restoration deltas (badge / audience-split cards / rotating RHS / stage disclosures / destination 4-signals / "How it works" modal / "Why choose us" rename / footer admin link / back-to-home pills / AuthGate top-right). §24.5 corrected (/match + /parent-report are 307 alias redirects, not new pages). §26.9 added: post-swap audit summary (19×200, 3×307, 1×404 intentional). |

**Lesson captured (CLAUDE.md):** any future API route that writes encrypted PII should guard the `.insert()` on the encrypted-fields-present invariant, not on `NODE_ENV`. The shared service-role key means dev and prod hit the same DB, so prod-only guards leak.

### 27.2 Brand port (2 commits, 3 of 7 pages)

| Commit | What |
|---|---|
| `0c24dc4c` | Created `src/components/BrandNav.tsx` + `src/components/BrandHero.tsx` (extracted from `/destinations` + `/methodology` patterns). Ported the three thin-wrapper pages to use them: `/roi-calculator`, `/parent-decision`, `/visa-coach`. Each gets a brand-locked dark hero with eyebrow + italic-violet-300 accent + trust strip, replacing the legacy `bg-gradient slate→indigo` nav. Visa Coach also dropped its forbidden indigo→violet→pink gradient headline. |
| `cbf6c3d8` | Per user feedback ("ROI section below hero should be in white", "Parent left card needs to be darker for readability"): full dark→light retheme of `ROICalculator` (was `bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950` with white text + glass cards; now `bg-white` with `bg-stone-50` nested cards, gray-900 text, indigo→violet recolor). Decorative violet-100 blur blobs removed (mobile rule). `text-white` preserved on `bg-violet-600` / `bg-sky-600` buttons. ParentDecisionTool: dropped the in-tool header (page wrapper now provides BrandHero), section bg → `bg-stone-50`, left input card → `border-stone-300 + shadow-md` for contrast. |

**User decision (post-feedback):** the remaining 4 pages (`/get-started`, `/application-check`, `/interview-prep`, `/english-test-lab`) **need no change**. Item closed at 3-of-7. New `BrandNav` + `BrandHero` primitives remain available if a future change is wanted.

### 27.3 Interview-prep voice cascade (4 commits, USER NOT YET VERIFIED)

User reported "the tool is not catching the user voice" → became multi-layer debug.

| Commit | Layer | What |
|---|---|---|
| `19c230c8` | Diagnostics | `recog.onerror` was reduced to `clearSilence()` with no logging or UI signal. `recog.start()` was outside any try/catch. Now both fire `console.warn("[interview-prep] STT error: <code>")` (ignoring benign `no-speech` / `aborted`), set `sttError` state, and listening UI shows a code-keyed message ("Microphone permission was denied…") with the textarea fallback so the user can still answer. Also added `SpeechRecognitionErrorEventShim` interface. |
| `f168123e` | **ROOT CAUSE** | `next.config.mjs` had `Permissions-Policy: …microphone=()…` — empty parens deny the feature on the page's own origin. Browser correctly refused SR before any JS could run. Changed `microphone=()` → `microphone=(self)`. Geolocation, camera, payment stay locked. |
| `2adbaa9f` | Permission UX | Even after policy fix, no mic prompt appeared on Chrome (likely because Chrome had cached the prior denial). Both `startListening` and `listenOnce` now `await navigator.mediaDevices.getUserMedia({ audio: true })` first to surface a clean prompt; on grant, throwaway stream is closed and `recog.start()` runs. Routes `NotAllowedError` / `NotFoundError` into `sttError`. Functions are now async; useEffect call site fires-and-forgets the Promise. |
| `710d57a5` | TTS race | User confirmed via console (`speechSynthesis.speak(new SpeechSynthesisUtterance("hello"))` audible) that the bug was in our wrapper, not the browser. Chrome's synth engine puts itself in a "cancelling" state when `cancel()` is followed too quickly by `speak()`. Gated `cancel()` on `.speaking || .pending`, added 80ms delay before queue, added `utter.onerror` handler that advances the chain so the phase transition is never stranded, `resume()` before each speak (no-op when not paused), hardened voice-loading fallback. |
| `e3b719c5` | TTS race v2 | After 710d57a5 deployed, user still saw `[interview-prep] TTS utter.onerror: interrupted` on the very first greeting utterance. Removed the unconditional `cancel()` from the top of `speakSegments` entirely (its purpose was clearing stale queues that don't exist at greeting/question/feedback entry points). Added one-shot retry on `interrupted` / `canceled` codes (rewinds segment index, 250ms delay). Other error codes still advance. |

**Where this stands:** `e3b719c5` is live (chunk hash flipped from `page-80f14e2…` → `page-b8021e8f…`). User ended the session before testing it.

**If still broken when next session starts:** console will surface the exact code via the diagnostic logging from `19c230c8`. Do NOT add more TTS/STT layers without seeing the new error code first — the bug-fix layers are already deep.

### 27.4 What ended pending

1. **Interview-prep voice end-to-end test** on `e3b719c5`. If it works: the cascade closes. If not: read the console code and target it.
2. **63 unverified entries cleanup** — recipe in §20.2 untouched.
3. **DB password rotation** — user pasted the live password (`Uyb93H0r9di9N3ib`) in chat during the H7 backup walkthrough. Studio → Project Settings → Database → Reset database password. Resetting will not break Vercel (which uses service-role JWT, not DB password).
4. Marketing email opt-in, in-body unsubscribe link, sample-parent-report PDF (all unchanged from §20).

**Total commits this session:** 9.
**Estimated session API spend:** ~$5 (no verify-batch runs).

---

### 27.5 Architecture stream split (6 May 2026 morning, 2 commits)

User asked: "Architecture should be shown as a separate stream" → then "add more programs in Architecture from Top 250 QS ranked Universities" → after Phase 1 results, "close out as of now" (Phase 2 deferred).

| Commit | What |
|---|---|
| `5a4fff7f` | Added "Architecture" to `FIELDS_OF_STUDY` (between Engineering and Biotechnology) — 17 → 18 entries. Legacy compound `"Arts, Design & Architecture"` left intact so the ~340 programs already tagged with it don't fall out of scoring. `RELATED_FIELDS` in `scoring.ts` gets a new `"Architecture"` key whose related-set is `["Arts, Design & Architecture", "Engineering (Mechanical/Civil/Electrical)"]` so a student selecting the new stream still matches existing tagged programs until they're re-classified. The compound entry's own related-set adds `"Architecture"` so legacy-tagged programs surface for the new stream. CLAUDE.md count + key-paths count updated to 18. STATE_SNAPSHOT.md §2.5 list expanded with annotations. |
| `ae0f6d6f` | Phase 1 — `scripts/verify/retag-architecture.ts` (parse-and-emit per CLAUDE.md hard rule #5; brace walker that tracks strings, no inline regex) flipped `field_of_study` to `"Architecture"` for entries where `program_name` OR `specialization` matched `/[Aa]rchitect/` AND the existing tag was the legacy compound. Result: 171 programs re-tagged. Counts: Architecture = 171, legacy compound = 169 (was 340), total = 5,595 (unchanged), verified = 5,532 (unchanged — `verified_at` not touched, only the classifier string moved). |

**Phase 2 — DEFERRED by user 6 May, revisited 8 May after the PG sweep added 51 architecture entries.** Current Architecture-tagged count: 274 (was 0 → 171 after Phase 1 retag → 274 after the 7-8 May UG + PG sweeps that included Architecture as one of their target fields). Plan if/when revived: curate QS Top-250 unis not yet represented in Architecture, use `websearch-seed-finder.ts` (Sonnet + web_search) with a single-field focus or post-filter, then `verify-program.ts` (Opus 4.7) on the seeds, then `merge.ts`. Estimated cost ~$10-25, time ~30-60 min.

---

## §28 Session log — 6-8 May 2026 (Architecture stream + UG + PG sweeps over QS Top-500)

Three-day window across handoffs #8 + #9. Five workstreams shipped 9 commits and added **1,395 verified programs** to the database.

### 28.1 Architecture stream split (6 May, 2 commits)

Covered in §27.5. `5a4fff7f` added `"Architecture"` to `FIELDS_OF_STUDY` (17 → 18), wired scoring's `RELATED_FIELDS` to cross-link with the legacy compound. `ae0f6d6f` Phase-1 retag re-classified 171 programs from `"Arts, Design & Architecture"` → `"Architecture"` via the parse-and-emit pattern.

### 28.2 Interview-prep voice cascade closure (7 May, 1 commit)

After 4 iterations the previous session left the voice feature partially working but flaky ("takes multiple attempts before audio is recognised"). `53ba42cb` cached the first mic-permission grant for the session (so subsequent recog.start() calls don't have to grab and immediately release the mic), added a `startingRef` guard so concurrent `startListening` / `listenOnce` calls coalesce instead of aborting each other, and waits 120ms for any prior recog to release before starting a new one. User confirmed first-attempt capture working.

### 28.3 UG STEM/Biz pilot (7 May, 1 commit)

`d24bd508` — pilot run over the 30 highest-ranked in-scope QS Top-500 unis missing UG STEM/Biz coverage. Pipeline: `ug-stem-biz-seed-finder.ts` (new — UG-focused variant with the 9 STEM + Business/Commerce/Economics fields) → 207 seeds → `verify-batch.ts` at concurrency 5 → 170/207 verified (82% pass-rate) → `merge.ts` inserted 172. Programs: 5,595 → 5,767 (+172). UG share: 20.6% → 22.8%.

### 28.4 UG STEM/Biz Phase B (7-8 May, 1 commit)

`51ffb668` — full sweep over the remaining 119 in-scope unis (QS rank ~60-500). Pipeline: 893 seeds → first verify attempt was killed by a ~1-hour network drop (cliff-to-100%-errors pattern matched perfectly) → second attempt with `--skip-existing`: 767/852 verified (90% pass-rate) → merge inserted 795. Programs: 5,767 → 6,562 (+795). UG share: 22.8% → 32.0%.

**Lesson:** verify-batch passes `stdio: ["ignore", "ignore", "ignore"]` to spawned children — child stderr is silently discarded. When the batch starts producing 100% errors, that's the symptom of either the parent losing connectivity OR the children losing the ANTHROPIC_API_KEY env var. Both happened to me on this run.

### 28.5 PG sweep across 11 fields (8 May, 1 commit)

`86478401` — full sweep over 217 in-scope QS Top-500 unis with PG gaps. New `pg-fields-seed-finder.ts` accepts a per-uni `missing_fields` list and only asks Sonnet for those — saves ~50% of web_search budget vs. the original 18-field finder. For Business & Management, the prompt explicitly asks for an additional Sports Management master's URL when the uni offers one (per user direction: bucket sports management under Business & Management, no new field). Output: 638 seeds → 436/574 fresh verified (76%) → merge inserted 428.

Programs: 6,562 → 6,990 (+428). PG: 4,308 → 4,727 (+419). Architecture-tagged: 222 → 274 (+52, since Architecture was one of the 11 target fields).

### 28.6 Combined impact (5-8 May)

| | Before (5 May) | Now (8 May) | Δ |
|---|---:|---:|---:|
| Programs total | 5,595 | **6,990** | +1,395 |
| Verified at source | 5,532 | **6,927** | +1,395 |
| UG | 1,150 | **2,103** | +953 |
| PG | 4,297 | **4,727** | +430 |
| UG share | 20.6% | **30.1%** | +9.5pp |
| Universities (total / verified) | 506 / 485 | **521 / 503** | +15 / +18 |
| Architecture-tagged | 0 → 171 | **274** | — |

### 28.7 New seed-finder variants

Both kept in `scripts/verify/`. Reusable:

- **`ug-stem-biz-seed-finder.ts`** — UG-only, hardcoded 9-field set (STEM + Business/Commerce/Economics). Use for UG gap-filling on a uni catalog.
- **`pg-fields-seed-finder.ts`** — PG-only, takes `missing_fields` per uni. Use for surgical PG gap-filling once a gap-analysis script has identified which (uni, field) pairs need adding. Sports-management hint baked in.

For other workstreams that don't fit either, the original `websearch-seed-finder.ts` still works as the catch-all.

### 28.8 What this didn't fix

- The 63 unverified entries from older runs still need cleanup (count is likely smaller now since some got re-verified through the new sweeps; re-run audit to confirm).
- Phase 2 Architecture still pending — user said "go ahead" 8 May, will run next.
- Doc inconsistency: `merge.ts` still has Netherlands in its TARGET_COUNTRIES allowlist; types.ts has 11 countries (no Netherlands). 140 Netherlands programs are in the DB. Real fix is a follow-up task.

**Estimated cumulative API spend across 28.3 + 28.4 + 28.5:** ~$200-280.

---

## §29 Session log — 8-10 May 2026 (fee-completeness fix + 2,000-program backfill)

### 29.1 The bug user surfaced (8 May)

User reported that programs showed "Verified fee not available" even when the official page (e.g., QUB Computer Science, QMUL Applied AI) clearly stated overseas tuition. Country-wise coverage check confirmed it was systemic — not UK-only:

| Country | Pre-fix Fee% |
|---|---:|
| USA | 9.5% |
| UK | 2.4% |
| Netherlands | 0.0% |
| Most other countries | 1.6 – 7.3% |

Root cause: extractor prompt asked for `annual_tuition_usd` and specified "convert from local currency at the rate stated on page; if no rate, null." University pages virtually never publish their own USD conversion rate, so the extractor returned null for every non-US currency. The "no invented values" rule was treating an FX conversion as invention.

### 29.2 Three-part fix

| Commit | What |
|---|---|
| `06d1f28f` | Extractor schema now asks for `annual_tuition_amount` (page's own currency) + `annual_tuition_currency` (3-letter ISO), with a static `FX_TO_USD` table converting at write time. Same pair for living cost. Prompt explicitly requires INTERNATIONAL / OVERSEAS / NON-RESIDENT student fees only — never domestic / home / EU / in-state. UK = "Overseas" not "Home"; USA = "Out-of-state" not "In-state"; CA/AU/NZ = "International" not "Domestic"; EU unis = "Non-EU" if separate. Schema kept the legacy `annual_tuition_usd` for filtering / aggregation. `format-fee.ts` reworked to prefer local-currency display ("£26,600") with optional USD parenthetical via `formatFee(input, { withUsd: true })`. |
| `3b6dec06` | Tab-click + linked-fees-page fetcher in `verify-program.ts`. Many course pages (Melbourne, Manchester) hide tuition behind a "Fees" tab loaded via JS; others (Toronto, UBC) put it on a separate `/fees/` subpage. New fetcher: scan for fee-labelled `<a>`, `<button>`, `[role=tab]` elements + click; scan same-domain links matching `/fees/, /tuition/, /funding/`; cap at 1 subpage with 5s timeout. Output capped at 80K chars. Tightened prompt: "Indicative" / "approximate" / "from" labels are valid, just published-not-contractual. Also added `playwright-extra` + stealth plugin (mask `navigator.webdriver` + chrome runtime presence) so Cloudflare-protected pages serve real content; added bot-fingerprint headers. |
| `3c7229a3` | New `scripts/verify/backfill-fees.ts` — fee-only re-extraction for the ~7,000 existing entries with null tuition. Uses the same tab-click/subpage fetcher; smaller fee-only Opus prompt (~70% fewer tokens than full verify). Static FX table mirrors `verify-program.ts`. Parse-and-emit per CLAUDE.md hard rule #5: brace walker that tracks strings, rewrites only the fee fields inline (`verified_at` untouched). Persists `programs.ts` every 20 successes for crash safety. |

### 29.3 Backfill operations log

5 production runs over 9-10 May with progressive script hardening:

| Run | Concurrency | Recoveries | Outcome |
|---:|---:|---:|---|
| 1 | 5 | 85 | Stalled — newContext-per-call leaked 149 chromium subprocs |
| 2 | 12 | 136 | Crashed at 1,010/7,160 — context-recycling race |
| 3 | 10 | 715 | Crashed at 4,049/6,886 — cdpSession-target-closed |
| 4 | 8 | 715 | Crashed at 4,545/5,633 — same |
| 5 | 6 | 11 | Killed at 1,300/4,918 (1% recovery rate; truly-unrecoverable residuals) |

Final hardening that worked: shared BrowserContext (no per-call leak) + liveness probe + force-recreate on next call + `process.on("unhandledRejection")` swallow guard + 45s hard ceiling per fetchPage. Running concurrency is bounded around 6-10 because Playwright contention dominates above that.

### 29.4 Expansion plan (queued for handoff #11)

Per user direction 8 May, four sweeps to cover the gaps from §3.1:

| # | Sweep | Catalog | Cost | Time |
|---:|---|---|---|---|
| A | NL/FR/DE UG Bachelor's | `scripts/verify/catalogs/nl-fr-de-ug-target.json` (56 unis, 365 (uni,field) UG pairs) | ~$13-19 | ~30-45 min |
| B | SG / UAE / MY / IE depth at existing-in-DB unis | TBD — build catalog of unis with <10 PG entries each | ~$38-62 | ~1-2 hrs |
| C | UK UG breadth — add new lower-ranked unis (post-92, art schools, conservatoires) | TBD — curate UK QS 250-1000 unis NOT yet in DB | ~$30-48 | ~1-2 hrs |
| D | Canada west/east — add new unis (BC, Alberta, Maritime, Quebec) | TBD — curate Canadian unis NOT yet in DB | ~$18-30 | ~30-60 min |
| **All 4** | | | **~$130-235** | **~6-10 hrs** |

A is in flight as of 10 May (seed-finder over the 56-uni NL/FR/DE catalog). B/C/D queued.

### 29.5 Final fee coverage table (10 May)

| Country | Before fee fix | After backfill | Δ |
|---|---:|---:|---:|
| UK | 2.4% | **60.0%** | +57.6pp |
| Singapore | 3.4% | **59.3%** | +55.9pp |
| Malaysia | 7.3% | **48.9%** | +41.6pp |
| UAE | 3.7% | **48.6%** | +44.9pp |
| Australia | 3.7% | **41.1%** | +37.4pp |
| France | 1.8% | **37.3%** | +35.5pp |
| New Zealand | 2.7% | **33.5%** | +30.8pp |
| Netherlands | 0.0% | **30.7%** | +30.7pp |
| Ireland | 3.5% | **30.3%** | +26.8pp |
| Canada | 6.5% | **29.7%** | +23.2pp |
| Germany | 6.2% | **20.7%** | +14.5pp |
| USA | 9.5% | **19.4%** | +9.9pp |
| **Overall** | **~10%** | **35.6%** | **+25pp** |

USA caps at 19% because most US fee panels are JS-only ("Cost & Financial Aid" tabs that load from auth-gated APIs). Pushing higher requires either a residential proxy ($50/mo) or a per-uni manual override layer (~1 day's mapping for the top 30 schools). Captured in CLAUDE.md "Open work" item #2.

### 29.6 New tuition-fee policy (locked in CLAUDE.md)

Documented in CLAUDE.md "Tuition fee policy" section. Key points: international/overseas student fee only (never domestic), local currency primary display, USD via static FX table for filtering/aggregation, "indicative" / "approximate" / "from" labels acceptable.

**Estimated API spend for 29.2 + 29.3:** ~$250-350 (mostly the 5 backfill runs).

---

## §30 Session log — 10-11 May 2026 (handoff #11)

Six commits over two days. Three workstreams: Expansion A (NL/FR/DE UG), Estimated-fee Layer 2/3, voice flow improvements + Stop-interview button.

### 30.1 Expansion A merged (10 May → 11 May, `32721df7`)

NL/FR/DE UG sweep over the 56 in-scope QS Top-500 unis with UG STEM/Biz gaps. 309 seed URLs from `ug-stem-biz-seed-finder.ts`; verify-batch hung on the last 9 of 199 fresh URLs (chromium contention, killed cleanly). 156 verified, 151 inserted (after dedup). UG totals: Germany 219 (+64), France 77 (+42), Netherlands 43 (+37). Per-country sweep code in `scripts/verify/catalogs/nl-fr-de-ug-target.json` and seeds in `scripts/verify/seeds/nl-fr-de-ug.json`.

### 30.2 Estimated-fee Layer 2 + Layer 3 (11 May, `279279c9`)

Closes the gap left by `3c7229a3` — the verified-at-source backfill recovered fees for ~36% of programs but the remaining ~64% had to either get fees from secondary sources or be marked as "no calc possible".

Schema (types.ts): `Program.tuition_fee_source?: "verified" | "estimated"`. Undefined / "verified" = official program page (default). "estimated" = inferred from a credible secondary source.

`scripts/verify/estimate-fees.ts`: per null-tuition entry, calls Sonnet 4.6 with `web_search` (max 5 uses) asking for INTERNATIONAL student tuition from credible sources in priority order — uni's central fees page → department fees page → QS / Times Higher Ed / US News → ministry pages → reputable portals as last resort. Reddit/Quora/blogs forbidden. At least 2 sources must agree OR a single highly-credible source must state it. Confidence "high" or "medium" required to write. Writes `tuition_fee_source: "estimated"` flag. Same FX_TO_USD table as `verify-program.ts` and `backfill-fees.ts`. Resume-friendly: skips entries already flagged "estimated".

UI (commits earlier in this session log):
- **Layer 1** — `d07d3201`: ROI Calculator + Parent Decision Tool refuse to compute when `annual_tuition_usd` is null. Render an amber "Cannot calculate — tuition fee data not available" panel with link to the official program page.
- **Provenance pill** — `350a862a`: Verified (emerald) / Estimated (amber) / Not available (rose) badge on ProgramCard + ComparePanel "Fee provenance" row. `format-fee.ts` exports `getFeeStatus`, `FEE_STATUS_LABEL`, `FEE_STATUS_CLASS`.
- **Layer 3 caveat banner** — `279279c9`: When ROI/Parent calc uses a fee with `tuition_fee_source === "estimated"`, an amber banner above the result reads "Based on estimated tuition fee. The official program page didn't publish a fee, so this calculation uses a figure inferred from the university's central fees page or a credible secondary source. Confirm with the university before relying on these numbers."

UK pilot (30 entries) returned 9 estimates (1 high, 8 medium confidence; 20 skipped low/none, 1 error) — 30% recovery rate. Full priority run (USA → Germany → Canada, ~3,108 entries) launched ~14:50 11 May, kicked off at concurrency 4. **Mid-session snapshot:** USA done with 300 estimated entries → USA fee coverage jumped 19.4% → 31.9%. Germany + Canada not yet processed at time of snapshot; expect run to finish by ~22:00 same day.

### 30.3 Voice flow — auto-listen + short-utterance fix (11 May, `91f9a54d` + `69a0c428`)

User reports across 11 May testing: "still does not catch the name and one has to try 3-4 times"; "even when it asks to say 'YES' to begin UK interview, one has to say Yes 3-4 times"; "auto activation of the mic still takes a bit of time"; "Australia interview tool the same problem regarding catching the user Name; then it does not immediately catch which section the user wants to practice".

Three layered fixes (`91f9a54d`):

1. **Auto-listen on TTS end.** Greeting / "say YES" prompts now hand off to the listen helper as soon as the last segment ends — no mic-button click needed. Forward-refs (`autoListenNameRef`, `autoListenYesRef`) populated via useEffect after `tryListenName` / `tryListenForYes` exist. Buttons remain as fallback.
2. **`speakSegments` fires onEnd immediately after last segment.** The 650ms inter-segment "breath" was applied even after the final segment, adding 650ms of dead air before auto-listen could start. Pause stays for between-segments only.
3. **Short-utterance capture in `listenOnce`.** `interimResults` stays TRUE in nameMode (was false). With Chrome + `continuous=false`, short utterances like "Piyush" sometimes never fire `final`, or fire final with empty transcript. Without interim, the 6s safety timer fired with empty `lastInterim` and sent the user into a 3-4-try loop. Stable-interim window shortened to 700ms in nameMode (was 1200ms) since names are short. Empty-final fallback to `lastInterim`. `nameRecogRef` nulled on `onend` so subsequent calls don't try to abort a dead instance ("aborted" console noise).

`69a0c428`: same pattern extended to AU category prompt — `tryListenForCategory` lifted to a parent-level useCallback, auto-listens after "Which one shall we start with?" finishes. USA section picker deliberately doesn't auto-listen (its prompt doesn't enumerate sections by number, so voice-only selection would be ambiguous).

### 30.4 Stop interview button + mic pre-warm (11 May, `2fde5498`)

Two requests user surfaced toward end of session:

**Stop interview button.** Rose-tinted ghost button with X icon, visible during `speaking | listening | review | feedback` phases for all three countries. `handleStopInterview` shows confirm dialog with "X of Y answered, Z remaining"; on accept, cancels TTS, aborts active recogs, jumps to `phase === "complete"`. Existing complete screen handles partial answers (renders X/Y count, groups by category).

**Mic pre-warm.** New useEffect on InterviewSession mount fires `getUserMedia({ audio: true })` immediately after country select. Holds the stream open for 200ms to fully warm the audio device, then releases. By the time the greeting ends (~5-8s) and auto-listen fires, permission grant is cached and mic device is warm — first `listenOnce()` skips both the permission prompt AND the 150ms post-grant settle, saving ~300-500ms on first recognition. Idempotent (`micPermissionGrantedRef` guard); cleanup stops the stream if pre-warm hadn't completed.

User reported toward end of session that name+YES still took multiple attempts during testing. Resolution unclear — may be that the user tested before all three voice commits had deployed to Vercel, may be a residual bug. Re-verification on a clean Vercel deploy is the first thing the next session should do.

### 30.5 Combined impact (since handoff #10)

| | After #10 (10 May) | Now (11 May) | Δ |
|---|---:|---:|---:|
| Programs total | 7,642 | **7,800** | +158 |
| Verified | 7,579 | **7,737** | +158 |
| With tuition | 2,724 (35.6%) | **3,060 (39.2%)** | +336 (+3.6pp) |
| → estimated (Layer 2) | 0 | **309** | +309 |
| Architecture | 274 | 274 (unchanged) | — |
| UG share | 27.5% | 28.8% | +1.3pp |

### 30.6 Background process running on session start

`scripts/verify/estimate-fees.ts --country USA --concurrency 4` (PID 83743 at snapshot time). Wrapper script chains USA → Germany → Canada. Log: `/tmp/estimate-priority.log`. **First action for next session: check whether it's still running**, decide whether to wait, monitor, or kill based on log progress.

### 30.7 Open items the user testing surfaced (not yet fixed)

1. **UK name capture: 2 attempts.** User report 11 May during testing of `91f9a54d`. May resolve once `2fde5498` (mic pre-warm) reaches Vercel. Re-test required.
2. **UK "say YES": multiple attempts.** Same as above.
3. **AU category select: doesn't immediately catch which section.** `69a0c428` adds auto-listen for this; same Vercel-deploy timing question.

If still failing post-deploy: the next move is to read DevTools Console for `[interview-prep]` lines — the diagnostic logging from `19c230c8` is still in. Don't add more layers without seeing the new error code first.

**Estimated API spend in 30.2 (priority estimate-fees so far):** ~$30-50 of ~$300-450 total when run completes.

---

## §31 Session log — 11 May 2026 (handoff #12)

The session that produced this snapshot version. 21 commits on `main`. DB 7,800 → 7,987 (+187), fee% 39.2% → 54.3%.

### 31.1 estimate-fees priority run — landed USA + Germany, stopped Canada

Continued the chain that was running at session start. Throughput degraded from initial 8.5/min to ~2.6/min (Anthropic rate-limit cumulating). On user instruction, stopped mid-Canada at entry 138/552 — **19 successful Canada estimates were lost** because they were below the script's 20-flush threshold and no SIGTERM handler existed. USA + Germany landings (1,499 estimates total) committed as `6ac022be`.

Hardening shipped immediately (`a42b83f4`): module-level `flushOnExit` callback wired inside `main()` once `entries` is loaded; SIGTERM + SIGINT handlers call it before `process.exit(143|130)`. Save threshold dropped from 20 → 5. Worst-case loss now ~4 in-flight + ~4 queued instead of 19.

### 31.2 Block 2 D / B / C — DB breadth sweep

Three parallel-conceptual expansions, run serially in this session.

**Expansion D — Canada west/east (`d59732ec`):** 15 regional Canadian universities not previously in DB. websearch-seed-finder returned 159 raw seeds across 13 of 15 unis (Brandon + Ontario Tech hit JSON parse errors → 0 seeds, user-descoped). Filtered to user's 10 chosen fields (CS, AI/DS, Business, MBA, Engineering, Biotech/Life Sci, Med/Public Health, Soc Sci, Nat Sci, Nursing) → 102 seeds. verify-batch (Opus, concurrency 5): 74 ok / 8 rejected / 20 err. Errors clustered on laurentian.ca (5 workers stalled ~28 min on unresponsive site; user-authorised SIGTERM to unblock the supervisor). Net +72 Canada.

**Expansion B-Phase 1 — SG/UAE/MY/IE depth (`47d39bd7`):** Targeted 55 existing unis with at least one missing field from the 10-field scope. seed-finder rate-limited badly mid-run — 30/55 unis processed (293 raw seeds) before user authorised partial-commit. Filter (10 fields ∩ uni's missing fields) → 35 seeds; 8 already-verified deduped → 27 to verify. 20 ok / 2 rejected / 5 err (5 = sunway.edu.my stall, user-authorised SIGTERM). Net +18 (UAE 12, MY 4, SG 1, IE 1). **B-Phase 2 (~25 remaining unis) queued in Tier-B.**

**Expansion C — UK breadth (`1b081ce6` + `712aaaed`):**
- C1 (new UK unis): 15 institutions not previously in DB (Northumbria, UAL, Queen Margaret, Abertay, Suffolk, West London, Open University, Royal Vet, St George's, St Mary's Twickenham, York St John, Bedfordshire, Leeds Trinity, Arts Univ Bournemouth, Norwich UA). 146 raw seeds → 94 filtered. 64 ok / 16 rejected / 14 err (68% pass-rate). 11 of 15 unis landed at least one program; 4 (Northumbria, Norwich UA, Open U, Bedfordshire) returned 0 — user-descoped the retry.
- C2 (UG-deepening at 14 PG-heavy existing UK unis): 180 raw seeds; URL-keyword UG filter (`/undergraduate`, `/bachelor`, `/bsc-`, etc., excluding `/msc/`, `/pg/`, `/phd`) caught only 11 of 112 in-scope seeds — seed-finder defaults to flagship PG pages. 6 ok / 0 rej / 1 err; 3 deduped at merge → +3 net UK UG.

Net Block 2: **+93 programs** (D 72 + B 18 + C 66 with leftovers).

### 31.3 Tier 1/2/3 value-strengthening sweep

User-driven 7-item list to make the website's value stronger. Triaged into three tiers; first cuts of all three landed.

**Tier 1 (`368e05c7`) — credibility-critical:**
- Fixed the Sample Parent Report cost inconsistency (single "Budget fit: Good" row hiding ₹42L tuition vs ₹65.6L total contradiction). Split into "Tuition budget fit" (Good) + "Total investment fit" (Needs discussion). Family verdict updated to "Worth discussing".
- New `<NextBestAction />` shared component (high-contrast dark-violet gradient with glowing icon block, animated arrow, soft fuchsia accent line — designed to read as decision-grade, not just a button). Dropped into ShortlistSummary, VisaCoach, ROICalculator, ParentDecisionTool, sample-parent-report.
- AISA chat trust frame banner inside the chat window above messages; refreshed suggested-prompt set (Find programs under ₹40L · Compare UK vs Germany for AI · Visa docs · Scholarships).

**Tier 2 (`8c3c86b6`) — transparency:**
- New `<DataBadge kind=... />`: 5 provenance types (official emerald · ai_estimate violet · user_provided indigo · needs_verification amber · illustrative gray), each with icon + tooltip. Scoped to decision-driving values only per the agreed caveat.
- New `<SourceProof lines lastVerified sourceUrl />`: emerald-tinted footer with field-by-source mapping. Pure-UTC date format (`getUTCDate/Month/FullYear`) to avoid an SSR hydration mismatch the first draft hit (`toLocaleDateString` resolves differently on server vs client).
- Dropped both into ROI / Parent / Visa Coach / Sample Parent Report.

**Tier 3 (`a02d740d` + `b8af4373`) — decision lens & family handoff:**
- `<TradeoffView />`: 6-factor lens (Admission · Cost · ROI · Visa complexity · Safety · Scholarship possibility) with verdict pills + optional "Compare with..." chip row. Pre-computed factors pattern — call sites supply data, component doesn't compute.
- `<ShareWithFamily />`: Print/PDF · Email (mailto: with pre-filled subject + body) · Parent-friendly view (configurable target). South Asia behaviour bridge.
- **New `/options?lens=safer|cheaper|roi|visa-low|scholarship` route** with cross-program ranker driving the "Compare with..." chips. Five lenses each with their own scoring rule:
  - `safer` — QS placement (NULL / 200+ first)
  - `cheaper` — annual_tuition_usd ASC (excludes null)
  - `roi` — country-median salary ÷ (tuition + living × years), DESC
  - `visa-low` — visa complexity composite ASC
  - `scholarship` — country-level heuristic (UK / DE / IE / NL top-tier)
- Drop-ins: TradeoffView on sample-parent-report; ShareWithFamily on Visa Coach + ShortlistSummary; single "Parent-friendly view" button on ROI / Parent (full ShareWithFamily would duplicate their existing PDF+Email forms — surgical-changes rule).

### 31.4 ROI + Parent no-fee dead-end → editable input (`84ced1b8`)

Programs with no verified or estimated fee previously rendered a "Cannot calculate — tuition fee data not available" panel that killed the funnel. Replaced with an amber "Tuition fee needed to calculate" panel + numeric USD input. Once the user types a positive value, the normal ROI / Parent verdict renders below, with an amber caveat banner ("Based on the tuition fee you entered. Re-confirm with the university...") mirroring the existing estimated-fee pattern. Three valid tuition provenances now mirror across both tools: `verified | estimated | user_provided`.

### 31.5 AISA fixes — currency + intake calendar

Two related credibility holes both rooted in the same bug class: free-handing deterministic facts that the model gets wrong.

- **Currency (`57f59a18`)**: AISA was converting "40 lakhs INR" to "$4,800 USD" (off by exactly 10×; "lakh" = 100,000 not 10,000). Fix: explicit CURRENCY RULES section in the system prompt with lakh / crore definitions + FX rates for the 7 main destination currencies + worked examples that call out the failure mode by name. **Real fix queued (Tier-A #2):** `convertINR()` helper that pre-computes the conversion before AISA sees it.
- **Intake calendar (`0f5f1586`)**: AISA was referencing "the 2025 intake" mid-2026 — drifting to its training-cutoff year. Fix: `buildIntakeContext(now)` computes the active + following Fall cycles based on the request timestamp and injects them into the system prompt per request. Jan–May: active = current year, next = +1. Jun–Aug: active still current. Sep–Dec: active = current+1.

### 31.6 Home rewrites — hero, both-sides cards, eyebrow

User-driven copy sweep to lead with stakes and emotional benefits, not features.

- Hero H1 (`a85ac572`): "Choose your study abroad path with verified data you can trust" → "**You only get to decide this *once*.**"
- Hero subtext (`a85ac572`): old corporate-positioning line → "Course, country, cost, visa risk, ROI, safety — every question your family asks, answered from source-verified data, honest about the trade-offs. Say yes with conviction."
- Both-sides student card subtext (`71fdd716`): feature-list → "This decision will shape the next decade of your life. Find a country, course and university that actually fit you — then rehearse every essay, interview and English test until you walk in confident, not hopeful."
- Both-sides parent card subtext (`71fdd716`): feature-list → "You're being asked to back a decision worth years of savings. EduvianAI puts the questions you actually need answered — payback period, visa risk, country safety, alternative paths — into one report you can read in five minutes and discuss honestly at home."
- Eyebrow (`482a9ece` → `bc422dc7` after a round of revisions): "Independent · source-verified · AI-powered" → "**INDEPENDENT AI-POWERED STUDY-ABROAD DECISION INTELLIGENCE**" (no comma — reads as one cohesive descriptor, not a list of attributes).

### 31.7 Voice patch — SR pipeline prime + listening cue (`b83dae10`)

The 11 May handoff-#11 fix-set (mic getUserMedia pre-warm, auto-listen on TTS end, short-utterance interim capture) addressed audio-device latency but NOT the SpeechRecognition pipeline cold-start (~500–1000ms on Chrome desktop). User confirmed mid-session that the symptom ("speak 2–3 times") persisted.

Three changes:
1. Pre-warm useEffect HOLDS the getUserMedia stream open for the session lifetime instead of releasing after 200ms. Eliminates SR's stream re-acquisition cold path.
2. New `primeRecognition()` runs at session mount: brief SR start → wait for `onstart`/`onaudiostart` → abort. Caches Chrome's recognizer pipeline so subsequent `.start()`s warm in <100ms.
3. New `playListeningCue()` (Web Audio, 880Hz × 90ms, vol 0.08) fires from `recog.onaudiostart` (with `onstart` + 120ms fallback for Safari) in both startListening (question phase) and listenOnce (name / YES / AU category). Trustworthy "speak now" signal.

`SpeechRecognitionShim` extended with optional `onstart` / `onaudiostart`. Stream released on unmount via existing cleanup. **Live-mic verification still pending (Tier-A #1).**

### 31.8 Operating rules codified (`c5f13551`)

10 non-negotiable rules added to CLAUDE.md as a top-level "Operating rules — non-negotiable, every session, no exceptions" section, immediately after the project description:
1. Think before coding · 2. Simplicity first · 3. Surgical changes · 4. Goal-driven execution · 5. Always factual, no fabrication · 6. Use model only for judgment calls · 7. Surface conflicts, don't average them · 8. Read before write · 9. Checkpoint after every significant step · 10. Fail loud.

Loaded automatically into every Claude Code session.

### 31.9 Open work — handoff #12 → #13 plan

Pinned in priority order. Cost / effort estimates derived from this session's actual throughput.

**Tier-A — credibility & correctness (cheap, code-only):**
1. **Voice sanity check on live deploy** — `b83dae10` shipped; needs a real mic test on UK / AU / USA flows. User-driven, ~10 min.
2. **`convertINR()` deterministic helper** — currency fix is prompt-only today. Per Rule 6, real fix is a helper that pre-computes conversions before AISA sees them.
3. **Dedup `UCL` vs `University College London` + `Middlesex University` vs `Middlesex University London`** — spotted during C1 UK inventory.
4. **63 still-unverified entries cleanup** — 31 field-mismatch (24 catalog URLs, 7 manual), 32 fetch-errors (2 dead, 28 catalog placeholders, 2 retry). Strip via `audit-strip --include field_mismatch` then manual review of residual.

**Tier-B — DB completeness (API spend):**
5. **Canada estimate-fees retry** — recover the 19 lost + process 414 not-yet-touched. ~$28 / ~3 hr. Hardening (`a42b83f4`) means a partial-stop won't lose work again.
6. **B-Phase 2 — remaining 25 SG/UAE/MY/IE unis.** ~$15–25 / ~2 hr. Run when Anthropic rate-limit pressure has eased (overnight is safest).
7. ~~C1 retry on 4 zero-yield UK unis~~ — **descoped by user 11 May.**
8. ~~Brandon + Ontario Tech retry~~ — **descoped by user 11 May.**
9. **USA fee uplift beyond 78.1%** — residential proxy (~$50/mo) or per-uni manual override for the universities whose pages block bot fetches.
10. **Architecture stream Phase 2** — seed files already untracked (`scripts/verify/seeds/architecture-phase2.json` + `streams-full-sweep.json`). Just needs verify-batch + merge. ~$10–25 / ~1–2 hr.

**Tier-C — product surface deferrals from Tier 1/2/3:**
11. **TradeoffView → ProgramCard / ComparePanel** with live student-profile-driven verdicts (admission chance derived from match_score, cost from tuition + living, ROI from country/field salary, visa complexity from VISA_COMPLEXITY_RANKED, safety from per-country mapping, scholarship from country heuristic).
12. **Backend-mediated email for ShareWithFamily** — replace `mailto:` with server-side send via existing Resend infra.
13. **Dedicated `/parent-view` route** — true render mode (simpler styling, less jargon) usable for any tool, not just routing to `/sample-parent-report` as a placeholder.
14. **Marketing email opt-in flow** — Privacy Policy §11 promises this.
15. **Visible unsubscribe link in email body** — `List-Unsubscribe` header is in; in-body link still missing.
16. **Real downloadable Sample Parent Report PDF** — current is HTML + browser Save-as-PDF.
17. **`/options` scoring refinement** — current heuristics are rough (scholarship lens is per-country only; safer-admit doesn't factor field-of-study selectivity; ROI doesn't account for graduate-stay visa duration).

**Tier-D — security & ops:**
18. Read `~/Desktop/EduvianAI-Security-Architecture-Risk-Assessment.docx` to enumerate Medium / Low findings.
19. Apply M findings.
20. Apply L findings.
21. Secrets rotation policy + 90-day cadence.
22. Backup posture confirmation.
23. Sentry alerting on auth / OTP failures.
(Pen testing + bug bounty stay deferred to pre-launch.)

**Estimated remaining spend across Tiers B + C (excluding descoped #7-8):** ~$90–150 of API + optional $50/mo residential proxy for #9.

### 31.10 Working-tree state at handoff #12

Last commit on `main`: `0f5f1586` (AISA dynamic intake calendar).

Modified but uncommitted:
- `scripts/verify/catalogs/streams-all-qs.json` (from a prior session; ties into Architecture Phase 2 / Tier-B #10)

Untracked (also from prior sessions, all tie into Tier-B #10):
- `scripts/verify/catalogs/architecture-phase2-target.json`
- `scripts/verify/seeds/architecture-phase2.json`
- `scripts/verify/seeds/streams-full-sweep.json`

No background processes. No in-flight verify or seed work.

---

## §32 Session log — 11 May 2026 (handoff #12.5 — Tier-A + Tier-C #11-13 + Tier-B #10 + NBA review + Canada estimate-fees retry in flight)

Continuation of handoff #12 in the same calendar day. 18 commits on `main` since `e37fb0f4` (#12 doc refresh). Closed all four Tier-A items, three of the four Tier-C product-surface deferrals (one closed as superseded), one Tier-B item (Architecture Phase 2), plus the NBA-review fix the user surfaced after seeing the Tier-3 first cut live.

### 32.1 Tier-A — credibility & correctness

**`convertINR()` deterministic helper (`6d2f3c18`)** — Operating Rule 6 closure on the AISA currency bug. Regex extractor + pre-computed conversion table for the seven destination currencies (USD/EUR/GBP/CAD/AUD/SGD/AED) injected into the chat system prompt per request. AISA reads facts ("40 lakhs INR = INR 4,000,000 → USD 48,193 · EUR 44,444 · …") instead of doing the math. Caught 7 phrasings in smoke test including the user's original "$4,800 vs $48,200" failure case.

**UCL / Middlesex dedup (`94dc29d7`)** — spotted during the C1 UK university inventory. `UCL` (27 rows) and `University College London` (4 rows) were the same institution under two display names; same with `Middlesex University` (15) / `Middlesex University London` (2). Standardised on the longer formal names to match the rest of the DB. Row counts unchanged; unique-university count 543 → 541.

**63 stale unverified entries strip (`46274d08`)** — after two re-verify passes, 63 entries still lacked a `verified_at` stamp (catalog URLs from older crawler runs, dead links, etc.). The naive `audit-strip --include field_mismatch fetch_or_api_error` would have stripped 90 rows including 27 that had been successfully re-verified in a later pass. Used a smarter Python filter that only strips entries that are BOTH unverified in `programs.ts` AND flagged in the latest `reverify-report.jsonl` entry. Result: exactly 63 stripped, 1 preserved (the re-verified one). **DB is now 100% verified.**

**Voice sanity check on live deploy** — the only Tier-A item not closable by automation. UK + AU voice flows confirmed working by the user. USA flow needed multiple rounds (§32.2).

### 32.2 USA voice triage — five-commit refinement loop

User-reported "USA voice is robotic" and "voice breaks at times" — single-country complaint. Iteration log:

1. **`3dc24880`** — extended `usMaleNamed` priority list to include Google US English Male (Chrome cloud), Microsoft Guy/Davis Online (Natural) (Windows), iOS 17+ premium voices (Eddy, Junior, Reed, Rocko, Aaron, Arthur, Albert, Junior English (US) etc.); dropped USA rate from 1.05 → 1.0. Verified the bundle deployed via grep against the live `_next/static/chunks/app/interview-prep/page-*.js`.
2. **`dd0305ee`** — picker's `usLocale` fallback only excluded literal "female" in name; macOS Samantha / Karen / Victoria / Ava slipped through. Added explicit `KNOWN_FEMALE_EN_US` deny-list + `console.info` log of the picked voice so triage can be confirmed from DevTools.
3. **User's console showed: `Albert`** — Albert is a 1990s-era novelty voice. **`f7d2058c`** — added Albert + Fred + Ralph + Bruce + the System-7 novelty voices (Bahh, Bells, Boing, Bubbles, Cellos, Deranged, Good News, Bad News, Hysterical, Pipe Organ, Trinoids, Whisper, Zarvox) to `ROBOTIC_DENY`.
4. **User's console showed: `Junior`** — but the OLD novelty Junior (child voice), not the iOS 17+ premium one. **`17945ce7`** — added plain "Junior" + plain "Tom" to `ROBOTIC_DENY`. Suffixed variants ("Junior (Premium)", "Junior (English (US))", etc.) stay in priority.
5. **User downloaded specific voices and stated explicit preference order.** **`e06ae204`** — added `USER_PREFERRED_ORDER = ["Alex", "Ava (Premium)", "Allison (Enhanced)"]` that runs BEFORE all other tiers and ignores `ROBOTIC_DENY`. User's call on Alex's quality is the override.
6. **`8728f8a1`** — user requested rate 1.0 (was just bumped to 1.05).
7. **`9a016275`** — user moved Ava (Premium) to first position. Alex demoted to last fallback.
8. **`b9ff79b2`** (intermediate) — added Premium/Enhanced suffix preference logic for natural-female tier (Ava/Allison/Samantha/Susan/Victoria/Vicki/Zoe/Princess/Kathy/Nicky/Sandy/Nora/Joelle).
9. **User reports "voice still breaking" on Ava (Premium).** Re-diagnosed: this isn't device-specific (UK/AU work fine). Root cause was `listenOnce`'s unconditional `cancel()` firing on TTS-onEnd (auto-listen path); audio was still draining and `cancel()` chopped the final syllable. **`fe187477`** guarded `cancel()` with `if (speechSynthesis.speaking)`.
10. **`fe187477` also added** — module-level `speechFriendlyName()` with phonetic respelling map for ~20 common Indian names ("Piyush" → "Piyoosh", "Saurabh" → "Sow-rubh", etc.); used only in TTS strings, display name unchanged.
11. **`fe187477` also added** — USA section-select mic. Earlier snapshot said "USA section picker deliberately doesn't auto-listen — 12 sections too many to enumerate by number"; new design enumerates by **topic keyword** instead ("say a topic like family, university, finances, future, or visa, or full mock for everything"). `tryListenForUsaSection` regex-matches keywords against the 12 USA_SECTIONS labels.

Lesson per Operating Rule 1 (push back, present multiple interpretations): the early "device issue" framing was wrong. The user's pushback ("AU + UK work, so it's not the device") was correct — the breaking was our `cancel()` race, hidden by the shorter UK/AU prompts.

### 32.3 Tier-C — product surface deferrals

**ShareWithFamily backend email (`c31163e7`)** — first cut used `mailto:` which bounces through the user's local mail app. Replaced with inline form posting to new `/api/email/share` endpoint. Rate-limited via `aiToolLimit` (10/hour per IP). Body wraps in a minimal HTML shell (preheader card + paragraph-per-line + footer with source link). Plain-text alternative forwarded. CRLF-stripped subject for header-injection defence-in-depth.

**`/parent-view` hub route (`dd5af6c5`)** — first cut routed "Parent-friendly view" buttons to three different existing destinations (ROI → /parent-decision, Visa Coach → /sample-parent-report, Shortlist → /sample-parent-report). Inconsistent. New hub reads `?from=visa|roi|shortlist` and surfaces the recommended destination first with context-aware framing, plus the other parent-oriented outputs below + SourceProof footer. All three call sites updated.

**TradeoffView → ProgramCard / ComparePanel** — closed as superseded. ComparePanel already does a richer side-by-side (match score, tier, QS, tuition, total investment, fee provenance, budget fit, salary, payback, 10-year ROI, location safety, PSW visa availability + duration). The 6-factor TradeoffView component stays available on `/sample-parent-report` and any future detail surface, but duplicating it into ProgramCard / ComparePanel would have added visual noise without new signal.

### 32.4 Tier-B #10 — Architecture Phase 2 (`2d011e82`)

Targeted 97 QS-Top universities (the catalog from a prior 8 May session that never got past the seed-finder stage). websearch-seed-finder ran cleanly through 94 of 97 (3 JSON parse errors — Yeshiva, one other unnamed). 1,253 raw seeds across 17 fields.

Honest scope note: seed-finder doesn't accept a field filter — it picks the strongest 10-15 fields per uni from the 17-option list. The catalog was framed as "Architecture Phase 2" but seed-finder returned 0 seeds tagged with the new "Architecture" field (split out 6 May) — the seed-finder prompt uses the legacy 17-field list which still has the compound "Arts, Design & Architecture". Filtered to that compound field → 66 seeds; 25 deduped against existing DB entries → 41 to verify. verify-batch (Opus, concurrency 5): 30 ok / 5 rej / 6 err. Two workers stalled mid-run on slow sites ("University of …" + École Normale Supérieure); user-authorised SIGTERM unblocked the supervisor.

Net DB delta: +62 programs (30 verify-batch + 32 leftover outputs the merger caught up on). Architecture field 274 → 279 (+5). The remaining +57 spread across other fields from the broader sweep. The full 1,253-seed harvest is kept at `seeds/architecture-phase2-full.json` for any future field-specific sweep (e.g., Natural Sciences QS-top sweep already has 87 candidates collected).

### 32.5 Tier-B #5 — Canada estimate-fees retry (in flight)

Three attempts in this calendar day:

1. **First attempt** (in handoff #11) — chain step 3 (USA → Germany → Canada). 138/552 processed when stopped on user instruction; **19 estimates lost** because the script's flush threshold was 20 and no SIGTERM handler existed.
2. **Hardening shipped** (`a42b83f4`) — module-level `flushOnExit` callback wired in `main()`; SIGTERM + SIGINT handlers call it before `process.exit(143|130)`. Save threshold dropped 20 → 5.
3. **Second attempt** today — 604 entries to process. Ran 91/604 before the specialisation-fee backfill (§32.6) needed to write programs.ts. SIGTERM'd cleanly (hardening flush confirmed). ~$5-8 of estimates landed.
4. **Third attempt** today — relaunched after the backfill commit `898bfe93`. 577 entries to process post-backfill. PID 19626 active when this section was written. Expected ~3 hr wall, ~$25-30 cost.

### 32.6 Specialisation-fee backfill (`898bfe93`)

User reported the same U Toronto MScAC program shows fee 25920 in Parent Decision Tool and "null" in ROI Calculator. Root cause: the DB has TWO entries for the same MScAC program — the base program (fee 25920) and an AI-concentration variant (fee null; URL is `mscac.utoronto.ca/concentrations/ai/`). The verifier scraped both pages separately; the concentration page doesn't list a fee. The two tools' dropdowns render both entries; the user picked different ones in each tool.

Python backfill identified 8 child programs across the DB whose name starts with a parent program's name at the same university AND whose degree_level matches the parent. Inherited the parent's fee + tagged `tuition_fee_source: "estimated"`. The UCLA "Computer Science" / "Computer Science BS" pair was correctly skipped (degree-level mismatch — UG vs PG fees differ).

Backfilled programs:
  - University of Toronto      MScAC + AI concentration       (25920)
  - Illinois Institute of Tech Computer Science + (M.S.)      (33318)
  - Griffith University        MIT + AI specialisation        (28275)
  - James Cook University      MBA + Analytics major          (21536)
  - James Cook University      MIT + Cyber Security major     (20909)
  - Univ of the West of England MSc Business Mgmt + Data Anal. (21590)
  - Mississippi State Univ     Biological Sciences + Grad Prg (27637)
  - Cape Breton University     Bachelor of Science + Biology  (16577)

Two-writer race lesson: the backfill script and the Canada estimate-fees retry both wrote `programs.ts` concurrently — the first write got clobbered on the next estimate-fees flush. Resolved by SIGTERM'ing estimate-fees, re-running backfill, then restarting estimate-fees with `--skip-existing`.

### 32.7 NBA review (`fa8723a5`)

User flagged that the Parent Decision NBA ("Run the ROI Calculator on the same program to see the 10-year financial picture") implied program-state transfer between tools that doesn't exist — clicking landed in an empty ROI calculator forcing re-entry. Reviewed all six NBA copies; three needed rewriting:

| Surface | Old | New |
|---|---|---|
| sample-parent-report | "Compare this offer with a lower-cost program in the same field before committing" → `/roi-calculator` | "Compare this offer with a lower-cost program in the same field" → `/options?lens=cheaper` |
| Parent Decision result | "Run the ROI Calculator on the same program to see the 10-year financial picture" → `/roi-calculator` | "Compare this offer with a lower-cost program in your shortlist" → `/options?lens=cheaper` |
| ROI Calculator result | "Run the Parent Decision Tool to share this verdict with your family" → `/parent-decision` | "See the parent-friendly view of this verdict" → `/parent-view?from=roi` |

All three rewrites eliminate the state-transfer assumption and route to surfaces that work regardless of what program the user was previously looking at.

### 32.8 Open work — handoff #12.5 → #13 plan

Pinned in priority order. Tier-A is closed except the user-driven mic test. Tier-C #11-13 closed. Tier-B #10 closed.

**Tier-A — credibility & correctness (essentially closed):**
1. **Voice sanity check on live deploy** — final user mic test on USA flow after `fe187477` deploys.

**Tier-B — DB completeness:**
5. **Canada estimate-fees retry** — in flight (PID 19626). Wait for completion or partial-commit at user instruction.
6. **B-Phase 2 — remaining 25 SG/UAE/MY/IE unis.** ~$15-25 / ~2 hr. Best run when Anthropic rate-limit pressure has eased.
9. **USA fee uplift beyond 78.1%** — residential proxy (~$50/mo) or per-uni manual override. **Skipped pending explicit user authorisation for paid subscription.**

**Tier-C — features (3 of 7 remaining):**
14. **Marketing email opt-in flow** — Privacy Policy §11 promises this.
15. **Visible unsubscribe link in email body** — `List-Unsubscribe` header is in; in-body link still missing.
16. **Real downloadable Sample Parent Report PDF** — current is HTML + browser Save-as-PDF.
17. **`/options` scoring refinement** — current heuristics are rough.

**Tier-D — security & ops:**
18-23. Unchanged from §31. Read the audit `.docx`, apply M + L findings, secrets rotation policy, backup posture, Sentry alerts.

**Estimated remaining spend across Tier-B #5 finishing + Tier-B #6 + Tier-C #14-17:** ~$50-90 of API + optional $50/mo residential proxy for #9.

### 32.9 Working-tree state at handoff #12.5

Last commit on `main`: `fa8723a5` (NBA review pass).

Modified but uncommitted: `src/data/programs.ts` (in-flight Canada estimate-fees retry is writing inline; will commit when the chain completes or is stopped).

Untracked (carry-over from prior sessions, related to future field-specific sweeps): `scripts/verify/catalogs/streams-all-qs.json` (modified) + `scripts/verify/seeds/streams-full-sweep.json` (804-entry harvest from May 8; not yet committed because the scope of a "streams-full-sweep" follow-up is undefined).

The 1,253-seed `architecture-phase2-full.json` IS committed (`2d011e82`) — useful for any future field-specific sweep.


---

## §33 Session log — 12 May 2026 (handoff #13 — Canada retry close-out + Tier-B #6 + all four Tier-C #14-17 + Tier-D pass + USA/AU interview-prep rebuild)

22 commits on `main` (`7f1020cb..06ee429a` plus this snapshot refresh). DB grew 7,986 → 8,007 verified programs (+21), 100% verified. Fee coverage: Canada climbed from ~25% mid-retry to **55.4%** (463/835 with fee). Overall estimated-fee count 1,551 → 1,771 (+220 net after `--skip-existing` collisions). Five Tier-D audit findings closed in production; admin_audit log table live + verified end-to-end.

### 33.1 Canada estimate-fees retry — closed cleanly (`10810376`)

Third attempt, kicked off in handoff #12.5 with the SIGTERM-safe hardening from `a42b83f4`. Started ~22:40 on 11 May, finished ~00:08 on 12 May after ~50 min wall-time and ~577 entries. Results:

| Bucket | Count |
|---|---|
| High-confidence | 85 |
| Medium-confidence | 145 |
| Low / skipped (no fee inferred) | 297 |
| Errors | 50 |
| **Net written to programs.ts** | **230** |

All 230 are Canada-only (verified by country-filter on the hunk context). No previous-loss this time — hardening worked as designed.

### 33.2 Tier-B #6 — B-Phase 2 SG/UAE/MY/IE depth (`e47e31c6`)

Second pass over the 25 universities that B-Phase 1 (`47d39bd7`) couldn't reach due to Anthropic rate-limit pressure. The rate-limit picture cleared between sessions — seed-finder ran the full 25 in ~7 min (vs ~50 min for Phase 1's 30).

Pipeline:
- Catalog: `scripts/verify/catalogs/expansion-b-phase2-target.json` (25 unis)
- Seed-finder: 271 raw seeds across 21 of 25 unis. 4 zero-yield: IIUM, Singapore Institute of Technology, Trinity College Dublin (model returned no confident URLs), and Zayed University (JSON parse error on model output).
- Filter (chosen 10 fields ∩ uni's missing fields) → 28 seeds; 1 deduped → 27 to verify.
- verify-batch (Opus 4.7, concurrency 5): 15 ok / 6 rejected / 6 err.
- merge: +21 programs (15 from Phase 2 + 6 strays from prior /output/).

DB delta: Ireland +8, Malaysia +5, UAE +1, France +4 (stray), Germany +3 (stray), Singapore +0 (both SG seeds rejected/err). Total in-scope net: **+14 (B-Phase 2)** plus **+7 (legacy strays merged at the same time)**. B-Phase scope is now fully processed.

### 33.3 Tier-C #15 — Visible unsubscribe link in email body (`f4e0bef2`)

Privacy Policy §11 names `privacy@eduvianai.com` as the unsubscribe contact. The `List-Unsubscribe` header (Gmail/Outlook in-client button) was already in place; the in-body link was missing across all three transactional templates.

Added body-level `mailto:privacy@eduvianai.com?subject=Unsubscribe` to:
- `api/email/route.ts` (shortlist results email)
- `api/email/tools/route.ts` (ROI / Parent tool email shell)
- `api/email/welcome/route.ts` (welcome email + plain-text body)

Skipped `api/email/share/route.ts` — share endpoint forwards one-shot user-to-user messages, not a subscribed list, so an "Unsubscribe" link would be semantically misleading.

### 33.4 Tier-C #14 — Marketing email opt-in flow (`9130d6fa` + SQL applied)

End-to-end opt-in wiring:

- `StudentProfile.marketing_opt_in?: boolean` (src/lib/types.ts)
- Register form (/get-started) — checkbox below the OTP-hint, default OFF, copy clarifies that transactional sends are unaffected
- `/api/auth` register handler accepts `marketing_opt_in` and persists `marketing_opt_in` + `marketing_opt_in_at` on `students`. Strip-on-error fallback for forward-compatible deploy.
- SQL migration `src/lib/migrations/20260512-students-marketing-opt-in.sql` — adds the two columns + partial index on `marketing_opt_in = true`.

User applied the SQL via Supabase Studio (verified). Existing 2 students backfilled to `marketing_opt_in = false` (correct — opt-out by default per Privacy Policy §11). No marketing-send worker exists yet, so the flag is read-only for now — the gate exists before any future bulk send.

### 33.5 Tier-C #17 — `/options` scoring refinement (`65787067`)

Two refinements called out in the handoff:

**safer lens — field-of-study selectivity bias.** Previously sorted purely by `qs_ranking` DESC with a hard top-200 filter, treating Medicine at QS-#350 as equivalent to Hospitality at QS-#350 despite vastly different admit windows. Added `FIELD_SELECTIVITY` (0.55 Medicine → 1.30 Hospitality, 1.0 neutral) applied as a multiplier to the effective sort key. Filter widened from top-200 to top-100 so safe-fit options at QS 100-200 in non-competitive fields aren't excluded. Metric copy now names the field's typical selectivity for legibility.

**scholarship lens — per-program tuition signal.** Previously sorted purely by country rank with qs_ranking tie-break. This put $60k MIT CS programs at the top of the USA bracket even though Fulbright / Chevening-tier scholarships are largely partial and proportionally cover more of lower-tuition programs. New composite (higher = better): `country_rank × 10 + tuitionBucket (0-4) + verifiedBonus (0/1)` where `tuitionBucket` is `4 (<$15k)` → `1 (>$50k)` → `0 (unknown)`. Metric copy tags each program as low / moderate / premium tuition.

### 33.6 Tier-C #16 — Real downloadable Sample Parent Report PDF (`16c8e65e`)

Previously the only export path was browser Save-as-PDF (`window.print`) which produces a raster-y, browser-quirk-dependent file. Replaced with a proper `@react-pdf/renderer` document — selectable text, consistent layout, stable filename.

Architecture:
- `src/app/sample-parent-report/data.ts` — extracted the static report content (SAMPLE, FACTORS, COSTS, ROI, RISKS, SOURCES) so the HTML page and the PDF doc share one source of truth.
- `src/app/sample-parent-report/pdf-doc.tsx` — `@react-pdf/renderer` Document. A4, Helvetica, text-selectable. Clean B/W typography with subtle tone-coded backgrounds on factor + risk rows.
- `src/app/sample-parent-report/page.tsx` — "Download PDF" handler dynamic-imports both `@react-pdf/renderer` and `./pdf-doc` on click so the ~250kb-gz renderer bundle only loads when the user actually wants a PDF. Original Save-as-PDF kept as a "Print view" fallback.

Dependency already in `package.json` (`@react-pdf/renderer ^3.4.4`) — no install needed.

### 33.7 Tier-D — audit findings closed in production

Pulled `~/Desktop/EduvianAI-Security-Architecture-Risk-Assessment.docx`, enumerated M and L findings, triaged. Five closed today (M4, M6, M8, M9, L2, L4, L6 — that's 7 if you count M6 and M8 admin-slice as separate commits + M8 full sweep).

| ID | Status | Commit | Note |
|---|---|---|---|
| M1 | OPEN | — | CSP `unsafe-inline` / `unsafe-eval`. Defer — 4-6 wk Next.js refactor. |
| M2 | ✅ already closed | — | Email OTP shipped in handoff #11. |
| M3 | OPEN | — | Zod input validation — 0/28 routes; cross-cut. |
| **M4** | ✅ | `106e364f` | `getClientIp()` now prefers Vercel-set headers (x-vercel-forwarded-for, x-real-ip). x-forwarded-for is fallback for non-Vercel only. |
| M5 | OPEN | — | Secrets rotation policy doc (90-day cadence). Doc-only. |
| **M6** | ✅ | `99c7b2d4` + SQL applied | `public.admin_audit` table; `src/lib/admin-audit.ts` helper with fire-and-forget `logAdminAction()`. session_started writes verified email + token hash; per-route reads write only the hash and join back via the hash. End-to-end chain verified in prod with kpiyush@yahoo.com. |
| M7 | OPEN | — | `tool_usage` IP disclosure — Privacy Policy §2.2 edit; touches `scripts/build-legal-docs.js`; legal commits don't push without attorney sign-off. |
| **M8** | ✅ (28/28) | `99c7b2d4` (admin slice) + `9cd3992f` (10-route sweep) | All API routes now rate-limited. Per-route caps tiered against downstream cost / blast radius. |
| **M9** | ✅ | `8b2bb998` | `.github/dependabot.yml` — weekly npm + github-actions updates, dev-tools batched, Next.js grouped. CVE PRs always opened. |
| L1 | per-auditor intent: keep 30d | — | "Reduce to 7 days for now; bump back up after H1+M2 are complete." H1 + M2 both done — staying at 30d is consistent with auditor intent. |
| **L2** | ✅ | `47e6f7c8` | `/api/chat` hardcoded country counts replaced with `programsByCountry` from `db-stats.ts`. Stray Switzerland row gone. |
| L3 | OPEN | — | Privacy Policy §6 SCC citation — legal doc, not pushed. |
| **L4** | ✅ | `2d478305` | `/api/admin/session` POST now constant-time (500ms min) across all paths — rate_limited, missing_bearer, invalid_token, not_authorized, mfa_required, success. Closes timing-based admin enumeration. |
| L5 | OPEN | — | `verified_at` HMAC signing — schema + writer rework. Defer. |
| **L6** | ✅ | `c15aaf14` | `middleware.ts` mints (or accepts trusted upstream) `x-request-id` on every request; forwards via request headers and echoes on every response. Carrier in place; downstream Sentry / Anthropic / Supabase tagging can land later. |
| I1–I4 | OPEN | — | security.txt, bug bounty, IR plan, pen test schedule. Pre-launch items. |

### 33.8 M8 — per-route rate-limit map (full coverage post-sweep)

| Class | Cap | Routes |
|---|---|---|
| Auth | 10 / 15 min | `auth`, `auth/send-otp` |
| Logout / account | 5–30 / h | `auth/logout`, `account/access`, `account/correct`, **`account/delete` (5/h)** |
| AI tools | 10 / h | `chat`, `sop-assistant`, `lor-coach`, `interview-feedback`, `application-check`, `cv-assessment`, `score-english`, `check-match`, `extract-text` |
| Email | 10 / h | `email`, `email/tools`, `email/share`, `email/welcome` |
| PDF | 20–30 / h | `pdf/[token]`, `pdf/tools` |
| Submit / results | 60 / h | `submit`, `results/[token]` |
| Inquiry | 20 / h | `chat/inquiry` |
| Admin | 100 / h + 20 / 15 min on session | `admin/session`, `admin/leads`, `admin/inquiries`, `admin/beta-usage` |

### 33.9 USA interview-prep — knowledge-file rebuild

Three connected commits:

**`390e618c` — USA_SECTIONS rebuilt 12 → 8 sections, verbatim from FINAL_CORRECTED knowledge file.** Sections: Why USA (4) · University (8) · Course (12) · Academic (6, includes 2 TOEFL/IELTS Qs that lived in their own section before) · Sponsor (11) · Future (8) · Visa or Refusal (2, OPTIONAL) · Personal Background (13, consolidates the old Job + Family + Relatives + Misc sections). Total 64 approved questions. Knowledge file Section B lists 6 mandatory + 2 optional.

`buildUsaFullMock()` replaced the static 12-question array. Picks one random approved question per section at session start.

USA_GUIDELINES checklist map updated to match the new section labels: TOEFL bullets folded into Academic; Job + Family + Relatives + Misc bullets folded into Personal Background. Feedback grader (interview-feedback route) looks up by section label, no route change needed.

Voice keyword matcher collapsed 12 → 8 keys; new "personal" / family / job / travel / relative variants all route to `usa_personal`.

Homepage card: "60+ across 12 sections" → "63 across 8 sections".

**`7570e055` — USA two-step mode choice.** New phase `usa_mode_choice` between name capture and section picker. Spoken prompt: "Great to meet you, [name]! Do you want to practice a full interview or a specific section?". UI: two-button card (Full Mock / Specific Section). Voice matcher: "full / mock / everything / all" → full mock; "specific / section / pick / choose" → section picker; "any / start / begin / continue" → opens with the canonical *"Why do you wish to study in USA and not in India?"*.

**`f621dac4` — USA full mock covers all 8 sections (6 mandatory → 2 optional).** Per user clarification: full mock = all 8 sections, six mandatory FIRST then the two optional ones AFTER. `USA_OPTIONAL_SECTION_IDS` added; mock builder iterates mandatory + optional in order = 8 questions per session.

**`c4667b9f` — typo fixes.** User authorised correction of two typos in the knowledge file (overriding "never paraphrase" for these specific items): "What will be the total cost of per year?" → "…total cost per year?". And "Where your brother/parents did completed their studies?" was effectively a typo'd duplicate of a clean version already in the same section → typo version dropped. Net: 64 → 63 questions, Personal Background 13 → 12.

### 33.10 Stop Interview TTS bug fix (`21e2cd9b`) — affects all three countries

User-reported: clicking Stop Interview cancelled the in-flight speech but the coach kept talking ~250ms later. Same pattern affected Mute toggle and any user-driven cancel.

**Root cause.** `speakSegments()` had a retry path that treated TTS `onerror` codes `interrupted` / `canceled` as a browser race and re-queued the cancelled segment after 250ms. The retry was added to rescue the first-utterance-on-mount race in Chrome but couldn't tell "browser raced itself" from "user clicked Stop".

**Fix.** New `intentionallyCancelledRef` inside `useTTS()`. `cancel()` sets the flag to true before `speechSynthesis.cancel()`. `speakSegments()` resets it to false on entry (a new speak overrides any prior user-cancel). The onerror retry guard bails out if the flag is set — cancelled segment stays cancelled, no further onEnd fires. `speakNext()` also checks the flag at top, belt-and-suspenders for any browser that fires `onend` (Safari) instead of `onerror` on a cancelled utterance.

### 33.11 AU interview-prep — knowledge-file rebuild (`06ee429a`)

Same pattern as the USA rebuild, applied to the AU `Australia_Interview_Prep_Knowledge_File.docx`.

- `AU_CATEGORIES`: 19 → **18 questions** verbatim from the file's Section "Approved Interview Question Bank". Cat 2 collapsed 4 questions → 3 (the file groups remuneration + companies + salary + "Have you been offered a job already?" into a single long Q2). Several Q wordings reverted to docx-exact (Cat 1 Q4 terse phrasing; Cat 1 Q5 ends with "…planning to change your area of specialization?"; Cat 3 Q1 split punctuation; Cat 5 punctuation per docx; Cat 5 Q3 graduation year as ASCII "2012-13" not en-dash).
- `buildAuFullMock()`: one random question per category in order (Program → Career → Why Australia → University → Other Important). Five questions per mock, randomised per session. `handlePracticeAll()` now calls the builder.
- New phase `au_mode_choice` mirroring USA — spoken: "[Name], do you want to practice a full mock interview or a specific category?". UI: two-button card.
- `tryListenForAuModeChoice`: "full / mock / everything / all" → handlePracticeAll; "specific / category / pick / choose" → category picker; category-name shortcuts → straight into that category; **unmatched → falls through to handlePracticeAll**, honouring the file's rule "If the user does not choose a category, begin a full mock interview".
- AU intro greeting reworded verbatim: "Hello, I am here to help you prepare for your university interview. Please tell me your name."
- AU_GUIDELINES (per-category checklist used by the feedback grader) already aligned with the file's "Response should cover" bullets — no change.
- Homepage AU card: "19 questions across 5 categories" → "18 questions across 5 categories".

USA and AU now share the same name → mode_choice → (mock | picker → questions) flow. UK still uses its existing "are you ready, say YES" pattern since the UK file doesn't define a mode-choice step.

### 33.12 Students-table migration archived (`8b1783c0`)

While triaging Supabase Studio snippets for cleanup, discovered the original `students` table CREATE migration had never been version-controlled — it lived only as a snippet. Reconstructed verbatim from the snippet content into `src/lib/migrations/20260301-students.sql`. Date prefix is approximate; file header documents the uncertainty and two follow-ups discovered while reading.

**New follow-up surfaced (not in original audit register).** The `students_public_insert` RLS policy grants INSERT to anon. Current `/api/auth` register handler uses `createServiceClient()` and bypasses RLS, so the policy is unused legitimately but provides a write surface to anyone holding the anon key (visible to every browser). Worth dropping after verifying no other code path relies on it — same class of issue as C2 (which we closed for `submissions`).

### 33.13 Supabase Studio snippet cleanup — in flight

Started but incomplete. The user has 32 private snippets in their Studio. Of those:
- 8 are duplicates of repo migrations under `src/lib/migrations/` — safe to delete (verified by me)
- 1 already archived (students table) — safe to delete
- 11 "Likely DELETE" pending the user to paste contents — I'll archive each into the repo or confirm-delete
- 9 useful diagnostics to KEEP — should be renamed with `category / verb` prefix and favorited (e.g. `admin-audit / daily summary`, `submissions / list all`, `ops / list RLS policies`)
- 2 probable duplicates ("Coverage Su…" vs "Coverage Co…") — open both, keep one
- 1+ off-screen — paste names

Two reusable queries written today for admin_audit ops, worth saving as snippets:

```sql
-- Daily admin activity summary (weekly check)
SELECT date_trunc('day', a.created_at)::date AS day,
       s.actor AS operator,
       COUNT(*) FILTER (WHERE a.action = 'session_started') AS logins,
       COUNT(*) FILTER (WHERE a.actor_kind = 'session_hash') AS reads
FROM public.admin_audit a
LEFT JOIN public.admin_audit s
  ON s.target = a.actor AND s.action = 'session_started'
WHERE a.created_at > now() - interval '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, reads DESC;

-- Anomaly check: orphan session hashes (must return 0 rows in normal operation)
SELECT DISTINCT a.actor AS orphan_session_hash
FROM public.admin_audit a
LEFT JOIN public.admin_audit s
  ON s.target = a.actor AND s.action = 'session_started'
WHERE a.actor_kind = 'session_hash'
  AND s.id IS NULL;
```

### 33.14 Open work — handoff #13 → #14 plan

Pinned in priority order. None blocking; user can pick where to pick up.

**Tier-A — credibility & correctness (user-driven, no API spend):**
1. **Voice / mic test on the live USA flow** — `fe187477` + the new `7570e055` + `f621dac4` + `21e2cd9b`. Test full mock and section picker; confirm Stop Interview now actually silences the coach.
2. **Voice / mic test on the live AU flow** — `06ee429a`. Two-step mode choice; full mock should ask 5 questions one-per-category.

**Tier-B — DB completeness (API spend):**
3. **USA fee uplift beyond 78.1%** — `Tier-B #9`. Residential proxy (~$50/mo) or per-uni manual override. **Still skipped pending explicit user authorisation for paid subscription.**

**Tier-C — product surface (3 of 7 from original list remain):**
All closed today (#14 marketing opt-in, #15 unsubscribe link, #16 real PDF, #17 /options scoring).

**Tier-D — security & ops (10 items remaining):**
4. **`students_public_insert` RLS hardening** (newly surfaced 12 May). 30-min change: drop the anon-INSERT policy after verifying no code path uses it.
5. **M1 CSP** — drop `unsafe-inline` / `unsafe-eval`. 4-6 wk Next.js refactor; roadmap decision needed.
6. **M3 Zod** — input validation across the 28 API routes. ~1-2 days.
7. **M5 Secrets rotation policy doc** — 90-day cadence. Doc-only.
8. **M7 + L3 legal-doc edits** — Privacy Policy §2.2 (tool_usage IP disclosure) + §6 (SCC citation). Touches `scripts/build-legal-docs.js`; **don't push** without attorney sign-off.
9. **L5 verified_at HMAC signing** — schema + writer rework. Defer.
10. **I1 security.txt** — `/.well-known/security.txt`. 10 min.
11. **I3 Incident response plan** — required for ISO 27001 roadmap. Document detection → triage → containment → notification → post-mortem.
12. **I2 + I4** — bug bounty / VRP + pen-testing schedule. Pre-launch.

**Housekeeping:**
13. **Finish the Supabase Studio snippet cleanup** (§33.13). User pastes the 11 "Likely DELETE" snippet contents; I archive or confirm-delete each.
14. **Refresh STATE_SNAPSHOT + CLAUDE.md** — this commit.

### 33.15 DB shape at handoff #13

```
Programs:      8,007 (was 7,986 in handoff #12.5; +21 from B-Phase 2)
Verified:      8,007 (100.0%)
Countries:     12
Universities:  ~535+
Fee coverage:  ~55%+ overall (CA 55.4% / 463-of-835 after the retry; estimated 1,771 total)
```

Per-country (programs):
USA 2,378 · UK 1,915 · Canada 846 · Germany 792 · Australia 650 · France 441 · Malaysia 233 · UAE 183 · Netherlands 177 · New Zealand 159 · Ireland 141 · Singapore 92.

### 33.16 Working-tree state at handoff #13

Last commit on `main`: `06ee429a` (interview-prep AU rebuild). Tree clean. 22 commits pushed in this session.

SQL migrations applied + verified in Supabase Studio:
- `20260512-students-marketing-opt-in.sql` — students has `marketing_opt_in` boolean + `marketing_opt_in_at` timestamptz + partial index. 2 existing students backfilled to false.
- `20260512-admin-audit-log.sql` — `public.admin_audit` live with 3 indexes + RLS deny-all. Three rows generated by the first admin login: 1 `session_started` (email-keyed) + 2 per-route reads (hash-keyed). Join resolver confirmed working.

SQL migrations *not* yet applied (none pending right now — every migration referenced today is applied).

---

## §34 Session log — 12 May 2026 (handoff #14 — password auth · matching rewrite · 4-layer tuition + living-cost data fill · MBA leadership · /api/version)

31 commits on top of handoff #13's doc refresh (`e7e5e88d..7cdddac9`). Big themes: an alternative password-based login flow, multiple matching-algorithm rule changes that tighten what shows up in results, a four-pass tuition-data fill aimed at closing the cost-vs-budget arithmetic gap, MBA-specific profile questions + leadership-aware scoring, English-signal honesty fixes, the I1 security.txt + /security-policy page, the `students_public_insert` RLS hardening, the beta cap drop from 100 → 50/mo, and a new `/api/version` deploy-check endpoint.

### 34.1 Beta cap → 50 / month (`6f323a42`)

User: reduce the beta-period cap. `MONTHLY_UNIQUE_USER_CAP` 100 → 50 (owner email bypass unchanged). Banner copy updated; `STORAGE_KEY` bumped so anyone who'd dismissed the old banner sees the new copy. Politer copy on the full-quota path with a dynamic "resets on `<Month D, YYYY>`" reset-date string computed via UTC. CLAUDE.md + snapshot stats updated.

### 34.2 RLS hardening — `students_public_insert` dropped (`5fcabe5a`)

Audit done at the previous session showed every code path that writes to `students` uses `createServiceClient()` (bypasses RLS). The legacy `students_public_insert` policy granted INSERT to anon — unused by legitimate flows, write surface exposed to anyone with the anon key. SQL migration `20260512-students-drop-public-insert.sql` written; user applied in Supabase Studio (verified — only `students_service_all` remains).

### 34.3 I1 security.txt + /security-policy (`591c25f1`)

`public/.well-known/security.txt` with the RFC 9116 fields (Contact: `security@eduvianai.com`, Expires 2027-05-12, Canonical, Policy). New `/security-policy` page documents the responsible-disclosure window, in-scope vs out-of-scope assets, our commitments, and no-bug-bounty-yet status. Closes I1 from the 2 May audit. User TODO: confirm `security@` mailbox exists or forwards to `privacy@`.

### 34.4 Matched-results PDF fix (`7dd4b231`)

User: PDF wasn't generating. Two compounding root causes:
- `/api/pdf/[token]` had no `maxDuration` — Vercel default 10s was tight for cold-start + 8,007-program scoring.
- `ProfileCard.downloadPDF` used `fetch + URL.createObjectURL + window.open(blob:url)` — modern Chrome/Safari block `window.print()` in blob: contexts, so the print dialog never fired.

Fixed both. `maxDuration = 30` matches `/api/pdf/tools`. ProfileCard aligned with `results/[token]` page's direct same-origin `window.open` pattern. Defensive `try/catch` + `captureApiError` so silent 404s become Sentry traces. Cache-Control: no-store so a one-time render failure doesn't get edge-cached.

### 34.5 Matching algorithm — strict pass (`14a529b0`)

Per user, four rules tightened:

1. **Academic = hard filter (no buffer).** `studentPct < programMinPct` → excluded. Previously soft 40%-weight signal.
2. **Budget = hard filter at 110%.** `totalCost > 1.1 × budgetMax` → excluded. Programs with no fee data not disqualified.
3. **Scholarship signal = neutral.** Returns constant 50; was a QS-rank proxy that misled users. "Scholarships" row removed from `CheckMatchPanel` breakdown.
4. **Strict field-of-study.** `RELATED_FIELDS` no longer used — MBA student no longer sees Economics & Finance, CS no longer sees AI/DS, Architecture no longer pulls legacy "Arts, Design & Architecture" tags.

Net effect: students with marginal grades or low budget see fewer programs. Architecture students may see drops until legacy tags are re-classified.

### 34.6 Password login (`8cc29b44` + `31d02312` + `823e8f25` + SQL applied)

User asked for password as an alternative auth factor at login (alongside email OTP). Built end-to-end:

- `src/lib/password.ts` — Node scrypt hashing (N=32768, r=8, p=1, 32-byte salt, 64-byte key), PHC-style stored format, constant-time verify.
- Strength rule (later tightened by user): **min 8 chars + letter + digit + special character** outside `[A-Za-z0-9]`.
- `SQL migration 20260512-students-password.sql` — adds `password_hash` + `password_set_at` columns + partial index. **Applied + verified in Supabase Studio (0 of 5 students had set a password at the time of the audit).**
- `/api/auth login_password` action — looks up by email, verifies scrypt hash, mirrors OTP-login success shape. Generic "Wrong email or password" on every failure path; `reason: "no_password"` hint when account exists but no hash on file so the UI can nudge.
- `/api/auth/set-password` new endpoint — gated by `eduvianai_user` cookie, 10/h rate limit. Validates strength server-side. Falls back to a clean 503 if the columns aren't migrated yet.
- `/get-started` login form — two-button toggle ("Email code" / "Password") on step 1. Password mode is single-step (email + password → /api/auth). On `reason: "no_password"` the toggle auto-flips back to OTP and surfaces a helpful nudge.
- `<SetPasswordCard />` component — current / new / confirm fields with a live strength checklist (4 green ticks light up as each rule passes). Renders only when `eduvian_student` localStorage is set; the API still enforces auth.
- **`/account/security`** — dedicated page hosting the card. Discoverability fix: the user reported landing on `/results` after OTP login and not finding the set-password option (the card lived only at the bottom of `/profile`, which OTP-login skips when a submission exists). Top-nav "Security" buttons added to `/results` and `/profile`.

### 34.7 Budget-headroom badge (`beeeff4a` + `dbf3c039`)

When a program survives the 110% hard filter but exceeds 100%, the card displays the precise percentage. First lived as an amber pill next to the cost row; per user feedback, moved INTO the Budget tile in the per-program signal row — replaces the generic "Slightly over budget" copy with "105% of your budget".

### 34.8 Living-cost backfill — three layers (`ed12161b` → `76e7b453` → `c97204b5`)

Audit showed 4,957 of 8,007 programs (62%) had `avg_living_cost_usd = 0` or `null` — quietly broke the budget math. Three passes layered:

1. v1 `backfill-living-cost.ts` — country-flat medians from existing populated rows.
2. v2 `backfill-living-cost-by-city.ts` — city-tier model (Tier 1 / 2 / 3 per country) based on cost-of-living benchmarks. Toronto ≠ Winnipeg, London ≠ Sheffield, etc.
3. v3 `backfill-living-cost-immigration.ts` — anchored to **official immigration-agency proof-of-funds figures** per user: UKVI Student Route (Jan 2025), IRCC (Jan 2024), DoHA (Oct 2023), Bundesfinanzhof blocked account, Campus France, IND, INIS, INZ, EMGS. USA uses SEVP school-published figures (no federal number). All converted to USD at 12 May 2026 rates. Tier 1 cities sit above the agency baseline (real cost), tier 2/3 match the baseline.

Source ladder now explicit:
1. University-published (verify-program.ts) — 306 rows, never overwritten
2. Immigration agency baseline — 6,894 rows (this pass)
3. None — 0 rows (eliminated)

### 34.9 Intake-availability hard filter (`737c436d`)

Previously a soft 5% signal. Now: if a program's `intake_semesters` list is non-empty AND doesn't include the user's target → excluded entirely. Data-honest pattern: empty/missing intake data → stays in results (don't penalise data gaps). `scoreIntake` tidied to return neutral 60 for missing data instead of 0.

### 34.10 MBA-specific questions + hard filter (`ad8eb36b` + work-exp backfill `5eac6ab7`)

Two new profile questions (StepAcademic, only when `intended_field === "MBA"` and `degree_level === "postgraduate"`):
- Do you have experience of leading teams? (yes/no, required)
- What was the size of the largest team you led? (number, required when yes)

`mba_team_leading_experience: boolean` + `mba_max_team_size: number` on `StudentProfile` — rides on encrypted profile blob, no DB change.

**Hard filter:** for MBA programs with `work_exp_required_years > 0`, the student's years must meet/exceed the floor. No buffer. A program requiring 5 yrs no longer shows to a 4-yr candidate.

**Soft preference:** for MBA programs, `scoreWorkExp` blends 50/50 with `scoreMbaLeadership` — top MBAs (≤QS50) strongly reward team-leading experience (+100); without it the score drops to 40. Smaller MBAs (>QS200) are forgiving. Team-size bonus +5 (≥10 reports) or +2 (≥5).

**Data backfill** (`scripts/verify/estimate-mba-work-exp.ts`) — Sonnet + web_search over the 224 MBA programs with null `work_exp_required_years`. Ran ~1h at concurrency 4 (PID 36055). Result: **ok=186, low=33, err=5 — 83% hit rate**, ~$10 spend. The hard filter now bites correctly on those 186 rows.

### 34.11 English + std-test scoring fixes (`fd7c34a8` + `c7a0b24a` + `45a1713d`)

Three user-reported correctness bugs:

1. **NaN-on-empty-input** — `parseFloat("")` returns NaN, `?? 0` doesn't catch it, NaN fell into the comparison branch and rendered the signal as a red gap even though the user had selected a test. Fixed: validate `Number.isFinite(s) && s > 0` before comparing; missing-score path returns neutral 70.

2. **Sentinel 5 — "no test taken"** — when `profile.english_test === "none"`, return 5 regardless of program requirement. UI surfaces "Take an English test (IELTS / TOEFL / PTE)".

3. **Sentinel 7 — "wrong test type"** — when the user's chosen test isn't in the program's accepted list (program lists min_toefl only, user has IELTS), return 7. UI surfaces "Only TOEFL accepted by this program" (renders the actual accepted list from a `acceptedEnglishTests` prop computed in ProgramCard).

Also: PG graduation-year dropdown extended from `cur-6` to `cur-10` so older MBA / second-masters applicants find their year.

### 34.12 /api/version endpoint (`26bf659b`)

Deterministic deploy-check. Returns commit SHA, message, branch, env, cold-start timestamp from Vercel's documented build-time env vars. Public, no auth, rate-limited 60/h per IP. Cache-Control no-store. Lets us (or any external check) confirm exactly which commit a given environment is serving without opening the Vercel dashboard.

### 34.13 Layer 3 tuition fallback — prior-year + 5% uplift (`30de3299` → `7889f120`, partial-run `7cdddac9`)

After verify-program.ts (L1) and estimate-fees.ts (L2), 3,468 programs still had null USD tuition (43% of DB). Budget hard filter quietly skipped them. New `estimate-fees-prior-year.ts` finds PRIOR-YEAR tuition from credible sources, applies 5%/year uplift, tags `tuition_fee_source: "estimated"`.

Source allowlist (locked by user, broadened to categories):
1. University's own archived fees page (Wayback / Google cache)
2. Rankings: QS, THE, US News, Shanghai, CWUR
3. Government / national-body: UCAS, DAAD, Campus France, IND, INIS, INZ, EMGS, etc.
4. Major consultancies: IDP, LEAP, Career360, ApplyBoard, Edwise, etc.
5. Major news outlets reporting dated fee changes

Banned: Reddit / Quora / forums, undated figures, the program's own current-year page.

Confidence ladder:
- Archived uni page alone → sufficient
- Any ranking / govt portal alone → sufficient
- Two consultancy / news sources within 10% → sufficient
- Two within 11-20% → sufficient, **AVERAGE the two figures**, set `tuition_estimate_note`
- >20% → low → null

**`tuition_estimate_note: string | null`** new Program field. When set, the "Estimated" pill on ProgramCard renders with an asterisk + the note text in its tooltip ("Tuition figure is estimated from sources with ~N% spread — please verify the current-year fee with the university before relying on it"). Only the prior-year flow populates this field; existing tightly-agreed L2 estimates have no note.

Runs to date:
- **Pilot** `--limit 200` — ok=96, low=102, err=2 (48% hit rate, ~$8). Ran under pre-variance-rule prompt — no notes.
- **Re-attempt** of the pilot's 96 entries under the new prompt (`--reattempt-from-log`) — ok=83, low=10, err=3. ~$4. Notes now populated where applicable.
- **Full sweep** wrapper (`--country` 6 unrestricted + 6 QS≤500) started, **user-stopped at 92 / 2,933 entries**. 24 ok / 58 low / 0 err on this batch; ~$3.70 of ~$118 budget spent. Hit rate 26% on the early batch — dominated by generic catalog pages.

End-state: **1,897 programs carry `tuition_fee_source: "estimated"`** (1,771 from L2 history + 96 + new fills from L3). 4 carry the variance note (the new field). ~3,250 still null-tuition; resumable by re-running the same wrapper command — script's "already-estimated rows are skipped" rule means it picks up exactly where the user-stop interrupted.

### 34.14 Open work — handoff #14 → #15 plan

Pinned in priority order.

**Tier-A (no API spend):**
1. User QA of the password-login flow end-to-end: set from /account/security, log out, log in via Password toggle, see the live strength checklist react correctly.
2. Eyeball the matching results post-tightening — academic + budget + field + intake hard filters may shrink some users' shortlists noticeably. Check the new English-signal verdicts ("Take an English test" / "Only TOEFL accepted by this program") render correctly.
3. Confirm `security@eduvianai.com` mailbox exists or forwards to `privacy@`.

**Tier-B (API spend decisions):**
4. **Resume the 7-country tuition sweep** — same wrapper command, picks up at ~2,840 remaining. Hit rate ~30% projected. Cost ~$114 more for ~850 fills. OR: revise to a stricter `--qs-max <N>` for some countries to spend less.
5. **USA fee uplift beyond 78%** — Tier-B #9 from earlier. Residential proxy ($50/mo). Skipped pending paid-subscription auth.
6. (Optional) Layer-3 broaden — drop QS-500 ceiling on Germany or one of the 5 others if you want more coverage.

**Tier-C (product surface):** all four (#14, #15, #16, #17) shipped on handoff #13.

**Tier-D (security & ops):**
7. M1 CSP — drop unsafe-inline / unsafe-eval. 4-6 wk Next.js refactor.
8. M3 Zod — input validation across 28 routes. 1-2 days.
9. M5 secrets-rotation doc — 90-day cadence playbook. Doc-only.
10. M7 + L3 legal-doc edits — Privacy Policy §2.2 + §6. **Don't push** without attorney sign-off.
11. L5 verified_at HMAC signing. Defer.
12. I3 Incident response plan. Required for ISO 27001 roadmap.
13. I2 + I4 — bug bounty + pen test schedule. Pre-launch.

### 34.15 DB shape at handoff #14

```
Programs:                       8,007 / 8,007 verified (100%)
Countries:                      12
Universities:                   ~535
Living-cost coverage:           100% (immigration-agency anchored)
Tuition coverage:               4,757 of 8,007 programs (59.4%)
  - tuition_fee_source verified: ~2,860 (verify-program.ts)
  - tuition_fee_source estimated: 1,897 (L2 + L3 cumulative)
  - tuition_estimate_note set:    4 (new variance-aware notes)
MBA programs:                   440 total
  - with work_exp_required_years: 402 (was 216)
```

### 34.16 SQL migrations applied + verified in production (cumulative)

- `2026-04-25_tool_usage.sql`
- `20260301-students.sql` (archived 12 May from a long-orphan Studio snippet)
- `20260502-c2-submissions-rls.sql`
- `20260502-h2-user-sessions.sql`
- `20260503-h7-submissions-pii-encryption.sql`
- `20260503-otp-challenges.sql`
- `20260505-h7-phase-c-drop-plaintext.sql`
- `20260512-students-marketing-opt-in.sql` (handoff #13)
- `20260512-admin-audit-log.sql` (handoff #13)
- `20260512-students-drop-public-insert.sql` (this handoff)
- `20260512-students-password.sql` (this handoff)

### 34.17 Working-tree state at handoff #14

Last commit on `main`: `7cdddac9`. Tree clean post-snapshot-refresh commit (the one this section lives in). Background processes: none.

---

## §35 Session log — 13 May 2026 (handoff #15 — Tier-B tuition sweep complete · matching refinements · UK QS-500 psych sweep · realistic-admit Option A · auth UX rebuild · brand cleanup · mobile alignment audit)

**39 commits** on top of `9f894290` (`1fdada82 .. 12b6d9e5`). Plus two in-flight background sweeps still running at session end and one uncommitted data merge (see §35.16). Biggest themes: closing out the resumable Tier-B sweep, a Psychology + free-text "Others" stream addition with a BPS-accreditation gate, a top-100-uni realistic-admit-bars run (Option A from a long tier-threshold debate), an auth-UX rebuild (inline password after OTP, 24h idle, change-password modal), a hero headline carousel, a brand cleanup that purged "Your Global Future, Simplified" everywhere and shipped the violet `e`-mark across PDFs/emails, and a systematic mobile alignment audit that fixed five real overflow bugs.

### 35.1 Tier-B tuition sweep — finished (`b78443ae`)

Resumed the resumable 7-country prior-year-tuition sweep that handoff #14 left at 92/2,933. Two-batch chained nohup (UK/USA/CA/AU/IE/NZ, then DE/FR/MY/UAE/NL/SG @ qs-max 500 — both at concurrency 6). Ran **12h 10m** wall clock (started 12 May 21:08 IST, finished 13 May 09:18 IST). Net: **1,239 new estimated-tuition fills** (vs ~850 projected — 45% over because the model hit credible sources at a higher rate than the pilot). DB coverage **59% → 69.7%** (1,897 → 3,158 estimated rows; total programs with a fee 4,724 → 5,583 / 8,007). Cost ~$36 (under the $50 worst-case). Ten batch-2 errors are transient and will be picked up by any future re-run thanks to the "already-estimated rows are skipped" invariant. `.claude/settings.local.json` gitignored as part of the same commit.

### 35.2 Psychology stream + "Others" free-text (`225b19e3` · `ee064b93`)

- `FIELDS_OF_STUDY` 18 → 19 — added **Psychology** after Social Sciences & Humanities. Migrated **29** programs whose `program_name` matches `/psycholog/i` from their old buckets (mostly Social Sciences) to `field_of_study: "Psychology"` via `/tmp/migrate_psych.py`. Without this the new dropdown returned 0 matches.
- New `OTHER_FIELD_SENTINEL` ("Others") in `FIELDS_OF_STUDY`. When the user picks it, a conditional text input appears (`StepAcademic.tsx`) writing to a new `StudentProfile.intended_field_custom`. Form validation enforces non-empty when "Others" is chosen.
- Scoring: when `intended_field === "Others"`, the strict hard-filter `allowedFields.has(p.field_of_study)` is replaced by a case-insensitive substring match against `field_of_study + program_name`. Empty custom text → zero matches (defensive even though form blocks submit).
- Helper `intendedFieldLabel(profile)` resolves the effective display name across admin tables, ProfileCard, submission email, result PDF — they show the typed stream (with " (Other)" suffix) instead of "Others".
- **BPS GBC question** (`ee064b93`): UK Psychology Masters in regulated specialisms (Health/Clinical/Counselling/Forensic/Educational/Occupational/Sport/Neuro) require BPS Graduate Basis for Chartered Membership. New `Program.requires_bps_accreditation?: boolean` field. New `StudentProfile.bps_accredited?: boolean` captured by a conditional Yes/No when Psychology + PG. Hard filter: when `bps_accredited === false`, programs with `requires_bps_accreditation === true` are excluded. Backfilled both UK PG psych programs in the DB (Portsmouth + Gloucestershire Health Psych MSc — both regulated).

Smoke-test: Psychology / PG / BPS-Yes → 8 matches; BPS-No → 6 (the two UK Health Psych MSc filtered out).

### 35.3 UK QS-500 Psychology PG sweep — IN FLIGHT at handoff (PID 10942)

Bespoke catalog of **45 UK universities** (QS ≤ 500, dedup'd, all with zero Psychology PG programs in the DB). Built per-university via a new `psych-deep-seed-finder.ts` that asks Claude (Sonnet + web_search) for the **complete set** of PG Psychology specialism URLs per uni (Clinical, Counselling, Health, Forensic, Educational, Occupational, Sport, Neuro, Cognitive, Developmental, Conversion MSc, generic MSc, etc.) rather than one flagship URL per `pg-fields-seed-finder.ts`'s default. Wrapper script: `/tmp/run-uk-psych-deep.sh`. Log: `/tmp/uk-psych-deep.log`.

**Earlier botched run:** first launch shipped the wrong catalog because my regex-split-on-`}` over `programs.ts` returned multi-program chunks with mixed countries, so "Massachusetts Institute of Technology" landed in the cohort as `country: "UK"`. Killed at 25/45 (sunk ~$2 in seed-finder), rebuilt the catalog with per-`university_name:` chunking, relaunched cleanly.

**Status at handoff:** Phase 1 (deep seed-finder) → done. Phase 2 (verify-batch Opus 4.7 concurrency 5 `--skip-existing`) at **280/283** entries · ok=259 / rejected=20 / err=1 · process running 4h+. Once it crosses 283 the wrapper auto-runs merge → BPS regex tag → tsc → commit → push. **Likely landing within 5 min of the next session start.** Next session should `tail -3 /tmp/uk-psych-deep.log` first.

### 35.4 Matching-algorithm refinements

Several smaller tweaks landed and one back-and-forth that ended where it started:

- **Intake hard filter** (`78e8067d` → `7c914822`): briefly tightened so programs with empty `intake_semesters` were also excluded. User reverted — those should stay visible labelled "Intake to be checked" rather than the previous "Intake not offered". Final state: hard filter only excludes the explicit-mismatch case (non-empty list AND missing target). Empty/missing data → score 60 → labelled "Intake to be checked".
- **Std test scoring + UI** (`a580191b`): programs with no published `min_gre / min_gmat / min_sat` now score 100 on the std_test signal and the chip reads **"Not required"** (strong/green) regardless of the user's test state. Previously these programs read as red gaps for any PG candidate who didn't take a test, penalising the student for a non-requirement. Threaded `stdTestRequired` boolean into `SignalChip → getVerdict`. Smoke-tested at 20 strong / 0 partial / 0 gap on a fall/CS PG profile.
- **Intake "to be checked" label** (`7c914822`): replaces the previous "Intake not offered" copy on the empty-data branch.
- **English-test rendering** stays as-is from handoff #14.

### 35.5 Tier-threshold debate → restored prestige-adjusted (`61dd8c82` → `81598ee3`)

User flagged the matching shortlist as "buggy" — a 76% match at QS#234 Loughborough landed in Safe while an 80% match at QS#30 Stanford landed in Reach. Diagnosed and disclosed that this was the **QS-prestige-adjusted thresholds** introduced in `edf3b9b3` (13 Apr 2026, pre-session — none of my commits touched it). First reverted to flat 75/50 thresholds (`61dd8c82`). User asked for a fuller explanation, then said "restore prestige adjustment + go with Option A: better data for QS top-100" — see §35.6. Restored verbatim in `81598ee3`. Future tuning to live alongside / replace the adjustment once realistic-admit data lands.

### 35.6 Realistic-admit top-100 sweep (Option A) — DATA UNCOMMITTED (see §35.16)

To compensate for the published-min flatness across QS buckets (median `min_gpa` is 3.00 across QS 1-25 and QS 700+ alike — universities don't publish realistic admission bars, the prestige adjustment was a heuristic patch), Option A re-extracts realistic median-admit profiles per university.

- New `Program.realistic_min_*` optional fields (`_gpa`, `_percentage`, `_ielts`, `_toefl`, `_gre`, `_gmat`, `_sat`) plus `realistic_source` + `realistic_extracted_at`. Scoring (`programMinToPercentage` + new `effectiveMin` helper for english/std_test) **prefers `realistic_min_*` over `min_*`** when present; the published `min_*` stays untouched for provenance.
- New `realistic-admit-extractor.ts` — per-uni Sonnet + web_search call asks for typical median admit profile (USNews medians, university class-profile pages, UCAS tariff bands, ATAR cutoffs, etc.). Banned sources: Reddit / Quora / forum posts / undated figures.
- New `merge-realistic-admit.ts` — applies the per-uni audit to **all programs at each uni** via the per-`university_name:` split pattern, writing `realistic_*` fields after `program_url`.
- Catalog: 88 unis QS ≤ 100 → 4 with `qs_ranking: 0` (Canadian colleges, no QS rank) filtered out → final cohort **84 unis** covering ~1,621 programs. Wrapper script `/tmp/run-realistic-admit.sh`, log `/tmp/realistic-admit.log`. Cost ~$8.

**Status at handoff:** Phase 1 + Phase 2 (merge) completed; **1,623 program entries now carry `realistic_extracted_at` in the working tree**. Phase 4 (stats) Python f-string had a backslash-in-expression syntax error so `set -e` aborted before commit. Changes are uncommitted (`git status` shows `M src/data/programs.ts`). Next session must commit these — and crucially watch for the UK psych sweep's final flush overwriting them.

### 35.7 Auth UX rebuild

- **Inline password set after OTP** (`3232b069`): the register flow now has three steps — details → OTP → password. After OTP verifies, the form transitions to a password input with live strength checklist (≥8 chars / letter / digit / special). Skip-link below the primary button takes the user to /profile without setting a password (they can still use OTP forever). Header copy adapts per step.
- **Session-aware /get-started** (`1127236f`): when already signed in, `/get-started` does `router.replace("/profile")` instead of showing the chooser. Fixes the "I logged in, went home, clicked Get Started, it asked me to log in again" complaint.
- **Homepage Logout button** (`1127236f`): `LogoutButton` (existing) injected into hero nav between "Why choose us" and "Get started", self-hides when no session. Dark-hero styling.
- **24h idle auto-logout** (`1127236f` → `f2f09000`): new `IdleLogout` invisible component mounted from `layout.tsx`. Tracks user activity (mousemove / keydown / click / scroll / touchstart / wheel, throttled to one write per 5s). Polls every 5min; once `Date.now() - last_active > 24h` and the user is signed in, hits `/api/auth/logout`, clears localStorage, redirects to `/?idle=1`. (Shipped first at 60min, bumped to 24h same session per user request.)
- **ChangePasswordButton** (`e2ec603f`): new component sitting in homepage nav beside `LogoutButton`. Self-hides for anon visitors. Opens a modal with three fields (current / new / confirm) — current_password posted to `/api/auth/set-password` which 401s if wrong. Replaces the inline `SetPasswordCard` that used to live on /profile (now removed from there).
- **Profile auto-fill of nationality + city** (`4e25eb5f`): the prefill useEffect now reads `nationality` + `city` from `localStorage.eduvian_student` alongside name/email/phone, and the submit handler writes them back. Fixes the "I keep retyping these every visit" complaint.
- **Work-exp years dropdown** (`81ac9e4e`): replaced the number input with a Select (0–30 years + "Select years" placeholder). Two bugs fixed simultaneously — `value={profile.work_experience_years ?? ""}` was stuck on 0 because nullish-coalescing doesn't fire on 0, and mobile browsers don't render the desktop number-spinner chevrons.

### 35.8 Hero headline carousel (`11f2623a`)

Replaces the static `"You only decide this once."` headline + subhead + signature with a **5-slide auto-rotating carousel** (7s interval, AnimatePresence crossfade). Each slide has a bold first line, an italic second-line complement, and a body paragraph. Copy locked by user (verbatim — see commit body). Dot indicators below mirror the RHS sample-card dot pattern; click to jump. Min-height guard prevents CLS as line counts vary.

Section-2 headline also reworked: `"One platform. Two audiences. Same verified data."` → **"Students and parents on one trusted platform."** with `Students and parents` carrying the violet-italic accent (`db335421` after `e29cf8ac`).

### 35.9 Brand cleanup

- **"Your Global Future, Simplified" purged** everywhere it rendered as a visible page subtext (`4eac4d02`): 6 user-facing pages — `/results/[token]`, `/profile`, `/application-check`, `/english-test-lab`, `/sop-assistant`, `/application-tracker`. Admin and `<title>` metadata kept the brand name for SEO. PDFs and emails also re-skinned (`09b6cf7a`): inline violet-`e` SVG logo + `"Independent study-abroad intelligence"` subtitle, no `eduvianAI` wordmark in headers. Touches `api/pdf/[token]`, `api/pdf/tools`, `api/auth/send-otp`, `api/email/route`, `api/email/welcome`, `api/email/tools`, `layout.tsx`, `admin/page.tsx`.
- **Logo tagline** (`c5f74882` → `628fe868` → `57301fbc`): restored from pre-v2 brand history, then tightened to **"Independent study-abroad intelligence"**, then made visible on mobile.
- **Hero eyebrow** (`fc5d06d3`): `"Independent AI-powered study-abroad decision intelligence"` → **"AI-powered. Independent. Verified at source."**
- **Hero nav fix** (`15e22d34`): nav was `position: absolute; top: 0` but its containing block resolved to viewport, so it sat at viewport y=0 — behind the BetaBanner (z-100) + SecurityNoticeBanner (z-99) stack. Moved the nav INSIDE the hero `<section className="relative …">` so `top: 0` anchors to the hero instead. Also wired in `public/logo.svg` (the file existed but the homepage nav was wordmark-only).
- **Logo-only on non-home pages** (`f2f09000`): 13 files compacted — `BrandNav.tsx`, `AuthGate.tsx`, plus 10 page-level files. 32×32 SVG mark only, no wordmark, no tagline. Mobile content no longer pushed off-screen by wordmark width.
- **Tier-coloured match score** (`09b6cf7a`): the score circle on ProgramCard was keyed off absolute thresholds (≥80 green / ≥50 amber / <50 rose), but the tier badge uses QS-prestige-adjusted thresholds — they could disagree. Score colour now mirrors `program.tier` directly (safe → emerald, reach → amber, ambitious → rose).
- **Profile-evaluation interstitial** (`09b6cf7a`): `ProfileCard` lifted out of `/results/[token]` into its own `/profile-evaluation/[token]` page. After profile submit, user lands there first; floating bottom-right CTA `"Continue to matched programs →"` proceeds to results. Login flow for returning users still goes directly to `/results/[token]`.

### 35.10 Source-proof badges on homepage sample cards (`102441af`)

The methodology page documented our source-verification model; the homepage cards didn't show it inside the decision UI. New `SourceProof` inline component renders **`SOURCE PROOF  [Official source] [AI estimate] · Last verified 8 May 2026`** + (for program-data cards) a `"Official page checked · Fee source available · Deadline source available"` line. Applied to all 4 hero RHS rotating cards and the 5 DEMOS panels in the `"See what you actually get"` section, with per-card badge mixes (Shortlist = Official+AI, App Score = User+AI, ROI = Official+AI, Visa = Official+Needs-verification, etc.). Reuses the existing `DataBadge` primitive (5 kinds: Official source / AI estimate / User provided / Needs verification / Illustrative).

### 35.11 ROI tools — missing-fee inputs (`20c31ac1` · `87466eb3`)

The standalone `/roi-calculator` and the inline ROI panel on each match card (`InlineProgramROI`) silently passed null tuition through to `calculateROI`, producing "2.2 yrs payback / +2198% 10-yr ROI" on programs with no verified fee.

- New `EditableFeeRow` on `/roi-calculator`: renders as the read-only `AutoFilledRow` when the program carries the figure, and switches to an amber-highlighted editable input (with "Needs input" pill + one-line prompt) when the value is 0/null. Replaces the static Tuition and Living rows.
- Added `programHasLiving / livingUserSupplied / livingAvailable` to mirror the existing tuition gating. `canCalculate` now requires both `tuitionAvailable AND livingAvailable`. Right-panel placeholder reads **"Please input Fees amount"** and lists exactly which field(s) are missing.
- User-supplied caveat banner expanded to handle either or both inputs.
- Same pattern ported into `InlineProgramROI.tsx` (the matched-card panel): when `programHasFee` is false, an amber input row appears with a strength prompt, and the metrics grid is replaced by a "Enter the annual tuition above to see payback period, 10-yr ROI, and break-even salary." placeholder.

### 35.12 Extract-text: pdfjs-dist fallback for stubborn CVs (`b26b7650`)

User reported "Could not extract text from this file" on real CVs. Two real failure modes weren't handled — pdf-parse throwing on quirky PDF formats, and image-only PDFs with no text layer.

- Wrapped extraction in a two-stage chain: pdf-parse v2 first, pdfjs-dist (legacy build, no worker) on throw or empty. Worker resolved via `createRequire(import.meta.url).resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")` — empty `workerSrc` was throwing the second-fallback's `"No GlobalWorkerOptions.workerSrc specified"` error before.
- Both paths log their exceptions to `console.warn / error` so Sentry sees them.
- Image-only case (both paths return empty text) now returns a specific 422 message: *"This PDF doesn't have a selectable text layer (e.g. it was exported as image, scanned, or rasterised). Re-export with text preserved, or paste your CV / SOP content into the box below."*
- `pdfjs-dist` added to `serverComponentsExternalPackages` in `next.config.mjs`.

### 35.13 Application-check + sop-assistant — uniform required marker (`e2ec603f`)

11 occurrences of the red-text `<span className="text-red-500 text-xs">(required)</span>` / `(REQUIRED)` swapped for the asterisk pattern `<span className="text-rose-500" aria-label="required">*</span>` used by the profile form. `/tmp/strip_required.py` did the batch. Visually consistent across the platform now.

### 35.14 Floating "Get started" CTA + chatbot relabel + path-aware AISA (`1fdada82` · `c191b328` · `fe01680a` · `12b6d9e5`)

- **Chatbot label** ("Chat with AISA" → "Ask AISA when you are stuck" → "Stuck? Ask AISA" → smaller across modes via shrinking from w-14/h-14 to w-12/h-12 + tighter pill padding + softer shadow).
- **Floating Get-started CTA** on the homepage (`c191b328`): new `FloatingGetStartedButton` mounted from `layout.tsx`, hidden until scrollY > 600px and on `/get-started` / `/profile`. Fixed top-right `top-[88px]` (below banner stack), violet pill matching primary CTA style.
- **Path-aware AISA mode** (`fe01680a`): `usePathname` in `ChatWidget` toggles **compact icon-only** mode on tool/result paths (10 prefixes) — full pill stays on home/destinations/scholarships. 30s idle pulse so AISA stays discoverable in compact mode.

### 35.15 Mobile alignment audit (`94b43dbe` → `172fe407` → `edb47fdf` → `12b6d9e5`)

Triggered by repeated user complaints about mobile rendering. Swept all public pages at 375×812 via Playwright-style DOM queries; found and fixed:

- **Navs sitting behind banner stack** (`94b43dbe`): `/profile-evaluation/[token]` + `/results/[token]` used `fixed top-0` but the BetaBanner (z-100) + SecurityNoticeBanner (z-99) own that coordinate. Anchored each nav via the CSS variables those banners publish: `style={{ top: "calc(var(--beta-banner-h, 0px) + var(--security-notice-h, 0px))" }}`. When banners are dismissed, the calc resolves to 0 and the nav slides up cleanly.
- **Results nav overflow on mobile**: 5 controls in a single row truncated on 375px. On mobile: hide "Security" + "Modify Profile" labels, icon-only Email + PDF Shortlist buttons (count badge preserved), tighter px-4 nav padding.
- **`/roi-calculator` grid min-content trap** (`172fe407`): two-panel `lg:grid-cols-5` children were 439px wide on a 375px viewport, clipping inputs. CSS Grid children default to `min-width: auto` (= min-content), so long uni names forced the tracks wider. Added `min-w-0` to both motion.div grid children.
- **`/profile` framer-motion overflow** (`172fe407`): the form's per-step card had `initial={{ x: 30 }}` / `exit={{ x: -30 }}` which on mobile pushed it 30px past the right edge during animation. Replaced with pure opacity fade.
- **`/english-test-lab` decorative blurs** (`172fe407`): two `blur-3xl` blobs visible on mobile — the CLAUDE.md known GPU repaint issue. Added `hidden md:block aria-hidden`.
- **Action-row stacking** (`fe01680a`): the per-card Shortlist / Compare / Program Details / Apply Now row wrapped badly below sm ("Program Det…" truncating). Stacks full-width below sm now.
- **ComparePanel header tightened** (`edb47fdf`): px-4 sm:px-6, gap-3 + min-w-0 + truncate on the title block, flex-shrink-0 on the close button.
- **Program Details button** (`edb47fdf`): rebody'd to `border-2` matching Shortlist / Compare so it reads as a peer action.
- **Compare per-card label** (`edb47fdf`): "✓ Comparing" → "✓ Added" — old label read as "comparison started" (it doesn't — adding requires ≥2 + the sticky-bar Compare click).
- **No-results panel compact on mobile** (`12b6d9e5`): the "No safe/reach/ambitious matches" empty state was a py-10 stacked block. Collapsed to a single-row pill (`flex items-center py-2.5`) so empty tiers don't push the next tier below the fold.

Pages confirmed clean at 375×812: `/`, `/destinations`, `/methodology`, `/scholarships`, `/parent-decision`, `/visa-coach` (table has its own `overflow-x-auto`), `/application-check`, `/sop-assistant`, `/interview-prep`, `/get-started`.

### 35.16 Working-tree state at handoff #15

Last commit on `main`: `12b6d9e5`. Working tree **NOT clean**:
- `M src/data/programs.ts` — 1,623 entries carry uncommitted `realistic_extracted_at` + `realistic_min_*` fields from the §35.6 sweep merge. The UK psych sweep (§35.3, PID 10942) is still running and its final `[flush]` writes the file with its own in-memory copy (loaded before the realistic-admit merge). **Race risk**: when UK psych's wrapper auto-commits, the realistic-admit fields may be overwritten.
- Two background processes:
  - **PID 10942** — UK psych deep sweep, at 280/283, ~4h+ elapsed. Auto-commits + pushes when done.
  - Realistic-admit wrapper has exited (Python f-string syntax error in the stats Phase aborted at `set -e`).

**Recovery if UK psych overwrites the realistic-admit fields:** re-run the merge step — the audit JSON (`scripts/verify/output/realistic-admit-top100.json`, 84 unis, 79 KB) is on disk and committed via the wrapper's `git add`. Single command: `npx tsx scripts/verify/merge-realistic-admit.ts --input scripts/verify/output/realistic-admit-top100.json`. No new API spend.

### 35.17 Pinned open work for handoff #16

**Tier-A (no API spend, user-driven):**
1. **End-to-end QA of the new inline-password register flow** — register fresh email → enter OTP → set password on the same screen → land at `/profile-evaluation/<token>` → click "Continue to matched programs" → land at `/results/<token>`. Skip-password path: same flow, click "Skip — I'll set one later", land at `/profile`.
2. **Change-password QA** — click `Change password` in homepage nav → modal opens → enter correct current + new + confirm → server changes hash → toast `"Password changed."`. Wrong current → 401 → toast `"Current password is incorrect."`.
3. **Mobile sanity sweep on real device** — the audit at §35.15 was Playwright-style DOM-query-based; user should verify a real phone (iOS Safari + Android Chrome) renders correctly. Particular attention to `/results/[token]` nav controls and the per-program action-button stack at < sm.
4. **Live mic test on USA + AU interview-prep flows** (carried over from handoff #14 — still pending).
5. **Confirm `security@eduvianai.com` mailbox** exists or forwards to `privacy@` (carried over from handoff #14).

**Wrap-ups (likely first 10 min of next session):**
6. **Verify UK psych deep sweep landed** (PID 10942). `tail -3 /tmp/uk-psych-deep.log` should show `=== DONE` + `git log --oneline -3` should show the auto-commit. If not, the wrapper crashed and needs a manual finish (merge + BPS tag + tsc + commit + push).
7. **Commit realistic-admit data fill** (§35.16). May require re-running the merge if UK psych overwrote.
8. **Wire prestige adjustment to taper as realistic-admit data lands** — with realistic minima now driving score lower at top schools, the QS-prestige-adjusted thresholds can be relaxed (smaller `safeMin` deltas across buckets) or removed. Run a sanity pass: 20 PG / CS / fall matches with realistic-admit data committed, eyeball that high-QS schools score correctly LOWER than mid-QS schools. Tune thresholds based on what's needed.

**Tier-B (API spend, await explicit go):**
9. **Resume/continue any specific data sweeps** — none planned, sweep #1 finished and #2 is in flight finishing this session.
10. **USA fee uplift beyond 78%** — Tier-B #9 from handoff #14. Residential proxy ($50/mo). Still skipped pending explicit user authorisation.

**Tier-D security / ops:**
11. **M1 CSP** — drop `unsafe-inline` / `unsafe-eval`. 4-6 wk Next.js refactor; roadmap decision needed.
12. **M3 Zod input validation** — 0/28 routes; cross-cut. ~1-2 days.
13. **M5 Secrets rotation policy doc** — 90-day cadence for ANTHROPIC_API_KEY, SUPABASE_SECRET_KEY, RESEND_API_KEY, ADMIN_SESSION_SECRET. Doc-only.
14. **M7 + L3 legal-doc edits** — Privacy Policy §2.2 (tool_usage IP disclosure) + §6 (SCC citation). Touches `scripts/build-legal-docs.js`; **don't push** without attorney sign-off.
15. **L5 verified_at HMAC signing** — schema + writer rework. Defer.
16. **I3 Incident response plan** — required for ISO 27001 roadmap.
17. **I2 + I4** — bug bounty / VRP + pen-testing schedule. Pre-launch.

**Tier-C (product surface — open ask from this session):**
18. **Button hierarchy reorder on ProgramCard** (deferred from §35.15 polish batch) — promote "View ROI Analysis" to primary visual treatment, demote Apply Now to terminal action. User said "ship 1-4 only" but acknowledged this is the biggest UX lever in the batch; revisit when ready.

### 35.18 Estimated remaining API spend across open items

~$0 unless Tier-B #10 (USA proxy subscription) gets greenlit. Everything else is code or docs.

Vercel deploys all 31 commits via Git push. Build time on data-heavy commits (programs.ts) runs ~3-4 min vs ~1-2 min for code-only. `/api/version` returns the latest SHA — useful for confirming any specific deploy.

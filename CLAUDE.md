# CLAUDE.md — eduvianAI operating rules

This file is loaded automatically. The full project state, decisions, and rationale lives in [STATE_SNAPSHOT.md](STATE_SNAPSHOT.md) — read it first when you join a new session.

## What this is

Next.js 14 (App Router) study-abroad platform deployed to Vercel at https://www.eduvianai.com. Postgres + RLS in Supabase Cloud (US, Pro plan). Anthropic Claude for AI features, Resend for transactional mail, Sentry for errors. 12 destination countries, **9,298 programs / 9,298 verified at the source (100.0%) / 21 streams / ~636 universities (419 in universities sidecar — 218 USA + 121 UK + 70 Canada + 10 Singapore) / ~69% with international tuition fee** as of 17 May 2026 (handoff #18). Beta-gated to 100 NEW unique users / month (returning users skip) under $20/mo Anthropic spend ceiling. Email OTP **and** password (scrypt) both gate register / login.

**Handoff #18 (15-17 May, 35 commits) — high-impact deltas the agent must know:**
- Profile-rating fully rewritten — weighted % scoring, 5-bucket star ladder (Weak / Average / Strong / Very Strong / Super Strong), colour-coded params, 3D wall UI. See [src/lib/profile-score.ts](src/lib/profile-score.ts) + `<ProfileCard>`.
- Match-score weights rebalanced: PG `Academic 0.45 / Budget 0.10` (was 0.35 / 0.20); UG Academic 0.50 (work_exp slot folded in).
- Bucket-specific implicit academic floor in [src/lib/prestige.ts](src/lib/prestige.ts) `implicitMin`: b0=85, b1=78, b2=70, b3=60, b4=50. Drives `scoreAcademic` when program publishes no min.
- Matcher hard-caps ambitious at 4 (no surplus reallocation into ambitious); per-uni cap: ambitious=1, safe/reach=2.
- Alias matching requires program_name keyword evidence + 407 bad aliases stripped + 284 primary fields reclassified.
- "Arts, Design & Architecture" retired → "Arts and Design"; "Architecture" stays its own stream.
- Multi-pick intended field of study (up to 3 streams) via `intended_field_extra?: string[]`.
- Cross-device: GET `/api/profile-preload` (returning-user prefill from latest submission) + GET/PUT/DELETE `/api/profile-draft` (autosave every 1.5s, encrypted). **⚠️ `20260515-profile-drafts.sql` MIGRATION PENDING in Supabase Studio.**
- Feedback survey (1-5 stars) on `/results`, `/application-check`, `/interview-prep`, `/visa-coach`. Admin dashboard widget. ✅ feedback-surveys SQL run.
- Stage 4 universities sidecar landed for Canada (70) + Singapore (10). Other 8 countries skipped per user.

## Operating rules — non-negotiable, every session, no exceptions

These ten rules govern every response, every patch, every commit. If a rule conflicts with a request, the rule wins; surface the conflict to the user.

1. **Think before coding.** Don't assume. Don't hide confusion. State ambiguity explicitly. Present multiple interpretations rather than silently picking one. Push back if a simpler approach exists. Stop and ask rather than guess.
2. **Simplicity first.** No features beyond what was asked. No abstractions for single-use code. No "flexibility" that wasn't requested. No error handling for impossible scenarios. The test: would a senior engineer say this is overcomplicated? If yes, rewrite it.
3. **Surgical changes.** Don't "improve" adjacent code. Don't refactor things that aren't broken. Match the existing style even if you'd do it differently. If you notice unrelated dead code, mention it, don't delete it. Every changed line should trace directly to the request.
4. **Goal-driven execution.** Transform "fix the bug" into "write a test that reproduces it, then make it pass." Transform "add validation" into "write tests for invalid inputs, then make them pass." Give it success criteria and watch it loop until done.
5. **Always give factual information about this website. Never make things up or use artificial placeholders.** This rule is absolute — no exceptions, ever. If the source-of-truth value isn't known, say so; do not invent.
6. **Use the model only for judgment calls.** Use Claude for: classification, drafting, summarization, extraction from unstructured text. Do NOT use Claude for: routing, retries, status-code handling, deterministic transforms. If a status code already answers the question, plain code answers the question.
7. **Surface conflicts, don't average them.** If two existing patterns in the codebase contradict, don't blend them. Pick one (the more recent / more tested), explain why, and flag the other for cleanup. "Average" code that satisfies both rules is the worst code.
8. **Read before you write.** Before adding code in a file, read the file's exports, the immediate caller, and any obvious shared utilities. If you don't understand why existing code is structured the way it is, ask before adding to it. "Looks orthogonal to me" is the most dangerous phrase in this codebase.
9. **Checkpoint after every significant step.** After completing each step in a multi-step task: summarize what was done, what's verified, what's left. Don't continue from a state you can't describe back to me. If you lose track, stop and restate.
10. **Fail loud.** If you can't be sure something worked, say so explicitly. "Migration completed" is wrong if 30 records were skipped silently. "Tests pass" is wrong if you skipped any. "Feature works" is wrong if you didn't verify the edge case I asked about. Default to surfacing uncertainty, not hiding it.

## Hard rules — never do without explicit user approval

1. Re-add Switzerland or any country outside the 12 in scope.
2. Deploy pricing infrastructure (it was ideation only — see snapshot §6.2).
3. Push the legal pages (terms / privacy / disclaimer) — awaiting attorney sign-off.
4. Use Haiku 4.5 or Sonnet 4.6 in `scripts/verify/verify-program.ts`. Both fabricate values — Opus 4.7 only.
5. Override the `merge.ts` `TARGET_COUNTRIES` allowlist.
6. Use destructive git commands (`reset --hard`, `push --force`, `branch -D`).
7. Skip pre-commit hooks (`--no-verify`, `--no-gpg-sign`).
8. Modify Supabase schema in production. Write SQL files under `src/lib/migrations/`; user runs them in Studio.
9. Lose `PII_ENCRYPTION_KEY` or `PII_HASH_SECRET` — every encrypted submissions row becomes unrecoverable.

## Communication style

- Terse, structured, factual. Tables + bullets > prose.
- Numbers always: "138 programs", not "many".
- Lead with what changed, not what's about to happen.
- Never claim something is done until verified (`git log` after a commit, `tsc --noEmit` after a code change, `ps -p` after starting a job).
- Confirm destructive ops before running.

## Ping pattern

User pings ("ping" / "status?") to check long-running jobs. Respond with: PID + elapsed, last 3 log lines, progress + ETA, anything anomalous.

## Deploy semantics

User separates "commit" from "deploy" (push). Defaults:
- Validated, prod-intended code: commit AND push.
- Drafts (legal, pricing) or items needing review: commit, **DO NOT push**.
- Always note in the response which path was taken.

## Verification pipeline (programs.ts)

The 7,800-program database in `src/data/programs.ts` is built only by `scripts/verify/`. Hard rules:

1. **No hand-authored entries.** Adds go through the pipeline.
2. **No invented values.** If the live URL doesn't state a fee/deadline/cutoff, the field is `null`.
3. **`verified_at` is sacred** — set only by the pipeline after a live fetch.
4. `field_of_study` must be one of the 18 in `FIELDS_OF_STUDY`.
5. For high-stakes programs.ts edits, prefer `repair-corruption.ts`-style parse-and-emit over inline regex. Brace walkers must track strings (history: see snapshot §4.10).
6. `verify-program.ts` stays on Opus 4.7 (audited; Haiku/Sonnet fabricate).
7. **Fresh seeds via `websearch-seed-finder.ts` (Sonnet + web_search) hit ~75% verify pass-rate.** Stale `tier-N-auto.json` seeds (older crawler runs) hit ~5% — they're full of catalog/listing URLs. For new uni additions, always run seed-finder over a curated catalog first; don't reuse old auto-seeds.

Tier chain runner: `nohup ./scripts/verify/chain-tiers.sh tier-N > /tmp/chain-tN.log 2>&1 &`.

## Code style

- TypeScript strict mode. `npx tsc --noEmit` must pass before commit.
- `npx next build` must pass before push (Vercel email storms otherwise).
- Imports: `@/lib/...`, `@/components/...`.
- API routes: validate input, return `NextResponse.json`, use `apiErrorResponse()` from `src/lib/api-error.ts` for failures.
- React components: function only, no classes.
- Comments: short, "why" not "what".
- Copyright trailer on every commit:
  ```
  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  ```

## Security posture (post-audit, 3 May 2026)

Audit document: `~/Desktop/EduvianAI-Security-Architecture-Risk-Assessment.docx`. Status:

- **All four critical** (C1 admin session, C2 submissions IDOR, C3 rate-limiter, C4 LLM injection) — closed and verified in prod.
- **All HIGH** except H7-Phase-C closed:
  - H1 admin TOTP MFA: enrolled and verified — login flow now challenges for the 6-digit code.
  - H2 opaque sessions, H3 CSRF gate, H4 DPDPA endpoints, H6 output encoding — closed.
  - H5 service-role overuse — closed-with-rationale (subsumed by C2).
  - **H7 PII encryption: ALL phases done.** Phase A + B + C code all live; Phase C destructive SQL was run; `profile` column dropped. Two zombie rows (5 May 2026) inserted with null encryption via a NODE_ENV-gated dev/preview hole — deleted manually, writer patched to skip the Supabase insert when encryption inputs are missing (regardless of NODE_ENV, commit `dace04fa`). Sentry `8bfc0387` (`/api/results/[token]` crash on null profile) closed by 410-on-decrypt-fail in `18c47658`. Live `submissions` table is clean.

`submissions` rows carry only `profile_encrypted` + `email_hash` for PII. Lookup by email goes through `email_hash` only. The writer guard now refuses to insert any row without both fields set — no NODE_ENV exemption.

**MEDIUM / LOW pass (12 May 2026):** Nine findings closed in production across handoffs #13 and #14 — M4 IP-header trust (`106e364f`), M6 admin audit log (`99c7b2d4` + SQL `20260512-admin-audit-log.sql` applied; chain verified end-to-end), M8 rate-limit sweep across all 28 API routes (`99c7b2d4` admin slice + `9cd3992f` 10-route sweep), M9 Dependabot (`8b2bb998`), L2 chat hardcoded country counts (`47e6f7c8`), L4 constant-time admin/session (`2d478305`), L6 x-request-id propagation (`c15aaf14`), **I1 `/.well-known/security.txt` + `/security-policy` page (`591c25f1`)**, **`students_public_insert` RLS dropped (`5fcabe5a` + SQL applied)**. M2 was already closed (Email OTP). Still open: M1 (CSP), M3 (Zod), M5 (rotation policy doc), M7+L3 (legal-doc edits, attorney-gated), L5 (verified_at HMAC), I2/I3/I4 (informational pre-launch items).

## Authentication

- Email OTP gates `/api/auth` register and login. 6-digit codes hashed with HMAC-SHA256 keyed on `PII_HASH_SECRET`. 5-min expiry, 5-attempt lockout, 60s resend cooldown. See `src/lib/otp.ts`.
- Cookie is opaque UUID (H2) → resolves via `user_sessions` table.
- `LogoutButton` clears server session + localStorage; visible on `/profile` and `/results/[token]`.
- Admin login: email + password → 6-digit MFA code → HMAC admin cookie. Server enforces AAL2 in `/api/admin/session`.
- Admin enrols MFA at `/admin/security` (QR code or manual secret).

## Key code paths

| Path | What |
|---|---|
| `src/data/programs.ts` | THE database. **7,800 entries / 7,737 verified.** `@ts-nocheck` (large data file). |
| `src/data/db-stats.ts` | Computed counts. Public surfaces standardise on `verifiedProgramsLabel` (7,986+) and `verifiedUniversitiesLabel` (534+) — `programsLabel` (the unverified-tail total) is internal-only. Don't reintroduce dual numbers in copy. The DB is 100% verified as of handoff #12.5 — `programsLabel === verifiedProgramsLabel` for now. |
| `src/app/sample-parent-report/page.tsx` | Static, illustrative parent-decision report at `/sample-parent-report`. Print-friendly (Save-as-PDF button). Linked from the Decide-stage 'See sample family report' CTA. |
| `src/app/page.tsx` | **The homepage** (post v2 → / swap, 5 May 2026). v2 brand redesign + 8-section structure now serves at `/`. Pre-swap homepage backed up at `_archive/page-pre-v2-swap.tsx.bak`; pre-swap `src/app/v2/` preserved (un-routed) at `src/app/_v2-archive/page.tsx` for reference. |
| `src/lib/types.ts` | Single source of truth. `TARGET_COUNTRIES` (12), `FIELDS_OF_STUDY` (18). |
| `src/lib/scoring.ts` | 9-signal `recommendPrograms()`. Tiers: Safe 75-100, Reach 50-74, Ambitious <50. |
| `src/lib/format-fee.ts` | Null-safe tuition rendering. **Never show $0.** Prefers local currency (`£26,600`) with optional USD parenthetical via `opts.withUsd` — backed by `annual_tuition_amount` + `annual_tuition_currency` on Program. Schema also keeps the legacy `annual_tuition_usd` for filtering / aggregation. |
| `src/lib/beta-gate.ts` | Per-tool monthly caps + global $20 spend cap. Unique-user counter dedups on (email, phone) over `students` rows from this month — returning users (registered before this month) skip the new-user cap entirely. |
| `src/lib/rate-limit.ts` | Upstash sliding-window with in-memory fallback. Must never throw. |
| `src/lib/user-cookie.ts` | Opaque server-side sessions (H2). |
| `src/lib/pii-crypto.ts` | AES-256-GCM + emailHash for H7. |
| `src/lib/otp.ts` | OTP generate / hash (HMAC) / verify (timing-safe). |
| `src/lib/submissions-decrypt.ts` | H7 reader helper. `decryptProfile()` decrypts `profile_encrypted` only — plaintext fallback was removed in Phase C. Use everywhere submissions are read. |
| `src/lib/html-escape.ts` | `escHtml` / `escHtmlBounded` / `safeUrl`. Use for any user-content interpolation. |
| `src/lib/llm-safety.ts` | `wrapUserInput`, `JAILBREAK_GUARDRAILS`, `MAX_OUTPUT_TOKENS`. Append guardrails to every system prompt. |
| `src/lib/api-error.ts` | Sentry-flushed error response. Eager Sentry init lives here. |
| `src/middleware.ts` | Same-origin CSRF gate + admin route protection. `ALLOWED_HOSTS` is the safelist. |
| `src/components/LogoutButton.tsx` | Renders only when signed in. Hits `/api/auth/logout`, clears localStorage, routes to /. |
| `src/components/DecisionDisclaimer.tsx` | In-context disclaimers on tool pages — five variants (roi, visa, english-test, shortlist, scholarship). |
| `src/components/HowItWorksModal.tsx` | Video walkthrough modal triggered from "How it works" buttons in nav + footer. Reuse on deep tool pages. |
| `src/components/AuthGate.tsx` | Wraps tool pages that need login. Back-to-home pill is **top-right** (moved 5 May), not bottom-center. |
| `src/components/BrandNav.tsx` | Reusable v2-brand top nav (dark variant for over-hero, light for over-content). Used by ported deep pages; reuse on any future page port. |
| `src/components/BrandHero.tsx` | Reusable dark-navy hero block matching `/destinations` + `/methodology`. Exports `accent(text)` helper for italic violet-300 emphasis inside titles. |

## Email deliverability monitoring

- **Google Postmaster Tools** is verified for `eduvianai.com` (3 May 2026) — dashboards at https://postmaster.google.com show domain reputation, spam rate, auth pass-rate. Sparse at beta volume; check weekly. Spike on Spam Rate (>0.1%) or Domain Reputation drop = investigate before reputation tanks.
- Microsoft SNDS does NOT apply (Resend owns the sending IPs, not us). Monitor Outlook/Hotmail signals via the Resend dashboard (`complaints` count per recipient domain).
- All transactional sends include a plain-text alternative + `List-Unsubscribe` headers; OTP subject deliberately omits the code (looks like phishing to filters otherwise).

## Environment quirks

- macOS Bash 3.2 — no `${VAR^}` (uppercase first), no `${VAR,,}`, no associative arrays. Shell scripts must be portable.
- `instrumentation.ts` doesn't reliably fire on Vercel — eager `Sentry.init()` in `api-error.ts` is the actual capture path. Don't remove it.
- `NEXT_PUBLIC_*` vars are visible in the browser — never put secrets there.
- After deleting any `src/app/...` route, `rm -rf .next/types/app/<that-path>` before re-running `chain-tiers.sh` or it'll fail at type-check.
- `npx next build` clobbers the dev `.next/` cache — the `npm run dev` server then serves 404s for `/_next/static/*`. Always `rm -rf .next && (restart dev)` after running a production build, or the dev preview will silently SSR-only with no React hydration.
- Vercel coalesces back-to-back pushes into a single deployment if the second arrives mid-build. If a deploy doesn't trigger after a push, an empty `git commit --allow-empty` + push retriggers cleanly. (`vercel --prod --yes` from CLI hits a free-tier upload-rate limit, so the empty-commit trick is the fallback.)

## Mobile rules of thumb (learned the hard way)

- **Decorative `blur-3xl` / `blur-2xl` / `blur-[Xpx]` blobs cripple mobile GPU compositing.** Each one repaints as it scrolls into view. We had 23 of these on the homepage and they were the root cause of the section-flash-on-scroll bug. Fix: every decorative blur (any div with `pointer-events-none` + `blur-*`) carries `hidden md:block` so it only renders from md+. Don't add new mobile-visible blur blobs.
- **`whileInView` from framer-motion attaches an IntersectionObserver per element AND fires a re-render** when triggered, even with `transition={{ duration: 0 }}`. With 40+ motion elements that's perceptible jank. Use plain `motion.div` (no whileInView/initial/viewport/transition props) for entrance fades. The `<MotionConfig transition={{ duration: 0 }}>` wrapper around `LandingPage` is a belt-and-suspenders for any motion props that slip back in.
- Always set explicit `width="X" height="Y" loading="lazy" decoding="async"` on user-visible `<img>` tags — Unsplash images otherwise cause CLS as they resolve.
- Per-stage mobile accordions (`mobileOpenStages` Set state in `LandingPage`) collapse Stage 2/3/4/5 detail behind a 'Show Stage X details' toggle. Stage 1 always shows. Use the same pattern for any new long detail blocks.

## Skills available

- `claude-api`, `docx`, `xlsx`, `pdf`, `pptx`
- `simplify`, `fewer-permission-prompts`, `loop`, `schedule`, `update-config`

The legal/security/pricing Word docs were generated with `docx`. Pricing Excel via `xlsx`. To regenerate legal: `node scripts/build-legal-docs.js`.

## Open work for the next session (handoff #18, 17 May 2026)

Pinned in priority order. Snapshot §38 has full handoff-#18 detail. **No background processes. Working tree clean.** Last commit: `5bcdea4b` (tune: implicit floors — relax b1..b4, keep b0).

**URGENT — operational:**

1. **Run `src/lib/migrations/20260515-profile-drafts.sql` in Supabase Studio.** Until done, the cross-device draft autosave 500s in prod. Feedback-surveys migration already run (16 May).

**Tier-A — user-driven QA (no API spend):**

2. End-to-end QA of inline-password register flow (carry-over from #15)
3. Change-password modal QA from homepage (carry-over)
4. Mobile sanity sweep on real iOS Safari + Android Chrome
5. Live mic test USA + AU interview-prep flows (carry-over from #13)
6. Confirm `security@eduvianai.com` mailbox routing (carry-over from #14)
7. **NEW — End-to-end QA of cross-device profile prefill** (730608f0 + 684a89f1): submit on desktop → sign in on mobile → verify fields auto-fill. Once migration #1 lands, also verify draft autosave syncs mid-form.
8. **NEW — Verify feedback-survey modal** pops on all 4 surfaces, submits succeed, admin dashboard populates.

**Tier-B — API spend (await explicit go):**

9. USA fee uplift beyond 78% — residential proxy ($50/mo). Skipped.
10. Tuition estimate for 2,907 missing programs via `estimate-fees.ts` (Sonnet + web_search). ~$20-$290 by scope.
11. ~~Stage 4 sidecar for 8 remaining countries~~ — **USER SAID NO** after CA+SG smoke (17 May). Rest would be ~$155 for ~199 unis, low value because acceptance rates aren't published in those markets.

**Tier-C — product surface (low priority):**

12. **Universities-sidecar UI surfacing** — sidecar now has 419 rows (acceptance + earnings + outcomes etc) but only `acceptance_rate` is wired into scoring. ComparePanel shows Acceptance Rate row; ProgramCard could surface TEF / NSS / Russell Group for UK + Maclean's tier / median earnings for CA + median_earnings_6yr_usd for USA. Parent Decision tool could pull live earnings data instead of static ROI tables.

**Tier-D — security & ops (all carry-over):**

13. M1 CSP (4-6 wk Next.js refactor)
14. M3 Zod input validation
15. M5 secrets rotation policy doc
16. M7 + L3 legal-doc edits (attorney-gated)
17. L5 verified_at HMAC signing
18. I3 incident response plan
19. I2 + I4 bug bounty + pen-testing schedule

**Pipeline ops:**

20. Vercel env checks — confirm `MAX_MONTHLY_SPEND_CENTS` isn't hard-set to 5000 (overrides the $20 default); add user's test email to `BETA_OWNER_EMAILS`.

**Carry-overs from #17 that landed in #18**:
- Verify-batch watchdog timeout — done (f962c093)
- Auto-run reclassify-cs-streams.py after merge.ts — done (f962c093)

**Estimated remaining spend:** ~$0 unless Tier-B #9/#10 get greenlit. Stage 4 sidecar deferred indefinitely per user decision.

**Handoff #18 spend tally:** $64.67 ($7.82 Singapore smoke + $56.85 Canada full run). All other 33 commits were $0 (code + UI + data-cleanup only).

## Universities sidecar (Stage 1+2+3+5 live as of #17)

`src/data/universities.ts` carries 339 entries: 218 USA from US Dept of Ed College Scorecard (free public API), 121 UK from Claude API + web_search across HESA / OfS / Discover Uni / Complete University Guide. Schema in `src/lib/types.ts` `University` interface includes acceptance_rate, median_earnings_{6,10}yr_usd, school_type, setting, enrollment_undergrad / total, graduate_outcome_salary_usd / employment_pct, ukprn, student_staff_ratio, nss_satisfaction_pct, tef_rating, russell_group, completion_rate_pct.

Stage 5 wired `acceptance_rate` into the prestige bucket helper at `src/lib/prestige.ts` — `scoreAcademic` + `scoreProgram` both consume it via `getPrestigeBucket(program)`. Falls back to QS rank where sidecar data is missing.

ComparePanel renders an "Acceptance Rate" row using `lookupUniversity(p.university_name)?.acceptance_rate`. Other sidecar fields not yet surfaced on UI (item 14).

`scripts/universities/`: fetch-scorecard-usa.ts, merge-scorecard-usa.ts, fetch-uk.ts, merge-uk.ts, usa-ipeds-overrides.json (47 IPEDS UnitID overrides for name-format mismatches), uk-russell-group.json (24-uni canonical list).

## Scoring weights (locked as of handoff #18, 17 May 2026)

| Signal | PG | UG |
|---|---|---|
| Academic         | 45% | 50% |
| Budget           | 10% | 10% |
| Std Test         | 10% | 10% |
| English          |  5% |  5% |
| Scholarship      |  5% |  5% |
| Intake           |  5% |  5% |
| Backlogs         |  5% |  5% |
| Gap Year         |  5% |  5% |
| Work Exp.        |  5% |  —  |
| Research paper   |  5% |  5% |
| **Sum**          | 100% | 100% |

Rationale: Budget weight dropped 20→10 (hard filter already excludes anything > 110% of budget — the soft signal only differentiates 3 active brackets, so 20% was over-powered). Freed 10pts went to Academic — strongest real predictor of admissions outcome. UG `work_experience` slot (irrelevant at undergraduate) folded into Academic, so UG Academic = 0.50 and sum cleanly = 1.00.

Research paper is collected from BOTH UG and PG profiles (split out of `{isGrad && (...)}` in StepAcademic on 14 May). Rubric: count 0 → 0, count 1 → 60, count 2 → 85, count ≥ 3 → 100.

**Prestige bucketing** — `getPrestigeBucket(program)` in `src/lib/prestige.ts`. Uses `acceptance_rate` from the universities sidecar where present (419 unis populated), falls back to QS rank otherwise. Five aligned buckets each carrying `prestigePenalty` (subtractive offset on academic), `safeMin` / `reachMin` (tier thresholds), and `implicitMin` (academic floor when program publishes no min):

| Bucket | acceptance% / QS | penalty | safeMin / reachMin | implicitMin |
|---|---|---|---|---|
| 0 ultra-selective | ≤10% / ≤25 | 20 | 92 / 70 | **85** |
| 1 selective | ≤25% / ≤75 | 15 | 89 / 66 | **78** |
| 2 moderate | ≤50% / ≤200 | 10 | 86 / 62 | **70** |
| 3 accessible | ≤75% / ≤500 | 5 | 82 / 57 | **60** |
| 4 open | >75% / >500 | 0 | 75 / 50 | **50** |

`scoreAcademic` math:
```
effectiveMin = published_min || bucket.implicitMin
surplus      = studentPct - effectiveMin
academic     = clamp(58 - bucket.prestigePenalty + surplus × 1.4)
```
Below-min guards: `< min-12 → 0`, `< min-5 → 20 - penalty`, `< min → 40 - penalty`. The bucket-specific implicit floor is the key to differentiating weak applicants by uni selectivity (a 60% student is way below MIT's bar but comfortably above an open uni's).

**Quota + variety**: 20-program shortlist split 6 safe / 10 reach / 4 ambitious. **Ambitious is a HARD cap** (no surplus reallocation into ambitious). Per-uni caps inside tiers: ambitious=1, safe/reach=2 (prevents Cambridge's 8 MPhils from monopolising a tier). When safe+reach can't fill 16 slots, response returns < 20 — strict but honest.

**Top-20 sort**: ranked-first (`qs_ranking != null`) → `qs_ranking` ASC → `match_score` DESC. Unranked programs only included when ranked ones can't fill the per-tier quota.

**Field-of-study matching**: Primary `field_of_study` always honoured. `field_aliases` only counts when `program_name` matches the alias's keyword regex (per-field map `FIELD_NAME_PATTERNS` in scoring.ts) — prevents over-applied aliases from leaking unrelated programs. 407 bad aliases were stripped + 284 primary fields reclassified in the 15 May data pass.

**Multi-pick fields**: `intended_field_extra?: string[]` on StudentProfile (up to 2). Matcher unions {primary, ...extra} in `allowedFields`. BPS / MBA / Others-sentinel branches keep keying off the PRIMARY only.

`scripts/smoke-threshold-cs-pg.ts` is the canonical regression check — edit the profile in-place and re-run after any scoring or weight change to confirm tier distribution stays sane across QS buckets. Strong PG CS profile should consistently produce 6 safe / 10 reach / 4 ambitious.

## Tuition fee policy (locked 8 May 2026; provenance UI added 10 May; estimated-fee Layer 2 added 11 May)

- The fee on `annual_tuition_amount` / `annual_tuition_usd` is the **INTERNATIONAL / OVERSEAS / NON-RESIDENT student fee**. Never the domestic / home / EU / in-state figure. The extractor prompt in `verify-program.ts` enforces this; reviewers must reject any PR that loosens it.
- Display prefers the **local currency literally on the page** (e.g., `£26,600/yr`), with the USD-converted amount as a secondary view via `formatFee(input, { withUsd: true })`. USD is derived from a static FX table in `verify-program.ts` + `backfill-fees.ts` + `estimate-fees.ts` (mid-market rates dated 8 May 2026; update periodically).
- "Indicative" / "approximate" / "estimated" / "from" / "starting at" / "subject to review" labels on the fee figure mean it's published, just not contractual — those are valid and should be picked.
- For multi-year totals, divide by the number of years to get the annual figure.
- **Provenance flag:** `tuition_fee_source: "verified" | "estimated"` on Program. Undefined / "verified" = extracted from the official program page. "estimated" = inferred from a credible secondary source (uni's central fees page, ranking aggregators, etc.) by `scripts/verify/estimate-fees.ts` OR by `scripts/verify/estimate-fees-prior-year.ts` (Layer 3 — prior-year fee from credible sources + 5%/year uplift, added handoff #14). UI surfaces this as a Verified (emerald) / Estimated (amber) / Not available (rose) pill on ProgramCard + ComparePanel.
- **Per-program variance note** (new, handoff #14): `tuition_estimate_note: string | null` on Program. Populated only by the prior-year flow when two consultancy / news sources spread by 5-20% — the script averages them and writes a "verify with the university" note that the UI displays in the Estimated pill's tooltip + adds an asterisk to the pill label.
- **ROI + Parent Decision tools:** refuse to calculate when `annual_tuition_usd` is null — show "Cannot calculate — tuition fee data not available" panel with a link to the official page. When the fee is `tuition_fee_source: "estimated"`, both tools render an amber caveat banner above the result: "Based on estimated tuition fee. The official program page didn't publish a fee, so this calculation uses a figure inferred from the university's central fees page or a credible secondary source. Confirm with the university before relying on these numbers."
- Coverage by country (12 May, handoff #14, prior-year sweep partial): **USA 79%** · UK 60%+ (climbing as sweep runs) · SG 59%+ · CA 55%+ · MY/UAE 49% · AU 41%+ · FR 36% · NZ 33%+ · DE 31%+ · NL 29% · IE 30%+. Overall **~59%** of programs carry a fee (1,897 estimated; 4 with variance notes). Resumable 7-country sweep covers ~2,840 more if greenlit.

> Brand port note: 5 May session ported 3 of 7 deep tool pages (`/roi-calculator`, `/parent-decision`, `/visa-coach`) using new `BrandNav` + `BrandHero` primitives (commits `0c24dc4c` + `cbf6c3d8`). User decided the remaining 4 (`/get-started`, `/application-check`, `/interview-prep`, `/english-test-lab`) need no change. Item closed at 3-of-7. Primitives stay available if a future change is wanted.

## Brand direction (locked by user, 5 May 2026)

Apply across the v2 homepage and all deep pages. **Snapshot §26 has the as-shipped patterns** (hero badge, audience-split cards, rotating-card RHS with 4 dots, stage-card disclosure pattern, destination-card 4-signal pattern, "How it works" modal, top-right AuthGate back link). The brief below is the design baseline; §26 captures concrete deviations that landed.

- **Positioning statement** (use across the website): *"EduvianAI gives students and families an independent, data-backed layer of clarity before they make high-stakes study abroad decisions."*
- **Visual style**: Premium AI advisor + youthful student energy + parent-grade credibility.
- **Palette**:
  - White / off-white base
  - Deep navy / charcoal (`#0E1119`) — used selectively (hero only)
  - Electric purple accent (`violet-600`) for the AI feel — used selectively
  - Semantic only: emerald = safe / approved / good fit · amber = medium risk · rose = risk flag
- **Typography**: keep v2 type pair (Space Grotesk display + Inter body). Don't reintroduce display-script or decorative fonts.
- **Cards**: every tool/stage card carries 5 elements in this order — Title · One-line benefit · Sample output · CTA · Trust cue.
- **Imagery**: real dashboard mockups in the hero (not photographs).
- **Hard 'avoids'**:
  - **No superlatives** that aren't independently verifiable ('largest', 'best', 'most popular', etc.).
  - **No decorative blur blobs on mobile** (root cause of the 4 May scroll-flash bug).
  - **No dual numbers** for the same metric — use `verifiedProgramsLabel` everywhere.
  - **No gradient rainbow per stage** — single accent (violet) + semantic colours only.
  - **No emoji-as-icon overuse** in headings — lucide icons, single weight, sparingly.
- **Bias-free editorial line** (place under the trust principles section, exact wording locked):
  *"Built to reduce individual bias, guesswork, and commission-led recommendations."*

Done in the 4 May / 5 May sessions (no longer pending — for context):
- Re-verify on the 209 unverified entries (now 63 still unverified after applying stamps + strips).
- 63 new universities + 582 verified programs added across UK / Germany / Canada / Australia.
- 57 new universities + 465 verified programs added across France / UAE / Malaysia / Singapore.
- Homepage SWOT-driven restructure (4 May): section reorder, parent-aware copy, single-source-of-truth program count, sample parent report page, modal 5-stage parity (A/B/C/D → 1/2/3/4/5), tool-card 5-line standardisation, 'How shortlist is built' premium card treatment, dual-CTA Decide stage, mobile compaction (~3500-4500px shorter), mobile flash fix (kill blur blobs).
- Brand-redesign prototype at /v2 (5 May, three rounds; user approved round 3). **Swapped /v2 → / (5 May, `66135a13`).** Pre-swap homepage backed up at `_archive/page-pre-v2-swap.tsx.bak`. Pre-swap v2 prototype preserved un-routed at `src/app/_v2-archive/page.tsx`.
- Deep pages built (5 May, `66135a13` + `3c4d4929` + `259639da`): `/match`, `/parent-report`, `/destinations`, `/scholarships`, `/methodology`. (Visuals on the existing tool pages — `/application-check`, `/interview-prep`, etc. — still wear the pre-swap design; brand-language port is open work item #2.)
- H7 Phase C code shipped (5 May): reader (`6ae64c39`) and writer (`5e8e664b`) sides both off the plaintext `profile` column. Only the destructive SQL run in Supabase Studio remains (open work item #1).

## When unsure: ask

Especially before destructive actions, schema changes in prod, or anything in the "Hard rules" list above. The cost of pausing is low; the cost of an unwanted action is high.

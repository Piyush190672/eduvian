# CLAUDE.md — eduvianAI operating rules

This file is loaded automatically. The full project state, decisions, and rationale lives in [STATE_SNAPSHOT.md](STATE_SNAPSHOT.md) — read it first when you join a new session.

## What this is

Next.js 14 (App Router) study-abroad platform deployed to Vercel at https://www.eduvianai.com. Postgres + RLS in Supabase Cloud (US, Pro plan). Anthropic Claude for AI features, Resend for transactional mail, Sentry for errors. 12 destination countries, **10,728 programs / 10,728 verified at the source (100.0%) / 30 streams (Medicine split from Public Health 14 Jul 2026; was 21 pre #19) / 623 universities (419 in universities sidecar — 218 USA + 121 UK + 70 Canada + 10 Singapore) / 72% with international tuition fee (verified + estimated; diluted from 77% by the 1,430 Batch-A adds) / 95% with duration / 56% with city-level living cost (Batch-A adds haven't had apply-city-costs.py run)** as of 14 July 2026 (handoff #21; Batch A grew the DB 9,298 → 10,728). Beta-gated to 100 NEW unique users / month (returning users skip) under $20/mo Anthropic spend ceiling. Email OTP **and** password (scrypt) both gate register / login.

**Handoff #21 (12-14 July 2026, 18 commits, ~$220-250 API spend) — READ §41 of STATE_SNAPSHOT.md. High-impact deltas:**
- **Batch A gap-fill: +1,430 verified programs (9,298 → 10,728)** across the 6 thinnest fields (FinTech, Marketing, Psychology, Cybersecurity, Business Analytics, Data Science). Sitemap 9,952 → 11,382 URLs. Batch B (157 missing QS/THE-2026 unis, ~$180-260) NOT started — needs fresh budget approval AND the merge.ts key-walker idempotency fix first (7 entries re-insert every run; dedupe-programs.py is the current mop-up).
- **v3 premium redesign live** (Waves 1-3, all founder-approved): single decision-blue accent (#1E3A8A) replaced violet sitewide (54 files; logo.svg is the last violet asset, decision pending); 6-section emotional-journey homepage with readiness-preview hero card; founder letter at /why-eduvianai ("Why eduvianAI exists" — REGIONAL IDP phrasing, industry-wide critique, "tens of thousands of students", ₹94/USD — all founder-locked, never regress); "Check my readiness" CTA everywhere; "Interview Prep" → "Interview Coach". Canonical spec: EduvianAI_Brand_Design_Bible_v2.docx (founder's Desktop). Brand voice / emotional design / trust design rules in auto-memory + §41.2.
- **Medicine split from Public Health** (30 fields): 114 clinical / 395 PH; legacy combined value auto-expands in the matcher; Public Health deliberately ungated; UG Medicine needs any 3 of Physics/Chemistry/Biology/Maths (Maths NOT mandatory); med-test capture (UCAT/MCAT/GAMSAT/HPAT/NEET) on StepTests; SAT improvement lever suppressed for UG Medicine unless prefs include USA/Canada/Singapore.
- **PG eligibility gate waits for `major_stream`** (not just degree) — error no longer fires before the stream is chosen. Tailwind JIT hazard confirmed twice: template-literal `${color}-*` classes silently lose styling when no static usage remains — grep after any palette change.
- Registration gates verified INTACT in prod after a user scare (unlock is registration-keyed by design; hardening to session-ownership offered, undecided). 96 vitest tests (was 84).

**Handoff #20 (10 July 2026, ~34 commits, $0 API spend) — READ §40 of STATE_SNAPSHOT.md. High-impact deltas (historical):**
- **Registration gate moved AFTER the form.** All CTAs route to the ungated /profile form; guests submit with a required Terms consent checkbox (timestamped acceptance rides on the encrypted blob; /api/submit rejects guest submissions without it). /api/results + /api/pdf serve a top-5 `teaserSlice` with `locked_count`/`total_matches`/`tier_counts` until the submitting email has a registered account (keyed on REGISTRATION, not session ownership — submit hands guests an owner cookie). PDF + email are 403 for guests. Registering with the same email auto-unlocks; parent-share of claimed submissions unchanged.
- **9,933 programmatic SEO pages** at /programs/[country]/[university]/[program] via server-only src/lib/program-slugs.ts; sitemap.xml (9,952 URLs) + robots.txt + per-route metadata on all public pages.
- **Homepage rebuilt** as a 6-section server component (hero · proof strip · how-it-works · journey-tools USP section · parents · CTA); old page archived at _archive/page-pre-phase2-rebuild.tsx.bak. NEVER reduce marketing surfaces to profile+matching — the journey tools (Application Check, Interview Prep, English Test Lab, Visa Coach) are the USP.
- **Profile rating** is pillar-based (Admissibility 70 / Financial 18 / Visa 12, weighted 0-100) with graded test bands, `cgpa_10` score type, and a top-3 improvement-lever simulator. Duolingo/ACT scoring-0 bugs fixed. Readiness framing only.
- **Matcher**: explicit tierCeiling (elite never Safe, by rule), penalty-free scoring, budget = hard filter only, scholarship badge-only, stable content-hash program ids, 255 data holes repaired, Netherlands restored to TARGET_COUNTRIES. Aspirational fill (Option A): ≤3 `above_budget`-flagged extras when budget empties Reach/Ambitious.
- **10MB DB de-shipped from browsers** (all routes <300kB); Zod at API boundaries (M3 closed); results-token contact-PII masking for non-owners; vitest (84 tests) + GitHub Actions CI.
- **Four locked user rules** added below (purpose split, 30/50/20 unbreachable, highest-score-first within tiers, mobile verification) — read them before touching matching, rating, or UI.

**Handoff #19 (17-18 May, 28 commits + ~$110 API spend) — high-impact deltas (historical):**
- **Taxonomy expansion: 21 → 29 first-class fields** (18 May late). Promoted **Business Analytics** (155 aliased programs) + **Marketing, FinTech, Education, International Relations, Public Policy & Administration, Film & Animation, Renewable Energy** (7 more, 143 aliased). Then **reclassified 296 programs to their specific primary field_of_study** so they no longer live under broader parents (Data Science / Business & Management / Social Sciences & Humanities / Arts and Design / Engineering / Environmental). User-specified policy: **no cross-listing across categories** — each program lives under its single most-specific primary. Picking "Business & Management" no longer surfaces Marketing programs; picking "Data Science" no longer surfaces Business Analytics programs. Clean dropdown separation. See [scripts/data-fixes/reclassify-new-fields-as-primary.py](scripts/data-fixes/reclassify-new-fields-as-primary.py) for the tie-break priority order. Per-field primary counts post-reclassification: BA 154, Education 44, Marketing 28, IR 18, PP&A 15, Film&Animation 14, Renewable Energy 13, FinTech 10.
- **Custom-field matcher improvement** ([scoring.ts](src/lib/scoring.ts)): when `intended_field === "Others"` and user types a custom term, haystack now includes `specialization + field_aliases` (was just `field_of_study + program_name`). Also normalizes internal whitespace + trims. +11 programs globally matched for "business analytics" query (no change for the specific UK PG funnel that triggered the investigation — that funnel's bottleneck is downstream filters not field-match).
- **New diagnose-shortlist debug script** ([scripts/debug/diagnose-shortlist.ts](scripts/debug/diagnose-shortlist.ts)): given a submission token, decrypts the profile via H7 keys and walks the matcher's filter funnel step-by-step printing survivor counts. Used to investigate a user's 1-program-shortlist token a623419b on 18 May. Diagnosis result: profile had compound narrow filters (UK only + custom "Business Analytics" + QS top_200 + 4-of-7 regions + Fall intake + $50k budget + 71% academic) collapsing to 1 final program (Exeter MSc Business Analytics). Filter-by-filter funnel: 9,298 → 6,521 (PG) → 153 (BA name match) → 42 (UK) → 8 (QS top_200) → 1 (region + budget + intake + tier-quota).
- **ROI calculator rewritten end-to-end.** "Monthly Budget" → **Monthly Living Cost** (formula now `avg_living_cost_usd / 12` — no longer amortizes tuition). Tuition + living always-editable on both [InlineProgramROI](src/components/results/InlineProgramROI.tsx) (program-card ROI panel) and standalone [/roi-calculator](src/components/ROICalculator.tsx). Provenance label on every field ("From program page", "Country average — adjust to your city", "Estimated from secondary source", "You entered this", "Heuristic est."). ROI math gates on tuition + living + duration all > 0.
- **Duration null gate.** Program type now `duration_months: number | null`. 3,016 nulls (32%) caused silent ROI poisoning (null/12 = 0 in JS → "Total Investment —, Payback 0 mo, Net 10-yr +$1.1M"). Two-stage backfill closed the gap:
  - **B-stage heuristic** ([scripts/data-fixes/backfill-durations.py](scripts/data-fixes/backfill-durations.py)): 2,868 nulls resolved via (country × degree_level) base defaults + name-pattern rules (MPhil 12mo / Cambridge MPhil 11mo / Oxford MPhil 21mo / US Master 24mo / UK Master 12mo / PhD 48-60mo / Foundation 12mo / PG Diploma 9mo / etc.). Tagged `duration_source: "heuristic"`.
  - **A1-stage LLM** ([scripts/verify/estimate-durations.ts](scripts/verify/estimate-durations.ts)): 82 of 148 residual entries (the ones missing `degree_level` so the rule table couldn't fire) extracted via Sonnet + web_search. Tagged `duration_source: "extracted"`. ~$10 spend.
  - Final: 66 nulls (0.7%) remain — all are landing/department pages, not real programs.
- **City-level living costs.** New [src/data/city-living-costs.ts](src/data/city-living-costs.ts) — 165 curated cities sourced from public gov / immigration / university Cost-of-Attendance pages (US BEA RPP, UK ONS + uni pages, DAAD, Campus France, IRCC, AU DOHA, Nuffic, INIS, Immigration NZ, ICA Singapore, EMGS Malaysia). Each entry cites its source. **Commercial-safe** (no Numbeo/ExpatIstan dependency — those forbid commercial derivative use). 5,947 of 9,298 programs (64%) now carry city-level data; 3,351 (36%) tagged `living_cost_source: "country_avg"` for fallback. Applied via [apply-city-costs.py](scripts/data-fixes/wave-b-living-costs/apply-city-costs.py).
- **Wave A tuition backfill (~$100 Anthropic spend).** estimate-fees.ts campaign scoped to US/UK/CA/AU/DE per user. ~735 new estimates written across 5 countries. Final tuition coverage: USA 89.0% / UK 84.4% / AU 71.1% / CA 66.2% / DE 38.9% (low by design — German public unis charge no tuition for international students; script bails on low confidence). DB-wide 76.9% coverage (up from ~67%).
- **Implausibly-low living-cost normalization.** [normalize-living-costs.py](scripts/data-fixes/normalize-living-costs.py) caught + fixed extraction errors below $3k/yr or <25% of country median. Cleaned UNSW $650 (was wrong — Sydney median $19,300). 2 entries normalized. Other 105 sub-$5k values (Curtin Malaysia $4,200 etc.) left alone — legitimately low.
- **QS rank UX upgraded.** Subject-rank-first per user direction. Per-uni `minRankByUni` lookup on /results; pill renders `QS #N` when this program carries the per-uni minimum (likely subject rank), `QS #N · overall` suffix when the rank is higher than the uni's min (likely the world rank that leaked in). Verifier prompt at [verify-program.ts](scripts/verify/verify-program.ts) updated to require subject-rank-first extraction in future passes.
- **LinkedIn source claim removed.** All 4 occurrences of "LinkedIn Salary Insights" as a data source replaced with "aggregated public-sector labour statistics" — defensive against LinkedIn legal C&D since we have no partnership. Other LinkedIn references (Ireland country page naming LinkedIn Dublin as an employer, CV-builder URL field) are nominative fair use and untouched.
- **Marketing intelligence proposal paused** — user mulling P0+P1+P2 plan to integrate BLS + Adzuna + UK Discover Uni + AU QILT + CA Job Bank + DAAD for per-(field × country) live job count + median salary + 10-yr growth + top employers. Zero spend (free API tier + gov data). 105 hrs effort, not yet greenlit.
- **Legal docs reviewed (Privacy, Terms, Disclaimer).** User attached attorney-vetted versions. Audit identified 18 functional gaps across P0 (age gate, DSAR endpoints, retention job, entity branding, named GO, active mailboxes), P1 (nomination, policy-update banner, save User Content, tool-disclaimer audit, cookie notice, marketing opt-in), and P2 (breach runbook, sub-processor list, etc.). Awaiting user prioritisation; **none implemented yet**.
- **ROI bug fixes:** Rules-of-Hooks violation in /results page that crashed with "Application error: a client-side exception" — useMemo for minRankByUni was below early returns, hoisted to top. Star ladder on StepReview was inverted (`5 - ladderIdx` → `ladderIdx + 1`); VERY STRONG now correctly shows 4 stars not 2.
- **Profile-form upgrades:** Citizenship dropdown (India first, rest alphabetical), auto-aligned phone dial code, degree dropdown, Annual Family Income re-banded to 4 ranges (<12 / 12-24 / 25-49 / 50+ Lakh) with corresponding profile-rating points (0/1/2/3), Step 5 Review page with all-field recap + "Modify the information above" CTA, profile-completion % tracker, multi-field intended-field-of-study (up to 3 streams).
- **Results page features (this campaign):** Next Best 20 banner-led block (ranks 21-40, same ratio), Application-Strength dropdowns now sourced from user's saved shortlist via new `GET /api/my-shortlist`. Interview-prep silence threshold 3s → 8s. Budget label reinforced as "Tuition + Living combined" with ⚠️ amber callout + worked example.

**Handoff #18 (15-17 May, 35 commits) — kept for context, partially superseded by §39:**
- Profile-rating fully rewritten — weighted % scoring, 5-bucket star ladder, colour-coded params, 3D wall UI. **SUPERSEDED 10 July 2026 (handoff #20): now pillar-based with graded bands + improvement simulator — see §40.**
- Match-score weights rebalanced: PG `Academic 0.45 / Budget 0.10`; UG Academic 0.50. **SUPERSEDED 10 July 2026 — see Scoring section below.**
- Bucket-specific implicit academic floor in [src/lib/prestige.ts](src/lib/prestige.ts) `implicitMin`: b0=85, b1=78, b2=70, b3=60, b4=50. Drives `scoreAcademic` when program publishes no min.
- Matcher hard-caps ambitious at 4 (no surplus reallocation into ambitious); per-uni cap: ambitious=1, safe/reach=2.
- Alias matching requires program_name keyword evidence + 407 bad aliases stripped + 284 primary fields reclassified.
- "Arts, Design & Architecture" retired → "Arts and Design"; "Architecture" stays its own stream.
- Multi-pick intended field of study (up to 3 streams) via `intended_field_extra?: string[]`.
- Cross-device: GET `/api/profile-preload` (returning-user prefill from latest submission) + GET/PUT/DELETE `/api/profile-draft` (autosave every 1.5s, encrypted). ✅ `20260515-profile-drafts.sql` migration run in Supabase Studio (17 May 2026).
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

The 10,728-program database in `src/data/programs.ts` is built only by `scripts/verify/`. Hard rules:

1. **No hand-authored entries.** Adds go through the pipeline.
2. **No invented values.** If the live URL doesn't state a fee/deadline/cutoff, the field is `null`.
3. **`verified_at` is sacred** — set only by the pipeline after a live fetch.
4. `field_of_study` must be one of the 30 in `FIELDS_OF_STUDY`.
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
  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
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

**MEDIUM / LOW pass (12 May 2026):** Nine findings closed in production across handoffs #13 and #14 — M4 IP-header trust (`106e364f`), M6 admin audit log (`99c7b2d4` + SQL `20260512-admin-audit-log.sql` applied; chain verified end-to-end), M8 rate-limit sweep across all 28 API routes (`99c7b2d4` admin slice + `9cd3992f` 10-route sweep), M9 Dependabot (`8b2bb998`), L2 chat hardcoded country counts (`47e6f7c8`), L4 constant-time admin/session (`2d478305`), L6 x-request-id propagation (`c15aaf14`), **I1 `/.well-known/security.txt` + `/security-policy` page (`591c25f1`)**, **`students_public_insert` RLS dropped (`5fcabe5a` + SQL applied)**. M2 was already closed (Email OTP). **M3 (Zod) CLOSED 10 July 2026** (`6bb2fe45` — submit/results-PATCH/auth/chat boundaries), plus results-token ownership + contact-PII masking for shared links and `wrapUserInput` around the chat programsContext. Still open: M1 (CSP), M5 (rotation policy doc), M7+L3 (legal-doc edits, attorney-gated), L5 (verified_at HMAC), I2/I3/I4 (informational pre-launch items).

## Authentication

- Email OTP gates `/api/auth` register and login. 6-digit codes hashed with HMAC-SHA256 keyed on `PII_HASH_SECRET`. 5-min expiry, 5-attempt lockout, 60s resend cooldown. See `src/lib/otp.ts`.
- Cookie is opaque UUID (H2) → resolves via `user_sessions` table.
- `LogoutButton` clears server session + localStorage; visible on `/profile` and `/results/[token]`.
- Admin login: email + password → 6-digit MFA code → HMAC admin cookie. Server enforces AAL2 in `/api/admin/session`.
- Admin enrols MFA at `/admin/security` (QR code or manual secret).

## Key code paths

| Path | What |
|---|---|
| `src/data/programs.ts` | THE database. **10,728 entries / 10,728 verified (100%).** `@ts-nocheck`. **Never import from client components** (Phase 1 de-ship, 10 July 2026) — use `src/data/programs-indexed.ts` server-side, `/api/programs` from the client. |
| `src/data/programs-indexed.ts` | Canonical id-stamped list: stable content-hash ids `p_<16hex>` (dual-seed FNV-1a over country\|university\|program\|level\|url), `PROGRAM_BY_ID`, `resolveProgramId` (legacy `prog_N` translation). |
| `src/lib/program-slugs.ts` | server-only slug maps for /programs/[country]/[university]/[program] (9,933 URLs). Deterministic; collisions get -2/-3 suffixes. |
| `src/lib/submission-owner.ts` | `isSubmissionOwner` (session email_hash match), `isEmailRegistered` (drives the results teaser gate — fails OPEN), `redactProfileContact` masking for shared links. |
| `src/lib/profile-score.ts` | Pillar-based 0-100 rating (Admissibility/Financial/Visa) + `computeImprovementLevers` simulator. Readiness framing only — never admission promises. |
| `src/data/db-stats.ts` | Computed counts, consumed from the PREBUILT literal `src/data/db-stats-generated.ts` (regenerate: `npx tsx scripts/generate-db-stats.ts`, wired as npm `prebuild`) so clients never import PROGRAMS. Public surfaces standardise on `verifiedProgramsLabel` (10,728+) / `verifiedUniversitiesLabel` (623+); no dual numbers in copy. |
| `src/app/sample-parent-report/page.tsx` | Static, illustrative parent-decision report at `/sample-parent-report`. Print-friendly (Save-as-PDF button). Linked from the Decide-stage 'See sample family report' CTA. |
| `src/app/page.tsx` | **The homepage** (v3 redesign swap, 14 July 2026): 6-section SERVER component in emotional-journey order — hero (readiness-preview card), proof strip (+ founder row), how-it-works, journey-tools USP section, Parent Decision Room (INR at ₹94/USD), closing CTA; grouped footer. Client islands: ChatWidget, LogoutButton, MobileNav. Pre-v3 page at `_archive/page-pre-v3-swap.tsx.bak` (gitignored, also in git history). Founder letter at `src/app/why-eduvianai/page.tsx`. Voice rules: never "AI-powered" in copy (brand name + AISA carry the signal); CTA is "Check my readiness" (never "See if I qualify"). |
| `src/lib/types.ts` | Single source of truth. `TARGET_COUNTRIES` (12, incl. Netherlands since 10 July 2026), `FIELDS_OF_STUDY` (30). |
| `src/lib/scoring.ts` | `recommendPrograms()` — tier thresholds are PER PRESTIGE BUCKET (see Scoring section) with explicit tierCeiling (elite never Safe); strict 30/50/20 quotas; highest-match-score-first within tiers; `teaserSlice` (locked-view top 5); aspirational `above_budget` fill for empty Reach/Ambitious. |
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

- **LOCKED user rule (10 July 2026): ALWAYS verify the mobile version — content alignment, look & feel, and functionality — for every UI change before calling it done.** Check the change at a mobile viewport (≈375px) in the preview, not just desktop. Interactive elements keep ≥44px touch targets; no horizontal overflow; labels must not be desktop-only (`hidden sm:inline` on essential affordances is a bug, not a style choice).

- **Decorative `blur-3xl` / `blur-2xl` / `blur-[Xpx]` blobs cripple mobile GPU compositing.** Each one repaints as it scrolls into view. We had 23 of these on the homepage and they were the root cause of the section-flash-on-scroll bug. Fix: every decorative blur (any div with `pointer-events-none` + `blur-*`) carries `hidden md:block` so it only renders from md+. Don't add new mobile-visible blur blobs.
- **`whileInView` from framer-motion attaches an IntersectionObserver per element AND fires a re-render** when triggered, even with `transition={{ duration: 0 }}`. With 40+ motion elements that's perceptible jank. Use plain `motion.div` (no whileInView/initial/viewport/transition props) for entrance fades. The `<MotionConfig transition={{ duration: 0 }}>` wrapper around `LandingPage` is a belt-and-suspenders for any motion props that slip back in.
- Always set explicit `width="X" height="Y" loading="lazy" decoding="async"` on user-visible `<img>` tags — Unsplash images otherwise cause CLS as they resolve.
- Per-stage mobile accordions (`mobileOpenStages` Set state in `LandingPage`) collapse Stage 2/3/4/5 detail behind a 'Show Stage X details' toggle. Stage 1 always shows. Use the same pattern for any new long detail blocks.

## Skills available

- `claude-api`, `docx`, `xlsx`, `pdf`, `pptx`
- `simplify`, `fewer-permission-prompts`, `loop`, `schedule`, `update-config`

The legal/security/pricing Word docs were generated with `docx`. Pricing Excel via `xlsx`. To regenerate legal: `node scripts/build-legal-docs.js`.

## Open work for the next session (handoff #21, 14 July 2026)

Full detail in STATE_SNAPSHOT §41.5. **No background processes.** Last deploy: `8be88031` (confirmed live — prod /api/version + homepage "30 fields of study"). Untracked leftovers: `scripts/verify/seeds/gap-6fields-pilot*.json` (pilot scratch — commit or delete at will).

**URGENT — legal P0 (unchanged, still blocking):**

1. **/terms and /privacy return 404 in production** while BOTH consent checkboxes (register + guest-submit) link to them. Publishing the attorney-vetted docs needs user/attorney sign-off (hard rule #3) — top priority.
2. Age gate + verifiable parental consent for under-18s; data export (`/account/data`); right-to-erasure; 24-month retention cron; named Grievance Officer + entity branding (blocked on lawyer); active mailboxes (grievance@/privacy@/legal@/support@).

**User decisions awaited (from #21):**

3. Extend the 3-of-4 subject rule to Biotechnology & Life Sciences / Agriculture & Veterinary (still Math-mandatory — likely source of the original Medicine complaint via co-picked fields)?
4. Registration-gate hardening (session-ownership unlock) or keep registration-keyed as designed?
5. logo.svg violet → blue (last violet asset)? · Public Health gating (currently ungated)? · Functionality-audit items to revert (e.g. nav "How it works" link)?

**Data campaigns (spend-gated):**

6. **Batch B**: fix merge.ts key-walker idempotency FIRST (7 entries re-insert each run), then 157 missing QS/THE-2026 unis (~$180-260, fresh approval) + retry 47 unseeded / ~160 verify errors (~$15-25). Optional: apply-city-costs.py over the 1,430 Batch-A adds.

**User-driven QA (no spend):**

7. Guest funnel walk-through on a real phone: form → consent checkbox → rating → teaser (5 of N) → register → auto-unlock → PDF/email.
8. Owner-path / shared-path checklists (masked PII, 403 PATCH), live-mic interview-prep tests, cross-device prefill, feedback surveys. Do NOT delete `unregistered-zod-check@example.com` / token `4e8b0dd8-…` — canonical locked-view test case.

**Product backlog (Phase 3 — monetization/launch):**

9. Pricing + Razorpay (hard rule #2: ideation only until user approves deployment).
10. Testimonials pipeline · outcomes loop (admissions_outcomes) · application-tracker → Supabase · AISA program retrieval · WhatsApp deep links + referral · scholarship filter chip (blocked on per-program data) · med-test cutoffs as matching signal (data campaign) · Medicine vs Public Health per-field salary sourcing.

**Carried forward from #19 (unchanged):** Tier-B tuition pushes (spend-gated), Market-Intelligence integration (paused), M1 CSP, M5 rotation doc, L5 verified_at HMAC, I2/I3/I4, universities-sidecar UI surfacing, degree_level re-extract, taxonomy follow-ups.

## Universities sidecar (Stage 1+2+3+5 live as of #17)

`src/data/universities.ts` carries 339 entries: 218 USA from US Dept of Ed College Scorecard (free public API), 121 UK from Claude API + web_search across HESA / OfS / Discover Uni / Complete University Guide. Schema in `src/lib/types.ts` `University` interface includes acceptance_rate, median_earnings_{6,10}yr_usd, school_type, setting, enrollment_undergrad / total, graduate_outcome_salary_usd / employment_pct, ukprn, student_staff_ratio, nss_satisfaction_pct, tef_rating, russell_group, completion_rate_pct.

Stage 5 wired `acceptance_rate` into the prestige bucket helper at `src/lib/prestige.ts` — `scoreAcademic` + `scoreProgram` both consume it via `getPrestigeBucket(program)`. Falls back to QS rank where sidecar data is missing.

ComparePanel renders an "Acceptance Rate" row using `lookupUniversity(p.university_name)?.acceptance_rate`. Other sidecar fields not yet surfaced on UI (item 14).

`scripts/universities/`: fetch-scorecard-usa.ts, merge-scorecard-usa.ts, fetch-uk.ts, merge-uk.ts, usa-ipeds-overrides.json (47 IPEDS UnitID overrides for name-format mismatches), uk-russell-group.json (24-uni canonical list).

## Purpose split: profile rating vs course matching (LOCKED by user, 10 July 2026 — always follow)

1. **Profile rating** informs students about their profile strength / readiness to make an application. Readiness framing only — never promise admission or visa outcomes. (Hence the improvement simulator: the rating is something the student improves.)
2. **Course matching** matches the right courses to the individual profile and segments them into Safe / Reach / Ambitious based on profile strength. **The three tiers assess the likelihood of the student getting an offer from that particular university.** Tier copy must be framed as offer likelihood (Safe = strong, Reach = moderate, Ambitious = lower). Elite institutions are never Safe (tierCeiling) because their conversion is low for everyone.

Never conflate the two: tiers don't describe profile quality; the rating doesn't imply a specific university outcome. Applies to all UI copy, emails, PDFs, the AISA chat prompt, and algorithm changes.

## Scoring weights (locked as of handoff #20, 10 July 2026)

| Signal | PG | UG |
|---|---|---|
| Academic         | 55% | 60% |
| Std Test         | 10% | 10% |
| English          |  8% |  8% |
| Backlogs         |  7% |  7% |
| Intake           |  5% |  5% |
| Gap Year         |  5% |  5% |
| Work Exp.        |  5% |  —  |
| Research paper   |  5% |  5% |
| Budget           |  0% (informational sub-score only) | 0% |
| Scholarship      |  — removed (visibility badge only) | — |
| **Sum**          | 100% | 100% |

Budget is a HARD FILTER (110% of bracket, `above_70k` unbounded) — never a ranking signal. Scholarship never affects ranking. Null-tuition programs score a neutral 60 budget sub-score and are capped at 2 per tier.

**Prestige bucketing (tierCeiling model, 10 July 2026)** — `getPrestigeBucket(program, degreeLevel?)` in [src/lib/prestige.ts](src/lib/prestige.ts). Uses sidecar `acceptance_rate` where present for UG profiles only (College Scorecard is UG data — PG profiles fall back to QS rank). Each bucket carries an explicit `tierCeiling` (the elite-never-Safe INVARIANT is a rule, not arithmetic), tier thresholds, and an `implicitMin` academic floor when the program publishes no minimum:

| Bucket | acceptance% / QS | tierCeiling | safeMin / reachMin | implicitMin |
|---|---|---|---|---|
| 0 ultra-selective | ≤10% / ≤25 | **ambitious** | — / — | 85 |
| 1 selective | ≤25% / ≤75 | **reach** | — / 70 | 78 |
| 2 moderate | ≤50% / ≤200 | safe | 88 / 65 | 70 |
| 3 accessible | ≤75% / ≤500 | safe | 84 / 59 | 60 |
| 4 open | >75% / >500 | safe | 75 / 50 | 50 |

`scoreAcademic` is penalty-free: `effectiveMin = published_min || implicitMin; academic = clamp(58 + (studentPct - effectiveMin) × 1.4)` with graded below-min steps (< min−12 → 0, < min−5 → 20, < min → 40). The tier is computed from thresholds, then CLAMPED by tierCeiling; `ScoredProgram.prestige` carries {bucket, tierCeiling, source} for explainability.

**Quota + variety**: shortlist split 30% safe / 50% reach / 20% ambitious (6/10/4 per 20-slot page; 12/20/8 across 40). **LOCKED user rule (10 July 2026): this proportion CANNOT be breached — every tier quota is a hard ceiling and NO tier absorbs another tier's unfilled slots** (the earlier safe/reach surplus-reallocation was removed). Per-uni caps inside tiers: ambitious=1, safe/reach=2 (prevents Cambridge's 8 MPhils from monopolising a tier). When a pool can't fill its quota, the response simply returns fewer programs — strict but honest; the UI reports exact counts.

**Aspirational fill (user-approved "Option A", 10 July 2026)**: when Reach or Ambitious would be EMPTY because the budget hard-filter removed every selective university (e.g. UK MBA at a $50k budget), `recommendPrograms` appends up to 3 programs excluded ONLY by the budget ceiling, flagged `above_budget: true`. They are additive extras OUTSIDE the 30/50/20 quota (the quota itself is still never breached), fire only for empty tiers and never for the `above_70k` bracket, and the UI/PDF must label them "Above your stated budget" — never present them as affordable.

**Within-tier selection + sort (LOCKED by user, 10 July 2026)**: `match_score` DESC, `qs_ranking` ASC as tiebreak. Each tier's quota slots go to the HIGHEST-scoring matches in that tier, displayed in descending score order. This superseded the 15 May ranked-first sort (QS rank ahead of match score) — a QS-ranked program no longer takes a tier slot from a higher-scoring unranked one. Guarded by vitest regression tests.

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
- **Palette (v3, 14 July 2026 — supersedes the violet system; canonical spec: EduvianAI_Brand_Design_Bible_v2.docx on the founder's Desktop)**:
  - Mist white base (`#F8FAFC`)
  - Slate navy (`#0F172A`) — hero, journey-tools section, final CTA, footer panels
  - Decision-blue accent (`blue-900` = #1E3A8A, hover `blue-800`) — SINGLE accent, founder-approved 13 Jul 2026; violet retired sitewide (logo.svg is the one remaining violet asset, pending founder decision)
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

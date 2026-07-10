# CLAUDE.md — eduvianAI operating rules

This file is loaded automatically. The full project state, decisions, and rationale lives in [STATE_SNAPSHOT.md](STATE_SNAPSHOT.md) — read it first when you join a new session.

## What this is

Next.js 14 (App Router) study-abroad platform deployed to Vercel at https://www.eduvianai.com. Postgres + RLS in Supabase Cloud (US, Pro plan). Anthropic Claude for AI features, Resend for transactional mail, Sentry for errors. 12 destination countries, **9,298 programs / 9,298 verified at the source (100.0%) / 29 streams (was 21 pre #19) / ~636 universities (419 in universities sidecar — 218 USA + 121 UK + 70 Canada + 10 Singapore) / 77% with international tuition fee (verified + estimated; up from 69% post handoff #19 Wave A) / 99.3% with duration / 64% with city-level living cost** as of 18 May 2026 (handoff #19, late). Beta-gated to 100 NEW unique users / month (returning users skip) under $20/mo Anthropic spend ceiling. Email OTP **and** password (scrypt) both gate register / login.

**Handoff #19 (17-18 May, 28 commits + ~$110 API spend) — high-impact deltas the agent must know:**
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
- Profile-rating fully rewritten — weighted % scoring, 5-bucket star ladder (Weak / Average / Strong / Very Strong / Super Strong), colour-coded params, 3D wall UI. See [src/lib/profile-score.ts](src/lib/profile-score.ts) + `<ProfileCard>`.
- Match-score weights rebalanced: PG `Academic 0.45 / Budget 0.10` (was 0.35 / 0.20); UG Academic 0.50 (work_exp slot folded in).
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

## Open work for the next session (handoff #19, 18 May 2026)

Pinned in priority order. Snapshot §39 has full handoff-#19 detail. **No background processes. Working tree clean.** Last commit: `670b268e` (data: Wave A scoped tuition backfill complete).

**URGENT — legal-docs functional gaps (P0, blocking publication of attorney-vetted docs):**

1. **Age gate + verifiable parental consent** for under-18 users (Privacy §2.4 + Terms §2/§4). DOB on signup → if <18, parent email + verification + Terms acceptance before processing.
2. **Right to access (data export)** — new `/account/data` + `GET /api/account/export` JSON-dump endpoint.
3. **Right to erasure** — delete-my-account button + 30-day grace + hard delete.
4. **Automated 24-month retention job** — Vercel cron / external scheduler. Anonymise stale submissions; 12-month rolling delete for rate-limit + audit logs.
5. **Terms + Privacy acceptance checkbox + timestamped log** on register.
6. **Named Grievance Officer + entity branding** (footer + /privacy + /terms). Needs lawyer to provide entity name / CIN / address / GO individual details.
7. **Active mailbox routing**: `grievance@`, `privacy@`, `legal@`, `support@`, `security@` (last is carry-over).

**Tier-A — user-driven QA (no API spend, mostly carry-over from #18):**

8. End-to-end QA of inline-password register flow
9. Change-password modal QA from homepage
10. Mobile sanity sweep on real iOS Safari + Android Chrome
11. Live mic test USA + AU interview-prep flows
12. Cross-device profile prefill — submit on desktop, sign in mobile, verify autofill + draft autosave
13. Verify feedback-survey modal on all 4 surfaces
14. **NEW** — verify the rewritten ROI panel renders correctly on /results: city-level living costs labelled, duration heuristic-estimate pill shows on the ~2,868 affected programs, tuition-source provenance correct
15. **NEW** — verify Monthly Living Cost figure aligns with annual_living/12 (was previously (tuition + living)/12 = misleading)

**Tier-B — API spend (await explicit go):**

16. USA tuition coverage final push beyond 89% — would need either (a) residential proxy ($50/mo for blocked uni pages) or (b) another ~$30 of estimate-fees.ts cycles for the remaining 374 nulls. Marginal value low.
17. Remaining 7 countries' tuition (FR/NL/IE/MY/NZ/SG/UAE: 489 nulls) via estimate-fees.ts. ~$30-50 spend total.
18. ~~Stage 4 sidecar for 8 remaining countries~~ — USER SAID NO from handoff #18, still skipped.

**Tier-C — Market Intelligence integration (planning approved P0+P1+P2, ~$0 spend):**

19. Build cross-walk: 21 streams × 12 countries → SOC/SOC2020/ANZSCO/NOC codes + Adzuna query terms (~3 hrs).
20. BLS (US) + UK Discover Uni + WEF report ingestion for field-level demand data (~7 hrs).
21. Adzuna integration (free tier; 9 of 12 countries covered: US/UK/AU/CA/DE/FR/NL/SG/NZ — IE/UAE/MY get gov-data only) (~6 hrs).
22. Per-program career-outcomes row in ProgramCard + Market Intelligence card on /results (~8 hrs).
23. Honest label everywhere: "Aggregated job-market data — never claim LinkedIn as source unless we have partnership". Updated weekly via cron.

**Tier-D — security & ops (carry-over from #18):**

24. M1 CSP (4-6 wk Next.js refactor)
25. M3 Zod input validation
26. M5 secrets rotation policy doc
27. L5 verified_at HMAC signing
28. I3 incident response plan
29. I2 + I4 bug bounty + pen-testing schedule

**Pipeline ops:**

30. Re-extract degree_level for the 148 entries that lack it (currently leaving duration_months null for 66 of them after A1 stage).
31. Universities-sidecar UI surfacing — sidecar has 419 rows but only `acceptance_rate` is wired. ProgramCard could surface TEF / NSS / Russell Group / median earnings.

**Taxonomy follow-ups (low-priority):**

32. Audit existing user submissions for `intended_field` = "Others" with custom text that matches one of the 8 newly-promoted fields. Could surface a "We've added [Marketing/FinTech/etc.] as a first-class option — edit your profile to use it" banner.
33. Audit other potential streams not yet promoted (Real Estate, Sports Management, Pharmacy, Linguistics, Robotics, Aerospace, Information Systems, Supply Chain, HR, Theology) — all <15 named programs but a few users likely want them. Threshold for promotion = ~10 programs.
34. Tier-break priority in [reclassify-new-fields-as-primary.py](scripts/data-fixes/reclassify-new-fields-as-primary.py) is hardcoded — if a program legitimately fits multiple promoted fields (e.g. "MSc Public Policy with International Affairs concentration"), the priority order picks one. Manual review of edge cases may be warranted.

**Estimated remaining spend:** ~$0 unless Tier-B #16/#17 get greenlit, or Market Intelligence Adzuna paid tier (~$99/mo) is chosen over the free tier.

**Handoff #19 spend tally:** ~$110 (~$10 duration extraction A1 + ~$100 Wave A tuition US/UK/CA/AU/DE). The late-#19 taxonomy expansion (29 fields + 296 reclassifications) was $0 spend.

## Universities sidecar (Stage 1+2+3+5 live as of #17)

`src/data/universities.ts` carries 339 entries: 218 USA from US Dept of Ed College Scorecard (free public API), 121 UK from Claude API + web_search across HESA / OfS / Discover Uni / Complete University Guide. Schema in `src/lib/types.ts` `University` interface includes acceptance_rate, median_earnings_{6,10}yr_usd, school_type, setting, enrollment_undergrad / total, graduate_outcome_salary_usd / employment_pct, ukprn, student_staff_ratio, nss_satisfaction_pct, tef_rating, russell_group, completion_rate_pct.

Stage 5 wired `acceptance_rate` into the prestige bucket helper at `src/lib/prestige.ts` — `scoreAcademic` + `scoreProgram` both consume it via `getPrestigeBucket(program)`. Falls back to QS rank where sidecar data is missing.

ComparePanel renders an "Acceptance Rate" row using `lookupUniversity(p.university_name)?.acceptance_rate`. Other sidecar fields not yet surfaced on UI (item 14).

`scripts/universities/`: fetch-scorecard-usa.ts, merge-scorecard-usa.ts, fetch-uk.ts, merge-uk.ts, usa-ipeds-overrides.json (47 IPEDS UnitID overrides for name-format mismatches), uk-russell-group.json (24-uni canonical list).

## Purpose split: profile rating vs course matching (LOCKED by user, 10 July 2026 — always follow)

1. **Profile rating** informs students about their profile strength / readiness to make an application. Readiness framing only — never promise admission or visa outcomes. (Hence the improvement simulator: the rating is something the student improves.)
2. **Course matching** matches the right courses to the individual profile and segments them into Safe / Reach / Ambitious based on profile strength. **The three tiers assess the likelihood of the student getting an offer from that particular university.** Tier copy must be framed as offer likelihood (Safe = strong, Reach = moderate, Ambitious = lower). Elite institutions are never Safe (tierCeiling) because their conversion is low for everyone.

Never conflate the two: tiers don't describe profile quality; the rating doesn't imply a specific university outcome. Applies to all UI copy, emails, PDFs, the AISA chat prompt, and algorithm changes.

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

**Quota + variety**: shortlist split 30% safe / 50% reach / 20% ambitious (6/10/4 per 20-slot page; 12/20/8 across 40). **LOCKED user rule (10 July 2026): this proportion CANNOT be breached — every tier quota is a hard ceiling and NO tier absorbs another tier's unfilled slots** (the earlier safe/reach surplus-reallocation was removed). Per-uni caps inside tiers: ambitious=1, safe/reach=2 (prevents Cambridge's 8 MPhils from monopolising a tier). When a pool can't fill its quota, the response simply returns fewer programs — strict but honest; the UI reports exact counts.

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

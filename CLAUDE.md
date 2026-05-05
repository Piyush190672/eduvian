# CLAUDE.md — eduvianAI operating rules

This file is loaded automatically. The full project state, decisions, and rationale lives in [STATE_SNAPSHOT.md](STATE_SNAPSHOT.md) — read it first when you join a new session.

## What this is

Next.js 14 (App Router) study-abroad platform deployed to Vercel at https://www.eduvianai.com. Postgres + RLS in Supabase Cloud (US, Pro plan). Anthropic Claude for AI features, Resend for transactional mail, Sentry for errors. 12 destination countries, **5,595 programs / 5,532 verified at the source (98.9%) / 506 universities (485 with verified programs)** as of 4 May 2026, beta-gated to 100 users/month. Email OTP gates register/login.

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

The 5,595-program database in `src/data/programs.ts` is built only by `scripts/verify/`. Hard rules:

1. **No hand-authored entries.** Adds go through the pipeline.
2. **No invented values.** If the live URL doesn't state a fee/deadline/cutoff, the field is `null`.
3. **`verified_at` is sacred** — set only by the pipeline after a live fetch.
4. `field_of_study` must be one of the 17 in `FIELDS_OF_STUDY`.
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
  - **H7 PII encryption: Phase A + Phase B both live.** Readers prefer `profile_encrypted` and fall back to plaintext. Phase C (drop plaintext column) is the last open item; **wait at least 24-48h after Phase B ships before doing it**, take a fresh `pg_dump` first.

When working on `submissions`, both `profile` (plaintext) and `profile_encrypted` exist. Phase B is shipping; Phase C drops plaintext.

## Authentication

- Email OTP gates `/api/auth` register and login. 6-digit codes hashed with HMAC-SHA256 keyed on `PII_HASH_SECRET`. 5-min expiry, 5-attempt lockout, 60s resend cooldown. See `src/lib/otp.ts`.
- Cookie is opaque UUID (H2) → resolves via `user_sessions` table.
- `LogoutButton` clears server session + localStorage; visible on `/profile` and `/results/[token]`.
- Admin login: email + password → 6-digit MFA code → HMAC admin cookie. Server enforces AAL2 in `/api/admin/session`.
- Admin enrols MFA at `/admin/security` (QR code or manual secret).

## Key code paths

| Path | What |
|---|---|
| `src/data/programs.ts` | THE database. **5,595 entries / 5,532 verified.** `@ts-nocheck` (large data file). |
| `src/data/db-stats.ts` | Computed counts. Public surfaces standardise on `verifiedProgramsLabel` (5,532+) and `verifiedUniversitiesLabel` (485+) — `programsLabel` (the unverified-tail total) is internal-only. Don't reintroduce dual numbers in copy. |
| `src/app/sample-parent-report/page.tsx` | Static, illustrative parent-decision report at `/sample-parent-report`. Print-friendly (Save-as-PDF button). Linked from the Decide-stage 'See sample family report' CTA. |
| `src/app/page.tsx` | **The homepage** (post v2 → / swap, 5 May 2026). v2 brand redesign + 8-section structure now serves at `/`. Pre-swap homepage backed up at `_archive/page-pre-v2-swap.tsx.bak`; pre-swap `src/app/v2/` preserved (un-routed) at `src/app/_v2-archive/page.tsx` for reference. |
| `src/lib/types.ts` | Single source of truth. `TARGET_COUNTRIES` (12), `FIELDS_OF_STUDY` (17). |
| `src/lib/scoring.ts` | 9-signal `recommendPrograms()`. Tiers: Safe 75-100, Reach 50-74, Ambitious <50. |
| `src/lib/format-fee.ts` | Null-safe tuition rendering. **Never show $0.** |
| `src/lib/beta-gate.ts` | Per-tool monthly caps + global $50 spend cap. |
| `src/lib/rate-limit.ts` | Upstash sliding-window with in-memory fallback. Must never throw. |
| `src/lib/user-cookie.ts` | Opaque server-side sessions (H2). |
| `src/lib/pii-crypto.ts` | AES-256-GCM + emailHash for H7. |
| `src/lib/otp.ts` | OTP generate / hash (HMAC) / verify (timing-safe). |
| `src/lib/submissions-decrypt.ts` | H7 Phase B reader helper. `decryptProfile()` prefers encrypted, falls back to plaintext. Use everywhere submissions are read. |
| `src/lib/html-escape.ts` | `escHtml` / `escHtmlBounded` / `safeUrl`. Use for any user-content interpolation. |
| `src/lib/llm-safety.ts` | `wrapUserInput`, `JAILBREAK_GUARDRAILS`, `MAX_OUTPUT_TOKENS`. Append guardrails to every system prompt. |
| `src/lib/api-error.ts` | Sentry-flushed error response. Eager Sentry init lives here. |
| `src/middleware.ts` | Same-origin CSRF gate + admin route protection. `ALLOWED_HOSTS` is the safelist. |
| `src/components/LogoutButton.tsx` | Renders only when signed in. Hits `/api/auth/logout`, clears localStorage, routes to /. |
| `src/components/DecisionDisclaimer.tsx` | In-context disclaimers on tool pages — five variants (roi, visa, english-test, shortlist, scholarship). |

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

## Open work for the next session

Pinned in priority order. Snapshot §20 + §24 have full detail.

1. **Implement the v2 final-homepage structure and swap /v2 → /** — user has approved v2 as the new homepage (5 May 2026 session). The exact 8-section structure they want is committed in snapshot §24. Working file: `src/app/v2/page.tsx` already at round 3. Implementation steps:
   - Apply §24's 8-section structure to `src/app/v2/page.tsx` (Hero / Proof strip / 5-stage journey / See actual outputs / Why trust / For families / Explore tools / Final CTA).
   - Verify on phone + desktop.
   - **Swap**: copy v2/page.tsx content over `src/app/page.tsx`; either delete v2/ or keep as backup `/v2-prototype-archive`. Production homepage links to /v2 (footer "Original →") need cleanup.
   - The current 1,400-line `src/app/page.tsx` becomes the **content source for deep pages** (don't delete it before extracting).
2. **Build deep pages** — homepage CTAs route here. Most exist; some need creating.
   - Already exist: `/application-check`, `/interview-prep`, `/english-test-lab`, `/roi-calculator`, `/visa-coach`. Visual update to v2 design language pending.
   - **Need creating**: `/match` (currently /get-started serves this — alias or rename), `/parent-report` (currently /parent-decision — alias or rename), `/destinations` (currently a section on the production homepage — extract), `/scholarships` (currently a section — extract).
3. **H7 Phase C** — drop plaintext `submissions.profile`. Phase B shipped evening of 3 May 2026; the 24h window has been open since 4 May 2026. Migration SQL + runbook are committed at `src/lib/migrations/20260505-h7-phase-c-drop-plaintext.sql` (NOT yet executed). Before running:
   - Take a fresh `pg_dump` of `public.submissions` (or confirm Supabase Pro scheduled backup ≤12h old).
   - Update three code paths to stop selecting `profile`:
     - `src/lib/submissions-decrypt.ts` — drop `profile` from `SUBMISSION_PROFILE_COLUMNS`, remove plaintext fallback in `decryptProfile()`.
     - `src/app/api/admin/leads/route.ts:13` — drop `profile` from explicit SELECT.
   - Deploy the code change first, verify `/admin/leads` and `/results/[token]` work, then run the migration.
4. **Field-mismatch + persistent fetch-error cleanup** — 63 entries from the re-verify pass still aren't verified: 31 `field_mismatch` (24 of them are catalog/listing URLs from older seeds — strip with `audit-strip --include field_mismatch`) and 32 `fetch_or_api_error` (28 are DNS-unresolvable from the build network, 2 De Montfort 404s, 2 succeed in browser → strip the De Montfort, retry the working pair, replace the 28 catalog URLs with real program-detail URLs OR strip them).
5. **Marketing email opt-in flow** — Privacy Policy §11 promises this; not yet built.
6. **Visible unsubscribe link in email body** — `List-Unsubscribe` header is in; in-body link still missing.
7. **Real downloadable Sample Parent Report PDF** — current `/sample-parent-report` is HTML + Save-as-PDF. A static rendered PDF asset would feel more 'official'.

## Brand direction (locked by user, 5 May 2026)

Apply across the v2 homepage and all deep pages.

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
- Brand-redesign prototype at /v2 (5 May): three rounds. User approved direction in round 3. Final structure now locked (see §24).

## When unsure: ask

Especially before destructive actions, schema changes in prod, or anything in the "Hard rules" list above. The cost of pausing is low; the cost of an unwanted action is high.

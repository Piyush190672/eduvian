# Database Integrity & Verification

The student-facing recommendations on this site are only as trustworthy as the underlying program data. This document is the contract for how `src/data/programs.ts` is built and maintained.

## Hard rules

1. **No hand-authored entries.** Every program in `programs.ts` enters via the verification pipeline. Manually edited entries are considered invalid and may be removed at the next audit.
2. **No invented values.** If the official program page does not state a fee, deadline, or cutoff, the field is `null`. The model is instructed never to infer.
3. **`verified_at` is sacred.** Set only by the pipeline after a successful live fetch. Never set in code review, never copied between entries.
4. **Re-verify every 6 months.** Admissions cycles roll over annually; numbers older than two cycles should be stamped stale by the audit job.
5. **Match the intended-stream taxonomy.** `field_of_study` must be one of the 17 values in `FIELDS_OF_STUDY` (`src/lib/types.ts`).

## Pipeline

```
catalogs/qs-2026-*.json      ← university + catalog-page URL (12 lines covers top 12)
        │
        ▼ npm run verify:crawl --batch <catalogs.json>
seeds/<auto>.json            ← Claude auto-extracts program URLs per field of study
        │
        ▼ npm run verify:batch <seeds.json>
verify-program.ts            ← Playwright fetches each URL, Claude extracts ONLY stated fields
        │
        ▼
output/<slug>.json           ← stamped with verified_at + verification_source_url
        │
        ▼ npm run verify:merge
src/data/programs.ts         ← appended (skips duplicates)
```

**Re-verification of existing entries:**
```
npm run verify:reverify -- --limit 100   # re-fetches, writes report
npm run verify:strip -- --dry-run        # preview removals
npm run verify:strip                     # apply
```

## All scripts

| Script | npm command | Purpose |
|---|---|---|
| `seed-crawler.ts` | `verify:crawl` | Catalog-page → seed JSON (auto-mapped to 17 fields) |
| `verify-program.ts` | `verify:program` | Single program URL → verified JSON output |
| `verify-batch.ts` | `verify:batch` | Run verifier over a seed file |
| `merge.ts` | `verify:merge` | Append verified outputs to programs.ts |
| `re-verify.ts` | `verify:reverify` | Re-check existing programs.ts entries against live URLs |
| `audit-strip.ts` | `verify:strip` | Remove entries that failed re-verification |

## Adding new universities (e.g. expanding QS 2026 coverage)

1. Append seed entries to `scripts/verify/seeds/qs-2026-<batch>.json`. Each seed has six fields: `university`, `country`, `city`, `qs_ranking`, `field_of_study`, `program_url`. The URL must be the **official program page**, not a third-party listing.
2. Run `npm run verify:batch scripts/verify/seeds/qs-2026-<batch>.json`. Set `ANTHROPIC_API_KEY` first.
3. Inspect `scripts/verify/output/`. Each file shows what the page literally said, plus a `fields_not_stated` array calling out gaps.
4. Run `npm run verify:merge` to append the new programs.
5. Commit `programs.ts` together with the verified output JSONs as the audit trail.

## UI contract

- Programs with `verified_at` set show a green ✓ Verified badge in `ProgramCard`.
- Programs without it show an amber ⚠ Listing only badge with hover text directing the student to the official page.
- The badge is mandatory — it's the user's signal of trust level.

## Current state (April 2026)

- **Total programs:** ~1,091 (down from 7,313 after April 2026 synthetic-data purge).
- **Verified-at-source:** to be stamped in batches as the pipeline runs over QS 2026 tier-1, tier-2, etc.
- **Synthetic placeholders removed:** 6,222 entries deleted in the April 2026 audit (54 generic patterns appearing across many unrelated universities).

## Why this exists

In April 2026 an audit found that the database contained generic placeholder programs auto-applied to every university — e.g. "BSc Hospitality Management" at MIT, "MSc Agriculture" at Cambridge, "BSc Nursing" at Oxford. None of those schools offer those programs. Trust in a college-recommendation product collapses the moment a student finds a single fabricated entry. This pipeline is the structural fix: data only enters via a script that fetched a live URL.

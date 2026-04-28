# Program Verification Pipeline

**Purpose:** Every entry in `src/data/programs.ts` must be backed by content fetched live from the university's official program page. This pipeline is the only path through which programs may be added to the database.

## Hard rules

1. **Never hand-author a `ProgramEntry`.** All adds go through `verify-program.ts`.
2. **Never invent fees, deadlines, or cutoffs.** If a field is not stated on the source page, it is `null`.
3. **`verified_at` is set only by the pipeline** after a successful field extraction against a live URL. Never set it manually.
4. **Re-verify on a 6-month cadence** (admissions cycles roll over). Programs older than 6 months should be re-fetched.

## Usage

```bash
# Verify a single program (writes to scripts/verify/output/<slug>.json)
npx tsx scripts/verify/verify-program.ts \
  --university "University of Cambridge" \
  --field "Artificial Intelligence & Data Science" \
  --url "https://www.mlmi.eng.cam.ac.uk/"

# Verify a batch from a seed file
npx tsx scripts/verify/verify-batch.ts scripts/verify/seeds/qs-2026-tier-1.json

# Merge verified outputs into programs.ts
npx tsx scripts/verify/merge.ts
```

## Workflow

1. **Curate seed**: maintain `seeds/qs-2026-<batch>.json` with `{ university, country, city, qs_ranking, field_of_study, program_url }` — populated by hand from the official QS rankings list and university course catalogs. This is the only manual step; it captures *which page to check*, not what's on it.
2. **Run verification**: the script fetches `program_url`, sends the rendered HTML to Claude with the strict schema, and Claude extracts fields *only when literally stated on the page*. Anything ambiguous returns `null`.
3. **Diff against current DB**: the script reports each field as `match` / `mismatch` / `new`. Mismatches require human review before merge.
4. **Merge**: confirmed outputs get `verified_at = now()` and `verification_source_url = program_url`, then are appended to `programs.ts`.

## Why this exists

Earlier audits found 6,222 synthetic placeholder programs in the database (e.g., "BSc Hospitality" at MIT, "MSc Agriculture" at Cambridge — neither school offers either). Those have been removed. This pipeline ensures it cannot happen again: an entry exists in `programs.ts` only if its `verified_at` was stamped by a script that fetched the live URL.

#!/bin/bash
# chain-tiers.sh — Auto-runs tier-N seed → verify → merge → commit → push,
# waiting for each phase to complete before starting the next.
#
# Usage:
#   ./scripts/verify/chain-tiers.sh tier-9 [tier-10 ...]
#
# Starts each tier as soon as the prior one is fully merged and pushed.
# Runs in foreground so output streams to your terminal; redirect to a
# file with `nohup ... > /tmp/chain.log 2>&1 &` if you want to detach.
set -euo pipefail
cd "$(dirname "$0")/../.."

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found" >&2
  exit 1
fi
set -a; source .env.local; set +a

TIERS=("$@")
if [ ${#TIERS[@]} -eq 0 ]; then
  echo "Usage: $0 tier-9 [tier-10 ...]" >&2
  exit 1
fi

run_tier() {
  local TIER="$1"
  local CATALOG="scripts/verify/catalogs/qs-2026-${TIER}.json"
  local SEEDS="scripts/verify/seeds/qs-2026-${TIER}-auto.json"

  if [ ! -f "$CATALOG" ]; then
    echo "ERROR: $CATALOG not found, skipping" >&2
    return 1
  fi

  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "  Starting $TIER  ($(date))"
  echo "════════════════════════════════════════════════════════════════"

  # Phase 1: web-search seed-finder (Sonnet) — skip if seeds already exist
  if [ -s "$SEEDS" ]; then
    echo "[Phase 1] $SEEDS already exists ($(jq length "$SEEDS" 2>/dev/null || echo "?") seeds) — skipping seed-finder"
  else
    echo "[Phase 1] websearch-seed-finder $CATALOG -> $SEEDS"
    npx tsx scripts/verify/websearch-seed-finder.ts \
      --universities "$CATALOG" \
      --out "$SEEDS"
  fi

  # Phase 2: verify-batch (Opus, parallel)
  echo "[Phase 2] verify-batch (concurrency 5, skip-existing)"
  npx tsx scripts/verify/verify-batch.ts "$SEEDS" \
    --concurrency 5 --skip-existing

  # Phase 3: merge + rename + living-cost backfill
  echo "[Phase 3] merge + rename + backfill"
  npx tsx scripts/verify/merge.ts
  npx tsx scripts/verify/rename-from-page.ts
  python3 - <<'EOF'
import re
PATH='src/data/programs.ts'
text=open(PATH).read()
DEFAULTS={"USA":18000,"UK":14000,"Australia":17000,"Canada":14000,"Germany":12000,"France":18000,"Netherlands":14000,"Ireland":16000,"Singapore":20000,"Malaysia":7000,"New Zealand":14000,"UAE":16000}
def repair(m):
    full,c=m.group(0),m.group(1)
    d=DEFAULTS.get(c)
    return full if d is None else full.replace("avg_living_cost_usd: null", f"avg_living_cost_usd: {d}")
pat=re.compile(r'country:\s*"([^"]+)"[\s\S]{0,1500}?avg_living_cost_usd:\s*null')
text=pat.sub(repair, text)
open(PATH,'w').write(text)
EOF

  # Phase 4: type-check
  echo "[Phase 4] type-check"
  npx tsc --noEmit

  # Phase 5: commit + push
  local COUNT=$(python3 -c "
import re
with open('src/data/programs.ts') as f: t=f.read()
print(f\"{len(re.findall(r'program_name:', t))}/{len(re.findall(r'verified_at:', t))}\")")
  echo "[Phase 5] commit + push (current: $COUNT programs/verified)"

  git add scripts/verify/catalogs/qs-2026-${TIER}.json \
    scripts/verify/seeds/qs-2026-${TIER}-auto.json \
    scripts/verify/rename-review.json \
    src/data/programs.ts || true

  # Title-case TIER for the commit subject — macOS bash 3.2 doesn't support
  # ${TIER^} so do it portably with tr + cut.
  local TIER_TITLE
  TIER_TITLE="$(echo "${TIER:0:1}" | tr '[:lower:]' '[:upper:]')${TIER:1}"

  git commit -m "${TIER_TITLE}: auto-merged $(date '+%Y-%m-%d') ($COUNT programs/verified)

Auto-generated commit by chain-tiers.sh after web-search seed-finder
+ verify-batch + merge.ts + rename-from-page.ts on
catalogs/qs-2026-${TIER}.json.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>" \
    || { echo "Nothing to commit for $TIER"; return 0; }

  git push origin main
  echo "════════════════════════════════════════════════════════════════"
  echo "  $TIER complete at $(date)"
  echo "════════════════════════════════════════════════════════════════"
}

for TIER in "${TIERS[@]}"; do
  run_tier "$TIER"
done

echo ""
echo "All tiers complete."

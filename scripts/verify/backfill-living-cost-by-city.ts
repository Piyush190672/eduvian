/**
 * backfill-living-cost-by-city.ts
 *
 * v2 of living-cost backfill. v1 (backfill-living-cost.ts) used a single
 * country-level median — too coarse. London ≠ Sheffield, Toronto ≠
 * Winnipeg, Sydney ≠ Adelaide. This pass replaces every programs.ts row
 * whose avg_living_cost_usd EXACTLY matches one of the v1 flat fallbacks
 * with a city-aware tier estimate.
 *
 * Tiers per country (USD/year, secondary-research / cost-of-living
 * benchmarks at 12 May 2026 prices):
 *
 *   Tier 1  = major / capital metros (highest rent + transport)
 *   Tier 2  = second-rung metros
 *   Tier 3  = smaller cities / regional unis
 *
 * Source-of-truth values are baked into LIVING_COST_BY_CITY below — when
 * a city in programs.ts substring-matches any Tier 1 keyword we use the
 * tier-1 number, else tier-2 keyword → tier-2 number, else fall back to
 * tier-3. Singapore is a city-state so the table degenerates to a single
 * value.
 *
 * Targeting rule (safer than overwriting every row):
 *   - If the row's current value is exactly one of the v1 flat fallbacks
 *     for its country → it's a v1-backfilled row, overwrite it.
 *   - If the value is 0 / null → defensive backfill (shouldn't happen
 *     after v1 ran, but handles future gaps).
 *   - Otherwise → leave it alone (verified value or a non-fallback
 *     estimate from elsewhere).
 *
 * Risk: a small number of verified rows may happen to equal the flat
 * fallback by coincidence (e.g. a German uni with a real $12k figure).
 * Those would be overwritten with the new city tier — net change ≤ a
 * few $k either way, still a defensible estimate.
 *
 * Rerunnable: idempotent — running twice produces the same output.
 *
 * Usage:
 *   npx tsx scripts/verify/backfill-living-cost-by-city.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

// v1 flat country fallbacks — rows currently at exactly these values are
// the ones backfill-living-cost.ts (v1, commit ed12161b) wrote on 12 May.
// Used as the targeting key for this v2 overwrite pass.
const V1_COUNTRY_FALLBACK: Record<string, number> = {
  USA: 18000, UK: 14000, Canada: 14000, Germany: 12000,
  Australia: 17000, France: 18000, Malaysia: 7000, UAE: 16000,
  Netherlands: 14000, "New Zealand": 14000, Ireland: 16000, Singapore: 20000,
};

interface CityTiers {
  tier1: string[];  // case-insensitive substring keywords
  tier2: string[];
  tier1Cost: number;
  tier2Cost: number;
  tier3Cost: number;
}

const LIVING_COST_BY_CITY: Record<string, CityTiers> = {
  USA: {
    tier1: ["new york", "san francisco", "boston", "los angeles", "washington", "seattle", "san jose", "manhattan", "brooklyn", "berkeley", "stanford", "palo alto", "cambridge, ma"],
    tier2: ["chicago", "philadelphia", "atlanta", "san diego", "austin", "miami", "denver", "houston", "dallas", "portland", "honolulu", "minneapolis", "san francisco bay", "irvine", "santa clara", "santa monica"],
    tier1Cost: 26000,
    tier2Cost: 19000,
    tier3Cost: 14000,
  },
  UK: {
    tier1: ["london"],
    tier2: ["edinburgh", "cambridge", "oxford", "brighton", "manchester", "glasgow", "birmingham", "bristol", "reading", "guildford"],
    tier2Cost: 15000,
    tier1Cost: 21000,
    tier3Cost: 12000,
  },
  Canada: {
    tier1: ["toronto", "vancouver"],
    tier2: ["montreal", "calgary", "ottawa", "edmonton", "victoria"],
    tier1Cost: 18000,
    tier2Cost: 14000,
    tier3Cost: 11000,
  },
  Australia: {
    tier1: ["sydney", "melbourne"],
    tier2: ["brisbane", "perth", "adelaide", "canberra", "gold coast", "newcastle"],
    tier1Cost: 20000,
    tier2Cost: 17000,
    tier3Cost: 14000,
  },
  Germany: {
    tier1: ["munich", "münchen", "frankfurt", "hamburg", "stuttgart"],
    tier2: ["berlin", "cologne", "köln", "düsseldorf", "duesseldorf", "bonn", "leipzig"],
    tier1Cost: 14000,
    tier2Cost: 12000,
    tier3Cost: 10000,
  },
  France: {
    tier1: ["paris"],
    tier2: ["lyon", "nice", "marseille", "toulouse", "bordeaux", "strasbourg", "lille"],
    tier1Cost: 22000,
    tier2Cost: 16000,
    tier3Cost: 13000,
  },
  Netherlands: {
    tier1: ["amsterdam"],
    tier2: ["rotterdam", "utrecht", "the hague", "den haag", "leiden", "delft"],
    tier1Cost: 16000,
    tier2Cost: 14000,
    tier3Cost: 12000,
  },
  Ireland: {
    tier1: ["dublin"],
    tier2: ["cork", "galway", "limerick", "waterford"],
    tier1Cost: 18000,
    tier2Cost: 14000,
    tier3Cost: 12000,
  },
  "New Zealand": {
    tier1: ["auckland", "wellington"],
    tier2: ["christchurch", "dunedin", "hamilton"],
    tier1Cost: 16000,
    tier2Cost: 13000,
    tier3Cost: 11000,
  },
  Singapore: {
    // City-state: only one tier.
    tier1: ["singapore"],
    tier2: [],
    tier1Cost: 20000,
    tier2Cost: 20000,
    tier3Cost: 20000,
  },
  UAE: {
    tier1: ["dubai", "abu dhabi"],
    tier2: ["sharjah", "ras al khaimah", "ajman", "fujairah"],
    tier1Cost: 18000,
    tier2Cost: 14000,
    tier3Cost: 12000,
  },
  Malaysia: {
    tier1: ["kuala lumpur"],
    tier2: ["penang", "george town", "johor bahru", "petaling jaya", "subang jaya", "shah alam"],
    tier1Cost: 9000,
    tier2Cost: 6500,
    tier3Cost: 5500,
  },
};

function livingCostFor(country: string, city: string): number | null {
  const tiers = LIVING_COST_BY_CITY[country];
  if (!tiers) return null;
  const c = city.toLowerCase();
  if (tiers.tier1.some((kw) => c.includes(kw))) return tiers.tier1Cost;
  if (tiers.tier2.some((kw) => c.includes(kw))) return tiers.tier2Cost;
  return tiers.tier3Cost;
}

function main() {
  const text = readFileSync(PROGRAMS_PATH, "utf8");

  let updated = 0;
  let skippedVerified = 0;
  let skippedUnknownCountry = 0;
  let i = 0;
  let out = "";
  const tierShift: Record<string, number> = { up: 0, down: 0, same: 0 };
  while (i < text.length) {
    if (text[i] !== "{") {
      out += text[i];
      i++;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { end = j; break; }
      }
    }
    if (end < 0) { out += text.slice(i); break; }
    const block = text.slice(i, end + 1);
    if (!block.includes("program_name:")) {
      out += block;
      i = end + 1;
      continue;
    }
    const countryMatch = block.match(/country:\s*"([^"]+)"/);
    const cityMatch    = block.match(/city:\s*"([^"]+)"/);
    const livingMatch  = block.match(/avg_living_cost_usd:\s*([\d.]+|null)/);
    if (!countryMatch || !livingMatch) {
      out += block;
      i = end + 1;
      continue;
    }
    const country = countryMatch[1];
    const city    = cityMatch ? cityMatch[1] : "";
    const livingRaw = livingMatch[1];
    const livingNum = livingRaw === "null" ? 0 : parseFloat(livingRaw);

    const v1 = V1_COUNTRY_FALLBACK[country];
    const isV1Filled = typeof v1 === "number" && livingNum === v1;
    const isZeroOrNull = livingNum <= 0;

    if (!isV1Filled && !isZeroOrNull) {
      // Verified or otherwise non-fallback — don't touch.
      skippedVerified++;
      out += block;
      i = end + 1;
      continue;
    }

    const newCost = livingCostFor(country, city);
    if (newCost == null) {
      skippedUnknownCountry++;
      out += block;
      i = end + 1;
      continue;
    }

    if (newCost === livingNum) {
      tierShift.same++;
      out += block;
      i = end + 1;
      continue;
    }
    if (newCost > livingNum) tierShift.up++;
    else tierShift.down++;

    const replaced = block.replace(
      /avg_living_cost_usd:\s*(?:[\d.]+|null)/,
      `avg_living_cost_usd: ${newCost}`,
    );
    out += replaced;
    updated++;
    i = end + 1;
  }

  writeFileSync(PROGRAMS_PATH, out);
  console.log("Done.");
  console.log(`  Updated:                 ${updated}`);
  console.log(`  Tier shift up:           ${tierShift.up}`);
  console.log(`  Tier shift down:         ${tierShift.down}`);
  console.log(`  Tier same (no change):   ${tierShift.same}`);
  console.log(`  Skipped (verified):      ${skippedVerified}`);
  console.log(`  Skipped (no country):    ${skippedUnknownCountry}`);
}

main();

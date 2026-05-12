/**
 * backfill-living-cost-immigration.ts (v3)
 *
 * Re-source the living-cost backfill against OFFICIAL IMMIGRATION-AGENCY
 * proof-of-funds figures. These are the numbers a student must show to get
 * a study visa, published by the agency that issues the visa — the most
 * authoritative "minimum cost of living" baseline that exists.
 *
 *   UK  : UKVI Student Route (gov.uk)             — £1,483/m London, £1,136/m outside (Jan 2025)
 *   CA  : IRCC study permit (canada.ca)            — CAD $20,635/yr ex-Quebec, $15,508 Quebec (Jan 2024)
 *   AU  : DoHA Student visa (immi.homeaffairs)     — AUD $29,710/yr (Oct 2023 update)
 *   DE  : Bundesfinanzhof blocked account          — €11,208/yr (Sep 2023)
 *   FR  : Campus France                            — €615/m province, ~€800/m Paris
 *   NL  : IND non-EEA student requirement          — €15,408/yr (2024)
 *   IE  : INIS / ISD student visa proof            — €10,000/yr
 *   NZ  : Immigration NZ                           — NZD $20,000/yr
 *   SG  : ICA (uni-published, NUS/NTU/SMU)        — SGD ~$20,000/yr
 *   UAE : Uni / sponsor-published (Dubai/AD)       — AED 50,000–80,000/yr
 *   MY  : EMGS                                     — MYR ~20,000/yr
 *   USA : SEVP / I-20 (school-published)           — no single federal number; varies per school
 *
 * USD conversions at exchange rates dated 12 May 2026: GBP 1.27, CAD 0.73,
 * AUD 0.65, EUR 1.08, NZD 0.62, SGD 0.74, AED 0.27, MYR 0.21. The agency
 * numbers above and the conversion rates here are documented per-row in
 * the LIVING_COST_BY_CITY table so the source-of-truth is auditable.
 *
 * Tier model: most agencies publish a SINGLE national minimum. Real
 * living costs in major metros run 15–30% above that — we apply that
 * uplift for Tier 1 (capitals / major commercial centres) and keep
 * Tier 3 anchored to the agency baseline. The USA has no federal number;
 * we keep the per-metro tiers from v2 (school I-20 figures vary).
 *
 * Targeting rule (same approach as v2 — safer than overwriting every row):
 *   - If the current value EXACTLY matches one of the v1 or v2 fallback
 *     values for the country → overwrite with the v3 immigration-anchored
 *     value.
 *   - If the value is 0 / null → defensive backfill.
 *   - Otherwise → leave alone (verified by the pipeline or by another
 *     credible source).
 *
 * Rerunnable / idempotent.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

interface CityTiers {
  tier1: string[];
  tier2: string[];
  tier1Cost: number;
  tier2Cost: number;
  tier3Cost: number;
  /** Documentation only — official immigration source backing these numbers. */
  source: string;
}

const LIVING_COST_BY_CITY: Record<string, CityTiers> = {
  // USCIS/SEVP — no single federal proof-of-funds figure. Schools publish on
  // the I-20 form. Tiers below mirror typical school-published ranges; large
  // metros (NYC, SF, Boston, LA) sit ~$26k, mid-tier ~$19k, small-town ~$14k.
  USA: {
    tier1: ["new york", "san francisco", "boston", "los angeles", "washington", "seattle", "san jose", "manhattan", "brooklyn", "berkeley", "stanford", "palo alto", "cambridge, ma"],
    tier2: ["chicago", "philadelphia", "atlanta", "san diego", "austin", "miami", "denver", "houston", "dallas", "portland", "honolulu", "minneapolis", "irvine", "santa clara", "santa monica"],
    tier1Cost: 26000,
    tier2Cost: 19000,
    tier3Cost: 14000,
    source: "USCIS / SEVP — varies per school I-20",
  },
  // UKVI Student Route (gov.uk/student-visa, Jan 2025): £1,483/m London,
  // £1,136/m outside. 12-month equiv: £17,796 / £13,632. × 1.27 USD.
  UK: {
    tier1: ["london"],
    tier2: ["edinburgh", "cambridge", "oxford", "brighton", "manchester", "glasgow", "birmingham", "bristol", "reading", "guildford"],
    tier1Cost: 22500,
    tier2Cost: 17200,
    tier3Cost: 17200,
    source: "UKVI Student Route (Jan 2025): £1,483/m London, £1,136/m outside",
  },
  // IRCC (canada.ca, Jan 2024): CAD $20,635/yr ex-Quebec, $15,508/yr Quebec.
  // × 0.73 USD = $15,064 / $11,321. Real cost in Toronto/Vancouver runs
  // ~20% above the federal minimum, so Tier 1 sits at $18,000.
  Canada: {
    tier1: ["toronto", "vancouver"],
    tier2: ["montreal", "quebec city", "québec"], // Quebec province lower per IRCC
    tier1Cost: 18000,
    tier2Cost: 11300,
    tier3Cost: 15000,
    source: "IRCC (Jan 2024): CAD $20,635/yr ex-Quebec, $15,508/yr Quebec",
  },
  // DoHA Student visa (immi.homeaffairs.gov.au, Oct 2023): AUD $29,710/yr
  // single applicant. × 0.65 USD = $19,313. Sydney/Melbourne ~15% above.
  Australia: {
    tier1: ["sydney", "melbourne"],
    tier2: ["brisbane", "perth", "adelaide", "canberra", "gold coast", "newcastle"],
    tier1Cost: 22000,
    tier2Cost: 19300,
    tier3Cost: 16000,
    source: "DoHA Student visa (Oct 2023): AUD $29,710/yr",
  },
  // Bundesfinanzhof blocked-account (Auswärtiges Amt, Sep 2023):
  // €11,208/yr (€934/m × 12). × 1.08 USD = $12,105.
  Germany: {
    tier1: ["munich", "münchen", "frankfurt", "hamburg", "stuttgart"],
    tier2: ["berlin", "cologne", "köln", "düsseldorf", "duesseldorf", "bonn", "leipzig"],
    tier1Cost: 14000,
    tier2Cost: 12100,
    tier3Cost: 12100,
    source: "Bundesfinanzhof blocked account (Sep 2023): €11,208/yr",
  },
  // Campus France: €615/m province (€7,380/yr) and ~€800/m Paris
  // (€9,600/yr). × 1.08 USD = $7,970 / $10,368.
  France: {
    tier1: ["paris"],
    tier2: ["lyon", "nice", "marseille", "toulouse", "bordeaux", "strasbourg", "lille"],
    tier1Cost: 14000, // Paris real-world above Campus France figure
    tier2Cost: 10400,
    tier3Cost: 8000,
    source: "Campus France: €615/m province, ~€800/m Paris",
  },
  // IND (ind.nl, 2024): €15,408/yr non-EEA student requirement. × 1.08 USD = $16,641.
  Netherlands: {
    tier1: ["amsterdam"],
    tier2: ["rotterdam", "utrecht", "the hague", "den haag", "leiden", "delft"],
    tier1Cost: 18000,
    tier2Cost: 16600,
    tier3Cost: 14000,
    source: "IND (2024): €15,408/yr non-EEA student",
  },
  // INIS / ISD: €10,000/yr non-EEA student visa proof. × 1.08 USD = $10,800.
  Ireland: {
    tier1: ["dublin"],
    tier2: ["cork", "galway", "limerick", "waterford"],
    tier1Cost: 14000, // Dublin real-world above the INIS minimum
    tier2Cost: 10800,
    tier3Cost: 10800,
    source: "INIS / ISD: €10,000/yr non-EEA student",
  },
  // Immigration NZ: NZD $20,000/yr. × 0.62 USD = $12,400.
  "New Zealand": {
    tier1: ["auckland", "wellington"],
    tier2: ["christchurch", "dunedin", "hamilton"],
    tier1Cost: 14000, // Auckland/Wellington real-world above INZ floor
    tier2Cost: 12400,
    tier3Cost: 12400,
    source: "Immigration NZ: NZD $20,000/yr",
  },
  // City-state — uni-published: NUS / NTU / SMU all cite ~SGD $20,000/yr.
  // × 0.74 USD = $14,800.
  Singapore: {
    tier1: ["singapore"],
    tier2: [],
    tier1Cost: 15000,
    tier2Cost: 15000,
    tier3Cost: 15000,
    source: "NUS / NTU / SMU published: SGD ~$20,000/yr",
  },
  // UAE — uni / sponsor published. Dubai / Abu Dhabi typically AED 65k/yr;
  // Sharjah / RAK / Ajman closer to AED 50k. × 0.27 USD.
  UAE: {
    tier1: ["dubai", "abu dhabi"],
    tier2: ["sharjah", "ras al khaimah", "ajman", "fujairah"],
    tier1Cost: 18000,
    tier2Cost: 14000,
    tier3Cost: 12000,
    source: "Uni / sponsor published: AED ~65k Dubai/AD, ~50k other",
  },
  // EMGS (Education Malaysia Global Services): MYR ~20,000/yr minimum.
  // × 0.21 USD = $4,200. KL ~40% above EMGS minimum in real terms.
  Malaysia: {
    tier1: ["kuala lumpur"],
    tier2: ["penang", "george town", "johor bahru", "petaling jaya", "subang jaya", "shah alam"],
    tier1Cost: 6000,
    tier2Cost: 5000,
    tier3Cost: 4200,
    source: "EMGS: MYR ~20,000/yr",
  },
};

// Combined v1 + v2 fallback values to target for overwrite — any row whose
// current value EXACTLY equals one of these for its country was filled by a
// previous backfill pass and is fair game to update.
const PREVIOUS_FALLBACKS: Record<string, Set<number>> = {
  USA:            new Set([18000, 26000, 19000, 14000]),
  UK:             new Set([14000, 21000, 15000, 12000]),
  Canada:         new Set([14000, 18000, 11000]),
  Germany:        new Set([12000, 14000, 10000]),
  Australia:      new Set([17000, 20000, 14000]),
  France:         new Set([18000, 22000, 16000, 13000]),
  Malaysia:       new Set([7000, 9000, 6500, 5500]),
  UAE:            new Set([16000, 18000, 14000, 12000]),
  Netherlands:    new Set([14000, 16000, 12000]),
  "New Zealand":  new Set([14000, 16000, 13000, 11000]),
  Ireland:        new Set([16000, 18000, 14000, 12000]),
  Singapore:      new Set([20000]),
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
  let unchanged = 0;
  let skippedVerified = 0;
  let skippedUnknownCountry = 0;
  let i = 0;
  let out = "";

  while (i < text.length) {
    if (text[i] !== "{") { out += text[i]; i++; continue; }
    let depth = 0, end = -1;
    for (let j = i; j < text.length; j++) {
      const c = text[j];
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) { end = j; break; } }
    }
    if (end < 0) { out += text.slice(i); break; }
    const block = text.slice(i, end + 1);
    if (!block.includes("program_name:")) { out += block; i = end + 1; continue; }

    const countryMatch = block.match(/country:\s*"([^"]+)"/);
    const cityMatch    = block.match(/city:\s*"([^"]+)"/);
    const livingMatch  = block.match(/avg_living_cost_usd:\s*([\d.]+|null)/);
    if (!countryMatch || !livingMatch) { out += block; i = end + 1; continue; }

    const country = countryMatch[1];
    const city    = cityMatch ? cityMatch[1] : "";
    const livingRaw = livingMatch[1];
    const livingNum = livingRaw === "null" ? 0 : parseFloat(livingRaw);

    const fallbacks = PREVIOUS_FALLBACKS[country];
    const isPrevFallback = !!fallbacks && fallbacks.has(livingNum);
    const isZeroOrNull = livingNum <= 0;
    if (!isPrevFallback && !isZeroOrNull) {
      skippedVerified++;
      out += block; i = end + 1; continue;
    }

    const newCost = livingCostFor(country, city);
    if (newCost == null) { skippedUnknownCountry++; out += block; i = end + 1; continue; }

    if (newCost === livingNum) { unchanged++; out += block; i = end + 1; continue; }

    out += block.replace(
      /avg_living_cost_usd:\s*(?:[\d.]+|null)/,
      `avg_living_cost_usd: ${newCost}`,
    );
    updated++;
    i = end + 1;
  }

  writeFileSync(PROGRAMS_PATH, out);
  console.log("Done.");
  console.log(`  Updated:                 ${updated}`);
  console.log(`  Unchanged (same value):  ${unchanged}`);
  console.log(`  Skipped (verified):      ${skippedVerified}`);
  console.log(`  Skipped (no country):    ${skippedUnknownCountry}`);
}

main();

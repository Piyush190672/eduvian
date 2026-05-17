#!/usr/bin/env python3
"""
Wave B — apply curated city-level living costs to programs.ts.

Reads src/data/city-living-costs.ts (TypeScript dataset with per-city
annual USD costs + source citations) and updates programs.ts:

- Programs whose (country, city) matches a curated entry get their
  avg_living_cost_usd rewritten to the city figure and a
  living_cost_source: "city" field added.
- Programs in cities NOT in the dataset get living_cost_source:
  "country_avg" added (existing avg_living_cost_usd unchanged — it's
  the country mean).

Brace-depth parser, same pattern as normalize-living-costs.py.
Idempotent — safe to re-run after dataset refreshes.

Counts unchanged; only avg_living_cost_usd values + a new field are
modified.
"""
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PROGRAMS_FILE = REPO / "src/data/programs.ts"
DATASET_FILE  = REPO / "src/data/city-living-costs.ts"

# ── 1. Parse the curated dataset (lightweight — match only the value
#       lines; we don't need a full TS parser). The dataset is hand-
#       maintained so structure is predictable.
ds_text = DATASET_FILE.read_text()
# Match: "City Name": { annual_usd: 12345, source: "..." }
# Within a country block bounded by:
#   <Country>: {
#       ...entries...
#   },
country_blocks = re.finditer(
    r'^\s*(?:"([^"]+)"|(\w[\w\s]*))\s*:\s*\{\s*\n((?:\s*//[^\n]*\n|\s*"[^"]+":\s*\{[^}]+\},?\s*\n)*)\s*\}',
    ds_text, flags=re.MULTILINE,
)

cost_by_country: dict = {}
for m in country_blocks:
    country = m.group(1) or m.group(2)
    if not country:
        continue
    inner = m.group(3)
    for em in re.finditer(r'"([^"]+)":\s*\{\s*annual_usd:\s*(\d+)', inner):
        cost_by_country.setdefault(country, {})[em.group(1)] = int(em.group(2))

# Drop the helper exports / non-country keys.
for k in list(cost_by_country):
    if k in {"CityLivingCost", "lookupCityCost"}:
        cost_by_country.pop(k)

total_curated = sum(len(d) for d in cost_by_country.values())
print(f"Parsed dataset: {len(cost_by_country)} countries, {total_curated} city entries")
for c in sorted(cost_by_country):
    print(f"  {c:15s}  {len(cost_by_country[c]):2d} cities")

# ── 2. Walk programs.ts via brace-depth.
text = PROGRAMS_FILE.read_text()
entries = []
depth = 0
in_string = False
sc = ""
start = None
for i, c in enumerate(text):
    if in_string:
        if c == sc and text[i - 1] != "\\":
            in_string = False
    elif c in ('"', "'"):
        in_string = True
        sc = c
    elif c == "{":
        if depth == 0:
            start = i
        depth += 1
    elif c == "}":
        depth -= 1
        if depth == 0 and start is not None:
            entries.append((start, i + 1))
            start = None

print(f"Parsed {len(entries)} program entries from programs.ts")

# ── 3. For each entry, rewrite avg_living_cost_usd + add
#       living_cost_source. Skip if living_cost_source already present
#       (idempotent re-run).
out = []
last_end = 0
city_hits = 0
country_avg_hits = 0
already_tagged = 0
unmatched_cities: dict = {}

for s, e in entries:
    block = text[s:e]
    m_co = re.search(r'country:\s*"([^"]+)"', block)
    m_ci = re.search(r'city:\s*"([^"]+)"', block)
    m_l  = re.search(r"avg_living_cost_usd:\s*(\d+)", block)
    if not (m_co and m_ci and m_l):
        continue
    country = m_co.group(1)
    city = m_ci.group(1)
    if "living_cost_source:" in block:
        already_tagged += 1
        continue
    curated = cost_by_country.get(country, {}).get(city)
    if curated is not None:
        # Rewrite avg_living_cost_usd to the city value + add source tag.
        new_block = (
            block[: m_l.start()]
            + f"avg_living_cost_usd: {curated}, living_cost_source: \"city\""
            + block[m_l.end() :]
        )
        city_hits += 1
    else:
        # Keep country-mean; just tag the source.
        new_block = (
            block[: m_l.end()]
            + ", living_cost_source: \"country_avg\""
            + block[m_l.end() :]
        )
        country_avg_hits += 1
        unmatched_cities.setdefault(country, {})[city] = unmatched_cities.get(country, {}).get(city, 0) + 1
    out.append(text[last_end:s])
    out.append(new_block)
    last_end = e

out.append(text[last_end:])
new_text = "".join(out)

PROGRAMS_FILE.write_text(new_text)
print()
print(f"City-level hits:     {city_hits}")
print(f"Country-avg tagged:  {country_avg_hits}")
print(f"Already tagged:      {already_tagged}")
print(f"Top unmatched cities (would benefit dataset extension):")
flat = [(country, city, count) for country, cities in unmatched_cities.items() for city, count in cities.items()]
for country, city, count in sorted(flat, key=lambda x: -x[2])[:15]:
    print(f"  {count:4d}  {country:15s}  {city}")
print(f"\nWrote {PROGRAMS_FILE}")

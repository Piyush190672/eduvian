#!/usr/bin/env python3
"""
Normalize implausibly-low avg_living_cost_usd values to per-country
median.

User-reported on token 3424d742… (17 May 2026): some programs carry
extraction-error living costs (e.g. UNSW $650/yr where the real Sydney
figure is ~$22k). That poisons ROI.

Detection rule: a value is considered an extraction error if it is
EITHER absolutely implausible (< $3,000/yr) OR < 25% of the country
median computed from all plausibly-valued entries (>= $3,000). The
25% ratio catches outliers like UNSW $650 (3% of Australia's $19,300
median) without false-flagging legitimately-low cities like Curtin
Malaysia $4,200 (84% of Malaysia's $5,000 median).

Strategy:
- Walk programs.ts via brace-depth parser (not regex) — same pattern as
  scripts/data-fixes/normalize-qs-ranks.py.
- For each country, compute median of values >= $3,000.
- Rewrite every value below $3,000 to that country's median.
- Idempotent — safe to re-run after future extractions.

This is a defensive cleanup. The real fix is Wave B (city-level living-
cost backfill from public datasets); this just stops the worst cases
from poisoning ROI until that lands.
"""
import re
from pathlib import Path
from typing import Optional

PROGRAMS_FILE = Path(__file__).resolve().parents[2] / "src/data/programs.ts"
MIN_PLAUSIBLE = 3000
RATIO_FLOOR = 0.25  # values below 25% of country median are extraction errors

text = PROGRAMS_FILE.read_text()

# Phase 1: split file into top-level program entries via brace-depth walk.
entries = []  # list of (start, end)
depth = 0
in_string = False
string_char = ""
start: Optional[int] = None
i = 0
while i < len(text):
    c = text[i]
    if in_string:
        if c == "\\":
            i += 2
            continue
        if c == string_char:
            in_string = False
    else:
        if c in ('"', "'"):
            in_string = True
            string_char = c
        elif c == "{":
            if depth == 0:
                start = i
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0 and start is not None:
                entries.append((start, i + 1))
                start = None
    i += 1

print(f"Parsed {len(entries)} program entries")

# Phase 2: compute per-country median of plausible values.
by_country = {}  # country -> list of values
for s, e in entries:
    block = text[s:e]
    m_co = re.search(r'country:\s*"([^"]+)"', block)
    m_l = re.search(r"avg_living_cost_usd:\s*(\d+)", block)
    if m_co and m_l:
        v = int(m_l.group(1))
        if v >= MIN_PLAUSIBLE:
            by_country.setdefault(m_co.group(1), []).append(v)

medians = {}  # country -> int
for c, vs in by_country.items():
    vs_sorted = sorted(vs)
    medians[c] = vs_sorted[len(vs_sorted) // 2]

print(f"Per-country medians: {medians}")

# Phase 3: rewrite low entries in place.
out_parts = []  # list of str chunks
last_end = 0
edits = 0
for s, e in entries:
    block = text[s:e]
    m_co = re.search(r'country:\s*"([^"]+)"', block)
    m_l = re.search(r"avg_living_cost_usd:\s*(\d+)", block)
    if not (m_co and m_l):
        continue
    country = m_co.group(1)
    v = int(m_l.group(1))
    target = medians.get(country)
    if target is None:
        continue
    is_extraction_error = v < MIN_PLAUSIBLE or v < target * RATIO_FLOOR
    if not is_extraction_error:
        continue
    new_block = (
        block[: m_l.start()]
        + f"avg_living_cost_usd: {target}"
        + block[m_l.end() :]
    )
    out_parts.append(text[last_end:s])
    out_parts.append(new_block)
    last_end = e
    edits += 1
out_parts.append(text[last_end:])
new_text = "".join(out_parts)

print(f"Edits applied: {edits}")
PROGRAMS_FILE.write_text(new_text)
print(f"Wrote {PROGRAMS_FILE}")

#!/usr/bin/env python3
"""
Wave B-duration — heuristic backfill of duration_months for the 2,868
programs in src/data/programs.ts that carry null duration.

User-asked-why on 17 May 2026: every uni page publishes duration, so
null in our DB is an extractor gap, not a real-world ambiguity. This
script fills the gap deterministically using country + degree_level +
program_name patterns. Output is tagged `duration_source: "heuristic"`
so the UI / future verifier passes can distinguish heuristic estimates
from extracted figures.

Strategy:
  1. Base default by (country, degree_level). Pulled from publicly-
     documented program-length norms (e.g. UK Master's typically 1 yr,
     US Master's 2 yrs, Bachelor 4 yrs in US/CA but 3 yrs in UK/AU).
  2. Name-based overrides applied on top — e.g. "MPhil" → 11 mo,
     "Integrated MEng" → 48 mo, "PG Diploma" → 12 mo, "PhD"/"Doctor"
     → 48-60 mo depending on country, US MBA → 24 mo, etc.
  3. Where heuristics can't confidently decide, leave null + log for
     the next iteration (an LLM web-search backfill on the residual).

Idempotent. Brace-depth parser, same pattern as the other Wave-B/C
data-fix scripts.

Outputs:
  - programs.ts rewritten with duration_months filled where confident
  - duration_source: "heuristic" appended to each backfilled entry
  - stdout report of: applied count, residual count, top residual
    patterns (drives the LLM Wave A1 prompt for the residual).
"""
import re
from pathlib import Path
from typing import Optional

PROGRAMS = Path(__file__).resolve().parents[2] / "src/data/programs.ts"

# ── Base default by (country, degree_level), in months. ─────────────────────
BASE = {
    ("USA", "postgraduate"):       24,  # 2-year US Master's standard
    ("USA", "undergraduate"):      48,  # 4-year US Bachelor's
    ("UK", "postgraduate"):        12,  # 1-year UK Master's standard
    ("UK", "undergraduate"):       36,  # 3-year UK Bachelor's
    ("Canada", "postgraduate"):    16,
    ("Canada", "undergraduate"):   48,
    ("Germany", "postgraduate"):   24,
    ("Germany", "undergraduate"):  36,
    ("France", "postgraduate"):    24,
    ("France", "undergraduate"):   36,
    ("Australia", "postgraduate"): 18,
    ("Australia", "undergraduate"):36,
    ("New Zealand", "postgraduate"):  18,
    ("New Zealand", "undergraduate"): 36,
    ("Ireland", "postgraduate"):   12,
    ("Ireland", "undergraduate"):  36,
    ("Netherlands", "postgraduate"):  18,
    ("Netherlands", "undergraduate"): 36,
    ("Singapore", "postgraduate"): 18,
    ("Singapore", "undergraduate"):48,
    ("UAE", "postgraduate"):       18,
    ("UAE", "undergraduate"):      48,
    ("Malaysia", "postgraduate"):  18,
    ("Malaysia", "undergraduate"): 36,
    ("USA", "diploma"):            12,
    ("USA", "pg_diploma"):         12,
    ("Canada", "diploma"):         24,
    ("Canada", "pg_diploma"):      12,
    ("Canada", "both"):            36,
    ("UK", "both"):                36,
}

# ── Name-based overrides. Applied AFTER base lookup. Each rule:
#       (regex on program_name, country filter or None, degree_level filter
#        or None) → duration in months. First match wins (in order). ──────
RULES = [
    # PhD / Doctorate — overrides any Master/Bachelor default.
    (re.compile(r"\b(PhD|Ph\.?D|Doctor of Philosophy|Doctorate|DPhil)\b", re.I),
     None, None, 48),
    (re.compile(r"^Doctor of\b", re.I),
     None, None, 48),  # Doctor of Medicine, Doctor of Education, etc.

    # MPhil — research master's, 1-2 years
    (re.compile(r"\bMPhil\b", re.I), None, None, 12),

    # MBA — US is 2 years, elsewhere typically 1-1.5
    (re.compile(r"\bMBA\b", re.I), "USA", "postgraduate", 24),
    (re.compile(r"\bExecutive MBA\b|\bEMBA\b", re.I), None, None, 18),
    (re.compile(r"\bMBA\b", re.I), None, "postgraduate", 18),

    # Integrated Master's (UK MEng/MSci, 4-year) — common in UK undergrad lists
    (re.compile(r"\b(MEng|MSci|MMath|MChem|MPhys|MComp)\b.*\b(integrated|with placement|with a)\b", re.I),
     "UK", None, 48),
    (re.compile(r"^MEng\b|^MSci\b|^MMath\b|^MChem\b|^MPhys\b", re.I),
     "UK", "undergraduate", 48),

    # Foundation / pre-university year
    (re.compile(r"\bFoundation\b|\bPre[- ]?University\b", re.I),
     None, None, 12),

    # Postgraduate Diploma / Certificate
    (re.compile(r"\bPG\s*Diploma\b|\bPostgraduate Diploma\b|\bPGDip\b", re.I),
     None, None, 9),
    (re.compile(r"\bGraduate Certificate\b|\bPGCert\b", re.I),
     None, None, 6),

    # Master of Engineering (1-year US) / Master of Architecture (US ~2.5 yrs)
    (re.compile(r"\bMaster of Architecture\b", re.I), "USA", "postgraduate", 30),

    # German bachelor with integrated practical (common 3-yr in DE)
    (re.compile(r"\bDual\b|\bMit Praxis\b", re.I), "Germany", "undergraduate", 36),

    # Dutch research Master's (typically 24 mo unlike most NL Masters 12 mo)
    (re.compile(r"\bResearch Master\b|\bResearch MSc\b", re.I),
     "Netherlands", "postgraduate", 24),

    # Singapore engineering Bachelor's (4-year standard)
    (re.compile(r"\bBachelor of Engineering\b|\bBEng\b", re.I),
     "Singapore", "undergraduate", 48),

    # Cambridge MPhil specifically (11 mo standard)
    # Handled by university_name check below
]

# Special per-university override (rare cases where the uni norm differs)
UNI_OVERRIDES = {
    "University of Cambridge": {
        re.compile(r"\bMPhil\b", re.I): 11,
    },
    "University of Oxford": {
        re.compile(r"\bMPhil\b", re.I): 21,  # Oxford MPhil is 21 mo
    },
}


def heuristic_duration(country: str, degree_level: str, program_name: str,
                        university_name: str) -> Optional[int]:
    """Return months, or None if no confident rule fires."""
    # University-specific overrides win first
    for uni, rules in UNI_OVERRIDES.items():
        if uni == university_name:
            for rx, months in rules.items():
                if rx.search(program_name):
                    return months
    # Name-based rules
    for rx, country_filter, deg_filter, months in RULES:
        if country_filter and country_filter != country:
            continue
        if deg_filter and deg_filter != degree_level:
            continue
        if rx.search(program_name):
            return months
    # Fall back to base
    return BASE.get((country, degree_level))


# ── Walk programs.ts ────────────────────────────────────────────────────────
text = PROGRAMS.read_text()
entries = []
depth = 0
in_string = False
sc = ""
start: Optional[int] = None
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

print(f"Parsed {len(entries)} program entries")

# ── Apply heuristics ─────────────────────────────────────────────────────────
out = []
last_end = 0
filled = 0
residual = 0
residual_patterns = {}
for s, e in entries:
    block = text[s:e]
    m_d = re.search(r"duration_months:\s*(null|\d+)", block)
    if not m_d:
        continue
    if m_d.group(1) != "null":
        continue  # already has duration
    m_co = re.search(r'country:\s*"([^"]+)"', block)
    m_dl = re.search(r'degree_level:\s*"([^"]+)"', block)
    m_n = re.search(r'program_name:\s*"([^"]+)"', block)
    m_u = re.search(r'university_name:\s*"([^"]+)"', block)
    if not (m_co and m_dl and m_n and m_u):
        continue
    months = heuristic_duration(
        m_co.group(1), m_dl.group(1), m_n.group(1), m_u.group(1)
    )
    if months is None:
        residual += 1
        key = (m_co.group(1), m_dl.group(1), m_n.group(1)[:40])
        residual_patterns[key] = residual_patterns.get(key, 0) + 1
        continue
    # Rewrite duration_months + add duration_source tag.
    new_block = (
        block[: m_d.start()]
        + f"duration_months: {months}, duration_source: \"heuristic\""
        + block[m_d.end() :]
    )
    out.append(text[last_end:s])
    out.append(new_block)
    last_end = e
    filled += 1

out.append(text[last_end:])
new_text = "".join(out)

PROGRAMS.write_text(new_text)

print(f"\nFilled:   {filled}")
print(f"Residual: {residual}")
print(f"Wrote {PROGRAMS}")

if residual_patterns:
    print(f"\nTop residual patterns ({min(len(residual_patterns), 15)} of {len(residual_patterns)}):")
    for k, n in sorted(residual_patterns.items(), key=lambda x: -x[1])[:15]:
        print(f"  {n:4d}  {k[0]:12s} {k[1]:14s}  {k[2]}")

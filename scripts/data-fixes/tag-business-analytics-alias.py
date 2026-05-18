#!/usr/bin/env python3
"""
Add "Business Analytics" to field_aliases on every program whose
program_name contains "Business Analytics" (case-insensitive).

User-reported (18 May 2026): "Business Analytics" is a popular standalone
field but wasn't a first-class option in FIELDS_OF_STUDY. Users had to
pick "Others" + type, or proxy via "Data Science" / "Business &
Management". Now that BA is a 22nd primary field, this script backfills
field_aliases on 155 affected programs so the matcher's alias path picks
them up when a user selects "Business Analytics" from the dropdown.

Strategy:
- Walk programs.ts via brace-depth (same pattern as other Wave fixes).
- For each program with /\\bbusiness analytics\\b/i in name:
  - If field_aliases exists and already includes "Business Analytics" → skip
  - If field_aliases exists but missing BA → append BA
  - If field_aliases doesn't exist → add it as a single-item array
- Primary field_of_study UNCHANGED (most are "Data Science" / "Business
  & Management" — keeping the existing classification so the
  Data-Science user's view doesn't change).

Idempotent. Counts unchanged: 9,298 programs.
"""
import re
from pathlib import Path
from typing import Optional

PROGRAMS = Path(__file__).resolve().parents[2] / "src/data/programs.ts"
# Multi-alias backfill: add BOTH "Business Analytics" (the new
# first-class field) AND "Business & Management" (the existing field
# users intuitively associate with BA). After both, a user picking
# either field sees all 155 BA programs.
ALIASES_TO_ADD = ["Business Analytics", "Business & Management"]
NAME_PATTERN = re.compile(r"\bbusiness analytics\b", re.I)

text = PROGRAMS.read_text()

# Brace-depth split into program entries.
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

out = []
last_end = 0
added = 0
already = 0
skipped_no_name = 0
for s, e in entries:
    block = text[s:e]
    m_n = re.search(r'program_name:\s*"([^"]+)"', block)
    if not m_n:
        continue
    if not NAME_PATTERN.search(m_n.group(1)):
        continue

    # Does this program already have field_aliases?
    m_aliases = re.search(r'field_aliases:\s*\[([^\]]*)\]', block)
    if m_aliases:
        existing = re.findall(r'"([^"]+)"', m_aliases.group(1))
        missing = [a for a in ALIASES_TO_ADD if a not in existing]
        if not missing:
            already += 1
            continue
        new_arr = "[" + ", ".join(f'"{a}"' for a in [*existing, *missing]) + "]"
        new_block = block[: m_aliases.start()] + f"field_aliases: {new_arr}" + block[m_aliases.end():]
    else:
        # No field_aliases field — insert after field_of_study.
        m_fs = re.search(r'(field_of_study:\s*"[^"]+",?)', block)
        if not m_fs:
            skipped_no_name += 1
            continue
        aliases_lit = ", ".join(f'"{a}"' for a in ALIASES_TO_ADD)
        new_block = block[: m_fs.end()] + f' field_aliases: [{aliases_lit}],' + block[m_fs.end():]

    out.append(text[last_end:s])
    out.append(new_block)
    last_end = e
    added += 1

out.append(text[last_end:])
new_text = "".join(out)

PROGRAMS.write_text(new_text)
print(f"Added/extended aliases on:              {added}")
print(f"Already had all required aliases:       {already}")
print(f"Skipped (couldn't anchor insertion):    {skipped_no_name}")
print(f"Wrote {PROGRAMS}")

#!/usr/bin/env python3
"""
Bulk-tag field_aliases for the 7 new first-class fields promoted on
18 May 2026: Marketing, FinTech, Education, International Relations,
Public Policy & Administration, Film & Animation, Renewable Energy.

For each (field_label, name_regex) pair: walks programs.ts, finds
every program whose program_name matches the regex, ensures the
field_label is in field_aliases. Primary field_of_study is NOT
changed — programs keep their existing classification, the alias just
makes them surface when a user picks the new field from the dropdown.

Single-alias-only policy (per user pushback 18 May 2026 on the BA →
B&M cross-list): each program gets ONLY the field that matches its
name. No transitive cross-listing across categories.

Brace-depth walker (same pattern as the other Wave fixes).
Idempotent — safe to re-run.
"""
import re
from pathlib import Path
from typing import Optional

PROGRAMS = Path(__file__).resolve().parents[2] / "src/data/programs.ts"

NEW_FIELDS = [
    ("Marketing",                       re.compile(r"\bmarketing\b", re.I)),
    ("FinTech",                         re.compile(r"\b(fintech|financial technology)\b", re.I)),
    ("Education",                       re.compile(r"\beducation\b", re.I)),
    ("International Relations",         re.compile(r"\b(international relations|international affairs|diplomacy|global affairs|international studies)\b", re.I)),
    ("Public Policy & Administration",  re.compile(r"\b(public policy|public administration|public affairs)\b", re.I)),
    ("Film & Animation",                re.compile(r"\b(film|cinema|animation|vfx|visual effects)\b", re.I)),
    ("Renewable Energy",                re.compile(r"\b(renewable energy|sustainable energy|energy systems|solar energy|wind energy)\b", re.I)),
]

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

per_field_added = {label: 0 for label, _ in NEW_FIELDS}
out = []
last_end = 0
total_modified = 0
already_complete = 0

for s, e in entries:
    block = text[s:e]
    m_n = re.search(r'program_name:\s*"([^"]+)"', block)
    if not m_n:
        continue
    name = m_n.group(1)

    aliases_to_add = [label for label, rx in NEW_FIELDS if rx.search(name)]
    if not aliases_to_add:
        continue

    m_aliases = re.search(r'field_aliases:\s*\[([^\]]*)\]', block)
    if m_aliases:
        existing = re.findall(r'"([^"]+)"', m_aliases.group(1))
        missing = [a for a in aliases_to_add if a not in existing]
        if not missing:
            already_complete += 1
            continue
        new_arr = "[" + ", ".join(f'"{a}"' for a in [*existing, *missing]) + "]"
        new_block = block[: m_aliases.start()] + f"field_aliases: {new_arr}" + block[m_aliases.end():]
        for a in missing:
            per_field_added[a] += 1
    else:
        m_fs = re.search(r'(field_of_study:\s*"[^"]+",?)', block)
        if not m_fs:
            continue
        aliases_lit = ", ".join(f'"{a}"' for a in aliases_to_add)
        new_block = block[: m_fs.end()] + f' field_aliases: [{aliases_lit}],' + block[m_fs.end():]
        for a in aliases_to_add:
            per_field_added[a] += 1

    out.append(text[last_end:s])
    out.append(new_block)
    last_end = e
    total_modified += 1

out.append(text[last_end:])
new_text = "".join(out)

PROGRAMS.write_text(new_text)

print(f"\nTotal program rows modified: {total_modified}")
print(f"Rows that already had all aliases (skipped): {already_complete}")
print(f"\nAliases added per new field:")
for label, n in per_field_added.items():
    print(f"  {n:5d}  {label}")
print(f"\nWrote {PROGRAMS}")

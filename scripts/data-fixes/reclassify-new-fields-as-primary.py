#!/usr/bin/env python3
"""
Reclassify the aligned programs so their PRIMARY field_of_study is the
new specific field (Business Analytics, FinTech, Marketing, Education,
International Relations, Public Policy & Administration, Film &
Animation, Renewable Energy) — not the broader parent (Data Science,
Business & Management, Social Sciences & Humanities, etc.) they were
classified under originally.

User-asked (18 May 2026, after promoting 7 new fields): "map the
aligned programs under these new heads".

Consistent with the earlier no-cross-listing pushback (9b413c94): each
program lives under its single most-specific primary. No alias bridge
to the broader parent. A user picking "Data Science" no longer sees
the 133 BA programs (those live under "Business Analytics" now); a
user picking "Business & Management" no longer sees Marketing programs.
Clean dropdown separation.

Strategy:
1. Walk programs.ts via brace-depth.
2. For each program, check its field_aliases for membership in NEW_FIELDS.
3. If exactly one new-field alias is present → that becomes primary.
4. If multiple new-field aliases are present (program name contains
   multiple matched terms) → use PRIORITY order: FinTech > Business
   Analytics > Marketing > International Relations > Public Policy &
   Administration > Education > Film & Animation > Renewable Energy.
5. Strip the now-redundant alias from field_aliases. If field_aliases
   becomes empty, drop the field entirely.
6. Programs already with primary = one of the new fields are skipped
   (idempotent re-run safe).

Counts unchanged.
"""
import re
from pathlib import Path
from typing import Optional

PROGRAMS = Path(__file__).resolve().parents[2] / "src/data/programs.ts"

PRIORITY = [
    "FinTech",
    "Business Analytics",
    "Marketing",
    "International Relations",
    "Public Policy & Administration",
    "Education",
    "Film & Animation",
    "Renewable Energy",
]
NEW_FIELDS = set(PRIORITY)

text = PROGRAMS.read_text()

# Brace-depth walker.
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

per_field_promoted = {f: 0 for f in PRIORITY}
already_primary = {f: 0 for f in PRIORITY}
out = []
last_end = 0
modified = 0
empty_aliases_dropped = 0

for s, e in entries:
    block = text[s:e]
    m_fs = re.search(r'field_of_study:\s*"([^"]+)"', block)
    if not m_fs:
        continue
    current_primary = m_fs.group(1)

    # Already a new-field primary? skip.
    if current_primary in NEW_FIELDS:
        already_primary[current_primary] += 1
        continue

    m_aliases = re.search(r'field_aliases:\s*\[([^\]]*)\]', block)
    if not m_aliases:
        continue
    aliases = re.findall(r'"([^"]+)"', m_aliases.group(1))

    # Find new-field aliases on this program; pick the highest-priority one.
    matched = [f for f in PRIORITY if f in aliases]
    if not matched:
        continue
    new_primary = matched[0]

    # Rewrite primary.
    new_block = block[: m_fs.start()] + f'field_of_study: "{new_primary}"' + block[m_fs.end():]

    # Strip the chosen alias from field_aliases.
    remaining_aliases = [a for a in aliases if a != new_primary]
    # Re-locate the aliases field in the rewritten block (start may have shifted).
    m_aliases2 = re.search(r'field_aliases:\s*\[([^\]]*)\]', new_block)
    if m_aliases2:
        if remaining_aliases:
            new_arr = "[" + ", ".join(f'"{a}"' for a in remaining_aliases) + "]"
            new_block = new_block[: m_aliases2.start()] + f"field_aliases: {new_arr}" + new_block[m_aliases2.end():]
        else:
            # Drop the entire field_aliases declaration (with its trailing comma).
            new_block = re.sub(r',?\s*field_aliases:\s*\[\s*\]', '', new_block)
            empty_aliases_dropped += 1

    out.append(text[last_end:s])
    out.append(new_block)
    last_end = e
    modified += 1
    per_field_promoted[new_primary] += 1

out.append(text[last_end:])
new_text = "".join(out)

PROGRAMS.write_text(new_text)

print(f"\nProgram rows modified: {modified}")
print(f"Empty alias arrays dropped: {empty_aliases_dropped}")
print(f"\nPromoted to primary by field:")
for f in PRIORITY:
    print(f"  {per_field_promoted[f]:5d}  {f}")
print(f"\nAlready primary (skipped):")
for f in PRIORITY:
    if already_primary[f]:
        print(f"  {already_primary[f]:5d}  {f}")
print(f"\nWrote {PROGRAMS}")

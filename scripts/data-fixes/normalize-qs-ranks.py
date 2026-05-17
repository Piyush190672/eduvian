#!/usr/bin/env python3
"""
Normalize qs_ranking across all programs at the same university.

Different verifier runs occasionally extracted a SUBJECT-specific QS rank
(e.g. "QS World Subject Ranking — Engineering") instead of the overall
QS World University Rank. The result is that the same university shows up
on /results with different QS pills across its programs (Cambridge #2 on
one card, #6 on another — user-reported 17 May 2026).

Strategy: for each university with >1 distinct non-null qs_ranking, take
the majority value (ties → smaller rank wins, since the discrepancy is
typically a subject-rank intrusion which is usually smaller than the
overall rank, but the OVERALL rank is the one that should appear on
results cards). null entries are left untouched.

In-place rewrite of src/data/programs.ts. Idempotent.
"""
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

PROGRAMS_FILE = Path(__file__).resolve().parents[2] / "src/data/programs.ts"

text = PROGRAMS_FILE.read_text()

# Walk the file linearly, splitting on top-level braces. The programs array
# entries are objects at indent depth 2 (inside the PROGRAMS = [ ... ]).
# We use a stateful regex-like walker because individual entries contain
# nested arrays / strings.
entries = []  # list of (start_idx, end_idx)
depth = 0
in_string = False
string_char = ""
start = None
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

# Phase 1: gather rank votes per university
uni_ranks = defaultdict(Counter)
for s, e in entries:
    block = text[s:e]
    m_uni = re.search(r'university_name:\s*"([^"]+)"', block)
    m_qs = re.search(r'qs_ranking:\s*(\d+|null)', block)
    if m_uni and m_qs and m_qs.group(1) != "null":
        uni_ranks[m_uni.group(1)][int(m_qs.group(1))] += 1

# Phase 2: pick the majority rank per uni (with the >1-distinct test)
target_rank = {}
for uni, counter in uni_ranks.items():
    if len(counter) <= 1:
        continue
    # Majority vote. Ties → smaller value (typically the world-rank surface
    # vs subject-rank which tends to be larger for top unis like Cambridge
    # where subject AI = #2 vs world = #6).
    max_count = max(counter.values())
    candidates = [r for r, c in counter.items() if c == max_count]
    target_rank[uni] = min(candidates)

print(f"Universities needing normalization: {len(target_rank)}")
for uni, rank in sorted(target_rank.items())[:10]:
    print(f"  -> {uni}: {dict(uni_ranks[uni])} → {rank}")

# Phase 3: rewrite each affected entry in place, building output
out_parts = []
last_end = 0
edits = 0
for s, e in entries:
    block = text[s:e]
    m_uni = re.search(r'university_name:\s*"([^"]+)"', block)
    m_qs = re.search(r'qs_ranking:\s*(\d+)', block)
    if m_uni and m_qs:
        uni = m_uni.group(1)
        current = int(m_qs.group(1))
        target = target_rank.get(uni)
        if target is not None and current != target:
            # Replace this single qs_ranking occurrence.
            new_block = block[:m_qs.start()] + f"qs_ranking: {target}" + block[m_qs.end():]
            out_parts.append(text[last_end:s])
            out_parts.append(new_block)
            last_end = e
            edits += 1
out_parts.append(text[last_end:])
new_text = "".join(out_parts)
print(f"Edits applied: {edits}")

PROGRAMS_FILE.write_text(new_text)
print(f"Wrote {PROGRAMS_FILE}")

#!/usr/bin/env python3
"""
One-off cleanup: remove duplicate rows from src/data/programs.ts where the
(university_name, program_name, degree_level, field_of_study,
specialization) tuple matches case-insensitively.

Discovered 14 May 2026 after a user reported "University of Houston · MS
Computer Science - AI Track" appearing twice in their shortlist.
Investigation found 8 duplicate groups totalling ~95 rows:
  - 1 Houston group (2 rows; case difference defeated merge.ts dedup)
  - 7 "trailing-backslash program_name" groups (16-17 rows each — verifier
    inserted the same row that many times, literally identical including
    verified_at timestamp)

Uses a brace-counting parser that tracks string state, NOT a regex —
the data file mixes `},` and `},,` and `},,,` separators from accumulated
verify-pipeline edits, and a regex misses ~256 of 8,312 rows. Per the
CLAUDE.md verification-pipeline rule, brace walkers must track strings.

Keep-first policy: lowest-index occurrence wins. For Houston the
lowest-index row happens to be the richest (has fee + intake + min_gpa);
for the trailing-backslash groups all rows are literally identical so
the choice is arbitrary but deterministic.

Idempotent.

Usage:
  python3 scripts/verify/dedupe-programs.py             # write back
  python3 scripts/verify/dedupe-programs.py --dry-run   # report only
"""
import re
import sys
from collections import defaultdict
from pathlib import Path

PROGRAMS_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "programs.ts"


def parse_entries(text: str) -> tuple[str, list[tuple[int, int]], str]:
    """Return (header_text, list of (start, end) spans for each entry,
    footer_text). Each span covers one complete object literal including
    its trailing commas and the newline after them.

    Walks character by character, tracking:
      - inside-string (with `\\` escape)
      - brace depth
    An entry is captured when brace depth returns to 0 after opening.
    Trailing commas + whitespace up to (but not including) the next `{`
    or the array close are absorbed into the entry's span.
    """
    array_open = text.index("([\n")
    array_close = text.rindex("]) as ProgramEntry[];")
    header = text[: array_open + 2]
    footer = text[array_close:]
    body = text[array_open + 2 : array_close]
    spans: list[tuple[int, int]] = []
    i = 0
    n = len(body)
    while i < n:
        # Skip whitespace + commas + line comments between entries.
        while i < n:
            if body[i] in " \t\n,":
                i += 1
                continue
            if body[i:i + 2] == "//":
                # Skip rest of line.
                nl = body.find("\n", i)
                i = nl + 1 if nl >= 0 else n
                continue
            break
        if i >= n:
            break
        if body[i] != "{":
            raise RuntimeError(f"unexpected char {body[i]!r} at offset {i} (entry start expected)")
        entry_start = i
        depth = 0
        in_str = False
        while i < n:
            c = body[i]
            if in_str:
                if c == "\\":
                    i += 2
                    continue
                if c == '"':
                    in_str = False
                i += 1
                continue
            if c == '"':
                in_str = True
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
        if depth != 0:
            raise RuntimeError(f"unbalanced braces starting at offset {entry_start}")
        # Absorb trailing commas + newline (but stop before next entry's `{` or array close).
        while i < n and body[i] in ",\n":
            i += 1
            if i < n and body[i] not in ",\n " and body[i] != "\t":
                break
        # Map span back to absolute file offsets (header offset = array_open + 2).
        spans.append((array_open + 2 + entry_start, array_open + 2 + i))
    return header, spans, footer


def field(entry: str, key: str) -> str:
    m = re.search(rf'{key}:\s*"([^"]*)"', entry)
    return m.group(1) if m else ""


def main(dry_run: bool) -> int:
    src = PROGRAMS_PATH.read_text()
    header, spans, footer = parse_entries(src)
    print(f"Total entries parsed: {len(spans)}")

    key_to_indices: dict[tuple, list[int]] = defaultdict(list)
    for i, (s, e) in enumerate(spans):
        entry = src[s:e]
        key = (
            field(entry, "university_name").lower().strip(),
            field(entry, "program_name").lower().strip(),
            field(entry, "degree_level").strip(),
            field(entry, "field_of_study").lower().strip(),
            field(entry, "specialization").lower().strip(),
        )
        if not key[0] or not key[1] or not key[2]:
            # Skip malformed entries from dedup consideration (don't delete them).
            continue
        key_to_indices[key].append(i)

    to_delete: set[int] = set()
    dup_groups = 0
    for key, idxs in key_to_indices.items():
        if len(idxs) > 1:
            dup_groups += 1
            for j in idxs[1:]:
                to_delete.add(j)

    print(f"Duplicate groups: {dup_groups}")
    print(f"Rows to delete:   {len(to_delete)}")
    print(f"Rows after dedup: {len(spans) - len(to_delete)}")

    if dry_run:
        print("\n--dry-run set; not writing.")
        return 0
    if not to_delete:
        print("\nNo duplicates — file unchanged.")
        return 0

    # Re-emit: header + each surviving entry verbatim + footer.
    pieces: list[str] = [header]
    for i, (s, e) in enumerate(spans):
        if i in to_delete:
            continue
        pieces.append(src[s:e])
    pieces.append(footer)
    PROGRAMS_PATH.write_text("".join(pieces))
    print(f"\nWrote {PROGRAMS_PATH}.")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))

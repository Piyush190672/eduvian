#!/usr/bin/env python3
"""
Remove rows from src/data/programs.ts whose `program_name` ends in a
literal backslash. These are an artefact of an earlier verify-pipeline
bug — the model's extraction produced a truncated string and the merge
pipeline never noticed. After today's expansion sweep (14 May 2026),
those rows accumulated mis-attributed siblings: e.g. "Mount Allison
University" carrying a Martin Luther Halle URL, "James Madison
University" carrying an IMT Atlantique URL. Both classes are bad data
that can't be salvaged by re-verifying, so the cleanest fix is removal.

Uses the same brace-counting parser as dedupe-programs.py — regex would
miss entries where the file mixes `},` and `},,` separators.

Usage:
  python3 scripts/verify/remove-broken-names.py [--dry-run]
"""
import re
import sys
from pathlib import Path

PROGRAMS_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "programs.ts"


def parse_entries(text: str):
    array_open = text.index("([")
    array_close = text.rindex("]) as ProgramEntry[];")
    header = text[: array_open + 2]
    footer = text[array_close:]
    body = text[array_open + 2 : array_close]
    spans = []
    i, n = 0, len(body)
    while i < n:
        while i < n:
            if body[i] in " \t\n,": i += 1; continue
            if body[i:i+2] == "//":
                nl = body.find("\n", i)
                i = nl + 1 if nl >= 0 else n
                continue
            break
        if i >= n: break
        if body[i] != "{":
            raise RuntimeError(f"unexpected char {body[i]!r} at offset {i}")
        start = i; depth = 0; in_str = False
        while i < n:
            c = body[i]
            if in_str:
                if c == "\\": i += 2; continue
                if c == '"': in_str = False
                i += 1; continue
            if c == '"': in_str = True
            elif c == "{": depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0: i += 1; break
            i += 1
        # Absorb the trailing `,` and `\n` after the closing brace so each
        # span is a self-contained `{...},\n` block that can be concatenated
        # without losing separators.
        while i < n and body[i] in ",\n":
            i += 1
            if i < n and body[i] not in ",\n \t": break
        spans.append((array_open + 2 + start, array_open + 2 + i))
    return header, spans, footer


def main(dry_run: bool) -> int:
    src = PROGRAMS_PATH.read_text()
    header, spans, footer = parse_entries(src)

    # A row is "broken" if program_name ends with a literal backslash —
    # i.e., the source text contains `\\"` (escaped backslash before
    # closing quote).
    bad_indices = []
    for i, (s, e) in enumerate(spans):
        ent = src[s:e]
        m = re.search(r'program_name:\s*"([^"]*\\)"', ent)
        if m:
            uni_m = re.search(r'university_name:\s*"([^"]+)"', ent)
            uni = uni_m.group(1) if uni_m else "?"
            print(f"  idx {i}: {uni:48} · {m.group(1)!r}")
            bad_indices.append(i)

    print(f"\nTotal entries: {len(spans)}")
    print(f"Broken-name entries to delete: {len(bad_indices)}")
    print(f"Entries after deletion: {len(spans) - len(bad_indices)}")

    if dry_run:
        print("\n--dry-run set; not writing.")
        return 0
    if not bad_indices:
        print("\nNothing to remove.")
        return 0

    bad_set = set(bad_indices)
    pieces = [header]
    for i, (s, e) in enumerate(spans):
        if i in bad_set: continue
        pieces.append(src[s:e])
    pieces.append(footer)
    PROGRAMS_PATH.write_text("".join(pieces))
    print(f"\nWrote {PROGRAMS_PATH}.")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))

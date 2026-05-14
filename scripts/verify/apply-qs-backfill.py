#!/usr/bin/env python3
"""
Apply QS-rank backfill results from /tmp/qs-backfill-results.json to
src/data/programs.ts.

For each (university_name, qs_ranking) pair in the backfill results, find
every program at that university and set qs_ranking IF the current value
is null. Programs that already have a non-null qs_ranking are NOT
overwritten — that's a quality decision: an existing rank was set by a
prior verify or my round-1/2/3 catalog estimates and shouldn't be
clobbered by a fresh lookup. Verified vs. estimated provenance is
preserved.

Idempotent — second run produces 0 changes.

Usage:
  python3 scripts/verify/apply-qs-backfill.py [--dry-run]
"""
import re
import sys
import json
from pathlib import Path

PROGRAMS_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "programs.ts"
RESULTS_PATH = Path("/tmp/qs-backfill-results.json")


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
        while i < n and body[i] in ",\n":
            i += 1
            if i < n and body[i] not in ",\n \t": break
        spans.append((array_open + 2 + start, array_open + 2 + i))
    return header, spans, footer


def main(dry_run: bool) -> int:
    src = PROGRAMS_PATH.read_text()
    results = json.loads(RESULTS_PATH.read_text())
    print(f"QS backfill results: {len(results)} universities")

    # uni-name → rank (skip null ranks)
    rank_map = {}
    for u, info in results.items():
        if info.get("qs_ranking") is not None:
            rank_map[u] = int(info["qs_ranking"])
    print(f"Of those, {len(rank_map)} have a numeric QS rank to apply.")

    header, spans, footer = parse_entries(src)
    out_pieces = [header]
    patched = 0
    skipped_already_set = 0
    for s, e in spans:
        ent = src[s:e]
        uni_m = re.search(r'university_name:\s*"([^"]+)"', ent)
        qs_m = re.search(r'qs_ranking:\s*(null|[0-9]+)', ent)
        if not (uni_m and qs_m):
            out_pieces.append(ent)
            continue
        uni = uni_m.group(1)
        if uni not in rank_map:
            out_pieces.append(ent)
            continue
        if qs_m.group(1) != "null":
            skipped_already_set += 1
            out_pieces.append(ent)
            continue
        # Replace null with the rank
        new_rank = rank_map[uni]
        ent = re.sub(r'qs_ranking:\s*null', f'qs_ranking: {new_rank}', ent, count=1)
        out_pieces.append(ent)
        patched += 1

    out_pieces.append(footer)
    new_text = "".join(out_pieces)

    print(f"Patched (null → rank):     {patched}")
    print(f"Skipped (already has rank): {skipped_already_set}")

    if dry_run:
        print("\n--dry-run set; not writing.")
        return 0
    if patched == 0:
        print("\nNothing to patch.")
        return 0
    PROGRAMS_PATH.write_text(new_text)
    print(f"\nWrote {PROGRAMS_PATH}.")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))

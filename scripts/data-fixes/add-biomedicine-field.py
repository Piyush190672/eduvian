#!/usr/bin/env python3
"""
add-biomedicine-field.py — taxonomy addition (founder request, 14 Jul 2026).

"Biomedicine" becomes a first-class field (31st). Biomedical-science
programs move into it from Biotechnology & Life Sciences / Natural
Sciences / Medicine / Public Health / Nursing & Allied Health.

Founder-decided routing (14 Jul 2026):
  - Biomedical ENGINEERING programs stay where they are (mostly Biotech).
  - Veterinary-context biomedical programs stay in Agriculture &
    Veterinary Sciences (excluded via SOURCE_FIELDS).
  - Informatics/computational biomedical programs stay in AI/CS
    (excluded via SOURCE_FIELDS).

Name-pattern classification over program_name + specialization, in the
style of split-medicine-public-health.py. Prints per-source counts +
the full move list; writes programs.ts in place.

Usage: python3 scripts/data-fixes/add-biomedicine-field.py [--dry-run]
"""
import re
import sys

PATH = "src/data/programs.ts"
NEW = "Biomedicine"

SOURCE_FIELDS = [
    "Biotechnology & Life Sciences",
    "Natural Sciences",
    "Medicine",
    "Public Health",
    "Nursing & Allied Health",
]

BIOMED_RE = re.compile(r"\bbio-?medic", re.I)
# Biomedical Engineering stays put (founder decision, 14 Jul 2026).
ENGINEERING_RE = re.compile(r"\bengineer", re.I)


def main() -> None:
    dry = "--dry-run" in sys.argv
    src = open(PATH).read()

    counts: dict[str, int] = {}
    moves: list[str] = []
    skipped_eng = 0

    out = []
    last = 0
    pat = re.compile(
        r'field_of_study: "(' + "|".join(re.escape(f) for f in SOURCE_FIELDS) + r')"'
    )
    for m in pat.finditer(src):
        seg_start = src.rfind("university_name:", last, m.start())
        seg = src[seg_start : m.start()]
        name_m = re.search(r'program_name: "((?:[^"\\]|\\.)*)"', seg)
        spec_m = re.search(r'specialization: "((?:[^"\\]|\\.)*)"', seg)
        name = name_m.group(1) if name_m else ""
        spec = spec_m.group(1) if spec_m else ""
        hay = f"{name} {spec}"

        if not BIOMED_RE.search(hay):
            continue
        if ENGINEERING_RE.search(hay):
            skipped_eng += 1
            continue

        old_field = m.group(1)
        counts[old_field] = counts.get(old_field, 0) + 1
        moves.append(f"  {old_field}  ->  {name}")

        out.append(src[last : m.start()])
        out.append(f'field_of_study: "{NEW}"')
        last = m.end()

    out.append(src[last:])
    result = "".join(out)

    total = sum(counts.values())
    print(f"moves to {NEW}: {total}")
    for f in SOURCE_FIELDS:
        if counts.get(f):
            print(f"  from {f}: {counts[f]}")
    print(f"engineering-named skipped (stay put): {skipped_eng}")
    print("\nfull move list:")
    print("\n".join(moves))

    if dry:
        print("\n--dry-run: programs.ts NOT written")
        return
    open(PATH, "w").write(result)
    print("\nprograms.ts written")


if __name__ == "__main__":
    main()

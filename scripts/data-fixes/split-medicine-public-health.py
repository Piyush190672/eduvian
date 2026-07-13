#!/usr/bin/env python3
"""
split-medicine-public-health.py — taxonomy split (founder request, 14 Jul 2026).

"Medicine & Public Health" (509 programs) splits into two first-class
fields: "Medicine" (clinical degrees: MBBS/MD/dentistry/surgery/clinical
specialties) and "Public Health" (MPH/epidemiology/health policy/
management/global & community health). Ambiguous generic-health entries
default to Public Health — Medicine is reserved for clinical programs.

Name-pattern classification over program_name + specialization, in the
style of reclassify-new-fields-as-primary.py. Prints per-bucket counts +
samples; writes programs.ts in place.

Usage: python3 scripts/data-fixes/split-medicine-public-health.py [--dry-run]
"""
import re
import sys

PATH = "src/data/programs.ts"
OLD = "Medicine & Public Health"

MEDICINE_RE = re.compile(
    r"\b(mbbs|md\b|do\b|bds|dds|dmd|mbchb|mb\s*bchir|mb\s*bch|mb\s*bs|medicin|medical"
    r"|surg(?:ery|ical)|dent(?:al|istry)|clinical|physician|anaesthe|anesthe|radiolog"
    r"|radiograph|cardio|oncolog|neurolog|paediatr|pediatr|psychiatr|dermatol"
    r"|ophthalmol|patholog|immunolog|physiolog|anatom|osteopath|obstetric|gynaecol"
    r"|gynecol|orthop|urolog|nephrol|gastroenterol|endocrinol|haematol|hematol"
    r"|pharmac(?:y|eutic|olog)|optometr|audiolog|midwif|chiropract|podiatr"
    r"|neuroscien|neural|biomedic|human\s*biolog|molecular\s*med"
    r"|m[ée]decine|medizin|geneeskunde|chirurg)",
    re.I,
)
PUBLIC_HEALTH_RE = re.compile(
    r"\b(public\s*health|mph\b|epidemiol|global\s*health|health\s*(polic|administr"
    r"|manage|promot|informat|econom|service|care\s*manage|leadership|data)"
    r"|community\s*health|population\s*health|occupational\s*(health|hygien)"
    r"|biostatist|health\s*scien|healthcare)",
    re.I,
)

def classify(name: str, spec: str) -> str:
    hay = f"{name} {spec}"
    med = bool(MEDICINE_RE.search(hay))
    ph = bool(PUBLIC_HEALTH_RE.search(hay))
    if med and not ph:
        return "Medicine"
    if ph and not med:
        return "Public Health"
    if med and ph:
        # Both matched (e.g. "MPH in Clinical Epidemiology") — public-health
        # framing wins: these are PH degrees about clinical topics.
        return "Public Health"
    # Neither matched — generic health entry; Public Health is the
    # conservative default (Medicine = clinical only).
    return "DEFAULT"

def main() -> None:
    dry = "--dry-run" in sys.argv
    src = open(PATH).read()

    # Walk entries: find each field_of_study: "OLD" and look back for the
    # entry's program_name + specialization (they precede field_of_study
    # in the emit order).
    out = []
    last = 0
    counts = {"Medicine": 0, "Public Health": 0}
    samples: dict[str, list[str]] = {"Medicine": [], "Public Health": []}
    pat = re.compile(r'field_of_study: "' + re.escape(OLD) + r'"')
    for m in pat.finditer(src):
        seg_start = src.rfind("university_name:", last, m.start())
        seg = src[seg_start : m.start()]
        name_m = re.search(r'program_name: "((?:[^"\\]|\\.)*)"', seg)
        spec_m = re.search(r'specialization: "((?:[^"\\]|\\.)*)"', seg)
        name = name_m.group(1) if name_m else ""
        spec = spec_m.group(1) if spec_m else ""
        new_field = classify(name, spec)
        if new_field == "DEFAULT":
            counts.setdefault("default→Public Health", 0)
            counts["default→Public Health"] += 1
            samples.setdefault("default→Public Health", [])
            if len(samples["default→Public Health"]) < 15:
                samples["default→Public Health"].append(name[:70])
            new_field = "Public Health"
        else:
            counts[new_field] += 1
        if len(samples[new_field]) < 8:
            samples[new_field].append(name[:70])
        out.append(src[last : m.start()])
        out.append(f'field_of_study: "{new_field}"')
        last = m.end()
    out.append(src[last:])

    print(f"classified {sum(counts.values())} programs: {counts}")
    for k, v in samples.items():
        print(f"\n{k} samples:")
        for s in v:
            print("  -", s)
    if dry:
        print("\nDRY RUN — nothing written.")
        return
    open(PATH, "w").write("".join(out))
    remaining = open(PATH).read().count(f'field_of_study: "{OLD}"')
    print(f"\nwrote {PATH}; remaining old-field entries: {remaining}")

if __name__ == "__main__":
    main()

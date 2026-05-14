#!/usr/bin/env python3
"""
Reclassify programs in `Computer Science & IT` / `Artificial Intelligence
& Data Science` into the four-way split introduced 14 May 2026:

  - "Cybersecurity"                          (new)
  - "Data Science"                           (new)
  - "Computer Science & IT"                  (kept)
  - "Artificial Intelligence & Data Science" (kept; renamed semantically
                                              to mean "AI focus" in practice)

Rules — case-insensitive substring matches on `program_name`:

  Cybersecurity keywords:
    cyber, cybersecurity, information security, info sec, infosec,
    network security, computer security, security engineering,
    digital forensics, ethical hacking, penetration testing

  Data Science keywords:
    data science, data analytics, data analysis, big data, business
    analytics (note: BA tied to data, not biz-school MS Business Analytics),
    statistics and data, applied statistics, predictive analytics,
    business intelligence

  AI / ML keywords (signal this is AI-primary):
    artificial intelligence, machine learning, neural network, deep
    learning, natural language processing, computer vision, robotics

  Cybersecurity always wins the primary slot when present.
  Otherwise, if both AI and Data Science keywords match → primary
    stays "Artificial Intelligence & Data Science", alias = ["Data Science"].
  If only Data Science → primary becomes "Data Science", alias = [].
  If only AI → primary stays "Artificial Intelligence & Data Science",
    alias = [].
  If neither (pure CS) → primary stays "Computer Science & IT".

  Dual-stream cross-listing:
    - Cybersecurity programs that are clearly in CS curriculum (e.g. "MSc
      Computer Science - Cyber Track") get field_aliases: ["Computer Science & IT"].
    - Data Science programs that explicitly mention AI also get
      field_aliases: ["Artificial Intelligence & Data Science"].

Walks programs.ts via brace parser, edits each entry's
`field_of_study` and `field_aliases` lines in place, preserves other
fields verbatim. Idempotent — second run should produce 0 changes.

Usage:
  python3 scripts/verify/reclassify-cs-streams.py [--dry-run]
"""
import re
import sys
from pathlib import Path

PROGRAMS_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "programs.ts"

CYBER_RE = re.compile(
    r"\b(cybersecurity|cyber security|cyber\b|information\s+security|infosec|"
    r"info\s+sec|network\s+security|computer\s+security|security\s+engineering|"
    r"digital\s+forensics|ethical\s+hacking|penetration\s+testing)\b",
    re.IGNORECASE,
)
DATA_RE = re.compile(
    r"\b(data\s+science|data\s+analytics|data\s+analysis|big\s+data|"
    r"business\s+analytics|statistics\s+and\s+data|applied\s+statistics|"
    r"predictive\s+analytics|business\s+intelligence|data\s+engineering)\b",
    re.IGNORECASE,
)
AI_RE = re.compile(
    r"\b(artificial\s+intelligence|\bAI\b|machine\s+learning|\bML\b|"
    r"neural\s+network|deep\s+learning|natural\s+language\s+processing|\bNLP\b|"
    r"computer\s+vision|\bCV\b|robotics)\b",
    re.IGNORECASE,
)


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
        # Absorb the trailing comma+newline so each span is self-contained.
        while i < n and body[i] in ",\n":
            i += 1
            if i < n and body[i] not in ",\n \t": break
        spans.append((array_open + 2 + start, array_open + 2 + i))
    return header, spans, footer


def classify(program_name: str, current_field: str) -> tuple[str, list[str]]:
    """Return (new_primary, new_aliases) given a program_name."""
    has_cyber = bool(CYBER_RE.search(program_name))
    has_data = bool(DATA_RE.search(program_name))
    has_ai = bool(AI_RE.search(program_name))

    # Cybersecurity wins primary when present.
    if has_cyber:
        # If the program is also clearly CS / IT in nature, alias to CS&IT.
        # Heuristic: if program_name mentions "Computer Science" or "IT".
        aliases = []
        if re.search(r"\b(computer\s+science|\bIT\b|information\s+technology)\b", program_name, re.IGNORECASE):
            aliases.append("Computer Science & IT")
        return ("Cybersecurity", aliases)

    # No cyber. Look at data + AI.
    if has_data and has_ai:
        # Dual program — keep AI&DS as primary, alias Data Science.
        return ("Artificial Intelligence & Data Science", ["Data Science"])
    if has_data:
        # Pure data — primary becomes Data Science, alias AI&DS for back-compat.
        return ("Data Science", ["Artificial Intelligence & Data Science"])
    if has_ai:
        # Pure AI — keep AI&DS.
        return ("Artificial Intelligence & Data Science", [])

    # Neither data nor AI — return current. The matcher will keep
    # CS & IT programs unchanged.
    return (current_field, [])


def main(dry_run: bool) -> int:
    src = PROGRAMS_PATH.read_text()
    header, spans, footer = parse_entries(src)

    changes_by_class = {"Cybersecurity": 0, "Data Science": 0, "AI&DS_dual": 0, "AI&DS_pure": 0}
    out_pieces = [header]
    changed = 0
    affected_unis = set()

    for s, e in spans:
        ent = src[s:e]
        fos_m = re.search(r'field_of_study:\s*"([^"]+)"', ent)
        pn_m = re.search(r'program_name:\s*"([^"]*)"', ent)
        uni_m = re.search(r'university_name:\s*"([^"]+)"', ent)
        if not fos_m or not pn_m:
            out_pieces.append(ent)
            continue
        current = fos_m.group(1)
        # Only reclassify programs currently in the two source streams.
        if current not in ("Computer Science & IT", "Artificial Intelligence & Data Science"):
            out_pieces.append(ent)
            continue

        new_field, new_aliases = classify(pn_m.group(1), current)
        if new_field == current and not new_aliases:
            # No change.
            out_pieces.append(ent)
            continue

        changed += 1
        if uni_m: affected_unis.add(uni_m.group(1))
        if new_field == "Cybersecurity": changes_by_class["Cybersecurity"] += 1
        elif new_field == "Data Science": changes_by_class["Data Science"] += 1
        elif new_aliases: changes_by_class["AI&DS_dual"] += 1
        else: changes_by_class["AI&DS_pure"] += 1

        # Replace field_of_study line.
        ent = re.sub(
            r'field_of_study:\s*"[^"]+"',
            f'field_of_study: "{new_field}"',
            ent,
            count=1,
        )
        # Inject (or replace) field_aliases on the same line as field_of_study.
        # Strategy: if field_aliases is already present, replace; else add
        # right after field_of_study.
        new_alias_literal = (
            f'field_aliases: [{", ".join(f"{a!r}" for a in new_aliases).replace(chr(39), chr(34))}]'
            if new_aliases else "field_aliases: null"
        )
        if re.search(r"field_aliases:", ent):
            ent = re.sub(r'field_aliases:\s*(?:null|\[[^\]]*\])', new_alias_literal, ent, count=1)
        else:
            # Add `, field_aliases: [...]` directly after field_of_study value.
            ent = re.sub(
                r'(field_of_study:\s*"[^"]+",)',
                r'\1 ' + new_alias_literal + ',',
                ent,
                count=1,
            )
        out_pieces.append(ent)

    out_pieces.append(footer)
    new_text = "".join(out_pieces)

    print(f"Total entries: {len(spans)}")
    print(f"Changed: {changed}")
    print(f"  → Cybersecurity primary:        {changes_by_class['Cybersecurity']}")
    print(f"  → Data Science primary:         {changes_by_class['Data Science']}")
    print(f"  → AI&DS dual (alias added):     {changes_by_class['AI&DS_dual']}")
    print(f"  → AI&DS pure (still AI):        {changes_by_class['AI&DS_pure']}")
    print(f"Universities touched: {len(affected_unis)}")

    if dry_run:
        print("\n--dry-run set; not writing.")
        return 0
    if changed == 0:
        print("\nNo changes — file is already classified.")
        return 0
    PROGRAMS_PATH.write_text(new_text)
    print(f"\nWrote {PROGRAMS_PATH}.")
    return 0


if __name__ == "__main__":
    sys.exit(main("--dry-run" in sys.argv))

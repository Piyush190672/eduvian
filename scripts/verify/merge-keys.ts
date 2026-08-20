/**
 * merge-keys.ts — the dedup-identity half of merge.ts, split out so it can
 * carry regression tests (tests/merge-keys.test.ts).
 *
 * Idempotency bug fixed 14 Jul 2026 (blocker on Batch B, open since #21):
 * `extractField` matched values with `"([^"]*)"`, which stops dead at the
 * first ESCAPED quote inside a value. Eight entries carry `\"` in their
 * program_name — Sciences Po's `Bachelor of Arts and Sciences (BASC) :
 * "Politics and Government"`, IMT Atlantique, Kiel, Halle-Wittenberg,
 * Augsburg, Nantes — so the key built from programs.ts was a truncated
 * prefix while the key built from the verifier's JSON was the full string.
 * The two never matched, so those rows re-inserted on EVERY merge run and
 * dedupe-programs.py had to mop up afterwards.
 *
 * Fix: match the whole JSON string literal (escape-aware) and JSON.parse it,
 * so both sides of the comparison hold the same unescaped value.
 */

/**
 * Split the programs.ts array body into raw entry blocks.
 *
 * Char-by-char with a string-aware brace counter rather than a regex — the
 * file's accumulated history mixes `},`, `},,` and `},,,` separators and a
 * non-greedy `[\s\S]*?` regex silently misses entries. Per CLAUDE.md:
 * "Brace walkers must track strings."
 */
export function parseProgramEntries(text: string): string[] {
  const arrayOpen = text.indexOf("([");
  const arrayClose = text.lastIndexOf("]) as ProgramEntry[]");
  const body = text.slice(arrayOpen + 2, arrayClose);
  const entries: string[] = [];
  let i = 0;
  const n = body.length;
  while (i < n) {
    // Skip whitespace, commas, and `// ...` line comments between entries.
    while (i < n) {
      const c = body[i];
      if (c === " " || c === "\t" || c === "\n" || c === ",") { i++; continue; }
      if (c === "/" && body[i + 1] === "/") {
        const nl = body.indexOf("\n", i);
        i = nl >= 0 ? nl + 1 : n;
        continue;
      }
      break;
    }
    if (i >= n) break;
    if (body[i] !== "{") {
      throw new Error(`merge.ts brace parser: unexpected char ${JSON.stringify(body[i])} at offset ${i}`);
    }
    const start = i;
    let depth = 0;
    let inStr = false;
    while (i < n) {
      const c = body[i];
      if (inStr) {
        if (c === "\\") { i += 2; continue; }
        if (c === '"') inStr = false;
        i++;
        continue;
      }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) { i++; break; }
      }
      i++;
    }
    entries.push(body.slice(start, i));
  }
  return entries;
}

/**
 * Read one string field out of an entry block, returning the UNESCAPED
 * value — i.e. exactly what the verifier's JSON holds for the same field.
 *
 * `(?:^|[\s,{])` anchors the key so a shorter key can't match the tail of a
 * longer one. `"(?:[^"\\]|\\.)*"` consumes escape pairs so an embedded `\"`
 * no longer terminates the match. Returns "" when the field is absent or
 * null (degree_level legitimately carries null for ~165 rows).
 */
export function extractField(entry: string, key: string): string {
  const m = entry.match(
    new RegExp(`(?:^|[\\s,{])${key}:\\s*("(?:[^"\\\\]|\\\\.)*")`),
  );
  if (!m) return "";
  try {
    return JSON.parse(m[1]) as string;
  } catch {
    return "";
  }
}

/**
 * The 3-key dedup identity: university_name + program_name + degree_level,
 * case-folded and whitespace-trimmed.
 *
 * Why 3 and not more: a 4-key (adding field_of_study) or 5-key (adding
 * specialization) produced 250-367 false-positive re-inserts, because the
 * verifier returns slightly different metadata across runs (Brown's "General
 * CS" → "General"). The 3-key fold conflates ~5 same-name-different-faculty
 * cases (notably Universiti Putra Malaysia's "Master by Coursework" from two
 * faculties); dedupe-programs.py is the safety net.
 */
export function makeKey(uni: string, pn: string, dl: string): string {
  return [
    uni.toLowerCase().trim(),
    pn.toLowerCase().trim(),
    (dl ?? "").toLowerCase().trim(),
  ].join("|");
}

/** Build the existing-key set from a programs.ts source string. */
export function buildExistingKeys(programsTs: string): Set<string> {
  const existing = new Set<string>();
  for (const entry of parseProgramEntries(programsTs)) {
    const uni = extractField(entry, "university_name");
    const pn = extractField(entry, "program_name");
    const dl = extractField(entry, "degree_level"); // "" when the DB carries null
    if (!uni || !pn) continue; // identity requires uni + pn; dl may be empty
    existing.add(makeKey(uni, pn, dl));
  }
  return existing;
}

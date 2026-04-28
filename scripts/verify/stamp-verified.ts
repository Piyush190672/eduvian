/**
 * stamp-verified.ts
 *
 * Reads scripts/verify/output/*.json (results of verify-program.ts) and stamps
 * verified_at + verification_source_url onto matching existing rows in
 * src/data/programs.ts. Match key = university_name + program_name.
 *
 * Use after re-verify.ts to mark already-existing entries as verified.
 *
 * Usage: npx tsx scripts/verify/stamp-verified.ts
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "output");
const PROGRAMS_PATH = join(__dirname, "..", "..", "src", "data", "programs.ts");

const verified = new Map<string, { verified_at: string; verification_source_url: string }>();
for (const f of readdirSync(OUT_DIR).filter((x) => x.endsWith(".json"))) {
  const v = JSON.parse(readFileSync(join(OUT_DIR, f), "utf8"));
  if (v.university_name && v.program_name && v.verified_at) {
    verified.set(`${v.university_name}|${v.program_name}`, {
      verified_at: v.verified_at,
      verification_source_url: v.verification_source_url || v.program_url,
    });
  }
}
console.log(`Loaded ${verified.size} verified outputs.`);

let text = readFileSync(PROGRAMS_PATH, "utf8");
let depth = 0, start = -1, inStr = false, esc = false;
const arrOpen = text.indexOf("[", text.indexOf("PROGRAMS"));
const blocks: { start: number; end: number; key: string }[] = [];
for (let i = arrOpen + 1; i < text.length; i++) {
  const c = text[i];
  if (esc) { esc = false; continue; }
  if (c === "\\") { esc = true; continue; }
  if (c === '"') { inStr = !inStr; continue; }
  if (inStr) continue;
  if (c === "{") { if (depth === 0) start = i; depth++; }
  else if (c === "}") {
    depth--;
    if (depth === 0 && start !== -1) {
      const block = text.slice(start, i + 1);
      const u = block.match(/university_name:\s*"([^"]+)"/)?.[1];
      const p = block.match(/program_name:\s*"([^"]+)"/)?.[1];
      if (u && p) blocks.push({ start, end: i + 1, key: `${u}|${p}` });
      start = -1;
    }
  }
}

// Apply stamps from end-to-start so offsets stay valid.
let stamped = 0;
for (const b of [...blocks].reverse()) {
  const v = verified.get(b.key);
  if (!v) continue;
  const block = text.slice(b.start, b.end);
  if (block.includes("verified_at:")) continue; // already stamped
  // Insert before the closing brace
  const closeIdx = block.lastIndexOf("}");
  const before = block.slice(0, closeIdx).replace(/[\s,]*$/, "");
  const after = block.slice(closeIdx);
  const insert = `,\n    verified_at: ${JSON.stringify(v.verified_at)}, verification_source_url: ${JSON.stringify(v.verification_source_url)},\n  `;
  const patched = before + insert + after;
  text = text.slice(0, b.start) + patched + text.slice(b.end);
  stamped++;
}
writeFileSync(PROGRAMS_PATH, text);
console.log(`Stamped ${stamped} existing entries with verified_at.`);

import * as fs from "fs";

const PATH = "./src/data/programs.ts";
const src = fs.readFileSync(PATH, "utf8");

const FIELD_NAME_PATTERNS: Record<string, RegExp> = {
  "Artificial Intelligence":     /\b(artificial intelligence|ai|machine learning|deep learning)\b/i,
  "Data Science":                /\b(data science|data analytics|data engineering|business analytics)\b/i,
  "Cybersecurity":               /\b(cyber\s?security|information security|infosec)\b/i,
  "Computer Science & IT":       /\bcomputer science\b|\bcomputing\b|\binformatics\b/i,
  "Business & Management":       /\b(business|management|administration|mba)\b/i,
  "MBA":                         /\bmba\b/i,
  "Economics & Finance":         /\b(economics|finance|financial|accounting)\b/i,
  "Engineering (Mechanical/Civil/Electrical)": /\bengineering\b/i,
  "Architecture":                /\barchitecture\b/i,
  "Medicine & Public Health":    /\b(medicine|medical|public health|epidemiology)\b/i,
  "Nursing & Allied Health":     /\b(nursing|midwifery|physiotherapy|allied health)\b/i,
  "Biotechnology & Life Sciences": /\b(biotech|biotechnology|life sciences|biology|biochem)\b/i,
  "Natural Sciences":            /\b(physics|chemistry|natural sciences|geology|earth science)\b/i,
  "Environmental & Sustainability Studies": /\b(environment|sustainability|ecology|climate)\b/i,
  "Psychology":                  /\bpsycholog/i,
  "Law":                         /\b(law|legal|jurisprudence|llb|llm)\b/i,
  "Social Sciences & Humanities": /\b(social|humanities|history|philosophy|sociology|anthropology|politics)\b/i,
  "Media & Communications":      /\b(media|communications?|journalism|broadcast)\b/i,
  "Arts, Design & Architecture": /\b(arts?|design|fine arts|illustration)\b/i,
  "Agriculture & Veterinary Sciences": /\b(agriculture|veterinary|animal science|forestry)\b/i,
  "Hospitality & Tourism":       /\b(hospitality|tourism|hotel|culinary)\b/i,
};

function nameMatchesField(name: string, field: string): boolean {
  const pat = FIELD_NAME_PATTERNS[field];
  if (pat) return pat.test(name);
  const head = field.toLowerCase().split(/[ &,()/]+/)[0];
  return head.length > 2 && name.toLowerCase().includes(head);
}

// Match: program_name: "...", ..., field_of_study: "...", field_aliases: [...]
const re = /(program_name:\s*"((?:[^"\\]|\\.)+)"[^]*?field_of_study:\s*"([^"]+)",\s*field_aliases:\s*)(\[[^\]]*\])/g;

let stripped = 0;
let cleared = 0;
let kept = 0;
let processed = 0;

const out = src.replace(re, (full, prefix, name, primary, aliasesRaw) => {
  processed++;
  let aliases: string[] = [];
  try { aliases = JSON.parse(aliasesRaw); } catch { return full; }
  if (!Array.isArray(aliases) || aliases.length === 0) return prefix + "null";

  const goodAliases = aliases.filter((a: string) => nameMatchesField(name, a));
  if (goodAliases.length === aliases.length) { kept++; return full; }

  const removed = aliases.length - goodAliases.length;
  stripped += removed;
  if (goodAliases.length === 0) {
    cleared++;
    return prefix + "null";
  }
  return prefix + JSON.stringify(goodAliases);
});

console.log(`Programs with field_aliases scanned: ${processed}`);
console.log(`Programs kept unchanged: ${kept}`);
console.log(`Programs with aliases entirely cleared (set to null): ${cleared}`);
console.log(`Total bad aliases stripped: ${stripped}`);

if (process.argv.includes("--write")) {
  fs.writeFileSync(PATH + ".bak", src);
  fs.writeFileSync(PATH, out);
  console.log("Written.");
} else {
  console.log("Dry run. Re-run with --write to apply.");
}

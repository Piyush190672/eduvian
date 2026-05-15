import * as fs from "fs";

const PATH = "./src/data/programs.ts";
const src = fs.readFileSync(PATH, "utf8");

// Conservative one-off reclassifier. Only moves a program when the name
// carries an UNAMBIGUOUS keyword for a leaf-level field (MBA, Nursing,
// Psychology, Architecture, Law, Cybersecurity, AI, Data Science, etc.)
// AND the current `field_of_study` doesn't match that leaf. This catches
// egregious mis-tags like "MS in Nursing" being filed under Data Science
// without rebucketing nuanced cases (e.g. Healthcare Management programs
// drifting from Medicine → Business on a "management" keyword).
//
// Each rule below is high-confidence: the keyword regex is strict, and
// the rules are ordered by specificity — the first matching rule wins,
// so "MBA" beats "Business", "AI" beats "Computer Science", etc.

interface Rule { target: string; pattern: RegExp; description: string; }

const RULES: Rule[] = [
  // Most specific first.
  { target: "MBA",
    pattern: /(?:^|[\s(/-])MBA(?=[\s(/,)-]|$)|executive\s+mba|master\s+of\s+business\s+administration/i,
    description: "Name contains MBA / Executive MBA / Master of Business Administration." },

  { target: "Cybersecurity",
    pattern: /\b(?:cyber\s?security|information\s+security|infosec|computer\s+security|network\s+security)\b/i,
    description: "Name contains Cybersecurity / Information Security." },

  { target: "Artificial Intelligence",
    // Case-insensitive on the words; `\bAI\b` matches both AI / Ai / ai
    // when paired with the `i` flag (program names use "AI" in caps).
    pattern: /\b(?:artificial\s+intelligence|machine\s+learning|deep\s+learning|AI)\b/i,
    description: "Name contains Artificial Intelligence / Machine Learning / Deep Learning / AI." },

  { target: "Data Science",
    pattern: /\b(?:data\s+science|data\s+analytics|business\s+analytics|data\s+engineering|big\s+data)\b/i,
    description: "Name contains Data Science / Analytics / Data Engineering / Big Data." },

  { target: "Nursing & Allied Health",
    pattern: /\b(?:nursing|midwifery|physiotherapy|paramedic|occupational\s+therapy|speech\s+(?:and\s+language\s+)?therapy)\b/i,
    description: "Name contains Nursing / Midwifery / Physiotherapy / etc." },

  { target: "Psychology",
    pattern: /\bpsycholog/i,
    description: "Name contains Psychology / Psychological." },

  { target: "Law",
    pattern: /\b(?:LLB|LLM|JD|juris\s+doctor)\b|\blaw\s+(?:school|degree|bachelor|master|programmes?|programs?|studies)\b|\b(?:bachelor|master)\s+of\s+laws?\b/i,
    description: "Name contains Law degree markers (LLB / LLM / Bachelor of Laws / Law School)." },

  { target: "Architecture",
    pattern: /\barchitectur(?:e|al)\b/i,
    description: "Name contains Architecture / Architectural." },

  { target: "Medicine & Public Health",
    pattern: /\b(?:MBBS|BDS|MDS|MD\s+(?:program|degree)|doctor\s+of\s+medicine|public\s+health|epidemiology|dentistry|dental|pharmacy|pharmacology|pharmaceutical)\b/i,
    description: "Name contains medicine / dentistry / pharmacy / public health markers." },

  { target: "Agriculture & Veterinary Sciences",
    pattern: /\b(?:veterinary|agriculture|agronomy|horticulture|forestry|animal\s+science|aquaculture|agri\s?food)\b/i,
    description: "Name contains Veterinary / Agriculture / Horticulture / Forestry." },

  { target: "Hospitality & Tourism",
    pattern: /\b(?:hospitality|tourism|hotel\s+(?:management|administration)|culinary|gastronomy)\b/i,
    description: "Name contains Hospitality / Tourism / Hotel Management / Culinary." },
];

function classify(name: string): { target: string; description: string } | null {
  for (const r of RULES) {
    if (r.pattern.test(name)) return { target: r.target, description: r.description };
  }
  return null;
}

const programRe = /(program_name:\s*"((?:[^"\\]|\\.)+)"[^]*?field_of_study:\s*")([^"]+)(")/g;

interface Row { name: string; current: string; suggest: string }
const wouldChange: Row[] = [];
let processed = 0;

const dryRun = !process.argv.includes("--write");

const out = src.replace(programRe, (full, prefix, name, current, suffix) => {
  processed++;
  const hit = classify(name);
  if (!hit) return full;
  if (hit.target === current) return full;
  wouldChange.push({ name, current, suggest: hit.target });
  if (!dryRun) return prefix + hit.target + suffix;
  return full;
});

console.log(`Total programs scanned: ${processed}`);
console.log(`Would reclassify (high-confidence): ${wouldChange.length}`);

const buckets = new Map<string, number>();
for (const r of wouldChange) {
  const k = `${r.current.padEnd(42)} → ${r.suggest}`;
  buckets.set(k, (buckets.get(k) ?? 0) + 1);
}
console.log("\nBuckets (count, from → to):");
for (const [k, v] of [...buckets.entries()].sort((a,b)=>b[1]-a[1])) {
  console.log(`  ${v.toString().padStart(4)}  ${k}`);
}

console.log("\nSample 40 reclassifications:");
for (const r of wouldChange.slice(0, 40)) {
  console.log(`  ${r.current.padEnd(34)} → ${r.suggest.padEnd(28)}  "${r.name}"`);
}

if (!dryRun) {
  fs.writeFileSync(PATH + ".bak", src);
  fs.writeFileSync(PATH, out);
  console.log("\nWritten.");
}

import * as fs from "fs";

const PATH = "./src/data/programs.ts";
const src = fs.readFileSync(PATH, "utf8");

// Two-step migration for the legacy "Arts, Design & Architecture" stream:
//   1. Programs whose program_name contains "architectur(e|al)" → "Architecture".
//   2. Remaining programs → "Arts and Design".
//
// Architecture is now its own first-class stream (added in handoff #17);
// the legacy compound is being retired. The dropdown label changes
// accordingly. (15 May 2026, user-requested.)

const programRe = /(program_name:\s*"((?:[^"\\]|\\.)+)"[\s\S]*?field_of_study:\s*")(Arts, Design & Architecture)(")/g;

let movedToArchitecture = 0;
let movedToArtsAndDesign = 0;
const dryRun = !process.argv.includes("--write");

const out = src.replace(programRe, (full, prefix, name, _current, suffix) => {
  if (/\barchitectur(?:e|al)\b/i.test(name)) {
    movedToArchitecture++;
    return prefix + "Architecture" + suffix;
  }
  movedToArtsAndDesign++;
  return prefix + "Arts and Design" + suffix;
});

console.log(`Migrated programs:`);
console.log(`  → Architecture:     ${movedToArchitecture}`);
console.log(`  → Arts and Design:  ${movedToArtsAndDesign}`);

if (!dryRun) {
  fs.writeFileSync(PATH + ".bak", src);
  fs.writeFileSync(PATH, out);
  console.log("Written.");
}

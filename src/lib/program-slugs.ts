import "server-only";
import type { Program } from "./types";
import { TARGET_COUNTRIES } from "./types";
import { INDEXED_PROGRAMS } from "@/data/programs-indexed";

/**
 * URL slug maps for the programmatic SEO pages (Phase 2 #10b,
 * 10 July 2026): /programs/[country]/[university]/[program].
 *
 * Everything is derived deterministically from the verified database at
 * module scope, so a given deploy always produces the same URL for the
 * same program. Program slug collisions inside one university (e.g.
 * duplicate "Master's Programs" landing rows) are disambiguated with a
 * -2 / -3 suffix assigned in stable-id order.
 *
 * server-only: these maps walk the full 9,298-row database — they must
 * never be imported from a client component.
 */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export interface CountryNode {
  slug: string;
  name: string;
  flag: string;
  universities: Map<string, UniversityNode>;
  programCount: number;
}

export interface UniversityNode {
  slug: string;
  name: string;
  countrySlug: string;
  programs: ProgramNode[];
}

export interface ProgramNode {
  slug: string;
  program: Program;
}

const ACTIVE: Program[] = INDEXED_PROGRAMS.filter((p) => p.is_active !== false);

const countries = new Map<string, CountryNode>();
for (const c of TARGET_COUNTRIES) {
  countries.set(slugify(c.name), {
    slug: slugify(c.name),
    name: c.name,
    flag: c.flag,
    universities: new Map(),
    programCount: 0,
  });
}

// Stable-id order so collision suffixes never depend on source ordering.
const sorted = [...ACTIVE].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

for (const p of sorted) {
  const cNode = countries.get(slugify(p.country));
  if (!cNode) continue; // outside the 12 target countries — never linkable
  const uSlug = slugify(p.university_name);
  if (!uSlug) continue;
  let uNode = cNode.universities.get(uSlug);
  if (!uNode) {
    uNode = { slug: uSlug, name: p.university_name, countrySlug: cNode.slug, programs: [] };
    cNode.universities.set(uSlug, uNode);
  }
  const base = slugify(p.program_name) || "program";
  const taken = new Set(uNode.programs.map((n) => n.slug));
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  uNode.programs.push({ slug, program: p });
  cNode.programCount++;
}

export const COUNTRY_NODES: ReadonlyMap<string, CountryNode> = countries;

export function getCountry(countrySlug: string): CountryNode | null {
  return countries.get(countrySlug) ?? null;
}

export function getUniversity(countrySlug: string, uniSlug: string): UniversityNode | null {
  return countries.get(countrySlug)?.universities.get(uniSlug) ?? null;
}

export function getProgram(
  countrySlug: string,
  uniSlug: string,
  programSlug: string,
): { node: ProgramNode; university: UniversityNode; country: CountryNode } | null {
  const country = countries.get(countrySlug);
  const university = country?.universities.get(uniSlug);
  const node = university?.programs.find((n) => n.slug === programSlug);
  return country && university && node ? { node, university, country } : null;
}

/** Flat URL list for sitemap generation. */
export function allProgramUrls(): string[] {
  const urls: string[] = [];
  for (const c of countries.values()) {
    if (c.programCount === 0) continue;
    urls.push(`/programs/${c.slug}`);
    for (const u of c.universities.values()) {
      urls.push(`/programs/${c.slug}/${u.slug}`);
      for (const p of u.programs) {
        urls.push(`/programs/${c.slug}/${u.slug}/${p.slug}`);
      }
    }
  }
  return urls;
}

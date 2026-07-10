import { PROGRAMS } from "@/data/programs";
import type { Program } from "@/lib/types";

/**
 * Stable program identity layer.
 *
 * History: API routes used to mint `prog_${i}` from the array index at
 * request time. Every regeneration of programs.ts (which happens in every
 * data campaign) silently re-pointed previously saved shortlisted_ids in
 * Supabase at different programs. This module derives each id from the
 * program's CONTENT, so ids survive reorderings, insertions and deletions.
 *
 * The stamped list is computed once per lambda instance (module scope),
 * which also removes the per-request allocation of 9,298 objects the old
 * `PROGRAMS.map(...)` in each route paid.
 *
 * Legacy `prog_${i}` ids still resolve positionally (best-effort) so
 * shortlists saved before this change keep working where the index still
 * points at the same program.
 */

/** FNV-1a over the identity string, run twice with different seeds and
 *  concatenated — 64 bits of key space makes collisions across 9,298
 *  entries negligible. Exact (country|uni|name|level|url) twins collide
 *  by design: they are the same physical program (ingestion duplicates)
 *  and the matcher dedups them before output. */
function fnv1a(str: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function stableProgramId(p: {
  country: string;
  university_name: string;
  program_name: string;
  degree_level: string;
  program_url: string | null;
}): string {
  const key = `${p.country}|${p.university_name}|${p.program_name}|${p.degree_level}|${p.program_url ?? ""}`;
  const a = fnv1a(key, 0x811c9dc5).toString(16).padStart(8, "0");
  const b = fnv1a(key, 0x9747b28c).toString(16).padStart(8, "0");
  return `p_${a}${b}`;
}

const STAMPED_AT = new Date().toISOString();

/** The canonical, id-stamped program list. Sparse-entry-safe. */
export const INDEXED_PROGRAMS: Program[] = (PROGRAMS as unknown[])
  .filter(Boolean)
  .map((raw) => {
    const p = raw as Omit<Program, "id" | "is_active" | "last_updated">;
    return {
      ...p,
      id: stableProgramId(p),
      is_active: true,
      last_updated: STAMPED_AT,
    } as Program;
  });

/** id → Program. Content-twins share an id; last one wins (same program). */
export const PROGRAM_BY_ID: ReadonlyMap<string, Program> = new Map(
  INDEXED_PROGRAMS.map((p) => [p.id, p]),
);

/**
 * Resolve a stored shortlist id to a Program.
 * - New stable ids (`p_…`) resolve via the map.
 * - Legacy positional ids (`prog_N`) resolve against the current array
 *   position — correct only while the file hasn't been reordered since
 *   the shortlist was saved; kept as best-effort compatibility.
 */
export function resolveProgramId(id: string): Program | null {
  const direct = PROGRAM_BY_ID.get(id);
  if (direct) return direct;
  const m = /^prog_(\d+)$/.exec(id);
  if (m) {
    const idx = parseInt(m[1], 10);
    if (idx >= 0 && idx < INDEXED_PROGRAMS.length) return INDEXED_PROGRAMS[idx];
  }
  return null;
}

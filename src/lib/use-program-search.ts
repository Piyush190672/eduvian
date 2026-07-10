"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Client hooks for program lookup via GET /api/programs.
 *
 * These replace the pattern of client components importing the full 10MB
 * programs.ts for autocomplete / lookup, which compiled the entire
 * program database into a 9.3MB shared client chunk across 8 routes
 * (Phase 1 bundle fix, 10 July 2026).
 */

export interface SlimProgram {
  id: string;
  university_name: string;
  program_name: string;
  country: string;
  city: string | null;
  degree_level: string;
  field_of_study: string;
  qs_ranking: number | null;
  duration_months: number | null;
  annual_tuition_usd: number | null;
  annual_tuition_currency: string | null;
  annual_tuition_amount: number | null;
  tuition_fee_source: string | null;
  avg_living_cost_usd: number | null;
  living_cost_source: string | null;
  verified_at: string | null;
  application_deadline: string | null;
  min_ielts: number | null;
  program_url: string | null;
  apply_url: string | null;
}

async function fetchPrograms(params: Record<string, string>): Promise<SlimProgram[]> {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/programs?${qs}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: SlimProgram[] };
  return data.results ?? [];
}

/**
 * All programs for one university (two-stage pickers: uni → program).
 * Cached per university name for the lifetime of the page.
 */
export function useUniversityPrograms(university: string | null | undefined): {
  programs: SlimProgram[];
  loading: boolean;
} {
  const [programs, setPrograms] = useState<SlimProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const cache = useRef<Map<string, SlimProgram[]>>(new Map());

  useEffect(() => {
    if (!university) {
      setPrograms([]);
      return;
    }
    const cached = cache.current.get(university);
    if (cached) {
      setPrograms(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPrograms({ university, limit: "300" })
      .then((rows) => {
        if (cancelled) return;
        cache.current.set(university, rows);
        setPrograms(rows);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [university]);

  return { programs, loading };
}

/**
 * Debounced free-text search across university + program names.
 * Returns [] until the query is ≥ 2 chars.
 */
export function useProgramSearch(
  query: string,
  opts: { limit?: number; debounceMs?: number; country?: string; level?: string; deadlineOnly?: boolean } = {},
): { results: SlimProgram[]; loading: boolean } {
  const { limit = 20, debounceMs = 250, country, level, deadlineOnly } = opts;
  const [results, setResults] = useState<SlimProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    let cancelled = false;
    timer.current = setTimeout(() => {
      setLoading(true);
      const params: Record<string, string> = { q, limit: String(limit) };
      if (country) params.country = country;
      if (level) params.level = level;
      if (deadlineOnly) params.deadline = "1";
      fetchPrograms(params)
        .then((rows) => {
          if (!cancelled) setResults(rows);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, limit, debounceMs, country, level, deadlineOnly]);

  return { results, loading };
}

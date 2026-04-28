"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Loader2, MapPin, GraduationCap, DollarSign } from "lucide-react";
import type { ScoredProgram } from "@/lib/types";
import { getTierLabel } from "@/lib/utils";
import { formatTotalCost } from "@/lib/format-fee";

interface Props {
  token: string;
}

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  safe: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  reach: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  ambitious: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
};

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
};

const SCORE_BAR = (score: number) => {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-rose-500";
};

export default function CheckMatchPanel({ token }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ScoredProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ScoredProgram | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (q.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/check-match?token=${encodeURIComponent(token)}&q=${encodeURIComponent(q)}`
        );
        if (!res.ok) throw new Error("failed");
        const data = await res.json();
        setResults(data.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(null);
    }
  }, [open]);

  const breakdown = selected?.score_breakdown;

  return (
    <>
      {/* Trigger button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 mb-2"
      >
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Check any university or program</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Not seeing what you want? Search our full database and instantly see your match score.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5"
          >
            <TrendingUp className="w-4 h-4" />
            Check My Score
          </button>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setSelected(null); }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-[5vh] bottom-[5vh] max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">Check Your Match Score</h3>
                  <p className="text-xs text-gray-500">Search any university, program, or field</p>
                </div>
                <button
                  onClick={() => { setOpen(false); setSelected(null); }}
                  className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Search input */}
              <div className="px-6 pt-4 pb-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                    placeholder="e.g. Harvard, MSc Data Science, Canada..."
                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-gray-50"
                  />
                  {query && (
                    <button
                      onClick={() => { setQuery(""); setResults([]); setSelected(null); }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 pb-6">
                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                  </div>
                )}

                {/* Selected program detail */}
                {selected && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <button
                      onClick={() => setSelected(null)}
                      className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 mb-4"
                    >
                      ← Back to results
                    </button>

                    {/* Score header */}
                    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-5 mb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-base leading-snug">
                            {selected.program_name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">{selected.university_name}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="w-3 h-3" />{selected.city}, {selected.country}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <GraduationCap className="w-3 h-3" />{selected.field_of_study}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-500">
                              <DollarSign className="w-3 h-3" />{formatTotalCost(selected.annual_tuition_usd, selected.avg_living_cost_usd, { short: true })}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className={`text-4xl font-black ${SCORE_COLOR(selected.match_score)}`}>
                            {selected.match_score}%
                          </div>
                          <div className={`mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${TIER_STYLES[selected.tier].bg} ${TIER_STYLES[selected.tier].text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${TIER_STYLES[selected.tier].dot}`} />
                            {getTierLabel(selected.tier)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Score signals */}
                    {breakdown && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Match Signals
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {(
                            [
                              ["Academic",          breakdown.academic       ],
                              ["Budget",            breakdown.budget         ],
                              ["Standard Test",     breakdown.std_test       ],
                              ["English",           breakdown.english        ],
                              ["Scholarships",      breakdown.scholarship    ],
                              ["Intake Match",      breakdown.intake         ],
                              ["Backlogs",          breakdown.backlogs       ],
                              ["Gap Year",          breakdown.gap_year       ],
                              ...(breakdown.work_experience > 0
                                ? [["Work Experience", breakdown.work_experience] as [string, number]]
                                : []),
                            ] as [string, number][]
                          ).map(([label, raw]) => {
                            const isStrong  = raw >= 80;
                            const isAverage = raw >= 60 && raw < 80;
                            const dot   = isStrong ? "bg-emerald-500" : isAverage ? "bg-amber-400" : "bg-rose-400";
                            const text  = isStrong ? "text-emerald-600" : isAverage ? "text-amber-600" : "text-rose-500";
                            const badge = isStrong ? "bg-emerald-50 border-emerald-200" : isAverage ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";
                            const matchLabel = isStrong ? "Strong" : isAverage ? "Average" : "Weak";
                            return (
                              <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${badge}`}>
                                <span className="text-xs text-gray-600 font-medium truncate pr-1">{label}</span>
                                <span className={`flex items-center gap-1.5 text-[11px] font-bold flex-shrink-0 ${text}`}>
                                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                                  {matchLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Apply link */}
                    {selected.apply_url && (
                      <a
                        href={selected.apply_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all"
                      >
                        View Program & Apply →
                      </a>
                    )}
                  </motion.div>
                )}

                {/* Search results list */}
                {!selected && !loading && results.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {results.map((p) => {
                      const tier = TIER_STYLES[p.tier];
                      return (
                        <motion.button
                          key={p.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => setSelected(p)}
                          className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                                {p.program_name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {p.university_name} · {p.city}, {p.country}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.field_of_study}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <span className={`font-black text-lg ${SCORE_COLOR(p.match_score)}`}>
                                {p.match_score}%
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tier.bg} ${tier.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                                {getTierLabel(p.tier)}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Empty state */}
                {!selected && !loading && query.length >= 2 && results.length === 0 && (
                  <div className="text-center py-12">
                    <GraduationCap className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No programs found for &ldquo;{query}&rdquo;</p>
                    <p className="text-xs text-gray-300 mt-1">Try a different university name, country, or field</p>
                  </div>
                )}

                {/* Idle state */}
                {!selected && !loading && query.length < 2 && (
                  <div className="text-center py-12">
                    <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-500 font-medium">Start typing to search</p>
                    <p className="text-xs text-gray-400 mt-1">Try &ldquo;Harvard&rdquo;, &ldquo;MSc Finance&rdquo;, or &ldquo;Australia&rdquo;</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

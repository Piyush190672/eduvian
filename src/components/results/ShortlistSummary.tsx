"use client";

import type { ScoredProgram } from "@/lib/types";
import { BookmarkCheck, X } from "lucide-react";
import { formatCurrency, getCountryFlag } from "@/lib/utils";

interface Props {
  programs: ScoredProgram[];
  onRemove: (id: string) => void;
}

export default function ShortlistSummary({ programs, onRemove }: Props) {
  if (programs.length === 0) return null;

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookmarkCheck className="w-5 h-5 text-indigo-500" />
        <span className="font-semibold text-indigo-800">
          My Shortlist ({programs.length})
        </span>
      </div>
      <div className="space-y-2">
        {programs.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/70 border border-white"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-lg">{getCountryFlag(p.country)}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {p.program_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {p.university_name} · {formatCurrency(p.annual_tuition_usd + p.avg_living_cost_usd)}/yr
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  p.tier === "safe"
                    ? "bg-emerald-50 text-emerald-600"
                    : p.tier === "moderate"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-rose-50 text-rose-500"
                }`}
              >
                {p.match_score}%
              </span>
              <button
                onClick={() => onRemove(p.id)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

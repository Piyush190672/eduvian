"use client";

import type { ScoredProgram } from "@/lib/types";
import { formatCurrency, getTierColor, getTierLabel, getCountryFlag } from "@/lib/utils";
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Clock,
  DollarSign,
  CalendarDays,
  Trophy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface Props {
  program: ScoredProgram;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{Math.round(value)}</span>
    </div>
  );
}

export default function ProgramCard({ program, isShortlisted, onToggleShortlist }: Props) {
  const [expanded, setExpanded] = useState(false);
  const totalCost = program.annual_tuition_usd + program.avg_living_cost_usd;
  const flag = getCountryFlag(program.country);
  const tierStyle = getTierColor(program.tier);
  const tierLabel = getTierLabel(program.tier);

  const scoreColor =
    program.match_score >= 80
      ? "text-emerald-600"
      : program.match_score >= 50
      ? "text-amber-600"
      : "text-orange-500";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Match score circle */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                program.match_score >= 80
                  ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200"
                  : program.match_score >= 50
                  ? "bg-amber-50 text-amber-600 border-2 border-amber-200"
                  : "bg-orange-50 text-orange-500 border-2 border-orange-200"
              }`}
            >
              {program.match_score}
            </div>
            <span className="text-xs text-gray-400 mt-1">match</span>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {program.program_name}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {flag} {program.university_name}
                  {program.qs_ranking && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs text-amber-600">
                      <Trophy className="w-3 h-3" />
                      QS #{program.qs_ranking}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={onToggleShortlist}
                className={`flex-shrink-0 p-2 rounded-xl transition-all ${
                  isShortlisted
                    ? "bg-indigo-50 text-indigo-500 hover:bg-rose-50 hover:text-rose-400"
                    : "bg-gray-50 text-gray-400 hover:bg-indigo-50 hover:text-indigo-500"
                }`}
                title={isShortlisted ? "Remove bookmark" : "Bookmark this program"}
              >
                {isShortlisted ? (
                  <BookmarkCheck className="w-4 h-4" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Tags row */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${tierStyle}`}>
                {tierLabel}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                {program.city}, {program.country}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100">
                {program.field_of_study}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.round(program.duration_months / 12 * 10) / 10} yrs
              </span>
            </div>

            {/* Cost & deadline row */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1 text-gray-600">
                <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{formatCurrency(totalCost)}</span>
                <span className="text-gray-400 text-xs">/yr total</span>
              </span>
              <span className="text-gray-400 text-xs">
                Tuition: {formatCurrency(program.annual_tuition_usd)} + Living: {formatCurrency(program.avg_living_cost_usd)}
              </span>
              {program.application_deadline && (
                <span className="flex items-center gap-1 text-gray-500 text-xs">
                  <CalendarDays className="w-3 h-3" />
                  Deadline:{" "}
                  <span className="font-medium">
                    {program.application_deadline === "rolling"
                      ? "Rolling"
                      : new Date(program.application_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom action row */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Hide score breakdown
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                View score breakdown
              </>
            )}
          </button>
          <a
            href={program.program_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors"
          >
            View Program
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Expandable score breakdown */}
      {expanded && (
        <div className="px-5 pb-5 bg-gray-50/50 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-4">
            Match Score Breakdown
          </p>
          <div className="space-y-2">
            <ScoreBar label="Academic" value={program.score_breakdown.academic} />
            <ScoreBar label="English" value={program.score_breakdown.english} />
            <ScoreBar label="Budget" value={program.score_breakdown.budget} />
            <ScoreBar label="Country Pref." value={program.score_breakdown.country_rank} />
            <ScoreBar label="QS Ranking" value={program.score_breakdown.qs_ranking} />
            <ScoreBar label="Intake" value={program.score_breakdown.intake} />
            <ScoreBar label="Work Exp." value={program.score_breakdown.work_experience} />
            <ScoreBar label="Std. Test" value={program.score_breakdown.std_test} />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-gray-400">Overall Match Score</span>
            <span className={`text-base font-black ${scoreColor}`}>
              {program.match_score}/100
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

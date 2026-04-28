"use client";

import type { ScoredProgram } from "@/lib/types";
import { formatCurrency, getTierColor, getTierLabel, getCountryFlag } from "@/lib/utils";
import { isFeeUnavailable, FEE_UNAVAILABLE_MESSAGE, FEE_UNAVAILABLE_SHORT } from "@/lib/format-fee";
import {
  ExternalLink,
  BookmarkCheck,
  BookmarkPlus,
  Clock,
  DollarSign,
  CalendarDays,
  Trophy,
  BarChart2,
} from "lucide-react";
import InlineProgramROI from "./InlineProgramROI";

interface Props {
  program: ScoredProgram;
  isShortlisted: boolean;
  onToggleShortlist: () => void;
  isInCompare?: boolean;
  onToggleCompare?: () => void;
  compareDisabled?: boolean;
}

type SignalStatus = "strong" | "partial" | "gap";

function getStatus(value: number): SignalStatus {
  if (value >= 75) return "strong";
  if (value >= 40) return "partial";
  return "gap";
}

const STATUS_STYLE: Record<SignalStatus, { bg: string; text: string; dot: string; icon: string }> = {
  strong:  { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", icon: "✓" },
  partial: { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   icon: "~" },
  gap:     { bg: "bg-rose-50",    text: "text-rose-600",    dot: "bg-rose-400",    icon: "✗" },
};

// Human-readable verdict per signal and score
function getVerdict(signal: string, value: number, isPG: boolean): string {
  const s = getStatus(value);
  switch (signal) {
    case "academic":
      return s === "strong" ? "Above requirement" : s === "partial" ? "Meets minimum" : "Below requirement";
    case "budget":
      return s === "strong" ? "Well within budget" : s === "partial" ? "Slightly over budget" : "Over budget";
    case "std_test":
      if (value === 60 || value === 70) return "No test submitted";
      return s === "strong" ? "Score qualifies" : s === "partial" ? "Close to requirement" : "Below requirement";
    case "english":
      if (value === 70 || value === 80) return "No test or not required";
      return s === "strong" ? "Meets requirement" : s === "partial" ? "Slightly below" : "Below requirement";
    case "scholarship":
      return s === "strong" ? "High scholarship availability" : s === "partial" ? "Some scholarships available" : "Limited scholarships";
    case "intake":
      return value === 100 ? "Intake available" : "Intake not offered";
    case "backlogs":
      return value === 100 ? "No backlogs" : value === 50 ? "1 backlog" : value === 25 ? "2–3 backlogs" : "4+ backlogs";
    case "gap_year":
      return value === 100 ? "No gap year" : "Gap year noted";
    case "work_experience":
      return s === "strong" ? "Meets work exp. req." : s === "partial" ? "Close to requirement" : "Below work exp. req.";
    default:
      return s === "strong" ? "Good" : s === "partial" ? "Partial" : "Needs attention";
  }
}

const SIGNAL_LABELS: Record<string, string> = {
  academic:        "Academics",
  budget:          "Budget",
  std_test:        "Std. Test",
  english:         "English",
  scholarship:     "Scholarships",
  intake:          "Intake",
  backlogs:        "Backlogs",
  gap_year:        "Gap Year",
  work_experience: "Work Exp.",
};

interface SignalChipProps {
  signal: string;
  value: number;
  isPG: boolean;
}

function SignalChip({ signal, value, isPG }: SignalChipProps) {
  const status = getStatus(value);
  const style = STATUS_STYLE[status];
  const verdict = getVerdict(signal, value, isPG);
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${style.bg} ${
      status === "strong" ? "border-emerald-100" : status === "partial" ? "border-amber-100" : "border-rose-100"
    }`}>
      <span className={`text-xs font-bold ${style.text}`}>{style.icon}</span>
      <div>
        <span className={`text-xs font-semibold ${style.text}`}>{SIGNAL_LABELS[signal]}</span>
        <p className="text-xs text-gray-500 leading-none mt-0.5">{verdict}</p>
      </div>
    </div>
  );
}

// Returns display info for application deadline:
// - future date  → { label: "Apply by May 1, 2026", urgent: true/false, past: false }
// - rolling      → { label: "Rolling admissions", urgent: false, past: false }
// - past date    → { label: "Application process not started", urgent: false, past: true }
// - null/missing → null
function getDeadlineInfo(deadline: string | null | undefined): {
  label: string;
  urgent: boolean;
  past: boolean;
} | null {
  if (!deadline) return null;
  if (deadline === "rolling") return { label: "Rolling admissions", urgent: false, past: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(deadline);
  dl.setHours(0, 0, 0, 0);

  if (dl < today) {
    return { label: "Application process not started", urgent: false, past: true };
  }

  const msLeft = dl.getTime() - today.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  const formatted = dl.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return {
    label: `Apply by ${formatted}`,
    urgent: daysLeft <= 30,
    past: false,
  };
}

export default function ProgramCard({ program, isShortlisted, onToggleShortlist, isInCompare, onToggleCompare, compareDisabled }: Props) {
  const tuitionUnavailable = isFeeUnavailable(program.annual_tuition_usd);
  const totalCost = tuitionUnavailable ? null : (program.annual_tuition_usd as number) + (program.avg_living_cost_usd ?? 0);
  const flag = getCountryFlag(program.country);
  const tierStyle = getTierColor(program.tier);
  const tierLabel = getTierLabel(program.tier);
  const isPG = program.degree_level === "postgraduate";
  const deadlineInfo = getDeadlineInfo(program.application_deadline);

  const bd = program.score_breakdown;

  // Signals to display (work_exp only if PG and has a value)
  const signals: { key: keyof typeof bd }[] = [
    { key: "academic"        },
    { key: "budget"          },
    { key: "std_test"        },
    { key: "english"         },
    { key: "scholarship"     },
    { key: "intake"          },
    { key: "backlogs"        },
    { key: "gap_year"        },
    ...(bd.work_experience > 0 ? [{ key: "work_experience" as keyof typeof bd }] : []),
  ];

  // Count weak signals for the summary pill
  const weakCount = signals.filter((s) => getStatus(bd[s.key] as number) === "gap").length;
  const partialCount = signals.filter((s) => getStatus(bd[s.key] as number) === "partial").length;

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
                  : "bg-rose-50 text-rose-600 border-2 border-rose-200"
              }`}
            >
              {program.match_score}
            </div>
            <span className="text-xs text-gray-400 mt-1">match</span>
          </div>

          {/* Main info */}
          <div className="flex-1 min-w-0">
            <div className="mb-1">
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
                {program.verified_at ? (
                  <span
                    className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5"
                    title={`Verified against official program page on ${new Date(program.verified_at).toLocaleDateString()}`}
                  >
                    ✓ Verified
                  </span>
                ) : (
                  <span
                    className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5"
                    title="Listing only — fees, deadlines and cutoffs have not been re-confirmed against the official page in the current admissions cycle. Always check the official link before applying."
                  >
                    ⚠ Listing only
                  </span>
                )}
              </p>
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
              {tuitionUnavailable ? (
                <span
                  className="flex items-center gap-1 text-amber-700 text-xs font-medium"
                  title={FEE_UNAVAILABLE_MESSAGE}
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  {FEE_UNAVAILABLE_SHORT}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold">{formatCurrency(totalCost as number)}</span>
                    <span className="text-gray-400 text-xs">/yr total</span>
                  </span>
                  <span className="text-gray-400 text-xs">
                    Tuition: {formatCurrency(program.annual_tuition_usd as number)} + Living: {formatCurrency(program.avg_living_cost_usd as number)}
                  </span>
                </>
              )}
              {deadlineInfo && (
                <span className={`flex items-center gap-1 text-xs ${
                  deadlineInfo.past    ? "text-gray-400"  :
                  deadlineInfo.urgent  ? "text-rose-500"  :
                                         "text-gray-500"
                }`}>
                  <CalendarDays className="w-3 h-3 flex-shrink-0" />
                  <span className={deadlineInfo.past ? "italic" : deadlineInfo.urgent ? "font-semibold" : "font-medium"}>
                    {deadlineInfo.label}
                  </span>
                  {deadlineInfo.urgent && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 font-bold text-[10px]">
                      Closing soon
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Score breakdown — always visible */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Why this score?</span>
            <span className="flex items-center gap-1.5">
              {weakCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                  {weakCount} gap{weakCount > 1 ? "s" : ""}
                </span>
              )}
              {partialCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">
                  {partialCount} partial
                </span>
              )}
              {weakCount === 0 && partialCount === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  All signals strong ✓
                </span>
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
            {signals.map((s) => (
              <SignalChip
                key={s.key}
                signal={s.key}
                value={bd[s.key] as number}
                isPG={isPG}
              />
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleShortlist}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all flex-1 justify-center ${
                isShortlisted
                  ? "bg-indigo-500 text-white border-indigo-500 hover:bg-rose-500 hover:border-rose-500"
                  : "bg-white text-indigo-600 border-indigo-400 hover:bg-indigo-50 hover:border-indigo-500"
              }`}
            >
              {isShortlisted ? (
                <><BookmarkCheck className="w-4 h-4" />Shortlisted</>
              ) : (
                <><BookmarkPlus className="w-4 h-4" />+ Shortlist</>
              )}
            </button>
            {onToggleCompare && (
              <button
                onClick={compareDisabled ? undefined : onToggleCompare}
                disabled={compareDisabled}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all whitespace-nowrap ${
                  isInCompare
                    ? "bg-violet-500 text-white border-violet-500 hover:bg-violet-600"
                    : compareDisabled
                    ? "bg-white text-gray-400 border-gray-200 opacity-40 cursor-not-allowed"
                    : "bg-white text-violet-600 border-violet-300 hover:bg-violet-50 hover:border-violet-400"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                {isInCompare ? "✓ Comparing" : compareDisabled ? "Max 5" : "+ Compare"}
              </button>
            )}
            <a
              href={program.program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-colors whitespace-nowrap"
            >
              Program Details
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href={program.apply_url ?? program.program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              Apply Now
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Inline ROI Calculator — pre-populated from this matched program */}
          <InlineProgramROI program={program} />
        </div>
      </div>
    </div>
  );
}

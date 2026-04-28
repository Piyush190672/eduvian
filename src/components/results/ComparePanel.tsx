"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trophy,
  TrendingUp,
  Shield,
  Plane,
  Briefcase,
  GraduationCap,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart2,
} from "lucide-react";
import type { ScoredProgram } from "@/lib/types";
import { calculateROI, lookupSalary } from "@/lib/roi-calculator";
import { formatCurrency, getCountryFlag, getTierColor, getTierLabel } from "@/lib/utils";
import { isFeeUnavailable, FEE_UNAVAILABLE_SHORT } from "@/lib/format-fee";
import { PSW_RIGHTS, SAFETY_RATINGS, JOB_MARKET } from "@/data/parent-decision-data";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";

// ── Country / field coercion (same pattern as InlineProgramROI) ────────────────

const VALID_SALARY_COUNTRIES: SalaryCountry[] = [
  "USA", "UK", "Australia", "Canada", "Germany",
  "Singapore", "New Zealand", "Ireland", "France", "UAE", "Malaysia",
];

const FIELD_REMAP: Record<string, FieldOfStudy> = {
  "Agriculture & Environmental Science": "Agriculture & Veterinary Sciences",
};

function toSalaryCountry(c: string): SalaryCountry {
  return VALID_SALARY_COUNTRIES.includes(c as SalaryCountry)
    ? (c as SalaryCountry)
    : "USA";
}

function toSalaryField(f: string): FieldOfStudy {
  return (FIELD_REMAP[f] ?? f) as FieldOfStudy;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtYears(y: number) {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

function formatDeadline(d: string | null | undefined): string {
  if (!d) return "—";
  if (d.toLowerCase() === "rolling") return "Rolling";
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return d;
  }
}

// ── Quality badge ──────────────────────────────────────────────────────────────

type QualityLevel = "Excellent" | "Good" | "Concerning";

function QualityBadge({ level }: { level: QualityLevel }) {
  const styles: Record<QualityLevel, string> = {
    Excellent:  "bg-emerald-100 text-emerald-700 border-emerald-200",
    Good:       "bg-blue-100 text-blue-700 border-blue-200",
    Concerning: "bg-amber-100 text-amber-700 border-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level}
    </span>
  );
}

// ── Tier badge ─────────────────────────────────────────────────────────────────

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTierColor(tier)}`}>
      {getTierLabel(tier)}
    </span>
  );
}

// ── Best value cell wrapper ────────────────────────────────────────────────────

function BestCell({ isBest, children }: { isBest: boolean; children: React.ReactNode }) {
  if (!isBest) {
    return <div className="px-3 py-2">{children}</div>;
  }
  return (
    <div className="px-3 py-2 ring-2 ring-emerald-400 bg-emerald-50 rounded-lg mx-1">
      <div className="flex flex-col gap-1">
        {children}
        <span className="text-[10px] font-bold text-emerald-600">✓ Best</span>
      </div>
    </div>
  );
}

// ── Section header row ─────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, colCount }: { icon: React.ComponentType<{className?: string}>; label: string; colCount: number }) {
  return (
    <tr className="bg-slate-50">
      <td className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        </div>
      </td>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-3 py-2.5 border-b border-slate-200 bg-slate-50" />
      ))}
    </tr>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface Props {
  programs: ScoredProgram[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ComparePanel({ programs, onClose, onRemove }: Props) {
  const n = programs.length;

  // Pre-compute derived data for each program
  const derived = programs.map((p) => {
    const country = toSalaryCountry(p.country);
    const field = toSalaryField(p.field_of_study);
    const salary = lookupSalary(country, field, p.qs_ranking, p.university_name);
    const roi = calculateROI({
      university_name: p.university_name,
      country,
      city: p.city,
      field_of_study: field,
      annual_tuition_usd: p.annual_tuition_usd,
      avg_living_cost_usd: p.avg_living_cost_usd,
      duration_months: p.duration_months,
      scholarship_usd: 0,
      expected_salary_usd: salary,
      savings_rate_pct: 20,
    });
    const safeCountry = toSalaryCountry(p.country);
    const pswInfo = PSW_RIGHTS[safeCountry];
    const safetyInfo = SAFETY_RATINGS[safeCountry];
    const jobInfo = JOB_MARKET[safeCountry];
    const totalAnnual = isFeeUnavailable(p.annual_tuition_usd) ? null : (p.annual_tuition_usd as number) + (p.avg_living_cost_usd ?? 0);
    return { salary, roi, pswInfo, safetyInfo, jobInfo, totalAnnual, country: safeCountry };
  });

  // Helper: find best index for a numeric row
  function bestIdx(values: (number | null | undefined)[], bestIs: "highest" | "lowest"): number {
    const valid = values.map((v, i) => ({ v: v ?? (bestIs === "highest" ? -Infinity : Infinity), i }));
    if (bestIs === "highest") {
      return valid.reduce((a, b) => (b.v > a.v ? b : a)).i;
    }
    return valid.reduce((a, b) => (b.v < a.v ? b : a)).i;
  }

  // Row renderer helpers
  function numericRow(
    label: string,
    values: (number | null | undefined)[],
    bestIs: "highest" | "lowest",
    format: (v: number) => string,
    subtitle?: (v: number, i: number) => string,
  ) {
    const best = bestIdx(values, bestIs);
    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap border-r border-gray-100">
          {label}
        </td>
        {values.map((v, i) => (
          <td key={i} className="text-center align-middle">
            <BestCell isBest={i === best && v != null}>
              <span className="text-sm font-semibold text-gray-800">
                {v != null ? format(v) : "—"}
              </span>
              {subtitle && v != null && (
                <span className="text-xs text-gray-400">{subtitle(v, i)}</span>
              )}
            </BestCell>
          </td>
        ))}
      </tr>
    );
  }

  function textRow(label: string, cells: React.ReactNode[]) {
    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
        <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap border-r border-gray-100">
          {label}
        </td>
        {cells.map((cell, i) => (
          <td key={i} className="px-3 py-3 text-center align-middle">
            {cell}
          </td>
        ))}
      </tr>
    );
  }

  // Budget fit row
  function budgetFitBadge(score: number) {
    if (score >= 75) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">Well within budget</span>;
    if (score >= 40) return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Slightly over</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">Over budget</span>;
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        key="panel"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 h-[92vh] bg-white rounded-t-3xl overflow-hidden flex flex-col z-50 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 pt-4 pb-3 border-b border-gray-100">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Program Comparison</h2>
                <p className="text-xs text-gray-400">Side-by-side analysis of {n} programs</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable content ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse" style={{ minWidth: `${Math.max(700, n * 200 + 200)}px` }}>
            <thead className="sticky top-0 z-20">
              <tr className="bg-white border-b-2 border-gray-200">
                {/* Label column */}
                <th className="sticky left-0 z-30 bg-white w-44 min-w-[11rem] px-4 py-3 text-left border-r border-gray-100" />
                {/* Program columns */}
                {programs.map((p, i) => (
                  <th key={p.id} className="px-3 py-3 min-w-[180px] bg-white">
                    <div className="flex flex-col gap-1.5 items-center text-center">
                      <div className="flex items-center gap-1.5 justify-center w-full">
                        <TierBadge tier={p.tier} />
                        <button
                          onClick={() => onRemove(p.id)}
                          className="ml-auto w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                          title="Remove from comparison"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">{p.program_name}</p>
                      <p className="text-xs text-gray-500 leading-tight">
                        {getCountryFlag(p.country)} {p.university_name}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className={`px-2 py-0.5 rounded-full text-xs font-black border-2 ${
                          p.match_score >= 80 ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : p.match_score >= 50 ? "bg-amber-50 text-amber-600 border-amber-200"
                          : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}>
                          {p.match_score}/100
                        </div>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* ── OVERVIEW ──────────────────────────────────────────── */}
              <SectionHeader icon={Trophy} label="Overview" colCount={n} />

              {/* Match Score */}
              {numericRow(
                "Match Score (/100)",
                programs.map((p) => p.match_score),
                "highest",
                (v) => `${v}/100`,
              )}

              {/* Tier */}
              {textRow("Tier", programs.map((p) => <TierBadge key={p.id} tier={p.tier} />))}

              {/* QS Ranking */}
              {numericRow(
                "QS Ranking",
                programs.map((p) => p.qs_ranking ?? null),
                "lowest",
                (v) => `#${v}`,
                undefined,
              )}

              {/* Duration */}
              {textRow("Duration", programs.map((p) => (
                <span key={p.id} className="text-sm font-semibold text-gray-700">
                  {(p.duration_months / 12).toFixed(1)} yrs
                </span>
              )))}

              {/* Location */}
              {textRow("Location", programs.map((p) => (
                <span key={p.id} className="text-sm text-gray-700">
                  {getCountryFlag(p.country)} {p.city}, {p.country}
                </span>
              )))}

              {/* ── COSTS ─────────────────────────────────────────────── */}
              <SectionHeader icon={DollarSign} label="Costs (Annual)" colCount={n} />

              {numericRow(
                "Annual Tuition",
                programs.map((p) => p.annual_tuition_usd),
                "lowest",
                (v) => (isFeeUnavailable(v) ? FEE_UNAVAILABLE_SHORT : formatCurrency(v as number)),
              )}

              {numericRow(
                "Annual Living Cost",
                programs.map((p) => p.avg_living_cost_usd),
                "lowest",
                formatCurrency,
              )}

              {numericRow(
                "Total Annual Cost",
                derived.map((d) => d.totalAnnual),
                "lowest",
                (v) => (isFeeUnavailable(v) ? FEE_UNAVAILABLE_SHORT : formatCurrency(v as number)),
              )}

              {numericRow(
                "Full Program Investment",
                derived.map((d) => d.roi.total_investment_usd),
                "lowest",
                formatCurrency,
              )}

              {/* Budget Fit */}
              {textRow("Budget Fit", programs.map((p) => budgetFitBadge(p.score_breakdown.budget)))}

              {/* ── FINANCIAL RETURNS ─────────────────────────────────── */}
              <SectionHeader icon={TrendingUp} label="Financial Returns" colCount={n} />

              {numericRow(
                "Expected Avg. Salary",
                derived.map((d) => d.salary),
                "highest",
                formatCurrency,
                (_v, i) => `${programs[i].country} / ${programs[i].field_of_study.split(" ")[0]}`,
              )}

              {numericRow(
                "Payback Period",
                derived.map((d) => isFinite(d.roi.payback_years) ? d.roi.payback_years : null),
                "lowest",
                (v) => fmtYears(v),
              )}

              {numericRow(
                "10-Year ROI (%)",
                derived.map((d) => d.roi.ten_year_roi_pct),
                "highest",
                (v) => `${v >= 0 ? "+" : ""}${v.toFixed(0)}%`,
              )}

              {/* ── LOCATION & VISA ────────────────────────────────────── */}
              <SectionHeader icon={Shield} label="Location & Visa" colCount={n} />

              {/* Location Safety */}
              {textRow("Location Safety", derived.map((d) => (
                <QualityBadge key={d.country} level={d.safetyInfo.rating} />
              )))}

              {/* PSW Visa Available */}
              {textRow("PSW Visa Available", derived.map((d) => (
                d.pswInfo.available
                  ? <span key={d.country} className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm"><CheckCircle2 className="w-4 h-4" /> Yes</span>
                  : <span key={d.country} className="inline-flex items-center gap-1 text-rose-500 font-semibold text-sm"><XCircle className="w-4 h-4" /> No</span>
              )))}

              {/* PSW Duration */}
              {textRow("PSW Duration", derived.map((d, i) => (
                <div key={i} className="flex flex-col gap-0.5 text-center">
                  <span className="text-sm font-semibold text-gray-800">{d.pswInfo.duration}</span>
                  <span className="text-[10px] text-gray-400 leading-tight">{d.pswInfo.note}</span>
                </div>
              )))}

              {/* Job Market */}
              {textRow("Job Market", derived.map((d) => (
                <QualityBadge key={d.country} level={d.jobInfo.rating} />
              )))}

              {/* ── ADMISSION ─────────────────────────────────────────── */}
              <SectionHeader icon={GraduationCap} label="Admission" colCount={n} />

              {/* Application Deadline */}
              {textRow("Application Deadline", programs.map((p) => (
                <span key={p.id} className="text-sm text-gray-700">
                  {formatDeadline(p.application_deadline)}
                </span>
              )))}

              {/* Min GPA / % */}
              {textRow("Min GPA / %", programs.map((p) => (
                <span key={p.id} className="text-sm text-gray-700">
                  {p.min_gpa != null
                    ? `GPA ${p.min_gpa.toFixed(1)}`
                    : p.min_percentage != null
                    ? `${p.min_percentage}%`
                    : "—"}
                </span>
              )))}

              {/* Padding row */}
              <tr><td colSpan={n + 1} className="h-8" /></tr>
            </tbody>
          </table>
        </div>

        {/* ── Bottom legend ──────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 bg-white flex items-center gap-4 text-xs text-gray-400">
          <Plane className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          <span>ROI calculated with 20% savings rate and $0 scholarship for fair comparison.</span>
          <span className="ml-auto flex items-center gap-2">
            <Briefcase className="w-3.5 h-3.5" />
            Salary lookup uses QS ranking premium.
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

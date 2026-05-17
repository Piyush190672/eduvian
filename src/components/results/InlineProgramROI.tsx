"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, Pencil, Check, Zap, ChevronDown, ChevronUp,
  DollarSign, Clock, BarChart3, PiggyBank, Landmark, Target,
  Info, ExternalLink,
} from "lucide-react";
import type { ScoredProgram } from "@/lib/types";
import { calculateROI, lookupSalary } from "@/lib/roi-calculator";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { formatCurrency } from "@/lib/utils";

// ── field / country coercion ──────────────────────────────────────────────────

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

// ── formatting helpers ────────────────────────────────────────────────────────

function fmtK(n: number | null | undefined) {
  if (n == null || !isFinite(n) || n === 0) return "—";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function fmtYears(y: number) {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

// ── payback colour scheme ────────────────────────────────────────────────────

function paybackScheme(years: number) {
  if (!isFinite(years) || years > 15)
    return { text: "text-rose-400",    bg: "bg-rose-500/10",    bar: "bg-rose-400",    label: "Long payback" };
  if (years > 8)
    return { text: "text-amber-400",   bg: "bg-amber-500/10",   bar: "bg-amber-400",   label: "Moderate" };
  return   { text: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500", label: "Excellent ✓" };
}

// ── auto badge ────────────────────────────────────────────────────────────────

function AutoBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full
      bg-indigo-500/20 text-indigo-300 text-[9px] font-bold border border-indigo-500/30">
      <Zap className="w-2 h-2" /> auto
    </span>
  );
}

// ── quick-select chip ─────────────────────────────────────────────────────────

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
        active
          ? "bg-indigo-500 text-white border-indigo-500"
          : "bg-white/5 text-slate-300 border-white/10 hover:border-indigo-400 hover:text-indigo-300"
      }`}
    >
      {label}
    </button>
  );
}

// ── metric card ───────────────────────────────────────────────────────────────

function Metric({
  icon: Icon, label, value, sub, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/8 flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${accent ?? "text-slate-400"}`} />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide leading-none">
          {label}
        </span>
      </div>
      <p className={`text-base font-black leading-tight ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 leading-snug">{sub}</p>}
    </div>
  );
}

// ── props ────────────────────────────────────────────────────────────────────

interface Props {
  program: ScoredProgram;
}

// ── main component ────────────────────────────────────────────────────────────

export default function InlineProgramROI({ program }: Props) {
  const [open, setOpen] = useState(false);

  const country = toSalaryCountry(program.country);
  const field   = toSalaryField(program.field_of_study);
  const defaultSalary = lookupSalary(country, field, program.qs_ranking, program.university_name);

  const [scholarship, setScholarship]   = useState(0);
  const [savingsRate,  setSavingsRate]   = useState(20);
  const [salary,       setSalary]        = useState(defaultSalary);
  const [editSalary,   setEditSalary]    = useState(false);
  const [salaryInput,  setSalaryInput]   = useState(String(defaultSalary));

  // Tuition gating: when the matched program has no verified tuition
  // (annual_tuition_usd is null or 0), pass through a user-entered value
  // instead of 0 (which would produce a meaningless "2.2 yrs payback /
  // +2198% ROI" surface). Metrics stay gated until a positive value is
  // committed.
  const programHasFee = typeof program.annual_tuition_usd === "number"
    && program.annual_tuition_usd > 0;
  const [customTuition, setCustomTuition] = useState(0);
  const effectiveTuition = programHasFee ? program.annual_tuition_usd! : customTuition;
  const tuitionAvailable = effectiveTuition > 0;
  const tuitionUserSupplied = !programHasFee && tuitionAvailable;

  // Living-cost gating — same pattern (user-reported 17 May 2026).
  // Treat anything below $3,000/yr as "missing data" (real annual
  // living costs in the 12 destinations don't go below ~$4k even for
  // Malaysia/UAE; values like $650 for UNSW are extraction errors).
  // 107 programs in the DB currently carry implausibly-low values;
  // those + any null/0 entries now prompt the user the same way
  // missing tuition does.
  const LIVING_MIN_PLAUSIBLE = 3000;
  const programHasLiving = typeof program.avg_living_cost_usd === "number"
    && program.avg_living_cost_usd >= LIVING_MIN_PLAUSIBLE;
  const [customLiving, setCustomLiving] = useState(0);
  const effectiveLiving = programHasLiving ? program.avg_living_cost_usd! : customLiving;
  const livingAvailable = effectiveLiving > 0;
  const livingUserSupplied = !programHasLiving && livingAvailable;

  const canCalculate = tuitionAvailable && livingAvailable;

  const roi = canCalculate ? calculateROI({
    university_name:    program.university_name,
    country,
    city:               program.city,
    field_of_study:     field,
    annual_tuition_usd: effectiveTuition,
    avg_living_cost_usd: effectiveLiving,
    duration_months:    program.duration_months,
    scholarship_usd:    scholarship,
    expected_salary_usd: salary,
    savings_rate_pct:   savingsRate,
  }) : null;

  const pb      = roi ? paybackScheme(roi.payback_years) : null;
  const roiSign = roi && roi.ten_year_roi_pct >= 0 ? "+" : "";
  const roiColor = roi && roi.ten_year_roi_pct >= 0 ? "text-emerald-400" : "text-rose-400";

  const SCHOLARSHIP_OPTIONS = [0, 5000, 10000, 20000, 30000, 50000];
  const RATE_OPTIONS        = [5, 10, 15, 20, 30, 40];

  function commitSalary() {
    const v = parseInt(salaryInput.replace(/[^0-9]/g, ""), 10);
    if (v > 0) setSalary(v);
    setEditSalary(false);
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
          open
            ? "bg-slate-800 text-indigo-300 border-slate-700 hover:bg-slate-700"
            : "bg-gradient-to-r from-slate-800 to-indigo-900 text-indigo-200 border-indigo-800/50 hover:border-indigo-600 hover:text-white"
        }`}
      >
        <TrendingUp className="w-4 h-4" />
        {open ? "Hide ROI Analysis" : "View ROI Analysis"}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expandable panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950
              border border-indigo-900/50 p-4 space-y-4">

              {/* Header + auto-filled info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">ROI Analysis</p>
                    <p className="text-[10px] text-slate-500">All fields pre-filled from matched program</p>
                  </div>
                </div>
                <AutoBadge />
              </div>

              {/* Auto-filled context row */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {[
                  `${program.country}`,
                  `${program.field_of_study}`,
                  `${Math.round(program.duration_months / 12 * 10) / 10} yrs`,
                  programHasFee
                    ? `Tuition ${fmtK(program.annual_tuition_usd!)}/yr`
                    : tuitionUserSupplied
                      ? `Tuition ${fmtK(customTuition)}/yr (you entered)`
                      : "Tuition — enter below",
                  programHasLiving
                    ? `Living ${fmtK(program.avg_living_cost_usd!)}/yr`
                    : livingUserSupplied
                      ? `Living ${fmtK(customLiving)}/yr (you entered)`
                      : "Living — enter below",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20
                      text-indigo-300 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Tuition-fee input — appears when the matched program's
                  official page didn't expose a verifiable international
                  fee. ROI math is gated until a positive value is entered. */}
              {!programHasFee && (
                <div className={`rounded-xl border p-3.5 ${
                  tuitionUserSupplied
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-amber-500/10 border-amber-500/40"
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-amber-200 mb-0.5">
                        Annual tuition fee {tuitionUserSupplied ? "(you entered)" : "needed"}
                      </p>
                      <p className="text-[11px] text-amber-200/80 leading-snug">
                        The official program page didn&apos;t publish an international tuition figure we can verify.
                        {tuitionUserSupplied
                          ? " ROI below uses the value you typed — re-confirm with the university before relying on these numbers."
                          : " Enter the annual fee in USD to unlock the ROI metrics."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="e.g. 45000"
                      value={customTuition || ""}
                      onChange={(e) => setCustomTuition(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/10 border border-amber-400/40
                        text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <span className="text-[10px] text-amber-300/80 font-semibold uppercase tracking-wide">USD / yr</span>
                  </div>
                  {program.program_url && (
                    <a
                      href={program.program_url}
                      target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 hover:text-amber-200"
                    >
                      Open the official program page <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {/* Living-cost input — appears when the program's avg_living_cost_usd
                  is missing, zero, or implausibly low (<$3k/yr — extraction
                  errors like UNSW $650). ROI math is gated until a positive
                  value is entered. */}
              {!programHasLiving && (
                <div className={`rounded-xl border p-3.5 ${
                  livingUserSupplied
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-amber-500/10 border-amber-500/40"
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <Info className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-amber-200 mb-0.5">
                        Annual living cost {livingUserSupplied ? "(you entered)" : "needed"}
                      </p>
                      <p className="text-[11px] text-amber-200/80 leading-snug">
                        We don&apos;t have a reliable living-cost figure for this program&apos;s city.
                        {livingUserSupplied
                          ? " ROI below uses the value you typed."
                          : " Enter your expected annual rent + food + transport + other expenses in USD to unlock the ROI metrics."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-300 font-bold text-sm">$</span>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      placeholder="e.g. 15000"
                      value={customLiving || ""}
                      onChange={(e) => setCustomLiving(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/10 border border-amber-400/40
                        text-sm text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <span className="text-[10px] text-amber-300/80 font-semibold uppercase tracking-wide">USD / yr</span>
                  </div>
                </div>
              )}

              {!roi || !pb ? (
                // Metrics-gated state: program has no verified tuition and
                // the user hasn't entered one yet. Render a placeholder
                // instead of misleading numbers ($0 tuition → fake "2.2 yrs
                // payback").
                <div className="rounded-xl bg-slate-900/40 border border-slate-700/50 px-4 py-6 text-center">
                  <BarChart3 className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                  <p className="text-[12px] font-semibold text-slate-400">
                    {!tuitionAvailable && !livingAvailable
                      ? "Enter the annual tuition AND living cost above to see payback period, 10-yr ROI, and break-even salary."
                      : !tuitionAvailable
                        ? "Enter the annual tuition above to see payback period, 10-yr ROI, and break-even salary."
                        : "Enter the annual living cost above to see payback period, 10-yr ROI, and break-even salary."}
                  </p>
                </div>
              ) : (
              <>
              {/* ── Adjustable inputs ────────────────────────────────── */}
              <div className="space-y-3">
                {/* Scholarship */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <Landmark className="w-3 h-3" /> Scholarship / Grant
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {SCHOLARSHIP_OPTIONS.map((v) => (
                      <Chip
                        key={v}
                        label={v === 0 ? "None" : fmtK(v)}
                        active={scholarship === v}
                        onClick={() => setScholarship(v)}
                      />
                    ))}
                  </div>
                </div>

                {/* Savings rate */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <PiggyBank className="w-3 h-3" /> Post-Grad Savings Rate
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RATE_OPTIONS.map((v) => (
                      <Chip
                        key={v}
                        label={`${v}%`}
                        active={savingsRate === v}
                        onClick={() => setSavingsRate(v)}
                      />
                    ))}
                  </div>
                </div>

                {/* Expected salary */}
                <div className="flex items-center justify-between bg-white/5 rounded-xl px-3.5 py-2.5
                  border border-white/8">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wide leading-none mb-0.5">
                        Expected Starting Salary
                      </p>
                      {editSalary ? (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">$</span>
                          <input
                            type="number"
                            value={salaryInput}
                            onChange={(e) => setSalaryInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") commitSalary(); }}
                            className="w-24 bg-white/10 border border-indigo-400 rounded-lg px-2 py-0.5
                              text-sm text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
                            autoFocus
                          />
                          <button
                            onClick={commitSalary}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-white">{formatCurrency(salary)}/yr</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AutoBadge />
                    {!editSalary && (
                      <button
                        onClick={() => { setEditSalary(true); setSalaryInput(String(salary)); }}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        title="Edit salary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Metrics grid ─────────────────────────────────────── */}
              <div className="grid grid-cols-3 gap-2">
                <Metric
                  icon={Landmark}
                  label="Total Investment"
                  value={fmtK(roi.total_investment_usd)}
                  sub={scholarship > 0 ? `After ${fmtK(scholarship)} grant` : undefined}
                  accent="text-white"
                />
                <Metric
                  icon={Clock}
                  label="Payback Period"
                  value={fmtYears(roi.payback_years)}
                  sub={pb.label}
                  accent={pb.text}
                />
                <Metric
                  icon={TrendingUp}
                  label="10-Yr ROI"
                  value={`${roiSign}${roi.ten_year_roi_pct.toFixed(0)}%`}
                  sub="vs. total cost"
                  accent={roiColor}
                />
                <Metric
                  icon={DollarSign}
                  label="Monthly Budget"
                  value={fmtK(roi.monthly_budget_usd)}
                  sub="while studying"
                  accent="text-slate-300"
                />
                <Metric
                  icon={PiggyBank}
                  label="Monthly Savings"
                  value={fmtK(roi.monthly_savings_usd)}
                  sub="post-graduation"
                  accent="text-emerald-400"
                />
                <Metric
                  icon={BarChart3}
                  label="Net 10-Yr Gain"
                  value={fmtK(roi.net_earnings_10yr_usd)}
                  sub="salary − investment"
                  accent={roi.net_earnings_10yr_usd >= 0 ? "text-emerald-400" : "text-rose-400"}
                />
              </div>

              {/* ── Break-even insight ───────────────────────────────── */}
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[11px] font-medium ${
                salary >= roi.breakeven_salary_usd
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-300"
              }`}>
                <Target className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  Break-even salary: <strong>{fmtK(roi.breakeven_salary_usd)}/yr</strong>
                  {salary >= roi.breakeven_salary_usd
                    ? ` · You're ${Math.round(((salary - roi.breakeven_salary_usd) / roi.breakeven_salary_usd) * 100)}% above break-even ✓`
                    : ` · ${fmtK(roi.breakeven_salary_usd - salary)} below — consider scholarships or budget adjustments`}
                </span>
              </div>
              </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

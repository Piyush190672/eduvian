"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ShieldCheck, TrendingUp, Globe2,
  GraduationCap, MapPin, Users, Star, Briefcase, Heart,
  CheckCircle2, AlertTriangle, XCircle, DollarSign, ArrowRight,
} from "lucide-react";
import { CURATED_UNIVERSITIES, SALARY_LOOKUP } from "@/data/roi-data";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { calculateParentDecision } from "@/lib/parent-decision-calculator";
import { PROGRAMS } from "@/data/programs";
import Link from "next/link";

// ── types ─────────────────────────────────────────────────────────────────────

interface ProgramEntry {
  university_name: string;
  country: string;
  city: string;
  program_name: string;
  degree_level: string;
  field_of_study: string;
  annual_tuition_usd: number;
  avg_living_cost_usd: number;
  duration_months: number;
}

type QualityLevel = "Excellent" | "Good" | "Concerning";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (!isFinite(n) || n === 0) return "$0";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;
}

function fmtYears(y: number) {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

const ALL_PROGRAMS = PROGRAMS as unknown as ProgramEntry[];

const FIELDS_OF_STUDY: FieldOfStudy[] = [
  "Computer Science & IT",
  "Artificial Intelligence & Data Science",
  "Business & Management",
  "MBA",
  "Economics & Finance",
  "Engineering (Mechanical/Civil/Electrical)",
  "Medicine & Public Health",
  "Law",
  "Nursing & Allied Health",
  "Natural Sciences",
  "Biotechnology & Life Sciences",
  "Environmental & Sustainability Studies",
  "Social Sciences & Humanities",
  "Arts, Design & Architecture",
  "Media & Communications",
  "Agriculture & Veterinary Sciences",
  "Hospitality & Tourism",
];

const BUDGET_OPTIONS = [
  { label: "Up to $20K/yr",  value: 20000 },
  { label: "Up to $35K/yr",  value: 35000 },
  { label: "Up to $50K/yr",  value: 50000 },
  { label: "Up to $70K/yr",  value: 70000 },
  { label: "Up to $100K/yr", value: 100000 },
  { label: "No budget cap",  value: 999999 },
];

// ── sub-components ────────────────────────────────────────────────────────────

function RatingBadge({ rating }: { rating: QualityLevel }) {
  const map: Record<QualityLevel, { bg: string; text: string; icon: React.ReactNode }> = {
    Excellent:  { bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    Good:       { bg: "bg-amber-100",   text: "text-amber-700",   icon: <ShieldCheck  className="w-3.5 h-3.5" /> },
    Concerning: { bg: "bg-rose-100",    text: "text-rose-700",    icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  };
  const { bg, text, icon } = map[rating];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${bg} ${text}`}>
      {icon} {rating}
    </span>
  );
}

function ScoreBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = (score / max) * 100;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs font-bold text-gray-800">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function MetricRow({
  label, value, sub, icon: Icon, iconColor = "text-indigo-500",
}: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ComponentType<{ className?: string }>; iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`mt-0.5 ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
        {sub && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>}
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ParentDecisionTool() {
  // University search
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedUni, setSelectedUni] = useState<typeof CURATED_UNIVERSITIES[0] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Program select
  const [selectedProgram, setSelectedProgram] = useState<ProgramEntry | null>(null);
  const [programOpen, setProgramOpen] = useState(false);
  const programRef = useRef<HTMLDivElement>(null);

  // Auto-populated fields (editable)
  const [city, setCity] = useState("");
  const [field, setField] = useState<FieldOfStudy>("Computer Science & IT");
  const [annualTuition, setAnnualTuition] = useState(25000);
  const [livingCost, setLivingCost] = useState(15000);
  const [durationMonths, setDurationMonths] = useState(24);
  const [scholarship, setScholarship] = useState(0);
  const [budgetUsd, setBudgetUsd] = useState(50000);

  // UI
  const [hasResult, setHasResult] = useState(false);

  // Filtered universities
  const filteredUnis = useMemo(() => {
    if (!query.trim()) return CURATED_UNIVERSITIES.slice(0, 8);
    const q = query.toLowerCase();
    return CURATED_UNIVERSITIES.filter((u) =>
      u.name.toLowerCase().includes(q) || u.country.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query]);

  // Programs for selected university
  const uniPrograms = useMemo(() => {
    if (!selectedUni) return [];
    return ALL_PROGRAMS.filter(
      (p) => p.university_name === selectedUni.name
    ).slice(0, 30);
  }, [selectedUni]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (programRef.current && !programRef.current.contains(e.target as Node)) {
        setProgramOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function selectUniversity(uni: typeof CURATED_UNIVERSITIES[0]) {
    setSelectedUni(uni);
    setQuery(uni.name);
    setDropdownOpen(false);
    setSelectedProgram(null);
    // auto-populate from first program if available
    const progs = ALL_PROGRAMS.filter((p) => p.university_name === uni.name);
    if (progs.length > 0) {
      const p = progs[0];
      setCity(p.city || "");
      const f = p.field_of_study as FieldOfStudy;
      setField(FIELDS_OF_STUDY.includes(f) ? f : "Computer Science & IT");
      setAnnualTuition(p.annual_tuition_usd || 25000);
      setLivingCost(p.avg_living_cost_usd || 15000);
      setDurationMonths(p.duration_months || 24);
    }
    setHasResult(false);
  }

  function selectProgram(p: ProgramEntry) {
    setSelectedProgram(p);
    setProgramOpen(false);
    setCity(p.city || city);
    const f = p.field_of_study as FieldOfStudy;
    setField(FIELDS_OF_STUDY.includes(f) ? f : field);
    setAnnualTuition(p.annual_tuition_usd);
    setLivingCost(p.avg_living_cost_usd);
    setDurationMonths(p.duration_months);
    setHasResult(false);
  }

  const result = useMemo(() => {
    if (!selectedUni || !hasResult) return null;
    return calculateParentDecision({
      university_name: selectedUni.name,
      country: selectedUni.country as SalaryCountry,
      city,
      field_of_study: field,
      qs_ranking: selectedUni.qs_ranking,
      annual_tuition_usd: annualTuition,
      avg_living_cost_usd: livingCost,
      duration_months: durationMonths,
      budget_usd: budgetUsd,
      scholarship_usd: scholarship,
    });
  }, [selectedUni, hasResult, city, field, annualTuition, livingCost, durationMonths, budgetUsd, scholarship]);

  function handleAnalyze() {
    if (!selectedUni) return;
    setHasResult(true);
  }

  const budgetLabel = BUDGET_OPTIONS.find((b) => b.value === budgetUsd)?.label ?? `$${(budgetUsd / 1000).toFixed(0)}K/yr`;

  const recommendationStyle = result
    ? {
        emerald: { outer: "bg-emerald-50 border-emerald-200", title: "text-emerald-700", badge: "bg-emerald-500" },
        amber:   { outer: "bg-amber-50  border-amber-200",   title: "text-amber-700",   badge: "bg-amber-500"   },
        rose:    { outer: "bg-rose-50   border-rose-200",     title: "text-rose-700",     badge: "bg-rose-500"     },
      }[result.recommendation_color]
    : null;

  return (
    <section id="parent-decision-tool" className="py-24 px-6 bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
            <Users className="w-3.5 h-3.5" />
            FOR PARENTS
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
            Parent Decision Tool
          </h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
            Get a clear, data-driven answer: is sending your child to study abroad the right decision?
            Enter the university and degree — we&apos;ll evaluate cost, safety, career prospects and more.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Inputs panel ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-5">
            <h3 className="text-base font-bold text-gray-800">Enter Details</h3>

            {/* University search */}
            <div ref={dropdownRef} className="relative">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">University</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  placeholder="Search university..."
                  onFocus={() => setDropdownOpen(true)}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
              </div>
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-30 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-52 overflow-y-auto"
                  >
                    {filteredUnis.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No matches</p>
                    ) : filteredUnis.map((u) => (
                      <button
                        key={u.name}
                        onMouseDown={() => selectUniversity(u)}
                        className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center gap-2.5 transition-colors"
                      >
                        <span className="text-lg leading-none">{u.flag}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 leading-tight">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.country}{u.qs_ranking ? ` · QS #${u.qs_ranking}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Program select */}
            {selectedUni && uniPrograms.length > 0 && (
              <div ref={programRef} className="relative">
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Intended Degree</label>
                <button
                  onClick={() => setProgramOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-300 hover:border-indigo-300 transition-colors"
                >
                  <span className={selectedProgram ? "text-gray-800" : "text-gray-400"}>
                    {selectedProgram ? selectedProgram.program_name : "Select program..."}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
                <AnimatePresence>
                  {programOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="absolute z-30 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-52 overflow-y-auto"
                    >
                      {uniPrograms.map((p, i) => (
                        <button
                          key={i}
                          onMouseDown={() => selectProgram(p)}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-800 leading-tight">{p.program_name}</p>
                          <p className="text-xs text-gray-400">{p.degree_level} · {p.duration_months} months · {fmtK(p.annual_tuition_usd)}/yr</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Annual Budget
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setBudgetUsd(b.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      budgetUsd === b.value
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scholarship */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scholarship (USD)</label>
                <span className="text-xs font-bold text-indigo-600">{fmtK(scholarship)}</span>
              </div>
              <input
                type="range" min={0} max={60000} step={1000}
                value={scholarship}
                onChange={(e) => setScholarship(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>$0</span><span>$60K</span>
              </div>
            </div>

            {/* Auto-populated note */}
            {selectedUni && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <GraduationCap className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-indigo-700 leading-snug">
                  Tuition, living costs & salary data are auto-populated from real program data. You can adjust them if needed.
                </p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={!selectedUni}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200"
            >
              Analyze Decision
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* ── Results panel ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[420px] bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-10 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Make an informed decision</h3>
                  <p className="text-gray-400 text-sm max-w-xs">
                    Select a university and click &ldquo;Analyze Decision&rdquo; to see a complete evaluation across 7 key factors.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {/* Recommendation banner */}
                  <div className={`rounded-3xl border p-6 ${recommendationStyle!.outer}`}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recommendation</p>
                        <p className={`text-3xl font-extrabold ${recommendationStyle!.title}`}>
                          {result.recommendation_icon} {result.recommendation}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Overall score: <span className="font-bold text-gray-700">{result.total_pct}/100</span>
                        </p>
                      </div>
                      {/* Score ring */}
                      <div className="flex flex-col items-center">
                        <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center ${recommendationStyle!.badge} text-white`}>
                          <span className="text-2xl font-extrabold leading-none">{result.total_pct}</span>
                          <span className="text-[10px] font-semibold opacity-90">/ 100</span>
                        </div>
                      </div>
                    </div>

                    {/* Score breakdown */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      <ScoreBar label="Budget Fit"     score={result.budget_fit_score}    max={20} color={result.budget_fit_score >= 16 ? "bg-emerald-500" : result.budget_fit_score >= 10 ? "bg-amber-400" : "bg-rose-400"} />
                      <ScoreBar label="QS Ranking"     score={result.ranking_score}       max={15} color={result.ranking_score >= 12 ? "bg-emerald-500" : result.ranking_score >= 9 ? "bg-amber-400" : "bg-rose-400"} />
                      <ScoreBar label="Post-Study Work" score={result.psw_score}          max={15} color={result.psw_score === 15 ? "bg-emerald-500" : "bg-rose-400"} />
                      <ScoreBar label="Job Market"     score={result.job_market_score}    max={15} color={result.job_market_score >= 12 ? "bg-emerald-500" : result.job_market_score >= 9 ? "bg-amber-400" : "bg-rose-400"} />
                      <ScoreBar label="Financial ROI"  score={result.financial_roi_score} max={15} color={result.financial_roi_score >= 12 ? "bg-emerald-500" : result.financial_roi_score >= 6 ? "bg-amber-400" : "bg-rose-400"} />
                      <ScoreBar label="Safety"         score={result.safety_score}        max={10} color={result.safety_score >= 9 ? "bg-emerald-500" : result.safety_score >= 6 ? "bg-amber-400" : "bg-rose-400"} />
                      <ScoreBar label="Student Life"   score={result.student_life_score}  max={10} color={result.student_life_score >= 9 ? "bg-emerald-500" : result.student_life_score >= 6 ? "bg-amber-400" : "bg-rose-400"} />
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Financial metrics */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Financials</p>
                      <MetricRow
                        icon={DollarSign} iconColor="text-indigo-500"
                        label="Total Cost of Degree"
                        value={fmtK(result.total_cost_usd)}
                        sub={`Tuition ${fmtK(result.total_tuition_usd)} + Living ${fmtK(result.total_living_usd)}`}
                      />
                      <MetricRow
                        icon={DollarSign} iconColor="text-emerald-500"
                        label="Net Cost (after scholarship)"
                        value={fmtK(result.net_cost_usd)}
                        sub={result.net_cost_usd < result.total_cost_usd ? `Scholarship saves ${fmtK(result.total_cost_usd - result.net_cost_usd)}` : "No scholarship applied"}
                      />
                      <MetricRow
                        icon={TrendingUp} iconColor="text-purple-500"
                        label="Potential Starting Salary"
                        value={fmtK(result.expected_salary_usd) + "/yr"}
                        sub={`Based on actual grad trends in ${selectedUni!.country}`}
                      />
                      <MetricRow
                        icon={Globe2} iconColor={result.payback_years <= 5 ? "text-emerald-500" : result.payback_years <= 10 ? "text-amber-500" : "text-rose-500"}
                        label="Payback Period"
                        value={fmtYears(result.payback_years)}
                        sub="Time to recover full investment (30% savings rate)"
                      />
                      <MetricRow
                        icon={result.roi_positive ? CheckCircle2 : XCircle}
                        iconColor={result.roi_positive ? "text-emerald-500" : "text-rose-500"}
                        label="ROI Positive?"
                        value={result.roi_positive ? "Yes — 10-year earnings exceed investment" : "No — cost outweighs 10-year earnings"}
                      />
                    </div>

                    {/* Qualitative metrics */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Qualitative</p>
                      <MetricRow
                        icon={MapPin} iconColor="text-gray-500"
                        label="Location"
                        value={city || selectedUni!.country}
                      />
                      <MetricRow
                        icon={Star} iconColor="text-amber-500"
                        label="QS World Ranking"
                        value={selectedUni!.qs_ranking ? `#${selectedUni!.qs_ranking}` : "Unranked / Specialist"}
                      />
                      <MetricRow
                        icon={ShieldCheck} iconColor={result.psw_available ? "text-emerald-500" : "text-rose-500"}
                        label="Post-Study Work Rights"
                        value={
                          <span className={`font-bold ${result.psw_available ? "text-emerald-600" : "text-rose-600"}`}>
                            {result.psw_available ? `Yes — ${result.psw_duration}` : "No"}
                          </span>
                        }
                        sub={result.psw_note}
                      />
                      <MetricRow
                        icon={Briefcase} iconColor="text-blue-500"
                        label="Job Market"
                        value={<RatingBadge rating={result.job_market_rating} />}
                        sub={result.job_market_detail}
                      />
                      <MetricRow
                        icon={ShieldCheck} iconColor="text-teal-500"
                        label="Safety & Security"
                        value={<RatingBadge rating={result.safety_rating} />}
                        sub={result.safety_detail}
                      />
                      <MetricRow
                        icon={Heart} iconColor="text-pink-500"
                        label="Quality of Student Life"
                        value={<RatingBadge rating={result.student_life_rating} />}
                        sub={result.student_life_detail}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-bold text-base">Ready to take the next step?</p>
                      <p className="text-indigo-200 text-sm mt-0.5">Get a personalised university shortlist for your child in minutes.</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:shadow-lg transition-all"
                    >
                      Build Shortlist <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

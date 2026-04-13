"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ShieldCheck, TrendingUp, Globe2,
  GraduationCap, MapPin, Users, Star, Briefcase, Heart,
  CheckCircle2, AlertTriangle, XCircle, DollarSign, ArrowRight, Zap,
} from "lucide-react";
import { CURATED_UNIVERSITIES } from "@/data/roi-data";
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

const ALL_PROGRAMS = PROGRAMS as unknown as ProgramEntry[];

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (!isFinite(n) || n === 0) return "$0";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;
}

function fmtYears(y: number) {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

const BUDGET_OPTIONS = [
  { label: "$20K/yr",   value: 20000 },
  { label: "$35K/yr",   value: 35000 },
  { label: "$50K/yr",   value: 50000 },
  { label: "$70K/yr",   value: 70000 },
  { label: "$100K/yr",  value: 100000 },
  { label: "No limit",  value: 999999 },
];

const SCHOLARSHIP_OPTIONS = [0, 5000, 10000, 15000, 20000, 30000, 50000];

// ── sub-components ────────────────────────────────────────────────────────────

function AutoTag() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600 text-[10px] font-bold">
      <Zap className="w-2.5 h-2.5" /> auto
    </span>
  );
}

function StepLabel({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${done ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-400"}`}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : n}
      </div>
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function AutoFilledCard({ icon: Icon, label, value, sub }: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 bg-purple-50 border border-purple-100 rounded-xl">
      <Icon className="w-4 h-4 text-purple-500 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-purple-500 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 leading-snug">{sub}</p>}
      </div>
      <AutoTag />
    </div>
  );
}

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
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600 font-medium">{label}</span>
        <span className="text-xs font-bold text-gray-700">{score}/{max}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }} animate={{ width: `${(score / max) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function MetricRow({ label, value, sub, icon: Icon, iconColor = "text-indigo-500" }: {
  label: string; value: React.ReactNode; sub?: string;
  icon: React.ComponentType<{ className?: string }>; iconColor?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`mt-0.5 ${iconColor}`}><Icon className="w-4 h-4" /></div>
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

  // Step 1 — University
  const [query, setQuery]             = useState("");
  const [showSugg, setShowSugg]       = useState(false);
  const [selectedUni, setSelectedUni] = useState<typeof CURATED_UNIVERSITIES[0] | null>(null);
  const uniRef = useRef<HTMLDivElement>(null);

  // Step 2 — Program
  const [selectedProgram, setSelectedProgram] = useState<ProgramEntry | null>(null);
  const [programOpen, setProgramOpen]         = useState(false);
  const programRef = useRef<HTMLDivElement>(null);

  // Step 3 — Scholarship + Budget (user inputs)
  const [scholarship, setScholarship] = useState(0);
  const [budgetUsd, setBudgetUsd]     = useState(50000);

  // Auto-filled from program
  const [city, setCity]                   = useState("");
  const [field, setField]                 = useState<FieldOfStudy>("Computer Science & IT");
  const [annualTuition, setAnnualTuition] = useState(0);
  const [livingCost, setLivingCost]       = useState(0);
  const [durationMonths, setDurationMonths] = useState(24);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) setShowSugg(false);
      if (programRef.current && !programRef.current.contains(e.target as Node)) setProgramOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Typeahead
  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q.length < 2) return [];
    return CURATED_UNIVERSITIES
      .filter((u) => u.name.toLowerCase().includes(q) || u.country.toLowerCase().includes(q))
      .slice(0, 7);
  }, [query]);

  // Programs for selected university
  const uniPrograms = useMemo(() => {
    if (!selectedUni) return [];
    return ALL_PROGRAMS.filter((p) => p.university_name === selectedUni.name);
  }, [selectedUni]);

  function selectUniversity(u: typeof CURATED_UNIVERSITIES[0]) {
    setSelectedUni(u);
    setQuery(u.name);
    setShowSugg(false);
    setSelectedProgram(null);
    setCity(""); setAnnualTuition(0); setLivingCost(0); setDurationMonths(24);
  }

  function selectProgram(p: ProgramEntry) {
    setSelectedProgram(p);
    setProgramOpen(false);
    setCity(p.city || "");
    const f = p.field_of_study as FieldOfStudy;
    setField(f);
    setAnnualTuition(p.annual_tuition_usd);
    setLivingCost(p.avg_living_cost_usd);
    setDurationMonths(p.duration_months);
  }

  // Auto-calculate result as soon as uni + program selected
  const result = useMemo(() => {
    if (!selectedUni || !selectedProgram) return null;
    return calculateParentDecision({
      university_name:     selectedUni.name,
      country:             selectedUni.country as SalaryCountry,
      city,
      field_of_study:      field,
      qs_ranking:          selectedUni.qs_ranking,
      annual_tuition_usd:  annualTuition,
      avg_living_cost_usd: livingCost,
      duration_months:     durationMonths,
      budget_usd:          budgetUsd,
      scholarship_usd:     scholarship,
    });
  }, [selectedUni, selectedProgram, city, field, annualTuition, livingCost, durationMonths, budgetUsd, scholarship]);

  const recStyle = result ? {
    emerald: { outer: "bg-emerald-50 border-emerald-200", title: "text-emerald-700", badge: "bg-emerald-500" },
    amber:   { outer: "bg-amber-50 border-amber-200",     title: "text-amber-700",   badge: "bg-amber-500"   },
    rose:    { outer: "bg-rose-50 border-rose-200",       title: "text-rose-700",     badge: "bg-rose-500"     },
  }[result.recommendation_color] : null;

  const step1Done = !!selectedUni;
  const step2Done = !!selectedProgram;

  return (
    <section id="parent-decision-tool" className="py-24 px-6 bg-gradient-to-br from-slate-50 via-white to-purple-50/40">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold mb-4">
            <Users className="w-3.5 h-3.5" /> FOR PARENTS
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">Parent Decision Tool</h2>
          <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
            Select the university and program — all costs auto-fill from our database. Get a clear, data-driven verdict in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Input panel ── */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-6">

            {/* Step 1 — University */}
            <div>
              <StepLabel n={1} label="University" done={step1Done} />
              <div ref={uniRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text" value={query}
                    placeholder="Type to search universities…"
                    onChange={(e) => { setQuery(e.target.value); setShowSugg(true); if (!e.target.value.trim()) { setSelectedUni(null); setSelectedProgram(null); } }}
                    onFocus={() => { if (query.length >= 2) setShowSugg(true); }}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400"
                  />
                </div>
                {!selectedUni && !query && (
                  <p className="text-[11px] text-gray-400 mt-1.5">e.g. "Toronto", "Melbourne", "Oxford"</p>
                )}
                <AnimatePresence>
                  {showSugg && suggestions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                      className="absolute z-30 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-56 overflow-y-auto"
                    >
                      {suggestions.map((u) => (
                        <button key={u.name} onMouseDown={() => selectUniversity(u)}
                          className="w-full text-left px-4 py-2.5 hover:bg-purple-50 flex items-center gap-3 transition-colors"
                        >
                          <span className="text-lg flex-shrink-0">{u.flag}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                            <p className="text-xs text-gray-400">{u.country}{u.qs_ranking ? ` · QS #${u.qs_ranking}` : ""}</p>
                          </div>
                          {u.qs_ranking && u.qs_ranking <= 100 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold flex-shrink-0">Top 100</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* University confirm card */}
              <AnimatePresence>
                {selectedUni && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-2 flex items-center gap-3 px-3.5 py-2.5 bg-purple-50 border border-purple-100 rounded-xl"
                  >
                    <span className="text-xl">{selectedUni.flag}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-800 truncate">{selectedUni.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {selectedUni.country}{selectedUni.qs_ranking ? ` · QS #${selectedUni.qs_ranking}` : ""}
                        {uniPrograms.length > 0 ? ` · ${uniPrograms.length} programs` : ""}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Step 2 — Program */}
            <AnimatePresence>
              {step1Done && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <StepLabel n={2} label="Program / Degree" done={step2Done} />
                  <div ref={programRef} className="relative">
                    <button onClick={() => setProgramOpen((o) => !o)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                        selectedProgram ? "border-gray-200 text-gray-800" : "border-gray-200 text-gray-400"
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <GraduationCap className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{selectedProgram?.program_name || "Select a program…"}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${programOpen ? "rotate-180" : ""}`} />
                    </button>
                    {!selectedProgram && uniPrograms.length > 0 && (
                      <p className="text-[11px] text-gray-400 mt-1.5">{uniPrograms.length} programs available at {selectedUni?.name.split(" ")[0]}</p>
                    )}
                    <AnimatePresence>
                      {programOpen && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                          className="absolute z-30 top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-64 overflow-y-auto"
                        >
                          {uniPrograms.map((p, i) => (
                            <button key={i} onMouseDown={() => selectProgram(p)}
                              className={`w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 last:border-0 ${selectedProgram?.program_name === p.program_name ? "bg-purple-50" : ""}`}
                            >
                              <p className="text-sm font-semibold text-gray-800 leading-tight">{p.program_name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{p.degree_level} · {p.duration_months} mo · {fmtK(p.annual_tuition_usd)}/yr</p>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auto-filled fields — shown once program selected */}
            <AnimatePresence>
              {step2Done && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-purple-400" /> Auto-filled from database
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <AutoFilledCard icon={MapPin}        label="Location"    value={city || selectedUni?.country || "—"} />
                    <AutoFilledCard icon={GraduationCap} label="Duration"    value={`${durationMonths} months`} sub={`${(durationMonths / 12).toFixed(1)} years`} />
                    <AutoFilledCard icon={DollarSign}    label="Tuition/yr"  value={fmtK(annualTuition)} sub="Annual fee" />
                    <AutoFilledCard icon={DollarSign}    label="Living/yr"   value={fmtK(livingCost)} sub="Avg cost of living" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step 3 — Scholarship + Budget */}
            <AnimatePresence>
              {step2Done && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                  <StepLabel n={3} label="Scholarship & Budget" done={scholarship >= 0 && budgetUsd > 0} />

                  {/* Scholarship chips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scholarship Received</label>
                      <span className="text-xs font-bold text-purple-600">{scholarship === 0 ? "None" : fmtK(scholarship)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {SCHOLARSHIP_OPTIONS.map((v) => (
                        <button key={v} onClick={() => setScholarship(v)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${scholarship === v ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-purple-50"}`}
                        >
                          {v === 0 ? "None" : `$${v / 1000}K`}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">Include any merit award, government scholarship, or university grant</p>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Annual Budget (Parent&apos;s capacity)</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {BUDGET_OPTIONS.map((b) => (
                        <button key={b.value} onClick={() => setBudgetUsd(b.value)}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            budgetUsd === b.value ? "bg-purple-600 text-white border-purple-600" : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                    <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-indigo-700 leading-snug">Results update automatically as you adjust scholarship and budget.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Results panel ── */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="h-full min-h-[480px] bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-10 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">Your verdict appears here</h3>
                  <p className="text-gray-400 text-sm max-w-xs mb-8">
                    Select a university and program on the left — results appear automatically.
                  </p>
                  {/* Progress steps */}
                  <div className="flex items-center gap-3">
                    {[{ label: "University", done: step1Done }, { label: "Program", done: step2Done }].map((s, i) => (
                      <div key={i} className="flex items-center gap-2">
                        {i > 0 && <div className={`w-8 h-px ${step1Done ? "bg-purple-300" : "bg-gray-200"}`} />}
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${s.done ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                          {s.done ? <CheckCircle2 className="w-3 h-3" /> : <span>{i + 1}</span>}
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">

                  {/* Recommendation banner */}
                  <div className={`rounded-3xl border p-6 ${recStyle!.outer}`}>
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recommendation</p>
                        <p className={`text-3xl font-extrabold ${recStyle!.title}`}>
                          {result.recommendation_icon} {result.recommendation}
                        </p>
                        <p className="text-sm text-gray-500 mt-1.5">
                          <span className="font-bold text-gray-700">{selectedUni!.name}</span>
                          {selectedProgram && <span className="text-gray-400"> · {selectedProgram.program_name}</span>}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          Overall score: <span className="font-bold text-gray-700">{result.total_pct}/100</span>
                        </p>
                      </div>
                      <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center ${recStyle!.badge} text-white flex-shrink-0`}>
                        <span className="text-2xl font-extrabold leading-none">{result.total_pct}</span>
                        <span className="text-[10px] font-semibold opacity-90">/ 100</span>
                      </div>
                    </div>

                    {/* Score breakdown bars */}
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                      {[
                        { label: "Budget Fit",      score: result.budget_fit_score,    max: 20 },
                        { label: "QS Ranking",      score: result.ranking_score,       max: 15 },
                        { label: "Post-Study Work", score: result.psw_score,           max: 15 },
                        { label: "Job Market",      score: result.job_market_score,    max: 15 },
                        { label: "Financial ROI",   score: result.financial_roi_score, max: 15 },
                        { label: "Safety",          score: result.safety_score,        max: 10 },
                        { label: "Student Life",    score: result.student_life_score,  max: 10 },
                      ].map(({ label, score, max }) => (
                        <ScoreBar key={label} label={label} score={score} max={max}
                          color={score / max >= 0.8 ? "bg-emerald-500" : score / max >= 0.55 ? "bg-amber-400" : "bg-rose-400"}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Metrics grid */}
                  <div className="grid sm:grid-cols-2 gap-4">

                    {/* Financial */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Financials</p>
                      <MetricRow icon={DollarSign} iconColor="text-indigo-500"
                        label="Tuition Fee (total)" value={fmtK(result.total_tuition_usd)}
                        sub={`${fmtK(annualTuition)}/yr × ${(durationMonths / 12).toFixed(1)} years`}
                      />
                      <MetricRow icon={DollarSign} iconColor="text-blue-500"
                        label="Living Expenses (total)" value={fmtK(result.total_living_usd)}
                        sub={`${fmtK(livingCost)}/yr × ${(durationMonths / 12).toFixed(1)} years`}
                      />
                      <MetricRow icon={DollarSign} iconColor="text-gray-500"
                        label="Total Cost of Degree" value={fmtK(result.total_cost_usd)}
                        sub="Tuition + living for full program duration"
                      />
                      <MetricRow icon={DollarSign} iconColor="text-emerald-500"
                        label="Net Cost (after scholarship)" value={fmtK(result.net_cost_usd)}
                        sub={result.net_cost_usd < result.total_cost_usd ? `Scholarship saves ${fmtK(result.total_cost_usd - result.net_cost_usd)}` : "No scholarship applied"}
                      />
                      <MetricRow icon={TrendingUp} iconColor="text-purple-500"
                        label="Potential Starting Salary" value={`${fmtK(result.expected_salary_usd)}/yr`}
                        sub={`Based on grad salary trends in ${selectedUni!.country}`}
                      />
                      <MetricRow
                        icon={Globe2}
                        iconColor={result.payback_years <= 5 ? "text-emerald-500" : result.payback_years <= 10 ? "text-amber-500" : "text-rose-500"}
                        label="Payback Period" value={fmtYears(result.payback_years)}
                        sub="Time to recover investment at 30% savings rate"
                      />
                      <MetricRow
                        icon={result.roi_positive ? CheckCircle2 : XCircle}
                        iconColor={result.roi_positive ? "text-emerald-500" : "text-rose-500"}
                        label="ROI Positive?"
                        value={result.roi_positive ? "Yes — 10-yr earnings exceed cost" : "No — cost outweighs 10-yr earnings"}
                      />
                    </div>

                    {/* Qualitative */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Destination & Career</p>
                      <MetricRow icon={MapPin} iconColor="text-gray-500"
                        label="Location" value={city || selectedUni!.country}
                      />
                      <MetricRow icon={Star} iconColor="text-amber-500"
                        label="QS World Ranking"
                        value={selectedUni!.qs_ranking ? `#${selectedUni!.qs_ranking} globally` : "Specialist / Unranked"}
                      />
                      <MetricRow icon={ShieldCheck} iconColor={result.psw_available ? "text-emerald-500" : "text-rose-500"}
                        label="Post-Study Work Rights"
                        value={
                          <span className={`font-bold ${result.psw_available ? "text-emerald-600" : "text-rose-600"}`}>
                            {result.psw_available ? `Yes — ${result.psw_duration}` : "Not available"}
                          </span>
                        }
                        sub={result.psw_note}
                      />
                      <MetricRow icon={Briefcase} iconColor="text-blue-500"
                        label="Job Market" value={<RatingBadge rating={result.job_market_rating} />}
                        sub={result.job_market_detail}
                      />
                      <MetricRow icon={ShieldCheck} iconColor="text-teal-500"
                        label="Safety & Security" value={<RatingBadge rating={result.safety_rating} />}
                        sub={result.safety_detail}
                      />
                      <MetricRow icon={Heart} iconColor="text-pink-500"
                        label="Quality of Student Life" value={<RatingBadge rating={result.student_life_rating} />}
                        sub={result.student_life_detail}
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-white font-bold text-base">Ready to take the next step?</p>
                      <p className="text-indigo-200 text-sm mt-0.5">Get a personalised shortlist for your child in minutes.</p>
                    </div>
                    <Link href="/profile"
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

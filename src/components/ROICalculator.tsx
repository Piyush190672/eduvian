"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, GraduationCap, MapPin, Sparkles, Info, ArrowRight,
  ChevronDown, Search, CheckCircle2, Zap, BookOpen, DollarSign,
  FileDown, Mail, Send, X,
} from "lucide-react";
import { CURATED_UNIVERSITIES, SALARY_LOOKUP } from "@/data/roi-data";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { calculateROI, lookupSalary } from "@/lib/roi-calculator";
import { PROGRAMS } from "@/data/programs";
import { DB_STATS } from "@/data/db-stats";
import { formatCurrency } from "@/lib/utils";

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

const ALL_PROGRAMS = PROGRAMS as unknown as ProgramEntry[];

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtK(n: number | null | undefined) {
  if (n == null || !isFinite(n) || n === 0) return "—";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

function fmtYears(y: number) {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

function paybackColor(years: number) {
  if (!isFinite(years) || years > 15) return { text: "text-rose-400", bg: "bg-rose-500/10", bar: "bg-rose-400", label: "Long payback" };
  if (years > 8) return { text: "text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-400", label: "Moderate return" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500", label: "Excellent return ✓" };
}

// Salary range hint for a given country + field
function salaryHint(country: SalaryCountry, field: FieldOfStudy): string {
  const s = SALARY_LOOKUP[country]?.[field];
  if (!s) return "";
  const low = Math.round(s * 0.85 / 1000);
  const high = Math.round(s * 1.15 / 1000);
  return `Typical range: $${low}K–$${high}K/yr in ${country}`;
}

// ── AutoTag — shown on auto-populated fields ──────────────────────────────────

function AutoTag() {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
      <Zap className="w-2.5 h-2.5" /> auto
    </span>
  );
}

// ── StepLabel ─────────────────────────────────────────────────────────────────

function StepLabel({ n, label, done }: { n: number; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 transition-colors ${done ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"}`}>
        {done ? <CheckCircle2 className="w-3 h-3" /> : n}
      </div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ── AutoFilledRow — read-only populated field ─────────────────────────────────

function AutoFilledRow({
  icon: Icon, label, value, sub,
}: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
      <Icon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wide leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white truncate">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 leading-snug">{sub}</p>}
      </div>
      <AutoTag />
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ROICalculator() {

  // ── Step 1: University ───────────────────────────────────────────────────────
  const [uniQuery, setUniQuery]     = useState("");
  const [matchedUni, setMatchedUni] = useState<typeof CURATED_UNIVERSITIES[number] | null>(null);
  const [showSugg, setShowSugg]     = useState(false);
  const uniRef = useRef<HTMLDivElement>(null);

  // ── Step 2: Field of Study ───────────────────────────────────────────────────
  const [field, setField]         = useState<FieldOfStudy | "">("");
  const [fieldOpen, setFieldOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement>(null);

  // ── Step 3: Program ──────────────────────────────────────────────────────────
  const [selectedProgram, setSelectedProgram] = useState<ProgramEntry | null>(null);
  const [programOpen, setProgramOpen]         = useState(false);
  const programRef = useRef<HTMLDivElement>(null);

  // ── Auto-populated fields (user can adjust) ──────────────────────────────────
  const [city, setCity]               = useState("");
  const [tuition, setTuition]         = useState(0);
  const [living, setLiving]           = useState(0);
  const [durationMonths, setDuration] = useState(24);
  const [scholarship, setScholarship] = useState(0);
  const [salary, setSalary]           = useState(0);
  const [savingsRate, setSavingsRate] = useState(20);

  // ── Close on outside click ───────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) setShowSugg(false);
      if (fieldRef.current && !fieldRef.current.contains(e.target as Node)) setFieldOpen(false);
      if (programRef.current && !programRef.current.contains(e.target as Node)) setProgramOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // ── Typeahead suggestions ────────────────────────────────────────────────────
  const suggestions = useMemo(() => {
    const q = uniQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    return CURATED_UNIVERSITIES
      .filter((u) => u.name.toLowerCase().includes(q) || u.country.toLowerCase().includes(q))
      .slice(0, 7);
  }, [uniQuery]);

  // ── All programs for selected university ─────────────────────────────────────
  const uniPrograms = useMemo(() => {
    if (!matchedUni) return [];
    return ALL_PROGRAMS.filter((p) => p.university_name === matchedUni.name);
  }, [matchedUni]);

  // ── Fields available at this university ──────────────────────────────────────
  const availableFields = useMemo<FieldOfStudy[]>(() => {
    if (!matchedUni) return [];
    const set = new Set(uniPrograms.map((p) => p.field_of_study as FieldOfStudy));
    return Array.from(set).sort();
  }, [matchedUni, uniPrograms]);

  // ── Programs filtered by field ────────────────────────────────────────────────
  const filteredPrograms = useMemo(() => {
    if (!field) return uniPrograms;
    return uniPrograms.filter((p) => p.field_of_study === field);
  }, [uniPrograms, field]);

  // ── Select university ────────────────────────────────────────────────────────
  function selectUniversity(u: typeof CURATED_UNIVERSITIES[number]) {
    setMatchedUni(u);
    setUniQuery(u.name);
    setShowSugg(false);
    setField("");
    setSelectedProgram(null);
    setCity(""); setTuition(0); setLiving(0); setDuration(24); setSalary(0);
  }

  // ── Select field → filter programs, update salary estimate ──────────────────
  function selectField(f: FieldOfStudy) {
    setField(f);
    setFieldOpen(false);
    setSelectedProgram(null);
    if (matchedUni) setSalary(lookupSalary(matchedUni.country as SalaryCountry, f, matchedUni.qs_ranking, matchedUni.name));
  }

  // ── Select program → auto-fill everything ────────────────────────────────────
  function selectProgram(p: ProgramEntry) {
    setSelectedProgram(p);
    setProgramOpen(false);
    setCity(p.city || "");
    setTuition(p.annual_tuition_usd);
    setLiving(p.avg_living_cost_usd);
    setDuration(p.duration_months);
    if (matchedUni) setSalary(lookupSalary(matchedUni.country as SalaryCountry, p.field_of_study as FieldOfStudy, matchedUni.qs_ranking, matchedUni.name));
  }

  // ── ROI calculation ───────────────────────────────────────────────────────────
  const canCalculate = selectedProgram !== null && salary > 0;

  const results = useMemo(() => {
    if (!canCalculate) return null;
    return calculateROI({
      university_name:     matchedUni?.name ?? "",
      country:             (matchedUni?.country as SalaryCountry) ?? "USA",
      city,
      field_of_study:      (field || "Computer Science & IT") as FieldOfStudy,
      annual_tuition_usd:  tuition,
      avg_living_cost_usd: living,
      duration_months:     durationMonths,
      scholarship_usd:     scholarship,
      expected_salary_usd: salary,
      savings_rate_pct:    savingsRate,
    });
  }, [canCalculate, matchedUni, city, field, tuition, living, durationMonths, scholarship, salary, savingsRate]);

  const pb = results ? paybackColor(results.payback_years) : null;
  const durationYears = durationMonths / 12;

  // ── Export state ─────────────────────────────────────────────────────────────
  const [pdfLoading, setPdfLoading]     = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailInput, setEmailInput]     = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent]       = useState(false);
  const [emailError, setEmailError]     = useState<string | null>(null);

  function buildExportData() {
    return {
      university_name:     matchedUni?.name ?? "",
      flag:                matchedUni?.flag ?? "🎓",
      country:             matchedUni?.country ?? "",
      city,
      program_name:        selectedProgram?.program_name ?? "",
      degree_level:        selectedProgram?.degree_level ?? "",
      field:               (field || "").toString(),
      qs_ranking:          matchedUni?.qs_ranking,
      duration_months:     durationMonths,
      scholarship_usd:     scholarship,
      savings_rate_pct:    savingsRate,
      expected_salary_usd: salary,
      annual_tuition_usd:  tuition,
      avg_living_cost_usd: living,
      total_tuition_usd:       results!.total_tuition_usd,
      total_living_usd:        results!.total_living_usd,
      total_investment_usd:    results!.total_investment_usd,
      monthly_budget_usd:      results!.monthly_budget_usd,
      monthly_savings_usd:     results!.monthly_savings_usd,
      payback_years:           results!.payback_years,
      ten_year_roi_pct:        results!.ten_year_roi_pct,
      breakeven_salary_usd:    results!.breakeven_salary_usd,
      net_earnings_10yr_usd:   results!.net_earnings_10yr_usd,
    };
  }

  function handleDownloadPDF() {
    if (!results) return;
    const win = window.open("", "_blank");
    if (!win) return;
    setPdfLoading(true);
    fetch("/api/pdf/tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "roi", data: buildExportData() }),
    })
      .then((r) => r.text())
      .then((html) => { win.document.write(html); win.document.close(); })
      .catch(() => { win.close(); })
      .finally(() => setPdfLoading(false));
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!results || !emailInput.trim()) return;
    setEmailLoading(true);
    setEmailError(null);
    try {
      const res = await fetch("/api/email/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "roi", email: emailInput.trim(), data: buildExportData() }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to send");
      setEmailSent(true);
      setTimeout(() => { setEmailSent(false); setShowEmailForm(false); setEmailInput(""); }, 3000);
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setEmailLoading(false);
    }
  }

  // ── progress ──────────────────────────────────────────────────────────────────
  const step1Done = !!matchedUni;
  const step2Done = !!field;
  const step3Done = !!selectedProgram;

  const scholarshipOptions = [0, 5000, 10000, 15000, 20000, 30000, 50000];

  return (
    <section id="roi-calculator" className="py-24 px-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-indigo-400 font-bold text-sm uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" /> ROI Calculator
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">Is your degree worth it?</h2>
          <p className="text-slate-400 mt-3 text-lg max-w-xl mx-auto">
            3 steps — university, field, program. Everything else fills itself.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Left: Guided input panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-6"
          >

            {/* ── STEP 1: University ── */}
            <div>
              <StepLabel n={1} label="University" done={step1Done} />
              <div ref={uniRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={uniQuery}
                    placeholder="Type to search universities…"
                    onChange={(e) => {
                      setUniQuery(e.target.value);
                      setShowSugg(true);
                      if (!e.target.value.trim()) { setMatchedUni(null); setField(""); setSelectedProgram(null); }
                    }}
                    onFocus={() => { if (uniQuery.length >= 2) setShowSugg(true); }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-3.5 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {!matchedUni && !uniQuery && (
                  <p className="text-[11px] text-slate-500 mt-1.5">e.g. "Toronto", "MIT", "Melbourne"</p>
                )}
                <AnimatePresence>
                  {showSugg && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                      className="absolute z-50 mt-1 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                    >
                      {suggestions.map((u) => (
                        <button key={u.name} onMouseDown={() => selectUniversity(u)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
                        >
                          <span className="text-lg flex-shrink-0">{u.flag}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                            <p className="text-xs text-slate-400">{u.country}{u.qs_ranking ? ` · QS #${u.qs_ranking}` : " · Specialist"}</p>
                          </div>
                          {u.qs_ranking && u.qs_ranking <= 100 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold flex-shrink-0">Top 100</span>
                          )}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* University info card once selected */}
              <AnimatePresence>
                {matchedUni && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="mt-2 flex items-center gap-3 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <span className="text-2xl">{matchedUni.flag}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{matchedUni.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {matchedUni.country}{matchedUni.qs_ranking ? ` · QS Rank #${matchedUni.qs_ranking}` : ""}
                        {uniPrograms.length > 0 ? ` · ${uniPrograms.length} programs` : ""}
                      </p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 ml-auto" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── STEP 2: Field of Study ── */}
            <AnimatePresence>
              {step1Done && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <StepLabel n={2} label="Field of Study" done={step2Done} />
                  <div ref={fieldRef} className="relative">
                    <button
                      onClick={() => setFieldOpen((o) => !o)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors text-left ${
                        field ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/15 text-slate-400"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        {field || "Select your field of study…"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${fieldOpen ? "rotate-180" : ""}`} />
                    </button>
                    {!field && (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {availableFields.length} fields available at {matchedUni?.name.split(" ")[0]}
                      </p>
                    )}
                    <AnimatePresence>
                      {fieldOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                          className="absolute z-40 mt-1 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto"
                        >
                          {availableFields.map((f) => {
                            const count = uniPrograms.filter((p) => p.field_of_study === f).length;
                            return (
                              <button key={f} onMouseDown={() => selectField(f)}
                                className={`w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/10 transition-colors text-left ${field === f ? "bg-indigo-600/30" : ""}`}
                              >
                                <span className="text-sm text-white">{f}</span>
                                <span className="text-xs text-slate-500 flex-shrink-0 ml-2">{count} program{count !== 1 ? "s" : ""}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Salary range hint for chosen field */}
                  {field && matchedUni && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-indigo-300/70 mt-1.5 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {salaryHint(matchedUni.country as SalaryCountry, field)}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── STEP 3: Program ── */}
            <AnimatePresence>
              {step2Done && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <StepLabel n={3} label="Program / Degree" done={step3Done} />
                  <div ref={programRef} className="relative">
                    <button
                      onClick={() => setProgramOpen((o) => !o)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-colors text-left ${
                        selectedProgram ? "bg-white/10 border-white/20 text-white" : "bg-white/5 border-white/15 text-slate-400"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span className="truncate">{selectedProgram?.program_name || "Select program…"}</span>
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ml-2 ${programOpen ? "rotate-180" : ""}`} />
                    </button>
                    {!selectedProgram && (
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        {filteredPrograms.length} {field} program{filteredPrograms.length !== 1 ? "s" : ""} available
                      </p>
                    )}
                    <AnimatePresence>
                      {programOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.12 }}
                          className="absolute z-40 mt-1 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                        >
                          {filteredPrograms.map((p, i) => (
                            <button key={i} onMouseDown={() => selectProgram(p)}
                              className={`w-full flex flex-col px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0 ${selectedProgram?.program_name === p.program_name ? "bg-indigo-600/30" : ""}`}
                            >
                              <span className="text-sm font-semibold text-white leading-tight">{p.program_name}</span>
                              <span className="text-xs text-slate-400 mt-0.5">
                                {p.degree_level} · {p.duration_months} mo · {p.annual_tuition_usd ? `${fmtK(p.annual_tuition_usd)}/yr tuition` : "fee unavailable"}
                              </span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Auto-populated fields (shown once program selected) ── */}
            <AnimatePresence>
              {step3Done && selectedProgram && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2.5">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-indigo-400" /> Auto-filled from database
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <AutoFilledRow icon={MapPin} label="Location" value={city || matchedUni?.country || "—"} />
                    <AutoFilledRow icon={GraduationCap} label="Duration" value={`${durationMonths} months`} sub={`${durationYears.toFixed(1)} academic years`} />
                    <AutoFilledRow icon={DollarSign} label="Tuition / yr" value={formatCurrency(tuition)} sub="Annual fee" />
                    <AutoFilledRow icon={DollarSign} label="Living / yr" value={formatCurrency(living)} sub="Avg cost of living" />
                  </div>

                  {/* Salary — editable */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Expected Salary / yr</label>
                      <AutoTag />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <input type="number" value={salary || ""} placeholder="0"
                        onChange={(e) => setSalary(Number(e.target.value))}
                        className="w-full bg-white/10 border border-indigo-500/30 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield]"
                      />
                    </div>
                    <p className="text-[11px] text-indigo-300/70 mt-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {field && matchedUni ? salaryHint(matchedUni.country as SalaryCountry, field as FieldOfStudy) : "Adjust to match your expectations"}
                    </p>
                  </div>

                  {/* Scholarship */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Scholarship / Grant (USD)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {scholarshipOptions.map((v) => (
                        <button key={v} onClick={() => setScholarship(v)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${scholarship === v ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}
                        >
                          {v === 0 ? "None" : `$${v / 1000}K`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Savings rate */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Savings Rate</label>
                      <span className="text-sm font-bold text-indigo-400">{savingsRate}%</span>
                    </div>
                    <input type="range" min={5} max={50} step={5} value={savingsRate}
                      onChange={(e) => setSavingsRate(Number(e.target.value))}
                      className="w-full h-1.5 accent-indigo-500 cursor-pointer rounded-full"
                    />
                    <div className="flex justify-between text-[10px] text-slate-600 mt-0.5">
                      <span>5% conservative</span><span>50% aggressive</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Right: Results ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="lg:col-span-3 space-y-4"
          >
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center py-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl text-center px-8 min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-5">
                  <TrendingUp className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Your ROI appears here</p>
                <p className="text-slate-400 text-sm max-w-xs mb-8">
                  Complete the 3 steps on the left — university, field, and program — and we&apos;ll calculate your full financial picture.
                </p>
                {/* Progress indicator */}
                <div className="flex items-center gap-3">
                  {[
                    { label: "University", done: step1Done },
                    { label: "Field", done: step2Done },
                    { label: "Program", done: step3Done },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <div className={`w-8 h-px ${s.done || (i === 1 && step1Done) ? "bg-indigo-500" : "bg-white/10"}`} />}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${s.done ? "bg-indigo-500 text-white" : step1Done && i === 1 ? "bg-white/10 text-white" : step2Done && i === 2 ? "bg-white/10 text-white" : "bg-white/5 text-slate-500"}`}>
                        {s.done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">{i + 1}</span>}
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${tuition}-${living}-${salary}-${savingsRate}-${durationMonths}-${scholarship}`}
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Header */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{matchedUni?.flag ?? "🎓"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white truncate">{matchedUni?.name}</p>
                      <p className="text-xs text-slate-400">
                        {selectedProgram?.program_name} · {city || matchedUni?.country}
                        {matchedUni?.qs_ranking ? ` · QS #${matchedUni.qs_ranking}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Total investment + Payback */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Investment</p>
                      <p className="text-3xl font-black text-white">{formatCurrency(results.total_investment_usd)}</p>
                      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Tuition ({durationYears.toFixed(1)} yr)</span>
                          <span className="text-white font-medium">{formatCurrency(results.total_tuition_usd)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Living costs</span>
                          <span className="text-white font-medium">{formatCurrency(results.total_living_usd)}</span>
                        </div>
                        {scholarship > 0 && (
                          <div className="flex justify-between text-emerald-400 font-semibold">
                            <span>Scholarship saving</span>
                            <span>−{formatCurrency(scholarship)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-white/10 pt-1.5">
                          <span className="font-semibold text-slate-300">Net cost</span>
                          <span className="text-white font-bold">{formatCurrency(results.total_investment_usd)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`border border-white/10 rounded-2xl p-5 ${pb!.bg}`}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Payback Period</p>
                      <p className={`text-3xl font-black ${pb!.text}`}>{fmtYears(results.payback_years)}</p>
                      <p className="text-xs text-slate-400 mt-1">At {savingsRate}% savings on {fmtK(salary)}/yr</p>
                      <div className="mt-3 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <motion.div className={`h-full rounded-full ${pb!.bar}`} initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (results.payback_years / 20) * 100)}%` }} transition={{ duration: 0.8 }} />
                      </div>
                      <p className={`text-xs font-semibold mt-1.5 ${pb!.text}`}>{pb!.label}</p>
                    </div>
                  </div>

                  {/* 4-up */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "10-Year ROI", value: `${results.ten_year_roi_pct > 0 ? "+" : ""}${Math.round(results.ten_year_roi_pct)}%`, color: results.ten_year_roi_pct >= 0 ? "text-emerald-400" : "text-rose-400" },
                      { label: "Monthly Budget", value: fmtK(results.monthly_budget_usd), sub: "during study", color: "text-white" },
                      { label: "Monthly Savings", value: fmtK(results.monthly_savings_usd), sub: "post-grad", color: "text-indigo-400" },
                      { label: "10-yr Net Gain", value: `${results.net_earnings_10yr_usd >= 0 ? "+" : ""}${fmtK(results.net_earnings_10yr_usd)}`, color: results.net_earnings_10yr_usd >= 0 ? "text-emerald-400" : "text-rose-400" },
                    ].map((m) => (
                      <div key={m.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                        <p className="text-xs text-slate-400 mb-1">{m.label}</p>
                        <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                        {m.sub && <p className="text-[10px] text-slate-500">{m.sub}</p>}
                      </div>
                    ))}
                  </div>

                  {/* Break-even insight */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white mb-1">Break-even Salary</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          You need at least <span className="text-white font-bold">{formatCurrency(results.breakeven_salary_usd)}/yr</span> (at {savingsRate}% savings) to recover your investment in 5 years.{" "}
                          {salary >= results.breakeven_salary_usd
                            ? <span className="text-emerald-400 font-semibold">✓ Your expected salary clears this.</span>
                            : <span className="text-amber-400 font-semibold">⚠ Gap of {formatCurrency(results.breakeven_salary_usd - salary)}/yr — consider scholarships.</span>}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-white">{formatCurrency(results.breakeven_salary_usd)}</p>
                        <p className="text-[10px] text-slate-500">min/yr needed</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Export bar ── */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                      <FileDown className="w-3.5 h-3.5 text-indigo-400" /> Save or Share Results
                    </p>
                    <div className="flex flex-wrap gap-2.5">
                      {/* PDF button */}
                      <button
                        onClick={handleDownloadPDF}
                        disabled={pdfLoading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold hover:bg-indigo-500/30 transition-all disabled:opacity-50"
                      >
                        {pdfLoading
                          ? <><span className="w-3.5 h-3.5 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" /> Generating…</>
                          : <><FileDown className="w-3.5 h-3.5" /> Download PDF</>}
                      </button>

                      {/* Email button */}
                      {!showEmailForm ? (
                        <button
                          onClick={() => { setShowEmailForm(true); setEmailSent(false); setEmailError(null); }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-semibold hover:bg-violet-500/30 transition-all"
                        >
                          <Mail className="w-3.5 h-3.5" /> Email Results
                        </button>
                      ) : emailSent ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-sm font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sent!
                        </div>
                      ) : (
                        <form onSubmit={handleSendEmail} className="flex items-center gap-2 flex-1 min-w-0">
                          <input
                            type="email"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="your@email.com"
                            required
                            autoFocus
                            className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                          />
                          <button type="submit" disabled={emailLoading}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-600 transition-all disabled:opacity-50 flex-shrink-0"
                          >
                            {emailLoading
                              ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              : <Send className="w-3.5 h-3.5" />}
                          </button>
                          <button type="button" onClick={() => { setShowEmailForm(false); setEmailError(null); }}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                    {emailError && <p className="mt-2 text-xs text-rose-400">{emailError}</p>}
                  </div>

                  {/* CTA */}
                  <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">Find programs that maximise your ROI</p>
                      <p className="text-xs text-slate-400 mt-0.5">Our AI matching engine ranks {DB_STATS.programsLabel} programs by fit and financial return.</p>
                    </div>
                    <a href="/get-started" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0">
                      Get My Matches <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Visa Coach deep-link with pre-filled budget + country */}
                  <div className="bg-gradient-to-r from-sky-600/20 to-cyan-600/20 border border-cyan-500/30 rounded-2xl p-5 flex items-center justify-between gap-4 mt-3">
                    <div>
                      <p className="font-bold text-white text-sm">🛂 Check your visa readiness</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Open the Visa Coach pre-filled with your{matchedUni?.country ? ` ${matchedUni.country}` : ""} checklist
                        {results ? ` and your $${Math.round((results.total_investment_usd || 0) / Math.max(1, durationYears)).toLocaleString()} / year funding pool` : ""}.
                      </p>
                    </div>
                    <a
                      href={`/visa-coach?${[
                        matchedUni?.country ? `country=${encodeURIComponent(matchedUni.country)}` : "",
                        results ? `funding=${Math.round((results.total_investment_usd || 0) / Math.max(1, durationYears))}` : "",
                      ].filter(Boolean).join("&")}`}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-bold hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0"
                    >
                      Open Visa Coach <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Salary estimates are median figures from publicly available graduate salary surveys. Tuition and living costs are from eduvianAI&apos;s verified program database. All amounts in USD.
        </p>
      </div>
    </section>
  );
}

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, GraduationCap, MapPin, Sparkles, Info, ArrowRight, ChevronDown,
} from "lucide-react";
import { CURATED_UNIVERSITIES, SALARY_LOOKUP } from "@/data/roi-data";
import type { SalaryCountry, FieldOfStudy } from "@/data/roi-data";
import { calculateROI, lookupSalary } from "@/lib/roi-calculator";
import { PROGRAMS } from "@/data/programs";
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

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtK(n: number) {
  if (!isFinite(n)) return "—";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;
}

function fmtYears(y: number) {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

function paybackColor(years: number) {
  if (!isFinite(years) || years > 15) return { text: "text-rose-400", bg: "bg-rose-500/10", bar: "bg-rose-400" };
  if (years > 8) return { text: "text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-400" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/10", bar: "bg-emerald-500" };
}

// ── sub-components ────────────────────────────────────────────────────────────

function SelectField({
  label, value, options, onChange, note,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
  note?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
        {label}
        {note && <span className="ml-1.5 normal-case font-normal text-indigo-400">{note}</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9"
          style={{ colorScheme: "dark" }}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-slate-800 text-white">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ROICalculator() {
  // Only user-typed field
  const [uniQuery, setUniQuery] = useState("");

  // Auto-matched university
  const [matchedUni, setMatchedUni] = useState<typeof CURATED_UNIVERSITIES[number] | null>(null);

  // Program select (dropdown of matched uni's programs)
  const [selectedProgram, setSelectedProgram] = useState<ProgramEntry | null>(null);

  // Auto-populated / selectable fields
  const [field, setField]             = useState<FieldOfStudy>("Computer Science & IT");
  const [city, setCity]               = useState("");
  const [tuition, setTuition]         = useState(0);
  const [living, setLiving]           = useState(0);
  const [durationMonths, setDuration] = useState(24);
  const [scholarship, setScholarship] = useState(0);
  const [salary, setSalary]           = useState(0);
  const [savingsRate, setSavingsRate] = useState(20);

  // Suggestion dropdown for institution
  const [showSuggestions, setShowSuggestions] = useState(false);
  const uniRef = useRef<HTMLDivElement>(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (uniRef.current && !uniRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filtered suggestions as user types
  const suggestions = useMemo(() => {
    const q = uniQuery.toLowerCase().trim();
    if (q.length < 2) return [];
    return CURATED_UNIVERSITIES.filter(
      (u) => u.name.toLowerCase().includes(q) || u.country.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [uniQuery]);

  // Programs for matched uni
  const uniPrograms = useMemo(() => {
    if (!matchedUni) return [];
    return ALL_PROGRAMS.filter((p) => p.university_name === matchedUni.name).slice(0, 40);
  }, [matchedUni]);

  // When user selects a suggestion
  function selectUniversity(u: typeof CURATED_UNIVERSITIES[number]) {
    setMatchedUni(u);
    setUniQuery(u.name);
    setShowSuggestions(false);
    setSelectedProgram(null);
    // Auto-fill from first program or defaults
    const progs = ALL_PROGRAMS.filter((p) => p.university_name === u.name);
    if (progs.length > 0) {
      const p = progs[0];
      setCity(p.city || "");
      const f = p.field_of_study as FieldOfStudy;
      setField(FIELDS_OF_STUDY.includes(f) ? f : "Computer Science & IT");
      setTuition(p.annual_tuition_usd);
      setLiving(p.avg_living_cost_usd);
      setDuration(p.duration_months);
      setSalary(lookupSalary(u.country as SalaryCountry, FIELDS_OF_STUDY.includes(f) ? f : "Computer Science & IT"));
    } else {
      setSalary(lookupSalary(u.country as SalaryCountry, field));
    }
  }

  // When user picks a program from dropdown
  function selectProgram(p: ProgramEntry) {
    setSelectedProgram(p);
    setCity(p.city || city);
    const f = p.field_of_study as FieldOfStudy;
    const resolvedField = FIELDS_OF_STUDY.includes(f) ? f : field;
    setField(resolvedField);
    setTuition(p.annual_tuition_usd);
    setLiving(p.avg_living_cost_usd);
    setDuration(p.duration_months);
    if (matchedUni) setSalary(lookupSalary(matchedUni.country as SalaryCountry, resolvedField));
  }

  // Recalculate salary when field changes
  useEffect(() => {
    if (!matchedUni) return;
    setSalary(lookupSalary(matchedUni.country as SalaryCountry, field));
  }, [field, matchedUni]);

  const canCalculate = tuition > 0 || living > 0 || salary > 0;

  const results = useMemo(() => {
    if (!canCalculate) return null;
    return calculateROI({
      university_name:     uniQuery,
      country:             (matchedUni?.country as SalaryCountry) ?? "USA",
      city,
      field_of_study:      field,
      annual_tuition_usd:  tuition,
      avg_living_cost_usd: living,
      duration_months:     durationMonths > 0 ? durationMonths : 24,
      scholarship_usd:     scholarship,
      expected_salary_usd: salary,
      savings_rate_pct:    savingsRate,
    });
  }, [uniQuery, matchedUni, city, field, tuition, living, durationMonths, scholarship, salary, savingsRate, canCalculate]);

  const pb = results ? paybackColor(results.payback_years) : null;
  const durationYears = (durationMonths > 0 ? durationMonths : 24) / 12;

  const durationOptions = [12, 18, 24, 30, 36, 48, 60].map((m) => ({
    value: String(m),
    label: m % 12 === 0 ? `${m / 12} yr${m / 12 > 1 ? "s" : ""}` : `${m} months`,
  }));

  const scholarshipOptions = [
    { value: "0",     label: "No scholarship" },
    { value: "5000",  label: "$5,000" },
    { value: "10000", label: "$10,000" },
    { value: "15000", label: "$15,000" },
    { value: "20000", label: "$20,000" },
    { value: "30000", label: "$30,000" },
    { value: "50000", label: "$50,000" },
  ];

  return (
    <section id="roi-calculator" className="py-24 px-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 text-indigo-400 font-bold text-sm uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5" /> ROI Calculator
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Is your degree worth it?
          </h2>
          <p className="text-slate-400 mt-3 text-lg max-w-xl mx-auto">
            Type your institution — costs and salary data auto-populate so you see your real return on investment instantly.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Inputs ── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 space-y-5"
          >
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              Program Details
            </h3>

            {/* Institution — only user-typed field */}
            <div ref={uniRef} className="relative">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Institution Name
              </label>
              <input
                type="text"
                value={uniQuery}
                placeholder="e.g. University of Toronto"
                onChange={(e) => {
                  setUniQuery(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value.trim()) {
                    setMatchedUni(null);
                    setSelectedProgram(null);
                  }
                }}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 mt-1 w-full bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {suggestions.map((u) => (
                      <button
                        key={u.name}
                        onMouseDown={() => selectUniversity(u)}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/10 transition-colors text-left"
                      >
                        <span className="text-base flex-shrink-0">{u.flag}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">{u.name}</p>
                          <p className="text-xs text-slate-400">{u.country}{u.qs_ranking ? ` · QS #${u.qs_ranking}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Program dropdown (auto-populated once uni matched) */}
            {uniPrograms.length > 0 && (
              <SelectField
                label="Program / Degree"
                note="auto-populated"
                value={selectedProgram?.program_name ?? ""}
                options={[
                  { value: "", label: "— Select a program —" },
                  ...uniPrograms.map((p) => ({ value: p.program_name, label: p.program_name })),
                ]}
                onChange={(v) => {
                  const p = uniPrograms.find((x) => x.program_name === v) ?? null;
                  if (p) selectProgram(p);
                  else setSelectedProgram(null);
                }}
              />
            )}

            {/* Field of study dropdown */}
            <SelectField
              label="Field of Study"
              note={matchedUni ? "auto-populated" : undefined}
              value={field}
              options={FIELDS_OF_STUDY.map((f) => ({ value: f, label: f }))}
              onChange={(v) => setField(v as FieldOfStudy)}
            />

            {/* City — auto-populated, read-only display */}
            {city && (
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-sm text-slate-300">{city}</span>
                {matchedUni && <span className="text-xs text-slate-500 ml-auto">{matchedUni.flag} {matchedUni.country}</span>}
              </div>
            )}

            {/* Tuition + Living — auto-populated number displays */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Tuition / yr <span className="text-indigo-400 font-normal normal-case">(USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={tuition || ""} placeholder="0"
                    onChange={(e) => setTuition(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Living / yr <span className="text-indigo-400 font-normal normal-case">(USD)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input type="number" value={living || ""} placeholder="0"
                    onChange={(e) => setLiving(Number(e.target.value))}
                    className="w-full bg-white/10 border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield]"
                  />
                </div>
              </div>
            </div>

            {/* Duration dropdown + Scholarship dropdown */}
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="Duration"
                note={matchedUni ? "auto-populated" : undefined}
                value={String(durationMonths)}
                options={durationOptions}
                onChange={(v) => setDuration(Number(v))}
              />
              <SelectField
                label="Scholarship"
                value={String(scholarship)}
                options={scholarshipOptions}
                onChange={(v) => setScholarship(Number(v))}
              />
            </div>

            {/* Salary — auto-populated, editable */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Expected Starting Salary / yr{" "}
                <span className="text-indigo-400 font-normal normal-case">
                  {matchedUni ? "auto-estimated" : "(USD)"}
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" value={salary || ""} placeholder="0"
                  onChange={(e) => setSalary(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield]"
                />
              </div>
              {matchedUni && (
                <p className="text-xs text-slate-500 mt-1">
                  Based on median {field} salaries in {matchedUni.country}. Adjust as needed.
                </p>
              )}
            </div>

            {/* Savings rate slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Savings Rate</label>
                <span className="text-sm font-bold text-indigo-400">{savingsRate}%</span>
              </div>
              <input type="range" min={5} max={50} step={5} value={savingsRate}
                onChange={(e) => setSavingsRate(Number(e.target.value))}
                className="w-full h-1.5 accent-indigo-500 cursor-pointer rounded-full"
              />
              <div className="flex justify-between text-xs text-slate-600 mt-1">
                <span>5%</span><span>50%</span>
              </div>
            </div>
          </motion.div>

          {/* ── Results ── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3 space-y-4"
          >
            {!results ? (
              <div className="h-full flex flex-col items-center justify-center py-20 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl text-center px-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
                  <TrendingUp className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Type a university name to begin</p>
                <p className="text-slate-400 text-sm max-w-xs">
                  Start typing above — tuition, living costs and salary data will auto-populate for your selected program.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${tuition}-${living}-${salary}-${savingsRate}-${durationMonths}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Program header */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <span className="text-2xl flex-shrink-0">{matchedUni?.flag ?? "🎓"}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{uniQuery || "—"}</p>
                      <p className="text-xs text-slate-400">
                        {[selectedProgram?.program_name ?? field, city || matchedUni?.country].filter(Boolean).join(" · ")}
                        {matchedUni?.qs_ranking ? ` · QS #${matchedUni.qs_ranking}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Total investment + Payback */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Total Investment</p>
                      <p className="text-3xl font-black text-white">{formatCurrency(results.total_investment_usd)}</p>
                      <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                        <div className="flex justify-between">
                          <span>Tuition ({durationYears.toFixed(1)} yr)</span>
                          <span className="text-white font-medium">{formatCurrency(results.total_tuition_usd)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Living</span>
                          <span className="text-white font-medium">{formatCurrency(results.total_living_usd)}</span>
                        </div>
                        {scholarship > 0 && (
                          <div className="flex justify-between text-emerald-400">
                            <span>Scholarship</span>
                            <span className="font-medium">−{formatCurrency(scholarship)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`backdrop-blur-md border border-white/10 rounded-2xl p-5 ${pb!.bg}`}>
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Payback Period</p>
                      <p className={`text-3xl font-black ${pb!.text}`}>{fmtYears(results.payback_years)}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        At {savingsRate}% savings on {fmtK(salary)}/yr salary
                      </p>
                      <div className="mt-3 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${pb!.bar}`}
                          style={{ width: `${Math.min(100, (results.payback_years / 20) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {results.payback_years <= 5 ? "✓ Excellent return" : results.payback_years <= 10 ? "Good return" : "Long payback — consider scholarships"}
                      </p>
                    </div>
                  </div>

                  {/* 4-up metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">10-Year ROI</p>
                      <p className={`text-xl font-black ${results.ten_year_roi_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {results.ten_year_roi_pct > 0 ? "+" : ""}{Math.round(results.ten_year_roi_pct)}%
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">Monthly Budget</p>
                      <p className="text-xl font-black text-white">{fmtK(results.monthly_budget_usd)}</p>
                      <p className="text-[10px] text-slate-500">during study</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">Monthly Savings</p>
                      <p className="text-xl font-black text-indigo-400">{fmtK(results.monthly_savings_usd)}</p>
                      <p className="text-[10px] text-slate-500">post-graduation</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                      <p className="text-xs text-slate-400 mb-1">10-yr Net Gain</p>
                      <p className={`text-xl font-black ${results.net_earnings_10yr_usd >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {results.net_earnings_10yr_usd >= 0 ? "+" : ""}{fmtK(results.net_earnings_10yr_usd)}
                      </p>
                    </div>
                  </div>

                  {/* Break-even */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white mb-1">Break-even Salary</p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          You need at least{" "}
                          <span className="text-white font-bold">{formatCurrency(results.breakeven_salary_usd)}/yr</span>{" "}
                          (at {savingsRate}% savings) to recover your investment in 5 years.{" "}
                          {salary >= results.breakeven_salary_usd
                            ? <span className="text-emerald-400 font-medium">✓ Your expected salary clears this.</span>
                            : <span className="text-amber-400 font-medium">⚠ Below threshold — consider scholarships or higher-paying roles.</span>
                          }
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-black text-white">{formatCurrency(results.breakeven_salary_usd)}</p>
                        <p className="text-[10px] text-slate-500">min salary needed</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">Find programs that maximise your ROI</p>
                      <p className="text-xs text-slate-400 mt-0.5">Our AI matching engine ranks 6,900+ programs by fit — not just prestige.</p>
                    </div>
                    <a
                      href="/get-started"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all whitespace-nowrap flex-shrink-0"
                    >
                      Get My Matches <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
          Salary estimates are median figures from publicly available surveys. Tuition and living costs auto-populate from eduvianAI&apos;s program database. All amounts in USD.
        </p>
      </div>
    </section>
  );
}

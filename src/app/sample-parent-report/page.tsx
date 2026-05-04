"use client";

import Link from "next/link";
import { ArrowLeft, Printer, Users, CheckCircle2, AlertCircle, TrendingUp, Shield, Briefcase, GraduationCap, Banknote, Heart } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// Static, illustrative sample. Numbers are believable but invented.
// Goal: let a parent (or a student showing one) see the exact format
// and depth of the real Parent Decision Report before generating their own.

const SAMPLE = {
  studentInitial: "Priya M.",
  program: "MS in Computer Science",
  university: "University of Toronto",
  country: "Canada",
  intake: "Fall 2026",
  generatedOn: "Sample · illustrative only",
};

const FACTORS = [
  { icon: Banknote,    factor: "Budget fit",         view: "Good",              tone: "good",    note: "₹42L over 2 years sits inside the family's stated ceiling of ₹45L." },
  { icon: TrendingUp,  factor: "Payback period",     view: "4.8 years",         tone: "neutral", note: "Median CS new-grad salary in Toronto: CAD 78,000 (StatsCan 2025)." },
  { icon: Shield,      factor: "Safety",             view: "Good",              tone: "good",    note: "Toronto Numbeo safety index 65/100; consistent rating across student forums." },
  { icon: Briefcase,   factor: "Job market",         view: "Strong",            tone: "good",    note: "PGWP up to 3 years post-graduation; CS new-grad placement >85% within 6 months." },
  { icon: GraduationCap, factor: "Visa readiness",   view: "Medium risk",       tone: "warn",    note: "SDS funds (CAD 22,895) confirmed in GIC. Statement of purpose still needs work." },
  { icon: CheckCircle2, factor: "Scholarship fit",   view: "Worth applying",    tone: "neutral", note: "OGS and Vector Institute scholarships open in March; deadline 4 weeks out." },
  { icon: Heart,       factor: "Family verdict",     view: "Worth considering", tone: "verdict", note: "Strong fit on cost, safety and outcomes. One open question: visa readiness." },
];

const COSTS = [
  { label: "Tuition (2 years)",                amount: "CAD 64,000",   inr: "≈ ₹39.4L" },
  { label: "Living (Toronto, 24 months)",      amount: "CAD 38,400",   inr: "≈ ₹23.6L" },
  { label: "One-time setup (visa, insurance)", amount: "CAD 4,200",    inr: "≈ ₹2.6L"  },
  { label: "Total investment",                 amount: "CAD 106,600",  inr: "≈ ₹65.6L", total: true },
];

const ROI = {
  expected_starting_salary: "CAD 78,000 / year",
  five_year_earnings:        "CAD 470,000",
  break_even_year:           "Year 4.8 post-graduation",
  net_value_10yr:            "≈ CAD 612,000 above the no-study baseline",
};

const RISKS = [
  { tone: "warn", text: "SOP needs strengthening to reduce SDS rejection risk — flagged by SOP Assistant." },
  { tone: "warn", text: "Toronto rent has risen 11% YoY — budget assumes a shared 2BR within 30 min commute." },
  { tone: "ok",   text: "Funds proof, transcripts, IELTS 7.0 already secured." },
];

const toneClasses = {
  good:    { bg: "bg-emerald-50",  border: "border-emerald-200", text: "text-emerald-700",  dotBg: "bg-emerald-500" },
  warn:    { bg: "bg-amber-50",    border: "border-amber-200",   text: "text-amber-800",    dotBg: "bg-amber-500"   },
  neutral: { bg: "bg-gray-50",     border: "border-gray-200",    text: "text-gray-700",     dotBg: "bg-gray-400"    },
  verdict: { bg: "bg-indigo-50",   border: "border-indigo-200",  text: "text-indigo-800",   dotBg: "bg-indigo-600"  },
} as const;

export default function SampleParentReportPage() {
  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Top toolbar — hidden on print */}
      <nav className="print:hidden sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-full">
            SAMPLE · illustrative
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors shadow-md"
          >
            <Printer className="w-4 h-4" />
            Save as PDF
          </button>
          <Link
            href="/parent-decision"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 text-sm font-bold transition-colors"
          >
            Generate my own
          </Link>
        </div>
      </nav>

      {/* Page wrapper — A4-ish width for print */}
      <div className="max-w-3xl mx-auto p-6 sm:p-10 print:p-0">
        <article className="bg-white border border-gray-200 rounded-3xl print:rounded-none print:border-0 shadow-md print:shadow-none p-8 sm:p-12 print:p-10">
          {/* Header */}
          <header className="flex items-start justify-between gap-6 pb-6 border-b border-gray-200 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <EduvianLogoMark size={28} />
                <span className="font-display font-bold text-lg text-gray-900">eduvian<span className="text-indigo-500">AI</span></span>
              </div>
              <p className="text-[11px] font-bold text-purple-700 uppercase tracking-widest mb-2">Parent Decision Report</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                {SAMPLE.program}
              </h1>
              <p className="text-gray-600 text-sm mt-1">{SAMPLE.university} · {SAMPLE.country} · {SAMPLE.intake}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">For</p>
              <p className="text-sm font-bold text-gray-900">{SAMPLE.studentInitial}</p>
              <p className="text-[10px] text-gray-500 mt-2">{SAMPLE.generatedOn}</p>
            </div>
          </header>

          {/* Executive verdict */}
          <section className="mb-8">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest mb-1">Family verdict</p>
                <p className="text-lg font-bold text-gray-900 mb-1">Worth considering — strong on cost, safety and outcomes.</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  This program fits the family budget, has clear post-study work pathways, and ranks well on safety. The main open item is visa readiness — the SOP needs strengthening before filing.
                </p>
              </div>
            </div>
          </section>

          {/* 7-factor breakdown */}
          <section className="mb-8">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Seven-factor breakdown</h2>
            <div className="space-y-2">
              {FACTORS.map((f) => {
                const c = toneClasses[f.tone as keyof typeof toneClasses];
                const Icon = f.icon;
                return (
                  <div key={f.factor} className={`flex items-start gap-4 p-4 rounded-xl border ${c.bg} ${c.border}`}>
                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${c.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 mb-1">
                        <p className="text-sm font-bold text-gray-900">{f.factor}</p>
                        <p className={`text-sm font-extrabold ${c.text} flex-shrink-0`}>{f.view}</p>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{f.note}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Cost breakdown */}
          <section className="mb-8">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Cost breakdown</h2>
            <table className="w-full text-sm">
              <tbody>
                {COSTS.map((c) => (
                  <tr key={c.label} className={`border-b border-gray-100 last:border-0 ${c.total ? "bg-gray-50 font-bold" : ""}`}>
                    <td className="py-3 px-2 text-gray-700">{c.label}</td>
                    <td className="py-3 px-2 text-right text-gray-900 tabular-nums">{c.amount}</td>
                    <td className="py-3 px-2 text-right text-gray-500 tabular-nums">{c.inr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ROI snapshot */}
          <section className="mb-8">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">10-year ROI snapshot</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { label: "Expected starting salary", value: ROI.expected_starting_salary },
                { label: "5-year earnings",          value: ROI.five_year_earnings },
                { label: "Break-even year",           value: ROI.break_even_year },
                { label: "Net value vs no-study",     value: ROI.net_value_10yr },
              ].map((r) => (
                <div key={r.label} className="p-4 rounded-xl bg-white border border-gray-200">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{r.label}</p>
                  <p className="text-sm font-bold text-gray-900">{r.value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Risk flags */}
          <section className="mb-8">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Open items &amp; risk flags</h2>
            <div className="space-y-2">
              {RISKS.map((r, i) => {
                const c = r.tone === "ok" ? toneClasses.good : toneClasses.warn;
                const Icon = r.tone === "ok" ? CheckCircle2 : AlertCircle;
                return (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
                    <Icon className={`w-4 h-4 ${c.text} flex-shrink-0 mt-0.5`} />
                    <p className="text-sm text-gray-700 leading-relaxed">{r.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Footer disclaimer */}
          <footer className="pt-6 border-t border-gray-200">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <strong className="text-gray-700">Decision-support estimate.</strong> Generated from the student&apos;s profile + verified-at-source program data. Final fees, eligibility, scholarships and visa rules should always be confirmed directly with the university and the relevant consulate before committing. EduvianAI is not a financial, legal or immigration adviser.
            </p>
            <p className="text-[10px] text-gray-400 mt-3">
              Sample report · Numbers and case study are illustrative. Generate yours at <span className="font-semibold text-purple-600">eduvianai.com/parent-decision</span>.
            </p>
          </footer>
        </article>

        {/* Bottom CTA — hidden on print */}
        <div className="print:hidden flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link
            href="/parent-decision"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors shadow-md"
          >
            <Users className="w-4 h-4" />
            Generate my own report
          </Link>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 text-sm font-bold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Save this sample as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

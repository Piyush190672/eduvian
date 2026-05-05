"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { DB_STATS, universitiesByCountry } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";
import CountryModal from "@/components/CountryModal";

// Stage copy ported from the original homepage; keeps the v2 5-line card design.
type StageSampleSpec =
  | { kind: "tier";  safe: number; reach: number; ambitious: number }
  | { kind: "score"; a: { label: string; v: number }; b: { label: string; v: number } }
  | { kind: "stat";  v: string; l: string };

interface Stage {
  n: string;
  label: string;
  title: string;
  benefit: string;
  sample: StageSampleSpec;
  cta: string;
  trust: string;
  href: string;
  secondary?: { cta: string; href: string };
}

const STAGES: Stage[] = [
  {
    n: "01", label: "Find my best-fit programs",
    title: "No idea where to apply",
    benefit: "AI evaluates your profile and shortlists your best-fit Universities in under 2 minutes.",
    sample: { kind: "tier", safe: 6, reach: 9, ambitious: 5 },
    cta: "Evaluate my Profile",
    trust: "Verified against each university's official program page (e.g. ox.ac.uk, mit.edu, daad.de) — fees, deadlines and English cutoffs read live from source.",
    href: "/get-started",
    secondary: { cta: "Find my best-fit match", href: "/get-started" },
  },
  {
    n: "02", label: "Strengthen my application",
    title: "Got a shortlist — is my application strong enough?",
    benefit: "Write a standout SOP, score and rebuild your CV, draft strong LORs, and check your full application pack for gaps.",
    sample: { kind: "score", a: { label: "Before", v: 61 }, b: { label: "After", v: 84 } },
    cta: "Check My Application",
    trust: "Scored across 7 SOP dimensions and 6 CV dimensions — story arc, specificity, goal alignment, credibility flags. Feedback is paragraph-level, not generic.",
    href: "/application-check",
    secondary: { cta: "Write my SOP", href: "/sop-assistant" },
  },
  {
    n: "03", label: "Practise tests & interviews",
    title: "Prepare for your interview and English tests",
    benefit: "AI Interview Coach for AU and UK university interviews, plus the US F-1 visa interview. Full IELTS, PTE, DET & TOEFL mocks. Know your weak spots before the real thing.",
    sample: { kind: "stat", v: "14 / 14", l: "UK credibility questions coached" },
    cta: "Practise my interview",
    trust: "Exam-style practice based on published test structures: IELTS band descriptors and TOEFL ETS guidelines.",
    href: "/interview-prep",
    secondary: { cta: "English Test Lab", href: "/english-test-lab" },
  },
  {
    n: "04", label: "Compare offers with ROI",
    title: "Got my offer — should I accept?",
    benefit: "ROI Calculator + Parent Decision Tool. Real numbers before you commit.",
    sample: { kind: "stat", v: "4.8 yrs", l: "Median payback period" },
    cta: "Run the Numbers",
    trust: "Salary benchmarks drawn from HESA LEO, Russell Group Graduate Outcomes, QS Top Universities Salary Reports, OECD and LinkedIn Salary Insights.",
    href: "/roi-calculator",
    secondary: { cta: "Parent Decision Report", href: "/parent-decision" },
  },
  {
    n: "05", label: "Get visa-ready",
    title: "Accepted — now the visa",
    benefit: "F-1, UK, SDS, AUS 500, Germany D & 7 more. Official checklists, financial-proof rules, risk flags, direct apply links.",
    sample: { kind: "stat", v: "12", l: "Visa playbooks (F-1 · UK · SDS · 500 · D · 7 more)" },
    cta: "Open Visa Coach",
    trust: "Visa playbooks link out to the official government source page (travel.state.gov, gov.uk, Canada IRCC, immi.gov.au and equivalents).",
    href: "/visa-coach",
    secondary: { cta: "Track applications (Kanban)", href: "/application-tracker" },
  },
];

const PRINCIPLES = [
  { n: "01", t: "Verified at source",          p: `Every fee, deadline and cutoff fetched live from the official university page. ${DB_STATS.verifiedProgramsLabel} programs.` },
  { n: "02", t: "Independent",                 p: "No university commissions. No marketing deals. The recommendation is yours, not someone else's quota." },
  { n: "03", t: "Structured, not guesswork",   p: "Same data-driven analysis for every student. Fit, budget, requirements, outcomes — not convenience." },
  { n: "04", t: "Built to decide, not just discover", p: "Search is the easy part. Shortlist → SOP review → interview prep → fee comparison → final pick. Every tool returns specific next steps, not vague advice — solving the real pain points students hit at every stage." },
];

const DEMOS = [
  { i: 0, label: "University Match",     sub: "Your personalised Top 20 shortlist",  accent: "border-violet-500"  },
  { i: 1, label: "SOP Check",            sub: "AI feedback across 7 dimensions",     accent: "border-violet-400"  },
  { i: 2, label: "Interview Coach",      sub: "Voice + text mock with AI scoring",   accent: "border-emerald-500" },
  { i: 3, label: "ROI Analysis",         sub: "Payback period and 10-year ROI",      accent: "border-amber-500"   },
  { i: 4, label: "Visa Apply",           sub: "Country checklist + risk flags",      accent: "border-rose-500"    },
];

const COUNTRIES = [
  { flag: "🇺🇸", name: "USA",         img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80" },
  { flag: "🇬🇧", name: "UK",          img: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=600&q=80" },
  { flag: "🇨🇦", name: "Canada",      img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=600&q=80" },
  { flag: "🇦🇺", name: "Australia",   img: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=600&q=80" },
  { flag: "🇩🇪", name: "Germany",     img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80" },
  { flag: "🇳🇱", name: "Netherlands", img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80" },
  { flag: "🇮🇪", name: "Ireland",     img: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=600&q=80" },
  { flag: "🇫🇷", name: "France",      img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80" },
  { flag: "🇳🇿", name: "New Zealand", img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80" },
  { flag: "🇸🇬", name: "Singapore",   img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80" },
  { flag: "🇲🇾", name: "Malaysia",    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=80" },
  { flag: "🇦🇪", name: "UAE",         img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
];

const SCHOLARSHIP_HIGHLIGHTS = [
  { flag: "🇺🇸", country: "USA",       name: "Fulbright Foreign Student Program",   cover: "Fully funded",       note: "Tuition, living stipend, travel & health insurance" },
  { flag: "🇬🇧", country: "UK",        name: "Chevening Scholarship",               cover: "Fully funded",       note: "UK Govt — tuition, living, travel; 1-year Masters" },
  { flag: "🇬🇧", country: "UK",        name: "Gates Cambridge Scholarship",         cover: "Fully funded",       note: "Exceptional scholars at Cambridge; highly competitive" },
  { flag: "🇦🇺", country: "Australia", name: "Australia Awards",                    cover: "Fully funded",       note: "Australian Govt; tuition, living, travel, health" },
  { flag: "🇨🇦", country: "Canada",    name: "Vanier Canada Graduate Scholarship",  cover: "CAD 50,000 / yr",    note: "Doctoral students at Canadian universities" },
  { flag: "🇩🇪", country: "Germany",   name: "DAAD Scholarship",                    cover: "€934 – €1,300 / mo", note: "German Govt; covers tuition, living, health" },
  { flag: "🇸🇬", country: "Singapore", name: "Singapore International Graduate",    cover: "Fully funded",       note: "A*STAR for STEM PhD candidates" },
  { flag: "🇮🇪", country: "Ireland",   name: "Government of Ireland International", cover: "€10,000 + fees",     note: "Postgraduate research at Irish universities" },
];

// Sample shortlist rows for the hero dashboard mockup
const SAMPLE_SHORTLIST = [
  { name: "University of Leeds",     prog: "MSc AI & Data Science",  pct: 91, tier: "safe",      flag: "🇬🇧" },
  { name: "University of Toronto",   prog: "MEng Computer Science",  pct: 88, tier: "safe",      flag: "🇨🇦" },
  { name: "TU Munich",               prog: "MSc Informatics",        pct: 79, tier: "reach",     flag: "🇩🇪" },
  { name: "University of Edinburgh", prog: "MSc Computer Science",   pct: 76, tier: "reach",     flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Imperial College London", prog: "MSc Machine Learning",   pct: 63, tier: "ambitious", flag: "🇬🇧" },
];

// Stage-card sample-output renderer. Tiny, restrained, uses semantic palette only.
function StageSample({ s }: { s: StageSampleSpec }) {
  if (s.kind === "tier") {
    const pills = [
      { k: "Safe",      v: s.safe,      cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
      { k: "Reach",     v: s.reach,     cls: "text-amber-700 bg-amber-50 border-amber-100"      },
      { k: "Ambitious", v: s.ambitious, cls: "text-rose-700 bg-rose-50 border-rose-100"          },
    ];
    return (
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <span key={p.k} className={`inline-flex items-baseline gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${p.cls}`}>
            <span className="font-bold tabular-nums">{p.v}</span> {p.k}
          </span>
        ))}
      </div>
    );
  }
  if (s.kind === "score") {
    const rows = [
      { ...s.a, barCls: "bg-stone-400",  textCls: "text-gray-500"   },
      { ...s.b, barCls: "bg-emerald-500", textCls: "text-emerald-700" },
    ];
    return (
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">{row.label}</span>
              <span className={`tabular-nums font-semibold ${row.textCls}`}>{row.v}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
              <div className={`h-full rounded-full ${row.barCls}`} style={{ width: `${row.v}%` }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-2xl font-semibold text-gray-900 tabular-nums">{s.v}</span>
      <span className="text-xs text-gray-500">{s.l}</span>
    </div>
  );
}

export default function V2LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setActiveDemo((d) => (d + 1) % DEMOS.length), 5000);
    return () => clearTimeout(id);
  }, [activeDemo]);

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900">

      {/* ───── NAV ───── */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="#journey"      className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Stages</Link>
            <Link href="#outputs"      className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Outputs</Link>
            <Link href="#destinations" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Destinations</Link>
            <Link href="#scholarships" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Scholarships</Link>
            <Link href="#principles"   className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Principles</Link>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ─────
          Heading = the user-supplied positioning sentence.
          RHS    = real sample-dashboard mockup (no photo).
          Below  = parent strip with For-students / For-parents.
       */}
      <section className="relative bg-[#0E1119] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-28 sm:pt-36 pb-16 sm:pb-20 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-violet-300/85 mb-8 font-semibold">
              <Sparkles className="w-3 h-3" /> Independent · verified · AI-driven
            </p>
            <h1 className="font-display font-bold text-[2.25rem] leading-[1.08] sm:text-5xl md:text-[3.75rem] tracking-tight mb-7">
              Choose your study abroad path with <span className="italic font-medium text-violet-300">verified data you can trust</span>.
            </h1>
            <p className="text-lg sm:text-xl text-white/65 leading-relaxed max-w-2xl mb-10">
              EduvianAI gives students and families an AI-powered, independent, data-backed layer of clarity before they make high-stakes study abroad decisions.
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
              <Link
                href="/get-started"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/30"
              >
                Find my best-fit programs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/application-check"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white/85 text-sm font-semibold hover:border-white/40 hover:text-white transition-colors"
              >
                Check my application strength
              </Link>
            </div>
          </div>

          {/* RHS: stacked sample-output cards (Shortlist + App Score + ROI + Visa)
              ported from the original homepage, retuned to the v2 palette
              (violet accent + emerald/amber/rose semantic only). */}
          <div className="lg:col-span-5 min-w-0">
            <p className="lg:hidden text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 px-1">
              Sample outputs — illustrative
            </p>

            {/* MOBILE: horizontal snap-scroll strip */}
            <div className="lg:hidden -mx-6 px-6 overflow-x-auto flex gap-3 pb-4 snap-x snap-mandatory">
              {/* Card M1 — Shortlist */}
              <div className="flex-shrink-0 w-[272px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">AI Shortlist · sample</p>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">20 matches</span>
                </div>
                <div className="space-y-2">
                  {[
                    { flag: "🇺🇸", uni: "Carnegie Mellon",     score: 69, tier: "Ambitious", tc: "text-rose-700",    bg: "bg-rose-50 border-rose-200"       },
                    { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", uni: "Univ. of Edinburgh",   score: 78, tier: "Reach",     tc: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
                    { flag: "🇬🇧", uni: "Univ. of Leeds",      score: 88, tier: "Safe",      tc: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                  ].map((r) => (
                    <div key={r.uni} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                      <span className="text-sm flex-shrink-0">{r.flag}</span>
                      <p className="text-[11px] font-bold text-gray-900 flex-1 truncate">{r.uni}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] font-bold text-gray-600 tabular-nums">{r.score}%</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${r.bg} ${r.tc}`}>{r.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-50">3 of 20 · Safe, Reach &amp; Ambitious</p>
              </div>

              {/* Card M2 — App Score */}
              <div className="flex-shrink-0 w-[200px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Application Score</p>
                {[
                  { label: "Before",   pct: 61, color: "bg-rose-400"   },
                  { label: "After AI", pct: 84, color: "bg-violet-500" },
                ].map((b) => (
                  <div key={b.label} className="mb-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-gray-500">{b.label}</span>
                      <span className="text-[10px] font-bold text-gray-700 tabular-nums">{b.pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
                <div className="mt-3 pt-2 border-t border-gray-50">
                  <p className="text-[10px] font-bold text-violet-700">+23 pts (sample)</p>
                  <p className="text-[8px] text-gray-400 mt-0.5">Illustrative example only</p>
                </div>
              </div>

              {/* Card M3 — ROI */}
              <div className="flex-shrink-0 w-[200px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">ROI · Payback</p>
                {[
                  { label: "UCL London", yrs: "3.2 yrs", pct: 32, color: "bg-emerald-500", best: true  },
                  { label: "Melbourne",  yrs: "5.8 yrs", pct: 58, color: "bg-rose-400",    best: false },
                  { label: "Edinburgh",  yrs: "4.8 yrs", pct: 48, color: "bg-amber-400",   best: false },
                ].map((b) => (
                  <div key={b.label} className="mb-2">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`text-[9px] ${b.best ? "font-bold text-gray-900" : "text-gray-400"}`}>{b.label}</span>
                      <span className={`text-[9px] font-bold ${b.best ? "text-emerald-700" : "text-gray-400"}`}>{b.yrs}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-[9px] font-bold text-emerald-700 mt-2">★ UCL recommended</p>
              </div>

              {/* Card M4 — Visa */}
              <div className="flex-shrink-0 w-[220px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Visa Coach</p>
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">12 countries</span>
                </div>
                {[
                  { flag: "🇺🇸", name: "F-1 (USA)",   fee: "$185",    risk: "low", rc: "text-emerald-700", rb: "bg-emerald-50 border-emerald-200" },
                  { flag: "🇬🇧", name: "UK Student",  fee: "£558",    risk: "low", rc: "text-emerald-700", rb: "bg-emerald-50 border-emerald-200" },
                  { flag: "🇨🇦", name: "SDS (Canada)", fee: "CAD 150", risk: "med", rc: "text-amber-700",   rb: "bg-amber-50 border-amber-200"     },
                ].map((v) => (
                  <div key={v.name} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                    <span className="text-sm flex-shrink-0">{v.flag}</span>
                    <p className="text-[10px] font-bold text-gray-900 flex-1 truncate">{v.name}</p>
                    <span className="text-[9px] text-gray-500 flex-shrink-0">{v.fee}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${v.rb} ${v.rc}`}>{v.risk}</span>
                  </div>
                ))}
                <p className="text-[9px] font-bold text-violet-700 mt-2 pt-2 border-t border-gray-50">Official-source checklists</p>
              </div>
            </div>

            {/* DESKTOP: vertical stacked cards */}
            <div className="hidden lg:flex flex-col gap-3">
              {/* Card 1 — Shortlist */}
              <div className="bg-white rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Shortlist · 90s</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">20 matches</span>
                </div>
                <div className="space-y-2">
                  {[
                    { flag: "🇺🇸", uni: "Carnegie Mellon",     prog: "MSML",                 score: 69, tier: "Ambitious", tc: "text-rose-700",    bg: "bg-rose-50 border-rose-200"       },
                    { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", uni: "Univ. of Edinburgh",   prog: "MSc Computer Science", score: 78, tier: "Reach",     tc: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
                    { flag: "🇩🇪", uni: "TU Munich",           prog: "MSc Informatics",      score: 74, tier: "Reach",     tc: "text-amber-700",   bg: "bg-amber-50 border-amber-200"     },
                    { flag: "🇬🇧", uni: "Univ. of Leeds",      prog: "MSc AI & Data Science", score: 88, tier: "Safe",      tc: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                  ].map((r) => (
                    <div key={r.uni} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm flex-shrink-0">{r.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-gray-900 truncate">{r.uni}</p>
                        <p className="text-[10px] text-gray-400 truncate">{r.prog}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[11px] font-bold text-gray-600 tabular-nums">{r.score}%</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${r.bg} ${r.tc}`}>{r.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-gray-400 mt-2.5 pt-2 border-t border-gray-50">Showing 4 of 20 · Safe, Reach &amp; Ambitious</p>
              </div>

              {/* Cards 2 + 3 — side by side */}
              <div className="grid grid-cols-2 gap-3">
                {/* App Score */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">App Score</p>
                  {[
                    { label: "Before",   pct: 61, color: "bg-rose-400"   },
                    { label: "After AI", pct: 84, color: "bg-violet-500" },
                  ].map((b) => (
                    <div key={b.label} className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-gray-500">{b.label}</span>
                        <span className="text-[10px] font-bold text-gray-700 tabular-nums">{b.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-[10px] font-bold text-violet-700 mt-1">+23 pts ↑</p>
                </div>

                {/* ROI */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">ROI</p>
                  {[
                    { label: "UCL London", yrs: "3.2 yrs", pct: 32, color: "bg-emerald-500", best: true  },
                    { label: "Melbourne",  yrs: "5.8 yrs", pct: 58, color: "bg-rose-400",    best: false },
                  ].map((b) => (
                    <div key={b.label} className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] ${b.best ? "font-bold text-gray-900" : "text-gray-400"}`}>{b.label}</span>
                        <span className={`text-[9px] font-bold ${b.best ? "text-emerald-700" : "text-gray-400"}`}>{b.yrs}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-[9px] font-bold text-emerald-700 mt-1">★ UCL wins</p>
                </div>
              </div>

              {/* Card 4 — Visa */}
              <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visa Coach · 12 countries</p>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">F-1 · UK · SDS · 500 +8</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { flag: "🇺🇸", label: "F-1",        detail: "$185 · I-20 ready"  },
                    { flag: "🇬🇧", label: "UK Student",  detail: "£558 · CAS"         },
                    { flag: "🇨🇦", label: "SDS",        detail: "CAD 22,895 GIC"     },
                  ].map((v) => (
                    <div key={v.label} className="rounded-lg border border-gray-100 p-2">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-sm">{v.flag}</span>
                        <span className="text-[10px] font-bold text-gray-900 truncate">{v.label}</span>
                      </div>
                      <p className="text-[9px] text-gray-500 leading-tight truncate">{v.detail}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-violet-700 font-bold mt-2.5 pt-2 border-t border-gray-50">Official-source checklists · risk flags · apply links</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust strip — single editorial line per §24.4 */}
        <div className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-white/60">
            <ShieldCheck className="w-4 h-4 text-emerald-400/80 flex-shrink-0" />
            <span>Independent</span>
            <span className="text-white/30">·</span>
            <span>no university commission</span>
            <span className="text-white/30">·</span>
            <span>{DB_STATS.verifiedProgramsLabel} programs</span>
            <span className="text-white/30">·</span>
            <span>{DB_STATS.verifiedUniversitiesLabel} universities</span>
            <span className="text-white/30">·</span>
            <span>{DB_STATS.countriesLabel} countries</span>
            <span className="text-white/30 hidden sm:inline">·</span>
            <span className="text-white/45 hidden sm:inline">Decision-support estimates</span>
          </div>
        </div>
      </section>

      {/* ───── PARENT/STUDENT STRIP — directly under hero ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 grid sm:grid-cols-2 gap-6 sm:gap-10">
          <div className="group relative rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_28px_56px_-12px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-all duration-300">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-3">For students</p>
            <p className="font-display text-lg sm:text-xl text-gray-900 leading-snug">
              Find the right-fit course, improve your application, prepare for interviews.
            </p>
          </div>
          <div className="group relative rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.18)] hover:shadow-[0_28px_56px_-12px_rgba(15,23,42,0.25)] hover:-translate-y-0.5 transition-all duration-300">
            <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-semibold mb-3">For parents</p>
            <p className="font-display text-lg sm:text-xl text-gray-900 leading-snug">
              Compare cost, ROI, safety, visa readiness, and long-term value.
            </p>
          </div>
        </div>
      </section>

      {/* ───── BY THE NUMBERS — Programs · Universities · Countries ───── */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-8">By the numbers</p>
          <div className="grid sm:grid-cols-3 gap-y-10 gap-x-12">
            {[
              { v: DB_STATS.verifiedProgramsLabel,     l: "Verified programs",   sub: "Every figure fetched live from the official university page." },
              { v: DB_STATS.verifiedUniversitiesLabel, l: "Verified universities", sub: "Institutions with at least one program confirmed at source." },
              { v: DB_STATS.countriesLabel,            l: "Destination countries", sub: "USA, UK, Canada, Australia, Germany, NL, Ireland, France, NZ, Singapore, Malaysia, UAE." },
            ].map((s) => (
              <div key={s.l} className="border-l-2 border-violet-600 pl-6">
                <p className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-2 leading-none tabular-nums">{s.v}</p>
                <p className="text-sm font-semibold text-gray-900 mb-2">{s.l}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── PICK YOUR STAGE — cards w/ Title / Benefit / Sample / CTA / Trust cue ───── */}
      <section id="journey" className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="max-w-3xl mb-14 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Pick your stage</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              From <span className="italic font-medium text-violet-700">first shortlist</span> to <span className="italic font-medium text-violet-700">final visa step</span>.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Five stages. Each card shows a real sample of what the tool produces — open the dedicated page when you want to use it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {STAGES.map((s) => (
              <div
                key={s.n}
                className="group flex flex-col p-6 rounded-2xl bg-white border border-stone-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all"
              >
                <div className="flex items-baseline justify-between mb-5">
                  <span className="font-display text-2xl font-light text-violet-600 tabular-nums">{s.n}</span>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold">{s.label}</span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-gray-900 mb-2 leading-snug">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{s.benefit}</p>
                <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3.5 mb-5">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">Sample output</p>
                  <StageSample s={s.sample} />
                </div>
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 group-hover:gap-2 transition-all mb-2"
                >
                  {s.cta}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                {s.secondary && (
                  <Link
                    href={s.secondary.href}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-violet-700 transition-colors mb-3"
                  >
                    {s.secondary.cta} →
                  </Link>
                )}
                <div className="pt-3 mt-auto border-t border-stone-100 flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-500 leading-snug">{s.trust}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ───── SEE WHAT YOU ACTUALLY GET — light bg, colored borders ───── */}
      <section id="outputs" className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="max-w-3xl mb-14 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Sample outputs — illustrative</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              See what you <span className="italic font-medium text-violet-700">actually get</span>.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Every tool produces a structured output. Here&apos;s a flavour of each — auto-cycling every 5 seconds, or click any band to focus.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-2">
              {DEMOS.map((d) => {
                const active = activeDemo === d.i;
                return (
                  <button
                    key={d.i}
                    onClick={() => setActiveDemo(d.i)}
                    className={`w-full text-left flex items-baseline gap-5 px-5 py-4 rounded-xl border-l-4 ${d.accent} transition-all ${
                      active ? "bg-stone-50 shadow-sm border border-l-4 border-stone-200" : "hover:bg-stone-50"
                    }`}
                  >
                    <span className="font-display text-xl font-light text-gray-400 tabular-nums">0{d.i + 1}</span>
                    <span className="flex-1 min-w-0">
                      <span className={`block text-sm font-semibold ${active ? "text-gray-900" : "text-gray-700"}`}>{d.label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{d.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7">
              <div className={`rounded-2xl bg-stone-50 border-l-4 ${DEMOS[activeDemo].accent} border-y border-r border-stone-200 p-8 sm:p-10 min-h-[420px]`}>
                <div className="flex items-baseline justify-between mb-6">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500 font-bold">{DEMOS[activeDemo].label} — sample output</p>
                  <p className="text-[10px] uppercase tracking-widest text-violet-700 font-bold">illustrative</p>
                </div>

                {activeDemo === 0 && (
                  <div className="space-y-3">
                    {SAMPLE_SHORTLIST.map((r) => (
                      <div key={r.name} className="flex items-center gap-3 py-2 border-b border-stone-200/70 last:border-0">
                        <span className="text-base flex-shrink-0">{r.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-500 truncate">{r.prog}</p>
                        </div>
                        <span className="text-sm font-bold text-gray-900 tabular-nums">{r.pct}%</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          r.tier === "safe"      ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
                          r.tier === "reach"     ? "border-amber-200 text-amber-700 bg-amber-50" :
                                                   "border-rose-200 text-rose-700 bg-rose-50"
                        }`}>{r.tier === "safe" ? "Safe" : r.tier === "reach" ? "Reach" : "Ambitious"}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeDemo === 1 && (
                  <div className="bg-white rounded-2xl shadow-[0_28px_64px_-12px_rgba(0,0,0,0.25)] overflow-hidden border border-stone-200">
                    <div className="h-1 bg-violet-500" />
                    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                          <span className="text-violet-700 text-sm font-bold">SOP</span>
                        </div>
                        <span className="font-bold text-gray-900">SOP Feedback</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">Application Check</span>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your opening paragraph</p>
                        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4">
                          <p className="text-[15px] text-gray-600 italic leading-relaxed">&ldquo;I have always been passionate about technology and computers since my childhood days growing up...&rdquo;</p>
                          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                            ⚠ Weak hook — reviewers stop reading
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">AI suggested rewrite</p>
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                          <p className="text-[15px] text-gray-700 leading-relaxed">&ldquo;At 22, I shipped a search feature used by 40,000 users. That week taught me more about systems design than three semesters of coursework.&rdquo;</p>
                          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                            ✓ Specific · Memorable · Reviewers stop here
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
                        <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-2">2 more issues flagged</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />Career goal paragraph is vague — no measurable outcome stated</div>
                          <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />Why-this-university section feels templated — add specific faculty</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeDemo === 2 && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-stone-200 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1">Officer asked</p>
                      <p className="text-sm font-semibold text-gray-900">&ldquo;Why this course in the UK and not in India?&rdquo;</p>
                    </div>
                    <div className="bg-rose-50/60 rounded-xl border border-rose-200/70 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-rose-700 font-bold mb-1">Your first attempt</p>
                      <p className="text-sm text-gray-700 italic">&ldquo;UK universities are better and globally recognised&hellip;&rdquo;</p>
                      <p className="text-[11px] text-rose-700 mt-2">Vague. The officer will doubt your intent.</p>
                    </div>
                    <div className="bg-emerald-50/60 rounded-xl border border-emerald-200/70 p-4">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1">After AI coaching</p>
                      <p className="text-sm text-gray-800">&ldquo;Similar programs in India don&apos;t offer the industry-linked curriculum at [uni]. My goal to work with [specific company] makes this the only practical path.&rdquo;</p>
                    </div>
                  </div>
                )}

                {activeDemo === 3 && (
                  <div className="bg-white rounded-2xl shadow-[0_28px_64px_-12px_rgba(0,0,0,0.25)] overflow-hidden border border-stone-200">
                    <div className="h-1 bg-amber-400" />
                    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                          <span className="text-amber-600 text-sm font-bold">$</span>
                        </div>
                        <span className="font-bold text-gray-900">ROI Analysis</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wide">ROI Calculator</span>
                    </div>
                    <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-100">
                      <p className="text-xs text-gray-400 font-mono">MS Data Science · 2 offers compared</p>
                    </div>
                    <div className="px-6 py-5 grid grid-cols-2 gap-4 mb-2">
                      <div className="rounded-2xl border border-stone-200 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🇬🇧</span>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">UCL</p>
                            <p className="text-xs text-gray-400">London, UK</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-mono text-gray-800">£42K</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Yr 1 salary</span><span className="font-mono text-gray-800">£55K</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Break-even</span><span className="font-mono text-gray-800">2.3 yrs</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">5-yr gain</span><span className="font-mono text-gray-800">+£233K</span></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50/40 p-4 relative">
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                          <span className="text-[10px] font-black text-white bg-emerald-600 px-3 py-0.5 rounded-full uppercase tracking-wide">Best ROI</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">🇺🇸</span>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">UIUC</p>
                            <p className="text-xs text-gray-400">Illinois, USA</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-mono text-gray-800">$68K</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Yr 1 salary</span><span className="font-mono font-bold text-emerald-700">$120K</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">Break-even</span><span className="font-mono font-bold text-emerald-700">1.8 yrs</span></div>
                          <div className="flex justify-between"><span className="text-gray-500">5-yr gain</span><span className="font-mono font-bold text-emerald-700">+$532K</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="mx-6 mb-5 rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5">
                      <p className="text-sm font-semibold text-emerald-800">✓ UIUC recovers 22% faster and yields $299K more over 5 years</p>
                    </div>
                  </div>
                )}

                {activeDemo === 4 && (
                  <div className="bg-white rounded-2xl shadow-[0_28px_64px_-12px_rgba(0,0,0,0.25)] overflow-hidden border border-stone-200">
                    <div className="h-1 bg-violet-500" />
                    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                          <span className="text-base">🛂</span>
                        </div>
                        <span className="font-bold text-gray-900">Visa Apply — F-1 (USA)</span>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 uppercase tracking-wide">Visa Coach</span>
                    </div>
                    <div className="px-6 py-2.5 bg-stone-50 border-b border-stone-100">
                      <p className="text-xs text-gray-400 font-mono">Carnegie Mellon · MS · I-20 received · Apply window open</p>
                    </div>

                    <div className="px-6 py-5 grid grid-cols-3 gap-3">
                      <div className="rounded-2xl border border-stone-100 p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SEVIS I-901</p>
                        <p className="text-lg font-black text-gray-900 tabular-nums">$350</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Pay before DS-160</p>
                      </div>
                      <div className="rounded-2xl border border-stone-100 p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">MRV Fee</p>
                        <p className="text-lg font-black text-gray-900 tabular-nums">$185</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Non-refundable</p>
                      </div>
                      <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3">
                        <p className="text-[10px] font-bold text-violet-700 uppercase tracking-widest mb-1">Funds to show</p>
                        <p className="text-lg font-black text-violet-700 tabular-nums">$89,420</p>
                        <p className="text-[10px] text-violet-700 mt-0.5">Yr 1 tuition + living</p>
                      </div>
                    </div>

                    <div className="px-6 pb-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Personalised checklist</p>
                      <div className="space-y-2">
                        {[
                          { label: "I-20 from Carnegie Mellon",                    status: "done"    },
                          { label: "SEVIS I-901 payment receipt",                  status: "done"    },
                          { label: "DS-160 confirmation (barcode page)",           status: "pending" },
                          { label: "Bank statements — 6 months, ≥ $89,420 cover",   status: "flag"    },
                          { label: "Sponsor affidavit (if applicable)",            status: "pending" },
                          { label: "Visa interview slot — Mumbai consulate",       status: "pending" },
                        ].map((c) => {
                          const cfg =
                            c.status === "done"
                              ? { dot: "bg-emerald-500", text: "text-gray-700",            badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Done" }
                              : c.status === "flag"
                              ? { dot: "bg-rose-500",    text: "text-gray-800 font-semibold", badge: "bg-rose-50 text-rose-700 border-rose-200",          label: "Risk flag" }
                              : { dot: "bg-amber-400",   text: "text-gray-600",            badge: "bg-amber-50 text-amber-700 border-amber-200",      label: "Pending" };
                          return (
                            <div key={c.label} className="flex items-center gap-3 py-1.5 border-b border-stone-100 last:border-0">
                              <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                              <p className={`text-sm leading-snug flex-1 ${cfg.text}`}>{c.label}</p>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge} uppercase tracking-wider flex-shrink-0`}>
                                {cfg.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mx-6 mt-4 mb-3 rounded-2xl bg-rose-50 border border-rose-100 p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 mt-0.5 flex-shrink-0">⚠</span>
                        <div>
                          <p className="text-sm font-bold text-rose-700 mb-0.5">Funds risk flag</p>
                          <p className="text-xs text-rose-700/85 leading-relaxed">Your current statement shows $71,200 — $18,220 short of the 1-year coverage USCIS officers expect for Pittsburgh. Add sponsor affidavit or top-up before the interview.</p>
                        </div>
                      </div>
                    </div>

                    <div className="mx-6 mb-5 rounded-2xl bg-violet-50 border border-violet-100 px-4 py-3.5 flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-violet-800">🔗 Direct apply link: travel.state.gov · DS-160 form</p>
                      <span className="text-[10px] font-bold text-violet-700 bg-white border border-violet-200 rounded-full px-2 py-0.5 uppercase tracking-wider">Official</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── PRINCIPLES — 2x2 grid + bias-free statement ───── */}
      <section id="principles" className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="max-w-3xl mb-14 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Why this is reliable</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Four things that make <br />
              EduvianAI <span className="italic font-medium text-violet-700">different</span>.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mb-12">
            {PRINCIPLES.map((p) => (
              <div
                key={p.n}
                className="group flex flex-col p-8 sm:p-10 rounded-2xl bg-white border border-stone-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all"
              >
                <span className="font-display text-4xl font-light text-violet-600 tabular-nums mb-6">{p.n}</span>
                <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-3 leading-tight">{p.t}</h3>
                <p className="text-base text-gray-500 leading-relaxed">{p.p}</p>
              </div>
            ))}
          </div>

          {/* Bias-free editorial line — the user's specific copy */}
          <div className="border-t border-stone-200 pt-8">
            <p className="font-display text-xl sm:text-2xl text-gray-900 leading-snug max-w-3xl">
              Built to reduce <span className="italic font-medium text-violet-700">individual bias</span>, <span className="italic font-medium text-violet-700">guesswork</span>, and <span className="italic font-medium text-violet-700">commission-led</span> recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* ───── PARENT REPORT ───── */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-semibold mb-6">For families</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              Cost, ROI, safety, visa —<br />answered on <span className="italic font-medium text-violet-700">one page</span>.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
              The Parent Decision Report covers the seven factors parents actually ask about. Color-coded verdicts. Easy to share over WhatsApp; easier to discuss at the dinner table.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Link
                href="/parent-decision"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Generate the report
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/sample-parent-report"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-violet-700 transition-colors"
              >
                See a sample report <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-baseline justify-between mb-5">
                <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold">Parent Decision Report</p>
                <p className="text-[10px] uppercase tracking-widest text-violet-700 font-bold">Sample</p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-stone-200/70">
                  {[
                    { k: "Budget fit",      v: "Good",              t: "text-emerald-700" },
                    { k: "Payback period",  v: "4.8 years",         t: "text-gray-700"    },
                    { k: "Safety",          v: "Good",              t: "text-emerald-700" },
                    { k: "Job market",      v: "Strong",            t: "text-emerald-700" },
                    { k: "Visa readiness",  v: "Medium",            t: "text-amber-700"   },
                    { k: "Scholarship fit", v: "Worth applying",    t: "text-gray-700"    },
                    { k: "Family verdict",  v: "Worth considering", t: "text-violet-700 font-semibold" },
                  ].map((r) => (
                    <tr key={r.k}>
                      <td className="py-3 text-gray-600">{r.k}</td>
                      <td className={`py-3 text-right ${r.t}`}>{r.v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-gray-400 mt-5">Decision-support estimate. Verify final fees, eligibility and visa rules with the university.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── DESTINATIONS — 12 country cards (deep page at /destinations) ───── */}
      <section id="destinations" className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="max-w-3xl mb-14 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Destinations</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Twelve countries.<br />
              One <span className="italic font-medium text-violet-700">verified-source</span> database.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Every destination on EduvianAI carries the same standard: live URL fetch, no invented values, blank fields where the official page is silent. Tap any country to see universities, fees and visa rules.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {COUNTRIES.map((c) => {
              const uniCount = (universitiesByCountry[c.name] || []).length;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCountry(c.name)}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    decoding="async"
                    width="300"
                    height="375"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1119]/80 via-[#0E1119]/15 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                    <p className="text-2xl mb-1.5">{c.flag}</p>
                    <p className="font-display text-lg font-semibold tracking-tight leading-tight">{c.name}</p>
                    {uniCount > 0 && (
                      <p className="text-[11px] text-white/65 mt-0.5">{uniCount}+ universities</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href="/destinations" className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:gap-2 transition-all">
              See full destinations page <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── SCHOLARSHIPS — 8 marquee picks (deep page at /scholarships) ───── */}
      <section id="scholarships" className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="grid lg:grid-cols-12 gap-12 mb-12 sm:mb-14">
            <div className="lg:col-span-5">
              <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Scholarships</p>
              <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
                Money on the<br />table you can <span className="italic font-medium text-violet-700">claim</span>.
              </h2>
              <p className="text-lg text-gray-500 leading-relaxed mb-6">
                Eight marquee scholarships across our destination countries — from Fulbright and Chevening to DAAD and Australia Awards. Hundreds more sit inside individual university pages.
              </p>
              <Link
                href="/scholarships"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-violet-700 transition-colors"
              >
                See full per-country list <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="lg:col-span-7">
              <ul className="divide-y divide-stone-200 border-y border-stone-200">
                {SCHOLARSHIP_HIGHLIGHTS.map((s) => (
                  <li key={s.name} className="grid grid-cols-12 gap-3 sm:gap-5 py-5 items-baseline">
                    <span className="col-span-2 sm:col-span-1 text-xl">{s.flag}</span>
                    <div className="col-span-10 sm:col-span-7">
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">{s.country}</p>
                      <p className="text-sm sm:text-base font-display font-semibold text-gray-900 leading-snug">{s.name}</p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.note}</p>
                    </div>
                    <div className="col-span-12 sm:col-span-4 sm:text-right">
                      <span className="inline-block text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-3 py-1">
                        {s.cover}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-28 sm:py-40 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-8">Free to try · no account needed</p>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-8 max-w-4xl mx-auto text-gray-900">
            From your first shortlist<br />
            to your <span className="italic font-medium text-violet-700">final visa step</span>.
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-12">
            Match programs, strengthen your application, prepare for the interview, compare offers, and file the visa — with verified data at every step.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            <Link
              href="/get-started"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-200"
            >
              Find my best-fit programs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/parent-decision"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-gray-300 text-gray-900 text-sm font-semibold hover:border-gray-500 transition-colors"
            >
              Generate the family report
            </Link>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 grid sm:grid-cols-2 gap-6 items-center text-gray-500">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-gray-900">eduvianAI</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:justify-end">
            <Link href="#journey"      className="hover:text-gray-900 transition-colors">Stages</Link>
            <Link href="#outputs"      className="hover:text-gray-900 transition-colors">Outputs</Link>
            <Link href="#destinations" className="hover:text-gray-900 transition-colors">Destinations</Link>
            <Link href="#scholarships" className="hover:text-gray-900 transition-colors">Scholarships</Link>
            <Link href="#principles"   className="hover:text-gray-900 transition-colors">Principles</Link>
            <Link href="/match"        className="hover:text-gray-900 transition-colors">Find my programs</Link>
            <span className="hidden sm:inline">·</span>
            <span className="text-gray-400 text-[11px]">Decision-support · not professional advice</span>
          </div>
        </div>
      </footer>

      <CountryModal countryName={selectedCountry} onClose={() => setSelectedCountry(null)} />
      <ChatWidget />
    </div>
  );
}

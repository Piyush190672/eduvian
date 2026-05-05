"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowUpRight, GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react";
import { DB_STATS, universitiesByCountry } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";
import CountryModal from "@/components/CountryModal";

// Each stage card carries: stage name + user situation + one-line benefit
// + one sample output + one primary CTA. Methodology / data-source notes
// surface inside a "Why this is reliable" disclosure rather than inline.
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
    n: "01", label: "Match",
    title: "No idea where to apply?",
    benefit: "Get a Safe, Reach and Ambitious shortlist based on your profile.",
    sample: { kind: "tier", safe: 6, reach: 9, ambitious: 5 },
    cta: "Find my best-fit programs",
    trust: "Verified against each university's official program page (e.g. ox.ac.uk, mit.edu, daad.de) — fees, deadlines and English cutoffs read live from source.",
    href: "/get-started",
  },
  {
    n: "02", label: "Check",
    title: "Got a shortlist — is my application strong enough?",
    benefit: "Score and rebuild your SOP, CV and LORs across structured dimensions.",
    sample: { kind: "score", a: { label: "Before", v: 61 }, b: { label: "After", v: 84 } },
    cta: "Check my application",
    trust: "Scored across 7 SOP dimensions and 6 CV dimensions — story arc, specificity, goal alignment, credibility flags. Feedback is paragraph-level, not generic.",
    href: "/application-check",
  },
  {
    n: "03", label: "Practice",
    title: "Need to prepare for interviews and English tests?",
    benefit: "Mock AU/UK admissions and US F-1 visa interviews, plus IELTS / TOEFL / PTE / DET practice.",
    sample: { kind: "stat", v: "14 / 14", l: "UK credibility questions coached" },
    cta: "Practise my interview",
    trust: "Exam-style practice based on published test structures: IELTS band descriptors and TOEFL ETS guidelines.",
    href: "/interview-prep",
    secondary: { cta: "English Test Lab", href: "/english-test-lab" },
  },
  {
    n: "04", label: "Decide",
    title: "Got my offer — should I accept?",
    benefit: "Compare offers on payback, 10-year ROI and total cost.",
    sample: { kind: "stat", v: "4.8 yrs", l: "Median payback period" },
    cta: "Run the numbers",
    trust: "Salary benchmarks drawn from HESA LEO, Russell Group Graduate Outcomes, QS Top Universities Salary Reports, OECD and LinkedIn Salary Insights.",
    href: "/roi-calculator",
  },
  {
    n: "05", label: "Apply",
    title: "Accepted — what about the visa?",
    benefit: "Country-specific checklists, financial-proof rules and risk flags for 12 student visas.",
    sample: { kind: "stat", v: "12", l: "Visa playbooks (F-1 · UK · SDS · 500 · D · 7 more)" },
    cta: "Open Visa Coach",
    trust: "Visa playbooks link out to the official government source page (travel.state.gov, gov.uk, Canada IRCC, immi.gov.au and equivalents).",
    href: "/visa-coach",
    secondary: { cta: "Track applications (Kanban)", href: "/application-tracker" },
  },
];

const PRINCIPLES = [
  { n: "01", t: "Verified at source",          p: `Every fee, deadline and cutoff fetched live from the official university page. ${DB_STATS.verifiedProgramsLabel} programs.` },
  { n: "02", t: "Independent",                 p: "No university commissions. No marketing deals. Recommendations are based on your profile, goals, budget, and fit — not commercial preference." },
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

type Level = "Low" | "Medium" | "High";
type PSWLevel = "Strong" | "Medium" | "Limited";

interface CountryCard {
  flag: string;
  name: string;
  img: string;
  cost: Level;
  psw: PSWLevel;
  visa: Level;
  bestFor: string;
}

const COUNTRIES: CountryCard[] = [
  { flag: "🇺🇸", name: "USA",         img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=600&q=80", cost: "High",   psw: "Strong",  visa: "Medium", bestFor: "AI · CS · Finance · Engineering" },
  { flag: "🇬🇧", name: "UK",          img: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=600&q=80", cost: "High",   psw: "Strong",  visa: "Medium", bestFor: "Business · AI · Finance · Health" },
  { flag: "🇨🇦", name: "Canada",      img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=600&q=80", cost: "Medium", psw: "Strong",  visa: "Medium", bestFor: "CS · Healthcare · Engineering · Business" },
  { flag: "🇦🇺", name: "Australia",   img: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=600&q=80", cost: "High",   psw: "Strong",  visa: "Medium", bestFor: "Healthcare · Engineering · Business · Education" },
  { flag: "🇩🇪", name: "Germany",     img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=600&q=80", cost: "Low",    psw: "Strong",  visa: "Medium", bestFor: "Engineering · AI · Automotive · CS" },
  { flag: "🇳🇱", name: "Netherlands", img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=600&q=80", cost: "Medium", psw: "Strong",  visa: "Low",    bestFor: "Engineering · AI · Agri-tech · Business" },
  { flag: "🇮🇪", name: "Ireland",     img: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=600&q=80", cost: "Medium", psw: "Strong",  visa: "Low",    bestFor: "AI · CS · Pharma · Finance" },
  { flag: "🇫🇷", name: "France",      img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80", cost: "Medium", psw: "Strong",  visa: "Medium", bestFor: "Business · Fashion · AI · Engineering" },
  { flag: "🇳🇿", name: "New Zealand", img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80", cost: "Medium", psw: "Strong",  visa: "Low",    bestFor: "Healthcare · Agri-tech · Engineering · IT" },
  { flag: "🇸🇬", name: "Singapore",   img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80", cost: "High",   psw: "Limited", visa: "Low",    bestFor: "Finance · AI · CS · Business" },
  { flag: "🇲🇾", name: "Malaysia",    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=600&q=80", cost: "Low",    psw: "Limited", visa: "Low",    bestFor: "Engineering · Business · Medicine · IT" },
  { flag: "🇦🇪", name: "UAE",         img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80", cost: "Medium", psw: "Limited", visa: "Low",    bestFor: "Business · Engineering · Hospitality · Aviation" },
];

// Semantic colour for each decision-signal level. For cost / visa: Low is good
// (lower friction), High is bad. For post-study work: Strong is good, Limited
// is bad. Tailwind picks these literal class strings up at build time.
function levelClass(kind: "cost" | "visa", val: Level): string;
function levelClass(kind: "psw", val: PSWLevel): string;
function levelClass(kind: "cost" | "visa" | "psw", val: string): string {
  if (kind === "psw") {
    if (val === "Strong")  return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (val === "Medium")  return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-rose-700 bg-rose-50 border-rose-200"; // Limited
  }
  // cost or visa: Low → good, Medium → warn, High → bad
  if (val === "Low")    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (val === "Medium") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

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
  // Hero RHS shows one sample card at a time, auto-rotating every 3s.
  const [heroCard, setHeroCard] = useState(0);
  const HERO_CARD_COUNT = 4;
  useEffect(() => {
    const id = setTimeout(() => setActiveDemo((d) => (d + 1) % DEMOS.length), 5000);
    return () => clearTimeout(id);
  }, [activeDemo]);
  useEffect(() => {
    const id = setInterval(() => setHeroCard((c) => (c + 1) % HERO_CARD_COUNT), 3000);
    return () => clearInterval(id);
  }, []);

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
              <Sparkles className="w-3 h-3" /> Independent · source-verified · AI-powered
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

          {/* RHS: ONE sample card at a time, auto-rotating every 3s.
              Same 4 cards as before (Shortlist · App Score · ROI · Visa)
              but only one renders at any moment. Palette stays violet +
              emerald/amber/rose semantic per the v2 spec. */}
          <div className="lg:col-span-5 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-3 px-1">
              Sample output {heroCard + 1} of {HERO_CARD_COUNT} · illustrative
            </p>

            <div className="relative min-h-[340px] sm:min-h-[360px]">
              {heroCard === 0 && (
                <div key="card-shortlist" className="bg-white rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
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
              )}

              {heroCard === 1 && (
                <div key="card-appscore" className="bg-white rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Application Score</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">+23 pts ↑</span>
                  </div>
                  <div className="space-y-3 mt-4">
                    {[
                      { label: "Before",   pct: 61, color: "bg-rose-400"   },
                      { label: "After AI", pct: 84, color: "bg-violet-500" },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-xs text-gray-500 font-semibold">{b.label}</span>
                          <span className="text-xs font-bold text-gray-700 tabular-nums">{b.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: "Story arc",     v: "Strong",     tone: "good" },
                      { l: "Specificity",   v: "Needs work", tone: "warn" },
                      { l: "Goal alignment", v: "Strong",    tone: "good" },
                    ].map((d) => (
                      <div key={d.l}>
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mb-1">{d.l}</p>
                        <p className={`text-[10px] font-bold ${d.tone === "good" ? "text-emerald-700" : "text-amber-700"}`}>{d.v}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-50">7 SOP dimensions + 6 CV dimensions scored</p>
                </div>
              )}

              {heroCard === 2 && (
                <div key="card-roi" className="bg-white rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ROI · Payback period</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">2 offers compared</span>
                  </div>
                  <div className="space-y-3 mt-3">
                    {[
                      { label: "UCL London",         yrs: "3.2 yrs", pct: 32, color: "bg-emerald-500", best: true  },
                      { label: "Univ. of Edinburgh", yrs: "4.8 yrs", pct: 48, color: "bg-amber-400",   best: false },
                      { label: "Univ. of Melbourne", yrs: "5.8 yrs", pct: 58, color: "bg-rose-400",    best: false },
                    ].map((b) => (
                      <div key={b.label}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs ${b.best ? "font-bold text-gray-900" : "text-gray-500"}`}>{b.best ? "★ " : ""}{b.label}</span>
                          <span className={`text-xs font-bold tabular-nums ${b.best ? "text-emerald-700" : "text-gray-500"}`}>{b.yrs}</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                    <p className="text-xs font-semibold text-emerald-800">★ UCL recovers 2.6 years faster than Melbourne</p>
                  </div>
                </div>
              )}

              {heroCard === 3 && (
                <div key="card-visa" className="bg-white rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visa Coach · 12 countries</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">F-1 · UK · SDS · 500 +8</span>
                  </div>
                  <div className="space-y-2 mt-3">
                    {[
                      { flag: "🇺🇸", name: "F-1 (USA)",     detail: "I-20 ready · $185 MRV",      risk: "low",  rc: "text-emerald-700", rb: "bg-emerald-50 border-emerald-200" },
                      { flag: "🇬🇧", name: "UK Student",    detail: "CAS · £558 IHS",             risk: "low",  rc: "text-emerald-700", rb: "bg-emerald-50 border-emerald-200" },
                      { flag: "🇨🇦", name: "SDS (Canada)",  detail: "CAD 22,895 GIC",             risk: "med",  rc: "text-amber-700",   rb: "bg-amber-50 border-amber-200"     },
                      { flag: "🇦🇺", name: "AUS 500",       detail: "GTE statement required",      risk: "flag", rc: "text-rose-700",    rb: "bg-rose-50 border-rose-200"       },
                    ].map((v) => (
                      <div key={v.name} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-base flex-shrink-0">{v.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-900 truncate">{v.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{v.detail}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${v.rb} ${v.rc}`}>{v.risk}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] font-bold text-violet-700 mt-3 pt-2 border-t border-gray-50">Official-source checklists · risk flags · apply links</p>
                </div>
              )}
            </div>

            {/* dot indicators */}
            <div className="mt-4 flex items-center gap-2 px-1">
              {Array.from({ length: HERO_CARD_COUNT }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setHeroCard(i)}
                  aria-label={`Show sample ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === heroCard ? "w-8 bg-violet-400" : "w-3 bg-white/20 hover:bg-white/30"
                  }`}
                />
              ))}
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

      {/* ───── BUILT FOR BOTH SIDES — directly under hero ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <div className="max-w-3xl mb-12 sm:mb-16">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-4">Built for both sides of the table</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1] mb-5">
              One platform. <span className="italic font-medium text-violet-700">Two audiences.</span> Same verified data.
            </h2>
            <p className="text-base sm:text-lg text-gray-500 leading-relaxed">
              Students choose their best-fit path. Parents decide if it's worth the cost. EduvianAI answers the questions each side is actually asking — from the same source-verified dataset.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            {/* For students */}
            <div className="group relative flex flex-col rounded-3xl bg-white border border-stone-200 p-8 sm:p-10 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.22)] hover:shadow-[0_36px_64px_-16px_rgba(124,58,237,0.25)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent" />
              <span aria-hidden className="hidden md:block pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-violet-100/60 blur-2xl" />
              <div className="relative flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-200">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-bold">For students</p>
              </div>
              <h3 className="relative font-display text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 leading-snug mb-5">
                Find the right course. File a stronger application. Walk into the interview prepared.
              </h3>
              <p className="relative text-base text-gray-500 leading-relaxed mb-7 max-w-md">
                AI-matched shortlist, paragraph-level feedback on your SOP and CV, and exam-style practice for every interview and English test.
              </p>
              <Link
                href="/get-started"
                className="relative inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:gap-3 transition-all"
              >
                Start with my profile <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* For parents */}
            <div className="group relative flex flex-col rounded-3xl bg-white border border-stone-200 p-8 sm:p-10 shadow-[0_24px_48px_-16px_rgba(15,23,42,0.22)] hover:shadow-[0_36px_64px_-16px_rgba(5,150,105,0.22)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
              <span aria-hidden className="hidden md:block pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-100/60 blur-2xl" />
              <div className="relative flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-bold">For parents</p>
              </div>
              <h3 className="relative font-display text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 leading-snug mb-5">
                Cost, ROI, safety, visa readiness, and long-term value — on one page.
              </h3>
              <p className="relative text-base text-gray-500 leading-relaxed mb-7 max-w-md">
                A one-page Parent Decision Report with payback period, visa risk flags by country, and a colour-coded family verdict — easy to share, easier to discuss.
              </p>
              <Link
                href="/sample-parent-report"
                className="relative inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:gap-3 transition-all"
              >
                See a sample report <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
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
          <div className="mt-12 sm:mt-14">
            <Link
              href="/methodology"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:gap-2 transition-all"
            >
              How we verify program data <ArrowUpRight className="w-4 h-4" />
            </Link>
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
                    className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-violet-700 transition-colors mb-4"
                  >
                    or {s.secondary.cta} →
                  </Link>
                )}
                {!s.secondary && <div className="mb-4" />}
                <details className="mt-auto pt-3 border-t border-stone-100 group/why">
                  <summary className="cursor-pointer list-none inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-400 hover:text-violet-700 transition-colors">
                    <ShieldCheck className="w-3 h-3 text-emerald-600/80" />
                    Why this is reliable
                  </summary>
                  <p className="mt-2 text-[11px] text-gray-500 leading-snug">{s.trust}</p>
                </details>
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
                Create a parent-ready decision report
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {COUNTRIES.map((c) => {
              const uniCount = (universitiesByCountry[c.name] || []).length;
              const signals: { k: string; v: string; cls: string }[] = [
                { k: "Cost",            v: c.cost, cls: levelClass("cost", c.cost) },
                { k: "Post-study work", v: c.psw,  cls: levelClass("psw",  c.psw)  },
                { k: "Visa complexity", v: c.visa, cls: levelClass("visa", c.visa) },
              ];
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCountry(c.name)}
                  className="group flex flex-col rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-violet-200 transition-all text-left"
                >
                  {/* image header */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.img}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      width="400"
                      height="225"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E1119]/70 via-[#0E1119]/15 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-4 text-white flex items-end justify-between">
                      <div>
                        <p className="text-xl mb-0.5">{c.flag}</p>
                        <p className="font-display text-lg font-semibold tracking-tight leading-tight">{c.name}</p>
                      </div>
                      {uniCount > 0 && (
                        <span className="text-[11px] font-bold text-white/85 tabular-nums bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                          {uniCount}+ unis
                        </span>
                      )}
                    </div>
                  </div>

                  {/* decision-signals panel */}
                  <div className="flex-1 p-5 space-y-3">
                    {signals.map((s) => (
                      <div key={s.k} className="flex items-center justify-between gap-3">
                        <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">{s.k}</span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.v}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-stone-100">
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">Best for</p>
                      <p className="text-xs text-gray-700 leading-snug">{c.bestFor}</p>
                    </div>
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
              Create a parent-ready decision report
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

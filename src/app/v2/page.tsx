"use client";

/**
 * /v2 — design-language prototype, round 3.
 *
 * User direction:
 *   Premium AI advisor + youthful student energy + parent-grade credibility.
 *   Clean white/off-white base, deep navy/charcoal selectively, electric
 *   purple accent for AI feel (selective). Semantic palette enforced:
 *   emerald=safe, amber=medium risk, rose=risk. Real dashboard outputs.
 *
 * Card pattern (every stage card on the homepage follows this):
 *   1. Title
 *   2. One-line benefit
 *   3. Sample output (a small concrete example, not a description)
 *   4. CTA
 *   5. Trust cue (one short line that says why this is reliable)
 */

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowRight, ArrowUpRight, ShieldCheck, Sparkles } from "lucide-react";
import { DB_STATS, universitiesByCountry } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";
import CountryModal from "@/components/CountryModal";

const STAGES = [
  {
    n: "01", label: "Match",
    title: "Find your best-fit programs",
    benefit: "AI-matched shortlist from the verified database, in 2 minutes.",
    sample: { kind: "tier", safe: 6, reach: 9, ambitious: 5 },
    cta: "Find my programs",
    trust: "Match is built only on verified-at-source program data.",
    href: "/get-started",
  },
  {
    n: "02", label: "Check",
    title: "Strengthen your application",
    benefit: "SOP scored, CV rebuilt, pack-checked for credibility gaps.",
    sample: { kind: "score", a: { label: "Before", v: 61 }, b: { label: "After", v: 84 } },
    cta: "Check my application",
    trust: "Scoring rubric is the same one universities use.",
    href: "/application-check",
  },
  {
    n: "03", label: "Practice",
    title: "Walk in already prepared",
    benefit: "Mock visa interviews for AU, UK, US — plus IELTS, PTE, DET, TOEFL.",
    sample: { kind: "stat", v: "14 / 14", l: "UK credibility questions coached" },
    cta: "Practise my interview",
    trust: "Question banks built from current consulate guidance.",
    href: "/interview-prep",
  },
  {
    n: "04", label: "Decide",
    title: "Choose with your family",
    benefit: "ROI, payback, safety, scholarships — and a one-page parent-ready report.",
    sample: { kind: "stat", v: "4.8 yrs", l: "Median payback period" },
    cta: "Compare offers",
    trust: "Salary + cost data sourced from official statistics offices.",
    href: "/roi-calculator",
  },
  {
    n: "05", label: "Apply",
    title: "File the visa, first time right",
    benefit: "Country-specific checklists, financial-proof rules, deadline countdowns.",
    sample: { kind: "stat", v: "12", l: "Visa playbooks (F-1 · UK · SDS · 500 · D · 7 more)" },
    cta: "Open Visa Coach",
    trust: "Every figure linked to the official government page.",
    href: "/visa-coach",
  },
];

const PRINCIPLES = [
  { n: "01", t: "Verified at source",          p: `Every fee, deadline and cutoff fetched live from the official university page. ${DB_STATS.verifiedProgramsLabel} programs.` },
  { n: "02", t: "Independent",                 p: "No university commissions. No marketing deals. The recommendation is yours, not someone else's quota." },
  { n: "03", t: "Structured, not guesswork",   p: "Same data-driven analysis for every student. Fit, budget, requirements, outcomes — not convenience." },
  { n: "04", t: "Transparent by design",       p: "Decision-support estimates. Always verify final figures with the university before committing." },
];

const DEMOS = [
  { i: 0, label: "University Match",     sub: "Your personalised Top 20 shortlist",  accent: "border-violet-500"  },
  { i: 1, label: "SOP Check",            sub: "AI feedback across 7 dimensions",     accent: "border-indigo-500"  },
  { i: 2, label: "Interview Coach",      sub: "Voice + text mock with AI scoring",   accent: "border-emerald-500" },
  { i: 3, label: "ROI Analysis",         sub: "Payback period and 10-year ROI",      accent: "border-amber-500"   },
  { i: 4, label: "Visa Apply",           sub: "Country checklist + risk flags",      accent: "border-sky-500"     },
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
function StageSample({ s }: { s: typeof STAGES[number]["sample"] }) {
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
    return (
      <div className="space-y-2">
        {[s.a, s.b].map((row, i) => (
          <div key={row.label}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-gray-500">{row.label}</span>
              <span className={`tabular-nums font-semibold ${i === 0 ? "text-gray-500" : "text-emerald-700"}`}>{row.v}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-stone-200 overflow-hidden">
              <div className={`h-full rounded-full ${i === 0 ? "bg-stone-400" : "bg-emerald-500"}`} style={{ width: `${row.v}%` }} />
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-300/70 hidden sm:inline">v2 prototype</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/v2#journey"      className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Journey</Link>
            <Link href="/v2#outputs"      className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Outputs</Link>
            <Link href="/v2#destinations" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Destinations</Link>
            <Link href="/v2#scholarships" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Scholarships</Link>
            <Link href="/v2#principles"   className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Principles</Link>
            <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">Original →</Link>
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
              Choose your <span className="italic font-medium text-violet-300">study abroad path</span> with verified data you can trust.
            </h1>
            <p className="text-lg sm:text-xl text-white/65 leading-relaxed max-w-2xl mb-10">
              EduvianAI gives students and families an independent, data-backed layer of clarity before they make high-stakes study abroad decisions.
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
                href="/parent-decision"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white/85 text-sm font-semibold hover:border-white/40 hover:text-white transition-colors"
              >
                Generate the family report
              </Link>
            </div>
          </div>

          {/* RHS: sample shortlist dashboard (no photograph) */}
          <div className="lg:col-span-5">
            <div className="bg-white text-gray-900 rounded-2xl shadow-2xl shadow-black/40 border border-stone-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-violet-700">AI Shortlist · sample output</p>
                  <p className="text-sm font-display font-semibold text-gray-900 mt-0.5">Top 20 personalised programs</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">9 signals matched</span>
              </div>
              <div className="px-5 py-3">
                {SAMPLE_SHORTLIST.map((r) => {
                  const tierCls = r.tier === "safe" ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                              : r.tier === "reach" ? "text-amber-700 bg-amber-50 border-amber-100"
                                                    : "text-rose-700 bg-rose-50 border-rose-100";
                  const barCls  = r.tier === "safe" ? "bg-emerald-500"
                              : r.tier === "reach" ? "bg-amber-500"
                                                    : "bg-rose-500";
                  return (
                    <div key={r.name} className="flex items-center gap-3 py-2.5 border-b border-stone-100 last:border-0">
                      <span className="text-base flex-shrink-0">{r.flag}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{r.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{r.prog}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1 rounded-full bg-stone-200 overflow-hidden">
                            <div className={`h-full rounded-full ${barCls}`} style={{ width: `${r.pct}%` }} />
                          </div>
                          <span className="text-[10px] tabular-nums font-bold text-gray-700">{r.pct}%</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${tierCls} flex-shrink-0`}>
                        {r.tier === "safe" ? "Safe" : r.tier === "reach" ? "Reach" : "Ambitious"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                <p className="text-[11px] text-gray-500">Showing 5 of 20 · {DB_STATS.verifiedProgramsLabel} verified-source programs</p>
                <Link href="/get-started" className="text-[11px] font-bold text-violet-700 inline-flex items-center gap-1">
                  View all <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom trust strip — single editorial line */}
        <div className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[12px] text-white/55">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              <span>Independent · no university commission</span>
            </div>
            <span className="hidden sm:inline">{DB_STATS.verifiedProgramsLabel} programs · {DB_STATS.verifiedUniversitiesLabel} universities · {DB_STATS.countriesLabel} countries</span>
            <span className="hidden sm:inline text-white/45">Decision-support estimates · always confirm with the university</span>
          </div>
        </div>
      </section>

      {/* ───── PARENT/STUDENT STRIP — directly under hero ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 sm:py-16 grid sm:grid-cols-2 gap-6 sm:gap-10">
          <div className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-3">For students</p>
            <p className="font-display text-lg sm:text-xl text-gray-900 leading-snug">
              Find the right-fit course, improve your application, prepare for interviews.
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-stone-200 p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-semibold mb-3">For parents</p>
            <p className="font-display text-lg sm:text-xl text-gray-900 leading-snug">
              Compare cost, ROI, safety, visa readiness, and long-term value.
            </p>
          </div>
        </div>
      </section>

      {/* ───── STAT BAND ───── */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-8">By the numbers</p>
          <div className="grid sm:grid-cols-3 gap-y-10 gap-x-12">
            {[
              { v: DB_STATS.verifiedProgramsLabel, l: "Verified programs",      sub: "Every figure fetched live from the official university page." },
              { v: "9",                            l: "Most Important Signals", sub: "Academic, budget, English, intake, scholarship, work-ex, std test, backlogs, gap." },
              { v: DB_STATS.countriesLabel,        l: "Destination countries",  sub: "USA, UK, Canada, Australia, Germany, NL, Ireland, France, NZ, Singapore, Malaysia, UAE." },
            ].map((s) => (
              <div key={s.l} className="border-l-2 border-violet-600 pl-6">
                <p className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-gray-900 mb-2 leading-none">{s.v}</p>
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
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 group-hover:gap-2 transition-all mb-3"
                >
                  {s.cta}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
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
                  <div className="space-y-4">
                    {[
                      { dim: "Story arc",          v: "Strong",      tone: "good" },
                      { dim: "Specificity",        v: "Needs work",  tone: "warn" },
                      { dim: "Cliché check",       v: "2 flagged",   tone: "warn" },
                      { dim: "Goal alignment",     v: "Strong",      tone: "good" },
                      { dim: "Overall tier",       v: "Top 30%",     tone: "verdict" },
                    ].map((r) => (
                      <div key={r.dim} className="flex items-center justify-between py-3 border-b border-stone-200/70 last:border-0">
                        <span className="text-sm text-gray-600">{r.dim}</span>
                        <span className={`text-sm font-bold ${
                          r.tone === "good" ? "text-emerald-700" :
                          r.tone === "warn" ? "text-amber-700"   :
                                              "text-violet-700"
                        }`}>{r.v}</span>
                      </div>
                    ))}
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
                  <div className="space-y-4">
                    {[
                      { l: "UCL London",         yrs: "3.2 yrs", best: true },
                      { l: "Univ. of Edinburgh", yrs: "4.8 yrs" },
                      { l: "Univ. of Melbourne", yrs: "5.8 yrs" },
                    ].map((b) => (
                      <div key={b.l}>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className={`text-sm ${b.best ? "font-bold text-gray-900" : "text-gray-600"}`}>{b.best ? "★ " : ""}{b.l}</span>
                          <span className={`text-sm font-semibold tabular-nums ${b.best ? "text-emerald-700" : "text-gray-500"}`}>{b.yrs}</span>
                        </div>
                        <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div className={`h-full rounded-full ${b.best ? "bg-emerald-500" : "bg-stone-400"}`} style={{ width: b.best ? "32%" : b.l.includes("Edinburgh") ? "48%" : "58%" }} />
                        </div>
                      </div>
                    ))}
                    <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/70 p-4 mt-4">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-1">★ EduvianAI recommendation</p>
                      <p className="text-sm text-gray-800">UCL London — pays back 2.6 years faster than Melbourne.</p>
                    </div>
                  </div>
                )}

                {activeDemo === 4 && (
                  <div className="space-y-3">
                    <div className="bg-sky-50/70 rounded-xl border border-sky-200/70 p-4 mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-sky-700 font-bold mb-1">UK Student visa · London</p>
                      <p className="text-sm text-gray-800">£1,483 / month × 9 months = <span className="font-bold">£13,347</span> held for 28+ days.</p>
                    </div>
                    {[
                      { ok: true,  l: "Passport · 6+ months validity" },
                      { ok: true,  l: "CAS letter from UCL" },
                      { ok: true,  l: "Financial proof in account" },
                      { ok: true,  l: "TB test certificate" },
                      { ok: false, l: "ATAS clearance · pending" },
                    ].map((c) => (
                      <div key={c.l} className="flex items-center gap-3 py-2 border-b border-stone-200/70 last:border-0">
                        <span className="text-base flex-shrink-0">{c.ok ? "✅" : "⏳"}</span>
                        <span className={`text-sm ${c.ok ? "text-gray-700" : "text-amber-700"}`}>{c.l}</span>
                      </div>
                    ))}
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
              The same facts<br />on both sides of the table.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
              The Parent Decision Report is one page. Seven factors. Color-coded verdicts. Easy to share over WhatsApp; easier to discuss at the dinner table.
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

      {/* ───── DESTINATIONS ───── */}
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
        </div>
      </section>

      {/* ───── SCHOLARSHIPS ───── */}
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
                href="/"
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
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-700">v2 prototype</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:justify-end">
            <Link href="/" className="hover:text-gray-900 transition-colors">Original homepage →</Link>
            <Link href="/v2#journey"      className="hover:text-gray-900 transition-colors">Journey</Link>
            <Link href="/v2#outputs"      className="hover:text-gray-900 transition-colors">Outputs</Link>
            <Link href="/v2#destinations" className="hover:text-gray-900 transition-colors">Destinations</Link>
            <Link href="/v2#scholarships" className="hover:text-gray-900 transition-colors">Scholarships</Link>
            <Link href="/v2#principles"   className="hover:text-gray-900 transition-colors">Principles</Link>
            <Link href="/get-started"     className="hover:text-gray-900 transition-colors">Get started</Link>
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

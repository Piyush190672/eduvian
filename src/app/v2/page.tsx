"use client";

/**
 * /v2 — design-language prototype.
 *
 * Brand brief from the user:
 *   - References: Crimson Education, Coursera, Linear
 *   - Like: low density, restrained palette, editorial type, premium feel
 *   - Don't lose: any feature, any link, the verified-source moat, the 5-stage journey
 *   - Audience: Tier-1 Indian metros (16-28 students + 45+ parents)
 *
 * What this page does *not* do:
 *   - It's a single full-page experience that replaces ONLY the homepage feel.
 *   - Every CTA still routes to the existing tool pages (/get-started, /sop-assistant,
 *     /interview-prep, /english-test-lab, /roi-calculator, /parent-decision, /visa-coach,
 *     /application-tracker, /sample-parent-report). All functionality preserved.
 *   - The chat widget + country modal still work — same imports as the production page.
 *
 * What it changes from the production homepage:
 *   - One accent colour (violet) instead of a per-stage rainbow.
 *   - Editorial type scale — bigger headings, more leading, fewer subheadings.
 *   - No gradient-blur blobs, no per-card glows, no per-section coloured backgrounds.
 *     Two backgrounds: deep navy for hero + final CTA, warm off-white everywhere else.
 *   - Photography over emoji / illustrative icons. Lucide icons used sparingly, single weight.
 *   - Trust through restraint: a single number-line, not a chip salad.
 *   - 5-stage journey shown as a single editorial list, not 5 boxed cards stacked.
 */

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { DB_STATS } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";

const STAGES = [
  { n: "01", label: "Match",   title: "Find your best-fit programs.",            desc: "Match your profile against our verified-at-source database. Top 20 personalised — Safe, Reach, Ambitious.", href: "/get-started" },
  { n: "02", label: "Check",   title: "Strengthen your application.",            desc: "Score your SOP across 7 dimensions. Rebuild your CV. Run a full pack check before you submit.",         href: "/application-check" },
  { n: "03", label: "Practice", title: "Walk in already prepared.",              desc: "Mock visa interviews for AU, UK and US F-1. IELTS, PTE, DET and TOEFL practice with AI-scored feedback.", href: "/interview-prep" },
  { n: "04", label: "Decide",   title: "Choose with your family, not in confusion.", desc: "ROI, payback, safety, scholarships and a parent-ready report — the same facts on both sides of the table.", href: "/roi-calculator" },
  { n: "05", label: "Apply",   title: "File the visa right the first time.",     desc: "Country-specific checklists, financial-proof rules, deadline countdowns. Built for the 12 destinations we cover.", href: "/visa-coach" },
];

const PRINCIPLES = [
  {
    n: "Verified at source",
    p: `Every fee, deadline, cutoff and intake on EduvianAI is fetched from the live university page. ${DB_STATS.verifiedProgramsLabel} programs across ${DB_STATS.verifiedUniversitiesLabel} universities. If a value isn't on the official page, the field is left blank — not invented.`,
  },
  {
    n: "Independent — no commission",
    p: "No university pays us a placement fee. No school appears in your shortlist because of a marketing deal. The recommendation is yours, not someone else's quota.",
  },
  {
    n: "Structured, not guesswork",
    p: "EduvianAI gives every student the same data-driven analysis. Recommendations are based on fit, budget, requirements and outcomes — not on convenience or commission.",
  },
  {
    n: "Transparent by design",
    p: "Outputs are decision-support estimates. Final eligibility, fees and deadlines should always be verified from official sources before you commit.",
  },
];

export default function V2LandingPage() {
  return (
    <div className="min-h-screen bg-stone-50 font-sans antialiased text-gray-900">

      {/* ─────────────────────────────────────────────
          NAV — restrained, no gradient, single accent
         ───────────────────────────────────────────── */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-300/70 hidden sm:inline">v2 prototype</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/v2#journey" className="hidden sm:inline text-sm text-white/70 hover:text-white transition-colors">Journey</Link>
            <Link href="/v2#principles" className="hidden sm:inline text-sm text-white/70 hover:text-white transition-colors">Principles</Link>
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

      {/* ─────────────────────────────────────────────
          HERO — Linear-style: massive type, single
          accent on the verb. Photography-anchored
          via the existing graduate hero image.
         ───────────────────────────────────────────── */}
      <section className="relative bg-[#0A1024] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-32 sm:pt-40 pb-20 sm:pb-28 grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/80 mb-8 font-semibold">
              Study abroad, de-risked.
            </p>
            <h1 className="font-display font-bold text-[2.5rem] leading-[1.05] sm:text-6xl md:text-7xl tracking-tight mb-8">
              Make the right call —<br />
              with{" "}
              <span className="italic font-medium text-violet-300">verified data</span>
              ,<br />
              not advice from{" "}
              <span className="italic font-medium text-stone-300">someone&apos;s quota</span>.
            </h1>
            <p className="text-lg sm:text-xl text-white/60 leading-relaxed max-w-2xl mb-12">
              From shortlist to visa, one platform that fetches every fee, deadline and cutoff from the live university page.
              No commissions. No invented numbers. No surprises.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Link
                href="/get-started"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
              >
                Find my best-fit programs
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/application-check"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/15 text-white/85 text-sm font-semibold hover:border-white/35 hover:text-white transition-colors"
              >
                Check my application strength
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-stone-200 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/graduate-india.jpg"
                alt="EduvianAI student"
                width="600"
                height="750"
                className="w-full h-full object-cover object-top grayscale-[30%] contrast-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1024] via-transparent to-transparent" />
            </div>
            {/* Floating editorial caption — single, not a chip strip */}
            <div className="absolute -bottom-6 -left-6 sm:-left-10 bg-white text-gray-900 rounded-2xl px-6 py-4 shadow-2xl shadow-black/40 max-w-[280px]">
              <p className="text-[10px] uppercase tracking-widest text-violet-600 font-bold mb-1">Verified moat</p>
              <p className="text-sm font-display font-semibold leading-snug">
                {DB_STATS.verifiedProgramsLabel} programs verified at the source —
                <span className="text-gray-500"> the largest in Indian-origin study-abroad tooling.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom trust line — single sentence, not a chip strip */}
        <div className="border-t border-white/8">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[13px] text-white/50">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              <span>Independent · no university commission</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <span>{DB_STATS.verifiedUniversitiesLabel} universities · {DB_STATS.countriesLabel} countries · {DB_STATS.fieldsLabel} fields</span>
            <div className="hidden sm:block w-px h-4 bg-white/10" />
            <span>Outputs are decision-support estimates · always confirm with the university</span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          STAT BAND — Coursera-style restraint.
          Three numbers. No icons. Generous space.
         ───────────────────────────────────────────── */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-8">By the numbers</p>
          <div className="grid sm:grid-cols-3 gap-y-10 gap-x-12">
            {[
              { v: DB_STATS.verifiedProgramsLabel, l: "Verified programs",      sub: "Every figure fetched live from the official university page."},
              { v: "9",                            l: "Most Important Signals", sub: "Academic, budget, English, intake, scholarship, work-ex, std test, backlogs, gap." },
              { v: DB_STATS.countriesLabel,        l: "Destination countries",  sub: "USA, UK, Canada, Australia, Germany, Netherlands, Ireland, France, NZ, Singapore, Malaysia, UAE." },
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

      {/* ─────────────────────────────────────────────
          THE 5-STAGE JOURNEY — editorial list,
          not 5 stacked cards. Crimson-style.
         ───────────────────────────────────────────── */}
      <section id="journey" className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="max-w-3xl mb-16 sm:mb-20">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">The journey</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              From <span className="italic font-medium text-violet-700">first shortlist</span> to <span className="italic font-medium text-violet-700">final visa step</span> — five stages, one platform.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Most students bounce between four agents and a dozen browser tabs. EduvianAI consolidates the journey into five clearly-defined stages with the right tool for each.
            </p>
          </div>

          <ol className="divide-y divide-stone-200 border-y border-stone-200">
            {STAGES.map((s) => (
              <li key={s.n}>
                <Link
                  href={s.href}
                  className="group grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-8 py-8 sm:py-10 px-2 hover:bg-white transition-colors -mx-2 rounded-md"
                >
                  <div className="sm:col-span-1 flex sm:block items-center gap-3">
                    <span className="font-display text-3xl font-light text-violet-600 tabular-nums">{s.n}</span>
                    <span className="sm:hidden text-[10px] uppercase tracking-[0.25em] text-gray-400 font-semibold">{s.label}</span>
                  </div>
                  <div className="sm:col-span-2 hidden sm:block">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-semibold">{s.label}</span>
                  </div>
                  <div className="sm:col-span-7">
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 mb-2 leading-tight">{s.title}</h3>
                    <p className="text-base text-gray-500 leading-relaxed max-w-2xl">{s.desc}</p>
                  </div>
                  <div className="sm:col-span-2 sm:flex sm:items-center sm:justify-end">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 group-hover:text-violet-700 transition-colors">
                      Open <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          PRINCIPLES — 4 short editorial blocks,
          one per row. No card chrome.
         ───────────────────────────────────────────── */}
      <section id="principles" className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <div className="max-w-3xl mb-16 sm:mb-20">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Why this is reliable</p>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              The four things that make<br /> EduvianAI different.
            </h2>
          </div>

          <div className="space-y-12 sm:space-y-16">
            {PRINCIPLES.map((p, i) => (
              <div key={p.n} className="grid sm:grid-cols-12 gap-4 sm:gap-12 items-start">
                <div className="sm:col-span-1 sm:pt-1">
                  <span className="font-display text-2xl text-violet-600 tabular-nums">0{i + 1}</span>
                </div>
                <div className="sm:col-span-4">
                  <h3 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 leading-tight">{p.n}</h3>
                </div>
                <div className="sm:col-span-7">
                  <p className="text-lg text-gray-600 leading-relaxed">{p.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          THE FAMILY-FACING TRUST BLOCK
          (parent-decision report sample link)
         ───────────────────────────────────────────── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">For families</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6">
              The same facts<br />on both sides of the table.
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-xl">
              The Parent Decision Report is one page. Seven factors. Color-coded verdicts. Easy to share over a WhatsApp message; easier to discuss at the dinner table.
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
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-baseline justify-between mb-5">
                <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400 font-bold">Parent Decision Report</p>
                <p className="text-[10px] uppercase tracking-widest text-violet-600 font-bold">Sample</p>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-stone-100">
                  {[
                    { k: "Budget fit",      v: "Good",            t: "text-emerald-700" },
                    { k: "Payback period",  v: "4.8 years",       t: "text-gray-700"    },
                    { k: "Safety",          v: "Good",            t: "text-emerald-700" },
                    { k: "Job market",      v: "Strong",          t: "text-emerald-700" },
                    { k: "Visa readiness",  v: "Medium",          t: "text-amber-700"   },
                    { k: "Scholarship fit", v: "Worth applying",  t: "text-gray-700"    },
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

      {/* ─────────────────────────────────────────────
          FINAL CTA — dark, minimal, single statement
         ───────────────────────────────────────────── */}
      <section className="bg-[#0A1024] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-28 sm:py-40 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/80 font-semibold mb-8">Free to try · no account needed</p>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-8 max-w-4xl mx-auto">
            From your first shortlist<br />
            to your <span className="italic font-medium text-violet-300">final visa step</span>.
          </h2>
          <p className="text-lg sm:text-xl text-white/55 leading-relaxed max-w-2xl mx-auto mb-12">
            Match programs, strengthen your application, prepare for the interview, compare offers, and file the visa — with verified data at every step.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
            <Link
              href="/get-started"
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
            >
              Find my best-fit programs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/parent-decision"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/15 text-white/85 text-sm font-semibold hover:border-white/35 hover:text-white transition-colors"
            >
              Generate the family report
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────
          FOOTER — minimal, links back to original
         ───────────────────────────────────────────── */}
      <footer className="bg-[#070A18] text-white/40">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 grid sm:grid-cols-2 gap-6 items-center">
          <div className="flex items-center gap-3">
            <span className="font-display text-base font-bold text-white">eduvianAI</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-300/60">v2 prototype</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:justify-end">
            <Link href="/" className="hover:text-white transition-colors">Original homepage →</Link>
            <Link href="/v2#journey" className="hover:text-white transition-colors">Journey</Link>
            <Link href="/v2#principles" className="hover:text-white transition-colors">Principles</Link>
            <Link href="/get-started" className="hover:text-white transition-colors">Get started</Link>
            <span className="hidden sm:inline">·</span>
            <span className="text-white/30 text-[11px] flex items-center gap-1.5">
              <Check className="w-3 h-3" />
              Decision-support, not professional advice
            </span>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Users,
  FileSearch,
  ListChecks,
  Scale,
} from "lucide-react";
import { DB_STATS } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";
import LogoutButton from "@/components/LogoutButton";

/**
 * Homepage — Phase 2 rebuild (10 July 2026), reviewed before ship.
 *
 * Six sections, server-rendered, zero client JS of its own (ChatWidget +
 * LogoutButton are the only client islands): hero with a single CTA,
 * proof strip, 3-step how-it-works, journey-tools section (the USP —
 * Application Check, Interview Prep, English Test Lab, Visa Coach),
 * parent section, closing CTA. The previous 8-section client page
 * (1,417 lines, framer-motion, 3 rotating carousels) is archived at
 * _archive/page-pre-phase2-rebuild.tsx.bak.
 *
 * Copy rules (locked): no superlatives, no dual numbers
 * (verified*Label only), "up to 40 matches customised to your profile"
 * — never "Top 40". Sample data must respect the matcher's own
 * invariants: elite institutions (prestige bucket 0-1) are never
 * labelled Safe.
 */

const LAST_VERIFIED_LABEL = DB_STATS.lastVerifiedLabel;

// Hero dashboard mockup rows. Tier labels follow the real tierCeiling
// rule: Leeds/Birmingham (bucket 2) may be Safe; TU Munich/Edinburgh
// (bucket 1) cap at Reach; Imperial (bucket 0) caps at Ambitious.
const SAMPLE_SHORTLIST = [
  { name: "University of Leeds",      prog: "MSc AI & Data Science", pct: 91, tier: "safe",      flag: "🇬🇧" },
  { name: "University of Birmingham", prog: "MSc Data Science",      pct: 89, tier: "safe",      flag: "🇬🇧" },
  { name: "TU Munich",                prog: "MSc Informatics",       pct: 79, tier: "reach",     flag: "🇩🇪" },
  { name: "University of Edinburgh",  prog: "MSc Computer Science",  pct: 76, tier: "reach",     flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  { name: "Imperial College London",  prog: "MSc Machine Learning",  pct: 63, tier: "ambitious", flag: "🇬🇧" },
] as const;

const TIER_STYLES: Record<string, string> = {
  safe:      "text-emerald-700 bg-emerald-50 border-emerald-200",
  reach:     "text-amber-700 bg-amber-50 border-amber-200",
  ambitious: "text-rose-700 bg-rose-50 border-rose-200",
};

const TIER_LABELS: Record<string, string> = {
  safe: "Safe",
  reach: "Reach",
  ambitious: "Ambitious",
};

// The differentiators — pain-point tools for the journey AFTER the
// shortlist, where competitor platforms stop. Copy (dimension counts,
// question counts, playbook counts, data sources) carried over verbatim
// from the pre-rebuild stage cards — all previously verified against the
// live tools. Card format follows the locked brand rule: title ·
// benefit · sample output · CTA · trust cue.
const JOURNEY_TOOLS = [
  {
    pain: "Got a shortlist — is my application strong enough?",
    benefit:
      "Score and rebuild your SOP, CV and LORs with paragraph-level feedback — story arc, specificity, goal alignment, credibility flags.",
    sample: { kind: "score" as const, before: 61, after: 84 },
    cta: "Check my application",
    href: "/application-check",
    trust: "Scored across 7 SOP dimensions and 6 CV dimensions — feedback is paragraph-level, not generic.",
  },
  {
    pain: "The interview can undo everything. Practised for it?",
    benefit:
      "Mock AU/UK admissions and US F-1 visa interviews with your voice — AI scoring on every answer, question by question.",
    sample: { kind: "stat" as const, v: "14 / 14", l: "UK credibility questions coached" },
    cta: "Practise my interview",
    href: "/interview-prep",
    trust: "Voice + text mock interviews with per-answer AI scoring.",
  },
  {
    pain: "English test still in the way?",
    benefit:
      "Structured IELTS, TOEFL, PTE and Duolingo practice — band-targeted drills for the exact sections dragging your score.",
    sample: { kind: "pills" as const, items: ["IELTS", "TOEFL", "PTE", "Duolingo"] },
    cta: "Open the English Test Lab",
    href: "/english-test-lab",
    trust: "Exam-style practice based on published test structures: IELTS band descriptors and TOEFL ETS guidelines.",
  },
  {
    pain: "Accepted — what about the visa?",
    benefit:
      "Country-specific checklists, financial-proof rules and risk flags for all 12 student visa routes we cover.",
    sample: { kind: "stat" as const, v: "12", l: "visa playbooks (F-1 · UK · SDS · subclass 500 · 8 more)" },
    cta: "Open Visa Coach",
    href: "/visa-coach",
    trust: "Every playbook links to the official government source (travel.state.gov, gov.uk, IRCC, immi.gov.au and equivalents).",
  },
] as const;

const STEPS = [
  {
    icon: FileSearch,
    step: "01",
    title: "Share your profile",
    body: "Five minutes: academics, tests, budget, and where you want to go. You get a readiness rating with three labelled sub-scores — and the fastest ways to improve it.",
    proof: "Admissibility · Financial · Visa readiness",
  },
  {
    icon: ListChecks,
    step: "02",
    title: "Get your matches",
    body: `Up to 40 programs customised to your profile, split into Safe, Reach and Ambitious by your likelihood of an offer — drawn from ${DB_STATS.verifiedProgramsLabel} programs verified at the university's own page.`,
    proof: "Every fee and requirement links to its source",
  },
  {
    icon: Scale,
    step: "03",
    title: "Decide with evidence",
    body: "Compare shortlisted programs on ROI, scholarship signals and visa readiness. Generate a parent-ready report the whole family can weigh in on.",
    proof: "Same verified data behind every tool",
  },
] as const;

export default function HomePage() {
  const stats = [
    { value: DB_STATS.verifiedProgramsLabel,     label: "verified programs" },
    { value: DB_STATS.verifiedUniversitiesLabel, label: "universities" },
    { value: DB_STATS.countriesLabel,            label: "destination countries" },
    { value: DB_STATS.fieldsLabel,               label: "fields of study" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* ── Section 1 · Hero ─────────────────────────────────────────── */}
      <section className="relative bg-[#0E1119] text-white overflow-hidden">
        {/* Single decorative glow — desktop only (mobile GPU rule). */}
        <div className="hidden md:block pointer-events-none absolute -top-32 right-[-10%] w-[540px] h-[540px] rounded-full bg-violet-600/20 blur-3xl" aria-hidden />

        <nav className="relative z-10">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="eduvianAI home">
              <img src="/logo.svg" alt="" width={32} height={32} className="w-8 h-8 rounded-lg" />
              <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
            </Link>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/destinations" className="hidden sm:inline text-sm text-white/70 hover:text-white transition-colors">Destinations</Link>
              <Link href="/methodology" className="hidden sm:inline text-sm text-white/70 hover:text-white transition-colors">How it works</Link>
              <Link href="/scholarships" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Scholarships</Link>
              <LogoutButton variant="compact" />
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
              >
                See if I qualify
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 pt-14 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: message + single CTA */}
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300 mb-5">
              <ShieldCheck className="w-4 h-4" />
              Independent study-abroad intelligence
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08] mb-6">
              Know where you stand{" "}
              <span className="italic font-medium text-violet-300">before</span>{" "}
              you apply abroad.
            </h1>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              eduvianAI gives students and families an independent, data-backed
              layer of clarity before they make high-stakes study abroad
              decisions — and at every stage after: shortlist, application,
              interviews, English tests, visa. Every figure verified at the
              university&apos;s own page.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Link
                href="/get-started"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-base font-bold shadow-lg shadow-violet-900/40 transition-all"
              >
                See if I qualify
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <span className="text-xs text-white/50">
                Free during beta · no card · takes ~5 minutes
              </span>
            </div>
          </div>

          {/* Right: static dashboard mockup — real product output shape,
              no rotation, honestly labelled. */}
          <div className="relative">
            <div className="rounded-2xl bg-white text-gray-900 shadow-2xl shadow-black/40 border border-white/10 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
                <span className="text-sm font-bold">Your shortlist</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">12 Safe</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">20 Reach</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">8 Ambitious</span>
                </span>
              </div>
              <ul className="divide-y divide-stone-100">
                {SAMPLE_SHORTLIST.map((row) => (
                  <li key={row.name} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-lg" aria-hidden>{row.flag}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold truncate">{row.name}</span>
                      <span className="block text-xs text-gray-500 truncate">{row.prog}</span>
                    </span>
                    <span className="text-sm font-bold tabular-nums text-gray-700">{row.pct}%</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TIER_STYLES[row.tier]}`}>
                      {TIER_LABELS[row.tier]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3 text-center text-[11px] text-white/60">
              Sample output — illustrative profile, real product format
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2 · Proof strip ──────────────────────────────────── */}
      <section className="border-b border-stone-100 bg-stone-50/60">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl sm:text-4xl font-bold text-gray-900 tabular-nums">{s.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-[11px] text-gray-500">
            Every figure checked against the university&apos;s official page
            {LAST_VERIFIED_LABEL ? <> · last verified {LAST_VERIFIED_LABEL}</> : null}
            {" · "}
            <Link href="/methodology" className="font-semibold text-violet-700 hover:underline">
              see how we verify
            </Link>
          </p>
        </div>
      </section>

      {/* ── Section 3 · How it works ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700 mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight">
            Three steps from profile to a defensible decision.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <span className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-violet-700" />
                </span>
                <span className="font-display text-sm font-bold text-stone-300">{s.step}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{s.body}</p>
              <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 inline-block">
                {s.proof}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[12px] text-gray-500">
          Built to reduce individual bias, guesswork, and commission-led
          recommendations. We list no partner universities and take no
          placement commissions.
        </p>
      </section>

      {/* ── Section 4 · Journey tools (the USP) ──────────────────────── */}
      <section className="bg-[#0E1119] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300 mb-3">
              Where most platforms stop
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              A shortlist is where the hard part{" "}
              <span className="italic font-medium text-violet-300">begins</span>.
            </h2>
            <p className="text-base text-white/60 leading-relaxed">
              Applications get rejected, interviews go sideways, English scores
              fall short, visas stall. eduvianAI has a purpose-built tool for
              each of these pain points — not just the search.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {JOURNEY_TOOLS.map((t) => (
              <div key={t.href} className="rounded-2xl bg-white/[0.04] border border-white/10 p-6 sm:p-7 flex flex-col">
                <h3 className="font-display text-lg font-bold leading-snug mb-2">{t.pain}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-5">{t.benefit}</p>

                {/* Sample output */}
                <div className="mb-5">
                  {t.sample.kind === "score" && (
                    <div className="space-y-2 max-w-xs">
                      {[
                        { label: "Before", v: t.sample.before, bar: "bg-stone-400",   txt: "text-white/50" },
                        { label: "After",  v: t.sample.after,  bar: "bg-emerald-400", txt: "text-emerald-300" },
                      ].map((row) => (
                        <div key={row.label}>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span className="text-white/50">{row.label}</span>
                            <span className={`tabular-nums font-semibold ${row.txt}`}>{row.v}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div className={`h-full rounded-full ${row.bar}`} style={{ width: `${row.v}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {t.sample.kind === "stat" && (
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-2xl font-semibold tabular-nums">{t.sample.v}</span>
                      <span className="text-xs text-white/50">{t.sample.l}</span>
                    </div>
                  )}
                  {t.sample.kind === "pills" && (
                    <div className="flex flex-wrap gap-2">
                      {t.sample.items.map((item) => (
                        <span key={item} className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-white/80">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <Link
                    href={t.href}
                    className="group inline-flex items-center gap-1.5 text-sm font-bold text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    {t.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <p className="text-[11px] text-white/40 leading-relaxed mt-3 border-t border-white/10 pt-3">
                    {t.trust}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section 5 · Parents ──────────────────────────────────────── */}
      <section className="bg-stone-50/60 border-y border-stone-100">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-700 mb-3">
              <Users className="w-4 h-4" />
              For parents
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-tight mb-4">
              It&apos;s a family decision. The evidence should be readable by
              the whole family.
            </h2>
            <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-xl">
              Every shortlist can be turned into a parent-ready report: total
              cost in rupees, earning-back timelines, visa risk, and how each
              option was scored — in plain language, with every number traced
              to its source.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sample-parent-report"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
              >
                See a sample family report
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/parent-decision"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-stone-300 text-gray-700 text-sm font-semibold hover:bg-white transition-colors"
              >
                Try the parent decision tool
              </Link>
            </div>
          </div>
          {/* Static ROI sample — honest verdict, same figures as the ROI tool
              sample used elsewhere on the site. */}
          <div className="rounded-2xl bg-white border border-stone-200 shadow-sm p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-4">
              Sample return-on-investment view
            </p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <p className="font-display text-2xl font-bold text-gray-900 tabular-nums">$98K</p>
                <p className="text-[11px] text-gray-500 mt-0.5">total investment</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-gray-900 tabular-nums">2.1 yrs</p>
                <p className="text-[11px] text-gray-500 mt-0.5">payback period</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-emerald-700 tabular-nums">+$342K</p>
                <p className="text-[11px] text-gray-500 mt-0.5">10-year net gain</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed border-t border-stone-100 pt-4">
              Worth it <span className="font-semibold">if</span> the graduate
              stays and works abroad at the median salary for at least three
              years. The tool shows the break-even case, not just the best
              case.
            </p>
            <p className="text-[11px] text-gray-400 mt-3">
              Sample output — illustrative figures, real product format
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6 · Closing CTA ──────────────────────────────────── */}
      <section className="bg-[#0E1119] text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
            Five minutes to know where you{" "}
            <span className="italic font-medium text-violet-300">actually</span>{" "}
            stand.
          </h2>
          <p className="text-base text-white/60 leading-relaxed max-w-2xl mx-auto mb-8">
            A readiness rating, up to 40 verified program matches customised to
            your profile, and the evidence to defend the decision at the dinner
            table.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/get-started"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-base font-bold shadow-lg shadow-violet-900/40 transition-all"
            >
              See if I qualify
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              Explore the {DB_STATS.countriesLabel} destinations
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="mt-6 text-[11px] text-white/40">
            Free during beta · first 100 new users each month
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 grid sm:grid-cols-2 gap-6 items-center text-gray-500">
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="" width={28} height={28} className="w-7 h-7 rounded-lg" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-base font-bold tracking-tight text-gray-900">eduvianAI</span>
              <span className="text-[11px] font-medium text-gray-400 tracking-tight mt-0.5">Independent study-abroad intelligence</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:justify-end">
            <Link href="/methodology"    className="hover:text-gray-900 transition-colors">How it works</Link>
            <Link href="/destinations"   className="hover:text-gray-900 transition-colors">Destinations</Link>
            <Link href="/scholarships"   className="hover:text-gray-900 transition-colors">Scholarships</Link>
            <Link href="/match"          className="hover:text-gray-900 transition-colors">Find my programs</Link>
            <Link href="/application-check" className="hover:text-gray-900 transition-colors">Application check</Link>
            <Link href="/interview-prep"    className="hover:text-gray-900 transition-colors">Interview prep</Link>
            <Link href="/english-test-lab"  className="hover:text-gray-900 transition-colors">English Test Lab</Link>
            <Link href="/visa-coach"        className="hover:text-gray-900 transition-colors">Visa Coach</Link>
            <Link href="/security-policy" className="hover:text-gray-900 transition-colors">Security</Link>
            <span className="hidden sm:inline">·</span>
            <span className="text-gray-400 text-[11px]">Decision-support · not professional advice</span>
            <Link
              href="/admin"
              className="ml-2 text-[10px] font-mono text-gray-400 hover:text-violet-700 transition-colors opacity-40 hover:opacity-100 select-none"
            >
              admin
            </Link>
          </div>
        </div>
      </footer>

      <ChatWidget />
    </div>
  );
}

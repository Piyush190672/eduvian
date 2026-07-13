import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Users,
  FileSearch,
  ListChecks,
  Scale,
  BadgeCheck,
  Landmark,
  Fingerprint,
} from "lucide-react";
import { DB_STATS } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";
import LogoutButton from "@/components/LogoutButton";
import MobileNav from "@/components/v3/MobileNav";

/**
 * /v3 — redesign prototype (July 2026, Brand Design Bible v2).
 *
 * Same six sections as the live homepage, in emotional-journey order
 * (dream → skepticism → confusion → stress → money-fear → hesitation),
 * rebuilt on the v3 token set: decision-blue accent (blue-900 = #1E3A8A),
 * slate-900 navy (#0F172A), 20-24px card radius, soft shadow
 * (rgba(15,23,42,0.08)), 80-96px desktop section padding.
 *
 * Copy rules in force: purpose split (readiness vs offer likelihood),
 * AI-word rule (brand name + AISA only), no superlatives, no banned
 * words, sentence case, all samples honestly labelled. Swap to / only
 * on founder approval; live page stays untouched until then.
 */

const LAST_VERIFIED_LABEL = DB_STATS.lastVerifiedLabel;

// Hero readiness-preview sample. The three pillars are the REAL rating
// pillars (Admissibility / Financial / Visa). Figures are illustrative,
// labelled as such; tier counts follow the real 12/20/8 page-2 ratio.
const SAMPLE_READINESS = {
  score: 72,
  band: "Strong readiness",
  pillars: [
    { label: "Admissibility", v: 78 },
    { label: "Financial fit", v: 64 },
    { label: "Visa readiness", v: 71 },
  ],
  tiers: [
    { label: "12 Safe", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { label: "20 Reach", cls: "bg-amber-50 text-amber-700 border-amber-200" },
    { label: "8 Ambitious", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  ],
  lever: "Fastest improvement: retake IELTS 6.5 → 7.0 (+4 pts)",
} as const;

// Journey tools — copy carried from the live page (already pain-point
// first and verified against the live tools). "Interview Coach" naming
// landed in the Wave-3 rename (route stays /interview-prep).
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
      "Mock AU/UK admissions and US F-1 visa interviews with your voice — every answer scored, question by question.",
    sample: { kind: "stat" as const, v: "14 / 14", l: "UK credibility questions coached" },
    cta: "Practise my interview",
    href: "/interview-prep",
    trust: "Voice and text mock interviews with per-answer scoring.",
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
    title: "Get your evidence-backed matches",
    body: `Up to 40 programs customised to your profile, split into Safe, Reach and Ambitious by your likelihood of an offer — drawn from ${DB_STATS.verifiedProgramsLabel} programs verified at the university's own page.`,
    proof: "Every fee and requirement links to its source",
  },
  {
    icon: Scale,
    step: "03",
    title: "Decide with your family",
    body: "Compare shortlisted programs on cost, earning-back timelines, scholarship signals and visa readiness. Generate a parent-ready report the whole family can weigh in on.",
    proof: "Same verified data behind every tool",
  },
] as const;

const TRUST_BADGES = [
  { icon: BadgeCheck, label: "No placement commissions" },
  { icon: Landmark, label: "Official sources only" },
  { icon: Fingerprint, label: "Explainable recommendations" },
] as const;

export default function HomeV3() {
  const stats = [
    { value: DB_STATS.verifiedProgramsLabel,     label: "verified programs" },
    { value: DB_STATS.verifiedUniversitiesLabel, label: "universities" },
    { value: DB_STATS.countriesLabel,            label: "destination countries" },
    { value: DB_STATS.fieldsLabel,               label: "fields of study" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Section 1 · Hero — emotional job: ground the dream in agency ── */}
      <section className="relative bg-[#0F172A] text-white overflow-hidden">
        <div className="hidden md:block pointer-events-none absolute -top-32 right-[-10%] w-[540px] h-[540px] rounded-full bg-blue-700/20 blur-3xl" aria-hidden />

        <nav className="relative z-20 border-b border-white/5">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="eduvianAI home">
              <img src="/logo.svg" alt="" width={32} height={32} className="w-8 h-8 rounded-lg" />
              <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
            </Link>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/programs" className="text-sm text-white/70 hover:text-white transition-colors">Find programs</Link>
              <Link href="/destinations" className="text-sm text-white/70 hover:text-white transition-colors">Destinations</Link>
              <Link href="/scholarships" className="text-sm text-white/70 hover:text-white transition-colors">Scholarships</Link>
              <Link href="/why-eduvianai" className="text-sm text-white/70 hover:text-white transition-colors">Why eduvianAI</Link>
              <Link href="/get-started" className="text-sm text-white/70 hover:text-white transition-colors">Sign in</Link>
              <LogoutButton variant="compact" />
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                Check my readiness
              </Link>
            </div>
            <MobileNav />
          </div>
        </nav>

        <div className="relative z-10 max-w-[1240px] mx-auto px-6 sm:px-10 pt-14 sm:pt-24 pb-16 sm:pb-28 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* min-w-0 on both columns — 375px hero-clipping lesson, 10 Jul 2026 */}
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300 mb-5">
              <ShieldCheck className="w-4 h-4" />
              Independent study-abroad intelligence
            </p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.06] mb-6">
              Know where you stand{" "}
              <span className="italic font-medium text-blue-300">before</span>{" "}
              you apply abroad.
            </h1>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              eduvianAI helps students and families decide with verified
              university data, explainable fit scores and stage-wise tools for
              shortlisting, applications, interviews, English tests and visas.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-7">
              <Link
                href="/profile"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 min-h-[48px] rounded-full bg-blue-900 hover:bg-blue-800 text-white text-base font-bold shadow-lg shadow-blue-950/50 transition-all"
              >
                Check my readiness
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/programs"
                className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white transition-colors"
              >
                Explore verified programs
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-xs text-white/50 mb-4">
              Free during beta · no card needed · takes about 5 minutes
            </p>
            <p className="text-[11px] text-white/40 border-t border-white/10 pt-4 max-w-xl">
              No partner university bias. No placement commission. Every key
              number links back to its source where available.
            </p>
          </div>

          {/* Right: single readiness-preview card (the product, honestly labelled) */}
          <div className="relative min-w-0">
            <div className="rounded-3xl bg-white text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.35)] border border-white/10 overflow-hidden max-w-md mx-auto lg:ml-auto">
              <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
                <span className="text-sm font-bold">Your readiness</span>
                <span className="text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                  {SAMPLE_READINESS.band}
                </span>
              </div>
              <div className="px-6 py-5">
                <div className="flex items-center gap-5 mb-5">
                  <div className="relative w-20 h-20 shrink-0" aria-hidden>
                    <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#E2E8F0" strokeWidth="3.6" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none" stroke="#1E3A8A" strokeWidth="3.6"
                        strokeDasharray={`${SAMPLE_READINESS.score} ${100 - SAMPLE_READINESS.score}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-display text-xl font-bold tabular-nums">
                      {SAMPLE_READINESS.score}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2.5">
                    {SAMPLE_READINESS.pillars.map((p) => (
                      <div key={p.label}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-500">{p.label}</span>
                          <span className="tabular-nums font-semibold text-slate-700">{p.v}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-800" style={{ width: `${p.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-4">
                  <span className="text-[11px] text-slate-500 mr-1">Matches:</span>
                  {SAMPLE_READINESS.tiers.map((t) => (
                    <span key={t.label} className={`px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${t.cls}`}>
                      {t.label}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  {SAMPLE_READINESS.lever}
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-white/60">
              Sample output — illustrative profile, real product format
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 2 · Proof strip — emotional job: answer skepticism ──── */}
      <section className="border-b border-slate-200/70 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-7 text-center text-[11px] text-slate-500">
            Each program, fee and entry requirement is checked against the
            university or official source page
            {LAST_VERIFIED_LABEL ? <> · last verified {LAST_VERIFIED_LABEL}</> : null}
            {" · "}
            <Link href="/methodology" className="font-semibold text-blue-800 hover:underline">
              how we verify data
            </Link>
          </p>

          {/* Founder row — the independence credential at the skepticism moment */}
          <div className="mt-9 max-w-2xl mx-auto flex items-center gap-4 sm:gap-5 rounded-2xl border border-slate-200 bg-[#F8FAFC] px-5 py-4">
            <img
              src="/founder-piyush.jpg"
              alt="Piyush Kumar, founder of eduvianAI"
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm text-slate-700 leading-snug">
                “Students and parents weren&apos;t short of information — they
                were short of certainty. That&apos;s why I built eduvianAI.”
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Piyush Kumar · Founder · former Regional Director, IDP Education{" · "}
                <Link href="/why-eduvianai" className="font-semibold text-blue-800 hover:underline whitespace-nowrap">
                  Read why eduvianAI exists →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3 · How it works — emotional job: dissolve confusion ── */}
      <section className="max-w-[1240px] mx-auto px-6 sm:px-10 py-16 sm:py-24">
        <div className="max-w-2xl mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800 mb-3">How it works</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            From confusion to a defended decision in three steps.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div key={s.step} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between mb-5">
                <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-blue-800" />
                </span>
                <span className="font-display text-sm font-bold text-slate-300">{s.step}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">{s.body}</p>
              <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 inline-block">
                {s.proof}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
          {TRUST_BADGES.map((b) => (
            <span key={b.label} className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-600">
              <b.icon className="w-4 h-4 text-blue-800" />
              {b.label}
            </span>
          ))}
          <span className="text-[12px] text-slate-500">
            Built to reduce individual bias, guesswork, and commission-led recommendations.
          </span>
        </div>
      </section>

      {/* ── Section 4 · Journey tools — emotional job: hold stress ──────── */}
      <section className="bg-[#0F172A] text-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div className="max-w-2xl mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-300 mb-3">
              Where most platforms stop
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              A shortlist is where the hard part{" "}
              <span className="italic font-medium text-blue-300">begins</span>.
            </h2>
            <p className="text-base text-white/60 leading-relaxed">
              Applications get rejected, interviews go sideways, English scores
              fall short, visas stall. eduvianAI has a purpose-built tool for
              each of these pain points — not just the search.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {JOURNEY_TOOLS.map((t) => (
              <div key={t.href} className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 sm:p-8 flex flex-col">
                <h3 className="font-display text-lg font-bold leading-snug mb-2">{t.pain}</h3>
                <p className="text-sm text-white/60 leading-relaxed mb-5">{t.benefit}</p>

                <div className="mb-5">
                  {t.sample.kind === "score" && (
                    <div className="space-y-2 max-w-xs">
                      {[
                        { label: "Before", v: t.sample.before, bar: "bg-slate-400",   txt: "text-white/50" },
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
                    className="group inline-flex items-center gap-1.5 min-h-[44px] text-sm font-bold text-blue-300 hover:text-blue-200 transition-colors"
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

      {/* ── Section 5 · Parent Decision Room — emotional job: money calm ── */}
      <section className="bg-white border-y border-slate-200/70">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800 mb-3">
              <Users className="w-4 h-4" />
              Parent decision room
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight mb-4">
              Make the decision clear for the whole family.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-6 max-w-xl">
              Study abroad is a large financial and emotional decision. Every
              shortlist becomes a family-ready report: total cost in rupees,
              earning-back timelines, scholarship signals, visa readiness — and
              the reasons behind each recommendation, traced to source.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/sample-parent-report"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-full bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold transition-colors"
              >
                See a sample family report
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                href="/profile"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-full border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-[#F8FAFC] transition-colors"
              >
                Build my shortlist
              </Link>
            </div>
          </div>
          {/* Same illustrative ROI sample as the live page, converted to INR
              at ₹84/USD so parents read it in their own currency. */}
          <div className="rounded-3xl bg-[#F8FAFC] border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)] p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-4">
              Sample return-on-investment view
            </p>
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">₹92L</p>
                <p className="text-[11px] text-slate-500 mt-0.5">total investment</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">2.1 yrs</p>
                <p className="text-[11px] text-slate-500 mt-0.5">payback period</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-emerald-700 tabular-nums">+₹3.2Cr</p>
                <p className="text-[11px] text-slate-500 mt-0.5">10-year net gain</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-200 pt-4">
              Worth it <span className="font-semibold">if</span> the graduate
              stays and works abroad at the median salary for at least three
              years. The report shows the break-even case, not just the
              best-case story.
            </p>
            <p className="text-[11px] text-slate-400 mt-3">
              Sample output — illustrative figures ($98K · +$342K converted at ₹94/USD), real product format
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 6 · Closing CTA — emotional job: shrink the leap ────── */}
      <section className="bg-[#0F172A] text-white">
        <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
            Five minutes to know where you{" "}
            <span className="italic font-medium text-blue-300">actually</span>{" "}
            stand.
          </h2>
          <p className="text-base text-white/60 leading-relaxed max-w-2xl mx-auto mb-8">
            A readiness rating, up to 40 verified program matches customised to
            your profile, and the evidence to defend the decision at the dinner
            table.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/profile"
              className="group inline-flex items-center gap-2 px-8 py-4 min-h-[48px] rounded-full bg-blue-900 hover:bg-blue-800 text-white text-base font-bold shadow-lg shadow-blue-950/50 transition-all"
            >
              Check my readiness
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-white/70 hover:text-white transition-colors"
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

      {/* ── Footer — grouped (Explore / Tools / Company / Trust) ────────── */}
      <footer className="bg-white border-t border-slate-200/70">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/logo.svg" alt="" width={28} height={28} className="w-7 h-7 rounded-lg" />
                <span className="font-display text-base font-bold tracking-tight text-slate-900">eduvianAI</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed max-w-[180px]">
                Independent study-abroad intelligence for students and families.
              </p>
            </div>
            {[
              {
                h: "Explore",
                links: [
                  ["Find programs", "/programs"],
                  ["Destinations", "/destinations"],
                  ["Scholarships", "/scholarships"],
                  ["Find my matches", "/match"],
                ],
              },
              {
                h: "Tools",
                links: [
                  ["Application check", "/application-check"],
                  ["Interview Coach", "/interview-prep"],
                  ["English Test Lab", "/english-test-lab"],
                  ["Visa Coach", "/visa-coach"],
                  ["Parent decision tool", "/parent-decision"],
                ],
              },
              {
                h: "Company",
                links: [
                  ["Why eduvianAI", "/why-eduvianai"],
                  ["Sample family report", "/sample-parent-report"],
                  ["Sign in", "/get-started"],
                ],
              },
              {
                h: "Trust",
                links: [
                  ["How we verify data", "/methodology"],
                  ["Security", "/security-policy"],
                ],
              },
            ].map((g) => (
              <div key={g.h}>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">{g.h}</p>
                <ul className="space-y-2">
                  {g.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="text-xs text-slate-600 hover:text-slate-900 transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <span>Decision-support · not professional advice</span>
            <Link
              href="/admin"
              className="text-[10px] font-mono text-slate-400 hover:text-blue-800 transition-colors opacity-40 hover:opacity-100 select-none"
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

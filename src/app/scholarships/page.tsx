"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { DB_STATS } from "@/data/db-stats";
import ChatWidget from "@/components/ChatWidget";

const SCHOLARSHIPS: {
  name: string;
  flag: string;
  scholarships: { name: string; coverage: string; note?: string }[];
}[] = [
  {
    name: "USA", flag: "🇺🇸",
    scholarships: [
      { name: "Fulbright Foreign Student Program",  coverage: "Fully funded", note: "Tuition, living stipend, travel & health insurance" },
      { name: "Hubert H. Humphrey Fellowship",      coverage: "Fully funded", note: "Mid-career professionals; no degree awarded" },
      { name: "University Merit Scholarships",      coverage: "Partial – Full", note: "Presidential, Dean's & departmental awards at most universities" },
      { name: "STEM OPT + RA/TA Funding",           coverage: "Tuition waiver + stipend", note: "Common for PhD & MS STEM students" },
      { name: "Aga Khan Foundation",                coverage: "Partial", note: "For students from developing countries" },
    ],
  },
  {
    name: "UK", flag: "🇬🇧",
    scholarships: [
      { name: "Chevening Scholarship",         coverage: "Fully funded", note: "UK Govt — tuition, living, travel; 1-year Masters" },
      { name: "Commonwealth Scholarship",      coverage: "Fully funded", note: "For students from Commonwealth nations" },
      { name: "GREAT Scholarship",             coverage: "£10,000 min", note: "UK Govt + university partnership" },
      { name: "Gates Cambridge Scholarship",   coverage: "Fully funded", note: "For exceptional scholars at Cambridge" },
      { name: "Rhodes Scholarship",            coverage: "Fully funded", note: "For postgraduate study at Oxford; highly competitive" },
      { name: "University Scholarships",       coverage: "Partial – Full", note: "UCL, Imperial, Edinburgh, Manchester all offer merit awards" },
    ],
  },
  {
    name: "Australia", flag: "🇦🇺",
    scholarships: [
      { name: "Australia Awards",              coverage: "Fully funded", note: "Australian Govt; tuition, living, travel, health" },
      { name: "Destination Australia",         coverage: "AUD 15,000/yr", note: "For study in regional Australia" },
      { name: "Research Training Program",     coverage: "Tuition waiver + stipend", note: "For PhD & research Masters students" },
      { name: "Monash International Merit",    coverage: "AUD 10,000–50,000", note: "Based on academic excellence" },
      { name: "University of Sydney ISS",      coverage: "25–50% tuition", note: "International Student Scholarship at USYD" },
      { name: "Endeavour Scholarships",        coverage: "Fully funded", note: "Govt-backed; for high-achieving international students" },
    ],
  },
  {
    name: "Canada", flag: "🇨🇦",
    scholarships: [
      { name: "Vanier Canada Graduate Scholarship", coverage: "CAD 50,000/yr", note: "Doctoral students; world-class research" },
      { name: "Banting Postdoctoral Fellowship",    coverage: "CAD 70,000/yr", note: "For postdoctoral researchers" },
      { name: "UBC International Major Entrance",   coverage: "CAD 40,000+", note: "For top UG applicants to UBC" },
      { name: "UofT International Scholar Award",   coverage: "CAD 40,000+", note: "For high-achieving incoming UG students" },
      { name: "Ontario Trillium Scholarship",       coverage: "CAD 40,000/yr", note: "For international PhD students in Ontario" },
      { name: "University Merit Awards",            coverage: "Partial – Full", note: "Available at Waterloo, McGill, Alberta & most others" },
    ],
  },
  {
    name: "Germany", flag: "🇩🇪",
    scholarships: [
      { name: "DAAD Scholarship",              coverage: "€750–1,200/month", note: "Germany's largest scholarship org; many programmes" },
      { name: "Deutschlandstipendium",         coverage: "€300/month", note: "Co-funded by govt and private sponsors" },
      { name: "Heinrich Böll Foundation",      coverage: "€850/month + extras", note: "For socially and politically active students" },
      { name: "Friedrich Ebert Foundation",    coverage: "€850/month + extras", note: "Focus on social justice and democracy" },
      { name: "Konrad Adenauer Foundation",    coverage: "€850/month + extras", note: "For academically excellent students" },
      { name: "Erasmus+ (exchange)",           coverage: "€300–600/month", note: "For EU-programme students on exchange" },
    ],
  },
  {
    name: "Singapore", flag: "🇸🇬",
    scholarships: [
      { name: "Singapore Government Scholarship (MOE)", coverage: "Fully funded", note: "Tuition + living allowance + bond required" },
      { name: "ASEAN Undergraduate Scholarship",        coverage: "Fully funded", note: "For ASEAN nationals; tuition + accommodation + allowance" },
      { name: "NUS Research Scholarship",               coverage: "Tuition waiver + SGD 2,000/month", note: "For PhD research students at NUS" },
      { name: "NTU Research Scholarship",               coverage: "Tuition waiver + SGD 2,000/month", note: "For PhD students at NTU" },
      { name: "A*STAR Graduate Scholarship",            coverage: "Fully funded", note: "For research-focused PhD students in science & tech" },
    ],
  },
  {
    name: "New Zealand", flag: "🇳🇿",
    scholarships: [
      { name: "New Zealand Excellence Awards (NZEA)", coverage: "NZD 10,000", note: "For international students at NZ universities" },
      { name: "New Zealand Aid Programme",            coverage: "Fully funded", note: "For students from eligible developing countries" },
      { name: "University of Auckland ISES",          coverage: "NZD 10,000", note: "International Student Excellence Scholarship" },
      { name: "Victoria University Merit Award",      coverage: "NZD 5,000–10,000", note: "For high-achieving international students" },
    ],
  },
  {
    name: "Ireland", flag: "🇮🇪",
    scholarships: [
      { name: "Govt of Ireland International Education", coverage: "Fully funded", note: "60 awards/yr; tuition + €10,000 stipend" },
      { name: "IRC Government of Ireland Postgrad",      coverage: "€16,000/yr + fees", note: "Irish Research Council; Masters & PhD" },
      { name: "UCD Global Excellence Scholarship",       coverage: "€3,000–10,000", note: "For top international applicants to UCD" },
      { name: "TCD Provost's Scholarship",               coverage: "Full fees", note: "For highest-ranked applicants to Trinity" },
      { name: "Enterprise Ireland Innovation Voucher",   coverage: "Funded projects", note: "For students working with Irish companies" },
    ],
  },
  {
    name: "France", flag: "🇫🇷",
    scholarships: [
      { name: "Eiffel Excellence Scholarship",          coverage: "€1,181/month + extras", note: "French Govt; Masters & PhD; highly competitive" },
      { name: "Campus France Bilateral Scholarships",   coverage: "Varies by country", note: "India-France bilateral awards" },
      { name: "HEC Paris Merit Scholarship",            coverage: "Up to €30,000", note: "For outstanding MBA & Masters candidates" },
      { name: "Erasmus+ Scholarship",                   coverage: "€300–600/month", note: "For exchange students in EU programmes" },
      { name: "Région Île-de-France Scholarships",      coverage: "€10,000+", note: "Regional council grants for Paris-area students" },
    ],
  },
  {
    name: "UAE", flag: "🇦🇪",
    scholarships: [
      { name: "NYU Abu Dhabi Scholarship",         coverage: "Fully funded", note: "Tuition, housing, stipend; extremely competitive" },
      { name: "Khalifa University Scholarship",    coverage: "Full tuition + AED 1,500/month", note: "For top STEM students" },
      { name: "AUS Merit Scholarship",             coverage: "25–100% tuition", note: "American University of Sharjah" },
      { name: "ADEC Scholarship (Abu Dhabi)",      coverage: "Fully funded", note: "For select bilateral country agreements" },
      { name: "Mubadala / ADNOC Sponsorships",     coverage: "Fully funded", note: "Corporate-sponsored; bond required post-study" },
    ],
  },
  {
    name: "Malaysia", flag: "🇲🇾",
    scholarships: [
      { name: "Malaysian Govt (MoHE) Scholarship",         coverage: "Full tuition + living", note: "For select bilateral partner countries" },
      { name: "Monash Malaysia VC Scholarship",            coverage: "Full tuition", note: "For top applicants to Monash Malaysia" },
      { name: "University of Nottingham Malaysia Merit",   coverage: "25–50% tuition", note: "Academic excellence award" },
      { name: "Petronas Education Scholarship",            coverage: "Fully funded", note: "For STEM students; bond with Petronas required" },
      { name: "MQA / PTPTN Education Loan",                coverage: "Subsidised loan", note: "Available to international students at select programmes" },
    ],
  },
];

const TEASERS: Record<string, string> = {
  "USA": "Fulbright · RA/TA stipends",
  "UK": "Chevening · Gates Cambridge",
  "Australia": "Australia Awards · RTP",
  "Canada": "Vanier · Ontario Trillium",
  "Germany": "DAAD · free public unis",
  "Singapore": "MOE · A*STAR",
  "New Zealand": "NZ Excellence · NZ Aid",
  "Ireland": "Govt 60 awards · IRC",
  "France": "Eiffel Excellence · Erasmus+",
  "UAE": "NYU Abu Dhabi · Khalifa",
  "Malaysia": "Govt · Monash VC",
};

export default function ScholarshipsPage() {
  const [selected, setSelected] = useState<string>("USA");
  const active = SCHOLARSHIPS.find((c) => c.name === selected) ?? SCHOLARSHIPS[0];

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
      {/* ───── NAV ───── */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </Link>
            <Link href="/destinations" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Destinations</Link>
            <Link href="/get-started" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors">
              Find my programs
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative bg-[#0E1119] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-28 sm:pt-36 pb-16 sm:pb-20">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/85 mb-8 font-semibold">Scholarships</p>
          <h1 className="font-display font-bold text-[2.25rem] leading-[1.08] sm:text-5xl md:text-[3.75rem] tracking-tight max-w-3xl mb-7">
            Money on the table you can <span className="italic font-medium text-violet-300">claim</span>.
          </h1>
          <p className="text-lg sm:text-xl text-white/65 leading-relaxed max-w-2xl">
            Marquee scholarships across our twelve destinations — Fulbright, Chevening, DAAD, Australia Awards and more. Hundreds more sit inside individual university pages; verify eligibility and amounts on the official source before you apply.
          </p>
          <div className="border-t border-white/8 mt-12 pt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-white/55">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              <span>Independent · no university commission</span>
            </div>
            <span>{DB_STATS.verifiedProgramsLabel} programs · {DB_STATS.countriesLabel} countries</span>
            <span className="text-white/45">Decision-support estimates · always confirm with the awarding body</span>
          </div>
        </div>
      </section>

      {/* ───── COUNTRY PICKER + DETAIL ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-24">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">Choose a country</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
            {SCHOLARSHIPS.map((c) => {
              const active = selected === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelected(c.name)}
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    active
                      ? "bg-violet-600 text-white border-violet-600 shadow-md"
                      : "bg-white text-gray-700 border-stone-200 hover:border-violet-300 hover:shadow-sm hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{c.flag}</span>
                    <span className="font-semibold text-sm">{c.name}</span>
                  </div>
                  <p className={`text-[11px] leading-snug ${active ? "text-violet-100" : "text-gray-500"}`}>
                    {TEASERS[c.name] ?? c.scholarships[0].name}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-6 sm:px-8 py-5 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{active.flag}</span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">{active.name} — scholarships</h2>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-violet-700 font-bold">{active.scholarships.length} listed</span>
            </div>
            <ul className="divide-y divide-stone-200">
              {active.scholarships.map((s) => (
                <li key={s.name} className="grid grid-cols-12 gap-4 px-6 sm:px-8 py-5 items-baseline">
                  <div className="col-span-12 sm:col-span-7">
                    <p className="font-display text-base sm:text-lg font-semibold text-gray-900 leading-snug">{s.name}</p>
                    {s.note && <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{s.note}</p>}
                  </div>
                  <div className="col-span-12 sm:col-span-5 sm:text-right">
                    <span className="inline-block text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-100 rounded-full px-3 py-1">
                      {s.coverage}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="px-6 sm:px-8 py-4 bg-stone-50 border-t border-stone-200">
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Scholarship rules change by university, intake and applicant profile. Always confirm current eligibility, amounts and deadlines from the official awarding body before applying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ───── HOW TO USE ───── */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">How to actually claim one</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1] mb-6">
              Start broad, then <span className="italic font-medium text-violet-700">shortlist only what fits</span>.
            </h2>
            <p className="text-base text-gray-500 leading-relaxed">
              Most students apply to too few scholarships and to the wrong ones. The fastest filter is your eligibility on three axes: nationality, degree level, and minimum GPA / test score. Cut anything that doesn&apos;t match before reading the full criteria.
            </p>
          </div>
          <div className="lg:col-span-7 space-y-4">
            {[
              { n: "01", t: "Map eligibility first",   p: "Country of citizenship · degree level · academic threshold. If you don't pass all three, the rest doesn't matter." },
              { n: "02", t: "Match deadlines to intake", p: "Most fully-funded awards close 8–12 months before the academic year begins. Plan backwards from your intake." },
              { n: "03", t: "Layer university + government", p: "Government awards (Chevening, Fulbright, DAAD) are competitive but high-value. University merit awards are easier and stack with admission." },
              { n: "04", t: "Verify on the official page",   p: "Eligibility, amounts and deadlines change yearly. The list above is a starting map — confirm everything on the awarding body's current-year page before applying." },
            ].map((s) => (
              <div key={s.n} className="flex gap-5 p-6 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="font-display text-2xl font-light text-violet-600 tabular-nums flex-shrink-0">{s.n}</span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight text-gray-900 mb-1.5">{s.t}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto text-gray-900">
            Build a shortlist first, then <span className="italic font-medium text-violet-700">layer scholarships</span> that fit.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/get-started" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-200">
              Find my best-fit programs
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/destinations" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-gray-300 text-gray-900 text-sm font-semibold hover:border-gray-500 transition-colors">
              Browse destinations <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <ChatWidget />
    </div>
  );
}

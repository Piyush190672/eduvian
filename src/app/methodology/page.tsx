import Link from "next/link";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { DB_STATS } from "@/data/db-stats";

export const metadata = {
  title: "How we verify program data — EduvianAI",
  description:
    "Our methodology for sourcing and verifying study-abroad program data: live URL fetch from each official university page, blank fields where the source is silent, no invented values.",
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
      {/* ───── NAV ───── */}
      <nav className="absolute top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
          </Link>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
          >
            Find my programs
          </Link>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative bg-[#0E1119] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-28 sm:pt-36 pb-16 sm:pb-20">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/85 mb-8 font-semibold">Methodology</p>
          <h1 className="font-display font-bold text-[2.25rem] leading-[1.08] sm:text-5xl md:text-[3.75rem] tracking-tight max-w-3xl mb-7">
            How we verify <span className="italic font-medium text-violet-300">program data</span>.
          </h1>
          <p className="text-lg sm:text-xl text-white/65 leading-relaxed max-w-2xl">
            Every entry in the EduvianAI database is checked against the official university page before it can appear in your shortlist. This page explains the rules — what we fetch, what we leave blank, and what you should still verify yourself.
          </p>
          <div className="border-t border-white/8 mt-12 pt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-white/55">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              <span>{DB_STATS.verifiedProgramsLabel} programs verified at source · {DB_STATS.verifiedUniversitiesLabel} universities · {DB_STATS.countriesLabel} countries</span>
            </div>
          </div>
        </div>
      </section>

      {/* ───── THE FOUR RULES ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-8">The four rules</p>
          <div className="grid lg:grid-cols-2 gap-5 lg:gap-6">
            {[
              {
                n: "01",
                t: "Data is pulled from official university pages",
                p: "We start with each university's own program page — the URL the admissions office maintains. Tuition, intake months, application deadlines, English-language minimums, GRE/GMAT cutoffs and program duration are read directly from that page on every refresh.",
              },
              {
                n: "02",
                t: "Missing official data is left blank, not invented",
                p: "If the official page does not state a value, the field stays null in our database. We never substitute averages, recycled aggregator data, or estimates dressed up as facts. A blank cell tells you the source was silent — go ask the university directly.",
              },
              {
                n: "03",
                t: "Fees, deadlines, English scores, and eligibility are checked at source",
                p: "Every refresh re-fetches the live URL and re-extracts the fields. Programs that pass extraction get a verified_at timestamp. The scoring engine prefers entries with a recent verified_at when building your shortlist.",
              },
              {
                n: "04",
                t: "You must verify final details with the university before applying",
                p: "Universities update fees, deadlines and eligibility every cycle. A verified-at-source figure is current to the moment we fetched it — not necessarily to the moment you read it. Always confirm the numbers on the official page before you apply, pay a deposit, or commit funds.",
              },
            ].map((r) => (
              <div key={r.n} className="flex flex-col p-8 sm:p-10 rounded-2xl bg-white border border-stone-200 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-100 transition-all">
                <span className="font-display text-3xl font-light text-violet-600 tabular-nums mb-5">{r.n}</span>
                <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 mb-3 leading-snug">{r.t}</h2>
                <p className="text-base text-gray-500 leading-relaxed">{r.p}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 sm:mt-14 rounded-2xl bg-white border border-stone-200 p-6 sm:p-8 max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-bold mb-3">In one line</p>
            <p className="font-display text-lg sm:text-xl text-gray-900 leading-snug">
              EduvianAI is decision-support, not the final word. Use it to shortlist faster and rule out worse-fit options — but always confirm the figures with the university before you commit money or sign anything.
            </p>
          </div>
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto text-gray-900">
            Ready to put the dataset to <span className="italic font-medium text-violet-700">work</span>?
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
    </div>
  );
}

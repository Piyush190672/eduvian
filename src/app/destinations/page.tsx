"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { DB_STATS, universitiesByCountry } from "@/data/db-stats";
import CountryModal from "@/components/CountryModal";
import ChatWidget from "@/components/ChatWidget";

const COUNTRIES = [
  { flag: "🇺🇸", name: "USA",         img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=800&q=80", tagline: "Largest research ecosystem · Ivy + public R1s" },
  { flag: "🇬🇧", name: "UK",          img: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=800&q=80", tagline: "1-year Masters · Oxbridge + Russell Group" },
  { flag: "🇨🇦", name: "Canada",      img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80", tagline: "PGWP-friendly · clear PR pathway" },
  { flag: "🇦🇺", name: "Australia",   img: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=800&q=80", tagline: "Group of Eight · post-study work visa" },
  { flag: "🇩🇪", name: "Germany",     img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&q=80", tagline: "Public unis · low/no tuition · TUM, RWTH" },
  { flag: "🇳🇱", name: "Netherlands", img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&q=80", tagline: "English-taught Masters · TU Delft, Wageningen" },
  { flag: "🇮🇪", name: "Ireland",     img: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=800&q=80", tagline: "EU work rights post-study · TCD, UCD" },
  { flag: "🇫🇷", name: "France",      img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80", tagline: "Grandes Écoles · HEC, Polytechnique, Sciences Po" },
  { flag: "🇳🇿", name: "New Zealand", img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&q=80", tagline: "All 8 universities QS-ranked · 3-yr work visa" },
  { flag: "🇸🇬", name: "Singapore",   img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80", tagline: "NUS + NTU top 20 globally · APAC tech hub" },
  { flag: "🇲🇾", name: "Malaysia",    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80", tagline: "Affordable · Monash + Nottingham branch campuses" },
  { flag: "🇦🇪", name: "UAE",         img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80", tagline: "Tax-free · NYU Abu Dhabi, Khalifa, AUS" },
];

export default function DestinationsPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

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
            <Link href="/scholarships" className="hidden md:inline text-sm text-white/70 hover:text-white transition-colors">Scholarships</Link>
            <Link href="/get-started" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors">
              Find my programs
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative bg-[#0E1119] text-white">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 pt-28 sm:pt-36 pb-16 sm:pb-20">
          <p className="text-[11px] uppercase tracking-[0.25em] text-violet-300/85 mb-8 font-semibold">Destinations</p>
          <h1 className="font-display font-bold text-[2.25rem] leading-[1.08] sm:text-5xl md:text-[3.75rem] tracking-tight max-w-3xl mb-7">
            Twelve countries. One <span className="italic font-medium text-violet-300">verified-source</span> standard.
          </h1>
          <p className="text-lg sm:text-xl text-white/65 leading-relaxed max-w-2xl">
            Every destination on EduvianAI carries the same rule: live URL fetch from the official university page, no invented values, blank fields where the source is silent. Tap any country to see universities, fees and visa rules.
          </p>
          <div className="border-t border-white/8 mt-12 pt-5 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] text-white/55">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400/80" />
              <span>Independent · no university commission</span>
            </div>
            <span>{DB_STATS.verifiedProgramsLabel} programs · {DB_STATS.verifiedUniversitiesLabel} universities · {DB_STATS.countriesLabel} countries</span>
            <span className="text-white/45">Decision-support estimates · always confirm with the university</span>
          </div>
        </div>
      </section>

      {/* ───── COUNTRY GRID ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {COUNTRIES.map((c) => {
              const uniCount = (universitiesByCountry[c.name] || []).length;
              return (
                <button
                  key={c.name}
                  onClick={() => setSelectedCountry(c.name)}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.img}
                    alt={c.name}
                    loading="lazy"
                    decoding="async"
                    width="400"
                    height="500"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1119]/85 via-[#0E1119]/30 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                    <p className="text-2xl mb-2">{c.flag}</p>
                    <p className="font-display text-2xl font-semibold tracking-tight leading-tight mb-1.5">{c.name}</p>
                    {uniCount > 0 && (
                      <p className="text-[11px] text-white/70 mb-2 tabular-nums">{uniCount}+ universities verified</p>
                    )}
                    <p className="text-[12px] text-white/80 leading-snug">{c.tagline}</p>
                  </div>
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/85 font-bold">
                    Open <ArrowUpRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───── HOW MATCHING WORKS ───── */}
      <section className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-700 font-semibold mb-6">How destinations enter the database</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-[1.1] mb-6">
              Every figure is <span className="italic font-medium text-violet-700">fetched live</span>.
            </h2>
            <p className="text-base text-gray-500 leading-relaxed mb-6">
              Adding a country means seeding its universities, then scraping each program page directly. Tuition, deadlines, English minimums and intake months land in the database only after a successful fetch.
            </p>
            <Link href="/get-started" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors">
              Find my best-fit programs
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="lg:col-span-7">
            <div className="space-y-4">
              {[
                { n: "01", t: "Seeded from official sources", p: "University lists come from country accreditation bodies (UCAS, MOE, DAAD), not aggregator listings." },
                { n: "02", t: "Live program-page fetch", p: "Each program is opened on the official university URL. Fees, deadlines, English cutoffs and intake months are read off the live page." },
                { n: "03", t: "Blank when silent", p: "If the official page does not state a value, the field stays null. We never fall back to averages or invent figures." },
                { n: "04", t: "Stamped with verified_at", p: "Successfully verified programs carry a verified_at timestamp. The scoring engine prefers verified entries." },
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
        </div>
      </section>

      {/* ───── FINAL CTA ───── */}
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1] mb-6 max-w-3xl mx-auto text-gray-900">
            Pick a destination, or let the <span className="italic font-medium text-violet-700">AI shortlist</span> across all twelve.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <Link href="/get-started" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-200">
              Find my best-fit programs
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/scholarships" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-gray-300 text-gray-900 text-sm font-semibold hover:border-gray-500 transition-colors">
              See scholarships by country
            </Link>
          </div>
        </div>
      </section>

      <CountryModal countryName={selectedCountry} onClose={() => setSelectedCountry(null)} />
      <ChatWidget />
    </div>
  );
}

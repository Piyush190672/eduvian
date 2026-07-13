import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import BrandNav from "@/components/BrandNav";
import { COUNTRY_NODES } from "@/lib/program-slugs";
import { DB_STATS } from "@/data/db-stats";

export const metadata: Metadata = {
  title: "Browse verified programs by country",
  description: `Explore ${DB_STATS.verifiedProgramsLabel} study-abroad programs across ${DB_STATS.countriesLabel} countries — every fee, deadline and requirement verified at the university's official page.`,
  alternates: { canonical: "/programs" },
};

/**
 * /programs — index hub for the programmatic SEO tree (Phase 2 #10b).
 * Server-rendered from the verified database; no client JS.
 */
export default function ProgramsIndexPage() {
  const countries = [...COUNTRY_NODES.values()]
    .filter((c) => c.programCount > 0)
    .sort((a, b) => b.programCount - a.programCount);

  return (
    <div className="min-h-screen bg-white">
      <BrandNav variant="light" />
      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800 mb-3">
          Program directory
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          {DB_STATS.verifiedProgramsLabel} verified programs, by country.
        </h1>
        <p className="text-base text-gray-500 leading-relaxed max-w-2xl mb-10">
          Every fee, deadline and entry requirement below was checked against
          the university&apos;s own page
          {DB_STATS.lastVerifiedLabel ? ` — last verified ${DB_STATS.lastVerifiedLabel}` : ""}.
          Pick a country to browse its universities.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {countries.map((c) => (
            <Link
              key={c.slug}
              href={`/programs/${c.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <span className="text-2xl" aria-hidden>{c.flag}</span>
              <span className="flex-1 min-w-0">
                <span className="block font-display text-base font-bold text-gray-900">{c.name}</span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {c.programCount.toLocaleString()} programs · {c.universities.size} universities
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-900 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
        <p className="text-[12px] text-gray-500 mt-10">
          Program counts reflect our verified database, not every program the
          university offers. Always confirm details on the official program
          page before applying.
        </p>
      </main>
    </div>
  );
}

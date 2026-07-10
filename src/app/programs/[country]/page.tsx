import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BrandNav from "@/components/BrandNav";
import { COUNTRY_NODES, getCountry } from "@/lib/program-slugs";

interface Props {
  params: { country: string };
}

export function generateStaticParams() {
  return [...COUNTRY_NODES.values()]
    .filter((c) => c.programCount > 0)
    .map((c) => ({ country: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const country = getCountry(params.country);
  if (!country) return {};
  return {
    title: `Study in ${country.name} — ${country.programCount.toLocaleString()} verified programs`,
    description: `Browse ${country.programCount.toLocaleString()} verified study programs at ${country.universities.size} universities in ${country.name}. Fees, deadlines and entry requirements checked at the source.`,
    alternates: { canonical: `/programs/${params.country}` },
  };
}

/** /programs/[country] — country hub listing its universities. */
export default function CountryHubPage({ params }: Props) {
  const country = getCountry(params.country);
  if (!country || country.programCount === 0) notFound();

  const universities = [...country.universities.values()].sort(
    (a, b) => b.programs.length - a.programs.length || a.name.localeCompare(b.name),
  );

  return (
    <div className="min-h-screen bg-white">
      <BrandNav variant="light" />
      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <nav className="text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/programs" className="hover:text-violet-700 hover:underline">Programs</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-800 font-semibold">{country.name}</span>
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          <span aria-hidden>{country.flag}</span> Study in {country.name}
        </h1>
        <p className="text-base text-gray-500 leading-relaxed max-w-2xl mb-10">
          {country.programCount.toLocaleString()} verified programs across{" "}
          {country.universities.size} universities. Every figure below links
          back to the university&apos;s official page.
        </p>
        <ul className="grid sm:grid-cols-2 gap-3">
          {universities.map((u) => (
            <li key={u.slug}>
              <Link
                href={`/programs/${country.slug}/${u.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-violet-300 hover:shadow-sm transition-all"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold text-gray-900 truncate">{u.name}</span>
                  <span className="block text-xs text-gray-500">
                    {u.programs.length} verified {u.programs.length === 1 ? "program" : "programs"}
                  </span>
                </span>
                <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-12 rounded-2xl bg-stone-50 border border-stone-200 p-6">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Not sure which of these fit your profile?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Share your profile once and get up to 40 matches customised to it,
            split by your likelihood of an offer.
          </p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
          >
            See if I qualify
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

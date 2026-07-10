import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BrandNav from "@/components/BrandNav";
import { getUniversity, getCountry } from "@/lib/program-slugs";
import { formatFee, getFeeStatus, FEE_STATUS_LABEL } from "@/lib/format-fee";

interface Props {
  params: { country: string; university: string };
}

// ~636 university pages: rendered on demand and cached by Vercel rather
// than pre-built (keeps deploy time flat as the database grows).
export const dynamic = "force-static";

export function generateMetadata({ params }: Props): Metadata {
  const uni = getUniversity(params.country, params.university);
  const country = getCountry(params.country);
  if (!uni || !country) return {};
  return {
    title: `${uni.name} — ${uni.programs.length} verified programs`,
    description: `All ${uni.programs.length} verified programs at ${uni.name}, ${country.name}: tuition fees, durations and entry requirements checked at the official source.`,
    alternates: { canonical: `/programs/${params.country}/${params.university}` },
  };
}

/** /programs/[country]/[university] — one university's verified programs. */
export default function UniversityHubPage({ params }: Props) {
  const country = getCountry(params.country);
  const uni = getUniversity(params.country, params.university);
  if (!country || !uni) notFound();

  const pg = uni.programs.filter((p) => p.program.degree_level === "postgraduate");
  const ug = uni.programs.filter((p) => p.program.degree_level === "undergraduate");
  const other = uni.programs.filter((p) => !p.program.degree_level);
  const qs = uni.programs.map((p) => p.program.qs_ranking).filter((r): r is number => r != null);
  const minQs = qs.length ? Math.min(...qs) : null;

  const groups: Array<{ label: string; items: typeof uni.programs }> = [
    { label: "Postgraduate", items: pg },
    { label: "Undergraduate", items: ug },
    { label: "Other programs", items: other },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-white">
      <BrandNav variant="light" />
      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <nav className="text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/programs" className="hover:text-violet-700 hover:underline">Programs</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/programs/${country.slug}`} className="hover:text-violet-700 hover:underline">{country.name}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-gray-800 font-semibold">{uni.name}</span>
        </nav>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
          {uni.name}
        </h1>
        <p className="text-sm text-gray-500 mb-10">
          <span aria-hidden>{country.flag}</span> {country.name}
          {minQs != null && <> · QS rank #{minQs}</>}
          {" · "}{uni.programs.length} verified {uni.programs.length === 1 ? "program" : "programs"}
        </p>

        {groups.map((g) => (
          <section key={g.label} className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-3">
              {g.label} ({g.items.length})
            </h2>
            <ul className="space-y-2">
              {g.items.map((n) => {
                const p = n.program;
                const feeStatus = getFeeStatus(p);
                return (
                  <li key={n.slug}>
                    <Link
                      href={`/programs/${country.slug}/${uni.slug}/${n.slug}`}
                      className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-violet-300 hover:shadow-sm transition-all"
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">{p.program_name}</span>
                        <span className="block text-xs text-gray-500 truncate">
                          {p.field_of_study}
                          {p.duration_months ? <> · {p.duration_months} months</> : null}
                          {" · "}
                          {feeStatus === "not_available"
                            ? "fee not published"
                            : `${formatFee(p)} (${FEE_STATUS_LABEL[feeStatus].toLowerCase()})`}
                        </span>
                      </span>
                      <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className="mt-4 rounded-2xl bg-stone-50 border border-stone-200 p-6">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Which of these would actually make you an offer?
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Get a personalised shortlist — up to 40 matches split by your
            likelihood of an offer.
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

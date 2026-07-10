import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import BrandNav from "@/components/BrandNav";
import { getProgram } from "@/lib/program-slugs";
import { formatFee, getFeeStatus, FEE_STATUS_LABEL, FEE_STATUS_CLASS } from "@/lib/format-fee";

interface Props {
  params: { country: string; university: string; program: string };
}

// ~9,300 program pages: rendered on demand and cached by Vercel rather
// than pre-built (pre-rendering all of them would blow up deploy time).
export const dynamic = "force-static";

export function generateMetadata({ params }: Props): Metadata {
  const hit = getProgram(params.country, params.university, params.program);
  if (!hit) return {};
  const { node, university, country } = hit;
  const p = node.program;
  const fee = getFeeStatus(p) === "not_available" ? "" : ` Tuition ${formatFee(p)}.`;
  return {
    title: `${p.program_name} — ${university.name}`,
    description: `${p.program_name} at ${university.name}, ${country.name}: verified tuition, duration, deadlines and entry requirements.${fee}`,
    alternates: { canonical: `/programs/${params.country}/${params.university}/${params.program}` },
  };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 mt-1">{value}</p>
    </div>
  );
}

/** /programs/[country]/[university]/[program] — verified program detail. */
export default function ProgramDetailPage({ params }: Props) {
  const hit = getProgram(params.country, params.university, params.program);
  if (!hit) notFound();
  const { node, university, country } = hit;
  const p = node.program;

  const feeStatus = getFeeStatus(p);
  const english: string[] = [];
  if (p.min_ielts != null) english.push(`IELTS ${p.min_ielts}`);
  if (p.min_toefl != null) english.push(`TOEFL ${p.min_toefl}`);
  if (p.min_pte != null) english.push(`PTE ${p.min_pte}`);
  if (p.min_duolingo != null) english.push(`Duolingo ${p.min_duolingo}`);

  const related = university.programs.filter((n) => n.slug !== node.slug).slice(0, 5);

  // Course structured data — only fields we actually verified; nothing invented.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: p.program_name,
    description: `${p.program_name} (${p.field_of_study}) at ${university.name}, ${country.name}.`,
    provider: { "@type": "CollegeOrUniversity", name: university.name },
    ...(p.program_url ? { url: p.program_url } : {}),
  };

  return (
    <div className="min-h-screen bg-white">
      <BrandNav variant="light" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-12 sm:py-16">
        <nav className="text-xs text-gray-500 mb-6" aria-label="Breadcrumb">
          <Link href="/programs" className="hover:text-violet-700 hover:underline">Programs</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/programs/${country.slug}`} className="hover:text-violet-700 hover:underline">{country.name}</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/programs/${country.slug}/${university.slug}`} className="hover:text-violet-700 hover:underline">{university.name}</Link>
        </nav>

        <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
          {p.program_name}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {university.name} · <span aria-hidden>{country.flag}</span> {country.name}
          {p.city ? <> · {p.city}</> : null}
          {p.qs_ranking != null && <> · QS #{p.qs_ranking}</>}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <Fact
            label="Level"
            value={
              p.degree_level === "postgraduate" ? "Postgraduate"
              : p.degree_level === "undergraduate" ? "Undergraduate"
              : "See official page"
            }
          />
          <Fact label="Field" value={p.field_of_study} />
          <Fact label="Duration" value={p.duration_months ? `${p.duration_months} months` : "Not published"} />
          <div className="rounded-xl border border-stone-200 bg-white px-4 py-3 col-span-2 sm:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Annual tuition (international)</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">
              {feeStatus === "not_available" ? "Not published" : formatFee(p, { withUsd: true })}
            </p>
            <span className={`inline-block mt-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${FEE_STATUS_CLASS[feeStatus]}`}>
              {FEE_STATUS_LABEL[feeStatus]}
            </span>
          </div>
          <Fact
            label="English requirement"
            value={english.length ? english.join(" / ") : "Not published"}
          />
          <Fact
            label="Application deadline"
            value={p.application_deadline ?? "Not published"}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          {p.program_url && (
            <a
              href={p.program_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full border border-stone-300 text-gray-700 text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Official program page
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors"
          >
            See if I qualify for this program
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="text-[12px] text-gray-500 leading-relaxed mb-12">
          Figures were extracted from the university&apos;s official pages
          {p.verified_at ? ` (last verified ${new Date(p.verified_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })})` : ""}.
          &ldquo;Not published&rdquo; means the official page didn&apos;t state a value —
          we never estimate silently. Always confirm with the university
          before applying.
        </p>

        {related.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600 mb-3">
              More at {university.name}
            </h2>
            <ul className="space-y-2">
              {related.map((n) => (
                <li key={n.slug}>
                  <Link
                    href={`/programs/${country.slug}/${university.slug}/${n.slug}`}
                    className="group flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-violet-300 hover:shadow-sm transition-all"
                  >
                    <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900 truncate">
                      {n.program.program_name}
                    </span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-gray-300 group-hover:text-violet-600 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

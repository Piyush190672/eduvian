import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Why eduvianAI exists — a note from the founder",
  description:
    "After more than eleven years at IDP Education leading its business across South Asia, Canada, Latin America and Mauritius, Piyush Kumar built eduvianAI: independent, transparent, evidence-based decision support for students and families.",
};

/**
 * /why-eduvianai — founder letter, refined problem-first version
 * (source: EduvianAI_Founder_Story_Refined.docx, 14 Jul 2026) with two
 * founder-locked factual constraints restored: IDP role is REGIONAL
 * (South Asia, Canada, Latin America, Mauritius) and the guidance-gap is
 * an INDUSTRY observation, not an IDP one. "advice" → "guidance"
 * throughout (reserved: "decision-support, not professional advice").
 * Canonical scale fact: "tens of thousands of students".
 */

const PRINCIPLES = [
  "Trust before transactions.",
  "Evidence before opinion.",
  "Transparency before persuasion.",
  "Independent guidance before commercial interests.",
  "Long-term student success above everything else.",
] as const;

export default function WhyEduvianAI() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-[#0F172A]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="eduvianAI home">
            <img src="/logo.svg" alt="" width={32} height={32} className="w-8 h-8 rounded-lg" />
            <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[44px] text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 sm:px-10 py-14 sm:py-20">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-800 mb-4">
          A personal note from the founder
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.08] mb-10">
          Why eduvianAI exists
        </h1>

        <div className="flex items-center gap-5 mb-10">
          <img
            src="/founder-piyush.jpg"
            alt="Piyush Kumar"
            width={96}
            height={96}
            decoding="async"
            className="w-24 h-24 rounded-2xl object-cover border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
          />
          <div>
            <p className="font-display text-lg font-bold text-slate-900">Piyush Kumar</p>
            <p className="text-sm text-slate-500">Founder, eduvianAI</p>
          </div>
        </div>

        <div className="space-y-6 text-[17px] text-slate-700 leading-relaxed">
          <p>
            Over the years, I have met thousands of students and parents
            standing at one of the most important crossroads of their lives.
          </p>
          <p>
            Choosing where, what and how to study abroad is no longer a simple
            decision. Immigration policies change. Tuition fees continue to
            rise. Career opportunities evolve rapidly. Information is
            everywhere, yet clarity is often missing.
          </p>
          <p>
            After more than eleven years at IDP Education, one of the
            world&apos;s largest international education companies — where I
            led its business across South Asia, Canada, Latin America and
            Mauritius — I came to one important realisation. Across the
            international education industry, the biggest challenge
            wasn&apos;t helping students access information. It was helping
            them know what to trust.
          </p>
          <p>
            During this journey, the teams I had the privilege to lead
            supported <strong>tens of thousands of students from South
            Asia</strong> in pursuing higher education across the world. Every
            interaction reinforced the same belief: students and parents
            deserve guidance that is transparent, personalised and grounded in
            evidence — not assumptions or commercial interests.
          </p>
          <p>That belief became eduvianAI.</p>
          <p>
            I didn&apos;t build eduvianAI to replace human expertise. I built
            it to make trusted expertise more accessible. By combining deep
            domain knowledge with modern technology, eduvianAI helps students
            compare options, understand trade-offs and make informed decisions
            with confidence.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-white border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)] p-7 sm:p-8">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-2">
            The principles that guide eduvianAI
          </h2>
          <p className="text-sm text-slate-500 mb-5">
            Every recommendation on this platform is guided by principles that
            have shaped my career.
          </p>
          <ul className="space-y-3">
            {PRINCIPLES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-slate-700">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-blue-800 shrink-0" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 space-y-6 text-[17px] text-slate-700 leading-relaxed">
          <p>
            My hope is simple. Every student should leave with greater
            clarity. Every parent should leave with greater confidence.
          </p>
          <p>
            If eduvianAI helps even one family make a better-informed decision
            because they had access to information they could understand and
            trust, then we will have achieved exactly what we set out to do.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-[#0F172A] text-white p-7 sm:p-8">
          <h2 className="font-display text-xl font-bold mb-4">About the founder</h2>
          <p className="text-[15px] text-white/80 leading-relaxed">
            Piyush Kumar is the Founder of eduvianAI and former Regional
            Director at IDP Education, where he served on the Global
            Leadership Team and led businesses across South Asia, Canada,
            Latin America and Mauritius. Over a 27-year career spanning
            international education, financial services and consumer
            businesses, he has led large-scale growth, digital transformation,
            operational excellence and customer experience initiatives. Under
            his leadership, teams supported tens of thousands of students from
            South Asia in pursuing higher education overseas. He is a regular
            contributor to leading media on international education and global
            student mobility. eduvianAI reflects his belief that every student
            and parent deserves independent, transparent and evidence-based
            guidance when making one of life&apos;s most important decisions.
          </p>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/profile"
            className="group inline-flex items-center gap-2 px-7 py-3.5 min-h-[48px] rounded-full bg-blue-900 hover:bg-blue-800 text-white text-base font-bold shadow-lg shadow-blue-950/20 transition-all"
          >
            Check my readiness
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link
            href="/methodology"
            className="text-sm font-semibold text-blue-800 hover:underline"
          >
            See how we verify data
          </Link>
        </div>
      </main>
    </div>
  );
}

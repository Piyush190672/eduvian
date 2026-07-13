import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Why I built eduvianAI — a note from the founder",
  description:
    "After eleven years leading one of the world's largest international education businesses, Piyush Kumar built eduvianAI: independent, verified, transparent decision support for students and families.",
};

/**
 * /why-eduvianai — founder letter (source: user's Word doc, 13 Jul 2026).
 * One wording change from the original, approved path: "Independent
 * advice" → "Independent guidance" (the word "advice" is reserved —
 * "decision-support, not professional advice").
 */

const PRINCIPLES = [
  "Trust before transactions.",
  "Independent guidance before commercial interests.",
  "Verified facts before opinions.",
  "Transparency in every recommendation.",
  "Technology that empowers people, not replaces them.",
  "Long-term student success over short-term outcomes.",
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
          Why I built eduvianAI
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
            For more than eleven years at IDP Education, one of the
            world&apos;s largest international education companies, I had the
            privilege of leading its business across South Asia, Canada, Latin
            America and Mauritius — helping students pursue higher education
            overseas while navigating an increasingly complex global landscape.
          </p>
          <p>
            Across the international education industry, the biggest challenge
            was rarely a lack of information. It was a lack of trustworthy,
            transparent and personalised guidance. Families were often forced
            to rely on fragmented information, conflicting opinions or advice
            influenced by commercial interests. I believed there had to be a
            better way.
          </p>
          <p>
            eduvianAI was created to combine deep domain expertise with modern
            technology so that every recommendation is grounded in verified
            information and tailored to the individual student. The goal is not
            to replace human judgement, but to help families make
            better-informed decisions with greater confidence.
          </p>
          <p>
            The principles behind eduvianAI reflect the values that have guided
            my career: trust, integrity, transparency, factual information,
            independence and an unwavering focus on students. I want every
            student and every parent to understand not only what decision to
            make, but why that decision is right for them.
          </p>
          <p>
            eduvianAI is my commitment to making one of life&apos;s most
            important decisions clearer, more transparent and more
            evidence-based.
          </p>
        </div>

        <div className="mt-12 rounded-3xl bg-white border border-slate-200 shadow-[0_16px_40px_rgba(15,23,42,0.06)] p-7 sm:p-8">
          <h2 className="font-display text-xl font-bold text-slate-900 mb-5">
            The principles that guide eduvianAI
          </h2>
          <ul className="space-y-3">
            {PRINCIPLES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] text-slate-700">
                <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-blue-800 shrink-0" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
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

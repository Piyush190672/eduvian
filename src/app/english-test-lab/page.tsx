"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DecisionDisclaimer from "@/components/DecisionDisclaimer";
import {
  ArrowRight,
  BookOpen,
  Mic,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FlaskConical,
  Headphones,
  PenLine,
  Eye,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg shadow-black/20">
      <Link href="/" className="flex items-center gap-3 py-4 flex-shrink-0">
        <EduvianLogoMark size={36} />
        <div>
          <span className="font-display font-bold text-base text-white tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
          <p className="text-[10px] text-indigo-300 leading-none font-medium">Your Global Future, Simplified</p>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/" className="text-slate-300 hover:text-white text-sm font-semibold transition-colors">
          ← Home
        </Link>
        <Link
          href="/get-started"
          className="flex items-center gap-2 px-5 py-2.5 my-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5"
        >
          Get Started Free
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </nav>
  );
}

// ─── Exam data ────────────────────────────────────────────────────────────────

const EXAMS = [
  {
    id: "ielts",
    name: "IELTS Academic-Style",
    subtitle: "International English Language Testing System practice",
    accent: "from-sky-500 to-blue-600",
    accentLight: "from-sky-50 to-blue-50",
    accentBorder: "border-sky-200",
    accentText: "text-sky-700",
    accentBadge: "bg-sky-100 text-sky-700",
    duration: "Approx. 2 hr 45 min",
    skills: ["Listening", "Reading", "Writing", "Speaking"],
    mocks: 3,
    org: "British Council / IDP / Cambridge Assessment English",
    badge: "Free Practice",
    description: "Full Academic mock with 4 sections: browser-based listening, 3 reading passages, 2 writing tasks, and 3-part speaking. Mock 1 available now.",
  },
  {
    id: "pte",
    name: "PTE Academic-Style",
    subtitle: "Pearson Test of English Academic practice",
    accent: "from-violet-500 to-purple-600",
    accentLight: "from-violet-50 to-purple-50",
    accentBorder: "border-violet-200",
    accentText: "text-violet-700",
    accentBadge: "bg-violet-100 text-violet-700",
    duration: "Approx. 45 min",
    skills: ["Speaking", "Writing", "Reading"],
    mocks: 3,
    org: "Pearson",
    badge: "Free Practice",
    description: "PTE-style tasks: Read Aloud, Repeat Sentence, Describe Image, Essay, Fill in the Blanks, Write from Dictation and more. Mock 1 available now.",
  },
  {
    id: "det",
    name: "DET-Style Readiness Test",
    subtitle: "Duolingo English Test practice",
    accent: "from-emerald-500 to-teal-600",
    accentLight: "from-emerald-50 to-teal-50",
    accentBorder: "border-emerald-200",
    accentText: "text-emerald-700",
    accentBadge: "bg-emerald-100 text-emerald-700",
    duration: "Approx. 20-25 min",
    skills: ["Literacy", "Comprehension", "Conversation", "Production"],
    mocks: 3,
    org: "Duolingo",
    badge: "Free Practice",
    description: "Adaptive readiness test covering all DET task formats. 3 mini-mocks with different content sets.",
  },
  {
    id: "toefl",
    name: "TOEFL iBT-Style",
    subtitle: "Test of English as a Foreign Language practice",
    accent: "from-amber-500 to-orange-600",
    accentLight: "from-amber-50 to-orange-50",
    accentBorder: "border-amber-200",
    accentText: "text-amber-700",
    accentBadge: "bg-amber-100 text-amber-700",
    duration: "Approx. 45 min",
    skills: ["Reading", "Writing (Integrated)", "Writing (Academic)", "Speaking"],
    mocks: 3,
    org: "Educational Testing Service (ETS)",
    badge: "Free Practice",
    description: "Covers TOEFL Reading, Listening, Integrated Writing with lecture, Academic Discussion, and Independent Speaking. Mock 1 available now.",
  },
];

const SKILL_ICONS: Record<string, React.ReactNode> = {
  Listening: <Headphones className="w-3.5 h-3.5" />,
  Reading: <BookOpen className="w-3.5 h-3.5" />,
  Writing: <PenLine className="w-3.5 h-3.5" />,
  "Writing (Integrated)": <PenLine className="w-3.5 h-3.5" />,
  "Writing (Academic)": <PenLine className="w-3.5 h-3.5" />,
  Speaking: <Mic className="w-3.5 h-3.5" />,
  "Speaking (Independent)": <Mic className="w-3.5 h-3.5" />,
  Literacy: <Eye className="w-3.5 h-3.5" />,
  Comprehension: <BookOpen className="w-3.5 h-3.5" />,
  Conversation: <Mic className="w-3.5 h-3.5" />,
  Production: <PenLine className="w-3.5 h-3.5" />,
};

const OFFICIAL_LINKS = [
  { name: "IELTS", org: "British Council", url: "https://www.britishcouncil.org/exam/ielts" },
  { name: "IELTS", org: "IDP Australia", url: "https://www.ielts.org" },
  { name: "PTE Academic", org: "Pearson", url: "https://www.pearsonpte.com" },
  { name: "Duolingo English Test", org: "Duolingo", url: "https://englishtest.duolingo.com" },
  { name: "TOEFL iBT", org: "ETS", url: "https://www.ets.org/toefl" },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EnglishTestLabPage() {
  const [hoveredExam, setHoveredExam] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white font-sans">
      <Nav />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 mb-6">
              <FlaskConical className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-bold text-indigo-200 tracking-wide">English Test Lab</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
              Free English test practice<br />
              <span className="bg-gradient-to-r from-sky-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
                that feels close to the real thing
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Take exam-style mocks for IELTS, PTE, Duolingo English Test, and TOEFL. Practice that mirrors each exam&apos;s publicly documented format, timing and scoring framework — with original content created by eduvianAI.
            </p>

            <Link
              href="/english-test-lab/ielts"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-base hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-1"
            >
              Start a free mock
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#all-tests" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border-2 border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all duration-200 ml-3">
              See all tests
            </a>

            <div className="mt-6 max-w-xl mx-auto">
              <DecisionDisclaimer
                variant="english-test"
                className="flex items-start gap-2.5 text-[11px] leading-relaxed text-slate-300 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-left"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Exam Cards */}
      <section id="all-tests" className="max-w-6xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-black text-slate-900 mb-3">Choose your practice exam</h2>
          <p className="text-slate-500 text-sm">All mocks are free. No account needed. AI scores your writing and speaking.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {EXAMS.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              onMouseEnter={() => setHoveredExam(exam.id)}
              onMouseLeave={() => setHoveredExam(null)}
              className={`rounded-3xl border bg-white p-6 transition-all duration-300 ${
                hoveredExam === exam.id ? "shadow-xl -translate-y-1 border-transparent ring-2 ring-slate-200" : "border-slate-200 shadow-sm"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${exam.accentBadge} mb-2`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {exam.badge}
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">{exam.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{exam.subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${exam.accent} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
              </div>

              <p className="text-sm text-slate-600 mb-4 leading-relaxed">{exam.description}</p>

              {/* Meta */}
              <div className="flex items-center gap-4 mb-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {exam.duration}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {exam.mocks} mocks
                </span>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {exam.skills.map((skill) => (
                  <span key={skill} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600`}>
                    {SKILL_ICONS[skill] ?? <BookOpen className="w-3.5 h-3.5" />}
                    {skill}
                  </span>
                ))}
              </div>

              {/* CTA */}
              {exam.id === "det" ? (
                <p className="text-xs text-slate-400 mb-3 italic">Mock 1–3 available · More in development</p>
              ) : (
                <p className="text-xs text-slate-400 mb-3 italic">Mock 1 fully available · Mocks 2 &amp; 3 in development</p>
              )}
              <Link
                href={`/english-test-lab/${exam.id}`}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r ${exam.accent} text-white text-sm font-bold hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5`}
              >
                Start mock
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features row */}
      <section className="bg-slate-900 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: <Mic className="w-6 h-6 text-indigo-400" />, title: "Voice recording", desc: "Browser Web Speech API — no app download" },
              { icon: <FlaskConical className="w-6 h-6 text-violet-400" />, title: "AI scoring", desc: "Claude AI scores writing & speaking tasks" },
              { icon: <Clock className="w-6 h-6 text-sky-400" />, title: "Timed sections", desc: "Real exam timers with auto-advance" },
              { icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />, title: "Instant feedback", desc: "Strengths, improvements, and band estimate" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.5 }}
                className="text-center"
              >
                <div className="flex justify-center mb-3">{f.icon}</div>
                <p className="text-white font-bold text-sm mb-1">{f.title}</p>
                <p className="text-slate-400 text-xs">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Official Links Panel */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
          <h3 className="text-base font-extrabold text-slate-800 mb-1">For official exams, visit the test providers directly</h3>
          <p className="text-xs text-slate-500 mb-5">eduvianAI is not affiliated with any of these organisations. Official tests require registration and payment.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {OFFICIAL_LINKS.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{link.name}</p>
                  <p className="text-xs text-slate-500">{link.org}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="text-center py-8 border-t border-slate-100">
        <p className="text-xs text-slate-400 max-w-2xl mx-auto px-4">
          eduvianAI English Test Lab provides original practice content for exam preparation purposes only.
          All trademarks belong to their respective owners. This service is not a substitute for official test preparation programmes.
        </p>
      </footer>
    </div>
  );
}

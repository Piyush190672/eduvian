"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DB_STATS } from "@/data/db-stats";

const STAGE_DURATION = 18; // seconds per stage — 4 × 18 = ~72s total

// ── The student's journey — one cohesive narrative ─────────────────────────
const STAGES = [
  {
    num: 1,
    label: "MATCH",
    gradient: "from-indigo-600 to-violet-600",
    bg: "from-slate-950 via-indigo-950 to-slate-950",
    accent: "text-indigo-300",
    accentBg: "bg-indigo-500/20 border-indigo-500/30",
    // Story
    moment: "The confusion",
    before: `Priya is a 22-year-old CS graduate from Pune. She wants to study abroad — but stares at ${DB_STATS.verifiedProgramsLabel} programs across ${DB_STATS.totalCountries} countries and has no idea where she actually stands a chance.`,
    quote: "\"I don't even know if my 7.8 CGPA is good enough for the UK. Or if I should even try for the UK.\"",
    after: "In 90 seconds, eduvianAI matches her profile against every program and returns 20 ranked universities — split into Safe, Reach, and Ambitious — with a match score for each.",
    transform: "From overwhelmed → to a clear, personalised shortlist",
    stat: { val: DB_STATS.verifiedProgramsLabel, label: "programs analysed in 90 seconds" },
    cta: { label: "Find my programs", href: "/get-started" },
  },
  {
    num: 2,
    label: "CHECK",
    gradient: "from-fuchsia-600 to-pink-600",
    bg: "from-slate-950 via-fuchsia-950 to-slate-950",
    accent: "text-pink-300",
    accentBg: "bg-pink-500/20 border-pink-500/30",
    moment: "The self-doubt",
    before: "Priya has her shortlist. But her SOP starts with \"I have always been passionate about technology\" — exactly like the 10,000 other applicants competing for the same seats.",
    quote: "\"My SOP feels generic. My CV has a 6-month gap. I don't know if any of this is strong enough.\"",
    after: "eduvianAI scores her SOP for clichés, logic gaps, and credibility. It rebuilds her CV to international standards. Her application strength goes from 61% to 84% in one session.",
    transform: "From \"I hope it's good enough\" → to top-15% application quality",
    stat: { val: "+23pts", label: "average application strength gain" },
    cta: { label: "Check my application", href: "/application-check" },
  },
  {
    num: 3,
    label: "PRACTICE",
    gradient: "from-emerald-500 to-teal-500",
    bg: "from-slate-950 via-teal-950 to-slate-950",
    accent: "text-emerald-300",
    accentBg: "bg-emerald-500/20 border-emerald-500/30",
    moment: "The fear",
    before: "Priya's UK visa interview is in 3 weeks. She's never been asked \"Why leave India?\" or \"Prove you'll come back.\" She has no idea what the officer is really looking for.",
    quote: "\"I know my subject. But I might completely freeze when they ask about my return plans.\"",
    after: "She runs through 14 UK credibility questions in voice mode. AI flags 4 answers as too vague and gives her the exact phrasing to sound convincing — not rehearsed, but credible.",
    transform: "From \"I might freeze\" → to answered every question 14 times already",
    stat: { val: "14", label: "UK credibility questions coached in one session" },
    cta: { label: "Start practising", href: "/interview-prep" },
  },
  {
    num: 4,
    label: "DECIDE",
    gradient: "from-amber-500 to-orange-500",
    bg: "from-slate-950 via-amber-950 to-slate-950",
    accent: "text-amber-300",
    accentBg: "bg-amber-500/20 border-amber-500/30",
    moment: "The impossible choice",
    before: "Priya has three offers — UCL London, University of Edinburgh, and University of Melbourne. Her parents push for Melbourne because they've heard of it. Priya isn't sure.",
    quote: "\"All three feel amazing. How do I tell my parents that the 'lesser-known' one might be the smarter choice?\"",
    after: "The ROI Calculator shows UCL pays back in 3.2 years vs. 5.8 for Melbourne. The Parent Decision Tool turns the data into a two-page family report. Her parents read it. They agree: UCL.",
    transform: "From family tension → to a unanimous, data-backed decision",
    stat: { val: "3.2 yrs", label: "UCL payback period vs 5.8 yrs for Melbourne" },
    cta: { label: "Run the numbers", href: "/roi-calculator" },
  },
];

// ── Per-stage product evidence panel ──────────────────────────────────────

function EvidencePanel({ num, active }: { num: number; active: boolean }) {
  if (num === 1) {
    const rows = [
      { flag: "🇬🇧", uni: "Univ. of Leeds",       prog: "MSc AI & Data Science",  score: 88, tier: "Safe",      tc: "text-emerald-400", bc: "bg-emerald-900/40 border-emerald-600/30" },
      { flag: "🇨🇦", uni: "Univ. of Toronto",     prog: "MEng Computer Science",  score: 91, tier: "Safe",      tc: "text-emerald-400", bc: "bg-emerald-900/40 border-emerald-600/30" },
      { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", uni: "Univ. of Edinburgh",  prog: "MSc Computer Science",   score: 76, tier: "Reach",     tc: "text-amber-400",   bc: "bg-amber-900/40 border-amber-600/30" },
      { flag: "🇩🇪", uni: "TU Munich",             prog: "MSc Informatics",         score: 79, tier: "Reach",     tc: "text-amber-400",   bc: "bg-amber-900/40 border-amber-600/30" },
      { flag: "🇬🇧", uni: "Imperial College",      prog: "MSc Machine Learning",    score: 63, tier: "Ambitious", tc: "text-violet-400",  bc: "bg-violet-900/40 border-violet-600/30" },
    ];
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Priya&apos;s Top 20 Shortlist</p>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/30">AI Match · 90s</span>
        </div>
        <div className="space-y-1.5">
          {rows.map((r, i) => (
            <motion.div key={r.uni}
              initial={{ opacity: 0, x: -10 }}
              animate={active ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              transition={{ delay: active ? i * 0.22 + 0.3 : 0, duration: 0.3 }}
              className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0"
            >
              <span className="text-sm flex-shrink-0 leading-none">{r.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-white truncate">{r.uni}</p>
                <p className="text-[8px] text-white/35 truncate">{r.prog}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[9px] font-black text-white/60">{r.score}%</span>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full border ${r.bc} ${r.tc}`}>{r.tier}</span>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.6 }}
          className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between">
          <span className="text-[8px] text-white/25">Showing 5 of 20 matches</span>
          <span className="text-[8px] font-bold text-indigo-400">View all →</span>
        </motion.div>
      </div>
    );
  }

  if (num === 2) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-3">
        <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">Priya&apos;s Application Score</p>
        {[
          { label: "Before", pct: 61, color: "from-rose-500 to-orange-400", tx: "text-white/40", delay: 0.3 },
          { label: "After eduvianAI", pct: 84, color: "from-emerald-400 to-teal-400", tx: "text-emerald-400 font-bold", delay: 1.1 },
        ].map(b => (
          <div key={b.label}>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-[9px] ${b.tx}`}>{b.label}</span>
              <span className={`text-[9px] ${b.tx}`}>{b.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                initial={{ width: "0%" }} animate={active ? { width: `${b.pct}%` } : { width: "0%" }}
                transition={{ delay: b.delay, duration: 0.9 }} />
            </div>
          </div>
        ))}
        <div className="space-y-1.5 pt-1">
          {[
            { ok: true,  icon: "✅", text: "SOP opening rewritten — clichés removed" },
            { ok: true,  icon: "✅", text: "CV gap explained with freelance project" },
            { ok: false, icon: "⚠️", text: "Personal statement reference missing" },
            { ok: true,  icon: "✅", text: "References section format corrected" },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: active ? 2.1 + i * 0.25 : 0 }}
              className="flex items-center gap-2">
              <span className="text-[10px] flex-shrink-0">{item.icon}</span>
              <span className="text-[9px] text-white/55">{item.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (num === 3) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-teal-400 uppercase tracking-widest">UK Credibility Interview</p>
          <span className="text-[8px] text-white/35">Q 7 of 14</span>
        </div>
        <div className="bg-white/8 rounded-xl p-2.5">
          <p className="text-[8px] text-white/35 mb-1 uppercase tracking-wider">Question asked</p>
          <p className="text-[10px] font-bold text-white">&ldquo;Why are you not pursuing this course in India?&rdquo;</p>
        </div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-rose-900/30 border border-rose-700/30 rounded-xl p-2.5">
          <p className="text-[8px] font-bold text-rose-400 mb-1">⚠️ Priya&apos;s first attempt</p>
          <p className="text-[9px] text-white/45 italic">&ldquo;Because UK universities are better and more recognised globally...&rdquo;</p>
          <p className="text-[8px] text-rose-400/70 mt-1">AI: This sounds vague and unresearched. The officer will doubt your intent.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 5 }} animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ delay: 1.5 }}
          className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-2.5">
          <p className="text-[8px] font-bold text-emerald-400 mb-1">✨ After AI coaching</p>
          <p className="text-[9px] text-white/65">&ldquo;Similar programs in India don&apos;t offer the industry-linked curriculum at [uni]. My goal to work with [specific company] makes this the only practical path.&rdquo;</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.4 }}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-400 text-[10px]">✓</span>
          <span className="text-[8px] text-emerald-300">Answer approved — credibility score raised</span>
        </motion.div>
      </div>
    );
  }

  if (num === 4) {
    const bars = [
      { label: "UCL London",         yrs: 3.2, pct: 32, color: "from-emerald-400 to-teal-400",  best: true  },
      { label: "Univ. of Edinburgh", yrs: 4.8, pct: 48, color: "from-amber-400 to-orange-400",  best: false },
      { label: "Univ. of Melbourne", yrs: 5.8, pct: 58, color: "from-rose-400 to-pink-400",     best: false },
    ];
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">ROI · Payback Period</p>
          <span className="text-[8px] text-white/35">auto-filled data</span>
        </div>
        {bars.map((b, i) => (
          <motion.div key={b.label}
            initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: active ? i * 0.4 + 0.3 : 0 }}
          >
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1">
                {b.best && <span className="text-emerald-400 text-[8px]">⭐</span>}
                <span className={`text-[9px] font-bold ${b.best ? "text-white" : "text-white/45"}`}>{b.label}</span>
              </div>
              <span className={`text-[9px] font-bold ${b.best ? "text-emerald-400" : "text-white/35"}`}>{b.yrs} yrs</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div className={`h-full rounded-full bg-gradient-to-r ${b.color}`}
                initial={{ width: "0%" }}
                animate={active ? { width: `${b.pct}%` } : { width: "0%" }}
                transition={{ delay: active ? i * 0.4 + 0.6 : 0, duration: 0.8 }} />
            </div>
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 2.2 }}
          className="px-3 py-2 rounded-xl bg-emerald-900/30 border border-emerald-700/30">
          <p className="text-[8px] font-bold text-emerald-400 mb-0.5">⭐ eduvianAI recommendation</p>
          <p className="text-[9px] text-emerald-200">UCL London — pays back 2.6 years faster than Melbourne. Family report generated.</p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={active ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 3.0 }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/8">
          <p className="text-[8px] font-bold text-white/50 mb-0.5">👨‍👩‍👧 Parent Decision Tool</p>
          <p className="text-[9px] text-white/40">2-page family report generated · Priya&apos;s parents agreed: UCL.</p>
        </motion.div>
      </div>
    );
  }

  return null;
}

// ── Main modal ─────────────────────────────────────────────────────────────

interface Props { open: boolean; onClose: () => void; }

export default function HowItWorksModal({ open, onClose }: Props) {
  const [stage,   setStage]   = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (open) { setStage(0); setElapsed(0); setPlaying(true); }
  }, [open]);

  useEffect(() => {
    if (!open || !playing) return;
    const id = setInterval(() => {
      setElapsed(prev => {
        if (prev >= STAGE_DURATION - 0.1) {
          setStage(s => {
            if (s >= STAGES.length - 1) { setPlaying(false); return s; }
            return s + 1;
          });
          return 0;
        }
        return +(prev + 0.1).toFixed(1);
      });
    }, 100);
    return () => clearInterval(id);
  }, [open, playing]);

  useEffect(() => { setElapsed(0); }, [stage]);

  const goTo = (i: number) => { setStage(i); setElapsed(0); setPlaying(true); };

  if (!open) return null;

  const s = STAGES[stage];
  const totalElapsed   = stage * STAGE_DURATION + elapsed;
  const totalDuration  = STAGES.length * STAGE_DURATION;
  const totalPct       = (totalElapsed / totalDuration) * 100;
  const timeStr        = `${Math.floor(totalElapsed / 60)}:${String(Math.floor(totalElapsed % 60)).padStart(2, "0")}`;
  const isLast         = stage === STAGES.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 md:p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-slate-950/94 backdrop-blur-md" />

          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="relative w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-black/70 flex flex-col"
            style={{ maxHeight: "95dvh" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Stage background */}
            <AnimatePresence mode="wait">
              <motion.div key={stage}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className={`absolute inset-0 bg-gradient-to-br ${s.bg}`}
              />
            </AnimatePresence>

            {/* Ambient glow */}
            <div className={`absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br ${s.gradient} opacity-12 rounded-full blur-3xl pointer-events-none transition-colors duration-700`} />

            {/* ── Sticky top bar (not scrolled away) ── */}
            <div className="relative z-10 px-4 sm:px-7 pt-4 sm:pt-7 pb-0 flex-shrink-0">

              {/* Drag handle (mobile only) */}
              <div className="sm:hidden w-10 h-1 rounded-full bg-white/25 mx-auto mb-3" />

              {/* ── Top bar ── */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <svg width="26" height="26" viewBox="0 0 36 36" fill="none">
                    <rect width="36" height="36" rx="10" fill="url(#hwLg)"/>
                    <ellipse cx="18" cy="18" rx="11" ry="6" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" fill="none" transform="rotate(-30 18 18)"/>
                    <text x="18" y="23" textAnchor="middle" fill="white" fontFamily="system-ui" fontSize="16" fontWeight="800" letterSpacing="-1">e</text>
                    <circle cx="26.5" cy="11.5" r="2" fill="white" fillOpacity="0.9"/>
                    <defs>
                      <linearGradient id="hwLg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1"/><stop offset="1" stopColor="#A855F7"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div>
                    <span className="text-white font-bold text-sm">eduvian<span className="text-indigo-300">AI</span></span>
                    <span className="text-white/25 text-xs mx-1.5 hidden sm:inline">·</span>
                    <span className="text-white/45 text-xs hidden sm:inline">Priya&apos;s journey — from confused to confident</span>
                  </div>
                </div>
                <button onClick={onClose}
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors touch-manipulation">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* ── Stage pills ── */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
                {STAGES.map((st, i) => (
                  <button key={i} onClick={() => goTo(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0 touch-manipulation ${
                      i === stage
                        ? `bg-gradient-to-r ${s.gradient} text-white shadow-md`
                        : i < stage ? "bg-white/12 text-white/55 hover:bg-white/20"
                        : "bg-white/5 text-white/22 hover:bg-white/10"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black flex-shrink-0 ${i === stage ? "bg-white/30" : "bg-white/10"}`}>
                      {i < stage ? "✓" : st.num}
                    </span>
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Scrollable content area ── */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-7 pb-2">

              {/* ── Content: story + evidence stacked on mobile, side-by-side on sm+ ── */}
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 items-start">

                {/* Left — story */}
                <AnimatePresence mode="wait">
                  <motion.div key={`story-${stage}`}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-3"
                  >
                    {/* Stage badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${s.gradient} text-white text-[9px] font-black uppercase tracking-widest shadow-md`}>
                      <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-[8px] font-black">{s.num}</span>
                      Stage {s.num} · {s.label}
                      <span className="text-white/60 font-normal hidden sm:inline">— {s.moment}</span>
                    </div>

                    {/* Student's situation */}
                    <div className={`rounded-xl p-3 border ${s.accentBg}`}>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">Priya&apos;s situation</p>
                      <p className="text-xs text-white/65 leading-relaxed">{s.before}</p>
                    </div>

                    {/* Her exact thought */}
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                      className="pl-3 border-l-2 border-white/20">
                      <p className={`text-xs font-semibold italic ${s.accent} leading-relaxed`}>{s.quote}</p>
                    </motion.div>

                    {/* What eduvianAI does */}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                      className="rounded-xl p-3 bg-white/5 border border-white/8">
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1.5">What happens next</p>
                      <p className="text-xs text-white/65 leading-relaxed">{s.after}</p>
                    </motion.div>

                    {/* Transformation line */}
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r ${s.gradient} bg-opacity-20`}>
                      <span className="text-white text-xs font-black">{s.transform}</span>
                    </motion.div>

                    {/* Stat */}
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.7 }}
                      className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/7 border border-white/8">
                      <span className={`text-xl font-black ${s.accent}`}>{s.stat.val}</span>
                      <span className="text-xs text-white/40 leading-snug">{s.stat.label}</span>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>

                {/* Right — evidence (stacks below on mobile) */}
                <AnimatePresence mode="wait">
                  <motion.div key={`ev-${stage}`}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, delay: 0.06 }}
                  >
                    <p className="text-[8px] font-black text-white/25 uppercase tracking-widest mb-2">Live product view</p>
                    <EvidencePanel num={s.num} active={true} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* ── Sticky progress + controls (bottom) ── */}
            <div className="relative z-10 px-4 sm:px-7 pb-5 pt-3 flex-shrink-0 border-t border-white/8 bg-slate-950/30 backdrop-blur-sm">
              {/* Progress bar */}
              <div className="h-0.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${s.gradient}`}
                  style={{ width: `${totalPct}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => goTo(Math.max(0, stage - 1))} disabled={stage === 0}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors disabled:opacity-25 touch-manipulation">
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={() => setPlaying(p => !p)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg bg-gradient-to-r ${s.gradient} touch-manipulation`}>
                      {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                    </button>
                    <button onClick={() => isLast ? goTo(0) : goTo(stage + 1)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors touch-manipulation">
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-[10px] text-white/25 font-mono hidden sm:inline">{timeStr} / 1:12</span>
                  </div>

                  <Link href={s.cta.href} onClick={onClose}
                    className={`inline-flex items-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r ${s.gradient} text-white text-xs font-bold shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex-shrink-0 touch-manipulation`}>
                    {s.cta.label} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

// ─── Web Speech API type shims ────────────────────────────────────────────────
interface SpeechRecognitionResultItem { transcript: string; confidence: number; }
interface SpeechRecognitionResult {
  readonly isFinal: boolean; readonly length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventShim extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionShim extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: SpeechRecognitionEventShim) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionCtor { new(): SpeechRecognitionShim; }

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AU_GUIDELINES, UK_GUIDELINES } from "@/data/interview-guidelines";
import {
  Mic, Volume2, VolumeX, ChevronRight, RotateCcw, CheckCircle2,
  ArrowLeft, Globe2, Sparkles, Trophy, Clock, MessageSquare,
  BookOpen, Briefcase, MapPin, Building2, HelpCircle, ListChecks,
  ThumbsUp, AlertCircle, Loader2, User,
} from "lucide-react";
import Link from "next/link";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Country = "australia" | "uk";

// Phases:
// name        → collect student name (both)
// uk_confirm  → UK only: prompt "say YES to begin"
// category    → AU only: pick category or practice all
// speaking    → TTS reading the question
// listening   → STT capturing student answer
// review      → student sees their transcript, can re-answer or submit
// feedback    → AI-generated feedback displayed
// complete    → end of session summary
type Phase =
  | "name" | "uk_confirm" | "category"
  | "speaking" | "listening" | "review" | "feedback" | "complete";

interface QuestionCategory {
  id: string;
  label: string;
  objective: string;
  icon: React.ReactNode;
  questions: string[];
}

interface Answer {
  question: string;
  category: string;
  transcript: string;
  duration: number;
  feedback?: string;
}

// ─── Australia — 19 exact approved questions ──────────────────────────────────

const AU_CATEGORIES: QuestionCategory[] = [
  {
    id: "program", label: "About the Program",
    objective: "Gauge the applicant's understanding of the program and the logic behind choosing it.",
    icon: <BookOpen className="w-4 h-4" />,
    questions: [
      "Why have you chosen this course?",
      "What are the course contents and structure and how it is going to benefit you?",
      "How will this course improve your circumstances in your country?",
      "What independent research have you conducted in regards to this course?",
      "Your proposed course is inconsistent to your previous studies, and you don't have work experience in related field as well, so why you have chosen this course? Why are you changing your specialization?",
      "What all study options you considered while making your research?",
    ],
  },
  {
    id: "career", label: "Career Outcome",
    objective: "Establish correlation between previous academic background, proposed studies, career outcomes, ROI, and employment plans after completion.",
    icon: <Briefcase className="w-4 h-4" />,
    questions: [
      "What details can you share about the studies you have completed in the past and how are those studies linked to your proposed studies?",
      "How will this course improve your career prospects, what are the employment opportunities at completion of this course and remuneration level?",
      "What salary or remuneration do you expect in India after completing this course? Which all companies would you like to work for after completing this course?",
      "How will this course benefit you professionally and economically?",
    ],
  },
  {
    id: "australia", label: "Why Australia",
    objective: "Assess whether studying in Australia is a genuine and well-researched choice.",
    icon: <MapPin className="w-4 h-4" />,
    questions: [
      "Why have you chosen Australia as your study destination, what research have you made in regards to studying in Australia, its culture and lifestyle?",
      "Why are you not pursuing a similar course in India or any other country? Have you conducted any independent research to make sure if similar courses are available in India or not? If yes, what research you have conducted. If no, why not. If similar courses are available in India, why you are not opting for that?",
      "If not India, which all countries you considered while making your research for further studies, what research you conducted in regards to those countries?",
    ],
  },
  {
    id: "university", label: "About the University",
    objective: "Gauge the applicant's understanding of the university, campus, program strengths, and why this institution is better suited than others.",
    icon: <Building2 className="w-4 h-4" />,
    questions: [
      "You are going to which university and campus? Why have you chosen this university and campus? Where is this university or campus located in Australia?",
      "Why have you chosen this education provider or university, what independent research you have conducted on your part to make sure this is the right institution to pursue your study plans?",
      "Have you considered other universities also? If yes, which all universities you considered for your proposed education and what research you made in regards to those universities. If no, why you have not considered those options for your proposed studies?",
    ],
  },
  {
    id: "other", label: "Other Important Questions",
    objective: "Assess return incentives, study-gap justification, and seriousness of intent.",
    icon: <HelpCircle className="w-4 h-4" />,
    questions: [
      "How can you prove that you will come back after completing your studies?",
      "You finished your graduation or high school last year, what are you doing since then?",
      "You completed your graduation in 2012–13 and since then you are working, so now what made you take this decision of going for further education?",
    ],
  },
];

const AU_ALL_QUESTIONS = AU_CATEGORIES.flatMap((c) =>
  c.questions.map((q) => ({ question: q, category: c.label, objective: c.objective }))
);

// ─── UK — 14 exact approved questions (fixed linear sequence) ─────────────────

const UK_SEQUENCE: { question: string; category: string; objective: string }[] = [
  {
    question: "Why do you want to study in the UK?",
    category: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
  },
  {
    question: "Why did you choose this particular course?",
    category: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
  },
  {
    question: "Why did you choose this university?",
    category: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
  },
  {
    question: "Can you explain the course structure and key modules?",
    category: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
  },
  {
    question: "How is this course different from similar courses in India?",
    category: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
  },
  {
    question: "What are your career plans after completing this course?",
    category: "Career & Finances",
    objective: "Establish career plans, funding source, and return intent after studies.",
  },
  {
    question: "Who is sponsoring your education? How will you fund your studies?",
    category: "Career & Finances",
    objective: "Establish career plans, funding source, and return intent after studies.",
  },
  {
    question: "What is the duration of your course?",
    category: "Career & Finances",
    objective: "Establish career plans, funding source, and return intent after studies.",
  },
  {
    question: "Can you explain your academic background?",
    category: "Academic Background",
    objective: "Verify academic history, study gaps, and credibility of the application.",
  },
  {
    question: "Is there any gap in your education or employment?",
    category: "Academic Background",
    objective: "Verify academic history, study gaps, and credibility of the application.",
  },
  {
    question: "Where is your university located? What do you know about the city? What facilities are available at your university?",
    category: "University & Location",
    objective: "Check knowledge of university, city, campus facilities, and alternatives considered.",
  },
  {
    question: "Have you applied to any other universities or countries?",
    category: "University & Location",
    objective: "Check knowledge of university, city, campus facilities, and alternatives considered.",
  },
  {
    question: "Where will you stay in the UK?",
    category: "Visa & Logistics",
    objective: "Assess knowledge of UK visa rules, work rights, and accommodation plans.",
  },
  {
    question: "Do you understand UK visa rules and work rights?",
    category: "Visa & Logistics",
    objective: "Assess knowledge of UK visa rules, work rights, and accommodation plans.",
  },
];

const UK_CATEGORIES: QuestionCategory[] = [
  {
    id: "motivation", label: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
    icon: <Sparkles className="w-4 h-4" />,
    questions: UK_SEQUENCE.filter(q => q.category === "Study Motivation").map(q => q.question),
  },
  {
    id: "career", label: "Career & Finances",
    objective: "Establish career plans, funding source, and return intent after studies.",
    icon: <Briefcase className="w-4 h-4" />,
    questions: UK_SEQUENCE.filter(q => q.category === "Career & Finances").map(q => q.question),
  },
  {
    id: "background", label: "Academic Background",
    objective: "Verify academic history, study gaps, and credibility of the application.",
    icon: <BookOpen className="w-4 h-4" />,
    questions: UK_SEQUENCE.filter(q => q.category === "Academic Background").map(q => q.question),
  },
  {
    id: "university", label: "University & Location",
    objective: "Check knowledge of university, city, campus facilities, and alternatives considered.",
    icon: <Building2 className="w-4 h-4" />,
    questions: UK_SEQUENCE.filter(q => q.category === "University & Location").map(q => q.question),
  },
  {
    id: "logistics", label: "Visa & Logistics",
    objective: "Assess knowledge of UK visa rules, work rights, and accommodation plans.",
    icon: <MapPin className="w-4 h-4" />,
    questions: UK_SEQUENCE.filter(q => q.category === "Visa & Logistics").map(q => q.question),
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function parseFeedback(text: string, country: Country) {
  // Split the raw text into sections by looking for the known headings.
  // Both AU and UK share "What you did well:" as the first heading.
  // AU: "What you could improve:" / "A good sample answer is:"
  // UK: "Where you could improve:" / "Here is a sample answer:"
  // We match case-insensitively and tolerate extra spaces / missing colons.

  const WELL_RE    = /what you did well\s*:?\s*/i;
  const IMPROVE_RE = /(?:what|where) you could improve\s*:?\s*/i;
  const SAMPLE_RE  = /(?:a good sample answer is|here is a sample answer)\s*:?\s*/i;

  // Find the start index of each section heading in the text
  const wellIdx    = text.search(WELL_RE);
  const improveIdx = text.search(IMPROVE_RE);
  const sampleIdx  = text.search(SAMPLE_RE);

  // Helper: extract the content between two headings (or to end of string)
  const between = (startRe: RegExp, startIdx: number, endIdx: number): string => {
    if (startIdx < 0) return "";
    const afterHeading = text.slice(startIdx).replace(startRe, "");
    if (endIdx > startIdx) {
      return afterHeading.slice(0, endIdx - startIdx - (text.slice(startIdx).match(startRe)?.[0].length ?? 0)).trim();
    }
    return afterHeading.trim();
  };

  // Extract each section cleanly
  const well    = between(WELL_RE,    wellIdx,    Math.min(...[improveIdx, sampleIdx].filter(i => i > wellIdx && i >= 0), text.length));
  const improve = between(IMPROVE_RE, improveIdx, sampleIdx > improveIdx && sampleIdx >= 0 ? sampleIdx : text.length);
  const sample  = sampleIdx >= 0 ? text.slice(sampleIdx).replace(SAMPLE_RE, "").trim() : "";

  return { well, improve, sample, raw: text };
}

// ─── TTS hook ──────────────────────────────────────────────────────────────────
// ─── Voice selection ──────────────────────────────────────────────────────────
// AU coach  → en-AU female (Karen on macOS, Google Australian Female on Chrome)
// UK coach  → en-GB female (Google UK English Female, Daniel/Serena on macOS)
// Fallback  → any female English voice, then any English voice
//
// Priority per accent:
//   Australia: Google Australian Female → Karen (macOS) → any en-AU → any female en
//   UK:        Google UK English Female → Serena (macOS) → Hazel/Zira (Win) → any en-GB → any female en

function pickVoice(voices: SpeechSynthesisVoice[], country: "australia" | "uk"): SpeechSynthesisVoice | null {
  if (country === "australia") {
    // 1. Explicitly named Australian female voices
    const auNamed = voices.find((v) =>
      v.name === "Google Australian Female" ||
      v.name.includes("Karen") ||       // macOS en-AU female
      v.name.includes("Catherine") ||   // some macOS variants
      (v.lang === "en-AU" && /female/i.test(v.name))
    );
    // 2. Any en-AU voice (Chrome default on en-AU is female)
    const auLocale = voices.find((v) => v.lang === "en-AU");
    // 3. Any female English voice as last resort
    const anyFemale = voices.find((v) =>
      v.lang.startsWith("en") &&
      (v.name === "Google US English Female" ||
        v.name.includes("Samantha") ||
        v.name.includes("Tessa") ||
        v.name.includes("Moira") ||
        /female/i.test(v.name))
    );
    return auNamed ?? auLocale ?? anyFemale ?? null;
  } else {
    // UK
    // 1. Explicitly named UK female voices
    const ukNamed = voices.find((v) =>
      v.name === "Google UK English Female" ||
      v.name.includes("Serena") ||      // macOS en-GB female
      v.name.includes("Hazel") ||       // Windows en-GB female
      v.name.includes("Zira") ||        // Windows female
      (v.lang === "en-GB" && /female/i.test(v.name))
    );
    // 2. Any en-GB voice (Chrome default on en-GB is female)
    const ukLocale = voices.find((v) => v.lang === "en-GB");
    // 3. Any female English voice as last resort
    const anyFemale = voices.find((v) =>
      v.lang.startsWith("en") &&
      (v.name === "Google Australian Female" ||
        v.name.includes("Karen") ||
        v.name.includes("Samantha") ||
        /female/i.test(v.name))
    );
    return ukNamed ?? ukLocale ?? anyFemale ?? null;
  }
}

// Pre-load voices as early as possible so they're ready when first speak() fires
let _voicesCache: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const load = () => { _voicesCache = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.addEventListener("voiceschanged", load);
}

function useTTS(country: "australia" | "uk") {
  // speakSegments() — speaks an array of text segments with a pause between each.
  // This creates natural breathing room between feedback sections.
  const speakSegments = useCallback((segments: string[], onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();

    const doSpeak = (voices: SpeechSynthesisVoice[]) => {
      const voice = pickVoice(voices, country);
      let i = 0;

      const speakNext = () => {
        if (i >= segments.length) { onEnd?.(); return; }
        const seg = segments[i++];
        if (!seg.trim()) { speakNext(); return; }

        const utter = new SpeechSynthesisUtterance(seg);
        utter.rate  = 1.0;    // natural speed
        utter.pitch = 1.12;   // warmer, more energetic female tone
        utter.volume = 1;
        if (voice) utter.voice = voice;
        utter.onend = () => {
          // 650ms natural pause between segments — like a breath between thoughts
          setTimeout(speakNext, 650);
        };
        window.speechSynthesis.speak(utter);
      };

      speakNext();
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      _voicesCache = voices;
      doSpeak(voices);
    } else {
      const handler = () => {
        const v2 = window.speechSynthesis.getVoices();
        _voicesCache = v2;
        doSpeak(v2);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
      setTimeout(() => {
        const v3 = window.speechSynthesis.getVoices();
        if (v3.length > 0 && !_voicesCache.length) doSpeak(v3);
      }, 600);
    }
  }, [country]);

  // speak() — convenience wrapper for a single text string
  const speak = useCallback((text: string, onEnd?: () => void) => {
    speakSegments([text], onEnd);
  }, [speakSegments]);

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, speakSegments, cancel };
}

// ─── Waveform ──────────────────────────────────────────────────────────────────

function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={active
            ? { scaleY: [0.3, 1, 0.3], transition: { duration: 0.7, repeat: Infinity, delay: i * 0.08 } }
            : { scaleY: 0.2 }
          }
          style={{ height: "100%", originY: "center" }}
        />
      ))}
    </div>
  );
}

// ─── Mic pulse ─────────────────────────────────────────────────────────────────

function MicPulse({ listening }: { listening: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {listening && (
        <>
          <motion.div className="absolute w-20 h-20 rounded-full bg-rose-400/20"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }} />
          <motion.div className="absolute w-20 h-20 rounded-full bg-rose-400/10"
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} />
        </>
      )}
      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
        listening ? "bg-gradient-to-br from-rose-500 to-red-600" : "bg-gradient-to-br from-gray-100 to-gray-200"
      }`}>
        <Mic className={`w-8 h-8 ${listening ? "text-white" : "text-gray-400"}`} />
      </div>
    </div>
  );
}

// ─── Country selector ──────────────────────────────────────────────────────────

function CountrySelect({ onSelect }: { onSelect: (c: Country) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
        <Sparkles className="w-3.5 h-3.5" /> VOICE INTERVIEW COACH
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
        Practice speaking,<br />not just typing
      </h1>
      <p className="text-gray-500 text-base leading-relaxed mb-12 max-w-xl mx-auto">
        The AI reads each question aloud. You speak your answer. Get instant AI feedback on every response — exactly as your approved GPT coaches do.
      </p>
      <div className="grid sm:grid-cols-2 gap-5 text-left">
        <motion.button whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(14,165,233,0.15)" }}
          onClick={() => onSelect("australia")}
          className="group bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-3xl p-7 flex flex-col gap-4 hover:border-sky-400 transition-all duration-200">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🇦🇺</span>
            <div>
              <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Australia</p>
              <h3 className="text-xl font-extrabold text-gray-900">GS Interview Prep</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            19 approved questions across 5 categories — Program, Career Outcome, Why Australia, University, and Return Intent.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["5 categories", "19 questions", "Genuine Student style", "AI feedback"].map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold">{t}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-sky-600 font-bold text-sm group-hover:gap-3 transition-all">
            Start session <ChevronRight className="w-4 h-4" />
          </span>
        </motion.button>

        <motion.button whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(244,63,94,0.15)" }}
          onClick={() => onSelect("uk")}
          className="group bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-200 rounded-3xl p-7 flex flex-col gap-4 hover:border-rose-400 transition-all duration-200">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🇬🇧</span>
            <div>
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">United Kingdom</p>
              <h3 className="text-xl font-extrabold text-gray-900">UK Credibility Interview Prep</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            14 approved questions in exact sequence — Study Motivation, Career, Academic Background, University, and Visa Logistics.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Fixed sequence", "14 questions", "UK credibility style", "AI feedback"].map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">{t}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm group-hover:gap-3 transition-all">
            Start session <ChevronRight className="w-4 h-4" />
          </span>
        </motion.button>
      </div>
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 font-medium">
        {[
          { icon: "🔊", text: "Reads questions aloud" },
          { icon: "📝", text: "Transcribes your answer" },
          { icon: "🤖", text: "AI feedback after each answer" },
          { icon: "🆓", text: "100% free" },
        ].map((f) => (
          <span key={f.text} className="flex items-center gap-2"><span>{f.icon}</span>{f.text}</span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── AU Category picker ────────────────────────────────────────────────────────

function CategoryPicker({
  studentName,
  onSelect,
  onPracticeAll,
  onBack,
}: {
  studentName: string;
  onSelect: (cat: QuestionCategory) => void;
  onPracticeAll: () => void;
  onBack: () => void;
}) {
  const totalQ = AU_CATEGORIES.reduce((s, c) => s + c.questions.length, 0);
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">🇦🇺</span>
        <div>
          <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Australia · Genuine Student Interview</p>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Which category would you like to practice, {studentName}?
          </h2>
          <p className="text-sm text-gray-400 mt-1">{AU_CATEGORIES.length} categories · {totalQ} questions total</p>
        </div>
      </div>

      <motion.button whileHover={{ y: -2 }} onClick={onPracticeAll}
        className="w-full mb-4 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <ListChecks className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm">Practice All Categories</p>
          <p className="text-xs text-white/70 mt-0.5">{totalQ} questions · full mock interview</p>
        </div>
        <ChevronRight className="w-4 h-4 opacity-70" />
      </motion.button>

      <div className="space-y-2">
        {AU_CATEGORIES.map((cat, i) => (
          <motion.button key={cat.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }}
            onClick={() => onSelect(cat)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-sky-200 hover:border-sky-500 transition-all text-left">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-100 text-sky-700">
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{cat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.objective}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                {cat.questions.length}Q
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </motion.button>
        ))}
      </div>
      <button onClick={onBack} className="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto">
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
    </motion.div>
  );
}

// ─── Feedback display ──────────────────────────────────────────────────────────

function FeedbackPanel({
  feedbackText,
  loading,
  country,
  onNext,
  onReAnswer,
  isLast,
  studentName,
  muted,
}: {
  feedbackText: string;
  loading: boolean;
  country: Country;
  onNext: () => void;
  onReAnswer: () => void;
  isLast: boolean;
  studentName: string;
  muted: boolean;
}) {
  const { speak, speakSegments, cancel } = useTTS(country);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600";
  const improveLabel = country === "australia" ? "What you could improve" : "Where you could improve";
  const sampleLabel = country === "australia" ? "A good sample answer is" : "Here is a sample answer";
  const parsed = feedbackText ? parseFeedback(feedbackText, country) : null;

  // Build segments array — each section is its own utterance so there's a natural
  // pause and breath between "what you did well", "improve", and "sample answer".
  // IMPORTANT: the sample answer is spoken as if FROM the student TO the interviewer —
  // it must NOT be addressed to the student (no "studentName" in that segment).
  const buildSpokenSegments = useCallback((p: ReturnType<typeof parseFeedback>): string[] => {
    const clean = (s: string) => s.replace(/^[-•*]\s*/gm, " ").replace(/\n/g, ". ").replace(/\s+/g, " ").trim();
    const segments: string[] = [];
    if (p.well)    segments.push(`Great effort! Here is what you did really well. ${clean(p.well)}`);
    if (p.improve) segments.push(`Now, here is what you could work on. ${clean(p.improve)}`);
    if (p.sample)  segments.push(`And here is how a strong answer to the interviewer would sound. ${clean(p.sample)}`);
    if (!segments.length && p.raw) segments.push(clean(p.raw));
    return segments;
  }, []);

  const startCountdown = useCallback((onDone: () => void) => {
    setCountdown(3);
    let n = 3;
    countdownRef.current = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        setCountdown(null);
        onDone();
      }
    }, 1000);
  }, []);

  // Auto-speak feedback when it arrives using segments (pause between each section),
  // then auto-advance to next question after 3s
  useEffect(() => {
    if (!feedbackText || loading) return;
    const p = parseFeedback(feedbackText, country);

    if (muted) {
      startCountdown(onNext);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }

    setIsSpeaking(true);
    speakSegments(buildSpokenSegments(p), () => {
      setIsSpeaking(false);
      startCountdown(onNext);
    });
    return () => {
      cancel();
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackText, loading]);

  const handleReplay = () => {
    if (!parsed) return;
    if (countdownRef.current) { clearInterval(countdownRef.current); setCountdown(null); }
    cancel();
    setIsSpeaking(true);
    speakSegments(buildSpokenSegments(parsed), () => {
      setIsSpeaking(false);
      startCountdown(onNext);
    });
  };

  const handleStop = () => {
    cancel();
    setIsSpeaking(false);
    if (countdownRef.current) { clearInterval(countdownRef.current); setCountdown(null); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {loading ? (
        <div className="flex flex-col items-center gap-4 py-10">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-gray-400">Generating your feedback, {studentName}…</p>
        </div>
      ) : parsed ? (
        <>
          {/* Voice playback controls */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
            {isSpeaking ? (
              <>
                <div className="flex items-center gap-[3px] h-5 flex-shrink-0">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div key={i} className="w-1 rounded-full bg-indigo-400"
                      animate={{ scaleY: [0.3, 1, 0.3], transition: { duration: 0.7, repeat: Infinity, delay: i * 0.1 } }}
                      style={{ height: "100%", originY: "center" }} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 flex-1">Reading feedback aloud…</p>
                <button onClick={handleStop}
                  className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-700 flex-shrink-0">
                  <VolumeX className="w-3.5 h-3.5" /> Stop
                </button>
              </>
            ) : countdown !== null ? (
              <>
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-indigo-600">{countdown}</span>
                </div>
                <p className="text-xs text-gray-500 flex-1">Next question in {countdown}…</p>
                <button onClick={handleStop}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-600 flex-shrink-0">
                  Stay here
                </button>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-400 flex-1">Feedback read aloud</p>
                <button onClick={handleReplay}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 flex-shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" /> Replay
                </button>
              </>
            )}
          </div>

          {/* What you did well */}
          {parsed.well && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">What you did well</p>
              </div>
              <div className="text-sm text-emerald-800 leading-relaxed whitespace-pre-line">{parsed.well}</div>
            </div>
          )}

          {/* What/Where you could improve */}
          {parsed.improve && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">{improveLabel}</p>
              </div>
              <div className="text-sm text-amber-800 leading-relaxed whitespace-pre-line">{parsed.improve}</div>
            </div>
          )}

          {/* Sample answer */}
          {parsed.sample && (
            <div className="rounded-2xl bg-indigo-50 border border-indigo-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">{sampleLabel}</p>
              </div>
              <div className="text-sm text-indigo-800 leading-relaxed whitespace-pre-line">{parsed.sample}</div>
            </div>
          )}

          {/* Fallback: show raw if parsing failed */}
          {!parsed.well && !parsed.improve && !parsed.sample && (
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{parsed.raw}</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-400 italic">
          No feedback available.
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <motion.button whileHover={{ y: -1 }} onClick={() => { cancel(); setIsSpeaking(false); onNext(); }}
          className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}>
          {isLast
            ? <><span>Finish session</span> <CheckCircle2 className="w-4 h-4" /></>
            : <><span>Next question</span> <ChevronRight className="w-4 h-4" /></>}
        </motion.button>
        <button onClick={() => { cancel(); setIsSpeaking(false); onReAnswer(); }}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
          <RotateCcw className="w-3.5 h-3.5" /> Re-answer
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main interview session ────────────────────────────────────────────────────

function InterviewSession({
  country,
  onReset,
}: {
  country: Country;
  onReset: () => void;
}) {
  const { speak, cancel } = useTTS(country);
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600";
  const accentText = country === "australia" ? "text-sky-600" : "text-rose-600";
  const flag = country === "australia" ? "🇦🇺" : "🇬🇧";
  const countryLabel = country === "australia" ? "Australia" : "United Kingdom";

  // ── State ──────────────────────────────────────────────────────────────────
  const [phase, setPhase] = useState<Phase>("name");
  const [studentName, setStudentName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [ukConfirmInput, setUkConfirmInput] = useState("");

  // Active question list: for AU set during category pick; for UK always UK_SEQUENCE
  const [activeQuestions, setActiveQuestions] = useState<{ question: string; category: string; objective: string }[]>([]);
  const [sessionLabel, setSessionLabel] = useState("");
  const [qIndex, setQIndex] = useState(0);

  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const [muted, setMuted] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [nameListening, setNameListening] = useState(false);
  const [yesListening, setYesListening] = useState(false);

  const recogRef = useRef<SpeechRecognitionShim | null>(null);
  const nameRecogRef = useRef<SpeechRecognitionShim | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // ── Check STT support ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
      if (!win.SpeechRecognition && !win.webkitSpeechRecognition) setSttSupported(false);
    }
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recogRef.current) { try { recogRef.current.abort(); } catch { /* ignore */ } }
      cancel();
    };
  }, [cancel]);

  // ── AUTO-SPEAK: greet and ask for name when session starts ───────────────────
  useEffect(() => {
    if (phase !== "name") return;
    const greeting = country === "australia"
      ? "Hello there! Welcome to your Genuine Student interview practice! I am so excited to help you prepare. To get us started, could you please tell me your name?"
      : "Hello! Welcome! I am absolutely delighted to help you prepare for your UK credibility interview today. Could you please tell me your name?";
    // Small delay so the page has rendered before speaking
    const t = setTimeout(() => speak(greeting), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);   // intentionally only re-run when phase changes to "name"

  // ── AUTO-SPEAK: UK "are you ready — say YES" ─────────────────────────────────
  useEffect(() => {
    if (phase !== "uk_confirm" || !studentName) return;
    const msg = `Wonderful, ${studentName}! It is so great to meet you! I am here to help you absolutely nail your UK credibility interview. When you are ready to begin, just say YES and we will get started!`;
    const t = setTimeout(() => speak(msg), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── AUTO-SPEAK: AU category menu ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "category" || !studentName) return;
    const msg = `Fantastic, ${studentName}! You are going to do brilliantly today! Now, which category of questions would you like to practice? We have five great options. Number one, About the Program. Number two, Career Outcome. Number three, Why Australia. Number four, About the University. And number five, Other Important Questions. Which one shall we start with?`;
    const t = setTimeout(() => speak(msg), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Speak question ──────────────────────────────────────────────────────────
  const speakQuestion = useCallback((text: string) => {
    if (muted) { setPhase("listening"); return; }
    setPhase("speaking");
    speak(text, () => setPhase("listening"));
  }, [speak, muted]);

  // ── STT ─────────────────────────────────────────────────────────────────────
  // Silence detection: we only start the 3-second countdown AFTER we receive
  // a FINAL result (not interim). This prevents triggering mid-sentence when
  // the browser briefly pauses between words.
  const startListening = useCallback(() => {
    if (!sttSupported || typeof window === "undefined") return;
    const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) return;
    const recog = new Ctor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";
    let final = "";
    let silenceTimer: ReturnType<typeof setTimeout> | null = null;

    const clearSilence = () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    };

    const armSilenceTimer = (currentFinal: string) => {
      clearSilence();
      // Only arm if we have at least a few words — prevents triggering on single words
      if (currentFinal.trim().split(/\s+/).length < 3) return;
      silenceTimer = setTimeout(() => {
        // User has been silent for 3s after their last final result → auto-submit
        if (recogRef.current) {
          try { recogRef.current.stop(); } catch { /* ignore */ }
        }
        autoSubmitRef.current?.();
      }, 3000);
    };

    recog.onresult = (event: SpeechRecognitionEventShim) => {
      let interim = "";
      let gotFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript + " ";
          gotFinal = true;
        } else {
          interim += r[0].transcript;
        }
      }
      setTranscript(final + interim);
      if (gotFinal) {
        // Reset the silence countdown every time a new final chunk arrives
        armSilenceTimer(final);
      }
      // While interim results are coming in, cancel any pending silence timer
      // so we don't fire mid-sentence
      if (interim) clearSilence();
    };
    recog.onerror = () => { clearSilence(); };
    recog.onend = () => {
      clearSilence();
      setTranscript(final.trim());
    };
    recogRef.current = recog;
    recog.start();
    elapsedRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    if (recogRef.current) { try { recogRef.current.stop(); } catch { /* ignore */ } recogRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (phase === "listening") { setTranscript(""); startListening(); }
    if (phase !== "listening") stopListening();
  }, [phase, startListening, stopListening]);

  // ── One-shot STT for name / YES inputs ───────────────────────────────────────
  // Uses interimResults so the first recognisable word is caught immediately —
  // once a final result arrives we stop recognition and fire onResult right away.
  const listenOnce = useCallback((
    onResult: (text: string) => void,
    onStateChange: (active: boolean) => void,
  ) => {
    if (!sttSupported || typeof window === "undefined") return;
    cancel(); // stop TTS before listening
    if (nameRecogRef.current) { try { nameRecogRef.current.abort(); } catch { /* ignore */ } }
    const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) return;
    const recog = new Ctor();
    recog.continuous = false;
    recog.interimResults = true; // catch interim so we get the word as soon as spoken
    recog.lang = "en-IN"; // Indian English — better for Indian names
    onStateChange(true);
    let fired = false;
    recog.onresult = (event: SpeechRecognitionEventShim) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const text = r[0]?.transcript?.trim().replace(/\.$/, "") ?? "";
        if (text && r.isFinal && !fired) {
          fired = true;
          try { recog.stop(); } catch { /* ignore */ }
          onStateChange(false);
          onResult(text);
          return;
        }
      }
    };
    recog.onerror = () => { onStateChange(false); };
    recog.onend = () => { onStateChange(false); };
    nameRecogRef.current = recog;
    recog.start();
  }, [sttSupported, cancel]);

  // ── Fetch AI feedback ───────────────────────────────────────────────────────
  const fetchFeedback = useCallback(async (question: string, objective: string, t: string) => {
    setFeedbackLoading(true);
    setFeedbackText("");

    // Look up the official checklist for this question from the knowledge files
    let checklist: string[] | undefined;
    if (country === "uk") {
      checklist = UK_GUIDELINES[question];
    } else {
      // For AU, find which category this question belongs to and use its checklist
      const cat = AU_CATEGORIES.find((c) => c.questions.includes(question));
      if (cat) checklist = AU_GUIDELINES[cat.id];
    }

    try {
      const res = await fetch("/api/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, objective, transcript: t, country, studentName, checklist }),
      });
      const data = await res.json() as { feedback?: string; error?: string };
      setFeedbackText(data.feedback ?? "");
    } catch {
      setFeedbackText("");
    } finally {
      setFeedbackLoading(false);
    }
  }, [country, studentName]);

  // ── Name submission ─────────────────────────────────────────────────────────
  // NOTE: no speak() here — the auto-speak useEffects above fire when phase changes
  const handleNameSubmit = () => {
    const name = nameInput.trim();
    if (!name) return;
    cancel(); // stop any current speech before transitioning
    setStudentName(name);
    setPhase(country === "uk" ? "uk_confirm" : "category");
  };

  // ── UK YES confirmation ─────────────────────────────────────────────────────
  const handleUkConfirm = () => {
    setActiveQuestions(UK_SEQUENCE);
    setSessionLabel("Full Interview · 14 Questions");
    setQIndex(0);
    setAnswers([]);
    speakQuestion(UK_SEQUENCE[0].question);
  };

  // ── AU category selection ───────────────────────────────────────────────────
  const handleCategorySelect = (cat: QuestionCategory) => {
    cancel(); // stop the category-menu TTS before starting question TTS
    const qs = cat.questions.map((q) => ({
      question: q, category: cat.label, objective: cat.objective,
    }));
    setActiveQuestions(qs);
    setSessionLabel(cat.label);
    setQIndex(0);
    setAnswers([]);
    speakQuestion(qs[0].question);
  };

  const handlePracticeAll = () => {
    cancel();
    setActiveQuestions(AU_ALL_QUESTIONS);
    setSessionLabel("All Categories · 19 Questions");
    setQIndex(0);
    setAnswers([]);
    speakQuestion(AU_ALL_QUESTIONS[0].question);
  };

  // Auto-submit ref — always holds the latest fetchFeedback call so the silence
  // timer inside startListening() can fire it with the most current values
  const autoSubmitRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    autoSubmitRef.current = () => {
      if (phase !== "listening") return;
      const q = activeQuestions[qIndex];
      if (q && transcript.trim()) {
        stopListening();
        setPhase("feedback");
        fetchFeedback(q.question, q.objective, transcript);
      }
    };
  });

  // ── Stop & review ───────────────────────────────────────────────────────────
  const handleStopAndReview = () => {
    stopListening();
    setPhase("review");
  };

  // ── Auto-advance from review → feedback after 3s ────────────────────────────
  useEffect(() => {
    if (phase !== "review") return;
    const t = setTimeout(() => {
      const q = activeQuestions[qIndex];
      if (q && phase === "review") {
        setPhase("feedback");
        fetchFeedback(q.question, q.objective, transcript);
      }
    }, 3000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Submit answer → get feedback ────────────────────────────────────────────
  const handleSubmitAnswer = () => {
    const q = activeQuestions[qIndex];
    setPhase("feedback");
    fetchFeedback(q.question, q.objective, transcript);
  };

  // ── Next question ───────────────────────────────────────────────────────────
  const handleNext = () => {
    const newAnswer: Answer = {
      question: activeQuestions[qIndex].question,
      category: activeQuestions[qIndex].category,
      transcript: transcript.trim(),
      duration: elapsedRef.current,
      feedback: feedbackText,
    };
    const updated = [...answers, newAnswer];
    setAnswers(updated);
    setTranscript("");
    setFeedbackText("");
    elapsedRef.current = 0;
    setElapsed(0);

    const next = qIndex + 1;
    if (next >= activeQuestions.length) {
      setPhase("complete");
    } else {
      setQIndex(next);
      speakQuestion(activeQuestions[next].question);
    }
  };

  // ── Re-answer ───────────────────────────────────────────────────────────────
  const handleReAnswer = () => {
    setTranscript("");
    setFeedbackText("");
    elapsedRef.current = 0;
    setElapsed(0);
    speakQuestion(activeQuestions[qIndex].question);
  };

  // ── Skip ────────────────────────────────────────────────────────────────────
  const handleSkip = () => {
    const newAnswer: Answer = {
      question: activeQuestions[qIndex].question,
      category: activeQuestions[qIndex].category,
      transcript: "[Skipped]",
      duration: 0,
    };
    const updated = [...answers, newAnswer];
    setAnswers(updated);
    setTranscript("");
    setFeedbackText("");
    elapsedRef.current = 0;
    setElapsed(0);
    const next = qIndex + 1;
    if (next >= activeQuestions.length) {
      setPhase("complete");
    } else {
      setQIndex(next);
      speakQuestion(activeQuestions[next].question);
    }
  };

  const progress = activeQuestions.length > 0 ? ((qIndex + 1) / activeQuestions.length) * 100 : 0;
  const currentQ = activeQuestions[qIndex];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  // ── Name collection ─────────────────────────────────────────────────────────
  if (phase === "name") {
    const coachText = country === "australia"
      ? "Hello there! Welcome to your Genuine Student interview practice! I am so excited to help you prepare. To get us started, could you please tell me your name?"
      : "Hello! Welcome! I am absolutely delighted to help you prepare for your UK credibility interview today. Could you please tell me your name?";
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">{flag}</span>
          <div className="text-left">
            <p className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>{countryLabel}</p>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {country === "australia" ? "Genuine Student Interview Prep" : "UK Credibility Interview Prep"}
            </h2>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6">
          {/* Coach speech bubble */}
          <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-4 mb-6 text-left">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Volume2 className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-medium text-indigo-900 leading-relaxed">{coachText}</p>
          </div>

          {/* Speak name — auto-advances immediately on detection */}
          {sttSupported && (
            <button
              onClick={() => listenOnce(
                (text) => {
                  const name = text.replace(/\.$/, "").trim();
                  setNameInput(name);
                  // Auto-submit immediately — no button click needed
                  if (name) {
                    cancel();
                    setStudentName(name);
                    setPhase(country === "uk" ? "uk_confirm" : "category");
                  }
                },
                setNameListening
              )}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 mb-3 text-sm font-semibold transition-all ${
                nameListening
                  ? "border-rose-400 bg-rose-50 text-rose-600 animate-pulse"
                  : "border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              <Mic className="w-4 h-4" />
              {nameListening ? "Listening… speak your name" : "Speak your name"}
            </button>
          )}

          <input
            ref={nameInputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && nameInput.trim() && handleNameSubmit()}
            placeholder="Or type your name here"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 mb-4"
          />
          <motion.button
            whileHover={{ y: -1 }}
            onClick={handleNameSubmit}
            disabled={!nameInput.trim()}
            className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold text-sm disabled:opacity-40 transition-opacity`}
          >
            Continue
          </motion.button>
        </div>
        <button onClick={onReset} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to country selection
        </button>
      </motion.div>
    );
  }

  // ── UK: "say YES to begin" ──────────────────────────────────────────────────
  if (phase === "uk_confirm") {
    const coachPrompt = `Wonderful, ${studentName}! It is so great to meet you! I am here to help you absolutely nail your UK credibility interview. When you are ready to begin, just say YES and we will get started!`;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">🇬🇧</span>
          <div className="text-left">
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">United Kingdom</p>
            <h2 className="text-2xl font-extrabold text-gray-900">UK Credibility Interview Prep</h2>
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6">
          {/* Coach speech bubble */}
          <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-2xl px-4 py-4 mb-6 text-left">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Volume2 className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-medium text-rose-900 leading-relaxed">{coachPrompt}</p>
          </div>

          {/* Speak YES */}
          {sttSupported && (
            <button
              onClick={() => listenOnce(
                (text) => {
                  if (/yes/i.test(text)) handleUkConfirm();
                  else setUkConfirmInput(text);
                },
                setYesListening
              )}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 mb-3 text-sm font-semibold transition-all ${
                yesListening
                  ? "border-rose-400 bg-rose-50 text-rose-600 animate-pulse"
                  : "border-gray-200 text-gray-500 hover:border-rose-300 hover:text-rose-600"
              }`}
            >
              <Mic className="w-4 h-4" />
              {yesListening ? "Listening… say YES" : "Say YES to begin"}
            </button>
          )}

          <input
            type="text"
            value={ukConfirmInput}
            onChange={(e) => setUkConfirmInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUkConfirm()}
            placeholder='Or type YES here'
            autoFocus={!sttSupported}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 mb-4 text-center tracking-widest font-bold uppercase"
          />
          <motion.button
            whileHover={{ y: -1 }}
            onClick={handleUkConfirm}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-sm shadow-lg"
          >
            YES — Begin the Interview
          </motion.button>
        </div>
        <button onClick={() => { cancel(); setPhase("name"); }} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
      </motion.div>
    );
  }

  // ── AU: Category picker ─────────────────────────────────────────────────────
  if (phase === "category") {
    return (
      <CategoryPicker
        studentName={studentName}
        onSelect={handleCategorySelect}
        onPracticeAll={handlePracticeAll}
        onBack={() => { cancel(); setPhase("name"); }}
      />
    );
  }

  // ── Complete ────────────────────────────────────────────────────────────────
  if (phase === "complete") {
    const totalWords = answers.reduce((sum, a) =>
      sum + a.transcript.trim().split(/\s+/).filter((w) => w && w !== "[Skipped]").length, 0);
    const answeredCount = answers.filter((a) => a.transcript !== "[Skipped]").length;

    const grouped: Record<string, Answer[]> = {};
    for (const a of answers) {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    }

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <Trophy className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Well done, {studentName}!</h2>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-gray-800">{answeredCount}/{activeQuestions.length}</span> questions ·{" "}
            <span className="font-bold text-gray-800">{sessionLabel}</span> ·{" "}
            <span className="font-bold text-gray-800">{totalWords} words</span> spoken
          </p>
        </div>

        <div className="space-y-6 mb-10">
          {Object.entries(grouped).map(([catLabel, catAnswers]) => (
            <div key={catLabel}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{catLabel}</p>
              <div className="space-y-4">
                {catAnswers.map((a, i) => {
                  const skipped = a.transcript === "[Skipped]";
                  const parsed = a.feedback ? parseFeedback(a.feedback, country) : null;
                  return (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs font-bold text-gray-400">Q{answers.indexOf(a) + 1}</p>
                        {!skipped && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />{formatDuration(a.duration)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-2">{a.question}</p>
                      {skipped ? (
                        <span className="text-xs text-gray-400 italic">Skipped</span>
                      ) : (
                        <div className="space-y-2">
                          <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                            <p className="text-xs font-bold text-gray-400 mb-1">Your answer</p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {a.transcript || <span className="italic">No speech detected</span>}
                            </p>
                          </div>
                          {parsed && (parsed.well || parsed.improve) && (
                            <div className="grid sm:grid-cols-2 gap-2">
                              {parsed.well && (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
                                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Did well</p>
                                  <p className="text-xs text-emerald-800 leading-relaxed line-clamp-3">{parsed.well}</p>
                                </div>
                              )}
                              {parsed.improve && (
                                <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Improve</p>
                                  <p className="text-xs text-amber-800 leading-relaxed line-clamp-3">{parsed.improve}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setAnswers([]); setQIndex(0); setTranscript(""); setFeedbackText("");
              elapsedRef.current = 0; setElapsed(0);
              setPhase(country === "uk" ? "uk_confirm" : "category");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold`}
          >
            <RotateCcw className="w-4 h-4" /> Practice Again
          </button>
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Switch Country
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Active interview ────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {flag} {sessionLabel} · Q{qIndex + 1}/{activeQuestions.length}
          </span>
          <button
            onClick={() => { if (!muted) cancel(); setMuted((m) => !m); }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${accentBg}`}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className={`text-xs font-semibold mt-1.5 ${accentText}`}>{currentQ.category}</p>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`q-${qIndex}`}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
          className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[11px] font-bold uppercase tracking-widest ${accentText}`}>
              {studentName} · Question {qIndex + 1}
            </span>
            {phase === "speaking" && (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Volume2 className="w-3 h-3 animate-pulse" /> Reading aloud…
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-gray-900 leading-relaxed">{currentQ.question}</p>
        </motion.div>
      </AnimatePresence>

      {/* Voice state */}
      <div className="flex flex-col items-center gap-4 mb-6">
        {phase === "speaking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
            <Waveform active={true} color={country === "australia" ? "bg-sky-400" : "bg-rose-400"} />
            <p className="text-sm text-gray-400">Listening to question…</p>
          </motion.div>
        )}
        {(phase === "listening" || phase === "review") && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3">
            <MicPulse listening={phase === "listening"} />
            {phase === "listening" && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                Listening · {formatDuration(elapsed)}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Live transcript (listening + review phases) */}
      <AnimatePresence>
        {(phase === "listening" || phase === "review") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} className="mb-5"
          >
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 min-h-[80px]">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {phase === "listening" ? "Live transcript" : "Your answer"}
                </span>
              </div>
              {transcript ? (
                <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  {phase === "listening"
                    ? sttSupported ? "Speak now — your words will appear here…" : "Type your answer below"
                    : "No speech detected."}
                </p>
              )}
            </div>
            {!sttSupported && phase === "listening" && (
              <textarea
                className="mt-3 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                rows={3} placeholder="Type your answer here…"
                value={transcript} onChange={(e) => setTranscript(e.target.value)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback panel */}
      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-5">
            <FeedbackPanel
              feedbackText={feedbackText}
              loading={feedbackLoading}
              country={country}
              onNext={handleNext}
              onReAnswer={handleReAnswer}
              isLast={qIndex + 1 >= activeQuestions.length}
              studentName={studentName}
              muted={muted}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {phase === "speaking" && (
          <button onClick={() => { cancel(); setPhase("listening"); }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Skip reading →
          </button>
        )}
        {phase === "listening" && (
          <>
            <motion.button whileHover={{ y: -1 }} onClick={handleStopAndReview}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}>
              <CheckCircle2 className="w-4 h-4" /> Stop & Review
            </motion.button>
            <button onClick={handleSkip}
              className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Skip question
            </button>
          </>
        )}
        {phase === "review" && (
          <>
            <motion.button whileHover={{ y: -1 }} onClick={handleSubmitAnswer}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}>
              <Sparkles className="w-4 h-4" /> Get AI Feedback
            </motion.button>
            <button onClick={() => { setTranscript(""); elapsedRef.current = 0; setElapsed(0); speakQuestion(currentQ.question); }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Re-answer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page inner ────────────────────────────────────────────────────────────────

function InterviewPrepInner() {
  const searchParams = useSearchParams();
  const initial = searchParams.get("country") as Country | null;
  const [country, setCountry] = useState<Country | null>(
    initial === "australia" || initial === "uk" ? initial : null
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">eduvianAI</span>
          </Link>
          <Link href="/#interview-prep" className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-14">
        <AnimatePresence mode="wait">
          {!country ? (
            <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CountrySelect onSelect={setCountry} />
            </motion.div>
          ) : (
            <motion.div key={country} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <InterviewSession country={country} onReset={() => setCountry(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} eduvianAI · Voice Interview Prep
      </footer>
    </div>
  );
}

export default function InterviewPrepPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    }>
      <InterviewPrepInner />
    </Suspense>
  );
}

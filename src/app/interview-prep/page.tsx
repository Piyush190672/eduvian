"use client";

// ─── Web Speech API type shims ────────────────────────────────────────────────
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
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
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventShim) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}
interface SpeechRecognitionCtor {
  new(): SpeechRecognitionShim;
}

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Volume2,
  VolumeX,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  Globe2,
  Sparkles,
  Trophy,
  Clock,
  MessageSquare,
  BookOpen,
  Briefcase,
  MapPin,
  Building2,
  HelpCircle,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Country = "australia" | "uk";
type Phase = "select" | "ready" | "category" | "speaking" | "listening" | "review" | "complete";

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
}

// ─── Australia question bank (exact from GPT instruction window) ──────────────

const AU_CATEGORIES: QuestionCategory[] = [
  {
    id: "program",
    label: "About the Program",
    objective: "Gauge your understanding of the program and the logic behind choosing it.",
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
    id: "career",
    label: "Career Outcome",
    objective: "Establish correlation between your academic background, proposed studies, career outcomes, ROI, and employment plans after completion.",
    icon: <Briefcase className="w-4 h-4" />,
    questions: [
      "What details can you share about the studies you have completed in the past and how are those studies linked to your proposed studies?",
      "How will this course improve your career prospects, what are the employment opportunities at completion of this course and remuneration level?",
      "What salary or remuneration do you expect in India after completing this course? Which all companies would you like to work for after completing this course?",
      "How will this course benefit you professionally and economically?",
    ],
  },
  {
    id: "australia",
    label: "Why Australia",
    objective: "Assess whether studying in Australia is a genuine and well-researched choice.",
    icon: <MapPin className="w-4 h-4" />,
    questions: [
      "Why have you chosen Australia as your study destination, what research have you made in regards to studying in Australia, its culture and lifestyle?",
      "Why are you not pursuing a similar course in India or any other country? Have you conducted any independent research to make sure if similar courses are available in India or not? If yes, what research you have conducted. If no, why not. If similar courses are available in India, why you are not opting for that?",
      "If not India, which all countries you considered while making your research for further studies, what research you conducted in regards to those countries?",
    ],
  },
  {
    id: "university",
    label: "About the University",
    objective: "Gauge your understanding of the university, campus, program strengths, and why this institution is better suited than others.",
    icon: <Building2 className="w-4 h-4" />,
    questions: [
      "You are going to which university and campus? Why have you chosen this university and campus? Where is this university or campus located in Australia?",
      "Why have you chosen this education provider or university, what independent research you have conducted on your part to make sure this is the right institution to pursue your study plans?",
      "Have you considered other universities also? If yes, which all universities you considered for your proposed education and what research you made in regards to those universities. If no, why you have not considered those options for your proposed studies?",
    ],
  },
  {
    id: "other",
    label: "Other Important Questions",
    objective: "Assess return incentives, study-gap justification, and seriousness of intent.",
    icon: <HelpCircle className="w-4 h-4" />,
    questions: [
      "How can you prove that you will come back after completing your studies?",
      "You finished your graduation or high school last year, what are you doing since then?",
      "You completed your graduation in 2012–13 and since then you are working, so now what made you take this decision of going for further education?",
    ],
  },
];

// Flat list for "Practice All" mode
const AU_ALL_QUESTIONS = AU_CATEGORIES.flatMap((c) =>
  c.questions.map((q) => ({ question: q, category: c.label }))
);

// ─── UK question bank (exact from GPT instruction window) ─────────────────────

const UK_CATEGORIES: QuestionCategory[] = [
  {
    id: "motivation",
    label: "Study Motivation",
    objective: "Assess genuine motivation to study in the UK and course choice rationale.",
    icon: <Sparkles className="w-4 h-4" />,
    questions: [
      "Why do you want to study in the UK?",
      "Why did you choose this particular course?",
      "Why did you choose this university?",
      "Can you explain the course structure and key modules?",
      "How is this course different from similar courses in India?",
    ],
  },
  {
    id: "career",
    label: "Career & Finances",
    objective: "Establish career plans, funding source, and return intent after studies.",
    icon: <Briefcase className="w-4 h-4" />,
    questions: [
      "What are your career plans after completing this course?",
      "Who is sponsoring your education? How will you fund your studies?",
      "What is the duration of your course?",
    ],
  },
  {
    id: "background",
    label: "Academic Background",
    objective: "Verify academic history, study gaps, and credibility of the application.",
    icon: <BookOpen className="w-4 h-4" />,
    questions: [
      "Can you explain your academic background?",
      "Is there any gap in your education or employment?",
    ],
  },
  {
    id: "university",
    label: "University & Location",
    objective: "Check knowledge of university, city, campus facilities, and alternatives considered.",
    icon: <Building2 className="w-4 h-4" />,
    questions: [
      "Where is your university located? What do you know about the city? What facilities are available at your university?",
      "Have you applied to any other universities or countries?",
    ],
  },
  {
    id: "logistics",
    label: "Visa & Logistics",
    objective: "Assess knowledge of UK visa rules, work rights, and accommodation plans.",
    icon: <MapPin className="w-4 h-4" />,
    questions: [
      "Where will you stay in the UK?",
      "Do you understand UK visa rules and work rights?",
    ],
  },
];

const UK_ALL_QUESTIONS = UK_CATEGORIES.flatMap((c) =>
  c.questions.map((q) => ({ question: q, category: c.label }))
);
// UK total: 14 questions across 5 categories

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function qualityLabel(transcript: string, duration: number) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (words < 15 || duration < 8)
    return { label: "Too brief", color: "text-rose-600 bg-rose-50 border-rose-200" };
  if (words < 50 || duration < 20)
    return { label: "Developing", color: "text-amber-600 bg-amber-50 border-amber-200" };
  return { label: "Well-rounded", color: "text-emerald-600 bg-emerald-50 border-emerald-200" };
}

// ─── Country selector ─────────────────────────────────────────────────────────

function CountrySelect({ onSelect }: { onSelect: (c: Country) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto text-center"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-6">
        <Sparkles className="w-3.5 h-3.5" /> VOICE INTERVIEW COACH
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
        Practice speaking,<br />not just typing
      </h1>
      <p className="text-gray-500 text-base leading-relaxed mb-12 max-w-xl mx-auto">
        The AI reads each question aloud. You speak your answer. Your response is transcribed
        so you can review, refine, and improve — exactly as in the real interview.
      </p>

      <div className="grid sm:grid-cols-2 gap-5 text-left">
        {/* Australia */}
        <motion.button
          whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(14,165,233,0.15)" }}
          onClick={() => onSelect("australia")}
          className="group bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-3xl p-7 flex flex-col gap-4 text-left hover:border-sky-400 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">🇦🇺</span>
            <div>
              <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Australia</p>
              <h3 className="text-xl font-extrabold text-gray-900">GS Interview Prep</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            19 approved questions across 5 categories — Program, Career Outcome, Why Australia, University, and Return Intent. Mirrors your actual GS interview.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["5 categories", "19 questions", "GS visa style", "Voice + transcript"].map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold">{t}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-sky-600 font-bold text-sm group-hover:gap-3 transition-all">
            Start session <ChevronRight className="w-4 h-4" />
          </span>
        </motion.button>

        {/* UK */}
        <motion.button
          whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(244,63,94,0.15)" }}
          onClick={() => onSelect("uk")}
          className="group bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-200 rounded-3xl p-7 flex flex-col gap-4 text-left hover:border-rose-400 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl">🇬🇧</span>
            <div>
              <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">United Kingdom</p>
              <h3 className="text-xl font-extrabold text-gray-900">Credibility Interview</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            14 approved questions across 5 categories — Study Motivation, Career & Finances, Academic Background, University, and Visa & Logistics. Mirrors the actual UK student visa interview.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["5 categories", "14 questions", "Visa interview style", "Voice + transcript"].map((t) => (
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
          { icon: "📊", text: "Answer quality signal" },
          { icon: "🆓", text: "100% free" },
        ].map((f) => (
          <span key={f.text} className="flex items-center gap-2">
            <span>{f.icon}</span>{f.text}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Category picker ──────────────────────────────────────────────────────────

function CategoryPicker({
  country,
  categories,
  onSelect,
  onPracticeAll,
  onBack,
}: {
  country: Country;
  categories: QuestionCategory[];
  onSelect: (cat: QuestionCategory) => void;
  onPracticeAll: () => void;
  onBack: () => void;
}) {
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600";
  const accentText = country === "australia" ? "text-sky-700" : "text-rose-700";
  const accentBorder = country === "australia" ? "border-sky-300 hover:border-sky-500" : "border-rose-300 hover:border-rose-500";
  const accentBadge = country === "australia" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700";
  const flag = country === "australia" ? "🇦🇺" : "🇬🇧";
  const totalQ = categories.reduce((s, c) => s + c.questions.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto"
    >
      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">{flag}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>
            {country === "australia" ? "Australia" : "United Kingdom"}
          </p>
          <h2 className="text-2xl font-extrabold text-gray-900">Choose a category</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {categories.length} categories · {totalQ} questions total
          </p>
        </div>
      </div>

      {/* Practice All */}
      <motion.button
        whileHover={{ y: -2 }}
        onClick={onPracticeAll}
        className={`w-full mb-4 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${accentBg} text-white shadow-lg hover:shadow-xl transition-all`}
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <ListChecks className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm">Practice All Categories</p>
          <p className="text-xs text-white/70 mt-0.5">{totalQ} questions · full mock interview</p>
        </div>
        <ChevronRight className="w-4 h-4 opacity-70" />
      </motion.button>

      {/* Individual categories */}
      <div className="space-y-2">
        {categories.map((cat, i) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ x: 4 }}
            onClick={() => onSelect(cat)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 ${accentBorder} transition-all text-left`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBadge}`}>
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{cat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.objective}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accentBadge}`}>
                {cat.questions.length}Q
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </div>
          </motion.button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-6 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back
      </button>
    </motion.div>
  );
}

// ─── Waveform animation ───────────────────────────────────────────────────────

function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${color}`}
          animate={
            active
              ? { scaleY: [0.3, 1, 0.3], transition: { duration: 0.7, repeat: Infinity, delay: i * 0.08 } }
              : { scaleY: 0.2 }
          }
          style={{ height: "100%", originY: "center" }}
        />
      ))}
    </div>
  );
}

// ─── Mic pulse ────────────────────────────────────────────────────────────────

function MicPulse({ listening }: { listening: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {listening && (
        <>
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-rose-400/20"
            animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <motion.div
            className="absolute w-20 h-20 rounded-full bg-rose-400/10"
            animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
          />
        </>
      )}
      <div
        className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
          listening
            ? "bg-gradient-to-br from-rose-500 to-red-600"
            : "bg-gradient-to-br from-gray-100 to-gray-200"
        }`}
      >
        <Mic className={`w-8 h-8 ${listening ? "text-white" : "text-gray-400"}`} />
      </div>
    </div>
  );
}

// ─── Interview session ────────────────────────────────────────────────────────

function InterviewSession({
  country,
  categories,
  onReset,
}: {
  country: Country;
  categories: QuestionCategory[];
  onReset: () => void;
}) {
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600";
  const accentText = country === "australia" ? "text-sky-600" : "text-rose-600";
  const flag = country === "australia" ? "🇦🇺" : "🇬🇧";
  const countryLabel = country === "australia" ? "Australia" : "United Kingdom";

  // Flat question list derived from selected categories / "all"
  const [activeQuestions, setActiveQuestions] = useState<{ question: string; category: string }[]>([]);
  const [activeCategoryLabel, setActiveCategoryLabel] = useState("");

  const [phase, setPhase] = useState<Phase>("ready");
  const [qIndex, setQIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [sttSupported, setSttSupported] = useState(true);
  const [muted, setMuted] = useState(false);

  const recogRef = useRef<SpeechRecognitionShim | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("speechSynthesis" in window)) setTtsSupported(false);
      const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
      if (!win.SpeechRecognition && !win.webkitSpeechRecognition) setSttSupported(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recogRef.current) { try { recogRef.current.abort(); } catch { /* ignore */ } }
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const speakQuestion = useCallback(
    (text: string) => {
      if (!ttsSupported || muted || typeof window === "undefined") {
        setPhase("listening");
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.88;
      utter.pitch = 1;
      utter.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") &&
          (v.name.includes("Daniel") || v.name.includes("Karen") ||
           v.name.includes("Samantha") || v.name.includes("Google UK") ||
           v.name.includes("Google US"))
      );
      if (preferred) utter.voice = preferred;
      utter.onend = () => setPhase("listening");
      window.speechSynthesis.speak(utter);
      setPhase("speaking");
    },
    [ttsSupported, muted]
  );

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
    recog.onresult = (event: SpeechRecognitionEventShim) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) final += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      setTranscript(final + interim);
    };
    recog.onerror = () => { /* silently handle */ };
    recog.onend = () => setTranscript(final.trim());
    recogRef.current = recog;
    recog.start();
    elapsedRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    if (recogRef.current) {
      try { recogRef.current.stop(); } catch { /* ignore */ }
      recogRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (phase === "listening") { setTranscript(""); startListening(); }
    if (phase !== "listening") stopListening();
  }, [phase, startListening, stopListening]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCategorySelect = (cat: QuestionCategory) => {
    const qs = cat.questions.map((q) => ({ question: q, category: cat.label }));
    setActiveQuestions(qs);
    setActiveCategoryLabel(cat.label);
    setQIndex(0);
    setAnswers([]);
    speakQuestion(qs[0].question);
  };

  const handlePracticeAll = () => {
    const qs = country === "australia" ? AU_ALL_QUESTIONS : UK_ALL_QUESTIONS;
    setActiveQuestions(qs);
    setActiveCategoryLabel("All Categories");
    setQIndex(0);
    setAnswers([]);
    speakQuestion(qs[0].question);
  };

  const saveAndAdvance = (transcriptValue: string) => {
    const newAnswer: Answer = {
      question: activeQuestions[qIndex].question,
      category: activeQuestions[qIndex].category,
      transcript: transcriptValue,
      duration: elapsedRef.current,
    };
    const updated = [...answers, newAnswer];
    setAnswers(updated);
    setTranscript("");
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

  const progress = activeQuestions.length > 0
    ? ((qIndex + 1) / activeQuestions.length) * 100
    : 0;

  // ── Ready screen ─────────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">{flag}</span>
          <div className="text-left">
            <p className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>{countryLabel}</p>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {country === "australia" ? "GS Interview Prep" : "Visa Interview Prep"}
            </h2>
          </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-7 mb-8 text-left space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">How this works</h3>
          <ol className="space-y-3">
            {[
              { icon: "🗂️", text: "Choose a category — or practice all questions in one session" },
              { icon: "🔊", text: "Each question is read aloud — listen carefully" },
              { icon: "🎙️", text: "Speak your answer naturally — it's transcribed live" },
              { icon: "✅", text: "Press 'Stop & Review' when done, then move to the next" },
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-lg leading-none">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
          {!sttSupported && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2">
              ⚠️ Speech recognition not available in this browser — Chrome works best. You can still listen to questions and type answers.
            </p>
          )}
        </div>

        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => setPhase("category")}
          className={`w-full py-4 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg`}
        >
          Choose Category & Begin
        </motion.button>

        <button onClick={onReset} className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to country selection
        </button>
      </motion.div>
    );
  }

  // ── Category picker ───────────────────────────────────────────────────────────
  if (phase === "category") {
    return (
      <CategoryPicker
        country={country}
        categories={categories}
        onSelect={handleCategorySelect}
        onPracticeAll={handlePracticeAll}
        onBack={() => setPhase("ready")}
      />
    );
  }

  // ── Complete screen ───────────────────────────────────────────────────────────
  if (phase === "complete") {
    const totalWords = answers.reduce(
      (sum, a) => sum + a.transcript.trim().split(/\s+/).filter((w) => w && w !== "[Skipped]").length, 0
    );
    const answeredCount = answers.filter((a) => a.transcript !== "[Skipped]").length;

    // Group answers by category for display
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
          <h2 className="text-3xl font-extrabold text-gray-900">Session complete!</h2>
          <p className="text-gray-500 mt-2">
            <span className="font-bold text-gray-800">{answeredCount}/{activeQuestions.length}</span> questions ·{" "}
            <span className="font-bold text-gray-800">{activeCategoryLabel}</span> ·{" "}
            <span className="font-bold text-gray-800">{totalWords} words</span> spoken
          </p>
        </div>

        <div className="space-y-6 mb-10">
          {Object.entries(grouped).map(([catLabel, catAnswers]) => (
            <div key={catLabel}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">{catLabel}</p>
              <div className="space-y-3">
                {catAnswers.map((a, i) => {
                  const q = qualityLabel(a.transcript, a.duration);
                  const skipped = a.transcript === "[Skipped]";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-xs font-bold text-gray-400">Q{answers.indexOf(a) + 1}</p>
                        <div className="flex items-center gap-2">
                          {!skipped && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />{formatDuration(a.duration)}
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${skipped ? "bg-gray-100 text-gray-400 border-gray-200" : q.color}`}>
                            {skipped ? "Skipped" : q.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-2">{a.question}</p>
                      {!skipped && (
                        <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                          {a.transcript || <span className="italic text-gray-400">No speech detected</span>}
                        </p>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setPhase("category")}
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

  // ── Active interview (speaking / listening / review) ──────────────────────────
  if (activeQuestions.length === 0) return null;
  const currentQ = activeQuestions[qIndex];
  const currentCat = categories.find((c) => c.label === currentQ.category);

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {flag} {activeCategoryLabel} · Q{qIndex + 1}/{activeQuestions.length}
          </span>
          <button
            onClick={() => {
              if (!muted && typeof window !== "undefined") window.speechSynthesis.cancel();
              setMuted((m) => !m);
            }}
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
        {currentCat && (
          <p className={`text-xs font-semibold mt-2 ${accentText}`}>{currentCat.label}</p>
        )}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.22 }}
          className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[11px] font-bold uppercase tracking-widest ${accentText}`}>
              Question {qIndex + 1}
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
      <div className="flex flex-col items-center gap-5 mb-6">
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

      {/* Live transcript */}
      <AnimatePresence>
        {(phase === "listening" || phase === "review") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
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
                rows={3}
                placeholder="Type your answer here…"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {phase === "speaking" && (
          <button
            onClick={() => { if (typeof window !== "undefined") window.speechSynthesis.cancel(); setPhase("listening"); }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Skip reading →
          </button>
        )}
        {phase === "listening" && (
          <>
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => { stopListening(); setPhase("review"); }}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}
            >
              <CheckCircle2 className="w-4 h-4" /> Stop & Review
            </motion.button>
            <button
              onClick={() => saveAndAdvance("[Skipped]")}
              className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Skip question
            </button>
          </>
        )}
        {phase === "review" && (
          <>
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => saveAndAdvance(transcript)}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}
            >
              {qIndex + 1 < activeQuestions.length
                ? <><span>Next question</span> <ChevronRight className="w-4 h-4" /></>
                : <><span>Finish session</span> <CheckCircle2 className="w-4 h-4" /></>}
            </motion.button>
            <button
              onClick={() => {
                setTranscript("");
                elapsedRef.current = 0;
                setElapsed(0);
                speakQuestion(currentQ.question);
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-answer
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function InterviewPrepInner() {
  const searchParams = useSearchParams();
  const initialCountry = searchParams.get("country") as Country | null;
  const [country, setCountry] = useState<Country | null>(
    initialCountry === "australia" || initialCountry === "uk" ? initialCountry : null
  );

  const categories = country === "australia" ? AU_CATEGORIES : UK_CATEGORIES;

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
              <InterviewSession country={country} categories={categories} onReset={() => setCountry(null)} />
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

// ─── Page export ──────────────────────────────────────────────────────────────

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

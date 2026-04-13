"use client";

// ─── Web Speech API type shims ────────────────────────────────────────────────
// These APIs are widely supported but absent from lib.dom.d.ts typings.
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { transcript: string; confidence: number };
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
  new (): SpeechRecognitionShim;
}

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
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
} from "lucide-react";
import Link from "next/link";

// ─── Question banks ───────────────────────────────────────────────────────────

const AU_QUESTIONS = [
  "Tell me about yourself and what motivated you to pursue higher education in Australia.",
  "What specifically attracted you to this university and program?",
  "How does your academic background and experience prepare you for this course?",
  "What are your career goals after completing this degree, and how does studying in Australia help you achieve them?",
  "Describe a significant academic challenge you faced and explain how you overcame it.",
  "What unique perspective or contribution will you bring to the university community?",
  "How do you plan to adapt to studying and living in a new cultural environment?",
  "Are there any research areas or topics within your field that particularly interest you, and why?",
  "How do you manage your time and stay organised when balancing multiple academic and personal commitments?",
  "Do you have any questions for us about the program, support services, or student life at this university?",
];

const UK_QUESTIONS = [
  "Why do you want to study this particular subject at university level?",
  "What have you read, watched, or explored recently that genuinely deepened your interest in this field?",
  "Which aspect of your subject do you find most intellectually challenging or surprising, and why?",
  "Describe an unsolved problem or ongoing debate within your field, and share your perspective on it.",
  "How would you explain a core concept from your subject to someone with absolutely no background in it?",
  "What distinguishes your application and demonstrates that you are the right candidate for this program?",
  "Tell me about something you studied or discovered outside your curriculum that significantly influenced your thinking.",
  "How has your personal statement journey shaped or refined your understanding of the subject?",
  "Where do you see academic research and practice in your field heading over the next decade?",
  "What intellectual or academic contribution do you hope to make during your time at this university?",
];

type Country = "australia" | "uk";
type Phase = "select" | "ready" | "speaking" | "listening" | "review" | "complete";

interface Answer {
  question: string;
  transcript: string;
  duration: number; // seconds
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function qualityLabel(transcript: string, duration: number) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length;
  if (words < 15 || duration < 8)
    return { label: "Too brief", color: "text-rose-600 bg-rose-50 border-rose-200" };
  if (words < 40 || duration < 20)
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
        Speak your answers out loud. The AI reads each question to you, listens to your response,
        then transcribes it so you can review and improve.
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
              <h3 className="text-xl font-extrabold text-gray-900">University Interview</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            10 questions covering motivation, academic fit, cultural readiness, and career goals — tailored to Group of Eight admissions style.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Go8 style", "10 questions", "Voice + transcript"].map((t) => (
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
              <h3 className="text-xl font-extrabold text-gray-900">University Interview</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            10 Oxbridge-style questions probing subject passion, critical thinking, academic reading, and intellectual curiosity across Russell Group universities.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["Oxbridge style", "10 questions", "Voice + transcript"].map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">{t}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-rose-600 font-bold text-sm group-hover:gap-3 transition-all">
            Start session <ChevronRight className="w-4 h-4" />
          </span>
        </motion.button>
      </div>

      {/* Features strip */}
      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 font-medium">
        {[
          { icon: "🎙️", text: "Speaks questions aloud" },
          { icon: "📝", text: "Transcribes your answer" },
          { icon: "📊", text: "Shows answer quality" },
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

// ─── Waveform animation ───────────────────────────────────────────────────────

function Waveform({ active, color }: { active: boolean; color: string }) {
  const bars = 7;
  return (
    <div className="flex items-center gap-[3px] h-8">
      {Array.from({ length: bars }).map((_, i) => (
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
  onReset,
}: {
  country: Country;
  onReset: () => void;
}) {
  const questions = country === "australia" ? AU_QUESTIONS : UK_QUESTIONS;
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : "from-rose-500 to-red-600";
  const accentText = country === "australia" ? "text-sky-600" : "text-rose-600";
  const accentBadge = country === "australia" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700";
  const flag = country === "australia" ? "🇦🇺" : "🇬🇧";
  const label = country === "australia" ? "Australia" : "United Kingdom";

  const [phase, setPhase] = useState<Phase>("ready");
  const [qIndex, setQIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [sttSupported, setSttSupported] = useState(true);
  const [muted, setMuted] = useState(false);

  const recogRef = useRef<SpeechRecognitionShim | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  // Check browser support
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("speechSynthesis" in window)) setTtsSupported(false);
      const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
      if (!win.SpeechRecognition && !win.webkitSpeechRecognition) setSttSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recogRef.current) {
        try { recogRef.current.abort(); } catch { /* ignore */ }
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
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
      utter.rate = 0.92;
      utter.pitch = 1;
      utter.volume = 1;

      // Prefer a natural-sounding English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Daniel") ||
            v.name.includes("Karen") ||
            v.name.includes("Samantha") ||
            v.name.includes("Google UK") ||
            v.name.includes("Google US"))
      );
      if (preferred) utter.voice = preferred;

      utter.onend = () => setPhase("listening");
      utterRef.current = utter;
      window.speechSynthesis.speak(utter);
      setPhase("speaking");
    },
    [ttsSupported, muted]
  );

  const startListening = useCallback(() => {
    if (!sttSupported || typeof window === "undefined") return;

    const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recog = new SpeechRecognitionCtor();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    let finalTranscript = "";

    recog.onresult = (event: SpeechRecognitionEventShim) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalTranscript += res[0].transcript + " ";
        } else {
          interim += res[0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recog.onerror = () => {
      // Silently handle — user may not have granted mic
    };

    recog.onend = () => {
      setTranscript(finalTranscript.trim());
    };

    recogRef.current = recog;
    recog.start();

    // Start elapsed timer
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
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // When phase becomes "listening", start STT
  useEffect(() => {
    if (phase === "listening") {
      setTranscript("");
      startListening();
    }
    if (phase !== "listening") {
      stopListening();
    }
  }, [phase, startListening, stopListening]);

  const handleStart = () => {
    speakQuestion(questions[0]);
  };

  const handleStopAndReview = () => {
    stopListening();
    setPhase("review");
  };

  const handleNextQuestion = () => {
    // Save answer
    const newAnswer: Answer = {
      question: questions[qIndex],
      transcript: transcript.trim(),
      duration: elapsedRef.current,
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setTranscript("");
    elapsedRef.current = 0;
    setElapsed(0);

    const next = qIndex + 1;
    if (next >= questions.length) {
      setPhase("complete");
    } else {
      setQIndex(next);
      speakQuestion(questions[next]);
    }
  };

  const handleSkip = () => {
    const newAnswer: Answer = {
      question: questions[qIndex],
      transcript: "[Skipped]",
      duration: 0,
    };
    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);
    setTranscript("");
    elapsedRef.current = 0;
    setElapsed(0);

    const next = qIndex + 1;
    if (next >= questions.length) {
      setPhase("complete");
    } else {
      setQIndex(next);
      speakQuestion(questions[next]);
    }
  };

  const handleToggleMute = () => {
    if (!muted && typeof window !== "undefined") {
      window.speechSynthesis.cancel();
    }
    setMuted((m) => !m);
  };

  const progress = ((qIndex) / questions.length) * 100;

  // ── Ready screen ───────────────────────────────────────────────────────────
  if (phase === "ready") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">{flag}</span>
          <div className="text-left">
            <p className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>{label}</p>
            <h2 className="text-2xl font-extrabold text-gray-900">University Interview</h2>
          </div>
        </div>

        <div className="bg-gray-50 rounded-3xl p-7 mb-8 text-left space-y-4 border border-gray-100">
          <h3 className="font-bold text-gray-900 text-base">How this works</h3>
          <ol className="space-y-3">
            {[
              { icon: "🔊", text: "The AI reads each question aloud — listen carefully" },
              { icon: "🎙️", text: "Press 'Stop & Review' when you've finished your answer" },
              { icon: "📝", text: "Your spoken answer is transcribed in real time" },
              { icon: "✅", text: "Review your transcript, then move to the next question" },
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                <span className="text-lg leading-none">{s.icon}</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs text-gray-400 mt-2">
            Your browser will request microphone access when you start. Chrome gives the best results.
          </p>
        </div>

        {!sttSupported && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            ⚠️ Your browser does not support speech recognition. You can still listen to questions and type your answers below.
          </div>
        )}

        <motion.button
          whileHover={{ y: -2 }}
          onClick={handleStart}
          className={`w-full py-4 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg`}
        >
          <Mic className="w-5 h-5" /> Begin Voice Interview
        </motion.button>

        <button
          onClick={onReset}
          className="mt-4 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mx-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to country selection
        </button>
      </motion.div>
    );
  }

  // ── Complete screen ────────────────────────────────────────────────────────
  if (phase === "complete") {
    const totalWords = answers.reduce(
      (sum, a) => sum + a.transcript.trim().split(/\s+/).filter((w) => w && w !== "[Skipped]").length,
      0
    );
    const answeredCount = answers.filter((a) => a.transcript !== "[Skipped]").length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-200">
            <Trophy className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Session complete!</h2>
          <p className="text-gray-500 mt-2">
            You answered <span className="font-bold text-gray-800">{answeredCount}/{questions.length}</span> questions · <span className="font-bold text-gray-800">{totalWords} words</span> spoken in total
          </p>
        </div>

        <div className="space-y-4 mb-10">
          {answers.map((a, i) => {
            const q = qualityLabel(a.transcript, a.duration);
            const skipped = a.transcript === "[Skipped]";
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Q{i + 1}</p>
                  <div className="flex items-center gap-2">
                    {!skipped && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />{formatDuration(a.duration)}
                      </span>
                    )}
                    {skipped ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200">
                        Skipped
                      </span>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${q.color}`}>
                        {q.label}
                      </span>
                    )}
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

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              setAnswers([]);
              setQIndex(0);
              setTranscript("");
              elapsedRef.current = 0;
              setElapsed(0);
              setPhase("ready");
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

  // ── Active interview (speaking / listening / review) ───────────────────────
  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {flag} {label} · Question {qIndex + 1} of {questions.length}
          </span>
          <button
            onClick={handleToggleMute}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${accentBg}`}
            animate={{ width: `${progress + (1 / questions.length) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-white border border-gray-100 rounded-3xl p-7 shadow-sm mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-[11px] font-bold uppercase tracking-widest ${accentText}`}>
              Question {qIndex + 1}
            </span>
            {phase === "speaking" && (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Volume2 className="w-3 h-3 animate-pulse" /> Reading…
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-gray-900 leading-relaxed">
            {questions[qIndex]}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Voice state area */}
      <div className="flex flex-col items-center gap-5 mb-8">
        {/* Waveform when speaking */}
        {phase === "speaking" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <Waveform active={true} color={country === "australia" ? "bg-sky-400" : "bg-rose-400"} />
            <p className="text-sm text-gray-400">Listening to question…</p>
          </motion.div>
        )}

        {/* Mic button when listening */}
        {phase === "listening" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <MicPulse listening={true} />
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Listening · {formatDuration(elapsed)}
            </div>
            {!sttSupported && (
              <p className="text-xs text-amber-600 text-center max-w-xs">
                Speech recognition not available in this browser. Please type your answer below.
              </p>
            )}
          </motion.div>
        )}

        {/* Review mic (inactive) */}
        {phase === "review" && (
          <MicPulse listening={false} />
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
                    ? sttSupported
                      ? "Speak now — your words will appear here…"
                      : "Type your answer below (speech not supported in this browser)"
                    : "No speech was detected."}
                </p>
              )}
            </div>

            {/* Manual text input fallback */}
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
            onClick={() => {
              if (typeof window !== "undefined") window.speechSynthesis.cancel();
              setPhase("listening");
            }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Skip reading →
          </button>
        )}

        {phase === "listening" && (
          <>
            <motion.button
              whileHover={{ y: -1 }}
              onClick={handleStopAndReview}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}
            >
              <CheckCircle2 className="w-4 h-4" /> Stop & Review
            </motion.button>
            <button
              onClick={handleSkip}
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
              onClick={handleNextQuestion}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg`}
            >
              {qIndex + 1 < questions.length ? (
                <>Next question <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Finish session <CheckCircle2 className="w-4 h-4" /></>
              )}
            </motion.button>
            <button
              onClick={() => {
                setTranscript("");
                elapsedRef.current = 0;
                setElapsed(0);
                speakQuestion(questions[qIndex]);
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

// ─── Inner page (reads searchParams) ─────────────────────────────────────────

function InterviewPrepInner() {
  const searchParams = useSearchParams();
  const initialCountry = searchParams.get("country") as Country | null;
  const [country, setCountry] = useState<Country | null>(
    initialCountry === "australia" || initialCountry === "uk" ? initialCountry : null
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Nav */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 text-sm">eduvianAI</span>
          </Link>
          <Link
            href="/#interview-prep"
            className="text-xs font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
        </div>
      </header>

      {/* Main */}
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} eduvianAI · Voice Interview Prep
      </footer>
    </div>
  );
}

// ─── Page export (wraps in Suspense for useSearchParams) ──────────────────────

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

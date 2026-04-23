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

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AuthGate from "@/components/AuthGate";
import {
  ArrowRight, ArrowLeft, Clock, CheckCircle2, AlertTriangle,
  Mic, MicOff, ChevronRight, Loader2, PenLine, BookOpen,
  RotateCcw, Star, TrendingUp, AlertCircle, Volume2, VolumeX, ExternalLink,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "landing" | "read_aloud" | "repeat_sentence" | "describe_image" | "essay" | "fill_blanks" | "reorder" | "write_from_dictation" | "submitting" | "results";

interface SectionScore {
  score?: number;
  band?: string;
  feedback?: string;
  strengths?: string[];
  improvements?: string[];
}

// ─── Content Data ─────────────────────────────────────────────────────────────

const READ_ALOUD_PASSAGES = [
  "The expansion of renewable energy infrastructure across Europe has accelerated significantly in the past decade, driven by government subsidies, falling technology costs, and growing public awareness of climate change.",
  "Urban biodiversity programmes aim to integrate green corridors, wetlands, and native plantings into city planning, providing habitat for pollinators and improving the mental wellbeing of residents.",
  "Artificial intelligence applications in diagnostic medicine have demonstrated remarkable accuracy in identifying certain cancers from medical imaging, sometimes surpassing the performance of specialist clinicians.",
  "The relationship between economic growth and environmental degradation is complex and contested, with some researchers arguing that advanced economies eventually reduce pollution as prosperity increases.",
  "Microplastics have been detected in environments ranging from the deepest ocean trenches to arctic ice, raising urgent questions about the long-term effects of plastic pollution on ecosystems and human health.",
];

const REPEAT_SENTENCES = [
  "The university library will be closed for maintenance on the first weekend of next month.",
  "Students are encouraged to submit their assignment drafts at least three days before the deadline.",
  "The professor mentioned that the exam will focus primarily on chapters seven through twelve.",
  "A brief orientation session for new postgraduate students has been scheduled for Thursday afternoon.",
  "Please note that the campus shuttle service will not operate during the public holiday.",
];

const DESCRIBE_IMAGE_PROMPTS = [
  {
    prompt: "A bar chart comparing smartphone usage hours per day across four age groups: 18-25 (5.2 hrs), 26-35 (4.1 hrs), 36-50 (2.8 hrs), and 51+ (1.4 hrs). The chart shows a clear declining trend with age.",
    instruction: "Describe the image in 25-40 words, covering the main trend and key data points.",
  },
  {
    prompt: "A pie chart showing global energy sources: Coal 27%, Natural Gas 23%, Oil 31%, Nuclear 5%, Hydroelectric 7%, Other Renewables 7%. Non-renewable sources dominate at 81%.",
    instruction: "Describe the image in 25-40 words, covering the main distribution and most notable feature.",
  },
  {
    prompt: "A line graph showing a city's average monthly rainfall (mm). Values peak in July (180mm) and August (165mm), with a dry period from November to February (below 30mm each month).",
    instruction: "Describe the image in 25-40 words, identifying the key pattern and notable months.",
  },
];

const WRITE_FROM_DICTATION_ITEMS = [
  "The findings of this study suggest a strong correlation between sleep duration and academic performance.",
  "Global temperatures have risen by approximately one degree Celsius since the pre-industrial period.",
  "Critical thinking is considered one of the most transferable skills in higher education.",
];

const ESSAY_PROMPT = `Online communication has transformed the way people form and maintain relationships. While this has many benefits, it also has significant drawbacks. Discuss and give your own opinion.

Write between 200 and 300 words.`;

const FILL_BLANKS_ITEMS = [
  {
    text: "The industrial revolution fundamentally ________ the structure of European societies, accelerating the movement of populations from ________ communities to rapidly expanding urban centres. This ________ shift created both new economic opportunities and significant social challenges, including overcrowding, poor sanitation, and the erosion of traditional community ________ that had previously sustained rural life.",
    blanks: [
      { index: 0, options: ["transformed", "sustained", "delayed", "predicted"], answer: "transformed" },
      { index: 1, options: ["urban", "rural", "coastal", "industrial"], answer: "rural" },
      { index: 2, options: ["marginal", "demographic", "cultural", "seasonal"], answer: "demographic" },
      { index: 3, options: ["structures", "technologies", "languages", "exports"], answer: "structures" },
    ],
  },
  {
    text: "Climate models ________ that average global temperatures will rise by between 1.5 and 4 degrees Celsius by the end of this century, depending on the ________ of greenhouse gas emissions. The most ________ consequences are expected in low-lying coastal regions and tropical zones, where rising sea levels and extreme weather events will place enormous ________ on existing infrastructure and agricultural systems.",
    blanks: [
      { index: 0, options: ["project", "assume", "delay", "question"], answer: "project" },
      { index: 1, options: ["trajectory", "age", "speed", "memory"], answer: "trajectory" },
      { index: 2, options: ["subtle", "severe", "ancient", "calm"], answer: "severe" },
      { index: 3, options: ["pressure", "relaxation", "investment", "decoration"], answer: "pressure" },
    ],
  },
];

const REORDER_ITEMS = [
  {
    id: 1,
    sentences: [
      { id: "A", text: "This led to a significant reduction in the cost of solar panels and wind turbines over the following decade." },
      { id: "B", text: "Early government subsidies for renewable energy technologies were criticised as expensive and economically inefficient." },
      { id: "C", text: "As a result, renewable energy is now competitive with fossil fuels in many markets without requiring ongoing subsidies." },
      { id: "D", text: "However, these subsidies stimulated manufacturing investment and drove down production costs through economies of scale." },
      { id: "E", text: "Critics now acknowledge that the long-term strategic value of these early investments outweighed their initial fiscal cost." },
    ],
    correct: ["B", "D", "A", "C", "E"],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function useCountdown(initialSeconds: number, running: boolean, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    expiredRef.current = false;
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!expiredRef.current) { expiredRef.current = true; onExpire(); }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, onExpire]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return { seconds, formatted: `${mm}:${ss}` };
}

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav({ stage }: { stage: Stage }) {
  const stages: Stage[] = ["landing", "read_aloud", "repeat_sentence", "describe_image", "essay", "fill_blanks", "reorder", "write_from_dictation", "submitting", "results"];
  const activeIdx = stages.indexOf(stage);
  const progressPct = Math.round((activeIdx / (stages.length - 1)) * 100);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-8 py-0">
        <Link href="/english-test-lab" className="flex items-center gap-3 py-4">
          <EduvianLogoMark size={36} />
          <div>
            <span className="font-extrabold text-base text-white">PTE Academic-Style</span>
            <p className="text-[10px] text-violet-300 leading-none">Mock Test · eduvianAI</p>
          </div>
        </Link>
        <Link href="/english-test-lab" className="text-slate-400 hover:text-white text-sm transition-colors py-4">← Back to Lab</Link>
      </div>
      {stage !== "landing" && stage !== "results" && (
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PTEPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [readAloudIdx, setReadAloudIdx] = useState(0);
  const [prepSeconds, setPrepSeconds] = useState(40);
  const [prepRunning, setPrepRunning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [essayText, setEssayText] = useState("");
  const [fillAnswers, setFillAnswers] = useState<Record<string, string>>({});
  const [reorderOrder, setReorderOrder] = useState<string[]>(["A", "B", "C", "D", "E"]);
  const [scores, setScores] = useState<Record<string, SectionScore>>({});
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionShim | null>(null);

  const [rsIdx, setRsIdx] = useState(0);
  const [rsPrepRunning, setRsPrepRunning] = useState(false);
  const [rsPrepSeconds, setRsPrepSeconds] = useState(3);
  const [rsPlayingTTS, setRsPlayingTTS] = useState(false);
  const [diIdx, setDiIdx] = useState(0);
  const [wfdIdx, setWfdIdx] = useState(0);
  const [wfdAnswers, setWfdAnswers] = useState<Record<number, string>>({});
  const [wfdPlayingTTS, setWfdPlayingTTS] = useState(false);
  const [wfdHasPlayed, setWfdHasPlayed] = useState<Record<number, boolean>>({});

  const handleTimerExpire = useCallback(() => {
    if (stage === "essay") setStage("fill_blanks");
  }, [stage]);

  const timer = useCountdown(20 * 60, timerRunning && stage === "essay", handleTimerExpire);

  useEffect(() => {
    if (stage === "submitting") { handleSubmit(); }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = useCallback((key: string) => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as SpeechRecognitionCtor | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as SpeechRecognitionCtor | undefined;
    if (!SR) { alert("Speech recognition not supported. Try Chrome."); return; }
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    let final = "";
    rec.onresult = (e: SpeechRecognitionEventShim) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t + " "; else interim = t;
      }
      setTranscripts((prev) => ({ ...prev, [key]: final + interim }));
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  const playTTS = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.onend = () => { setRsPlayingTTS(false); setWfdPlayingTTS(false); if (onEnd) onEnd(); };
    u.onerror = () => { setRsPlayingTTS(false); setWfdPlayingTTS(false); };
    window.speechSynthesis.speak(u);
  }, []);

  const stopTTS = useCallback(() => {
    window.speechSynthesis?.cancel();
    setRsPlayingTTS(false);
    setWfdPlayingTTS(false);
  }, []);

  async function handleSubmit() {
    setIsScoring(true);
    setScoringError(false);
    const newScores: Record<string, SectionScore> = {};

    // Score Read Aloud speaking
    const raText = Object.entries(transcripts)
      .filter(([k]) => k.startsWith("RA-"))
      .map(([, v]) => v).join(" ");

    // Score Repeat Sentence (speaking) - use existing read_aloud scorer
    const rsText = Object.entries(transcripts)
      .filter(([k]) => k.startsWith("RS-"))
      .map(([, v]) => v).join(" ");

    // Score Describe Image (speaking)
    const diText = Object.entries(transcripts)
      .filter(([k]) => k.startsWith("DI-"))
      .map(([, v]) => v).join(" ");

    // Combine all speaking for a single speaking score
    const allSpeakingText = [raText, rsText, diText].filter(Boolean).join(" ");
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "PTE", section: "Speaking", taskType: "pte_speaking_read_aloud", prompt: "Read Aloud + Repeat Sentence + Describe Image tasks", response: allSpeakingText || "(No speaking recorded)" }),
      });
      if (res.ok) {
        const d = await res.json();
        newScores.read_aloud = { score: d.score, band: d.band, feedback: d.feedback, strengths: d.strengths, improvements: d.improvements };
      } else throw new Error();
    } catch { newScores.read_aloud = { score: 0, band: "N/A", feedback: "Scoring unavailable.", strengths: [], improvements: [] }; setScoringError(true); }

    // Score essay
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "PTE", section: "Writing", taskType: "pte_writing_essay", prompt: ESSAY_PROMPT, response: essayText }),
      });
      if (res.ok) {
        const d = await res.json();
        newScores.essay = { score: d.score, band: d.band, feedback: d.feedback, strengths: d.strengths, improvements: d.improvements };
      } else throw new Error();
    } catch { newScores.essay = { score: 0, band: "N/A", feedback: "Scoring unavailable.", strengths: [], improvements: [] }; setScoringError(true); }

    // Score fill in blanks
    let fillCorrect = 0;
    let fillTotal = 0;
    FILL_BLANKS_ITEMS.forEach((item, pi) => {
      item.blanks.forEach((b) => {
        fillTotal++;
        if (fillAnswers[`F${pi}-${b.index}`]?.toLowerCase() === b.answer.toLowerCase()) fillCorrect++;
      });
    });
    newScores.fill_blanks = { score: fillCorrect, band: `${fillCorrect}/${fillTotal}` };

    // Score reorder
    const correct = REORDER_ITEMS[0].correct;
    let reorderScore = 0;
    reorderOrder.forEach((item, i) => { if (item === correct[i]) reorderScore++; });
    newScores.reorder = { score: reorderScore, band: `${reorderScore}/${correct.length}` };

    // Score Write from Dictation (auto)
    let wfdCorrect = 0;
    WRITE_FROM_DICTATION_ITEMS.forEach((sent, i) => {
      const ans = (wfdAnswers[i] ?? "").toLowerCase().trim();
      const correctSent = sent.toLowerCase().trim();
      const words1 = new Set(ans.split(/\s+/));
      const words2 = correctSent.split(/\s+/);
      const matches = words2.filter((w: string) => words1.has(w)).length;
      if (matches / words2.length >= 0.75) wfdCorrect++;
    });
    newScores.wfd = { score: wfdCorrect, band: `${wfdCorrect}/${WRITE_FROM_DICTATION_ITEMS.length}` };

    // Estimate overall PTE communicative skills (0-90)
    const speaking90 = Math.round(((newScores.read_aloud.score ?? 0) / 15) * 90);
    const writing90 = Math.round(((newScores.essay.score ?? 0) / 15) * 90);
    const reading90 = Math.round(((fillCorrect / fillTotal + wfdCorrect / WRITE_FROM_DICTATION_ITEMS.length) / 2) * 90);
    newScores.overall = {
      score: Math.round((speaking90 + writing90 + reading90) / 3),
      band: `${Math.round((speaking90 + writing90 + reading90) / 3)}/90`,
    };
    newScores.skills = {
      band: `Speaking: ${speaking90} · Writing: ${writing90} · Reading/Listening: ${reading90}`,
    } as SectionScore;

    setScores(newScores);
    setIsScoring(false);
    setStage("results");
  }

  return (
    <AuthGate stage={3} toolName="PTE Mock Test" source="pte-mock">
    <div className="min-h-screen bg-slate-50 font-sans">
      <Nav stage={stage} />
      <div className="pt-16">
        <AnimatePresence mode="wait">
          {stage === "landing" && <PTELanding key="landing" onBegin={() => setStage("read_aloud")} />}

          {stage === "read_aloud" && (
            <ReadAloudSection
              key="read_aloud"
              idx={readAloudIdx}
              setIdx={setReadAloudIdx}
              prepSeconds={prepSeconds}
              setPrepSeconds={setPrepSeconds}
              prepRunning={prepRunning}
              setPrepRunning={setPrepRunning}
              isRecording={isRecording}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              transcripts={transcripts}
              onComplete={() => setStage("repeat_sentence")}
            />
          )}

          {stage === "repeat_sentence" && (
            <RepeatSentenceSection
              key="repeat_sentence"
              idx={rsIdx}
              setIdx={setRsIdx}
              prepRunning={rsPrepRunning}
              setPrepRunning={setRsPrepRunning}
              prepSeconds={rsPrepSeconds}
              setPrepSeconds={setRsPrepSeconds}
              isPlayingTTS={rsPlayingTTS}
              setIsPlayingTTS={setRsPlayingTTS}
              isRecording={isRecording}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              transcripts={transcripts}
              onPlayTTS={playTTS}
              onStopTTS={stopTTS}
              onComplete={() => setStage("describe_image")}
            />
          )}

          {stage === "describe_image" && (
            <DescribeImageSection
              key="describe_image"
              idx={diIdx}
              setIdx={setDiIdx}
              isRecording={isRecording}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              transcripts={transcripts}
              onComplete={() => { setStage("essay"); setTimerRunning(true); }}
            />
          )}

          {stage === "essay" && (
            <EssaySection
              key="essay"
              essayText={essayText}
              setEssayText={setEssayText}
              timer={timer}
              onComplete={() => { setTimerRunning(false); setStage("fill_blanks"); }}
            />
          )}

          {stage === "fill_blanks" && (
            <FillBlanksSection
              key="fill_blanks"
              answers={fillAnswers}
              setAnswers={setFillAnswers}
              onComplete={() => setStage("reorder")}
            />
          )}

          {stage === "reorder" && (
            <ReorderSection
              key="reorder"
              order={reorderOrder}
              setOrder={setReorderOrder}
              onComplete={() => setStage("write_from_dictation")}
            />
          )}

          {stage === "write_from_dictation" && (
            <WriteFromDictationSection
              key="write_from_dictation"
              idx={wfdIdx}
              setIdx={setWfdIdx}
              answers={wfdAnswers}
              setAnswers={setWfdAnswers}
              isPlaying={wfdPlayingTTS}
              hasPlayed={wfdHasPlayed}
              onPlay={(text: string, idx: number) => {
                setWfdPlayingTTS(true);
                setWfdHasPlayed((prev) => ({ ...prev, [idx]: true }));
                playTTS(text);
              }}
              onStop={stopTTS}
              onComplete={() => setStage("submitting")}
            />
          )}

          {stage === "submitting" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
              <h2 className="text-xl font-black text-slate-900">Scoring your test...</h2>
              <p className="text-slate-500 text-sm">AI is evaluating your responses. This takes a moment.</p>
            </motion.div>
          )}

          {stage === "results" && !isScoring && (
            <PTEResults key="results" scores={scores} scoringError={scoringError} />
          )}
        </AnimatePresence>
      </div>
    </div>
    </AuthGate>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function PTELanding({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 border border-violet-200 mb-5 text-sm font-bold">
          PTE Academic-Style Practice
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">PTE Academic-style Mock Test</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left mb-6">
          <strong>Disclaimer:</strong> This is original practice content created by eduvianAI. It is not official PTE Academic material and is not affiliated with or endorsed by Pearson.
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {[
          { name: "Read Aloud (Speaking)", desc: "5 passages · 40s prep, then record", time: "~10 min" },
          { name: "Repeat Sentence (Speaking)", desc: "5 sentences · listen and repeat", time: "~5 min" },
          { name: "Describe Image (Speaking)", desc: "3 prompts · describe charts and graphs", time: "~5 min" },
          { name: "Essay (Writing)", desc: "1 prompt · 200-300 words · AI scored", time: "20 min" },
          { name: "Fill in the Blanks (Reading)", desc: "2 paragraphs · dropdown selection", time: "~5 min" },
          { name: "Reorder Paragraphs (Reading)", desc: "Arrange 5 sentences in logical order", time: "~5 min" },
          { name: "Write from Dictation (Listening)", desc: "3 sentences · listen and type exactly", time: "~5 min" },
        ].map((s) => (
          <div key={s.name} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-sm">{s.name}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
            <span className="text-xs font-semibold text-violet-600 bg-violet-50 px-2 py-1 rounded-lg">{s.time}</span>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-extrabold text-slate-800 mb-2">How close is this to the real PTE Academic?</h3>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Mirrors key PTE task families: Read Aloud, Repeat Sentence, Describe Image, Essay, Fill Blanks, Reorder, Write from Dictation</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Communicative skills breakdown aligned to PTE public scoring framework</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Audio is computer-generated (real PTE uses professional recordings)</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Scores are readiness estimates only — not produced by Pearson's official scoring engine</li>
        </ul>
        <a href="https://www.pearsonpte.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors">
          Visit official Pearson PTE site <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <button onClick={onBegin} className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-violet-500/30 transition-all hover:-translate-y-0.5">
        Begin Mock <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Read Aloud Section ───────────────────────────────────────────────────────

function ReadAloudSection({ idx, setIdx, prepSeconds, setPrepSeconds, prepRunning, setPrepRunning, isRecording, onStartRecord, onStopRecord, transcripts, onComplete }: {
  idx: number;
  setIdx: (n: number) => void;
  prepSeconds: number;
  setPrepSeconds: (n: number) => void;
  prepRunning: boolean;
  setPrepRunning: (b: boolean) => void;
  isRecording: boolean;
  onStartRecord: (key: string) => void;
  onStopRecord: () => void;
  transcripts: Record<string, string>;
  onComplete: () => void;
}) {
  const isLast = idx === READ_ALOUD_PASSAGES.length - 1;

  useEffect(() => {
    setPrepSeconds(40);
    setPrepRunning(false);
  }, [idx, setPrepSeconds, setPrepRunning]);

  useEffect(() => {
    if (!prepRunning) return;
    if (prepSeconds <= 0) { setPrepRunning(false); return; }
    const id = setTimeout(() => setPrepSeconds(prepSeconds - 1), 1000);
    return () => clearTimeout(id);
  }, [prepRunning, prepSeconds, setPrepSeconds, setPrepRunning]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Read Aloud — Speaking</span>
        <h2 className="text-xl font-black text-slate-900">Passage {idx + 1} of {READ_ALOUD_PASSAGES.length}</h2>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-6 mb-5">
        <p className="text-xs font-bold text-violet-700 mb-3">Read this passage aloud. Prepare for 40 seconds, then record your reading.</p>
        <p className="text-base text-slate-800 leading-relaxed">{READ_ALOUD_PASSAGES[idx]}</p>
      </div>

      <div className="flex items-center gap-4 mb-5">
        {!prepRunning && !transcripts[`RA-${idx}`] && (
          <button onClick={() => setPrepRunning(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-sm hover:bg-amber-200 transition-all">
            Start 40s preparation
          </button>
        )}
        {prepRunning && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-mono font-bold text-amber-800">{prepSeconds}s</span>
            <span className="text-xs text-amber-700">preparation</span>
          </div>
        )}
        <button onClick={() => isRecording ? onStopRecord() : onStartRecord(`RA-${idx}`)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
          {isRecording ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Record</>}
        </button>
      </div>

      {transcripts[`RA-${idx}`] && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-5">
          <p className="text-xs text-slate-500 mb-1 font-bold">Your reading (transcribed):</p>
          <p className="text-sm text-slate-700 italic">{transcripts[`RA-${idx}`]}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>
        {isLast ? (
          <button onClick={onComplete}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Continue to Repeat Sentence <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setIdx(idx + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all">
            Next Passage <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Repeat Sentence Section ──────────────────────────────────────────────────

function RepeatSentenceSection({ idx, setIdx, prepRunning, setPrepRunning, prepSeconds, setPrepSeconds, isPlayingTTS, setIsPlayingTTS, isRecording, onStartRecord, onStopRecord, transcripts, onPlayTTS, onStopTTS, onComplete }: {
  idx: number; setIdx: (n: number) => void;
  prepRunning: boolean; setPrepRunning: (b: boolean) => void;
  prepSeconds: number; setPrepSeconds: (n: number) => void;
  isPlayingTTS: boolean; setIsPlayingTTS: (b: boolean) => void;
  isRecording: boolean; onStartRecord: (k: string) => void; onStopRecord: () => void;
  transcripts: Record<string, string>;
  onPlayTTS: (text: string, onEnd?: () => void) => void; onStopTTS: () => void;
  onComplete: () => void;
}) {
  const isLast = idx === REPEAT_SENTENCES.length - 1;
  useEffect(() => { setPrepSeconds(3); setPrepRunning(false); }, [idx, setPrepSeconds, setPrepRunning]);
  useEffect(() => {
    if (!prepRunning) return;
    if (prepSeconds <= 0) { setPrepRunning(false); return; }
    const id = setTimeout(() => setPrepSeconds(prepSeconds - 1), 1000);
    return () => clearTimeout(id);
  }, [prepRunning, prepSeconds, setPrepSeconds, setPrepRunning]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Repeat Sentence — Speaking</span>
        <h2 className="text-xl font-black text-slate-900">Sentence {idx + 1} of {REPEAT_SENTENCES.length}</h2>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        Computer-generated audio. Real PTE uses professionally recorded sentences.
      </div>
      <div className="bg-slate-800 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4">
        <p className="text-slate-400 text-sm">Listen to the sentence, then repeat it exactly.</p>
        <button onClick={() => isPlayingTTS ? onStopTTS() : (setIsPlayingTTS(true), onPlayTTS(REPEAT_SENTENCES[idx]))}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${isPlayingTTS ? "bg-red-500 text-white" : "bg-violet-500 text-white hover:bg-violet-600"}`}>
          {isPlayingTTS ? <><VolumeX className="w-4 h-4" /> Stop</> : <><Volume2 className="w-4 h-4" /> Play</>}
        </button>
      </div>
      {prepRunning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl mb-4 inline-flex">
          <Clock className="w-4 h-4 text-amber-600" />
          <span className="font-mono font-bold text-amber-800">{prepSeconds}s</span>
          <span className="text-xs text-amber-700">then record</span>
        </div>
      )}
      {!prepRunning && (
        <button onClick={() => isRecording ? onStopRecord() : onStartRecord(`RS-${idx}`)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all mb-4 ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
          {isRecording ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Record</>}
        </button>
      )}
      {transcripts[`RS-${idx}`] && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
          <p className="text-xs text-slate-500 mb-1 font-bold">Your response:</p>
          <p className="text-sm text-slate-700 italic">{transcripts[`RS-${idx}`]}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"><ArrowLeft className="w-4 h-4" /> Prev</button>
        {isLast ? (
          <button onClick={onComplete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Continue to Describe Image <ChevronRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all">Next <ChevronRight className="w-4 h-4" /></button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Describe Image Section ───────────────────────────────────────────────────

function DescribeImageSection({ idx, setIdx, isRecording, onStartRecord, onStopRecord, transcripts, onComplete }: {
  idx: number; setIdx: (n: number) => void;
  isRecording: boolean; onStartRecord: (k: string) => void; onStopRecord: () => void;
  transcripts: Record<string, string>; onComplete: () => void;
}) {
  const isLast = idx === DESCRIBE_IMAGE_PROMPTS.length - 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Describe Image — Speaking</span>
        <h2 className="text-xl font-black text-slate-900">Image {idx + 1} of {DESCRIBE_IMAGE_PROMPTS.length}</h2>
      </div>
      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-5">
        <p className="text-xs font-bold text-violet-700 mb-2">{DESCRIBE_IMAGE_PROMPTS[idx].instruction}</p>
        <p className="text-sm text-slate-700 leading-relaxed bg-white rounded-xl p-4 border border-violet-100">{DESCRIBE_IMAGE_PROMPTS[idx].prompt}</p>
      </div>
      <button onClick={() => isRecording ? onStopRecord() : onStartRecord(`DI-${idx}`)}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all mb-4 ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-violet-600 text-white hover:bg-violet-700"}`}>
        {isRecording ? <><MicOff className="w-4 h-4" /> Stop recording</> : <><Mic className="w-4 h-4" /> Record response</>}
      </button>
      {transcripts[`DI-${idx}`] && (
        <div className="bg-white rounded-xl border border-slate-200 p-3 mb-4">
          <p className="text-xs text-slate-500 mb-1 font-bold">Your response:</p>
          <p className="text-sm text-slate-700 italic">{transcripts[`DI-${idx}`]}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"><ArrowLeft className="w-4 h-4" /> Prev</button>
        {isLast ? (
          <button onClick={onComplete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Continue to Essay <ChevronRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all">Next <ChevronRight className="w-4 h-4" /></button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Essay Section ────────────────────────────────────────────────────────────

function EssaySection({ essayText, setEssayText, timer, onComplete }: {
  essayText: string;
  setEssayText: (t: string) => void;
  timer: { formatted: string; seconds: number };
  onComplete: () => void;
}) {
  const wc = wordCount(essayText);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Essay — Writing</span>
          <h2 className="text-xl font-black text-slate-900">Write an Essay</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 300 ? "bg-red-100 text-red-700" : "bg-violet-100 text-violet-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 mb-5">
        <p className="text-sm text-slate-800 leading-relaxed">{ESSAY_PROMPT}</p>
      </div>

      <textarea
        value={essayText}
        onChange={(e) => setEssayText(e.target.value)}
        rows={16}
        placeholder="Write your essay here..."
        className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:border-violet-400 resize-none mb-2"
      />
      <div className="flex justify-between text-xs text-slate-500 mb-6">
        <span>Words: <strong className={wc >= 200 && wc <= 300 ? "text-emerald-600" : "text-amber-600"}>{wc}</strong> / 200–300</span>
        {wc < 200 && <span className="text-amber-600">Needs {200 - wc} more words</span>}
        {wc > 300 && <span className="text-red-600">{wc - 300} words over limit</span>}
      </div>

      <button onClick={onComplete}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Submit Essay <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Fill in the Blanks Section ───────────────────────────────────────────────

function FillBlanksSection({ answers, setAnswers, onComplete }: {
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onComplete: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Fill in the Blanks — Reading</span>
        <h2 className="text-xl font-black text-slate-900">Complete the paragraphs</h2>
        <p className="text-sm text-slate-500 mt-1">Select the best word to fill each blank.</p>
      </div>

      {FILL_BLANKS_ITEMS.map((item, pi) => {
        const parts = item.text.split("________");
        return (
          <div key={pi} className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
            <p className="text-xs font-bold text-violet-600 mb-3">Paragraph {pi + 1}</p>
            <p className="text-sm text-slate-700 leading-loose">
              {parts.map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < item.blanks.length && (
                    <select
                      value={answers[`F${pi}-${item.blanks[i].index}`] ?? ""}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [`F${pi}-${item.blanks[i].index}`]: e.target.value }))}
                      className="inline mx-1 px-2 py-0.5 rounded-lg border border-violet-300 text-xs font-semibold bg-violet-50 focus:outline-none focus:ring-1 focus:ring-violet-400"
                    >
                      <option value="">-- select --</option>
                      {item.blanks[i].options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
        );
      })}

      <button onClick={onComplete}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Continue to Reorder <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Reorder Section ──────────────────────────────────────────────────────────

function ReorderSection({ order, setOrder, onComplete }: {
  order: string[];
  setOrder: (o: string[]) => void;
  onComplete: () => void;
}) {
  const item = REORDER_ITEMS[0];
  const sentences = item.sentences;

  const moveUp = (i: number) => {
    if (i === 0) return;
    const newOrder = [...order];
    [newOrder[i - 1], newOrder[i]] = [newOrder[i], newOrder[i - 1]];
    setOrder(newOrder);
  };
  const moveDown = (i: number) => {
    if (i === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[i], newOrder[i + 1]] = [newOrder[i + 1], newOrder[i]];
    setOrder(newOrder);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Reorder Paragraphs — Reading</span>
        <h2 className="text-xl font-black text-slate-900">Arrange these sentences in logical order</h2>
        <p className="text-sm text-slate-500 mt-1">Use the arrows to move sentences up or down.</p>
      </div>

      <div className="space-y-2 mb-8">
        {order.map((id, i) => {
          const sentence = sentences.find((s) => s.id === id)!;
          return (
            <div key={id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-sm text-slate-700 flex-1">{sentence.text}</p>
              <div className="flex flex-col gap-1">
                <button onClick={() => moveUp(i)} disabled={i === 0}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-all">▲</button>
                <button onClick={() => moveDown(i)} disabled={i === order.length - 1}
                  className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 transition-all">▼</button>
              </div>
            </div>
          );
        })}
      </div>

      <button onClick={onComplete}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Continue to Write from Dictation <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Write from Dictation Section ────────────────────────────────────────────

function WriteFromDictationSection({ idx, setIdx, answers, setAnswers, isPlaying, hasPlayed, onPlay, onStop, onComplete }: {
  idx: number; setIdx: (n: number) => void;
  answers: Record<number, string>; setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  isPlaying: boolean; hasPlayed: Record<number, boolean>;
  onPlay: (text: string, idx: number) => void; onStop: () => void; onComplete: () => void;
}) {
  const isLast = idx === WRITE_FROM_DICTATION_ITEMS.length - 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-violet-600 uppercase tracking-widest">Write from Dictation — Listening</span>
        <h2 className="text-xl font-black text-slate-900">Sentence {idx + 1} of {WRITE_FROM_DICTATION_ITEMS.length}</h2>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
        Computer-generated audio. Real PTE uses professionally recorded sentences.
      </div>
      <div className="bg-slate-800 rounded-2xl p-5 mb-5 flex items-center justify-between gap-4">
        <p className="text-slate-400 text-sm">Listen and type the sentence exactly as you hear it.</p>
        <button onClick={() => isPlaying ? onStop() : onPlay(WRITE_FROM_DICTATION_ITEMS[idx], idx)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ${isPlaying ? "bg-red-500 text-white" : "bg-violet-500 text-white hover:bg-violet-600"}`}>
          {isPlaying ? <><VolumeX className="w-4 h-4" /> Stop</> : <><Volume2 className="w-4 h-4" /> {hasPlayed[idx] ? "Replay" : "Play"}</>}
        </button>
      </div>
      <input type="text" value={answers[idx] ?? ""} onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
        placeholder="Type the sentence exactly as you heard it..."
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-400 mb-6" />
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50"><ArrowLeft className="w-4 h-4" /> Prev</button>
        {isLast ? (
          <button onClick={onComplete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg transition-all">Submit Test <ChevronRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-all">Next <ChevronRight className="w-4 h-4" /></button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function PTEResults({ scores, scoringError }: { scores: Record<string, SectionScore>; scoringError: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 border border-violet-200 mb-4 text-sm font-bold">
          <Star className="w-4 h-4" /> Test Complete
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Your PTE Results</h1>
        <p className="text-slate-500 text-sm">Estimated communicative skills scores out of 90</p>

        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shadow-2xl shadow-violet-500/40 mt-6 mb-2">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{scores.overall?.score ?? "—"}</p>
            <p className="text-[10px] text-violet-200 font-bold uppercase">Overall /90</p>
          </div>
        </div>

        {scoringError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Some sections could not be AI-scored. Check individual feedback.
          </div>
        )}
      </div>

      {/* Skill bars */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          <h3 className="font-extrabold text-slate-900">Communicative Skills Breakdown</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">{scores.skills?.band ?? "Scores unavailable"}</p>
        {[
          { label: "Speaking (Read Aloud + Repeat Sentence + Describe Image)", key: "read_aloud", max: 90 },
          { label: "Writing (Essay)", key: "essay", max: 90 },
          { label: "Reading (Fill in Blanks)", key: "fill_blanks", max: 8 },
          { label: "Reading (Reorder)", key: "reorder", max: 5 },
          { label: "Listening (Write from Dictation)", key: "wfd", max: 3 },
        ].map((s) => {
          const sc = scores[s.key];
          const pct = sc?.score ? Math.min(100, (sc.score / s.max) * 100) : 0;
          return (
            <div key={s.key} className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{s.label}</span>
                <span className="text-violet-600 font-bold">{sc?.band ?? "—"}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full">
                <div className="h-2 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Essay feedback */}
      {scores.essay && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PenLine className="w-5 h-5 text-violet-600" />
            <h3 className="font-extrabold text-slate-900">Essay Feedback</h3>
          </div>
          {scores.essay.feedback && <p className="text-sm text-slate-600 mb-3">{scores.essay.feedback}</p>}
          {scores.essay.strengths && scores.essay.strengths.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-bold text-emerald-700 mb-1">Strengths</p>
              <ul className="space-y-1">{scores.essay.strengths.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />{s}</li>)}</ul>
            </div>
          )}
          {scores.essay.improvements && scores.essay.improvements.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">Areas to improve</p>
              <ul className="space-y-1">{scores.essay.improvements.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5" />{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {(() => {
        const speaking90 = Math.round(((scores.read_aloud?.score ?? 0) / 15) * 90);
        const writing90 = Math.round(((scores.essay?.score ?? 0) / 15) * 90);
        const areas = [
          { label: "Speaking", score: speaking90 },
          { label: "Writing", score: writing90 },
        ];
        const weakest = areas.reduce((a, b) => a.score < b.score ? a : b);
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6">
            <h3 className="font-extrabold text-indigo-900 mb-1 text-sm">Recommended next action</h3>
            <p className="text-sm text-indigo-800">Your weakest productive skill is <strong>{weakest.label}</strong>. Focus your practice on {weakest.label === "Speaking" ? "Read Aloud, Repeat Sentence, and Describe Image tasks" : "Essay and Summarize Written Text tasks"} before your next attempt.</p>
          </div>
        );
      })()}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800">
        <strong>Disclaimer:</strong> These are estimated practice scores only. Not an official PTE Academic result. For official scoring, visit pearsonpte.com.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/english-test-lab/pte" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-violet-200 text-violet-700 font-bold text-sm hover:bg-violet-50 transition-all">
          <RotateCcw className="w-4 h-4" /> Try again
        </Link>
        <Link href="/get-started" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-xl transition-all">
          <BookOpen className="w-4 h-4" /> Check your university shortlist
        </Link>
      </div>
    </motion.div>
  );
}

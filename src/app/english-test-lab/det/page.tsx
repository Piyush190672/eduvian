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
  ArrowRight, Clock, CheckCircle2, AlertTriangle,
  Mic, MicOff, Volume2, VolumeX, ChevronRight, Loader2,
  RotateCcw, Star, TrendingUp, AlertCircle, ExternalLink,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "mock_select" | "landing" | "read_describe" | "listen_type" | "read_aloud" | "write_about" | "speak_about" | "submitting" | "results";

interface SectionScore { score?: number; band?: string; feedback?: string; strengths?: string[]; improvements?: string[]; }

// ─── Content ──────────────────────────────────────────────────────────────────

const GRAMMAR_SENTENCES = [
  { sentence: "The researchers has published their findings last week.", correct: false },
  { sentence: "Despite the heavy rain, the event proceeded as scheduled.", correct: true },
  { sentence: "Neither the manager nor the employees was informed about the change.", correct: false },
];

const IMAGE_DESCRIPTIONS = [
  { prompt: "Describe what you see: A crowded farmer's market with stalls of fresh vegetables, people browsing, and colourful canopies overhead." },
  { prompt: "Describe what you see: A graph showing global average temperatures rising steadily from 1900 to the present, with a sharp increase after 1980." },
];

const LISTEN_TYPE_SENTENCES = [
  "The university offers a wide range of postgraduate programmes.",
  "Climate change poses a significant threat to coastal communities worldwide.",
  "Students are required to submit their assignments by midnight on Friday.",
  "The museum has recently opened a new gallery dedicated to modern art.",
  "Effective communication is one of the most valuable professional skills.",
];

const READ_ALOUD_DET = [
  "Technology has transformed the way students access educational resources.",
  "Biodiversity loss is considered one of the most urgent environmental challenges of our time.",
  "The city council approved the new transport plan at last night's meeting.",
];

const WRITE_ABOUT_PROMPTS = [
  "Describe what is shown: A bar chart comparing the average weekly hours spent on digital devices by people aged 18-25, 26-40, and 41-60. The youngest group shows the highest usage at around 45 hours per week.",
  "Describe what is shown: A photograph of a busy urban street at night with neon signs, pedestrians, and heavy traffic. The scene appears to be in a major Asian city.",
  "Describe what is shown: A world map with colour-coded regions showing internet penetration rates — dark colours for high rates in North America and Europe, lighter shades for lower rates in parts of Africa and South Asia.",
];

const SPEAK_ABOUT_PROMPTS = [
  "Talk about a skill you would like to learn and why. Speak for about 1.5 minutes.",
  "Describe what a perfect city looks like to you. Speak for about 1.5 minutes.",
];

const MOCK_SETS = [
  {
    id: 1,
    grammarSentences: [
      { sentence: "The researchers has published their findings last week.", correct: false },
      { sentence: "Despite the heavy rain, the event proceeded as scheduled.", correct: true },
      { sentence: "Neither the manager nor the employees was informed about the change.", correct: false },
    ],
    imageDescriptions: [
      { prompt: "Describe what you see: A crowded farmer's market with stalls of fresh vegetables, people browsing, and colourful canopies overhead." },
      { prompt: "Describe what you see: A graph showing global average temperatures rising steadily from 1900 to the present, with a sharp increase after 1980." },
    ],
    listenTypeSentences: [
      "The university offers a wide range of postgraduate programmes.",
      "Climate change poses a significant threat to coastal communities worldwide.",
      "Students are required to submit their assignments by midnight on Friday.",
      "The museum has recently opened a new gallery dedicated to modern art.",
      "Effective communication is one of the most valuable professional skills.",
    ],
    readAloud: [
      "Technology has transformed the way students access educational resources.",
      "Biodiversity loss is considered one of the most urgent environmental challenges of our time.",
      "The city council approved the new transport plan at last night's meeting.",
    ],
    writeAbout: [
      "Describe what is shown: A bar chart comparing the average weekly hours spent on digital devices by people aged 18-25, 26-40, and 41-60. The youngest group shows the highest usage at around 45 hours per week.",
      "Describe what is shown: A photograph of a busy urban street at night with neon signs, pedestrians, and heavy traffic. The scene appears to be in a major Asian city.",
      "Describe what is shown: A world map with colour-coded regions showing internet penetration rates — dark colours for high rates in North America and Europe, lighter shades for lower rates in parts of Africa and South Asia.",
    ],
    speakAbout: [
      "Talk about a skill you would like to learn and why. Speak for about 1.5 minutes.",
      "Describe what a perfect city looks like to you. Speak for about 1.5 minutes.",
    ],
  },
  {
    id: 2,
    grammarSentences: [
      { sentence: "The committee have reached a unanimous decision after three hours of deliberation.", correct: true },
      { sentence: "Each of the students were given a copy of the revised syllabus.", correct: false },
      { sentence: "The number of applications received this year have exceeded expectations.", correct: false },
    ],
    imageDescriptions: [
      { prompt: "Describe what you see: A line graph showing smartphone sales declining from 2018 to 2022 in three major markets: the USA, China, and Germany." },
      { prompt: "Describe what you see: A photograph of a modern library interior with floor-to-ceiling bookshelves, students studying at tables, and natural light streaming through large windows." },
    ],
    listenTypeSentences: [
      "Researchers at the institute have identified a new species of deep-sea fish.",
      "The conference will be held at the central convention centre from the twelfth to the fifteenth.",
      "All participants are asked to register online before attending the workshop.",
      "The revised guidelines will come into effect at the beginning of the new academic year.",
      "Many urban areas are investing heavily in cycling infrastructure to reduce car dependency.",
    ],
    readAloud: [
      "Sustainable agriculture aims to meet current food needs without compromising future generations.",
      "The discovery of gravitational waves confirmed a key prediction of Einstein's general theory of relativity.",
      "Access to clean drinking water remains a critical challenge for millions of people globally.",
    ],
    writeAbout: [
      "Describe what is shown: A pie chart illustrating the breakdown of household energy consumption: heating 42%, appliances 23%, hot water 18%, lighting 11%, cooking 6%.",
      "Describe what is shown: A photograph showing a coastal city partially flooded, with cars submerged and residents using boats on what were once streets.",
      "Describe what is shown: A table comparing the average cost of living in five major cities: New York, London, Tokyo, Sydney, and Singapore, with columns for rent, food, transport, and healthcare.",
    ],
    speakAbout: [
      "Describe a time when you had to learn something completely new. What did you find most challenging? Speak for about 1.5 minutes.",
      "Some people believe that remote work is better than working in an office. What do you think? Speak for about 1.5 minutes.",
    ],
  },
  {
    id: 3,
    grammarSentences: [
      { sentence: "The data clearly shows that urban populations is growing faster than rural ones.", correct: false },
      { sentence: "Not only the students but also the professor was surprised by the results.", correct: true },
      { sentence: "The policy, along with several other measures, were introduced last month.", correct: false },
    ],
    imageDescriptions: [
      { prompt: "Describe what you see: A scatter plot showing a positive correlation between years of education and average annual income, with data points clustered around an upward-sloping trend line." },
      { prompt: "Describe what you see: A photograph of a school classroom in a developing country: simple wooden desks, a blackboard, and approximately thirty children in uniforms paying attention to a teacher." },
    ],
    listenTypeSentences: [
      "The government announced a new initiative to expand access to broadband in rural regions.",
      "Students who wish to change their programme of study must submit a formal application.",
      "The seminar on public health policy has been rescheduled to the following Wednesday.",
      "Electric vehicles now account for a growing proportion of new car registrations in Europe.",
      "The international student office is located on the second floor of the main administration building.",
    ],
    readAloud: [
      "Artificial intelligence is increasingly being used to personalise learning experiences for students.",
      "Ocean acidification threatens coral reef ecosystems and the marine biodiversity that depends on them.",
      "Urban planning decisions made today will shape the livability of cities for the next fifty years.",
    ],
    writeAbout: [
      "Describe what is shown: A dual-axis chart showing CO2 emissions (left axis) and average global temperature anomaly (right axis) from 1960 to 2020, with both lines showing a clear upward trend.",
      "Describe what is shown: An infographic displaying the most common causes of preventable deaths globally: cardiovascular disease 31%, cancer 16%, respiratory disease 7%, diabetes 4%, other causes 42%.",
      "Describe what is shown: A before-and-after aerial photograph of a forest area: the left half shows dense green forest, the right half shows the same area cleared for agriculture five years later.",
    ],
    speakAbout: [
      "What do you think is the most important quality a leader should have? Give reasons and examples. Speak for about 1.5 minutes.",
      "Talk about a place you have visited that made a strong impression on you. Speak for about 1.5 minutes.",
    ],
  },
];

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav({ stage }: { stage: Stage }) {
  const stages: Stage[] = ["mock_select", "landing", "read_describe", "listen_type", "read_aloud", "write_about", "speak_about", "submitting", "results"];
  const progressPct = Math.round((stages.indexOf(stage) / (stages.length - 1)) * 100);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-8 py-0">
        <Link href="/english-test-lab" className="flex items-center gap-3 py-4">
          <EduvianLogoMark size={36} />
          <div>
            <span className="font-extrabold text-base text-white">DET-Style Readiness Test</span>
            <p className="text-[10px] text-emerald-300 leading-none">eduvianAI · Not affiliated with Duolingo</p>
          </div>
        </Link>
        <Link href="/english-test-lab" className="text-slate-400 hover:text-white text-sm transition-colors py-4">← Back to Lab</Link>
      </div>
      {stage !== "landing" && stage !== "results" && (
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DETPage() {
  const [selectedMock, setSelectedMock] = useState(0); // index into MOCK_SETS
  const [stage, setStage] = useState<Stage>("mock_select");

  const mockContent = MOCK_SETS[selectedMock];

  // Read & Describe state
  const [grammarAnswers, setGrammarAnswers] = useState<Record<number, boolean | null>>({});
  const [imageResponses, setImageResponses] = useState<Record<number, string>>({});

  // Listen & Type state
  const [listenTypeAnswers, setListenTypeAnswers] = useState<Record<number, string>>({});
  const [currentListenIdx, setCurrentListenIdx] = useState(0);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [hasPlayed, setHasPlayed] = useState<Record<number, boolean>>({});

  // Read Aloud state
  const [raIdx, setRaIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  // Write About state
  const [writeResponses, setWriteResponses] = useState<Record<number, string>>({});
  const [waIdx, setWaIdx] = useState(0);

  // Speak About state
  const [speakIdx, setSpeakIdx] = useState(0);
  const [speakCountdown, setSpeakCountdown] = useState(90);
  const [speakRunning, setSpeakRunning] = useState(false);

  // Results
  const [scores, setScores] = useState<Record<string, SectionScore>>({});
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionShim | null>(null);

  useEffect(() => {
    if (stage === "submitting") { handleSubmit(); }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!speakRunning) return;
    if (speakCountdown <= 0) { setSpeakRunning(false); return; }
    const id = setTimeout(() => setSpeakCountdown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [speakRunning, speakCountdown]);

  const playTTS = useCallback((text: string, idx: number) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.onend = () => setIsPlayingTTS(false);
    u.onerror = () => setIsPlayingTTS(false);
    setIsPlayingTTS(true);
    setHasPlayed((prev) => ({ ...prev, [idx]: true }));
    window.speechSynthesis.speak(u);
  }, []);

  const stopTTS = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlayingTTS(false);
  }, []);

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

  async function scoreText(taskType: string, prompt: string, response: string): Promise<SectionScore> {
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "DET", section: taskType, taskType, prompt, response }),
      });
      if (res.ok) return await res.json();
    } catch { /* fall through */ }
    return { score: 0, band: "N/A", feedback: "Scoring unavailable.", strengths: [], improvements: [] };
  }

  async function handleSubmit() {
    setIsScoring(true);
    setScoringError(false);
    const newScores: Record<string, SectionScore> = {};

    // Grammar: auto-score
    let grammarCorrect = 0;
    mockContent.grammarSentences.forEach((s, i) => {
      const ans = grammarAnswers[i];
      if (ans === s.correct) grammarCorrect++;
    });
    newScores.grammar = { score: grammarCorrect, band: `${grammarCorrect}/${mockContent.grammarSentences.length}` };

    // Image descriptions: AI score
    const imgText = Object.values(imageResponses).join("\n\n");
    const imgResult = await scoreText("det_write_about", "Describe the image/graph (2 items)", imgText);
    newScores.image_describe = imgResult;
    if (!imgResult.feedback || imgResult.feedback.includes("unavailable")) setScoringError(true);

    // Listen & type: auto-score (near match)
    let ltCorrect = 0;
    mockContent.listenTypeSentences.forEach((sent, i) => {
      const ans = (listenTypeAnswers[i] ?? "").toLowerCase().trim();
      const correct = sent.toLowerCase().trim();
      const words1 = new Set(ans.split(/\s+/));
      const words2 = correct.split(/\s+/);
      const matches = words2.filter((w) => words1.has(w)).length;
      if (matches / words2.length >= 0.7) ltCorrect++;
    });
    newScores.listen_type = { score: ltCorrect, band: `${ltCorrect}/${mockContent.listenTypeSentences.length}` };

    // Read aloud: AI score
    const raText = Object.entries(transcripts).filter(([k]) => k.startsWith("RA-")).map(([, v]) => v).join(" ");
    if (raText) {
      const raResult = await scoreText("det_speak_about", "Read Aloud passages", raText);
      newScores.read_aloud = raResult;
    } else {
      newScores.read_aloud = { score: 0, band: "N/A", feedback: "No response recorded." };
    }

    // Write About: AI score
    const waText = Object.values(writeResponses).join("\n\n");
    if (waText) {
      const waResult = await scoreText("det_write_about", "Write About images/graphs", waText);
      newScores.write_about = waResult;
    } else {
      newScores.write_about = { score: 0, band: "N/A", feedback: "No response submitted." };
    }

    // Speak About: AI score
    const saText = Object.entries(transcripts).filter(([k]) => k.startsWith("SA-")).map(([, v]) => v).join(" ");
    if (saText) {
      const saResult = await scoreText("det_speak_about", "Speak About topics", saText);
      newScores.speak_about = saResult;
    } else {
      newScores.speak_about = { score: 0, band: "N/A", feedback: "No response recorded." };
    }

    // Estimate DET sub-skills (scale all to 10-160 range approx)
    const literacy = Math.round(70 + grammarCorrect * 10 + (imgResult.score ?? 0) * 3);
    const comprehension = Math.round(70 + ltCorrect * 14);
    const production = Math.round(70 + (newScores.read_aloud.score ?? 0) * 3 + (newScores.speak_about.score ?? 0) * 3);
    const conversation = Math.round(70 + (newScores.speak_about.score ?? 0) * 4);
    const overall = Math.min(140, Math.round((literacy + comprehension + production + conversation) / 4));

    newScores.subskills = { band: `Literacy: ${Math.min(160, literacy)} · Comprehension: ${Math.min(160, comprehension)} · Production: ${Math.min(160, production)} · Conversation: ${Math.min(160, conversation)}` };
    newScores.overall = { score: overall, band: `${overall}/160` };
    newScores.readiness = { band: overall >= 110 ? "Ready for most programmes" : overall >= 90 ? "Approaching readiness" : "Needs more preparation" };

    setScores(newScores);
    setIsScoring(false);
    setStage("results");
  }

  return (
    <AuthGate stage={3} toolName="DET Mock Test" source="det-mock">
    <div className="min-h-screen bg-slate-50 font-sans">
      <Nav stage={stage} />
      <div className="pt-16">
        <AnimatePresence mode="wait">
          {stage === "mock_select" && (
            <MiniMockSelector
              key="mock_select"
              onSelect={(idx) => { setSelectedMock(idx); setStage("landing"); }}
            />
          )}

          {stage === "landing" && <DETLanding key="landing" onBegin={() => setStage("read_describe")} />}

          {stage === "read_describe" && (
            <ReadDescribeSection
              key="read_describe"
              grammarSentences={mockContent.grammarSentences}
              imageDescriptions={mockContent.imageDescriptions}
              grammarAnswers={grammarAnswers}
              setGrammarAnswers={setGrammarAnswers}
              imageResponses={imageResponses}
              setImageResponses={setImageResponses}
              onComplete={() => setStage("listen_type")}
            />
          )}

          {stage === "listen_type" && (
            <ListenTypeSection
              key="listen_type"
              sentences={mockContent.listenTypeSentences}
              answers={listenTypeAnswers}
              setAnswers={setListenTypeAnswers}
              currentIdx={currentListenIdx}
              setCurrentIdx={setCurrentListenIdx}
              isPlaying={isPlayingTTS}
              hasPlayed={hasPlayed}
              onPlay={playTTS}
              onStop={stopTTS}
              onComplete={() => setStage("read_aloud")}
            />
          )}

          {stage === "read_aloud" && (
            <ReadAloudDETSection
              key="read_aloud"
              passages={mockContent.readAloud}
              idx={raIdx}
              setIdx={setRaIdx}
              isRecording={isRecording}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              transcripts={transcripts}
              onComplete={() => setStage("write_about")}
            />
          )}

          {stage === "write_about" && (
            <WriteAboutSection
              key="write_about"
              prompts={mockContent.writeAbout}
              idx={waIdx}
              setIdx={setWaIdx}
              responses={writeResponses}
              setResponses={setWriteResponses}
              onComplete={() => setStage("speak_about")}
            />
          )}

          {stage === "speak_about" && (
            <SpeakAboutSection
              key="speak_about"
              prompts={mockContent.speakAbout}
              idx={speakIdx}
              setIdx={setSpeakIdx}
              countdown={speakCountdown}
              setCountdown={setSpeakCountdown}
              running={speakRunning}
              setRunning={setSpeakRunning}
              isRecording={isRecording}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              transcripts={transcripts}
              onComplete={() => setStage("submitting")}
            />
          )}

          {stage === "submitting" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <h2 className="text-xl font-black text-slate-900">Scoring your test...</h2>
              <p className="text-slate-500 text-sm">Calculating your DET readiness estimate...</p>
            </motion.div>
          )}

          {stage === "results" && !isScoring && (
            <DETResults key="results" scores={scores} scoringError={scoringError} selectedMock={selectedMock} />
          )}
        </AnimatePresence>
      </div>
    </div>
    </AuthGate>
  );
}

// ─── Mock Selector ────────────────────────────────────────────────────────────

function MiniMockSelector({ onSelect }: { onSelect: (idx: number) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 mb-5 text-sm font-bold">
          DET-Style Readiness Practice
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">Choose your mini-mock</h1>
        <p className="text-slate-500 text-sm">3 different content sets available. Each takes approximately 20-25 minutes.</p>
      </div>

      <div className="space-y-4 mb-8">
        {MOCK_SETS.map((mock, i) => (
          <button key={mock.id} onClick={() => onSelect(i)}
            className="w-full text-left bg-white rounded-2xl border-2 border-slate-200 p-5 hover:border-emerald-400 hover:shadow-md transition-all group">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center">{mock.id}</span>
                  <span className="font-extrabold text-slate-900">Mini-Mock {mock.id}</span>
                  {i === 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Start here</span>}
                </div>
                <p className="text-xs text-slate-500 ml-9">
                  {mock.grammarSentences.length} grammar · {mock.listenTypeSentences.length} listen & type · {mock.writeAbout.length} write about · {mock.speakAbout.length} speak about
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <h3 className="text-sm font-extrabold text-slate-800 mb-2">How close is this to the real DET?</h3>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Mirrors all DET task families: grammar, listen & type, read aloud, write about, speak about</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Subskill scoring aligned to Duolingo's public score dimensions (Literacy, Comprehension, Production, Conversation)</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Real DET uses adaptive item selection — this version uses fixed item sets per mock</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Scores are readiness estimates only, not official Duolingo results</li>
        </ul>
        <a href="https://englishtest.duolingo.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors">
          Visit official Duolingo English Test site <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </motion.div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function DETLanding({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 mb-5 text-sm font-bold">
          DET-Style Readiness Practice
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">DET-style Readiness Test</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left mb-6">
          <strong>Disclaimer:</strong> This is original practice content created by eduvianAI. It is not official Duolingo English Test material and is not affiliated with or endorsed by Duolingo.
        </div>
      </div>
      <div className="space-y-3 mb-8">
        {[
          { name: "Read and Describe", desc: "Grammar check · image description", time: "~5 min" },
          { name: "Listen and Type", desc: "Transcribe 5 spoken sentences", time: "~5 min" },
          { name: "Read Aloud", desc: "Read 3 sentences aloud · recorded", time: "~3 min" },
          { name: "Write About the Image", desc: "Describe 3 visual prompts (3-5 sentences each)", time: "~6 min" },
          { name: "Speak About the Topic", desc: "2 open-ended topics · 1.5 min each", time: "~4 min" },
        ].map((s) => (
          <div key={s.name} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-sm">{s.name}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">{s.time}</span>
          </div>
        ))}
      </div>
      <button onClick={onBegin} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5">
        Begin Readiness Test <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Read and Describe ────────────────────────────────────────────────────────

function ReadDescribeSection({ grammarSentences, imageDescriptions, grammarAnswers, setGrammarAnswers, imageResponses, setImageResponses, onComplete }: {
  grammarSentences: typeof MOCK_SETS[0]["grammarSentences"];
  imageDescriptions: typeof MOCK_SETS[0]["imageDescriptions"];
  grammarAnswers: Record<number, boolean | null>;
  setGrammarAnswers: React.Dispatch<React.SetStateAction<Record<number, boolean | null>>>;
  imageResponses: Record<number, string>;
  setImageResponses: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onComplete: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Read and Describe</span>
        <h2 className="text-xl font-black text-slate-900">Grammar + Image Description</h2>
      </div>

      {/* Grammar check */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <p className="text-sm font-bold text-slate-800 mb-4">Is each sentence grammatically correct? Select Yes or No.</p>
        {grammarSentences.map((s, i) => (
          <div key={i} className="mb-4">
            <p className="text-sm text-slate-700 mb-2 bg-slate-50 rounded-lg p-3 border border-slate-100">{s.sentence}</p>
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button key={String(v)} onClick={() => setGrammarAnswers((prev) => ({ ...prev, [i]: v }))}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${grammarAnswers[i] === v ? "border-emerald-400 bg-emerald-50 text-emerald-800" : "border-slate-200 hover:border-slate-300"}`}>
                  {v ? "Correct" : "Incorrect"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Image description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <p className="text-sm font-bold text-slate-800 mb-4">Write 1-2 sentences describing what you see in each image.</p>
        {imageDescriptions.map((item, i) => (
          <div key={i} className="mb-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-2">
              <p className="text-sm text-slate-700">{item.prompt}</p>
            </div>
            <textarea
              value={imageResponses[i] ?? ""}
              onChange={(e) => setImageResponses((prev) => ({ ...prev, [i]: e.target.value }))}
              rows={3}
              placeholder="Write 1-2 sentences about what you see..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-emerald-400 resize-none"
            />
          </div>
        ))}
      </div>

      <button onClick={onComplete} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Continue <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Listen and Type ─────────────────────────────────────────────────────────

function ListenTypeSection({ sentences, answers, setAnswers, currentIdx, setCurrentIdx, isPlaying, hasPlayed, onPlay, onStop, onComplete }: {
  sentences: string[];
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  currentIdx: number;
  setCurrentIdx: (n: number) => void;
  isPlaying: boolean;
  hasPlayed: Record<number, boolean>;
  onPlay: (text: string, idx: number) => void;
  onStop: () => void;
  onComplete: () => void;
}) {
  const isLast = currentIdx === sentences.length - 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Listen and Type</span>
        <h2 className="text-xl font-black text-slate-900">Sentence {currentIdx + 1} of {sentences.length}</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-800">Computer-generated audio. Real DET uses professionally recorded audio.</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 mb-5 flex flex-col items-center gap-4">
        <p className="text-slate-400 text-sm">Press play to hear the sentence, then type what you hear.</p>
        <button onClick={() => isPlaying ? onStop() : onPlay(sentences[currentIdx], currentIdx)}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${isPlaying ? "bg-red-500 text-white" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
          {isPlaying ? <><VolumeX className="w-4 h-4" /> Stop</> : <><Volume2 className="w-4 h-4" /> Play sentence</>}
        </button>
        {hasPlayed[currentIdx] && <p className="text-xs text-slate-500">Sentence played. You can replay if needed.</p>}
      </div>

      <input
        type="text"
        value={answers[currentIdx] ?? ""}
        onChange={(e) => setAnswers((prev) => ({ ...prev, [currentIdx]: e.target.value }))}
        placeholder="Type what you heard..."
        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 mb-6"
      />

      <div className="flex items-center justify-between">
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">
          ← Prev
        </button>
        {isLast ? (
          <button onClick={onComplete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setCurrentIdx(currentIdx + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Read Aloud DET ───────────────────────────────────────────────────────────

function ReadAloudDETSection({ passages, idx, setIdx, isRecording, onStartRecord, onStopRecord, transcripts, onComplete }: {
  passages: string[];
  idx: number;
  setIdx: (n: number) => void;
  isRecording: boolean;
  onStartRecord: (key: string) => void;
  onStopRecord: () => void;
  transcripts: Record<string, string>;
  onComplete: () => void;
}) {
  const isLast = idx === passages.length - 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Read Aloud</span>
        <h2 className="text-xl font-black text-slate-900">Sentence {idx + 1} of {passages.length}</h2>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-5">
        <p className="text-xs font-bold text-emerald-700 mb-2">Read this sentence aloud clearly:</p>
        <p className="text-lg font-semibold text-slate-800">{passages[idx]}</p>
      </div>
      <div className="mb-5">
        <button onClick={() => isRecording ? onStopRecord() : onStartRecord(`RA-${idx}`)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
          {isRecording ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Record</>}
        </button>
      </div>
      {transcripts[`RA-${idx}`] && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 mb-5">
          <p className="text-xs text-slate-500 mb-1">Transcribed:</p>
          <p className="text-sm text-slate-700 italic">{transcripts[`RA-${idx}`]}</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40">← Prev</button>
        {isLast ? (
          <button onClick={onComplete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Write About ──────────────────────────────────────────────────────────────

function WriteAboutSection({ prompts, idx, setIdx, responses, setResponses, onComplete }: {
  prompts: string[];
  idx: number;
  setIdx: (n: number) => void;
  responses: Record<number, string>;
  setResponses: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  onComplete: () => void;
}) {
  const isLast = idx === prompts.length - 1;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Write About the Image</span>
        <h2 className="text-xl font-black text-slate-900">Item {idx + 1} of {prompts.length}</h2>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
        <p className="text-sm text-slate-700">{prompts[idx]}</p>
      </div>
      <textarea
        value={responses[idx] ?? ""}
        onChange={(e) => setResponses((prev) => ({ ...prev, [idx]: e.target.value }))}
        rows={7}
        placeholder="Write 3-5 sentences describing what is shown..."
        className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:border-emerald-400 resize-none mb-6"
      />
      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)} className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40">← Prev</button>
        {isLast ? (
          <button onClick={onComplete} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm hover:shadow-lg transition-all">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all">
            Next Item <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Speak About ──────────────────────────────────────────────────────────────

function SpeakAboutSection({ prompts, idx, setIdx, countdown, setCountdown, running, setRunning, isRecording, onStartRecord, onStopRecord, transcripts, onComplete }: {
  prompts: string[];
  idx: number;
  setIdx: (n: number) => void;
  countdown: number;
  setCountdown: (n: number) => void;
  running: boolean;
  setRunning: (b: boolean) => void;
  isRecording: boolean;
  onStartRecord: (key: string) => void;
  onStopRecord: () => void;
  transcripts: Record<string, string>;
  onComplete: () => void;
}) {
  const isLast = idx === prompts.length - 1;

  const handleNext = () => {
    if (isLast) { onComplete(); }
    else { setIdx(idx + 1); setCountdown(90); setRunning(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Speak About the Topic</span>
        <h2 className="text-xl font-black text-slate-900">Topic {idx + 1} of {prompts.length}</h2>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
        <p className="text-base font-semibold text-slate-800">{prompts[idx]}</p>
      </div>

      <div className="flex items-center gap-4 mb-5">
        {!running && (
          <button onClick={() => { setRunning(true); setCountdown(90); }}
            className="px-4 py-2.5 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-sm hover:bg-amber-200 transition-all">
            Start response timer
          </button>
        )}
        {running && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="font-mono font-bold text-amber-800">{countdown}s</span>
          </div>
        )}
        <button onClick={() => isRecording ? onStopRecord() : onStartRecord(`SA-${idx}`)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}>
          {isRecording ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Record</>}
        </button>
      </div>

      {transcripts[`SA-${idx}`] && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 mb-5">
          <p className="text-xs text-slate-500 mb-1">Your response:</p>
          <p className="text-sm text-slate-700 italic">{transcripts[`SA-${idx}`]}</p>
        </div>
      )}

      <button onClick={handleNext} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        {isLast ? "Submit Test" : "Next Topic"} <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function DETResults({ scores, scoringError, selectedMock }: { scores: Record<string, SectionScore>; scoringError: boolean; selectedMock: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 mb-4 text-sm font-bold">
          <Star className="w-4 h-4" /> Test Complete
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Your DET Readiness Score</h1>
        <p className="text-slate-500 text-sm">Estimated score range: 70-160</p>
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-2xl shadow-emerald-500/40 mt-6 mb-2">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{scores.overall?.score ?? "—"}</p>
            <p className="text-[10px] text-emerald-200 font-bold uppercase">/160</p>
          </div>
        </div>
        {scores.readiness && (
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mt-2 ${
            scores.readiness.band?.includes("Ready") ? "bg-emerald-100 text-emerald-700" :
            scores.readiness.band?.includes("Approaching") ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            {scores.readiness.band}
          </div>
        )}
        {scoringError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Some sections could not be AI-scored.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-slate-900">Sub-skill Estimates</h3>
        </div>
        <p className="text-sm text-slate-600 bg-emerald-50 rounded-xl p-3 mb-4">{scores.subskills?.band ?? "Loading..."}</p>
        {[
          { key: "grammar", label: "Grammar (Read & Describe)" },
          { key: "listen_type", label: "Comprehension (Listen & Type)" },
          { key: "write_about", label: "Literacy (Write About)" },
          { key: "speak_about", label: "Conversation (Speak About)" },
        ].map((s) => {
          const sc = scores[s.key];
          return (
            <div key={s.key} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">{s.label}</span>
                <span className="text-emerald-600 font-bold">{sc?.band ?? "—"}</span>
              </div>
              {sc?.feedback && <p className="text-xs text-slate-500">{sc.feedback}</p>}
            </div>
          );
        })}
      </div>

      {/* Speak About feedback */}
      {scores.speak_about?.strengths && scores.speak_about.strengths.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-extrabold text-slate-900 mb-3">Speaking Feedback</h3>
          <div className="mb-2">
            <p className="text-xs font-bold text-emerald-700 mb-1">Strengths</p>
            <ul className="space-y-1">{scores.speak_about.strengths.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />{s}</li>)}</ul>
          </div>
          {scores.speak_about.improvements && scores.speak_about.improvements.length > 0 && (
            <div>
              <p className="text-xs font-bold text-amber-700 mb-1">Areas to improve</p>
              <ul className="space-y-1">{scores.speak_about.improvements.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5" />{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      {(() => {
        const subScores = [
          { label: "Literacy (Write About)", score: scores.write_about?.score ?? 0 },
          { label: "Comprehension (Listen & Type)", score: scores.listen_type?.score ?? 0 },
          { label: "Conversation (Speak About)", score: scores.speak_about?.score ?? 0 },
        ];
        const weakest = subScores.reduce((a, b) => a.score < b.score ? a : b);
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6">
            <h3 className="font-extrabold text-indigo-900 mb-1 text-sm">Recommended next action</h3>
            <p className="text-sm text-indigo-800">Your weakest area is <strong>{weakest.label}</strong>. Try Mini-Mock {selectedMock < 2 ? selectedMock + 2 : 1} to practise with new content, or focus specifically on this skill type.</p>
          </div>
        );
      })()}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800">
        <strong>Disclaimer:</strong> This is an estimated practice score only. Not an official DET result. For official testing, visit englishtest.duolingo.com.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/english-test-lab/det" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-emerald-200 text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all">
          <RotateCcw className="w-4 h-4" /> Try again
        </Link>
        <Link href="/get-started" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-xl transition-all">
          Check your university shortlist
        </Link>
      </div>
    </motion.div>
  );
}

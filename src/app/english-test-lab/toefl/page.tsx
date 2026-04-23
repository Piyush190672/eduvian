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
  Mic, MicOff, Volume2, VolumeX, ChevronRight, Loader2,
  PenLine, BookOpen, RotateCcw, Star, TrendingUp, AlertCircle, ExternalLink,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// ─── Types ────────────────────────────────────────────────────────────────────

type Stage = "landing" | "reading" | "listening" | "writing_integrated" | "writing_academic" | "speaking_independent" | "submitting" | "results";

interface MCQQuestion { type: "mcq"; question: string; options: string[]; answer: string; }
interface VocabQuestion { type: "vocab"; question: string; options: string[]; answer: string; }
interface InferenceQuestion { type: "inference"; question: string; options: string[]; answer: string; }
type ReadingQuestion = MCQQuestion | VocabQuestion | InferenceQuestion;

interface SectionScore { score?: number; band?: string; feedback?: string; strengths?: string[]; improvements?: string[]; }

// ─── Content ──────────────────────────────────────────────────────────────────

const READING_PASSAGE = {
  title: "The Development of Antibiotic Resistance",
  text: `When Alexander Fleming observed that a mould had contaminated one of his bacterial cultures and cleared the surrounding area of bacteria in 1928, he could not have anticipated that this chance observation would trigger one of the most significant transformations in the history of medicine. The substance produced by the mould, which he named penicillin, became the first of a new class of drugs — antibiotics — capable of killing or inhibiting the growth of bacteria. Within two decades of penicillin's mass production during the Second World War, a previously fatal infection could often be cured within days.

Yet almost from the moment antibiotics entered clinical use, doctors and microbiologists observed an unsettling phenomenon: bacteria were evolving to resist them. This is not surprising from a biological perspective. Natural selection favours organisms that survive environmental pressures, and an antibiotic is precisely such a pressure. Within any large bacterial population, rare individuals may carry genetic mutations that reduce the drug's effectiveness. These individuals survive, reproduce, and pass on their resistance traits. In ideal conditions, bacteria can double their population every twenty minutes, compressing evolutionary timescales that would take millions of years in larger organisms into a matter of weeks.

Resistance mechanisms are remarkably diverse. Some bacteria produce enzymes that chemically modify or destroy the antibiotic. Others alter the target structure within the cell that the antibiotic is designed to bind to, rendering the drug ineffective. Still others develop pumps that expel the antibiotic before it can act. What is particularly alarming is the capacity for horizontal gene transfer — the process by which bacteria can share resistance genes directly with each other, even across species boundaries. This means resistance traits can spread far faster than would be possible through ordinary reproduction.

Human behaviour has accelerated the crisis considerably. The overprescription of antibiotics for viral infections — against which they have no effect — has long been documented in both high-income and lower-income countries. Agricultural use is another significant contributor: approximately seventy percent of all antibiotics consumed globally are given to livestock, primarily to promote growth and prevent disease in dense farming conditions, rather than to treat active infections. This creates a vast reservoir of selection pressure in which resistance genes can develop and spread.

The consequences of widespread antibiotic resistance are not hypothetical. The World Health Organisation estimates that drug-resistant infections currently kill approximately 1.27 million people annually, a figure that researchers project could rise significantly by mid-century if no action is taken. Certain bacterial strains — including some forms of tuberculosis and hospital-acquired infections such as methicillin-resistant Staphylococcus aureus (MRSA) — have already reached a point where few or no effective treatments remain.

Responses to the crisis have been multifaceted. On the research side, there has been renewed interest in phage therapy — using viruses that naturally prey on bacteria — as a potential alternative or complement to antibiotics. Antimicrobial peptides, bacteriophage-derived enzymes, and novel small molecules are all under investigation. On the governance side, international frameworks such as the WHO Global Action Plan on Antimicrobial Resistance seek to coordinate surveillance, stewardship programmes, and incentives for pharmaceutical companies to invest in new antibiotic development, a field that had been largely abandoned because the economics of short-course treatments made it less profitable than drugs for chronic conditions.

Whether these efforts will prove sufficient to address what some researchers call a slow-moving pandemic remains to be seen. What is certain is that the era of reliable antibiotics, once taken for granted, can no longer be assumed.`,
  questions: [
    { type: "mcq", question: "What did Fleming's observation of mould in 1928 lead to?", options: ["A. The discovery of viruses", "B. The development of vaccines", "C. The first antibiotic, penicillin", "D. The invention of surgical procedures"], answer: "C" },
    { type: "mcq", question: "According to the passage, why does antibiotic resistance develop?", options: ["A. Patients stop taking medication too early", "B. Doctors prescribe too high a dosage", "C. Natural selection favours bacteria that survive antibiotic exposure", "D. Antibiotics lose effectiveness when stored incorrectly"], answer: "C" },
    { type: "vocab", question: "The word 'compressing' in paragraph 2 most closely means:", options: ["A. expanding", "B. shortening", "C. reversing", "D. accelerating in reverse"], answer: "B" },
    { type: "mcq", question: "Which resistance mechanism involves removing the antibiotic from the bacterial cell?", options: ["A. Enzyme modification", "B. Target structure alteration", "C. Efflux pumps", "D. Horizontal gene transfer"], answer: "C" },
    { type: "inference", question: "What can be inferred about horizontal gene transfer from the passage?", options: ["A. It only occurs between the same bacterial species", "B. It slows the spread of antibiotic resistance", "C. It makes resistance more difficult to control than ordinary reproduction would", "D. It has no clinical significance"], answer: "C" },
    { type: "mcq", question: "What proportion of global antibiotics is given to livestock, according to the passage?", options: ["A. Approximately 30%", "B. Approximately 50%", "C. Approximately 60%", "D. Approximately 70%"], answer: "D" },
    { type: "mcq", question: "How many deaths from drug-resistant infections does the WHO estimate annually?", options: ["A. 500,000", "B. 1.27 million", "C. 2 million", "D. 3.5 million"], answer: "B" },
    { type: "vocab", question: "The word 'stewardship' in paragraph 6 most likely refers to:", options: ["A. government funding of research", "B. responsible management and oversight", "C. distribution of medicines to hospitals", "D. patient education programmes"], answer: "B" },
    { type: "inference", question: "Why had antibiotic research been 'largely abandoned' by pharmaceutical companies?", options: ["A. There was no clinical need for new antibiotics", "B. Short-course treatments were less profitable than chronic disease drugs", "C. Regulatory requirements made approval too difficult", "D. Existing antibiotics were considered sufficient"], answer: "B" },
    { type: "mcq", question: "What is the author's overall tone in the final paragraph?", options: ["A. Optimistic about future prospects", "B. Dismissive of current research efforts", "C. Cautiously uncertain about whether current efforts are sufficient", "D. Critical of individual patients' behaviour"], answer: "C" },
  ] as ReadingQuestion[],
};

const LISTENING_PASSAGES = [
  {
    title: "Conversation: Campus Library Policy",
    text: `Student: Excuse me, I wanted to ask about the new borrowing policy. I heard that the loan period for regular books has changed.
Librarian: That's right. As of this semester, standard loan periods have been extended from two weeks to three weeks for all registered students. We found that two weeks wasn't sufficient for longer research projects.
Student: That's great news. What about reference books? Can those be borrowed overnight now?
Librarian: Reference books and periodicals are still in-library use only, I'm afraid. They're high-demand items that many students need access to simultaneously. However, we've expanded our digital collection, so many reference texts are now available through the library portal 24 hours a day.
Student: Can I access the portal from off-campus?
Librarian: Absolutely — you just need your student login. We also rolled out a new mobile app last month that lets you search the catalogue, renew items, and receive due date reminders automatically.
Student: What happens if I return a book late?
Librarian: Late fees are twenty-five cents per day per item, but you can avoid them by renewing online before the due date. You can renew up to three times unless another student has placed a hold on the item.
Student: And what if I lose a book?
Librarian: You'll be charged the replacement cost plus a ten-dollar processing fee. We do accept donations of equivalent books in good condition as an alternative to the monetary charge.`,
    questions: [
      { question: "What change was made to the standard loan period?", options: ["A. Reduced from three weeks to two weeks", "B. Extended from two weeks to three weeks", "C. Extended from two weeks to four weeks", "D. Kept the same"], answer: "B" },
      { question: "Why are reference books NOT available for borrowing?", options: ["A. They are too expensive to replace", "B. They are high-demand items needed by many students simultaneously", "C. The library does not have enough copies", "D. University policy prohibits it"], answer: "B" },
      { question: "How can students access digital reference materials off-campus?", options: ["A. By visiting the library in person", "B. Only during library opening hours", "C. Through the library portal with a student login", "D. By requesting a physical copy by email"], answer: "C" },
      { question: "What can the new mobile app NOT do, according to the conversation?", options: ["A. Search the catalogue", "B. Renew borrowed items", "C. Send due date reminders", "D. Reserve study rooms"], answer: "D" },
      { question: "What is the daily late fee per item?", options: ["A. Ten cents", "B. Twenty cents", "C. Twenty-five cents", "D. Fifty cents"], answer: "C" },
    ],
  },
  {
    title: "Lecture: The Psychology of Decision-Making",
    text: `Professor: Good morning. Today we continue our unit on behavioural economics by examining how people actually make decisions — and why those decisions often deviate from what classical economic theory would predict.
Classical models assume that humans are rational agents. They weigh the costs and benefits of each option, calculate the expected utility, and choose accordingly. But decades of research in cognitive psychology have shown that this model is, to put it charitably, incomplete.
One of the most important findings comes from the work of Daniel Kahneman and Amos Tversky, who proposed what they called Prospect Theory. Unlike classical utility theory, Prospect Theory observes that people do not evaluate outcomes in absolute terms. Instead, they evaluate outcomes relative to a reference point — usually the status quo or an expected outcome.
More importantly, Kahneman and Tversky found that losses loom larger than gains of equivalent size. In their experiments, losing fifty dollars caused roughly twice as much psychological distress as gaining fifty dollars caused pleasure. This asymmetry is called loss aversion, and it has profound implications for how people behave in financial markets, healthcare decisions, and even everyday consumer choices.
A second phenomenon relevant to our discussion is the availability heuristic. When people estimate the probability of an event, they tend to base their judgment on how easily examples come to mind. Events that are vivid, recent, or emotionally significant are recalled more easily, leading to systematic overestimation of their likelihood. This is why people often overestimate the risk of plane crashes after a widely reported accident while underestimating the far greater statistical risk of car travel.
In your next seminar, you will apply these two concepts — loss aversion and the availability heuristic — to a series of real-world decision-making scenarios. I'd encourage you to pay particular attention to cases where the two interact.`,
    questions: [
      { question: "What assumption does classical economic theory make about human decision-making?", options: ["A. Humans are primarily emotional decision-makers", "B. Humans are rational agents who maximise expected utility", "C. Humans always prefer certainty over risk", "D. Humans make decisions based on social pressure"], answer: "B" },
      { question: "According to Prospect Theory, how do people evaluate outcomes?", options: ["A. In absolute financial terms", "B. Based on advice from experts", "C. Relative to a reference point such as the status quo", "D. By calculating long-term consequences"], answer: "C" },
      { question: "What does the term 'loss aversion' refer to?", options: ["A. A preference for avoiding all financial risk", "B. The tendency for losses to cause more distress than equivalent gains cause pleasure", "C. The inability to calculate financial losses accurately", "D. Overestimation of potential profits"], answer: "B" },
      { question: "What is the 'availability heuristic'?", options: ["A. Estimating probability based on mathematical models", "B. Judging likelihood based on how easily examples come to mind", "C. Evaluating options based on their cost", "D. Preferring familiar choices over unfamiliar ones"], answer: "B" },
      { question: "Why might people overestimate the risk of plane crashes?", options: ["A. Planes are statistically more dangerous than cars", "B. Government statistics underreport plane accidents", "C. Plane crashes are vivid and emotionally salient events", "D. People travel by plane more than by car"], answer: "C" },
    ],
  },
];

const INTEGRATED_READING = `Urban green spaces — parks, gardens, street trees, green roofs, and riverside plantings — provide a wide range of benefits that justify the public investment required to create and maintain them.

Research consistently shows that access to green space improves mental health outcomes. A landmark study in the UK found that people who lived within 300 metres of a park reported significantly lower rates of anxiety and depression than those who did not. The exposure to natural environments, even in fragmented urban settings, appears to reduce cortisol levels and promote psychological restoration.

Green infrastructure also delivers measurable environmental benefits. Trees absorb particulate matter and carbon dioxide, reducing urban air pollution. Permeable surfaces and wetland plantings manage storm water run-off, reducing the burden on drainage infrastructure. During heat waves, urban green spaces provide cooling effects that can reduce energy demand for air conditioning by as much as twenty percent in adjacent buildings.

From an economic perspective, properties near parks consistently command higher market values, and well-designed public green spaces have been shown to stimulate local commercial activity and tourism.`;

const INTEGRATED_LECTURE = `Today I want to challenge some of the assumptions in the reading you've just examined. While the benefits of urban green spaces sound compelling, the evidence is more complicated than the passage suggests.

On the mental health claims: yes, some studies show associations between green space access and wellbeing, but the causal direction is far from clear. Wealthier areas tend to have both better green space and better health outcomes independently — the green space may not be the cause. Many of the studies the passage references are correlational, not controlled experiments.

The environmental benefits are real but frequently overstated. A mature tree does absorb carbon dioxide, but the carbon footprint of installing, irrigating, and maintaining urban green infrastructure is often not factored into these calculations. In some cases, the net environmental benefit over a twenty-year period is marginal.

The economic argument is perhaps the weakest of all. Property value increases near parks are well documented, but this effect primarily benefits existing property owners — it can actually reduce affordable housing access by driving up local rents. This is a redistribution of value, not a creation of it.

So while I'm not arguing against green spaces, I am arguing that the case for them needs to be made more carefully, and that policy decisions should not rely on oversimplified cost-benefit claims.`;

const ACADEMIC_DISCUSSION_PROMPT = `Professor Zhang writes: "Some researchers argue that governments should invest heavily in space exploration programmes, while others believe the funds would be better spent solving pressing problems on Earth — poverty, climate change, healthcare. What is your view on this debate? Share your perspective and respond to what your classmates might think."

Write at least 100 words sharing your position with specific reasons.`;

const SPEAKING_PROMPT = `Do you agree or disagree with this statement: It is better to have a few close friends than many acquaintances. Use specific reasons and examples to support your answer.

You have 15 seconds to prepare, then 45 seconds to speak.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function wordCount(text: string) {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function useCountdown(initialSeconds: number, running: boolean, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => { expiredRef.current = false; setSeconds(initialSeconds); }, [initialSeconds]);

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
  const stages: Stage[] = ["landing", "reading", "listening", "writing_integrated", "writing_academic", "speaking_independent", "submitting", "results"];
  const progressPct = Math.round((stages.indexOf(stage) / (stages.length - 1)) * 100);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg">
      <div className="flex items-center justify-between px-8 py-0">
        <Link href="/english-test-lab" className="flex items-center gap-3 py-4">
          <EduvianLogoMark size={36} />
          <div>
            <span className="font-extrabold text-base text-white">TOEFL iBT-Style</span>
            <p className="text-[10px] text-amber-300 leading-none">Mock Test · eduvianAI</p>
          </div>
        </Link>
        <Link href="/english-test-lab" className="text-slate-400 hover:text-white text-sm transition-colors py-4">← Back to Lab</Link>
      </div>
      {stage !== "landing" && stage !== "results" && (
        <div className="h-1 bg-slate-800">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: `${progressPct}%` }} />
        </div>
      )}
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TOEFLPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>({});
  const [readingTimerRunning, setReadingTimerRunning] = useState(false);
  const [listeningIdx, setListeningIdx] = useState(0);
  const [listeningAnswers, setListeningAnswers] = useState<Record<string, string>>({});
  const [isPlayingPassage, setIsPlayingPassage] = useState(false);
  const [hasPlayedPassage, setHasPlayedPassage] = useState<Record<number, boolean>>({});
  const [integratedText, setIntegratedText] = useState("");
  const [isPlayingLecture, setIsPlayingLecture] = useState(false);
  const [academicText, setAcademicText] = useState("");
  const [academicTimerRunning, setAcademicTimerRunning] = useState(false);
  const [speakTranscript, setSpeakTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(15);
  const [prepRunning, setPrepRunning] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(45);
  const [recordRunning, setRecordRunning] = useState(false);
  const [scores, setScores] = useState<Record<string, SectionScore>>({});
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionShim | null>(null);

  const handleReadingExpire = useCallback(() => { setReadingTimerRunning(false); setStage("listening"); }, []);
  const handleAcademicExpire = useCallback(() => { setAcademicTimerRunning(false); setStage("speaking_independent"); }, []);

  const readingTimer = useCountdown(18 * 60, readingTimerRunning, handleReadingExpire);
  const academicTimer = useCountdown(10 * 60, academicTimerRunning, handleAcademicExpire);

  useEffect(() => {
    if (stage === "submitting") { handleSubmit(); }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prep countdown
  useEffect(() => {
    if (!prepRunning) return;
    if (prepSeconds <= 0) { setPrepRunning(false); return; }
    const id = setTimeout(() => setPrepSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [prepRunning, prepSeconds]);

  // Record countdown
  useEffect(() => {
    if (!recordRunning) return;
    if (recordSeconds <= 0) { setRecordRunning(false); stopRecording(); return; }
    const id = setTimeout(() => setRecordSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [recordRunning, recordSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  const playLecture = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(INTEGRATED_LECTURE);
    u.rate = 0.9;
    u.onend = () => setIsPlayingLecture(false);
    u.onerror = () => setIsPlayingLecture(false);
    setIsPlayingLecture(true);
    window.speechSynthesis.speak(u);
  }, []);

  const stopLecture = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlayingLecture(false);
  }, []);

  const playPassage = useCallback((idx: number) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(LISTENING_PASSAGES[idx].text);
    u.rate = 0.85;
    u.onend = () => setIsPlayingPassage(false);
    u.onerror = () => setIsPlayingPassage(false);
    setIsPlayingPassage(true);
    setHasPlayedPassage((prev) => ({ ...prev, [idx]: true }));
    window.speechSynthesis.speak(u);
  }, []);

  const stopPassage = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsPlayingPassage(false);
  }, []);

  const startRecording = useCallback(() => {
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
      setSpeakTranscript(final + interim);
    };
    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);
    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
    setRecordRunning(true);
    setRecordSeconds(45);
  }, []);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setRecordRunning(false);
  }, []);

  async function handleSubmit() {
    setIsScoring(true);
    setScoringError(false);
    const newScores: Record<string, SectionScore> = {};

    // Reading: auto-score
    let correct = 0;
    READING_PASSAGE.questions.forEach((q, i) => {
      const ans = (readingAnswers[i] ?? "").toUpperCase();
      const expected = (q as MCQQuestion).answer.charAt(0).toUpperCase();
      if (ans === expected) correct++;
    });
    const readingScaled = Math.round((correct / READING_PASSAGE.questions.length) * 30);
    newScores.reading = { score: readingScaled, band: `${readingScaled}/30`, feedback: `${correct}/${READING_PASSAGE.questions.length} questions correct.` };

    // Listening: auto-score
    let listenCorrect = 0;
    let listenTotal = 0;
    LISTENING_PASSAGES.forEach((passage, pi) => {
      passage.questions.forEach((q, qi) => {
        listenTotal++;
        const ans = (listeningAnswers[`L${pi}-${qi}`] ?? "").toUpperCase();
        if (ans === q.answer.charAt(0).toUpperCase()) listenCorrect++;
      });
    });
    const listeningScaled = Math.round((listenCorrect / listenTotal) * 30);
    newScores.listening = { score: listeningScaled, band: `${listeningScaled}/30`, feedback: `${listenCorrect}/${listenTotal} questions correct.` };

    // Integrated writing
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "TOEFL", section: "Writing", taskType: "toefl_writing_integrated", prompt: "Integrated: reading passage + lecture on urban green spaces", response: integratedText }),
      });
      if (res.ok) {
        const d = await res.json();
        newScores.writing_integrated = { score: d.score, band: `${d.score}/30`, feedback: d.feedback, strengths: d.strengths, improvements: d.improvements };
      } else throw new Error();
    } catch { newScores.writing_integrated = { score: 0, band: "N/A", feedback: "Scoring unavailable.", strengths: [], improvements: [] }; setScoringError(true); }

    // Academic writing
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "TOEFL", section: "Writing", taskType: "toefl_writing_academic", prompt: ACADEMIC_DISCUSSION_PROMPT, response: academicText }),
      });
      if (res.ok) {
        const d = await res.json();
        newScores.writing_academic = { score: d.score, band: `${d.score}/30`, feedback: d.feedback, strengths: d.strengths, improvements: d.improvements };
      } else throw new Error();
    } catch { newScores.writing_academic = { score: 0, band: "N/A", feedback: "Scoring unavailable.", strengths: [], improvements: [] }; setScoringError(true); }

    // Speaking
    try {
      const res = await fetch("/api/score-english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam: "TOEFL", section: "Speaking", taskType: "toefl_speaking_independent", prompt: SPEAKING_PROMPT, response: speakTranscript }),
      });
      if (res.ok) {
        const d = await res.json();
        newScores.speaking = { score: d.score, band: `${d.score}/30`, feedback: d.feedback, strengths: d.strengths, improvements: d.improvements };
      } else throw new Error();
    } catch { newScores.speaking = { score: 0, band: "N/A", feedback: "Scoring unavailable.", strengths: [], improvements: [] }; setScoringError(true); }

    // Overall (0-120)
    const writing = Math.round(((newScores.writing_integrated.score ?? 0) + (newScores.writing_academic.score ?? 0)) / 2);
    const total = Math.min(120, readingScaled + listeningScaled + writing + (newScores.speaking.score ?? 0));
    newScores.writing_combined = { score: writing, band: `${writing}/30` };
    newScores.overall = { score: total, band: `${total}/120` };

    setScores(newScores);
    setIsScoring(false);
    setStage("results");
  }

  return (
    <AuthGate stage={3} toolName="TOEFL Mock Test" source="toefl-mock">
    <div className="min-h-screen bg-slate-50 font-sans">
      <Nav stage={stage} />
      <div className="pt-16">
        <AnimatePresence mode="wait">
          {stage === "landing" && <TOEFLLanding key="landing" onBegin={() => { setStage("reading"); setReadingTimerRunning(true); }} />}

          {stage === "reading" && (
            <TOEFLReadingSection
              key="reading"
              answers={readingAnswers}
              setAnswers={setReadingAnswers}
              timer={readingTimer}
              onComplete={() => { setReadingTimerRunning(false); setStage("listening"); }}
            />
          )}

          {stage === "listening" && (
            <TOEFLListeningSection
              key="listening"
              idx={listeningIdx}
              setIdx={setListeningIdx}
              answers={listeningAnswers}
              setAnswers={setListeningAnswers}
              isPlaying={isPlayingPassage}
              hasPlayed={hasPlayedPassage}
              onPlay={playPassage}
              onStop={stopPassage}
              onComplete={() => setStage("writing_integrated")}
            />
          )}

          {stage === "writing_integrated" && (
            <IntegratedWritingSection
              key="writing_integrated"
              text={integratedText}
              setText={setIntegratedText}
              isPlayingLecture={isPlayingLecture}
              onPlayLecture={playLecture}
              onStopLecture={stopLecture}
              onComplete={() => { setStage("writing_academic"); setAcademicTimerRunning(true); }}
            />
          )}

          {stage === "writing_academic" && (
            <AcademicDiscussionSection
              key="writing_academic"
              text={academicText}
              setText={setAcademicText}
              timer={academicTimer}
              onComplete={() => { setAcademicTimerRunning(false); setStage("speaking_independent"); }}
            />
          )}

          {stage === "speaking_independent" && (
            <IndependentSpeakingSection
              key="speaking_independent"
              transcript={speakTranscript}
              isRecording={isRecording}
              prepSeconds={prepSeconds}
              prepRunning={prepRunning}
              setPrepRunning={setPrepRunning}
              recordSeconds={recordSeconds}
              recordRunning={recordRunning}
              onStartRecord={startRecording}
              onStopRecord={stopRecording}
              onComplete={() => setStage("submitting")}
            />
          )}

          {stage === "submitting" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
              <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
              <h2 className="text-xl font-black text-slate-900">Scoring your test...</h2>
              <p className="text-slate-500 text-sm">AI is evaluating your writing and speaking tasks.</p>
            </motion.div>
          )}

          {stage === "results" && !isScoring && (
            <TOEFLResults key="results" scores={scores} scoringError={scoringError} />
          )}
        </AnimatePresence>
      </div>
    </div>
    </AuthGate>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function TOEFLLanding({ onBegin }: { onBegin: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 border border-amber-200 mb-5 text-sm font-bold">
          TOEFL iBT-Style Practice
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-3">TOEFL iBT-style Mock Test</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 text-left mb-6">
          <strong>Disclaimer:</strong> This is original practice content created by eduvianAI. It is not official TOEFL material and is not affiliated with or endorsed by ETS (Educational Testing Service).
        </div>
      </div>
      <div className="space-y-3 mb-8">
        {[
          { name: "Reading", desc: "1 academic passage · 10 questions", time: "18 min" },
          { name: "Writing — Integrated", desc: "Read + listen + write summary", time: "20 min" },
          { name: "Writing — Academic Discussion", desc: "Forum post response · 100+ words", time: "10 min" },
          { name: "Speaking — Independent", desc: "15s prep · 45s recorded response", time: "~2 min" },
        ].map((s) => (
          <div key={s.name} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900 text-sm">{s.name}</p>
              <p className="text-xs text-slate-500">{s.desc}</p>
            </div>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">{s.time}</span>
          </div>
        ))}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-extrabold text-slate-800 mb-2">How close is this to the real TOEFL iBT?</h3>
        <ul className="space-y-1.5 text-xs text-slate-600">
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Same 4-section structure: Reading, Listening, Writing, Speaking</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Similar task types and timings based on ETS public documentation</li>
          <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />Writing and Speaking scored against ETS public rubric dimensions</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Audio is computer-generated (real test uses professional recordings)</li>
          <li className="flex items-start gap-2"><AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />Scores are estimates only — not official ETS results</li>
        </ul>
        <a href="https://www.ets.org/toefl" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors">
          Visit official ETS TOEFL site <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <button onClick={onBegin} className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-base flex items-center justify-center gap-2 hover:shadow-xl hover:shadow-amber-500/30 transition-all hover:-translate-y-0.5">
        Begin Mock <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── TOEFL Reading ────────────────────────────────────────────────────────────

function TOEFLReadingSection({ answers, setAnswers, timer, onComplete }: {
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  timer: { formatted: string; seconds: number };
  onComplete: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Reading</span>
          <h2 className="text-xl font-black text-slate-900">{READING_PASSAGE.title}</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 300 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto max-h-[70vh]">
          <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{READING_PASSAGE.text}</div>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[70vh]">
          {READING_PASSAGE.questions.map((q, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wide">
                {q.type === "vocab" ? "Vocabulary in Context" : q.type === "inference" ? "Inference" : "Factual"}
              </p>
              <p className="text-sm font-semibold text-slate-800 mb-3">{q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt) => (
                  <button key={opt} onClick={() => setAnswers((prev) => ({ ...prev, [i]: opt.charAt(0) }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${answers[i] === opt.charAt(0) ? "border-amber-400 bg-amber-50 font-semibold text-amber-800" : "border-slate-200 hover:border-slate-300"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <button onClick={onComplete} className="mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Submit Reading <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Integrated Writing ───────────────────────────────────────────────────────

function IntegratedWritingSection({ text, setText, isPlayingLecture, onPlayLecture, onStopLecture, onComplete }: {
  text: string;
  setText: (t: string) => void;
  isPlayingLecture: boolean;
  onPlayLecture: () => void;
  onStopLecture: () => void;
  onComplete: () => void;
}) {
  const [view, setView] = useState<"reading" | "writing">("reading");
  const wc = wordCount(text);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Writing — Integrated</span>
        <h2 className="text-xl font-black text-slate-900">Summarise the lecture points</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 text-xs text-amber-800">
        <strong>Task:</strong> Read the passage below, then listen to the lecture. Write 150-225 words summarising the points made in the lecture and explaining how they cast doubt on the reading.
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setView("reading")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "reading" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
          <BookOpen className="w-4 h-4 inline mr-1.5" />Reading Passage
        </button>
        <button onClick={() => setView("writing")} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "writing" ? "bg-amber-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"}`}>
          <PenLine className="w-4 h-4 inline mr-1.5" />Your Response
        </button>
      </div>

      {view === "reading" && (
        <div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5 max-h-64 overflow-y-auto">
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{INTEGRATED_READING}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between mb-5">
            <div>
              <p className="text-white text-sm font-semibold">Lecture: Counter-argument to the reading</p>
              <p className="text-slate-400 text-xs">Computer-generated audio. Real TOEFL uses professionally recorded lectures.</p>
            </div>
            <button onClick={() => isPlayingLecture ? onStopLecture() : onPlayLecture()}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${isPlayingLecture ? "bg-red-500 text-white" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
              {isPlayingLecture ? <><VolumeX className="w-4 h-4" /> Stop</> : <><Volume2 className="w-4 h-4" /> Play Lecture</>}
            </button>
          </div>
          <button onClick={() => setView("writing")} className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-all">
            Start Writing <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {view === "writing" && (
        <div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={16}
            placeholder="Summarise the lecture points and explain how they cast doubt on the reading. Write 150-225 words..."
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:border-amber-400 resize-none mb-2"
          />
          <div className="flex justify-between text-xs text-slate-500 mb-4">
            <span>Words: <strong className={wc >= 150 && wc <= 225 ? "text-emerald-600" : "text-amber-600"}>{wc}</strong> / 150-225</span>
          </div>
          <button onClick={onComplete} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
            Submit Integrated Writing <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Academic Discussion ──────────────────────────────────────────────────────

function AcademicDiscussionSection({ text, setText, timer, onComplete }: {
  text: string;
  setText: (t: string) => void;
  timer: { formatted: string; seconds: number };
  onComplete: () => void;
}) {
  const wc = wordCount(text);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Writing — Academic Discussion</span>
          <h2 className="text-xl font-black text-slate-900">Forum Post Response</h2>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-sm ${timer.seconds < 120 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
          <Clock className="w-4 h-4" />
          {timer.formatted}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-700 font-bold text-xs">Prof</span>
          </div>
          <span className="font-bold text-slate-800 text-sm">Professor Zhang</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">{ACADEMIC_DISCUSSION_PROMPT.split("\n\n").slice(0, -1).join("\n\n")}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        placeholder="Write your response (minimum 100 words)..."
        className="w-full rounded-2xl border border-slate-200 p-4 text-sm focus:outline-none focus:border-amber-400 resize-none mb-2"
      />
      <div className="flex justify-between text-xs text-slate-500 mb-4">
        <span>Words: <strong className={wc >= 100 ? "text-emerald-600" : "text-amber-600"}>{wc}</strong> / 100 minimum</span>
      </div>
      <button onClick={onComplete} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Submit Discussion <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── Independent Speaking ─────────────────────────────────────────────────────

function IndependentSpeakingSection({ transcript, isRecording, prepSeconds, prepRunning, setPrepRunning, recordSeconds, recordRunning, onStartRecord, onStopRecord, onComplete }: {
  transcript: string;
  isRecording: boolean;
  prepSeconds: number;
  prepRunning: boolean;
  setPrepRunning: (b: boolean) => void;
  recordSeconds: number;
  recordRunning: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onComplete: () => void;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6">
        <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Speaking — Independent</span>
        <h2 className="text-xl font-black text-slate-900">Share your opinion</h2>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5">
        <p className="text-sm text-slate-800 leading-relaxed">{SPEAKING_PROMPT}</p>
      </div>

      <div className="space-y-4 mb-6">
        {!prepRunning && !isRecording && !transcript && (
          <button onClick={() => setPrepRunning(true)}
            className="w-full py-3 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 font-semibold text-sm hover:bg-amber-200 transition-all">
            Start 15-second preparation
          </button>
        )}

        {prepRunning && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-xs text-amber-700 font-bold">Preparation time</p>
            <p className="text-3xl font-black text-amber-800 font-mono">{prepSeconds}s</p>
          </div>
        )}

        {(prepSeconds <= 0 || transcript) && (
          <div className="flex items-center gap-3">
            <button onClick={() => isRecording ? onStopRecord() : onStartRecord()}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-amber-600 text-white hover:bg-amber-700"}`}>
              {isRecording ? <><MicOff className="w-4 h-4" /> Stop ({recordSeconds}s left)</> : <><Mic className="w-4 h-4" /> Record (45 seconds)</>}
            </button>
          </div>
        )}
      </div>

      {transcript && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5">
          <p className="text-xs text-slate-500 mb-1 font-bold">Your response (transcribed):</p>
          <p className="text-sm text-slate-700 italic">{transcript}</p>
        </div>
      )}

      <button onClick={onComplete} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all">
        Submit Test <ChevronRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

// ─── TOEFL Listening ──────────────────────────────────────────────────────────

function TOEFLListeningSection({ idx, setIdx, answers, setAnswers, isPlaying, hasPlayed, onPlay, onStop, onComplete }: {
  idx: number;
  setIdx: (n: number) => void;
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isPlaying: boolean;
  hasPlayed: Record<number, boolean>;
  onPlay: (idx: number) => void;
  onStop: () => void;
  onComplete: () => void;
}) {
  const passage = LISTENING_PASSAGES[idx];
  const isLast = idx === LISTENING_PASSAGES.length - 1;
  const allAnswered = passage.questions.every((_, qi) => answers[`L${idx}-${qi}`]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Listening · Passage {idx + 1} of {LISTENING_PASSAGES.length}</span>
          <h2 className="text-xl font-black text-slate-900">{passage.title}</h2>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex items-start gap-2 text-xs text-amber-800">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        Computer-generated audio. Real TOEFL uses professionally recorded conversations and lectures.
      </div>

      <div className="bg-slate-800 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-white text-sm font-semibold mb-1">{passage.title}</p>
          <p className="text-slate-400 text-xs">Listen carefully, then answer the questions below. You may play the audio once.</p>
        </div>
        <button onClick={() => isPlaying ? onStop() : onPlay(idx)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex-shrink-0 ml-4 ${isPlaying ? "bg-red-500 text-white" : "bg-amber-500 text-white hover:bg-amber-600"}`}>
          {isPlaying ? <><VolumeX className="w-4 h-4" /> Stop</> : <><Volume2 className="w-4 h-4" /> {hasPlayed[idx] ? "Replay" : "Play Audio"}</>}
        </button>
      </div>

      {hasPlayed[idx] && (
        <div className="space-y-4 mb-8">
          {passage.questions.map((q, qi) => (
            <div key={qi} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800 mb-3">{qi + 1}. {q.question}</p>
              <div className="space-y-1.5">
                {q.options.map((opt) => (
                  <button key={opt} onClick={() => setAnswers((prev) => ({ ...prev, [`L${idx}-${qi}`]: opt.charAt(0) }))}
                    className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition-all ${answers[`L${idx}-${qi}`] === opt.charAt(0) ? "border-amber-400 bg-amber-50 font-semibold text-amber-800" : "border-slate-200 hover:border-slate-300"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasPlayed[idx] && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center mb-8">
          <p className="text-slate-500 text-sm">Play the audio above to unlock the questions.</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button disabled={idx === 0} onClick={() => setIdx(idx - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold disabled:opacity-40 hover:bg-slate-50">
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>
        {isLast ? (
          <button onClick={onComplete} disabled={!allAnswered}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50">
            Continue to Writing <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => setIdx(idx + 1)} disabled={!allAnswered}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-all disabled:opacity-50">
            Next Passage <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function TOEFLResults({ scores, scoringError }: { scores: Record<string, SectionScore>; scoringError: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 border border-amber-200 mb-4 text-sm font-bold">
          <Star className="w-4 h-4" /> Test Complete
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Your TOEFL Results</h1>
        <p className="text-slate-500 text-sm">Estimated scaled score (0-120)</p>
        <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 shadow-2xl shadow-amber-500/40 mt-6 mb-2">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{scores.overall?.score ?? "—"}</p>
            <p className="text-[10px] text-amber-200 font-bold uppercase">/120</p>
          </div>
        </div>
        {scoringError && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 inline mr-1" />
            Some sections could not be AI-scored.
          </div>
        )}
      </div>

      {/* Section scores */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {[
          { key: "listening", label: "Listening", color: "bg-amber-400" },
          { key: "reading", label: "Reading", color: "bg-amber-500" },
          { key: "writing_integrated", label: "Writing (Integrated)", color: "bg-orange-500" },
          { key: "writing_academic", label: "Writing (Academic)", color: "bg-amber-600" },
          { key: "speaking", label: "Speaking", color: "bg-orange-600" },
        ].map((s) => {
          const sc = scores[s.key];
          const pct = sc?.score ? Math.min(100, (sc.score / 30) * 100) : 0;
          return (
            <div key={s.key} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-slate-900 text-sm">{s.label}</p>
                <p className="text-2xl font-black text-slate-900">{sc?.band ?? "—"}</p>
              </div>
              <div className="h-2 bg-slate-100 rounded-full mb-2">
                <div className={`h-2 rounded-full ${s.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
              </div>
              {sc?.feedback && <p className="text-xs text-slate-500 mt-2">{sc.feedback}</p>}
            </div>
          );
        })}
      </div>

      {/* Writing feedback */}
      {[
        { key: "writing_integrated", label: "Integrated Writing Feedback" },
        { key: "writing_academic", label: "Academic Discussion Feedback" },
        { key: "speaking", label: "Speaking Feedback" },
      ].map(({ key, label }) => {
        const sc = scores[key];
        if (!sc || (!sc.strengths?.length && !sc.improvements?.length)) return null;
        return (
          <div key={key} className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-slate-900">{label}</h3>
            </div>
            {sc.feedback && <p className="text-sm text-slate-600 mb-3">{sc.feedback}</p>}
            {sc.strengths && sc.strengths.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-bold text-emerald-700 mb-1">Strengths</p>
                <ul className="space-y-1">{sc.strengths.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5" />{s}</li>)}</ul>
              </div>
            )}
            {sc.improvements && sc.improvements.length > 0 && (
              <div>
                <p className="text-xs font-bold text-amber-700 mb-1">Areas to improve</p>
                <ul className="space-y-1">{sc.improvements.map((s, i) => <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5"><AlertTriangle className="w-3 h-3 text-amber-500 mt-0.5" />{s}</li>)}</ul>
              </div>
            )}
          </div>
        );
      })}

      {/* Recommended next action */}
      {(() => {
        const sectionScores = [
          { label: "Reading", score: scores.reading?.score ?? 0 },
          { label: "Listening", score: scores.listening?.score ?? 0 },
          { label: "Writing", score: scores.writing_combined?.score ?? Math.round(((scores.writing_integrated?.score ?? 0) + (scores.writing_academic?.score ?? 0)) / 2) },
          { label: "Speaking", score: scores.speaking?.score ?? 0 },
        ];
        const weakest = sectionScores.reduce((a, b) => a.score < b.score ? a : b);
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 mb-6">
            <h3 className="font-extrabold text-indigo-900 mb-1 text-sm">Recommended next action</h3>
            <p className="text-sm text-indigo-800">Your weakest section is <strong>{weakest.label}</strong> ({weakest.score}/30). Focus your next practice session on {weakest.label.toLowerCase()} tasks before retaking the full mock.</p>
          </div>
        );
      })()}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-xs text-amber-800">
        <strong>Disclaimer:</strong> These are estimated practice scores only. Not an official TOEFL iBT result. For official testing, visit ets.org/toefl.
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/english-test-lab/toefl" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-amber-200 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-all">
          <RotateCcw className="w-4 h-4" /> Try again
        </Link>
        <Link href="/get-started" className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-xl transition-all">
          Check your university shortlist
        </Link>
      </div>
    </motion.div>
  );
}

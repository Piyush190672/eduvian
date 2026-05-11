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
interface SpeechRecognitionErrorEventShim extends Event {
  readonly error: string;
  readonly message?: string;
}
interface SpeechRecognitionShim extends EventTarget {
  continuous: boolean; interimResults: boolean; lang: string;
  start(): void; stop(): void; abort(): void;
  onresult: ((event: SpeechRecognitionEventShim) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventShim) => void) | null;
  onend: (() => void) | null;
  onstart?: (() => void) | null;
  onaudiostart?: (() => void) | null;
}
interface SpeechRecognitionCtor { new(): SpeechRecognitionShim; }

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AU_GUIDELINES, UK_GUIDELINES, USA_GUIDELINES } from "@/data/interview-guidelines";
import {
  Mic, Volume2, VolumeX, ChevronRight, RotateCcw, CheckCircle2,
  ArrowLeft, Globe2, Sparkles, Trophy, Clock, MessageSquare,
  BookOpen, Briefcase, MapPin, Building2, HelpCircle, ListChecks,
  ThumbsUp, AlertCircle, Loader2, User, DollarSign, Users, Shield, X,
} from "lucide-react";
import Link from "next/link";
import AuthGate from "@/components/AuthGate";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Country = "australia" | "uk" | "usa";

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
  | "name" | "uk_confirm" | "category" | "usa_section"
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

// ─── USA — 12 sections, 60+ approved questions (F-1 visa consular interview) ──

const USA_SECTIONS: QuestionCategory[] = [
  {
    id: "usa_why",
    label: "Why United States of America",
    objective: "Assess whether studying in the USA is a genuine choice and establish non-immigrant intent.",
    icon: <MapPin className="w-4 h-4" />,
    questions: [
      "Why do you wish to study in USA and not in India?",
      "Why did you select US for higher studies? Isn't this course offered by any university or colleges in India?",
      "What is the purpose of your trip?",
      "Have you ever been to US?",
    ],
  },
  {
    id: "usa_university",
    label: "About Institute / University / College",
    objective: "Verify the student's knowledge of the chosen institution and why it was selected.",
    icon: <Building2 className="w-4 h-4" />,
    questions: [
      "Which US University are you planning to go to?",
      "Can you tell me some details about your university?",
      "Why have you chosen this specific university?",
      "Can you tell me the location of the university/college?",
      "Why did you choose this institute and how did you find about it?",
      "How many US universities did you apply for? (Both admits and rejects)",
      "Can you mention the names of some professors?",
      "Did you receive any scholarships?",
    ],
  },
  {
    id: "usa_course",
    label: "About Your Course",
    objective: "Assess course knowledge, relevance to prior studies, duration, and cost awareness.",
    icon: <BookOpen className="w-4 h-4" />,
    questions: [
      "What course are you going for?",
      "Why did you select this course? Is it relevant to your previous studies?",
      "Why are you taking this course?",
      "What is the course structure & contents?",
      "Why don't you do this course in your country?",
      "How long will your studies last?",
      "What is the scope of your course?",
      "What do you plan to study at the university?",
      "What benefit will this course bring to you?",
      "What is the course commencement date?",
      "What will be the total cost per year?",
      "Where will you stay in US?",
    ],
  },
  {
    id: "usa_academic",
    label: "Your Academic Background",
    objective: "Evaluate academic history, grades, subjects, and how they lead to the proposed course.",
    icon: <User className="w-4 h-4" />,
    questions: [
      "Where did you do your last course of study?",
      "What is your specialization?",
      "What is your High School, Degree or Master's percentage or grade?",
      "What are your subjects in last course of study (High School, Degree or Master's)?",
    ],
  },
  {
    id: "usa_job",
    label: "Current Job / Business",
    objective: "Understand current employment and why the student is leaving to study abroad.",
    icon: <Briefcase className="w-4 h-4" />,
    questions: [
      "Show your Experience Certificate. (if applicable)",
      "Why are you leaving your current job to study?",
    ],
  },
  {
    id: "usa_tests",
    label: "TOEFL / IELTS / GRE / GMAT / SAT",
    objective: "Verify English proficiency and standardised test scores are sufficient for the programme.",
    icon: <ListChecks className="w-4 h-4" />,
    questions: [
      "Could you please show me your TOEFL/IELTS scorecard?",
      "Why are your TOEFL/IELTS scores low?",
    ],
  },
  {
    id: "usa_family",
    label: "About Your Family",
    objective: "Understand family background and establish home-country ties.",
    icon: <Users className="w-4 h-4" />,
    questions: [
      "What does your father do?",
      "How many brothers and sisters do you have?",
      "What is your father's annual income?",
      "Do you have a brother, sister, or any other relative already at this university?",
      "Where did your brother/parents complete their studies?",
    ],
  },
  {
    id: "usa_finance",
    label: "Sponsor and Financial Detail",
    objective: "Verify that sufficient, legitimate funding is available for the full duration of study.",
    icon: <DollarSign className="w-4 h-4" />,
    questions: [
      "Have you got any loans?",
      "What are the sources of income of your sponsor?",
      "What proof do you have that your sponsor can support your studies?",
      "Who is paying for your education and what is his/her income?",
      "Who is sponsoring you?",
      "Could you please show me the passbook or bank statements?",
      "How many people are dependents of your sponsor?",
      "Why is he sponsoring you? (if not father)",
      "How much money is available for your stay in US?",
      "How will you finance your education funds for the full duration?",
    ],
  },
  {
    id: "usa_future",
    label: "Future Plans (Career Prospects)",
    objective: "Establish return intent, career roadmap, and non-immigrant intent after graduation.",
    icon: <Sparkles className="w-4 h-4" />,
    questions: [
      "What are your plans after completing your studies?",
      "Have you researched your career prospects?",
      "What will you do after completing your degree?",
      "What will you do after coming back home?",
      "How much money can you earn after your completion of studies?",
      "Do you intend to work in US during or after completion of your studies?",
      "How can you prove that you will come back after finishing your studies?",
    ],
  },
  {
    id: "usa_relatives",
    label: "Relatives in US",
    objective: "Check for US-based relatives and ensure home-country ties remain primary.",
    icon: <Globe2 className="w-4 h-4" />,
    questions: [
      "Do you have any relatives in the US?",
      "Do you know anyone (in USA) in your University?",
    ],
  },
  {
    id: "usa_visa",
    label: "Visa or Refusal",
    objective: "Test the student's ability to make a compelling case for the visa and handle rejection.",
    icon: <Shield className="w-4 h-4" />,
    questions: [
      "Why should I grant you a U.S. Visa?",
      "What will you do if your US Visa is rejected?",
    ],
  },
  {
    id: "usa_misc",
    label: "Miscellaneous",
    objective: "Cover travel history, semester breaks, and overall preparedness for life in the US.",
    icon: <HelpCircle className="w-4 h-4" />,
    questions: [
      "Have you ever visited any other country?",
      "Will you come back home during summers?",
      "What will you do during the off period/semester?",
    ],
  },
];

// USA Full Mock — 12 representative questions, one per mandatory/key section
const USA_FULL_MOCK: { question: string; category: string; objective: string }[] = [
  { question: "Why do you wish to study in USA and not in India?", category: "Why United States of America", objective: "Assess whether studying in the USA is a genuine choice and establish non-immigrant intent." },
  { question: "Which US University are you planning to go to?", category: "About Institute / University / College", objective: "Verify the student's knowledge of the chosen institution and why it was selected." },
  { question: "Why have you chosen this specific university?", category: "About Institute / University / College", objective: "Verify the student's knowledge of the chosen institution and why it was selected." },
  { question: "What course are you going for?", category: "About Your Course", objective: "Assess course knowledge, relevance to prior studies, duration, and cost awareness." },
  { question: "What is the course structure & contents?", category: "About Your Course", objective: "Assess course knowledge, relevance to prior studies, duration, and cost awareness." },
  { question: "What will be the total cost per year?", category: "About Your Course", objective: "Assess course knowledge, relevance to prior studies, duration, and cost awareness." },
  { question: "Where did you do your last course of study?", category: "Your Academic Background", objective: "Evaluate academic history, grades, subjects, and how they lead to the proposed course." },
  { question: "What is your High School, Degree or Master's percentage or grade?", category: "Your Academic Background", objective: "Evaluate academic history, grades, subjects, and how they lead to the proposed course." },
  { question: "Who is sponsoring you?", category: "Sponsor and Financial Detail", objective: "Verify that sufficient, legitimate funding is available for the full duration of study." },
  { question: "How will you finance your education funds for the full duration?", category: "Sponsor and Financial Detail", objective: "Verify that sufficient, legitimate funding is available for the full duration of study." },
  { question: "What are your plans after completing your studies?", category: "Future Plans (Career Prospects)", objective: "Establish return intent, career roadmap, and non-immigrant intent after graduation." },
  { question: "Why should I grant you a U.S. Visa?", category: "Visa or Refusal", objective: "Test the student's ability to make a compelling case for the visa and handle rejection." },
];

const USA_ALL_QUESTIONS = USA_SECTIONS.flatMap((s) =>
  s.questions.map((q) => ({ question: q, category: s.label, objective: s.objective }))
);

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
  const SAMPLE_RE  = /(?:a good sample answer (?:is|could be)|here is a sample answer)\s*:?\s*/i;

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

function pickVoice(voices: SpeechSynthesisVoice[], country: Country): SpeechSynthesisVoice | null {
  if (country === "usa") {
    // USA coach → en-US MALE voice, highest-quality first.
    // Quality tier 1 — cloud-rendered Google voices (Chrome desktop / Android Chrome)
    // Quality tier 2 — Microsoft Neural voices (Windows 10/11 with edge-tts engine)
    // Quality tier 3 — macOS / iOS 17+ premium named voices (need user to have downloaded)
    // Quality tier 4 — any en-US named "male" / any en-US non-female / any en-US
    // ROBOTIC_DENY: voices that exist on the system but sound mechanical /
    // cartoonish / synthesised by 2010s standards. Never pick these even if
    // they match the priority list — fall through to the female fallback
    // instead.
    //
    // - Alex: 1st-gen macOS male (2007), diphone synthesis.
    // - Albert / Fred / Ralph / Bruce: System-7-era novelty voices that
    //   shipped with classic Mac OS. Still present on macOS for legacy
    //   compatibility. Tagged en-US but designed as character voices.
    // - Bahh, Bells, Boing, Bubbles, Cellos, Deranged, Good News, Bad News,
    //   Hysterical, Junior (legacy/novelty — distinct from iOS 17+ Junior),
    //   Pipe Organ, Trinoids, Whisper, Zarvox: novelty voices in the same
    //   class. Listed by name so the premium-voice match for plain "Junior"
    //   can still hit the new high-quality iOS-17+ Junior on devices that
    //   actually have it (Apple ships those with "(Premium)" / "(Enhanced)"
    //   suffix variants which are matched separately below).
    // ROBOTIC_DENY: voices that exist on the system but sound mechanical /
    // cartoonish. Plain-name "Junior" added 11 May 2026 after user's
    // device picked the System-7-era novelty Junior (a child voice) —
    // distinct from the iOS 17+ / macOS Sonoma+ premium "Junior (Premium)"
    // or "Junior (English (US))" which the picker still prefers explicitly.
    // Same logic for plain "Tom" (legacy) — keep the suffix variants
    // allowed in the priority list.
    const ROBOTIC_DENY = new Set([
      "Alex", "Albert", "Fred", "Ralph", "Bruce",
      "Junior", "Tom",
      "Bahh", "Bells", "Boing", "Bubbles", "Cellos", "Deranged",
      "Good News", "Bad News", "Hysterical", "Pipe Organ", "Trinoids",
      "Whisper", "Zarvox",
    ]);

    const usMaleNamed = voices.find((v) => {
      const n = v.name;
      if (ROBOTIC_DENY.has(n)) return false;
      return (
        // Tier 1 — Google (cloud, highest quality on Chrome)
        n === "Google US English Male" || n === "Google US English" ||
        // Tier 2 — Microsoft (Windows)
        n === "Microsoft Guy Online (Natural) - English (United States)" ||
        n === "Microsoft Davis Online (Natural) - English (United States)" ||
        n === "Microsoft Mark - English (United States)" ||
        n === "Microsoft David - English (United States)" ||
        (/^Microsoft (Guy|Davis|Mark|David|Andrew|Brian|Tony|Christopher)\b/.test(n) && v.lang.startsWith("en-US")) ||
        // Tier 3 — macOS / iOS premium en-US male. Only the modern voices.
        // Albert + Fred removed — they're the System-7-era novelty voices,
        // not the modern premium voices.
        n === "Aaron"     || n === "Arthur"   ||
        n === "Eddy (English (US))" || n === "Eddy" ||
        n === "Junior (English (US))" || n === "Junior" ||
        n === "Nathan"    || n === "Reed"     || n === "Reed (English (US))" ||
        n === "Rocko (English (US))" || n === "Rocko" ||
        n === "Tom"       ||
        // Tier 4 — generic male hint
        (v.lang === "en-US" && /\bmale\b/i.test(n))
      );
    });

    // 2nd-tier fallback: natural-sounding female en-US voices. Better to
    // read in a clean female voice than in robotic Alex. The visa-officer
    // character takes the gender shift; the listen-quality matters more for
    // interview rehearsal.
    //
    // Match strategy: prefer Premium / Enhanced suffix variants over plain
    // names (Apple ships those as separate downloads with notably better
    // naturalness). Then plain names. macOS / iOS Voices Library includes:
    //   Ava, Allison, Samantha, Susan, Victoria, Vicki, Zoe, Karen,
    //   Princess, Kathy, Veena, Nicky, Sandy, Nora, Joelle, Tessa
    // — any of these may be the "new female voices" a user just downloaded.
    const NATURAL_FEMALE_BASE_NAMES = [
      "Ava", "Allison", "Samantha", "Susan", "Victoria", "Vicki",
      "Zoe", "Princess", "Kathy", "Nicky", "Sandy", "Nora", "Joelle",
    ];
    const QUALITY_SUFFIX = /\((Premium|Enhanced)\)$/i;
    // Find Premium / Enhanced variants first (best quality on macOS / iOS).
    const usPremiumFemale = voices.find((v) =>
      v.lang.startsWith("en-US")
      && QUALITY_SUFFIX.test(v.name)
      && NATURAL_FEMALE_BASE_NAMES.some((base) => v.name.startsWith(`${base} (`))
    );
    // Otherwise, cloud or plain-name fallbacks.
    const usNaturalFemale = usPremiumFemale ?? voices.find((v) => {
      const n = v.name;
      return (
        // Cloud-rendered (highest quality)
        n === "Google US English Female" ||
        n === "Microsoft Aria Online (Natural) - English (United States)" ||
        n === "Microsoft Jenny Online (Natural) - English (United States)" ||
        // Plain-name fallbacks (older voice versions still sound OK)
        (v.lang.startsWith("en-US") && NATURAL_FEMALE_BASE_NAMES.includes(n))
      );
    });

    // Last-resort: ANY en-US voice, with Alex explicitly denied so we never
    // serve him even when nothing else is available. Falls through to usAny.
    const KNOWN_FEMALE_EN_US = new Set([
      "Samantha", "Allison", "Ava", "Susan", "Victoria", "Vicki", "Kate",
      "Kathy", "Princess", "Veena", "Zoe", "Karen",
      "Microsoft Zira - English (United States)", "Microsoft Zira Desktop",
      "Microsoft Aria Online (Natural) - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Microsoft Michelle Online (Natural) - English (United States)",
      "Nora", "Sandy", "Nicky",
    ]);
    const usLocale = voices.find((v) =>
      v.lang === "en-US"
      && !ROBOTIC_DENY.has(v.name)
      && !/female/i.test(v.name)
      && !KNOWN_FEMALE_EN_US.has(v.name)
    );
    const usAny = voices.find((v) => v.lang === "en-US" && !ROBOTIC_DENY.has(v.name));

    const picked = usMaleNamed ?? usNaturalFemale ?? usLocale ?? usAny ?? null;
    // Diagnostic log so a user reporting "wrong voice" can paste back what
    // was actually picked. Cheap, runs once per session in practice.
    if (typeof window !== "undefined" && picked) {
      console.info(`[interview-prep] USA voice picked: "${picked.name}" (lang=${picked.lang}, localService=${picked.localService ?? "n/a"})`);
    }
    return picked;
  }

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

function useTTS(country: Country) {
  // speakSegments() — speaks an array of text segments with a pause between each.
  // This creates natural breathing room between feedback sections.
  const speakSegments = useCallback((segments: string[], onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      onEnd?.();
      return;
    }
    // Don't pre-call cancel() here. The original purpose was to clear stale
    // queued speech from a prior call, but it raced with the first utterance
    // and produced an "interrupted" error before any audio played. Callers
    // that explicitly want to stop TTS use the `cancel` callback returned
    // from useTTS — that path is for user-driven interruption (Mute toggle,
    // listenOnce, etc.) and is fine to call separately.

    const doSpeak = (voices: SpeechSynthesisVoice[]) => {
      const voice = pickVoice(voices, country);
      let i = 0;
      let didRetry = false;

      const speakNext = () => {
        if (i >= segments.length) { onEnd?.(); return; }
        const seg = segments[i++];
        if (!seg.trim()) { speakNext(); return; }
        utterAndAdvance(seg);
      };

      const utterAndAdvance = (seg: string) => {
        const utter = new SpeechSynthesisUtterance(seg);
        // USA male voice reads better at the default rate; the prior 1.05
        // clipped phonemes on some macOS/iOS voices and made it sound clipped.
        // UK/AU female voices stay at 1.0 rate / 1.12 pitch (slightly raised
        // pitch gives a warmer, less monotone female read on synthesised voices).
        utter.rate  = 1.0;
        utter.pitch = country === "usa" ? 1.0 : 1.12;
        utter.volume = 1;
        if (voice) utter.voice = voice;
        utter.onend = () => {
          didRetry = false;
          // 650ms breath between SEGMENTS only — when this is the last
          // segment, advance immediately so any auto-listen logic doesn't
          // sit waiting an extra 650ms with the user thinking the mic
          // isn't working. speakNext is still the single source of
          // onEnd?.() to avoid double-fire.
          setTimeout(speakNext, i >= segments.length ? 0 : 650);
        };
        utter.onerror = (e) => {
          const code = (e as SpeechSynthesisErrorEvent).error ?? "unknown";
          console.warn("[interview-prep] TTS utter.onerror:", code);
          // 'interrupted' / 'canceled' usually means another speak() or
          // cancel() raced this one. Retry once with a small delay before
          // giving up — this rescues the first-utterance race that can
          // happen on initial mount in Chrome.
          if ((code === "interrupted" || code === "canceled") && !didRetry) {
            didRetry = true;
            i--; // rewind so speakNext re-pops this segment
            setTimeout(speakNext, 250);
            return;
          }
          setTimeout(speakNext, 100);
        };
        try { window.speechSynthesis.resume(); } catch { /* ignore */ }
        window.speechSynthesis.speak(utter);
      };

      speakNext();
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      _voicesCache = voices;
      doSpeak(voices);
    } else if (_voicesCache.length > 0) {
      // Use the module-level cache populated at module init — covers the
      // case where a fresh context returns [] but voices were already loaded.
      doSpeak(_voicesCache);
    } else {
      let started = false;
      const handler = () => {
        if (started) return;
        started = true;
        const v2 = window.speechSynthesis.getVoices();
        _voicesCache = v2;
        doSpeak(v2);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler, { once: true });
      setTimeout(() => {
        if (started) return;
        const v3 = window.speechSynthesis.getVoices();
        if (v3.length > 0) {
          started = true;
          _voicesCache = v3;
          doSpeak(v3);
        } else {
          // Last-resort fallback: speak with no explicit voice (browser default)
          // rather than stranding the caller.
          console.warn("[interview-prep] TTS voices never loaded; speaking with default voice");
          started = true;
          doSpeak([]);
        }
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

// ─── Voice helpers (mic-stream hold + SR prime + listening cue) ────────────────
// Background: SpeechRecognition has a per-instance pipeline cold-start of
// ~500-1000ms on Chrome desktop (longer on iOS Safari) on the FIRST .start()
// of an origin-session. Pre-warming the audio stream via getUserMedia warms
// the audio device but does NOT warm SR's pipeline. The user perceives the
// dead window as "I have to speak 2-3 times before it picks me up". Two
// fixes below: (a) prime the SR pipeline once at session mount so subsequent
// .start()s are warm, (b) play an audible cue at onaudiostart so the user
// has a trustworthy "speak now" signal — UI text alone is not enough.

let _audioCtx: AudioContext | null = null;
function playListeningCue() {
  if (typeof window === "undefined") return;
  try {
    const Ctor = (window as typeof window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
              ?? (window as typeof window & { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    if (!_audioCtx) _audioCtx = new Ctor();
    if (_audioCtx.state === "suspended") void _audioCtx.resume();
    const ctx = _audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    osc.type = "sine";
    // Short envelope: 5ms attack, 60ms hold, 25ms release. Quiet (0.08).
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.005);
    gain.gain.setValueAtTime(0.08, now + 0.065);
    gain.gain.linearRampToValueAtTime(0, now + 0.090);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.10);
  } catch {
    /* cue is best-effort; never block recognition on it */
  }
}

// Prime Chrome's SpeechRecognition pipeline once. Construct an instance,
// briefly start it, wait for onstart (or onaudiostart), then abort. After
// this returns, subsequent SR .start() calls in the same origin-session
// warm in <100ms instead of 500-1000ms. Idempotent via the caller's ref.
function primeRecognition(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") { resolve(); return; }
    const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) { resolve(); return; }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { recog.abort(); } catch { /* ignore */ }
      resolve();
    };
    const recog = new Ctor();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";
    // Either onstart or onaudiostart is sufficient — Chrome fires onstart
    // first; some Safari builds skip onaudiostart entirely.
    recog.onstart = () => { setTimeout(finish, 50); };
    (recog as SpeechRecognitionShim & { onaudiostart?: () => void }).onaudiostart = () => { setTimeout(finish, 50); };
    recog.onerror = finish;
    recog.onend = finish;
    // Hard ceiling — never let priming hang the session if start() never
    // fires onstart (rare iOS Safari glitch).
    setTimeout(finish, 1500);
    try { recog.start(); } catch { finish(); }
  });
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
      <div className="grid sm:grid-cols-3 gap-5 text-left">
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

        <motion.button whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(59,130,246,0.2)" }}
          onClick={() => onSelect("usa")}
          className="group bg-gradient-to-br from-blue-50 to-red-50 border-2 border-blue-200 rounded-3xl p-7 flex flex-col gap-4 hover:border-blue-500 transition-all duration-200">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🇺🇸</span>
            <div>
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">United States</p>
              <h3 className="text-xl font-extrabold text-gray-900">F-1 Visa Interview Prep</h3>
            </div>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            60+ approved questions across 12 sections — Why USA, University, Course, Finance, Future Plans, and more.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {["12 sections", "60+ questions", "Male US voice", "AI feedback"].map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-semibold">{t}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-2 text-blue-700 font-bold text-sm group-hover:gap-3 transition-all">
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

const VOICE_HINTS = ["all", "one", "two", "three", "four", "five"];

function CategoryPicker({
  studentName,
  onSelect,
  onPracticeAll,
  onBack,
  listenOnce,
  sttSupported,
}: {
  studentName: string;
  onSelect: (cat: QuestionCategory) => void;
  onPracticeAll: () => void;
  onBack: () => void;
  listenOnce: (onResult: (text: string) => void, onStateChange: (active: boolean) => void) => void;
  sttSupported: boolean;
}) {
  const [catListening, setCatListening] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "warn" | "err"; text: string } | null>(null);
  const totalQ = AU_CATEGORIES.reduce((s, c) => s + c.questions.length, 0);

  const handleVoiceSelect = () => {
    if (!sttSupported) {
      setStatusMsg({ type: "err", text: "Voice not supported on this browser. Use Chrome or Edge, or tap a category below." });
      return;
    }
    setStatusMsg(null);
    listenOnce((text) => {
      const t = text.toLowerCase();
      if (/\ball\b|practice.?all/i.test(t))          { onPracticeAll(); return; }
      if (/\bone\b|\b1\b|program/i.test(t))           { onSelect(AU_CATEGORIES[0]); return; }
      if (/\btwo\b|\b2\b|career/i.test(t))            { onSelect(AU_CATEGORIES[1]); return; }
      if (/\bthree\b|\b3\b|australia|why/i.test(t))   { onSelect(AU_CATEGORIES[2]); return; }
      if (/\bfour\b|\b4\b|universit/i.test(t))        { onSelect(AU_CATEGORIES[3]); return; }
      if (/\bfive\b|\b5\b|other|important/i.test(t))  { onSelect(AU_CATEGORIES[4]); return; }
      setStatusMsg({ type: "warn", text: "Didn't catch that — try again or tap a category below." });
    }, (active) => { setCatListening(active); if (active) setStatusMsg(null); });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🇦🇺</span>
        <div>
          <p className="text-xs font-bold text-sky-600 uppercase tracking-wider">Australia · Genuine Student Interview</p>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Which category, {studentName}?
          </h2>
          <p className="text-sm text-gray-400 mt-1">{AU_CATEGORIES.length} categories · {totalQ} questions total</p>
        </div>
      </div>

      {/* Voice select bar — always visible */}
      <div className="mb-4">
        <button
          onClick={handleVoiceSelect}
          className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
            catListening
              ? "border-rose-400 bg-rose-50 text-rose-600 animate-pulse"
              : "border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-500 hover:bg-sky-100"
          }`}
        >
          <Mic className="w-4 h-4" />
          {catListening ? "Listening… say a number or category name" : "🎙️ Say your category"}
        </button>
        {statusMsg && (
          <p className={`text-xs text-center mt-1.5 ${statusMsg.type === "err" ? "text-red-500" : "text-amber-600"}`}>
            {statusMsg.text}
          </p>
        )}
        <p className="text-[11px] text-gray-400 text-center mt-1.5">
          Say: &quot;All&quot; · &quot;One&quot; (Program) · &quot;Two&quot; (Career) · &quot;Three&quot; (Australia) · &quot;Four&quot; (University) · &quot;Five&quot; (Other)
        </p>
      </div>

      <motion.button whileHover={{ y: -2 }} onClick={onPracticeAll}
        className="w-full mb-3 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <ListChecks className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm">Practice All Categories</p>
          <p className="text-xs text-white/70 mt-0.5">{totalQ} questions · full mock interview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">say &quot;All&quot;</span>
          <ChevronRight className="w-4 h-4 opacity-70" />
        </div>
      </motion.button>

      <div className="space-y-2">
        {AU_CATEGORIES.map((cat, i) => (
          <motion.button key={cat.id}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }} whileHover={{ x: 4 }}
            onClick={() => onSelect(cat)}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-sky-200 hover:border-sky-500 transition-all text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-sky-100 text-sky-700 text-xs font-black">
              {i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{cat.label}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{cat.objective}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-500 border border-sky-200">
                say &quot;{VOICE_HINTS[i + 1]}&quot;
              </span>
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

// ─── USA Section picker ────────────────────────────────────────────────────────

function USASectionPicker({
  studentName,
  onSelect,
  onFullMock,
  onBack,
}: {
  studentName: string;
  onSelect: (section: QuestionCategory) => void;
  onFullMock: () => void;
  onBack: () => void;
}) {
  const totalQ = USA_ALL_QUESTIONS.length;
  const mandatorySections = ["usa_why", "usa_university", "usa_course", "usa_academic", "usa_finance", "usa_future"];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🇺🇸</span>
        <div>
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">USA · F-1 Visa Interview</p>
          <h2 className="text-2xl font-extrabold text-gray-900">
            Which section, {studentName}?
          </h2>
          <p className="text-sm text-gray-400 mt-1">{USA_SECTIONS.length} sections · {totalQ} questions total</p>
        </div>
      </div>

      {/* Full Mock button */}
      <motion.button whileHover={{ y: -2 }} onClick={onFullMock}
        className="w-full mb-3 flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-red-600 text-white shadow-lg hover:shadow-xl transition-all">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <ListChecks className="w-5 h-5" />
        </div>
        <div className="text-left flex-1">
          <p className="font-bold text-sm">Full Mock Interview</p>
          <p className="text-xs text-white/70 mt-0.5">12 questions · covers all mandatory sections</p>
        </div>
        <ChevronRight className="w-4 h-4 opacity-70" />
      </motion.button>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {USA_SECTIONS.map((section, i) => {
          const isMandatory = mandatorySections.includes(section.id);
          return (
            <motion.button key={section.id}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }} whileHover={{ x: 4 }}
              onClick={() => onSelect(section)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border-2 border-blue-100 hover:border-blue-400 transition-all text-left">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-700 text-xs font-black">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-gray-900 text-sm">{section.label}</p>
                  {isMandatory && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">Mandatory</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{section.objective}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {section.questions.length}Q
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </motion.button>
          );
        })}
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
  feedbackError,
  loading,
  country,
  onNext,
  onReAnswer,
  onRetry,
  isLast,
  studentName,
  muted,
}: {
  feedbackText: string;
  feedbackError: boolean;
  loading: boolean;
  country: Country;
  onNext: () => void;
  onReAnswer: () => void;
  onRetry: () => void;
  isLast: boolean;
  studentName: string;
  muted: boolean;
}) {
  const { speak, speakSegments, cancel } = useTTS(country);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : country === "usa" ? "from-blue-600 to-red-600" : "from-rose-500 to-red-600";
  const improveLabel = country === "australia" ? "What you could improve" : "Where you could improve";
  const sampleLabel = country === "australia" ? "A good sample answer is" : country === "usa" ? "A Good sample answer could be" : "Here is a sample answer";
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
      ) : feedbackError ? (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <p className="text-sm font-semibold text-red-700">Feedback generation failed</p>
          <p className="text-xs text-red-500">There was a problem generating your feedback. Please try again.</p>
          <button onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 text-sm font-semibold transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Retry feedback
          </button>
        </div>
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
  mode = "voice",
}: {
  country: Country;
  onReset: () => void;
  mode?: "voice" | "text";
}) {
  const { speak, cancel } = useTTS(country);
  const accentBg = country === "australia" ? "from-sky-500 to-blue-600" : country === "usa" ? "from-blue-600 to-red-600" : "from-rose-500 to-red-600";
  const accentText = country === "australia" ? "text-sky-600" : country === "usa" ? "text-blue-700" : "text-rose-600";
  const flag = country === "australia" ? "🇦🇺" : country === "usa" ? "🇺🇸" : "🇬🇧";
  const countryLabel = country === "australia" ? "Australia" : country === "usa" ? "United States" : "United Kingdom";

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
  const [feedbackError, setFeedbackError] = useState(false);

  const [muted, setMuted] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [sttError, setSttError] = useState<string | null>(null);
  const [nameListening, setNameListening] = useState(false);
  const [yesListening, setYesListening] = useState(false);

  const recogRef = useRef<SpeechRecognitionShim | null>(null);
  const nameRecogRef = useRef<SpeechRecognitionShim | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);
  const nameInputRef = useRef<HTMLInputElement>(null);
  // transcriptRef mirrors the transcript state but is always current (avoids stale closures)
  const transcriptRef = useRef<string>("");
  // Cache the first successful mic permission grant so subsequent
  // recog.start() calls don't have to grab and immediately release the mic
  // each time. The grab/release race on every attempt was making the FIRST
  // recognition attempt drop audio (mic warm-up), which is what the user
  // experienced as "takes multiple attempts before audio is recognised".
  const micPermissionGrantedRef = useRef<boolean>(false);
  // Start-guard so two concurrent startListening calls (which can happen if
  // a re-render fires the listening useEffect twice while getUserMedia is
  // still awaiting) don't both create recogs and abort each other.
  const startingRef = useRef<boolean>(false);
  // Held mic stream + SR-pipeline-primed flag. The pre-warm useEffect below
  // grabs an audio stream and KEEPS IT OPEN for the lifetime of the session
  // (rather than releasing after 200ms), then primes Chrome's SpeechRecognition
  // pipeline once. Together they eliminate the cold-start window that made
  // the first user utterance get dropped ("had to speak 2-3 times").
  const prewarmStreamRef = useRef<MediaStream | null>(null);
  const srPrimedRef = useRef<boolean>(false);
  // Forward-ref handles for the auto-listen helpers (tryListenName /
  // tryListenForYes are declared further down the file but the auto-speak
  // useEffects above need to invoke them when TTS ends). We assign these
  // in a useEffect after the helpers exist; by the time TTS fires onEnd,
  // they're populated.
  const autoListenNameRef = useRef<(() => void) | null>(null);
  const autoListenYesRef = useRef<(() => void) | null>(null);
  const autoListenCategoryRef = useRef<(() => void) | null>(null);

  // ── Check STT support ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
      if (!win.SpeechRecognition && !win.webkitSpeechRecognition) setSttSupported(false);
    }
  }, []);

  // ── Mic pre-warm + SR pipeline prime ───────────────────────────────────────
  // Two-stage warm-up at session mount:
  //   1. Grab a getUserMedia stream and KEEP IT OPEN for the session. This
  //      pins the audio device hot — SR's internal stream re-acquisition
  //      becomes a no-op rather than a 50-150ms cold path.
  //   2. Prime SpeechRecognition's pipeline (briefly start+abort an SR
  //      instance) so Chrome's recognizer connection is cached. Without
  //      this, the first .start() of the session has a 500-1000ms dead
  //      window during which audio is dropped, which the user perceives
  //      as "had to speak 2-3 times before it picked me up".
  // Stream is released on unmount via the cleanup useEffect below.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (micPermissionGrantedRef.current && srPrimedRef.current) return;
      if (typeof navigator === "undefined" || !navigator?.mediaDevices?.getUserMedia) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        prewarmStreamRef.current = stream;
        micPermissionGrantedRef.current = true;
        // Prime SR while the stream is hot. Awaiting is fine — primeRecognition
        // has its own 1.5s ceiling and the user is still reading the page.
        if (!srPrimedRef.current) {
          await primeRecognition();
          if (cancelled) return;
          srPrimedRef.current = true;
        }
      } catch (e) {
        // User denied or device unavailable. Listening will surface a
        // clear error when the user actually tries it.
        console.warn("[interview-prep] mic pre-warm failed:", (e as Error).name);
      }
    })();
    return () => {
      cancelled = true;
      const s = prewarmStreamRef.current;
      if (s) {
        s.getTracks().forEach((t) => t.stop());
        prewarmStreamRef.current = null;
      }
    };
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
  // After the greeting finishes, the mic auto-activates for name capture so
  // the user doesn't have to find and click a microphone button. Listening
  // helpers are declared further down the file but referenced via closure
  // — by the time the effect fires, they're stable.
  useEffect(() => {
    if (phase !== "name" || mode === "text") return;
    const greeting = country === "australia"
      ? "Hello there! Welcome to your Genuine Student interview practice! I am so excited to help you prepare. To get us started, could you please tell me your name?"
      : country === "usa"
      ? "Hello! Welcome to your US F-1 visa interview practice! I am here to help you get ready for your consulate appointment. Let us start — could you please tell me your name?"
      : "Hello! Welcome! I am absolutely delighted to help you prepare for your UK credibility interview today. Could you please tell me your name?";
    const t = setTimeout(() => speak(greeting, () => {
      // Auto-listen for the name as soon as TTS finishes.
      autoListenNameRef.current?.();
    }), 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── AUTO-SPEAK: UK "are you ready — say YES" ─────────────────────────────────
  useEffect(() => {
    if (phase !== "uk_confirm" || !studentName || mode === "text") return;
    const msg = `Wonderful, ${studentName}! It is so great to meet you! I am here to help you absolutely nail your UK credibility interview. When you are ready to begin, just say YES and we will get started!`;
    const t = setTimeout(() => speak(msg, () => {
      // Auto-listen for "YES" as soon as TTS finishes.
      autoListenYesRef.current?.();
    }), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── AUTO-SPEAK: USA section menu ─────────────────────────────────────────────
  // No auto-listen here: the USA prompt doesn't enumerate sections by number,
  // so voice-only selection is ambiguous. The user picks via the buttons in
  // USASectionPicker.
  useEffect(() => {
    if (phase !== "usa_section" || !studentName || mode === "text") return;
    const msg = `Great to meet you, ${studentName}! I am your US visa interview coach. You can practice by section, or go straight into a Full Mock Interview that covers all the key areas the visa officer will ask about. Which would you like?`;
    const t = setTimeout(() => speak(msg), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── AUTO-SPEAK: AU category menu ─────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "category" || !studentName || mode === "text") return;
    const msg = `Fantastic, ${studentName}! You are going to do brilliantly today! Now, which category of questions would you like to practice? We have five great options. Number one, About the Program. Number two, Career Outcome. Number three, Why Australia. Number four, About the University. And number five, Other Important Questions. Which one shall we start with?`;
    const t = setTimeout(() => speak(msg, () => {
      autoListenCategoryRef.current?.();
    }), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Speak question ──────────────────────────────────────────────────────────
  const speakQuestion = useCallback((text: string) => {
    if (mode === "text" || muted) { setPhase("listening"); return; }
    setPhase("speaking");
    speak(text, () => setPhase("listening"));
  }, [speak, muted, mode]);

  // ── STT ─────────────────────────────────────────────────────────────────────
  // Silence detection: we only start the 3-second countdown AFTER we receive
  // a FINAL result (not interim). This prevents triggering mid-sentence when
  // the browser briefly pauses between words.
  const startListening = useCallback(async () => {
    if (!sttSupported || typeof window === "undefined") return;
    if (startingRef.current) return; // coalesce concurrent starts
    startingRef.current = true;
    const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) { startingRef.current = false; return; }

    // Wait for any previous recog to fully end before starting a new one.
    // recog.start() throws InvalidStateError if a previous one is still
    // alive, which on some Chrome builds also poisons the new attempt.
    if (recogRef.current) {
      try { recogRef.current.abort(); } catch { /* ignore */ }
      recogRef.current = null;
      // Give the engine ~120ms to actually release the audio device.
      await new Promise((r) => setTimeout(r, 120));
    }

    // Explicitly request mic permission ONCE, on the first listening attempt
    // of the session. Subsequent calls skip getUserMedia entirely — the
    // grab/release on every attempt was racing with SpeechRecognition's own
    // mic acquisition and dropping audio on the first try ("takes multiple
    // attempts before audio is recognised"). Once the permission is granted
    // for the origin, SpeechRecognition can grab the mic directly.
    if (!micPermissionGrantedRef.current && navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        micPermissionGrantedRef.current = true;
        // Brief settle before SR grabs the mic — without this, on cold-start
        // the first utterance is still occasionally dropped.
        await new Promise((r) => setTimeout(r, 150));
      } catch (e) {
        const name = e instanceof Error ? e.name : "mic-error";
        console.warn("[interview-prep] getUserMedia denied/failed:", name, e);
        setSttError(name === "NotAllowedError" ? "not-allowed" : name === "NotFoundError" ? "audio-capture" : name);
        startingRef.current = false;
        return;
      }
    }

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

    // Audible cue when SR is actually capturing audio. onaudiostart fires
    // when the engine has acquired the mic AND begun processing — that's
    // the only signal a user can trust as "speak now". Fallback to onstart
    // for browsers (some Safari builds) that skip onaudiostart.
    let cuedQ = false;
    const cueOnceQ = () => { if (!cuedQ) { cuedQ = true; playListeningCue(); } };
    recog.onaudiostart = cueOnceQ;
    recog.onstart = () => { setTimeout(cueOnceQ, 120); };
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
      transcriptRef.current = final + interim;
      setTranscript(final + interim);
      if (gotFinal) {
        // Reset the silence countdown every time a new final chunk arrives
        armSilenceTimer(final);
      }
      // While interim results are coming in, cancel any pending silence timer
      // so we don't fire mid-sentence
      if (interim) clearSilence();
    };
    recog.onerror = (event: SpeechRecognitionErrorEventShim) => {
      clearSilence();
      // Browser SpeechRecognition error codes: not-allowed, service-not-allowed,
      // audio-capture, no-speech, network, aborted, language-not-supported.
      // Surface them so the user knows mic isn't actually being captured.
      const code = event?.error || "unknown";
      console.warn("[interview-prep] STT error:", code, event?.message ?? "");
      // no-speech is benign — it just means silence; don't alarm the user.
      if (code !== "no-speech" && code !== "aborted") {
        setSttError(code);
      }
    };
    recog.onend = () => {
      clearSilence();
      transcriptRef.current = final.trim();
      setTranscript(final.trim());
    };
    recogRef.current = recog;
    setSttError(null);
    try {
      recog.start();
    } catch (e) {
      // Throws on InvalidStateError (already started) or NotAllowedError (no
      // mic permission, on some browsers this surfaces synchronously rather
      // than via onerror). Either way the user needs to know listening failed.
      console.warn("[interview-prep] recog.start() threw:", e);
      setSttError(e instanceof Error ? e.name : "start-failed");
      recogRef.current = null;
      startingRef.current = false;
      return;
    }
    startingRef.current = false;
    elapsedRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => { elapsedRef.current += 1; setElapsed(elapsedRef.current); }, 1000);
  }, [sttSupported]);

  const stopListening = useCallback(() => {
    if (recogRef.current) { try { recogRef.current.stop(); } catch { /* ignore */ } recogRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (mode === "text") return; // text mode: no STT
    if (phase === "listening") { setTranscript(""); startListening(); }
    if (phase !== "listening") stopListening();
  }, [phase, mode, startListening, stopListening]);

  // ── Extract name from natural speech ─────────────────────────────────────────
  // Strips intro phrases so "My name is Piyush Kumar" → "Piyush Kumar"
  const extractName = useCallback((raw: string): string => {
    return raw
      .replace(/\.$/, "")
      .replace(/^(my name is|i am|i'm|call me|it's|its|this is|hi i'm|hello i'm|hi my name is|hello my name is|hi|hello)\s+/i, "")
      .trim();
  }, []);

  // ── One-shot STT for name / YES inputs ───────────────────────────────────────
  // Uses interimResults + stable-interim timer so name is caught as soon as spoken,
  // even if the "final" event is slow or never fires on some browsers/devices.
  // nameMode=true: disables interim results, enables maxAlternatives=3, and tries
  // all alternatives to find a non-empty transcript — ideal for short name utterances.
  const listenOnce = useCallback(async (
    onResult: (text: string) => void,
    onStateChange: (active: boolean) => void,
    nameMode = false,
  ) => {
    if (!sttSupported || typeof window === "undefined") return;
    cancel(); // stop TTS before listening
    if (nameRecogRef.current) {
      try { nameRecogRef.current.abort(); } catch { /* ignore */ }
      nameRecogRef.current = null;
      // Let the engine release before grabbing again.
      await new Promise((r) => setTimeout(r, 120));
    }

    // First-attempt only: explicitly prompt for mic permission. Subsequent
    // calls skip getUserMedia — the grab/release race was the cause of
    // "takes multiple attempts before audio is recognised".
    if (!micPermissionGrantedRef.current && navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        micPermissionGrantedRef.current = true;
        await new Promise((r) => setTimeout(r, 150));
      } catch (e) {
        const name = e instanceof Error ? e.name : "mic-error";
        console.warn("[interview-prep] name getUserMedia denied/failed:", name, e);
        setSttError(name === "NotAllowedError" ? "not-allowed" : name === "NotFoundError" ? "audio-capture" : name);
        onStateChange(false);
        return;
      }
    }

    const win = window as typeof window & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
    const Ctor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!Ctor) return;
    const recog = new Ctor() as SpeechRecognitionShim & { maxAlternatives?: number };
    recog.continuous = false;
    // 11 May 2026: keep interimResults=true even in nameMode. The previous
    // "final-only" approach failed on short utterances ("Piyush", 0.5s):
    // Chrome with continuous=false sometimes never fires `final`, or fires
    // final with an empty transcript. Without interim, the safety timer hit
    // 6s and fired with empty lastInterim, sending the user into a 3-4-try
    // retry loop. With interim on + a short stable-interim timer, we fire
    // ~700ms after the user stops speaking — works for short names.
    recog.interimResults = true;
    if (nameMode) recog.maxAlternatives = 3;
    // Use en-US for best recognition accuracy; Indian names are well supported
    recog.lang = "en-US";
    onStateChange(true);
    let fired = false;
    let lastInterim = "";
    let stableTimer: ReturnType<typeof setTimeout> | null = null;

    // Audible "speak now" cue — fires when SR has actually acquired the
    // mic (onaudiostart). The UI text already flipped to "Listening…" via
    // onStateChange(true), but on a cold-start that flag fires before
    // the engine is capturing — the cue is the trustworthy signal.
    let cuedN = false;
    const cueOnceN = () => { if (!cuedN) { cuedN = true; playListeningCue(); } };
    recog.onaudiostart = cueOnceN;
    recog.onstart = () => { setTimeout(cueOnceN, 120); };

    const fireResult = (text: string) => {
      if (fired) return;
      fired = true;
      if (stableTimer) clearTimeout(stableTimer);
      clearTimeout(safetyTimer);
      try { recog.stop(); } catch { /* ignore */ }
      onStateChange(false);
      onResult(text);
    };

    // Safety timeout: 6s max — use whatever we have
    const safetyTimer = setTimeout(() => {
      if (!fired) fireResult(lastInterim.trim() || "");
    }, 6000);

    recog.onresult = (event: SpeechRecognitionEventShim) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];

        if (r.isFinal) {
          // Try each alternative in order until we find a non-empty one (in
          // nameMode we explicitly asked for 3 alternatives, so this
          // routinely recovers when the primary alt is empty).
          let best = "";
          for (let a = 0; a < r.length; a++) {
            const alt = r[a]?.transcript?.trim().replace(/\.$/, "") ?? "";
            if (alt.length >= 1) { best = alt; break; }
          }
          // If final came back empty, fall back to the most recent interim —
          // Chrome's "empty final" bug shouldn't strand the caller.
          if (!best && lastInterim.trim()) best = lastInterim.trim();
          if (!best && !nameMode) continue; // non-name mode: skip empty finals
          // Final result — fire immediately (accept even low-confidence for names)
          fireResult(best);
          return;
        } else {
          // Interim result — update latest and arm the stable-interim timer
          const text = r[0]?.transcript?.trim().replace(/\.$/, "") ?? "";
          if (!text) continue;
          lastInterim = text;
          if (stableTimer) clearTimeout(stableTimer);
          // Shorter stable window in nameMode (700ms) since names are short
          // and the user expects fast acknowledgement; 1200ms for category /
          // YES / longer phrases.
          const stableMs = nameMode ? 700 : 1200;
          const minLen = nameMode ? 2 : 2;
          stableTimer = setTimeout(() => {
            if (!fired && lastInterim.trim().length >= minLen) {
              fireResult(lastInterim.trim());
            }
          }, stableMs);
        }
      }
    };
    recog.onerror = (event: SpeechRecognitionErrorEventShim) => {
      if (stableTimer) clearTimeout(stableTimer);
      clearTimeout(safetyTimer);
      const code = event?.error || "unknown";
      console.warn("[interview-prep] name-STT error:", code, event?.message ?? "");
      if (code !== "no-speech" && code !== "aborted") setSttError(code);
      onStateChange(false);
    };
    recog.onend = () => {
      if (stableTimer) clearTimeout(stableTimer);
      clearTimeout(safetyTimer);
      onStateChange(false);
      // Fallback: if recognition ended without firing, use interim
      if (!fired && lastInterim.trim()) {
        fired = true;
        onResult(lastInterim.trim());
      }
      // Null the ref so the next listenOnce doesn't try to abort a dead
      // instance (which produces benign-but-noisy "aborted" errors).
      if (nameRecogRef.current === recog) nameRecogRef.current = null;
    };
    nameRecogRef.current = recog;
    // Mark this as a fresh nameMode start by stashing the start time —
    // helps the auto-listen useEffect avoid re-arming a fresh recog.
    void nameRecogRef;
    setSttError(null);
    try {
      recog.start();
    } catch (e) {
      console.warn("[interview-prep] name recog.start() threw:", e);
      setSttError(e instanceof Error ? e.name : "start-failed");
      onStateChange(false);
      nameRecogRef.current = null;
    }
  }, [sttSupported, cancel]);

  // ── Auto-listen helpers (lifted from button click handlers 11 May 2026) ────
  // The greeting / "say YES" prompts now auto-listen the moment TTS finishes,
  // so the user doesn't have to click a Mic button. Both helpers stay
  // available to the manual buttons too.
  const tryListenName = useCallback((isRetry: boolean) => {
    listenOnce(
      (text) => {
        const name = extractName(text);
        if (name.length < 2 && !isRetry) {
          speak(
            "I didn't catch that — could you say your name again?",
            () => tryListenName(true),
          );
          return;
        }
        if (!name) return;
        setNameInput(name);
        cancel();
        setStudentName(name);
        setPhase(country === "uk" ? "uk_confirm" : country === "usa" ? "usa_section" : "category");
      },
      setNameListening,
      true, // nameMode
    );
  }, [listenOnce, extractName, speak, cancel, country]);

  const tryListenForYes = useCallback(() => {
    listenOnce(
      (text) => {
        if (/yes/i.test(text)) {
          // Inline handleUkConfirm to avoid temporal-dead-zone (it's
          // declared lower in the file).
          setActiveQuestions(UK_SEQUENCE);
          setSessionLabel("Full Interview · 14 Questions");
          setQIndex(0);
          setAnswers([]);
          speakQuestion(UK_SEQUENCE[0].question);
        } else {
          setUkConfirmInput(text);
        }
      },
      setYesListening,
    );
  }, [listenOnce, speakQuestion]);

  // Wire the forward-refs so the auto-speak useEffects above can invoke the
  // listen helpers without import-order / temporal-dead-zone issues.
  useEffect(() => {
    autoListenNameRef.current = () => tryListenName(false);
    autoListenYesRef.current = tryListenForYes;
  }, [tryListenName, tryListenForYes]);

  // ── Fetch AI feedback ───────────────────────────────────────────────────────
  const fetchFeedback = useCallback(async (question: string, objective: string, t: string) => {
    setFeedbackLoading(true);
    setFeedbackText("");
    setFeedbackError(false);

    // Look up the official checklist for this question from the knowledge files
    let checklist: string[] | undefined;
    if (country === "uk") {
      checklist = UK_GUIDELINES[question];
    } else if (country === "usa") {
      // For USA, find which section this question belongs to and use section checklist
      const section = USA_SECTIONS.find((s) => s.questions.includes(question));
      if (section) checklist = USA_GUIDELINES[section.label];
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
      if (!res.ok) {
        setFeedbackError(true);
        return;
      }
      const data = await res.json() as { feedback?: string; error?: string };
      if (data.error || !data.feedback) {
        setFeedbackError(true);
      } else {
        setFeedbackText(data.feedback);
      }
    } catch {
      setFeedbackError(true);
    } finally {
      setFeedbackLoading(false);
    }
  }, [country, studentName]);

  // ── Name submission ─────────────────────────────────────────────────────────
  // NOTE: no speak() here — the auto-speak useEffects above fire when phase changes
  const handleNameSubmit = () => {
    const name = extractName(nameInput.trim());
    if (!name) return;
    cancel(); // stop any current speech before transitioning
    setStudentName(name);
    setNameInput(name); // update field to show the cleaned name
    setPhase(country === "uk" ? "uk_confirm" : country === "usa" ? "usa_section" : "category");
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

  // ── USA section / full mock selection ───────────────────────────────────────
  const handleSectionSelect = (section: QuestionCategory) => {
    cancel();
    const qs = section.questions.map((q) => ({
      question: q, category: section.label, objective: section.objective,
    }));
    setActiveQuestions(qs);
    setSessionLabel(section.label);
    setQIndex(0);
    setAnswers([]);
    speakQuestion(qs[0].question);
  };

  const handleFullMockUSA = () => {
    cancel();
    setActiveQuestions(USA_FULL_MOCK);
    setSessionLabel("Full Mock Interview · 12 Questions");
    setQIndex(0);
    setAnswers([]);
    speakQuestion(USA_FULL_MOCK[0].question);
  };

  // ── Auto-listen helpers for AU category + USA section selection ─────────────
  // Same listenOnce + regex pattern that CategoryPicker / USASectionPicker use
  // internally for their manual mic buttons; lifted here so the auto-speak
  // useEffects above can fire them when TTS ends. The forward-refs
  // (autoListenCategoryRef / autoListenUsaSectionRef) are populated in the
  // useEffect below.
  const tryListenForCategory = useCallback(() => {
    listenOnce((text) => {
      const t = text.toLowerCase();
      if (/\ball\b|practice.?all/i.test(t))         return handlePracticeAll();
      if (/\bone\b|\b1\b|program/i.test(t))          return handleCategorySelect(AU_CATEGORIES[0]);
      if (/\btwo\b|\b2\b|career/i.test(t))           return handleCategorySelect(AU_CATEGORIES[1]);
      if (/\bthree\b|\b3\b|australia|why/i.test(t))  return handleCategorySelect(AU_CATEGORIES[2]);
      if (/\bfour\b|\b4\b|universit/i.test(t))       return handleCategorySelect(AU_CATEGORIES[3]);
      if (/\bfive\b|\b5\b|other|important/i.test(t)) return handleCategorySelect(AU_CATEGORIES[4]);
      // Unmatched — user can re-press the mic button or type.
    }, () => { /* parent doesn't track listening state — picker manages its own */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listenOnce]);

  // Wire the AU category forward-ref.
  useEffect(() => {
    autoListenCategoryRef.current = tryListenForCategory;
  }, [tryListenForCategory]);

  // Auto-submit ref — always holds the latest fetchFeedback call so the silence
  // timer inside startListening() can fire it with the most current values
  const autoSubmitRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    autoSubmitRef.current = () => {
      if (phase !== "listening") return;
      const q = activeQuestions[qIndex];
      // Use transcriptRef.current so the silence-timer callback always
      // sees the most current accumulated text (avoids stale closure)
      const currentTranscript = transcriptRef.current;
      if (q && currentTranscript.trim()) {
        stopListening();
        setPhase("feedback");
        fetchFeedback(q.question, q.objective, currentTranscript);
      }
    };
  });

  // ── Stop & review ───────────────────────────────────────────────────────────
  const handleStopAndReview = () => {
    stopListening();
    setPhase("review");
  };

  // ── Auto-advance from review → feedback after 3s (voice mode only) ────────────
  useEffect(() => {
    if (phase !== "review" || mode === "text") return;
    const t = setTimeout(() => {
      const q = activeQuestions[qIndex];
      if (q && phase === "review") {
        // Use transcriptRef.current — avoids stale closure since transcript state
        // may not have updated yet when phase changes to "review" (recog.onend is async)
        const captured = transcriptRef.current;
        setPhase("feedback");
        fetchFeedback(q.question, q.objective, captured);
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
    transcriptRef.current = "";
    setFeedbackText("");
    setFeedbackError(false);
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
    transcriptRef.current = "";
    setFeedbackText("");
    setFeedbackError(false);
    elapsedRef.current = 0;
    setElapsed(0);
    speakQuestion(activeQuestions[qIndex].question);
  };

  // ── Skip ────────────────────────────────────────────────────────────────────
  // Hard-stop the interview — cancel TTS, stop any active recog, jump to
  // the complete screen with whatever answers were collected so far. The
  // confirmation prompt prevents accidental clicks mid-question.
  const handleStopInterview = () => {
    const submitted = answers.filter((a) => a.transcript !== "[Skipped]").length;
    const remaining = activeQuestions.length - submitted;
    const ok = window.confirm(
      submitted === 0
        ? "Stop the interview now? You have no answers recorded yet — the summary will be empty."
        : `Stop the interview now? You have answered ${submitted} of ${activeQuestions.length} questions (${remaining} remaining). Your collected answers stay on the summary.`
    );
    if (!ok) return;
    cancel(); // stop TTS
    if (recogRef.current) { try { recogRef.current.abort(); } catch { /* ignore */ } recogRef.current = null; }
    if (nameRecogRef.current) { try { nameRecogRef.current.abort(); } catch { /* ignore */ } nameRecogRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setPhase("complete");
  };

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
    transcriptRef.current = "";
    setFeedbackText("");
    setFeedbackError(false);
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
      : country === "usa"
      ? "Hello! Welcome to your US F-1 visa interview practice! I am here to help you get ready for your consulate appointment. Let us start — could you please tell me your name?"
      : "Hello! Welcome! I am absolutely delighted to help you prepare for your UK credibility interview today. Could you please tell me your name?";
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <span className="text-5xl">{flag}</span>
          <div className="text-left">
            <p className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>{countryLabel}</p>
            <h2 className="text-2xl font-extrabold text-gray-900">
              {country === "australia" ? "Genuine Student Interview Prep" : country === "usa" ? "US F-1 Visa Interview Prep" : "UK Credibility Interview Prep"}
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

          {/* Speak name — auto-advances immediately on detection. Auto-fires
              once on greeting end via the useEffect above; this manual button
              stays so the user can re-trigger if they fluffed the first try. */}
          {sttSupported && (
            <button
              onClick={() => tryListenName(false)}
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

          {/* Speak YES — auto-fires on TTS end via the useEffect above; this
              manual button stays as a fallback for re-trigger. */}
          {sttSupported && (
            <button
              onClick={tryListenForYes}
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

  // ── USA: Section picker ─────────────────────────────────────────────────────
  if (phase === "usa_section") {
    return (
      <USASectionPicker
        studentName={studentName}
        onSelect={handleSectionSelect}
        onFullMock={handleFullMockUSA}
        onBack={() => { cancel(); setPhase("name"); }}
      />
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
        listenOnce={listenOnce}
        sttSupported={sttSupported}
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
              setPhase(country === "uk" ? "uk_confirm" : country === "usa" ? "usa_section" : "category");
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
          {mode === "text" ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
              <MessageSquare className="w-3 h-3" /> Text Mode
            </span>
          ) : (
            <button
              onClick={() => { if (!muted) cancel(); setMuted((m) => !m); }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {muted ? "Unmute" : "Mute"}
            </button>
          )}
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
            {phase === "speaking" && mode !== "text" && (
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Volume2 className="w-3 h-3 animate-pulse" /> Reading aloud…
              </span>
            )}
          </div>
          <p className="text-base font-semibold text-gray-900 leading-relaxed">{currentQ.question}</p>
          {/* Objective shown in text mode so the student understands what the question tests */}
          {mode === "text" && (
            <p className="mt-3 text-xs text-gray-400 italic leading-relaxed border-t border-gray-100 pt-3">
              💡 {currentQ.objective}
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── VOICE MODE: waveform + mic pulse ── */}
      {mode === "voice" && (
        <div className="flex flex-col items-center gap-4 mb-6">
          {phase === "speaking" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
              <Waveform active={true} color={country === "australia" ? "bg-sky-400" : country === "usa" ? "bg-blue-500" : "bg-rose-400"} />
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
      )}

      {/* ── VOICE MODE: live transcript box ── */}
      {mode === "voice" && (
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
                ) : sttError && phase === "listening" ? (
                  <p className="text-sm text-rose-600 leading-relaxed">
                    {sttError === "not-allowed" || sttError === "service-not-allowed" || sttError === "NotAllowedError"
                      ? "Microphone permission was denied. Click the lock icon in your address bar → allow microphone, then refresh. Or type your answer below."
                      : sttError === "audio-capture"
                      ? "We couldn't reach a microphone. Check your device and browser, then refresh — or type your answer below."
                      : sttError === "network"
                      ? "Speech recognition couldn't reach the network. Check your connection — or type your answer below."
                      : `Speech recognition error: ${sttError}. Type your answer below.`}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {phase === "listening"
                      ? sttSupported ? "Speak now — your words will appear here…" : "Type your answer below"
                      : "No speech detected."}
                  </p>
                )}
              </div>
              {(!sttSupported || sttError) && phase === "listening" && (
                <textarea
                  className="mt-3 w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                  rows={3} placeholder="Type your answer here…"
                  value={transcript} onChange={(e) => setTranscript(e.target.value)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── TEXT MODE: answer textarea ── */}
      {mode === "text" && phase === "listening" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            <MessageSquare className="w-3.5 h-3.5" /> Your Answer
          </label>
          <textarea
            autoFocus
            className={`w-full border-2 rounded-2xl px-5 py-4 text-sm text-gray-800 leading-relaxed focus:outline-none focus:ring-2 resize-none transition-colors ${
              country === "australia"
                ? "border-sky-200 focus:border-sky-400 focus:ring-sky-100"
                : country === "usa"
                ? "border-blue-200 focus:border-blue-400 focus:ring-blue-100"
                : "border-rose-200 focus:border-rose-400 focus:ring-rose-100"
            }`}
            rows={7}
            placeholder="Type your answer here. Be specific — mention your course, university, career goals, and any research you have done…"
            value={transcript}
            onChange={(e) => { setTranscript(e.target.value); transcriptRef.current = e.target.value; }}
          />
          <p className="text-[11px] text-gray-400 mt-1.5 text-right">{transcript.trim().split(/\s+/).filter(Boolean).length} words</p>
        </motion.div>
      )}

      {/* Feedback panel */}
      <AnimatePresence>
        {phase === "feedback" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mb-5">
            <FeedbackPanel
              feedbackText={feedbackText}
              feedbackError={feedbackError}
              loading={feedbackLoading}
              country={country}
              onNext={handleNext}
              onReAnswer={handleReAnswer}
              onRetry={() => {
                const q = activeQuestions[qIndex];
                if (q) fetchFeedback(q.question, q.objective, transcriptRef.current);
              }}
              isLast={qIndex + 1 >= activeQuestions.length}
              studentName={studentName}
              muted={mode === "text" ? true : muted}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Voice mode buttons */}
        {mode === "voice" && phase === "speaking" && (
          <button onClick={() => { cancel(); setPhase("listening"); }}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors">
            Skip reading →
          </button>
        )}
        {/* Stop interview — visible during any active phase. End-of-interview
            jumps straight to the summary with whatever answers were collected. */}
        {(phase === "speaking" || phase === "listening" || phase === "review" || phase === "feedback") && (
          <button
            onClick={handleStopInterview}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm font-semibold hover:bg-rose-100 transition-colors"
            title="Stop interview and jump to the summary"
          >
            <X className="w-3.5 h-3.5" /> Stop interview
          </button>
        )}
        {mode === "voice" && phase === "listening" && (
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
        {mode === "voice" && phase === "review" && (
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
        {/* Text mode buttons */}
        {mode === "text" && phase === "listening" && (
          <>
            <motion.button
              whileHover={{ y: -1 }}
              onClick={() => {
                if (!transcript.trim()) return;
                const q = activeQuestions[qIndex];
                transcriptRef.current = transcript;
                setPhase("feedback");
                fetchFeedback(q.question, q.objective, transcript);
              }}
              disabled={!transcript.trim()}
              className={`flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r ${accentBg} text-white font-bold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-opacity`}
            >
              <Sparkles className="w-4 h-4" /> Get AI Feedback
            </motion.button>
            <button onClick={handleSkip}
              className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Skip question
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
  const modeParam = searchParams.get("mode");
  const mode: "voice" | "text" = modeParam === "text" ? "text" : "voice";
  const [country, setCountry] = useState<Country | null>(
    initial === "australia" || initial === "uk" || initial === "usa" ? initial : null
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <EduvianLogoMark size={32} />
            <span className="font-display font-bold text-sm text-gray-900 tracking-tight">eduvian<span className="text-indigo-500">AI</span></span>
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
              <InterviewSession country={country} onReset={() => setCountry(null)} mode={mode} />
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
    <AuthGate stage={3} toolName="AI Interview Coach" source="interview-prep">
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      }>
        <InterviewPrepInner />
      </Suspense>
    </AuthGate>
  );
}

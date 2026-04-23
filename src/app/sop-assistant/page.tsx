"use client";

import { useState, useEffect, useCallback } from "react";
import AuthGate from "@/components/AuthGate";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  university: string;
  course: string;
  degree_level: string;
  applicant_type: string;
  opening_hook: string;
  academic_prep: string;
  work_experience: string;
  why_degree: string;
  career_goals: string;
  why_university: string;
  extracurriculars: string;
  additional_notes: string;
}

interface DimensionScore {
  score: number;
  max: number;
  feedback: string | string[];
}

interface ScoreResult {
  total_score: number;
  verdict: "Top Tier" | "Competitive" | "Borderline" | "Reject Risk";
  verdict_description: string;
  dimension_scores: {
    clarity_of_purpose: DimensionScore;
    academic_readiness: DimensionScore;
    depth_of_reflection: DimensionScore;
    career_goals: DimensionScore;
    program_fit: DimensionScore;
    impact_achievements: DimensionScore;
    originality: DimensionScore;
  };
  red_flags: string[];
  common_mistakes_detected: string[];
  generic_phrases_detected: { original: string; suggested_rewrite: string }[];
  strengths: string[];
  improvements: string[];
  section_feedback: {
    opening: string;
    academic: string;
    professional: string;
    why_degree: string;
    career_goals: string;
    why_university: string;
    conclusion: string;
  };
  word_count_estimate: number;
  ready_to_submit: boolean;
}

type Step = "form" | "loading" | "result";

// ── Constants ─────────────────────────────────────────────────────────────────

const LOADING_STEPS = [
  "Analysing your inputs…",
  "Crafting your narrative arc…",
  "Writing your SOP…",
  "Applying admissions guidelines…",
];

const DEGREE_LEVELS = [
  "Masters (Taught)",
  "Masters (Research)",
  "MBA",
  "Undergraduate",
  "PhD",
];

const APPLICANT_TYPES = [
  "Final-year undergraduate",
  "Early career professional (1-3 yrs)",
  "Experienced professional (3+ yrs)",
  "Career switcher",
  "Research-oriented",
];

// ── Nav ───────────────────────────────────────────────────────────────────────

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
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-4 py-2 my-3 rounded-xl border border-white/15 text-slate-300 text-sm font-semibold hover:border-white/30 hover:text-white transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
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

// ── Score Circle ──────────────────────────────────────────────────────────────

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;

  const getColour = () => {
    if (score >= 7.5) return { ring: "stroke-emerald-500", fill: "text-emerald-600" };
    if (score >= 5.5) return { ring: "stroke-indigo-500", fill: "text-indigo-600" };
    if (score >= 4) return { ring: "stroke-amber-500", fill: "text-amber-600" };
    return { ring: "stroke-red-500", fill: "text-red-600" };
  };

  const colours = getColour();

  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={radius} fill="none"
          strokeWidth="10"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          className={colours.ring}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="relative text-center">
        <p className={`text-4xl font-black ${colours.fill}`}>{score.toFixed(1)}</p>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">/ 10</p>
      </div>
    </div>
  );
}

// ── Verdict Config ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: ScoreResult["verdict"] }) {
  const config: Record<ScoreResult["verdict"], { label: string; badge: string }> = {
    "Top Tier": {
      label: "Top Tier 🎯  (9–10)",
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    "Competitive": {
      label: "Competitive ✅  (7–8)",
      badge: "bg-indigo-100 text-indigo-700 border border-indigo-200",
    },
    "Borderline": {
      label: "Borderline ⚠️  (5–6)",
      badge: "bg-amber-100 text-amber-700 border border-amber-200",
    },
    "Reject Risk": {
      label: "Reject Risk ❌  (<5)",
      badge: "bg-red-100 text-red-700 border border-red-200",
    },
  };

  const c = config[verdict];
  return (
    <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${c.badge}`}>{c.label}</span>
  );
}

// ── Dimension Bar ─────────────────────────────────────────────────────────────

function DimensionBar({
  label,
  score,
  max,
  feedback,
}: {
  label: string;
  score: number;
  max: number;
  feedback?: string | string[];
}) {
  const [showFeedback, setShowFeedback] = useState(false);
  const pct = (score / max) * 100;
  const barColour =
    pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : pct >= 30 ? "bg-amber-500" : "bg-red-500";

  const feedbackItems = Array.isArray(feedback)
    ? feedback
    : feedback
    ? [feedback]
    : [];

  return (
    <div className="mb-3">
      <button
        className="w-full text-left"
        onClick={() => feedbackItems.length > 0 && setShowFeedback((p) => !p)}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-600 font-medium">{label}</span>
          <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
            {score}/{max}
            {feedbackItems.length > 0 && (
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showFeedback ? "rotate-180" : ""}`} />
            )}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${barColour} transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>
      {showFeedback && feedbackItems.length > 0 && (
        <ul className="mt-1.5 ml-1 space-y-1">
          {feedbackItems.map((f, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500">
              <span className="mt-1 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Collapsible Section ───────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Score Skeleton ────────────────────────────────────────────────────────────

function ScoreSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="w-36 h-36 rounded-full bg-gray-200 mx-auto" />
      <div className="h-6 bg-gray-200 rounded-full w-32 mx-auto" />
      <div className="h-4 bg-gray-200 rounded w-full" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-full" />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SOPAssistantPage() {
  const [step, setStep] = useState<Step>("form");
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [form, setForm] = useState<FormData>({
    university: "",
    course: "",
    degree_level: "Masters (Taught)",
    applicant_type: "Final-year undergraduate",
    opening_hook: "",
    academic_prep: "",
    work_experience: "",
    why_degree: "",
    career_goals: "",
    why_university: "",
    extracurriculars: "",
    additional_notes: "",
  });
  const [generatedSOP, setGeneratedSOP] = useState("");
  const [editedSOP, setEditedSOP] = useState("");
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cycle loading steps
  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => {
      setLoadingStepIdx((i) => (i + 1) % LOADING_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [step]);

  const wordCount = editedSOP.trim() ? editedSOP.trim().split(/\s+/).length : 0;

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  const handleScore = useCallback(async (sopText: string) => {
    setScoreLoading(true);
    setScoreResult(null);
    try {
      const res = await fetch("/api/sop-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score",
          sop_text: sopText,
          university: form.university,
          course: form.course,
        }),
      });
      const data = (await res.json()) as ScoreResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Scoring failed");
      setScoreResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Scoring failed";
      setError(msg);
    } finally {
      setScoreLoading(false);
    }
  }, [form.university, form.course]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.university.trim() || !form.course.trim() || !form.opening_hook.trim()) return;

    setError(null);
    setStep("loading");
    setLoadingStepIdx(0);

    try {
      const res = await fetch("/api/sop-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", ...form }),
      });
      const data = (await res.json()) as { sop?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");

      const sop = data.sop ?? "";
      setGeneratedSOP(sop);
      setEditedSOP(sop);
      setStep("result");

      // Auto-score
      await handleScore(sop);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setStep("form");
    }
  }

  function handleDownload() {
    const blob = new Blob([editedSOP], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SOP_${form.university.replace(/\s+/g, "_")}_${form.course.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setStep("form");
    setGeneratedSOP("");
    setEditedSOP("");
    setScoreResult(null);
    setError(null);
  }

  // ── Step 1: Form ────────────────────────────────────────────────────────────

  if (step === "form") {
    const canSubmit = form.university.trim() && form.course.trim() && form.opening_hook.trim();

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
        <Nav />
        <main className="pt-24 pb-20 px-4 max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                AI SOP Writer
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                Write a{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Compelling SOP
                </span>{" "}
                in Minutes
              </h1>
              <p className="text-gray-500 text-base leading-relaxed max-w-2xl mx-auto">
                Fill in your story and let our AI craft an authentic, admissions-ready Statement of Purpose — then score it against 7 dimensions before you submit.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm max-w-2xl mx-auto">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleGenerate}>
              {/* Two-column layout */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                      Target Application
                    </h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        University Name <span className="text-red-500 text-xs">(required)</span>
                      </label>
                      <input
                        name="university"
                        value={form.university}
                        onChange={handleFormChange}
                        required
                        placeholder="e.g. University of Edinburgh"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Course / Program <span className="text-red-500 text-xs">(required)</span>
                      </label>
                      <input
                        name="course"
                        value={form.course}
                        onChange={handleFormChange}
                        required
                        placeholder="e.g. MSc Data Science"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Degree Level
                      </label>
                      <select
                        name="degree_level"
                        value={form.degree_level}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white"
                      >
                        {DEGREE_LEVELS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Applicant Type
                      </label>
                      <select
                        name="applicant_type"
                        value={form.applicant_type}
                        onChange={handleFormChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white"
                      >
                        {APPLICANT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Work + Why Degree */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                      Experience &amp; Motivation
                    </h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Work / internship experience
                      </label>
                      <p className="text-xs text-gray-400 mb-2">Key roles, responsibilities, outcomes, and what they revealed about your direction. Leave blank if none.</p>
                      <textarea
                        name="work_experience"
                        value={form.work_experience}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="e.g. Software engineer intern at XYZ for 6 months — built a recommendation engine, learned ML in production…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Why this degree, why now
                      </label>
                      <p className="text-xs text-gray-400 mb-2">What skills/knowledge do you still need? Why now and not later?</p>
                      <textarea
                        name="why_degree"
                        value={form.why_degree}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="e.g. My internship exposed a gap in my statistical foundations — a dedicated MSc will give me rigour I cannot get on the job…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Short-term and long-term career goals
                      </label>
                      <p className="text-xs text-gray-400 mb-2">Specific roles, functions, and the impact you want to create.</p>
                      <textarea
                        name="career_goals"
                        value={form.career_goals}
                        onChange={handleFormChange}
                        rows={3}
                        placeholder="e.g. Short term: ML engineer at a climate-tech startup. Long term: build data infrastructure for renewable energy transition in South Asia…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                  </div>

                  {/* Optional */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                      Optional
                    </h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Leadership / extracurriculars / personality
                      </label>
                      <textarea
                        name="extracurriculars"
                        value={form.extracurriculars}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="e.g. Ran a 50-member coding club, mentored 10 juniors, competed in national hackathons…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Anything else?
                      </label>
                      <textarea
                        name="additional_notes"
                        value={form.additional_notes}
                        onChange={handleFormChange}
                        rows={2}
                        placeholder="Any specific instructions, tone preferences, or additional context…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-5">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                      Your Story
                    </h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Opening hook / defining experience <span className="text-red-500 text-xs">(required)</span>
                      </label>
                      <p className="text-xs text-gray-400 mb-2">A specific moment, project, or decision that led you to this field. NOT &apos;since childhood&apos;. Min 3–4 sentences.</p>
                      <textarea
                        name="opening_hook"
                        value={form.opening_hook}
                        onChange={handleFormChange}
                        required
                        rows={4}
                        placeholder="e.g. During my third-year dissertation on urban traffic flow, I discovered that our city's signals were optimised for 1970s traffic patterns. I spent three weeks building a simple simulation in Python — and reduced theoretical congestion by 22%…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Academic preparation
                      </label>
                      <p className="text-xs text-gray-400 mb-2">Key courses, projects, thesis, research. What did you study and what did you learn?</p>
                      <textarea
                        name="academic_prep"
                        value={form.academic_prep}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="e.g. BEng Computer Engineering (GPA 3.7). Core modules: Algorithms, Linear Algebra, Probability. Thesis on real-time object detection using YOLO architecture. Published at ICIP 2024…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Why this specific university / program
                      </label>
                      <p className="text-xs text-gray-400 mb-2">Name specific courses, labs, faculty, or pedagogy that align with your goals.</p>
                      <textarea
                        name="why_university"
                        value={form.why_university}
                        onChange={handleFormChange}
                        rows={4}
                        placeholder="e.g. Edinburgh's MSc Data Science features Prof. Smith's NLP module and the Alan Turing Institute partnership. The cohort's interdisciplinary intake (CS + social sciences) matches my goal of applying ML to public policy…"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y"
                      />
                    </div>
                  </div>

                  {/* Tips card */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-bold text-indigo-700">Tips for a great SOP</span>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        "Be specific — names, numbers, outcomes beat vague claims",
                        "Show reflection — what did you learn from each experience?",
                        "Connect the dots — each section should flow into the next",
                        'Why this university must name real courses/faculty — not "world-class"',
                        "Career goals should be specific and logically follow your background",
                      ].map((tip) => (
                        <li key={tip} className="flex items-start gap-2 text-xs text-indigo-600">
                          <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-400" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-base font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none"
                >
                  <FileText className="w-4 h-4" />
                  Generate My SOP →
                </button>
                {!canSubmit && (
                  <p className="text-center text-xs text-gray-400 mt-2">
                    University, course, and opening hook are required to generate your SOP.
                  </p>
                )}
              </div>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Step 2: Loading ─────────────────────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
        <Nav />
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <div className="relative w-20 h-20 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-t-indigo-500"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-7 h-7 text-indigo-500" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Writing your SOP…</h2>
            <div className="space-y-3">
              {LOADING_STEPS.map((label, i) => (
                <motion.div
                  key={label}
                  animate={{
                    opacity: i === loadingStepIdx ? 1 : 0.3,
                    scale: i === loadingStepIdx ? 1.03 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    i === loadingStepIdx
                      ? "bg-indigo-50 border border-indigo-200"
                      : "bg-gray-50 border border-gray-100"
                  }`}
                >
                  {i < loadingStepIdx ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : i === loadingStepIdx ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <RefreshCw className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                    </motion.div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      i === loadingStepIdx ? "text-indigo-700" : "text-gray-400"
                    }`}
                  >
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-6">This usually takes 15–25 seconds.</p>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Step 3: Result ──────────────────────────────────────────────────────────

  return (
    <AuthGate stage={2} toolName="SOP Writer" source="sop-assistant">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
      <Nav />
      <main className="pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <AnimatePresence>
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  SOP Generated
                </div>
                <h1 className="text-xl font-extrabold text-gray-900">
                  {form.course}{" "}
                  <span className="text-gray-400 font-normal">@</span>{" "}
                  {form.university}
                </h1>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Start Over
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Split Layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              {/* LEFT — SOP Text (60%) */}
              <div className="lg:w-[60%] flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      Your Statement of Purpose
                    </h2>
                    <span className="text-xs text-gray-400 font-medium">{wordCount} words</span>
                  </div>
                  <textarea
                    value={editedSOP}
                    onChange={(e) => setEditedSOP(e.target.value)}
                    rows={28}
                    className="w-full px-0 py-0 text-sm text-gray-700 leading-relaxed resize-y focus:outline-none border-0 focus:ring-0"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  />
                  <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleScore(editedSOP)}
                      disabled={scoreLoading || !editedSOP.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-md hover:shadow-indigo-300/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                      {scoreLoading ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                            <RefreshCw className="w-4 h-4" />
                          </motion.div>
                          Scoring…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Re-score My Edits
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={!editedSOP.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      Download as Text
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT — Score Card (40%) */}
              <div className="lg:w-[40%] flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  {scoreLoading ? (
                    <ScoreSkeleton />
                  ) : scoreResult ? (
                    <motion.div
                      key={scoreResult.total_score}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {/* Score Circle */}
                      <ScoreCircle score={scoreResult.total_score} />
                      <div className="text-center mt-3 mb-4">
                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">SOP Score</p>
                        <VerdictBadge verdict={scoreResult.verdict} />
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                          {scoreResult.verdict_description}
                        </p>
                      </div>

                      {/* Dimension Bars */}
                      <div className="mt-4 mb-5">
                        <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-wider mb-3">
                          Dimension Breakdown
                        </h3>
                        <DimensionBar label="Clarity of Purpose" score={scoreResult.dimension_scores.clarity_of_purpose.score} max={2} feedback={scoreResult.dimension_scores.clarity_of_purpose.feedback} />
                        <DimensionBar label="Academic/Professional Readiness" score={scoreResult.dimension_scores.academic_readiness.score} max={2} feedback={scoreResult.dimension_scores.academic_readiness.feedback} />
                        <DimensionBar label="Depth of Reflection" score={scoreResult.dimension_scores.depth_of_reflection.score} max={1.5} feedback={scoreResult.dimension_scores.depth_of_reflection.feedback} />
                        <DimensionBar label="Career Goals" score={scoreResult.dimension_scores.career_goals.score} max={1.5} feedback={scoreResult.dimension_scores.career_goals.feedback} />
                        <DimensionBar label="Program Fit" score={scoreResult.dimension_scores.program_fit.score} max={1.5} feedback={scoreResult.dimension_scores.program_fit.feedback} />
                        <DimensionBar label="Impact & Achievements" score={scoreResult.dimension_scores.impact_achievements.score} max={1} feedback={scoreResult.dimension_scores.impact_achievements.feedback} />
                        <DimensionBar label="Originality & Authenticity" score={scoreResult.dimension_scores.originality.score} max={0.5} feedback={scoreResult.dimension_scores.originality.feedback} />
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4 bg-gray-50 rounded-xl px-4 py-2.5">
                        <span>~{scoreResult.word_count_estimate} words</span>
                        <span
                          className={`font-bold ${
                            scoreResult.ready_to_submit ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {scoreResult.ready_to_submit ? "✓ Ready to Submit" : "Not Ready Yet"}
                        </span>
                      </div>

                      {/* Collapsible sections */}
                      {scoreResult.red_flags.length > 0 && (
                        <CollapsibleSection title={`🔴 Red Flags (${scoreResult.red_flags.length})`}>
                          <ul className="space-y-1.5">
                            {scoreResult.red_flags.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-red-700">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </CollapsibleSection>
                      )}

                      {scoreResult.common_mistakes_detected.length > 0 && (
                        <CollapsibleSection title={`⚠️ Common Mistakes Detected (${scoreResult.common_mistakes_detected.length})`}>
                          <ul className="space-y-1.5">
                            {scoreResult.common_mistakes_detected.map((m, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                {m}
                              </li>
                            ))}
                          </ul>
                        </CollapsibleSection>
                      )}

                      {scoreResult.generic_phrases_detected?.length > 0 && (
                        <CollapsibleSection title={`🔄 Generic Phrases to Replace (${scoreResult.generic_phrases_detected.length})`}>
                          <div className="space-y-3">
                            {scoreResult.generic_phrases_detected.map((item, i) => (
                              <div key={i} className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                                <p className="text-xs text-orange-700 font-semibold mb-1 line-through opacity-70">&ldquo;{item.original}&rdquo;</p>
                                <p className="text-xs text-emerald-700 font-medium">→ {item.suggested_rewrite}</p>
                              </div>
                            ))}
                          </div>
                        </CollapsibleSection>
                      )}

                      <CollapsibleSection title={`✅ Strengths (${scoreResult.strengths.length})`} defaultOpen>
                        <ul className="space-y-1.5">
                          {scoreResult.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </CollapsibleSection>

                      <CollapsibleSection title={`📝 Improvements (${scoreResult.improvements.length})`}>
                        <ol className="space-y-2">
                          {scoreResult.improvements.map((imp, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black flex items-center justify-center mt-0.5">
                                {i + 1}
                              </span>
                              {imp}
                            </li>
                          ))}
                        </ol>
                      </CollapsibleSection>

                      <CollapsibleSection title="💬 Section-by-Section Feedback">
                        <div className="space-y-3">
                          {(
                            [
                              ["Opening", scoreResult.section_feedback.opening],
                              ["Academic Background", scoreResult.section_feedback.academic],
                              ["Professional Experience", scoreResult.section_feedback.professional],
                              ["Why This Degree", scoreResult.section_feedback.why_degree],
                              ["Career Goals", scoreResult.section_feedback.career_goals],
                              ["Why This University", scoreResult.section_feedback.why_university],
                              ["Conclusion", scoreResult.section_feedback.conclusion],
                            ] as [string, string][]
                          ).map(([label, feedback]) => (
                            <div key={label}>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                              <p className="text-xs text-gray-600 leading-relaxed">{feedback}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleSection>

                      {/* CTA */}
                      <div className="mt-5 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 mb-3">Happy with your SOP?</p>
                        <Link
                          href="/get-started"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-md hover:shadow-indigo-300/40 hover:-translate-y-0.5 transition-all"
                        >
                          Ready to apply?
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-indigo-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-400">
                        Click &quot;Re-score My Edits&quot; to score your SOP.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </AuthGate>
  );
}

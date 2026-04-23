"use client";

import React, { useState, useEffect } from "react";
import AuthGate from "@/components/AuthGate";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  ChevronRight,
  FileText,
  TrendingUp,
  Copy,
  Download,
  Star,
  Upload,
  Loader2,
  Mail,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import { LorBriefBuilder } from "@/components/LorBriefBuilder";

// ══════════════════════════════════════════════════════════════════════════════
// Types — Application Pack Check
// ══════════════════════════════════════════════════════════════════════════════

interface WeakPhrase {
  phrase: string;
  suggestion: string;
}

interface AnalysisResult {
  readiness_score: number;
  verdict: "Ready" | "Needs Work" | "Risky";
  risk_flags: string[];
  contradictions: string[];
  weak_phrases: WeakPhrase[];
  missing_evidence: string[];
  followup_questions: string[];
}

interface AppCheckForm {
  university: string;
  course: string;
  sop: string;
  cv: string;
  profile: string;
  visa_notes: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Types — CV Assessment
// ══════════════════════════════════════════════════════════════════════════════

interface CVDimScore {
  score: number;
  max: number;
  feedback: string[];
}

interface CVScoreResult {
  total_score: number;
  verdict: "Excellent" | "Strong" | "Average" | "Weak";
  verdict_description: string;
  dimension_scores: {
    clarity_structure: CVDimScore;
    academic_strength: CVDimScore;
    relevance_to_program: CVDimScore;
    impact_achievements: CVDimScore;
    leadership: CVDimScore;
    originality: CVDimScore;
  };
  red_flags: string[];
  strengths: string[];
  improvements: string[];
  missing_sections: string[];
}

interface CVInputForm {
  university: string;
  course: string;
  degree_level: string;
  cv_text: string;
}

interface CVBuilderData {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  profile_summary: string;
  education: string;
  projects: string;
  experience: string;
  skills: string;
  achievements: string;
  extracurricular: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// Helpers — Application Pack Check
// ══════════════════════════════════════════════════════════════════════════════

function getScoreColour(score: number) {
  if (score >= 75) return { ring: "stroke-emerald-500", fill: "text-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 50) return { ring: "stroke-amber-500", fill: "text-amber-600", text: "text-amber-700", bg: "bg-amber-50 border-amber-200" };
  return { ring: "stroke-red-500", fill: "text-red-600", text: "text-red-700", bg: "bg-red-50 border-red-200" };
}

function getVerdictConfig(verdict: AnalysisResult["verdict"]) {
  switch (verdict) {
    case "Ready": return {
      label: "Ready",
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
    case "Needs Work": return {
      label: "Needs Work",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      badge: "bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
    case "Risky": return {
      label: "Risky",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      badge: "bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Helpers — CV Assessment
// ══════════════════════════════════════════════════════════════════════════════

function getCVScoreColour(score: number) {
  if (score >= 9) return { ring: "stroke-emerald-500", fill: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" };
  if (score >= 7) return { ring: "stroke-blue-500", fill: "text-blue-600", bg: "bg-blue-50 border-blue-200" };
  if (score >= 5) return { ring: "stroke-amber-500", fill: "text-amber-600", bg: "bg-amber-50 border-amber-200" };
  return { ring: "stroke-red-500", fill: "text-red-600", bg: "bg-red-50 border-red-200" };
}

function getCVVerdictConfig(verdict: CVScoreResult["verdict"]) {
  switch (verdict) {
    case "Excellent": return {
      label: "Excellent",
      icon: <Star className="w-5 h-5 text-emerald-600 fill-emerald-500" />,
      badge: "bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
    case "Strong": return {
      label: "Strong",
      icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
      badge: "bg-blue-100 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
    case "Average": return {
      label: "Average — Needs Work",
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      badge: "bg-amber-100 text-amber-700 border border-amber-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
    case "Weak": return {
      label: "Weak — Major Revisions Needed",
      icon: <XCircle className="w-5 h-5 text-red-600" />,
      badge: "bg-red-100 text-red-700 border border-red-200 px-4 py-1.5 rounded-full text-sm font-bold",
    };
  }
}

const DIM_COLORS: Record<string, { bar: string; label: string }> = {
  clarity_structure:    { bar: "bg-indigo-500", label: "Clarity & Structure" },
  academic_strength:    { bar: "bg-blue-500",   label: "Academic Strength" },
  relevance_to_program: { bar: "bg-violet-500", label: "Relevance to Program" },
  impact_achievements:  { bar: "bg-emerald-500",label: "Impact & Achievements" },
  leadership:           { bar: "bg-amber-500",  label: "Leadership" },
  originality:          { bar: "bg-pink-500",   label: "Originality & Profile Fit" },
};

// ══════════════════════════════════════════════════════════════════════════════
// Shared sub-components
// ══════════════════════════════════════════════════════════════════════════════

function ScoreCircle({ score }: { score: number }) {
  const c = getScoreColour(score);
  const r = 54, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          className={c.ring} style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="relative text-center">
        <p className={`text-4xl font-black ${c.fill}`}>{score}</p>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">/ 100</p>
      </div>
    </div>
  );
}

function CVScoreCircle({ score }: { score: number }) {
  const c = getCVScoreColour(score);
  const r = 54, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center mx-auto">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="72" cy="72" r={r} fill="none" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${(score / 10) * circ} ${circ}`}
          className={c.ring} style={{ transition: "stroke-dasharray 1s ease" }} />
      </svg>
      <div className="relative text-center">
        <p className={`text-4xl font-black ${c.fill}`}>{score.toFixed(1)}</p>
        <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">/ 10</p>
      </div>
    </div>
  );
}

function ResultCard({ title, icon, children, accent }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent: string;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 ${accent}`}>
      <div className="flex items-center gap-2.5 mb-4">
        {icon}
        <h3 className="font-extrabold text-gray-900 text-base">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function DimensionBar({ dimKey, dim }: { dimKey: string; dim: CVDimScore }) {
  const cfg = DIM_COLORS[dimKey] ?? { bar: "bg-gray-500", label: dimKey };
  const pct = Math.round((dim.score / dim.max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-semibold text-gray-700">{cfg.label}</span>
        <span className="text-sm font-black text-gray-900">
          {dim.score}<span className="text-xs font-semibold text-gray-400">/{dim.max}</span>
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-2 ${cfg.bar} rounded-full`} />
      </div>
      <ul className="mt-1.5 space-y-0.5">
        {dim.feedback.map((f, i) => (
          <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
            <span className="mt-1 w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Loading screens
// ══════════════════════════════════════════════════════════════════════════════

function LoadingScreen({ color, icon, title, subtitle, tags }: {
  color: string; icon: React.ReactNode; title: string; subtitle: string; tags: string[];
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className={`relative w-20 h-20 mx-auto mb-6`}>
          <div className={`absolute inset-0 rounded-full border-4 ${color}-100`} />
          <div className={`absolute inset-0 rounded-full border-4 border-t-${color}-500 animate-spin`} />
          <div className="absolute inset-0 flex items-center justify-center">{icon}</div>
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{subtitle}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {tags.map((label, i) => (
            <motion.span key={label} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              className={`text-xs text-${color}-400 font-medium bg-${color}-50 px-3 py-1 rounded-full`}>
              {label}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// File upload helper
// ══════════════════════════════════════════════════════════════════════════════

function useFileUpload(onExtracted: (text: string) => void) {
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  async function handleFile(file: File) {
    setUploadError(null);
    // .txt handled client-side instantly
    if (file.name.endsWith(".txt")) {
      const text = await file.text();
      onExtracted(text.trim());
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-text", { method: "POST", body: fd });
      const data = await res.json() as { text?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Extraction failed");
      onExtracted(data.text ?? "");
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return { uploading, uploadError, handleFile, clearError: () => setUploadError(null) };
}

function UploadButton({
  onFile,
  uploading,
  accept = ".txt,.pdf,.docx,.doc",
  id,
}: {
  onFile: (f: File) => void;
  uploading: boolean;
  accept?: string;
  id: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none
        ${uploading
          ? "border-indigo-200 bg-indigo-50 text-indigo-400 cursor-not-allowed"
          : "border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
        }`}
      title="Upload .txt, .pdf, or .docx"
    >
      {uploading
        ? <><Loader2 className="w-3 h-3 animate-spin" /> Extracting…</>
        : <><Upload className="w-3 h-3" /> Upload file</>}
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={uploading}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ""; } }}
      />
    </label>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main page
// ══════════════════════════════════════════════════════════════════════════════

export default function ApplicationCheckPage() {
  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"check" | "cv" | "lor">("check");

  // Deep-link: /application-check?tab=cv or ?tab=lor opens that tab directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "cv") setActiveTab("cv");
    else if (params.get("tab") === "lor") setActiveTab("lor");
  }, []);

  // ── App Check state ───────────────────────────────────────────────────────
  const [step, setStep] = useState<"form" | "loading" | "results">("form");
  const [form, setForm] = useState<AppCheckForm>({ university: "", course: "", sop: "", cv: "", profile: "", visa_notes: "" });
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── CV Assessment state ───────────────────────────────────────────────────
  type CVStep = "form" | "loading_score" | "scored" | "builder_form" | "loading_build" | "built";
  const [cvStep, setCvStep] = useState<CVStep>("form");
  const [cvInputForm, setCvInputForm] = useState<CVInputForm>({ university: "", course: "", degree_level: "Masters", cv_text: "" });
  const [cvScoreResult, setCvScoreResult] = useState<CVScoreResult | null>(null);
  const [cvBuilderData, setCvBuilderData] = useState<CVBuilderData>({
    full_name: "", email: "", phone: "", location: "", linkedin: "",
    profile_summary: "", education: "", projects: "", experience: "",
    skills: "", achievements: "", extracurricular: "",
  });
  const [builtCV, setBuiltCV] = useState("");
  const [cvError, setCvError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Upload hooks — App Check ──────────────────────────────────────────────
  const sopUpload   = useFileUpload((t) => setForm((p) => ({ ...p, sop: p.sop ? p.sop + "\n\n" + t : t })));
  const cvUpload    = useFileUpload((t) => setForm((p) => ({ ...p, cv: p.cv ? p.cv + "\n\n" + t : t })));
  const profUpload  = useFileUpload((t) => setForm((p) => ({ ...p, profile: p.profile ? p.profile + " " + t : t })));

  // ── Upload hooks — CV Assessment ─────────────────────────────────────────
  const cvAssessUpload = useFileUpload((t) => setCvInputForm((p) => ({ ...p, cv_text: p.cv_text ? p.cv_text + "\n\n" + t : t })));

  // ── App Check handlers ────────────────────────────────────────────────────

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.university.trim() || !form.course.trim()) return;
    setError(null);
    setStep("loading");
    try {
      const res = await fetch("/api/application-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          university: form.university, course: form.course,
          sop: form.sop || undefined, cv: form.cv || undefined,
          profile: form.profile || undefined, visa_notes: form.visa_notes || undefined,
        }),
      });
      const data = (await res.json()) as AnalysisResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
      setStep("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("form");
    }
  }

  function handleReset() { setStep("form"); setResult(null); setError(null); }

  // ── CV handlers ───────────────────────────────────────────────────────────

  function handleCVInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setCvInputForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleBuilderChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setCvBuilderData((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleCVScore(e: React.FormEvent) {
    e.preventDefault();
    if (!cvInputForm.cv_text.trim() || !cvInputForm.university.trim() || !cvInputForm.course.trim()) return;
    setCvError(null);
    setCvStep("loading_score");
    try {
      const res = await fetch("/api/cv-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "score", ...cvInputForm }),
      });
      const data = (await res.json()) as CVScoreResult & { error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "CV scoring failed");
      setCvScoreResult(data);
      setCvStep("scored");
    } catch (err: unknown) {
      setCvError(err instanceof Error ? err.message : "Something went wrong");
      setCvStep("form");
    }
  }

  async function handleCVBuild(e: React.FormEvent) {
    e.preventDefault();
    if (!cvBuilderData.full_name.trim() || !cvBuilderData.education.trim() || !cvBuilderData.skills.trim()) return;
    setCvError(null);
    setCvStep("loading_build");
    try {
      const res = await fetch("/api/cv-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "build",
          university: cvInputForm.university,
          course: cvInputForm.course,
          degree_level: cvInputForm.degree_level,
          ...cvBuilderData,
        }),
      });
      const data = (await res.json()) as { cv?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error ?? "CV build failed");
      setBuiltCV(data.cv ?? "");
      setCvStep("built");
    } catch (err: unknown) {
      setCvError(err instanceof Error ? err.message : "Something went wrong");
      setCvStep("builder_form");
    }
  }

  function handleCVReset() {
    setCvStep("form"); setCvScoreResult(null); setBuiltCV(""); setCvError(null);
    setCvBuilderData({ full_name: "", email: "", phone: "", location: "", linkedin: "", profile_summary: "", education: "", projects: "", experience: "", skills: "", achievements: "", extracurricular: "" });
  }

  async function handleCopy() {
    try { await navigator.clipboard.writeText(builtCV); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  function handleDownload() {
    const blob = new Blob([builtCV], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(cvBuilderData.full_name || "my").replace(/\s+/g, "_")}_CV.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Nav ───────────────────────────────────────────────────────────────────

  const Nav = () => (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg shadow-black/20">
      <Link href="/" className="flex items-center gap-3 py-4 flex-shrink-0">
        <EduvianLogoMark size={36} />
        <div>
          <span className="font-display font-bold text-base text-white tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
          <p className="text-[10px] text-indigo-300 leading-none font-medium">Your Global Future, Simplified</p>
        </div>
      </Link>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link href="/" className="flex items-center gap-1.5 px-4 py-2 my-3 rounded-xl border border-white/15 text-slate-300 text-sm font-semibold hover:border-white/30 hover:text-white transition-all">
          <ArrowLeft className="w-3.5 h-3.5" /> Home
        </Link>
        <Link href="/get-started" className="flex items-center gap-2 px-5 py-2.5 my-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5">
          Get Started Free <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </nav>
  );

  // ── Full-screen loading views ─────────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
        <Nav />
        <LoadingScreen
          color="indigo"
          icon={<Sparkles className="w-7 h-7 text-indigo-500 animate-pulse" />}
          title="Analysing your application…"
          subtitle="Our AI is checking for credibility, consistency, and risk signals. This usually takes 10–20 seconds."
          tags={["Reviewing SOP", "Checking consistency", "Generating insights"]}
        />
      </div>
    );
  }

  if (cvStep === "loading_score" || cvStep === "loading_build") {
    const isBuild = cvStep === "loading_build";
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30 font-sans">
        <Nav />
        <LoadingScreen
          color="violet"
          icon={<FileText className="w-7 h-7 text-violet-500 animate-pulse" />}
          title={isBuild ? "Building your CV…" : "Scoring your CV…"}
          subtitle={isBuild
            ? "Crafting an admission-ready CV tailored to your target program. This takes 15–25 seconds."
            : "Evaluating your CV across 6 dimensions. This usually takes 10–15 seconds."}
          tags={isBuild
            ? ["Profile summary", "Education section", "Impact bullets", "Final polish"]
            : ["Structure check", "Academic depth", "Impact analysis", "Scoring dimensions"]}
        />
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <AuthGate stage={2} toolName="Application Story Check" source="application-check">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
      <Nav />

      {/* Tab bar */}
      <div className="pt-20 px-4">
        <div className="max-w-3xl mx-auto mt-6 mb-0">
          <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1">
            <button
              onClick={() => setActiveTab("check")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === "check"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Application Pack Check
            </button>
            <button
              onClick={() => setActiveTab("cv")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === "cv"
                  ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              CV Assessment &amp; Builder
            </button>
            <button
              onClick={() => setActiveTab("lor")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === "lor"
                  ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Mail className="w-4 h-4" />
              LOR Coach
            </button>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* APPLICATION PACK CHECK TAB                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {activeTab === "check" && (
        <main className="pt-8 pb-20 px-4 max-w-2xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ── Form ── */}
            {step === "form" && (
              <motion.div key="check-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-widest mb-4">
                    <Sparkles className="w-3.5 h-3.5" /> AI Credibility Check
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                    Application Pack{" "}
                    <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">QA Analysis</span>
                  </h1>
                  <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
                    Paste your SOP, CV highlights, and profile details. Our AI analyses credibility, flags risks, and tells you what an admissions officer or visa panel would question.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Target Application</h2>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">University Name <span className="text-red-500 text-xs">(required)</span></label>
                      <input name="university" value={form.university} onChange={handleChange} required placeholder="e.g. University of Melbourne" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course / Program <span className="text-red-500 text-xs">(required)</span></label>
                      <input name="course" value={form.course} onChange={handleChange} required placeholder="e.g. Master of Data Science" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">SOP / Personal Statement</label>
                      <UploadButton id="sop-upload" onFile={sopUpload.handleFile} uploading={sopUpload.uploading} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Paste your SOP or upload a .txt, .pdf, or .docx file.</p>
                    {sopUpload.uploadError && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><XCircle className="w-3 h-3" />{sopUpload.uploadError}</p>
                    )}
                    <textarea name="sop" value={form.sop} onChange={handleChange} rows={8} placeholder="Paste your SOP here — or upload a file above…" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y" />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">CV / Resume Highlights</label>
                      <UploadButton id="cv-upload" onFile={cvUpload.handleFile} uploading={cvUpload.uploading} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">Paste key CV points or upload your CV file (.txt, .pdf, .docx).</p>
                    {cvUpload.uploadError && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><XCircle className="w-3 h-3" />{cvUpload.uploadError}</p>
                    )}
                    <textarea name="cv" value={form.cv} onChange={handleChange} rows={6} placeholder="Paste CV highlights here — or upload a file above…" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y" />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Profile Summary</label>
                      <UploadButton id="profile-upload" onFile={profUpload.handleFile} uploading={profUpload.uploading} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">GPA / percentage, backlogs, work experience, English test score — or upload a profile document.</p>
                    {profUpload.uploadError && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><XCircle className="w-3 h-3" />{profUpload.uploadError}</p>
                    )}
                    <textarea name="profile" value={form.profile} onChange={handleChange} rows={3} placeholder="e.g. GPA 3.4 / 75% | No backlogs | 1 yr work exp | IELTS 7.0 — or upload a file above…" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y" />
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <label className="block text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-1.5">Visa / Interview Preparation Notes</label>
                    <p className="text-xs text-gray-400 mb-3">What will you say if asked &quot;Why this course?&quot; or &quot;Why this country?&quot; Share your planned answers.</p>
                    <textarea name="visa_notes" value={form.visa_notes} onChange={handleChange} rows={4} placeholder="e.g. Why Australia: I chose Australia because of its strong tech industry and post-study work rights…" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder-gray-400 resize-y" />
                  </div>

                  <button type="submit" disabled={!form.university.trim() || !form.course.trim()} className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-base font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">
                    <Sparkles className="w-4 h-4" /> Analyse My Application <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── Results ── */}
            {step === "results" && result && (
              <motion.div key="check-results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                <div className="text-center mb-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> Analysis Complete
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    {form.course} <span className="text-gray-400 font-normal">@</span> {form.university}
                  </h1>
                </div>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className={`rounded-2xl border p-8 text-center ${getScoreColour(result.readiness_score).bg}`}>
                  <ScoreCircle score={result.readiness_score} />
                  <p className="mt-4 text-sm text-gray-500 font-semibold uppercase tracking-wider">Overall Readiness Score</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {getVerdictConfig(result.verdict).icon}
                    <span className={getVerdictConfig(result.verdict).badge}>{getVerdictConfig(result.verdict).label}</span>
                  </div>
                </motion.div>

                {result.risk_flags.length > 0 && (
                  <ResultCard title="Top Risk Flags" icon={<XCircle className="w-5 h-5 text-red-500" />} accent="bg-red-50 border-red-200">
                    <ul className="space-y-2">
                      {result.risk_flags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-red-800">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                )}

                {result.contradictions.length > 0 && (
                  <ResultCard title="Contradictions Found" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} accent="bg-amber-50 border-amber-200">
                    <ul className="space-y-2">
                      {result.contradictions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-amber-800">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />{c}
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                )}

                {result.weak_phrases.length > 0 && (
                  <ResultCard title="Weak Phrases to Fix" icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} accent="bg-orange-50 border-orange-200">
                    <div className="space-y-3">
                      {result.weak_phrases.map((item, i) => (
                        <div key={i} className="bg-white rounded-xl border border-orange-100 p-4">
                          <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Original</p>
                          <p className="text-sm text-gray-700 mb-2 italic">&quot;{item.phrase}&quot;</p>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Suggested</p>
                          <p className="text-sm text-gray-700">{item.suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </ResultCard>
                )}

                {result.missing_evidence.length > 0 && (
                  <ResultCard title="Missing Evidence" icon={<AlertTriangle className="w-5 h-5 text-purple-500" />} accent="bg-purple-50 border-purple-200">
                    <ul className="space-y-2">
                      {result.missing_evidence.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-purple-800">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />{item}
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                )}

                {result.followup_questions.length > 0 && (
                  <ResultCard title="Probable Follow-up Questions" icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />} accent="bg-indigo-50 border-indigo-200">
                    <ol className="space-y-2 list-none">
                      {result.followup_questions.map((q, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-indigo-800">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-200 text-indigo-700 text-[11px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>{q}
                        </li>
                      ))}
                    </ol>
                  </ResultCard>
                )}

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a href="mailto:info@eduvianai.com?subject=Counsellor%20Review%20Request&body=Hi%2C%20I%20would%20like%20to%20book%20a%20counsellor%20review%20for%20my%20application."
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-300/40 hover:-translate-y-0.5 transition-all duration-200">
                    <CheckCircle2 className="w-4 h-4" /> Book a Counsellor Review <ArrowRight className="w-4 h-4" />
                  </a>
                  <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200">
                    Analyse Another Application
                  </button>
                </motion.div>

                <p className="text-center text-xs text-gray-400 pt-2">
                  This AI analysis is indicative only. Always verify requirements directly with the university and consult a qualified counsellor for critical decisions.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CV ASSESSMENT & BUILDER TAB                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}

      {activeTab === "cv" && (
        <main className="pt-8 pb-20 px-4 max-w-2xl mx-auto">
          <AnimatePresence mode="wait">

            {/* ── CV Input Form ── */}
            {cvStep === "form" && (
              <motion.div key="cv-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="text-center mb-10">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold uppercase tracking-widest mb-4">
                    <FileText className="w-3.5 h-3.5" /> AI CV Analyser
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
                    CV{" "}
                    <span className="bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent">Assessment &amp; Builder</span>
                  </h1>
                  <p className="text-gray-500 text-base leading-relaxed max-w-lg mx-auto">
                    Paste your CV for a detailed score across 6 admission dimensions — then build a powerful, tailored version that stands out.
                  </p>
                </div>

                {cvError && (
                  <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{cvError}</p>
                  </div>
                )}

                <form onSubmit={handleCVScore} className="space-y-6">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Target Program</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">University <span className="text-red-500 text-xs">(required)</span></label>
                        <input name="university" value={cvInputForm.university} onChange={handleCVInputChange} required placeholder="e.g. UCL" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Degree Level</label>
                        <select name="degree_level" value={cvInputForm.degree_level} onChange={handleCVInputChange} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition bg-white">
                          <option value="Masters">Masters</option>
                          <option value="PhD">PhD</option>
                          <option value="MBA">MBA</option>
                          <option value="Undergraduate">Undergraduate</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Course / Program <span className="text-red-500 text-xs">(required)</span></label>
                      <input name="course" value={cvInputForm.course} onChange={handleCVInputChange} required placeholder="e.g. MSc Computer Science" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                        Your CV / Resume <span className="text-red-500 text-xs">(required)</span>
                      </label>
                      <UploadButton id="cv-assess-upload" onFile={cvAssessUpload.handleFile} uploading={cvAssessUpload.uploading} />
                    </div>
                    <p className="text-xs text-gray-400 mb-3">
                      Paste your full CV as plain text, or upload a .txt, .pdf, or .docx file.
                    </p>
                    {cvAssessUpload.uploadError && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1"><XCircle className="w-3 h-3" />{cvAssessUpload.uploadError}</p>
                    )}
                    <textarea
                      name="cv_text"
                      value={cvInputForm.cv_text}
                      onChange={handleCVInputChange}
                      required
                      rows={14}
                      placeholder={`Paste your CV here…\n\nExample:\nAarav Sharma\naarav@email.com | +91-9999 | Delhi\n\nEDUCATION\nB.Tech Computer Science | XYZ University | 2022–2026 | CGPA: 8.7\n\nPROJECTS\nHouse Price Prediction – Python, Scikit-learn\n- Built regression model…\n\nSKILLS\nPython, Java, SQL, Machine Learning`}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono"
                    />
                  </div>

                  <button type="submit" disabled={!cvInputForm.cv_text.trim() || !cvInputForm.university.trim() || !cvInputForm.course.trim()}
                    className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-base font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">
                    <TrendingUp className="w-4 h-4" /> Score My CV <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* ── CV Score Results ── */}
            {cvStep === "scored" && cvScoreResult && (
              <motion.div key="cv-scored" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                <div className="text-center mb-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold uppercase tracking-widest mb-3">
                    <Sparkles className="w-3.5 h-3.5" /> CV Score Report
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">
                    {cvInputForm.course} <span className="text-gray-400 font-normal">@</span> {cvInputForm.university}
                  </h1>
                </div>

                {/* Overall score card */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className={`rounded-2xl border p-8 text-center ${getCVScoreColour(cvScoreResult.total_score).bg}`}>
                  <CVScoreCircle score={cvScoreResult.total_score} />
                  <p className="mt-4 text-sm text-gray-500 font-semibold uppercase tracking-wider">Overall CV Score</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    {getCVVerdictConfig(cvScoreResult.verdict).icon}
                    <span className={getCVVerdictConfig(cvScoreResult.verdict).badge}>{getCVVerdictConfig(cvScoreResult.verdict).label}</span>
                  </div>
                  {cvScoreResult.verdict_description && (
                    <p className="mt-3 text-sm text-gray-600 max-w-sm mx-auto italic">{cvScoreResult.verdict_description}</p>
                  )}
                </motion.div>

                {/* Dimension breakdown */}
                <ResultCard title="Dimension-by-Dimension Breakdown" icon={<TrendingUp className="w-5 h-5 text-violet-500" />} accent="bg-white border-gray-200 shadow-sm">
                  <div className="space-y-5">
                    {Object.entries(cvScoreResult.dimension_scores).map(([key, dim]) => (
                      <DimensionBar key={key} dimKey={key} dim={dim} />
                    ))}
                  </div>
                </ResultCard>

                {/* Strengths */}
                {cvScoreResult.strengths.length > 0 && (
                  <ResultCard title="What&apos;s Working" icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} accent="bg-emerald-50 border-emerald-200">
                    <ul className="space-y-2">
                      {cvScoreResult.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{s}
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                )}

                {/* Red flags */}
                {cvScoreResult.red_flags.length > 0 && (
                  <ResultCard title="Red Flags" icon={<XCircle className="w-5 h-5 text-red-500" />} accent="bg-red-50 border-red-200">
                    <ul className="space-y-2">
                      {cvScoreResult.red_flags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-red-800">
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </ResultCard>
                )}

                {/* Improvements */}
                {cvScoreResult.improvements.length > 0 && (
                  <ResultCard title="High-Impact Improvements" icon={<AlertTriangle className="w-5 h-5 text-amber-500" />} accent="bg-amber-50 border-amber-200">
                    <ol className="space-y-3">
                      {cvScoreResult.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-amber-800">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-700 text-[11px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                          {imp}
                        </li>
                      ))}
                    </ol>
                  </ResultCard>
                )}

                {/* Build CV CTA */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 p-6 text-white text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-extrabold mb-2">Build Your Stronger CV</h3>
                  <p className="text-sm text-white/80 mb-5 max-w-xs mx-auto">
                    Our AI will craft an admission-ready CV for {cvInputForm.course}, addressing every weak point identified above.
                  </p>
                  <button
                    onClick={() => setCvStep("builder_form")}
                    className="px-8 py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-white/90 transition-all duration-200 shadow-lg text-sm"
                  >
                    Build My CV Now →
                  </button>
                </motion.div>

                <button onClick={handleCVReset} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:border-violet-300 hover:text-violet-600 transition-all duration-200">
                  Score a Different CV
                </button>
              </motion.div>
            )}

            {/* ── CV Builder Form ── */}
            {cvStep === "builder_form" && (
              <motion.div key="cv-builder" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold uppercase tracking-widest mb-4">
                    <FileText className="w-3.5 h-3.5" /> CV Builder
                  </div>
                  <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-2">
                    Tell us about yourself
                  </h1>
                  <p className="text-gray-500 text-sm max-w-lg mx-auto">
                    Fill in your details below. The more you share, the stronger we can make your CV for <strong>{cvInputForm.course}</strong> at <strong>{cvInputForm.university}</strong>.
                  </p>
                </div>

                {cvError && (
                  <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /><p>{cvError}</p>
                  </div>
                )}

                <form onSubmit={handleCVBuild} className="space-y-5">

                  {/* Personal details */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-black flex items-center justify-center">1</span>
                      Personal Details
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500 text-xs">(required)</span></label>
                        <input name="full_name" value={cvBuilderData.full_name} onChange={handleBuilderChange} required placeholder="e.g. Aarav Sharma" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
                        <input name="email" value={cvBuilderData.email} onChange={handleBuilderChange} placeholder="your@email.com" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                        <input name="phone" value={cvBuilderData.phone} onChange={handleBuilderChange} placeholder="+91-9999999999" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">City, Country</label>
                        <input name="location" value={cvBuilderData.location} onChange={handleBuilderChange} placeholder="e.g. Mumbai, India" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">LinkedIn URL <span className="text-gray-400 text-xs">(optional)</span></label>
                        <input name="linkedin" value={cvBuilderData.linkedin} onChange={handleBuilderChange} placeholder="linkedin.com/in/yourname" className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Profile summary */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-black flex items-center justify-center">2</span>
                      Profile Summary
                      <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full normal-case tracking-normal">Recommended</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">2–3 sentences: who you are → what you&apos;ve done → what you aim to do. Leave blank and we&apos;ll write one for you.</p>
                    <textarea name="profile_summary" value={cvBuilderData.profile_summary} onChange={handleBuilderChange} rows={3} placeholder="e.g. Computer Science undergraduate with strong foundations in ML and backend systems. Experienced in building scalable APIs and optimising model performance. Aiming to specialise in production-grade intelligent systems through the MSc CS program." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y" />
                  </div>

                  {/* Education */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-black flex items-center justify-center">3</span>
                      Education <span className="text-red-500 text-xs">(required)</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">Include: university name, degree, graduation year, CGPA, and 3–5 relevant subjects. Mention any academic awards.</p>
                    <textarea name="education" value={cvBuilderData.education} onChange={handleBuilderChange} required rows={5} placeholder={`e.g.\nB.Tech Computer Science | XYZ University | 2022–2026 | CGPA: 8.7/10\nRelevant Coursework: Machine Learning, Data Structures & Algorithms, Database Systems, Operating Systems, Statistics\nAchievement: University Merit Scholarship (Top 5% of batch of 300)`} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono" />
                  </div>

                  {/* Projects */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-black flex items-center justify-center">4</span>
                      Projects &amp; Research
                      <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full normal-case tracking-normal">Critical</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">For each project: title, tools used, what you built, and the outcome or impact. Include 2–3 projects.</p>
                    <textarea name="projects" value={cvBuilderData.projects} onChange={handleBuilderChange} rows={7} placeholder={`e.g.\nHouse Price Prediction (Machine Learning)\n- Used Python and Scikit-learn to build a regression model\n- Improved prediction accuracy by 20% through feature selection\n- Reduced overfitting using cross-validation on 50,000 data points\n\nInventory Management System (Web Dev)\n- Built REST APIs using Java Spring Boot for 3 internal teams\n- Reduced manual tracking errors by 40%`} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono" />
                  </div>

                  {/* Work experience */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-black flex items-center justify-center">5</span>
                      Work Experience / Internships
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full normal-case tracking-normal">if any</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">Company, role, dates. For each responsibility, include what you did AND the measurable impact.</p>
                    <textarea name="experience" value={cvBuilderData.experience} onChange={handleBuilderChange} rows={5} placeholder={`e.g.\nSoftware Engineering Intern | ABC Tech | May–Aug 2025\n- Developed backend APIs using Java and Spring Boot for internal logistics system\n- Reduced API response time by 15% through database query optimisation\n- Collaborated with 5-person team to ship 3 features in 12 weeks`} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono" />
                  </div>

                  {/* Skills */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-violet-500 text-white text-[11px] font-black flex items-center justify-center">6</span>
                      Skills <span className="text-red-500 text-xs">(required)</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">List your technical skills, tools, and frameworks. Group them if possible.</p>
                    <textarea name="skills" value={cvBuilderData.skills} onChange={handleBuilderChange} required rows={3} placeholder={`e.g.\nProgramming: Python, Java, SQL, JavaScript\nTools/Frameworks: Scikit-learn, Spring Boot, Git, MySQL, React\nConcepts: Machine Learning, Data Structures, REST APIs, Agile`} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono" />
                  </div>

                  {/* Achievements */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-gray-300 text-white text-[11px] font-black flex items-center justify-center">7</span>
                      Achievements &amp; Awards
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full normal-case tracking-normal">optional</span>
                    </h2>
                    <textarea name="achievements" value={cvBuilderData.achievements} onChange={handleBuilderChange} rows={3} placeholder={`e.g.\nUniversity Merit Scholarship – Top 5% of batch (2023, 2024)\nFinalist – Inter-college Hackathon (Top 20 of 500 teams)\nNational Mathematics Olympiad – State Level Qualifier`} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono" />
                  </div>

                  {/* Extracurricular */}
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-gray-300 text-white text-[11px] font-black flex items-center justify-center">8</span>
                      Extracurricular &amp; Leadership
                      <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full normal-case tracking-normal">optional</span>
                    </h2>
                    <p className="text-xs text-gray-400 mb-3">Club memberships (include your role), volunteering, sports, community work. Add numbers if possible.</p>
                    <textarea name="extracurricular" value={cvBuilderData.extracurricular} onChange={handleBuilderChange} rows={3} placeholder={`e.g.\nCore Member, Coding Club – organised 5 technical workshops for 100+ students\nVolunteer – taught basic programming to underprivileged students (2 batches, 30 students)`} className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition placeholder-gray-400 resize-y font-mono" />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button type="button" onClick={() => setCvStep("scored")} className="sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:border-violet-300 hover:text-violet-600 transition-all duration-200">
                      <ArrowLeft className="w-4 h-4" /> Back to Score
                    </button>
                    <button type="submit" disabled={!cvBuilderData.full_name.trim() || !cvBuilderData.education.trim() || !cvBuilderData.skills.trim()}
                      className="flex-1 flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-base font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300/50 hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none">
                      <Sparkles className="w-4 h-4" /> Generate My CV <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── Built CV ── */}
            {cvStep === "built" && builtCV && (
              <motion.div key="cv-built" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="space-y-5">
                <div className="text-center mb-2">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold uppercase tracking-widest mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" /> CV Ready
                  </div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Your Admission-Ready CV</h1>
                  <p className="text-gray-500 text-sm mt-1">Tailored for {cvInputForm.course} at {cvInputForm.university}</p>
                </div>

                {/* CV preview */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">CV Preview</span>
                    <div className="flex gap-2">
                      <button onClick={handleCopy}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${copied ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700"}`}>
                        <Copy className="w-3 h-3" />
                        {copied ? "Copied!" : "Copy"}
                      </button>
                      <button onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-violet-100 hover:text-violet-700 transition-all duration-200">
                        <Download className="w-3 h-3" /> Download .txt
                      </button>
                    </div>
                  </div>
                  <pre className="p-6 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto">
                    {builtCV}
                  </pre>
                </motion.div>

                {/* Tips */}
                <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
                  <h3 className="font-extrabold text-violet-800 text-sm mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-violet-500 text-violet-500" /> Next Steps
                  </h3>
                  <ul className="space-y-2">
                    {[
                      "Copy this into Google Docs or Word and format with your preferred font (Arial 11pt recommended)",
                      "Add any missing links, portfolio URLs, or GitHub profile",
                      "Review each bullet — add any specific numbers or context you know better than we do",
                      "Keep it to one page for Masters applications (two pages acceptable for PhD/MBA)",
                      "Upload to your application portal alongside your SOP",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-violet-700">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="mailto:info@eduvianai.com?subject=CV%20Review%20Request&body=Hi%2C%20I%20would%20like%20a%20counsellor%20to%20review%20my%20CV."
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-violet-300/40 hover:-translate-y-0.5 transition-all duration-200">
                    <CheckCircle2 className="w-4 h-4" /> Get Expert Review <ArrowRight className="w-4 h-4" />
                  </a>
                  <button onClick={handleCVReset} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-bold hover:border-violet-300 hover:text-violet-600 transition-all duration-200">
                    Start Over
                  </button>
                </div>

                <p className="text-center text-xs text-gray-400 pt-1">
                  AI-generated draft. Review all content carefully and personalise before submitting to universities.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      )}

      {activeTab === "lor" && (
        <main className="pt-8 pb-20 px-4 max-w-6xl mx-auto">
          <LorBriefBuilder />
        </main>
      )}
    </div>
    </AuthGate>
  );
}

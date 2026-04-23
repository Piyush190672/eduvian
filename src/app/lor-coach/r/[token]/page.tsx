"use client";

import { useState, useMemo, useEffect, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Copy,
  Download,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Sparkles,
  Upload,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import {
  decodeBrief,
  type LorBrief,
  type LorProgram,
  type RecommenderInputs,
  type GeneratedLetter,
} from "@/lib/lor-coach";

// ── Scorecard types (mirrors /api/lor-coach assess response) ─────────────────
interface DimensionScore {
  score: number;
  max: number;
  feedback: string[];
}
interface AssessResult {
  total_score: number;
  verdict: "Strong Recommendation" | "Solid" | "Middling" | "Weak / Generic";
  verdict_description: string;
  dimension_scores: {
    recommender_credibility: DimensionScore;
    first_hand_observation: DimensionScore;
    comparative_ranking: DimensionScore;
    trait_evidence: DimensionScore;
    program_fit: DimensionScore;
    tone_authenticity: DimensionScore;
    concerns_handled: DimensionScore;
  };
  red_flags: string[];
  generic_phrases: { original: string; suggested_rewrite: string }[];
  missing_elements: string[];
  standout_moments_detected: string[];
  suggested_strengthening_rewrites: { original_paragraph_snippet: string; rewrite: string }[];
  word_count_estimate: number;
  ready_to_send: boolean;
}

const DIM_LABELS: Record<keyof AssessResult["dimension_scores"], string> = {
  recommender_credibility: "Recommender credibility",
  first_hand_observation: "First-hand observation",
  comparative_ranking: "Comparative ranking",
  trait_evidence: "Trait evidence",
  program_fit: "Program fit",
  tone_authenticity: "Tone authenticity",
  concerns_handled: "Concerns handled",
};

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg shadow-black/20">
      <Link href="/" className="flex items-center gap-3 py-4 flex-shrink-0">
        <EduvianLogoMark size={36} />
        <div>
          <span className="font-display font-bold text-base text-white tracking-tight">
            eduvian<span className="text-indigo-300">AI</span>
          </span>
          <p className="text-[10px] text-indigo-300 leading-none font-medium">LOR Coach · Recommender</p>
        </div>
      </Link>
      <Link
        href="/"
        className="flex items-center gap-1.5 px-4 py-2 my-3 rounded-xl border border-white/15 text-slate-300 text-sm font-semibold hover:border-white/30 hover:text-white transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Home
      </Link>
    </nav>
  );
}

function verdictColor(v: AssessResult["verdict"]): { bg: string; text: string; ring: string } {
  switch (v) {
    case "Strong Recommendation":
      return { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-200" };
    case "Solid":
      return { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-200" };
    case "Middling":
      return { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-200" };
    case "Weak / Generic":
    default:
      return { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-200" };
  }
}

export default function RecommenderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const brief = useMemo<LorBrief | null>(() => decodeBrief(token), [token]);

  if (!brief) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
        <Nav />
        <main className="pt-32 pb-20 px-4 max-w-lg mx-auto">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
              <XCircle className="w-7 h-7 text-red-600" />
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-2">Link invalid or expired</h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">
              This LOR Coach link could not be decoded. Ask the student to regenerate a fresh link and try again.
            </p>
            <Link
              href="/application-check?tab=lor"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
            >
              Back to LOR Coach
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <RecommenderApp brief={brief} />;
}

function RecommenderApp({ brief }: { brief: LorBrief }) {
  const [tab, setTab] = useState<"draft" | "check">("draft");
  const [highlightsExpanded, setHighlightsExpanded] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 font-sans">
      <Nav />
      <main className="pt-24 pb-20 px-4 max-w-5xl mx-auto">
        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <span className="text-xs font-extrabold text-rose-700 uppercase tracking-widest">
              Brief from {brief.student_name}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Student</p>
                <p className="text-sm font-semibold text-gray-900">{brief.student_name}</p>
              </div>
              {brief.field_of_interest && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Field</p>
                  <p className="text-sm text-gray-700">{brief.field_of_interest}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recommender</p>
                <p className="text-sm font-semibold text-gray-900">{brief.recommender_name}</p>
                <p className="text-xs text-gray-500">{brief.recommender_role}</p>
              </div>
              {brief.deadline && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Earliest deadline</p>
                  <p className="text-sm text-gray-700">{brief.deadline}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Target programs ({brief.target_programs.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {brief.target_programs.map((p, i) => (
                  <div key={i} className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 leading-tight">{p.program_name}</p>
                    <p className="text-[10px] text-gray-500">
                      {p.university_name}
                      {p.country ? ` · ${p.country}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Highlights</p>
            <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
              {highlightsExpanded || brief.applicant_highlights.length <= 200
                ? brief.applicant_highlights
                : brief.applicant_highlights.slice(0, 200) + "…"}
            </p>
            {brief.applicant_highlights.length > 200 && (
              <button
                onClick={() => setHighlightsExpanded((v) => !v)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 mt-1"
              >
                {highlightsExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 mb-6 max-w-xl mx-auto">
          <button
            onClick={() => setTab("draft")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === "draft"
                ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            ✍️ Draft from scratch
          </button>
          <button
            onClick={() => setTab("check")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              tab === "check"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            🔍 Check existing letter
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "draft" && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <DraftTab brief={brief} />
            </motion.div>
          )}
          {tab === "check" && (
            <motion.div
              key="check"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <CheckTab brief={brief} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Draft tab ────────────────────────────────────────────────────────────────

function DraftTab({ brief }: { brief: LorBrief }) {
  const [inputs, setInputs] = useState<RecommenderInputs>({
    how_long_known: "",
    capacity: "",
    comparative_rank: "",
    standout_moments: "",
    strengths_to_emphasise: "",
    specific_concerns: "",
    tone: "warm",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letters, setLetters] = useState<GeneratedLetter[] | null>(null);

  const canSubmit =
    inputs.how_long_known.trim() &&
    inputs.capacity.trim() &&
    inputs.standout_moments.trim().length > 20;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lor-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          brief,
          recommender: inputs,
          programs: brief.target_programs,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Generation failed");
      setLetters(data.letters as GeneratedLetter[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[90] bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-700">
            Drafting letters for {brief.target_programs.length} program
            {brief.target_programs.length === 1 ? "" : "s"}…
          </p>
          <p className="text-xs text-gray-400 mt-1">This takes 15-30 seconds.</p>
        </div>
      </div>
    );
  }

  if (letters) {
    return <LettersDisplay letters={letters} onBack={() => setLetters(null)} />;
  }

  return (
    <form onSubmit={handleGenerate} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
          Your side: 2-minute input
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              How long have you known {brief.student_name}? <span className="text-red-400">*</span>
            </label>
            <input
              value={inputs.how_long_known}
              onChange={(e) => setInputs((p) => ({ ...p, how_long_known: e.target.value }))}
              placeholder="e.g. 3 years"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              In what capacity? <span className="text-red-400">*</span>
            </label>
            <input
              value={inputs.capacity}
              onChange={(e) => setInputs((p) => ({ ...p, capacity: e.target.value }))}
              placeholder="e.g. as thesis advisor and ML instructor"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Comparative ranking (optional but powerful)
          </label>
          <input
            value={inputs.comparative_rank}
            onChange={(e) => setInputs((p) => ({ ...p, comparative_rank: e.target.value }))}
            placeholder="e.g. top 2 of ~60 students I've supervised"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Standout moments you personally observed <span className="text-red-400">*</span>
          </label>
          <textarea
            value={inputs.standout_moments}
            onChange={(e) => setInputs((p) => ({ ...p, standout_moments: e.target.value }))}
            rows={5}
            placeholder={`2-3 concrete stories. e.g.\n• In week 4 of my seminar, proposed a novel regularization that I later used in my own research.\n• Led a team of 4 through a 48h hackathon — won first place despite being the only undergrad.`}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Strengths to emphasise (from their brief)
          </label>
          <textarea
            value={inputs.strengths_to_emphasise}
            onChange={(e) => setInputs((p) => ({ ...p, strengths_to_emphasise: e.target.value }))}
            rows={3}
            placeholder="Which traits/projects from their highlights do you want woven in?"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Specific concerns to address (optional)
          </label>
          <textarea
            value={inputs.specific_concerns}
            onChange={(e) => setInputs((p) => ({ ...p, specific_concerns: e.target.value }))}
            rows={2}
            placeholder="e.g. Address the low grade in Quantum Mechanics — they had a family emergency that semester."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Tone</label>
          <select
            value={inputs.tone}
            onChange={(e) =>
              setInputs((p) => ({ ...p, tone: e.target.value as RecommenderInputs["tone"] }))
            }
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="formal">Formal</option>
            <option value="warm">Warm</option>
            <option value="detailed">Detailed</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Generation failed</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Sparkles className="w-4 h-4" />
        Draft {brief.target_programs.length} tailored letter
        {brief.target_programs.length === 1 ? "" : "s"}
      </button>
    </form>
  );
}

function LettersDisplay({
  letters,
  onBack,
}: {
  letters: GeneratedLetter[];
  onBack: () => void;
}) {
  const [openIdx, setOpenIdx] = useState(0);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  function handleCopy(idx: number, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  }

  function handleDownload(letter: GeneratedLetter) {
    const blob = new Blob([letter.letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LOR_${letter.program_key.replace(/[^a-z0-9]/gi, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleEmail(letter: GeneratedLetter) {
    const subject = encodeURIComponent(`LOR — ${letter.program_key}`);
    const body = encodeURIComponent(letter.letter);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to edit inputs
        </button>
        <p className="text-xs text-gray-500">
          {letters.length} letter{letters.length === 1 ? "" : "s"} drafted
        </p>
      </div>

      {letters.map((letter, i) => {
        const isOpen = openIdx === i;
        return (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-extrabold text-gray-900 truncate">{letter.program_key}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {letter.word_count} words · {letter.program_specifics_used.length} program specifics
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {letter.program_specifics_used.slice(0, 2).map((s, j) => (
                  <span
                    key={j}
                    className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold"
                  >
                    {s.length > 30 ? s.slice(0, 30) + "…" : s}
                  </span>
                ))}
                <span className="text-gray-400 text-xs ml-2">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 p-6 space-y-4">
                {letter.program_specifics_used.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {letter.program_specifics_used.map((s, j) => (
                      <span
                        key={j}
                        className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800 leading-relaxed bg-gray-50 border border-gray-100 rounded-xl p-5">
                  {letter.letter}
                </pre>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopy(i, letter.letter)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                  >
                    {copiedIdx === i ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedIdx === i ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleDownload(letter)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download .txt
                  </button>
                  <button
                    onClick={() => handleEmail(letter)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email to self
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Check existing letter tab ───────────────────────────────────────────────

function CheckTab({ brief }: { brief: LorBrief }) {
  const [letterText, setLetterText] = useState("");
  const [selectedProgramIdx, setSelectedProgramIdx] = useState(0); // 0 = first program; -1 = none
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessResult | null>(null);

  const selected: LorProgram | null =
    selectedProgramIdx >= 0 && selectedProgramIdx < brief.target_programs.length
      ? brief.target_programs[selectedProgramIdx]
      : null;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/extract-text", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Extraction failed");
      setLetterText((prev) => (prev ? prev + "\n\n" + data.text : data.text));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAssess(e: React.FormEvent) {
    e.preventDefault();
    if (!letterText.trim() || letterText.trim().length < 100) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/lor-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "assess",
          letter_text: letterText,
          university: selected?.university_name,
          course: selected?.program_name,
          student_name: brief.student_name,
          recommender_role: brief.recommender_role,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "Assessment failed");
      setResult(data as AssessResult);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[90] bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-700">Scoring letter across 7 dimensions…</p>
          <p className="text-xs text-gray-400 mt-1">This takes 10-20 seconds.</p>
        </div>
      </div>
    );
  }

  if (result) {
    return <AssessResultView result={result} onBack={() => setResult(null)} />;
  }

  return (
    <form onSubmit={handleAssess} className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
          Paste or upload the existing letter
        </h2>
        <textarea
          value={letterText}
          onChange={(e) => setLetterText(e.target.value)}
          rows={14}
          placeholder="Paste the full letter text here…"
          className="w-full px-3 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y font-mono"
        />
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors">
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? "Extracting…" : "Upload .txt / .pdf / .docx"}
            <input
              type="file"
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <span className="text-[11px] text-gray-400">
            {letterText.trim().split(/\s+/).filter(Boolean).length} words
          </span>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Which program is this letter for?
          </label>
          <select
            value={selectedProgramIdx}
            onChange={(e) => setSelectedProgramIdx(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            {brief.target_programs.map((p, i) => (
              <option key={i} value={i}>
                {p.program_name} · {p.university_name}
              </option>
            ))}
            <option value={-1}>None (generic check)</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold">Assessment failed</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={letterText.trim().length < 100}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-md hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText className="w-4 h-4" />
        Score this letter
      </button>
    </form>
  );
}

function AssessResultView({
  result,
  onBack,
}: {
  result: AssessResult;
  onBack: () => void;
}) {
  const colors = verdictColor(result.verdict);
  const circ = 2 * Math.PI * 46;
  const pct = Math.max(0, Math.min(1, result.total_score / 10));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <p className="text-xs text-gray-500">~{result.word_count_estimate} words</p>
      </div>

      {/* Score ring + verdict */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="url(#grad)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - pct)}
              />
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-900">{result.total_score.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">/ 10</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ring-1 ${colors.bg} ${colors.text} ${colors.ring} mb-3`}
            >
              {result.verdict}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{result.verdict_description}</p>
            {result.ready_to_send && (
              <p className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to send
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 7 dimensions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4">
          7-dimension breakdown
        </h3>
        <div className="space-y-4">
          {(Object.keys(DIM_LABELS) as Array<keyof typeof DIM_LABELS>).map((k) => {
            const dim = result.dimension_scores[k];
            if (!dim) return null;
            const p = (dim.score / dim.max) * 100;
            return (
              <div key={k}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-800">{DIM_LABELS[k]}</p>
                  <p className="text-xs font-black text-gray-900">
                    {dim.score}/{dim.max}
                  </p>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                    style={{ width: `${p}%` }}
                  />
                </div>
                {dim.feedback?.length > 0 && (
                  <ul className="space-y-0.5 mt-1">
                    {dim.feedback.map((f, i) => (
                      <li key={i} className="text-[11px] text-gray-500 leading-relaxed pl-3 relative">
                        <span className="absolute left-0 text-gray-300">•</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Red flags */}
      {result.red_flags?.length > 0 && (
        <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-extrabold text-red-700 uppercase tracking-wider">
              Red flags ({result.red_flags.length})
            </h3>
          </div>
          <ul className="space-y-2">
            {result.red_flags.map((f, i) => (
              <li key={i} className="text-xs text-red-800 leading-relaxed pl-3 relative">
                <span className="absolute left-0 text-red-400">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generic phrases */}
      {result.generic_phrases?.length > 0 && (
        <div className="bg-amber-50/50 rounded-2xl border border-amber-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-extrabold text-amber-700 uppercase tracking-wider">
              Generic phrases to rewrite ({result.generic_phrases.length})
            </h3>
          </div>
          <div className="space-y-3">
            {result.generic_phrases.map((g, i) => (
              <div key={i} className="bg-white rounded-xl border border-amber-100 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Original</p>
                <p className="text-xs text-gray-700 italic mb-2">&ldquo;{g.original}&rdquo;</p>
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Suggested rewrite</p>
                <p className="text-xs text-gray-800">{g.suggested_rewrite}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing elements */}
      {result.missing_elements?.length > 0 && (
        <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-extrabold text-blue-700 uppercase tracking-wider">
              Missing elements ({result.missing_elements.length})
            </h3>
          </div>
          <ul className="space-y-2">
            {result.missing_elements.map((m, i) => (
              <li key={i} className="text-xs text-blue-800 leading-relaxed pl-3 relative">
                <span className="absolute left-0 text-blue-400">•</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Standout moments detected */}
      {result.standout_moments_detected?.length > 0 && (
        <div className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider">
              Standout moments detected ({result.standout_moments_detected.length})
            </h3>
          </div>
          <ul className="space-y-2">
            {result.standout_moments_detected.map((m, i) => (
              <li key={i} className="text-xs text-emerald-800 leading-relaxed pl-3 relative">
                <span className="absolute left-0 text-emerald-400">•</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strengthening rewrites */}
      {result.suggested_strengthening_rewrites?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-extrabold text-indigo-700 uppercase tracking-wider">
              Suggested strengthening rewrites
            </h3>
          </div>
          <div className="space-y-3">
            {result.suggested_strengthening_rewrites.map((r, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Original paragraph
                </p>
                <p className="text-xs text-gray-600 italic mb-3">&ldquo;{r.original_paragraph_snippet}&rdquo;</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Rewrite</p>
                <p className="text-xs text-gray-900 leading-relaxed whitespace-pre-wrap">{r.rewrite}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Copy,
  Check,
  Search,
  X,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileSearch,
} from "lucide-react";
import { encodeBrief, type LorBrief, type LorProgram } from "@/lib/lor-coach";
import { PROGRAMS } from "@/data/programs";
import { DB_STATS } from "@/data/db-stats";

interface ProgramRow {
  university_name: string;
  program_name: string;
  degree_level?: string;
  country?: string;
  field_of_study?: string;
}
const ALL_PROGRAMS = PROGRAMS as unknown as ProgramRow[];

function ProgramPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (p: ProgramRow) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return ALL_PROGRAMS
      .filter(
        (p) =>
          p.university_name?.toLowerCase().includes(q) ||
          p.program_name?.toLowerCase().includes(q) ||
          p.field_of_study?.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-start justify-center p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[75vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by university, program, or field…"
            className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {query.trim().length < 2 && (
            <div className="p-10 text-center text-xs text-gray-400">
              Type 2+ characters to search {DB_STATS.verifiedProgramsLabel} verified programs.
            </div>
          )}
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="p-10 text-center text-xs text-gray-400">
              No matches. You can still add the program manually below.
            </div>
          )}
          {results.map((p, i) => (
            <button
              key={`${p.university_name}-${p.program_name}-${i}`}
              onClick={() => {
                onSelect(p);
                onClose();
              }}
              className="w-full text-left px-5 py-3 border-b border-gray-50 hover:bg-indigo-50/40 transition-colors"
            >
              <p className="text-sm font-semibold text-gray-900 leading-tight">{p.program_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.university_name}
                {p.country ? ` · ${p.country}` : ""}
                {p.degree_level ? ` · ${p.degree_level}` : ""}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LorBriefBuilder() {
  const [brief, setBrief] = useState<LorBrief>({
    student_name: "",
    student_email: "",
    recommender_name: "",
    recommender_role: "",
    recommender_context: "",
    applicant_highlights: "",
    target_programs: [],
    field_of_interest: "",
    deadline: "",
    created_at: new Date().toISOString(),
  });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualUni, setManualUni] = useState("");
  const [manualProg, setManualProg] = useState("");

  const canGenerate =
    brief.student_name.trim() &&
    brief.recommender_name.trim() &&
    brief.recommender_role.trim() &&
    brief.applicant_highlights.trim().length > 30 &&
    brief.target_programs.length > 0;

  const token = useMemo(() => {
    if (!canGenerate) return "";
    return encodeBrief({ ...brief, created_at: brief.created_at || new Date().toISOString() });
  }, [brief, canGenerate]);

  const shareUrl = useMemo(() => {
    if (!token) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/lor-coach/r/${token}`;
  }, [token]);

  function addProgram(p: LorProgram) {
    setBrief((prev) => {
      if (prev.target_programs.length >= 6) return prev;
      const exists = prev.target_programs.some(
        (x) =>
          x.university_name === p.university_name && x.program_name === p.program_name
      );
      if (exists) return prev;
      return { ...prev, target_programs: [...prev.target_programs, p] };
    });
  }

  function removeProgram(idx: number) {
    setBrief((prev) => ({
      ...prev,
      target_programs: prev.target_programs.filter((_, i) => i !== idx),
    }));
  }

  function handleCopyLink() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleEmail() {
    if (!shareUrl) return;
    const subject = encodeURIComponent(
      `Recommendation letter — ${brief.student_name} for ${brief.target_programs[0]?.university_name ?? "graduate programs"}`
    );
    const body = encodeURIComponent(
      `Dear ${brief.recommender_name.split(" ")[0] || "Professor"},\n\nThank you for agreeing to write me a recommendation letter. To make this as light as possible, I've prepared a short brief and target programs at the link below. You can draft a letter in the tool (tailored per program), or check an existing draft for feedback — all in under 10 minutes:\n\n${shareUrl}\n\nHappy to answer any questions.\n\nBest,\n${brief.student_name}`
    );
    const mailto = `mailto:${brief.student_email || ""}?subject=${subject}&body=${body}`;
    window.location.href = mailto;
  }

  return (
    <>
      <ProgramPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={(p) => addProgram(p)} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-700 text-sm font-bold uppercase tracking-widest mb-4">
            <Mail className="w-3.5 h-3.5" />
            LOR Coach · For recommenders
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
            Take the{" "}
            <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              &ldquo;can you write me a letter?&rdquo;
            </span>{" "}
            tax off your mentor
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-2xl mx-auto">
            Prepare a short brief about yourself and your target programs. We turn it into a private link your
            professor or manager can open to draft a per-program LOR — or check and strengthen one they already
            wrote — in under 10 minutes. No generic letters.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LEFT — Brief builder */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">You</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Your name <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={brief.student_name}
                    onChange={(e) => setBrief((p) => ({ ...p, student_name: e.target.value }))}
                    placeholder="e.g. Aditi Sharma"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Your email</label>
                  <input
                    value={brief.student_email}
                    onChange={(e) => setBrief((p) => ({ ...p, student_email: e.target.value }))}
                    placeholder="for the mailto header (optional)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Field of interest</label>
                <input
                  value={brief.field_of_interest}
                  onChange={(e) => setBrief((p) => ({ ...p, field_of_interest: e.target.value }))}
                  placeholder="e.g. Applied machine learning for climate"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Recommender</h2>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={brief.recommender_name}
                  onChange={(e) => setBrief((p) => ({ ...p, recommender_name: e.target.value }))}
                  placeholder="e.g. Prof. Rajesh Iyer"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Role & affiliation <span className="text-red-400">*</span>
                </label>
                <input
                  value={brief.recommender_role}
                  onChange={(e) => setBrief((p) => ({ ...p, recommender_role: e.target.value }))}
                  placeholder="e.g. Associate Professor, Dept. of CSE, IIT Madras"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  How they know you (1–2 lines)
                </label>
                <textarea
                  value={brief.recommender_context}
                  onChange={(e) => setBrief((p) => ({ ...p, recommender_context: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Supervised my final-year thesis on wind-power forecasting, 2023–24; also taught my Machine Learning elective."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                What you want highlighted <span className="text-red-400">*</span>
              </h2>
              <p className="text-xs text-gray-400 -mt-3">
                Feed the recommender the stories, projects, and traits you want woven in. They&apos;ll add their
                own standout moments — this is just your side.
              </p>
              <textarea
                value={brief.applicant_highlights}
                onChange={(e) => setBrief((p) => ({ ...p, applicant_highlights: e.target.value }))}
                rows={6}
                placeholder={`e.g.\n• Final-year thesis on wind-power forecasting — reduced RMSE 18% vs. baseline; published at IEEE PES 2024\n• Initiated a cross-department ML reading group (12 students, 8 weeks)\n• Interned at Ola Electric — built a recommender for charging-station placement\n• Traits to emphasise: self-directed, collaborative, technically deep`}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-y"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Earliest deadline (optional)</label>
                <input
                  type="date"
                  value={brief.deadline}
                  onChange={(e) => setBrief((p) => ({ ...p, deadline: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* RIGHT — programs + share link */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                  Target programs <span className="text-red-400">*</span>
                </h2>
                <span className="text-[10px] font-bold text-gray-400">
                  {brief.target_programs.length}/6
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                Your recommender gets a per-program draft for each. Add up to 6.
              </p>

              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full mb-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold transition-colors"
              >
                <Search className="w-4 h-4" />
                Search from database
              </button>

              {/* Manual entry */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                <input
                  value={manualUni}
                  onChange={(e) => setManualUni(e.target.value)}
                  placeholder="University"
                  className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <input
                  value={manualProg}
                  onChange={(e) => setManualProg(e.target.value)}
                  placeholder="Program"
                  className="col-span-2 px-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!manualUni.trim() || !manualProg.trim()) return;
                    addProgram({
                      university_name: manualUni.trim(),
                      program_name: manualProg.trim(),
                    });
                    setManualUni("");
                    setManualProg("");
                  }}
                  className="px-2 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 inline-flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {brief.target_programs.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">
                    No programs added yet.
                  </div>
                )}
                {brief.target_programs.map((p, i) => (
                  <div
                    key={`${p.university_name}-${p.program_name}-${i}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{p.program_name}</p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {p.university_name}
                        {p.country ? ` · ${p.country}` : ""}
                        {p.degree_level ? ` · ${p.degree_level}` : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => removeProgram(i)}
                      className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Share link card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-rose-50 via-white to-indigo-50 p-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-extrabold text-rose-700 uppercase tracking-widest">
                  Your private LOR link
                </span>
              </div>

              {!canGenerate ? (
                <p className="text-xs text-gray-500 leading-relaxed mt-2">
                  Fill your name, recommender name & role, highlights (&gt;30 chars), and add at least one target
                  program to generate the link.
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">
                    The link contains your brief (not stored on any server). Send it to your professor/manager —
                    they can draft per-program letters or score an existing one.
                  </p>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-200 mb-3">
                    <input
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-2 py-1 text-xs text-gray-600 font-mono bg-transparent outline-none truncate"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleEmail}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-rose-200 transition-all"
                    >
                      <Mail className="w-4 h-4" />
                      Email to recommender
                    </button>
                    <Link
                      href={`/lor-coach/r/${token}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Preview link
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-widest">
                  What your recommender gets
                </span>
              </div>
              <ul className="space-y-2">
                {[
                  "Your brief + target programs — pre-loaded",
                  "Quick 2-minute input: how long known, capacity, standout moments",
                  "Per-program drafts tailored to each university's specifics",
                  "Or — check & score an existing LOR draft across 7 dimensions",
                  "Download, copy, or email the final letter to themselves",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

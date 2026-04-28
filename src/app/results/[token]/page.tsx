"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Download,
  Mail,
  SlidersHorizontal,
  Loader2,
  RefreshCw,
  Filter,
  ShieldCheck,
  X,
  BarChart2,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import type { ScoredProgram, ProgramTier, StudentProfile } from "@/lib/types";
import { TARGET_COUNTRIES } from "@/lib/types";
import ProgramCard from "@/components/results/ProgramCard";
import ShortlistSummary from "@/components/results/ShortlistSummary";
import ProfileCard from "@/components/results/ProfileCard";
import NavButtons from "@/components/ui/NavButtons";
import CheckMatchPanel from "@/components/results/CheckMatchPanel";
import ChatWidget from "@/components/ChatWidget";
import ComparePanel from "@/components/results/ComparePanel";

interface ResultData {
  submission: {
    id: string;
    token: string;
    profile: Record<string, unknown>;
    shortlisted_ids: string[];
  };
  programs: ScoredProgram[];
}

const TIER_CONFIG = [
  {
    tier: "safe" as ProgramTier,
    emoji: "✅",
    label: "Safe Match",
    description: "Programs where your profile comfortably meets requirements",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    headerBg: "bg-emerald-500",
  },
  {
    tier: "reach" as ProgramTier,
    emoji: "🎯",
    label: "Reach",
    description: "Strong possibilities — your profile is competitive but not guaranteed",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    headerBg: "bg-amber-500",
  },
  {
    tier: "ambitious" as ProgramTier,
    emoji: "🚀",
    label: "Ambitious",
    description: "Stretch goals — high selectivity, but worth applying with a strong essay",
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    headerBg: "bg-rose-500",
  },
];

export default function ResultsPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [showCompare, setShowCompare] = useState(false);
  const [filters, setFilters] = useState({ country: "all", field: "all", sort: "match_score" });
  const [showFilters, setShowFilters] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  const fetchResults = useCallback(async () => {
    try {
      const res = await fetch(`/api/results/${token}`);
      if (!res.ok) throw new Error("Results not found");
      const json = await res.json();
      setData(json);
      setShortlisted(new Set(json.submission.shortlisted_ids ?? []));
    } catch {
      setError("Could not load your results. Please check the link.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  function toggleCompare(programId: string) {
    setCompareSet((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else if (next.size < 5) {
        next.add(programId);
      } else {
        toast.error("Max 5 programs can be compared at once");
      }
      return next;
    });
  }

  const toggleShortlist = async (programId: string) => {
    const next = new Set(shortlisted);
    if (next.has(programId)) next.delete(programId); else next.add(programId);
    setShortlisted(next);
    await fetch(`/api/results/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortlisted_ids: Array.from(next) }),
    });
  };

  const sendEmail = async () => {
    if (shortlisted.size === 0) { toast("Shortlist at least one program first!", { icon: "🔖" }); return; }
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, shortlisted_ids: Array.from(shortlisted) }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Shortlisted ${shortlisted.size} program(s) sent to your email!`);
    } catch { toast.error("Failed to send email. Try again."); }
    finally { setSendingEmail(false); }
  };

  const downloadPDF = () => {
    if (shortlisted.size === 0) { toast("Shortlist at least one program first!", { icon: "🔖" }); return; }
    toast("Opening print view — use Save as PDF", { icon: "📄" });
    window.open(`/api/pdf/${token}?ids=${Array.from(shortlisted).join(",")}`, "_blank");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
        <p className="text-gray-500">Building your personalised shortlist...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-4">{error}</p>
        <Link href="/profile" className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors">
          Start over
        </Link>
      </div>
    </div>
  );

  const allPrograms = data.programs;
  const profile = data.submission.profile as unknown as StudentProfile;
  const studentName = profile.full_name ?? "there";

  // Apply country / field filters then sort
  const applyFilters = (programs: ScoredProgram[]) => {
    let out = programs.filter((p) => {
      if (filters.country !== "all" && p.country !== filters.country) return false;
      if (filters.field !== "all" && p.field_of_study !== filters.field) return false;
      return true;
    });
    out = [...out].sort((a, b) => {
      switch (filters.sort) {
        case "tuition":     return (a.annual_tuition_usd ?? Infinity) - (b.annual_tuition_usd ?? Infinity);
        case "qs_ranking":  return (a.qs_ranking ?? 9999) - (b.qs_ranking ?? 9999);
        case "deadline":
          if (!a.application_deadline) return 1;
          if (!b.application_deadline) return -1;
          return a.application_deadline.localeCompare(b.application_deadline);
        default:            return b.match_score - a.match_score;
      }
    });
    return out;
  };

  const safePrograms      = applyFilters(allPrograms.filter((p) => p.tier === "safe"));
  const reachPrograms     = applyFilters(allPrograms.filter((p) => p.tier === "reach"));
  const ambitiousPrograms = applyFilters(allPrograms.filter((p) => p.tier === "ambitious"));

  const countries = [...new Set(allPrograms.map((p) => p.country))];
  const fields    = [...new Set(allPrograms.map((p) => p.field_of_study))];
  const shortlistedPrograms = allPrograms.filter((p) => shortlisted.has(p.id));

  // ── Build hard-filter chips ───────────────────────────────────────────────
  const hardFilterChips: { label: string; icon: string }[] = [];

  if (profile.country_preferences?.length) {
    profile.country_preferences.forEach((code) => {
      const c = TARGET_COUNTRIES.find((t) => t.code === code);
      if (c) hardFilterChips.push({ label: c.name, icon: c.flag });
    });
  }
  if (profile.qs_ranking_preference && profile.qs_ranking_preference !== "any") {
    const labels: Record<string, string> = { top_50: "QS Top 50", top_100: "QS Top 100", top_200: "QS Top 200", top_500: "QS Top 500" };
    hardFilterChips.push({ label: labels[profile.qs_ranking_preference] ?? "", icon: "🏆" });
  }
  if (profile.post_study_work_visa) {
    hardFilterChips.push({ label: "Post-Study Work Visa", icon: "✈️" });
  }

  const tierPrograms = { safe: safePrograms, reach: reachPrograms, ambitious: ambitiousPrograms };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/30">
        <Link href="/" className="flex items-center gap-2">
          <EduvianLogoMark size={32} />
          <div>
            <span className="font-display font-bold text-xl text-gray-900 tracking-tight">eduvian<span className="text-indigo-500">AI</span></span>
            <p className="text-sm font-bold text-gray-400 leading-none">Your Global Future, Simplified</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <NavButtons backHref={`/profile?token=${token}`} backLabel="Modify Profile" />
          <button
            onClick={sendEmail}
            disabled={sendingEmail}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            Email Shortlist{shortlisted.size > 0 ? ` (${shortlisted.size})` : ""}
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Download className="w-4 h-4" />
            PDF Shortlist{shortlisted.size > 0 ? ` (${shortlisted.size})` : ""}
          </button>
        </div>
      </nav>

      <div className={`pt-24 px-4 max-w-5xl mx-auto ${compareSet.size > 0 ? "pb-24" : "pb-16"}`}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p className="text-gray-400 text-sm font-medium mb-1">Hey {studentName} 👋</p>
          <h1 className="text-3xl font-extrabold text-gray-900">Your TOP 20 matches as per your profile</h1>
          <p className="text-gray-500 mt-1">
            <span className="text-emerald-600 font-semibold">{safePrograms.length} Safe</span>{" · "}
            <span className="text-amber-600 font-semibold">{reachPrograms.length} Reach</span>{" · "}
            <span className="text-rose-600 font-semibold">{ambitiousPrograms.length} Ambitious</span>
            {" — shortlist the ones you like, then email or download as PDF."}
          </p>
        </motion.div>

        {/* Hard filters applied */}
        {hardFilterChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-wrap items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-indigo-600 mr-1">Hard filters applied:</span>
            {hardFilterChips.map((chip, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-medium text-indigo-700">
                {chip.icon} {chip.label}
              </span>
            ))}
          </motion.div>
        )}

        {/* Profile summary card */}
        <ProfileCard profile={profile} token={token} />

        {/* Shortlist summary */}
        {shortlisted.size > 0 && (
          <ShortlistSummary programs={shortlistedPrograms} onRemove={toggleShortlist} />
        )}

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Refine
            {(filters.country !== "all" || filters.field !== "all") && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1" />
            )}
          </button>
          {(filters.country !== "all" || filters.field !== "all") && (
            <button
              onClick={() => setFilters({ country: "all", field: "all", sort: filters.sort })}
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600"
            >
              <RefreshCw className="w-3 h-3" />
              Clear
            </button>
          )}
          <div className="ml-auto">
            <select
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            >
              <option value="match_score">Sort: Best Match</option>
              <option value="tuition">Sort: Lowest Tuition</option>
              <option value="qs_ranking">Sort: QS Ranking</option>
              <option value="deadline">Sort: Deadline</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 p-4 rounded-2xl border border-gray-100 bg-white grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
              <select
                value={filters.country}
                onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="all">All Countries</option>
                {countries.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Field</label>
              <select
                value={filters.field}
                onChange={(e) => setFilters((f) => ({ ...f, field: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
              >
                <option value="all">All Fields</option>
                {fields.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── Tier-grouped program sections ─────────────────────────────────── */}
        {TIER_CONFIG.map((tc, sectionIdx) => {
          const programs = tierPrograms[tc.tier];
          return (
            <motion.section
              key={tc.tier}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.08 }}
              className="mb-10"
            >
              {/* Section header */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${tc.bg} border ${tc.border} mb-4`}>
                <span className="text-xl">{tc.emoji}</span>
                <div className="flex-1">
                  <span className={`font-extrabold text-base ${tc.text}`}>
                    {tc.label}
                    <span className="ml-2 font-normal text-sm opacity-70">({programs.length} programs)</span>
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{tc.description}</p>
                </div>
              </div>

              {programs.length === 0 ? (
                <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200">
                  <Filter className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No {tc.label.toLowerCase()} matches for the current filters.</p>
                  {(filters.country !== "all" || filters.field !== "all") && (
                    <button
                      onClick={() => setFilters({ country: "all", field: "all", sort: filters.sort })}
                      className="mt-2 text-xs text-indigo-500 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {programs.map((program, i) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIdx * 0.06 + i * 0.03 }}
                    >
                      <ProgramCard
                        program={program}
                        isShortlisted={shortlisted.has(program.id)}
                        onToggleShortlist={() => toggleShortlist(program.id)}
                        isInCompare={compareSet.has(program.id)}
                        onToggleCompare={() => toggleCompare(program.id)}
                        compareDisabled={!compareSet.has(program.id) && compareSet.size >= 5}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          );
        })}

        {/* Check any program match score */}
        <CheckMatchPanel token={token} />

        <div className="mt-8 text-center">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Update my profile &amp; re-run
          </Link>
        </div>
      </div>

      {/* AISA chat — context-aware with matched programs */}
      <ChatWidget programs={allPrograms} studentName={studentName} />

      {/* ── Compare sticky bar ──────────────────────────────────────────── */}
      {compareSet.size > 0 && (() => {
        const comparePrograms = allPrograms.filter((p) => compareSet.has(p.id));
        const slots = 5;
        const remaining = slots - comparePrograms.length;
        return (
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg px-4 py-3">
            <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
              {/* Selected chips */}
              {comparePrograms.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-sm font-medium text-violet-700">
                  <span className="max-w-[120px] truncate">{p.program_name}</span>
                  <button onClick={() => toggleCompare(p.id)} className="text-violet-400 hover:text-violet-600 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {/* Empty slot chips */}
              {Array.from({ length: remaining }).map((_, i) => (
                <div key={`slot-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-400">
                  + Add more
                </div>
              ))}
              {/* Actions */}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setCompareSet(new Set())}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
                >
                  Clear all
                </button>
                <button
                  onClick={() => { if (comparePrograms.length >= 2) setShowCompare(true); }}
                  disabled={comparePrograms.length < 2}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <BarChart2 className="w-4 h-4" />
                  Compare {comparePrograms.length} Programs
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Compare panel modal ─────────────────────────────────────────── */}
      {showCompare && (() => {
        const comparePrograms = allPrograms.filter((p) => compareSet.has(p.id));
        if (comparePrograms.length < 2) return null;
        return (
          <ComparePanel
            programs={comparePrograms}
            onClose={() => setShowCompare(false)}
            onRemove={(id) => {
              toggleCompare(id);
              if (compareSet.size <= 2) setShowCompare(false);
            }}
          />
        );
      })()}
    </div>
  );
}

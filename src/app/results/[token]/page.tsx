"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Globe2,
  Download,
  Mail,
  Filter,
  SlidersHorizontal,
  Loader2,
  BookmarkCheck,
  RefreshCw,
} from "lucide-react";
import type { ScoredProgram, ProgramTier } from "@/lib/types";
import ProgramCard from "@/components/results/ProgramCard";
import FilterBar from "@/components/results/FilterBar";
import ShortlistSummary from "@/components/results/ShortlistSummary";

interface ResultData {
  submission: {
    id: string;
    token: string;
    profile: Record<string, unknown>;
    shortlisted_ids: string[];
  };
  programs: ScoredProgram[];
}

export default function ResultsPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlisted, setShortlisted] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    tier: "all" as "all" | ProgramTier,
    country: "all",
    field: "all",
    sort: "match_score",
  });
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

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const toggleShortlist = async (programId: string) => {
    const next = new Set(shortlisted);
    if (next.has(programId)) {
      next.delete(programId);
    } else {
      next.add(programId);
    }
    setShortlisted(next);

    await fetch(`/api/results/${token}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shortlisted_ids: Array.from(next) }),
    });
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch(`/api/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error("Failed to send");
      toast.success("Shortlist sent to your email!");
    } catch {
      toast.error("Failed to send email. Try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadPDF = async () => {
    toast("Opening print view — use Save as PDF", { icon: "📄" });
    try {
      const res = await fetch(`/api/pdf/${token}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("PDF generation failed. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-500">Building your personalized shortlist...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <Link
            href="/profile"
            className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
          >
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const allPrograms = data.programs;

  // Filter & sort
  let filtered = allPrograms.filter((p) => {
    if (filters.tier !== "all" && p.tier !== filters.tier) return false;
    if (filters.country !== "all" && p.country !== filters.country) return false;
    if (filters.field !== "all" && p.field_of_study !== filters.field) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "match_score":
        return b.match_score - a.match_score;
      case "tuition":
        return a.annual_tuition_usd - b.annual_tuition_usd;
      case "qs_ranking":
        return (a.qs_ranking ?? 9999) - (b.qs_ranking ?? 9999);
      case "deadline":
        if (!a.application_deadline) return 1;
        if (!b.application_deadline) return -1;
        return a.application_deadline.localeCompare(b.application_deadline);
      default:
        return b.match_score - a.match_score;
    }
  });

  const safeCount = allPrograms.filter((p) => p.tier === "safe").length;
  const moderateCount = allPrograms.filter((p) => p.tier === "moderate").length;
  const reachCount = allPrograms.filter((p) => p.tier === "reach").length;
  const shortlistedPrograms = allPrograms.filter((p) => shortlisted.has(p.id));

  const countries = [...new Set(allPrograms.map((p) => p.country))];
  const fields = [...new Set(allPrograms.map((p) => p.field_of_study))];

  const studentName = (data.submission.profile as { full_name?: string })
    .full_name ?? "there";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900">Eduvian</span>
            <p className="text-xs text-gray-400 leading-none">Your Global Future, Simplified</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={sendEmail}
            disabled={sendingEmail}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {sendingEmail ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Email me
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-900">
            Hey {studentName}! 👋 Here&apos;s your shortlist
          </h1>
          <p className="text-gray-500 mt-1">
            We found{" "}
            <span className="text-indigo-600 font-semibold">
              {allPrograms.length} programs
            </span>{" "}
            matched to your profile.
          </p>
        </motion.div>

        {/* Tier summary badges */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { tier: "safe", label: "Safe Match", count: safeCount, emoji: "✅", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            { tier: "moderate", label: "Moderate", count: moderateCount, emoji: "🎯", color: "bg-amber-50 text-amber-700 border-amber-200" },
            { tier: "reach", label: "Reach", count: reachCount, emoji: "🚀", color: "bg-rose-50 text-rose-700 border-rose-200" },
          ].map((t) => (
            <button
              key={t.tier}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  tier: f.tier === t.tier ? "all" : (t.tier as ProgramTier),
                }))
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${t.color} ${
                filters.tier === t.tier ? "ring-2 ring-offset-1 ring-indigo-300" : ""
              }`}
            >
              {t.emoji} {t.count} {t.label}
            </button>
          ))}
          {shortlisted.size > 0 && (
            <button
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  tier: "all",
                  country: "all",
                  field: "all",
                }))
              }
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium"
            >
              <BookmarkCheck className="w-4 h-4" />
              {shortlisted.size} Bookmarked
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
              showFilters
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {(filters.tier !== "all" || filters.country !== "all" || filters.field !== "all") && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 ml-1" />
            )}
          </button>
          <span className="text-sm text-gray-400">
            {filtered.length} of {allPrograms.length} programs
          </span>
          {(filters.tier !== "all" || filters.country !== "all" || filters.field !== "all") && (
            <button
              onClick={() =>
                setFilters({ tier: "all", country: "all", field: "all", sort: filters.sort })
              }
              className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-600"
            >
              <RefreshCw className="w-3 h-3" />
              Clear filters
            </button>
          )}
          <div className="ml-auto">
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sort: e.target.value }))
              }
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
          <FilterBar
            filters={filters}
            countries={countries}
            fields={fields}
            onChange={(f) => setFilters((prev) => ({ ...prev, ...f }))}
          />
        )}

        {/* Shortlist summary */}
        {shortlisted.size > 0 && (
          <ShortlistSummary
            programs={shortlistedPrograms}
            onRemove={toggleShortlist}
          />
        )}

        {/* Program cards */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400">No programs match these filters.</p>
            <button
              onClick={() =>
                setFilters({ tier: "all", country: "all", field: "all", sort: "match_score" })
              }
              className="mt-4 text-indigo-500 text-sm hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((program, i) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProgramCard
                  program={program}
                  isShortlisted={shortlisted.has(program.id)}
                  onToggleShortlist={() => toggleShortlist(program.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Update my profile & re-run
          </Link>
        </div>
      </div>
    </div>
  );
}

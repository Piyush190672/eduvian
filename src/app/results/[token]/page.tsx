"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
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
import { BUDGET_VALUES } from "@/lib/types";
import ProgramCard from "@/components/results/ProgramCard";
import ShortlistSummary from "@/components/results/ShortlistSummary";
// ProfileCard moved to /profile-evaluation/[token] (13 May 2026) — the
// evaluation interstitial is now its own page, with a "Continue to
// matched programs" button that brings the user here.
import NavButtons from "@/components/ui/NavButtons";
import LogoutButton from "@/components/LogoutButton";
import DecisionDisclaimer from "@/components/DecisionDisclaimer";
import CheckMatchPanel from "@/components/results/CheckMatchPanel";
import ChatWidget from "@/components/ChatWidget";
import ComparePanel from "@/components/results/ComparePanel";
import { explainEmptyTier } from "@/lib/empty-tier-reason";
import FeedbackPrompt from "@/components/FeedbackPrompt";

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
  // Default sort: Best Match (match_score DESC). Within each tier
  // section, programs are ordered by how well they fit the user's
  // profile. The matcher upstream still sorts ranked-first / unranked-
  // last when building the pool, but the user-facing default order is
  // now match-quality. (15 May 2026, user-requested.)
  const [filters, setFilters] = useState({ country: "all", field: "all", sort: "match_score" });
  const [showFilters, setShowFilters] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  // "Next Best 20" toggle — the matcher returns up to 40 programs
  // (12 safe / 20 reach / 8 ambitious). The first 6/10/4 are the
  // canonical Top 20; the rest are revealed on click for broader
  // exploration. Same ratio in both pages.
  const [showNext20, setShowNext20] = useState(false);

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

  // Per-university minimum qs_ranking lookup. Used to tag each card's QS
  // pill as subject-specific (= the min for that uni — preferred) vs
  // overall (= higher than min, so likely the QS World University Rank
  // that leaked in during a verifier pass that didn't grab the subject
  // rank). Programs at unis with a single rank value have no extra tag.
  // Heuristic: the smaller a rank, the more likely it's subject-specific
  // for selective unis (Cambridge AI = #2 subject vs #6 overall, etc.).
  // True kind data will land when the verifier prompt update + a future
  // re-extraction pass populate it explicitly.
  const minRankByUni = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allPrograms) {
      if (typeof p.qs_ranking === "number" && p.qs_ranking > 0) {
        const cur = map.get(p.university_name);
        if (cur === undefined || p.qs_ranking < cur) {
          map.set(p.university_name, p.qs_ranking);
        }
      }
    }
    return map;
  }, [allPrograms]);

  const qsRankKindFor = (p: ScoredProgram): "subject" | "overall" | undefined => {
    if (!p.qs_ranking) return undefined;
    const min = minRankByUni.get(p.university_name);
    if (min === undefined) return undefined;
    return p.qs_ranking > min ? "overall" : "subject";
  };
  const profile = data.submission.profile as unknown as StudentProfile;
  const studentName = profile.full_name ?? "there";

  // Budget headroom helper — programs that survived the 110% hard filter
  // but exceed 100% of the user's budget get an amber "X% of your budget"
  // pill on the card. The hard filter in scoring.ts excludes anything
  // above 110%, so this value is always in (100, 110] when truthy.
  const budgetMax = profile.budget_range ? BUDGET_VALUES[profile.budget_range] : 0;
  const budgetPctFor = (p: ScoredProgram): number | null => {
    if (!budgetMax || budgetMax <= 0) return null;
    if (typeof p.annual_tuition_usd !== "number" || p.annual_tuition_usd <= 0) return null;
    const total = p.annual_tuition_usd + (p.avg_living_cost_usd ?? 0);
    return (total / budgetMax) * 100;
  };

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

  // Top-20 ratio per tier; "Next Best 20" comes from ranks 21-40 with
  // the same per-tier ratio. The matcher already returns up to 40 in
  // ranked order — slice each tier in halves first, then apply the
  // user's filters so the canonical Top-20 set stays stable as filters
  // toggle.
  const PAGE_QUOTA = { safe: 6, reach: 10, ambitious: 4 } as const;
  const sliceTier = (tier: "safe" | "reach" | "ambitious") => {
    const pool = allPrograms.filter((p) => p.tier === tier);
    return {
      top:  pool.slice(0, PAGE_QUOTA[tier]),
      next: pool.slice(PAGE_QUOTA[tier]),
    };
  };
  const safeSlice = sliceTier("safe");
  const reachSlice = sliceTier("reach");
  const ambitiousSlice = sliceTier("ambitious");

  // Top-20 + Next-20 stay in separate blocks (rendered as two banner-led
  // groups) so it's visually obvious there are two pages of matches and
  // the user can shortlist from either without confusion. Filters apply
  // independently to each half.
  const safePrograms      = applyFilters(safeSlice.top);
  const reachPrograms     = applyFilters(reachSlice.top);
  const ambitiousPrograms = applyFilters(ambitiousSlice.top);
  const safeProgramsNext      = applyFilters(safeSlice.next);
  const reachProgramsNext     = applyFilters(reachSlice.next);
  const ambitiousProgramsNext = applyFilters(ambitiousSlice.next);
  const nextPageCount     = safeSlice.next.length + reachSlice.next.length + ambitiousSlice.next.length;
  const nextPageVisibleCount = safeProgramsNext.length + reachProgramsNext.length + ambitiousProgramsNext.length;

  const countries = [...new Set(allPrograms.map((p) => p.country))];
  const fields    = [...new Set(allPrograms.map((p) => p.field_of_study))];
  const shortlistedPrograms = allPrograms.filter((p) => shortlisted.has(p.id));

  // Lookup by tier — sections render in TIER_CONFIG order (Safe → Reach
  // → Ambitious). Within each section the programs are sorted by the
  // active filter (default QS rank ASC, so the highest-prestige
  // university surfaces first inside its tier).
  const tierPrograms = { safe: safePrograms, reach: reachPrograms, ambitious: ambitiousPrograms };
  const tierProgramsNext = { safe: safeProgramsNext, reach: reachProgramsNext, ambitious: ambitiousProgramsNext };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Nav — anchored below the dismissable banner stack via CSS vars.
          On mobile only Logo + Logout + PDF (primary action) show; the
          rest collapse into a smaller set with icon-only buttons.  */}
      <nav
        className="fixed left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass border-b border-white/30 bg-white/85 backdrop-blur"
        style={{ top: "calc(var(--beta-banner-h, 0px) + var(--security-notice-h, 0px))" }}
      >
        <Link href="/" className="flex items-center" aria-label="eduvianAI home">
          <EduvianLogoMark size={32} />
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LogoutButton variant="compact" />
          <Link
            href="/account/security"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            title="Manage how you sign in — add a password for faster login"
          >
            <ShieldCheck className="w-4 h-4" />
            Security
          </Link>
          <span className="hidden sm:inline-flex">
            <NavButtons backHref={`/profile?token=${token}`} backLabel="Modify Profile" />
          </span>
          <button
            onClick={sendEmail}
            disabled={sendingEmail}
            aria-label="Email shortlist"
            title="Email shortlist"
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            <span className="hidden sm:inline">Email Shortlist{shortlisted.size > 0 ? ` (${shortlisted.size})` : ""}</span>
            <span className="sm:hidden">{shortlisted.size > 0 ? ` (${shortlisted.size})` : ""}</span>
          </button>
          <button
            onClick={downloadPDF}
            aria-label="Download PDF shortlist"
            title="Download PDF shortlist"
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-200 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF Shortlist{shortlisted.size > 0 ? ` (${shortlisted.size})` : ""}</span>
            <span className="sm:hidden">{shortlisted.size > 0 ? ` (${shortlisted.size})` : ""}</span>
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

        {/* Profile summary now lives at /profile-evaluation/[token] —
            see the interstitial page rendered between submit and here. */}

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

        {/* ── Tier-grouped program sections (Safe → Reach → Ambitious) ──────
            Programs are grouped by tier in TIER_CONFIG order. Within each
            section programs are sorted by the active filter — default is
            QS rank ASC, so the highest-prestige university surfaces
            first inside its tier. */}
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
                // Compact "why is this empty" explainer.
                (() => {
                  const expl = explainEmptyTier(tc.tier, profile, allPrograms);
                  return (
                    <div className={`rounded-xl border border-dashed ${tc.border} ${tc.bg} px-4 py-3.5`}>
                      <div className="flex items-start gap-2.5">
                        <Filter className={`w-4 h-4 ${tc.text} flex-shrink-0 mt-0.5`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${tc.text}`}>{expl.title}</p>
                          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{expl.body}</p>
                          <div className="mt-2.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">What could change this</p>
                            <ul className="space-y-1">
                              {expl.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                  <span className={`${tc.text} flex-shrink-0 mt-0.5`}>•</span>
                                  <span className="leading-relaxed">{s}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {(filters.country !== "all" || filters.field !== "all") && (
                            <button
                              onClick={() => setFilters({ country: "all", field: "all", sort: filters.sort })}
                              className="mt-2.5 text-xs text-indigo-500 hover:underline"
                            >
                              Clear page-level filters
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-4">
                  {programs.map((program, i) => (
                    <motion.div
                      key={program.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sectionIdx * 0.06 + Math.min(i, 8) * 0.03 }}
                    >
                      <ProgramCard
                        program={program}
                        isShortlisted={shortlisted.has(program.id)}
                        onToggleShortlist={() => toggleShortlist(program.id)}
                        isInCompare={compareSet.has(program.id)}
                        onToggleCompare={() => toggleCompare(program.id)}
                        compareDisabled={!compareSet.has(program.id) && compareSet.size >= 5}
                        budgetPct={budgetPctFor(program)}
                        qsRankKind={qsRankKindFor(program)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          );
        })}

        {/* Next Best 20 toggle — reveals a second banner-led block below.
            Same per-tier ratio (6 safe / 10 reach / 4 ambitious). Smooth-
            scrolls to the Next Best 20 banner on open so the user lands
            at the top of the new programs (not at the bottom of the page
            where the button itself lives). */}
        {nextPageCount > 0 && (
          <div className="mb-6 flex justify-center">
            <button
              type="button"
              onClick={() => {
                const opening = !showNext20;
                setShowNext20(opening);
                if (opening) {
                  // Wait for the new section to render, then scroll its
                  // banner into view at the top of the viewport.
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      const el = document.getElementById("next-best-20");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    });
                  });
                }
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-indigo-200 bg-white text-indigo-700 text-sm font-semibold shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition-all"
            >
              {showNext20
                ? `Hide Next ${nextPageCount} Matches`
                : `Show Next Best ${nextPageCount} Matches`}
            </button>
          </div>
        )}

        {/* Next Best 20 block — visually distinct from the Top 20 above so
            users can clearly tell the two pages apart and shortlist from
            either. Same 3 tier sub-sections (Safe / Reach / Ambitious),
            same ProgramCard wiring — so the shortlist, compare, and
            apply actions all work identically here. */}
        {showNext20 && nextPageCount > 0 && (
          <div id="next-best-20" className="scroll-mt-24">
            <div className="mb-5 rounded-2xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-1">Next Best {nextPageCount} Matches</p>
              <p className="text-sm text-gray-700">
                Ranks 21-{20 + nextPageCount} from the matcher — same scoring + per-tier ratio as the Top 20 above.
                Shortlist any of these the same way; they&apos;ll save together.
              </p>
            </div>

            {TIER_CONFIG.map((tc, sectionIdx) => {
              const programs = tierProgramsNext[tc.tier];
              if (programs.length === 0) return null;
              return (
                <motion.section
                  key={`next-${tc.tier}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIdx * 0.05 }}
                  className="mb-10"
                >
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${tc.bg} border ${tc.border} mb-4`}>
                    <span className="text-xl">{tc.emoji}</span>
                    <div className="flex-1">
                      <span className={`font-extrabold text-base ${tc.text}`}>
                        {tc.label}
                        <span className="ml-2 font-normal text-sm opacity-70">({programs.length} more)</span>
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{tc.description}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {programs.map((program, i) => (
                      <motion.div
                        key={program.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: sectionIdx * 0.04 + Math.min(i, 8) * 0.03 }}
                      >
                        <ProgramCard
                          program={program}
                          isShortlisted={shortlisted.has(program.id)}
                          onToggleShortlist={() => toggleShortlist(program.id)}
                          isInCompare={compareSet.has(program.id)}
                          onToggleCompare={() => toggleCompare(program.id)}
                          compareDisabled={!compareSet.has(program.id) && compareSet.size >= 5}
                          budgetPct={budgetPctFor(program)}
                          qsRankKind={qsRankKindFor(program)}
                        />
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              );
            })}

            {nextPageVisibleCount === 0 && (
              <div className="mb-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
                Your active filters hid every program in the Next Best {nextPageCount} pool. Clear filters to see them.
              </div>
            )}
          </div>
        )}

        {/* Clarification — moved here from the page header (13 May 2026) so
            users finish browsing the shortlist before encountering the
            disclaimer, and the check-program panel below sits right next
            to its natural action prompt. */}
        <div className="mb-6">
          <DecisionDisclaimer variant="shortlist" />
        </div>

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

      {/* Post-experience feedback prompt (1-5 stars). Auto-dismisses
          per device once submitted/skipped via localStorage. */}
      <FeedbackPrompt surface="results" />

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
                  onClick={() => {
                    if (comparePrograms.length >= 2) {
                      setShowCompare(true);
                    } else {
                      // Silent no-op (via disabled) was confusing — users
                      // who picked one program then hit Compare got no
                      // feedback. Now we surface why the action is
                      // unavailable. (13 May 2026)
                      toast("You've selected 1 program. Add at least one more to compare.", { icon: "ℹ️" });
                    }
                  }}
                  aria-disabled={comparePrograms.length < 2}
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-bold transition-all ${
                    comparePrograms.length >= 2
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5"
                      : "bg-gradient-to-r from-violet-300 to-purple-300 cursor-pointer"
                  }`}
                >
                  <BarChart2 className="w-4 h-4" />
                  Compare {comparePrograms.length} {comparePrograms.length === 1 ? "Program" : "Programs"}
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

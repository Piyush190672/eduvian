"use client";

import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CheckCircle2,
  Download,
  Send,
  Loader2,
  Star,
} from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import { intendedFieldLabel } from "@/lib/types";
import {
  scoreStudentProfile,
  getCategoryStyle,
  getCriterionColor,
  CATEGORY_LADDER,
  type ProfileCategory,
} from "@/lib/profile-score";
import toast from "react-hot-toast";

interface Props {
  profile: StudentProfile;
  token: string;
}

const DEGREE_LABELS: Record<string, string> = {
  undergraduate: "Undergraduate",
  postgraduate: "Postgraduate",
};

export default function ProfileCard({ profile, token }: Props) {
  const [sendingEmail, setSendingEmail] = useState(false);

  const result = scoreStudentProfile(profile);
  const style = getCategoryStyle(result.category as ProfileCategory);

  const downloadPDF = () => {
    // Open the API URL directly in a new tab — same-origin, so the inline
    // window.print() auto-fires reliably. Earlier this went through a
    // fetch + blob: URL hop, but Chrome/Safari block window.print() in
    // blob: contexts (autoplay-style restriction), which caused the print
    // dialog to never appear on the matched-results PDF.
    toast("Opening print view — use Save as PDF", { icon: "📄" });
    const win = window.open(`/api/pdf/${token}`, "_blank");
    if (!win) {
      toast.error("Allow pop-ups for eduvianai.com to download the PDF.");
    }
  };

  const sendEmail = async () => {
    setSendingEmail(true);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error();
      toast.success("Profile & shortlist sent to your email!");
    } catch {
      toast.error("Failed to send email. Try again.");
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden mb-6`}>
      {/* Top strip — stacks vertically on mobile so the long category
          badge + action buttons don't get truncated. Two-column at sm+. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-5 py-4 gap-3 sm:gap-2">
        {/* Left: student info */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          {/* Avatar */}
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/70 border border-white flex items-center justify-center shadow-sm flex-shrink-0">
            <User className={`w-5 h-5 sm:w-6 sm:h-6 ${style.text}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-gray-900 text-base leading-tight truncate">
              {profile.full_name}
            </h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500 truncate max-w-full">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{profile.email}</span>
              </span>
              {profile.phone && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="w-3 h-3 flex-shrink-0" />
                  {profile.phone}
                </span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {profile.city}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500 min-w-0">
                <GraduationCap className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">
                  {DEGREE_LABELS[profile.degree_level] ?? profile.degree_level}
                  {" · "}
                  {intendedFieldLabel(profile)}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: action buttons only — the category itself is shown
            by the rating-scale ladder lower in the card, so the
            separate badge strip is redundant. */}
        <div className="flex flex-col items-stretch sm:items-end gap-2 flex-shrink-0 w-full sm:w-auto sm:ml-4">
          {/* Action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={sendEmail}
              disabled={sendingEmail}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {sendingEmail ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Email
            </button>
            <button
              onClick={downloadPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Category description */}
      <div className="px-4 sm:px-5 pb-3">
        <p className={`text-xs ${style.text} font-medium`}>
          {style.description}
        </p>
      </div>

      {/* Rating scale ladder — five segments, user's category highlighted.
          Wrapped in a raised "boundary wall" container with layered
          shadows + inner highlight for a clear 3D pop. Applies ONLY to
          the overall profile category — the per-parameter boxes below
          use their own colour scheme and stay unframed. */}
      <div className="px-4 sm:px-5 pb-5">
        <div
          className="rounded-2xl p-2 sm:p-3 bg-gradient-to-b from-white via-white to-slate-50 border-2 border-slate-200 ring-1 ring-black/[0.04]"
          style={{
            boxShadow:
              "0 1px 0 rgba(255,255,255,0.9) inset, " +
              "0 -2px 0 rgba(0,0,0,0.05) inset, " +
              "0 1px 2px rgba(0,0,0,0.05), " +
              "0 8px 24px -6px rgba(15,23,42,0.18), " +
              "0 16px 40px -12px rgba(15,23,42,0.12)",
          }}
        >
          <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-slate-400 text-center mb-2">
            Profile Rating Scale
          </p>
          <div className="flex items-stretch gap-1 sm:gap-1.5">
            {CATEGORY_LADDER.map((cat, idx) => {
              const cs = getCategoryStyle(cat);
              const active = cat === result.category;
              const stars = idx + 1;
              return (
                <div
                  key={cat}
                  className={`flex-1 min-w-0 flex flex-col items-center justify-center px-0.5 sm:px-1.5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-center transition-all ${
                    active
                      ? `${cs.bg} ${cs.text} font-extrabold border-2 ${cs.border} scale-[1.05] ring-2 ring-white/80`
                      : "bg-white text-slate-400 font-medium border border-slate-100"
                  }`}
                  style={
                    active
                      ? {
                          boxShadow:
                            "0 4px 10px -2px rgba(0,0,0,0.15), " +
                            "0 2px 4px rgba(0,0,0,0.08), " +
                            "0 1px 0 rgba(255,255,255,0.8) inset",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-center justify-center gap-[1px] leading-none flex-wrap max-w-full">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0 ${
                          active ? `${cs.text} fill-current` : "text-amber-400 fill-amber-400"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] sm:text-[11px] leading-tight mt-1 sm:mt-1.5 whitespace-nowrap">
                    {cs.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Parameters considered — colour-coded by strength on the
          criterion's own scale (5-tier for Academic, 4-tier for Family
          income / Backlogs, etc.) but with no numeric points shown. */}
      <div className="px-4 sm:px-5 py-3 border-t border-white/50 text-sm">
        <span className="font-semibold text-gray-700">
          Parameters considered
        </span>
      </div>

      <div className="px-4 sm:px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {result.criteria.map((c, i) => {
          const cc = getCriterionColor(c.points, c.maxPoints);
          return (
            <div
              key={i}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium ${cc.bg} ${cc.border} ${cc.text}`}
            >
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${cc.iconColor}`} />
              <span className="flex-1">{c.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

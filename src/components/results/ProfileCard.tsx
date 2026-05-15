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
} from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import { intendedFieldLabel } from "@/lib/types";
import {
  scoreStudentProfile,
  getCategoryStyle,
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
      {/* Top strip */}
      <div className="flex items-center justify-between px-5 py-4">
        {/* Left: student info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-2xl bg-white/70 border border-white flex items-center justify-center shadow-sm flex-shrink-0">
            <User className={`w-6 h-6 ${style.text}`} />
          </div>
          <div>
            <h3 className="font-extrabold text-gray-900 text-base leading-tight">
              {profile.full_name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Mail className="w-3 h-3" />
                {profile.email}
              </span>
              {profile.phone && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="w-3 h-3" />
                  {profile.phone}
                </span>
              )}
              {profile.city && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  {profile.city}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <GraduationCap className="w-3 h-3" />
                {DEGREE_LABELS[profile.degree_level] ?? profile.degree_level}
                {" · "}
                {intendedFieldLabel(profile)}
              </span>
            </div>
          </div>
        </div>

        {/* Right: category badge + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-4">
          {/* Category badge */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${style.border} bg-white/60`}
          >
            <span className="text-lg">{style.emoji}</span>
            <span className={`font-extrabold text-sm ${style.text}`}>
              {result.category}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={sendEmail}
              disabled={sendingEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Category description */}
      <div className="px-5 pb-3">
        <p className={`text-xs ${style.text} font-medium`}>
          {style.description}
        </p>
      </div>

      {/* Parameters considered — labels only, no scoring details */}
      <div className="px-5 py-3 border-t border-white/50 text-sm">
        <span className="font-semibold text-gray-700">
          Parameters considered
        </span>
      </div>

      <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
        {result.criteria.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium bg-white/70 border-gray-100 text-gray-700"
          >
            <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            <span className="flex-1">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

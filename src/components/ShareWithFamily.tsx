"use client";

import { useState } from "react";
import { Printer, Mail, Users, ArrowRight, CheckCircle2, X } from "lucide-react";

/**
 * ShareWithFamily — three-button panel rendered after any high-stakes
 * output. Lets the student turn the result into something a parent can
 * actually open, read and react to.
 *
 *   - Print / save as PDF (browser print, prints the current page)
 *   - Email (inline form → /api/email/share → Resend-backed send)
 *   - Parent-friendly view (route to a simpler / less-technical layout)
 *
 * The email path uses a backend send rather than `mailto:` so the user
 * doesn't have to bounce through their local email client. Caller still
 * passes the same subject + body — this component just exposes them as
 * editable defaults inside the form.
 */
export function ShareWithFamily({
  emailSubject,
  emailBody,
  parentViewHref,
  parentViewLabel = "Open parent-friendly view",
  className = "",
}: {
  emailSubject: string;
  emailBody: string;
  parentViewHref?: string;
  parentViewLabel?: string;
  className?: string;
}) {
  const [showForm, setShowForm] = useState(false);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState(emailSubject);
  const [text, setText] = useState(emailBody);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/email/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          subject,
          text,
          sourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to send. Try again in a moment.");
        return;
      }
      setSent(true);
      setTimeout(() => { setSent(false); setShowForm(false); setTo(""); }, 3000);
    } catch {
      setError("Network error — check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 sm:px-6 sm:py-6 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-violet-700" />
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Share with family</p>
      </div>
      <p className="text-xs text-gray-600 leading-snug mb-4">
        Most study-abroad calls happen at the dinner table. Hand them something they can read in five minutes.
      </p>

      {!showForm ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { if (typeof window !== "undefined") window.print(); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-gray-800 text-xs font-bold hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print / save PDF
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(true); setSent(false); setError(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-stone-200 text-gray-800 text-xs font-bold hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            <Mail className="w-3.5 h-3.5" /> Email this page
          </button>
          {parentViewHref && (
            <a
              href={parentViewHref}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors shadow-sm"
            >
              <Users className="w-3.5 h-3.5" /> {parentViewLabel} <ArrowRight className="w-3 h-3" />
            </a>
          )}
        </div>
      ) : sent ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Sent! Closing in a few seconds.
        </div>
      ) : (
        <form onSubmit={handleSend} className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">Send to a family member</p>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="email"
            placeholder="parent@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          {error && <p className="text-xs text-rose-600">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); }}
              className="px-4 py-2 rounded-xl border border-stone-200 text-gray-700 text-xs font-bold hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

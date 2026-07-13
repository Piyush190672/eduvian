"use client";

import { useEffect, useState } from "react";
import { Star, X, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export type FeedbackSurface =
  | "results"
  | "application-check"
  | "interview-prep"
  | "visa-coach";

interface Props {
  surface: FeedbackSurface;
  /** Delay (ms) before the prompt appears. Default 8 s so the user has time
   *  to interact with the page first. */
  delayMs?: number;
}

const STAR_LABELS = ["Poor", "Average", "Good", "Very Good", "Excellent"];
const SCALE_COLORS = [
  "text-rose-500",     // 1 — Poor
  "text-orange-500",   // 2 — Average
  "text-amber-500",    // 3 — Good
  "text-lime-500",     // 4 — Very Good
  "text-emerald-500",  // 5 — Excellent
];

/**
 * One-shot post-experience feedback prompt. Pops up `delayMs` after mount
 * if the user hasn't already submitted (or dismissed) feedback for this
 * surface on this device. Submitting writes to /api/feedback and stamps
 * localStorage so the same surface won't prompt again on this device.
 */
export default function FeedbackPrompt({ surface, delayMs = 8000 }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const storageKey = `eduvian_feedback_${surface}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(storageKey)) return; // already handled
    } catch { /* ignore */ }
    const t = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(t);
  }, [storageKey, delayMs]);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") dismiss("skipped"); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss(_reason: "submitted" | "skipped") {
    try { localStorage.setItem(storageKey, String(Date.now())); } catch { /* ignore */ }
    setOpen(false);
  }

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rating, surface, comment: comment.trim() || undefined }),
      });
      if (!res.ok) {
        toast.error("Could not submit feedback. Please try again.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setTimeout(() => dismiss("submitted"), 1500);
    } catch {
      toast.error("Could not submit feedback. Please try again.");
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const active = hover ?? rating ?? 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-prompt-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) dismiss("skipped"); }}
    >
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="flex items-start justify-between px-6 pt-5 pb-2">
          <h2 id="feedback-prompt-title" className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
            Please rate your experience on EduvianAI today
          </h2>
          <button
            type="button"
            onClick={() => dismiss("skipped")}
            className="text-gray-400 hover:text-gray-700 transition-colors -mr-2 -mt-1"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="px-6 py-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-sm font-semibold text-gray-800">Thanks for the feedback!</p>
            <p className="text-xs text-gray-500">Your response helps us improve.</p>
          </div>
        ) : (
          <div className="px-6 pb-5">
            {/* Star scale */}
            <div className="flex items-center justify-between gap-1.5 mt-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const isLit = active >= n;
                const color = isLit ? SCALE_COLORS[(active - 1) as 0 | 1 | 2 | 3 | 4] : "text-gray-200";
                return (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars — ${STAR_LABELS[n - 1]}`}
                    className="flex-1 flex flex-col items-center justify-end py-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <Star className={`w-7 h-7 sm:w-8 sm:h-8 ${color} ${isLit ? "fill-current" : ""}`} />
                    <span className={`text-[10px] sm:text-[11px] mt-1 font-medium ${isLit ? "text-gray-700" : "text-gray-400"}`}>
                      {STAR_LABELS[n - 1]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional comment */}
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Anything you&apos;d like us to know? <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                rows={2}
                placeholder="What worked, what felt slow, what's missing…"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition placeholder:text-gray-400 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => dismiss("skipped")}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!rating || submitting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : "Submit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

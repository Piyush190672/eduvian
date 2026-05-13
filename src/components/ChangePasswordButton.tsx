"use client";

import { useEffect, useState } from "react";
import { Lock, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const MIN_LENGTH = 8;
const RE_LETTER  = /[A-Za-z]/;
const RE_DIGIT   = /[0-9]/;
const RE_SPECIAL = /[^A-Za-z0-9]/;

function clientValidate(pw: string): string | null {
  if (pw.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters.`;
  if (!RE_LETTER.test(pw))    return "Password must contain at least one letter.";
  if (!RE_DIGIT.test(pw))     return "Password must contain at least one number.";
  if (!RE_SPECIAL.test(pw))   return "Password must contain at least one special character (e.g. ! @ # $ % & *).";
  return null;
}

interface Props {
  /** Optional custom button class — defaults to the dark-hero pill style
   *  that pairs with the homepage LogoutButton. */
  className?: string;
  /** Hide the label below sm. */
  compact?: boolean;
}

/**
 * ChangePasswordButton — button that opens a modal letting a signed-in
 * user change their password. Renders nothing when the user isn't signed
 * in (localStorage.eduvian_student missing). The modal asks for current
 * password + new password + confirm; submit hits /api/auth/set-password
 * which 401s if the current password doesn't match the stored hash.
 *
 * Replaces the SetPasswordCard on /profile (moved here 13 May 2026 so
 * users can change their password from anywhere, not just the profile
 * editor).
 */
export default function ChangePasswordButton({ className, compact }: Props) {
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [curr, setCurr] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    try { setSignedIn(!!localStorage.getItem("eduvian_student")); } catch { /* ignore */ }
  }, []);

  // Reset modal state whenever it's reopened.
  useEffect(() => {
    if (!open) return;
    setCurr(""); setNext(""); setConfirm(""); setMsg(null); setBusy(false);
  }, [open]);

  // Esc closes the modal.
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  if (!mounted || !signedIn) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!curr) { setMsg({ kind: "err", text: "Enter your current password." }); return; }
    const sErr = clientValidate(next);
    if (sErr) { setMsg({ kind: "err", text: sErr }); return; }
    if (next !== confirm) { setMsg({ kind: "err", text: "New passwords don't match." }); return; }
    if (curr === next) { setMsg({ kind: "err", text: "New password must be different from the current one." }); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: curr, new_password: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? "Could not change password." });
        return;
      }
      setMsg({ kind: "ok", text: "Password changed." });
      setCurr(""); setNext(""); setConfirm("");
      setTimeout(() => setOpen(false), 1200);
    } catch {
      setMsg({ kind: "err", text: "Connection error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  const buttonClass = className ??
    "flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/20 text-white/80 text-sm font-medium hover:bg-white/10 hover:text-white hover:border-white/40 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Change password"
        className={buttonClass}
      >
        <Lock className="w-4 h-4" />
        <span className={compact ? "hidden sm:inline" : ""}>Change password</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-pw-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 id="change-pw-title" className="text-base font-bold text-gray-900">Change password</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  value={curr}
                  onChange={(e) => setCurr(e.target.value)}
                  autoComplete="current-password"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">New password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                  placeholder={`At least ${MIN_LENGTH} characters, letter, number, special`}
                  minLength={MIN_LENGTH}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-400"
                />
                <ul className="mt-2 space-y-0.5 text-[11px] text-gray-500">
                  {[
                    { ok: next.length >= MIN_LENGTH, label: `At least ${MIN_LENGTH} characters` },
                    { ok: RE_LETTER.test(next),       label: "Contains a letter" },
                    { ok: RE_DIGIT.test(next),        label: "Contains a number" },
                    { ok: RE_SPECIAL.test(next),      label: "Contains a special character (! @ # $ %)" },
                  ].map((r) => (
                    <li key={r.label} className="flex items-center gap-1.5">
                      <span className={r.ok ? "text-emerald-600 font-bold" : "text-gray-300"}>{r.ok ? "✓" : "○"}</span>
                      <span className={r.ok ? "text-emerald-700" : ""}>{r.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm new password <span className="text-rose-500">*</span></label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-gray-400"
                />
              </div>

              {msg && (
                <div className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl border ${
                  msg.kind === "ok"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}>
                  {msg.kind === "ok" ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={busy}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Change password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

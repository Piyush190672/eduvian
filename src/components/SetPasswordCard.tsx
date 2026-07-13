"use client";

import { useEffect, useState } from "react";
import { Lock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

/**
 * SetPasswordCard — lets a signed-in user add or change a login password.
 *
 * Renders only when the eduvian_student localStorage entry is present
 * (set on OTP-login / register / password-login). The submit hits
 * /api/auth/set-password which is gated by the eduvianai_user cookie, so
 * the localStorage check is just a UX hint; the real auth gate is server-side.
 *
 * First-time set: only new_password required. Change: requires the existing
 * current_password too (server enforces and returns 401 on mismatch).
 *
 * We don't fetch the current password-set state on mount — instead we show
 * BOTH fields and let the user decide. If a password isn't set yet, the
 * current_password field can be left empty (server tolerates an empty
 * value on first-time set). Cleaner than rendering two slightly-different
 * cards.
 */

// Mirrors src/lib/password.ts. Server is the source of truth — this is just
// a client-side hint so we don't roundtrip on obviously-bad input.
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

export default function SetPasswordCard() {
  const [hasUser, setHasUser] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    try {
      setHasUser(typeof window !== "undefined" && !!localStorage.getItem("eduvian_student"));
    } catch {
      setHasUser(false);
    }
  }, []);

  if (!hasUser) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const strengthErr = clientValidate(newPassword);
    if (strengthErr) {
      setMsg({ kind: "err", text: strengthErr });
      return;
    }
    if (newPassword !== confirm) {
      setMsg({ kind: "err", text: "Passwords don't match." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_password: newPassword,
          // Send current_password only when filled — server treats absent as
          // "first-time set" and accepts; with a stored hash it's required.
          ...(currentPassword ? { current_password: currentPassword } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ kind: "err", text: data.error ?? "Could not save password." });
        return;
      }
      setMsg({
        kind: "ok",
        text: data.first_time
          ? "Password set! You can use it on the login page next time."
          : "Password updated.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setMsg({ kind: "err", text: "Connection error. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto mt-10 mb-6">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-blue-900" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Set / change your password</h3>
            <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
              Optional — gives you a faster way to sign in than the email-code flow. You can always fall back to the email code if you forget your password.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current password <span className="text-gray-400 font-normal">(skip if setting one for the first time)</span></label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Leave blank if you've never set one"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder={`At least ${MIN_LENGTH} characters, letters, numbers, special`}
              minLength={MIN_LENGTH}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-gray-400"
            />
            {/* Live strength checklist — green ticks as the user types so they
                see exactly which rule is still missing. */}
            <ul className="mt-2 space-y-0.5 text-[11px] text-gray-500">
              {[
                { ok: newPassword.length >= MIN_LENGTH,   label: `At least ${MIN_LENGTH} characters` },
                { ok: RE_LETTER.test(newPassword),         label: "Contains a letter (A–Z, a–z)" },
                { ok: RE_DIGIT.test(newPassword),          label: "Contains a number (0–9)" },
                { ok: RE_SPECIAL.test(newPassword),        label: "Contains a special character (e.g. ! @ # $ %)" },
              ].map((rule) => (
                <li key={rule.label} className="flex items-center gap-1.5">
                  <span className={rule.ok ? "text-emerald-600 font-bold" : "text-gray-300"}>
                    {rule.ok ? "✓" : "○"}
                  </span>
                  <span className={rule.ok ? "text-emerald-700" : ""}>{rule.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm new password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition placeholder:text-gray-400"
            />
          </div>

          {msg && (
            <div
              className={`flex items-start gap-2 text-xs px-3 py-2.5 rounded-xl border ${
                msg.kind === "ok"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {msg.kind === "ok" ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />}
              <span>{msg.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving…
              </>
            ) : (
              <>Save password</>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

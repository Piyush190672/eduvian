"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2, ShieldCheck } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import Link from "next/link";

type Step = "credentials" | "mfa";

interface SupabaseLike {
  auth: {
    signInWithPassword: (p: { email: string; password: string }) => Promise<{
      data: { session: { access_token: string } | null };
      error: { message: string } | null;
    }>;
    signOut: () => Promise<unknown>;
    mfa: {
      listFactors: () => Promise<{
        data: { totp?: Array<{ id: string; status: string }> } | null;
        error: { message: string } | null;
      }>;
      challengeAndVerify: (p: { factorId: string; code: string }) => Promise<{
        data: { access_token?: string } | null;
        error: { message: string } | null;
      }>;
      getAuthenticatorAssuranceLevel: () => Promise<{
        data: { currentLevel: string | null; nextLevel: string | null } | null;
        error: { message: string } | null;
      }>;
    };
    getSession: () => Promise<{ data: { session: { access_token: string } | null } }>;
  };
}

export default function AdminLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabaseRef = useRef<SupabaseLike | null>(null);
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  // Lazy-init the supabase client once.
  const getSupabase = async (): Promise<SupabaseLike> => {
    if (supabaseRef.current) return supabaseRef.current;
    const { createClient } = await import("@supabase/supabase-js");
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    ) as unknown as SupabaseLike;
    supabaseRef.current = sb;
    return sb;
  };

  // Autofocus OTP input when we transition to step 2.
  useEffect(() => {
    if (step === "mfa") {
      const t = setTimeout(() => otpInputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [step]);

  /** Issue the server-side admin cookie. Server enforces AAL2 if the user
   *  has any verified MFA factors — see /api/admin/session. */
  const issueAdminSession = async (accessToken: string) => {
    const sessionRes = await fetch("/api/admin/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!sessionRes.ok) {
      const body = await sessionRes.json().catch(() => ({}));
      const reason = (body as { error?: string }).error;
      const sb = await getSupabase();
      await sb.auth.signOut();
      throw new Error(
        sessionRes.status === 403
          ? reason === "mfa_required"
            ? "MFA required. Sign in again and enter the 6-digit code."
            : "This account is not authorized for admin access."
          : "Failed to establish admin session.",
      );
    }
  };

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const sb = await getSupabase();
      const { data, error: authError } = await sb.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (!data.session?.access_token) throw new Error("No session returned from Supabase.");

      // Step-up if a verified TOTP factor exists.
      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      const needsMfa = aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2";

      if (needsMfa) {
        const { data: factors, error: lfErr } = await sb.auth.mfa.listFactors();
        if (lfErr) throw lfErr;
        const verified = (factors?.totp ?? []).find((f) => f.status === "verified");
        if (!verified) throw new Error("MFA required but no verified factor on record.");
        setFactorId(verified.id);
        setStep("mfa");
        return;
      }

      // No MFA challenge needed — issue the cookie now.
      await issueAdminSession(data.session.access_token);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid credentials.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const sb = await getSupabase();
      const { error: vErr } = await sb.auth.mfa.challengeAndVerify({ factorId, code: otp });
      if (vErr) throw vErr;
      // After verify, the session's access_token is reissued at AAL2.
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) throw new Error("Could not refresh session after MFA.");
      await issueAdminSession(session.access_token);
      router.push("/admin/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Wrong code. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <EduvianLogoMark size={40} />
            <div>
              <span className="font-display font-bold text-2xl text-white tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
              <p className="text-sm font-bold text-indigo-300 leading-none">Your Global Future, Simplified</p>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-indigo-300 text-sm mt-1">
            {step === "credentials" ? "Counselor & admin access" : "Two-factor authentication"}
          </p>
        </div>

        {step === "credentials" ? (
          <form
            onSubmit={handleCredentials}
            autoComplete="off"
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                autoComplete="off"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
              />
            </div>

            {error && (
              <p className="text-rose-300 text-xs bg-rose-500/10 border border-rose-400/20 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Sign In
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleMfa}
            className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 space-y-4"
          >
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
              <p className="text-indigo-200 text-sm leading-relaxed">
                Enter the 6-digit code from your authenticator app.
              </p>
            </div>

            <input
              ref={otpInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="123456"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />

            {error && (
              <p className="text-rose-300 text-xs bg-rose-500/10 border border-rose-400/20 rounded-xl p-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Verify and continue
            </button>

            <button
              type="button"
              onClick={async () => {
                const sb = await getSupabase();
                await sb.auth.signOut();
                setStep("credentials");
                setOtp("");
                setFactorId(null);
                setError("");
              }}
              className="w-full text-indigo-300 hover:text-white text-xs underline-offset-2 hover:underline pt-2"
            >
              ← Sign out and start over
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

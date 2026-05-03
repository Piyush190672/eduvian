"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, ShieldAlert, ArrowLeft, KeyRound } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

interface VerifiedFactor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
  created_at: string;
}

/**
 * /admin/security
 *
 * One-time TOTP enrolment for the admin user. Flow:
 *   1. On mount, get the current Supabase session (must already be signed
 *      in via /admin). If not, bounce back to /admin.
 *   2. List existing factors. If a verified totp factor exists, show
 *      management UI (rename / unenrol). Otherwise show the enrol flow.
 *   3. Enrol → returns a QR code SVG + the secret. User scans with their
 *      authenticator app (1Password / Authy / Google Authenticator).
 *   4. User enters the 6-digit code. challengeAndVerify ties the factor
 *      to their Supabase user — from then on, /admin login will require
 *      the same code in addition to email + password.
 *
 * No server-side code is needed for the enrolment itself; Supabase's
 * client SDK talks directly to the auth service. The login-time AAL2
 * enforcement happens in /admin/page.tsx (challenge step) and
 * /api/admin/session (server-side AAL check).
 */
export default function AdminSecurityPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [supabase, setSupabase] = useState<{
    auth: {
      getSession: () => Promise<{ data: { session: { access_token: string; user: { email?: string } } | null } }>;
      mfa: {
        listFactors: () => Promise<{ data: { totp?: VerifiedFactor[] } | null; error: { message: string } | null }>;
        enroll: (params: { factorType: string }) => Promise<{ data: { id: string; totp: { qr_code: string; secret: string } } | null; error: { message: string } | null }>;
        challengeAndVerify: (params: { factorId: string; code: string }) => Promise<{ data: unknown; error: { message: string } | null }>;
        unenroll: (params: { factorId: string }) => Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
  } | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [factors, setFactors] = useState<VerifiedFactor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Enrolment state
  const [enrolling, setEnrolling] = useState(false);
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState(false);

  // Set up the supabase client and confirm the user is signed in.
  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        );
        setSupabase(sb as never);

        const { data: { session } } = await sb.auth.getSession();
        if (!session) {
          router.push("/admin");
          return;
        }
        setAdminEmail(session.user.email ?? null);

        const { data: factorsData, error: lfErr } = await sb.auth.mfa.listFactors();
        if (lfErr) throw lfErr;
        setFactors((factorsData?.totp ?? []) as VerifiedFactor[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load security settings");
      } finally {
        setHydrated(true);
      }
    })();
  }, [router]);

  const startEnrolment = async () => {
    if (!supabase) return;
    setLoading(true);
    setError("");
    try {
      const { data, error: enrErr } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enrErr || !data) throw enrErr ?? new Error("Enrolment failed");
      setEnrollFactorId(data.id);
      setQrSvg(data.totp.qr_code);
      setSecret(data.totp.secret);
      setEnrolling(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start enrolment");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !enrollFactorId) return;
    if (!/^[0-9]{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollFactorId,
        code,
      });
      if (vErr) throw vErr;
      setSuccess(true);
      // Refresh factor list.
      const { data: f } = await supabase.auth.mfa.listFactors();
      setFactors((f?.totp ?? []) as VerifiedFactor[]);
      setEnrolling(false);
      setQrSvg(null);
      setSecret(null);
      setCode("");
      setEnrollFactorId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wrong code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const removeFactor = async (factorId: string) => {
    if (!supabase) return;
    if (!confirm("Remove this MFA factor? You'll be able to sign in with email + password only until you enrol again.")) return;
    setLoading(true);
    setError("");
    try {
      const { error: uErr } = await supabase.auth.mfa.unenroll({ factorId });
      if (uErr) throw uErr;
      setFactors((prev) => prev.filter((f) => f.id !== factorId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove factor");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-200" />
      </div>
    );
  }

  const verifiedFactor = factors.find((f) => f.status === "verified");

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 px-4 py-12">
      <div className="max-w-xl mx-auto">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <EduvianLogoMark size={36} />
            <span className="font-display font-bold text-2xl text-white tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
          </div>
          <h1 className="text-3xl font-bold text-white">Security</h1>
          {adminEmail && (
            <p className="text-indigo-300 text-sm mt-1">Signed in as <span className="font-mono">{adminEmail}</span></p>
          )}
        </div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
          <div className="flex items-start gap-3 mb-6">
            <ShieldCheck className="w-6 h-6 text-indigo-300 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-white">Two-factor authentication</h2>
              <p className="text-indigo-200 text-sm mt-1 leading-relaxed">
                Adds a 6-digit code from your authenticator app on top of email + password. Recommended for the admin account.
              </p>
            </div>
          </div>

          {error && (
            <p className="mb-4 text-rose-300 text-sm bg-rose-500/10 border border-rose-400/20 rounded-xl p-3">
              {error}
            </p>
          )}

          {success && !enrolling && (
            <p className="mb-4 text-emerald-300 text-sm bg-emerald-500/10 border border-emerald-400/20 rounded-xl p-3 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
              MFA enabled. Next time you sign in to /admin you&apos;ll be asked for the 6-digit code from your app.
            </p>
          )}

          {/* Existing verified factor */}
          {verifiedFactor && !enrolling && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <p className="text-white font-semibold text-sm">Authenticator app</p>
                    <p className="text-indigo-300 text-xs">
                      Enrolled {new Date(verifiedFactor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFactor(verifiedFactor.id)}
                  disabled={loading}
                  className="text-rose-300 hover:text-rose-200 text-xs font-semibold underline-offset-2 hover:underline disabled:opacity-60"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* No factor yet, not currently enrolling */}
          {!verifiedFactor && !enrolling && (
            <button
              type="button"
              onClick={startEnrolment}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Set up authenticator app
            </button>
          )}

          {/* Enrolment in progress */}
          {enrolling && qrSvg && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl p-5 flex items-center justify-center">
                <div
                  className="w-44 h-44 [&>svg]:w-full [&>svg]:h-full"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              </div>
              <div className="text-indigo-100 text-sm leading-relaxed space-y-2">
                <p>1. Open your authenticator app (1Password, Authy, Google Authenticator).</p>
                <p>2. Scan the QR code above. <span className="text-indigo-300">Or enter the secret manually:</span></p>
                {secret && (
                  <p className="font-mono text-xs bg-white/10 rounded-lg px-3 py-2 break-all">{secret}</p>
                )}
                <p>3. Enter the 6-digit code your app shows.</p>
              </div>

              <form onSubmit={verifyCode} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEnrolling(false);
                      setQrSvg(null);
                      setSecret(null);
                      setCode("");
                      setEnrollFactorId(null);
                      setError("");
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/20 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-indigo-700 font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Verify and enable
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Helpful note when no factor yet */}
          {!verifiedFactor && !enrolling && !success && (
            <div className="mt-6 flex gap-3 text-indigo-200 text-xs leading-relaxed bg-amber-500/10 border border-amber-400/20 rounded-xl p-3">
              <ShieldAlert className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <p>
                Until you enrol, the admin login is protected by email + password + the owner allowlist. Adding 2FA closes the last open security audit finding.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

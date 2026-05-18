"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  LogIn,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  Phone,
  User,
  GraduationCap,
  Bookmark,
  Bell,
  Shield,
  ChevronLeft,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

type Mode = "choose" | "register" | "login";

const BENEFITS = [
  {
    icon: Bookmark,
    title: "Save your shortlist",
    desc: "Come back anytime and find your shortlisted universities exactly where you left them.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Bell,
    title: "Stay updated",
    desc: "Get notified about new matching programs, scholarship deadlines, and intake openings.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    icon: GraduationCap,
    title: "Personalised guidance",
    desc: "Your profile remembers your scores and preferences so you never have to fill the form again.",
    color: "text-pink-500",
    bg: "bg-pink-50",
  },
  {
    icon: Shield,
    title: "Your data, safe",
    desc: "We never share your data. It's used only to personalise your study-abroad matches.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
];

const RESEND_COOLDOWN_SECONDS = 60;

// Password strength — mirrors src/lib/password.ts. Server is authoritative;
// this is just a UX hint so we don't roundtrip on obviously-bad input.
const PW_MIN_LENGTH = 8;
const PW_RE_LETTER  = /[A-Za-z]/;
const PW_RE_DIGIT   = /[0-9]/;
const PW_RE_SPECIAL = /[^A-Za-z0-9]/;
function validatePassword(pw: string): string | null {
  if (pw.length < PW_MIN_LENGTH) return `Password must be at least ${PW_MIN_LENGTH} characters.`;
  if (!PW_RE_LETTER.test(pw))    return "Password must contain at least one letter.";
  if (!PW_RE_DIGIT.test(pw))     return "Password must contain at least one number.";
  if (!PW_RE_SPECIAL.test(pw))   return "Password must contain at least one special character (e.g. ! @ # $ % & *).";
  return null;
}

export default function GetStartedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  // After register OTP success, transition to "password" — set-a-password
  // is part of the same screen so users finish the auth flow in one place
  // instead of being asked again from /account/security later.
  const [step, setStep] = useState<"details" | "otp" | "password">("details");

  // Already signed in? Skip the login/register chooser entirely — the
  // expected flow when an authenticated user clicks "Get Started" again
  // is to continue where they left off, not re-enter their email.
  // 13 May 2026: fix for "going home then back to Get Started prompts
  // login again even though I'm logged in".
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem("eduvian_student")) {
        router.replace("/profile");
      }
    } catch {
      /* ignore */
    }
  }, [router]);
  // Login can now happen via email-OTP (existing flow) OR password (new
  // 12 May 2026). The user picks one BEFORE submitting their email. The
  // toggle is only visible in "login" mode — register stays OTP-only.
  const [loginMethod, setLoginMethod] = useState<"otp" | "password">("otp");

  // Register form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [resendIn, setResendIn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpInputRef = useRef<HTMLInputElement | null>(null);

  // Reset to step 1 whenever the user navigates between modes.
  useEffect(() => {
    setStep("details");
    setOtp("");
    setPassword("");
    setLoginMethod("otp");
  }, [mode]);

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  // Autofocus OTP input when step changes.
  useEffect(() => {
    if (step === "otp") {
      const t = setTimeout(() => otpInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [step]);

  const saveStudentLocally = (student: { name: string; email: string; phone: string; id?: string }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eduvian_student", JSON.stringify(student));
    }
  };

  /** Step 1 (register or login) — request the OTP and switch UI to step 2. */
  const requestOtp = async (purpose: "register" | "login") => {
    if (purpose === "register" && (!name.trim() || !phone.trim())) {
      setError("Please fill in all fields.");
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (purpose === "register" && !termsAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          purpose,
          name: purpose === "register" ? name.trim() : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not send the code. Please try again.");
        return;
      }
      setStep("otp");
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") return requestOtp("register");

    // OTP step → verify with /api/auth, then transition to password step
    // (NOT immediately route to /profile — the new register flow asks for a
    // password on the same screen before continuing).
    if (step === "otp") {
      if (!/^[0-9]{6}$/.test(otp)) {
        setError("Enter the 6-digit code from your email.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "register", name, email, phone, otp_code: otp, marketing_opt_in: marketingOptIn, terms_accepted: termsAccepted }),
        });
        const data = await res.json();
        if (data.ok) {
          saveStudentLocally({ name: data.student.name, email: data.student.email, phone: data.student.phone, id: data.student.id });
          setStep("password");
        } else {
          setError(data.error ?? "Something went wrong. Try again.");
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Password step → store the password against the just-created account,
    // then route to /profile. The /api/auth/set-password endpoint is gated
    // by the eduvianai_user cookie that the register step just minted.
    if (step === "password") {
      const strengthErr = validatePassword(password);
      if (strengthErr) {
        setError(strengthErr);
        return;
      }
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ new_password: password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error ?? "Could not save password. You can set one later from your profile.");
          return;
        }
        router.push("/profile");
      } catch {
        setError("Connection error. You can set a password later from your profile.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Skip the password step without setting one — user can still log in
  // with the email-OTP flow and set a password later from /account/security.
  const skipPassword = () => {
    router.push("/profile");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Password login branch ────────────────────────────────────────────
    // Single-step: email + password submit straight to /api/auth with
    // action="login_password". No OTP email round-trip.
    if (loginMethod === "password") {
      if (!password) {
        setError("Enter your password.");
        return;
      }
      setError("");
      setLoading(true);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login_password", email, password }),
        });
        const data = await res.json();
        if (data.ok) {
          saveStudentLocally({ name: data.student.name, email: data.student.email, phone: data.student.phone, id: data.student.id });
          if (data.token) router.push(`/results/${data.token}`);
          else router.push("/profile");
        } else if (data.reason === "no_password") {
          // Helpful nudge: this email has an account but no password set.
          setError(data.error ?? "No password set for this account.");
          // Auto-switch back to OTP so the user can sign in immediately,
          // then add a password from /profile.
          setLoginMethod("otp");
          setPassword("");
        } else {
          setError(data.error ?? "Wrong email or password.");
        }
      } catch {
        setError("Connection error. Please try again.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // ── OTP login branch (existing) ──────────────────────────────────────
    if (step === "details") return requestOtp("login");
    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, otp_code: otp }),
      });
      const data = await res.json();
      if (data.ok) {
        saveStudentLocally({ name: data.student.name, email: data.student.email, phone: data.student.phone, id: data.student.id });
        // If they have a previous submission, take them straight to their results
        if (data.token) {
          router.push(`/results/${data.token}`);
        } else {
          // Account exists but no submission yet — let them fill the profile form
          router.push("/profile");
        }
      } else {
        setError(data.error ?? "No account found. Please create a profile.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0 || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          purpose: mode === "login" ? "login" : "register",
          name: mode === "register" ? name.trim() : "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not resend the code.");
        return;
      }
      setResendIn(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (typeof window !== "undefined") localStorage.removeItem("eduvian_student");
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <EduvianLogoMark size={32} />
        </Link>
        <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
          ← Back to home
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">

          {/* ── CHOOSE MODE ─────────────────────────────── */}
          {mode === "choose" && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-4">
                  <GraduationCap className="w-4 h-4" /> Your study abroad journey starts here
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-3">
                  How would you like<br />
                  <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                    to get started?
                  </span>
                </h1>
                <p className="text-slate-400 text-lg max-w-xl mx-auto">
                  Create a free profile to save your progress, or jump straight in as a guest.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
                {/* Create Profile */}
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMode("register"); setError(""); setEmail(""); setName(""); setPhone(""); }}
                  className="group relative flex flex-col items-center text-center p-8 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-extrabold mb-2">Create Profile</h2>
                  <p className="text-indigo-200 text-sm leading-relaxed mb-5">
                    Best if you want to save your shortlist, ROI report, application checks, and visa tracker.
                  </p>
                  <span className="flex items-center gap-1.5 text-sm font-bold bg-white/20 rounded-xl px-4 py-2 group-hover:bg-white/30 transition-colors">
                    Get started free <ArrowRight className="w-4 h-4" />
                  </span>
                  <div className="absolute -top-2 -right-2 bg-emerald-400 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    Recommended
                  </div>
                </motion.button>

                {/* Login */}
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setMode("login"); setError(""); setEmail(""); }}
                  className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-indigo-400/40 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-5">
                    <LogIn className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-extrabold mb-2">Log In</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-5">
                    Welcome back! Continue your journey and see your saved shortlist.
                  </p>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-indigo-400 border border-indigo-500/40 rounded-xl px-4 py-2 group-hover:border-indigo-400 group-hover:text-indigo-300 transition-colors">
                    Continue <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.button>

                {/* Guest */}
                <motion.button
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGuest}
                  className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-slate-400/40 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-500/20 flex items-center justify-center mb-5">
                    <ArrowRight className="w-8 h-8 text-slate-400" />
                  </div>
                  <h2 className="text-xl font-extrabold mb-2">Continue as Guest</h2>
                  <p className="text-slate-400 text-sm leading-relaxed mb-5">
                    Good for a quick look. Create a profile later if you want to save your results.
                  </p>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 border border-slate-600/40 rounded-xl px-4 py-2 group-hover:border-slate-400 transition-colors">
                    Skip for now <ArrowRight className="w-4 h-4" />
                  </span>
                </motion.button>
              </div>

              {/* Benefits */}
              <div className="border-t border-white/10 pt-12">
                <p className="text-center text-slate-400 text-sm font-medium uppercase tracking-widest mb-8">
                  Why create a free profile?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  {BENEFITS.map((b) => (
                    <div key={b.title} className="flex flex-col items-start p-5 rounded-2xl bg-white/5 border border-white/10">
                      <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center mb-3`}>
                        <b.icon className={`w-5 h-5 ${b.color}`} />
                      </div>
                      <p className="font-bold text-white text-sm mb-1">{b.title}</p>
                      <p className="text-slate-400 text-xs leading-relaxed">{b.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-slate-500 text-xs mt-6">
                  100% free · No credit card · No spam
                </p>
              </div>
            </motion.div>
          )}

          {/* ── REGISTER FORM ───────────────────────────── */}
          {mode === "register" && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <button
                onClick={() => { setMode("choose"); setError(""); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-500/30">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">
                  {step === "password" ? "One last step" : step === "otp" ? "Check your inbox" : "Create your profile"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {step === "password"
                    ? "Set a password to sign in faster next time — or skip and use the email-code flow."
                    : step === "otp"
                      ? "Enter the 6-digit code we just emailed you."
                      : "Takes 10 seconds. Free forever."}
                </p>
              </div>

              <form onSubmit={handleRegister} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                {step === "details" && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Priya Sharma"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="priya@example.com"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Contact Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
                {step === "otp" && (
                  <>
                    <div className="text-center pb-2">
                      <p className="text-slate-300 text-sm">
                        We sent a 6-digit code to{" "}
                        <span className="text-white font-semibold">{email}</span>.
                      </p>
                      <p className="text-slate-500 text-xs mt-1">It expires in 5 minutes.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Verification Code *</label>
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
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </>
                )}
                {step === "password" && (
                  <>
                    <div className="text-center pb-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span className="text-xs font-semibold text-emerald-200">Email verified</span>
                      </div>
                      <p className="text-slate-300 text-sm">Now set a password for faster sign-in next time.</p>
                      <p className="text-slate-500 text-xs mt-1">You can skip and use the email-code flow forever — your call.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Create a password *</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        placeholder="At least 8 characters, letter, number, special"
                        minLength={PW_MIN_LENGTH}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        autoFocus
                      />
                      <ul className="mt-2.5 space-y-0.5 text-[11px] text-slate-400">
                        {[
                          { ok: password.length >= PW_MIN_LENGTH, label: `At least ${PW_MIN_LENGTH} characters` },
                          { ok: PW_RE_LETTER.test(password),       label: "Contains a letter" },
                          { ok: PW_RE_DIGIT.test(password),        label: "Contains a number" },
                          { ok: PW_RE_SPECIAL.test(password),      label: "Contains a special character (! @ # $ % &)" },
                        ].map((r) => (
                          <li key={r.label} className="flex items-center gap-1.5">
                            <span className={r.ok ? "text-emerald-400 font-bold" : "text-slate-600"}>{r.ok ? "✓" : "○"}</span>
                            <span className={r.ok ? "text-emerald-300" : ""}>{r.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5"
                  >
                    {error}
                  </motion.p>
                )}

                {step === "details" && (
                  <>
                    <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 leading-relaxed">
                      📬 We&apos;ll email you a 6-digit code. <span className="font-semibold text-amber-200">Check your Junk / Spam folder</span> if you don&apos;t see it within a minute.
                    </p>
                    {/* Terms + Privacy explicit acceptance (legal P0 #5). Required for register. */}
                    <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none px-1 pt-1">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500 cursor-pointer flex-shrink-0"
                        required
                      />
                      <span className="leading-relaxed">
                        I agree to the{" "}
                        <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline">Terms of Service</Link>
                        {" "}and{" "}
                        <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-300 hover:text-indigo-200 underline-offset-2 hover:underline">Privacy Policy</Link>.
                      </span>
                    </label>
                    {/* Marketing opt-in — Privacy Policy §11. Default OFF; transactional sends ignore this flag. */}
                    <label className="flex items-start gap-3 text-xs text-slate-300 cursor-pointer select-none px-1 pt-1">
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 accent-indigo-500 cursor-pointer flex-shrink-0"
                      />
                      <span className="leading-relaxed">
                        Send me occasional emails with study-abroad tips, scholarship deadlines and product updates. Unsubscribe anytime via the link in any email. <span className="text-slate-500">(Optional — service-related emails such as your match results are sent regardless.)</span>
                      </span>
                    </label>
                  </>
                )}

                <button
                  type="submit"
                  disabled={
                    loading
                    || (step === "otp" && otp.length !== 6)
                    || (step === "password" && password.length < PW_MIN_LENGTH)
                  }
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {step === "details" ? "Sending code…" : step === "otp" ? "Verifying…" : "Saving password…"}</>
                  ) : step === "details" ? (
                    <>Send verification code <ArrowRight className="w-4 h-4" /></>
                  ) : step === "otp" ? (
                    <>Verify & continue <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Save password & continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                {step === "otp" && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep("details"); setOtp(""); setError(""); }}
                      className="hover:text-white transition-colors"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendIn > 0 || loading}
                      className={`hover:text-white transition-colors ${resendIn > 0 ? "cursor-not-allowed text-slate-600" : ""}`}
                    >
                      {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                    </button>
                  </div>
                )}

                {step === "password" && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={skipPassword}
                      className="text-xs text-slate-400 hover:text-white underline-offset-2 hover:underline transition-colors"
                    >
                      Skip — I&apos;ll set one later
                    </button>
                  </div>
                )}

                <p className="text-center text-slate-500 text-xs">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setError(""); setEmail(""); }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Log in
                  </button>
                </p>
              </form>

              {/* Mini benefits */}
              <div className="mt-6 space-y-2.5">
                {["Your shortlist is saved for future visits", "Get email updates on deadlines & new programs", "Resume your profile anytime, on any device"].map((t) => (
                  <div key={t} className="flex items-center gap-2.5 text-slate-400 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LOGIN FORM ──────────────────────────────── */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="max-w-md mx-auto"
            >
              <button
                onClick={() => { setMode("choose"); setError(""); }}
                className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Welcome back!</h2>
                <p className="text-slate-400 text-sm">Enter your email to pick up where you left off.</p>
              </div>

              <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
                {/* Login-method toggle — only visible on the first step
                    (before the user has committed to OTP or password). */}
                {step === "details" && (
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                    <button
                      type="button"
                      onClick={() => { setLoginMethod("otp"); setError(""); setPassword(""); }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        loginMethod === "otp"
                          ? "bg-indigo-500 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Email code
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMethod("password"); setError(""); setOtp(""); }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        loginMethod === "password"
                          ? "bg-indigo-500 text-white shadow"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Password
                    </button>
                  </div>
                )}

                {step === "details" ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="priya@example.com"
                          autoComplete="email"
                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Password field only when password login is selected.
                        For OTP, we just take the email here and prompt for
                        the 6-digit code on the next step. */}
                    {loginMethod === "password" && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">Password *</label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Your password"
                          autoComplete="current-password"
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                          required
                        />
                        <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
                          Haven&apos;t set one yet? Sign in with <span className="text-slate-300 font-semibold">Email code</span> first, then add a password from your profile.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-center pb-2">
                      <p className="text-slate-300 text-sm">
                        We sent a 6-digit code to{" "}
                        <span className="text-white font-semibold">{email}</span>.
                      </p>
                      <p className="text-slate-500 text-xs mt-1">It expires in 5 minutes.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Verification Code *</label>
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
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white text-center text-2xl font-mono tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                  </>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5"
                  >
                    {error}
                    {step === "details" && (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() => { setMode("register"); setError(""); }}
                          className="text-indigo-400 font-semibold underline"
                        >
                          Create one now
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {step === "details" && (
                  <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 leading-relaxed">
                    📬 We&apos;ll email you a 6-digit code. <span className="font-semibold text-amber-200">Check your Junk / Spam folder</span> if you don&apos;t see it within a minute.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    loading
                    || (step === "otp" && otp.length !== 6)
                    || (loginMethod === "password" && !password)
                  }
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {step === "details" && loginMethod === "otp" ? "Sending code…" : "Signing in…"}</>
                  ) : step === "details" && loginMethod === "otp" ? (
                    <>Send verification code <ArrowRight className="w-4 h-4" /></>
                  ) : step === "details" && loginMethod === "password" ? (
                    <>Sign in <ArrowRight className="w-4 h-4" /></>
                  ) : (
                    <>Log In & Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                {step === "otp" && (
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
                    <button
                      type="button"
                      onClick={() => { setStep("details"); setOtp(""); setError(""); }}
                      className="hover:text-white transition-colors"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendIn > 0 || loading}
                      className={`hover:text-white transition-colors ${resendIn > 0 ? "cursor-not-allowed text-slate-600" : ""}`}
                    >
                      {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                    </button>
                  </div>
                )}

                <p className="text-center text-slate-500 text-xs">
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setError(""); setEmail(""); }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Create a free profile
                  </button>
                </p>
              </form>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

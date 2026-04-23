"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

interface AuthGateProps {
  stage: 2 | 3 | 4;
  toolName: string;
  source: string;
  children: React.ReactNode;
}

const STAGE_CONFIG = {
  2: {
    pill:      "Stage 2 · Check & Write",
    gradient:  "from-violet-600 to-indigo-600",
    btnGrad:   "from-violet-500 to-indigo-600",
    btnShadow: "shadow-violet-200",
    ringColor: "focus:ring-violet-300",
    benefits: [
      "AI-scored application story check",
      "SOP writer trained on real admissions data",
      "Credibility gap analysis across 7 dimensions",
      "Save your draft and revisit anytime",
    ],
  },
  3: {
    pill:      "Stage 3 · Practice",
    gradient:  "from-emerald-600 to-teal-600",
    btnGrad:   "from-emerald-500 to-teal-600",
    btnShadow: "shadow-emerald-200",
    ringColor: "focus:ring-emerald-300",
    benefits: [
      "AI Interview Coach — AU, UK & US F-1",
      "Full-length IELTS, PTE, DET & TOEFL mocks",
      "AI-scored writing and speaking tasks",
      "Detailed feedback with improvement tips",
    ],
  },
  4: {
    pill:      "Stage 4 · Decide",
    gradient:  "from-amber-500 to-orange-500",
    btnGrad:   "from-amber-500 to-orange-500",
    btnShadow: "shadow-amber-200",
    ringColor: "focus:ring-amber-300",
    benefits: [
      "ROI Calculator with 10-year earnings projection",
      "Real payback period with cost-of-living data",
      "Parent Decision Tool with family-ready verdict",
      "Side-by-side university comparison",
    ],
  },
};

export default function AuthGate({ stage, toolName, source, children }: AuthGateProps) {
  const [isAuthed, setIsAuthed]   = useState<boolean | null>(null);
  const [mode, setMode]           = useState<"register" | "login">("register");
  const [name, setName]           = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const cfg = STAGE_CONFIG[stage];

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("eduvian_student") : null;
    setIsAuthed(!!raw);
  }, []);

  const saveAndUnlock = (student: { name: string; email: string; phone: string; id?: string }) => {
    localStorage.setItem("eduvian_student", JSON.stringify(student));
    setIsAuthed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required."); return; }
    if (mode === "register" && !name.trim()) { setError("Your name is required."); return; }
    setLoading(true);
    setError("");
    try {
      const body = mode === "register"
        ? { action: "register", name: name.trim(), email: email.trim(), phone: phone.trim(), source, source_stage: stage }
        : { action: "login",    email: email.trim(), source, source_stage: stage };
      const res  = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error ?? "Something went wrong. Please try again."); return; }
      saveAndUnlock({ name: data.student.name, email: data.student.email, phone: data.student.phone, id: data.student.id });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Still hydrating — show blank page in page's own bg colour to avoid flash
  if (isAuthed === null) return <div className="min-h-screen bg-white" />;

  // Authenticated — render the protected page
  if (isAuthed) return <>{children}</>;

  // Not authenticated — show the auth wall
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ─── Left panel: value prop ─── */}
      <div className={`lg:w-[46%] bg-gradient-to-br ${cfg.gradient} relative overflow-hidden flex flex-col justify-between px-10 py-12 lg:px-16 lg:py-20`}>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2 w-fit">
          <EduvianLogoMark size={36} />
          <span className="font-display font-bold text-lg text-white tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
        </Link>

        {/* Main copy */}
        <div className="relative z-10 mt-12 lg:mt-0">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
            <Lock className="w-3.5 h-3.5 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">{cfg.pill}</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-4">
            Free access.<br />Just create an account.
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10 max-w-sm">
            You&apos;re one step from unlocking{" "}
            <span className="text-white font-semibold">{toolName}</span>{" "}
            — and every tool in Stage {stage}.
          </p>
          <div className="space-y-3.5">
            {cfg.benefits.map((b) => (
              <div key={b} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-white/80 flex-shrink-0 mt-0.5" />
                <span className="text-white/80 text-sm leading-relaxed">{b}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/40 text-xs mt-12 lg:mt-0">
          100% free · No credit card · Your data stays private
        </p>
      </div>

      {/* ─── Right panel: form ─── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">

          {/* Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {m === "register" ? "Create Account" : "Sign In"}
              </button>
            ))}
          </div>

          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              {mode === "register" ? "Create your free account" : "Welcome back"}
            </h1>
            <p className="text-sm text-gray-400 mb-8">
              {mode === "register"
                ? `Unlock ${toolName} and all Stage ${stage} tools — it's free forever.`
                : "Sign in to continue where you left off."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 ${cfg.ringColor} transition-shadow`}
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 ${cfg.ringColor} transition-shadow`}
                  required
                />
              </div>
              {mode === "register" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Phone Number{" "}
                    <span className="font-normal text-gray-300 normal-case">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 ${cfg.ringColor} transition-shadow`}
                  />
                </div>
              )}

              {error && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-xl px-4 py-3 border border-rose-100">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r ${cfg.btnGrad} text-white font-bold text-sm shadow-lg ${cfg.btnShadow} hover:-translate-y-0.5 hover:shadow-xl transition-all disabled:opacity-60 disabled:translate-y-0 mt-2`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {mode === "register" ? "Creating account…" : "Signing in…"}
                  </span>
                ) : (
                  <>
                    {mode === "register" ? "Create Free Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-center text-gray-400 mt-6">
              By continuing, you agree to our terms. Your data is never sold or shared.
            </p>
          </motion.div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1.5">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

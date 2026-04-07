"use client";

import { useState } from "react";
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

export default function GetStartedPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");

  // Register form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveStudentLocally = (student: { name: string; email: string; phone: string; id?: string }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("eduvian_student", JSON.stringify(student));
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, email, phone }),
      });
      const data = await res.json();
      if (data.ok) {
        saveStudentLocally({ name: data.student.name, email: data.student.email, phone: data.student.phone, id: data.student.id });
        router.push("/profile");
      } else {
        setError(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email }),
      });
      const data = await res.json();
      if (data.ok) {
        saveStudentLocally({ name: data.student.name, email: data.student.email, phone: data.student.phone, id: data.student.id });
        router.push("/profile");
      } else {
        setError(data.error ?? "No account found. Please create a profile.");
      }
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
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-white text-lg">eduvianAI</span>
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
                    Save your details, shortlist, and results. Pick up right where you left off.
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
                    Explore matches instantly — no account needed. Your results won&apos;t be saved.
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
                <h2 className="text-3xl font-extrabold text-white mb-2">Create your profile</h2>
                <p className="text-slate-400 text-sm">Takes 10 seconds. Free forever.</p>
              </div>

              <form onSubmit={handleRegister} className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5">
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

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating profile…</>
                  ) : (
                    <>Create Profile & Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

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

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-2.5"
                  >
                    {error}{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(""); }}
                      className="text-indigo-400 font-semibold underline"
                    >
                      Create one now
                    </button>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Looking you up…</>
                  ) : (
                    <>Log In & Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

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

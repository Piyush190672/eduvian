"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Globe2,
  Sparkles,
  Target,
  BookOpen,
  GraduationCap,
  ChevronRight,
  Star,
  Users,
  Award,
  ArrowRight,
  MapPin,
  TrendingUp,
} from "lucide-react";

const COUNTRIES = [
  { flag: "🇺🇸", name: "USA" },
  { flag: "🇬🇧", name: "UK" },
  { flag: "🇦🇺", name: "Australia" },
  { flag: "🇨🇦", name: "Canada" },
  { flag: "🇳🇿", name: "New Zealand" },
  { flag: "🇮🇪", name: "Ireland" },
  { flag: "🇩🇪", name: "Germany" },
  { flag: "🇫🇷", name: "France" },
  { flag: "🇦🇪", name: "UAE" },
  { flag: "🇸🇬", name: "Singapore" },
  { flag: "🇲🇾", name: "Malaysia" },
];

const STATS = [
  { icon: GraduationCap, value: "500+", label: "Programs Listed" },
  { icon: Globe2, value: "11", label: "Countries" },
  { icon: Users, value: "10K+", label: "Students Matched" },
  { icon: Award, value: "98%", label: "Satisfaction Rate" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: BookOpen,
    title: "Tell us about yourself",
    desc: "Share your academic scores, test results, budget, and dream countries in our quick 4-step form.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Our engine works its magic",
    desc: "We score hundreds of programs against your profile using 8 weighted signals including GPA, English scores, budget, and QS ranking.",
    color: "from-purple-500 to-pink-500",
  },
  {
    step: "03",
    icon: Target,
    title: "Get your personalized shortlist",
    desc: "Receive Safe, Moderate, and Reach matches — each with a match score and profile fit percentage.",
    color: "from-pink-500 to-rose-500",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    from: "Mumbai, India",
    dest: "MS CS @ University of Toronto",
    text: "Eduvian gave me a shortlist that was actually realistic for my profile. Got into my first-choice safe match!",
    score: "82% match",
    avatar: "PS",
  },
  {
    name: "Arjun Mehta",
    from: "Bangalore, India",
    dest: "MBA @ University of Manchester",
    text: "The tiered system was a game changer. I knew exactly which programs I had a strong shot at.",
    score: "76% match",
    avatar: "AM",
  },
  {
    name: "Fatima Al-Hassan",
    from: "Dubai, UAE",
    dest: "MSc Data Science @ UCL",
    text: "Got my results instantly and the email link let me share the shortlist with my parents. Really well designed.",
    score: "79% match",
    avatar: "FA",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900">Eduvian</span>
            <p className="text-sm font-bold text-gray-400 leading-none">Your Global Future, Simplified</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/profile"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-pink-100/40 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered University Matching
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight mb-6"
          >
            Your dream uni is{" "}
            <span className="gradient-text">closer than you think</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10"
          >
            Tell us your profile. Get a personalised shortlist of programs you
            can actually get into — across 11 countries, ranked by how well they
            match <em>you</em>.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link
              href="/profile"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold hover:shadow-2xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-1"
            >
              Find my programs
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <span className="text-sm text-gray-400">
              Free · No account needed · 3 minutes
            </span>
          </motion.div>

          {/* Countries strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-3"
          >
            {COUNTRIES.map((c) => (
              <span
                key={c.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm text-sm text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
              >
                {c.flag} {c.name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 bg-white/60 backdrop-blur-sm border-y border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <s.icon className="w-6 h-6 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {s.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-indigo-500 font-semibold text-sm uppercase tracking-wider">
              How it works
            </span>
            <h2 className="text-4xl font-extrabold text-gray-900 mt-2">
              Three steps to your shortlist
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                className="relative p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6`}
                >
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-5xl font-black text-gray-50 absolute top-6 right-6">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Matching signals */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="text-purple-300 font-semibold text-sm uppercase tracking-wider">
            The matching engine
          </span>
          <h2 className="text-4xl font-extrabold mt-2 mb-4">
            8 signals. One perfect match.
          </h2>
          <p className="text-indigo-200 mb-12 text-lg">
            We don't just filter — we score. Every program gets a weighted match
            score across these signals.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Academic Score", pct: "35%", color: "bg-indigo-400" },
              { label: "English Proficiency", pct: "15%", color: "bg-purple-400" },
              { label: "Budget Fit", pct: "15%", color: "bg-pink-400" },
              { label: "Country Preference", pct: "15%", color: "bg-rose-400" },
              { label: "QS University Rank", pct: "5%", color: "bg-amber-400" },
              { label: "Intake Availability", pct: "5%", color: "bg-emerald-400" },
              { label: "Work Experience", pct: "5%", color: "bg-cyan-400" },
              { label: "Standardized Tests", pct: "5%", color: "bg-blue-400" },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm hover:bg-white/15 transition-colors"
              >
                <div
                  className={`text-2xl font-black ${s.color.replace("bg-", "text-")} mb-1`}
                >
                  {s.pct}
                </div>
                <div className="text-xs text-indigo-200 leading-snug">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-indigo-500 font-semibold text-sm uppercase tracking-wider">
            Results
          </span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">
            Know where you stand
          </h2>
          <p className="text-gray-500 mb-12 text-lg">
            Programs are tiered so you apply strategically — like the pros.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                tier: "Safe Match",
                range: "80–100",
                emoji: "✅",
                color: "border-emerald-200 bg-emerald-50",
                textColor: "text-emerald-700",
                desc: "Strong profile fit. High likelihood of admission. Apply with confidence.",
              },
              {
                tier: "Reach",
                range: "50–79",
                emoji: "🎯",
                color: "border-amber-200 bg-amber-50",
                textColor: "text-amber-700",
                desc: "Good fit with a few gaps. A well-crafted SOP can close the gap.",
              },
              {
                tier: "Ambitious",
                range: "25–49",
                emoji: "🚀",
                color: "border-orange-200 bg-orange-50",
                textColor: "text-orange-700",
                desc: "Aspirational. Competitive profile but below typical admit range. Dream big.",
              },
            ].map((t) => (
              <motion.div
                key={t.tier}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                className={`p-8 rounded-3xl border-2 ${t.color}`}
              >
                <div className="text-4xl mb-4">{t.emoji}</div>
                <div className={`text-xl font-bold mb-1 ${t.textColor}`}>
                  {t.tier}
                </div>
                <div className={`text-sm font-medium mb-3 ${t.textColor} opacity-70`}>
                  Score {t.range}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900">
              Students who made it
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  &quot;{t.text}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {t.name}
                    </div>
                    <div className="text-xs text-gray-400">{t.from}</div>
                  </div>
                  <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-medium border border-emerald-100">
                    {t.score}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-500">
                  <MapPin className="w-3 h-3" />
                  {t.dest}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            whileInView={{ opacity: 1, scale: 1 }}
            initial={{ opacity: 0, scale: 0.95 }}
            className="p-12 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDB2NmgxMnYtNkgzMHptLTYgMHY2aDZ2LTZoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
            <div className="relative">
              <TrendingUp className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h2 className="text-4xl font-extrabold mb-4">
                Start your journey today
              </h2>
              <p className="text-indigo-100 mb-8 text-lg">
                Free. Takes 3 minutes. No account needed.
                <br />
                Get your shortlist emailed to you instantly.
              </p>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-indigo-600 text-lg font-bold hover:bg-indigo-50 transition-colors shadow-lg hover:shadow-xl"
              >
                Find my programs
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Globe2 className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">Eduvian</span>
              <p className="text-xs text-gray-400">Your Global Future, Simplified</p>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            © 2025 Eduvian. Helping students find their path abroad.
          </p>
          <Link
            href="/admin"
            className="text-sm text-gray-300 hover:text-gray-500 transition-colors"
          >
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import ChatWidget from "@/components/ChatWidget";
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
  CheckCircle2,
  Zap,
  FileText,
  Heart,
} from "lucide-react";

const SCHOLARSHIPS: {
  name: string;
  flag: string;
  scholarships: { name: string; coverage: string; note?: string }[];
}[] = [
  {
    name: "USA",
    flag: "🇺🇸",
    scholarships: [
      { name: "Fulbright Foreign Student Program", coverage: "Fully funded", note: "Tuition, living stipend, travel & health insurance" },
      { name: "Hubert H. Humphrey Fellowship", coverage: "Fully funded", note: "Mid-career professionals; no degree awarded" },
      { name: "University Merit Scholarships", coverage: "Partial – Full", note: "Presidential, Dean's & departmental awards at most universities" },
      { name: "STEM OPT + RA/TA Funding", coverage: "Tuition waiver + stipend", note: "Common for PhD & MS STEM students" },
      { name: "Aga Khan Foundation", coverage: "Partial", note: "For students from developing countries" },
    ],
  },
  {
    name: "UK",
    flag: "🇬🇧",
    scholarships: [
      { name: "Chevening Scholarship", coverage: "Fully funded", note: "UK Govt — tuition, living, travel; 1-year Masters" },
      { name: "Commonwealth Scholarship", coverage: "Fully funded", note: "For students from Commonwealth nations" },
      { name: "GREAT Scholarship", coverage: "£10,000 min", note: "UK Govt + university partnership" },
      { name: "Gates Cambridge Scholarship", coverage: "Fully funded", note: "For exceptional scholars at Cambridge" },
      { name: "Rhodes Scholarship", coverage: "Fully funded", note: "For postgraduate study at Oxford; highly competitive" },
      { name: "University Scholarships", coverage: "Partial – Full", note: "UCL, Imperial, Edinburgh, Manchester all offer merit awards" },
    ],
  },
  {
    name: "Australia",
    flag: "🇦🇺",
    scholarships: [
      { name: "Australia Awards", coverage: "Fully funded", note: "Australian Govt; tuition, living, travel, health" },
      { name: "Destination Australia", coverage: "AUD 15,000/yr", note: "For study in regional Australia" },
      { name: "Research Training Program (RTP)", coverage: "Tuition waiver + stipend", note: "For PhD & research Masters students" },
      { name: "Monash International Merit", coverage: "AUD 10,000–50,000", note: "Based on academic excellence" },
      { name: "University of Sydney ISS", coverage: "25–50% tuition", note: "International Student Scholarship at USYD" },
      { name: "Endeavour Scholarships", coverage: "Fully funded", note: "Govt-backed; for high-achieving international students" },
    ],
  },
  {
    name: "Canada",
    flag: "🇨🇦",
    scholarships: [
      { name: "Vanier Canada Graduate Scholarship", coverage: "CAD 50,000/yr", note: "Doctoral students; world-class research" },
      { name: "Banting Postdoctoral Fellowship", coverage: "CAD 70,000/yr", note: "For postdoctoral researchers" },
      { name: "UBC International Major Entrance", coverage: "CAD 40,000+", note: "For top UG applicants to UBC" },
      { name: "UofT International Scholar Award", coverage: "CAD 40,000+", note: "For high-achieving incoming UG students" },
      { name: "Ontario Trillium Scholarship", coverage: "CAD 40,000/yr", note: "For international PhD students in Ontario" },
      { name: "University Merit Awards", coverage: "Partial – Full", note: "Available at Waterloo, McGill, Alberta & most others" },
    ],
  },
  {
    name: "Germany",
    flag: "🇩🇪",
    scholarships: [
      { name: "DAAD Scholarship", coverage: "€750–1,200/month", note: "Germany's largest scholarship org; many programmes" },
      { name: "Deutschlandstipendium", coverage: "€300/month", note: "Co-funded by govt and private sponsors" },
      { name: "Heinrich Böll Foundation", coverage: "€850/month + extras", note: "For socially and politically active students" },
      { name: "Friedrich Ebert Foundation", coverage: "€850/month + extras", note: "Focus on social justice and democracy" },
      { name: "Konrad Adenauer Foundation", coverage: "€850/month + extras", note: "For academically excellent students" },
      { name: "Erasmus+ (exchange)", coverage: "€300–600/month", note: "For EU-programme students on exchange" },
    ],
  },
  {
    name: "Singapore",
    flag: "🇸🇬",
    scholarships: [
      { name: "Singapore Government Scholarship (MOE)", coverage: "Fully funded", note: "Tuition + living allowance + bond required" },
      { name: "ASEAN Undergraduate Scholarship", coverage: "Fully funded", note: "For ASEAN nationals; tuition + accommodation + allowance" },
      { name: "NUS Research Scholarship", coverage: "Tuition waiver + SGD 2,000/month", note: "For PhD research students at NUS" },
      { name: "NTU Research Scholarship", coverage: "Tuition waiver + SGD 2,000/month", note: "For PhD students at NTU" },
      { name: "A*STAR Graduate Scholarship", coverage: "Fully funded", note: "For research-focused PhD students in science & tech" },
    ],
  },
  {
    name: "New Zealand",
    flag: "🇳🇿",
    scholarships: [
      { name: "New Zealand Excellence Awards (NZEA)", coverage: "NZD 10,000", note: "For international students at NZ universities" },
      { name: "New Zealand Aid Programme", coverage: "Fully funded", note: "For students from eligible developing countries" },
      { name: "University of Auckland ISES", coverage: "NZD 10,000", note: "International Student Excellence Scholarship" },
      { name: "Victoria University Merit Award", coverage: "NZD 5,000–10,000", note: "For high-achieving international students" },
    ],
  },
  {
    name: "Ireland",
    flag: "🇮🇪",
    scholarships: [
      { name: "Govt of Ireland International Education", coverage: "Fully funded", note: "60 awards/yr; tuition + €10,000 stipend" },
      { name: "IRC Government of Ireland Postgrad", coverage: "€16,000/yr + fees", note: "Irish Research Council; Masters & PhD" },
      { name: "UCD Global Excellence Scholarship", coverage: "€3,000–10,000", note: "For top international applicants to UCD" },
      { name: "TCD Provost's Scholarship", coverage: "Full fees", note: "For highest-ranked applicants to Trinity" },
      { name: "Enterprise Ireland Innovation Voucher", coverage: "Funded projects", note: "For students working with Irish companies" },
    ],
  },
  {
    name: "France",
    flag: "🇫🇷",
    scholarships: [
      { name: "Eiffel Excellence Scholarship", coverage: "€1,181/month + extras", note: "French Govt; Masters & PhD; highly competitive" },
      { name: "Campus France Bilateral Scholarships", coverage: "Varies by country", note: "India-France bilateral awards" },
      { name: "HEC Paris Merit Scholarship", coverage: "Up to €30,000", note: "For outstanding MBA & Masters candidates" },
      { name: "Erasmus+ Scholarship", coverage: "€300–600/month", note: "For exchange students in EU programmes" },
      { name: "Région Île-de-France Scholarships", coverage: "€10,000+", note: "Regional council grants for Paris-area students" },
    ],
  },
  {
    name: "UAE",
    flag: "🇦🇪",
    scholarships: [
      { name: "NYU Abu Dhabi Scholarship", coverage: "Fully funded", note: "Tuition, housing, stipend; extremely competitive" },
      { name: "Khalifa University Scholarship", coverage: "Full tuition + AED 1,500/month", note: "For top STEM students" },
      { name: "AUS Merit Scholarship", coverage: "25–100% tuition", note: "American University of Sharjah" },
      { name: "ADEC Scholarship (Abu Dhabi)", coverage: "Fully funded", note: "For select bilateral country agreements" },
      { name: "Mubadala / ADNOC Sponsorships", coverage: "Fully funded", note: "Corporate-sponsored; bond required post-study" },
    ],
  },
  {
    name: "Malaysia",
    flag: "🇲🇾",
    scholarships: [
      { name: "Malaysian Govt (MoHE) Scholarship", coverage: "Full tuition + living", note: "For select bilateral partner countries" },
      { name: "Monash Malaysia VC Scholarship", coverage: "Full tuition", note: "For top applicants to Monash Malaysia" },
      { name: "University of Nottingham Malaysia Merit", coverage: "25–50% tuition", note: "Academic excellence award" },
      { name: "Petronas Education Scholarship", coverage: "Fully funded", note: "For STEM students; bond with Petronas required" },
      { name: "MQA / PTPTN Education Loan", coverage: "Subsidised loan", note: "Available to international students at select programmes" },
    ],
  },
];
import CountryModal from "@/components/CountryModal";

const COUNTRIES = [
  { flag: "🇺🇸", name: "USA", img: "https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&q=80" },
  { flag: "🇬🇧", name: "UK", img: "https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=400&q=80" },
  { flag: "🇦🇺", name: "Australia", img: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=400&q=80" },
  { flag: "🇨🇦", name: "Canada", img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?w=400&q=80" },
  { flag: "🇩🇪", name: "Germany", img: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80" },
  { flag: "🇸🇬", name: "Singapore", img: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80" },
  { flag: "🇳🇿", name: "New Zealand", img: "https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=400&q=80" },
  { flag: "🇮🇪", name: "Ireland", img: "https://images.unsplash.com/photo-1549918864-48ac978761a4?w=400&q=80" },
  { flag: "🇫🇷", name: "France", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80" },
  { flag: "🇦🇪", name: "UAE", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
  { flag: "🇲🇾", name: "Malaysia", img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&q=80" },
];

const STATS = [
  { icon: GraduationCap, value: "5,400+", label: "Programs Listed" },
  { icon: Globe2, value: "11", label: "Countries" },
  { icon: Users, value: "240+", label: "Universities" },
  { icon: Award, value: "17", label: "Fields of Study" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: BookOpen,
    title: "Tell us about yourself",
    desc: "Share your academic scores, English test results, budget, and dream destinations in our quick 4-step form.",
    color: "from-indigo-500 to-violet-500",
    bg: "bg-indigo-50",
  },
  {
    step: "02",
    icon: Zap,
    title: "AI matches your profile",
    desc: "Our engine scores 5,400+ programs using 10 signals — GPA, language scores, budget, backlogs, gap year, QS rankings and more.",
    color: "from-violet-500 to-fuchsia-500",
    bg: "bg-violet-50",
  },
  {
    step: "03",
    icon: Target,
    title: "Get your TOP 20 shortlist",
    desc: "Receive Safe, Reach, and Ambitious matches — each ranked by how well they fit your unique profile.",
    color: "from-fuchsia-500 to-rose-500",
    bg: "bg-fuchsia-50",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    from: "Mumbai, India",
    dest: "MS CS @ University of Toronto",
    text: "eduvianAI gave me a shortlist that was actually realistic for my profile. Got into my first-choice safe match!",
    score: "82% match",
    img: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&q=80",
  },
  {
    name: "Arjun Mehta",
    from: "Bangalore, India",
    dest: "MBA @ University of Manchester",
    text: "The tiered system was a game changer. I knew exactly which programs I had a strong shot at.",
    score: "76% match",
    img: "https://images.unsplash.com/photo-1556157382-97eda2f9e2bf?w=100&q=80",
  },
  {
    name: "Fatima Al-Hassan",
    from: "Dubai, UAE",
    dest: "MSc Data Science @ UCL",
    text: "Got my results instantly and the email link let me share the shortlist with my parents. Really well designed.",
    score: "79% match",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100&q=80",
  },
];

const FEATURES = [
  { icon: CheckCircle2, text: "Free — no account needed" },
  { icon: CheckCircle2, text: "Takes only 3 minutes" },
  { icon: CheckCircle2, text: "Results emailed instantly" },
  { icon: CheckCircle2, text: "5,400+ programs across 240+ universities, 11 countries" },
];

export default function LandingPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Globe2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-gray-900 tracking-tight">eduvianAI</span>
            <p className="text-xs text-gray-400 leading-none font-medium">Your Global Future, Simplified</p>
          </div>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
          <a href="#countries" className="hover:text-indigo-600 transition-colors">Destinations</a>
          <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Success Stories</a>
        </div>
        <Link
          href="/get-started"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200 hover:-translate-y-0.5"
        >
          Get Started Free
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-20 min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950">
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1562774053-701939374585?w=1600&q=80"
            alt="University campus"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-indigo-950/80 to-transparent" />
        </div>

        {/* Glow blobs */}
        <div className="absolute top-32 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center w-full">
          {/* Left — text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/40 mb-3"
              >
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
                <span className="text-white text-lg font-extrabold tracking-wide uppercase">
                  AI-Powered University Matching
                </span>
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </motion.div>
              <p className="text-indigo-300 text-sm font-medium pl-1 italic">
                The smartest way to find your perfect university abroad
              </p>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-tight mb-6 tracking-tight">
              Your dream uni<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                is closer than<br />you think
              </span>
            </h1>
            <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-lg">
              Fill in your profile once. Let our AI engine work the magic to give you a personalised TOP 20 shortlist of programs you can actually get into — across <span className="text-white font-semibold">5,400+ programs</span>, <span className="text-white font-semibold">240+ universities</span> and <span className="text-white font-semibold">11 countries</span>, scored by how well they match <span className="text-white font-semibold">you</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start mb-10">
              <Link
                href="/get-started"
                className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                Find my programs
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex flex-col gap-1.5 justify-center">
                {FEATURES.map((f) => (
                  <span key={f.text} className="flex items-center gap-2 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {f.text}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — photo card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden md:block"
          >
            {/* Main student photo */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-indigo-900/50 border border-white/10">
              <img
                src="/hero-students.jpg"
                alt="Group of university friends smiling at campus"
                className="w-full h-[480px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
              {/* Floating match card */}
              <div className="absolute bottom-6 left-6 right-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center font-black text-white text-lg flex-shrink-0">
                  87
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">MSc Computer Science</p>
                  <p className="text-slate-300 text-xs">University of Toronto · 🇨🇦</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex-shrink-0">
                  Safe Match ✅
                </span>
              </div>
            </div>
            {/* Floating stat badges */}
            <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2 border border-gray-100">
              <GraduationCap className="w-5 h-5 text-indigo-500" />
              <div>
                <p className="font-extrabold text-gray-900 text-sm leading-none">5,400+</p>
                <p className="text-xs text-gray-400">Programs</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 border border-gray-100">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="font-extrabold text-gray-900 text-sm leading-none">11</p>
                  <p className="text-xs text-gray-400">Countries</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-100" />
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-500" />
                <div>
                  <p className="font-extrabold text-gray-900 text-sm leading-none">240+</p>
                  <p className="text-xs text-gray-400">Universities</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3 border border-indigo-100">
                <s.icon className="w-7 h-7 text-indigo-500" />
              </div>
              <div className="text-3xl font-black text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">
              <Zap className="w-3.5 h-3.5" /> How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              Three steps to your shortlist
            </h2>
            <p className="text-gray-500 mt-4 text-lg max-w-xl mx-auto">
              No counsellor needed. Just fill in your details and let our engine do the work.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                <span className="absolute top-5 right-6 text-6xl font-black text-gray-50 leading-none select-none">
                  {item.step}
                </span>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 shadow-lg`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-base font-bold hover:shadow-xl hover:shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              Start now — it's free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Student photo band ───────────────────────────────────── */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Photos collage */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main large photo — male and female students at university */}
            <div className="rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="/hot-profile.jpg"
                alt="Male and female students smiling with victory sign"
                className="w-full h-[420px] object-cover"
              />
            </div>
            {/* Overlapping small photo */}
            <div className="absolute -bottom-8 -right-8 w-52 h-52 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <img
                src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=300&q=85"
                alt="Students with university building"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Profile score badge */}
            <div className="absolute top-6 -left-6 bg-white rounded-2xl shadow-xl px-5 py-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">Profile Rating</p>
              <p className="text-lg font-black text-rose-500">🔥 SUPER HOT Profile</p>
            </div>
          </motion.div>

          {/* Right — text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-4">
              <Heart className="w-3.5 h-3.5" /> Built for ambitious students
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Know your profile<br />
              <span className="text-indigo-600">before you apply</span>
            </h2>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">
              We assess your profile across 10 criteria — from passport & visa history to test scores, budget, and research experience — and give you an honest profile rating so you know exactly where you stand.
            </p>
            <div className="space-y-3 mb-10">
              {[
                "🔥 SUPER HOT Profile — top 20% of applicants",
                "⭐ HOT Profile — strong across key criteria",
                "💪 Good Potential — solid with room to grow",
                "📊 Medium Potential — targeted prep recommended",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-gray-900 text-white font-bold hover:bg-indigo-600 transition-colors"
            >
              Get my profile rating
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Countries ────────────────────────────────────────────── */}
      <section id="countries" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">
              <MapPin className="w-3.5 h-3.5" /> Destinations
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              11 countries. 5,400+ programs. Endless possibilities.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {COUNTRIES.slice(0, 6).map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setSelectedCountry(c.name)}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xl mb-0.5">{c.flag}</p>
                  <p className="text-white font-bold text-sm">{c.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mt-4">
            {COUNTRIES.slice(6).map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                onClick={() => setSelectedCountry(c.name)}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              >
                <img
                  src={c.img}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xl mb-0.5">{c.flag}</p>
                  <p className="text-white font-bold text-sm">{c.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Scholarships section ─────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold mb-4">
              <Award className="w-3.5 h-3.5" />
              SCHOLARSHIPS
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              Fund your global education
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
              Thousands of scholarships are available for international students every year — many go unclaimed. Select a destination to explore key scholarships available there.
            </p>
          </div>

          {/* Country icon row */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {SCHOLARSHIPS.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedScholarship(selectedScholarship === c.name ? null : c.name)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${
                  selectedScholarship === c.name
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md"
                    : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                <span className="text-lg">{c.flag}</span>
                {c.name}
              </button>
            ))}
          </div>

          {/* Expanded scholarship panel */}
          {SCHOLARSHIPS.filter(c => c.name === selectedScholarship).map(c => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-indigo-100 shadow-md p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{c.flag}</span>
                <h3 className="font-extrabold text-gray-900 text-xl">{c.name} — Scholarships</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {c.scholarships.map((s) => (
                  <li key={s.name} className="flex gap-3 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <span className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs font-semibold text-indigo-600 mt-0.5">{s.coverage}</p>
                      {s.note && <p className="text-xs text-gray-500 mt-0.5">{s.note}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          {!selectedScholarship && (
            <p className="text-center text-sm text-gray-400">
              Click a country above to see available scholarships.
            </p>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            Scholarship availability and amounts change annually. Always verify directly with the awarding body.
          </p>
        </div>
      </section>

      {/* ── AI matching dark section ─────────────────────────────── */}
      <section className="relative py-24 px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-indigo-300 font-bold text-sm uppercase tracking-widest mb-5">
              <Sparkles className="w-3.5 h-3.5" /> The matching engine
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              10 signals.<br />
              <span className="text-indigo-400">One perfect match.</span>
            </h2>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              We don't just filter universities — we <em>score</em> every program against your specific profile using 10 signals, including academic backlogs and gap year history, built from real admissions data.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors shadow-lg"
            >
              See my matches
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Academic Score", icon: "🎓", bg: "bg-indigo-500/10 border-indigo-500/20" },
              { label: "English Proficiency", icon: "🗣️", bg: "bg-purple-500/10 border-purple-500/20" },
              { label: "Budget Fit", icon: "💰", bg: "bg-pink-500/10 border-pink-500/20" },
              { label: "Country Preference", icon: "🌍", bg: "bg-rose-500/10 border-rose-500/20" },
              { label: "QS University Rank", icon: "🏆", bg: "bg-amber-500/10 border-amber-500/20" },
              { label: "Intake Availability", icon: "📅", bg: "bg-emerald-500/10 border-emerald-500/20" },
              { label: "Work Experience", icon: "💼", bg: "bg-cyan-500/10 border-cyan-500/20" },
              { label: "Standardized Tests", icon: "📝", bg: "bg-blue-500/10 border-blue-500/20" },
              { label: "Academic Backlogs", icon: "⚠️", bg: "bg-orange-500/10 border-orange-500/20" },
              { label: "Gap Year", icon: "🗓️", bg: "bg-violet-500/10 border-violet-500/20" },
            ].map((s) => (
              <motion.div
                key={s.label}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 10 }}
                viewport={{ once: true }}
                className={`p-4 rounded-2xl border ${s.bg} hover:scale-105 transition-transform flex items-center gap-3`}
              >
                <span className="text-2xl">{s.icon}</span>
                <div className="text-sm text-slate-300 font-medium leading-snug">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">
              <Star className="w-3.5 h-3.5" /> Success stories
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              Students who made it
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed flex-1 mb-6 text-[15px]">
                  &quot;{t.text}&quot;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-indigo-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-sm">{t.name}</div>
                    <div className="text-xs text-gray-400 truncate">{t.from}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 font-semibold border border-emerald-100 flex-shrink-0">
                    {t.score}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-500 font-medium">
                  <MapPin className="w-3 h-3" />
                  {t.dest}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA with photo background ────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1600&q=80"
            alt="Graduation celebration"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/95 via-purple-900/90 to-indigo-900/95" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-indigo-200 text-sm font-semibold mb-6">
              <FileText className="w-3.5 h-3.5" />
              Free · No account needed · 3 minutes
            </span>
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
              Start your journey<br />
              <span className="text-indigo-300">today</span>
            </h2>
            <p className="text-indigo-200 mb-10 text-xl leading-relaxed">
              Join thousands of students who found their path abroad with eduvianAI. Get your personalised shortlist — free, instant, emailed to you.
            </p>
            <Link
              href="/get-started"
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-indigo-700 text-lg font-extrabold hover:bg-indigo-50 transition-all shadow-2xl hover:shadow-white/20 hover:-translate-y-1 duration-300"
            >
              Find my programs now
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-gray-900">eduvianAI</span>
              <p className="text-xs text-gray-400 font-medium">Your Global Future, Simplified</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#how-it-works" className="hover:text-gray-600 transition-colors">How it works</a>
            <a href="#countries" className="hover:text-gray-600 transition-colors">Destinations</a>
            <a href="#testimonials" className="hover:text-gray-600 transition-colors">Stories</a>
            <Link href="/get-started" className="hover:text-indigo-500 font-medium transition-colors">Get started</Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <p>© 2025 eduvianAI. All rights reserved.</p>
            <Link href="/admin" className="text-gray-200 hover:text-gray-400 transition-colors text-xs">Admin</Link>
          </div>
        </div>
      </footer>

      <CountryModal
        countryName={selectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      <ChatWidget />
    </div>
  );
}

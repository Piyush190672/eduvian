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
  TrendingUp,
  X,
  Mic,
  Brain,
  Lock,
} from "lucide-react";
import { DB_STATS } from "@/data/db-stats";

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
  { flag: "🇳🇱", name: "Netherlands", img: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&q=80" },
];

const STATS = [
  { icon: GraduationCap, value: DB_STATS.programsLabel, label: "Programs Listed" },
  { icon: Globe2, value: DB_STATS.countriesLabel, label: "Countries" },
  { icon: Users, value: DB_STATS.universitiesLabel, label: "Universities" },
  { icon: Award, value: DB_STATS.fieldsLabel, label: "Fields of Study" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: BookOpen,
    title: "Know Your Profile",
    desc: "Share your academic scores, English results, budget, and dream destinations. We rate your profile across 12 criteria instantly.",
    color: "from-indigo-500 to-violet-500",
    bg: "bg-indigo-50",
  },
  {
    step: "02",
    icon: Zap,
    title: "Matching Engine scores your fit",
    desc: `Our AI engine scores ${DB_STATS.programsLabel} programs using 10 weighted signals — GPA, language scores, budget, backlogs, gap year, QS rankings and more.`,
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
  { icon: CheckCircle2, text: `${DB_STATS.countriesLabel} countries · ${DB_STATS.universitiesLabel} universities · ${DB_STATS.fieldsLabel} fields · ${DB_STATS.programsLabel} programs` },
];

export default function LandingPage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 shadow-lg shadow-black/20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 py-4 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/40">
            <Globe2 className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-tight">eduvianAI</span>
            <p className="text-[10px] text-indigo-300 leading-none font-medium">Your Global Future, Simplified</p>
          </div>
        </Link>

        {/* Nav links — pill style on dark background */}
        <div className="hidden lg:flex items-center h-full">
          {[
            { label: "How it works",    href: "#how-it-works" },
            { label: "Decision Making Tools",  href: "#tools" },
            { label: "Interview Coach", href: "#interview-prep" },
            { label: "Destinations",    href: "#countries" },
            { label: "Scholarships",    href: "#scholarships" },
            { label: "Success Stories", href: "#testimonials" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative h-full flex items-center px-4 text-xs font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap group"
            >
              {item.label}
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
            </a>
          ))}
          <button
            onClick={() => setAboutOpen(true)}
            className="relative h-full flex items-center px-4 text-xs font-semibold text-slate-300 hover:text-white transition-colors whitespace-nowrap group"
          >
            About Us
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </button>
        </div>

        {/* Admin + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 my-3 rounded-lg border border-white/15 text-slate-400 text-xs font-semibold hover:border-white/30 hover:text-white transition-all duration-200"
          >
            <Lock className="w-3 h-3" />
            Admin
          </Link>
          <Link
            href="/get-started"
            className="flex items-center gap-2 px-5 py-2.5 my-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/40 transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
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
              Fill in your profile once. Let our AI engine work the magic to give you a personalised TOP 20 shortlist of programs you can actually get into — across <span className="text-white font-semibold">{DB_STATS.countriesLabel} countries</span>, <span className="text-white font-semibold">{DB_STATS.universitiesLabel} universities</span>, <span className="text-white font-semibold">{DB_STATS.fieldsLabel} fields of study</span> and <span className="text-white font-semibold">{DB_STATS.programsLabel} programs</span>, scored by how well they match <span className="text-white font-semibold">you</span>.
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
            {/* Floating stat strip — Countries → Universities → Fields → Programs */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%+2rem)] bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center justify-around border border-gray-100">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-gray-900 text-sm leading-none">{DB_STATS.countriesLabel}</p>
                  <p className="text-[10px] text-gray-400">Countries</p>
                </div>
              </div>
              <div className="w-px h-7 bg-gray-100" />
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-gray-900 text-sm leading-none">{DB_STATS.universitiesLabel}</p>
                  <p className="text-[10px] text-gray-400">Universities</p>
                </div>
              </div>
              <div className="w-px h-7 bg-gray-100" />
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-gray-900 text-sm leading-none">{DB_STATS.fieldsLabel}</p>
                  <p className="text-[10px] text-gray-400">Fields of Study</p>
                </div>
              </div>
              <div className="w-px h-7 bg-gray-100" />
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-extrabold text-gray-900 text-sm leading-none">{DB_STATS.programsLabel}</p>
                  <p className="text-[10px] text-gray-400">Programs</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════
           HOW IT WORKS: 3 merged steps
          ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-28 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} className="text-center mb-24"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold uppercase tracking-widest mb-5">
              <Zap className="w-3.5 h-3.5" /> How it works
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1 leading-tight">
              From your profile<br className="hidden sm:block" /> to your perfect shortlist
            </h2>
            <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">
              Three steps. Fully AI driven. Results in under 2 minutes.
            </p>
            {/* Step connector dots */}
            <div className="flex items-center justify-center gap-3 mt-8">
              {["KNOW YOUR PROFILE", "MATCHING ENGINE", "TOP 20 SHORTLIST"].map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${i === 0 ? "bg-indigo-500" : i === 1 ? "bg-violet-600" : "bg-fuchsia-500"}`}>{i + 1}</div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">{label}</span>
                  </div>
                  {i < 2 && <div className="w-8 h-px bg-gray-200" />}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── STEP 1: Know Your Profile ── */}
          <div className="grid md:grid-cols-2 gap-14 items-center mb-28">
            {/* Left: visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src="/hot-profile.jpg" alt="Student profile"
                  className="w-full h-[420px] object-cover" />
              </div>
              {/* Corner campus image */}
              <div className="absolute -bottom-8 -right-6 w-44 h-44 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <img src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=300&q=85"
                  alt="University campus" className="w-full h-full object-cover" />
              </div>
              {/* Floating rating badge */}
              <div className="absolute top-6 -left-4 bg-white rounded-2xl shadow-xl px-4 py-3 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-0.5">Profile Rating</p>
                <p className="text-base font-black text-rose-500">🔥 SUPER HOT Profile</p>
              </div>
              {/* Step pill */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-black px-5 py-2 rounded-full shadow-lg shadow-indigo-200 whitespace-nowrap">
                <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[11px] font-black">1</span>
                KNOW YOUR PROFILE
              </div>
            </motion.div>

            {/* Right: copy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4">
                <BookOpen className="w-3.5 h-3.5" /> Step 1 of 3
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                Know Your Profile —<br />
                <span className="text-indigo-600">we rate every signal</span>
              </h3>
              <p className="text-gray-500 text-base leading-relaxed mb-7">
                Fill in your academic scores, English results, budget, preferred destinations, work experience, backlogs, and gap year history. We evaluate 12 signals and assign you an honest profile rating.
              </p>
              <div className="grid grid-cols-2 gap-2.5 mb-8">
                {[
                  { emoji: "🔥", label: "SUPER HOT", sub: "Top 20% of applicants", ring: "ring-rose-200 bg-rose-50" },
                  { emoji: "⭐", label: "HOT",        sub: "Strong across key signals", ring: "ring-amber-200 bg-amber-50" },
                  { emoji: "💪", label: "STRONG",     sub: "Solid with room to grow",   ring: "ring-indigo-200 bg-indigo-50" },
                  { emoji: "📊", label: "GOOD",       sub: "Targeted prep recommended", ring: "ring-gray-200 bg-gray-50" },
                ].map((r) => (
                  <div key={r.label} className={`flex items-center gap-3 ring-1 ${r.ring} rounded-2xl px-4 py-3`}>
                    <span className="text-xl">{r.emoji}</span>
                    <div>
                      <p className="text-xs font-black text-gray-900">{r.label} Profile</p>
                      <p className="text-[11px] text-gray-400 leading-tight">{r.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/get-started"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-indigo-600 transition-colors">
                Know your profile now <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* ── STEP 2: Matching Engine ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white overflow-hidden mb-28 p-10 md:p-14"
          >
            {/* Blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Step pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-black px-5 py-2 rounded-full mb-8">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-black">2</span>
              THE MATCHING ENGINE — AI SCORES YOUR FIT
            </div>

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              {/* Left: copy */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Powered by AI · {DB_STATS.programsLabel} programs scored</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
                  10 weighted signals.<br />
                  <span className="text-indigo-400">One perfect match.</span>
                </h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">
                  Our Matching Engine doesn't just filter — it <em>scores</em> every program against your exact profile. Backlogs, gap year history, QS rank, intake windows — every nuance is weighted and counted.
                </p>
                {/* Mini stat row */}
                <div className="flex flex-wrap gap-4 mb-8">
                  {[
                    { val: DB_STATS.programsLabel, label: "programs scored" },
                    { val: "10", label: "match signals" },
                    { val: "<2 min", label: "results" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-black text-white">{s.val}</p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
                <Link href="/get-started"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                  Run the matching engine <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: signal grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Academic Score",      icon: "🎓", bg: "bg-indigo-500/10 border-indigo-500/20" },
                  { label: "English Proficiency", icon: "🗣️", bg: "bg-purple-500/10 border-purple-500/20" },
                  { label: "Budget Fit",           icon: "💰", bg: "bg-pink-500/10 border-pink-500/20" },
                  { label: "Country Preference",   icon: "🌍", bg: "bg-rose-500/10 border-rose-500/20" },
                  { label: "QS University Rank",   icon: "🏆", bg: "bg-amber-500/10 border-amber-500/20" },
                  { label: "Intake Availability",  icon: "📅", bg: "bg-emerald-500/10 border-emerald-500/20" },
                  { label: "Work Experience",      icon: "💼", bg: "bg-cyan-500/10 border-cyan-500/20" },
                  { label: "Standardized Tests",   icon: "📝", bg: "bg-blue-500/10 border-blue-500/20" },
                  { label: "Academic Backlogs",    icon: "⚠️", bg: "bg-orange-500/10 border-orange-500/20" },
                  { label: "Gap Year",             icon: "🗓️", bg: "bg-violet-500/10 border-violet-500/20" },
                ].map((s, i) => (
                  <motion.div key={s.label}
                    initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                    className={`p-3.5 rounded-2xl border ${s.bg} flex items-center gap-3 hover:scale-105 transition-transform cursor-default`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-xs text-slate-300 font-semibold leading-snug">{s.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── STEP 3: Your TOP 20 Shortlist ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-fuchsia-50 via-white to-rose-50 border border-fuchsia-100 overflow-hidden p-10 md:p-14"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-fuchsia-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

            {/* Step pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white text-xs font-black px-5 py-2 rounded-full shadow-lg shadow-fuchsia-200 mb-8">
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[11px] font-black">3</span>
              YOUR TOP 20 SHORTLIST — RANKED, TIERED & EMAILED
            </div>

            <div className="grid md:grid-cols-2 gap-14 items-center">
              {/* Left: copy + tier cards */}
              <div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Get your TOP 20 —<br />
                  <span className="bg-gradient-to-r from-fuchsia-600 to-rose-500 bg-clip-text text-transparent">personalised, ranked & delivered</span>
                </h3>
                <p className="text-gray-500 text-base leading-relaxed mb-8">
                  Every match is scored and tiered into <strong>Safe</strong>, <strong>Reach</strong>, and <strong>Ambitious</strong> buckets. Results land in your inbox as a beautiful, shareable PDF — in under 2 minutes.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2.5 mb-9">
                  {[
                    { icon: "⚡", text: "Results in < 2 minutes" },
                    { icon: "📧", text: "Emailed to you instantly" },
                    { icon: "📄", text: "Shareable PDF" },
                    { icon: "🆓", text: "100% free" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 font-semibold shadow-sm">
                      <span>{f.icon}</span>{f.text}
                    </div>
                  ))}
                </div>

                <Link href="/get-started"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-rose-500 text-white text-base font-bold hover:shadow-xl hover:shadow-fuchsia-200 transition-all hover:-translate-y-0.5 shadow-lg">
                  Get my TOP 20 shortlist — free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Right: mock shortlist preview */}
              <div className="relative">
                {/* Card stack background */}
                <div className="absolute inset-x-4 -bottom-3 h-full rounded-3xl bg-fuchsia-100/60 border border-fuchsia-200" />
                <div className="absolute inset-x-2 -bottom-1.5 h-full rounded-3xl bg-rose-100/40 border border-rose-100" />

                <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                  {/* Card header */}
                  <div className="bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-black text-sm">Your Shortlist</p>
                      <p className="text-fuchsia-200 text-[11px]">Top 20 matched programs</p>
                    </div>
                    <div className="bg-white/20 rounded-xl px-3 py-1.5 text-white text-xs font-bold">20 matches</div>
                  </div>

                  {/* Mock program rows */}
                  <div className="divide-y divide-gray-50">
                    {[
                      { rank: 1, prog: "MSc Data Science", uni: "University of Toronto", country: "🇨🇦", score: 92, tier: "Safe", tc: "text-emerald-600", bc: "bg-emerald-100" },
                      { rank: 2, prog: "MSc Artificial Intelligence", uni: "University of Edinburgh", country: "🇬🇧", score: 87, tier: "Safe", tc: "text-emerald-600", bc: "bg-emerald-100" },
                      { rank: 3, prog: "Master of CS", uni: "Monash University", country: "🇦🇺", score: 74, tier: "Reach", tc: "text-amber-600", bc: "bg-amber-100" },
                      { rank: 4, prog: "MSc Machine Learning", uni: "Imperial College London", country: "🇬🇧", score: 61, tier: "Reach", tc: "text-amber-600", bc: "bg-amber-100" },
                      { rank: 5, prog: "MS Computer Science", uni: "Carnegie Mellon University", country: "🇺🇸", score: 44, tier: "Ambitious", tc: "text-rose-600", bc: "bg-rose-100" },
                    ].map((p) => (
                      <div key={p.rank} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <span className="text-[11px] font-black text-gray-300 w-4">{p.rank}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">{p.prog}</p>
                          <p className="text-[11px] text-gray-400 truncate">{p.country} {p.uni}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-sm font-black ${p.tc}`}>{p.score}%</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.bc} ${p.tc}`}>{p.tier}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">+15 more programs</span>
                    <span className="text-xs font-bold text-fuchsia-500">📧 Emailed to you</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier legend strip */}
            <div className="grid sm:grid-cols-3 gap-4 mt-10">
              {[
                { tier: "✅ Safe",       score: "75–100", desc: "Your profile comfortably meets requirements",       bar: "w-[88%]", bg: "from-emerald-50 to-green-50", border: "border-emerald-200", barC: "bg-emerald-400", text: "text-emerald-700", pct: "~30% of list" },
                { tier: "🎯 Reach",      score: "50–74",  desc: "Close to the admitted student average",             bar: "w-[62%]", bg: "from-amber-50 to-yellow-50", border: "border-amber-200",   barC: "bg-amber-400",   text: "text-amber-700",   pct: "~50% of list" },
                { tier: "🚀 Ambitious",  score: "< 50",   desc: "Highly competitive — worth a strong application",  bar: "w-[35%]", bg: "from-rose-50 to-red-50",     border: "border-rose-200",    barC: "bg-rose-400",    text: "text-rose-700",    pct: "~20% of list" },
              ].map((t, i) => (
                <motion.div key={t.tier}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className={`bg-gradient-to-br ${t.bg} border ${t.border} rounded-2xl p-5 flex flex-col gap-3`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`text-sm font-extrabold ${t.text}`}>{t.tier}</p>
                      <p className="text-xl font-black text-gray-900 mt-0.5">{t.score} <span className="text-xs font-semibold text-gray-400">score</span></p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full text-white ${t.barC}`}>{t.pct}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                  <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${t.barC} ${t.bar}`} />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── Decision Tools section ───────────────────────────────── */}
      <section id="tools" className="py-24 px-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 relative overflow-hidden">
        {/* decorative blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative">
          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold mb-4 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5" /> SMART DECISION MAKING TOOLS
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-1">
              Make smarter study-abroad decisions
            </h2>
            <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
              Before you commit thousands of dollars and years of your life — run the numbers. Our free tools give you a clear financial and qualitative picture in under a minute.
            </p>
          </motion.div>

          {/* Tool cards */}
          <div className="grid sm:grid-cols-2 gap-6">
            {/* ROI Calculator card */}
            <motion.div
              id="roi-calculator"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl hover:border-indigo-400/40 hover:bg-white/8 transition-all duration-300 p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">ROI Calculator</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Will your degree pay off?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">
                Pick any university and program — we auto-fill tuition, living costs and salary data so you instantly see your payback period, 10-year ROI and break-even salary.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {["Payback Period", "10-Year ROI", "Monthly Savings", "Break-even Salary"].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-[11px] font-semibold border border-indigo-500/25">{t}</span>
                ))}
              </div>
              <Link
                href="/roi-calculator"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold w-fit hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Open Calculator <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* Parent Decision Tool card */}
            <motion.div
              id="parent-decision-tool"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="group relative bg-gradient-to-br from-purple-600/30 to-indigo-700/30 backdrop-blur-md border border-purple-400/20 rounded-3xl hover:border-purple-400/50 transition-all duration-300 p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/30 border border-purple-400/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-200" />
                </div>
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">For Parents</span>
              </div>
              <h3 className="text-xl font-extrabold text-white mb-2">Is studying abroad right for your child?</h3>
              <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">
                Get a data-driven verdict across 7 key factors — budget fit, job market, safety, post-study work rights, financial ROI and more. No guesswork, just clarity.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {["Budget Fit", "Safety", "PSW Rights", "Job Market", "Student Life"].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-200 text-[11px] font-semibold border border-purple-400/25">{t}</span>
                ))}
              </div>
              <Link
                href="/parent-decision"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold w-fit hover:shadow-lg hover:shadow-purple-400/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                Open Tool <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Interview Prep section ───────────────────────────────── */}
      <section id="interview-prep" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">

          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> AI INTERVIEW COACH
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              Ace your university interview
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
              Practice with an AI coach trained on real university interview formats — get asked the questions admissions panels actually use, receive instant feedback, and walk in confident.
            </p>
          </motion.div>

          {/* GPT cards */}
          <div className="grid sm:grid-cols-2 gap-6 mb-12">

            {/* Australia GPT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              className="group relative bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-3xl p-7 flex flex-col hover:shadow-xl hover:shadow-sky-100 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-md shadow-sky-200 text-2xl flex-shrink-0">
                  🇦🇺
                </div>
                <div>
                  <p className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Australia</p>
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight">University Interview Coach</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                Practice the 19 approved GS visa interview questions — covering program rationale, career outcome, why Australia, university choice, and return intent across 5 categories.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {["5 categories", "19 questions", "GS visa style", "Instant feedback"].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-700 text-[11px] font-semibold">{t}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/interview-prep?country=australia&mode=text"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-sky-200 hover:-translate-y-0.5 transition-all duration-200"
                >
                  ✍️ Text Practice <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/interview-prep?country=australia"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-sky-300 text-sky-700 bg-sky-50 text-sm font-bold hover:bg-sky-100 hover:-translate-y-0.5 transition-all duration-200"
                >
                  🎙️ Voice Practice
                </Link>
              </div>
            </motion.div>

            {/* UK GPT */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.12 }}
              className="group relative bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200 rounded-3xl p-7 flex flex-col hover:shadow-xl hover:shadow-rose-100 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md shadow-rose-200 text-2xl flex-shrink-0">
                  🇬🇧
                </div>
                <div>
                  <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">United Kingdom</p>
                  <h3 className="text-lg font-extrabold text-gray-900 leading-tight">University Interview Coach</h3>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
                Practice the 14 approved UK student visa interview questions — covering why the UK, course rationale, funding, academic background, university knowledge, and visa rules.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {["5 categories", "14 questions", "Visa interview style", "Instant feedback"].map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">{t}</span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/interview-prep?country=uk&mode=text"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-rose-200 hover:-translate-y-0.5 transition-all duration-200"
                >
                  ✍️ Text Practice <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/interview-prep?country=uk"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-rose-300 text-rose-700 bg-rose-50 text-sm font-bold hover:bg-rose-100 hover:-translate-y-0.5 transition-all duration-200"
                >
                  🎙️ Voice Practice
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Bottom trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 py-6 px-8 rounded-2xl bg-gray-50 border border-gray-100"
          >
            {[
              { icon: "🎯", text: "Real admissions-style questions" },
              { icon: "💬", text: "Instant answer feedback" },
              { icon: "🔁", text: "Practice as many times as you like" },
              { icon: "🆓", text: "Completely free to use" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                <span className="text-lg">{item.icon}</span>
                {item.text}
              </div>
            ))}
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
              {DB_STATS.countriesLabel} countries. {DB_STATS.programsLabel} programs. Endless possibilities.
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mt-4">
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

      {/* ── Scholarships section ──────────────────────────────────── */}
      <section id="scholarships" className="py-24 px-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-5xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-10">
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
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
            <a href="#how-it-works" className="hover:text-gray-600 transition-colors">How it works</a>
            <a href="#tools" className="hover:text-gray-600 transition-colors">Decision Making Tools</a>
            <a href="#interview-prep" className="hover:text-gray-600 transition-colors">Interview Coach</a>
            <a href="#countries" className="hover:text-gray-600 transition-colors">Destinations</a>
            <a href="#scholarships" className="hover:text-gray-600 transition-colors">Scholarships</a>
            <a href="#testimonials" className="hover:text-gray-600 transition-colors">Success Stories</a>
            <button onClick={() => setAboutOpen(true)} className="hover:text-indigo-500 transition-colors">About Us</button>
            <Link href="/get-started" className="hover:text-indigo-500 font-medium transition-colors">Get started</Link>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <p>© 2025 eduvianAI. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ── About Us Modal ───────────────────────────────────────── */}
      {aboutOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setAboutOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

          <div
            className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 px-8 pt-10 pb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <button
                onClick={() => setAboutOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <Globe2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">About</p>
                    <p className="text-xl font-extrabold text-white">eduvianAI</p>
                  </div>
                </div>
                <p className="text-base font-semibold text-white leading-relaxed mb-2">
                  Your Global Future, Simplified.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  eduvianAI is a <span className="text-indigo-300 font-semibold">100% AI-powered study-abroad platform</span> built for the next generation of global students. We believe every student deserves access to world-class guidance — not just those who can afford a counsellor. So we built one.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-6">

              {/* Four pillars */}
              {[
                {
                  icon: <Brain className="w-5 h-5 text-indigo-600" />,
                  bg: "bg-indigo-50 border-indigo-100",
                  iconBg: "bg-indigo-100",
                  title: "100% Profile-Customised Matches",
                  body: "Our AI engine evaluates your academic scores, English results, budget, work experience, backlogs, gap year, and destination preferences across 10 weighted signals — then scores every one of our " + DB_STATS.programsLabel + " programs against your exact profile. No generic lists. No guesswork. Every recommendation is built around you.",
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
                  bg: "bg-purple-50 border-purple-100",
                  iconBg: "bg-purple-100",
                  title: "Smart Study-Abroad Decision Tools",
                  body: "Committing years of your life and thousands of dollars abroad is a big decision. Our ROI Calculator shows you the real payback period, 10-year return, and break-even salary for any program. Our Parent Decision Tool gives families a data-driven verdict across 7 factors — budget fit, safety, post-study work rights, job market, and more.",
                },
                {
                  icon: <Mic className="w-5 h-5 text-emerald-600" />,
                  bg: "bg-emerald-50 border-emerald-100",
                  iconBg: "bg-emerald-100",
                  title: "AI Interview Coach",
                  body: "Walk into your university visa interview with confidence. Our AI coach is trained on the exact questions used in Australian Genuine Student visa interviews (19 questions across 5 categories) and UK student credibility interviews (14 questions). Practice in voice mode, get real-time feedback on what you did well and where to improve, and hear a model answer — all powered by AI.",
                },
                {
                  icon: <Award className="w-5 h-5 text-amber-600" />,
                  bg: "bg-amber-50 border-amber-100",
                  iconBg: "bg-amber-100",
                  title: "Scholarship Discovery",
                  body: "Thousands of scholarships go unclaimed every year simply because students don't know they exist. eduvianAI surfaces the most relevant fully-funded and partial scholarships across all our destination countries — from government-backed programs like Chevening, Australia Awards, and Vanier, to university merit awards — all in one place, completely free.",
                },
              ].map((item) => (
                <div key={item.title} className={`flex gap-4 p-5 rounded-2xl border ${item.bg}`}>
                  <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-gray-900 mb-1">{item.title}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              ))}

              {/* Mission statement */}
              <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
                <p className="text-white font-bold text-base mb-1">Our mission</p>
                <p className="text-indigo-100 text-sm leading-relaxed">
                  To democratise access to world-class study-abroad guidance — so that every student, regardless of background or budget, can make the best decision for their future.
                </p>
              </div>

              <div className="flex justify-center pt-2">
                <Link
                  href="/get-started"
                  onClick={() => setAboutOpen(false)}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5"
                >
                  Get my personalised shortlist — free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <CountryModal
        countryName={selectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      <ChatWidget />
    </div>
  );
}

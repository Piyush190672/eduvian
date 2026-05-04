"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  BarChart2,
  Menu,
  AlertTriangle,
  Compass,
  ListChecks,
  Database,
  Eye,
} from "lucide-react";
import HowItWorksModal from "@/components/HowItWorksModal";
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
  { icon: GraduationCap, value: DB_STATS.verifiedProgramsLabel, label: "Verified Programs" },
  { icon: Globe2, value: DB_STATS.countriesLabel, label: "Countries" },
  { icon: Users, value: DB_STATS.verifiedUniversitiesLabel, label: "Verified Global Universities" },
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
    desc: `Our AI engine scores ${DB_STATS.verifiedProgramsLabel} programs using 10 weighted signals — GPA, language scores, budget, backlogs, gap year, QS rankings and more.`,
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


const FEATURES = [
  { icon: CheckCircle2, text: "Free — no account needed" },
  { icon: CheckCircle2, text: "Takes only 3 minutes" },
  { icon: CheckCircle2, text: "Results emailed instantly" },
  { icon: CheckCircle2, text: `${DB_STATS.countriesLabel} countries · ${DB_STATS.universitiesLabel} universities · ${DB_STATS.fieldsLabel} fields · ${DB_STATS.verifiedProgramsLabel} programs` },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedScholarship, setSelectedScholarship] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-navy border-b border-white/10 shadow-lg shadow-black/20">
        <div className="flex items-center justify-between px-4 md:px-8 py-0">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 py-3.5 flex-shrink-0">
          {/* Custom logomark: orbit ring around an "e" */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="10" fill="url(#logoGrad)"/>
            {/* Orbit ring */}
            <ellipse cx="18" cy="18" rx="11" ry="6" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" fill="none" transform="rotate(-30 18 18)"/>
            {/* Bold "e" letterform */}
            <text x="18" y="23" textAnchor="middle" fill="white" fontFamily="system-ui,sans-serif" fontSize="16" fontWeight="800" letterSpacing="-1">e</text>
            {/* Accent dot — top right of orbit */}
            <circle cx="26.5" cy="11.5" r="2" fill="white" fillOpacity="0.9"/>
            <defs>
              <linearGradient id="logoGrad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
          </svg>
          <div>
            <span className="font-display font-bold text-base text-white tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
            <p className="text-[10px] text-slate-400 leading-none font-medium">Study abroad, made intelligent</p>
          </div>
        </Link>

        {/* Nav links — pill style on dark background */}
        <div className="hidden lg:flex items-center h-full">
          {/* How it works */}
          <button
            onClick={() => setVideoOpen(true)}
            className="relative h-full flex items-center px-4 text-xs font-semibold text-blue-400 hover:text-white transition-colors whitespace-nowrap group"
          >
            ▶ See how it works
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </button>

          {/* About Us */}
          <button
            onClick={() => setAboutOpen(true)}
            className="relative h-full flex items-center px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap group"
          >
            About Us
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </button>

          {/* Tools — single consolidated dropdown */}
          <div
            className="relative h-full flex items-center"
            onMouseEnter={() => setOpenDropdown("tools")}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button className="relative h-full flex items-center px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap group">
              Tools
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
            </button>
            {openDropdown === "tools" && (
              <div className="absolute top-full left-0 mt-0 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-3 min-w-[280px] z-50">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-1 pb-2">Match &amp; Apply</p>
                <Link href="/get-started" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">🎯</span>
                  <div><span className="text-white font-semibold text-sm block">University Matching</span><span className="text-indigo-300 text-xs">AI shortlist in 2 minutes</span></div>
                </Link>
                <Link href="/sop-assistant" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">✍️</span>
                  <div><span className="text-white font-semibold text-sm block">SOP Assistant</span><span className="text-indigo-300 text-xs">Write a cliché-free SOP</span></div>
                </Link>
                <Link href="/application-check" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">📋</span>
                  <div><span className="text-white font-semibold text-sm block">Application Check</span><span className="text-indigo-300 text-xs">Score, risk flags &amp; fix list</span></div>
                </Link>
                <Link href="/application-check?tab=cv" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">📄</span>
                  <div><span className="text-white font-semibold text-sm block">CV Assessment &amp; Builder</span><span className="text-indigo-300 text-xs">Score &amp; rebuild your CV in minutes</span></div>
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-1 pb-2">Practice &amp; Decide</p>
                <Link href="/interview-prep" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">🎤</span>
                  <div><span className="text-white font-semibold text-sm block">Interview Prep</span><span className="text-indigo-300 text-xs">AU · UK · USA voice coach</span></div>
                </Link>
                <Link href="/english-test-lab" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">🧪</span>
                  <div><span className="text-white font-semibold text-sm block">English Test Lab</span><span className="text-indigo-300 text-xs">IELTS · PTE · DET · TOEFL mocks</span></div>
                </Link>
                <Link href="/roi-calculator" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">📊</span>
                  <div><span className="text-white font-semibold text-sm block">ROI Calculator</span><span className="text-indigo-300 text-xs">Payback period &amp; 10-yr ROI</span></div>
                </Link>
                <Link href="/parent-decision" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <div><span className="text-white font-semibold text-sm block">Parent Decision Tool</span><span className="text-indigo-300 text-xs">Data-driven family verdict</span></div>
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-1 pb-2">Apply for Visa</p>
                <Link href="/visa-coach" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">🛂</span>
                  <div><span className="text-white font-semibold text-sm block">Visa Coach</span><span className="text-indigo-300 text-xs">Checklists · risks · apply direct</span></div>
                </Link>
                <div className="h-px bg-white/5 my-1" />
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 pt-1 pb-2">Track &amp; Manage</p>
                <Link href="/application-tracker" className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 transition-colors">
                  <span className="text-lg">🗂️</span>
                  <div><span className="text-white font-semibold text-sm block">Application Tracker</span><span className="text-indigo-300 text-xs">Kanban · deadlines · doc versions</span></div>
                </Link>
              </div>
            )}
          </div>

          {/* Destinations */}
          <a
            href="#countries"
            className="relative h-full flex items-center px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap group"
          >
            Destinations
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </a>

          {/* Scholarships */}
          <a
            href="#scholarships"
            className="relative h-full flex items-center px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap group"
          >
            Scholarships
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </a>

          {/* Sample outputs */}
          <a
            href="#outputs"
            className="relative h-full flex items-center px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap group"
          >
            Sample outputs
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </a>

          {/* Why EduvianAI */}
          <a
            href="#why-different"
            className="relative h-full flex items-center px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap group"
          >
            Why EduvianAI
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center rounded-t-full" />
          </a>
        </div>

        {/* CTA + Mobile hamburger */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/get-started"
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 my-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold transition-colors"
          >
            <span className="hidden sm:inline">Get Started Free</span>
            <span className="sm:hidden">Start Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            onClick={() => setMobileNavOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileNavOpen
              ? <X className="w-4.5 h-4.5 text-white" />
              : <Menu className="w-4.5 h-4.5 text-white" />}
          </button>
        </div>
        </div>{/* end flex row */}

        {/* ── Mobile nav drawer ── */}
        {mobileNavOpen && (
          <div className="lg:hidden border-t border-white/10 bg-slate-900 px-4 pb-5 pt-3 space-y-1">
            <button
              onClick={() => { setVideoOpen(true); setMobileNavOpen(false); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-indigo-300 hover:bg-white/10 transition-colors text-left"
            >
              <span className="text-base">▶</span> See how it works
            </button>
            <div className="px-4 pt-2 pb-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Match &amp; Apply</p>
            </div>
            {[
              { emoji: "🎯", label: "University Matching", href: "/get-started", sub: "AI shortlist in 2 minutes" },
              { emoji: "✍️", label: "SOP Assistant", href: "/sop-assistant", sub: "Cliché-free SOP" },
              { emoji: "📋", label: "Application Check", href: "/application-check", sub: "Score &amp; fix list" },
              { emoji: "📄", label: "CV Assessment", href: "/application-check?tab=cv", sub: "Rebuild in minutes" },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white hover:bg-white/10 transition-colors">
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <div><p className="font-semibold leading-none mb-0.5">{item.label}</p>
                  <p className="text-[11px] text-indigo-300">{item.sub}</p></div>
              </Link>
            ))}
            <div className="px-4 pt-2 pb-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Practice &amp; Decide</p>
            </div>
            {[
              { emoji: "🎤", label: "Interview Prep", href: "/interview-prep", sub: "AU · UK · USA voice coach" },
              { emoji: "🧪", label: "English Test Lab", href: "/english-test-lab", sub: "IELTS · PTE · DET · TOEFL" },
              { emoji: "📊", label: "ROI Calculator", href: "/roi-calculator", sub: "10-yr payback period" },
              { emoji: "👨‍👩‍👧", label: "Parent Decision Tool", href: "/parent-decision", sub: "Data-driven family verdict" },
              { emoji: "🛂", label: "Visa Coach", href: "/visa-coach", sub: "F-1 · UK · SDS · AUS 500 · DE" },
              { emoji: "🗂️", label: "Application Tracker", href: "/application-tracker", sub: "Kanban · deadlines · doc versions" },
            ].map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white hover:bg-white/10 transition-colors">
                <span className="text-lg flex-shrink-0">{item.emoji}</span>
                <div><p className="font-semibold leading-none mb-0.5">{item.label}</p>
                  <p className="text-[11px] text-indigo-300">{item.sub}</p></div>
              </Link>
            ))}
            <div className="h-px bg-white/5 my-2" />
            {[
              { label: "Destinations", href: "#countries" },
              { label: "Scholarships", href: "#scholarships" },
              { label: "Sample outputs", href: "#outputs" },
              { label: "Why EduvianAI", href: "#why-different" },
            ].map(item => (
              <a key={item.label} href={item.href} onClick={() => setMobileNavOpen(false)}
                className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
                {item.label}
              </a>
            ))}
            <button
              onClick={() => { setAboutOpen(true); setMobileNavOpen(false); }}
              className="flex items-center w-full px-4 py-3 rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors">
              About Us
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative pt-16 min-h-screen flex items-center overflow-hidden bg-navy">
        {/* Subtle gradient glow — not flashy, just alive */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-24 w-full min-w-0">
          <div className="grid md:grid-cols-5 gap-12 lg:gap-16 items-center min-w-0">

            {/* ── Left: 60% ── */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65 }}
              className="md:col-span-3 min-w-0"
            >
              {/* Stage badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/15 mb-6 backdrop-blur-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold tracking-widest uppercase bg-gradient-to-r from-blue-300 via-violet-300 to-blue-300 bg-clip-text text-transparent">
                  Match · Check · Practice · Decide · Apply Visa
                </span>
              </motion.div>

              {/* H1 */}
              <h1 className="font-display text-[2.1rem] sm:text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight mb-5">
                Your study abroad<br />
                journey,{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                  de-risked.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-gray-400 mb-5 leading-relaxed max-w-lg">
                From shortlist to visa, one AI that thinks the whole journey through.
              </p>

              {/* Verified-at-source anchor — our moat, given prominent space */}
              <div className="inline-flex items-start gap-2.5 mb-8 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/30 max-w-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                <p className="text-[13px] text-emerald-100 leading-snug">
                  <span className="font-bold text-emerald-200">{DB_STATS.verifiedProgramsLabel} programs verified at the source.</span>
                  <span className="text-emerald-200/80"> Every fee, deadline and cutoff fetched from the live university page — never invented.</span>
                </p>
              </div>

              {/* CTA row */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-10">
                <Link
                  href="/get-started"
                  className="group inline-flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-6 py-3.5 font-bold text-base transition-colors"
                >
                  Find my best-fit programs
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/application-check"
                  className="inline-flex items-center justify-center gap-2 border border-white/25 text-white/80 hover:border-white/50 hover:text-white rounded-xl px-6 py-3.5 font-bold text-base transition-colors"
                >
                  Check my application
                  <FileText className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust strip */}
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap sm:items-center gap-x-6 gap-y-3 pt-5 border-t border-white/10">
                {[
                  { val: DB_STATS.verifiedUniversitiesLabel, label: "Verified Global Universities" },
                  { val: DB_STATS.verifiedProgramsLabel, label: "Verified Programs" },
                  { val: DB_STATS.countriesLabel, label: "Countries" },
                  { val: DB_STATS.fieldsLabel, label: "Fields" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-base sm:text-xl font-bold text-white leading-none">{s.val}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Parent-relevant trust strip — universal trust, not a separate persona path */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-5 text-[11px] text-gray-400">
                <span className="font-semibold text-gray-300">For students and families:</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> verified fees &amp; deadlines</span>
                <span className="text-gray-600">·</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> no university commission</span>
                <span className="text-gray-600">·</span>
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> ROI &amp; visa included</span>
                <span className="text-gray-600">·</span>
                <span className="inline-flex items-center gap-1.5"><Lock className="w-3 h-3 text-emerald-400" /> your data isn&apos;t sold or shared</span>
              </div>
            </motion.div>

            {/* ── Right: 40% desktop / horizontal scroll on mobile ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="md:col-span-2 min-w-0 w-full"
            >

              {/* ── MOBILE: horizontal snap-scroll strip ─────────────── */}
              {/* Follows headline → sub → CTA in the stacking order      */}
              <p className="md:hidden text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2 px-1">
                Sample outputs — illustrative
              </p>
              <div className="md:hidden -mx-4 px-4 overflow-x-auto flex gap-3 pb-4 snap-x snap-mandatory scrollbar-none min-w-0 max-w-[100vw]">

                {/* Card M1 — Shortlist */}
                <div className="flex-shrink-0 w-[272px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.28)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">AI Shortlist · sample</p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">20 matches</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { flag: "🇺🇸", uni: "Carnegie Mellon", score: 69, tier: "Ambitious", tc: "text-red-600", bg: "bg-red-50 border-red-200" },
                      { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", uni: "Univ. of Edinburgh", score: 78, tier: "Reach", tc: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                      { flag: "🇬🇧", uni: "Univ. of Leeds", score: 88, tier: "Safe", tc: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                    ].map((r) => (
                      <div key={r.uni} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                        <span className="text-sm flex-shrink-0">{r.flag}</span>
                        <p className="text-[11px] font-bold text-gray-900 flex-1 truncate">{r.uni}</p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-[10px] font-bold text-gray-600">{r.score}%</span>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${r.bg} ${r.tc}`}>{r.tier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2 pt-2 border-t border-gray-50">3 of 20 · Safe, Reach &amp; Ambitious</p>
                </div>

                {/* Card M2 — App Score */}
                <div className="flex-shrink-0 w-[200px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Application Score</p>
                  {[
                    { label: "Before", pct: 61, color: "bg-rose-400" },
                    { label: "After AI", pct: 84, color: "bg-blue-500" },
                  ].map((b) => (
                    <div key={b.label} className="mb-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-gray-500">{b.label}</span>
                        <span className="text-[10px] font-bold text-gray-700">{b.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-2 border-t border-gray-50">
                    <p className="text-[10px] font-bold text-blue-600">+23 pts (sample)</p>
                    <p className="text-[8px] text-gray-400 mt-0.5">Illustrative example only</p>
                  </div>
                </div>

                {/* Card M3 — ROI */}
                <div className="flex-shrink-0 w-[200px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">ROI · Payback Period</p>
                  {[
                    { label: "UCL London", yrs: "3.2 yrs", pct: 32, color: "bg-emerald-500", best: true },
                    { label: "Melbourne", yrs: "5.8 yrs", pct: 58, color: "bg-rose-400", best: false },
                    { label: "Edinburgh", yrs: "4.8 yrs", pct: 48, color: "bg-amber-400", best: false },
                  ].map((b) => (
                    <div key={b.label} className="mb-2">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className={`text-[9px] ${b.best ? "font-bold text-gray-900" : "text-gray-400"}`}>{b.label}</span>
                        <span className={`text-[9px] font-bold ${b.best ? "text-emerald-600" : "text-gray-400"}`}>{b.yrs}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-[9px] font-bold text-emerald-600 mt-2">⭐ UCL recommended</p>
                </div>

                {/* Card M4 — Visa */}
                <div className="flex-shrink-0 w-[220px] snap-start bg-white rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.22)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Visa Coach</p>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">12 countries</span>
                  </div>
                  {[
                    { flag: "🇺🇸", name: "F-1 (USA)", fee: "$185", risk: "low", rc: "text-emerald-600", rb: "bg-emerald-50 border-emerald-200" },
                    { flag: "🇬🇧", name: "UK Student", fee: "£558", risk: "low", rc: "text-emerald-600", rb: "bg-emerald-50 border-emerald-200" },
                    { flag: "🇨🇦", name: "SDS (Canada)", fee: "CAD 150", risk: "med", rc: "text-amber-700", rb: "bg-amber-50 border-amber-200" },
                  ].map((v) => (
                    <div key={v.name} className="flex items-center gap-2 py-1 border-b border-gray-50 last:border-0">
                      <span className="text-sm flex-shrink-0">{v.flag}</span>
                      <p className="text-[10px] font-bold text-gray-900 flex-1 truncate">{v.name}</p>
                      <span className="text-[9px] text-gray-500 flex-shrink-0">{v.fee}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${v.rb} ${v.rc}`}>{v.risk}</span>
                    </div>
                  ))}
                  <p className="text-[9px] font-bold text-sky-600 mt-2 pt-2 border-t border-gray-50">🛂 Official-source checklists</p>
                </div>

              </div>

              {/* ── DESKTOP: vertical stacked cards ──────────────────── */}
              <div className="hidden md:flex flex-col gap-3">

                {/* Card 1 — Shortlist */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI Shortlist · 90s</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">20 matches</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { flag: "🇺🇸", uni: "Carnegie Mellon", prog: "MSML", score: 69, tier: "Ambitious", tc: "text-red-600", bg: "bg-red-50 border-red-200" },
                      { flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", uni: "Univ. of Edinburgh", prog: "MSc Computer Science", score: 78, tier: "Reach", tc: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                      { flag: "🇩🇪", uni: "TU Munich", prog: "MSc Informatics", score: 74, tier: "Reach", tc: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
                      { flag: "🇬🇧", uni: "Univ. of Leeds", prog: "MSc AI & Data Science", score: 88, tier: "Safe", tc: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                    ].map((r) => (
                      <div key={r.uni} className="flex items-center gap-2.5 py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm flex-shrink-0">{r.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-900 truncate">{r.uni}</p>
                          <p className="text-[10px] text-gray-400 truncate">{r.prog}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] font-bold text-gray-600">{r.score}%</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${r.bg} ${r.tc}`}>{r.tier}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-2.5 pt-2 border-t border-gray-50">Showing 4 of 20 · Safe, Reach &amp; Ambitious</p>
                </div>

                {/* Cards 2 + 3 — side by side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Application Score */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">App Score</p>
                    {[
                      { label: "Before", pct: 61, color: "bg-rose-400" },
                      { label: "After AI", pct: 84, color: "bg-blue-500" },
                    ].map((b) => (
                      <div key={b.label} className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-gray-500">{b.label}</span>
                          <span className="text-[10px] font-bold text-gray-700">{b.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-[10px] font-bold text-blue-600 mt-1">+23 pts ↑</p>
                  </div>

                  {/* ROI */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">ROI</p>
                    {[
                      { label: "UCL London", yrs: "3.2 yrs", pct: 32, color: "bg-emerald-500", best: true },
                      { label: "Melbourne", yrs: "5.8 yrs", pct: 58, color: "bg-rose-400", best: false },
                    ].map((b) => (
                      <div key={b.label} className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[9px] ${b.best ? "font-bold text-gray-900" : "text-gray-400"}`}>{b.label}</span>
                          <span className={`text-[9px] font-bold ${b.best ? "text-emerald-600" : "text-gray-400"}`}>{b.yrs}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-[9px] font-bold text-emerald-600 mt-1">⭐ UCL wins</p>
                  </div>
                </div>

                {/* Card 4 — Visa Coach (desktop) */}
                <div className="bg-white rounded-2xl p-4 shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visa Coach · 12 countries</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100">F-1 · UK · SDS · AUS 500 +8</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { flag: "🇺🇸", label: "F-1", detail: "$185 · I-20 ready" },
                      { flag: "🇬🇧", label: "UK Student", detail: "£558 · CAS" },
                      { flag: "🇨🇦", label: "SDS", detail: "CAD 22,895 GIC" },
                    ].map((v) => (
                      <div key={v.label} className="rounded-lg border border-gray-100 p-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-sm">{v.flag}</span>
                          <span className="text-[10px] font-bold text-gray-900 truncate">{v.label}</span>
                        </div>
                        <p className="text-[9px] text-gray-500 leading-tight truncate">{v.detail}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-sky-600 font-bold mt-2.5 pt-2 border-t border-gray-50">🛂 Official-source checklists · risk flags · apply links</p>
                </div>

              </div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ── Stage Funnel ─────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-blue-600 font-semibold text-sm uppercase tracking-widest mb-3">Where are you right now?</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900">Pick your stage — we'll take it from there</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                stage: "A",
                label: "Find my fit",
                title: "No idea where to apply",
                desc: "AI evaluates your profile and shortlists your best-fit Universities in under 2 minutes.",
                cta: "Start Matching",
                href: "/get-started",
                gradient: "from-violet-600 via-indigo-500 to-blue-500",
                glow: "shadow-indigo-500/40",
                accent: "text-blue-600",
                icon: "🎯",
              },
              {
                stage: "B",
                label: "Strengthen application",
                title: "Got a shortlist — is my application strong enough?",
                desc: "Write a standout SOP, score and rebuild your CV, and check your full application pack for gaps.",
                cta: "Check My Application",
                href: "/application-check",
                gradient: "from-fuchsia-600 via-pink-500 to-rose-400",
                glow: "shadow-pink-500/40",
                accent: "text-violet-600",
                icon: "✍️",
                secondaryHref: "/sop-assistant",
                secondaryCta: "Write my SOP →",
                recommended: true,
              },
              {
                stage: "C",
                label: "Tests & interviews",
                title: "Prepare for your interview and English tests",
                desc: "AI Interview Coach for AU, UK & US F-1. Full IELTS, PTE, DET & TOEFL mocks. Know your weak spots before the real thing.",
                cta: "Interview Coach",
                href: "/interview-prep",
                gradient: "from-emerald-500 via-teal-400 to-cyan-400",
                glow: "shadow-emerald-500/40",
                accent: "text-emerald-600",
                icon: "🎤",
                secondaryHref: "/english-test-lab",
                secondaryCta: "English Test Lab →",
              },
              {
                stage: "D",
                label: "Compare offers",
                title: "Got my offer — should I accept?",
                desc: "ROI Calculator + Parent Decision Tool. Real numbers before you commit.",
                cta: "Run the Numbers",
                href: "/roi-calculator",
                gradient: "from-amber-500 via-orange-400 to-yellow-300",
                glow: "shadow-amber-500/40",
                accent: "text-amber-600",
                icon: "📊",
              },
              {
                stage: "E",
                label: "Get visa-ready",
                title: "Accepted — now the visa",
                desc: "F-1, UK, SDS, AUS 500, Germany D & 7 more. Official checklists, financial-proof rules, risk flags, direct apply links.",
                cta: "Open Visa Coach",
                href: "/visa-coach",
                gradient: "from-sky-600 via-cyan-500 to-teal-400",
                glow: "shadow-cyan-500/40",
                accent: "text-sky-600",
                icon: "🛂",
                secondaryHref: "/application-tracker",
                secondaryCta: "Track applications →",
              },
            ].map((s, i) => (
              <motion.div
                key={s.stage}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-2xl bg-white border p-6 flex flex-col hover:-translate-y-1 transition-all duration-300 group overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.05)] ${"recommended" in s && s.recommended ? "border-blue-300 ring-1 ring-blue-100 shadow-md shadow-blue-100/50" : "border-gray-200 hover:border-gray-300 hover:shadow-md"}`}
              >
                {/* Glow blob */}
                <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${s.gradient} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />

                {/* Stage badge */}
                <div className="flex items-center justify-between mb-5">
                  <span className={`text-[11px] font-black uppercase tracking-wide ${s.accent}`}>{s.label}</span>
                  <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.gradient} flex items-center justify-center text-white font-black text-xs shadow-lg ${s.glow}`}>
                    {s.stage}
                  </span>
                </div>

                <div className="text-3xl mb-2">{s.icon}</div>

                {/* Most popular badge — inline, doesn't overlap content */}
                {"recommended" in s && s.recommended && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500 text-white text-[8px] font-bold uppercase tracking-widest shadow-sm mb-2.5 self-start">
                    ✦ Most useful before you apply
                  </div>
                )}

                <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2">{s.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-5">{s.desc}</p>

                <Link
                  href={s.href}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:gap-2.5 transition-all group-hover:gap-2.5"
                >
                  {s.cta} <ChevronRight className={`w-3.5 h-3.5 ${s.accent}`} />
                </Link>
                {"secondaryHref" in s && s.secondaryHref && (
                  <Link
                    href={s.secondaryHref as string}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-blue-500 transition-colors"
                  >
                    {s.secondaryCta as string}
                  </Link>
                )}
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Product Outputs ───────────────────────────────────────── */}
      <section id="outputs" className="py-20 bg-[#080B14] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

            {/* ── LEFT: controls (40%) ── */}
            <div className="w-full lg:w-[38%] lg:sticky lg:top-28 lg:self-start">
              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-bold text-xs uppercase tracking-widest mb-5">
                <Sparkles className="w-3 h-3" /> See the output, not the claim
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white leading-tight mb-3">
                See what you<br />actually get
              </h2>
              <p className="text-gray-400 text-base mb-8 leading-relaxed">
                Sample outputs — illustrative of what each tool produces.
              </p>

              {/* Demo selectors */}
              <div className="space-y-2 mb-10">
                {[
                  { icon: "🎯", label: "University Match",   sub: "Your personalised shortlist"        },
                  { icon: "🧾", label: "SOP Check",          sub: "AI feedback on your statement"      },
                  { icon: "🎤", label: "Interview Coach",    sub: "Score and improve your answers"     },
                  { icon: "📊", label: "ROI Analysis",       sub: "Compare by return on investment"    },
                  { icon: "🛂", label: "Visa Apply",         sub: "Country-specific checklist + risk"  },
                ].map((tab, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDemo(i)}
                    className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 ${
                      activeDemo === i
                        ? "bg-white/10 border border-white/20"
                        : "border border-transparent hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{tab.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold text-sm ${activeDemo === i ? "text-white" : "text-gray-300"}`}>{tab.label}</div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">{tab.sub}</div>
                    </div>
                    {activeDemo === i && <ChevronRight className="w-4 h-4 text-indigo-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-500/25"
                >
                  Try this with your profile <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#tools"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-gray-300 hover:bg-white/8 hover:text-white font-semibold text-sm transition-colors"
                >
                  Explore all tools
                </a>
              </div>
            </div>

            {/* ── RIGHT: demo panel (60%) ── */}
            <div className="w-full lg:w-[62%]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeDemo}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.22 }}
                >

                  {/* ══ DEMO 0 — University Match ══ */}
                  {activeDemo === 0 && (
                    <div>
                      {/* Card stack depth layers */}
                      <div className="relative">
                        {/* Back card — peeking behind */}
                        <div className="absolute inset-x-5 top-5 bottom-0 bg-white/20 rounded-3xl" />
                        <div className="absolute inset-x-2.5 top-2.5 bottom-0 bg-white/40 rounded-3xl" />
                        {/* Front card */}
                        <div className="relative bg-white rounded-3xl shadow-[0_28px_64px_-8px_rgba(0,0,0,0.65)] overflow-hidden z-10">
                          <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                          {/* Header */}
                          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                              </div>
                              <span className="font-bold text-gray-900">University Match</span>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 uppercase tracking-wide">Match Tool</span>
                          </div>
                          {/* Profile */}
                          <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                            <p className="text-xs text-gray-400 font-mono">GPA 3.4 · GRE 315 · CS · 2 yrs exp · USA</p>
                          </div>
                          {/* Highlighted university */}
                          <div className="px-6 pt-5 pb-4">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xl">🇺🇸</span>
                                  <span className="font-bold text-gray-900 text-lg">Northeastern University</span>
                                </div>
                                <p className="text-gray-500 text-sm ml-8">MS Computer Science · Boston, MA</p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-3">
                                <div className="text-2xl font-black text-indigo-600">82%</div>
                                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Fit Score</div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">🟡 Reach</span>
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">$52K / yr</span>
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">Deadline Jan 15</span>
                            </div>
                            <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-4">
                              <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-indigo-800 leading-relaxed">Strong fit due to academic profile and budget alignment. Khoury co-op matches your gap-year goals.</p>
                              </div>
                            </div>
                          </div>
                          {/* Tier list below */}
                          <div className="px-6 pb-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">Safe (2)</span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">U. Cincinnati<br />Arizona State</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Reach (3)</span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">Northeastern<br />UT Dallas<br />U. Washington</p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Ambitious (2)</span>
                              </div>
                              <p className="text-xs text-gray-600 leading-relaxed">Carnegie Mellon<br />Georgia Tech</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ DEMO 1 — SOP Check ══ */}
                  {activeDemo === 1 && (
                    <div className="bg-white rounded-3xl shadow-[0_28px_64px_-8px_rgba(0,0,0,0.65)] overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
                      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                            <FileText className="w-4 h-4 text-violet-600" />
                          </div>
                          <span className="font-bold text-gray-900">SOP Feedback</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 uppercase tracking-wide">Application Check</span>
                      </div>
                      <div className="px-6 py-5 space-y-4">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your opening paragraph</p>
                          <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                            <p className="text-[15px] text-gray-600 italic leading-relaxed">&ldquo;I have always been passionate about technology and computers since my childhood days growing up...&rdquo;</p>
                            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-3 py-1 rounded-full">
                              ⚠ Weak hook — reviewers stop reading
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">AI suggested rewrite</p>
                          <div className="rounded-2xl bg-green-50 border border-green-100 p-4">
                            <p className="text-[15px] text-gray-700 leading-relaxed">&ldquo;At 22, I shipped a search feature used by 40,000 users. That week taught me more about systems design than three semesters of coursework.&rdquo;</p>
                            <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                              ✓ Specific · Memorable · Reviewers stop here
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl bg-violet-50 border border-violet-100 p-4">
                          <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2">2 more issues flagged</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />Career goal paragraph is vague — no measurable outcome stated</div>
                            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />Why-this-university section feels templated — add specific faculty</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ DEMO 2 — Interview Coach ══ */}
                  {activeDemo === 2 && (
                    <div className="bg-white rounded-3xl shadow-[0_28px_64px_-8px_rgba(0,0,0,0.65)] overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />
                      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center">
                            <Mic className="w-4 h-4 text-teal-600" />
                          </div>
                          <span className="font-bold text-gray-900">Interview Coach</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-600 uppercase tracking-wide">Interview Prep</span>
                      </div>
                      <div className="px-6 py-5 space-y-4">
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Question</p>
                          <p className="text-[15px] font-semibold text-gray-800 leading-snug">&ldquo;Why did you choose Northeastern over other universities?&rdquo;</p>
                        </div>
                        <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your answer</p>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <div key={n} className={`w-2.5 h-2 rounded-sm ${n <= 5 ? "bg-red-400" : "bg-gray-200"}`} />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-red-600">5 / 10</span>
                            </div>
                          </div>
                          <p className="text-[15px] text-gray-600 italic leading-relaxed">&ldquo;It has a great reputation and good faculty in my field of interest.&rdquo;</p>
                        </div>
                        <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">AI suggestion</p>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <div key={n} className={`w-2.5 h-2 rounded-sm ${n <= 8 ? "bg-blue-400" : "bg-gray-200"}`} />
                                ))}
                              </div>
                              <span className="text-xs font-bold text-blue-600">8 / 10</span>
                            </div>
                          </div>
                          <p className="text-[15px] text-gray-700 leading-relaxed">Mention Prof. Riedl&rsquo;s NLP lab specifically. Tie Khoury&rsquo;s co-op to your career gap year — that&rsquo;s the concrete reason interviewers want to hear.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ══ DEMO 3 — ROI Analysis ══ */}
                  {activeDemo === 3 && (
                    <div className="bg-white rounded-3xl shadow-[0_28px_64px_-8px_rgba(0,0,0,0.65)] overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
                      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                          </div>
                          <span className="font-bold text-gray-900">ROI Analysis</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 uppercase tracking-wide">ROI Calculator</span>
                      </div>
                      <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-mono">MS Data Science · 2 offers compared</p>
                      </div>
                      {/* Side-by-side offer cards */}
                      <div className="px-6 py-5 grid grid-cols-2 gap-4 mb-2">
                        <div className="rounded-2xl border border-gray-200 p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🇬🇧</span>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">UCL</p>
                              <p className="text-xs text-gray-400">London, UK</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-mono text-gray-800">£42K</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Yr 1 salary</span><span className="font-mono text-gray-800">£55K</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Break-even</span><span className="font-mono text-gray-800">2.3 yrs</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">5-yr gain</span><span className="font-mono text-gray-800">+£233K</span></div>
                          </div>
                        </div>
                        <div className="rounded-2xl border-2 border-green-400 bg-green-50/40 p-4 relative">
                          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                            <span className="text-[10px] font-black text-white bg-green-500 px-3 py-0.5 rounded-full uppercase tracking-wide">Best ROI</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">🇺🇸</span>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">UIUC</p>
                              <p className="text-xs text-gray-400">Illinois, USA</p>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-mono text-gray-800">$68K</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Yr 1 salary</span><span className="font-mono font-bold text-green-700">$120K</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Break-even</span><span className="font-mono font-bold text-green-700">1.8 yrs</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">5-yr gain</span><span className="font-mono font-bold text-green-700">+$532K</span></div>
                          </div>
                        </div>
                      </div>
                      <div className="mx-6 mb-5 rounded-2xl bg-green-50 border border-green-100 px-4 py-3.5">
                        <p className="text-sm font-semibold text-green-800">✓ UIUC recovers 22% faster and yields $299K more over 5 years</p>
                      </div>
                    </div>
                  )}

                  {/* ══ DEMO 4 — Visa Apply ══ */}
                  {activeDemo === 4 && (
                    <div className="bg-white rounded-3xl shadow-[0_28px_64px_-8px_rgba(0,0,0,0.65)] overflow-hidden">
                      <div className="h-1 bg-gradient-to-r from-sky-500 to-cyan-500" />
                      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center">
                            <span className="text-base">🛂</span>
                          </div>
                          <span className="font-bold text-gray-900">Visa Apply — F-1 (USA)</span>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-600 uppercase tracking-wide">Visa Coach</span>
                      </div>
                      <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs text-gray-400 font-mono">Carnegie Mellon · MS · I-20 received · Apply window open</p>
                      </div>

                      {/* Financial proof + key fees — the thing that changes every intake */}
                      <div className="px-6 py-5 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl border border-gray-100 p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">SEVIS I-901</p>
                          <p className="text-lg font-black text-gray-900">$350</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Pay before DS-160</p>
                        </div>
                        <div className="rounded-2xl border border-gray-100 p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">MRV Fee</p>
                          <p className="text-lg font-black text-gray-900">$185</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Non-refundable</p>
                        </div>
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3">
                          <p className="text-[10px] font-bold text-sky-600 uppercase tracking-widest mb-1">Funds to show</p>
                          <p className="text-lg font-black text-sky-700">$89,420</p>
                          <p className="text-[10px] text-sky-600 mt-0.5">Yr 1 tuition + living</p>
                        </div>
                      </div>

                      {/* Checklist with live statuses */}
                      <div className="px-6 pb-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Personalised checklist</p>
                        <div className="space-y-2">
                          {[
                            { label: "I-20 from Carnegie Mellon", status: "done" },
                            { label: "SEVIS I-901 payment receipt", status: "done" },
                            { label: "DS-160 confirmation (barcode page)", status: "pending" },
                            { label: "Bank statements — 6 months, ≥ $89,420 coverage", status: "flag" },
                            { label: "Sponsor affidavit (if applicable)", status: "pending" },
                            { label: "Visa interview slot — Mumbai consulate", status: "pending" },
                          ].map((c) => {
                            const cfg =
                              c.status === "done"
                                ? { dot: "bg-emerald-500", text: "text-gray-700", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Done" }
                                : c.status === "flag"
                                ? { dot: "bg-red-500", text: "text-gray-800 font-semibold", badge: "bg-red-50 text-red-700 border-red-200", label: "Risk flag" }
                                : { dot: "bg-amber-400", text: "text-gray-600", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "Pending" };
                            return (
                              <div key={c.label} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                                <span className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                                <p className={`text-sm leading-snug flex-1 ${cfg.text}`}>{c.label}</p>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge} uppercase tracking-wider flex-shrink-0`}>
                                  {cfg.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Risk flag explainer */}
                      <div className="mx-6 mt-4 mb-3 rounded-2xl bg-red-50 border border-red-100 p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-red-700 mb-0.5">Funds risk flag</p>
                            <p className="text-xs text-red-600 leading-relaxed">Your current statement shows $71,200 — $18,220 short of the 1-year coverage USCIS officers expect for Pittsburgh. Add sponsor affidavit or top-up before the interview.</p>
                          </div>
                        </div>
                      </div>

                      {/* Apply link */}
                      <div className="mx-6 mb-5 rounded-2xl bg-sky-50 border border-sky-100 px-4 py-3.5 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-sky-800">🔗 Direct apply link: travel.state.gov · DS-160 form</p>
                        <span className="text-[10px] font-bold text-sky-600 bg-white border border-sky-200 rounded-full px-2 py-0.5 uppercase tracking-wider">Official</span>
                      </div>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* ── Why EduvianAI is different ────────────────────────────── */}
      <section id="why-different" className="relative py-24 sm:py-28 px-4 sm:px-6 bg-stone-50 overflow-hidden border-t border-stone-200">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-200/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-4">
              <Sparkles className="w-3 h-3" /> What makes us different
            </span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
              Why EduvianAI <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">is different</span>
            </h2>
            <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
              Developed by industry-leading study-abroad experts, powered by AI.
            </p>
          </div>

          {/* The verification card leads — it's the moat, so it gets the
              full-width hero slot above the supporting three. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4 }}
            className="relative bg-gradient-to-br from-emerald-100 to-emerald-200/70 border border-emerald-300/60 rounded-2xl p-8 sm:p-10 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300 mb-5 overflow-hidden"
          >
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md bg-emerald-600 text-white flex-shrink-0">
                <Database className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-[10px] uppercase tracking-widest mb-2">
                  ★ Our moat
                </span>
                <h3 className="text-gray-900 font-extrabold text-xl sm:text-2xl mb-2 leading-snug">
                  {DB_STATS.verifiedProgramsLabel} programs verified at the source
                </h3>
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed mb-4">
                  Every fee, deadline and cutoff is fetched from the live university page — never invented, never recycled. If a value isn&apos;t on the official page, we leave it blank.
                </p>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {[
                    { num: "01", text: "Catalog seeded" },
                    { num: "02", text: "Live URL fetch" },
                    { num: "03", text: "Field extraction" },
                  ].map((s) => (
                    <div key={s.num} className="bg-white/60 border border-emerald-200/80 rounded-lg px-3 py-2">
                      <p className="text-[9px] font-bold text-emerald-700 mb-0.5">{s.num}</p>
                      <p className="text-[11px] font-semibold text-gray-700 leading-tight">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                Icon: Users,
                title: "Independent: we work for you, not universities",
                body: "No university pays us a commission. No school appears in your shortlist because of a marketing deal. The recommendation is yours, not someone else's quota.",
                accent: "from-rose-100 to-rose-200/70 border-rose-300/60",
                iconBg: "bg-rose-600 text-white",
              },
              {
                Icon: Brain,
                title: "AI-driven, free of agent-counselling shortcuts",
                body: "Traditional agent counselling runs on assumptions, personal favourites, and whichever programme is easiest to push that month. Every student here gets the same data-driven analysis — no convenience counselling, no biased nudging, no \"we always send students to X.\"",
                accent: "from-violet-100 to-violet-200/70 border-violet-300/60",
                iconBg: "bg-violet-600 text-white",
              },
              {
                Icon: Compass,
                title: "Built to decide, not just discover",
                body: "Search is the easy part. Shortlist → SOP review → interview prep → fee comparison → final pick. Every tool returns specific next steps, not vague advice — solving the real pain points students hit at every stage.",
                accent: "from-blue-100 to-blue-200/70 border-blue-300/60",
                iconBg: "bg-blue-600 text-white",
              },
              {
                Icon: Eye,
                title: "Transparent by design",
                body: "Outputs are decision-support estimates, and we say so. Final eligibility, fees and deadlines should always be verified from official sources before you commit.",
                accent: "from-amber-100 to-amber-200/70 border-amber-300/60",
                iconBg: "bg-amber-600 text-white",
              },
            ].map(({ Icon, title, body, accent, iconBg }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4 }}
                className={`relative bg-gradient-to-br ${accent} border rounded-2xl p-7 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all duration-300`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 shadow-md ${iconBg}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-2 leading-snug">{title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How recommendations are made ─────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-t border-stone-200">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs uppercase tracking-widest mb-3">
              <Eye className="w-3 h-3" /> How it works under the hood
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-3">
              How your shortlist is built
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
              No magic. A clear, repeatable process — same answer for the same profile, every time.
            </p>
          </div>

          <ol className="space-y-3">
            {[
              { n: "01", t: "We read your profile",        d: "Academic record, test scores, budget, intended field, target countries — what you give us is all we use." },
              { n: "02", t: "We match against verified data", d: "Every program in your shortlist comes from our 4,400+ verified-at-source database. No catalog scrapes, no recycled lists." },
              { n: "03", t: "We classify Safe / Reach / Ambitious", d: "Each match gets a transparent fit score across 9 signals — eligibility, ranking, fees, deadlines, language tests, work experience." },
              { n: "04", t: "We show what influenced the rank", d: "You see why a program was placed where it was — not a black-box number." },
              { n: "05", t: "We leave missing data blank, not guessed", d: "If the official page doesn't state a fee or deadline, the field stays empty. We never invent values." },
            ].map((s) => (
              <li key={s.n} className="flex gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200">
                <span className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center">{s.n}</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{s.t}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
           HOW IT WORKS: 3 merged steps
          ══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 sm:py-28 px-4 sm:px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">

          {/* ── STAGE 1: Match ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-violet-50 border border-indigo-100 overflow-hidden p-10 md:p-14 mb-28"
          >
            {/* Blobs */}
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl pointer-events-none" />

            {/* Stage pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-xs font-black px-5 py-2 rounded-full shadow-lg shadow-indigo-200 mb-8">
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[11px] font-black">1</span>
              STAGE 1 · MATCH — KNOW YOUR PROFILE
            </div>

            <div className="grid md:grid-cols-2 gap-14 items-center">
              {/* Left: copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-indigo-600 text-xs font-bold uppercase tracking-wider mb-4 border border-indigo-200">
                  <BookOpen className="w-3.5 h-3.5" /> Stage 1 · Match
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Rate your profile —<br />
                  <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">get your best-fit shortlist</span>
                </h3>
                <p className="text-gray-500 text-base leading-relaxed mb-7">
                  Tell us your scores, budget, and goals. Our AI matches against {DB_STATS.verifiedProgramsLabel} programs across 12 signals. You get a personalised Top 20 shortlist — Safe, Reach, and Ambitious — in under 2 minutes.
                </p>
                {/* Score meter */}
                <div className="mb-8 p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Profile strength</p>
                  <div className="relative h-2.5 rounded-full bg-gradient-to-r from-gray-200 via-indigo-400 via-amber-400 to-rose-500 mb-2">
                    <div className="absolute right-[4%] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-rose-500 shadow-md" />
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-gray-400">
                    <span>Competitive</span><span>Strong</span><span>Very Strong</span><span className="text-rose-500 font-bold">Admit Strength</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link href="/get-started"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-indigo-600 transition-colors">
                    Rate your profile now <ChevronRight className="w-4 h-4" />
                  </Link>
                  <Link href="/get-started"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:brightness-110 transition-all">
                    Get my customised Shortlist <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right: product mockup — shortlist results */}
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl bg-white border border-indigo-100 p-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Your Top 20 Shortlist</p>
                      <p className="text-[10px] text-gray-400">Sample output · 12 signals matched</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">AI Match</span>
                  </div>
                  {/* University rows */}
                  {[
                    { name: "Univ. of Leeds", program: "MSc AI & Data Science", score: 91, tier: "Safe", flag: "🇬🇧", tc: "text-emerald-700", bc: "bg-emerald-50", bar: "from-emerald-400 to-teal-400" },
                    { name: "Univ. of Edinburgh", program: "MSc Computer Science", score: 76, tier: "Reach", flag: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", tc: "text-amber-700", bc: "bg-amber-50", bar: "from-amber-400 to-orange-400" },
                    { name: "Imperial College", program: "MSc Machine Learning", score: 63, tier: "Ambitious", flag: "🇬🇧", tc: "text-indigo-700", bc: "bg-indigo-50", bar: "from-indigo-400 to-violet-400" },
                    { name: "TU Munich", program: "MSc Informatics", score: 79, tier: "Reach", flag: "🇩🇪", tc: "text-amber-700", bc: "bg-amber-50", bar: "from-amber-400 to-orange-400" },
                    { name: "Univ. of Toronto", program: "MEng Computer Science", score: 88, tier: "Safe", flag: "🇨🇦", tc: "text-emerald-700", bc: "bg-emerald-50", bar: "from-emerald-400 to-teal-400" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-base flex-shrink-0">{r.flag}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{r.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{r.program}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full bg-gradient-to-r ${r.bar}`} style={{width: `${r.score}%`}} />
                          </div>
                          <span className="text-[10px] font-black text-gray-600">{r.score}%</span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${r.bc} ${r.tc} flex-shrink-0`}>{r.tier}</span>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">Showing 5 of 20 matches</span>
                    <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">View all <ChevronRight className="w-3 h-3" /></span>
                  </div>
                </div>
                {/* Corner graduate photo */}
                <div className="absolute -bottom-8 -right-6 w-44 h-44 rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                  <img src="/graduate-india.jpg"
                    alt="Indian graduate" className="w-full h-full object-cover object-top" />
                </div>
                {/* Floating shortlist mockup */}
                <div className="absolute top-4 -left-4 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-52">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Your Top 3 Matches</p>
                  {[
                    { name: "Univ. of Leeds", program: "MSc AI", score: "91%", tier: "Safe", tc: "text-emerald-600", bc: "bg-emerald-50" },
                    { name: "Univ. of Edinburgh", program: "MSc CS", score: "76%", tier: "Reach", tc: "text-amber-600", bc: "bg-amber-50" },
                    { name: "Imperial College", program: "MSc CS", score: "63%", tier: "Ambitious", bc: "bg-indigo-50", tc: "text-indigo-600" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-[10px] font-bold text-gray-800 leading-none">{r.name}</p>
                        <p className="text-[9px] text-gray-400">{r.program}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-black text-gray-700">{r.score}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${r.bc} ${r.tc}`}>{r.tier}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Stage separator 1 → 2 ── */}
          <div className="flex items-center gap-5 mb-16 -mt-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-indigo-200 to-indigo-300/60" />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 shadow-sm">
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-black">2</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Check &amp; Strengthen</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-indigo-200 to-indigo-300/60" />
          </div>

          {/* ── STEP 2: Matching Engine ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-indigo-950 via-violet-900 to-slate-900 text-white overflow-hidden mb-28 p-10 md:p-14"
          >
            {/* Blobs */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

            {/* Step pill */}
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-black px-5 py-2 rounded-full mb-8">
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-black">2</span>
              STAGE 2 · CHECK — STRENGTHEN YOUR APPLICATION
            </div>

            <div className="relative grid md:grid-cols-2 gap-12 items-center">
              {/* Left: copy */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Build a credible application</span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
                  You have your shortlist.<br />
                  <span className="text-indigo-400">Now make sure you get in.</span>
                </h3>
                <p className="text-slate-300 text-base leading-relaxed mb-6">
                  Three tools to strengthen your application before you submit. Write a cliché-free SOP, score and rebuild your CV across 6 dimensions, or run a full Pack Check — SOP, CV, profile, and recommendation letters — for credibility gaps and red flags.
                </p>
                <div className="flex flex-wrap gap-4 mb-8">
                  {[
                    { val: "7", label: "SOP dimensions scored" },
                    { val: "6", label: "CV dimensions scored" },
                    { val: "Free", label: "always" },
                  ].map((s) => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-black text-white">{s.val}</p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/sop-assistant"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-colors shadow-lg">
                    Write my SOP <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/application-check"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/20 transition-colors">
                    Check my application
                  </Link>
                </div>
              </div>

              {/* Right: tool cards */}
              <div className="space-y-3">
                {/* Application Pack Check — hero card */}
                <Link href="/application-check"
                  className="relative flex items-start gap-4 p-5 rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 hover:border-indigo-400/70 hover:scale-[1.02] transition-all cursor-pointer block ring-1 ring-indigo-400/20"
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                    ★ Most valuable before you apply
                  </div>
                  <span className="text-2xl flex-shrink-0 mt-0.5">📋</span>
                  <div>
                    <p className="text-sm font-extrabold text-white mb-0.5 mt-0.5">Application Pack Check</p>
                    <p className="text-xs text-slate-300 leading-snug mb-1.5">Paste your SOP, CV, profile &amp; recommendation letters. Spot contradictions, credibility gaps, and exactly what an officer would question — plus an LOR Coach link to send recommenders. With a fix list.</p>
                    <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Readiness score + fix list</span>
                  </div>
                </Link>
                {/* SOP + CV cards */}
                {[
                  {
                    icon: "✍️",
                    title: "AI SOP Assistant",
                    desc: "Write a compelling SOP from your story — scored across 7 dimensions from Reject Risk to Top Tier.",
                    badge: "7 dimensions · instant score",
                    bg: "bg-violet-500/10 border-violet-500/20",
                    href: "/sop-assistant",
                  },
                  {
                    icon: "📄",
                    title: "CV Assessment & Builder",
                    desc: "Score your CV across 6 admission dimensions, then generate a tailored admission-ready version in minutes.",
                    badge: "Score /10 · 6 dimensions · CV generated",
                    bg: "bg-pink-500/10 border-pink-500/20",
                    href: "/application-check",
                  },
                ].map((tool) => (
                  <Link href={tool.href} key={tool.title}
                    className={`flex items-start gap-4 p-4 rounded-2xl border ${tool.bg} hover:scale-[1.02] transition-transform cursor-pointer block`}
                  >
                    <span className="text-2xl flex-shrink-0">{tool.icon}</span>
                    <div>
                      <p className="text-sm font-extrabold text-white mb-0.5">{tool.title}</p>
                      <p className="text-xs text-slate-300 leading-snug mb-1.5">{tool.desc}</p>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">{tool.badge}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Stage separator 2 → 3 ── */}
          <div className="flex items-center gap-5 mb-16 -mt-12">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-200 to-teal-300/60" />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 border border-teal-200 shadow-sm">
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-[9px] font-black">3</span>
              <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Practice &amp; Prepare</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-teal-200 to-teal-300/60" />
          </div>

          {/* ── STAGE 3: Practice ──────────────────────────────────── */}
          <motion.div
            id="practice"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-teal-950 via-emerald-950 to-slate-900 border border-teal-900/50 overflow-hidden p-10 md:p-14 mb-10"
          >
            {/* Ambient glows */}
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />

            {/* Stage pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black px-5 py-2 rounded-full shadow-lg shadow-emerald-900/50 mb-8">
              <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-[11px] font-black">3</span>
              STAGE 3 · PRACTICE — PREPARE FOR WHAT&apos;S COMING
            </div>

            {/* Headline */}
            <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Practice until<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">nothing surprises you.</span>
            </h3>
            <p className="text-white/50 text-base leading-relaxed mb-14 max-w-2xl">
              Two tracks, one goal: walk into your visa interview and English proficiency test already knowing your weak spots — and having fixed them.
            </p>

            {/* ─── Track A: English Test Lab ─── */}
            <div className="mb-14">
              <div className="flex items-start justify-between gap-4 mb-2 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-widest">Track A · Test Prep</p>
                    <h4 className="text-lg font-extrabold text-white leading-tight">English Test Lab</h4>
                  </div>
                </div>
                <Link href="/english-test-lab" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 text-xs font-bold hover:bg-teal-500/30 transition-colors">
                  See all tests <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-white/75 text-sm mb-7 pl-11">
                Full-length mocks for all four major English proficiency exams — AI-scored, exam-style practice based on published test structures, with instant results and detailed feedback.
              </p>

              <div className="grid sm:grid-cols-4 gap-3">

                {/* IELTS */}
                <Link href="/english-test-lab/ielts" className="group relative rounded-2xl bg-black/20 border border-white/25 p-5 flex flex-col hover:bg-black/30 hover:border-violet-400/50 hover:shadow-xl hover:shadow-violet-900/20 hover:-translate-y-1 transition-all duration-300">
                  <span className="text-2xl mb-3">🎓</span>
                  <p className="text-[10px] font-black text-violet-300 uppercase tracking-wider mb-0.5">IELTS-style</p>
                  <p className="text-sm font-extrabold text-white mb-1">IELTS Academic</p>
                  <p className="text-xs text-white/80 mb-1">Bands 0–9</p>
                  <p className="text-[10px] text-white/65 mb-auto">4 sections · 3 mocks</p>
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                    <span className="text-[10px] text-white/75 font-semibold">Start mock</span>
                    <ChevronRight className="w-3.5 h-3.5 text-violet-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* PTE */}
                <Link href="/english-test-lab/pte" className="group relative rounded-2xl bg-black/20 border border-white/25 p-5 flex flex-col hover:bg-black/30 hover:border-indigo-400/50 hover:shadow-xl hover:shadow-indigo-900/20 hover:-translate-y-1 transition-all duration-300">
                  <span className="text-2xl mb-3">📝</span>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-wider mb-0.5">PTE-style</p>
                  <p className="text-sm font-extrabold text-white mb-1">PTE Academic</p>
                  <p className="text-xs text-white/80 mb-1">Score 0–90</p>
                  <p className="text-[10px] text-white/65 mb-auto">7 task types · 3 mocks</p>
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                    <span className="text-[10px] text-white/75 font-semibold">Start mock</span>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* DET */}
                <Link href="/english-test-lab/det" className="group relative rounded-2xl bg-black/20 border border-white/25 p-5 flex flex-col hover:bg-black/30 hover:border-teal-400/50 hover:shadow-xl hover:shadow-teal-900/20 hover:-translate-y-1 transition-all duration-300">
                  <span className="text-2xl mb-3">🦆</span>
                  <p className="text-[10px] font-black text-teal-300 uppercase tracking-wider mb-0.5">DET-style</p>
                  <p className="text-sm font-extrabold text-white mb-1">Duolingo English Test</p>
                  <p className="text-xs text-white/80 mb-1">Score 10–160</p>
                  <p className="text-[10px] text-white/65 mb-auto">6 task types · 3 mocks</p>
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                    <span className="text-[10px] text-white/75 font-semibold">Start mock</span>
                    <ChevronRight className="w-3.5 h-3.5 text-teal-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* TOEFL */}
                <Link href="/english-test-lab/toefl" className="group relative rounded-2xl bg-black/20 border border-white/25 p-5 flex flex-col hover:bg-black/30 hover:border-sky-400/50 hover:shadow-xl hover:shadow-sky-900/20 hover:-translate-y-1 transition-all duration-300">
                  <span className="text-2xl mb-3">🏛️</span>
                  <p className="text-[10px] font-black text-sky-300 uppercase tracking-wider mb-0.5">TOEFL-style</p>
                  <p className="text-sm font-extrabold text-white mb-1">TOEFL iBT</p>
                  <p className="text-xs text-white/80 mb-1">Score 0–120</p>
                  <p className="text-[10px] text-white/65 mb-auto">4 sections · 3 mocks</p>
                  <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between">
                    <span className="text-[10px] text-white/75 font-semibold">Start mock</span>
                    <ChevronRight className="w-3.5 h-3.5 text-sky-300 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

              </div>

              {/* Proof chips */}
              <div className="flex flex-wrap gap-2 mt-6">
                {[
                  { icon: "🎯", text: "Exam-style questions" },
                  { icon: "🤖", text: "AI-scored writing & speaking" },
                  { icon: "⏱️", text: "Real exam timings" },
                  { icon: "📊", text: "Detailed score breakdown" },
                  { icon: "🆓", text: "Completely free" },
                ].map((c) => (
                  <span key={c.text} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 border border-white/25 text-white/85 text-[11px] font-semibold">
                    {c.icon} {c.text}
                  </span>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-14">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/60 text-[11px] font-black uppercase tracking-widest px-3">Also in Stage 3</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* ─── Track B: AI Interview Coach ─── */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex-shrink-0">
                  <Mic className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Track B · Interview Prep</p>
                  <h4 className="text-lg font-extrabold text-white leading-tight">AI Interview Coach</h4>
                </div>
              </div>
              <p className="text-white/40 text-sm mb-6 pl-11">Voice &amp; text mock interviews. AI flags your weak answers and helps you improve them in your own words — before the real thing.</p>

              <div className="grid sm:grid-cols-3 gap-4">

                {/* Australia */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
                  className="group relative bg-white/8 border border-white/15 rounded-2xl p-6 flex flex-col hover:bg-white/12 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-900/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-900/40 text-xl flex-shrink-0">🇦🇺</div>
                    <div>
                      <p className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Australia</p>
                      <h5 className="text-sm font-extrabold text-white leading-tight">GS Interview Coach</h5>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-4 flex-1">19 Genuine Student questions. AI identifies which answers raise doubts and helps you strengthen them in your own words.</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {["19 Q", "Flags doubts", "Fixes reasoning"].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] font-semibold">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href="/interview-prep?country=australia&mode=text" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold hover:bg-sky-500/30 transition-colors">✍️ Text</Link>
                    <Link href="/interview-prep?country=australia" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/60 text-xs font-bold hover:bg-white/20 transition-colors">🎙️ Voice</Link>
                  </div>
                </motion.div>

                {/* UK */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
                  className="group relative bg-white/8 border border-white/15 rounded-2xl p-6 flex flex-col hover:bg-white/12 hover:border-rose-500/40 hover:shadow-xl hover:shadow-rose-900/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg shadow-rose-900/40 text-xl flex-shrink-0">🇬🇧</div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">United Kingdom</p>
                      <h5 className="text-sm font-extrabold text-white leading-tight">Credibility Interview Coach</h5>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-4 flex-1">14 credibility questions. AI flags answers that raise doubts and shows you how to sound convincing before it matters.</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {["14 Q", "Credibility gaps", "Story fix"].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href="/interview-prep?country=uk&mode=text" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition-colors">✍️ Text</Link>
                    <Link href="/interview-prep?country=uk" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/60 text-xs font-bold hover:bg-white/20 transition-colors">🎙️ Voice</Link>
                  </div>
                </motion.div>

                {/* USA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}
                  className="group relative bg-white/8 border border-white/15 rounded-2xl p-6 flex flex-col hover:bg-white/12 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-900/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-r from-blue-600 to-red-600 flex items-center justify-center shadow-lg shadow-blue-900/40 text-xl flex-shrink-0">🇺🇸</div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">United States</p>
                      <h5 className="text-sm font-extrabold text-white leading-tight">F-1 Visa Interview Coach</h5>
                    </div>
                  </div>
                  <p className="text-xs text-white/45 leading-relaxed mb-4 flex-1">60+ F-1 consulate questions across 12 sections. AI reveals where the officer would doubt your intent and shows you exactly how to fix it.</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {["60+ Q", "12 sections", "Intent clarity"].map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-semibold">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Link href="/interview-prep?country=usa&mode=text" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold hover:bg-blue-500/30 transition-colors">✍️ Text</Link>
                    <Link href="/interview-prep?country=usa" className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white/60 text-xs font-bold hover:bg-white/20 transition-colors">🎙️ Voice</Link>
                  </div>
                </motion.div>

              </div>
            </div>

          </motion.div>

          {/* ── Stage separator 3 → 4 ── */}
          <div className="flex items-center gap-5 mb-16 mt-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200 to-amber-300/60" />
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 shadow-sm">
              <span className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-[9px] font-black">4</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Decide with Data</span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-amber-200 to-amber-300/60" />
          </div>

          {/* ── STAGE 4: Decide ── */}
          <motion.div
            id="tools"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-amber-50 via-white to-orange-50 border border-amber-100 overflow-hidden p-10 md:p-14"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl pointer-events-none" />

            {/* Step pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black px-5 py-2 rounded-full shadow-lg shadow-amber-200 mb-8">
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[11px] font-black">4</span>
              STAGE 4 · DECIDE — MAKE THE FINAL CALL WITH DATA
            </div>

            <div className="grid md:grid-cols-2 gap-14 items-start">
              {/* Left: copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-200">
                  <TrendingUp className="w-3.5 h-3.5" /> Stage 4 · Decide
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Decide with your family,<br />
                  <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">not in confusion.</span>
                </h3>
                <p className="text-gray-500 text-base leading-relaxed mb-6">
                  Compare offers using cost, ROI, safety, job-market outlook, scholarship fit and long-term value. Generate a parent-ready decision report that makes the final choice easier to discuss.
                </p>
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {[
                    { icon: "📊", text: "Real payback period" },
                    { icon: "💰", text: "10-year ROI" },
                    { icon: "👨‍👩‍👧", text: "Parent-ready verdict" },
                    { icon: "↔", text: "Side-by-side compare" },
                    { icon: "🆓", text: "100% free" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 font-semibold shadow-sm">
                      <span>{f.icon}</span>{f.text}
                    </div>
                  ))}
                </div>

                {/* Program Comparison Tool */}
                <Link href="/get-started" className="block group">
                  <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm hover:shadow-lg hover:border-violet-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <BarChart2 className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-violet-600">5</span>
                        <p className="text-[9px] text-gray-400 leading-none">offers</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-violet-500 uppercase tracking-wider mb-0.5">Compare Tool</p>
                    <p className="text-sm font-extrabold text-gray-900 mb-2">Compare 5 offers side by side</p>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">Tuition · salary · payback · safety · PSW visa — all in one table.</p>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-violet-50 border border-violet-100 mb-3">
                      <span className="text-[10px] font-bold text-violet-700">Outcome:</span>
                      <span className="text-[10px] text-violet-600">Best-value offer, ranked</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        Built into your shortlist
                      </div>
                      <span className="text-xs font-bold text-violet-600 group-hover:gap-2 transition-all inline-flex items-center gap-1">Get Shortlist <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Right: two tool cards */}
              <div className="space-y-4">
                <Link href="/roi-calculator" className="block group">
                  <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-600">30s</span>
                        <p className="text-[9px] text-gray-400 leading-none">to results</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">ROI Calculator</p>
                    <p className="text-base font-extrabold text-gray-900 mb-2">See payback period in 30 seconds</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">Auto-fills tuition, living costs and salary data. Instant payback period, 10-year ROI and break-even salary.</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
                      <span className="text-xs font-bold text-indigo-700">Outcome:</span>
                      <span className="text-xs text-indigo-600">Payback period · 10-yr ROI · break-even salary</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 group-hover:gap-2 transition-all">Open Calculator <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </Link>

                <Link href="/parent-decision" className="block group">
                  <div className="bg-white rounded-2xl border border-amber-100 p-6 shadow-sm hover:shadow-xl hover:border-amber-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-purple-600">7</span>
                        <p className="text-[9px] text-gray-400 leading-none">factors</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-purple-500 uppercase tracking-wider mb-1">Parent Decision Tool</p>
                    <p className="text-base font-extrabold text-gray-900 mb-2">Get a verdict parents understand</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">Data-driven ✓/✗ across budget fit, safety, job market, ROI and more. Built for family conversations.</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100 mb-4">
                      <span className="text-xs font-bold text-purple-700">Outcome:</span>
                      <span className="text-xs text-purple-600">Clear verdict + printable family report</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-purple-600 group-hover:gap-2 transition-all">Open Tool <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </Link>

              </div>
            </div>

            {/* ── Decide-stage dual CTAs (student-led + parent-led) ── */}
            <div className="mt-10 pt-8 border-t border-amber-100 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition-colors shadow-md"
              >
                Compare my offers
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/parent-decision"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-bold transition-colors"
              >
                <Users className="w-4 h-4" />
                Create family decision report
              </Link>
            </div>
          </motion.div>

          {/* ── Stage divider ── */}
          <div className="flex items-center gap-4 my-16">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-sky-200 to-sky-300/60" />
            <div className="flex items-center gap-2 text-sky-500 text-xs font-bold uppercase tracking-widest">
              <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-[11px] font-black">5</span>
              Then → Stage 5
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-sky-200 to-sky-300/60" />
          </div>

          {/* ── STAGE 5: Apply (Visa) ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative rounded-3xl bg-gradient-to-br from-sky-50 via-white to-cyan-50 border border-sky-100 overflow-hidden p-10 md:p-14"
          >
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-cyan-200/30 rounded-full blur-3xl pointer-events-none" />

            {/* Step pill */}
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-xs font-black px-5 py-2 rounded-full shadow-lg shadow-sky-200 mb-8">
              <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[11px] font-black">5</span>
              STAGE 5 · APPLY — GET THE VISA RIGHT THE FIRST TIME
            </div>

            <div className="grid md:grid-cols-2 gap-14 items-start">
              {/* Left: copy */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-bold uppercase tracking-wider mb-4 border border-sky-200">
                  <span>🛂</span> Stage 5 · Apply
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                  Accepted. Now the visa.<br />
                  <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">Get visa-ready with clarity.</span>
                </h3>
                <p className="text-gray-500 text-base leading-relaxed mb-6">
                  Use country-specific checklists, financial-proof guidance, risk flags and deadline tracking to prepare more carefully. Final decisions rest with the consular officer; we help you walk in well-prepared.
                </p>
                <div className="flex flex-wrap gap-2.5 mb-6">
                  {[
                    { icon: "🛂", text: "12 countries covered" },
                    { icon: "📄", text: "Official-source checklists" },
                    { icon: "⚠️", text: "Risk flags" },
                    { icon: "⏱", text: "Deadline countdowns" },
                    { icon: "🔗", text: "Direct apply links" },
                  ].map((f) => (
                    <div key={f.text} className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 font-semibold shadow-sm">
                      <span>{f.icon}</span>{f.text}
                    </div>
                  ))}
                </div>

                {/* Country flag chips */}
                <div className="grid grid-cols-6 gap-1.5">
                  {["🇺🇸","🇬🇧","🇨🇦","🇦🇺","🇩🇪","🇮🇪","🇳🇱","🇫🇷","🇳🇿","🇸🇬","🇲🇾","🇦🇪"].map((f, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-white border border-sky-100 flex items-center justify-center text-xl shadow-sm">
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: two tool cards */}
              <div className="space-y-4">
                <Link href="/visa-coach" className="block group">
                  <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-xl hover:border-sky-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-xl">🛂</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-sky-600">12</span>
                        <p className="text-[9px] text-gray-400 leading-none">countries</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-sky-500 uppercase tracking-wider mb-1">Visa Coach</p>
                    <p className="text-base font-extrabold text-gray-900 mb-2">Country-specific visa playbooks</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">F-1, UK Student, SDS, AUS 500, Germany D-visa and 7 more. Fees, financial proof, checklists, risk flags — every figure linked to the official government page.</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50 border border-sky-100 mb-4">
                      <span className="text-xs font-bold text-sky-700">Outcome:</span>
                      <span className="text-xs text-sky-600">A better-prepared application with fewer avoidable gaps</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 group-hover:gap-2 transition-all">Open Visa Coach <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </Link>

                <Link href="/application-tracker" className="block group">
                  <div className="bg-white rounded-2xl border border-sky-100 p-6 shadow-sm hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-xl">🗂️</span>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-600">4</span>
                        <p className="text-[9px] text-gray-400 leading-none">columns</p>
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Application Tracker</p>
                    <p className="text-base font-extrabold text-gray-900 mb-2">Kanban board for every application</p>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">Shortlisted → In Progress → Submitted → Decision. Per-program checklists, deadline countdowns, and document-version history in one place.</p>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
                      <span className="text-xs font-bold text-indigo-700">Outcome:</span>
                      <span className="text-xs text-indigo-600">Every deadline met, every version saved</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 group-hover:gap-2 transition-all">Open Tracker <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>

        </div>
      </section>


      {/* ── Countries ────────────────────────────────────────────── */}
      <section id="countries" className="py-16 sm:py-24 px-4 sm:px-6 bg-gray-50 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-sm uppercase tracking-widest mb-3">
              <MapPin className="w-3.5 h-3.5" /> Destinations
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              {DB_STATS.countriesLabel} countries. {DB_STATS.verifiedProgramsLabel} programs. Endless possibilities.
            </h2>
            <p className="text-gray-500 mt-3 text-base max-w-xl mx-auto">
              Study in the destinations that fit your goals, budget, and visa reality.
            </p>
          </div>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 gap-3 min-w-[480px]">
              {COUNTRIES.map((c, i) => (
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
        </div>
      </section>

      {/* ── Scholarships section ──────────────────────────────────── */}
      <section id="scholarships" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          {/* Section heading */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-4 border border-blue-100">
              <Award className="w-3.5 h-3.5" />
              SCHOLARSHIPS
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mt-1">
              Fund your global education
            </h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto text-base leading-relaxed">
              Thousands of scholarships are available for international students every year — many go unclaimed. Select a destination to explore key scholarships available there.
            </p>
            <p className="text-xs text-gray-500 mt-4 max-w-xl mx-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 leading-relaxed">
              ℹ️ Scholarship rules change by university, intake and applicant profile. Start broad, then shortlist only what you&apos;re eligible for. Always confirm current eligibility, amounts and deadlines from the official university page before applying.
            </p>
          </div>

          {/* Country chips with teasers */}
          {(() => {
            const teasers: Record<string, string> = {
              "USA": "Fulbright · RA/TA stipends",
              "UK": "Chevening · Gates Cambridge",
              "Australia": "Australia Awards · Destination",
              "Canada": "Vanier · Ontario Trillium",
              "Germany": "DAAD · free public unis",
              "Singapore": "MOE · A*STAR",
              "New Zealand": "NZ Excellence · NZ Aid",
              "Ireland": "Govt 60 awards · IRC",
              "France": "Eiffel Excellence · Erasmus+",
              "UAE": "NYU Abu Dhabi · Khalifa",
              "Malaysia": "Govt · Monash VC",
            };
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                {SCHOLARSHIPS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setSelectedScholarship(selectedScholarship === c.name ? null : c.name)}
                    className={`text-left p-4 rounded-2xl border transition-all ${
                      selectedScholarship === c.name
                        ? "bg-blue-500 text-white border-blue-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{c.flag}</span>
                      <span className="font-bold text-sm">{c.name}</span>
                    </div>
                    <p className={`text-[10px] leading-snug font-medium ${selectedScholarship === c.name ? "text-indigo-100" : "text-gray-400"}`}>
                      {teasers[c.name] ?? c.scholarships[0].name}
                    </p>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* Expanded scholarship panel */}
          {SCHOLARSHIPS.filter(c => c.name === selectedScholarship).map(c => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <span className="text-3xl">{c.flag}</span>
                <h3 className="font-extrabold text-gray-900 text-xl">{c.name} — Scholarships</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {c.scholarships.map((s) => (
                  <li key={s.name} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:-translate-y-0.5 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                    <span className="mt-1 flex-shrink-0 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.name}</p>
                      <p className="text-xs font-semibold text-blue-600 mt-0.5">{s.coverage}</p>
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

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="relative py-28 sm:py-32 px-4 sm:px-6 bg-navy overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <motion.div
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/8 border border-white/15 text-gray-300 text-sm font-semibold mb-6">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              Free · No account needed · 3 minutes
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-5 leading-[1.2]">
              From first shortlist to final visa step —<br />
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">do it with clarity.</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
              Find the right programs, strengthen your application, compare offers, prepare for visa, and keep your family aligned. All free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-base font-bold transition-colors shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
              >
                Find my programs
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/application-check"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl border border-white/25 text-white hover:bg-white/10 text-base font-bold transition-colors"
              >
                <FileText className="w-5 h-5" />
                Check my application
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="py-10 px-4 sm:px-6 border-t border-white/10 bg-navy">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Top row — brand + nav */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="36" height="36" rx="10" fill="url(#ftLg)"/>
                <ellipse cx="18" cy="18" rx="11" ry="6" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" fill="none" transform="rotate(-30 18 18)"/>
                <text x="18" y="23" textAnchor="middle" fill="white" fontFamily="system-ui,sans-serif" fontSize="16" fontWeight="800" letterSpacing="-1">e</text>
                <circle cx="26.5" cy="11.5" r="2" fill="white" fillOpacity="0.9"/>
                <defs>
                  <linearGradient id="ftLg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366F1"/><stop offset="1" stopColor="#A855F7"/>
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <span className="font-display font-bold text-white">eduvian<span className="text-blue-400">AI</span></span>
                <p className="text-xs text-gray-400 font-medium">Study abroad, made intelligent</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <a href="#how-it-works" className="hover:text-blue-400 transition-colors">How it works</a>
              <a href="#tools" className="hover:text-blue-400 transition-colors">Decision Making Tools</a>
              <a href="#practice" className="hover:text-blue-400 transition-colors">Practice Tools</a>
              <a href="#countries" className="hover:text-blue-400 transition-colors">Destinations</a>
              <a href="#scholarships" className="hover:text-blue-400 transition-colors">Scholarships</a>
              <a href="#outputs" className="hover:text-blue-400 transition-colors">Sample outputs</a>
              <a href="#why-different" className="hover:text-blue-400 transition-colors">Why EduvianAI</a>
              <button onClick={() => setAboutOpen(true)} className="hover:text-blue-400 transition-colors">About Us</button>
              <Link href="/get-started" className="hover:text-blue-400 font-medium transition-colors">Get started</Link>
            </div>
          </div>

          {/* Middle — short integrity disclaimer (legal pages offline pending counsel review) */}
          <div className="text-[11px] text-gray-500 leading-relaxed border-t border-white/5 pt-5 max-w-3xl mx-auto text-center">
            EduvianAI is a decision-support tool. AI-generated recommendations and tool outputs are estimates, not professional admissions, immigration, financial, or legal advice. University fees, deadlines, and eligibility may change &mdash; always confirm directly with the university before applying.
          </div>

          {/* Bottom — contact + copyright */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 border-t border-white/5 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <a href="mailto:support@eduvianai.com" className="hover:text-blue-400 transition-colors">Contact</a>
              <a href="mailto:grievance@eduvianai.com" className="hover:text-blue-400 transition-colors">Grievance Officer</a>
            </div>
            <div className="flex items-center gap-3">
              <p>© 2026 eduvianAI. All rights reserved.</p>
              <Link href="/admin" className="text-[10px] font-mono text-gray-500 hover:text-blue-400 transition-colors opacity-40 hover:opacity-100 select-none">
                admin
              </Link>
            </div>
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
                  <svg width="44" height="44" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="36" height="36" rx="10" fill="url(#abLg)"/>
                    <ellipse cx="18" cy="18" rx="11" ry="6" stroke="white" strokeWidth="1.2" strokeOpacity="0.4" fill="none" transform="rotate(-30 18 18)"/>
                    <text x="18" y="23" textAnchor="middle" fill="white" fontFamily="system-ui,sans-serif" fontSize="16" fontWeight="800" letterSpacing="-1">e</text>
                    <circle cx="26.5" cy="11.5" r="2" fill="white" fillOpacity="0.9"/>
                    <defs>
                      <linearGradient id="abLg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6366F1"/><stop offset="1" stopColor="#A855F7"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest">About</p>
                    <p className="text-xl font-extrabold text-white">eduvian<span className="text-indigo-300">AI</span></p>
                  </div>
                </div>
                <p className="text-base font-semibold text-white leading-relaxed mb-2">
                  Study abroad, made intelligent.
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">
                  eduvianAI is a <span className="text-indigo-300 font-semibold">100% AI-powered study-abroad platform</span> built for the next generation of global students. We believe every student deserves access to world-class guidance — not just those who can afford a counsellor. So we built one.
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-8 py-8 space-y-6">

              {/* Journey label */}
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">What we do</span>
                <div className="h-px flex-1 bg-gray-100" />
              </div>

              {/* Pillars */}
              {[
                {
                  icon: <Brain className="w-5 h-5 text-indigo-600" />,
                  bg: "bg-indigo-50 border-indigo-100",
                  iconBg: "bg-indigo-100",
                  badge: "Stage A · Match",
                  badgeColor: "text-indigo-500",
                  title: "100% Profile-Customised University Matching",
                  body: "AI scores " + DB_STATS.verifiedProgramsLabel + " programs against your exact profile. Get a personalised Top 20 shortlist — Safe, Reach & Ambitious — in under 2 minutes.",
                },
                {
                  icon: <FileText className="w-5 h-5 text-violet-600" />,
                  bg: "bg-violet-50 border-violet-100",
                  iconBg: "bg-violet-100",
                  badge: "Stage B · Check & Write",
                  badgeColor: "text-violet-500",
                  title: "AI SOP Writer + Application Story Check",
                  body: "AI writes a cliché-free SOP from your story, scores it across 7 dimensions, and flags credibility gaps in your full application — before you submit.",
                },
                {
                  icon: <Mic className="w-5 h-5 text-emerald-600" />,
                  bg: "bg-emerald-50 border-emerald-100",
                  iconBg: "bg-emerald-100",
                  badge: "Stage C · Practice",
                  badgeColor: "text-emerald-600",
                  title: "Practice: Interview Coach + English Test Lab",
                  body: "Mock visa interviews (AU 19Q · UK 14Q · US 60+Q) plus full-length IELTS, PTE, DET & TOEFL mocks — AI flags weak answers and scores your writing & speaking.",
                },
                {
                  icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
                  bg: "bg-purple-50 border-purple-100",
                  iconBg: "bg-purple-100",
                  badge: "Stage D · Decide",
                  badgeColor: "text-amber-600",
                  title: "ROI Calculator & Parent Decision Support Tool",
                  body: "ROI Calculator shows payback period & 10-year ROI. Parent Decision Tool gives a data-driven family verdict across 7 factors. Both free.",
                },
              ].map((item) => (
                <div key={item.title} className={`flex gap-4 p-5 rounded-2xl border ${item.bg}`}>
                  <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${item.badgeColor}`}>{item.badge}</p>
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
                  Find my best-fit programs — free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <HowItWorksModal open={videoOpen} onClose={() => setVideoOpen(false)} />

      <CountryModal
        countryName={selectedCountry}
        onClose={() => setSelectedCountry(null)}
      />

      <ChatWidget />
    </div>
  );
}

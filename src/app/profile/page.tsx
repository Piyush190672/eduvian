"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Globe2,
  User,
  BookOpen,
  FileText,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import StepPersonal from "@/components/form/StepPersonal";
import StepAcademic from "@/components/form/StepAcademic";
import StepTests from "@/components/form/StepTests";
import StepPreferences from "@/components/form/StepPreferences";
import Link from "next/link";
import NavButtons from "@/components/ui/NavButtons";

const STEPS = [
  { id: 1, label: "Personal", icon: User, desc: "About you" },
  { id: 2, label: "Academic", icon: BookOpen, desc: "Your education" },
  { id: 3, label: "Test Scores", icon: FileText, desc: "Proficiency & exams" },
  { id: 4, label: "Preferences", icon: Heart, desc: "Your dream plan" },
];

const defaultProfile: Partial<StudentProfile> = {
  passport_available: "yes",
  visa_history: "never_applied",
  family_abroad: false,
  family_income_inr: "10L_20L",
  degree_level: "postgraduate",
  academic_score_type: "percentage",
  academic_score: 75,
  backlogs: false,
  backlog_count: 0,
  academic_gap: false,
  work_experience_years: 0,
  research_papers: false,
  research_paper_count: 0,
  english_test: "ielts",
  country_preferences: [],
  target_intake_year: 2026,
  target_intake_semester: "fall",
  budget_range: "35k_50k",
};

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<StudentProfile>>(defaultProfile);
  const [submitting, setSubmitting] = useState(false);

  const updateProfile = (data: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
  };

  const next = () => {
    if (step < 4) setStep((s) => s + 1);
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submission failed");
      }

      const { token } = await res.json();
      toast.success("Profile submitted! Generating your shortlist...");
      router.push(`/results/${token}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
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
          <span className="text-sm text-gray-500">
            Step {step} of {STEPS.length}
          </span>
          <NavButtons backHref="/" />
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    s.id < step
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200"
                      : s.id === step
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white ring-4 ring-indigo-100 shadow-lg shadow-indigo-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <s.icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-xs font-medium ${
                    s.id <= step ? "text-indigo-600" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {STEPS[step - 1].label}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {STEPS[step - 1].desc}
              </p>
            </div>

            {step === 1 && (
              <StepPersonal profile={profile} onChange={updateProfile} />
            )}
            {step === 2 && (
              <StepAcademic profile={profile} onChange={updateProfile} />
            )}
            {step === 3 && (
              <StepTests profile={profile} onChange={updateProfile} />
            )}
            {step === 4 && (
              <StepPreferences profile={profile} onChange={updateProfile} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={back}
            disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating shortlist...
                </>
              ) : (
                <>
                  Get my shortlist
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

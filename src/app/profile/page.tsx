"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  User,
  BookOpen,
  FileText,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  Sparkles,
  Pencil,
} from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import StepPersonal from "@/components/form/StepPersonal";
import StepAcademic from "@/components/form/StepAcademic";
import StepTests from "@/components/form/StepTests";
import StepPreferences from "@/components/form/StepPreferences";
import StepReview from "@/components/form/StepReview";
import Link from "next/link";
import NavButtons from "@/components/ui/NavButtons";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import LogoutButton from "@/components/LogoutButton";
// SetPasswordCard moved to the homepage nav as ChangePasswordButton
// (13 May 2026) — change-password is now available from anywhere, not
// only the profile editor.

const STEPS = [
  { id: 1, label: "Personal", icon: User, desc: "About you" },
  { id: 2, label: "Academic", icon: BookOpen, desc: "Your education" },
  { id: 3, label: "Test Scores", icon: FileText, desc: "Proficiency & exams" },
  { id: 4, label: "Preferences", icon: Heart, desc: "Your dream plan" },
  { id: 5, label: "Review", icon: Sparkles, desc: "Confirm before we match" },
];

const defaultProfile: Partial<StudentProfile> = {
  passport_available: "yes",
  visa_history: "never_applied",
  family_abroad: false,
  family_income_inr: "12L_24L",
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
  qs_ranking_preference: "any",
  post_study_work_visa: false,
  canada_college_types: [],
  scholarship_seeking: false,
};

/**
 * Profile completion = (filled required across all 4 steps) / (total
 * required across all 4 steps). Mirrors validateStep's branches so the
 * % matches what the user actually has to fill to submit. Renders in
 * the stepper header as a small percentage so users see progress past
 * the simple step counter (especially helpful when they hit a tier
 * with extra branches — MBA, UG vs PG, English test).
 */
function computeProfileCompletion(profile: Partial<StudentProfile>): { pct: number; filled: number; total: number } {
  let filled = 0;
  let total = 0;
  const req = (ok: boolean) => { total += 1; if (ok) filled += 1; };

  // Step 1 — personal
  req(!!profile.full_name?.trim());
  req(!!profile.email?.trim());
  req(!!profile.phone?.trim());
  req(!!profile.nationality?.trim());
  req(!!profile.city?.trim());

  // Step 2 — academic
  req(!!profile.intended_field);
  if (profile.intended_field === "Others") {
    req(!!profile.intended_field_custom?.trim());
  }
  req(!!profile.current_degree?.trim());
  req(!!profile.institution_name?.trim());
  req(!!profile.graduation_year != null && profile.graduation_year !== 0);
  req(profile.academic_score !== undefined && !isNaN(profile.academic_score as number));
  if (profile.degree_level === "undergraduate") {
    const subjects = (profile.major_stream ?? "").split(",").map(s => s.trim()).filter(Boolean);
    req(subjects.length > 0);
  } else {
    req(!!profile.major_stream);
  }
  if (profile.intended_field === "MBA") {
    req(profile.mba_team_leading_experience !== undefined);
    if (profile.mba_team_leading_experience === true) {
      req(!!profile.mba_max_team_size && profile.mba_max_team_size > 0);
    }
  }

  // Step 3 — tests
  if (profile.english_test && profile.english_test !== "none") {
    req(profile.english_score_overall !== undefined && profile.english_score_overall !== null);
  }

  // Step 4 — preferences
  req(!!profile.country_preferences && profile.country_preferences.length > 0);
  req(!!profile.budget_range);

  const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
  return { pct, filled, total };
}

function validateStep(step: number, profile: Partial<StudentProfile>): string[] {
  const missing: string[] = [];

  if (step === 1) {
    if (!profile.full_name?.trim()) missing.push("Full Name");
    if (!profile.email?.trim()) missing.push("Email Address");
    if (!profile.phone?.trim()) missing.push("Phone");
    if (!profile.nationality?.trim()) missing.push("Nationality");
    if (!profile.city?.trim()) missing.push("Current City");
  }

  if (step === 2) {
    if (!profile.intended_field) missing.push("Intended Field of Study");
    if (profile.intended_field === "Others" && !profile.intended_field_custom?.trim()) {
      missing.push("Intended Field of Study (specify your stream)");
    }
    if (!profile.current_degree?.trim()) missing.push("Current / Completed Degree");
    if (!profile.institution_name?.trim()) missing.push("Institution Name");
    if (!profile.graduation_year) missing.push("Graduation Year");
    if (profile.academic_score === undefined || isNaN(profile.academic_score)) {
      missing.push("Academic Score");
    }
    // UG: at least 1 subject; PG: major stream selected
    if (profile.degree_level === "undergraduate") {
      const subjects = (profile.major_stream ?? "").split(",").map(s => s.trim()).filter(Boolean);
      if (subjects.length === 0) missing.push("At least one Subject");
    } else {
      if (!profile.major_stream) missing.push("Major / Stream");
    }
    // MBA-specific: leadership question is required, and if answered yes,
    // the team-size follow-up is required too. Only enforced when the user
    // picks MBA — non-MBA students don't see these fields.
    if (profile.intended_field === "MBA") {
      if (profile.mba_team_leading_experience === undefined) {
        missing.push("MBA: Team-leading experience answer");
      } else if (
        profile.mba_team_leading_experience === true &&
        (!profile.mba_max_team_size || profile.mba_max_team_size <= 0)
      ) {
        missing.push("MBA: Size of the largest team you led");
      }
    }
  }

  if (step === 3) {
    if (profile.english_test && profile.english_test !== "none") {
      if (!profile.english_score_overall && profile.english_score_overall !== 0) {
        missing.push("English Proficiency Score");
      }
    }
  }

  if (step === 4) {
    if (!profile.country_preferences || profile.country_preferences.length === 0) {
      missing.push("At least one Country Preference");
    }
    if (!profile.budget_range) missing.push("Annual Budget");
  }

  return missing;
}

function ProfilePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editToken = searchParams.get("token");

  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<Partial<StudentProfile>>(defaultProfile);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // If token present, load the full existing profile from the submission
  useEffect(() => {
    if (!editToken) return;
    (async () => {
      try {
        const res = await fetch(`/api/results/${editToken}`);
        if (!res.ok) return;
        const data = await res.json();
        const existingProfile = data?.submission?.profile as Partial<StudentProfile>;
        if (existingProfile) {
          setProfile({ ...defaultProfile, ...existingProfile });
          setIsEditing(true);
          if (existingProfile.full_name) {
            setStudentName(existingProfile.full_name.split(" ")[0]);
          }
        }
      } catch { /* ignore */ }
    })();
  }, [editToken]);

  // Pre-fill name, email, phone, nationality, city from saved student
  // session (only when not editing). Nationality + city were added to
  // the persisted shape 13 May 2026 — users were filling them on every
  // visit.
  useEffect(() => {
    if (editToken) return; // skip if editing existing submission
    try {
      const raw = localStorage.getItem("eduvian_student");
      if (raw) {
        const s = JSON.parse(raw) as { name?: string; email?: string; phone?: string; nationality?: string; city?: string };
        if (s.name || s.email || s.phone || s.nationality || s.city) {
          setProfile((prev) => ({
            ...prev,
            ...(s.name && !prev.full_name ? { full_name: s.name } : {}),
            ...(s.email && !prev.email ? { email: s.email } : {}),
            ...(s.phone && !prev.phone ? { phone: s.phone } : {}),
            ...(s.nationality && !prev.nationality ? { nationality: s.nationality } : {}),
            ...(s.city && !prev.city ? { city: s.city } : {}),
          }));
          if (s.name) setStudentName(s.name.split(" ")[0]);
        }
      }
    } catch { /* ignore */ }
  }, [editToken]);

  // Returning-user prefill: load BOTH the latest submission (preload) and
  // the in-progress draft (autosaved as the user types on any device) in
  // parallel, then merge. Draft wins over preload because it's the most
  // recent state; anything the user has already typed THIS session still
  // wins over both. Runs once on mount. (15 May 2026, user-reported —
  // cross-device sync.) Skipped while editing a specific submission by
  // token, since that path already loads the right row.
  //
  // `loadedRef` tracks whether the initial hydration has finished so the
  // autosave effect below doesn't push an empty form to the server before
  // the user has had a chance to type.
  const loadedRef = useRef(false);
  useEffect(() => {
    if (editToken) { loadedRef.current = true; return; }
    let cancelled = false;
    (async () => {
      try {
        const [preloadRes, draftRes] = await Promise.all([
          fetch("/api/profile-preload", { credentials: "include" }),
          fetch("/api/profile-draft", { credentials: "include" }),
        ]);
        const preloadJson = preloadRes.ok ? await preloadRes.json() : null;
        const draftJson   = draftRes.ok   ? await draftRes.json()   : null;
        const preload: Partial<StudentProfile> | null = preloadJson?.profile ?? null;
        const draft:   Partial<StudentProfile> | null = draftJson?.profile   ?? null;
        if (cancelled) return;
        if (!preload && !draft) return;
        setProfile((prev) => {
          // Priority (lowest → highest): preload → draft → prev (this
          // session). Each step only fills empty slots in the running
          // merge; non-empty wins keep their value.
          const merged: StudentProfile = { ...(preload as StudentProfile) };
          const isEmpty = (v: unknown) =>
            v === undefined ||
            v === null ||
            (typeof v === "string" && v.trim() === "") ||
            (Array.isArray(v) && v.length === 0);
          if (draft) {
            for (const k of Object.keys(draft) as (keyof StudentProfile)[]) {
              if (!isEmpty(draft[k])) {
                (merged as Record<keyof StudentProfile, unknown>)[k] = draft[k];
              }
            }
          }
          for (const k of Object.keys(prev) as (keyof StudentProfile)[]) {
            if (!isEmpty(prev[k])) {
              (merged as Record<keyof StudentProfile, unknown>)[k] = prev[k];
            }
          }
          return merged;
        });
      } catch { /* ignore */ }
      finally { loadedRef.current = true; }
    })();
    return () => { cancelled = true; };
  }, [editToken]);

  // Autosave draft to the server, debounced. The user's in-progress form
  // state syncs across devices that share the same eduvianai_user session.
  // PUT /api/profile-draft is rate-limited (60 / 10 min / IP), so the
  // 1500 ms debounce comfortably stays under that ceiling even with rapid
  // typing.
  useEffect(() => {
    if (editToken) return;             // edit-by-token has its own path
    if (!loadedRef.current) return;    // wait until initial hydration done
    const handle = setTimeout(() => {
      fetch("/api/profile-draft", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ profile }),
      }).catch(() => { /* ignore — anon traffic gets 401, that's fine */ });
    }, 1500);
    return () => clearTimeout(handle);
  }, [profile, editToken]);

  const updateProfile = (data: Partial<StudentProfile>) => {
    setProfile((prev) => ({ ...prev, ...data }));
    if (errors.length > 0) setErrors([]);
  };

  // Scroll the window back to the top whenever the active step changes.
  // Without this, submitting a step that has errors-then-success leaves
  // the user scrolled mid-page on the next step's form.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [step]);

  const next = () => {
    const missing = validateStep(step, profile);
    if (missing.length > 0) {
      setErrors(missing);
      // Bring validation errors into view at the top of the form.
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setErrors([]);
    if (step < STEPS.length) setStep((s) => s + 1);
  };

  const back = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const missing = validateStep(4, profile);
    if (missing.length > 0) {
      setErrors(missing);
      return;
    }
    setErrors([]);
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

      // Persist nationality + city back into the user's local session so
      // they auto-populate next time. Name / email / phone were already
      // saved at register-time; this adds the geo fields the form
      // requires but that the auth flow never asked for.
      try {
        const raw = localStorage.getItem("eduvian_student");
        const prev = raw ? JSON.parse(raw) : {};
        localStorage.setItem("eduvian_student", JSON.stringify({
          ...prev,
          ...(profile.nationality ? { nationality: profile.nationality } : {}),
          ...(profile.city        ? { city: profile.city }               : {}),
        }));
      } catch { /* ignore */ }

      // Clear the autosaved draft — the freshly submitted profile is now
      // the source of truth, so an old draft shouldn't shadow it on the
      // next visit. Fire-and-forget; failure is non-fatal.
      fetch("/api/profile-draft", { method: "DELETE", credentials: "include" }).catch(() => {});

      toast.success("Profile submitted! Generating your shortlist...");
      router.push(`/profile-evaluation/${token}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;
  const completion = computeProfileCompletion(profile);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass border-b border-white/30">
        <Link href="/" className="flex items-center gap-2">
          <EduvianLogoMark size={32} />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Step {step} of {STEPS.length}
          </span>
          <LogoutButton variant="compact" />
          <Link
            href="/account/security"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            title="Manage how you sign in — add a password for faster login"
          >
            <ShieldCheck className="w-4 h-4" />
            Security
          </Link>
          <NavButtons backHref="/" />
        </div>
      </nav>

      <div className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
        {/* Editing mode banner */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-amber-50 border border-amber-200"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm text-amber-800 font-medium">
              ✏️ Editing your profile — your previous answers are pre-filled. Change what you need and resubmit to get an updated shortlist.
            </p>
          </motion.div>
        )}

        {/* Welcome back banner */}
        {studentName && !isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-indigo-50 border border-indigo-100"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm text-indigo-700 font-medium">
              👋 Hey <span className="font-bold">{studentName}</span>! Your name, email & phone are pre-filled below.
            </p>
          </motion.div>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          {/* Profile completion %, counted across all required fields in
              every step (mirrors validateStep branches). Helps users see
              how close they are to a complete profile beyond just the
              4-step counter. */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Profile completion</span>
            <span className="text-xs font-bold text-indigo-600">
              {completion.pct}%
              <span className="ml-1 font-normal text-gray-400">({completion.filled}/{completion.total} fields)</span>
            </span>
          </div>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8"
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
            {step === 5 && (
              <StepReview profile={profile} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Validation errors */}
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200"
          >
            <p className="text-sm font-semibold text-rose-700 mb-1.5">
              Please fill in the following required fields:
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              {errors.map((e) => (
                <li key={e} className="text-sm text-rose-600">{e}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6 gap-3">
          {step === 5 ? (
            // Review step: "Modify the information above" (jumps to
            // step 1 so the user can walk through every field) + the
            // final "Continue to generate shortlist" submit.
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
            >
              <Pencil className="w-4 h-4" />
              Modify the information above
            </button>
          ) : (
            <button
              onClick={back}
              disabled={step === 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : step === 4 ? (
            <button
              onClick={next}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all hover:-translate-y-0.5"
            >
              Continue to Review
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
                  {isEditing ? "Recalculating..." : "Generating shortlist..."}
                </>
              ) : (
                <>
                  {isEditing ? "Update & Recalculate" : "Continue to generate shortlist"}
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

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    }>
      <ProfilePageInner />
    </Suspense>
  );
}

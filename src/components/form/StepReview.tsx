"use client";

import type { StudentProfile } from "@/lib/types";
import { intendedFieldLabel, TARGET_COUNTRIES } from "@/lib/types";
import {
  scoreStudentProfile,
  getCategoryStyle,
  CATEGORY_LADDER,
  type ProfileCategory,
} from "@/lib/profile-score";
import { Star } from "lucide-react";

interface Props {
  profile: Partial<StudentProfile>;
}

const COUNTRY_LABELS: Record<string, string> = Object.fromEntries(
  TARGET_COUNTRIES.map((c) => [c.code, c.name]),
);

const INCOME_LABELS: Record<string, string> = {
  under_5L: "Under ₹5 Lakh",
  "5L_10L": "₹5 – 10 Lakh",
  "10L_20L": "₹10 – 20 Lakh",
  "20L_40L": "₹20 – 40 Lakh",
  above_40L: "Above ₹40 Lakh",
};

const BUDGET_LABELS: Record<string, string> = {
  under_20k: "Under $20k/yr",
  "20k_35k": "$20k – $35k/yr",
  "35k_50k": "$35k – $50k/yr",
  "50k_70k": "$50k – $70k/yr",
  above_70k: "Above $70k/yr",
};

const QS_LABELS: Record<string, string> = {
  any: "Any rank",
  top_50: "Top 50",
  top_100: "Top 100",
  top_200: "Top 200",
  top_500: "Top 500",
};

const PASSPORT_LABELS: Record<string, string> = {
  yes: "Have passport",
  in_progress: "In progress",
  no: "Don't have one",
};

const VISA_LABELS: Record<string, string> = {
  never_applied: "First timer",
  approved_before: "Visa approved before",
  rejected_before: "Visa rejected before",
};

const SCORE_TYPE_LABELS: Record<string, string> = {
  percentage: "Percentage (%)",
  gpa: "GPA (4.0)",
  ib: "IB Points (/45)",
  igcse: "IGCSE / A-Level",
};

const dash = "—";

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === "") return dash;
  return String(v);
}

function bool(v: boolean | undefined): string {
  if (v === undefined) return dash;
  return v ? "Yes" : "No";
}

function Section({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">{title}</h3>
      </div>
      <dl className="divide-y divide-gray-100">
        {items.map((it) => (
          <div key={it.label} className="grid grid-cols-5 gap-3 px-4 py-2.5">
            <dt className="col-span-2 text-xs font-medium text-gray-500">{it.label}</dt>
            <dd className="col-span-3 text-sm text-gray-900 break-words">{it.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function StepReview({ profile }: Props) {
  // Profile-rating preview — same scoring function the results page uses
  // so what the user sees here matches what they'll see post-shortlist.
  // Falls back gracefully if required fields are missing.
  let rating: ReturnType<typeof scoreStudentProfile> | null = null;
  try {
    rating = scoreStudentProfile(profile as StudentProfile);
  } catch {
    rating = null;
  }
  const style = rating ? getCategoryStyle(rating.category as ProfileCategory) : null;
  const ladderIdx = rating ? CATEGORY_LADDER.indexOf(rating.category as ProfileCategory) : -1;

  const personal: { label: string; value: string }[] = [
    { label: "Full Name", value: val(profile.full_name) },
    { label: "Email", value: val(profile.email) },
    { label: "Phone", value: val(profile.phone) },
    { label: "Citizenship", value: val(profile.nationality) },
    { label: "Current City", value: val(profile.city) },
    { label: "Passport", value: profile.passport_available ? (PASSPORT_LABELS[profile.passport_available] ?? profile.passport_available) : dash },
    { label: "Visa History", value: profile.visa_history ? (VISA_LABELS[profile.visa_history] ?? profile.visa_history) : dash },
    { label: "Family Studied Abroad", value: bool(profile.family_abroad) },
    { label: "Annual Family Income", value: profile.family_income_inr ? (INCOME_LABELS[profile.family_income_inr] ?? profile.family_income_inr) : dash },
  ];

  const fieldDisplay = intendedFieldLabel({
    intended_field: profile.intended_field,
    intended_field_custom: profile.intended_field_custom,
  } as StudentProfile);
  const extraFields = (profile.intended_field_extra ?? []).filter(Boolean);
  const fieldText = extraFields.length > 0
    ? `${fieldDisplay} (+ ${extraFields.join(", ")})`
    : fieldDisplay;

  const academic: { label: string; value: string }[] = [
    { label: "Applying For", value: profile.degree_level === "undergraduate" ? "Undergraduate" : profile.degree_level === "postgraduate" ? "Postgraduate" : dash },
    { label: "Intended Field", value: fieldText || dash },
    { label: "Researched Universities?", value: bool(profile.universities_researched) },
    { label: "Current / Completed Degree", value: val(profile.current_degree) },
    { label: "Major / Subjects", value: val(profile.major_stream) },
    { label: "Institution", value: val(profile.institution_name) },
    { label: "Graduation Year", value: val(profile.graduation_year) },
    { label: "Academic Score", value: profile.academic_score !== undefined ? `${profile.academic_score} ${profile.academic_score_type ? `(${SCORE_TYPE_LABELS[profile.academic_score_type] ?? profile.academic_score_type})` : ""}` : dash },
    { label: "Backlogs", value: profile.backlogs ? `Yes (${profile.backlog_count ?? 0})` : profile.backlogs === false ? "No" : dash },
    { label: "Academic Gap", value: bool(profile.academic_gap) },
  ];
  if (profile.degree_level === "postgraduate") {
    academic.push({ label: "Work Experience", value: profile.work_experience_years !== undefined ? `${profile.work_experience_years} yr${(profile.work_experience_years ?? 0) === 1 ? "" : "s"}${profile.work_experience_domain ? ` — ${profile.work_experience_domain}` : ""}` : dash });
    if (profile.intended_field === "MBA") {
      academic.push({ label: "MBA — Led a team?", value: bool(profile.mba_team_leading_experience) });
      if (profile.mba_team_leading_experience) {
        academic.push({ label: "MBA — Largest team", value: val(profile.mba_max_team_size) });
      }
    }
  }
  academic.push({ label: "Research Papers", value: profile.research_papers ? `Yes (${profile.research_paper_count ?? 0})` : profile.research_papers === false ? "No" : dash });

  const tests: { label: string; value: string }[] = [];
  if (profile.english_test && profile.english_test !== "none") {
    tests.push({ label: "English Test", value: `${profile.english_test.toUpperCase()} — ${val(profile.english_score_overall)}` });
  } else {
    tests.push({ label: "English Test", value: profile.english_test === "none" ? "Not taken" : dash });
  }
  if (profile.std_test_pg && profile.std_test_pg !== "none" && profile.std_test_pg_score !== undefined) {
    tests.push({ label: profile.std_test_pg.toUpperCase(), value: String(profile.std_test_pg_score) });
  }
  if (profile.std_test_ug && profile.std_test_ug !== "none" && profile.std_test_ug_score !== undefined) {
    tests.push({ label: profile.std_test_ug.toUpperCase(), value: String(profile.std_test_ug_score) });
  }

  const prefs: { label: string; value: string }[] = [
    { label: "Country Preferences", value: (profile.country_preferences ?? []).map((c) => COUNTRY_LABELS[c] ?? c).join(", ") || dash },
    { label: "Target Intake", value: profile.target_intake_year && profile.target_intake_semester ? `${profile.target_intake_semester[0].toUpperCase() + profile.target_intake_semester.slice(1)} ${profile.target_intake_year}` : dash },
    { label: "Annual Budget", value: profile.budget_range ? (BUDGET_LABELS[profile.budget_range] ?? profile.budget_range) : dash },
    { label: "QS Ranking Preference", value: profile.qs_ranking_preference ? (QS_LABELS[profile.qs_ranking_preference] ?? profile.qs_ranking_preference) : dash },
    { label: "Post-Study Work Visa", value: bool(profile.post_study_work_visa) },
    { label: "Scholarship Seeking", value: bool(profile.scholarship_seeking) },
  ];
  if (profile.country_preferences?.includes("CA") && profile.canada_college_types?.length) {
    prefs.push({ label: "Canada College Types", value: profile.canada_college_types.join(", ") });
  }

  return (
    <div className="space-y-5">
      {/* Profile-rating preview — mirrors the rating shown on the
          /results page. Lets the user see where their profile stands
          before generating the shortlist. */}
      {rating && style && (
        <div className={`rounded-2xl border-2 ${style.border} ${style.bg} px-5 py-4`}>
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Your Profile Rating</p>
              <p className={`text-lg font-extrabold ${style.text}`}>{rating.category}</p>
              <p className="text-xs text-gray-500 mt-0.5">Score {rating.score}/100</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < (5 - ladderIdx) ? `${style.text} fill-current` : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600 leading-relaxed">
        Review every detail below. If anything looks wrong, click <span className="font-semibold text-gray-900">Modify the information above</span> to go back and edit. Otherwise click <span className="font-semibold text-gray-900">Continue to generate shortlist</span>.
      </p>

      <Section title="Personal" items={personal} />
      <Section title="Academic" items={academic} />
      {tests.length > 0 && <Section title="Test Scores" items={tests} />}
      <Section title="Preferences" items={prefs} />
    </div>
  );
}

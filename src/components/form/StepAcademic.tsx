"use client";

import { useState } from "react";
import type { StudentProfile, DegreeLevel } from "@/lib/types";
import { FIELDS_OF_STUDY, OTHER_FIELD_SENTINEL } from "@/lib/types";
import { getFieldAlignmentError } from "@/lib/field-prereq";

interface Props {
  profile: Partial<StudentProfile>;
  onChange: (data: Partial<StudentProfile>) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    {children}
  </label>
);

const Input = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all placeholder:text-gray-400"
  />
);

const Select = ({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...props}
    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all bg-white"
  >
    {children}
  </select>
);

const RadioGroup = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string | undefined;
  onChange: (v: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
          value === o.value
            ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

// Current / Completed degree options, split by application level.
// "Other (specify)" reveals a free-text input so any uncommon credential
// (e.g. integrated dual degrees, foreign boards) is still captureable
// and legacy free-text values from older drafts keep rendering.
const DEGREE_OPTIONS_UG: string[] = [
  "CBSE Class 12",
  "ICSE / ISC Class 12",
  "State Board Class 12",
  "IB Diploma",
  "IGCSE / A-Levels",
  "American High School Diploma",
  "GED",
];

const DEGREE_OPTIONS_PG: string[] = [
  "B.Tech / B.E.",
  "B.Sc",
  "B.A.",
  "B.Com",
  "B.B.A.",
  "B.C.A.",
  "B.Arch",
  "B.Des",
  "B.Ed",
  "MBBS",
  "BDS",
  "B.Pharm",
  "LLB (3-year)",
  "BA LLB (5-year Integrated)",
  "Integrated M.Tech / M.Sc",
  "M.Tech / M.E.",
  "M.Sc",
  "M.A.",
  "M.Com",
  "MBA",
  "PhD",
];

const DEGREE_OTHER_SENTINEL = "__other__";

// PG: degree streams
const PG_STREAMS = [
  "Engineering (B.Tech/BE)", "Computer Science", "Business Administration (BBA)",
  "Economics", "Mathematics", "Medicine (MBBS)", "Architecture", "Law",
  "Design", "Sciences", "Commerce", "Arts/Humanities", "Other",
];

// UG: individual high-school subjects (CBSE / ICSE / IB / IGCSE / A-Level)
const HS_SUBJECTS: { category: string; subjects: string[] }[] = [
  {
    category: "Mathematics",
    subjects: [
      "Mathematics", "Applied Mathematics", "Further Mathematics", "Statistics",
    ],
  },
  {
    category: "Sciences",
    subjects: [
      "Physics", "Chemistry", "Biology",
      "Computer Science", "Informatics Practices",
      "Biotechnology", "Environmental Science",
    ],
  },
  {
    category: "Commerce & Economics",
    subjects: [
      "Economics", "Business Studies", "Business Management",
      "Accountancy", "Entrepreneurship", "Legal Studies",
    ],
  },
  {
    category: "Humanities & Social Sciences",
    subjects: [
      "History", "Geography", "Political Science", "Global Politics",
      "Sociology", "Psychology", "Philosophy",
    ],
  },
  {
    category: "Languages",
    subjects: [
      "English Language", "English Literature",
      "Hindi", "Sanskrit", "French", "Spanish", "German",
    ],
  },
  {
    category: "Arts, Design & Others",
    subjects: [
      "Fine Arts", "Art & Design", "Music", "Theatre / Drama", "Dance",
      "Film Studies", "Physical Education", "Design Technology",
      "Engineering Graphics", "Home Science", "Media Studies",
    ],
  },
];

export default function StepAcademic({ profile, onChange }: Props) {
  const isGrad = profile.degree_level === "postgraduate";

  // Tracks "user intentionally picked Other" so the free-text input
  // stays open after the select is set to the sentinel (the canonical
  // current_degree value is empty at that point).
  const [degreeOtherMode, setDegreeOtherMode] = useState(false);

  // For UG: subjects stored comma-separated in major_stream
  const selectedSubjects = !isGrad
    ? (profile.major_stream ?? "").split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleSubject = (subject: string) => {
    const current = selectedSubjects;
    const isSelected = current.includes(subject);
    if (!isSelected && current.length >= 5) return;
    const updated = isSelected
      ? current.filter((s) => s !== subject)
      : [...current, subject];
    onChange({ major_stream: updated.join(", ") });
  };

  // Field-of-study × current-qualification alignment warning. Same
  // helper feeds validateStep so the user can't click Continue while
  // the warning is visible. Empty string → no warning rendered.
  const alignmentError = (field: string | undefined) => getFieldAlignmentError(profile, field);
  const Warning = ({ message }: { message: string }) => (
    <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs leading-relaxed text-rose-700">
      <span className="font-semibold">⚠ {message}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <Label>I am applying for *</Label>
        <RadioGroup
          options={[
            { value: "undergraduate", label: "🎓 Undergraduate (UG)" },
            { value: "postgraduate", label: "📚 Postgraduate (PG/Masters/PhD)" },
          ]}
          value={profile.degree_level}
          onChange={(v) => onChange({ degree_level: v as DegreeLevel })}
        />
      </div>

      <div>
        <Label>Intended Field of Study *</Label>
        <Select
          value={profile.intended_field ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            // Clear the custom free-text when the user moves away from "Others".
            onChange(
              v === OTHER_FIELD_SENTINEL
                ? { intended_field: v }
                : { intended_field: v, intended_field_custom: "" }
            );
          }}
        >
          <option value="">Select your field</option>
          {FIELDS_OF_STUDY.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
          <option value={OTHER_FIELD_SENTINEL}>Others (specify below)</option>
        </Select>
        {(() => { const m = alignmentError(profile.intended_field); return m ? <Warning message={m} /> : null; })()}
        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
          You can pick up to <span className="font-semibold text-gray-700">3 fields</span> — we&apos;ll surface programs matching all of them.
        </p>

        {/* Up to TWO additional fields. The matcher unions them with the
            primary intended_field. Only shown when the primary isn't
            "Others" (the custom-field branch already handles cross-field
            search via substring matching). */}
        {profile.intended_field && profile.intended_field !== OTHER_FIELD_SENTINEL && (
          <div className="mt-2.5 space-y-2">
            {(profile.intended_field_extra ?? []).map((extra, idx) => {
              const picked = new Set<string>(
                [
                  profile.intended_field,
                  ...(profile.intended_field_extra ?? []).filter((_, i) => i !== idx),
                ].filter((f): f is string => typeof f === "string" && f.length > 0),
              );
              const extraErr = alignmentError(extra);
              return (
                <div key={idx}>
                  <div className="flex items-center gap-2">
                    <Select
                      value={extra}
                      onChange={(e) => {
                        const next = [...(profile.intended_field_extra ?? [])];
                        next[idx] = e.target.value;
                        onChange({ intended_field_extra: next });
                      }}
                    >
                      <option value="">Select another field</option>
                      {FIELDS_OF_STUDY.filter((f) => !picked.has(f) || f === extra).map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={() => {
                        const next = (profile.intended_field_extra ?? []).filter((_, i) => i !== idx);
                        onChange({ intended_field_extra: next });
                      }}
                      aria-label="Remove this field"
                      className="px-2 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  {extraErr && <Warning message={extraErr} />}
                </div>
              );
            })}
            {(profile.intended_field_extra ?? []).length < 2 && (
              <button
                type="button"
                onClick={() => onChange({
                  intended_field_extra: [...(profile.intended_field_extra ?? []), ""],
                })}
                className="text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors"
              >
                + Add another field
              </button>
            )}
          </div>
        )}

        {profile.intended_field === OTHER_FIELD_SENTINEL && (
          <div className="mt-2.5">
            <Input
              placeholder="e.g. Aerospace Engineering, Animation, Pharmacology"
              value={profile.intended_field_custom ?? ""}
              onChange={(e) => onChange({ intended_field_custom: e.target.value })}
              maxLength={80}
            />
            <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
              Enter the stream you want to study. We&apos;ll match programs whose
              field or course name contains this term — keep it specific (one or
              two words works best).
            </p>
          </div>
        )}

        {/* BPS GBC accreditation — UK Psychology Masters (Health, Clinical,
            Counselling, Forensic, etc.) require an undergraduate degree that
            meets the BPS Graduate Basis for Chartered Membership. Shown only
            for Psychology + postgraduate. */}
        {profile.intended_field === "Psychology" && profile.degree_level === "postgraduate" && (
          <div className="mt-3 rounded-xl bg-violet-50 border border-violet-200 p-3.5">
            <Label>Is your current degree program BPS accredited? *</Label>
            <p className="text-xs text-gray-600 leading-relaxed mb-2.5">
              Many UK Psychology Masters (Health, Clinical, Counselling, Forensic,
              Educational, Occupational, Sport, Neuro) require the BPS Graduate Basis
              for Chartered Membership. If your bachelor&apos;s isn&apos;t BPS-accredited,
              we&apos;ll only show programs that don&apos;t need it (e.g. Conversion MSc,
              generic MSc Psychology, non-UK programs).
            </p>
            <div className="flex gap-2">
              {[
                { v: true,  label: "Yes" },
                { v: false, label: "No" },
              ].map(({ v, label }) => {
                const active = profile.bps_accredited === v;
                return (
                  <button
                    key={String(v)}
                    type="button"
                    onClick={() => onChange({ bps_accredited: v })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                      active
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-violet-300"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label>Have you already researched some universities?</Label>
        <div className="flex gap-2">
          {[
            { v: true,  label: "Yes" },
            { v: false, label: "No" },
          ].map(({ v, label }) => {
            const active = profile.universities_researched === v;
            return (
              <button
                key={String(v)}
                type="button"
                onClick={() => onChange({ universities_researched: v })}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors border ${
                  active
                    ? "bg-violet-600 text-white border-violet-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-violet-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Current / Completed Degree *</Label>
        {(() => {
          const options = isGrad ? DEGREE_OPTIONS_PG : DEGREE_OPTIONS_UG;
          const current = profile.current_degree ?? "";
          // Match canonical option (case-insensitive) so legacy entries
          // like "b.tech" still highlight the right pick; everything
          // else routes through the "Other (specify)" branch.
          const matched = options.find(
            (o) => o.toLowerCase() === current.trim().toLowerCase(),
          );
          const isLegacyOther = current.length > 0 && !matched;
          const showOther = degreeOtherMode || isLegacyOther;
          const selectValue = matched ? matched : showOther ? DEGREE_OTHER_SENTINEL : "";
          return (
            <>
              <Select
                value={selectValue}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === DEGREE_OTHER_SENTINEL) {
                    setDegreeOtherMode(true);
                    onChange({ current_degree: "" });
                  } else {
                    setDegreeOtherMode(false);
                    onChange({ current_degree: v });
                  }
                }}
              >
                <option value="">Select degree</option>
                {options.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
                <option value={DEGREE_OTHER_SENTINEL}>Other (specify below)</option>
              </Select>
              {showOther && (
                <div className="mt-2.5">
                  <Input
                    placeholder={isGrad ? "e.g. Integrated B.Tech-M.Tech Mechatronics" : "e.g. Cambridge Pre-U"}
                    value={current}
                    onChange={(e) => onChange({ current_degree: e.target.value })}
                    maxLength={80}
                  />
                </div>
              )}
            </>
          );
        })()}
      </div>

      {isGrad ? (
        <div>
          <Label>Major / Stream *</Label>
          <Select
            value={profile.major_stream ?? ""}
            onChange={(e) => onChange({ major_stream: e.target.value })}
          >
            <option value="">Select stream</option>
            {/* Aligned with the Intended Field of Study dropdown above —
                same taxonomy lets the prereq gate compare like-for-like
                (e.g. CS & IT undergrad → AI PG passes cleanly). */}
            {FIELDS_OF_STUDY.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            <option value="Other">Other</option>
          </Select>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Subjects *
            </label>
            <span className={`text-xs font-medium ${selectedSubjects.length >= 5 ? "text-amber-500" : "text-gray-400"}`}>
              {selectedSubjects.length}/5 selected
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            Select up to 5 subjects you are currently studying (CBSE / ICSE / IB / IGCSE)
          </p>
          <div className="space-y-4">
            {HS_SUBJECTS.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                  {group.category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.subjects.map((subject) => {
                    const isSelected = selectedSubjects.includes(subject);
                    const isDisabled = !isSelected && selectedSubjects.length >= 5;
                    return (
                      <button
                        key={subject}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleSubject(subject)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                            : isDisabled
                            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                        }`}
                      >
                        {subject}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {selectedSubjects.length === 0 && (
            <p className="text-xs text-amber-600 mt-2">Please select at least one subject</p>
          )}
        </div>
      )}

      <div>
        <Label>Institution Name *</Label>
        <Input
          placeholder="IIT Bombay / Delhi Public School"
          value={profile.institution_name ?? ""}
          onChange={(e) => onChange({ institution_name: e.target.value })}
        />
      </div>

      <div>
        <Label>Graduation Year *</Label>
        <Select
          value={profile.graduation_year ?? ""}
          onChange={(e) =>
            onChange({ graduation_year: parseInt(e.target.value) })
          }
        >
          <option value="">Select year</option>
          {(() => {
            // PG candidates can be several years post-graduation (work
            // experience, second masters, etc.) — extend the back-window
            // to cur-10 for PG so the dropdown covers older graduates.
            // UG stays at cur-6 (most UG applicants graduated in the
            // last 1-3 years). Both keep a +2 forward buffer for
            // students still in their final year(s).
            const cur = new Date().getFullYear();
            const yearsBack = isGrad ? 10 : 6;
            const yearsForward = 2;
            const total = yearsBack + yearsForward + 1;
            return Array.from({ length: total }, (_, i) => cur - yearsBack + i);
          })().map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Academic Score Type</Label>
        <RadioGroup
          options={[
            { value: "percentage", label: "Percentage (%)" },
            { value: "gpa", label: "GPA (4.0)" },
            ...(!isGrad ? [
              { value: "ib", label: "IB Points (/45)" },
              { value: "igcse", label: "IGCSE / A-Level" },
            ] : []),
          ]}
          value={profile.academic_score_type}
          onChange={(v) =>
            onChange({ academic_score_type: v as "percentage" | "gpa" | "ib" | "igcse", academic_score: undefined as unknown as number })
          }
        />
      </div>

      <div>
        <Label>
          {profile.academic_score_type === "gpa"
            ? "GPA (out of 4.0)"
            : profile.academic_score_type === "ib"
            ? "IB Points (out of 45)"
            : profile.academic_score_type === "igcse"
            ? "IGCSE / A-Level Grade"
            : "Percentage / Score (%)"}
          *
        </Label>
        {profile.academic_score_type === "igcse" ? (
          <Select
            value={profile.academic_score ?? ""}
            onChange={(e) => onChange({ academic_score: parseFloat(e.target.value) })}
          >
            <option value="">Select your grade</option>
            <option value="95">A* (Distinction / Outstanding)</option>
            <option value="85">A (Excellent)</option>
            <option value="75">B (Good)</option>
            <option value="65">C (Satisfactory)</option>
            <option value="55">D (Limited)</option>
            <option value="45">E (Very Limited)</option>
          </Select>
        ) : (
          <Input
            type="number"
            step={profile.academic_score_type === "gpa" ? "0.01" : profile.academic_score_type === "ib" ? "1" : "0.1"}
            min={0}
            max={profile.academic_score_type === "gpa" ? 4.0 : profile.academic_score_type === "ib" ? 45 : 100}
            placeholder={
              profile.academic_score_type === "gpa" ? "3.5" :
              profile.academic_score_type === "ib" ? "36" :
              "78"
            }
            value={profile.academic_score ?? ""}
            onChange={(e) =>
              onChange({ academic_score: parseFloat(e.target.value) })
            }
          />
        )}
        {profile.academic_score_type === "ib" && (
          <p className="text-xs text-gray-400 mt-1.5">IB Diploma total: max 45 points (6 subjects × 7 pts + 3 bonus)</p>
        )}
      </div>

      <div>
        <Label>Backlogs / Arrears?</Label>
        <RadioGroup
          options={[
            { value: "false", label: "No backlogs" },
            { value: "true", label: "Yes, I have backlogs" },
          ]}
          value={profile.backlogs !== undefined ? String(profile.backlogs) : undefined}
          onChange={(v) => {
            onChange({ backlogs: v === "true", backlog_count: v === "false" ? 0 : profile.backlog_count });
          }}
        />
        {profile.backlogs && (
          <div className="mt-3">
            <Label>Number of backlogs</Label>
            <Input
              type="number"
              min={1}
              max={20}
              placeholder="2"
              value={profile.backlog_count ?? ""}
              onChange={(e) =>
                onChange({ backlog_count: parseInt(e.target.value) })
              }
            />
          </div>
        )}
      </div>

      <div>
        <Label>Academic gap year?</Label>
        <RadioGroup
          options={[
            { value: "false", label: "No gap" },
            { value: "true", label: "Yes" },
          ]}
          value={profile.academic_gap !== undefined ? String(profile.academic_gap) : undefined}
          onChange={(v) => onChange({ academic_gap: v === "true" })}
        />
      </div>

      {/* Grad-only fields */}
      {isGrad && (
        <>
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-indigo-500 font-medium mb-4 uppercase tracking-wide">
              Postgraduate extras
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Work Experience (years)</Label>
              {/* Swapped from a number input to a Select (13 May 2026).
                  Two issues fixed:
                  - defaultProfile.work_experience_years === 0 was stuck
                    in the input because `value={n ?? ""}` only coalesces
                    null/undefined, not 0 — users couldn't clear it.
                  - On mobile the number-input chevrons that desktop
                    Chrome renders don't show, so users had no visible
                    way to dial values. A dropdown surfaces the
                    affordance identically on both. */}
              <Select
                value={
                  profile.work_experience_years === undefined || profile.work_experience_years === null
                    ? ""
                    : String(profile.work_experience_years)
                }
                onChange={(e) =>
                  onChange({
                    work_experience_years: e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                  })
                }
              >
                <option value="">Select years</option>
                <option value="0">0 (no work experience)</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n} {n === 1 ? "year" : "years"}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Work Domain</Label>
              <Input
                placeholder="Software Engineering"
                value={profile.work_experience_domain ?? ""}
                onChange={(e) =>
                  onChange({ work_experience_domain: e.target.value })
                }
              />
            </div>
          </div>

          {/* MBA-specific questions. Top MBAs explicitly weight leadership
              experience and team size — surfacing those answers lets the
              matcher prefer programs that match the user's profile. Shown
              only when intended_field is MBA. */}
          {profile.intended_field === "MBA" && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 px-4 py-4 space-y-4">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide">MBA-specific</p>
              <div>
                <Label>Do you have experience of leading teams? *</Label>
                <RadioGroup
                  options={[
                    { value: "true",  label: "Yes" },
                    { value: "false", label: "No" },
                  ]}
                  value={
                    profile.mba_team_leading_experience !== undefined
                      ? String(profile.mba_team_leading_experience)
                      : undefined
                  }
                  onChange={(v) =>
                    onChange({
                      mba_team_leading_experience: v === "true",
                      // Clear team size if they switch back to "No".
                      ...(v === "false" ? { mba_max_team_size: 0 } : {}),
                    })
                  }
                />
              </div>
              {profile.mba_team_leading_experience && (
                <div>
                  <Label>What was the size of the largest team you led? *</Label>
                  <Input
                    type="number"
                    min={1}
                    max={500}
                    placeholder="e.g. 6"
                    value={profile.mba_max_team_size ?? ""}
                    onChange={(e) =>
                      onChange({ mba_max_team_size: parseInt(e.target.value) || 0 })
                    }
                  />
                  <p className="text-[11px] text-gray-500 mt-1">Headcount you had direct managerial / project-lead responsibility for. Top MBAs weight this.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Research papers — collected for BOTH UG and PG (14 May 2026).
          UG applicants increasingly have undergraduate research experience
          and the signal is now wired into WEIGHTS_UG with the same 5%
          weight as PG. */}
      <div>
        <Label>Research papers published?</Label>
        <RadioGroup
          options={[
            { value: "false", label: "No" },
            { value: "true", label: "Yes" },
          ]}
          value={
            profile.research_papers !== undefined
              ? String(profile.research_papers)
              : undefined
          }
          onChange={(v) =>
            onChange({ research_papers: v === "true" })
          }
        />
        {profile.research_papers && (
          <div className="mt-3">
            <Label>Number of papers</Label>
            <Input
              type="number"
              min={1}
              max={50}
              placeholder="1"
              value={profile.research_paper_count ?? ""}
              onChange={(e) =>
                onChange({ research_paper_count: parseInt(e.target.value) })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

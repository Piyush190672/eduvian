"use client";

import type { StudentProfile, DegreeLevel } from "@/lib/types";
import { FIELDS_OF_STUDY } from "@/lib/types";

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
          onChange={(e) => onChange({ intended_field: e.target.value })}
        >
          <option value="">Select your field</option>
          {FIELDS_OF_STUDY.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </Select>
      </div>

      <div>
        <Label>Current / Completed Degree *</Label>
        <Input
          placeholder={isGrad ? "B.Tech Computer Science" : "12th Grade / A-Levels"}
          value={profile.current_degree ?? ""}
          onChange={(e) => onChange({ current_degree: e.target.value })}
        />
      </div>

      {isGrad ? (
        <div>
          <Label>Major / Stream *</Label>
          <Select
            value={profile.major_stream ?? ""}
            onChange={(e) => onChange({ major_stream: e.target.value })}
          >
            <option value="">Select stream</option>
            {PG_STREAMS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
          {Array.from({ length: 8 }, (_, i) => 2019 + i).map((y) => (
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
              <Input
                type="number"
                min={0}
                max={30}
                placeholder="2"
                value={profile.work_experience_years ?? ""}
                onChange={(e) =>
                  onChange({ work_experience_years: parseInt(e.target.value) || 0 })
                }
              />
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
        </>
      )}
    </div>
  );
}

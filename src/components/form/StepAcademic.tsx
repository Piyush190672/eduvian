"use client";

import type { StudentProfile, DegreeLevel } from "@/lib/types";

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

const STREAMS = [
  "Science (PCM)", "Science (PCB)", "Commerce", "Arts/Humanities",
  "Engineering (B.Tech/BE)", "Computer Science", "Business Administration (BBA)",
  "Economics", "Mathematics", "Medicine (MBBS)", "Architecture", "Law",
  "Design", "Other",
];

export default function StepAcademic({ profile, onChange }: Props) {
  const isGrad = profile.degree_level === "postgraduate";

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Current / Completed Degree *</Label>
          <Input
            placeholder={isGrad ? "B.Tech Computer Science" : "12th Grade / A-Levels"}
            value={profile.current_degree ?? ""}
            onChange={(e) => onChange({ current_degree: e.target.value })}
          />
        </div>
        <div>
          <Label>Major / Stream *</Label>
          <Select
            value={profile.major_stream ?? ""}
            onChange={(e) => onChange({ major_stream: e.target.value })}
          >
            <option value="">Select stream</option>
            {STREAMS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Institution Name *</Label>
        <Input
          placeholder="IIT Bombay / Delhi Public School"
          value={profile.institution_name ?? ""}
          onChange={(e) => onChange({ institution_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              { value: "gpa", label: "GPA (4.0 scale)" },
            ]}
            value={profile.academic_score_type}
            onChange={(v) =>
              onChange({ academic_score_type: v as "percentage" | "gpa" })
            }
          />
        </div>
      </div>

      <div>
        <Label>
          {profile.academic_score_type === "gpa"
            ? "GPA (out of 4.0)"
            : "Percentage / Score (%)"}
          *
        </Label>
        <Input
          type="number"
          step={profile.academic_score_type === "gpa" ? "0.01" : "0.1"}
          min={0}
          max={profile.academic_score_type === "gpa" ? 4.0 : 100}
          placeholder={profile.academic_score_type === "gpa" ? "3.5" : "78"}
          value={profile.academic_score ?? ""}
          onChange={(e) =>
            onChange({ academic_score: parseFloat(e.target.value) })
          }
        />
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

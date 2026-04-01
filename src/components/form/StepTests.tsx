"use client";

import type { StudentProfile, EnglishTest } from "@/lib/types";

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

const ENGLISH_CONFIG: Record<
  string,
  {
    label: string;
    overall: { label: string; min: number; max: number; step: number; placeholder: string };
    sections: { key: string; label: string; min: number; max: number; step: number }[];
  }
> = {
  ielts: {
    label: "IELTS",
    overall: { label: "Overall Band Score", min: 0, max: 9, step: 0.5, placeholder: "7.0" },
    sections: [
      { key: "listening", label: "Listening", min: 0, max: 9, step: 0.5 },
      { key: "reading", label: "Reading", min: 0, max: 9, step: 0.5 },
      { key: "writing", label: "Writing", min: 0, max: 9, step: 0.5 },
      { key: "speaking", label: "Speaking", min: 0, max: 9, step: 0.5 },
    ],
  },
  toefl: {
    label: "TOEFL iBT",
    overall: { label: "Total Score", min: 0, max: 120, step: 1, placeholder: "95" },
    sections: [
      { key: "listening", label: "Listening", min: 0, max: 30, step: 1 },
      { key: "reading", label: "Reading", min: 0, max: 30, step: 1 },
      { key: "writing", label: "Writing", min: 0, max: 30, step: 1 },
      { key: "speaking", label: "Speaking", min: 0, max: 30, step: 1 },
    ],
  },
  pte: {
    label: "PTE Academic",
    overall: { label: "Overall Score", min: 10, max: 90, step: 1, placeholder: "65" },
    sections: [
      { key: "listening", label: "Listening", min: 10, max: 90, step: 1 },
      { key: "reading", label: "Reading", min: 10, max: 90, step: 1 },
      { key: "writing", label: "Writing", min: 10, max: 90, step: 1 },
      { key: "speaking", label: "Speaking", min: 10, max: 90, step: 1 },
    ],
  },
  duolingo: {
    label: "Duolingo English Test",
    overall: { label: "Overall Score", min: 10, max: 160, step: 5, placeholder: "115" },
    sections: [],
  },
};

export default function StepTests({ profile, onChange }: Props) {
  const isGrad = profile.degree_level === "postgraduate";
  const englishTest = profile.english_test ?? "none";
  const config = englishTest !== "none" ? ENGLISH_CONFIG[englishTest] : null;

  return (
    <div className="space-y-6">
      {/* English test */}
      <div>
        <Label>English Proficiency Test *</Label>
        <RadioGroup
          options={[
            { value: "ielts", label: "IELTS" },
            { value: "toefl", label: "TOEFL" },
            { value: "pte", label: "PTE" },
            { value: "duolingo", label: "Duolingo" },
            { value: "none", label: "Not appeared yet" },
          ]}
          value={englishTest}
          onChange={(v) =>
            onChange({
              english_test: v as EnglishTest,
              english_score_overall: undefined,
              english_score_listening: undefined,
              english_score_reading: undefined,
              english_score_writing: undefined,
              english_score_speaking: undefined,
            })
          }
        />
      </div>

      {config && (
        <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div>
            <Label>{config.overall.label}</Label>
            <Input
              type="number"
              step={config.overall.step}
              min={config.overall.min}
              max={config.overall.max}
              placeholder={config.overall.placeholder}
              value={profile.english_score_overall ?? ""}
              onChange={(e) =>
                onChange({ english_score_overall: parseFloat(e.target.value) })
              }
            />
          </div>

          {config.sections.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-3 font-medium">
                Section Scores (optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                {config.sections.map((s) => (
                  <div key={s.key}>
                    <Label>{s.label}</Label>
                    <Input
                      type="number"
                      step={s.step}
                      min={s.min}
                      max={s.max}
                      placeholder={String(s.min)}
                      value={
                        profile[
                          `english_score_${s.key}` as keyof StudentProfile
                        ] as number ?? ""
                      }
                      onChange={(e) =>
                        onChange({
                          [`english_score_${s.key}`]: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {englishTest === "none" && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
          💡 Many universities require English proficiency scores. We&apos;ll still
          show you eligible programs, but your match score may be lower.
        </div>
      )}

      {/* Standardized test — UG */}
      {!isGrad && (
        <div className="pt-2">
          <Label>Standardized Test (UG)</Label>
          <RadioGroup
            options={[
              { value: "sat", label: "SAT" },
              { value: "act", label: "ACT" },
              { value: "none", label: "Not appeared" },
            ]}
            value={profile.std_test_ug ?? "none"}
            onChange={(v) =>
              onChange({
                std_test_ug: v as StudentProfile["std_test_ug"],
                std_test_ug_score: undefined,
              })
            }
          />
          {profile.std_test_ug && profile.std_test_ug !== "none" && (
            <div className="mt-3">
              <Label>
                {profile.std_test_ug === "sat"
                  ? "SAT Score (400–1600)"
                  : "ACT Composite (1–36)"}
              </Label>
              <Input
                type="number"
                min={profile.std_test_ug === "sat" ? 400 : 1}
                max={profile.std_test_ug === "sat" ? 1600 : 36}
                placeholder={profile.std_test_ug === "sat" ? "1350" : "28"}
                value={profile.std_test_ug_score ?? ""}
                onChange={(e) =>
                  onChange({ std_test_ug_score: parseInt(e.target.value) })
                }
              />
            </div>
          )}
        </div>
      )}

      {/* Standardized test — PG */}
      {isGrad && (
        <div className="pt-2">
          <Label>Standardized Test (PG)</Label>
          <RadioGroup
            options={[
              { value: "gre", label: "GRE" },
              { value: "gmat", label: "GMAT" },
              { value: "none", label: "Not appeared" },
            ]}
            value={profile.std_test_pg ?? "none"}
            onChange={(v) =>
              onChange({
                std_test_pg: v as StudentProfile["std_test_pg"],
                std_test_pg_score: undefined,
              })
            }
          />
          {profile.std_test_pg && profile.std_test_pg !== "none" && (
            <div className="mt-3">
              <Label>
                {profile.std_test_pg === "gre"
                  ? "GRE Score (260–340)"
                  : "GMAT Score (200–800)"}
              </Label>
              <Input
                type="number"
                min={profile.std_test_pg === "gre" ? 260 : 200}
                max={profile.std_test_pg === "gre" ? 340 : 800}
                placeholder={profile.std_test_pg === "gre" ? "315" : "650"}
                value={profile.std_test_pg_score ?? ""}
                onChange={(e) =>
                  onChange({ std_test_pg_score: parseInt(e.target.value) })
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

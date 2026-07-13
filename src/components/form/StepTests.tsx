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
    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-all placeholder:text-gray-400"
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
            ? "bg-blue-800 text-white border-blue-800 shadow-sm"
            : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-900"
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

// Medical admission tests — real score ranges per test (14 Jul 2026):
// UCAT cognitive total 1200-3600 (SJT band excluded), MCAT 472-528,
// GAMSAT overall 0-100, HPAT-Ireland 0-300, NEET 0-720.
const MED_TEST_CONFIG: Record<
  string,
  { label: string; min: number; max: number; step: number; placeholder: string }
> = {
  ucat:   { label: "UCAT total (1200–3600)", min: 1200, max: 3600, step: 10, placeholder: "2800" },
  mcat:   { label: "MCAT total (472–528)",   min: 472,  max: 528,  step: 1,  placeholder: "510" },
  gamsat: { label: "GAMSAT overall (0–100)", min: 0,    max: 100,  step: 1,  placeholder: "65" },
  hpat:   { label: "HPAT total (0–300)",     min: 0,    max: 300,  step: 1,  placeholder: "170" },
  neet:   { label: "NEET score (0–720)",     min: 0,    max: 720,  step: 1,  placeholder: "550" },
  other:  { label: "Score",                  min: 0,    max: 3600, step: 1,  placeholder: "" },
};

export default function StepTests({ profile, onChange }: Props) {
  const isGrad = profile.degree_level === "postgraduate";
  const englishTest = profile.english_test ?? "none";
  const config = englishTest !== "none" ? ENGLISH_CONFIG[englishTest] : null;
  // Medicine picked as the primary intended field OR as one of the extras.
  const pickedFields = [profile.intended_field, ...(profile.intended_field_extra ?? [])];
  const isMedicine = pickedFields.includes("Medicine")
    || pickedFields.includes("Medicine & Public Health"); // legacy drafts

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
        <div className="space-y-4 p-5 rounded-2xl bg-blue-50/50 border border-blue-100">
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

      {/* Medical admission test — shown when any picked intended field is
          "Medicine" (14 Jul 2026; legacy drafts may carry the pre-split
          "Medicine & Public Health"). Informational only: the
          program DB carries no per-program med-test cutoffs, so this is
          collected + surfaced, never scored. */}
      {isMedicine && (
        <div className="pt-2">
          <Label>Medical Admission Test</Label>
          <p className="text-xs text-gray-500 mb-2 leading-relaxed">
            Many medicine programs require an admission test — e.g. UCAT for
            UK, Australia and NZ undergraduate medicine; MCAT for US and
            Canadian MD programs; GAMSAT for graduate-entry medicine in the
            UK, Australia and Ireland. Indian students planning to practise
            in India later typically also need a NEET qualification.
          </p>
          <RadioGroup
            options={[
              { value: "ucat", label: "UCAT" },
              { value: "mcat", label: "MCAT" },
              { value: "gamsat", label: "GAMSAT" },
              { value: "hpat", label: "HPAT" },
              { value: "neet", label: "NEET" },
              { value: "other", label: "Other" },
              { value: "none", label: "Not appeared yet" },
            ]}
            value={profile.med_test ?? "none"}
            onChange={(v) =>
              onChange({
                med_test: v as StudentProfile["med_test"],
                med_test_score: undefined,
                med_test_other_name: undefined,
              })
            }
          />
          {profile.med_test === "other" && (
            <div className="mt-3">
              <Label>Test name</Label>
              <Input
                type="text"
                maxLength={80}
                placeholder="e.g. ISAT"
                value={profile.med_test_other_name ?? ""}
                onChange={(e) => onChange({ med_test_other_name: e.target.value })}
              />
            </div>
          )}
          {profile.med_test && profile.med_test !== "none" && (
            <div className="mt-3">
              <Label>
                {MED_TEST_CONFIG[profile.med_test]?.label ?? "Score"}
              </Label>
              <Input
                type="number"
                min={MED_TEST_CONFIG[profile.med_test]?.min ?? 0}
                max={MED_TEST_CONFIG[profile.med_test]?.max ?? 10000}
                step={MED_TEST_CONFIG[profile.med_test]?.step ?? 1}
                placeholder={MED_TEST_CONFIG[profile.med_test]?.placeholder ?? ""}
                value={profile.med_test_score ?? ""}
                onChange={(e) => {
                  const n = parseFloat(e.target.value);
                  onChange({ med_test_score: Number.isFinite(n) ? n : undefined });
                }}
              />
            </div>
          )}
          {profile.med_test === "none" && (
            <div className="mt-3 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-700">
              💡 Check each shortlisted program&apos;s admission-test
              requirement early — UCAT and MCAT test dates fill up months
              before application deadlines.
            </div>
          )}
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
                std_test_pg_verbal: undefined,
                std_test_pg_quant: undefined,
                std_test_pg_awa: undefined,
                std_test_pg_data_insights: undefined,
              })
            }
          />
          {profile.std_test_pg === "gre" && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <Label>Total GRE score (260–340)</Label>
                <Input
                  type="number"
                  min={260}
                  max={340}
                  placeholder="320"
                  value={profile.std_test_pg_score ?? ""}
                  onChange={(e) =>
                    onChange({ std_test_pg_score: parseInt(e.target.value) })
                  }
                />
                <p className="mt-1 text-[11px] text-gray-500">
                  Enter Total directly, or fill Verbal + Quant below and we&apos;ll compute it.
                </p>
              </div>
              <div>
                <Label>Verbal (130–170)</Label>
                <Input
                  type="number"
                  min={130}
                  max={170}
                  placeholder="158"
                  value={profile.std_test_pg_verbal ?? ""}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    const q = profile.std_test_pg_quant ?? 0;
                    onChange({
                      std_test_pg_verbal: v,
                      std_test_pg_score: Number.isFinite(v) && q ? v + q : undefined,
                    });
                  }}
                />
              </div>
              <div>
                <Label>Quant (130–170)</Label>
                <Input
                  type="number"
                  min={130}
                  max={170}
                  placeholder="162"
                  value={profile.std_test_pg_quant ?? ""}
                  onChange={(e) => {
                    const q = parseInt(e.target.value);
                    const v = profile.std_test_pg_verbal ?? 0;
                    onChange({
                      std_test_pg_quant: q,
                      std_test_pg_score: Number.isFinite(q) && v ? v + q : undefined,
                    });
                  }}
                />
              </div>
              <div>
                <Label>AWA (0–6)</Label>
                <Input
                  type="number"
                  step={0.5}
                  min={0}
                  max={6}
                  placeholder="4.0"
                  value={profile.std_test_pg_awa ?? ""}
                  onChange={(e) =>
                    onChange({ std_test_pg_awa: parseFloat(e.target.value) })
                  }
                />
              </div>
              {profile.std_test_pg_score ? (
                <p className="text-[11px] text-gray-500 sm:col-span-3">
                  Composite (V+Q): <span className="font-semibold text-gray-700">{profile.std_test_pg_score}/340</span>
                </p>
              ) : null}
            </div>
          )}
          {profile.std_test_pg === "gmat" && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <Label>Total (205–805)</Label>
                <Input
                  type="number"
                  min={205}
                  max={805}
                  step={10}
                  placeholder="645"
                  value={profile.std_test_pg_score ?? ""}
                  onChange={(e) =>
                    onChange({ std_test_pg_score: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Verbal (60–90)</Label>
                <Input
                  type="number"
                  min={60}
                  max={90}
                  placeholder="82"
                  value={profile.std_test_pg_verbal ?? ""}
                  onChange={(e) =>
                    onChange({ std_test_pg_verbal: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Quant (60–90)</Label>
                <Input
                  type="number"
                  min={60}
                  max={90}
                  placeholder="84"
                  value={profile.std_test_pg_quant ?? ""}
                  onChange={(e) =>
                    onChange({ std_test_pg_quant: parseInt(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Data Insights (60–90)</Label>
                <Input
                  type="number"
                  min={60}
                  max={90}
                  placeholder="80"
                  value={profile.std_test_pg_data_insights ?? ""}
                  onChange={(e) =>
                    onChange({ std_test_pg_data_insights: parseInt(e.target.value) })
                  }
                />
              </div>
              <p className="text-[11px] text-gray-500 sm:col-span-4">
                GMAT Focus Edition (post-Nov 2023). For old-format scores, enter the Total only; sub-scores can be left blank.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

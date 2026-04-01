"use client";

import { TARGET_COUNTRIES, FIELDS_OF_STUDY } from "@/lib/types";
import type { StudentProfile, BudgetRange } from "@/lib/types";
import { X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  profile: Partial<StudentProfile>;
  onChange: (data: Partial<StudentProfile>) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    {children}
  </label>
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

const BUDGET_OPTIONS: { value: BudgetRange; label: string; sub: string }[] = [
  { value: "under_20k", label: "Under $20,000/yr", sub: "Budget-friendly options" },
  { value: "20k_35k", label: "$20,000 – $35,000/yr", sub: "Mid-range programs" },
  { value: "35k_50k", label: "$35,000 – $50,000/yr", sub: "Popular range" },
  { value: "50k_70k", label: "$50,000 – $70,000/yr", sub: "Premium programs" },
  { value: "above_70k", label: "$70,000+/yr", sub: "Top-tier universities" },
];

export default function StepPreferences({ profile, onChange }: Props) {
  const preferences = profile.country_preferences ?? [];

  const addCountry = (code: string) => {
    if (preferences.includes(code) || preferences.length >= 10) return;
    onChange({ country_preferences: [...preferences, code] });
  };

  const removeCountry = (code: string) => {
    onChange({
      country_preferences: preferences.filter((c) => c !== code),
    });
  };

  const moveCountry = (index: number, direction: "up" | "down") => {
    const newPrefs = [...preferences];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newPrefs.length) return;
    [newPrefs[index], newPrefs[swapIndex]] = [newPrefs[swapIndex], newPrefs[index]];
    onChange({ country_preferences: newPrefs });
  };

  const availableCountries = TARGET_COUNTRIES.filter(
    (c) => !preferences.includes(c.code)
  );

  return (
    <div className="space-y-6">
      {/* Country preferences */}
      <div>
        <Label>Country Preferences (ranked, up to 10) *</Label>
        <p className="text-xs text-gray-400 mb-3">
          Rank 1 = top preference. Add countries in order of preference.
        </p>

        {/* Selected countries */}
        {preferences.length > 0 && (
          <div className="space-y-2 mb-3">
            {preferences.map((code, idx) => {
              const country = TARGET_COUNTRIES.find((c) => c.code === code);
              if (!country) return null;
              return (
                <div
                  key={code}
                  className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-100"
                >
                  <GripVertical className="w-4 h-4 text-indigo-300" />
                  <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-lg">{country.flag}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {country.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveCountry(idx, "up")}
                      disabled={idx === 0}
                      className="p-1 rounded-lg hover:bg-indigo-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCountry(idx, "down")}
                      disabled={idx === preferences.length - 1}
                      className="p-1 rounded-lg hover:bg-indigo-100 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCountry(code)}
                      className="p-1 rounded-lg hover:bg-rose-100 transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add more countries */}
        {availableCountries.length > 0 && preferences.length < 10 && (
          <div className="flex flex-wrap gap-2">
            {availableCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => addCountry(c.code)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
              >
                <span>{c.flag}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {preferences.length === 0 && (
          <p className="text-sm text-amber-600 mt-2">
            Please add at least one country
          </p>
        )}
      </div>

      {/* Target intake */}
      <div>
        <Label>Target Intake *</Label>
        <div className="grid grid-cols-2 gap-3">
          <Select
            value={profile.target_intake_semester ?? "fall"}
            onChange={(e) =>
              onChange({
                target_intake_semester: e.target.value as StudentProfile["target_intake_semester"],
              })
            }
          >
            <option value="fall">Fall (Sep/Oct)</option>
            <option value="spring">Spring (Jan/Feb)</option>
            <option value="summer">Summer (May/Jun)</option>
            <option value="winter">Winter (Nov/Dec)</option>
          </Select>
          <Select
            value={profile.target_intake_year ?? 2026}
            onChange={(e) =>
              onChange({ target_intake_year: parseInt(e.target.value) })
            }
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </div>
      </div>

      {/* Budget */}
      <div>
        <Label>Annual Budget (Tuition + Living) *</Label>
        <p className="text-xs text-gray-400 mb-3">
          Total annual cost including tuition fees and living expenses
        </p>
        <div className="space-y-2">
          {BUDGET_OPTIONS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange({ budget_range: b.value })}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
                profile.budget_range === b.value
                  ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                  : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
              }`}
            >
              <div>
                <span className="text-sm font-semibold">{b.label}</span>
                <span className="text-xs text-gray-400 ml-2">{b.sub}</span>
              </div>
              {profile.budget_range === b.value && (
                <span className="text-indigo-500 text-lg">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Intended field */}
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
    </div>
  );
}

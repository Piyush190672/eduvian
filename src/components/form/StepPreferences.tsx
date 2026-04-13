"use client";

import { TARGET_COUNTRIES, COUNTRY_REGIONS } from "@/lib/types";
import type { StudentProfile, BudgetRange } from "@/lib/types";
import { X, GripVertical, ChevronUp, ChevronDown, MapPin } from "lucide-react";

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
  const regionPrefs = profile.country_region_preferences ?? {};

  const addCountry = (code: string) => {
    if (preferences.includes(code) || preferences.length >= 10) return;
    onChange({ country_preferences: [...preferences, code] });
  };

  const removeCountry = (code: string) => {
    const newRegionPrefs = { ...regionPrefs };
    delete newRegionPrefs[code];
    onChange({
      country_preferences: preferences.filter((c) => c !== code),
      country_region_preferences: newRegionPrefs,
    });
  };

  const toggleRegion = (countryCode: string, regionCode: string) => {
    const current = regionPrefs[countryCode] ?? [];
    // "entire" clears all specific selections
    if (regionCode === "entire") {
      onChange({ country_region_preferences: { ...regionPrefs, [countryCode]: [] } });
      return;
    }
    const next = current.includes(regionCode)
      ? current.filter((r) => r !== regionCode)
      : [...current.filter((r) => r !== "entire"), regionCode];
    onChange({ country_region_preferences: { ...regionPrefs, [countryCode]: next } });
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

        {/* Selected countries with region sub-selection */}
        {preferences.length > 0 && (
          <div className="space-y-3 mb-3">
            {preferences.map((code, idx) => {
              const country = TARGET_COUNTRIES.find((c) => c.code === code);
              if (!country) return null;
              const regions = COUNTRY_REGIONS[code] ?? [];
              const selectedRegions = regionPrefs[code] ?? [];
              const isEntire = selectedRegions.length === 0;

              return (
                <div key={code} className="rounded-xl border border-indigo-100 bg-indigo-50 overflow-hidden">
                  {/* Country row */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <GripVertical className="w-4 h-4 text-indigo-300" />
                    <span className="w-6 h-6 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-lg">{country.flag}</span>
                    <span className="flex-1 text-sm font-medium text-gray-800">{country.name}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveCountry(idx, "up")} disabled={idx === 0}
                        className="p-1 rounded-lg hover:bg-indigo-100 disabled:opacity-30 transition-colors">
                        <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
                      </button>
                      <button type="button" onClick={() => moveCountry(idx, "down")} disabled={idx === preferences.length - 1}
                        className="p-1 rounded-lg hover:bg-indigo-100 disabled:opacity-30 transition-colors">
                        <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
                      </button>
                      <button type="button" onClick={() => removeCountry(code)}
                        className="p-1 rounded-lg hover:bg-rose-100 transition-colors ml-1">
                        <X className="w-3.5 h-3.5 text-rose-400" />
                      </button>
                    </div>
                  </div>

                  {/* Region chips — only shown if regions exist for this country */}
                  {regions.length > 1 && (
                    <div className="px-3 pb-3 border-t border-indigo-100 pt-2">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 text-indigo-400" />
                        <span className="text-xs text-indigo-500 font-medium">Preferred region (optional)</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {/* "Anywhere" chip */}
                        <button
                          type="button"
                          onClick={() => toggleRegion(code, "entire")}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                            isEntire
                              ? "bg-indigo-500 text-white border-indigo-500"
                              : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                          }`}
                        >
                          Anywhere in {["UK","UAE","USA"].includes(country.name) ? `the ${country.name}` : country.name}
                        </button>
                        {/* Specific region chips (skip "entire" from COUNTRY_REGIONS) */}
                        {regions.filter(r => r.code !== "entire").map((region) => {
                          const active = selectedRegions.includes(region.code);
                          return (
                            <button
                              key={region.code}
                              type="button"
                              onClick={() => toggleRegion(code, region.code)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${
                                active
                                  ? "bg-indigo-500 text-white border-indigo-500"
                                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                              }`}
                            >
                              {region.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

      {/* ─── Canada College Programs (shown only when Canada is selected) ─── */}
      {preferences.includes("CA") && (
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            Canada — Program Types
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Canada also offers college programs alongside university degrees. Select any additional program types you want to see.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["diploma", "pg_diploma"] as const).map((type) => {
              const selected = (profile.canada_college_types ?? []).includes(type);
              const label = type === "diploma" ? "Diploma" : "PG Diploma";
              const sub = type === "diploma" ? "2-yr college diploma (UG level)" : "1-yr postgrad certificate";
              const toggle = () => {
                const current = profile.canada_college_types ?? [];
                const updated = selected ? current.filter((t) => t !== type) : [...current, type];
                onChange({ canada_college_types: updated });
              };
              return (
                <button
                  key={type}
                  type="button"
                  onClick={toggle}
                  className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selected
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-gray-200 hover:border-red-200 hover:bg-red-50/50"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${selected ? "bg-red-500 border-red-500 text-white" : "border-gray-300"}`}>
                      {selected ? "✓" : ""}
                    </span>
                    🍁 {label}
                  </span>
                  <span className="text-xs text-gray-400 ml-6">{sub}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Hard Filters ─────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Hard Filters — applied before matching
        </p>

        {/* QS ranking preference */}
        <div className="mb-5">
          <Label>Minimum University Ranking (QS World)</Label>
          <p className="text-xs text-gray-400 mb-3">
            Only show programs from universities within this QS ranking band. Select &ldquo;No preference&rdquo; to see all universities including unranked colleges.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {([
              { value: "any",     label: "No preference",   sub: "All universities" },
              { value: "top_500", label: "QS Top 500",      sub: "Broad range" },
              { value: "top_200", label: "QS Top 200",      sub: "Well-ranked" },
              { value: "top_100", label: "QS Top 100",      sub: "Highly ranked" },
              { value: "top_50",  label: "QS Top 50",       sub: "Elite only" },
            ] as { value: StudentProfile["qs_ranking_preference"]; label: string; sub: string }[]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ qs_ranking_preference: opt.value })}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                  (profile.qs_ranking_preference ?? "any") === opt.value
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Post-study work visa */}
        <div className="mb-5">
          <Label>Post-Study Work Visa</Label>
          <p className="text-xs text-gray-400 mb-3">
            Filter to countries with strong post-study work visa pathways (UK, Australia, Canada, USA, Germany, Ireland, New Zealand).
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "No preference", sub: "Show all countries" },
              { value: true,  label: "Required",      sub: "PSW countries only" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onChange({ post_study_work_visa: opt.value })}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                  (profile.post_study_work_visa ?? false) === opt.value
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scholarship */}
        <div>
          <Label>Scholarship Preference</Label>
          <p className="text-xs text-gray-400 mb-3">
            Boost programs with higher scholarship availability in your match scoring.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: false, label: "Not a priority", sub: "Standard scoring" },
              { value: true,  label: "Yes, looking for scholarships", sub: "Scholarship signal boosted" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => onChange({ scholarship_seeking: opt.value })}
                className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                  (profile.scholarship_seeking ?? false) === opt.value
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                    : "bg-white border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                }`}
              >
                <span className="text-sm font-semibold">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}


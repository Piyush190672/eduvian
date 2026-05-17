"use client";

import { useEffect, useMemo } from "react";
import type { StudentProfile, FamilyIncomeINR, VisaHistory } from "@/lib/types";
import { COUNTRIES, INDIA, findCountryByName, splitPhone, joinPhone } from "@/lib/countries";

interface Props {
  profile: Partial<StudentProfile>;
  onChange: (data: Partial<StudentProfile>) => void;
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-sm font-medium text-gray-700 mb-1.5">
    {children}
  </label>
);

const Input = ({
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
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

export default function StepPersonal({ profile, onChange }: Props) {
  // Country auto-aligns dial code: when the user picks a citizenship,
  // the phone country-code prefix follows — unless they've explicitly
  // typed a different prefix already. The split is best-effort.
  const citizenship = findCountryByName(profile.nationality) ?? INDIA;

  // Auto-write the resolved default nationality once if the parent's
  // prefill loop didn't set one. Keeps validation passing without
  // forcing the user to interact with the select for the India default.
  // localStorage / API preload writes happen earlier and win.
  useEffect(() => {
    if (!profile.nationality) {
      onChange({ nationality: INDIA.name });
    }
    // Intentionally fires only when nationality is still unset.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.nationality]);
  const phoneParts = useMemo(
    () => splitPhone(profile.phone, citizenship.dialCode),
    [profile.phone, citizenship.dialCode],
  );

  const handleCitizenshipChange = (countryName: string) => {
    const country = COUNTRIES.find((c) => c.name === countryName) ?? INDIA;
    // Re-align the phone's dial code to the new citizenship.
    const newPhone = joinPhone(country.dialCode, phoneParts.number);
    onChange({ nationality: country.name, phone: newPhone });
  };

  const handleDialChange = (dialCode: string) => {
    onChange({ phone: joinPhone(dialCode, phoneParts.number) });
  };

  const handleNumberChange = (raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    onChange({ phone: joinPhone(phoneParts.dialCode, digits) });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Full Name *</Label>
          <Input
            placeholder="Arjun Mehta"
            value={profile.full_name ?? ""}
            onChange={(e) => onChange({ full_name: e.target.value })}
          />
        </div>
        <div>
          <Label>Email Address *</Label>
          <Input
            type="email"
            placeholder="arjun@email.com"
            value={profile.email ?? ""}
            onChange={(e) => onChange({ email: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Citizenship / Country *</Label>
          <Select
            value={citizenship.name}
            onChange={(e) => handleCitizenshipChange(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Phone *</Label>
          <div className="flex gap-2">
            <select
              value={phoneParts.dialCode}
              onChange={(e) => handleDialChange(e.target.value)}
              aria-label="Country code"
              className="w-28 shrink-0 px-2 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all bg-white"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.dialCode}>
                  {c.code} +{c.dialCode}
                </option>
              ))}
            </select>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phoneParts.number}
              onChange={(e) => handleNumberChange(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      <div>
        <Label>Current City *</Label>
        <Input
          placeholder="Mumbai"
          value={profile.city ?? ""}
          onChange={(e) => onChange({ city: e.target.value })}
        />
      </div>

      <div>
        <Label>Passport Status</Label>
        <RadioGroup
          options={[
            { value: "yes", label: "✅ Have passport" },
            { value: "in_progress", label: "⏳ In progress" },
            { value: "no", label: "❌ Don't have one" },
          ]}
          value={profile.passport_available}
          onChange={(v) =>
            onChange({ passport_available: v as StudentProfile["passport_available"] })
          }
        />
      </div>

      <div>
        <Label>Visa History</Label>
        <RadioGroup
          options={[
            { value: "never_applied", label: "First timer" },
            { value: "approved_before", label: "Visa approved before" },
            { value: "rejected_before", label: "Visa rejected before" },
          ]}
          value={profile.visa_history}
          onChange={(v) => onChange({ visa_history: v as VisaHistory })}
        />
      </div>

      <div>
        <Label>Family member studied/studying abroad?</Label>
        <RadioGroup
          options={[
            { value: "true", label: "Yes" },
            { value: "false", label: "No" },
          ]}
          value={profile.family_abroad !== undefined ? String(profile.family_abroad) : undefined}
          onChange={(v) => onChange({ family_abroad: v === "true" })}
        />
      </div>

      <div>
        <Label>Annual Family Income (INR)</Label>
        <Select
          value={profile.family_income_inr ?? ""}
          onChange={(e) =>
            onChange({ family_income_inr: e.target.value as FamilyIncomeINR })
          }
        >
          <option value="">Select range</option>
          <option value="under_12L">Under ₹12 Lakh / year</option>
          <option value="12L_24L">₹13 – 24 Lakh / year</option>
          <option value="25L_49L">₹25 – 49 Lakh / year</option>
          <option value="above_50L">₹50 Lakh and above / year</option>
        </Select>
      </div>
    </div>
  );
}

"use client";

import type { StudentProfile, FamilyIncomeINR, VisaHistory } from "@/lib/types";

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
          <Label>Phone / WhatsApp *</Label>
          <Input
            placeholder="+91 98765 43210"
            value={profile.phone ?? ""}
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </div>
        <div>
          <Label>Nationality *</Label>
          <Input
            placeholder="Indian"
            value={profile.nationality ?? ""}
            onChange={(e) => onChange({ nationality: e.target.value })}
          />
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
          <option value="under_5L">Under ₹5 Lakh</option>
          <option value="5L_10L">₹5 – 10 Lakh</option>
          <option value="10L_20L">₹10 – 20 Lakh</option>
          <option value="20L_40L">₹20 – 40 Lakh</option>
          <option value="above_40L">Above ₹40 Lakh</option>
        </Select>
      </div>
    </div>
  );
}

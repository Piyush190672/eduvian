"use client";

interface Props {
  filters: {
    tier: string;
    country: string;
    field: string;
    sort: string;
  };
  countries: string[];
  fields: string[];
  onChange: (updates: Partial<Props["filters"]>) => void;
}

export default function FilterBar({ filters, countries, fields, onChange }: Props) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tier</label>
        <select
          value={filters.tier}
          onChange={(e) => onChange({ tier: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="all">All Tiers</option>
          <option value="safe">✅ Safe Match</option>
          <option value="reach">🎯 Reach</option>
          <option value="ambitious">🚀 Ambitious</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Country</label>
        <select
          value={filters.country}
          onChange={(e) => onChange({ country: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Field</label>
        <select
          value={filters.field}
          onChange={(e) => onChange({ field: e.target.value })}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="all">All Fields</option>
          {fields.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Globe2,
  Users,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Search,
  ExternalLink,
  Download,
} from "lucide-react";
import { submissionStore } from "@/lib/store";
import type { StoredSubmission } from "@/lib/store";
import { TARGET_COUNTRIES, BUDGET_LABELS } from "@/lib/types";
import { useRouter } from "next/navigation";

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = () => {
    sessionStorage.removeItem("eduvianai_admin");
    router.push("/admin");
  };
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-indigo-900 text-white flex flex-col fixed inset-y-0 left-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">eduvianAI</span>
          </div>
          <span className="text-xs text-indigo-300 mt-1 block">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/admin/leads", icon: Users, label: "Leads" },
            { href: "/admin/programs", icon: BookOpen, label: "Programs" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors"
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-indigo-300 hover:text-white hover:bg-white/10 transition-colors w-full">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}

export default function LeadsPage() {
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StoredSubmission | null>(null);

  useEffect(() => {
    setSubmissions(
      Array.from(submissionStore.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    );
  }, []);

  const filtered = submissions.filter(
    (s) =>
      s.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.profile.email.toLowerCase().includes(search.toLowerCase()) ||
      s.profile.nationality?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Level", "Country #1", "Budget", "Intake", "Submitted"],
      ...submissions.map((s) => [
        s.profile.full_name,
        s.profile.email,
        s.profile.phone,
        s.profile.degree_level,
        TARGET_COUNTRIES.find((c) => c.code === s.profile.country_preferences[0])?.name ?? s.profile.country_preferences[0] ?? "",
        BUDGET_LABELS[s.profile.budget_range] ?? "",
        `${s.profile.target_intake_semester} ${s.profile.target_intake_year}`,
        new Date(s.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eduvianai-leads.csv";
    a.click();
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Leads ({submissions.length})
        </h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, nationality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${selected ? "flex-1" : "w-full"}`}>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {submissions.length === 0
                  ? "No student submissions yet."
                  : "No results match your search."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Level</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Top Country</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Budget</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Intake</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Results</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.token}
                    onClick={() => setSelected(s === selected ? null : s)}
                    className={`border-b border-gray-50 cursor-pointer hover:bg-indigo-50/50 transition-colors ${selected?.token === s.token ? "bg-indigo-50" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-900">{s.profile.full_name}</div>
                      <div className="text-xs text-gray-400">{s.profile.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.profile.degree_level === "postgraduate" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                        {s.profile.degree_level === "postgraduate" ? "PG" : "UG"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {(() => {
                        const code = s.profile.country_preferences[0];
                        const c = TARGET_COUNTRIES.find((t) => t.code === code);
                        return c ? `${c.flag} ${c.name}` : code ?? "—";
                      })()}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {BUDGET_LABELS[s.profile.budget_range]?.split("/")[0] ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs capitalize">
                      {s.profile.target_intake_semester} {s.profile.target_intake_year}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/results/${s.token}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 text-xs font-medium"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Profile Detail</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="space-y-3">
              {[
                ["Name", selected.profile.full_name],
                ["Email", selected.profile.email],
                ["Phone", selected.profile.phone],
                ["Nationality", selected.profile.nationality],
                ["City", selected.profile.city],
                ["Passport", selected.profile.passport_available],
                ["Visa history", selected.profile.visa_history],
                ["Family abroad", selected.profile.family_abroad ? "Yes" : "No"],
                ["Family income", selected.profile.family_income_inr],
                ["Degree level", selected.profile.degree_level],
                ["Degree", selected.profile.current_degree],
                ["Major", selected.profile.major_stream],
                ["Score", `${selected.profile.academic_score}${selected.profile.academic_score_type === "gpa" ? " GPA" : "%"}`],
                ["Backlogs", selected.profile.backlogs ? `Yes (${selected.profile.backlog_count})` : "No"],
                ["English test", selected.profile.english_test],
                ["English score", selected.profile.english_score_overall?.toString() ?? "—"],
                ["Budget", BUDGET_LABELS[selected.profile.budget_range]],
                ["Intake", `${selected.profile.target_intake_semester} ${selected.profile.target_intake_year}`],
                ["Field", selected.profile.intended_field],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
                  <span className="text-xs text-gray-800 font-medium text-right truncate">{value ?? "—"}</span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Country preferences</p>
              <div className="flex flex-wrap gap-1">
                {selected.profile.country_preferences.map((code, i) => {
                  const c = TARGET_COUNTRIES.find((t) => t.code === code);
                  return (
                    <span key={code} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {i + 1}. {c?.flag} {c?.name ?? code}
                    </span>
                  );
                })}
              </div>
            </div>
            <Link
              href={`/results/${selected.token}`}
              target="_blank"
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Shortlist
            </Link>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

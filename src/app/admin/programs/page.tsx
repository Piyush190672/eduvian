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
  Trophy,
} from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import { getCountryFlag, formatCurrency } from "@/lib/utils";
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

export default function ProgramsPage() {
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");

  const programs = PROGRAMS.map((p, i) => ({ ...p, id: `prog_${i}` }));
  const countries = [...new Set(programs.map((p) => p.country))].sort();

  const filtered = programs.filter((p) => {
    const matchSearch =
      !search ||
      p.university_name.toLowerCase().includes(search.toLowerCase()) ||
      p.program_name.toLowerCase().includes(search.toLowerCase()) ||
      p.field_of_study.toLowerCase().includes(search.toLowerCase());
    const matchCountry = countryFilter === "all" || p.country === countryFilter;
    const matchLevel = levelFilter === "all" || p.degree_level === levelFilter;
    return matchSearch && matchCountry && matchLevel;
  });

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Programs ({filtered.length} / {programs.length})
        </h1>
        <span className="text-xs text-gray-400 bg-amber-50 border border-amber-200 text-amber-600 px-3 py-1.5 rounded-full">
          Phase 2: Scraper will auto-populate this DB
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search programs, universities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
          />
        </div>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="all">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="all">UG + PG</option>
          <option value="undergraduate">Undergraduate</option>
          <option value="postgraduate">Postgraduate</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Program</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Level</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Field</th>
              <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tuition/yr</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">QS</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Min IELTS</th>
              <th className="text-center px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="font-semibold text-gray-900">
                    {getCountryFlag(p.country)} {p.program_name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {p.university_name} · {p.city}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.degree_level === "postgraduate" ? "bg-purple-50 text-purple-600" : p.degree_level === "undergraduate" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}>
                    {p.degree_level === "postgraduate" ? "PG" : p.degree_level === "undergraduate" ? "UG" : "Both"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs text-gray-500 max-w-32 truncate">
                  {p.field_of_study}
                </td>
                <td className="px-5 py-3 text-right font-semibold text-indigo-600">
                  {formatCurrency(p.annual_tuition_usd)}
                </td>
                <td className="px-5 py-3 text-center">
                  {p.qs_ranking ? (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                      <Trophy className="w-3 h-3" />
                      #{p.qs_ranking}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-5 py-3 text-center text-xs text-gray-600">
                  {p.min_ielts ?? "—"}
                </td>
                <td className="px-5 py-3 text-center">
                  <a
                    href={p.program_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 text-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

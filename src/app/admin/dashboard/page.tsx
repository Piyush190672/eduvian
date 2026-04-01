"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe2,
  Users,
  GraduationCap,
  TrendingUp,
  LogOut,
  LayoutDashboard,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { submissionStore } from "@/lib/store";
import type { StoredSubmission } from "@/lib/store";
import { BUDGET_LABELS } from "@/lib/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const logout = () => {
    sessionStorage.removeItem("eduvian_admin");
    router.push("/admin");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-indigo-900 text-white flex flex-col fixed inset-y-0 left-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <Globe2 className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg">Eduvian</span>
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
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-indigo-300 hover:text-white hover:bg-white/10 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);

  useEffect(() => {
    // Load from in-memory store
    setSubmissions(Array.from(submissionStore.values()));
  }, []);

  // Analytics
  const total = submissions.length;
  const ugCount = submissions.filter((s) => s.profile.degree_level === "undergraduate").length;
  const pgCount = submissions.filter((s) => s.profile.degree_level === "postgraduate").length;

  // Country frequency
  const countryFreq: Record<string, number> = {};
  submissions.forEach((s) => {
    s.profile.country_preferences.slice(0, 1).forEach((c) => {
      countryFreq[c] = (countryFreq[c] ?? 0) + 1;
    });
  });
  const countryData = Object.entries(countryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({ name, value }));

  // Budget distribution
  const budgetFreq: Record<string, number> = {};
  submissions.forEach((s) => {
    const label = BUDGET_LABELS[s.profile.budget_range] ?? s.profile.budget_range;
    budgetFreq[label] = (budgetFreq[label] ?? 0) + 1;
  });
  const budgetData = Object.entries(budgetFreq).map(([name, value]) => ({ name, value }));

  return (
    <AdminShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Submissions", value: total, icon: Users, color: "bg-indigo-50 text-indigo-600" },
          { label: "UG Applicants", value: ugCount, icon: GraduationCap, color: "bg-purple-50 text-purple-600" },
          { label: "PG Applicants", value: pgCount, icon: GraduationCap, color: "bg-pink-50 text-pink-600" },
          { label: "This Week", value: submissions.filter((s) => {
            const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return new Date(s.created_at).getTime() > week;
          }).length, icon: TrendingUp, color: "bg-emerald-50 text-emerald-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">No submissions yet. Charts will appear here once students start submitting profiles.</p>
          <Link href="/" className="mt-4 inline-block text-indigo-500 text-sm hover:underline">
            View landing page →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Country chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Top Country Preferences</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={countryData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget pie */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Budget Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={budgetData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name.split("–")[0].trim()} ${Math.round(percent * 100)}%`
                  }
                  labelLine={false}
                >
                  {budgetData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

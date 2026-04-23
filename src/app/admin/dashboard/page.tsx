"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  TrendingUp,
  LogOut,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Sparkles,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import { TARGET_COUNTRIES, BUDGET_LABELS } from "@/lib/types";
import type { StoredSubmission } from "@/lib/store";
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

// ── Types ──────────────────────────────────────────────────────────────────

interface Registration {
  id?: string;
  name: string;
  email: string;
  phone: string;
  source?: string;
  source_stage?: number;
  created_at: string;
}

// ── Admin Shell ────────────────────────────────────────────────────────────

function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin");
  };
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-indigo-900 text-white flex flex-col fixed inset-y-0 left-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <EduvianLogoMark size={32} />
            <span className="font-display font-bold text-lg tracking-tight">
              eduvian<span className="text-indigo-300">AI</span>
            </span>
          </div>
          <span className="text-xs text-indigo-300 mt-1 block">Admin Panel</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/admin/leads",     icon: Users,           label: "Leads"     },
            { href: "/admin/programs",  icon: BookOpen,        label: "Programs"  },
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-colors">
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={logout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-indigo-300 hover:text-white hover:bg-white/10 transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-60 p-8">{children}</main>
    </div>
  );
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

const RATING_CONFIG: Record<string, { emoji: string; bg: string; text: string }> = {
  "Super Hot": { emoji: "🔥", bg: "bg-rose-100",   text: "text-rose-700"   },
  "Hot":       { emoji: "⭐", bg: "bg-amber-100",  text: "text-amber-700"  },
  "Strong":    { emoji: "💪", bg: "bg-indigo-100", text: "text-indigo-700" },
  "Good":      { emoji: "📊", bg: "bg-gray-100",   text: "text-gray-700"   },
};

// ── Page ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [submissions, setSubmissions]   = useState<StoredSubmission[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/leads").then((r) => r.json()),
    ])
      .then(([data]) => {
        setSubmissions(data.leads ?? []);
        setRegistrations(data.registrations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────

  const totalRegistrations = submissions.length + registrations.length;
  const totalMatches       = submissions.reduce((acc, s) => acc + (s.total_matched ?? 0), 0);
  const ugCount            = submissions.filter((s) => s.profile?.degree_level === "undergraduate").length;
  const pgCount            = submissions.filter((s) => s.profile?.degree_level === "postgraduate").length;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek   = [
    ...submissions.filter((s) => new Date(s.created_at).getTime() > oneWeekAgo),
    ...registrations.filter((r) => new Date(r.created_at).getTime() > oneWeekAgo),
  ].length;

  // ── Charts ─────────────────────────────────────────────────────────────

  const countryFreq: Record<string, number> = {};
  submissions.forEach((s) => {
    const code = s.profile?.country_preferences?.[0];
    if (code) countryFreq[code] = (countryFreq[code] ?? 0) + 1;
  });
  const countryData = Object.entries(countryFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({ name, value }));

  const budgetFreq: Record<string, number> = {};
  submissions.forEach((s) => {
    const label = BUDGET_LABELS[s.profile?.budget_range] ?? s.profile?.budget_range;
    if (label) budgetFreq[label] = (budgetFreq[label] ?? 0) + 1;
  });
  const budgetData = Object.entries(budgetFreq).map(([name, value]) => ({ name, value }));

  // ── Recent leads (top 8, newest first) ─────────────────────────────────

  type RecentRow = {
    key: string;
    name: string;
    email: string;
    phone: string;
    status: "complete" | "registered";
    country?: string;
    stream?: string;
    total_matched?: number;
    token?: string;
    profile_category?: string;
    created_at: string;
  };

  const recentLeads: RecentRow[] = [
    ...submissions.map((s) => {
      const code     = s.profile?.country_preferences?.[0];
      const countryObj = TARGET_COUNTRIES.find((c) => c.code === code);
      return {
        key:           s.token,
        name:          s.profile?.full_name ?? "—",
        email:         s.profile?.email     ?? "—",
        phone:         s.profile?.phone     ?? "—",
        status:        "complete" as const,
        country:       countryObj ? `${countryObj.flag} ${countryObj.name}` : (code ?? "—"),
        stream:        s.profile?.intended_field ?? "—",
        total_matched: s.total_matched,
        token:         s.token,
        profile_category: s.profile_category,
        created_at:    s.created_at,
      };
    }),
    ...registrations.map((r) => ({
      key:        `reg_${r.email}`,
      name:       r.name  ?? "—",
      email:      r.email ?? "—",
      phone:      r.phone ?? "—",
      status:     "registered" as const,
      created_at: r.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "Loading…" : `${totalRegistrations} total users · ${totalMatches.toLocaleString()} program matches generated`}
          </p>
        </div>
        <Link href="/admin/leads"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
          View all leads <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Registrations",
            value: loading ? "—" : totalRegistrations,
            sub:   `${submissions.length} profiles · ${registrations.length} sign-ups`,
            icon:  Users,
            color: "bg-indigo-50 text-indigo-600",
          },
          {
            label: "Program Matches",
            value: loading ? "—" : totalMatches.toLocaleString(),
            sub:   "AI-generated shortlists",
            icon:  Sparkles,
            color: "bg-violet-50 text-violet-600",
          },
          {
            label: "UG / PG Split",
            value: loading ? "—" : `${ugCount} / ${pgCount}`,
            sub:   "Undergraduate / Postgraduate",
            icon:  GraduationCap,
            color: "bg-pink-50 text-pink-600",
          },
          {
            label: "This Week",
            value: loading ? "—" : thisWeek,
            sub:   "New registrations last 7 days",
            icon:  TrendingUp,
            color: "bg-emerald-50 text-emerald-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-black text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600 font-semibold mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Recent leads table ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Recent Activity</h2>
          <Link href="/admin/leads" className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Loading…</div>
        ) : recentLeads.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No leads yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Country</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stream</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Matches</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => {
                  const rating = RATING_CONFIG[lead.profile_category ?? ""];
                  return (
                    <tr key={lead.key} className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-semibold text-gray-900 truncate max-w-[140px]">{lead.name}</div>
                        {rating && (
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold mt-0.5 ${rating.bg} ${rating.text}`}>
                            {rating.emoji} {lead.profile_category}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 truncate max-w-[180px]">{lead.email}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{lead.phone || "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">{lead.country ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 max-w-[120px]">
                        <span className="truncate block">{lead.stream ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        {lead.token ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-indigo-600">{lead.total_matched ?? "—"}</span>
                            <Link href={`/results/${lead.token}`} target="_blank"
                              className="text-indigo-400 hover:text-indigo-600">
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {lead.status === "complete" ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700">
                            ✓ Profile Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                            ● Registered
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Charts ──────────────────────────────────────────────────────── */}
      {submissions.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
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
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Budget Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={budgetData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) =>
                    `${name.split("–")[0].trim()} ${Math.round(percent * 100)}%`
                  }
                  labelLine={false}>
                  {budgetData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400">Charts will appear once students start submitting profiles.</p>
        </div>
      )}
    </AdminShell>
  );
}

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
  Phone,
  Mail,
  MessageSquare,
} from "lucide-react";
import { TARGET_COUNTRIES, BUDGET_LABELS } from "@/lib/types";
import type { StoredSubmission } from "@/lib/store";
import { useRouter } from "next/navigation";

// Profile rating badge config
const RATING_CONFIG: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  "Super Hot": { emoji: "🔥", label: "SUPER HOT", bg: "bg-rose-100",   text: "text-rose-700"   },
  "Hot":       { emoji: "⭐", label: "HOT",       bg: "bg-amber-100",  text: "text-amber-700"  },
  "Strong":    { emoji: "💪", label: "STRONG",    bg: "bg-indigo-100", text: "text-indigo-700" },
  "Good":      { emoji: "📊", label: "GOOD",      bg: "bg-gray-100",   text: "text-gray-700"   },
};

function ratingBadge(category: string | undefined) {
  const cfg = RATING_CONFIG[category ?? ""] ?? { emoji: "—", label: category ?? "—", bg: "bg-gray-50", text: "text-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

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

interface ChatInquiry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  question: string;
  created_at: string;
}

export default function LeadsPage() {
  const [tab, setTab] = useState<"leads" | "inquiries">("leads");
  const [submissions, setSubmissions] = useState<StoredSubmission[]>([]);
  const [inquiries, setInquiries] = useState<ChatInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<StoredSubmission | null>(null);

  useEffect(() => {
    fetch("/api/admin/leads")
      .then((r) => r.json())
      .then(({ leads }) => setSubmissions(leads ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch chat inquiries
    fetch("/api/admin/inquiries")
      .then((r) => r.json())
      .then(({ inquiries: data }) => setInquiries(data ?? []))
      .catch(() => {});
  }, []);

  const filtered = submissions.filter(
    (s) =>
      s.profile.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.profile.nationality?.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Phone", "Level", "Stream", "Country #1", "Budget", "Intake", "Profile Rating", "Submitted"],
      ...submissions.map((s) => [
        s.profile.full_name,
        s.profile.email,
        s.profile.phone,
        s.profile.degree_level,
        s.profile.intended_field ?? "",
        TARGET_COUNTRIES.find((c) => c.code === s.profile.country_preferences?.[0])?.name ?? s.profile.country_preferences?.[0] ?? "",
        BUDGET_LABELS[s.profile.budget_range] ?? "",
        `${s.profile.target_intake_semester} ${s.profile.target_intake_year}`,
        s.profile_category ?? "",
        new Date(s.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "eduvianai-leads.csv";
    a.click();
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        {tab === "leads" && (
          <button onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-2 mb-5 border-b border-gray-200">
        {[
          { id: "leads",     label: `Profile Submissions (${submissions.length})`,     icon: Users },
          { id: "inquiries", label: `Chat Inquiries (${inquiries.length})`, icon: MessageSquare },
        ].map((t) => (
          <button key={t.id}
            onClick={() => { setTab(t.id as "leads" | "inquiries"); setSelected(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "leads" && (<>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by name, email, nationality…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white" />
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${selected ? "flex-1 min-w-0" : "w-full"}`}>
          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400">Loading leads…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {submissions.length === 0 ? "No student submissions yet." : "No results match your search."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Level</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Stream</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Intake</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Rating</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Top Country</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Results</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.token}
                      onClick={() => setSelected(s === selected ? null : s)}
                      className={`border-b border-gray-50 cursor-pointer hover:bg-indigo-50/50 transition-colors ${selected?.token === s.token ? "bg-indigo-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 truncate max-w-[140px]">{s.profile.full_name}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[140px]">{s.profile.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[90px]">{s.profile.phone || "—"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate max-w-[90px]">{s.profile.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.profile.degree_level === "postgraduate" ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                          {s.profile.degree_level === "postgraduate" ? "PG" : "UG"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[120px]">
                        <span className="truncate block">{s.profile.intended_field || "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize whitespace-nowrap">
                        {s.profile.target_intake_semester} {s.profile.target_intake_year}
                      </td>
                      <td className="px-4 py-3">{ratingBadge(s.profile_category)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {(() => {
                          const code = s.profile.country_preferences?.[0];
                          const c = TARGET_COUNTRIES.find((t) => t.code === code);
                          return c ? `${c.flag} ${c.name}` : code ?? "—";
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/results/${s.token}`} target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-indigo-500 hover:text-indigo-700 text-xs font-medium">
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Profile Detail</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Rating badge prominent at top */}
            <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center gap-3">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Profile Rating</p>
                {ratingBadge(selected.profile_category)}
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                ["Name",         selected.profile.full_name],
                ["Email",        selected.profile.email],
                ["Phone",        selected.profile.phone],
                ["Nationality",  selected.profile.nationality],
                ["City",         selected.profile.city],
                ["Level",        selected.profile.degree_level],
                ["Stream",       selected.profile.intended_field],
                ["Intake",       `${selected.profile.target_intake_semester} ${selected.profile.target_intake_year}`],
                ["Budget",       BUDGET_LABELS[selected.profile.budget_range]],
                ["Degree",       selected.profile.current_degree],
                ["Major",        selected.profile.major_stream],
                ["Score",        `${selected.profile.academic_score}${selected.profile.academic_score_type === "gpa" ? " GPA" : "%"}`],
                ["Backlogs",     selected.profile.backlogs ? `Yes (${selected.profile.backlog_count})` : "No"],
                ["English test", selected.profile.english_test],
                ["English score",selected.profile.english_score_overall?.toString() ?? "—"],
                ["Passport",     selected.profile.passport_available],
                ["Visa history", selected.profile.visa_history],
                ["Family abroad",selected.profile.family_abroad ? "Yes" : "No"],
                ["Family income",selected.profile.family_income_inr],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
                  <span className="text-xs text-gray-800 font-medium text-right truncate max-w-[160px]">{value ?? "—"}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Country preferences</p>
              <div className="flex flex-wrap gap-1">
                {selected.profile.country_preferences?.map((code, i) => {
                  const c = TARGET_COUNTRIES.find((t) => t.code === code);
                  return (
                    <span key={code} className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {i + 1}. {c?.flag} {c?.name ?? code}
                    </span>
                  );
                })}
              </div>
            </div>

            <Link href={`/results/${selected.token}`} target="_blank"
              className="mt-5 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors">
              <ExternalLink className="w-4 h-4" /> View Shortlist
            </Link>
          </div>
        )}
      </div>
      </>)}

      {/* ── Chat Inquiries tab ──────────────────────────────────────── */}
      {tab === "inquiries" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No chat inquiries yet.</p>
              <p className="text-gray-400 text-xs mt-1">These appear when AISA can&apos;t answer and a user leaves their contact details.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Phone</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Question</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inq, i) => (
                  <tr key={inq.id ?? i} className="border-b border-gray-50 hover:bg-indigo-50/40 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-gray-900">{inq.name || "—"}</div>
                      <div className="text-xs text-gray-400">{inq.email}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-500">{inq.phone || "—"}</td>
                    <td className="px-5 py-3 text-xs text-gray-700 max-w-xs">
                      <span className="line-clamp-2">{inq.question || "—"}</span>
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(inq.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AdminShell>
  );
}

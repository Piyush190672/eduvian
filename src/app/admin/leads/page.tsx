"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Search,
  ExternalLink,
  Download,
  MessageSquare,
} from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import { TARGET_COUNTRIES, BUDGET_LABELS } from "@/lib/types";
import type { StoredSubmission } from "@/lib/store";
import { useRouter } from "next/navigation";

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

interface ChatInquiry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  question: string;
  created_at: string;
}

type LeadStatus = "complete" | "registered" | "inquiry";

interface UnifiedLead {
  key: string;
  status: LeadStatus;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  // Profile-complete only
  preferred_country?: string;
  preferred_stream?: string;
  token?: string;
  total_matched?: number;
  shortlisted_count?: number;
  profile_category?: string;
  // Registration source
  source?: string;
  source_stage?: number;
  // Chat inquiry only
  question?: string;
  // Full profile ref (for detail panel)
  submission?: StoredSubmission;
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string }> = {
  complete:   { label: "✓ Profile Complete", bg: "bg-emerald-100", text: "text-emerald-700" },
  registered: { label: "● Registered",       bg: "bg-amber-100",   text: "text-amber-700"  },
  inquiry:    { label: "💬 Chat Inquiry",     bg: "bg-blue-100",    text: "text-blue-700"   },
};

function statusBadge(status: LeadStatus) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  "application-check": "App. Check",
  "sop-assistant":     "SOP Writer",
  "interview-prep":    "Interview Prep",
  "ielts-mock":        "IELTS Mock",
  "pte-mock":          "PTE Mock",
  "det-mock":          "DET Mock",
  "toefl-mock":        "TOEFL Mock",
  "roi-calculator":    "ROI Calc",
  "parent-decision":   "Parent Tool",
};

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
            <span className="font-display font-bold text-lg tracking-tight">eduvian<span className="text-indigo-300">AI</span></span>
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

// ── Page ───────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const [leads, setLeads] = useState<UnifiedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [selected, setSelected] = useState<UnifiedLead | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/leads").then((r) => r.json()),
      fetch("/api/admin/inquiries").then((r) => r.json()),
    ])
      .then(([leadsData, inquiriesData]) => {
        const submissions: StoredSubmission[] = leadsData.leads ?? [];
        const registrations: Registration[]  = leadsData.registrations ?? [];
        const inquiries: ChatInquiry[]        = inquiriesData.inquiries ?? [];

        // Build unified list
        const unified: UnifiedLead[] = [];

        // 1. Full profile submissions
        for (const s of submissions) {
          const countryCode = s.profile.country_preferences?.[0];
          const countryObj  = TARGET_COUNTRIES.find((c) => c.code === countryCode);
          unified.push({
            key:               s.token,
            status:            "complete",
            name:              s.profile.full_name ?? "—",
            email:             s.profile.email ?? "—",
            phone:             s.profile.phone ?? "—",
            created_at:        s.created_at,
            preferred_country: countryObj ? `${countryObj.flag} ${countryObj.name}` : (countryCode ?? "—"),
            preferred_stream:  s.profile.intended_field ?? "—",
            token:             s.token,
            total_matched:     (s as StoredSubmission & { total_matched?: number }).total_matched,
            shortlisted_count: s.shortlisted_ids?.length ?? 0,
            profile_category:  s.profile_category,
            submission:        s,
          });
        }

        // 2. Registered-only students
        for (const r of registrations) {
          unified.push({
            key:           `reg_${r.email}`,
            status:        "registered",
            name:          r.name ?? "—",
            email:         r.email ?? "—",
            phone:         r.phone ?? "—",
            created_at:    r.created_at,
            source:        r.source,
            source_stage:  r.source_stage,
          });
        }

        // 3. Chat inquiries (deduplicate against existing emails in unified)
        const existingEmails = new Set(unified.map((l) => l.email.toLowerCase().trim()));
        for (const inq of inquiries) {
          const normalEmail = inq.email?.toLowerCase().trim();
          if (existingEmails.has(normalEmail)) {
            // Upgrade existing entry with inquiry data if needed — skip duplicate
            continue;
          }
          unified.push({
            key:        `inq_${inq.id ?? inq.email}`,
            status:     "inquiry",
            name:       inq.name ?? "—",
            email:      inq.email ?? "—",
            phone:      inq.phone ?? "—",
            created_at: inq.created_at,
            question:   inq.question,
          });
        }

        // Sort newest first
        unified.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setLeads(unified);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      l.name.toLowerCase().includes(q)  ||
      l.email.toLowerCase().includes(q) ||
      (l.preferred_country ?? "").toLowerCase().includes(q) ||
      (l.preferred_stream  ?? "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all:        leads.length,
    complete:   leads.filter((l) => l.status === "complete").length,
    registered: leads.filter((l) => l.status === "registered").length,
    inquiry:    leads.filter((l) => l.status === "inquiry").length,
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Phone", "Email", "Status", "Preferred Country", "Preferred Stream", "Source", "Shortlists", "Profile Rating", "Date"],
      ...leads.map((l) => [
        l.name, l.phone, l.email,
        l.status === "complete" ? "Profile Complete" : l.status === "registered" ? "Registered" : "Chat Inquiry",
        l.preferred_country ?? "",
        l.preferred_stream  ?? "",
        l.source ? `S${l.source_stage} · ${SOURCE_LABELS[l.source] ?? l.source}` : "",
        l.shortlisted_count != null ? String(l.shortlisted_count) : "",
        l.profile_category  ?? "",
        new Date(l.created_at).toLocaleDateString(),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "eduvianai-leads.csv"; a.click();
  };

  return (
    <AdminShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">{counts.all} total — {counts.complete} complete, {counts.registered} registered, {counts.inquiry} inquiries</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([
          { key: "all",        label: `All (${counts.all})`                     },
          { key: "complete",   label: `✓ Profile Complete (${counts.complete})`  },
          { key: "registered", label: `● Registered (${counts.registered})`      },
          { key: "inquiry",    label: `💬 Inquiries (${counts.inquiry})`          },
        ] as { key: LeadStatus | "all"; label: string }[]).map((f) => (
          <button key={f.key} onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              statusFilter === f.key
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-500 border-gray-200 hover:border-indigo-300"
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Search by name, email, country, stream…"
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
              <p className="text-gray-400 text-sm">{leads.length === 0 ? "No leads yet." : "No results match your search."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Contact</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Email ID</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Preferred Country</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Preferred Stream</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Source</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Matches</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((l) => (
                    <tr key={l.key}
                      onClick={() => l.status === "complete" ? setSelected(l === selected ? null : l) : undefined}
                      className={`border-b border-gray-50 transition-colors ${
                        l.status === "complete" ? "cursor-pointer hover:bg-indigo-50/50" : ""
                      } ${selected?.key === l.key ? "bg-indigo-50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 truncate max-w-[130px]">{l.name}</div>
                        {l.status === "complete" && l.profile_category && (
                          <div className="mt-0.5">{ratingBadge(l.profile_category)}</div>
                        )}
                        {l.status === "inquiry" && l.question && (
                          <div className="text-xs text-gray-400 truncate max-w-[130px] mt-0.5 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 flex-shrink-0" />
                            {l.question}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{l.phone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[160px]">{l.email}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{l.preferred_country ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 max-w-[130px]">
                        <span className="truncate block">{l.preferred_stream ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {l.source ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            l.source_stage === 2 ? "bg-violet-100 text-violet-700" :
                            l.source_stage === 3 ? "bg-emerald-100 text-emerald-700" :
                            l.source_stage === 4 ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            S{l.source_stage ?? "?"} · {SOURCE_LABELS[l.source] ?? l.source}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        {l.token ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-indigo-600">
                              {l.total_matched ?? "—"}
                            </span>
                            <Link href={`/results/${l.token}`} target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="text-indigo-400 hover:text-indigo-600">
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        ) : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">{statusBadge(l.status)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel — shown when a complete-profile lead is selected */}
        {selected?.submission && (
          <div className="w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Profile Detail</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Profile Rating</p>
              {ratingBadge(selected.profile_category)}
            </div>

            <div className="space-y-2.5">
              {([
                ["Name",          selected.submission.profile.full_name],
                ["Email",         selected.submission.profile.email],
                ["Phone",         selected.submission.profile.phone],
                ["Nationality",   selected.submission.profile.nationality],
                ["City",          selected.submission.profile.city],
                ["Level",         selected.submission.profile.degree_level],
                ["Stream",        selected.submission.profile.intended_field],
                ["Intake",        `${selected.submission.profile.target_intake_semester} ${selected.submission.profile.target_intake_year}`],
                ["Budget",        BUDGET_LABELS[selected.submission.profile.budget_range]],
                ["Degree",        selected.submission.profile.current_degree],
                ["Major",         selected.submission.profile.major_stream],
                ["Score",         `${selected.submission.profile.academic_score}${selected.submission.profile.academic_score_type === "gpa" ? " GPA" : "%"}`],
                ["Backlogs",      selected.submission.profile.backlogs ? `Yes (${selected.submission.profile.backlog_count})` : "No"],
                ["English test",  selected.submission.profile.english_test],
                ["English score", selected.submission.profile.english_score_overall?.toString() ?? "—"],
                ["Passport",      selected.submission.profile.passport_available],
                ["Visa history",  selected.submission.profile.visa_history],
              ] as [string, string | number | null | undefined][]).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
                  <span className="text-xs text-gray-800 font-medium text-right truncate max-w-[160px]">{value ?? "—"}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-2">Country preferences</p>
              <div className="flex flex-wrap gap-1">
                {selected.submission.profile.country_preferences?.map((code, i) => {
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
    </AdminShell>
  );
}

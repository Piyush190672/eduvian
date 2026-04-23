"use client";

/**
 * ApplicationTracker — Kanban board with per-program checklists, deadline
 * countdowns, and document-version history. Data persists in localStorage,
 * scoped to the signed-in student's email.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  History,
  Plus,
  Printer,
  Search,
  Star,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { PROGRAMS } from "@/data/programs";
import {
  checklistCompletion,
  computeStats,
  createApplication,
  daysUntil,
  DEADLINE_PILL_STYLES,
  DECISION_META,
  deadlineSeverity,
  formatDeadline,
  loadApplications,
  makeDefaultChecklist,
  newId,
  PRIORITY_META,
  saveApplications,
  STATUS_META,
  STATUS_ORDER,
  type AppStatus,
  type ChecklistItem,
  type Decision,
  type DocVersion,
  type Priority,
  type TrackedApplication,
} from "@/lib/application-tracker";

// ── Small helpers ──────────────────────────────────────────────────────────
function countdownText(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

const CHECKLIST_GROUP_META: Record<
  ChecklistItem["group"],
  { label: string; icon: string }
> = {
  "pre-application": { label: "Pre-application", icon: "🎯" },
  documents: { label: "Documents", icon: "📄" },
  submission: { label: "Submission", icon: "📤" },
  "post-submission": { label: "Post-submission", icon: "📬" },
};

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

export default function ApplicationTracker() {
  const [apps, setApps] = useState<TrackedApplication[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "overdue">("all");

  // Load from localStorage on mount
  useEffect(() => {
    setApps(loadApplications());
    setLoaded(true);
  }, []);

  // Persist on every change (after initial load)
  useEffect(() => {
    if (loaded) saveApplications(apps);
  }, [apps, loaded]);

  const stats = useMemo(() => computeStats(apps), [apps]);
  const active = useMemo(
    () => apps.find((a) => a.id === activeId) ?? null,
    [apps, activeId]
  );

  // Filtered apps for each column
  const appsByStatus = useMemo(() => {
    const map: Record<AppStatus, TrackedApplication[]> = {
      shortlisted: [],
      in_progress: [],
      submitted: [],
      decision: [],
    };
    for (const app of apps) {
      if (filter === "upcoming") {
        const d = daysUntil(app.deadline);
        if (d < 0 || d > 30) continue;
        if (app.status === "submitted" || app.status === "decision") continue;
      }
      if (filter === "overdue") {
        const d = daysUntil(app.deadline);
        if (d >= 0) continue;
        if (app.status === "submitted" || app.status === "decision") continue;
      }
      map[app.status].push(app);
    }
    // Sort each column by deadline (ascending)
    for (const k of STATUS_ORDER) {
      map[k].sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      );
    }
    return map;
  }, [apps, filter]);

  // ── Mutation helpers ─────────────────────────────────────────────────────
  const update = useCallback(
    (id: string, patch: Partial<TrackedApplication>) => {
      setApps((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, ...patch, updatedAt: new Date().toISOString() }
            : a
        )
      );
    },
    []
  );

  const moveStatus = useCallback(
    (id: string, next: AppStatus) => {
      setApps((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const now = new Date().toISOString();
          // Auto-promote decision to "pending" when entering decision column
          const decision = next === "decision" && a.decision === "pending" ? "pending" : a.decision;
          return {
            ...a,
            status: next,
            decision,
            statusChangedAt: now,
            updatedAt: now,
          };
        })
      );
    },
    []
  );

  const addApplication = useCallback((app: TrackedApplication) => {
    setApps((prev) => [app, ...prev]);
  }, []);

  const removeApplication = useCallback((id: string) => {
    if (!confirm("Remove this application from your tracker? This can't be undone.")) return;
    setApps((prev) => prev.filter((a) => a.id !== id));
    setActiveId(null);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500 text-sm">
        Loading your board…
      </div>
    );
  }

  // Empty state
  if (apps.length === 0) {
    return (
      <>
        <EmptyState onAdd={() => setAddOpen(true)} />
        {addOpen && (
          <AddApplicationModal
            onClose={() => setAddOpen(false)}
            onAdd={(a) => {
              addApplication(a);
              setAddOpen(false);
              setActiveId(a.id);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats row ─────────────────────────────────────────────── */}
      <StatsStrip stats={stats} />

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 print-hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === "all"
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            All ({apps.length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              filter === "upcoming"
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            Due in 30 days ({stats.dueIn7 + stats.dueIn30})
          </button>
          {stats.overdue > 0 && (
            <button
              onClick={() => setFilter("overdue")}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === "overdue"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
              }`}
            >
              Overdue ({stats.overdue})
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Program
          </button>
        </div>
      </div>

      {/* ── Kanban board ─────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUS_ORDER.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            apps={appsByStatus[status]}
            totalCount={apps.filter((a) => a.status === status).length}
            onCardClick={(id) => setActiveId(id)}
            onMove={moveStatus}
          />
        ))}
      </div>

      {/* ── Modals ─────────────────────────────────────────────── */}
      {addOpen && (
        <AddApplicationModal
          onClose={() => setAddOpen(false)}
          onAdd={(a) => {
            addApplication(a);
            setAddOpen(false);
            setActiveId(a.id);
          }}
        />
      )}

      {active && (
        <DetailDrawer
          app={active}
          onClose={() => setActiveId(null)}
          onUpdate={(patch) => update(active.id, patch)}
          onMove={(s) => moveStatus(active.id, s)}
          onRemove={() => removeApplication(active.id)}
        />
      )}

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          nav,
          .print-hidden {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .kanban-col {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stats strip
// ────────────────────────────────────────────────────────────────────────────
function StatsStrip({
  stats,
}: {
  stats: ReturnType<typeof computeStats>;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        icon={<Target className="w-4 h-4" />}
        label="Applications"
        value={stats.total}
        tone="indigo"
      />
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        label="Due in 7 days"
        value={stats.dueIn7}
        tone={stats.dueIn7 > 0 ? "rose" : "slate"}
      />
      <StatCard
        icon={<TrendingUp className="w-4 h-4" />}
        label="Avg checklist"
        value={`${stats.avgCompletion}%`}
        tone="emerald"
      />
      <StatCard
        icon={<Star className="w-4 h-4" />}
        label="Accepted"
        value={stats.accepted}
        tone="violet"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: "indigo" | "rose" | "emerald" | "violet" | "slate";
}) {
  const tones: Record<typeof tone, string> = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    slate: "bg-slate-50 text-slate-700 border-slate-100",
  };
  return (
    <div className={`rounded-2xl border-2 p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider opacity-80">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Kanban column
// ────────────────────────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  apps,
  totalCount,
  onCardClick,
  onMove,
}: {
  status: AppStatus;
  apps: TrackedApplication[];
  totalCount: number;
  onCardClick: (id: string) => void;
  onMove: (id: string, next: AppStatus) => void;
}) {
  const meta = STATUS_META[status];
  return (
    <div
      className={`kanban-col rounded-2xl border-2 ${meta.accentBorder} ${meta.columnBg} flex flex-col min-h-[400px]`}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
        <div className="flex items-center gap-2">
          <span
            className={`${meta.accentBg} ${meta.accentText} text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full`}
          >
            {meta.shortLabel}
          </span>
          <span className="text-xs font-bold text-gray-500">
            {totalCount}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-3 flex-1">
        {apps.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic text-center py-6">
            No applications here yet.
          </p>
        ) : (
          apps.map((app) => (
            <KanbanCard
              key={app.id}
              app={app}
              onClick={() => onCardClick(app.id)}
              onMove={(next) => onMove(app.id, next)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Kanban card
// ────────────────────────────────────────────────────────────────────────────
function KanbanCard({
  app,
  onClick,
  onMove,
}: {
  app: TrackedApplication;
  onClick: () => void;
  onMove: (next: AppStatus) => void;
}) {
  const days = daysUntil(app.deadline);
  const severity = deadlineSeverity(days);
  const completion = checklistCompletion(app.checklist);
  const currentIdx = STATUS_ORDER.indexOf(app.status);
  const prevStatus = currentIdx > 0 ? STATUS_ORDER[currentIdx - 1] : null;
  const nextStatus =
    currentIdx < STATUS_ORDER.length - 1
      ? STATUS_ORDER[currentIdx + 1]
      : null;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-3 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">
          {app.universityName}
        </p>
        <span
          className={`flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            PRIORITY_META[app.priority].pill
          }`}
        >
          {PRIORITY_META[app.priority].label}
        </span>
      </div>
      <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 mb-2">
        {app.programName}
      </p>
      <p className="text-[10px] text-gray-400 mb-2.5">
        {app.country} · {formatDeadline(app.deadline)}
      </p>

      {/* Deadline pill + progress */}
      <div className="flex items-center gap-2 mb-2.5">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DEADLINE_PILL_STYLES[severity]}`}
        >
          {countdownText(days)}
        </span>
        {app.status === "decision" ? (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              DECISION_META[app.decision].pill
            }`}
          >
            {DECISION_META[app.decision].label}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-gray-500">
            {completion.done}/{completion.total} docs
          </span>
        )}
      </div>

      {/* Progress bar */}
      {app.status !== "decision" && (
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2.5">
          <div
            className={`h-full transition-all ${
              completion.percent === 100
                ? "bg-emerald-500"
                : completion.percent >= 50
                ? "bg-indigo-500"
                : "bg-amber-400"
            }`}
            style={{ width: `${completion.percent}%` }}
          />
        </div>
      )}

      {/* Move buttons (hidden on mobile — use dropdown instead) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity print-hidden">
        {prevStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(prevStatus);
            }}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
            title={`Move to ${STATUS_META[prevStatus].label}`}
          >
            <ArrowLeft className="w-3 h-3" />
            {STATUS_META[prevStatus].shortLabel}
          </button>
        )}
        {nextStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMove(nextStatus);
            }}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] font-semibold text-indigo-700 hover:bg-indigo-100"
            title={`Move to ${STATUS_META[nextStatus].label}`}
          >
            {STATUS_META[nextStatus].shortLabel}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state
// ────────────────────────────────────────────────────────────────────────────
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-16 px-8 text-center">
      <div className="inline-flex w-16 h-16 items-center justify-center rounded-2xl bg-indigo-100 mb-5">
        <Target className="w-8 h-8 text-indigo-600" />
      </div>
      <h3 className="text-xl font-extrabold text-gray-900 mb-2">
        Your tracker is empty. Add your first program.
      </h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
        Build one unified board for every application — deadlines, checklists,
        and document versions in one place. Never juggle spreadsheets again.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add your first program
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Add application modal
// ────────────────────────────────────────────────────────────────────────────
function AddApplicationModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (app: TrackedApplication) => void;
}) {
  const [tab, setTab] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [manualData, setManualData] = useState({
    universityName: "",
    programName: "",
    country: "",
    deadline: "",
    applyUrl: "",
    priority: "target" as Priority,
  });

  const matches = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (PROGRAMS as any[])
      .filter(
        (p) =>
          p.application_deadline &&
          (p.university_name?.toLowerCase().includes(q) ||
            p.program_name?.toLowerCase().includes(q) ||
            p.country?.toLowerCase().includes(q))
      )
      .slice(0, 20);
  }, [query]);

  return (
    <Modal onClose={onClose} title="Add a program to your tracker" wide>
      <div className="flex items-center gap-2 mb-5 border-b border-gray-200">
        <button
          onClick={() => setTab("search")}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
            tab === "search"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Search className="inline w-3.5 h-3.5 mr-1" />
          Search database
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px ${
            tab === "manual"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Plus className="inline w-3.5 h-3.5 mr-1" />
          Enter manually
        </button>
      </div>

      {tab === "search" ? (
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by university, program, or country…"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
          />
          {query.length >= 2 && matches.length === 0 && (
            <p className="text-xs text-gray-500 mt-3 text-center py-6">
              No matches. Switch to "Enter manually" to add a custom program.
            </p>
          )}
          <div className="mt-3 max-h-[50vh] overflow-y-auto space-y-2">
            {matches.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onAdd(
                      createApplication({
                        universityName: p.university_name,
                        programName: p.program_name,
                        country: p.country,
                        deadline: p.application_deadline,
                        applyUrl: p.apply_url,
                        priority: "target",
                        programRef: `${p.university_name}::${p.program_name}`,
                      })
                    );
                  }}
                  className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">
                        {p.university_name}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {p.program_name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {p.city}, {p.country} · Deadline{" "}
                        {formatDeadline(p.application_deadline)}
                        {p.qs_ranking ? ` · QS #${p.qs_ranking}` : ""}
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="University name" required>
            <input
              value={manualData.universityName}
              onChange={(e) =>
                setManualData({ ...manualData, universityName: e.target.value })
              }
              placeholder="e.g. Imperial College London"
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
            />
          </Field>
          <Field label="Program name" required>
            <input
              value={manualData.programName}
              onChange={(e) =>
                setManualData({ ...manualData, programName: e.target.value })
              }
              placeholder="e.g. MSc Computing (AI & ML)"
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" required>
              <input
                value={manualData.country}
                onChange={(e) =>
                  setManualData({ ...manualData, country: e.target.value })
                }
                placeholder="UK"
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
              />
            </Field>
            <Field label="Deadline" required>
              <input
                type="date"
                value={manualData.deadline}
                onChange={(e) =>
                  setManualData({ ...manualData, deadline: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
              />
            </Field>
          </div>
          <Field label="Apply URL (optional)">
            <input
              value={manualData.applyUrl}
              onChange={(e) =>
                setManualData({ ...manualData, applyUrl: e.target.value })
              }
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
            />
          </Field>
          <Field label="Priority">
            <div className="flex gap-2">
              {(["reach", "target", "safety"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setManualData({ ...manualData, priority: p })}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                    manualData.priority === p
                      ? `${PRIORITY_META[p].pill} border-current`
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </Field>
          <button
            disabled={
              !manualData.universityName ||
              !manualData.programName ||
              !manualData.country ||
              !manualData.deadline
            }
            onClick={() => {
              onAdd(
                createApplication({
                  universityName: manualData.universityName,
                  programName: manualData.programName,
                  country: manualData.country,
                  deadline: manualData.deadline,
                  applyUrl: manualData.applyUrl || undefined,
                  priority: manualData.priority,
                })
              );
            }}
            className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Add to tracker
          </button>
        </div>
      )}
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Detail drawer
// ────────────────────────────────────────────────────────────────────────────
function DetailDrawer({
  app,
  onClose,
  onUpdate,
  onMove,
  onRemove,
}: {
  app: TrackedApplication;
  onClose: () => void;
  onUpdate: (patch: Partial<TrackedApplication>) => void;
  onMove: (next: AppStatus) => void;
  onRemove: () => void;
}) {
  const days = daysUntil(app.deadline);
  const severity = deadlineSeverity(days);
  const completion = checklistCompletion(app.checklist);

  // Checklist mutations
  const toggleItem = (id: string) => {
    onUpdate({
      checklist: app.checklist.map((i) =>
        i.id === id ? { ...i, done: !i.done } : i
      ),
    });
  };
  const deleteItem = (id: string) => {
    onUpdate({ checklist: app.checklist.filter((i) => i.id !== id) });
  };
  const addItem = (label: string, group: ChecklistItem["group"]) => {
    if (!label.trim()) return;
    const next: ChecklistItem = {
      id: newId("chk"),
      label: label.trim(),
      done: false,
      required: true,
      group,
    };
    onUpdate({ checklist: [...app.checklist, next] });
  };
  const resetChecklist = () => {
    if (!confirm("Reset checklist to defaults? Your ticked items will be lost."))
      return;
    onUpdate({ checklist: makeDefaultChecklist() });
  };

  // Document version mutations
  const addDocVersion = (doc: Omit<DocVersion, "id" | "savedAt" | "version">) => {
    const existing = app.documents.filter((d) => d.docType === doc.docType);
    const version = existing.length + 1;
    const next: DocVersion = {
      ...doc,
      id: newId("doc"),
      version,
      savedAt: new Date().toISOString(),
    };
    onUpdate({ documents: [next, ...app.documents] });
  };
  const deleteDocVersion = (id: string) => {
    onUpdate({ documents: app.documents.filter((d) => d.id !== id) });
  };

  return (
    <Modal onClose={onClose} wide>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              {app.country}
            </p>
            <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
              {app.universityName}
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">{app.programName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${DEADLINE_PILL_STYLES[severity]}`}
          >
            <Calendar className="w-3 h-3" />
            {formatDeadline(app.deadline)} · {countdownText(days)}
          </span>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full ${PRIORITY_META[app.priority].pill}`}
          >
            <Flag className="inline w-3 h-3 mr-1" />
            {PRIORITY_META[app.priority].label}
          </span>
          {app.status === "decision" && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${DECISION_META[app.decision].pill}`}
            >
              {DECISION_META[app.decision].label}
            </span>
          )}
          {app.applyUrl && (
            <a
              href={app.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:underline ml-auto"
            >
              Official portal
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Status picker */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => onMove(s)}
                className={`py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                  app.status === s
                    ? `${STATUS_META[s].accentBg} ${STATUS_META[s].accentText} border-current`
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {STATUS_META[s].shortLabel}
              </button>
            ))}
          </div>
        </div>

        {/* Priority picker */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Priority
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(["reach", "target", "safety"] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => onUpdate({ priority: p })}
                className={`py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                  app.priority === p
                    ? `${PRIORITY_META[p].pill} border-current`
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}
                title={PRIORITY_META[p].description}
              >
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Decision picker (only when in Decision column) */}
        {app.status === "decision" && (
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
              Decision outcome
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(
                [
                  "pending",
                  "accepted",
                  "waitlist",
                  "rejected",
                  "deferred",
                ] as Decision[]
              ).map((d) => (
                <button
                  key={d}
                  onClick={() => onUpdate({ decision: d })}
                  className={`py-2 rounded-xl text-[10px] font-bold border-2 transition-colors ${
                    app.decision === d
                      ? `${DECISION_META[d].pill} border-current`
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {DECISION_META[d].label.replace(" 🎉", "")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Progress
            </label>
            <span className="text-xs font-bold text-gray-700">
              {completion.done} / {completion.total} required · {completion.percent}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                completion.percent === 100
                  ? "bg-emerald-500"
                  : completion.percent >= 50
                  ? "bg-indigo-500"
                  : "bg-amber-400"
              }`}
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>

        {/* Checklist */}
        <ChecklistSection
          items={app.checklist}
          onToggle={toggleItem}
          onDelete={deleteItem}
          onAdd={addItem}
          onReset={resetChecklist}
        />

        {/* Documents */}
        <DocumentsSection
          docs={app.documents}
          onAdd={addDocVersion}
          onDelete={deleteDocVersion}
        />

        {/* Notes */}
        <div>
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 block">
            Notes
          </label>
          <textarea
            value={app.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            placeholder="Anything relevant — contact person in admissions, interview prep notes, open questions…"
            rows={3}
            className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm resize-y"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={onRemove}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove from tracker
          </button>
          <span className="text-[10px] text-gray-400">
            Added {formatDeadline(app.createdAt)} · Last edit{" "}
            {formatDeadline(app.updatedAt)}
          </span>
        </div>
      </div>
    </Modal>
  );
}

// ── Checklist sub-section ──────────────────────────────────────────────────
function ChecklistSection({
  items,
  onToggle,
  onDelete,
  onAdd,
  onReset,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (label: string, group: ChecklistItem["group"]) => void;
  onReset: () => void;
}) {
  const [addingTo, setAddingTo] = useState<ChecklistItem["group"] | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleGroup = (g: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  };

  const groups: ChecklistItem["group"][] = [
    "pre-application",
    "documents",
    "submission",
    "post-submission",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Checklist
        </label>
        <button
          onClick={onReset}
          className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 hover:underline"
        >
          Reset to defaults
        </button>
      </div>
      <div className="space-y-3">
        {groups.map((g) => {
          const groupItems = items.filter((i) => i.group === g);
          const meta = CHECKLIST_GROUP_META[g];
          const isCollapsed = collapsed.has(g);
          const doneCount = groupItems.filter((i) => i.done).length;
          return (
            <div key={g} className="rounded-xl border border-gray-200 bg-white">
              <button
                onClick={() => toggleGroup(g)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 rounded-t-xl"
              >
                <span className="flex items-center gap-2 text-xs font-bold text-gray-800">
                  <span>{meta.icon}</span>
                  {meta.label}
                  <span className="text-[10px] font-semibold text-gray-400">
                    {doneCount}/{groupItems.length}
                  </span>
                </span>
                {isCollapsed ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-1.5 border-t border-gray-100 pt-2">
                  {groupItems.map((item) => (
                    <div
                      key={item.id}
                      className="group flex items-start gap-2 py-1"
                    >
                      <button
                        onClick={() => onToggle(item.id)}
                        className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          item.done
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-white border-gray-300 hover:border-indigo-400"
                        }`}
                      >
                        {item.done && (
                          <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-xs leading-snug ${
                          item.done
                            ? "text-gray-400 line-through"
                            : "text-gray-700"
                        }`}
                      >
                        {item.label}
                        {!item.required && (
                          <span className="ml-1.5 text-[9px] font-bold text-gray-400 uppercase">
                            optional
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {addingTo === g ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newLabel.trim()) {
                            onAdd(newLabel, g);
                            setNewLabel("");
                            setAddingTo(null);
                          } else if (e.key === "Escape") {
                            setAddingTo(null);
                            setNewLabel("");
                          }
                        }}
                        placeholder="New item…"
                        autoFocus
                        className="flex-1 px-2 py-1 rounded-md border border-indigo-200 text-xs outline-none focus:border-indigo-400"
                      />
                      <button
                        onClick={() => {
                          if (newLabel.trim()) {
                            onAdd(newLabel, g);
                            setNewLabel("");
                            setAddingTo(null);
                          }
                        }}
                        className="px-2 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-bold hover:bg-indigo-700"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingTo(g)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 mt-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add item
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Documents sub-section ──────────────────────────────────────────────────
function DocumentsSection({
  docs,
  onAdd,
  onDelete,
}: {
  docs: DocVersion[];
  onAdd: (doc: Omit<DocVersion, "id" | "savedAt" | "version">) => void;
  onDelete: (id: string) => void;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [docType, setDocType] = useState("SOP");
  const [label, setLabel] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setLabel("");
    setChangeNote("");
    setFileName("");
    setAddOpen(false);
  };

  // Group by docType
  const byType = useMemo(() => {
    const map: Record<string, DocVersion[]> = {};
    for (const d of docs) {
      (map[d.docType] ||= []).push(d);
    }
    // Sort each type by version desc
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => b.version - a.version);
    }
    return map;
  }, [docs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Document version history
        </label>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <Plus className="w-3 h-3" />
          Log new version
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3">
        {docs.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic text-center py-3">
            No document versions logged yet. Track revisions of your SOP, CV, LORs
            and essays here — filename + changelog, not file uploads.
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byType).map(([type, versions]) => (
              <div key={type}>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-800 mb-1.5">
                  <FileText className="w-3 h-3 text-indigo-500" />
                  {type}
                  <span className="text-[9px] font-semibold text-gray-400">
                    {versions.length} version{versions.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-1 pl-4 border-l-2 border-indigo-100">
                  {versions.map((v) => (
                    <div
                      key={v.id}
                      className="group flex items-start gap-2 py-1"
                    >
                      <span className="flex-shrink-0 w-8 text-center text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded px-1 py-0.5">
                        v{v.version}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">
                          {v.label || v.fileName || `Version ${v.version}`}
                        </p>
                        {v.changeNote && (
                          <p className="text-[11px] text-gray-600 leading-snug mt-0.5">
                            {v.changeNote}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(v.savedAt).toLocaleString()}
                          {v.fileName ? ` · ${v.fileName}` : ""}
                          {v.fileSizeKb ? ` · ${v.fileSizeKb} KB` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => onDelete(v.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <Modal onClose={reset} title="Log a new document version">
          <div className="space-y-3">
            <Field label="Document type" required>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm bg-white"
              >
                {[
                  "SOP",
                  "Personal Statement",
                  "CV",
                  "LOR",
                  "Essay",
                  "Transcript",
                  "Portfolio",
                  "Writing Sample",
                  "Other",
                ].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Label (optional)">
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. SOP — Stanford AI"
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
              />
            </Field>
            <Field label="What changed?" required>
              <textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="e.g. Added research fit paragraph referencing Prof. X's lab."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm resize-y"
              />
            </Field>
            <Field label="Filename reference (optional)">
              <div className="flex items-center gap-2">
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="sop_stanford_v3.pdf"
                  className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-400 outline-none text-sm"
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setFileName(f.name);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl border-2 border-gray-200 text-xs font-semibold hover:bg-gray-50"
                >
                  Pick
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Filename only — we don't upload the file.
              </p>
            </Field>
            <button
              onClick={() => {
                if (!changeNote.trim()) return;
                onAdd({
                  docType,
                  label: label.trim(),
                  changeNote: changeNote.trim(),
                  fileName: fileName.trim() || undefined,
                });
                reset();
              }}
              disabled={!changeNote.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Save version
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared modal + field primitives
// ────────────────────────────────────────────────────────────────────────────
function Modal({
  children,
  onClose,
  title,
  wide = false,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  wide?: boolean;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto print-hidden"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative bg-white rounded-3xl shadow-2xl w-full ${
          wide ? "max-w-3xl" : "max-w-md"
        } p-6 my-8`}
      >
        {title && (
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

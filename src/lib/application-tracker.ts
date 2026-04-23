/**
 * application-tracker.ts
 *
 * Data model + localStorage persistence for the Application Tracker dashboard.
 *
 * Storage key: `eduvian_applications_v1` — scoped per signed-in student email
 * so multiple users on the same device don't clobber each other's boards.
 */

export type AppStatus = "shortlisted" | "in_progress" | "submitted" | "decision";

export type Decision = "pending" | "accepted" | "waitlist" | "rejected" | "deferred";

export type Priority = "reach" | "target" | "safety";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  /** Required items count toward completion percentage; optional ones don't. */
  required: boolean;
  /** Optional ISO date — used for "sub-deadline" reminders (e.g., LOR request). */
  dueDate?: string;
  /** Short free-text note (who's working on it, where it lives, etc.). */
  note?: string;
  /** Group tag used for visual section rendering in the checklist drawer. */
  group: "pre-application" | "documents" | "submission" | "post-submission";
}

export interface DocVersion {
  id: string;
  /** SOP, LOR, CV, transcript, etc. */
  docType: string;
  /** User-facing label (e.g., "SOP — Stanford AI"). */
  label: string;
  /** Monotonic version number, 1-indexed. */
  version: number;
  /** ISO timestamp the version was recorded. */
  savedAt: string;
  /** Free-text changelog ("added research fit paragraph"). */
  changeNote: string;
  /** Optional file reference — just metadata; we do NOT store file blobs. */
  fileName?: string;
  fileSizeKb?: number;
}

export interface TrackedApplication {
  id: string;
  /** Optional link to PROGRAMS row (by index or program_url) — not required. */
  programRef?: string;
  universityName: string;
  programName: string;
  country: string;
  /** ISO date — the application deadline. */
  deadline: string;
  applyUrl?: string;
  status: AppStatus;
  decision: Decision;
  priority: Priority;
  notes: string;
  checklist: ChecklistItem[];
  documents: DocVersion[];
  /** ISO timestamps — track board history. */
  createdAt: string;
  updatedAt: string;
  /** When the user last moved this card to a new status column. */
  statusChangedAt: string;
}

// ── Status metadata ─────────────────────────────────────────────────────────

export const STATUS_META: Record<
  AppStatus,
  {
    label: string;
    shortLabel: string;
    description: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    columnBg: string;
  }
> = {
  shortlisted: {
    label: "Shortlisted",
    shortLabel: "Shortlist",
    description: "Programs you're considering — not yet working on an app.",
    accentBg: "bg-slate-100",
    accentText: "text-slate-700",
    accentBorder: "border-slate-200",
    columnBg: "bg-slate-50/70",
  },
  in_progress: {
    label: "In Progress",
    shortLabel: "In Progress",
    description: "Actively writing, collecting LORs, filling the form.",
    accentBg: "bg-amber-100",
    accentText: "text-amber-800",
    accentBorder: "border-amber-200",
    columnBg: "bg-amber-50/60",
  },
  submitted: {
    label: "Submitted",
    shortLabel: "Submitted",
    description: "Application is in — awaiting review / interview.",
    accentBg: "bg-indigo-100",
    accentText: "text-indigo-800",
    accentBorder: "border-indigo-200",
    columnBg: "bg-indigo-50/60",
  },
  decision: {
    label: "Decision",
    shortLabel: "Decision",
    description: "Outcome received — accepted, waitlisted, or rejected.",
    accentBg: "bg-emerald-100",
    accentText: "text-emerald-800",
    accentBorder: "border-emerald-200",
    columnBg: "bg-emerald-50/60",
  },
};

export const STATUS_ORDER: AppStatus[] = [
  "shortlisted",
  "in_progress",
  "submitted",
  "decision",
];

export const DECISION_META: Record<
  Decision,
  { label: string; pill: string }
> = {
  pending: { label: "Pending", pill: "bg-slate-100 text-slate-700 border border-slate-200" },
  accepted: { label: "Accepted 🎉", pill: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
  waitlist: { label: "Waitlisted", pill: "bg-amber-100 text-amber-800 border border-amber-300" },
  rejected: { label: "Rejected", pill: "bg-rose-100 text-rose-800 border border-rose-300" },
  deferred: { label: "Deferred", pill: "bg-violet-100 text-violet-800 border border-violet-300" },
};

export const PRIORITY_META: Record<
  Priority,
  { label: string; pill: string; description: string }
> = {
  reach: {
    label: "Reach",
    pill: "bg-rose-100 text-rose-800 border border-rose-200",
    description: "Admit is a stretch — apply hopeful, plan for alternatives.",
  },
  target: {
    label: "Target",
    pill: "bg-blue-100 text-blue-800 border border-blue-200",
    description: "Solid fit — profile aligns with typical admits.",
  },
  safety: {
    label: "Safety",
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    description: "High admit probability — your anchor option.",
  },
};

// ── Default checklist ──────────────────────────────────────────────────────

/**
 * Default requirement list seeded onto every new tracked application.
 * Users can tick, add, or remove any item. Grouped for UI rendering.
 */
export function makeDefaultChecklist(): ChecklistItem[] {
  const base: Omit<ChecklistItem, "id" | "done">[] = [
    // Pre-application
    { label: "Confirm program eligibility (GPA, test scores, work-ex)", required: true, group: "pre-application" },
    { label: "Note application deadline & intake", required: true, group: "pre-application" },
    { label: "Budget tuition + living costs (year 1)", required: false, group: "pre-application" },

    // Documents
    { label: "Statement of Purpose (SOP)", required: true, group: "documents" },
    { label: "CV / Résumé (tailored to program)", required: true, group: "documents" },
    { label: "Academic transcripts (all institutions)", required: true, group: "documents" },
    { label: "Degree / graduation certificate", required: true, group: "documents" },
    { label: "Letter of Recommendation #1", required: true, group: "documents" },
    { label: "Letter of Recommendation #2", required: true, group: "documents" },
    { label: "Letter of Recommendation #3", required: false, group: "documents" },
    { label: "English proficiency score (IELTS / TOEFL / PTE / DET)", required: true, group: "documents" },
    { label: "GRE / GMAT score (if required)", required: false, group: "documents" },
    { label: "Passport copy (bio page)", required: true, group: "documents" },
    { label: "Financial proof / bank statement", required: false, group: "documents" },
    { label: "Portfolio / writing sample (if applicable)", required: false, group: "documents" },

    // Submission
    { label: "Create account on university portal", required: true, group: "submission" },
    { label: "Fill & review online application form", required: true, group: "submission" },
    { label: "Pay application fee", required: true, group: "submission" },
    { label: "Submit application before deadline", required: true, group: "submission" },

    // Post-submission
    { label: "Send official test scores via testing agency", required: true, group: "post-submission" },
    { label: "Confirm recommenders have uploaded LORs", required: true, group: "post-submission" },
    { label: "Respond to interview invite (if shortlisted)", required: false, group: "post-submission" },
  ];
  return base.map((b, i) => ({ ...b, id: `chk-${Date.now()}-${i}`, done: false }));
}

// ── Helpers: IDs, dates, completion ────────────────────────────────────────

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function daysUntil(isoDate: string): number {
  const target = new Date(isoDate + (isoDate.length === 10 ? "T23:59:59" : ""));
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function deadlineSeverity(
  days: number
): "overdue" | "urgent" | "soon" | "comfortable" {
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "comfortable";
}

export const DEADLINE_PILL_STYLES: Record<
  ReturnType<typeof deadlineSeverity>,
  string
> = {
  overdue: "bg-rose-600 text-white border border-rose-700",
  urgent: "bg-rose-100 text-rose-800 border border-rose-300",
  soon: "bg-amber-100 text-amber-800 border border-amber-300",
  comfortable: "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

export function checklistCompletion(items: ChecklistItem[]): {
  done: number;
  total: number;
  percent: number;
} {
  const required = items.filter((i) => i.required);
  const done = required.filter((i) => i.done).length;
  const total = required.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return { done, total, percent };
}

// ── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = "eduvian_applications_v1";

/** Get the storage key for the current signed-in student (email-scoped). */
function keyFor(email: string | null): string {
  const safe = (email || "guest").toLowerCase().trim();
  return `${STORAGE_KEY}::${safe}`;
}

/** Read the currently signed-in student's email from the auth localStorage blob. */
export function currentStudentEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("eduvian_student");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.email ?? null;
  } catch {
    return null;
  }
}

export function loadApplications(): TrackedApplication[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(currentStudentEmail()));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveApplications(apps: TrackedApplication[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(keyFor(currentStudentEmail()), JSON.stringify(apps));
  } catch (e) {
    // Quota exceeded or private-mode browser — non-fatal.
    // eslint-disable-next-line no-console
    console.warn("Failed to persist applications:", e);
  }
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function createApplication(input: {
  universityName: string;
  programName: string;
  country: string;
  deadline: string;
  applyUrl?: string;
  priority?: Priority;
  programRef?: string;
}): TrackedApplication {
  const now = new Date().toISOString();
  return {
    id: newId("app"),
    programRef: input.programRef,
    universityName: input.universityName,
    programName: input.programName,
    country: input.country,
    deadline: input.deadline,
    applyUrl: input.applyUrl,
    status: "shortlisted",
    decision: "pending",
    priority: input.priority ?? "target",
    notes: "",
    checklist: makeDefaultChecklist(),
    documents: [],
    createdAt: now,
    updatedAt: now,
    statusChangedAt: now,
  };
}

export function touch<T extends { updatedAt: string }>(obj: T): T {
  return { ...obj, updatedAt: new Date().toISOString() };
}

// ── Board-level stats ──────────────────────────────────────────────────────

export interface BoardStats {
  total: number;
  byStatus: Record<AppStatus, number>;
  dueIn7: number;
  dueIn30: number;
  overdue: number;
  avgCompletion: number;
  accepted: number;
  rejected: number;
  nextDeadline?: TrackedApplication;
}

export function computeStats(apps: TrackedApplication[]): BoardStats {
  const byStatus: Record<AppStatus, number> = {
    shortlisted: 0,
    in_progress: 0,
    submitted: 0,
    decision: 0,
  };
  let dueIn7 = 0;
  let dueIn30 = 0;
  let overdue = 0;
  let completionSum = 0;
  let completionCount = 0;
  let accepted = 0;
  let rejected = 0;
  let nextDeadline: TrackedApplication | undefined;

  for (const app of apps) {
    byStatus[app.status] += 1;
    const days = daysUntil(app.deadline);

    // Only pre-submission apps count as "upcoming"
    const preSubmit =
      app.status === "shortlisted" || app.status === "in_progress";
    if (preSubmit) {
      if (days < 0) overdue += 1;
      else if (days <= 7) dueIn7 += 1;
      else if (days <= 30) dueIn30 += 1;

      if (
        !nextDeadline ||
        new Date(app.deadline).getTime() <
          new Date(nextDeadline.deadline).getTime()
      ) {
        if (days >= 0) nextDeadline = app;
      }
    }

    if (app.status !== "decision") {
      completionSum += checklistCompletion(app.checklist).percent;
      completionCount += 1;
    }

    if (app.decision === "accepted") accepted += 1;
    if (app.decision === "rejected") rejected += 1;
  }

  return {
    total: apps.length,
    byStatus,
    dueIn7,
    dueIn30,
    overdue,
    avgCompletion:
      completionCount === 0 ? 0 : Math.round(completionSum / completionCount),
    accepted,
    rejected,
    nextDeadline,
  };
}

// ── Serialization helper for print/export ──────────────────────────────────

export function formatDeadline(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

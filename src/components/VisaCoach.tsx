"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  ArrowRight,
  Clock,
  Banknote,
  ListChecks,
  BookOpen,
  Printer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import {
  VISA_COUNTRY_LIST,
  VISA_COMPLEXITY_RANKED,
  VISA_DATA_LAST_VERIFIED,
  type VisaCountry,
  type VisaCountryCode,
  type VisaChecklistItem,
  type VisaRisk,
} from "@/data/visa-data";

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoney(amount: number, currency: string): string {
  if (amount === 0) return "Varies by institution";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

const GROUP_META: Record<
  VisaChecklistItem["group"],
  { label: string; icon: string; color: string }
> = {
  "pre-application":     { label: "Before you apply",           icon: "📝", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  "financial":           { label: "Financial evidence",         icon: "💰", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  "academic":            { label: "Academic documents",         icon: "🎓", color: "text-violet-600 bg-violet-50 border-violet-200" },
  "identity":            { label: "Identity & passport",        icon: "🪪", color: "text-sky-600 bg-sky-50 border-sky-200" },
  "biometric-interview": { label: "Biometrics & medical",       icon: "🩺", color: "text-pink-600 bg-pink-50 border-pink-200" },
  "post-approval":       { label: "After approval",             icon: "✈️", color: "text-amber-600 bg-amber-50 border-amber-200" },
};

const SEVERITY_META: Record<
  VisaRisk["severity"],
  { label: string; ring: string; bg: string; text: string; badge: string }
> = {
  critical: { label: "Critical", ring: "ring-rose-200",    bg: "bg-rose-50",    text: "text-rose-700",    badge: "bg-rose-600"    },
  high:     { label: "High",     ring: "ring-orange-200",  bg: "bg-orange-50",  text: "text-orange-700",  badge: "bg-orange-500"  },
  medium:   { label: "Medium",   ring: "ring-amber-200",   bg: "bg-amber-50",   text: "text-amber-700",   badge: "bg-amber-500"   },
};

// ── Country tab ──────────────────────────────────────────────────────────────
function CountryTab({
  country,
  active,
  onClick,
}: {
  country: VisaCountry;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 px-4 py-3 rounded-xl border-2 text-left transition-all min-w-[180px] ${
        active
          ? "border-indigo-500 bg-white shadow-md scale-[1.02]"
          : "border-gray-200 bg-white/60 hover:border-indigo-200 hover:bg-white"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">{country.flag}</span>
        <span className="font-semibold text-gray-900 text-sm">{country.country}</span>
      </div>
      <span className="text-[11px] text-gray-500 font-medium">{country.visaName}</span>
    </button>
  );
}

// ── Checked checklist item ───────────────────────────────────────────────────
function ChecklistRow({
  item,
  checked,
  onToggle,
}: {
  item: VisaChecklistItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border transition-colors ${
        checked
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-white border-gray-200 hover:border-indigo-200"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 mt-0.5"
        aria-label={checked ? "Mark as incomplete" : "Mark as complete"}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            checked
              ? "bg-emerald-500 border-emerald-500"
              : "bg-white border-gray-300 hover:border-indigo-400"
          }`}
        >
          {checked && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-semibold ${
            checked ? "text-emerald-900 line-through decoration-emerald-400/60" : "text-gray-900"
          }`}
        >
          {item.label}
        </p>
        <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.detail}</p>
        {item.risk && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-2.5 py-1.5">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>{item.risk}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Country name → code map for URL pre-fill ─────────────────────────────────
const COUNTRY_NAME_TO_CODE: Record<string, VisaCountryCode> = {
  usa: "USA", us: "USA", "united states": "USA",
  uk: "UK", "united kingdom": "UK", britain: "UK", england: "UK",
  canada: "CAN", ca: "CAN",
  australia: "AUS", au: "AUS", aus: "AUS",
  germany: "DEU", de: "DEU", deutschland: "DEU",
  ireland: "IRL", ie: "IRL",
  netherlands: "NLD", holland: "NLD", nl: "NLD",
  france: "FRA", fr: "FRA",
  "new zealand": "NZL", nz: "NZL",
  singapore: "SGP", sg: "SGP",
  malaysia: "MYS", my: "MYS",
  uae: "UAE", "united arab emirates": "UAE", dubai: "UAE",
};

// ── Main component ───────────────────────────────────────────────────────────
export default function VisaCoach() {
  const searchParams = useSearchParams();

  // Resolve country from URL (?country=USA or ?country=Germany)
  const initialCode: VisaCountryCode = useMemo(() => {
    const raw = (searchParams.get("country") || "").trim().toLowerCase();
    if (!raw) return "USA";
    // direct code match
    const direct = VISA_COUNTRY_LIST.find((c) => c.code.toLowerCase() === raw);
    if (direct) return direct.code;
    return COUNTRY_NAME_TO_CODE[raw] ?? "USA";
  }, [searchParams]);

  const [activeCode, setActiveCode] = useState<VisaCountryCode>(initialCode);
  const [checkedIds, setCheckedIds] = useState<Record<string, Set<string>>>({});

  // Optional: pre-filled budget from ROI Calculator (?funding=50000)
  const budgetUsd = useMemo(() => {
    const raw = searchParams.get("funding");
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [searchParams]);

  // Keep activeCode in sync if user navigates with a new ?country=...
  useEffect(() => {
    setActiveCode(initialCode);
  }, [initialCode]);

  const handlePrint = () => {
    if (typeof window !== "undefined") window.print();
  };

  const active = useMemo(
    () => VISA_COUNTRY_LIST.find((c) => c.code === activeCode)!,
    [activeCode],
  );

  const checkedSet = checkedIds[active.code] ?? new Set<string>();
  const toggle = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev[active.code] ?? new Set<string>());
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, [active.code]: next };
    });
  };

  // Group checklist items
  const grouped = useMemo(() => {
    const map = new Map<VisaChecklistItem["group"], VisaChecklistItem[]>();
    for (const item of active.checklist) {
      const arr = map.get(item.group) ?? [];
      arr.push(item);
      map.set(item.group, arr);
    }
    return map;
  }, [active]);

  const totalCount = active.checklist.length;
  const doneCount = [...checkedSet].filter((id) =>
    active.checklist.some((c) => c.id === id),
  ).length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Total first-year cost estimate
  const totalInitialCost =
    active.visaFee.amount +
    active.additionalFees.reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-8 visa-coach-root">
      {/* ── Easiest-Visa comparison (persistent top-of-page) ── */}
      <EasyVisaComparison activeCode={activeCode} onPick={setActiveCode} budgetUsd={budgetUsd} />

      {/* ── Country switcher ────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-xs font-bold uppercase tracking-widest text-indigo-600">
            Pick your destination
          </div>
          <div className="flex-1 h-px bg-gradient-to-r from-indigo-200 to-transparent" />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {VISA_COUNTRY_LIST.map((c) => (
            <CountryTab
              key={c.code}
              country={c}
              active={c.code === activeCode}
              onClick={() => setActiveCode(c.code)}
            />
          ))}
        </div>
      </div>

      {/* ── Hero card ────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-indigo-900 via-violet-900 to-indigo-950 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{active.flag}</span>
              <div>
                <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">
                  {active.country} · {active.visaCode}
                </p>
                <h2 className="text-2xl md:text-3xl font-extrabold mt-1">{active.visaName}</h2>
              </div>
            </div>
            <div className="flex items-center gap-2 print-hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-4 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/20 transition-colors"
                aria-label="Print or save as PDF"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
              <a
                href={active.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-indigo-900 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
              >
                Apply for Visa
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <p className="text-indigo-100 mt-5 leading-relaxed max-w-3xl">{active.tagline}</p>

          {budgetUsd > 0 && (
            <BudgetFitBanner
              budgetUsd={budgetUsd}
              financialFloor={active.financial.amount}
              currency={active.financial.currency}
            />
          )}

          {/* Headline stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-7">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                <Banknote className="w-3.5 h-3.5" /> Visa fee
              </div>
              <div className="mt-1 text-lg font-extrabold">
                {fmtMoney(active.visaFee.amount, active.visaFee.currency)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Financial proof
              </div>
              <div className="mt-1 text-lg font-extrabold">
                {active.financial.amount > 0
                  ? fmtMoney(active.financial.amount, active.financial.currency)
                  : "Per I-20 / CoE"}
              </div>
              {active.financial.coverMonths > 0 && (
                <div className="text-[10px] text-indigo-300 mt-0.5">
                  covers {active.financial.coverMonths} mo
                </div>
              )}
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Processing
              </div>
              <div className="mt-1 text-sm font-bold leading-tight">
                {active.processingTime.split(".")[0]}.
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-indigo-200 text-[10px] font-bold uppercase tracking-wider">
                <ListChecks className="w-3.5 h-3.5" /> Steps
              </div>
              <div className="mt-1 text-lg font-extrabold">
                {active.steps.length} steps · {active.checklist.length} docs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Fees breakdown ──────────────────────────────────── */}
      <section className="bg-white border-2 border-indigo-100 rounded-2xl p-6 md:p-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-emerald-600" /> Fees you'll actually pay
          </h3>
          <span className="text-xs text-gray-500">Sourced from official government pages</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-semibold text-gray-900 text-sm">Government visa fee</div>
              {active.visaFee.notes && (
                <div className="text-xs text-gray-600 mt-0.5">{active.visaFee.notes}</div>
              )}
            </div>
            <div className="font-extrabold text-gray-900">
              {fmtMoney(active.visaFee.amount, active.visaFee.currency)}
            </div>
          </div>
          {active.additionalFees.map((f, i) => (
            <div key={i} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{f.label}</div>
                {f.notes && <div className="text-xs text-gray-600 mt-0.5">{f.notes}</div>}
              </div>
              <div className="font-extrabold text-gray-900">{fmtMoney(f.amount, f.currency)}</div>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 px-4 bg-indigo-50 border border-indigo-200 rounded-lg mt-3">
            <div className="font-bold text-indigo-900 text-sm">
              Baseline up-front cost (before tuition/living)
            </div>
            <div className="font-extrabold text-indigo-900 text-lg">
              ~{fmtMoney(totalInitialCost, active.visaFee.currency)}
            </div>
          </div>
        </div>
      </section>

      {/* ── Financial proof deep-dive ───────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6 md:p-8">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Financial proof requirement</h3>
            <p className="text-sm text-emerald-900 font-semibold mt-0.5">{active.financial.label}</p>
          </div>
        </div>
        <p className="text-sm text-gray-800 leading-relaxed">{active.financial.notes}</p>
        <a
          href={active.financial.officialSource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs mt-3 hover:underline"
        >
          <BookOpen className="w-3.5 h-3.5" />
          Source: {active.financial.officialSource.label}
          <ExternalLink className="w-3 h-3" />
        </a>
      </section>

      {/* ── Step-by-step timeline ───────────────────────────── */}
      <section>
        <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-extrabold text-sm">
            1·2·3
          </span>
          Step-by-step application
        </h3>
        <div className="space-y-3">
          {active.steps.map((step) => (
            <div
              key={step.order}
              className="flex gap-4 p-5 bg-white border-2 border-gray-100 rounded-xl hover:border-indigo-200 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md">
                {step.order}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900">{step.title}</h4>
                <p className="text-sm text-gray-700 leading-relaxed mt-1.5">{step.detail}</p>
                {step.officialLink && (
                  <a
                    href={step.officialLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-xs mt-2 hover:underline"
                  >
                    {step.officialLink.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Document checklist ──────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" /> Document checklist
          </h3>
          <div className="flex items-center gap-3">
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-gray-700">
              {doneCount}/{totalCount} ({progressPct}%)
            </span>
          </div>
        </div>
        <div className="space-y-5">
          {[...grouped.entries()].map(([group, items]) => {
            const meta = GROUP_META[group];
            return (
              <div key={group}>
                <div
                  className={`inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider border px-3 py-1.5 rounded-full mb-3 ${meta.color}`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                  <span className="opacity-60">· {items.length}</span>
                </div>
                <div className="space-y-2.5">
                  {items.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      checked={checkedSet.has(item.id)}
                      onToggle={() => toggle(item.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Risk flags ──────────────────────────────────────── */}
      <section>
        <h3 className="text-lg font-extrabold text-gray-900 mb-5 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" /> Known risks & rejection triggers
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {active.risks.map((r, i) => {
            const s = SEVERITY_META[r.severity];
            return (
              <div
                key={i}
                className={`p-5 rounded-xl ring-1 ${s.ring} ${s.bg}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider text-white px-2 py-0.5 rounded ${s.badge}`}
                  >
                    {s.label}
                  </span>
                  <h4 className={`font-bold text-sm ${s.text}`}>{r.title}</h4>
                </div>
                <p className="text-xs text-gray-800 leading-relaxed">{r.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA + Official sources ───────────────────── */}
      <section className="grid md:grid-cols-3 gap-5">
        <a
          href={active.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="md:col-span-1 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow flex flex-col justify-between group"
        >
          <div>
            <div className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
              Ready when you are
            </div>
            <h4 className="text-xl font-extrabold mt-2">
              Apply for your {active.country} visa
            </h4>
            <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
              Takes you directly to the {active.applyUrlLabel}. Opens in a new tab.
            </p>
          </div>
          <div className="flex items-center gap-2 font-bold text-sm mt-5 group-hover:gap-3 transition-all">
            Start application <ArrowRight className="w-4 h-4" />
          </div>
        </a>
        <div className="md:col-span-2 bg-white border-2 border-gray-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h4 className="font-extrabold text-gray-900 text-sm uppercase tracking-wider">
              Official sources used
            </h4>
          </div>
          <p className="text-xs text-gray-600 mb-3 leading-relaxed">
            Every figure, deadline, and rule on this page links back to an official
            government page. Verify anything that matters before submission.
          </p>
          <p className="text-[11px] text-gray-500 mb-3">
            <span className="font-semibold text-gray-700">Last verified:</span>{" "}
            {VISA_DATA_LAST_VERIFIED}
          </p>
          <div className="grid sm:grid-cols-2 gap-1.5">
            {active.officialSources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-indigo-700 hover:underline py-1"
              >
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{s.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Legal disclaimer ────────────────────────────────── */}
      <p className="text-[11px] text-gray-500 leading-relaxed text-center max-w-3xl mx-auto">
        Visa rules and fees change often. eduvianAI sources every figure from official
        government pages, but the responsibility to verify the current requirement at the
        time of your application is yours. This tool is informational and not a substitute
        for legal advice from a registered migration agent or immigration lawyer.
      </p>

      {/* Print-optimised styles — browser Save-as-PDF produces a clean checklist */}
      <style jsx global>{`
        @media print {
          .print-hidden { display: none !important; }
          .visa-coach-root { font-size: 11pt; }
          .visa-coach-root a { color: #1e1b4b; text-decoration: none; }
          .visa-coach-root a[href]::after {
            content: " (" attr(href) ")";
            font-size: 8pt;
            color: #6b7280;
            word-break: break-all;
          }
          .visa-coach-root .shadow-xl,
          .visa-coach-root .shadow-lg,
          .visa-coach-root .shadow-md { box-shadow: none !important; }
          .visa-coach-root section { page-break-inside: avoid; }
          .visa-coach-root h2, .visa-coach-root h3 { page-break-after: avoid; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}

// ── Budget-fit banner (uses ?funding=… from URL, e.g. from ROI Calculator) ──
function BudgetFitBanner({
  budgetUsd,
  financialFloor,
  currency,
}: {
  budgetUsd: number;
  financialFloor: number;
  currency: string;
}) {
  // Rough FX just for the comparison prompt
  const FX: Record<string, number> = {
    USD: 1, GBP: 1.27, EUR: 1.08, CAD: 0.72, AUD: 0.65, NZD: 0.60,
    SGD: 0.74, MYR: 0.22, AED: 0.27,
  };
  if (financialFloor === 0) {
    return (
      <div className="mt-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-xs text-indigo-100">
        You indicated a funding pool of{" "}
        <span className="font-bold text-white">${budgetUsd.toLocaleString()}</span>. This
        destination does not publish a government minimum; the institution verifies funding.
      </div>
    );
  }
  const floorUsd = Math.round(financialFloor * (FX[currency] ?? 1));
  const ratio = budgetUsd / floorUsd;
  const pass = ratio >= 1;
  const tight = ratio >= 0.8 && ratio < 1;
  const label = pass ? "You clear the bar ✓" : tight ? "Marginal" : "Below minimum";
  const colour = pass ? "bg-emerald-500" : tight ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="mt-5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap text-xs">
      <span className={`inline-flex items-center gap-1 text-white font-bold px-2 py-0.5 rounded ${colour}`}>
        {label}
      </span>
      <span className="text-indigo-100">
        Your funding: <span className="font-semibold text-white">${budgetUsd.toLocaleString()}</span>
        {" · "}Required: <span className="font-semibold text-white">≈ ${floorUsd.toLocaleString()}</span>
        {" · "}Ratio: <span className="font-semibold text-white">{Math.round(ratio * 100)}%</span>
      </span>
    </div>
  );
}

// ── Easiest-Visa comparison (ranked grid of all countries) ─────────────────
function EasyVisaComparison({
  activeCode,
  onPick,
  budgetUsd,
}: {
  activeCode: VisaCountryCode;
  onPick: (code: VisaCountryCode) => void;
  budgetUsd: number;
}) {
  // Optionally filter "affordable for me" list from URL funding param
  const [view, setView] = useState<"all" | "affordable">("all");

  const rows = useMemo(() => {
    const base = VISA_COMPLEXITY_RANKED;
    if (view === "affordable" && budgetUsd > 0) {
      return base.filter((r) => r.financialFloorUsd === 0 || r.financialFloorUsd <= budgetUsd);
    }
    return base;
  }, [view, budgetUsd]);

  return (
    <section className="bg-white border-2 border-indigo-100 rounded-2xl p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-2">
            <Trophy className="w-3.5 h-3.5" />
            Easiest → Hardest visas
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">
            Compare all 12 destinations at a glance
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Ranked by a weighted blend of financial floor, critical-risk count, document burden,
            and processing time. Lower score = easier.
          </p>
        </div>
        {budgetUsd > 0 && (
          <div className="flex rounded-xl bg-gray-100 p-1">
            <button
              onClick={() => setView("all")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                view === "all" ? "bg-white shadow text-gray-900" : "text-gray-600"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setView("affordable")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                view === "affordable" ? "bg-white shadow text-gray-900" : "text-gray-600"
              }`}
            >
              Fit my ${budgetUsd.toLocaleString()}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-2 px-2 print-hidden-scroll">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <th className="py-2 pr-3">#</th>
              <th className="py-2 pr-3">Country</th>
              <th className="py-2 pr-3">Visa</th>
              <th className="py-2 pr-3 text-right">Funds (USD)</th>
              <th className="py-2 pr-3 text-right">Critical risks</th>
              <th className="py-2 pr-3 text-right">Docs</th>
              <th className="py-2 pr-3 text-right">Processing</th>
              <th className="py-2 pr-3 text-right">Complexity</th>
              <th className="py-2 pr-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const active = r.country.code === activeCode;
              const cx =
                r.complexity < 35
                  ? "bg-emerald-500"
                  : r.complexity < 60
                  ? "bg-amber-500"
                  : "bg-rose-500";
              return (
                <tr
                  key={r.country.code}
                  onClick={() => onPick(r.country.code)}
                  className={`border-b border-gray-100 cursor-pointer transition-colors ${
                    active ? "bg-indigo-50" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="py-2.5 pr-3 text-gray-400 font-mono text-xs">{i + 1}</td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.country.flag}</span>
                      <span className={`font-semibold ${active ? "text-indigo-700" : "text-gray-900"}`}>
                        {r.country.country}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-gray-600">{r.country.visaCode}</td>
                  <td className="py-2.5 pr-3 text-right text-xs font-semibold text-gray-800">
                    {r.financialFloorUsd === 0 ? (
                      <span className="text-gray-400">Per school</span>
                    ) : (
                      `$${r.financialFloorUsd.toLocaleString()}`
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-xs text-gray-800">
                    {r.criticalRiskCount}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-xs text-gray-800">
                    {r.documentCount}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-xs text-gray-800">
                    ~{r.processingWeeks}w
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${cx}`}
                          style={{ width: `${r.complexity}%` }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 w-8 text-right">
                        {r.complexity}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    {active ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-gray-300" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-500 mt-3 leading-relaxed">
        Complexity = 40% funds floor + 25% critical risks + 15% document burden + 20% processing
        time. A rough heuristic for comparison; every student's case is individual.
      </p>
    </section>
  );
}

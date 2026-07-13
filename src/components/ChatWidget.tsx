"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import type { ScoredProgram } from "@/lib/types";

/**
 * Minimal inline rich-text renderer for AISA replies. The chat bubble
 * has no full markdown parser — we only recognise two emphasis tokens:
 *   __underline__  → <u>...</u>     (preferred — key term highlight)
 *   **bold**       → <strong>...</strong>  (fallback if the model insists)
 * Everything else (newlines, em-dash bullets, numbered lists) is plain
 * text inside whitespace-pre-wrap. Splitting is done in a single pass
 * across the two patterns so we don't double-wrap.
 */
function renderRich(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /__([^_\n]+?)__|\*\*([^*\n]+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(<u key={`u${i++}`} className="underline decoration-2 underline-offset-2 decoration-indigo-400">{m[1]}</u>);
    } else if (m[2] !== undefined) {
      out.push(<strong key={`b${i++}`}>{m[2]}</strong>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Routes where the verbose "Stuck? Ask AISA" pill competes with action
// bars (compare strip, ROI panel, etc.). On these routes we collapse the
// trigger to an icon-only 48px circle, with an idle-pulse animation
// after 30 s of no user activity so AISA stays discoverable.
const COMPACT_PATH_PREFIXES = [
  "/results",
  "/application-check",
  "/sop-assistant",
  "/lor-coach",
  "/visa-coach",
  "/roi-calculator",
  "/parent-decision",
  "/interview-prep",
  "/english-test-lab",
  "/application-tracker",
];

interface Message {
  role: "user" | "assistant";
  content: string;
  needsContact?: boolean; // flag stripped from __NEED_CONTACT__ marker
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Find programs under ₹40L total cost",
  "Compare UK vs Germany for AI / Data Science",
  "What documents do I need for a US student visa?",
  "Which countries offer scholarships for Master's?",
];

const RESULTS_SUGGESTED_QUESTIONS = [
  "Tell me more about my Safe matches",
  "Compare the tuition costs of my top matches",
  "Which of my matched programs offer scholarships?",
  "Explain my best match to my parents",
];

function buildProgramsContext(programs: ScoredProgram[], studentName: string): string {
  const safe      = programs.filter((p) => p.tier === "safe");
  const reach     = programs.filter((p) => p.tier === "reach");
  const ambitious = programs.filter((p) => p.tier === "ambitious");

  // Null-safe formatters: many verified entries have null tuition/cost/intake
  // (the official page didn't state a value) — never call .toLocaleString() or
  // .join() on them directly or the entire ChatWidget crashes client-side.
  const usd = (n: number | null | undefined) => (typeof n === "number" ? `$${n.toLocaleString()}` : "—");
  const intake = (a: string[] | null | undefined) => (a && a.length ? a.join("/") : "—");
  const fmt = (p: ScoredProgram) =>
    `  - ${p.program_name} @ ${p.university_name} (${p.city}, ${p.country}) | QS #${p.qs_ranking ?? "N/A"} | Match: ${p.match_score}% | Tuition: ${usd(p.annual_tuition_usd)}/yr | Living: ${usd(p.avg_living_cost_usd)}/yr | Field: ${p.field_of_study} | Deadline: ${p.application_deadline ?? "Rolling"} | Intake: ${intake(p.intake_semesters)}`;

  return `
=== ${studentName.toUpperCase()}'S MATCHED PROGRAMS ===
The student is currently viewing their personalised TOP ${programs.length} shortlist. Answer questions about these specific programs using only the data below.

SAFE MATCHES (${safe.length}):
${safe.map(fmt).join("\n") || "  None"}

REACH MATCHES (${reach.length}):
${reach.map(fmt).join("\n") || "  None"}

AMBITIOUS MATCHES (${ambitious.length}):
${ambitious.map(fmt).join("\n") || "  None"}
`;
}

// AISA — sleek abstract AI mark (neural spark on indigo gradient)
function AisaAvatar({ size = 36, className = "" }: { size?: number; className?: string }) {
  const id = "ag" + size; // unique gradient id per size
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="20" cy="20" r="20" fill={`url(#${id})`} />
      {/* Neural node ring */}
      <circle cx="20" cy="20" r="9.5" stroke="white" strokeWidth="1" strokeOpacity="0.25" fill="none" />
      {/* 4-point sparkle — vertical */}
      <line x1="20" y1="8" x2="20" y2="32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
      {/* 4-point sparkle — horizontal */}
      <line x1="8" y1="20" x2="32" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
      {/* Diagonal accents — softer */}
      <line x1="13" y1="13" x2="27" y2="27" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.35"/>
      <line x1="27" y1="13" x2="13" y2="27" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeOpacity="0.35"/>
      {/* Center dot */}
      <circle cx="20" cy="20" r="2.5" fill="white"/>
      {/* Cardinal tip dots */}
      <circle cx="20" cy="8.5" r="1.8" fill="white" fillOpacity="0.95"/>
      <circle cx="20" cy="31.5" r="1.8" fill="white" fillOpacity="0.95"/>
      <circle cx="8.5" cy="20" r="1.8" fill="white" fillOpacity="0.95"/>
      <circle cx="31.5" cy="20" r="1.8" fill="white" fillOpacity="0.95"/>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1"/>
          <stop offset="1" stopColor="#A855F7"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// ── Inline contact capture form ───────────────────────────────────────────────
interface ContactFormProps {
  lastQuestion: string;
  onSubmitted: () => void;
}

function ContactForm({ lastQuestion, onSubmitted }: ContactFormProps) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy,  setBusy]  = useState(false);
  const [done,  setDone]  = useState(false);
  const [err,   setErr]   = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setErr("Please enter your email."); return; }
    setBusy(true); setErr("");
    try {
      await fetch("/api/chat/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, question: lastQuestion }),
      });
      setDone(true);
      setTimeout(onSubmitted, 2500);
    } catch {
      setErr("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-700 font-medium">
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        Got it! An advisor will reach out to you shortly.
      </div>
    );
  }

  return (
    <form onSubmit={submit}
      className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2.5 text-sm">
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Leave your details</p>
      <input
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-gray-800 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        type="email" required
        value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address *"
        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-gray-800 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      <input
        type="tel"
        value={phone} onChange={(e) => setPhone(e.target.value)}
        placeholder="Contact number"
        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-gray-800 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      {err && <p className="text-xs text-rose-500">{err}</p>}
      <button type="submit" disabled={busy}
        className="w-full py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
        {busy ? "Sending…" : "Send — we'll be in touch shortly ✉️"}
      </button>
    </form>
  );
}

// ── Main widget ───────────────────────────────────────────────────────────────
interface ChatWidgetProps {
  programs?: ScoredProgram[];
  studentName?: string;
}

export default function ChatWidget({ programs, studentName = "there" }: ChatWidgetProps) {
  const hasPrograms    = programs && programs.length > 0;
  const programsContext = hasPrograms ? buildProgramsContext(programs, studentName) : undefined;

  const greeting = hasPrograms
    ? `Hello ${studentName}! 👋 I'm AISA, your AI student advisor.\n\nI can see your TOP ${programs.length} matched programs! Ask me anything about them — tuition, deadlines, scholarships, or how to compare your Safe vs Reach options.`
    : "Hello! 👋 I'm AISA, your AI student advisor.\n\nAsk me anything about universities, scholarships, visa requirements, costs, or application tips — I'm here to help you make the right study-abroad decision!";

  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: greeting }]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  // track the last user question so the contact form can include it
  const lastUserQuestion = useRef("");
  const bottomRef  = useRef<HTMLDivElement>(null);

  // Path-aware compact mode + 30 s idle pulse for the floating trigger.
  const pathname = usePathname();
  const compact  = pathname ? COMPACT_PATH_PREFIXES.some((p) => pathname.startsWith(p)) : false;
  const [pulse, setPulse] = useState(false);

  // Reset idle timer on any user activity; fire pulse after 30 s of no
  // activity, then clear after the bounce finishes (~2 s) so it doesn't
  // animate forever and become wallpaper noise.
  useEffect(() => {
    if (open) { setPulse(false); return; }
    let idleTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    const reset = () => {
      setPulse(false);
      clearTimeout(idleTimer); clearTimeout(clearTimer);
      idleTimer = setTimeout(() => {
        setPulse(true);
        clearTimer = setTimeout(() => setPulse(false), 2400);
      }, 30_000);
    };
    const events: Array<keyof DocumentEventMap> = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    for (const e of events) document.addEventListener(e, reset, { passive: true });
    reset();
    return () => {
      clearTimeout(idleTimer); clearTimeout(clearTimer);
      for (const e of events) document.removeEventListener(e, reset);
    };
  }, [open]);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    lastUserQuestion.current = content;

    const userMsg: Message = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    // Reset the auto-resized textarea to a single line on send.
    if (inputRef.current) inputRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          programsContext,
        }),
      });
      const data = await res.json();
      const raw: string = data.message ?? (data.error || "Sorry, I ran into an issue. Please try again.");

      // Detect and strip the __NEED_CONTACT__ marker
      const needsContact = raw.includes("__NEED_CONTACT__");
      const cleaned = raw.replace("__NEED_CONTACT__", "").trim();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: cleaned, needsContact },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't connect right now. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const SUGGESTED = hasPrograms ? RESULTS_SUGGESTED_QUESTIONS : DEFAULT_SUGGESTED_QUESTIONS;
  const showSuggestions = messages.length === 1 && messages[0].role === "assistant";

  // When contact form is submitted, replace the needsContact flag so form disappears
  const markContactDone = (index: number) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === index ? { ...m, needsContact: false } : m))
    );
  };

  return (
    <>
      {/* Floating trigger — verbose pill on landing-style pages, icon-only
          on tool / results pages where action bars compete for the same
          corner. After 30 s idle, runs a gentle bounce so AISA stays
          discoverable in compact mode. */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        // Labelled pill in EVERY mode (10 July 2026, user feedback: an
        // unlabelled avatar circle doesn't read as a chat entry point).
        // Mobile + compact pages show "Ask AISA"; sm+ non-compact keeps
        // the longer "Stuck? Ask AISA". min-h keeps the 44px touch target.
        className="fixed bottom-5 right-5 z-50 flex items-center justify-center gap-1.5 pl-2 pr-3.5 min-h-[44px] rounded-full bg-blue-900 hover:bg-blue-800 text-white font-bold shadow-lg shadow-blue-950/40 hover:shadow-blue-950/60 transition-all duration-300 hover:-translate-y-1"
        whileTap={{ scale: 0.95 }}
        animate={!open && pulse ? { y: [0, -8, 0, -4, 0] } : { y: 0 }}
        transition={!open && pulse ? { duration: 1.4, repeat: 0 } : { duration: 0.2 }}
        aria-label="Stuck? Ask AISA"
        title="Stuck? Ask AISA"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
              className="w-7 h-7 flex items-center justify-center">
              <X className="w-4 h-4" />
            </motion.span>
          ) : (
            <motion.span key="avatar"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
              <AisaAvatar size={24} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && (
          <span className="text-[11px] font-bold whitespace-nowrap">
            {!compact && <span className="hidden sm:inline">Stuck? </span>}
            Ask AISA
          </span>
        )}
        {!open && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] flex flex-col bg-white rounded-3xl shadow-2xl shadow-slate-300/60 border border-gray-100 overflow-hidden"
            style={{ height: "540px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-[#0F172A] flex-shrink-0">
              <AisaAvatar size={40} />
              <div>
                <p className="font-bold text-white text-sm leading-tight">AISA</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-blue-200 text-xs">AI Student Advisor · Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="ml-auto p-1.5 rounded-xl hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Trust frame — non-dismissible, always visible above messages */}
            <div className="flex-shrink-0 px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-start gap-2">
              <span className="text-amber-700 text-[11px] mt-0.5 flex-shrink-0">ⓘ</span>
              <p className="text-[11px] text-amber-900 leading-snug">
                AISA answers from EduvianAI&apos;s verified program data where available. For admissions, fees, scholarships and visa rules, check the linked official source before committing.
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3 bg-gray-50/50">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <AisaAvatar size={28} className="flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex flex-col gap-2 max-w-[82%]">
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-indigo-500 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                    }`}>
                      {m.role === "assistant" ? renderRich(m.content) : m.content}
                    </div>
                    {/* Inline contact form — shown when AISA can't answer */}
                    {m.needsContact && (
                      <ContactForm
                        lastQuestion={lastUserQuestion.current}
                        onSubmitted={() => markContactDone(i)}
                      />
                    )}
                  </div>
                </div>
              ))}

              {/* Suggested questions */}
              {showSuggestions && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-gray-400 px-1">Try asking:</p>
                  {SUGGESTED.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="w-full text-left px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-600 text-xs font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <AisaAvatar size={28} className="flex-shrink-0" />
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100">
              <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize up to 5 lines (~120px). Beyond that, scroll
                    // inside the textarea — keeps the chat input compact.
                    const el = e.target;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                  onKeyDown={handleKey}
                  placeholder="Ask AISA anything about studying abroad…  (Shift+Enter for newline)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none resize-none overflow-y-auto leading-snug py-1.5"
                  style={{ maxHeight: 120 }}
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500 disabled:bg-gray-200 flex items-center justify-center transition-colors hover:bg-indigo-600 mb-1"
                  aria-label="Send"
                >
                  {loading
                    ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                    : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                AISA · Study abroad queries only · Powered by eduvianAI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

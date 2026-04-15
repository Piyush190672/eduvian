"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, CheckCircle2 } from "lucide-react";
import type { ScoredProgram } from "@/lib/types";

interface Message {
  role: "user" | "assistant";
  content: string;
  needsContact?: boolean; // flag stripped from __NEED_CONTACT__ marker
}

const DEFAULT_SUGGESTED_QUESTIONS = [
  "Which countries are best for MS in Computer Science?",
  "What GRE score do I need for US universities?",
  "How do I get a scholarship for studying in the UK?",
  "What's the cost of studying in Germany?",
];

const RESULTS_SUGGESTED_QUESTIONS = [
  "Tell me more about my Safe matches",
  "Which of my matched programs offer scholarships?",
  "Compare the tuition costs of my top matches",
  "What are the application deadlines for my Reach programs?",
];

function buildProgramsContext(programs: ScoredProgram[], studentName: string): string {
  const safe      = programs.filter((p) => p.tier === "safe");
  const reach     = programs.filter((p) => p.tier === "reach");
  const ambitious = programs.filter((p) => p.tier === "ambitious");

  const fmt = (p: ScoredProgram) =>
    `  - ${p.program_name} @ ${p.university_name} (${p.city}, ${p.country}) | QS #${p.qs_ranking ?? "N/A"} | Match: ${p.match_score}% | Tuition: $${p.annual_tuition_usd.toLocaleString()}/yr | Living: $${p.avg_living_cost_usd.toLocaleString()}/yr | Field: ${p.field_of_study} | Deadline: ${p.application_deadline ?? "Rolling"} | Intake: ${p.intake_semesters.join("/")}`;

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

// AISA smiling female AI avatar
function AisaAvatar({ size = 36, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="20" cy="20" r="20" fill="url(#aisaGrad)" />
      <ellipse cx="20" cy="13" rx="9" ry="8" fill="#4B3621" />
      <ellipse cx="11.5" cy="17" rx="2.5" ry="5" fill="#4B3621" />
      <ellipse cx="28.5" cy="17" rx="2.5" ry="5" fill="#4B3621" />
      <ellipse cx="20" cy="20" rx="8" ry="9" fill="#FDDBB4" />
      <ellipse cx="16.5" cy="18.5" rx="1.4" ry="1.6" fill="#3B2314" />
      <ellipse cx="23.5" cy="18.5" rx="1.4" ry="1.6" fill="#3B2314" />
      <circle cx="17.2" cy="17.9" r="0.5" fill="white" />
      <circle cx="24.2" cy="17.9" r="0.5" fill="white" />
      <path d="M16 23 Q20 26.5 24 23" stroke="#C0724A" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <ellipse cx="13.5" cy="22" rx="2" ry="1.2" fill="#F4A79D" opacity="0.5" />
      <ellipse cx="26.5" cy="22" rx="2" ry="1.2" fill="#F4A79D" opacity="0.5" />
      <path d="M13 36 Q20 31 27 36" fill="#6366F1" />
      <defs>
        <linearGradient id="aisaGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#A78BFA" />
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
  const inputRef   = useRef<HTMLInputElement>(null);

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
      {/* Floating trigger */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pl-2 pr-5 py-2 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white font-bold shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 transition-all duration-300 hover:-translate-y-1"
        whileTap={{ scale: 0.95 }}
        aria-label="Chat with AISA"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close"
              initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}
              className="w-8 h-8 flex items-center justify-center">
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span key="avatar"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }} transition={{ duration: 0.15 }}>
              <AisaAvatar size={36} />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-sm">Chat with AISA</span>
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
            className="fixed bottom-24 right-6 z-50 w-[370px] max-w-[calc(100vw-24px)] flex flex-col bg-white rounded-3xl shadow-2xl shadow-indigo-200/60 border border-gray-100 overflow-hidden"
            style={{ height: "540px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
              <AisaAvatar size={40} />
              <div>
                <p className="font-bold text-white text-sm leading-tight">AISA</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-indigo-200 text-xs">AI Student Advisor · Online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="ml-auto p-1.5 rounded-xl hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
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
                      {m.content}
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
              <div className="flex items-center gap-2 bg-gray-50 rounded-2xl border border-gray-200 px-4 py-2.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                <input ref={inputRef} value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask AISA anything about studying abroad…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  disabled={loading}
                />
                <button onClick={() => send()} disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500 disabled:bg-gray-200 flex items-center justify-center transition-colors hover:bg-indigo-600">
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

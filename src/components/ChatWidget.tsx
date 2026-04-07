"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, GraduationCap, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Which countries are best for MS in Computer Science?",
  "What GRE score do I need for US universities?",
  "How do I get a scholarship for studying in the UK?",
  "What's the cost of studying in Germany?",
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm your eduvianAI study-abroad advisor. Ask me anything about universities, programs, scholarships, visas, or application tips!\n\nWhat's on your mind?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I ran into an issue. Please try again.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't connect. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const showSuggestions =
    messages.length === 1 && messages[0].role === "assistant";

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all duration-300 hover:-translate-y-1"
        whileTap={{ scale: 0.95 }}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="w-5 h-5" />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="text-sm">Chat with us</span>
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
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col bg-white rounded-3xl shadow-2xl shadow-indigo-200/60 border border-gray-100 overflow-hidden"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">eduvianAI Advisor</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <p className="text-indigo-200 text-xs">Study abroad specialist</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto p-1.5 rounded-xl hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50/50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {m.role === "assistant" && (
                    <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-indigo-500 text-white rounded-tr-sm"
                        : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Suggested questions (only before first user message) */}
              {showSuggestions && (
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-gray-400 px-1">Try asking:</p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => send(q)}
                      className="w-full text-left px-3.5 py-2 rounded-xl bg-white border border-indigo-100 text-indigo-600 text-xs font-medium hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-7 h-7 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
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
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about universities, visas, scholarships…"
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  disabled={loading}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 w-8 h-8 rounded-xl bg-indigo-500 disabled:bg-gray-200 flex items-center justify-center transition-colors hover:bg-indigo-600"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              </div>
              <p className="text-center text-xs text-gray-400 mt-2">
                Study abroad queries only · Powered by eduvianAI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

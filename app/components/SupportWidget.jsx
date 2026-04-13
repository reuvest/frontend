"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  MessageCircle, X, Send, Paperclip, ChevronDown,
  Ticket, Bot, User, Loader2, Sparkles, FileText,
  HelpCircle, ExternalLink, CheckCircle, AlertCircle,
} from "lucide-react";
import { sendChatMessage, createTicket, fetchFaqs } from "../../services/supportService";
import Link from "next/link";
import toast from "react-hot-toast";

/* ── Constants ─────────────────────────────────────────────────────────────── */
const TABS = ["chat", "faq", "ticket"];

const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";

const FAQ_PREVIEWS = [
  "How do I fund my wallet?",
  "How do I complete KYC?",
  "How long do withdrawals take?",
  "How do I reset my transaction PIN?",
];

const TICKET_CATEGORIES = [
  { value: "account",    label: "Account & Profile" },
  { value: "payment",    label: "Deposits & Payments" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "kyc",        label: "KYC Verification" },
  { value: "investment", label: "Land & Investment" },
  { value: "other",      label: "Other" },
];

const statusCfg = (s = "") => {
  if (s === "open")     return { cls: "bg-amber-500/15 text-amber-400 border-amber-500/25",   dot: "bg-amber-400"   };
  if (s === "waiting")  return { cls: "bg-blue-500/15 text-blue-400 border-blue-500/25",      dot: "bg-blue-400"    };
  if (s === "resolved") return { cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400" };
  return                       { cls: "bg-white/10 text-white/40 border-white/15",            dot: "bg-white/30"    };
};

/* ── Shared input style ────────────────────────────────────────────────────── */
const inp = "w-full bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/20 " +
            "rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 " +
            "focus:ring-amber-500/20 transition-all";

const sel = inp + " appearance-none cursor-pointer";

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function SupportWidget() {
  const { user } = useAuth();
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState("chat");
  const [pulse, setPulse]   = useState(true);

  // Stop pulse after first open
  useEffect(() => {
    if (open) setPulse(false);
  }, [open]);

  // Guests see a minimal bubble that opens a contact form (no AI chat / ticket tracking)
  if (!user) return <GuestSupportBubble />;

  return (
    <>
      {/* Floating bubble */}
      <div className="fixed bottom-6 right-6 z-9999" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Open support"
            className="relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
          >
            <MessageCircle size={24} className="text-[#0D1F1A]" />
            {pulse && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0D1F1A] animate-ping" />
            )}
            {pulse && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#0D1F1A]" />
            )}
          </button>
        )}

        {/* Panel */}
        {open && (
          <div
            className="w-90 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: "#0b1e17",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "min(560px, calc(100vh - 100px))",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8"
              style={{ background: "linear-gradient(135deg, rgba(200,135,58,0.15), rgba(232,168,80,0.08))" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
                  <Sparkles size={14} className="text-[#0D1F1A]" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-none">{appname} Support</p>
                  <p className="text-white/30 text-xs mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online · Replies instantly
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/support" onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all"
                  title="Open full support page">
                  <ExternalLink size={13} />
                </Link>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/8">
              {[
                { id: "chat",   icon: <Bot size={13} />,      label: "AI Chat"  },
                { id: "faq",    icon: <HelpCircle size={13} />, label: "FAQ"    },
                { id: "ticket", icon: <Ticket size={13} />,   label: "Ticket"   },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all ${
                    tab === t.id
                      ? "text-amber-500 border-b-2 border-amber-500"
                      : "text-white/30 hover:text-white/60"
                  }`}
                  style={{ marginBottom: tab === t.id ? "-1px" : 0 }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {tab === "chat"   && <ChatTab user={user} onEscalate={() => setTab("ticket")} />}
              {tab === "faq"    && <FaqTab />}
              {tab === "ticket" && <TicketTab user={user} />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Chat Tab ──────────────────────────────────────────────────────────────── */
function ChatTab({ user, onEscalate }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your ${appname} assistant. Ask me anything about your account, investments, or payments.`,
    },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg = { role: "user", content };
    const next    = [...messages, userMsg];
    setMessages(next);
    setLoading(true);

    try {
      // Only send last 10 messages to keep payload small
      const history = next.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const reply   = await sendChatMessage(history);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I ran into an issue. Please try again or submit a ticket.",
        isError: true,
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, messages, loading]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Quick replies */}
      <div className="px-3 pt-2.5 pb-1 flex gap-1.5 flex-wrap border-b border-white/5">
        {FAQ_PREVIEWS.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 text-white/40 hover:text-amber-400 hover:border-amber-500/30 transition-all bg-white/3">
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              m.role === "user"
                ? "text-[#0D1F1A]"
                : "bg-white/8 border border-white/10 text-amber-500"
            }`} style={m.role === "user" ? { background: "linear-gradient(135deg,#C8873A,#E8A850)" } : {}}>
              {m.role === "user" ? <User size={11} /> : <Bot size={11} />}
            </div>
            {/* Bubble */}
            <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
              m.role === "user"
                ? "text-[#0D1F1A] rounded-tr-sm"
                : m.isError
                  ? "bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm"
                  : "bg-white/8 border border-white/8 text-white/80 rounded-tl-sm"
            }`} style={m.role === "user" ? { background: "linear-gradient(135deg,#C8873A,#E8A850)" } : {}}>
              {m.content}
              {m.isError && (
                <button onClick={onEscalate}
                  className="mt-2 block text-[10px] font-bold text-amber-500 hover:text-amber-400">
                  Submit a ticket instead →
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-amber-500">
              <Bot size={11} />
            </div>
            <div className="bg-white/8 border border-white/8 rounded-2xl rounded-tl-sm px-3 py-2.5 flex gap-1 items-center">
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Escalate hint */}
      <div className="px-3 pb-1">
        <button onClick={onEscalate}
          className="text-[10px] text-white/20 hover:text-amber-500 transition-colors">
          Need human support? Submit a ticket →
        </button>
      </div>

      {/* Input */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex gap-2 items-end">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Type a message…" rows={1}
            className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/20 rounded-xl px-3.5 py-2.5 text-xs resize-none focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            style={{ maxHeight: 80 }}
          />
          <button onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#0D1F1A] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 shrink-0"
            style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ Tab ───────────────────────────────────────────────────────────────── */
function FaqTab() {
  const [faqs, setFaqs]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchFaqs()
      .then(setFaqs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={20} className="text-amber-500 animate-spin" />
    </div>
  );

  const allFaqs = Object.values(faqs).flat();

  if (!allFaqs.length) return (
    <div className="flex-1 flex items-center justify-center text-white/20 text-xs">
      No FAQs available yet.
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
      {allFaqs.map((f, i) => (
        <div key={f.id ?? i} className="rounded-xl border border-white/8 overflow-hidden bg-white/3">
          <button onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between px-3.5 py-3 text-left gap-2">
            <span className="text-xs font-semibold text-white/70 leading-snug">{f.question}</span>
            <ChevronDown size={13} className={`text-white/30 shrink-0 transition-transform ${expanded === i ? "rotate-180" : ""}`} />
          </button>
          {expanded === i && (
            <div className="px-3.5 pb-3 text-xs text-white/40 leading-relaxed border-t border-white/5 pt-2.5">
              {f.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Ticket Tab ────────────────────────────────────────────────────────────── */
function TicketTab({ user }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState({ subject: "", category: "", message: "", priority: "normal" });
  const [file, setFile]           = useState(null);
  const fileRef                   = useRef(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.category || !form.message) return;
    setLoading(true);
    try {
      await createTicket({ ...form, attachment: file });
      setSubmitted(true);
      toast.success("Ticket submitted! We'll reply within 24 hours.");
    } catch {
      toast.error("Failed to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <CheckCircle size={24} className="text-emerald-400" />
      </div>
      <div>
        <p className="font-bold text-white text-sm">Ticket submitted!</p>
        <p className="text-white/30 text-xs mt-1">We'll respond to your email within 24 hours.</p>
      </div>
      <Link href="/support" className="text-xs text-amber-500 hover:text-amber-400 font-semibold">
        Track your ticket →
      </Link>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Subject */}
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Subject</label>
          <input name="subject" value={form.subject} onChange={handleChange}
            placeholder="Brief description of your issue" required
            className={inp + " text-xs py-2.5"} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Category</label>
          <div className="relative">
            <select name="category" value={form.category} onChange={handleChange} required
              className={sel + " text-xs py-2.5"}>
              <option value="" disabled>Select a category</option>
              {TICKET_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange}
            placeholder="Describe your issue in detail…" rows={4} required
            className={inp + " text-xs py-2.5 resize-none"} />
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">
            Attachment <span className="normal-case font-normal">(optional, max 5MB)</span>
          </label>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-amber-500/30 text-white/30 hover:text-amber-400 text-xs transition-all bg-white/2">
            <Paperclip size={12} />
            {file ? file.name : "Attach screenshot or file"}
          </button>
          <input ref={fileRef} type="file" className="hidden"
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files?.[0] || null)} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-xs text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
          {loading ? <><Loader2 size={13} className="animate-spin" /> Submitting…</> : <><Send size={13} /> Submit Ticket</>}
        </button>
      </form>
    </div>
  );
}

/* -- Guest Support Bubble (shown when not logged in) ----------------------- */
const GUEST_CATEGORIES = [
  { value: "account",    label: "Account & Login" },
  { value: "payment",    label: "Payments" },
  { value: "other",      label: "General Enquiry" },
];

function GuestSupportBubble() {
  const [open, setOpen]         = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [reference, setReference] = useState("");
  const [file, setFile]         = useState(null);
  const fileRef                 = useRef(null);
  const [form, setForm]         = useState({
    name: "", email: "", subject: "", category: "", message: "",
  });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createGuestTicket({ ...form, attachment: file });
      setReference(res.reference);
      setSubmitted(true);
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-9999" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {!open && (
        <button onClick={() => setOpen(true)} aria-label="Contact support"
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
          <MessageCircle size={24} className="text-[#0D1F1A]" />
        </button>
      )}

      {open && (
        <div className="w-85 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ background: "#0b1e17", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "min(520px, calc(100vh - 100px))" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8"
            style={{ background: "linear-gradient(135deg, rgba(200,135,58,0.15), rgba(232,168,80,0.08))" }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
                <Sparkles size={14} className="text-[#0D1F1A]" />
              </div>
              <div>
                <p className="text-white text-sm font-bold leading-none">Contact Support</p>
                <p className="text-white/30 text-xs mt-0.5">We respond within 24 hours</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-all">
              <X size={14} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Message received!</p>
                  <p className="text-white/30 text-xs mt-1">We'll reply to your email within 24 hours.</p>
                  {reference && (
                    <p className="text-amber-500/70 text-xs mt-2 font-mono">Ref: {reference}</p>
                  )}
                </div>
                <p className="text-xs text-white/20 mt-1">
                  Have an account?{" "}
                  <Link href="/login" className="text-amber-500 hover:text-amber-400">Sign in</Link>
                  {" "}to track your ticket.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs text-white/30 mb-3">
                  Not logged in?{" "}
                  <Link href="/login" className="text-amber-500 hover:text-amber-400">Sign in</Link>
                  {" "}for AI chat & ticket tracking.
                </p>

                {/* Name + Email */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      placeholder="Your name" className={inp + " text-xs py-2.5"} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="you@email.com" className={inp + " text-xs py-2.5"} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Topic</label>
                  <div className="relative">
                    <select name="category" value={form.category} onChange={handleChange} required
                      className={sel + " text-xs py-2.5"}>
                      <option value="" disabled>Select topic</option>
                      {GUEST_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange} required
                    placeholder="Brief summary" className={inp + " text-xs py-2.5"} />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required
                    rows={3} placeholder="Describe your issue…"
                    className={inp + " text-xs py-2.5 resize-none"} />
                </div>

                {/* Attachment */}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-amber-500/30 text-white/30 hover:text-amber-400 text-xs transition-all">
                  <Paperclip size={12} />
                  {file ? file.name : "Attach screenshot (optional)"}
                </button>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)} />

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-xs text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                  {loading ? <><Loader2 size={12} className="animate-spin" />Sending…</> : <><Send size={12} />Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
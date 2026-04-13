"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Ticket, MessageSquare, HelpCircle,
  ChevronDown, Loader2, Paperclip, Send, CheckCircle,
  Clock, XCircle, AlertCircle, Bot, Search, RefreshCw,
  User, MailOpen, Sparkles, ChevronRight, FileText,
  Shield, CreditCard, Landmark, TrendingUp, MoreHorizontal,
  Download, Image as ImageIcon, Film, X, UserCheck,
} from "lucide-react";
import {
  fetchTickets, fetchTicket, createTicket, createGuestTicket,
  replyToTicket, fetchFaqs, sendChatMessage,
} from "../../services/supportService";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";
import LiveChatView from "./LiveChatView";

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const BG        = "#0A1A13";
const SURFACE   = "rgba(255,255,255,0.04)";
const BORDER    = "rgba(255,255,255,0.08)";
const BORDER_HV = "rgba(255,255,255,0.15)";
const AMBER     = "#C8873A";
const AMBER2    = "#E8A850";
const MUTED     = "rgba(255,255,255,0.35)";
const DIMMED    = "rgba(255,255,255,0.18)";
const SELECT_BG = "#0f2318";

const grad = `linear-gradient(135deg, ${AMBER} 0%, ${AMBER2} 100%)`;

/* ── Shared styles ─────────────────────────────────────────────────────────── */
const inp =
  `w-full bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.16] text-white ` +
  `placeholder-white/20 rounded-2xl px-4 py-3.5 text-sm focus:outline-none ` +
  `focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all duration-200`;

const sel = inp + " appearance-none cursor-pointer";
const lbl = "block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2";

/* ── Category config ───────────────────────────────────────────────────────── */
const CATEGORIES = [
  { value: "account",    label: "Account & Profile",   icon: <User size={13} />,           color: "text-violet-400 bg-violet-500/10 border-violet-500/20"   },
  { value: "payment",    label: "Deposits & Payments", icon: <CreditCard size={13} />,     color: "text-blue-400 bg-blue-500/10 border-blue-500/20"          },
  { value: "withdrawal", label: "Withdrawals",          icon: <Landmark size={13} />,       color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"          },
  { value: "kyc",        label: "KYC Verification",    icon: <Shield size={13} />,         color: "text-amber-400 bg-amber-500/10 border-amber-500/20"       },
  { value: "investment", label: "Land & Investment",   icon: <TrendingUp size={13} />,     color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  { value: "other",      label: "Other",                icon: <MoreHorizontal size={13} />, color: "text-white/40 bg-white/5 border-white/10"                 },
];

const catCfg = (v) => CATEGORIES.find(c => c.value === v) || CATEGORIES[5];

/* ── Status config ─────────────────────────────────────────────────────────── */
const statusCfg = (s = "") => ({
  open:     { cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",       dot: "#F59E0B", icon: <Clock size={10} />,       label: "Open"     },
  waiting:  { cls: "text-blue-400 bg-blue-500/10 border-blue-500/20",          dot: "#60A5FA", icon: <AlertCircle size={10} />, label: "Waiting"  },
  resolved: { cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", dot: "#34D399", icon: <CheckCircle size={10} />, label: "Resolved" },
  closed:   { cls: "text-white/30 bg-white/5 border-white/10",                 dot: "#6B7280", icon: <XCircle size={10} />,     label: "Closed"   },
}[s] || { cls: "text-white/30 bg-white/5 border-white/10", dot: "#6B7280", icon: <XCircle size={10} />, label: "Closed" });

const priorityCfg = (p = "") => ({
  high:   { cls: "text-red-400 bg-red-500/10 border-red-500/20",      label: "High"   },
  normal: { cls: "text-white/35 bg-white/[0.04] border-white/10",     label: "Normal" },
  low:    { cls: "text-white/20 bg-white/[0.02] border-white/[0.06]", label: "Low"    },
}[p] || { cls: "text-white/35 bg-white/[0.04] border-white/10", label: "Normal" });

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/* ── File helpers ──────────────────────────────────────────────────────────── */
function getFileType(path) {
  if (!path) return null;
  const ext = path.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) return "image";
  if (["mp4","webm"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  return "file";
}

function getFileName(path) {
  if (!path) return "attachment";
  return path.split("/").pop();
}

function downloadBlob(url, name) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

/* ── Pill button ───────────────────────────────────────────────────────────── */
function Pill({ active, onClick, children, "data-tab": dataTab }) {
  return (
    <button
      onClick={onClick}
      data-tab={dataTab}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
        active ? "text-[#0A1A13] shadow-lg" : "border border-white/8 text-white/40 hover:text-white hover:bg-white/8"
      }`}
      style={active ? { background: grad } : {}}
    >
      {children}
    </button>
  );
}

/* ── Attachment component (user-facing) ────────────────────────────────────── */
function AttachmentLink({ ticketId, message }) {
  const [blobUrl, setBlobUrl]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const fileType = getFileType(message.attachment_path);
  const fileName = getFileName(message.attachment_path);

  const fetchBlob = async () => {
    if (blobUrl) return blobUrl;
    setLoading(true);
    try {
      const res = await api.get(
        `/support/tickets/${ticketId}/messages/${message.id}/attachment`,
        { responseType: "blob" }
      );
      const url = URL.createObjectURL(res.data);
      setBlobUrl(url);
      return url;
    } catch {
      toast.error("Could not load attachment.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleView = async () => {
    const url = await fetchBlob();
    if (!url) return;
    if (fileType === "image") {
      setLightbox(true);
    } else {
      window.open(url, "_blank");
    }
  };

  const handleDownload = async () => {
    const url = await fetchBlob();
    if (url) downloadBlob(url, fileName);
  };

  const FileIcon = fileType === "image" ? ImageIcon
                 : fileType === "video" ? Film
                 : FileText;

  return (
    <>
      {/* Inline image preview once loaded */}
      {fileType === "image" && blobUrl && (
        <div
          className="mt-2 rounded-xl overflow-hidden cursor-zoom-in border border-white/10 max-w-[200px]"
          onClick={() => setLightbox(true)}
        >
          <img src={blobUrl} alt="attachment" className="w-full h-auto object-cover" />
        </div>
      )}

      {/* Attachment chip */}
      <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs bg-white/5 border-white/10 text-white/50">
        <FileIcon size={11} className="shrink-0" />
        <span className="max-w-[140px] truncate">{fileName}</span>
        {loading ? (
          <Loader2 size={11} className="animate-spin shrink-0" />
        ) : (
          <div className="flex items-center gap-1.5 ml-0.5">
            <button
              onClick={handleView}
              title="View"
              className="hover:text-white transition-colors"
            >
              <FileText size={11} />
            </button>
            <button
              onClick={handleDownload}
              title="Download"
              className="hover:text-white transition-colors"
            >
              <Download size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && blobUrl && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            onClick={() => setLightbox(false)}
          >
            <X size={16} />
          </button>
          <img
            src={blobUrl}
            alt="attachment"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={e => { e.stopPropagation(); handleDownload(); }}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
          >
            <Download size={13} /> Download
          </button>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════════════════════════════════════════ */
export default function SupportPage() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView]               = useState("init");
  const [selectedId, setSelectedId]   = useState(null);

  useEffect(() => {
    if (authLoading) return;
    setView(user ? "list" : "faq");
  }, [authLoading, user]);

  if (view === "init") return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <Loader2 size={24} className="text-amber-500 animate-spin" />
    </div>
  );

  const openDetail = (id) => { setSelectedId(id); setView("detail"); };

  const authTabs  = [
    // { id: "chat",    icon: <Bot size={14} />,        label: "AI Chat"    },
    // { id: "live",    icon: <UserCheck size={14} />,   label: "Live Agent"}, 
    { id: "list",    icon: <Ticket size={14} />,     label: "My Tickets" },
    { id: "new",     icon: <Plus size={14} />,        label: "New Ticket" },
    { id: "faq",     icon: <HelpCircle size={14} />,  label: "FAQ"        },
  ];
  const guestTabs = [
    { id: "faq",     icon: <HelpCircle size={14} />, label: "FAQ"        },
    { id: "contact", icon: <MailOpen size={14} />,    label: "Contact Us" },
  ];
  const tabs = user ? authTabs : guestTabs;

  return (
    <div className="min-h-screen relative" style={{ background: BG, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* ── Atmospheric background ── */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
        backgroundSize: "28px 28px", opacity: 0.025,
      }} />
      <div className="fixed pointer-events-none" style={{
        top: "-25%", right: "-15%", width: "55vw", height: "55vw",
        borderRadius: "50%", background: `radial-gradient(circle, ${AMBER} 0%, transparent 65%)`, opacity: 0.06,
      }} />
      <div className="fixed pointer-events-none" style={{
        bottom: "-30%", left: "-10%", width: "40vw", height: "40vw",
        borderRadius: "50%", background: "radial-gradient(circle, #1a5c3a 0%, transparent 65%)", opacity: 0.12,
      }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <Link href={user ? "/dashboard" : "/"}
              className="w-9 h-9 flex items-center justify-center rounded-xl shrink-0 transition-all duration-200 hover:scale-105"
              style={{ border: `1px solid ${BORDER}`, background: SURFACE, color: MUTED }}
              onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = BORDER_HV; }}
              onMouseLeave={e => { e.currentTarget.style.color = MUTED;  e.currentTarget.style.borderColor = BORDER; }}
            >
              <ArrowLeft size={15} />
            </Link>
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] uppercase mb-1" style={{ color: AMBER }}>
                Help Center
              </p>
              <h1 className="text-3xl font-bold text-white leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Support
              </h1>
              <p className="text-sm mt-1.5" style={{ color: DIMMED }}>
                {user ? "Manage tickets, track issues, browse answers" : "Browse FAQs or get in touch — no login needed"}
              </p>
            </div>
          </div>

          {!user && !authLoading && (
            <Link href="/login"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#0A1A13] shrink-0 transition-all hover:scale-[1.02] shadow-xl"
              style={{ background: grad }}>
              <User size={14} /> Sign in
            </Link>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {tabs.map(t => (
            <Pill
              key={t.id}
              data-tab={t.id}
              active={view === t.id || (view === "detail" && t.id === "list")}
              onClick={() => setView(t.id)}
            >
              {t.icon}{t.label}
            </Pill>
          ))}
        </div>

       {/* ── Views ── */}
      {/* {view === "chat"    && <AiChatView />} */}
      {/* {view === "live"    && <LiveChatView onSwitchToAi={() => setView("chat")} />} */}
      {view === "list"    && <TicketList onOpen={openDetail} onNew={() => setView("new")} />}
      {view === "new"     && <NewTicketForm onSuccess={(id) => { setSelectedId(id); setView("detail"); }} />}
      {view === "detail"  && <TicketDetail id={selectedId} onBack={() => setView("list")} />}
      {view === "faq"     && <FaqView onContact={() => setView("contact")} />}
      {view === "contact" && <GuestContactForm />}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TICKET LIST
══════════════════════════════════════════════════════════════════════════════ */
function TicketList({ onOpen, onNew }) {
  const { user }              = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try { setData(await fetchTickets()); }
    catch { toast.error("Could not load tickets."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user]);

  const tickets  = data?.data || [];
  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  const statusCounts = ["open","waiting","resolved","closed"].reduce((acc, s) => {
    acc[s] = tickets.filter(t => t.status === s).length;
    return acc;
  }, {});

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => (
        <div key={i} className="h-22 rounded-2xl animate-pulse" style={{ background: SURFACE, border: `1px solid ${BORDER}` }} />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      {tickets.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
          {[
            { key: "open",     label: "Open",     color: "#F59E0B" },
            { key: "waiting",  label: "Waiting",  color: "#60A5FA" },
            { key: "resolved", label: "Resolved", color: "#34D399" },
            { key: "closed",   label: "Closed",   color: "#6B7280" },
          ].map(s => (
            <div key={s.key} className="rounded-2xl p-4 cursor-pointer transition-all duration-200"
              style={{
                background: filter === s.key ? `${s.color}12` : SURFACE,
                border: `1px solid ${filter === s.key ? `${s.color}30` : BORDER}`,
              }}
              onClick={() => setFilter(filter === s.key ? "all" : s.key)}>
              <p className="text-2xl font-bold" style={{ color: filter === s.key ? s.color : "rgba(255,255,255,0.6)" }}>
                {statusCounts[s.key] || 0}
              </p>
              <p className="text-xs mt-0.5 font-semibold" style={{ color: filter === s.key ? s.color : DIMMED }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {["all","open","waiting","resolved","closed"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all duration-200"
              style={{
                background: filter === f ? grad : SURFACE,
                border:     filter === f ? "none" : `1px solid ${BORDER}`,
                color:      filter === f ? "#0A1A13" : MUTED,
              }}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load}
          className="w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
          style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: DIMMED }}
          title="Refresh">
          <RefreshCw size={13} />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl p-16 text-center" style={{ background: SURFACE, border: `1px dashed ${BORDER}` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}` }}>
            <Ticket size={24} style={{ color: DIMMED }} />
          </div>
          <p className="font-bold text-white text-base mb-1.5">
            {filter === "all" ? "No tickets yet" : `No ${filter} tickets`}
          </p>
          <p className="text-sm mb-6" style={{ color: DIMMED }}>
            {filter === "all" ? "Submit a ticket when you need help from our team." : `You have no ${filter} tickets at the moment.`}
          </p>
          {filter === "all" && (
            <button onClick={onNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-[#0A1A13] transition-all hover:scale-[1.02]"
              style={{ background: grad }}>
              <Plus size={14} /> Open a Ticket
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(t => {
            const s   = statusCfg(t.status);
            const cat = catCfg(t.category);
            return (
              <button key={t.id} onClick={() => onOpen(t.id)}
                className="w-full rounded-2xl p-4 sm:p-5 text-left group transition-all duration-200"
                style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.borderColor = BORDER_HV; }}
                onMouseLeave={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = BORDER; }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3.5 flex-1 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border text-xs mt-0.5 ${cat.color}`}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.cls}`}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                          {s.label}
                        </span>
                        <span className="text-[10px] font-mono" style={{ color: DIMMED }}>{t.reference}</span>
                      </div>
                      <p className="font-semibold text-sm truncate text-white/80">{t.subject}</p>
                      <p className="text-xs mt-0.5 capitalize" style={{ color: DIMMED }}>{cat.label}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end justify-between gap-2 self-stretch">
                    <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>{fmtDate(t.updated_at)}</p>
                    <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" style={{ color: DIMMED }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   NEW TICKET FORM
══════════════════════════════════════════════════════════════════════════════ */
function NewTicketForm({ onSuccess }) {
  const [form, setForm]       = useState({ subject: "", category: "", message: "", priority: "normal" });
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef               = useRef(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ticket = await createTicket({ ...form, attachment: file });
      toast.success("Ticket submitted!");
      onSuccess(ticket.id);
    } catch {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCat = CATEGORIES.find(c => c.value === form.category);

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl p-5 mb-5 flex items-center gap-4"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(200,135,58,0.12)", border: "1px solid rgba(200,135,58,0.25)" }}>
          <FileText size={18} style={{ color: AMBER }} />
        </div>
        <div>
          <h2 className="font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Open a Support Ticket
          </h2>
          <p className="text-xs mt-0.5" style={{ color: DIMMED }}>
            Our team responds within 24 hours · All fields marked * are required
          </p>
        </div>
      </div>

      <div className="rounded-2xl p-6 sm:p-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className={lbl}>Subject *</label>
            <input name="subject" value={form.subject} onChange={handleChange}
              placeholder="Brief description of your issue" required className={inp} />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Category *</label>
              <div className="relative">
                <select name="category" value={form.category} onChange={handleChange} required
                  className={sel} style={{ backgroundColor: SELECT_BG }}>
                  <option value="" disabled>Select category</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: DIMMED }} />
              </div>
              {selectedCat && (
                <p className={`inline-flex items-center gap-1.5 text-[10px] font-bold mt-2 px-2.5 py-1 rounded-full border ${selectedCat.color}`}>
                  {selectedCat.icon} {selectedCat.label}
                </p>
              )}
            </div>
            <div>
              <label className={lbl}>Priority</label>
              <div className="relative">
                <select name="priority" value={form.priority} onChange={handleChange}
                  className={sel} style={{ backgroundColor: SELECT_BG }}>
                  <option value="low">Low — general question</option>
                  <option value="normal">Normal</option>
                  <option value="high">High — urgent issue</option>
                </select>
                <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: DIMMED }} />
              </div>
            </div>
          </div>

          <div>
            <label className={lbl}>Message *</label>
            <textarea name="message" value={form.message} onChange={handleChange}
              placeholder="Describe your issue in detail. Include transaction references, amounts, or dates where relevant."
              rows={5} required className={inp + " resize-none"} />
          </div>

          <div>
            <label className={lbl}>
              Attachment <span className="normal-case font-normal opacity-60">(optional · jpg, png, pdf · max 5 MB)</span>
            </label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px dashed ${file ? "rgba(200,135,58,0.4)" : BORDER}`,
                color: file ? "rgba(255,255,255,0.55)" : DIMMED,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,135,58,0.35)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = file ? "rgba(200,135,58,0.4)" : BORDER}>
              <Paperclip size={15} style={{ color: file ? AMBER : DIMMED }} />
              {file
                ? <>{file.name} <span style={{ color: "rgba(255,255,255,0.25)" }}>({(file.size/1024).toFixed(0)} KB)</span></>
                : "Click to attach a file or screenshot"}
            </button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf"
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>

          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-[#0A1A13] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-xl"
            style={{ background: grad }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Submitting…</> : <><Send size={15} />Submit Ticket</>}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   TICKET DETAIL
══════════════════════════════════════════════════════════════════════════════ */
function TicketDetail({ id, onBack }) {
  const { user }              = useAuth();
  const [ticket, setTicket]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply]     = useState("");
  const [file, setFile]       = useState(null);
  const [sending, setSending] = useState(false);
  const fileRef               = useRef(null);
  const bottomRef             = useRef(null);

  const load = async () => {
    try { setTicket(await fetchTicket(id)); }
    catch { toast.error("Could not load ticket."); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [ticket?.messages]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await replyToTicket(id, { message: reply, attachment: file });
      setReply(""); setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Reply sent.");
      load();
    } catch { toast.error("Failed to send reply."); }
    finally { setSending(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={22} className="text-amber-500 animate-spin" />
    </div>
  );
  if (!ticket) return null;

  const s        = statusCfg(ticket.status);
  const cat      = catCfg(ticket.category);
  const isClosed = ["resolved", "closed"].includes(ticket.status);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex gap-4 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${cat.color}`}>
              {cat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${s.cls}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
                  {s.label}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${priorityCfg(ticket.priority).cls}`}>
                  {priorityCfg(ticket.priority).label}
                </span>
                <span className="text-[10px] font-mono" style={{ color: DIMMED }}>{ticket.reference}</span>
              </div>
              <h2 className="font-bold text-white text-lg leading-snug">{ticket.subject}</h2>
              <p className="text-xs mt-1 capitalize" style={{ color: DIMMED }}>
                {cat.label} · Opened {fmtDate(ticket.created_at)}
              </p>
            </div>
          </div>
          <button onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:bg-white/5"
            style={{ color: MUTED }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = MUTED}>
            <ArrowLeft size={12} />Back
          </button>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(5,15,10,0.8)", border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b"
          style={{ borderColor: BORDER, background: SURFACE }}>
          <MessageSquare size={13} style={{ color: AMBER }} />
          <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: MUTED }}>
            Conversation · {ticket.messages?.length || 0} message{ticket.messages?.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="px-5 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: 460 }}>
          {ticket.messages?.map((m, i) => {
            const isUser  = m.sender_type === "user";
            const isAgent = m.sender_type === "agent";
            return (
              <div key={m.id ?? i} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-black ${
                    isUser ? "text-[#0A1A13]" : isAgent ? "text-blue-400" : "text-amber-500"
                  }`}
                  style={{
                    background: isUser  ? grad :
                                isAgent ? "rgba(96,165,250,0.12)" : "rgba(200,135,58,0.12)",
                    border: isUser ? "none" :
                            isAgent ? "1px solid rgba(96,165,250,0.2)" : "1px solid rgba(200,135,58,0.2)",
                  }}
                >
                  {isUser ? (user?.name?.[0]?.toUpperCase() || "U") : isAgent ? "A" : <Bot size={13} />}
                </div>
                <div className={`max-w-[76%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-4 py-3 text-sm leading-relaxed ${
                      isUser ? "rounded-2xl rounded-tr-sm text-[#0A1A13]" : "rounded-2xl rounded-tl-sm"
                    }`}
                    style={isUser
                      ? { background: grad }
                      : { background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.78)" }
                    }
                  >
                    {m.body}
                    {m.attachment_path && (
                      <AttachmentLink ticketId={ticket.id} message={m} />
                    )}
                  </div>
                  <p className="text-[10px] px-1" style={{ color: "rgba(255,255,255,0.18)" }}>
                    {isUser ? "You" : isAgent ? "Support Agent" : "AI Assistant"} · {fmtDate(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {!isClosed ? (
          <div className="border-t px-5 py-4" style={{ borderColor: BORDER, background: SURFACE }}>
            <form onSubmit={handleReply} className="space-y-3">
              <textarea value={reply} onChange={e => setReply(e.target.value)}
                placeholder="Type your reply…" rows={3}
                className={inp + " resize-none"} />

              {/* File preview strip */}
              {file && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/50">
                    <Paperclip size={11} />
                    <span className="max-w-[200px] truncate">{file.name}</span>
                    <span style={{ color: DIMMED }}>({(file.size / 1024).toFixed(0)} KB)</span>
                    <button
                      type="button"
                      onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="text-white/20 hover:text-red-400 transition-colors ml-1"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold transition-colors"
                  style={{ color: file ? "rgba(255,255,255,0.55)" : DIMMED }}
                  onMouseEnter={e => e.currentTarget.style.color = AMBER}
                  onMouseLeave={e => e.currentTarget.style.color = file ? "rgba(255,255,255,0.55)" : DIMMED}>
                  <Paperclip size={13} />
                  {file ? "Change file" : "Attach file"}
                </button>
                <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
                <button type="submit" disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-[#0A1A13] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
                  style={{ background: grad }}>
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="border-t px-5 py-4 flex items-center gap-2.5 text-sm" style={{ borderColor: BORDER, color: DIMMED }}>
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
            This ticket is {ticket.status}. Open a new one if you need further help.
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   FAQ VIEW
══════════════════════════════════════════════════════════════════════════════ */
const FAQ_CATEGORY_ICONS = {
  account:    { icon: <User size={13} />,       color: "text-violet-400 bg-violet-500/10 border-violet-500/20"   },
  payment:    { icon: <CreditCard size={13} />, color: "text-blue-400 bg-blue-500/10 border-blue-500/20"         },
  withdrawal: { icon: <Landmark size={13} />,   color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20"         },
  kyc:        { icon: <Shield size={13} />,     color: "text-amber-400 bg-amber-500/10 border-amber-500/20"      },
  investment: { icon: <TrendingUp size={13} />, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"},
  general:    { icon: <HelpCircle size={13} />, color: "text-white/40 bg-white/5 border-white/10"                },
};

function FaqView({ onContact }) {
  const { user }                  = useAuth();
  const [faqs, setFaqs]           = useState({});
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [expanded, setExpanded]   = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchFaqs()
      .then(setFaqs)
      .catch(() => toast.error("Could not load FAQs."))
      .finally(() => setLoading(false));
  }, []);

  const categories = Object.keys(faqs);
  const allFaqs    = Object.values(faqs).flat();

  const filtered = allFaqs.filter(f => {
    const matchCat    = activeTab === "all" || f.category === activeTab;
    const matchSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: DIMMED }} />
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setExpanded(null); }}
          placeholder="Search frequently asked questions…"
          className={inp + " pl-11"}
        />
      </div>

      {!loading && categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {["all", ...categories].map(c => {
            const cfg    = FAQ_CATEGORY_ICONS[c] || FAQ_CATEGORY_ICONS.general;
            const isActive = activeTab === c;
            return (
              <button key={c} onClick={() => { setActiveTab(c); setExpanded(null); }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize border transition-all duration-200 ${
                  isActive ? cfg.color : "bg-white/4 border-white/8 text-white/35 hover:text-white"
                }`}>
                {c !== "all" && <span>{cfg.icon}</span>}
                {c === "all" ? "All Topics" : c}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="space-y-2.5">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: SURFACE, border: `1px solid ${BORDER}` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: DIMMED }}>
          <HelpCircle size={36} className="mx-auto mb-3 opacity-25" />
          <p className="text-sm">No FAQs match your search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => {
            const cfg    = FAQ_CATEGORY_ICONS[f.category] || FAQ_CATEGORY_ICONS.general;
            const isOpen = expanded === i;
            return (
              <div key={f.id ?? i}
                className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: SURFACE, border: `1px solid ${isOpen ? "rgba(200,135,58,0.25)" : BORDER}` }}>
                <button onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <span className="flex-1 font-semibold text-sm leading-snug" style={{ color: "rgba(255,255,255,0.78)" }}>
                    {f.question}
                  </span>
                  <ChevronDown size={14}
                    className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: isOpen ? AMBER : DIMMED }} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t pt-4 text-sm leading-relaxed"
                    style={{ borderColor: BORDER, color: "rgba(255,255,255,0.48)" }}>
                    {f.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!loading && (
        <div className="rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap mt-2"
          style={{ background: "rgba(200,135,58,0.05)", border: "1px solid rgba(200,135,58,0.15)" }}>
          <div>
            <p className="font-semibold text-white text-sm">Didn't find your answer?</p>
            <p className="text-xs mt-0.5" style={{ color: DIMMED }}>
              {user ? "Open a support ticket and our team will help." : "Send us a message and we'll respond within 24 hours."}
            </p>
          </div>
          {user ? (
            <button onClick={() => document.querySelector("[data-tab='new']")?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-[#0A1A13] shrink-0 transition-all hover:scale-[1.02]"
              style={{ background: grad }}>
              <Plus size={14} /> New Ticket
            </button>
          ) : (
            <button onClick={onContact}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-[#0A1A13] shrink-0 transition-all hover:scale-[1.02]"
              style={{ background: grad }}>
              <MailOpen size={14} /> Contact Us
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   GUEST CONTACT FORM
══════════════════════════════════════════════════════════════════════════════ */
function GuestContactForm() {
  const [form, setForm]           = useState({ name: "", email: "", subject: "", category: "", message: "" });
  const [file, setFile]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");
  const fileRef                   = useRef(null);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createGuestTicket({ ...form, attachment: file });
      setReference(res.reference);
      setSubmitted(true);
      toast.success("Message sent!");
    } catch {
      toast.error("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) return (
    <div className="max-w-lg mx-auto">
      <div className="rounded-3xl p-12 flex flex-col items-center text-center gap-5"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <CheckCircle size={36} className="text-emerald-400" />
        </div>
        <div>
          <h2 className="font-bold text-white text-xl" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Message received!
          </h2>
          <p className="text-sm mt-2" style={{ color: MUTED }}>
            We'll reply to <span className="text-white font-semibold">{form.email}</span> within 24 hours.
          </p>
          {reference && (
            <div className="inline-flex items-center gap-2.5 mt-4 px-4 py-2.5 rounded-xl text-xs font-mono"
              style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: MUTED }}>
              Your reference: <span className="font-black" style={{ color: AMBER }}>{reference}</span>
            </div>
          )}
        </div>
        <p className="text-xs" style={{ color: DIMMED }}>
          Have an account?{" "}
          <Link href="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: AMBER }}>
            Sign in
          </Link>{" "}
          to track your ticket and use AI chat support.
        </p>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl p-5 mb-5 flex items-center justify-between gap-4"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(200,135,58,0.12)", border: "1px solid rgba(200,135,58,0.25)" }}>
            <MailOpen size={18} style={{ color: AMBER }} />
          </div>
          <div>
            <h2 className="font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Contact Support
            </h2>
            <p className="text-xs mt-0.5" style={{ color: DIMMED }}>No account needed · We reply within 24 hours</p>
          </div>
        </div>
        <Link href="/login"
          className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#0A1A13] transition-all hover:scale-[1.02]"
          style={{ background: grad }}>
          <Sparkles size={12} /> Sign in for AI chat
        </Link>
      </div>

      <div className="rounded-2xl p-6 sm:p-8" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Your Name *</label>
              <input name="name" value={form.name} onChange={handleChange}
                placeholder="Full name" required className={inp} />
            </div>
            <div>
              <label className={lbl}>Email Address *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="you@example.com" required className={inp} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className={lbl}>Topic *</label>
              <div className="relative">
                <select name="category" value={form.category} onChange={handleChange} required
                  className={sel} style={{ backgroundColor: SELECT_BG }}>
                  <option value="" disabled>Select topic</option>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: DIMMED }} />
              </div>
            </div>
            <div>
              <label className={lbl}>Subject *</label>
              <input name="subject" value={form.subject} onChange={handleChange}
                placeholder="Brief summary" required className={inp} />
            </div>
          </div>

          <div>
            <label className={lbl}>Message *</label>
            <textarea name="message" value={form.message} onChange={handleChange}
              placeholder="Describe your issue in detail. The more context you provide, the faster we can help."
              rows={5} required className={inp + " resize-none"} />
          </div>

          <div>
            <label className={lbl}>
              Attachment <span className="normal-case font-normal opacity-60">(optional · jpg, png, pdf · max 5 MB)</span>
            </label>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: `1px dashed ${file ? "rgba(200,135,58,0.4)" : BORDER}`,
                color: file ? "rgba(255,255,255,0.55)" : DIMMED,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(200,135,58,0.35)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = file ? "rgba(200,135,58,0.4)" : BORDER}>
              <Paperclip size={15} style={{ color: file ? AMBER : DIMMED }} />
              {file ? file.name : "Click to attach a screenshot or file"}
            </button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf"
              onChange={e => setFile(e.target.files?.[0] || null)} />
          </div>

          <button type="submit" disabled={loading}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-[#0A1A13] transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-xl"
            style={{ background: grad }}>
            {loading ? <><Loader2 size={15} className="animate-spin" />Sending…</> : <><Send size={15} />Send Message</>}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   AI CHAT VIEW
══════════════════════════════════════════════════════════════════════════════ */
const FAQ_QUICK_REPLIES = [
  "Fund my wallet",
  "Complete KYC",
  "Withdrawal time",
  "Reset PIN",
  "Buy land units",
  "Sell my units",
];

function AiChatView() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! I'm your ${process.env.NEXT_PUBLIC_APP_NAME} assistant. Ask me anything about your account, investments, deposits, KYC, or anything else.`,
    },
  ]);
  const [input, setInput]               = useState("");
  const [loading, setLoading]           = useState(false);
  const [chipsVisible, setChipsVisible] = useState(true);
  const bottomRef                       = useRef(null);
  const textareaRef                     = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput("");
    setChipsVisible(false);

    const next = [...messages, { role: "user", content }];
    setMessages(next);
    setLoading(true);

    try {
      const history = next.slice(-12).map(m => ({ role: m.role, content: m.content }));
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
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 220px)", minHeight: 420 }}>

      {/* ── Compact header ── */}
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-3 shrink-0"
        style={{ background: "rgba(200,135,58,0.07)", border: "1px solid rgba(200,135,58,0.18)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: grad }}>
          <Sparkles size={14} className="text-[#0A1A13]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-none">AI Support Assistant</p>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: DIMMED }}>
            Replies instantly
          </p>
        </div>
        {/* ← ADD THIS: human handoff button */}
        <button
          onClick={() => document.querySelector("[data-tab='live']")?.click()}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shrink-0"
          style={{ color: MUTED, border: `1px solid ${BORDER}` }}
          onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = BORDER_HV; }}
          onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; }}
        >
          <UserCheck size={12} /> Human agent
        </button>
        <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0" style={{ color: "#34D399" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline">Online</span>
        </div>
      </div>


      {/* ── Quick reply chips ── */}
      {chipsVisible && (
        <div className="flex gap-2 mb-3 overflow-x-auto shrink-0 pb-1"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {FAQ_QUICK_REPLIES.map(q => (
            <button key={q} onClick={() => send(q)} disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border whitespace-nowrap shrink-0 transition-all duration-200 disabled:opacity-40"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(200,135,58,0.4)"; e.currentTarget.style.color = AMBER; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; }}>
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto rounded-2xl px-3 py-4 sm:px-5 sm:py-5 space-y-4"
        style={{ background: "rgba(5,15,10,0.7)", border: `1px solid ${BORDER}` }}>
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black self-end ${isUser ? "" : "hidden sm:flex"}`}
                style={isUser
                  ? { background: grad, color: "#0A1A13" }
                  : { background: "rgba(200,135,58,0.12)", border: "1px solid rgba(200,135,58,0.2)", color: AMBER }
                }
              >
                {isUser ? (user?.name?.[0]?.toUpperCase() || "U") : <Bot size={12} />}
              </div>
              <div className={`flex flex-col gap-1 ${isUser ? "items-end max-w-[82%]" : "items-start max-w-[92%] sm:max-w-[80%]"}`}>
                {!isUser && (
                  <p className="text-[10px] px-1 sm:hidden" style={{ color: AMBER }}>AI Assistant</p>
                )}
                <div
                  className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
                  }`}
                  style={isUser
                    ? { background: grad, color: "#0A1A13" }
                    : m.isError
                      ? { background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }
                      : { background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.85)" }
                  }
                >
                  {m.content}
                </div>
                {!isUser && (
                  <p className="text-[10px] px-1 hidden sm:block" style={{ color: "rgba(255,255,255,0.18)" }}>
                    AI Assistant
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg hidden sm:flex items-center justify-center shrink-0"
              style={{ background: "rgba(200,135,58,0.12)", border: "1px solid rgba(200,135,58,0.2)", color: AMBER }}>
              <Bot size={12} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
              style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}` }}>
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="mt-2.5 shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask me anything… (Enter to send)"
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none transition-all duration-200"
            style={{ background: SURFACE, border: `1px solid ${BORDER}`, maxHeight: 80, lineHeight: 1.5 }}
            onFocus={e => e.currentTarget.style.borderColor = "rgba(200,135,58,0.6)"}
            onBlur={e => e.currentTarget.style.borderColor = BORDER}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
            style={{ background: grad, color: "#0A1A13" }}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
        <p className="text-[10px] mt-1.5 text-center" style={{ color: "rgba(255,255,255,0.12)" }}>
          AI may make mistakes · Submit a ticket for urgent issues
        </p>
      </div>
    </div>
  );
}
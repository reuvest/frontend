"use client";

import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  getLiveChatQueue,
  claimLiveChatTicket,
  sendAgentLiveChatMessage,
  sendAgentLiveChatTyping,
  endLiveChat,
} from "../../../services/supportService";
// Real bug found while typing this file: broadcastAuthorizer() below calls
// api.post(...) but nothing in this file ever imported `api` — every prior
// consumer of this page (untyped .jsx let it slide silently) would have
// hit a ReferenceError the moment a private-channel subscription tried to
// authorize. Added the missing import rather than routing it through a
// service, since it needs the raw axios instance for Echo's authorizer
// callback shape (channel, socketId, callback), not a typed request/response.
import api from "../../../utils/api";
import toast from "react-hot-toast";
import { useConfirm } from "../../../stores/useUIStore";
import type { AxiosError } from "axios";
import type EchoType from "laravel-echo";
import type { Channel } from "laravel-echo";
import {
  ArrowLeft, Send, X, Clock, MessageSquare, Inbox,
  CheckCheck, Loader2, Circle, Paperclip,
} from "lucide-react";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmtTime = (d?: string | null) =>
  d ? new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "";

const fmtDate = (d?: string | null) => {
  if (!d) return "";
  const date      = new Date(d);
  const now       = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === now.toDateString())       return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const CATEGORY_COLORS: Record<string, string> = {
  account:    "#C8873A",
  payment:    "#2D7A55",
  kyc:        "#8B5CF6",
  investment: "#06B6D4",
  withdrawal: "#F59E0B",
  other:      "#6B7280",
};

interface ApiErrorBody {
  message?: string;
  error?: string;
}

interface TicketUser {
  name?: string;
  email?: string;
}

interface ChatMessage {
  id: string | number;
  ticket_id?: string | number;
  sender_type: "agent" | "user" | string;
  body: string;
  created_at?: string;
  user_name?: string;
}

interface Ticket {
  id: string | number;
  user?: TicketUser;
  subject: string;
  category: string;
  reference?: string;
  agent_id?: string | number | null;
  created_at?: string;
  messages?: ChatMessage[];
}

/* ─── Broadcasting auth — routed through our axios instance so the
   httpOnly session cookie is sent automatically (withCredentials), instead
   of trying to read the (now-inaccessible) token out of document.cookie. ─── */
import type { ChannelAuthorizationCallback } from "pusher-js";

// pusher-js exports ChannelAuthorizationCallback publicly but not the
// ChannelAuthorizationData type it references internally — derived
// structurally off the callback's own second parameter instead.
type AuthData = NonNullable<Parameters<ChannelAuthorizationCallback>[1]>;

function broadcastAuthorizer(channel: { name: string }) {
  return {
    authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
      api
        .post("/broadcasting/auth", { socket_id: socketId, channel_name: channel.name })
        .then((res) => callback(null, res.data as AuthData))
        .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
    },
  };
}

/* ─── Echo hook — waits for dynamic imports before resolving ────────────── */
function useEcho() {
  const echoRef  = useRef<EchoType<"reverb"> | null>(null);
  const readyRef = useRef(false);
  // Expose a promise so subscribers can await Echo being ready
  const readyPromise = useRef<Promise<EchoType<"reverb">> | null>(null);
  const resolveReady = useRef<((echo: EchoType<"reverb">) => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Create a promise that resolves once Echo is initialised
    readyPromise.current = new Promise((resolve) => {
      resolveReady.current = resolve;
    });

    Promise.all([
      import("laravel-echo"),
      import("pusher-js"),
    ]).then(([{ default: Echo }, { default: Pusher }]) => {
      (window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher;

      echoRef.current = new Echo({
      broadcaster:       "reverb",
      key:               process.env.NEXT_PUBLIC_PUSHER_KEY,
      wsHost:            (process.env.NEXT_PUBLIC_REVERB_HOST ?? "").replace(/^https?:\/\//, "").replace(/\/$/, ""),
      wsPort:            Number(process.env.NEXT_PUBLIC_REVERB_PORT || 80),
      wssPort:           Number(process.env.NEXT_PUBLIC_REVERB_PORT || 443),
      forceTLS:          process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
      enabledTransports: ["ws", "wss"],
      disableStats:      true,
      authorizer:        broadcastAuthorizer,
    });
      readyRef.current = true;
      resolveReady.current?.(echoRef.current); // ← unblocks any awaiting subscribers
    });

    return () => {
      echoRef.current?.disconnect();
      echoRef.current  = null;
      readyRef.current = false;
    };
  }, []);

  return { echoRef, readyPromise };
}

/* ─── Queue item ────────────────────────────────────────────────────────── */
interface QueueItemProps {
  ticket: Ticket;
  isActive: boolean;
  onClick: () => void;
}

function QueueItem({ ticket, isActive, onClick }: QueueItemProps) {
  const color = CATEGORY_COLORS[ticket.category] || "#6B7280";

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const waitMins = ticket.created_at
    ? Math.floor((now - new Date(ticket.created_at).getTime()) / 60000)
    : 0;
  const isClaimed = !!ticket.agent_id;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-white/4 transition-all relative group ${
        isActive ? "bg-white/6" : "hover:bg-white/3"
      }`}
    >
      {isActive && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r"
          style={{ background: color }} />
      )}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-semibold text-white/85 truncate leading-tight">
          {ticket.user?.name || "Unknown User"}
        </p>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Active vs queued badge */}
          {isClaimed ? (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
              ACTIVE
            </span>
          ) : (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
              QUEUED
            </span>
          )}
          <span className="text-[10px] text-white/25">
            {waitMins < 1 ? "just now" : `${waitMins}m`}
          </span>
        </div>
      </div>
      <p className="text-xs text-white/60 truncate mb-2">{ticket.subject}</p>
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
          style={{ background: `${color}20`, color }}>
          {ticket.category}
        </span>
        <span className="flex items-center gap-1 text-[10px] text-amber-400/60">
          <Clock size={9} /> {waitMins}m wait
        </span>
      </div>
    </button>
  );
}

/* ─── Message bubble ────────────────────────────────────────────────────── */
interface MessageBubbleProps {
  message: ChatMessage;
  isAgent: boolean;
}

function MessageBubble({ message, isAgent }: MessageBubbleProps) {
  return (
    <div className={`flex gap-2.5 ${isAgent ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
          isAgent ? "text-[#0D1F1A]" : "bg-white/10 text-white/60"
        }`}
        style={isAgent ? { background: "linear-gradient(135deg, #C8873A, #E8A850)" } : {}}
      >
        {isAgent ? "A" : (message.user_name?.[0] || "U")}
      </div>
      <div className={`max-w-[72%] ${isAgent ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
            isAgent
              ? "rounded-tr-md text-[#0D1F1A] font-medium"
              : "rounded-tl-md bg-white/7 text-white/80 border border-white/6"
          }`}
          style={isAgent ? { background: "linear-gradient(135deg, #C8873A, #E8A850)" } : {}}
        >
          {message.body}
        </div>
        <span className="text-[10px] text-white/20 px-1">{fmtTime(message.created_at)}</span>
      </div>
    </div>
  );
}

/* ─── Typing indicator ──────────────────────────────────────────────────── */
function TypingIndicator({ name }: { name?: string | null }) {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
        {name?.[0] || "U"}
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/7 border border-white/6 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "rgba(200,135,58,0.08)", border: "1px solid rgba(200,135,58,0.15)" }}>
        <MessageSquare size={24} className="text-amber-500/40" />
      </div>
      <p className="text-white/60 text-sm font-medium mb-1"
        style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
        No active chat
      </p>
      <p className="text-white/20 text-xs leading-relaxed max-w-48">
        Select a ticket from the queue to start helping a customer.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function AgentChatPage() {
  const confirm = useConfirm();
  const [queue, setQueue]               = useState<Ticket[]>([]);
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [messages, setMessages]         = useState<ChatMessage[]>([]);
  const [draft, setDraft]               = useState("");
  const [sending, setSending]           = useState(false);
  const [claiming, setClaiming]         = useState(false);
  const [ending, setEnding]             = useState(false);
  const [userTyping, setUserTyping]     = useState(false);
  const [queueLoading, setQueueLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const isTypingRef    = useRef(false);

  const { echoRef, readyPromise } = useEcho();

  /* ── Fetch queue ── */
  const fetchQueue = useCallback(async () => {
    try {
      // supportService.getLiveChatQueue() returns unknown[] (shared, loose
      // by design) — asserting the actual response shape this page renders.
      setQueue((await getLiveChatQueue()) as Ticket[]);
    } catch {
      toast.error("Failed to load queue");
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 15000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  /* ── Scroll to bottom ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userTyping]);

  /* ── Subscribe to active ticket channel — waits for Echo to be ready ── */
  useEffect(() => {
    if (!activeTicket) return;

    let channel: Channel | null = null;

    readyPromise.current?.then((echo) => {
      channel = echo.private(`support.ticket.${activeTicket.id}`);

      channel.listen(".message.sent", (e: ChatMessage) => {
        if (e.sender_type !== "agent") {
          setMessages((prev) => [...prev, e]);
          setUserTyping(false);
        }
      });

      channel.listen(".typing", (e: { sender: string; is_typing: boolean }) => {
        if (e.sender === "user") {
          setUserTyping(e.is_typing);
          clearTimeout(typingTimer.current);
          if (e.is_typing) {
            typingTimer.current = setTimeout(() => setUserTyping(false), 4000);
          }
        }
      });

      channel.listen(".status.changed", (e: { status: string }) => {
        if (e.status === "queued") fetchQueue();
      });
    });

    return () => {
      // Cleanup: leave channel when ticket changes
      readyPromise.current?.then((echo) => {
        echo.leave(`support.ticket.${activeTicket.id}`);
      });
    };
  }, [activeTicket, fetchQueue, readyPromise]);

  /* ── Subscribe to global agents channel for queue updates ── */
  useEffect(() => {
    readyPromise.current?.then((echo) => {
      const channel = echo.channel("agents");
      channel.listen(".status.changed", () => fetchQueue());
    });

    return () => {
      readyPromise.current?.then((echo) => {
        echo.leave("agents");
      });
    };
  }, [fetchQueue, readyPromise]);

  /* ── Claim ticket ── */
  const handleClaim = async (ticket: Ticket) => {
    setClaiming(true);
    try {
      const data = (await claimLiveChatTicket(ticket.id)) as Ticket;
      setActiveTicket(data);
      setMessages(data.messages ?? []);
      setQueue((q) => q.filter((t) => t.id !== ticket.id));
      toast.success(`Claimed ticket from ${ticket.user?.name}`);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      toast.error(axiosErr.response?.data?.message || "Failed to claim ticket");
    } finally {
      setClaiming(false);
    }
  };

  const handleSelectQueue = (ticket: Ticket) => {
    if (activeTicket?.id === ticket.id) return;
    handleClaim(ticket);
  };

  /* ── Send message ── */
  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !activeTicket || sending) return;

    setSending(true);
    const optimistic: ChatMessage = {
      id:          `opt-${Date.now()}`,
      ticket_id:   activeTicket.id,
      sender_type: "agent",
      body,
      created_at:  new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    stopTyping();

    try {
      const msg = (await sendAgentLiveChatMessage(activeTicket.id, body)) as ChatMessage;
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? msg : m))
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setDraft(body);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  /* ── Typing ── */
  const stopTyping = useCallback(async () => {
    if (!isTypingRef.current || !activeTicket) return;
    isTypingRef.current = false;
    try { await sendAgentLiveChatTyping(activeTicket.id, false); } catch {}
  }, [activeTicket]);

  const handleDraftChange = useCallback(async (val: string) => {
    setDraft(val);
    if (!activeTicket) return;
    clearTimeout(typingTimer.current);
    if (val && !isTypingRef.current) {
      isTypingRef.current = true;
      try { await sendAgentLiveChatTyping(activeTicket.id, true); } catch {}
    }
    typingTimer.current = setTimeout(stopTyping, 2500);
  }, [activeTicket, stopTyping]);

  /* ── End chat ── */
  const handleEnd = async () => {
    if (!activeTicket) return;
    if (!(await confirm({ message: "End this chat and resolve the ticket?" }))) return;
    setEnding(true);
    try {
      await endLiveChat(activeTicket.id);
      toast.success("Chat ended — ticket resolved");
      setActiveTicket(null);
      setMessages([]);
      fetchQueue();
    } catch {
      toast.error("Failed to end chat");
    } finally {
      setEnding(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const pendingCount = queue.filter((t) => !t.agent_id).length;

  // Mobile: toggle between 'queue' and 'chat' panels
  const [mobilePanel, setMobilePanel] = useState<"queue" | "chat">("queue");

  // Auto-switch to chat on mobile when a ticket is claimed
  const handleClaimWithMobileSwitch = async (ticket: Ticket) => {
    await handleClaim(ticket);
    setMobilePanel("chat");
  };

  const handleSelectQueueMobile = (ticket: Ticket) => {
    if (activeTicket?.id === ticket.id) {
      setMobilePanel("chat");
      return;
    }
    handleClaimWithMobileSwitch(ticket);
  };

  return (
    <div className="h-dvh bg-[#0A1A12] flex flex-col overflow-hidden"
      style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/6 bg-[#0D1F1A] shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile: back to queue when in chat panel */}
          {mobilePanel === "chat" && activeTicket ? (
            <button
              onClick={() => setMobilePanel("queue")}
              className="sm:hidden w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <ArrowLeft size={14} />
            </button>
          ) : (
            <Link href="/admin"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
              <ArrowLeft size={14} />
            </Link>
          )}
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-500/60">
              Agent Dashboard
            </p>
            <p className="text-sm font-bold text-white"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              {mobilePanel === "chat" && activeTicket
                ? <span className="sm:hidden">{activeTicket.user?.name}</span>
                : null}
              <span className={mobilePanel === "chat" && activeTicket ? "hidden sm:inline" : ""}>
                Live Support
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mobile: show queue count as tappable badge when in chat */}
          {activeTicket && (
            <button
              onClick={() => setMobilePanel("queue")}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${
                pendingCount > 0
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-white/55"
              }`}>
              <Inbox size={11} /> {pendingCount}
            </button>
          )}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${
            pendingCount > 0
              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
              : "border-white/10 bg-white/5 text-white/55"
          }`}>
            <Inbox size={11} /> {pendingCount} in queue
          </div>
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/8">
            <Circle size={7} className="text-emerald-400 fill-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400 hidden sm:inline">Online</span>
          </div>
          {/* Mobile: end chat button in header */}
          {mobilePanel === "chat" && activeTicket && (
            <button onClick={handleEnd} disabled={ending}
              className="sm:hidden flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-red-500/20 text-red-400/70 text-xs font-bold">
              {ending ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />}
              End
            </button>
          )}
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Queue sidebar — full screen on mobile, fixed sidebar on desktop ── */}
        <div className={`
          ${mobilePanel === "queue" ? "flex" : "hidden"}
          sm:flex
          w-full sm:w-72 shrink-0 border-r border-white/6 flex-col bg-[#0D1F1A] overflow-hidden
        `}>
          <div className="px-4 py-3.5 border-b border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/25 flex items-center gap-2">
              <MessageSquare size={10} /> Queue
              {pendingCount > 0 && (
                <span className="ml-auto px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[9px] font-black">
                  {pendingCount}
                </span>
              )}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {queueLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="text-white/20 animate-spin" />
              </div>
            ) : queue.length === 0 ? (
              <div className="text-center px-6 py-12">
                <CheckCheck size={24} className="mx-auto text-emerald-400/30 mb-3" />
                <p className="text-xs text-white/25">Queue is empty</p>
                <p className="text-[11px] text-white/15 mt-1">No customers waiting</p>
              </div>
            ) : (
              <>
                {/* Queued tickets */}
                {queue.filter(t => !t.agent_id).length > 0 && (
                  <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/50">
                    Waiting
                  </div>
                )}
                {queue.filter(t => !t.agent_id).map((ticket) => (
                  <QueueItem
                    key={ticket.id}
                    ticket={ticket}
                    isActive={activeTicket?.id === ticket.id}
                    onClick={() => handleSelectQueueMobile(ticket)}
                  />
                ))}

                {/* Active tickets */}
                {queue.filter(t => !!t.agent_id).length > 0 && (
                  <div className="px-4 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/50 border-t border-white/4 mt-1">
                    Active Chats
                  </div>
                )}
                {queue.filter(t => !!t.agent_id).map((ticket) => (
                  <QueueItem
                    key={ticket.id}
                    ticket={ticket}
                    isActive={activeTicket?.id === ticket.id}
                    onClick={() => handleSelectQueueMobile(ticket)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Chat area — full screen on mobile, flex-1 on desktop ── */}
        <div className={`
          ${mobilePanel === "chat" ? "flex" : "hidden"}
          sm:flex
          flex-1 flex-col overflow-hidden
        `}>
          {!activeTicket ? (
            <EmptyState />
          ) : (
            <>
              {/* Chat header — desktop only (mobile header is top bar) */}
              <div className="hidden sm:flex px-6 py-4 border-b border-white/6 bg-[#0D1F1A] items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-sm font-bold text-white/60 shrink-0">
                    {activeTicket.user?.name?.[0] || "U"}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">
                      {activeTicket.user?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-white/55">{activeTicket.reference}</p>
                      <span className="w-1 h-1 rounded-full bg-white/1.5" />
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                        style={{
                          background: `${CATEGORY_COLORS[activeTicket.category] || "#6B7280"}20`,
                          color:      CATEGORY_COLORS[activeTicket.category] || "#6B7280",
                        }}>
                        {activeTicket.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-2">
                    <p className="text-xs font-semibold text-white/60 truncate max-w-48">
                      {activeTicket.subject}
                    </p>
                    <p className="text-[10px] text-white/20">{activeTicket.user?.email}</p>
                  </div>
                  <button onClick={handleEnd} disabled={ending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-500/20 text-red-400/70 hover:bg-red-500/8 hover:text-red-400 hover:border-red-500/35 text-xs font-bold transition-all">
                    {ending ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    End Chat
                  </button>
                </div>
              </div>

              {/* Mobile chat subheader — shows subject + category */}
              <div className="sm:hidden px-4 py-2.5 border-b border-white/5 bg-[#0D1F1A] flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0"
                  style={{
                    background: `${CATEGORY_COLORS[activeTicket.category] || "#6B7280"}20`,
                    color:      CATEGORY_COLORS[activeTicket.category] || "#6B7280",
                  }}>
                  {activeTicket.category}
                </span>
                <p className="text-xs text-white/60 truncate">{activeTicket.subject}</p>
                <p className="text-[10px] font-mono text-white/20 shrink-0 ml-auto">{activeTicket.reference}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4">
                {messages.length > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] text-white/20 font-medium">
                      {fmtDate(messages[0]?.created_at)}
                    </span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                )}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} isAgent={msg.sender_type === "agent"} />
                ))}
                {userTyping && <TypingIndicator name={activeTicket.user?.name} />}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 sm:px-5 py-3 sm:py-4 border-t border-white/6 bg-[#0D1F1A] shrink-0">
                <div className="flex items-end gap-2 sm:gap-3 bg-white/4 border border-white/8 hover:border-white/14 focus-within:border-amber-500/30 focus-within:ring-2 focus-within:ring-amber-500/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 transition-all">
                  <textarea
                    value={draft}
                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleDraftChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className="flex-1 bg-transparent text-white placeholder-white/20 text-sm outline-none resize-none leading-relaxed max-h-28"
                    style={{ scrollbarWidth: "none" }}
                  />
                  <button onClick={handleSend} disabled={!draft.trim() || sending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: draft.trim() ? "linear-gradient(135deg, #C8873A, #E8A850)" : "rgba(255,255,255,0.05)" }}>
                    {sending
                      ? <Loader2 size={15} className={draft.trim() ? "text-[#0D1F1A] animate-spin" : "text-white/55 animate-spin"} />
                      : <Send size={15} className={draft.trim() ? "text-[#0D1F1A]" : "text-white/55"} />}
                  </button>
                </div>
                <p className="text-[10px] text-white/15 mt-1.5 text-center hidden sm:block">
                  Messages are end-to-end delivered · Ticket {activeTicket.reference}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Claiming overlay */}
      {claiming && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#0D1F1A] border border-white/10 rounded-2xl px-8 py-6 flex items-center gap-4">
            <Loader2 size={20} className="text-amber-400 animate-spin" />
            <p className="text-sm text-white/70">Claiming ticket…</p>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2, Send, Paperclip, X, Bot, User, Wifi,
  WifiOff, Clock, CheckCheck, AlertCircle, UserCheck,
  PhoneOff, ChevronDown, Sparkles, MessageSquare,
} from "lucide-react";
import Pusher, { type Channel } from "pusher-js";
import type { ChannelAuthorizerGenerator } from "pusher-js/types/src/core/auth/deprecated_channel_authorizer";
import type { ChannelAuthorizationCallback } from "pusher-js/types/src/core/auth/options";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

interface LiveChatMessage {
  id: string | number;
  body: string;
  sender_type: "user" | "agent" | "system" | string;
  created_at: string;
  optimistic?: boolean;
}

interface LiveChatTicket {
  id: string | number;
  reference?: string;
}

type Phase = "request" | "queued" | "chat" | "ended";
type WsStatus = "connecting" | "connected" | "disconnected";

/* ── Design tokens ────────────────────── */
const BG        = "#0A1A13";
const SURFACE   = "rgba(255,255,255,0.04)";
const BORDER    = "rgba(255,255,255,0.08)";
const BORDER_HV = "rgba(255,255,255,0.15)";
const AMBER     = "#C8873A";
const AMBER2    = "#E8A850";
const MUTED     = "rgba(255,255,255,0.35)";
const DIMMED    = "rgba(255,255,255,0.18)";
const grad      = `linear-gradient(135deg, ${AMBER} 0%, ${AMBER2} 100%)`;

const inp =
  `w-full bg-white/4 border border-white/8 hover:border-white/16 text-white ` +
  `placeholder-white/20 rounded-2xl px-4 py-3.5 text-sm focus:outline-none ` +
  `focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15 transition-all duration-200`;

/* ── Broadcasting auth — routed through our axios instance so the httpOnly
   session cookie is sent automatically (withCredentials), instead of
   reading the (now-inaccessible) token out of document.cookie. ── */
const broadcastAuthorizer: ChannelAuthorizerGenerator = (channel: Channel) => {
  return {
    authorize: (socketId: string, callback: ChannelAuthorizationCallback) => {
      api
        .post("/broadcasting/auth", { socket_id: socketId, channel_name: channel.name })
        .then((res) => callback(null, res.data))
        .catch((err) => callback(err, null));
    },
  };
};

/* ── Pusher singleton ─────────────────────────────────────────────────────── */
let pusherInstance: Pusher | null = null;

function getPusher(): Pusher {
  if (!pusherInstance) {
    // Strip any protocol prefix so it works whether env var has it or not
    const rawHost = process.env.NEXT_PUBLIC_REVERB_HOST ?? "";
    const wsHost  = rawHost.replace(/^https?:\/\//, "").replace(/\/$/, "");

    pusherInstance = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY ?? "", {
      // `cluster` is typed as required by pusher-js's Options even for
      // self-hosted (Reverb) setups where wsHost is used instead and
      // cluster is never actually read — empty string is a safe no-op.
      cluster: "",
      wsHost,
      wsPort:            Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 80),
      wssPort:           Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
      forceTLS:          process.env.NEXT_PUBLIC_REVERB_SCHEME === "https",
      enabledTransports: ["ws", "wss"],
      disableStats:      true,
      authorizer:        broadcastAuthorizer,
    });
  }
  return pusherInstance;
}
/* ══════════════════════════════════════════════════════════════════════════════
   LIVE CHAT VIEW
   Drop-in replacement for AiChatView when the user requests a human agent.
   Props:
     onSwitchToAi  — callback to switch back to AI chat tab
     initialTicket — optional existing ticket to resume
══════════════════════════════════════════════════════════════════════════════ */
interface LiveChatViewProps {
  onSwitchToAi: () => void;
  initialTicket?: (LiveChatTicket & { messages?: LiveChatMessage[] }) | null;
}

export default function LiveChatView({ onSwitchToAi, initialTicket = null }: LiveChatViewProps) {
  const { user }                    = useAuth() ?? {};
  const [phase, setPhase]           = useState<Phase>(initialTicket ? "chat" : "request");
  // phases: 'request' | 'queued' | 'chat' | 'ended'

  const [ticket, setTicket]         = useState<LiveChatTicket | null>(initialTicket);
  const [messages, setMessages]     = useState<LiveChatMessage[]>(initialTicket?.messages ?? []);
  const [input, setInput]           = useState("");
  const [file, setFile]             = useState<File | null>(null);
  const [sending, setSending]       = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);
  const [userTyping, setUserTyping]  = useState(false);
  const [queuePos, setQueuePos]     = useState<number | null>(null);
  const [agentName, setAgentName]   = useState<string | null>(null);
  const [wsStatus, setWsStatus]     = useState<WsStatus>("connecting");
  // wsStatus: 'connecting' | 'connected' | 'disconnected'

  const channelRef   = useRef<Channel | null>(null);
  const bottomRef    = useRef<HTMLDivElement | null>(null);
  const fileRef      = useRef<HTMLInputElement | null>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef  = useRef<HTMLTextAreaElement | null>(null);

  // ── Scroll to bottom on new messages ────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTyping]);

  // ── Check for existing live chat session on mount ────────────────────────────
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const res = await api.get("/support/tickets");
        const tickets: Record<string, unknown>[] = res.data?.data?.data ?? res.data?.data ?? [];

        // Find the most recent live chat ticket that's still active
        const existing = tickets.find((t: Record<string, unknown>) =>
          t.chat_mode === "live" &&
          ["open", "waiting"].includes(t.status as string)
        );

        if (!existing) return;

        // Fetch full ticket with messages
        const full = await api.get(`/support/tickets/${existing.id}`);
        const ticketData = full.data?.data;

        if (!ticketData) return;

        setTicket({ id: ticketData.id, reference: ticketData.reference });
        setMessages(ticketData.messages ?? []);

        if (ticketData.agent_id) {
          // Already claimed by an agent
          setAgentName(ticketData.agent?.name ?? "Support Agent");
          setPhase("chat");
        } else {
          // Still in queue
          setQueuePos(1);
          setPhase("queued");
        }
      } catch {
        // Silently fail — just show the request form
      }
    };

    if (!initialTicket) {
      checkExistingSession();
    }
  }, [initialTicket]);

  // ── Subscribe to WebSocket channel once ticket exists ───────────────────────
  useEffect(() => {
    if (!ticket?.id) return;

    const pusher  = getPusher();
    const channel = pusher.subscribe(`private-support.ticket.${ticket.id}`);
    channelRef.current = channel;

    // Connection state
    pusher.connection.bind("connected",     () => setWsStatus("connected"));
    pusher.connection.bind("disconnected",  () => setWsStatus("disconnected"));
    pusher.connection.bind("connecting",    () => setWsStatus("connecting"));

    // New message from agent
    channel.bind("message.sent", (data: Record<string, any>) => {
      if (data.sender_type !== "user") {
        setMessages(prev => [...prev, {
          id:          data.id,
          body:        data.body,
          sender_type: data.sender_type,
          created_at:  data.created_at,
        }]);
        setAgentTyping(false);
      }
    });

    // Typing indicator
    channel.bind("typing", (data: Record<string, any>) => {
      if (data.sender === "agent") {
        setAgentTyping(data.is_typing);
      }
    });

    // Status changes (queued, agent_joined, ended)
    channel.bind("status.changed", (data: Record<string, any>) => {
      if (data.status === "queued") {
        setQueuePos(data.queue_pos);
        setPhase("queued");
      }

      if (data.status === "agent_joined") {
        setAgentName(data.agent_name);
        setPhase("chat");
        setMessages(prev => [...prev, {
          id:          Date.now(),
          body:        data.message,
          sender_type: "system",
          created_at:  new Date().toISOString(),
        }]);
        toast.success(`${data.agent_name} has joined the chat`);
      }

      if (data.status === "ended") {
        setPhase("ended");
        setMessages(prev => [...prev, {
          id:          Date.now(),
          body:        data.message,
          sender_type: "system",
          created_at:  new Date().toISOString(),
        }]);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-support.ticket.${ticket.id}`);
    };
  }, [ticket?.id]);

  // ── Request live agent ───────────────────────────────────────────────────────
  const [reqForm, setReqForm] = useState({ subject: "", category: "", message: "" });

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post("/support/live-chat/request", reqForm);
      setTicket({ id: res.data.ticket_id, reference: res.data.reference });
      setQueuePos(res.data.queue_pos);
      setPhase("queued");
    } catch {
      toast.error("Could not connect. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return;

    const body = input.trim();
    setInput("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";

    // Optimistic UI
    const optimistic: LiveChatMessage = {
      id:          Date.now(),
      body,
      sender_type: "user",
      created_at:  new Date().toISOString(),
      optimistic:  true,
    };
    setMessages(prev => [...prev, optimistic]);

    setSending(true);
    try {
      const fd = new FormData();
      fd.append("body", body);
      if (file) fd.append("attachment", file);

      const res = await api.post(`/support/live-chat/${ticket!.id}/message`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Replace optimistic with real message
      setMessages(prev => prev.map(m =>
        m.id === optimistic.id ? { ...res.data.data, optimistic: false } : m
      ));
    } catch {
      toast.error("Failed to send message.");
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ─────────────────────────────────────────────────────────
  const sendTyping = useCallback(async (isTyping: boolean) => {
    if (!ticket?.id) return;
    try {
      await api.post(`/support/live-chat/${ticket.id}/typing`, { is_typing: isTyping });
    } catch {}
  }, [ticket?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (!userTyping) {
      setUserTyping(true);
      sendTyping(true);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setUserTyping(false);
      sendTyping(false);
    }, 1500);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const fmtTime = (d?: string) => d
    ? new Date(d).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    : "";

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: REQUEST FORM
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "request") return (
    <div className="max-w-lg space-y-4">
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: "rgba(200,135,58,0.07)", border: "1px solid rgba(200,135,58,0.18)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: grad }}>
          <UserCheck size={15} className="text-[#0A1A13]" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">Connect to a human agent</p>
          <p className="text-xs mt-0.5" style={{ color: DIMMED }}>Typical wait time: 2–5 minutes</p>
        </div>
        <button onClick={onSwitchToAi}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
          style={{ color: MUTED, border: `1px solid ${BORDER}` }}
          onMouseEnter={e => e.currentTarget.style.color = "#fff"}
          onMouseLeave={e => e.currentTarget.style.color = MUTED}>
          <Bot size={12} /> AI instead
        </button>
      </div>

      <div className="rounded-2xl p-6" style={{ background: SURFACE, border: `1px solid ${BORDER}` }}>
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-white/55 uppercase tracking-[0.15em] mb-2">
              Subject *
            </label>
            <input value={reqForm.subject}
              onChange={e => setReqForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="What do you need help with?" required className={inp} />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/55 uppercase tracking-[0.15em] mb-2">
              Category *
            </label>
            <div className="relative">
              <select value={reqForm.category}
                onChange={e => setReqForm(f => ({ ...f, category: e.target.value }))}
                required className={inp + " appearance-none cursor-pointer"}
                style={{ backgroundColor: "#0f2318" }}>
                <option value="" disabled>Select a topic</option>
                {["account","payment","kyc","investment","withdrawal","other"].map(c => (
                  <option key={c} value={c} className="capitalize">{c}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: DIMMED }} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-white/55 uppercase tracking-[0.15em] mb-2">
              Initial message *
            </label>
            <textarea value={reqForm.message}
              onChange={e => setReqForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Briefly describe your issue so the agent can be ready to help…"
              rows={4} required className={inp + " resize-none"} />
          </div>

          <button type="submit" disabled={sending}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-[#0A1A13] transition-all hover:scale-[1.01] disabled:opacity-50"
            style={{ background: grad }}>
            {sending ? <><Loader2 size={15} className="animate-spin" />Connecting…</> : <><UserCheck size={15} />Request Live Agent</>}
          </button>
        </form>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: QUEUED
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === "queued") return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(200,135,58,0.1)", border: "1px solid rgba(200,135,58,0.2)" }}>
          <Clock size={32} style={{ color: AMBER }} />
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-[#0A1A13]"
          style={{ background: grad }}>
          {queuePos}
        </span>
      </div>

      <div>
        <p className="font-bold text-white text-lg" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
          You&apos;re in the queue
        </p>
        <p className="text-sm mt-1.5" style={{ color: DIMMED }}>
          Position <span className="font-bold text-white">{queuePos}</span> · An agent will join shortly
        </p>
        {ticket?.reference && (
          <p className="text-xs mt-2 font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
            Ref: {ticket.reference}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs" style={{ color: DIMMED }}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Waiting for available agent…
      </div>

      <button onClick={onSwitchToAi}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
        style={{ color: MUTED, border: `1px solid ${BORDER}` }}
        onMouseEnter={e => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = BORDER_HV; }}
        onMouseLeave={e => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; }}>
        <Bot size={14} /> Switch to AI Chat while waiting
      </button>
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: CHAT / ENDED
  // ════════════════════════════════════════════════════════════════════════════
  const isEnded = phase === "ended";

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 220px)", minHeight: 460 }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 mb-3 shrink-0"
        style={{ background: "rgba(200,135,58,0.07)", border: "1px solid rgba(200,135,58,0.18)" }}>

        {/* Agent avatar */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm"
          style={{ background: grad, color: "#0A1A13" }}>
          {agentName ? agentName[0].toUpperCase() : <UserCheck size={15} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm leading-none">
            {agentName ?? "Connecting to agent…"}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: DIMMED }}>
            {isEnded ? "Chat ended" : agentTyping ? "Typing…" : "Live Support · Human Agent"}
          </p>
        </div>

        {/* WS status */}
        <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0"
          style={{ color: wsStatus === "connected" ? "#34D399" : wsStatus === "connecting" ? AMBER : "#EF4444" }}>
          {wsStatus === "connected"
            ? <><Wifi size={12} /><span className="hidden sm:inline">Live</span></>
            : wsStatus === "connecting"
              ? <><Loader2 size={12} className="animate-spin" /><span className="hidden sm:inline">Connecting</span></>
              : <><WifiOff size={12} /><span className="hidden sm:inline">Offline</span></>
          }
        </div>

        {ticket?.reference && (
          <span className="text-[10px] font-mono hidden sm:block" style={{ color: "rgba(255,255,255,0.2)" }}>
            {ticket.reference}
          </span>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto rounded-2xl px-3 py-4 sm:px-5 sm:py-5 space-y-4"
        style={{ background: "rgba(5,15,10,0.7)", border: `1px solid ${BORDER}` }}>

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <MessageSquare size={28} style={{ color: DIMMED }} />
            <p className="text-xs" style={{ color: DIMMED }}>Conversation will appear here</p>
          </div>
        )}

        {messages.map((m: LiveChatMessage, i: number) => {
          const isUser   = m.sender_type === "user";
          const isSystem = m.sender_type === "system";

          if (isSystem) return (
            <div key={m.id ?? i} className="flex justify-center">
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold"
                style={{ background: "rgba(255,255,255,0.06)", color: DIMMED, border: `1px solid ${BORDER}` }}>
                {m.body}
              </span>
            </div>
          );

          return (
            <div key={m.id ?? i} className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-black self-end`}
                style={isUser
                  ? { background: grad, color: "#0A1A13" }
                  : { background: "rgba(200,135,58,0.12)", border: "1px solid rgba(200,135,58,0.2)", color: AMBER }
                }>
                {isUser ? (user?.name?.[0]?.toUpperCase() || "U") : (agentName?.[0]?.toUpperCase() ?? "A")}
              </div>

              <div className={`flex flex-col gap-1 ${isUser ? "items-end max-w-[80%]" : "items-start max-w-[80%]"}`}>
                <div
                  className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser ? "rounded-2xl rounded-tr-sm" : "rounded-2xl rounded-tl-sm"
                  } ${m.optimistic ? "opacity-60" : ""}`}
                  style={isUser
                    ? { background: grad, color: "#0A1A13" }
                    : { background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.85)" }
                  }>
                  {m.body}
                </div>
                <div className="flex items-center gap-1.5 px-1" style={{ color: "rgba(255,255,255,0.18)" }}>
                  <span className="text-[10px]">{fmtTime(m.created_at)}</span>
                  {isUser && !m.optimistic && <CheckCheck size={10} style={{ color: "#34D399" }} />}
                  {isUser && m.optimistic && <Clock size={10} />}
                </div>
              </div>
            </div>
          );
        })}

        {/* Agent typing bubble */}
        {agentTyping && !isEnded && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(200,135,58,0.12)", border: "1px solid rgba(200,135,58,0.2)", color: AMBER }}>
              {agentName?.[0]?.toUpperCase() ?? "A"}
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

      {/* ── Input or ended banner ── */}
      {isEnded ? (
        <div className="mt-2.5 shrink-0 rounded-2xl p-4 flex items-center justify-between gap-4"
          style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <div className="flex items-center gap-2.5 text-sm text-emerald-400">
            <PhoneOff size={14} />
            Chat ended · Ticket resolved
          </div>
          <button onClick={onSwitchToAi}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#0A1A13] transition-all hover:scale-[1.02]"
            style={{ background: grad }}>
            <Bot size={12} /> Back to AI Chat
          </button>
        </div>
      ) : (
        <div className="mt-2.5 shrink-0 space-y-2">
          {file && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs w-fit"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: MUTED }}>
              <Paperclip size={11} />
              <span className="max-w-40 truncate">{file.name}</span>
              <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-white/20 hover:text-red-400 transition-colors">
                <X size={11} />
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <button onClick={() => fileRef.current?.click()}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, color: file ? AMBER : DIMMED }}>
              <Paperclip size={15} />
            </button>
            <input ref={fileRef} type="file" className="hidden" accept="image/*,.pdf"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={agentName ? "Type a message… (Enter to send)" : "Waiting for agent to join…"}
              disabled={!agentName}
              rows={1}
              className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none transition-all duration-200 disabled:opacity-40"
              style={{ background: SURFACE, border: `1px solid ${BORDER}`, maxHeight: 80, lineHeight: 1.5 }}
              onFocus={e => e.currentTarget.style.borderColor = "rgba(200,135,58,0.6)"}
              onBlur={e => e.currentTarget.style.borderColor = BORDER}
            />

            <button onClick={handleSend}
              disabled={!input.trim() || sending || !agentName}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed"
              style={{ background: grad, color: "#0A1A13" }}>
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>

          <p className="text-[10px] text-center" style={{ color: "rgba(255,255,255,0.12)" }}>
            {agentName
              ? `You're chatting with ${agentName} · Messages are end-to-end encrypted`
              : "Waiting for an available agent · Average wait 2–5 min"}
          </p>
        </div>
      )}
    </div>
  );
}

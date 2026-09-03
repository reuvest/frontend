"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, User, Loader2, Send } from "lucide-react";
import { sendChatMessage, ChatMessage } from "../../../services/supportService";
import { appname, FAQ_PREVIEWS } from "./constants";
import type { AuthUser } from "../../../context/AuthContext";

interface DisplayMessage extends ChatMessage {
  isError?: boolean;
}

interface ChatTabProps {
  user: AuthUser | null | undefined;
  onEscalate: () => void;
}

export default function ChatTab({ user, onEscalate }: ChatTabProps) {
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      role: "assistant",
      content: `Hi ${user?.name?.split(" ")[0] || "there"}! 👋 I'm your ${appname} assistant. Ask me anything about your account, investments, or payments.`,
    },
  ]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
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

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Quick replies */}
      <div className="px-3 pt-2.5 pb-1 flex gap-1.5 flex-wrap border-b border-white/5">
        {FAQ_PREVIEWS.map(q => (
          <button key={q} onClick={() => send(q)}
            className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 text-white/60 hover:text-amber-400 hover:border-amber-500/30 transition-all bg-white/3">
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

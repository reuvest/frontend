"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { MessageCircle, X, Sparkles, ExternalLink, Bot, HelpCircle, Ticket } from "lucide-react";
import Link from "next/link";
import { appname } from "./support/constants";
// import ChatTab from "./support/ChatTab";
import FaqTab from "./support/FaqTab";
import TicketTab from "./support/TicketTab";
import GuestSupportBubble from "./support/GuestSupportBubble";

export default function SupportWidget() {
  const { user } = useAuth() ?? {};
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState("faq");
  const [pulse, setPulse]   = useState(true);

  // Guests see a minimal bubble that opens a contact form (no AI chat / ticket tracking)
  if (!user) return <GuestSupportBubble />;

  return (
    <>
      {/* Floating bubble */}
      <div
        className={
          open
            ? "fixed inset-0 z-9999 flex items-end justify-center sm:items-start sm:justify-end sm:inset-auto sm:bottom-24 sm:right-6"
            : "fixed bottom-4 sm:bottom-24 right-4 sm:right-6 z-9999"
        }
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Backdrop — mobile only, tap outside to close */}
        {open && (
          <div
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 sm:hidden"
            aria-hidden
          />
        )}

        {!open && (
          <button
            onClick={() => { setOpen(true); setPulse(false); }}
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
            className="relative w-full h-[85vh] sm:h-auto sm:w-90 sm:max-w-90 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              background: "#0b1e17",
              border: "1px solid rgba(255,255,255,0.1)",
              maxHeight: "min(85vh, 720px)",
              paddingBottom: "env(safe-area-inset-bottom)",
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
                  <p className="text-white/55 text-xs mt-0.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Online · Replies instantly
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Link href="/support" onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/8 transition-all"
                  title="Open full support page">
                  <ExternalLink size={13} />
                </Link>
                <button onClick={() => setOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/8 transition-all">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/8">
              {[
                // { id: "chat",   icon: <Bot size={13} />,      label: "AI Chat"  },
                { id: "faq",    icon: <HelpCircle size={13} />, label: "FAQ"    },
                { id: "ticket", icon: <Ticket size={13} />,   label: "Ticket"   },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold transition-all ${
                    tab === t.id
                      ? "text-amber-500 border-b-2 border-amber-500"
                      : "text-white/55 hover:text-white/60"
                  }`}
                  style={{ marginBottom: tab === t.id ? "-1px" : 0 }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* {tab === "chat"   && <ChatTab user={user} onEscalate={() => setTab("ticket")} />} */}
              {tab === "faq"    && <FaqTab />}
              {tab === "ticket" && <TicketTab user={user} />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

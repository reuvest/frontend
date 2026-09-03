"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  MessageCircle, X, Send, Paperclip, ChevronDown,
  Sparkles, CheckCircle, Loader2,
} from "lucide-react";
import { createGuestTicket } from "../../../services/supportService";
import { GUEST_CATEGORIES, inputClass, selectClass } from "./constants";

interface GuestForm {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export default function GuestSupportBubble() {
  const [open, setOpen]         = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [reference, setReference] = useState("");
  const [file, setFile]         = useState<File | null>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);
  const [form, setForm]         = useState<GuestForm>({
    name: "", email: "", subject: "", category: "", message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        <button onClick={() => setOpen(true)} aria-label="Contact support"
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95"
          style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
          <MessageCircle size={24} className="text-[#0D1F1A]" />
        </button>
      )}

      {open && (
        <div className="relative w-full h-[85vh] sm:h-auto sm:w-85 sm:max-w-85 rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{
            background: "#0b1e17",
            border: "1px solid rgba(255,255,255,0.1)",
            maxHeight: "min(85vh, 680px)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}>

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
                <p className="text-white/55 text-xs mt-0.5">We respond within 24 hours</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/8 transition-all">
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
                  <p className="text-white/55 text-xs mt-1">We&apos;ll reply to your email within 24 hours.</p>
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
                <p className="text-xs text-white/55 mb-3">
                  Not logged in?{" "}
                  <Link href="/login" className="text-amber-500 hover:text-amber-400">Sign in</Link>
                  {" "}for chat & ticket tracking.
                </p>

                {/* Name + Email */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Name</label>
                    <input name="name" value={form.name} onChange={handleChange} required
                      placeholder="Your name" className={inputClass + " text-xs py-2.5"} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="you@email.com" className={inputClass + " text-xs py-2.5"} />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Topic</label>
                  <div className="relative">
                    <select name="category" value={form.category} onChange={handleChange} required
                      className={selectClass + " text-xs py-2.5"}>
                      <option value="" disabled>Select topic</option>
                      {GUEST_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 pointer-events-none" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange} required
                    placeholder="Brief summary" className={inputClass + " text-xs py-2.5"} />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Message</label>
                  <textarea name="message" value={form.message} onChange={handleChange} required
                    rows={3} placeholder="Describe your issue…"
                    className={inputClass + " text-xs py-2.5 resize-none"} />
                </div>

                {/* Attachment */}
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-amber-500/30 text-white/55 hover:text-amber-400 text-xs transition-all">
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

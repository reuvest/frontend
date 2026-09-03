"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronDown, Paperclip, Send, Loader2, CheckCircle } from "lucide-react";
import { createTicket, TicketPriority } from "../../../services/supportService";
import { TICKET_CATEGORIES, inputClass, selectClass } from "./constants";
import type { AuthUser } from "../../../context/AuthContext";

interface TicketForm {
  subject: string;
  category: string;
  message: string;
  priority: TicketPriority;
}

interface TicketTabProps {
  user: AuthUser | null | undefined;
}

export default function TicketTab({ user }: TicketTabProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [form, setForm]           = useState<TicketForm>({ subject: "", category: "", message: "", priority: "normal" });
  const [file, setFile]           = useState<File | null>(null);
  const fileRef                   = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        <p className="text-white/55 text-xs mt-1">We&apos;ll respond to your email within 24 hours.</p>
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
          <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Subject</label>
          <input name="subject" value={form.subject} onChange={handleChange}
            placeholder="Brief description of your issue" required
            className={inputClass + " text-xs py-2.5"} />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Category</label>
          <div className="relative">
            <select name="category" value={form.category} onChange={handleChange} required
              className={selectClass + " text-xs py-2.5"}>
              <option value="" disabled>Select a category</option>
              {TICKET_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 pointer-events-none" />
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange}
            placeholder="Describe your issue in detail…" rows={4} required
            className={inputClass + " text-xs py-2.5 resize-none"} />
        </div>

        {/* Attachment */}
        <div>
          <label className="block text-[10px] font-bold text-white/55 uppercase tracking-widest mb-1.5">
            Attachment <span className="normal-case font-normal">(optional, max 5MB)</span>
          </label>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-white/15 hover:border-amber-500/30 text-white/55 hover:text-amber-400 text-xs transition-all bg-white/2">
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

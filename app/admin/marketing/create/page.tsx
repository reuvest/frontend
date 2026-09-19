"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createMailCampaign } from "../../../../services/adminService";
import RichTextEditor from "../../../components/RichTextEditor";
import EmailPreviewModal from "../../../components/EmailPreviewModal";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import { ArrowLeft, Send, Code2, Inbox } from "lucide-react";

interface ApiErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

const SEGMENTS = [
  { value: "all",                  label: "All users",            hint: "Every verified, active user who hasn't opted out." },
  { value: "verified_no_purchase", label: "Verified, no purchase", hint: "Verified users who haven't bought a land unit yet." },
  { value: "custom",               label: "Custom user IDs",       hint: "Pick specific users by ID." },
] as const;

export default function CreateMailCampaignPage() {
  const router = useRouter();
  const [name, setName]             = useState("");
  const [subject, setSubject]       = useState("");
  const [bodyHtml, setBodyHtml]     = useState("");
  const [segment, setSegment]       = useState<"all" | "verified_no_purchase" | "custom">("all");
  const [userIdsRaw, setUserIdsRaw] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showSource, setShowSource] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving]         = useState(false);

  const handleSubmit = async () => {
    if (!name.trim())    { toast.error("Campaign name is required"); return; }
    if (!subject.trim()) { toast.error("Subject is required"); return; }
    if (!bodyHtml.trim()) { toast.error("Email body is required"); return; }

    const userIds = userIdsRaw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter(n => !Number.isNaN(n));

    if (segment === "custom" && userIds.length === 0) {
      toast.error("Enter at least one user ID");
      return;
    }

    try {
      setSaving(true);
      const res = await createMailCampaign({
        name,
        subject,
        body_html: bodyHtml,
        audience_filter: segment === "custom" ? { segment, user_ids: userIds } : { segment },
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      toast.success(
        scheduledAt
          ? `Campaign scheduled — ${res.data.total_recipients} recipients queued`
          : `Draft saved — ${res.data.total_recipients} recipients matched`
      );
      router.push(`/admin/marketing/${res.data.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      const firstError = axiosErr.response?.data?.errors
        ? Object.values(axiosErr.response.data.errors)[0]?.[0]
        : undefined;
      toast.error(firstError || axiosErr.response?.data?.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link href="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Campaigns
        </Link>

        <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Admin Panel</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
          New Campaign
        </h1>

        <div className="space-y-6">

          {/* Name & subject */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">Campaign Name</label>
              <input value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="e.g. October Land Drop"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
              <p className="text-[10px] text-white/25 mt-1">Internal only — recipients never see this.</p>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">Email Subject</label>
              <input value={subject} onChange={(e: ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                placeholder="e.g. New land just listed 🏡"
                className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
            </div>
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-white/55">Email Body</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300">
                  <Inbox size={12} /> Preview inbox
                </button>
                <button onClick={() => setShowSource(!showSource)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-white/50 hover:text-white/60">
                  <Code2 size={12} /> {showSource ? "Hide HTML" : "View HTML"}
                </button>
              </div>
            </div>
            <RichTextEditor value={bodyHtml} onChange={setBodyHtml}
              placeholder="Write your campaign content here — this gets slotted into the branded email template automatically." />
            {showSource && (
              <textarea value={bodyHtml} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setBodyHtml(e.target.value)}
                rows={6}
                className="mt-2 w-full bg-black/30 border border-white/10 text-white/60 placeholder-white/20 px-4 py-3 rounded-xl text-xs outline-none transition-all font-mono resize-y" />
            )}
            <p className="text-[10px] text-white/25 mt-1">
              This is wrapped in the standard branded template, including logo, footer, and a one-click unsubscribe link — write only the message itself.
            </p>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">Audience</label>
            <div className="grid gap-2">
              {SEGMENTS.map(s => (
                <button key={s.value} onClick={() => setSegment(s.value)}
                  className={`text-left p-3.5 rounded-xl border transition-all ${
                    segment === s.value
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}>
                  <p className={`text-sm font-semibold ${segment === s.value ? "text-amber-400" : "text-white/70"}`}>{s.label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{s.hint}</p>
                </button>
              ))}
            </div>
            {segment === "custom" && (
              <input value={userIdsRaw} onChange={(e: ChangeEvent<HTMLInputElement>) => setUserIdsRaw(e.target.value)}
                placeholder="e.g. 14, 22, 108"
                className="mt-3 w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
            )}
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/55 mb-2">Send Time (optional)</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e: ChangeEvent<HTMLInputElement>) => setScheduledAt(e.target.value)}
              className="w-full sm:w-64 bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white px-4 py-2.5 rounded-xl text-sm outline-none transition-all" />
            <p className="text-[10px] text-white/25 mt-1">
              Leave blank to save as a draft you can schedule later. Sends go out gradually in the background, not all at once.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#0D1F1A] disabled:opacity-50 transition-all"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
              {saving
                ? <div className="w-4 h-4 border-2 border-[#0D1F1A]/30 border-t-[#0D1F1A] rounded-full animate-spin" />
                : <Send size={15} />}
              {scheduledAt ? "Schedule Campaign" : "Save as Draft"}
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <EmailPreviewModal subject={subject} bodyHtml={bodyHtml} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

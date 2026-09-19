"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getMailCampaign, scheduleMailCampaign, cancelMailCampaign, type MailCampaign,
} from "../../../../services/adminService";
import EmailPreviewModal from "../../../components/EmailPreviewModal";
import toast from "react-hot-toast";
import type { AxiosError } from "axios";
import {
  ArrowLeft, Mail, Send, Clock, CheckCircle, XCircle, PenLine,
  Users, RefreshCw, Ban, CalendarClock, Inbox,
} from "lucide-react";

interface ApiErrorBody { message?: string; }

const STATUS_STYLE: Record<MailCampaign["status"], { label: string; icon: React.ReactNode; className: string }> = {
  draft:     { label: "Draft",     icon: <PenLine size={11} />,     className: "border-white/10 bg-white/5 text-white/55" },
  scheduled: { label: "Scheduled", icon: <Clock size={11} />,       className: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  sending:   { label: "Sending",   icon: <Send size={11} />,        className: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  completed: { label: "Completed", icon: <CheckCircle size={11} />, className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelled", icon: <XCircle size={11} />,     className: "border-red-500/20 bg-red-500/10 text-red-400" },
};

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-bold uppercase tracking-widest text-white/55 mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: accent }}>{value}</p>
    </div>
  );
}

export default function MailCampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [campaign, setCampaign] = useState<MailCampaign | null>(null);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const fetchCampaign = useCallback(async () => {
    try {
      setLoading(true);
      const body = await getMailCampaign(id);
      setCampaign(body.data);
    } catch {
      toast.error("Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCampaign(); }, [fetchCampaign]);

  // Poll while actively sending so progress updates without a manual refresh.
  useEffect(() => {
    if (campaign?.status !== "sending") return;
    const interval = setInterval(fetchCampaign, 8000);
    return () => clearInterval(interval);
  }, [campaign?.status, fetchCampaign]);

  const handleSchedule = async () => {
    if (!campaign) return;
    try {
      setActing(true);
      const res = await scheduleMailCampaign(campaign.id);
      setCampaign(res.data);
      toast.success("Campaign scheduled to send now");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      toast.error(axiosErr.response?.data?.message || "Failed to schedule");
    } finally {
      setActing(false);
    }
  };

  const handleCancel = async () => {
    if (!campaign) return;
    if (!window.confirm("Cancel this campaign? Recipients already sent to won't be affected, but no further sends will go out.")) return;
    try {
      setActing(true);
      const res = await cancelMailCampaign(campaign.id);
      setCampaign(res.data);
      toast.success("Campaign cancelled");
    } catch (err) {
      const axiosErr = err as AxiosError<ApiErrorBody>;
      toast.error(axiosErr.response?.data?.message || "Failed to cancel");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex flex-col items-center justify-center gap-4 text-white/55">
        <p>Campaign not found</p>
        <Link href="/admin/marketing" className="text-amber-500 text-sm">Back to Campaigns</Link>
      </div>
    );
  }

  const resolved = campaign.sent_count + campaign.failed_count + campaign.skipped_count;
  const progress = campaign.total_recipients > 0 ? Math.round((resolved / campaign.total_recipients) * 100) : 0;
  const style = STATUS_STYLE[campaign.status];

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link href="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Campaigns
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border mb-3 ${style.className}`}>
              {style.icon} {style.label}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              <Mail size={24} className="text-amber-500" /> {campaign.name}
            </h1>
            <p className="text-white/55 mt-1 text-sm">{campaign.subject}</p>
            {campaign.creator && <p className="text-white/25 text-xs mt-1">Created by {campaign.creator.name}</p>}
          </div>

          <div className="flex gap-2">
            <button onClick={fetchCampaign}
              className="group flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white/55 border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all">
              <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
            {campaign.status === "draft" && (
              <button onClick={handleSchedule} disabled={acting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0D1F1A] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                <CalendarClock size={13} /> Send Now
              </button>
            )}
            {["draft", "scheduled", "sending"].includes(campaign.status) && (
              <button onClick={handleCancel} disabled={acting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50">
                <Ban size={13} /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-white/55 flex items-center gap-1.5">
              <Users size={12} className="text-amber-500" /> Delivery Progress
            </p>
            <p className="text-xs text-white/40">{resolved} / {campaign.total_recipients}</p>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-3">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
          </div>
          {campaign.status === "sending" && (
            <p className="text-[11px] text-white/30">Sending gradually in the background — this refreshes automatically.</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="Recipients" value={campaign.total_recipients} accent="#ffffff" />
          <StatCard label="Sent"       value={campaign.sent_count}       accent="#34D399" />
          <StatCard label="Failed"     value={campaign.failed_count}     accent="#F87171" />
          <StatCard label="Skipped"    value={campaign.skipped_count}    accent="#FBBF24" />
        </div>

        {/* Body preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-white/55">Email Body</p>
            <button onClick={() => setShowPreview(true)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300">
              <Inbox size={12} /> Preview inbox
            </button>
          </div>
          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/80 leading-relaxed overflow-auto"
            dangerouslySetInnerHTML={{ __html: campaign.body_html }}
          />
        </div>
      </div>

      {showPreview && (
        <EmailPreviewModal subject={campaign.subject} bodyHtml={campaign.body_html} onClose={() => setShowPreview(false)} />
      )}
    </div>
  );
}

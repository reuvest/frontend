"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getMailCampaigns, type MailCampaign } from "../../../services/adminService";
import toast from "react-hot-toast";
import {
  ArrowLeft, Plus, RefreshCw, Mail, Send, Clock,
  CheckCircle, XCircle, PenLine, ChevronLeft, ChevronRight, Filter,
} from "lucide-react";

const STATUS_FILTERS = [
  ["", "All"],
  ["draft", "Draft"],
  ["scheduled", "Scheduled"],
  ["sending", "Sending"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
] as const;

const STATUS_STYLE: Record<MailCampaign["status"], { label: string; icon: React.ReactNode; className: string }> = {
  draft:     { label: "Draft",     icon: <PenLine size={9} />,     className: "border-white/10 bg-white/5 text-white/55" },
  scheduled: { label: "Scheduled", icon: <Clock size={9} />,       className: "border-amber-500/20 bg-amber-500/10 text-amber-400" },
  sending:   { label: "Sending",   icon: <Send size={9} />,        className: "border-blue-500/20 bg-blue-500/10 text-blue-400" },
  completed: { label: "Completed", icon: <CheckCircle size={9} />, className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelled", icon: <XCircle size={9} />,     className: "border-red-500/20 bg-red-500/10 text-red-400" },
};

function StatusBadge({ status }: { status: MailCampaign["status"] }) {
  const s = STATUS_STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${s.className}`}>
      {s.icon} {s.label}
    </span>
  );
}

interface Pagination {
  current_page: number;
  last_page: number;
  total: number;
}

export default function AdminMarketingPage() {
  const [campaigns, setCampaigns]   = useState<MailCampaign[]>([]);
  const [loading, setLoading]       = useState(true);
  const [status, setStatus]         = useState("");
  const [page, setPage]             = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ current_page: 1, last_page: 1, total: 0 });

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (status) params.set("status", status);
      const body = await getMailCampaigns(params.toString()) as {
        data: { data?: MailCampaign[]; current_page?: number; last_page?: number; total?: number };
      };
      const d = body.data;
      setCampaigns(d.data ?? []);
      setPagination({ current_page: d.current_page ?? 1, last_page: d.last_page ?? 1, total: d.total ?? 0 });
    } catch {
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);
  useEffect(() => { setPage(1); }, [status]);

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}>
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Admin Panel</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              <Mail size={28} className="text-amber-500" /> Marketing Campaigns
            </h1>
            <p className="text-white/60 mt-1 text-sm">{pagination.total} campaign{pagination.total === 1 ? "" : "s"}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchCampaigns}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/55 border border-white/10 hover:border-white/20 hover:text-white/60 hover:bg-white/5 transition-all">
              <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
              Refresh
            </button>
            <Link href="/admin/marketing/create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0D1F1A]"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
              <Plus size={14} /> New Campaign
            </Link>
          </div>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter size={13} className="text-white/25 mr-1" />
          {STATUS_FILTERS.map(([value, label]) => (
            <button key={value} onClick={() => setStatus(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                status === value
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-2xl">
            <Mail size={36} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/55 mb-4">No campaigns yet</p>
            <Link href="/admin/marketing/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0D1F1A]"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
              <Plus size={14} /> Create your first campaign
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-6">
              {campaigns.map(c => {
                const progress = c.total_recipients > 0
                  ? Math.round(((c.sent_count + c.failed_count + c.skipped_count) / c.total_recipients) * 100)
                  : 0;
                return (
                  <Link key={c.id} href={`/admin/marketing/${c.id}`}
                    className="block rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 hover:border-white/20 hover:bg-white/[0.07] transition-all">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={c.status} />
                          <span className="text-[10px] text-white/30">
                            {c.audience_filter.segment === "custom"
                              ? `${c.audience_filter.user_ids?.length ?? 0} selected users`
                              : c.audience_filter.segment.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white truncate">{c.name}</p>
                        <p className="text-xs text-white/50 truncate">{c.subject}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-white tabular-nums">{c.total_recipients}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wide">recipients</p>
                      </div>
                    </div>

                    {c.total_recipients > 0 && (c.status === "sending" || c.status === "completed") && (
                      <div>
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-1.5">
                          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-white/40">
                          <span className="text-emerald-400 font-semibold">{c.sent_count} sent</span>
                          {c.failed_count > 0 && <span className="text-red-400 font-semibold">{c.failed_count} failed</span>}
                          {c.skipped_count > 0 && <span>{c.skipped_count} skipped</span>}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/55">Page {pagination.current_page} of {pagination.last_page}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pagination.current_page === 1}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.last_page, p + 1))} disabled={pagination.current_page === pagination.last_page}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

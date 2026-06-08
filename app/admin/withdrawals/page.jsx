"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, AlertTriangle,
  BadgeCheck, RefreshCw, Search, X, ChevronLeft, ChevronRight,
  Wallet, Users, TrendingDown, Filter, MoreHorizontal,
  AlertCircle, Building2, User,
} from "lucide-react";

/* ─── Helpers ───────────────────────────────────────────────────────────── */

const STATUS = {
  pending:    { label: "Pending",    cls: "text-amber-400 bg-amber-500/10 border-amber-500/25",    icon: <Clock         size={10} /> },
  processing: { label: "Processing", cls: "text-blue-400  bg-blue-500/10  border-blue-500/25",     icon: <RefreshCw     size={10} className="animate-spin" /> },
  approved:   { label: "Approved",   cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", icon: <CheckCircle2  size={10} /> },
  completed:  { label: "Completed",  cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25", icon: <BadgeCheck    size={10} /> },
  rejected:   { label: "Rejected",   cls: "text-red-400   bg-red-500/10   border-red-500/25",     icon: <XCircle       size={10} /> },
  failed:     { label: "Failed",     cls: "text-red-400   bg-red-500/10   border-red-500/25",     icon: <AlertTriangle size={10} /> },
};

function StatusBadge({ status }) {
  const cfg = STATUS[status] || STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${cfg.cls}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

const fmtNaira = (kobo) =>
  `₦${(Number(kobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/* ─── Reject modal ──────────────────────────────────────────────────────── */
function RejectModal({ withdrawal, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) { toast.error("Please provide a rejection reason"); return; }
    setLoading(true);
    try {
      await api.post(`/admin/withdrawals/${withdrawal.id}/reject`, { reason });
      toast.success("Withdrawal rejected and funds returned to user");
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Rejection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "#0D1F1A", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>

        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-red-400/70 mb-0.5">Reject Withdrawal</p>
            <p className="text-white font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {fmtNaira(withdrawal.amount_kobo)}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4 flex gap-3">
            <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400/80 leading-relaxed">
              The funds ({fmtNaira(withdrawal.amount_kobo)}) will be immediately returned
              to <strong className="text-red-400">{withdrawal.user?.name}</strong>'s wallet.
              This action cannot be undone.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
              Rejection Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Invalid bank details, suspicious activity…"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-red-500/40 focus:ring-2 focus:ring-red-500/10 text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 text-sm font-semibold transition-all">
              Cancel
            </button>
            <button onClick={handleReject} disabled={loading || !reason.trim()}
              className="flex-1 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)" }}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Rejecting…
                  </span>
                : "Reject & Refund"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Withdrawal detail drawer ──────────────────────────────────────────── */
function WithdrawalDrawer({ withdrawal, onClose, onApprove, onReject, approving }) {
  if (!withdrawal) return null;

  const canApprove = withdrawal.status === "pending";
  const canReject  = ["pending", "failed"].includes(withdrawal.status);

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm h-full overflow-y-auto border-l border-white/10 flex flex-col"
        style={{ background: "#0D1F1A" }}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.07] flex items-center justify-between sticky top-0 bg-[#0D1F1A] z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30 mb-0.5">Withdrawal Details</p>
            <p className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {fmtNaira(withdrawal.amount_kobo)}
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-5">

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/30">Status</span>
            <StatusBadge status={withdrawal.status} />
          </div>

          {/* User info */}
          <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 flex items-center gap-1.5">
              <User size={10} /> User
            </p>
            <div>
              <p className="text-sm font-bold text-white">{withdrawal.user?.name}</p>
              <p className="text-xs text-white/35 mt-0.5">{withdrawal.user?.email}</p>
            </div>
          </div>

          {/* Bank details */}
          <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 flex items-center gap-1.5">
              <Building2 size={10} /> Bank Details
            </p>
            {[
              ["Account Name",   withdrawal.user?.account_name   || "—"],
              ["Account Number", withdrawal.user?.account_number || "—"],
              ["Bank",          withdrawal.user?.bank_name       || "—"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3">
                <span className="text-[11px] text-white/30 shrink-0">{label}</span>
                <span className="text-[11px] text-white/70 text-right font-mono">{value}</span>
              </div>
            ))}
          </div>

          {/* Transaction details */}
          <div className="rounded-xl border border-white/[0.07] bg-white/2.5 p-4 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Transaction</p>
            {[
              ["Reference",   withdrawal.reference],
              ["Requested",   fmtDate(withdrawal.created_at)],
              ["Reviewed",    fmtDate(withdrawal.reviewed_at)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-3">
                <span className="text-[11px] text-white/30 shrink-0">{label}</span>
                <span className="text-[11px] text-white/70 text-right break-all font-mono">{value || "—"}</span>
              </div>
            ))}
          </div>

          {/* Rejection reason (if rejected) */}
          {withdrawal.rejection_reason && (
            <div className="rounded-xl border border-red-500/15 bg-red-500/5 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/60 mb-2">Rejection Reason</p>
              <p className="text-xs text-red-400/80 leading-relaxed">{withdrawal.rejection_reason}</p>
            </div>
          )}

          {/* Failed warning */}
          {withdrawal.status === "failed" && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/80 leading-relaxed">
                Transfer failed on Paystack. Verify on the Paystack dashboard before rejecting — do not refund if the transfer may have succeeded.
              </p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {(canApprove || canReject) && (
          <div className="p-6 border-t border-white/[0.07] space-y-2 sticky bottom-0 bg-[#0D1F1A]">
            {canApprove && (
              <button
                onClick={() => onApprove(withdrawal)}
                disabled={approving === withdrawal.id}
                className="w-full py-3 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
                {approving === withdrawal.id
                  ? <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#0D1F1A]/30 border-t-[#0D1F1A] rounded-full animate-spin" />
                      Approving…
                    </span>
                  : <span className="flex items-center justify-center gap-2">
                      <CheckCircle2 size={15} /> Approve & Transfer
                    </span>}
              </button>
            )}
            {canReject && (
              <button
                onClick={() => onReject(withdrawal)}
                className="w-full py-3 rounded-xl font-bold text-red-400 text-sm border border-red-500/20 hover:bg-red-500/8 transition-all">
                <span className="flex items-center justify-center gap-2">
                  <XCircle size={15} /> Reject & Refund
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-5 relative overflow-hidden group hover:border-white/12 transition-all">
      <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}25, transparent 70%)` }} />
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${accent}18`, color: accent }}>
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
      {sub && <p className="text-[11px] text-white/25 mt-1">{sub}</p>}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────────────────────── */
export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals]     = useState([]);
  const [loading, setLoading]             = useState(true);
  const [filterStatus, setFilterStatus]   = useState("");
  const [search, setSearch]               = useState("");
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState({ current_page: 1, last_page: 1, total: 0 });
  const [approving, setApproving]         = useState(null);
  const [approvingAll, setApprovingAll]   = useState(false);
  const [rejectTarget, setRejectTarget]   = useState(null);
  const [drawerItem, setDrawerItem]       = useState(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, per_page: 20 });
      if (filterStatus) params.set("status", filterStatus);
      const res = await api.get(`/admin/withdrawals?${params}`);
      const d   = res.data.data;
      setWithdrawals(d.data ?? []);
      setPagination({ current_page: d.current_page, last_page: d.last_page, total: d.total });
    } catch {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);
  useEffect(() => { setPage(1); }, [filterStatus]);

  /* ── Approve single ── */
  const handleApprove = async (withdrawal) => {
    if (!window.confirm(`Approve ₦${(withdrawal.amount_kobo / 100).toLocaleString()} withdrawal for ${withdrawal.user?.name}? This will initiate a Paystack transfer immediately.`)) return;
    setApproving(withdrawal.id);
    setDrawerItem(null);
    try {
      await api.post(`/admin/withdrawals/${withdrawal.id}/approve`);
      toast.success("Transfer initiated successfully");
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval failed");
    } finally {
      setApproving(null);
    }
  };

  /* ── Approve all ── */
  const handleApproveAll = async () => {
    const pendingCount = withdrawals.filter((w) => w.status === "pending").length;
    if (!pendingCount) { toast("No pending withdrawals", { icon: "ℹ️" }); return; }
    if (!window.confirm(`Approve all ${pendingCount} pending withdrawal${pendingCount !== 1 ? "s" : ""}? This will initiate Paystack transfers for each.`)) return;
    setApprovingAll(true);
    try {
      const res  = await api.post("/admin/withdrawals/approve-all");
      const data = res.data;
      toast.success(`${data.approved} approved${data.failed ? `, ${data.failed} failed` : ""}`);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Batch approval failed");
    } finally {
      setApprovingAll(false);
    }
  };

  /* ── Stats from current dataset ── */
  const pending    = withdrawals.filter((w) => w.status === "pending").length;
  const processing = withdrawals.filter((w) => w.status === "processing").length;
  const totalKobo  = withdrawals
    .filter((w) => ["pending", "processing"].includes(w.status))
    .reduce((s, w) => s + Number(w.amount_kobo), 0);

  /* ── Client-side search ── */
  const filtered = search.trim()
    ? withdrawals.filter((w) =>
        w.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        w.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        w.reference?.toLowerCase().includes(search.toLowerCase())
      )
    : withdrawals;

  const STATUS_FILTERS = [
    ["",           "All"],
    ["pending",    "Pending"],
    ["processing", "Processing"],
    ["completed",  "Completed"],
    ["rejected",   "Rejected"],
    ["failed",     "Failed"],
  ];

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] rounded-full pointer-events-none opacity-[0.06]"
        style={{ background: "radial-gradient(circle, #C8873A, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Nav */}
        <Link href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-500/60 mb-2">Admin Panel</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Withdrawals
            </h1>
            <p className="text-white/35 text-sm mt-1">{pagination.total} total requests</p>
          </div>

          {/* Approve all button */}
          {pending > 0 && (
            <button
              onClick={handleApproveAll}
              disabled={approvingAll}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
              {approvingAll
                ? <><div className="w-4 h-4 border-2 border-[#0D1F1A]/30 border-t-[#0D1F1A] rounded-full animate-spin" /> Processing…</>
                : <><BadgeCheck size={15} /> Approve All ({pending})</>}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <StatCard label="Pending"    value={pending}                  sub="awaiting review"   accent="#F59E0B" icon={<Clock size={16} />} />
          <StatCard label="Processing" value={processing}               sub="transfer initiated" accent="#3B82F6" icon={<RefreshCw size={16} />} />
          <StatCard label="Queue Value" value={fmtNaira(totalKobo)}    sub="pending + processing" accent="#C8873A" icon={<Wallet size={16} />} />
          <StatCard label="Total"      value={pagination.total.toLocaleString()} sub="all time"  accent="#2D7A55" icon={<Users size={16} />} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, reference…"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 p-1 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
            {STATUS_FILTERS.map(([v, l]) => (
              <button key={v}
                onClick={() => setFilterStatus(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === v
                    ? "bg-white/10 text-white"
                    : "text-white/35 hover:text-white/60"
                }`}>
                {l}
              </button>
            ))}
          </div>

          <button onClick={fetchWithdrawals}
            className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/35 hover:text-white hover:border-white/20 transition-all">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-white/[0.07] bg-white/1.5">
            <TrendingDown size={36} className="mx-auto text-white/10 mb-3" />
            <p className="text-white/25 text-sm">No withdrawals found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-white/[0.07] bg-white/2 overflow-hidden mb-5">
              <div className="grid grid-cols-[1.8fr_1.2fr_1fr_1fr_120px_80px] gap-4 px-5 py-3 border-b border-white/6 bg-white/2">
                {["User", "Amount", "Reference", "Requested", "Status", ""].map((h) => (
                  <span key={h} className="text-[9px] font-black uppercase tracking-[0.22em] text-white/20">{h}</span>
                ))}
              </div>

              {filtered.map((w, i) => (
                <div key={w.id}
                  className={`grid grid-cols-[1.8fr_1.2fr_1fr_1fr_120px_80px] gap-4 px-5 py-4 items-center hover:bg-white/2 cursor-pointer transition-colors ${
                    i < filtered.length - 1 ? "border-b border-white/4" : ""
                  }`}
                  onClick={() => setDrawerItem(w)}>

                  {/* User */}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/85 truncate">{w.user?.name}</p>
                    <p className="text-xs text-white/25 truncate">{w.user?.email}</p>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold text-amber-400 tabular-nums"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {fmtNaira(w.amount_kobo)}
                  </p>

                  {/* Reference */}
                  <p className="text-[11px] font-mono text-white/30 truncate">{w.reference}</p>

                  {/* Date */}
                  <p className="text-xs text-white/30">{fmtDate(w.created_at)}</p>

                  {/* Status */}
                  <StatusBadge status={w.status} />

                  {/* Quick actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {w.status === "pending" && (
                      <button
                        onClick={() => handleApprove(w)}
                        disabled={approving === w.id}
                        title="Approve"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all disabled:opacity-40">
                        {approving === w.id
                          ? <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                          : <CheckCircle2 size={14} />}
                      </button>
                    )}
                    {["pending", "failed"].includes(w.status) && (
                      <button
                        onClick={() => setRejectTarget(w)}
                        title="Reject"
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <XCircle size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => setDrawerItem(w)}
                      title="Details"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3 mb-5">
              {filtered.map((w) => (
                <div key={w.id}
                  className="rounded-2xl border border-white/[0.07] bg-white/2.5 p-4 cursor-pointer hover:border-white/12 transition-all"
                  onClick={() => setDrawerItem(w)}>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{w.user?.name}</p>
                      <p className="text-xs text-white/30 truncate">{w.user?.email}</p>
                    </div>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-amber-400"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      {fmtNaira(w.amount_kobo)}
                    </p>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {w.status === "pending" && (
                        <button onClick={() => handleApprove(w)} disabled={approving === w.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-400/50 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
                          {approving === w.id
                            ? <div className="w-3.5 h-3.5 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                            : <CheckCircle2 size={15} />}
                        </button>
                      )}
                      {["pending", "failed"].includes(w.status) && (
                        <button onClick={() => setRejectTarget(w)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] font-mono text-white/20 mt-2">{w.reference}</p>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/25">
                  Page {pagination.current_page} of {pagination.last_page}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.current_page === 1}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronLeft size={15} />
                  </button>
                  <button onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                    disabled={pagination.current_page === pagination.last_page}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail drawer */}
      <WithdrawalDrawer
        withdrawal={drawerItem}
        onClose={() => setDrawerItem(null)}
        onApprove={(w) => { setDrawerItem(null); handleApprove(w); }}
        onReject={(w)  => { setDrawerItem(null); setRejectTarget(w); }}
        approving={approving}
      />

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          withdrawal={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); fetchWithdrawals(); }}
        />
      )}
    </div>
  );
}
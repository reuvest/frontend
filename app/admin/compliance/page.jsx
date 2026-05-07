"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, AlertTriangle, Ban, CheckCircle,
  RefreshCw, Eye, X, Users, Activity, Database,
  Clock, ChevronRight, Search, FileText,
} from "lucide-react";

// ─── Status config ────────────────────────────────────────────────────────────

const SCREENING_STATUS = {
  flagged: { label: "Flagged",  color: "text-amber-400",   bg: "bg-amber-500/10  border-amber-500/20",   icon: <AlertTriangle size={11} /> },
  blocked: { label: "Blocked",  color: "text-red-400",     bg: "bg-red-500/10    border-red-500/20",     icon: <Ban           size={11} /> },
  clear:   { label: "Cleared",  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle   size={11} /> },
};

const TRIGGER_META = {
  pep_self_declaration: { label: "PEP Self-Declaration", color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
  sanctions_hit:        { label: "Sanctions Hit",        color: "text-red-400",     bg: "bg-red-500/10    border-red-500/20"    },
  fuzzy_match:          { label: "Fuzzy Match",          color: "text-amber-400",   bg: "bg-amber-500/10  border-amber-500/20"  },
  manual:               { label: "Manual Screen",        color: "text-blue-400",    bg: "bg-blue-500/10   border-blue-500/20"   },
  kyc:                  { label: "KYC Screening",        color: "text-white/50",    bg: "bg-white/5       border-white/10"      },
};

function StatusBadge({ status }) {
  const cfg = SCREENING_STATUS[status] ?? SCREENING_STATUS.flagged;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function TriggerBadge({ trigger }) {
  const cfg = TRIGGER_META[trigger] ?? TRIGGER_META.kyc;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent = "amber" }) {
  const accents = {
    amber:   "text-amber-500  bg-amber-500/10  border-amber-500/20",
    red:     "text-red-400    bg-red-500/10    border-red-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    purple:  "text-purple-400 bg-purple-500/10 border-purple-500/20",
    blue:    "text-blue-400   bg-blue-500/10   border-blue-500/20",
  };
  const cls = accents[accent] ?? accents.amber;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cls}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/30 uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className="text-2xl font-bold text-white tabular-nums">{value ?? "—"}</p>
        {sub && <p className="text-xs text-white/25 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ComplianceDashboard() {
  const [stats, setStats]             = useState(null);
  const [screenings, setScreenings]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [notes, setNotes]             = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch]           = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, screenRes] = await Promise.all([
        api.get("/admin/compliance/stats"),
        api.get("/admin/compliance/screenings"),
      ]);
      setStats(statsRes.data.data);
      setScreenings(screenRes.data.data.data ?? screenRes.data.data ?? []);
    } catch {
      toast.error("Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openModal = async (screeningId) => {
    try {
      const res = await api.get(`/admin/compliance/screenings/${screeningId}`);
      setSelected(res.data.data);
      setNotes("");
      setShowModal(true);
    } catch {
      toast.error("Failed to load screening details");
    }
  };

  const closeModal = () => { setShowModal(false); setSelected(null); setNotes(""); };

  const handleClear = async () => {
    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Please provide review notes (min 10 characters)");
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/admin/compliance/screenings/${selected.id}/clear`, { notes });
      toast.success("User cleared after manual review");
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlock = async () => {
    if (!notes.trim() || notes.trim().length < 10) {
      toast.error("Please provide review notes (min 10 characters)");
      return;
    }
    if (!window.confirm("Block this user? This will suspend their account.")) return;
    try {
      setActionLoading(true);
      await api.post(`/admin/compliance/screenings/${selected.id}/block`, { notes });
      toast.success("User blocked");
      closeModal();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescreen = async (userId) => {
    try {
      await api.post(`/admin/compliance/users/${userId}/rescreen`);
      toast.success("Re-screening queued");
    } catch {
      toast.error("Failed to queue re-screen");
    }
  };

  const filtered = screenings.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      s.trigger?.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      />
      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-[35vw] h-[35vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #ef4444 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Back */}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-red-400 mb-2">Compliance</p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Sanctions & PEP Review
            </h1>
            <p className="text-white/40 mt-1 text-sm">
              OFAC · UN · EU sanctions screening — PEP self-declarations
            </p>
          </div>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors border border-white/10 hover:border-white/20 px-3 py-2 rounded-xl"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 h-24 animate-pulse" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <StatCard icon={<Activity size={16} />}  label="Total Screened"   value={stats.total_screened}    accent="blue"    />
            <StatCard icon={<Clock size={16} />}      label="Pending Review"   value={stats.pending_review}    accent="amber"   sub="Needs action" />
            <StatCard icon={<Ban size={16} />}        label="Blocked Users"    value={stats.blocked_users}     accent="red"     />
            <StatCard icon={<AlertTriangle size={16}/>}label="Flagged Users"   value={stats.flagged_users}     accent="purple"  />
            <StatCard icon={<CheckCircle size={16} />}label="Cleared Users"    value={stats.clear_users}       accent="emerald" />
            <StatCard icon={<Database size={16} />}   label="Sanctions Entries" value={stats.sanctions_entries?.toLocaleString()} accent="blue" sub={stats.last_sync ? `Synced ${new Date(stats.last_sync.synced_at).toLocaleDateString()}` : "No sync yet"} />
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            className="w-full sm:w-80 bg-white/5 border border-white/10 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/10 text-white placeholder-white/20 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none transition-all"
            placeholder="Search by name, email, trigger…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-2xl">
            <Shield size={40} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/30">No pending screenings — all clear</p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-white/10 bg-white/5">
                {["User", "Trigger", "Status", "Matches", "Date", ""].map(h => (
                  <span key={h} className="text-xs font-bold uppercase tracking-widest text-white/30">{h}</span>
                ))}
              </div>
              {filtered.map((s, i) => (
                <div
                  key={s.id}
                  className={`grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 items-center hover:bg-white/5 transition-colors ${
                    i < filtered.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.user?.name}</p>
                    <p className="text-xs text-white/30 mt-0.5 truncate">{s.user?.email}</p>
                  </div>
                  <TriggerBadge trigger={s.trigger} />
                  <StatusBadge status={s.status} />
                  <p className="text-sm text-white/60 tabular-nums">
                    {Array.isArray(s.matches) ? s.matches.length : 0} match{s.matches?.length !== 1 ? "es" : ""}
                  </p>
                  <p className="text-sm text-white/40">{new Date(s.created_at).toLocaleDateString()}</p>
                  <button
                    onClick={() => openModal(s.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
                  >
                    <Eye size={13} /> Review
                  </button>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map(s => (
                <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white truncate">{s.user?.name}</p>
                      <p className="text-xs text-white/30 truncate">{s.user?.email}</p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <TriggerBadge trigger={s.trigger} />
                    <span className="text-xs text-white/30">
                      {Array.isArray(s.matches) ? s.matches.length : 0} match{s.matches?.length !== 1 ? "es" : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-white/30">{new Date(s.created_at).toLocaleDateString()}</p>
                    <button
                      onClick={() => openModal(s.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <Eye size={12} /> Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {showModal && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0,  opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0f2820] shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-start justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-[#0f2820] z-10">
                <div className="min-w-0 flex-1 pr-3">
                  <h2
                    className="text-lg sm:text-xl font-bold text-white"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    Screening Review
                  </h2>
                  <p className="text-white/40 text-xs mt-0.5 truncate">
                    {selected.user?.name} · {selected.user?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={selected.status} />
                  <button
                    onClick={closeModal}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5">

                {/* Trigger + meta */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Screening Info</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-white/30 mb-1">Trigger</p>
                      <TriggerBadge trigger={selected.trigger} />
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-white/30 mb-1">Screened At</p>
                      <p className="text-sm font-semibold text-white">
                        {new Date(selected.created_at).toLocaleString()}
                      </p>
                    </div>
                    {selected.reviewed_at && (
                      <>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <p className="text-xs text-white/30 mb-1">Reviewed By</p>
                          <p className="text-sm font-semibold text-white">{selected.reviewed_by ?? "—"}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                          <p className="text-xs text-white/30 mb-1">Reviewed At</p>
                          <p className="text-sm font-semibold text-white">
                            {new Date(selected.reviewed_at).toLocaleString()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  {selected.notes && (
                    <div className="mt-2 bg-white/5 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-white/30 mb-1">Review Notes</p>
                      <p className="text-sm text-white/70 leading-relaxed">{selected.notes}</p>
                    </div>
                  )}
                </section>

                {/* Matches */}
                {Array.isArray(selected.matches) && selected.matches.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText size={14} className="text-amber-500" />
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">
                        Match Details ({selected.matches.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {selected.matches.map((match, idx) => (
                        <div key={idx} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                          {/* Match header */}
                          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-2 flex-wrap">
                              {match.is_pep && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20">
                                  <Shield size={9} /> PEP
                                </span>
                              )}
                              {match.source && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                                  {match.source === "self_declared" ? "Self-Declared" : match.source.toUpperCase()}
                                </span>
                              )}
                            </div>
                            {typeof match.score === "number" && (
                              <span className={`text-xs font-bold tabular-nums ${
                                match.score >= 90 ? "text-red-400" :
                                match.score >= 70 ? "text-amber-400" :
                                "text-white/40"
                              }`}>
                                {match.score}% match
                              </span>
                            )}
                          </div>

                          {/* Match body */}
                          <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                            {match.matched_name && (
                              <div>
                                <p className="text-white/30 mb-0.5">Matched Name</p>
                                <p className="text-white font-semibold">{match.matched_name}</p>
                              </div>
                            )}
                            {match.queried_name && (
                              <div>
                                <p className="text-white/30 mb-0.5">Queried Name</p>
                                <p className="text-white font-semibold">{match.queried_name}</p>
                              </div>
                            )}
                            {match.program && (
                              <div>
                                <p className="text-white/30 mb-0.5">Program / Role</p>
                                <p className="text-white font-semibold">{match.program}</p>
                              </div>
                            )}
                            {match.entry_type && (
                              <div>
                                <p className="text-white/30 mb-0.5">Entry Type</p>
                                <p className="text-white font-semibold capitalize">{match.entry_type}</p>
                              </div>
                            )}
                            {match.list && (
                              <div className="col-span-2">
                                <p className="text-white/30 mb-0.5">Sanctions List</p>
                                <p className="text-white font-semibold uppercase font-mono">{match.list}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Actions — only if not yet reviewed */}
                {!selected.reviewed_at && (
                  <section className="space-y-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                        Review Notes <span className="normal-case font-normal text-white/25">(required, min 10 chars)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                        placeholder="Document your review decision and reasoning…"
                        className="w-full bg-white/5 border border-white/10 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Clear */}
                      <button
                        onClick={handleClear}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20"
                      >
                        {actionLoading
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <CheckCircle size={15} />}
                        Clear — False Positive
                      </button>

                      {/* Block */}
                      <button
                        onClick={handleBlock}
                        disabled={actionLoading}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20"
                      >
                        {actionLoading
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Ban size={15} />}
                        Confirm & Block User
                      </button>
                    </div>

                    {/* Re-screen */}
                    <button
                      onClick={() => handleRescreen(selected.user?.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 transition-all"
                    >
                      <RefreshCw size={13} /> Queue Re-screen
                    </button>
                  </section>
                )}

                <div className="h-2 sm:h-0" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "../../../utils/api";
import toast from "react-hot-toast";
import {
  ArrowLeft, Users, MapPin, Wallet, BarChart3,
  Mail, CheckCircle, Clock, Trash2, Send,
  RefreshCw, ChevronLeft, ChevronRight, Search,
  X, Sparkles, TrendingUp, Filter,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BUDGET_LABELS = {
  "5k_50k":    "₦5k – ₦50k",
  "50k_500k":  "₦50k – ₦500k",
  "500k_plus": "₦500k+",
};

const CITY_LABELS = {
  ogun:  "Ogun",
  oyo:   "Oyo",
  abuja: "Abuja",
  other: "Other",
};

const CITY_COLORS = {
  ogun:  "#C8873A",
  oyo:   "#2D7A55",
  abuja: "#8B5CF6",
  other: "#06B6D4",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, accent, sub }) {
  return (
    <div className="relative rounded-2xl border border-white/10 bg-white/5 p-5 overflow-hidden group hover:border-white/20 hover:-translate-y-0.5 transition-all">
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${accent}, transparent 70%)` }}
      />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${accent}20`, color: accent }}>
        {icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
    </div>
  );
}

function InvitedBadge({ invited }) {
  if (invited) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
        <CheckCircle size={9} /> Invited
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-white/10 bg-white/5 text-white/30">
      <Clock size={9} /> Waiting
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminWaitlistPage() {
  const [entries, setEntries]         = useState([]);
  const [stats, setStats]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pagination, setPagination]   = useState({ current_page: 1, last_page: 1, total: 0 });
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [filterCity, setFilterCity]   = useState("");
  const [filterBudget, setFilterBudget] = useState("");
  const [filterInvited, setFilterInvited] = useState("");
  const [inviting, setInviting]       = useState(null);
  const [deleting, setDeleting]       = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await api.get("/admin/waitlist/stats");
      setStats(res.data.data);
    } catch {
      toast.error("Failed to load waitlist stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, per_page: 20 });
      if (filterCity)    params.set("city", filterCity);
      if (filterBudget)  params.set("budget", filterBudget);
      if (filterInvited) params.set("invited", filterInvited);
      const res = await api.get(`/admin/waitlist?${params}`);
      const d   = res.data.data;
      setEntries(d.data ?? d ?? []);
      setPagination({ current_page: d.current_page ?? 1, last_page: d.last_page ?? 1, total: d.total ?? 0 });
    } catch {
      toast.error("Failed to load waitlist");
    } finally {
      setLoading(false);
    }
  }, [page, filterCity, filterBudget, filterInvited]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchEntries(); }, [fetchEntries]);
  useEffect(() => { setPage(1); }, [filterCity, filterBudget, filterInvited]);

  const handleInvite = async (id, name) => {
    if (!window.confirm(`Mark ${name} as invited and send their access link?`)) return;
    try {
      setInviting(id);
      await api.post(`/admin/waitlist/${id}/invite`);
      toast.success(`${name} marked as invited`);
      fetchEntries();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to invite");
    } finally {
      setInviting(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the waitlist? This will close the gap in positions.`)) return;
    try {
      setDeleting(id);
      await api.delete(`/admin/waitlist/${id}`);
      toast.success(`${name} removed`);
      fetchEntries();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove");
    } finally {
      setDeleting(null);
    }
  };

  // Client-side search filter on loaded entries
  const filtered = search.trim()
    ? entries.filter(e =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.referral_code?.toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const clearFilters = () => {
    setFilterCity(""); setFilterBudget(""); setFilterInvited(""); setSearch("");
  };
  const hasFilters = filterCity || filterBudget || filterInvited || search;

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-6">
          <ArrowLeft size={13} /> Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Admin Panel</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Waitlist
            </h1>
            <p className="text-white/40 mt-1 text-sm">{pagination.total} people waiting for access</p>
          </div>
          <button onClick={() => { fetchEntries(); fetchStats(); }}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white/30 border border-white/10 hover:border-white/20 hover:text-white/60 hover:bg-white/5 transition-all">
            <RefreshCw size={12} className="group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
        </div>

        {/* Stat cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            <StatCard icon={<Users size={18} />}      label="Total"    value={stats.total}    accent="#C8873A" />
            <StatCard icon={<CheckCircle size={18} />} label="Invited"  value={stats.invited}  accent="#2D7A55" sub={`${stats.total - stats.invited} remaining`} />
            <StatCard icon={<TrendingUp size={18} />}  label="Referred" value={stats.with_referrals} accent="#8B5CF6" sub="Have at least 1 referral" />
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3 flex items-center gap-1.5">
                <MapPin size={12} className="text-amber-500" /> By City
              </p>
              <div className="space-y-1.5">
                {Object.entries(stats.by_city || {}).map(([city, count]) => (
                  <div key={city} className="flex items-center justify-between">
                    <span className="text-xs text-white/50 capitalize">{CITY_LABELS[city] || city}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1 rounded-full w-16 bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.round((count / stats.total) * 100)}%`, background: CITY_COLORS[city] || "#C8873A" }} />
                      </div>
                      <span className="text-xs font-bold text-white/60 w-5 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, or referral code…"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60">
                <X size={13} />
              </button>
            )}
          </div>

          <button onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || (filterCity || filterBudget || filterInvited)
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
            }`}>
            <Filter size={14} /> Filters
            {(filterCity || filterBudget || filterInvited) && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>

          {hasFilters && (
            <button onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white/70 text-sm transition-all">
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 rounded-xl border border-white/10 bg-white/3">
            {[
              { label: "City",    key: "filterCity",    val: filterCity,    set: setFilterCity,    opts: [["", "All Cities"], ...Object.entries(CITY_LABELS)] },
              { label: "Budget",  key: "filterBudget",  val: filterBudget,  set: setFilterBudget,  opts: [["", "All Budgets"], ...Object.entries(BUDGET_LABELS)] },
              { label: "Status",  key: "filterInvited", val: filterInvited, set: setFilterInvited, opts: [["", "All"], ["true", "Invited"], ["false", "Waiting"]] },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">{f.label}</label>
                <select value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-amber-500/40 appearance-none">
                  {f.opts.map(([v, l]) => <option key={v} value={v} className="bg-[#0D1F1A]">{l}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-white/10 rounded-2xl">
            <Sparkles size={36} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/30">No waitlist entries found</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl border border-white/10 bg-white/5 overflow-hidden mb-5">
              <div className="grid grid-cols-[40px_2fr_1.5fr_1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
                {["#", "Name", "Email", "City", "Budget", "Referrals", "Status", "Actions"].map(h => (
                  <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-white/30">{h}</span>
                ))}
              </div>
              {filtered.map((entry, i) => (
                <div key={entry.id}
                  className={`grid grid-cols-[40px_2fr_1.5fr_1fr_1fr_1fr_1fr_120px] gap-3 px-5 py-3.5 items-center hover:bg-white/[0.025] transition-colors ${
                    i < filtered.length - 1 ? "border-b border-white/[0.04]" : ""
                  }`}
                >
                  <span className="text-xs font-bold text-amber-500/60 tabular-nums">#{entry.position}</span>

                  <p className="text-sm font-semibold text-white truncate">{entry.name}</p>
                  <p className="text-xs text-white/40 truncate">{entry.email}</p>

                  <span className="text-xs text-white/50">
                    {CITY_LABELS[entry.city] || entry.city || "—"}
                  </span>

                  <span className="text-xs text-white/50">
                    {BUDGET_LABELS[entry.budget] || entry.budget || "—"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${entry.referral_count > 0 ? "text-emerald-400" : "text-white/25"}`}>
                      {entry.referral_count ?? 0}
                    </span>
                    {entry.referral_count > 0 && <TrendingUp size={10} className="text-emerald-400" />}
                  </div>

                  <InvitedBadge invited={entry.invited} />

                  <div className="flex items-center gap-1">
                    {!entry.invited && (
                      <button
                        onClick={() => handleInvite(entry.id, entry.name)}
                        disabled={inviting === entry.id}
                        title="Send invite"
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {inviting === entry.id
                          ? <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                          : <Send size={10} />}
                        Invite
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id, entry.name)}
                      disabled={deleting === entry.id}
                      title="Remove"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                    >
                      {deleting === entry.id
                        ? <div className="w-3 h-3 border border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3 mb-5">
              {filtered.map(entry => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-bold text-amber-500/60">#{entry.position}</span>
                        <InvitedBadge invited={entry.invited} />
                      </div>
                      <p className="text-sm font-bold text-white truncate">{entry.name}</p>
                      <p className="text-xs text-white/30 truncate">{entry.email}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!entry.invited && (
                        <button onClick={() => handleInvite(entry.id, entry.name)}
                          disabled={inviting === entry.id}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                          <Send size={9} /> Invite
                        </button>
                      )}
                      <button onClick={() => handleDelete(entry.id, entry.name)}
                        disabled={deleting === entry.id}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "City",      value: CITY_LABELS[entry.city] || "—" },
                      { label: "Budget",    value: BUDGET_LABELS[entry.budget] || "—" },
                      { label: "Referrals", value: entry.referral_count ?? 0 },
                    ].map(s => (
                      <div key={s.label} className="bg-white/5 rounded-lg p-2">
                        <p className="text-[10px] text-white/30 mb-0.5">{s.label}</p>
                        <p className="text-xs font-bold text-white">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/30">Page {pagination.current_page} of {pagination.last_page}</p>
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
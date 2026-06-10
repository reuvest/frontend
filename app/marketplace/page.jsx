"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "../../utils/api";
import { formatNaira } from "../../utils/currency";
import {
  Search, SlidersHorizontal, MapPin, TrendingUp,
  Package, ArrowRight, Plus, X, ChevronDown,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    active:    { label: "Active",    cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    in_escrow: { label: "In Escrow", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    sold:      { label: "Sold",      cls: "bg-white/5 text-white/55 border-white/10" },
  };
  const s = map[status] ?? map.active;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${s.cls}`}>
      {s.label}
    </span>
  );
}

function ListingCard({ listing }) {
  const land  = listing.land;
  const image = land?.images?.[0]?.image_url;
  const priceNaira = listing.asking_price_kobo / 100;

  return (
    <Link href={`/marketplace/${listing.id}`}
      className="group block rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden hover:border-amber-500/30 hover:bg-white/[0.05] transition-all hover:-translate-y-0.5">

      {/* Image */}
      <div className="relative h-40 overflow-hidden bg-white/5">
        {image ? (
          <img src={image} alt={land?.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => { e.target.src = "/no-image.jpeg"; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={32} className="text-white/10" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <StatusBadge status={listing.status} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <p className="text-xs text-amber-500/70 font-bold uppercase tracking-widest mb-1 truncate">
          {land?.title ?? "Land"}
        </p>
        <div className="flex items-center gap-1 hover:border-white/[0.35] text-xs mb-3">
          <MapPin size={10} /> <span className="truncate">{land?.location}</span>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-white/55 mb-0.5">Asking price / unit</p>
            <p className="text-xl font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', serif" }}>
              {formatNaira(listing.asking_price_kobo)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/55 mb-0.5">Units</p>
            <p className="text-lg font-bold text-white">{listing.units_for_sale}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-white/55">
          <span>Seller: {listing.seller?.name ?? "—"}</span>
          <span className="flex items-center gap-1 text-amber-500/60 font-semibold group-hover:text-amber-500 transition-colors">
            View <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Filters panel ────────────────────────────────────────────────────────────
function FiltersPanel({ filters, onChange, onReset }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-white/60">Filters</p>
        <button onClick={onReset} className="text-xs text-white/25 hover:text-white/50 transition-colors">Reset</button>
      </div>

      <div>
        <label className="block text-xs text-white/55 uppercase tracking-widest font-bold mb-2">Sort By</label>
        <select value={filters.sort} onChange={(e) => onChange("sort", e.target.value)}
          className="w-full bg-[#0D1F1A] border border-white/10 text-white px-3 py-2.5 rounded-xl text-sm outline-none">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="units_desc">Most Units</option>
        </select>
      </div>

      <div>
        <label className="block text-xs text-white/55 uppercase tracking-widest font-bold mb-2">Min Price (₦)</label>
        <input type="number" min={0} value={filters.min_price}
          onChange={(e) => onChange("min_price", e.target.value)}
          placeholder="0"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none" />
      </div>

      <div>
        <label className="block text-xs text-white/55 uppercase tracking-widest font-bold mb-2">Max Price (₦)</label>
        <input type="number" min={0} value={filters.max_price}
          onChange={(e) => onChange("max_price", e.target.value)}
          placeholder="No limit"
          className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 px-3 py-2.5 rounded-xl text-sm outline-none" />
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const [listings, setListings]   = useState([]);
  const [meta, setMeta]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage]           = useState(1);

  const [filters, setFilters] = useState({
    sort: "newest", min_price: "", max_price: "",
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, sort: filters.sort };
      if (filters.min_price) params.min_price = Number(filters.min_price) * 100;
      if (filters.max_price) params.max_price = Number(filters.max_price) * 100;

      const res = await api.get("/marketplace", { params });
      const d   = res.data.data;
      setListings(d.data ?? d);
      setMeta(d.meta ?? null);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ sort: "newest", min_price: "", max_price: "" });
    setPage(1);
  };

  const filtered = listings.filter((l) =>
    search === "" ||
    l.land?.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.land?.location?.toLowerCase().includes(search.toLowerCase()) ||
    l.seller?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0D1F1A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">P2P Exchange</p>
            <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Land Marketplace
            </h1>
            <p className="text-white/60 mt-1 text-sm">Buy and sell verified land units directly with other investors</p>
          </div>
          <Link href="/marketplace/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-105"
            style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
            <Plus size={15} /> List Units for Sale
          </Link>
        </div>

        {/* Search + filter toggle */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by property or seller…"
              className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 text-white placeholder-white/20 pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all" />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 hover:text-white/60">
                <X size={13} />
              </button>
            )}
          </div>
          <button onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
              showFilters ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : "border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
            }`}>
            <SlidersHorizontal size={14} /> Filters
            <ChevronDown size={12} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        <div className="flex gap-6 items-start">
          {/* Filters sidebar */}
          {showFilters && (
            <div className="w-56 shrink-0">
              <FiltersPanel filters={filters} onChange={updateFilter} onReset={resetFilters} />
            </div>
          )}

          {/* Listings grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.03] h-64 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Package size={40} className="text-white/10 mx-auto mb-4" />
                <p className="text-white/55 text-sm">No listings found</p>
                {search && (
                  <button onClick={() => setSearch("")} className="mt-2 text-xs text-amber-500 hover:text-amber-400">
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-xs text-white/25 mb-4">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm disabled:opacity-30 hover:border-white/20 transition-all">
                      Previous
                    </button>
                    <span className="px-4 py-2 text-white/55 text-sm">
                      {page} / {meta.last_page}
                    </span>
                    <button disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 rounded-xl border border-white/10 text-white/60 text-sm disabled:opacity-30 hover:border-white/20 transition-all">
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
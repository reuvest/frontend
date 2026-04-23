"use client";

/**
 * /app/lands/page.jsx  — or wherever your lands listing lives
 *
 * PUBLIC browsing, auth-gated investing.
 * Separate metadata export (SEO) is at the bottom of this file
 * — move it to a sibling `page.jsx` wrapper if you use the
 * App Router pattern of a Server Component shell + Client Component.
 */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import api from "../../utils/api";
import { getLandImage } from "../../utils/images";
import { koboToNaira } from "../../utils/currency";
import { useDebounce } from "../../utils/useDebounce";
import {
  MapPin, Maximize2, Flame, X, Lock, ShieldCheck,
  TrendingUp, BadgeCheck, ArrowRight, Search, SlidersHorizontal,
} from "lucide-react";
import { getToken } from "../../utils/tokenStore";


// ─── Dynamic map (no SSR) ─────────────────────────────────────────────────────
const MapWithNoSSR = dynamic(
  () => import("./_LandMap").then((m) => m.default),
  { ssr: false }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getLandPrice(land) {
  return (
    land.latest_price?.price_per_unit_kobo ??
    land.latestPrice?.price_per_unit_kobo ??
    land.current_price_per_unit_kobo ??
    land.price_per_unit_kobo ??
    0
  );
}

function hasPolygon(land) {
  if (land.coordinates && typeof land.coordinates === "string" && land.coordinates.length > 10) return true;
  const p = land.polygon;
  if (!p) return false;
  if (typeof p === "string") return p.toUpperCase().includes("POLYGON");
  if (p?.type === "Polygon") return true;
  return Array.isArray(p) && p.length >= 3;
}

function getPriceTag(priceKobo) {
  const n = koboToNaira(priceKobo);
  if (n < 200_000) return { label: "Budget",    color: "#22c55e" };
  if (n < 500_000) return { label: "Mid-Range", color: "#f59e0b" };
  return               { label: "Premium",  color: "#ef4444" };
}

// ─── Auth-prompt modal ────────────────────────────────────────────────────────

function AuthPromptModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-99999 flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-7 border border-white/10 relative"
        style={{ background: "#0D1F1A", boxShadow: "0 32px 80px rgba(0,0,0,0.85)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-white/30 hover:text-white/70 hover:bg-white/10 transition-all"
        >
          <X size={13} />
        </button>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 mx-auto"
          style={{ background: "rgba(200,135,58,0.15)", border: "1px solid rgba(200,135,58,0.25)" }}
        >
          <Lock size={24} className="text-amber-400" />
        </div>

        <h2
          className="text-white font-bold text-center mb-2"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.4rem", lineHeight: 1.2 }}
        >
          Sign in to Invest
        </h2>
        <p className="text-white/40 text-sm text-center mb-7 leading-relaxed">
          Create a free account or sign in to start investing in
          verified Nigerian land from as little as <strong className="text-white/60">₦5,000</strong>.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/register"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-center text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
            onClick={onClose}
          >
            Create Free Account
          </Link>
          <Link
            href="/login"
            className="w-full py-3.5 rounded-xl text-sm font-bold text-center text-white border border-white/15 hover:bg-white/5 transition-all"
            onClick={onClose}
          >
            Sign In
          </Link>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-4">
          Free to browse · No credit card required
        </p>
      </div>
    </div>
  );
}

// ─── Logged-in PIN / KYC banner ───────────────────────────────────────────────

function AccountBanner({ pinIsSet, kycStatus }) {
  const needsPin = !pinIsSet;
  const needsKyc = kycStatus !== "approved";
  if (!needsPin && !needsKyc) return null;

  const kycMessage = {
    none:     "KYC not submitted. Verify your identity before you can transact.",
    pending:  "KYC is under review. You'll be able to transact once approved.",
    rejected: "KYC was rejected. Please resubmit your documents.",
    resubmit: "KYC resubmission required before you can transact.",
  }[kycStatus] ?? "Identity verification required.";

  return (
    <div className="mb-8 space-y-3">
      {needsPin && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Lock size={16} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-400">Transaction PIN not set</p>
            <p className="text-xs text-white/40 mt-0.5">Set a PIN in settings before purchasing units.</p>
          </div>
          <Link
            href="/settings?tab=pin"
            className="shrink-0 text-xs font-bold text-[#0D1F1A] px-3 py-2 rounded-lg hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
          >
            Set PIN
          </Link>
        </div>
      )}
      {needsKyc && (
        <div className="flex items-center gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
          <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={16} className="text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-purple-400">Identity Verification Required</p>
            <p className="text-xs text-white/40 mt-0.5">{kycMessage}</p>
          </div>
          {["none", "rejected", "resubmit"].includes(kycStatus) && (
            <Link
              href="/settings?tab=kyc"
              className="shrink-0 text-xs font-bold text-white px-3 py-2 rounded-lg border border-purple-500/40 hover:bg-purple-500/20 transition-all"
            >
              {kycStatus === "none" ? "Submit KYC" : "Resubmit"}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Guest CTA strip (shown above cards when not logged in) ───────────────────

function GuestCtaBanner() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 mb-7 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
          <TrendingUp size={16} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-400">Ready to start investing?</p>
          <p className="text-xs text-white/35 mt-0.5">Sign up free — own verified land from ₦5,000</p>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <Link
          href="/login"
          className="text-xs font-bold text-white/70 px-4 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 transition-all"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D1F1A] px-4 py-2.5 rounded-xl hover:scale-105 transition-transform"
          style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
        >
          Get Started <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}

// ─── Trust badges ─────────────────────────────────────────────────────────────

function TrustBar() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center mb-6">
      {[
        [BadgeCheck, "Verified Titles"],
        [ShieldCheck, "Legally Backed"],
        [TrendingUp,  "10–30% Projected ROI"],
      ].map(([Icon, label]) => (
        <span key={label} className="flex items-center gap-1.5 text-xs text-white/35">
          <Icon size={12} className="text-emerald-400" />
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Search / filter bar ──────────────────────────────────────────────────────

function SearchBar({ value, onChange }) {
  return (
    <div className="relative mb-8">
      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title or location…"
        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 focus:outline-none focus:border-amber-500/40 focus:bg-white/8 transition-all"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandList() {
  const [lands, setLands]               = useState([]);
  const [visibleLands, setVisibleLands] = useState([]);
  const [activeLandId, setActiveLandId] = useState(null);
  const [hoverLandId, setHoverLandId]   = useState(null);
  const [flyTarget, setFlyTarget]       = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHeatmap, setShowHeatmap]   = useState(false);
  const [currentZoom, setCurrentZoom]   = useState(8);
  const [searchQuery, setSearchQuery]   = useState("");

  // Auth state — null = not logged in, object = user data
  const [user, setUser]                 = useState(null);
  const [authLoaded, setAuthLoaded]     = useState(false);

  // PIN / KYC (only relevant when logged in)
  const [pinIsSet, setPinIsSet]         = useState(true);
  const [kycStatus, setKycStatus]       = useState("approved");
  const [statusLoaded, setStatusLoaded] = useState(false);

  // Auth modal
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  const mapSectionRef = useRef(null);

  // ── Fetch lands (public endpoint) ──────────────────────────────────────────
  useEffect(() => {
    api.get("/lands")
      .then((res) => {
        const list = res.data?.data ?? [];
        setLands(list);
        setVisibleLands(list);
      })
      .catch(() => setError("Failed to load properties."))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch auth + account status ────────────────────────────────────────────
  useEffect(() => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setAuthLoaded(true);
      return;
    }

    api.get("/me")
      .then((res) => {
        const u = res.data?.data ?? null;
        setUser(u);
        if (u) {
          setPinIsSet(u.pin_is_set ?? !!u.transaction_pin);
          setKycStatus(u.kyc_status ?? (u.is_kyc_verified ? "approved" : "none"));
          setStatusLoaded(true);
        }
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setAuthLoaded(true);
      });
  }, []);

  // ── Derived map data ───────────────────────────────────────────────────────
  const landsWithPolygons  = useMemo(() => lands.filter((l) => hasPolygon(l)), [lands]);
  const landsWithPoints    = useMemo(() => lands.filter((l) => l.lat && l.lng && !hasPolygon(l)), [lands]);
  const allLandsWithCoords = useMemo(() => [...landsWithPoints, ...landsWithPolygons], [landsWithPoints, landsWithPolygons]);

  // ── Filter by map bounds ───────────────────────────────────────────────────
  const filterByBounds = useCallback((bounds) => {
    setVisibleLands(
      lands.filter((l) => {
        if (l.lat && l.lng) return bounds.contains([+l.lat, +l.lng]);
        if (hasPolygon(l) && Array.isArray(l.polygon))
          return l.polygon.some((p) => bounds.contains([p.lat, p.lng]));
        return false;
      })
    );
  }, [lands]);

  const handleMapMoveEnd = useDebounce(filterByBounds, 300);

  // ── Fullscreen body lock ───────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isFullScreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFullScreen]);

  // ── Focus land on map ──────────────────────────────────────────────────────
  const focusLandOnMap = useCallback((land) => {
    if (showHeatmap) setShowHeatmap(false);
    if (isFullScreen) setIsFullScreen(false);
    setFlyTarget(null);
    setActiveLandId(null);
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        const lat = land.lat ?? land.polygon?.[0]?.lat;
        const lng = land.lng ?? land.polygon?.[0]?.lng;
        setActiveLandId(land.id);
        if (lat && lng) setFlyTarget({ lat: +lat, lng: +lng });
        setTimeout(() => setActiveLandId(null), 6000);
      }, 450);
    }, 100);
  }, [showHeatmap, isFullScreen]);

  // ── Client-side search filter ──────────────────────────────────────────────
  const displayedLands = useMemo(() => {
    if (!searchQuery.trim()) return visibleLands;
    const q = searchQuery.toLowerCase();
    return visibleLands.filter(
      (l) =>
        l.title?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q)
    );
  }, [visibleLands, searchQuery]);

  // ── Auth gate helper ───────────────────────────────────────────────────────
  const requireAuth = useCallback((action) => {
    if (!user) { setShowAuthPrompt(true); return; }
    action?.();
  }, [user]);

  const canTransact = user && pinIsSet && kycStatus === "approved";

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F1A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm tracking-widest uppercase">Loading properties</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F1A]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/" className="text-amber-500 hover:text-amber-400 text-sm">← Go Home</Link>
        </div>
      </div>
    );
  }

  const defaultCenter = allLandsWithCoords.length
    ? [+allLandsWithCoords[0].lat, +allLandsWithCoords[0].lng]
    : [9.082, 8.6753];

  const allMapPoints = [
    ...landsWithPoints.map((l) => [+l.lat, +l.lng]),
    ...landsWithPolygons.filter((l) => l.lat && l.lng).map((l) => [+l.lat, +l.lng]),
  ];

  const mapProps = {
    defaultCenter, allMapPoints, landsWithPoints, landsWithPolygons,
    allLandsWithCoords, activeLandId, hoverLandId, flyTarget,
    showHeatmap, currentZoom, isFullScreen,
    onZoomChange: setCurrentZoom,
    onMoveEnd: handleMapMoveEnd,
  };

  return (
    <>
      {/* ── Auth modal ─────────────────────────────────────────────────────── */}
      {showAuthPrompt && <AuthPromptModal onClose={() => setShowAuthPrompt(false)} />}

      <div
        className="min-h-screen bg-[#0D1F1A]"
        style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
      >
        {/* Dot-grid texture */}
        <div
          className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />

        {/* ── Fullscreen map overlay ────────────────────────────────────────── */}
        {isFullScreen && (
          <div className="fixed inset-0 z-99999 bg-[#0D1F1A]">
            <div
              className="absolute top-4 left-1/2 -translate-x-1/2 z-100000 flex items-center gap-2 px-3 py-2 rounded-2xl"
              style={{ background: "rgba(8,20,15,0.92)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
            >
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                <MapPin size={12} className="text-amber-500" />
                <span className="text-white/60 text-xs font-semibold tabular-nums">{visibleLands.length} visible</span>
              </div>
              <div className="w-px h-5 bg-white/10" />
              <button
                onClick={() => setShowHeatmap((v) => !v)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${showHeatmap ? "text-white" : "text-white/70 hover:text-white hover:bg-white/10"}`}
                style={showHeatmap ? { background: "linear-gradient(135deg, #f97316, #ef4444)" } : {}}
              >
                <Flame size={13} />{showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
              </button>
              <div className="w-px h-5 bg-white/10" />
              <button
                onClick={() => setIsFullScreen(false)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={13} /> Exit Fullscreen
              </button>
            </div>
            <MapWithNoSSR {...mapProps} className="h-full w-full" />
          </div>
        )}

        {/* ── Main content ──────────────────────────────────────────────────── */}
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-10">

          {/* Page header */}
          <div className="mb-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">
              Property Marketplace
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Available Lands
            </h1>
            <p className="text-white/40 mt-2 text-sm">
              {visibleLands.length} verified {visibleLands.length === 1 ? "property" : "properties"} in current view
            </p>
          </div>

          <div className="mt-4 mb-8">
            <TrustBar />
          </div>

          {/* Banners — mutually exclusive based on auth state */}
          {authLoaded && !user && <GuestCtaBanner />}
          {user && statusLoaded && <AccountBanner pinIsSet={pinIsSet} kycStatus={kycStatus} />}

          {/* Search */}
          <SearchBar value={searchQuery} onChange={setSearchQuery} />

          {/* ── Map ─────────────────────────────────────────────────────────── */}
          {!isFullScreen && (
            <div
              ref={mapSectionRef}
              className="relative rounded-2xl overflow-hidden border border-white/10 mb-10 shadow-2xl shadow-black/50"
            >
              <div className="absolute top-3 right-3 z-2000 flex gap-2">
                <button
                  onClick={() => setShowHeatmap((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${showHeatmap ? "text-white" : "bg-black/60 backdrop-blur text-white/70 hover:bg-black/80 border border-white/10"}`}
                  style={showHeatmap ? { background: "linear-gradient(to right, #f97316, #ef4444)" } : {}}
                >
                  <Flame size={13} />{showHeatmap ? "Hide" : "Heatmap"}
                </button>
                <button
                  onClick={() => setIsFullScreen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/60 backdrop-blur text-white/70 hover:bg-black/80 text-xs font-bold border border-white/10 transition-all"
                >
                  <Maximize2 size={13} /> Fullscreen
                </button>
              </div>
              <div className="h-152 w-full">
                <MapWithNoSSR {...mapProps} />
              </div>
            </div>
          )}

          {/* ── Property grid ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedLands.map((land) => {
              const priceKobo = getLandPrice(land);
              const priceTag  = getPriceTag(priceKobo);
              const isHovered = hoverLandId === land.id;
              const imageUrl  = getLandImage(land);

              return (
                <article
                  key={land.id}
                  onMouseEnter={() => setHoverLandId(land.id)}
                  onMouseLeave={() => setHoverLandId(null)}
                  className={`group rounded-2xl border overflow-hidden transition-all duration-300 ${
                    isHovered
                      ? "border-amber-500/40 shadow-xl shadow-amber-500/10 -translate-y-0.5"
                      : "border-white/10 hover:border-white/20"
                  }`}
                  style={{ background: isHovered ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)" }}
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-white/5">
                    <img
                      src={imageUrl}
                      alt={`${land.title} — fractional land investment in ${land.location}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        if (!e.target.dataset.errored) {
                          e.target.dataset.errored = "1";
                          e.target.src = "/no-image.jpeg";
                        }
                      }}
                    />
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(to top, rgba(13,31,26,0.85), transparent 60%)" }}
                    />

                    {/* Price tier badge */}
                    <div
                      className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold backdrop-blur-sm"
                      style={{
                        background: `${priceTag.color}33`,
                        border: `1px solid ${priceTag.color}55`,
                        color: priceTag.color,
                      }}
                    >
                      {priceTag.label}
                    </div>

                    {/* Availability badge */}
                    {land.is_available && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 backdrop-blur-sm">
                        Available
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h2
                      className="font-bold text-white text-lg leading-snug mb-1"
                      style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                    >
                      {land.title}
                    </h2>
                    <div className="flex items-center gap-1.5 text-white/40 text-xs mb-4">
                      <MapPin size={11} />
                      <span>{land.location}</span>
                    </div>

                    {/* Price / units row */}
                    <div className="flex items-end justify-between mb-5">
                      <div>
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Per Unit</p>
                        <p className="text-xl font-bold text-amber-400">
                          {priceKobo > 0
                            ? `₦${koboToNaira(priceKobo).toLocaleString()}`
                            : <span className="text-white/20 text-sm font-normal">—</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/30 uppercase tracking-wider mb-0.5">Available</p>
                        <p className="text-lg font-bold text-white">
                          {land.available_units?.toLocaleString() ?? "—"}
                          <span className="text-xs text-white/30 font-normal"> units</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {/* View Details — always public */}
                      <Link
                        href={`/lands/${land.id}`}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-center text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
                      >
                        View Details
                      </Link>

                      {/* Map pin — always public */}
                      <button
                        onClick={() => focusLandOnMap(land)}
                        className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-amber-500/30 transition-all group/pin"
                        title="Show on map"
                        aria-label="Show on map"
                      >
                        <MapPin size={15} className="text-white/50 group-hover/pin:text-amber-400 transition-colors" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Empty state */}
          {displayedLands.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-white/20 text-lg">
                {searchQuery ? "No properties match your search" : "No properties in current view"}
              </p>
              <p className="text-white/10 text-sm mt-1">
                {searchQuery ? "Try a different keyword" : "Pan or zoom the map to explore more"}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-xs text-amber-500 hover:text-amber-400 underline underline-offset-2"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Bottom guest CTA */}
          {authLoaded && !user && displayedLands.length > 0 && (
            <div className="mt-14 text-center">
              <p className="text-white/30 text-sm mb-4">
                Enjoying the listings? Create an account to start investing.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[#0D1F1A] text-sm hover:scale-105 transition-transform shadow-xl"
                style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
              >
                Create Free Account <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "../../../utils/api";
import { getLandSlides } from "../../../utils/images";
import { formatNaira } from "../../../utils/currency";
import toast from "react-hot-toast";
import {
  ArrowLeft, MapPin, Layers, TrendingUp, ShieldCheck,
  Lock, X, AlertCircle, Info, Tag, Wallet, ToggleLeft, ToggleRight,
  Info as InfoIcon,
} from "lucide-react";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

function getLandPrice(land) {
  return (
    land.latest_price?.price_per_unit_kobo ??
    land.latestPrice?.price_per_unit_kobo ??
    land.current_price_per_unit_kobo ??
    land.price_per_unit_kobo ??
    0
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function KycBanner({ kycStatus }) {
  if (kycStatus === "approved" || !kycStatus) return null;
  const config = {
    none:     { color: "purple", msg: "Identity verification is required before you can invest." },
    pending:  { color: "amber",  msg: "Your KYC is under review. Investing will be enabled once approved." },
    rejected: { color: "red",    msg: "Your KYC was rejected. Please resubmit your documents." },
    resubmit: { color: "orange", msg: "KYC resubmission required before you can invest." },
  }[kycStatus] ?? { color: "purple", msg: "Identity verification required." };

  const colors = {
    purple: { border: "border-purple-500/30", bg: "bg-purple-500/5", text: "text-purple-400", icon: "bg-purple-500/20" },
    amber:  { border: "border-amber-500/30",  bg: "bg-amber-500/5",  text: "text-amber-400",  icon: "bg-amber-500/20"  },
    red:    { border: "border-red-500/30",    bg: "bg-red-500/5",    text: "text-red-400",    icon: "bg-red-500/20"    },
    orange: { border: "border-orange-500/30", bg: "bg-orange-500/5", text: "text-orange-400", icon: "bg-orange-500/20" },
  }[config.color];

  return (
    <div className={`mb-8 flex items-center gap-4 rounded-2xl border ${colors.border} ${colors.bg} p-4`}>
      <div className={`w-9 h-9 rounded-xl ${colors.icon} flex items-center justify-center shrink-0`}>
        <ShieldCheck size={16} className={colors.text} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${colors.text}`}>Identity Verification Required</p>
        <p className="text-xs text-white/40 mt-0.5">{config.msg}</p>
      </div>
      {["none", "rejected", "resubmit"].includes(kycStatus) && (
        <Link href="/settings?tab=kyc"
          className="shrink-0 text-xs font-bold text-white px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-all">
          {kycStatus === "none" ? "Submit KYC" : "Resubmit"}
        </Link>
      )}
    </div>
  );
}

function BreakdownRow({ label, value, highlight, strikethrough, green, muted }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-xs ${muted ? "text-white/30" : "text-white/50"}`}>{label}</span>
      <span className={`text-xs font-semibold ${
        strikethrough ? "line-through text-white/30" :
        green         ? "text-emerald-400" :
        highlight     ? "text-amber-400" :
        "text-white"
      }`}>{value}</span>
    </div>
  );
}

/** Shown when a discount was capped — explains the saving vs what was possible */
function CapNotice({ preview }) {
  const isCapped = preview?.discount_label?.toLowerCase().includes("capped");
  if (!isCapped) return null;

  // Work out the "uncapped" saving so we can show the delta
  const cappedKobo   = preview.total_discount_kobo ?? 0;
  const originalKobo = preview.original_cost_kobo  ?? 0;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2 mt-1">
      <InfoIcon size={11} className="text-amber-400/60 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-400/70 leading-relaxed">
        A maximum discount cap applies. Your saving is limited to{" "}
        <span className="font-semibold text-amber-400">
          ₦{(cappedKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
        </span>{" "}
        on this order.
      </p>
    </div>
  );
}

function SlideTile({ slide, index, label, style, className = "", onClick, overlayCount }) {
  return (
    <div className={`relative overflow-hidden group cursor-pointer ${className}`} style={style} onClick={onClick}>
      <img src={slide.src} alt={label}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        onError={(e) => { if (!e.target.dataset.errored) { e.target.dataset.errored = "1"; e.target.src = "/no-image.jpeg"; } }} />
      {overlayCount > 0 ? (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(13,31,26,0.70)" }}>
          <span className="text-white text-2xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            +{overlayCount}
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3"
          style={{ background: "linear-gradient(to top, rgba(13,31,26,0.6), transparent)" }}>
          <span className="text-white/80 text-xs font-bold uppercase tracking-widest">View</span>
        </div>
      )}
    </div>
  );
}

function PhotoGrid({ slides, land, onOpen }) {
  if (!slides.length) return null;
  const open = (i) => onOpen(i);

  if (slides.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 400 }}>
        <SlideTile slide={slides[0]} index={0} label={`${land.title} 1`}
          style={{ width: "100%", height: "100%" }} onClick={() => open(0)} />
      </div>
    );
  }

  if (slides.length === 2) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, height: 380 }}>
        {slides.map((slide, i) => (
          <SlideTile key={i} slide={slide} index={i} label={`${land.title} ${i + 1}`}
            style={{ height: "100%" }} onClick={() => open(i)} />
        ))}
      </div>
    );
  }

  const extraCount = slides.length > 3 ? slides.length - 3 : 0;
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "205px 205px", gap: 3, height: 413 }}>
      <SlideTile slide={slides[0]} index={0} label={`${land.title} 1`}
        style={{ gridRow: "1 / 3", height: "100%" }} onClick={() => open(0)} />
      <SlideTile slide={slides[1]} index={1} label={`${land.title} 2`}
        style={{ height: "100%" }} onClick={() => open(1)} />
      <SlideTile slide={slides[2]} index={2} label={`${land.title} 3`}
        style={{ height: "100%" }} overlayCount={extraCount} onClick={() => open(2)} />
    </div>
  );
}

export default function LandDetails() {
  const params = useParams();
  const id = params?.id;

  const [land, setLand]           = useState(null);
  const [userUnits, setUserUnits] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [pinIsSet, setPinIsSet]         = useState(true);
  const [kycStatus, setKycStatus]       = useState("approved");
  const [statusLoaded, setStatusLoaded] = useState(false);

  const [modalType, setModalType]           = useState(null);
  const [unitsInput, setUnitsInput]         = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [useRewards, setUseRewards]         = useState(true);
  const [preview, setPreview]               = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [modalError, setModalError]         = useState(null);
  const [modalLoading, setModalLoading]     = useState(false);

  const [showPinModal, setShowPinModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex]     = useState(0);

  const previewTimer = useRef(null);

  const fetchLand = useCallback(async () => {
    try {
      const res = await api.get(`/lands/${id}`);
      setLand(res.data.data);
    } catch {
      setError("Unable to load land details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserUnits = useCallback(async () => {
    try {
      const res = await api.get(`/lands/${id}/units`);
      setUserUnits(res.data?.data?.user_units ?? 0);
    } catch {
      setUserUnits(0);
    }
  }, [id]);

  const fetchAccountStatus = useCallback(async () => {
    try {
      const res = await api.get("/user/account-status");
      const d = res.data?.data ?? {};
      setPinIsSet(!!d.pin_is_set);
      setKycStatus(d.kyc_status ?? "none");
    } catch {
      try {
        const res = await api.get("/me");
        const u = res.data?.data ?? {};
        setPinIsSet(u.pin_is_set ?? !!u.transaction_pin);
        setKycStatus(u.kyc_status ?? (u.is_kyc_verified ? "approved" : "none"));
      } catch {}
    } finally {
      setStatusLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchLand();
    fetchUserUnits();
    fetchAccountStatus();
  }, [fetchLand, fetchUserUnits, fetchAccountStatus]);

  useEffect(() => {
    if (modalType !== "purchase") return;
    const units = Number(unitsInput);
    if (!units || units <= 0) { setPreview(null); return; }

    clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await api.get(`/lands/${id}/purchase/preview`, {
          params: { units, use_rewards: useRewards ? 1 : 0 },
        });
        setPreview(res.data.data);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(previewTimer.current);
  }, [unitsInput, useRewards, modalType, id]);

  const openModal = (type) => {
    if (kycStatus !== "approved") { setShowKycModal(true); return; }
    if (!pinIsSet) { setShowPinModal(true); return; }
    setModalType(type);
    setPreview(null);
  };

  const closeModal = () => {
    setModalType(null);
    setUnitsInput("");
    setTransactionPin("");
    setUseRewards(true);
    setPreview(null);
    setModalError(null);
  };

  const handleAction = async () => {
    const units = Number(unitsInput);
    if (!units || units <= 0) { setModalError("Please enter a valid number of units."); return; }
    if (!/^\d{4}$/.test(transactionPin)) { setModalError("Transaction PIN must be 4 digits."); return; }

    setModalLoading(true);
    setModalError(null);

    try {
      let res;
      if (modalType === "purchase") {
        const response = await api.post(`/lands/${id}/purchase`, {
          units,
          use_rewards: useRewards,
          transaction_pin: transactionPin,
        });
        res = response.data;
        const savings = (res.total_discount_kobo ?? 0) + (res.paid_from_rewards_kobo ?? 0);
        let msg = `Purchase successful! Ref: ${res.reference}`;
        if (savings > 0) msg += ` · Saved ₦${(savings / 100).toLocaleString()}`;
        toast.success(msg);
      } else {
        const response = await api.post(`/lands/${id}/sell`, {
          units,
          transaction_pin: transactionPin,
        });
        res = response.data;
        toast.success(`Sold successfully! Ref: ${res.reference}`);
      }
      await fetchLand();
      await fetchUserUnits();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (msg?.toLowerCase().includes("pin not set")) {
        closeModal();
        setShowPinModal(true);
        return;
      }
      setModalError(msg || "Transaction failed. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F1A]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/40 text-sm tracking-widest uppercase">Loading property</p>
        </div>
      </div>
    );
  }

  if (error || !land) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1F1A]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Property not found."}</p>
          <Link href="/lands" className="text-amber-500 hover:text-amber-400 text-sm">← Back to Lands</Link>
        </div>
      </div>
    );
  }

  const priceKobo = getLandPrice(land);
  const slides    = getLandSlides(land);
  const maxUnits  = modalType === "sell" ? userUnits : (land.available_units ?? 0);
  const sellTotal = unitsInput && modalType === "sell" ? Number(unitsInput) * priceKobo : 0;

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-10">
        <Link href="/lands" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to Lands
        </Link>

        {slides.length > 0 && (
          <div className="mb-10">
            <PhotoGrid slides={slides} land={land}
              onOpen={(i) => { setPhotoIndex(i); setLightboxOpen(true); }} />
          </div>
        )}

        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">Property Listing</p>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {land.title}
          </h1>
          <div className="flex items-center gap-2 text-white/40 text-sm">
            <MapPin size={13} /> {land.location}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Size"         value={`${land.size} sqm`} />
          <StatCard label="Price / Unit" value={priceKobo > 0 ? formatNaira(priceKobo) : "—"} accent />
          <StatCard label="Available"    value={`${land.available_units?.toLocaleString() ?? "—"} units`} />
          <StatCard label="Total Units"  value={land.total_units?.toLocaleString() ?? "—"} />
        </div>

        {statusLoaded && <KycBanner kycStatus={kycStatus} />}

        {statusLoaded && !pinIsSet && kycStatus === "approved" && (
          <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={18} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-400 mb-1">Transaction PIN Required</p>
              <p className="text-xs text-white/40 leading-relaxed">Set a 4-digit transaction PIN before buying or selling land units.</p>
            </div>
            <Link href="/settings?tab=pin"
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-[#0D1F1A] px-3 py-2 rounded-lg transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
              <ShieldCheck size={13} /> Set PIN
            </Link>
          </div>
        )}

        {userUnits > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <TrendingUp size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500/70 mb-0.5">Your Holdings</p>
              <p className="text-white font-bold text-lg">
                {userUnits} <span className="text-white/40 text-sm font-normal">units owned</span>
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-white/30 mb-0.5">Est. Value</p>
              <p className="text-amber-400 font-bold">{priceKobo > 0 ? formatNaira(userUnits * priceKobo) : "—"}</p>
            </div>
          </div>
        )}

        {land.description && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Layers size={15} className="text-amber-500" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/70">Description</h3>
            </div>
            <p className="text-white/60 leading-relaxed text-sm">{land.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button onClick={() => openModal("purchase")}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
            <ShieldCheck size={16} /> Purchase Units
          </button>
          {userUnits > 0 && (
            <button onClick={() => openModal("sell")}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <TrendingUp size={16} /> Sell Units
            </button>
          )}
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)}
          index={photoIndex} slides={slides}
          plugins={slides.length > 1 ? [Thumbnails] : []} />
      )}

      {/* ── Transaction modal ─────────────────────────────────────────────── */}
      {modalType && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "#0D1F1A", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>

            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-0.5">
                  {modalType === "purchase" ? "Purchase" : "Sell"}
                </p>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {land.title}
                </h2>
              </div>
              <button onClick={closeModal}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                <X size={14} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Units input with stepper */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                  Number of Units
                  {maxUnits > 0 && (
                    <span className="ml-2 normal-case text-white/20 font-normal">
                      (max {maxUnits} · double-click to fill)
                    </span>
                  )}
                </label>
                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={() => setUnitsInput((v) => String(Math.max(1, Number(v || 1) - 1)))}
                    disabled={!unitsInput || Number(unitsInput) <= 1}
                    className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold">
                    −
                  </button>
                  <input
                    type="number" min={1} max={maxUnits || undefined}
                    value={unitsInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") return setUnitsInput("");
                      const n = Math.floor(Number(raw));
                      if (isNaN(n) || n < 0) return;
                      setUnitsInput(String(Math.min(n, maxUnits || n)));
                    }}
                    onBlur={(e) => {
                      const n = Math.floor(Number(e.target.value));
                      if (!isNaN(n) && n > 0) setUnitsInput(String(Math.min(Math.max(1, n), maxUnits)));
                    }}
                    onDoubleClick={() => { if (maxUnits > 0) setUnitsInput(String(maxUnits)); }}
                    className="flex-1 bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-2.5 rounded-xl text-sm outline-none transition-all text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <button type="button"
                    onClick={() => setUnitsInput((v) => String(Math.min(maxUnits, Number(v || 0) + 1)))}
                    disabled={maxUnits > 0 && Number(unitsInput) >= maxUnits}
                    className="w-10 h-10 shrink-0 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-lg font-bold">
                    +
                  </button>
                </div>
                {maxUnits > 0 && (
                  <p className="text-xs text-white/25 mt-1.5 pl-1">
                    {modalType === "sell"
                      ? `${userUnits} unit${userUnits !== 1 ? "s" : ""} owned`
                      : `${land.available_units} unit${land.available_units !== 1 ? "s" : ""} available`}
                  </p>
                )}
              </div>

              {/* Rewards toggle — purchase only */}
              {modalType === "purchase" && (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Wallet size={14} className="text-amber-400/70" />
                    <span className="text-sm text-white/70 font-medium">Use rewards &amp; discounts</span>
                  </div>
                  <button type="button" onClick={() => setUseRewards((v) => !v)} className="transition-colors" aria-label="Toggle rewards">
                    {useRewards
                      ? <ToggleRight size={26} className="text-amber-400" />
                      : <ToggleLeft  size={26} className="text-white/20"  />}
                  </button>
                </div>
              )}

              {/* Cost breakdown — purchase */}
              {modalType === "purchase" && Number(unitsInput) > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <div className="w-3.5 h-3.5 border border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
                      <span className="text-xs text-amber-500/50">Calculating…</span>
                    </div>
                  ) : preview ? (
                    <>
                      {preview.discount_label && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <Tag size={11} className="text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">{preview.discount_label}</span>
                        </div>
                      )}

                      <BreakdownRow label="Original cost"
                        value={`₦${preview.original_cost_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                        strikethrough={preview.total_discount_kobo > 0} />

                      {preview.first_purchase_discount_kobo > 0 && (
                        <BreakdownRow label="First-purchase discount"
                          value={`-₦${preview.first_purchase_discount_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`} green />
                      )}

                      {preview.referral_discount_kobo > 0 && (
                        <BreakdownRow label="Referral discount"
                          value={`-₦${preview.referral_discount_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`} green />
                      )}

                      {/* ── Cap notice — only when label contains "capped" ── */}
                      <CapNotice preview={preview} />

                      {preview.paid_from_rewards_kobo > 0 && (
                        <BreakdownRow label="From rewards balance"
                          value={`-₦${preview.paid_from_rewards_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`} green />
                      )}

                      <div className="border-t border-white/10 mt-2 pt-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold uppercase tracking-wider text-white/50">You pay</span>
                          <span className="text-xl font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                            ₦{preview.total_due_naira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        {!preview.sufficient_balance && (
                          <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                            <AlertCircle size={11} /> Insufficient wallet balance
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-amber-500/70 uppercase tracking-widest mb-1">Total to Pay</p>
                      <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        {formatNaira(Number(unitsInput) * priceKobo)}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Cost — sell */}
              {modalType === "sell" && sellTotal > 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-xs text-amber-500/70 uppercase tracking-widest mb-1">You'll Receive</p>
                  <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {formatNaira(sellTotal)}
                  </p>
                </div>
              )}

              {/* PIN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">Transaction PIN</label>
                <input type="password" inputMode="numeric" maxLength={4}
                  value={transactionPin}
                  onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 px-4 py-3 rounded-xl text-center text-2xl tracking-[0.5em] outline-none transition-all"
                  placeholder="••••" />
              </div>

              {modalError && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-red-400 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" /> {modalError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={closeModal}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm font-semibold transition-all">
                  Cancel
                </button>
                <button onClick={handleAction}
                  disabled={
                    modalLoading || !unitsInput || Number(unitsInput) <= 0 || !transactionPin ||
                    (modalType === "purchase" && preview && !preview.sufficient_balance) ||
                    (modalType === "sell"     && Number(unitsInput) > userUnits)          ||
                    (modalType === "purchase" && Number(unitsInput) > (land.available_units ?? 0))
                  }
                  className="flex-1 py-3 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                  {modalLoading
                    ? <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-[#0D1F1A]/40 border-t-[#0D1F1A] rounded-full animate-spin" />
                        Processing...
                      </span>
                    : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIN not set modal ─────────────────────────────────────────────── */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "#0D1F1A", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
                <Lock size={22} className="text-amber-500" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600 mb-2">Action Required</p>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Set Transaction PIN
              </h2>
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                You need a 4-digit transaction PIN before buying or selling land units.
              </p>
              <div className="space-y-3">
                <Link href="/settings?tab=pin"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
                  <ShieldCheck size={15} /> Go to Settings
                </Link>
                <button onClick={() => setShowPinModal(false)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 text-sm font-semibold transition-all">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── KYC blocker modal ─────────────────────────────────────────────── */}
      {showKycModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "#0D1F1A", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-5">
                <ShieldCheck size={22} className="text-purple-400" />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-500 mb-2">Verification Required</p>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Complete KYC First
              </h2>
              <p className="text-white/40 text-sm mb-6 leading-relaxed">
                {{
                  none:     "Identity verification is required before you can invest.",
                  pending:  "Your KYC is under review. Please wait for approval.",
                  rejected: "Your KYC was rejected. Please resubmit your documents.",
                  resubmit: "KYC resubmission is required before investing.",
                }[kycStatus] ?? "Identity verification is required."}
              </p>
              <div className="space-y-3">
                {["none", "rejected", "resubmit"].includes(kycStatus) && (
                  <Link href="/settings?tab=kyc"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white border border-purple-500/40 hover:bg-purple-500/20 transition-all">
                    <ShieldCheck size={15} /> {kycStatus === "none" ? "Submit KYC" : "Resubmit KYC"}
                  </Link>
                )}
                <button onClick={() => setShowKycModal(false)}
                  className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 text-sm font-semibold transition-all">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
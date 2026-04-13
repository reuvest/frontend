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
  Info as InfoIcon, FileText, Activity, Zap,
  Building2, BarChart3, ChevronDown, ChevronUp,
} from "lucide-react";

import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

/* ─── Constants ─────────────────────────────────────────────────────────── */

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function getLandPrice(land) {
  return (
    land.latest_price?.price_per_unit_kobo ??
    land.latestPrice?.price_per_unit_kobo ??
    land.current_price_per_unit_kobo ??
    land.price_per_unit_kobo ??
    0
  );
}

function nilOrDash(v) {
  if (v === null || v === undefined || v === "") return true;
  const s = String(v).trim().toLowerCase();
  return s === "nil" || s === "-" || s === "none" || s === "null";
}

function fmt(v) {
  if (nilOrDash(v)) return "—";
  return String(v).trim();
}

function capitalize(str) {
  if (!str) return str;
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}

/**
 * Convert land.valuations [{id, year, month, value}] to
 * [[year, value, month], ...] sorted by year asc, month asc.
 */
function valuationsToPoints(valuations = []) {
  return [...valuations]
    .sort((a, b) => a.year !== b.year ? a.year - b.year : (a.month ?? 0) - (b.month ?? 0))
    .map(({ year, month, value }) => [year, Number(value), month ?? null]);
}

/* ─── Collapsible Section ───────────────────────────────────────────────── */
function Section({ title, icon, children, defaultOpen = true, accent = "amber" }) {
  const [open, setOpen] = useState(defaultOpen);
  const accentMap = {
    amber:   { border: "border-amber-500/20",   icon: "bg-amber-500/10 text-amber-400"     },
    emerald: { border: "border-emerald-500/20",  icon: "bg-emerald-500/10 text-emerald-400" },
    blue:    { border: "border-blue-500/20",     icon: "bg-blue-500/10 text-blue-400"       },
    purple:  { border: "border-purple-500/20",   icon: "bg-purple-500/10 text-purple-400"   },
    rose:    { border: "border-rose-500/20",     icon: "bg-rose-500/10 text-rose-400"       },
  };
  const a = accentMap[accent] || accentMap.amber;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${a.icon}`}>
            {icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
            {title}
          </span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-white/20" />
          : <ChevronDown size={14} className="text-white/20" />}
      </button>
      {open && (
        <div className={`border-t ${a.border} px-5 pb-5 pt-4`}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Data Row ──────────────────────────────────────────────────────────── */
function DataRow({ label, value, highlight, mono, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-white/35 shrink-0 w-44">{label}</span>
      {children ?? (
        <span className={`text-xs text-right ${
          highlight ? "font-bold text-amber-400" :
          mono      ? "font-mono text-white/60"  :
          "text-white/70"
        }`}>
          {fmt(value)}
        </span>
      )}
    </div>
  );
}

/* ─── Tag Pill ──────────────────────────────────────────────────────────── */
function Pill({ children, color = "default" }) {
  const colors = {
    default: "bg-white/5 border-white/10 text-white/50",
    green:   "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
    blue:    "bg-blue-500/10 border-blue-500/20 text-blue-400",
    red:     "bg-red-500/10 border-red-500/20 text-red-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
}

/* ─── Signal Bar ────────────────────────────────────────────────────────── */
function SignalBar({ strength }) {
  const pct   = Number(strength) || 0;
  const color = pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/40 w-8 text-right">{pct}%</span>
    </div>
  );
}

/* ─── Price Trend Panel ─────────────────────────────────────────────────── */
function PriceTrendPanel({ valuations = [] }) {
  const [tooltip, setTooltip]   = useState(null);
  const [animated, setAnimated] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 120);
    return () => clearTimeout(t);
  }, []);

  const points = valuationsToPoints(valuations);

  if (!points.length) return null;

  const W = 560, H = 200;
  const PAD = { t: 24, r: 16, b: 36, l: 56 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;

  const values = points.map(([, v]) => v);
  const minV   = Math.min(...values) * 0.92;
  const maxV   = Math.max(...values) * 1.04;
  const range  = maxV - minV || 1;

  const xOf = (i) => PAD.l + (i / Math.max(points.length - 1, 1)) * plotW;
  const yOf = (v)  => PAD.t + plotH - ((v - minV) / range) * plotH;
  const coords = points.map(([, v], i) => [xOf(i), yOf(v)]);

  const linePath = coords.reduce((acc, [x, y], i) => {
    if (i === 0) return `M ${x},${y}`;
    const [px, py] = coords[i - 1];
    const cpx = (px + x) / 2;
    return `${acc} C ${cpx},${py} ${cpx},${y} ${x},${y}`;
  }, "");

  const areaPath =
    `${linePath} L ${coords[coords.length - 1][0]},${PAD.t + plotH} L ${PAD.l},${PAD.t + plotH} Z`;

  const firstVal    = points[0][1];
  const lastVal     = points[points.length - 1][1];
  const totalGrowth = firstVal > 0
    ? (((lastVal - firstVal) / firstVal) * 100).toFixed(0)
    : null;
  const prevVal   = points.length >= 2 ? points[points.length - 2][1] : null;
  const yoyGrowth = prevVal
    ? (((lastVal - prevVal) / prevVal) * 100).toFixed(1)
    : null;

  const yTicks = [0, 0.33, 0.66, 1].map((t) => minV + t * range);

  const fmtVal = (v) => {
    if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 2)}M`;
    if (v >= 1_000)     return `₦${(v / 1_000).toFixed(0)}k`;
    return `₦${Math.round(v).toLocaleString()}`;
  };

  const pointLabel = ([year, , month]) =>
    month ? `${MONTH_SHORT[month - 1]} ${year}` : String(year);

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx   = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0, bestDist = Infinity;
    coords.forEach(([x], i) => {
      const d = Math.abs(x - mx);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    if (mx < PAD.l - 4 || mx > W - PAD.r + 4) { setTooltip(null); return; }
    setTooltip({
      idx: best,
      x: coords[best][0],
      y: coords[best][1],
      label: pointLabel(points[best]),
      value: points[best][1],
    });
  };

  return (
    <div className="mb-10 rounded-2xl border border-white/[0.09] overflow-hidden"
      style={{ background: "linear-gradient(160deg, rgba(200,135,58,0.06) 0%, rgba(13,31,26,0) 60%)" }}>

      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-5 pb-0 flex-wrap gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-amber-500/60 mb-1">Price Trend</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {fmtVal(lastVal)}
            </p>
            {yoyGrowth !== null && (
              <span className={`text-sm font-bold ${Number(yoyGrowth) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {Number(yoyGrowth) >= 0 ? "▲" : "▼"} {Math.abs(yoyGrowth)}% since prev
              </span>
            )}
          </div>
          <p className="text-xs text-white/25 mt-0.5">
            Current land value · {pointLabel(points[0])}–{pointLabel(points[points.length - 1])}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {totalGrowth !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <TrendingUp size={11} className="text-emerald-400" />
              <span className="text-[11px] font-black text-emerald-400">+{totalGrowth}% total</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-white/40">{points.length} data points</span>
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <div className="px-2 pt-3 pb-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 200, display: "block" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        >
          <defs>
            <linearGradient id="lineGradPTC" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#C8873A" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#E8A850" stopOpacity="1"    />
            </linearGradient>
            <linearGradient id="areaGradPTC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#C8873A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#C8873A" stopOpacity="0"    />
            </linearGradient>
            <clipPath id="revealPTC">
              <rect x="0" y="0" width={animated ? W : 0} height={H}
                style={{ transition: "width 1.3s cubic-bezier(0.33,1,0.68,1)" }} />
            </clipPath>
          </defs>

          {yTicks.map((v, i) => {
            const y = yOf(v);
            return (
              <g key={i}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y}
                  stroke="rgba(255,255,255,0.5)" strokeWidth="1"
                  strokeDasharray={i === 0 ? "none" : "3 4"} />
                <text x={PAD.l - 8} y={y + 3.5} textAnchor="end" fontSize="12"
                  fill="rgba(255,255,255,0.52)" fontFamily="'DM Sans', sans-serif">
                  {fmtVal(v)}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#areaGradPTC)" clipPath="url(#revealPTC)" />
          <path d={linePath} fill="none" stroke="#E8A850" strokeWidth="4"
            strokeOpacity="0.75" strokeLinecap="round" clipPath="url(#revealPTC)" />
          <path d={linePath} fill="none" stroke="url(#lineGradPTC)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" clipPath="url(#revealPTC)" />

          {tooltip && (
            <line x1={tooltip.x} x2={tooltip.x} y1={PAD.t} y2={PAD.t + plotH}
              stroke="rgba(200,135,58,0.25)" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {coords.map(([x, y], i) => {
            const isLast    = i === points.length - 1;
            const isHovered = tooltip?.idx === i;
            return (
              <g key={i} clipPath="url(#revealPTC)">
                {(isHovered || isLast) && (
                  <circle cx={x} cy={y} r={isHovered ? 9 : 6} fill="none" stroke="#E8A850"
                    strokeOpacity={isHovered ? 0.3 : 0.2} strokeWidth="1" />
                )}
                <circle cx={x} cy={y} r={isHovered ? 5 : isLast ? 4 : 3}
                  fill={isLast ? "#E8A850" : "#C8873A"} stroke="#0D1F1A" strokeWidth="1.5" />
              </g>
            );
          })}

          {/* X-axis labels */}
          {coords.map(([x], i) => (
            <text key={i} x={x} y={H - 6} textAnchor="middle" fontSize="8"
              fill={tooltip?.idx === i ? "rgba(232,168,80,0.9)" : "rgba(255,255,255,0.72)"}
              fontFamily="'DM Sans', sans-serif"
              fontWeight={tooltip?.idx === i ? "700" : "400"}>
              {pointLabel(points[i])}
            </text>
          ))}

          {tooltip && (() => {
            const TW = 108, TH = 42;
            const tx = Math.min(Math.max(tooltip.x - TW / 2, PAD.l), W - PAD.r - TW);
            const ty = Math.max(tooltip.y - TH - 14, PAD.t);
            return (
              <g style={{ pointerEvents: "none" }}>
                <rect x={tx} y={ty} width={TW} height={TH} rx="8"
                  fill="#1C3A2E" stroke="rgba(200,135,58,0.4)" strokeWidth="1" />
                <text x={tx + TW / 2} y={ty + 13} textAnchor="middle" fontSize="8.5"
                  fill="rgba(255,255,255,0.38)" fontFamily="'DM Sans', sans-serif">
                  {tooltip.label}
                </text>
                <text x={tx + TW / 2} y={ty + 30} textAnchor="middle" fontSize="12"
                  fontWeight="700" fill="#E8A850" fontFamily="'Playfair Display', serif">
                  {fmtVal(tooltip.value)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Month-by-month breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-px border-t border-white/[0.06] mt-1">
        {points.map(([year, value, month], i) => {
          const prev   = i > 0 ? points[i - 1][1] : null;
          const deltaP = prev ? (((value - prev) / prev) * 100).toFixed(0) : null;
          const isLast = i === points.length - 1;
          const label  = month ? `${MONTH_SHORT[month - 1]} ${year}` : String(year);
          return (
            <div key={`${year}-${month ?? i}`}
              className={`px-4 py-3 flex flex-col gap-0.5 ${isLast ? "bg-amber-500/5" : "bg-transparent"}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">{label}</span>
              <span className={`text-sm font-bold tabular-nums ${isLast ? "text-amber-400" : "text-white/70"}`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {fmtVal(value)}
              </span>
              {deltaP !== null && (
                <span className={`text-[10px] font-bold ${Number(deltaP) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {Number(deltaP) >= 0 ? "+" : ""}{deltaP}%
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ? "text-amber-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

/* ─── KYC Banner ────────────────────────────────────────────────────────── */
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
    <div className={`mb-6 flex items-center gap-4 rounded-2xl border ${colors.border} ${colors.bg} p-4`}>
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

/* ─── Breakdown Row ─────────────────────────────────────────────────────── */
function BreakdownRow({ label, value, highlight, strikethrough, green, muted }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-xs ${muted ? "text-white/30" : "text-white/50"}`}>{label}</span>
      <span className={`text-xs font-semibold ${
        strikethrough ? "line-through text-white/30" :
        green         ? "text-emerald-400" :
        highlight     ? "text-amber-400"   :
        "text-white"
      }`}>{value}</span>
    </div>
  );
}

// function CapNotice({ preview }) {
//   const isCapped = preview?.discount_label?.toLowerCase().includes("capped");
//   if (!isCapped) return null;
//   const cappedKobo = preview.total_discount_kobo ?? 0;
//   return (
//     <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/5 px-3 py-2 mt-1">
//       <InfoIcon size={11} className="text-amber-400/60 shrink-0 mt-0.5" />
//       <p className="text-xs text-amber-400/70 leading-relaxed">
//         A maximum discount cap applies. Your saving is limited to{" "}
//         <span className="font-semibold text-amber-400">
//           ₦{(cappedKobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
//         </span>{" "}
//         on this order.
//       </p>
//     </div>
//   );
// }

/* ─── Photo Grid ────────────────────────────────────────────────────────── */
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
  if (slides.length === 1) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10" style={{ height: 400 }}>
        <SlideTile slide={slides[0]} index={0} label={`${land.title} 1`}
          style={{ width: "100%", height: "100%" }} onClick={() => onOpen(0)} />
      </div>
    );
  }
  if (slides.length === 2) {
    return (
      <div className="rounded-2xl overflow-hidden border border-white/10"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, height: 380 }}>
        {slides.map((slide, i) => (
          <SlideTile key={i} slide={slide} index={i} label={`${land.title} ${i + 1}`}
            style={{ height: "100%" }} onClick={() => onOpen(i)} />
        ))}
      </div>
    );
  }
  const extraCount = slides.length > 3 ? slides.length - 3 : 0;
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10"
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "205px 205px", gap: 3, height: 413 }}>
      <SlideTile slide={slides[0]} index={0} label={`${land.title} 1`}
        style={{ gridRow: "1 / 3", height: "100%" }} onClick={() => onOpen(0)} />
      <SlideTile slide={slides[1]} index={1} label={`${land.title} 2`}
        style={{ height: "100%" }} onClick={() => onOpen(1)} />
      <SlideTile slide={slides[2]} index={2} label={`${land.title} 3`}
        style={{ height: "100%" }} overlayCount={extraCount} onClick={() => onOpen(2)} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export default function LandDetails() {
  const params = useParams();
  const id     = params?.id;

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
      const d   = res.data?.data ?? {};
      setPinIsSet(!!d.pin_is_set);
      setKycStatus(d.kyc_status ?? "none");
    } catch {
      try {
        const res = await api.get("/me");
        const u   = res.data?.data ?? {};
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

  // Debounced purchase preview
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
    if (!pinIsSet)                { setShowPinModal(true); return; }
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
    if (!units || units <= 0)             { setModalError("Please enter a valid number of units."); return; }
    if (!/^\d{4}$/.test(transactionPin)) { setModalError("Transaction PIN must be 4 digits."); return; }

    setModalLoading(true);
    setModalError(null);

    try {
      if (modalType === "purchase") {
        const { data: res } = await api.post(`/lands/${id}/purchase`, {
          units,
          use_rewards:     useRewards,
          transaction_pin: transactionPin,
        });

        const savings = (res.total_discount_kobo ?? 0) + (res.paid_from_rewards_kobo ?? 0);
        toast.success(
          `Purchase successful${savings > 0 ? ` · Saved ₦${(savings / 100).toLocaleString()}` : ""}`
        );

        // ── Certificate issued toast ───────────────────────────────────────
        if (res.certificate?.cert_number) {
          const certNum = res.certificate.cert_number;
          setTimeout(() => {
            toast(
              (t) => (
                <span className="flex items-center gap-2 text-sm">
                  <span>🏅 Certificate issued!</span>
                  <a
                    href={`/portfolio/certificate/${certNum}`}
                    className="underline font-bold text-amber-500 hover:text-amber-400"
                    onClick={() => toast.dismiss(t.id)}
                  >
                    View →
                  </a>
                </span>
              ),
              { duration: 8000 }
            );
          }, 800);
        }
      } else {
        await api.post(`/lands/${id}/sell`, {
          units,
          transaction_pin: transactionPin,
        });
        toast.success("Transaction Successful");
      }

      await fetchLand();
      await fetchUserUnits();
      closeModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (msg?.toLowerCase().includes("pin not set")) { closeModal(); setShowPinModal(true); return; }
      setModalError(msg || "Transaction failed. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────
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

  const allocationRecords = land.allocation_records      ?? [];
  const landTitles        = land.land_titles             ?? [];
  const historicalTx      = land.historical_transactions ?? [];
  const commLines         = land.comm_lines              ?? [];
  const valuations        = land.valuations              ?? [];

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/lands" className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mb-8">
          <ArrowLeft size={13} /> Back to Lands
        </Link>

        {/* Photo grid */}
        {slides.length > 0 && (
          <div className="mb-10">
            <PhotoGrid slides={slides} land={land}
              onOpen={(i) => { setPhotoIndex(i); setLightboxOpen(true); }} />
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600">Property Listing</span>
            {land.plot_identifier && (
              <span className="text-[10px] font-mono text-white/20 border border-white/10 px-2 py-0.5 rounded-md">
                {land.plot_identifier}
              </span>
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {land.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-white/40 text-sm">
            <span className="flex items-center gap-1.5"><MapPin size={13} /> {land.location}</span>
            {land.lga   && <span className="text-white/25">LGA: {land.lga}</span>}
            {land.city  && <span className="text-white/25">{land.city}</span>}
            {land.state && <span className="text-white/25">{land.state}</span>}
          </div>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Size"         value={land.size ? `${land.size} sqm` : "—"} />
          <StatCard label="Price / Unit" value={priceKobo > 0 ? formatNaira(priceKobo) : "—"} accent />
          <StatCard label="Available"    value={`${land.available_units?.toLocaleString() ?? "—"} units`} />
          <StatCard label="Total Units"  value={land.total_units?.toLocaleString() ?? "—"} />
        </div>

        {/* KYC banner */}
        {statusLoaded && <KycBanner kycStatus={kycStatus} />}

        {/* PIN banner */}
        {statusLoaded && !pinIsSet && kycStatus === "approved" && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 flex items-start gap-4">
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

        {/* Holdings banner */}
        {userUnits > 0 && (
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-center gap-4">
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

        {/* CTA buttons */}
        <div className="flex flex-wrap gap-3 mb-10">
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

        {/* Price Trend Chart */}
        {valuations.length > 0 && (
          <PriceTrendPanel valuations={valuations} />
        )}

        {/* Detail sections */}
        <div className="space-y-4">

          {land.description && (
            <Section title="Description" icon={<Layers size={14} />} accent="amber">
              <p className="text-white/60 leading-relaxed text-sm">{land.description}</p>
            </Section>
          )}

          <Section title="Value & Unit Information" icon={<BarChart3 size={14} />} accent="amber">
            <DataRow label="Plot Size"         value={land.size ? `${land.size} sqm` : "—"} />
            <DataRow label="Overall Value"
              value={land.overall_value ? `₦${Number(land.overall_value).toLocaleString("en-NG")}` : "—"}
              highlight />
            <DataRow label="Number of Units"   value={land.total_units?.toLocaleString() ?? "—"} />
            <DataRow label="Size per Unit"
              value={land.size && land.total_units
                ? `${(land.size / land.total_units).toFixed(4)} sqm`
                : "—"} />
            <DataRow label="Price per Unit"    value={priceKobo > 0 ? formatNaira(priceKobo) : "—"} highlight />
            <DataRow label="Current Land Value"
              value={land.current_land_value
                ? `₦${Number(land.current_land_value).toLocaleString("en-NG")}`
                : "—"}
              highlight />
            {!nilOrDash(land.rental_pm) && (
              <DataRow label="Rental Value (p/m)"
                value={`₦${Number(land.rental_pm).toLocaleString("en-NG")}`} />
            )}
            {!nilOrDash(land.rental_pa) && (
              <DataRow label="Rental Value (p/a)"
                value={`₦${Number(land.rental_pa).toLocaleString("en-NG")}`} />
            )}
          </Section>

          <Section title="Administrative Information" icon={<Building2 size={14} />} accent="blue">
            <DataRow label="Plot Identifier" value={land.plot_identifier} mono />
            <DataRow label="LGA"             value={land.lga} />
            <DataRow label="City"            value={land.city} />
            <DataRow label="State"           value={land.state} />
            <DataRow label="Tenure"          value={land.tenure} />
            <DataRow label="Dispute Status">
              <Pill color={nilOrDash(land.dispute_status) ? "green" : "red"}>
                {nilOrDash(land.dispute_status) ? "No Disputes" : fmt(land.dispute_status)}
              </Pill>
            </DataRow>
            {allocationRecords.length > 0 && (
              <DataRow label="Allocation Records">
                <div className="text-right space-y-0.5">
                  {allocationRecords.map((r, i) => (
                    <p key={i} className="text-xs text-white/50">{r}</p>
                  ))}
                </div>
              </DataRow>
            )}
          </Section>

          <Section title="Ownership & Legal Records" icon={<FileText size={14} />} accent="purple">
            <DataRow label="Current Owner" value={land.current_owner} />
            <DataRow label="Taxation"
              value={nilOrDash(land.taxation) ? "None" : fmt(land.taxation)} />
            {landTitles.length > 0 && (
              <DataRow label="Land Titles / Deeds">
                <div className="text-right space-y-0.5">
                  {landTitles.map((t, i) => (
                    <p key={i} className="text-xs text-white/50">{t}</p>
                  ))}
                </div>
              </DataRow>
            )}
            {historicalTx.length > 0 && (
              <DataRow label="Historical Transfers">
                <div className="text-right space-y-0.5">
                  {historicalTx.map((t, i) => (
                    <p key={i} className="text-xs text-white/50">{t}</p>
                  ))}
                </div>
              </DataRow>
            )}
          </Section>

          <Section title="Land Use Information" icon={<MapPin size={14} />} accent="emerald">
            <DataRow label="Pre-existing Land Use">
              <Pill>{capitalize(fmt(land.preexisting_landuse))}</Pill>
            </DataRow>
            <DataRow label="Current Land Use">
              <Pill>{capitalize(fmt(land.current_landuse))}</Pill>
            </DataRow>
            <DataRow label="Proposed / Potential Use">
              <Pill color="amber">{capitalize(fmt(land.proposed_landuse))}</Pill>
            </DataRow>
            <DataRow label="Zoning Regulations"
              value={nilOrDash(land.zoning) ? "None" : fmt(land.zoning)} />
            <DataRow label="Development Control"
              value={nilOrDash(land.dev_control) ? "None" : fmt(land.dev_control)} />
          </Section>

          <Section title="Geospatial & Physical Data" icon={<Activity size={14} />} accent="blue">
            {land.lat && <DataRow label="Latitude"  value={land.lat} mono />}
            {land.lng && <DataRow label="Longitude" value={land.lng} mono />}
            <DataRow label="Slope"
              value={land.slope != null ? `${land.slope}°` : "—"} />
            <DataRow label="Elevation"
              value={nilOrDash(land.elevation) ? "—" : fmt(land.elevation)} />
            <DataRow label="Soil Type"        value={fmt(land.soil_type)} />
            <DataRow label="Bearing Capacity"
              value={nilOrDash(land.bearing_capacity) ? "—" : fmt(land.bearing_capacity)} />
            <DataRow label="Hydrology">
              <Pill color={String(land.hydrology ?? "").toUpperCase() === "DRAINED" ? "green" : "default"}>
                {capitalize(fmt(land.hydrology))}
              </Pill>
            </DataRow>
            <DataRow label="Vegetation Cover" value={capitalize(fmt(land.vegetation))} />
          </Section>

          <Section title="Infrastructure & Utilities" icon={<Zap size={14} />} accent="amber">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20 mb-2 mt-1">Road Access</p>
            <DataRow label="Road Type"      value={capitalize(fmt(land.road_type))} />
            <DataRow label="Road Category"  value={capitalize(fmt(land.road_category))} />
            <DataRow label="Road Condition">
              <Pill color={
                String(land.road_condition ?? "").toLowerCase().includes("tarr") ? "green" :
                String(land.road_condition ?? "").toLowerCase().includes("good") ? "green" :
                "amber"
              }>
                {capitalize(fmt(land.road_condition))}
              </Pill>
            </DataRow>

            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20 mb-2 mt-4">Utilities</p>
            <DataRow label="Electricity">
              <Pill color={nilOrDash(land.electricity) ? "red" : "amber"}>
                {nilOrDash(land.electricity) ? "None" : fmt(land.electricity)}
              </Pill>
            </DataRow>
            <DataRow label="Water Supply">
              <Pill color={nilOrDash(land.water_supply) ? "red" : "green"}>
                {nilOrDash(land.water_supply) ? "None" : fmt(land.water_supply)}
              </Pill>
            </DataRow>
            <DataRow label="Sewage">
              <Pill color={nilOrDash(land.sewage) ? "red" : "green"}>
                {nilOrDash(land.sewage) ? "None" : fmt(land.sewage)}
              </Pill>
            </DataRow>
            <DataRow label="Other Facilities">
              <span className="text-xs text-white/60">
                {nilOrDash(land.other_facilities) ? "None listed" : fmt(land.other_facilities)}
              </span>
            </DataRow>

            {commLines.length > 0 && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/20 mb-3 mt-4">
                  Communication Lines
                </p>
                <div className="space-y-2.5">
                  {commLines.map(([network, strength], i) => (
                    <div key={i} className="grid grid-cols-[80px_1fr] items-center gap-3">
                      <span className="text-xs font-bold text-white/50">{network}</span>
                      <SignalBar strength={strength} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox open={lightboxOpen} close={() => setLightboxOpen(false)}
          index={photoIndex} slides={slides}
          plugins={slides.length > 1 ? [Thumbnails] : []} />
      )}

      {/* ── Transaction modal ──────────────────────────────────────────────── */}
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

              {/* Units input */}
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

              {/* Rewards toggle */}
              {modalType === "purchase" && (
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Wallet size={14} className="text-amber-400/70" />
                    <span className="text-sm text-white/70 font-medium">Use rewards &amp; discounts</span>
                  </div>
                  <button type="button" onClick={() => setUseRewards((v) => !v)} aria-label="Toggle rewards">
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
                      {/* <CapNotice preview={preview} /> */}
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
                  <p className="text-xs text-amber-500/70 uppercase tracking-widest mb-1">You&apos;ll Receive</p>
                  <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {formatNaira(sellTotal)}
                  </p>
                </div>
              )}

              {/* PIN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                  Transaction PIN
                </label>
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

      {/* ── PIN not set modal ──────────────────────────────────────────────── */}
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

      {/* ── KYC blocker modal ──────────────────────────────────────────────── */}
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
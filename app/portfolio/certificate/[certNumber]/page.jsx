"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "../../../../utils/api";
import {
  ArrowLeft, Download, ShieldCheck, MapPin,
  Award, CheckCircle2, ExternalLink, Loader2,
  AlertCircle,
} from "lucide-react";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" }) : "—";

const fmtNaira = (v) =>
  v != null ? `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2 })}` : "—";

const appname  = process.env.NEXT_PUBLIC_APP_NAME  || "REU.ng";

/* ─── Certificate Seal SVG ──────────────────────────────────────────────── */
function Seal({ size = 96 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none">
      <circle cx="48" cy="48" r="46" stroke="#C8873A" strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="48" cy="48" r="38" stroke="#C8873A" strokeWidth="0.8" strokeOpacity="0.3" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 48 + 42 * Math.cos(angle);
        const y1 = 48 + 42 * Math.sin(angle);
        const x2 = 48 + 36 * Math.cos(angle);
        const y2 = 48 + 36 * Math.sin(angle);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C8873A" strokeWidth="1" strokeOpacity="0.5" />;
      })}
      <circle cx="48" cy="48" r="28" fill="rgba(200,135,58,0.08)" stroke="#C8873A" strokeWidth="0.8" strokeOpacity="0.4" />
      <path d="M36 48l8 8 16-16" stroke="#E8A850" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Detail Row ────────────────────────────────────────────────────────── */
function DetailRow({ label, value, mono = false, highlight = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 shrink-0 w-40 mt-0.5">
        {label}
      </span>
      <span className={`text-sm text-right break-all ${
        highlight ? "font-bold text-amber-400" :
        mono      ? "font-mono text-white/50 text-xs" :
        "text-white/75"
      }`}>
        {value ?? "—"}
      </span>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function CertificatePage() {
  const { certNumber } = useParams();

  const [cert, setCert]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  const fetchCert = useCallback(async () => {
    try {
      const res = await api.get(`/certificates/${certNumber}`);
      setCert(res.data.data);
    } catch {
      setError("Certificate not found or you don't have access.");
    } finally {
      setLoading(false);
    }
  }, [certNumber]);

  useEffect(() => { fetchCert(); }, [fetchCert]);

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadError("");

    try {
      const res = await api.get(`/certificates/${certNumber}/download`, {
        responseType: "blob",
      });

      // Verify we actually got a PDF back (guards against an auth error JSON)
      const contentType = res.headers?.["content-type"] ?? "";
      if (!contentType.includes("application/pdf")) {
        throw new Error("Unexpected response type — please try again.");
      }

      const url      = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const anchor   = document.createElement("a");
      anchor.href     = url;
      anchor.download = `${certNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg =
        err.response?.status === 401 ? "Session expired — please log in again." :
        err.response?.status === 403 ? "You don't have access to this certificate." :
        err.response?.status === 404 ? "Certificate not found." :
        err.message || "Download failed. Please try again.";

      setDownloadError(msg);
    } finally {
      setDownloading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/30 text-sm tracking-widest uppercase">Loading certificate</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#0D1F1A] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "Certificate not found."}</p>
          <Link href="/portfolio" className="text-amber-500 hover:text-amber-400 text-sm">
            ← Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  const isRevoked = cert.status === "revoked";

  return (
    <div className="min-h-screen bg-[#0D1F1A] relative"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Background dot grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(200,135,58,0.07) 0%, transparent 70%)" }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-10">

        {/* Nav */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/portfolio"
            className="inline-flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft size={13} /> Back to Portfolio
          </Link>

          {/* Only show download button when cert is active */}
          {!isRevoked && (
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
          )}
        </div>

        {/* Download error */}
        {downloadError && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-400">{downloadError}</p>
          </div>
        )}

        {/* Revoked banner */}
        {isRevoked && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <AlertCircle size={15} className="text-red-400 shrink-0" />
            <p className="text-sm text-red-400">
              This certificate has been revoked because all units were sold.
            </p>
          </div>
        )}

        {/* ── Certificate card ── */}
        <div className="rounded-3xl border border-white/[0.09] overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(200,135,58,0.07) 0%, rgba(13,31,26,0.0) 50%)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(200,135,58,0.12)",
          }}>

          {/* ── Header ── */}
          <div className="relative px-8 pt-10 pb-8 text-center border-b border-white/[0.06]"
            style={{ background: "rgba(0,0,0,0.15)" }}>

            <div className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: "linear-gradient(90deg, transparent, #C8873A 30%, #E8A850 50%, #C8873A 70%, transparent)" }} />

            <div className="flex justify-center mb-5">
              <Seal size={88} />
            </div>

            <p className="text-[10px] font-black tracking-[0.35em] text-amber-500/60 mb-3">
              {appname.toUpperCase()} 
            </p>

            <h1 className="text-2xl font-bold text-white mb-1"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Certificate of Investment
            </h1>

            <p className="text-xs text-white/30 tracking-wider">
              FRACTIONAL LAND INVESTMENT · VERIFIED DIGITAL CERTIFICATE
            </p>

            {/* Status badge */}
            {cert.status === "active" ? (
              <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 size={11} className="text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-400 tracking-wider">ACTIVE · VERIFIED</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                <AlertCircle size={11} className="text-red-400" />
                <span className="text-[10px] font-black text-red-400 tracking-wider">REVOKED</span>
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="px-8 py-8">

            <div className="text-center mb-8">
              <p className="text-xs text-white/30 italic mb-3">This is to certify that</p>

              <p className="text-3xl font-bold text-amber-400 mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {cert.owner_name}
              </p>

              <p className="text-xs text-white/30 italic mb-3">
                {isRevoked ? "was the registered holder of" : "is the registered holder of"}
              </p>

              <p className="text-5xl font-bold text-white mb-3"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {Number(cert.units).toLocaleString()}
              </p>
              <p className="text-xs font-black tracking-[0.25em] text-white/40">UNITS</p>

              <p className="text-xs text-white/30 italic mt-4 mb-1">in</p>

              <p className="text-lg font-bold text-amber-400/90">{cert.property_title}</p>
              <p className="text-xs text-white/30 mt-1 flex items-center justify-center gap-1">
                <MapPin size={10} /> {cert.property_location}
              </p>
            </div>

            <div className="h-px mb-8"
              style={{ background: "linear-gradient(90deg, transparent, rgba(200,135,58,0.3), transparent)" }} />

            <div className="space-y-0 mb-8">
              <DetailRow label="Certificate No."   value={cert.cert_number}         mono />
              <DetailRow label="Land Reference"    value={cert.plot_identifier}      />
              <DetailRow label="Tenure"            value={cert.tenure}               />
              <DetailRow label="Purchase Ref"      value={cert.purchase_reference}   mono />
              <DetailRow label="Total Invested"    value={fmtNaira(cert.total_invested)} highlight />
              <DetailRow label="Issue Date"        value={fmtDate(cert.issued_at)}   />
              <DetailRow label="LGA"               value={cert.lga}                  />
              <DetailRow label="State"             value={cert.state}                />
            </div>

            <div className="h-px mb-8"
              style={{ background: "linear-gradient(90deg, transparent, rgba(200,135,58,0.2), transparent)" }} />

            {/* Digital signature */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={14} className="text-amber-500/70" />
                <span className="text-[10px] font-black tracking-[0.2em] text-white/35 uppercase">
                  Digital Signature
                </span>
              </div>
              <p className="font-mono text-[10px] text-white/30 break-all leading-relaxed">
                {cert.digital_signature}
              </p>
            </div>

            {/* Verify link — only meaningful when active */}
            {!isRevoked && (
              <Link
                href={`/verify/${cert.cert_number}`}
                target="_blank"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-xs font-bold border border-amber-500/20 text-amber-500/70 hover:bg-amber-500/5 hover:text-amber-400 hover:border-amber-500/35 transition-all"
              >
                <ExternalLink size={12} />
                Verify this certificate publicly
              </Link>
            )}
          </div>

          {/* ── Footer ── */}
          <div className="px-8 py-5 border-t border-white/[0.05] text-center"
            style={{ background: "rgba(0,0,0,0.1)" }}>
            <p className="text-[9px] text-white/20 leading-relaxed">
              This certificate is digitally issued and verifiable at {appname}/verify
              <br />
              {appname} · info@{appname.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Download CTA below card — only when active */}
        {!isRevoked && (
          <div className="mt-6 text-center">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
            >
              {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              {downloading ? "Preparing PDF…" : "Download PDF Certificate"}
            </button>
            <p className="text-xs text-white/20 mt-2">
              A print-quality PDF reflecting your current holdings will be downloaded.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
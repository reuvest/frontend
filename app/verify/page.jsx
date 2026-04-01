"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "../../utils/api";
import {
  ShieldCheck, ShieldX, MapPin, CheckCircle2,
  Loader2, RefreshCw, Search, X, ArrowRight,
} from "lucide-react";

/* ─── Helpers ───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-NG", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "—";

const fmtNaira = (v) =>
  v != null
    ? `₦${Number(v).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
    : null;

/* ─── Certificate number formatter ─────────────────────────────────────── */
// Normalises input to CERT-YYYY-L0000-00000 as the user types
function normaliseCertNumber(raw) {
  // Strip everything that isn't alphanumeric or hyphen, uppercase
  return raw.replace(/[^A-Z0-9\-]/gi, "").toUpperCase();
}

/* ─── Result card ───────────────────────────────────────────────────────── */
function ResultCard({ result, onReset }) {
  const valid = result.valid;
  const d     = result.data;

  const wasUpdated =
    d?.last_updated_at &&
    d?.issued_at &&
    new Date(d.last_updated_at).getTime() !== new Date(d.issued_at).getTime();

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-all duration-500"
      style={{
        borderColor: valid ? "rgba(52,211,153,0.25)" : "rgba(239,68,68,0.25)",
        background: valid
          ? "linear-gradient(160deg, rgba(52,211,153,0.06) 0%, rgba(13,31,26,0) 60%)"
          : "linear-gradient(160deg, rgba(239,68,68,0.06) 0%, rgba(13,31,26,0) 60%)",
      }}
    >
      {/* Status header */}
      <div
        className="px-6 pt-6 pb-5 text-center border-b"
        style={{
          borderColor: valid ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)",
          background: "rgba(0,0,0,0.12)",
        }}
      >
        <div className="flex justify-center mb-4">
          {valid
            ? <ShieldCheck size={48} className="text-emerald-400" strokeWidth={1.5} />
            : <ShieldX     size={48} className="text-red-400"     strokeWidth={1.5} />}
        </div>

        <h2
          className="text-xl font-bold mb-1"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            color: valid ? "#34d399" : "#f87171",
          }}
        >
          {valid ? "Certificate Verified" : "Certificate Invalid"}
        </h2>

        <p className="text-xs text-white/30 leading-relaxed">
          {valid
            ? "This certificate number is authentic and its digital signature matches our records."
            : "No active certificate found for this number, or the record has been tampered with."}
        </p>
      </div>

      {/* Details */}
      {valid && d && (
        <div className="px-6 py-5 space-y-0">

          {/* Updated notice */}
          {wasUpdated && (
            <div className="flex items-start gap-2.5 mb-4 px-3 py-2.5 rounded-xl border border-amber-500/15 bg-amber-500/5">
              <RefreshCw size={12} className="text-amber-400/60 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-400/70 leading-relaxed">
                This certificate has been updated to reflect the holder's current unit balance.
                Originally issued {fmtDate(d.issued_at)}.
              </p>
            </div>
          )}

          {/* Owner */}
          <div className="text-center mb-5 pb-5 border-b border-white/[0.05]">
            <p className="text-xs text-white/30 italic mb-2">Issued to</p>
            <p
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {d.owner_name}
            </p>
          </div>

          {/* Data rows */}
          {[
            ["Certificate No.",    d.cert_number,                                            true],
            ["Property",          d.property_title,                                          false],
            ["Location",          d.property_location,                                       false],
            ["Current Units",     `${Number(d.units).toLocaleString()} units`,               false],
            ["Total Invested",    fmtNaira(d.total_invested),                                false],
            ["Originally Issued", fmtDate(d.issued_at),                                      false],
            wasUpdated ? ["Last Updated", fmtDate(d.last_updated_at), false] : null,
            ["Status",            d.status?.toUpperCase(),                                   false],
          ]
            .filter(Boolean)
            .map(([label, value, mono]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30 shrink-0 w-36 mt-0.5">
                  {label}
                </span>
                <span className={`text-sm text-right break-all ${
                  mono ? "font-mono text-white/40 text-xs" : "text-white/75"
                }`}>
                  {value ?? "—"}
                </span>
              </div>
            ))}

          {/* Verified badge */}
          <div className="flex items-center gap-2 pt-3">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-400/70">
              Digital signature verified · Issued by SproutVest Technologies Ltd
            </p>
          </div>
        </div>
      )}

      {/* Try another */}
      <div className="px-6 py-4 border-t border-white/[0.05]" style={{ background: "rgba(0,0,0,0.1)" }}>
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border border-white/10 text-white/40 hover:bg-white/5 hover:text-white/60 transition-all"
        >
          <Search size={12} /> Verify another certificate
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────── */
export default function VerifyPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const inputRef     = useRef(null);

  // Support both /verify/CERT-... (QR scan) and /verify?code=CERT-... (manual)
  const prefilledCode =
    params?.certNumber ||
    searchParams?.get("code") ||
    "";

  const [code, setCode]       = useState(normaliseCertNumber(prefilledCode));
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // Auto-verify if a code arrived via URL (QR scan)
  useEffect(() => {
    if (prefilledCode) {
      verify(normaliseCertNumber(prefilledCode));
    } else {
      // Focus the input on fresh page load
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(certNumber = code) {
    const trimmed = certNumber.trim();
    if (!trimmed) { setError("Please enter a certificate number."); return; }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await api.get(`/verify/${trimmed}`);
      setResult({ valid: true, data: res.data.data });
    } catch (err) {
      if (err.response?.status === 404) {
        setResult({ valid: false, data: null });
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setCode("");
    setResult(null);
    setError("");
    // Clear URL param if set
    router.replace("/verify");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") verify();
  }

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] flex flex-col items-center justify-start px-4 py-12"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(200,135,58,0.07) 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <Link href="/">
            <p className="text-[10px] font-black tracking-[0.35em] text-amber-500/50 hover:text-amber-500/70 transition-colors">
              SPROUTVEST
            </p>
          </Link>
          <h1
            className="text-2xl font-bold text-white mt-3 mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Certificate Verification
          </h1>
          <p className="text-xs text-white/30 leading-relaxed">
            Enter a SproutVest certificate number to verify its authenticity
            and check the current holder's details.
          </p>
        </div>

        {/* ── Input form (hidden once result is shown) ── */}
        {!result && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 mb-5">

            <label className="block text-[10px] font-black uppercase tracking-[0.22em] text-white/35 mb-2">
              Certificate Number
            </label>

            <div className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(normaliseCertNumber(e.target.value));
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="CERT-2025-L0001-00001"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/15 text-white placeholder-white/15 px-4 py-3 pr-10 rounded-xl text-sm font-mono tracking-wider outline-none transition-all"
                />
                {code && (
                  <button
                    type="button"
                    onClick={() => { setCode(""); setError(""); inputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <button
                onClick={() => verify()}
                disabled={loading || !code.trim()}
                className="shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
              >
                {loading
                  ? <Loader2 size={15} className="animate-spin" />
                  : <ArrowRight size={15} />}
              </button>
            </div>

            {/* Format hint */}
            <p className="text-[10px] text-white/20 mt-2">
              Format: CERT-YYYY-L0000-00000 · Found on your certificate PDF or in-app viewer
            </p>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 mt-3 flex items-center gap-1.5">
                <ShieldX size={12} /> {error}
              </p>
            )}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div className="text-center py-8">
            <Loader2 size={28} className="text-amber-500/50 animate-spin mx-auto mb-3" />
            <p className="text-white/30 text-xs tracking-widest uppercase">Verifying…</p>
          </div>
        )}

        {/* ── Result ── */}
        {result && !loading && (
          <ResultCard result={result} onReset={handleReset} />
        )}

        {/* Footer */}
        <p className="text-center text-[10px] text-white/15 mt-8 leading-relaxed">
          SproutVest Technologies Ltd · sproutvest.com · info@sproutvest.com
          <br />
          Certificate verification is publicly accessible and does not require an account.
        </p>

      </div>
    </div>
  );
}
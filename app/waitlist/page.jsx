"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle, MapPin, TrendingUp,
  Users, Shield, BadgeCheck, Star, ChevronRight,
  Sparkles, Lock, Search, X, TrendingDown,
} from "lucide-react";
import { getSavedReferralCode } from "../components/RefCapture";

// ── Config ────────────────────────────────────────────────────────────────────
const appname  = process.env.NEXT_PUBLIC_APP_NAME  || "REU.ng";
const API_URL  = process.env.NEXT_PUBLIC_API_URL   || "https://api.reu.ng";

const BUDGET_OPTIONS = [
  { value: "5k_50k",    label: "₦5,000 – ₦50,000"   },
  { value: "50k_500k",  label: "₦50,000 – ₦500,000" },
  { value: "500k_plus", label: "₦500,000+"           },
];

const CITY_OPTIONS = [
  { value: "ogun",   label: "Ogun"   },
  { value: "oyo",    label: "Oyo"    },
  { value: "abuja",  label: "Abuja"  },
  { value: "other",  label: "Other"  },
];

const STATS = [
  { value: "3",      label: "Cities covered"          },
  { value: "10–20%", label: "Projected annual ROI"    },
  { value: "₦5k",   label: "Minimum investment"      },
];

const PERKS = [
  { icon: <Star size={15} />,       text: "Founding investor badge on your profile"            },
  { icon: <Lock size={15} />,       text: "Locked-in entry pricing before public launch"      },
  { icon: <Sparkles size={15} />,   text: "10% discount on your first investment" },
];

// ── Animated counter ──────────────────────────────────────────────────────────
function useCountUp(target, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count;
}

// ── Waitlist count display ────────────────────────────────────────────────────
// function WaitlistCount({ count }) {
//   const displayed = useCountUp(count);
//   return (
//     <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-bold mb-6">
//       <Sparkles size={13} />
//       {displayed.toLocaleString()}+ investors already waiting
//     </div>
//   );
// }

// ── Avatar stack ──────────────────────────────────────────────────────────────
function AvatarStack() {
  const colors = ["#C8873A", "#2D7A55", "#8B5CF6", "#E8A850", "#06B6D4"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {colors.map((c, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 border-[#0D1F1A] flex items-center justify-center text-xs font-bold text-[#0D1F1A]"
            style={{ background: `linear-gradient(135deg, ${c}, ${c}cc)`, zIndex: colors.length - i }}
          >
            {["T", "F", "A", "C", "B"][i]}
          </div>
        ))}
      </div>
      <p className="text-xs text-white/40">Join smart investors securing their future</p>
    </div>
  );
}

// ── Check position panel ──────────────────────────────────────────────────────
function CheckPositionPanel({ onClose }) {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [result, setResult]     = useState(null);
  const [copied, setCopied]     = useState(false);

  const handleCheck = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/waitlist/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "We couldn't find that email on the waitlist.");
        return;
      }
      setResult(data.data ?? data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.referral_code) return;
    const link = `${window.location.origin}/waitlist?ref=${result.referral_code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const reset = () => { setResult(null); setEmail(""); setError(""); };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(200,135,58,0.12)", boxShadow: "0 0 0 1px rgba(200,135,58,0.22)" }}>
            <Search size={13} className="text-amber-500" />
          </div>
          <p className="text-sm font-bold text-white">Check your position</p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-5">
        {/* Result view */}
        {result ? (
          <div className="space-y-4">

            {/* Invited banner — shown only when admin has sent invite */}
            {result.invited && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-400">Your invite is ready!</p>
                  <p className="text-xs text-emerald-300/60 mt-0.5 leading-relaxed">
                    We sent your early-access link to your email. Check your inbox (and spam folder).
                  </p>
                </div>
              </div>
            )}

            {/* Still waiting banner */}
            {!result.invited && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
                <Sparkles size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white/80">Still on the list</p>
                  <p className="text-xs text-white/35 mt-0.5 leading-relaxed">
                    Access opens in batches. Refer friends below to move up and get in sooner.
                  </p>
                </div>
              </div>
            )}

            {/* Position badge */}
            <div className="text-center py-2">
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                Your position
              </p>
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border mb-2"
                style={
                  result.invited
                    ? { borderColor: "rgba(74,222,128,0.3)", background: "rgba(74,222,128,0.08)" }
                    : { borderColor: "rgba(200,135,58,0.3)", background: "rgba(200,135,58,0.08)" }
                }
              >
                {result.invited
                  ? <CheckCircle size={14} className="text-emerald-400" />
                  : <Sparkles size={14} className="text-amber-400" />}
                <span
                  className="text-3xl font-bold"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    color: result.invited ? "#4ade80" : "#E8A850",
                  }}
                >
                  #{result.position?.toLocaleString() ?? "—"}
                </span>
              </div>
              {result.name && (
                <p className="text-sm text-white/50">
                  Welcome back,{" "}
                  <span className="text-white/80 font-semibold">
                    {result.name.split(" ")[0]}
                  </span>
                </p>
              )}
            </div>

            {/* Referral progress */}
            {result.referral_code && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/30">
                    Referrals
                  </p>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    {result.referrals_count ?? 0} joined
                  </span>
                </div>

                {/* Progress bar — 3 referrals = priority access */}
                <div>
                  <div className="flex justify-between text-[10px] text-white/25 mb-1.5">
                    <span>Priority access at 3 referrals</span>
                    <span>{Math.min(result.referrals_count ?? 0, 3)}/3</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min(((result.referrals_count ?? 0) / 3) * 100, 100)}%`,
                        background: "linear-gradient(90deg, #C8873A, #E8A850)",
                      }}
                    />
                  </div>
                  {(result.referrals_count ?? 0) >= 3 && (
                    <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                      <CheckCircle size={10} /> Priority access unlocked!
                    </p>
                  )}
                </div>

                {/* Referral link */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[11px] text-white/40 font-mono truncate">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/waitlist?ref=${result.referral_code}`
                      : `...?ref=${result.referral_code}`}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 px-3 py-2 rounded-xl text-xs font-bold text-[#0D1F1A] transition-all hover:scale-105 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
                  >
                    {copied ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/30 border border-white/10 hover:border-white/20 hover:text-white/60 transition-all"
            >
              Check a different email
            </button>
          </div>
        ) : (
          /* Lookup form */
          <form onSubmit={handleCheck} className="space-y-3" noValidate>
            <p className="text-xs text-white/40 leading-relaxed">
              Enter the email you used to join and we'll show your position and referral link.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              className={`w-full bg-white/5 border text-white placeholder-white/20 px-4 py-3 rounded-xl text-sm outline-none transition-all ${
                error
                  ? "border-red-500/50"
                  : "border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
              }`}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-[#0D1F1A]/30 border-t-[#0D1F1A] rounded-full animate-spin" />
                : <><Search size={14} /> Check my position</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function WaitlistPage() {
  const [form, setForm]       = useState({ name: "", email: "", budget: "", city: "" });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refCode, setRefCode] = useState(null);
  const [position, setPosition] = useState(null);
  const [userRefCode, setUserRefCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  // Read saved referral code on mount
  useEffect(() => {
    const saved = getSavedReferralCode();
    if (saved) setRefCode(saved);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name   = "Name is required";
    if (!form.email.trim()) e.email  = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.budget)       e.budget = "Please select a budget range";
    if (!form.city)         e.city   = "Please select your city";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, referral_code: refCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle validation errors from backend
        if (data.errors) {
          const mapped = {};
          Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v; });
          setErrors(mapped);
        } else {
          setErrors({ global: data.message || "Something went wrong. Please try again." });
        }
        return;
      }

      setPosition(data.data?.position   ?? data.position   ?? null);
      setUserRefCode(data.data?.referral_code ?? data.referral_code ?? null);
      setSuccess(true);
    } catch {
      setErrors({ global: "Network error. Please check your connection and try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const link = `${window.location.origin}?ref=${userRefCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <main
        className="min-h-screen bg-[#0D1F1A] flex items-center justify-center px-5 py-16"
        style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
      >
        {/* Background glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="relative z-10 max-w-lg w-full text-center">
          {/* Animated checkmark */}
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2D7A55, #22c55e)" }}>
            <CheckCircle size={36} className="text-white" />
          </div>

          <h1
            className="text-4xl font-bold text-white mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            You're on the list!
          </h1>

          {position && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm font-bold mb-4">
              <Sparkles size={13} />
              You're #{position.toLocaleString()} in line
            </div>
          )}

          <p className="text-white/50 mb-8 leading-relaxed max-w-sm mx-auto">
            We'll email you as soon as early access opens. Refer friends to move up the list faster.
          </p>

          {/* Referral share card */}
          {userRefCode && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6 text-left">
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                Your referral link — move up faster
              </p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white/50 font-mono truncate">
                  {typeof window !== "undefined" ? `${window.location.origin}?ref=${userRefCode}` : `...?ref=${userRefCode}`}
                </div>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0D1F1A] transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-white/25 mt-2 flex items-center gap-1.5">
                <Users size={11} />
                Each referral who joins bumps you further up the list
              </p>
            </div>
          )}

          {/* What's next */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6 text-left space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/30">What happens next</p>
            {[
              "We'll email you market insights while you wait",
              "Early-access invite sent by batch when we launch",
              "Founding investors get locked-in pricing",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-[#0D1F1A]"
                  style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}>
                  {i + 1}
                </div>
                <p className="text-sm text-white/60">{step}</p>
              </div>
            ))}
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            ← Back to homepage
          </Link>
        </div>
      </main>
    );
  }

  // ── Main waitlist form ──────────────────────────────────────────────────────
  return (
    <main
      className="min-h-screen bg-[#0D1F1A]"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 py-16 sm:py-24">

        {/* Two-column layout on desktop */}
        <div className="grid lg:grid-cols-[1fr_440px] gap-12 lg:gap-20 items-start">

          {/* ── Left column — value prop ──────────────────────────────────── */}
          <div>
            {/* <WaitlistCount count={1247} /> */}

            <h1
              className="font-bold text-white leading-[1.06] tracking-tight mb-5"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.2rem, 6vw, 4rem)",
              }}
            >
              Be First to Own Units in
              <br />
              <span style={{ color: "#C8873A" }}>Verified Nigerian Land.</span>
            </h1>

            <p
              className="text-white/50 mb-8 leading-relaxed max-w-lg"
              style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)" }}
            >
              {appname} opens to the public soon. Join the waitlist now and
              get founding investor access — before everyone else, at locked-in pricing.
            </p>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {STATS.map((s) => (
                <div key={s.label} className="text-center p-3 rounded-2xl bg-white/5 border border-white/10">
                  <p
                    className="text-xl font-bold text-amber-400 mb-0.5"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Perks */}
            <div className="space-y-3 mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">
                Founding investor perks
              </p>
              {PERKS.map((p) => (
                <div key={p.text} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-amber-500"
                    style={{ background: "rgba(200,135,58,0.12)" }}
                  >
                    {p.icon}
                  </div>
                  <p className="text-sm text-white/65">{p.text}</p>
                </div>
              ))}
            </div>

            {/* City coverage */}
            <div className="flex flex-wrap gap-2 mb-8">
              {["Ogun", "Oyo (Ibadan)", "Abuja"].map((city) => (
                <span key={city}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-white/10 bg-white/5 text-white/50">
                  <MapPin size={10} className="text-amber-500" />
                  {city}
                </span>
              ))}
            </div>

          </div>

          {/* ── Right column — form ───────────────────────────────────────── */}
          <div
            className="rounded-3xl p-6 sm:p-8 border border-white/10 sticky top-8"
            style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(12px)" }}
          >
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold mb-3">
                <BadgeCheck size={11} />
                Completely free to join
              </div>
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Reserve your spot
              </h2>
              <p className="text-sm text-white/40 mt-1">
                Takes 30 seconds. No credit card required.
              </p>
            </div>

            {/* Already joined? toggle */}
            {!showCheck && (
              <button
                onClick={() => setShowCheck(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-white/10 bg-white/5 text-white/40 hover:border-amber-500/30 hover:text-amber-400 hover:bg-amber-500/8 transition-all mb-5"
              >
                <Search size={12} />
                Already joined? Check your position
              </button>
            )}

            {/* Check position panel — shown inline */}
            {showCheck && (
              <div className="mb-5">
                <CheckPositionPanel onClose={() => setShowCheck(false)} />
              </div>
            )}

            {errors.global && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {errors.global}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  className={`w-full bg-white/5 border text-white placeholder-white/20 px-4 py-3.5 rounded-xl text-sm outline-none transition-all ${
                    errors.name
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className={`w-full bg-white/5 border text-white placeholder-white/20 px-4 py-3.5 rounded-xl text-sm outline-none transition-all ${
                    errors.email
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Budget */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                  Investment Budget
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, budget: opt.value })}
                      className={`py-3 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        form.budget === opt.value
                          ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                          : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.budget && <p className="text-red-400 text-xs mt-1">{errors.budget}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-white/30 mb-2">
                  Preferred City
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, city: opt.value })}
                      className={`py-3 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                        form.city === opt.value
                          ? "border-amber-500/60 bg-amber-500/15 text-amber-400"
                          : "border-white/10 bg-white/5 text-white/40 hover:border-white/20 hover:text-white/70"
                      }`}
                    >
                      <MapPin size={10} className={form.city === opt.value ? "text-amber-500" : "text-white/20"} />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              {/* Referral code display (auto-populated) */}
              {refCode && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 text-emerald-400 text-xs">
                  <CheckCircle size={11} />
                  Referred by a friend — you'll get priority placement
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-[#0D1F1A]/30 border-t-[#0D1F1A] rounded-full animate-spin" />
                ) : (
                  <>
                    Join the Waitlist
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-xs text-white/20 text-center leading-relaxed">
                No spam. Unsubscribe any time. We only email when it matters.
              </p>
            </form>

            {/* Bottom avatar */}
            <div className="mt-5 pt-5 border-t border-white/8">
              <AvatarStack />
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="mt-16 sm:mt-24 pt-8 border-t border-white/8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-4 text-xs text-white/20">
            {[
              [CheckCircle, "Verified land titles"],
              [Shield, "Secure payments"],
              [BadgeCheck, "Legal compliance"],
            ].map(([Icon, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={11} className="text-emerald-400" /> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
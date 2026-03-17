"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, User, ArrowRight,
  Gift, CheckCircle, AlertCircle,
} from "lucide-react";
import api from "../../utils/api";

const appname = process.env.NEXT_PUBLIC_APP_NAME || "Sproutvest";

// ── Referral localStorage helpers ────────────────────────────────────────────

function getSavedReferralCode() {
  try {
    const raw = localStorage.getItem("referral_code");
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() > expires) { localStorage.removeItem("referral_code"); return null; }
    return code ?? null;
  } catch { return null; }
}

function clearSavedReferralCode() {
  try { localStorage.removeItem("referral_code"); } catch {}
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function Register() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

// ── Form ──────────────────────────────────────────────────────────────────────

function RegisterForm() {
  const [form, setForm] = useState({
    first_name:            "",
    last_name:             "",
    email:                 "",
    password:              "",
    password_confirmation: "",
    referral_code:         "",
  });

  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [pwFocused, setPwFocused]           = useState(false);
  const [showReferral, setShowReferral]     = useState(false);
  const [referralLocked, setReferralLocked] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const saved = getSavedReferralCode();
    if (saved) {
      setForm((prev) => ({ ...prev, referral_code: saved }));
      setShowReferral(true);
      setReferralLocked(true);
    }
  }, []);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  // ── Password strength ──────────────────────────────────────────────────────

  const passwordChecks = [
    { test: /.{8,}/,      label: "At least 8 characters" },
    { test: /[A-Z]/,      label: "One uppercase letter"  },
    { test: /[a-z]/,      label: "One lowercase letter"  },
    { test: /\d/,         label: "One number"            },
    { test: /[@$!%*?&#]/, label: "One special character" },
  ];

  const passedChecks   = passwordChecks.filter((c) => c.test.test(form.password)).length;
  const strengthColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
  const strengthText   = ["Too weak", "Weak", "Fair", "Good", "Strong"];

  const passwordsMatch     = form.password && form.password_confirmation && form.password === form.password_confirmation;
  const passwordsDontMatch = form.password_confirmation && !passwordsMatch;

  const isFormValid =
    form.first_name.trim() &&
    form.last_name.trim()  &&
    form.email.trim()      &&
    passedChecks === passwordChecks.length &&
    passwordsMatch;

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      name:                  `${form.first_name.trim()} ${form.last_name.trim()}`,
      email:                 form.email,
      password:              form.password,
      password_confirmation: form.password_confirmation,
    };

    const code = form.referral_code.trim();
    if (code) payload.referral_code = code;

    try {
      await api.post("/register", payload);
      clearSavedReferralCode();
      toast.success("Account created! Please verify your email.");
      localStorage.setItem("pending_email", form.email);
      router.push("/verify-email");
    } catch (err) {
      if (err.response?.status === 422) {
        const errors = err.response.data?.errors;
        setError(errors ? Object.values(errors).flat().join(" · ") : "Validation failed. Please check your input.");
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Shared input class ─────────────────────────────────────────────────────

  const inputCls = (extra = "") =>
    `w-full bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/20
     py-3.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${extra}`;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Background glows */}
      <div className="absolute top-[-15%] right-[-10%] w-[55vw] h-[55vw] rounded-full opacity-20 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
      <div className="absolute bottom-[-15%] left-[-10%] w-[45vw] h-[45vw] rounded-full opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-white inline-block"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {appname.slice(0, -4)}
              <span style={{ color: "#C8873A" }}>{appname.slice(-4)}</span>
            </h1>
          </Link>
          <p className="text-white/40 mt-2 text-sm">Start building your land portfolio today</p>
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {["Verified Platform", "Secure Payments", "10K+ Investors"].map((badge) => (
            <div key={badge} className="flex items-center gap-1.5 text-xs text-white/30">
              <CheckCircle size={11} className="text-emerald-500" />
              <span>{badge}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">

          <h2 className="text-2xl font-bold text-white mb-1"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Create Account
          </h2>
          <p className="text-white/40 text-sm mb-8">Join thousands of smart Nigerian investors</p>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-start gap-2.5"
              >
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── First & Last name ── */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                  <input
                    name="first_name" value={form.first_name} onChange={set("first_name")}
                    placeholder="John" autoComplete="given-name"
                    className={inputCls("pl-10 pr-3")}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
                  <input
                    name="last_name" value={form.last_name} onChange={set("last_name")}
                    placeholder="Doe" autoComplete="family-name"
                    className={inputCls("pl-10 pr-3")}
                    required
                  />
                </div>
              </div>
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  name="email" value={form.email} onChange={set("email")}
                  placeholder="you@example.com" type="email" autoComplete="email"
                  className={inputCls("pl-11 pr-4")}
                  required
                />
              </div>
            </div>

            {/* ── Password ── */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  name="password" value={form.password} onChange={set("password")}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  onFocus={() => setPwFocused(true)}
                  onBlur={() => setPwFocused(false)}
                  className={inputCls("pl-11 pr-12")}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1.5">
                    {passwordChecks.map((_, i) => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: i < passedChecks ? strengthColors[passedChecks - 1] : "rgba(255,255,255,0.1)" }} />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: passedChecks > 0 ? strengthColors[passedChecks - 1] : "rgba(255,255,255,0.3)" }}>
                    {strengthText[passedChecks - 1] || "Enter a password"}
                  </p>
                </div>
              )}

              {/* Rules checklist */}
              <AnimatePresence>
                {form.password && pwFocused && (
                  <motion.ul
                    className="mt-3 space-y-1.5 bg-white/5 border border-white/10 rounded-xl p-3"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {passwordChecks.map((check, i) => {
                      const passed = check.test.test(form.password);
                      return (
                        <li key={i} className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-emerald-400" : "text-white/30"}`}>
                          <span className="w-3 text-center">{passed ? "✓" : "○"}</span>
                          <span>{check.label}</span>
                        </li>
                      );
                    })}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* ── Confirm Password ── */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={set("password_confirmation")}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  className={inputCls(`pl-11 pr-12 ${passwordsDontMatch ? "border-red-500/50!" : ""}`)}
                  required
                />
                {passwordsMatch && (
                  <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                )}
              </div>
              {passwordsDontMatch && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* ── Referral Code ── */}
            <div>
              {!showReferral ? (
                <button
                  type="button"
                  onClick={() => setShowReferral(true)}
                  className="flex items-center gap-1.5 text-xs text-amber-500/70 hover:text-amber-400 transition-colors"
                >
                  <Gift size={13} />
                  Have a referral code?
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">
                    Referral Code{" "}
                    <span className="normal-case font-normal text-white/25">(optional)</span>
                  </label>
                  <div className="relative">
                    <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                      name="referral_code"
                      value={form.referral_code}
                      onChange={set("referral_code")}
                      placeholder="e.g. ABC12345"
                      autoComplete="off"
                      readOnly={referralLocked}
                      className={inputCls(
                        `pl-11 pr-28 uppercase tracking-widest
                         ${referralLocked ? "border-emerald-500/40! text-emerald-300 cursor-default" : ""}`
                      )}
                      maxLength={12}
                    />
                    {referralLocked && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          Applied ✓
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            clearSavedReferralCode();
                            setForm((prev) => ({ ...prev, referral_code: "" }));
                            setReferralLocked(false);
                          }}
                          className="text-white/25 hover:text-white/50 text-[10px] transition-colors ml-1"
                          title="Remove referral code"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {referralLocked ? (
                    <p className="text-[11px] text-emerald-500/60 mt-1.5">
                      You were referred by a friend — enjoy your welcome bonus!
                    </p>
                  ) : (
                    <p className="text-xs text-white/25 mt-1.5">Get 10% off your first purchase</p>
                  )}
                </motion.div>
              )}
            </div>

            {/* ── Submit ── */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full py-4 rounded-xl font-bold text-[#0D1F1A] flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <><span>Create Account</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/20 text-xs">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <p className="text-center text-sm text-white/40">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-white/20 mt-6 px-4">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-white/40 transition-colors">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="underline hover:text-white/40 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
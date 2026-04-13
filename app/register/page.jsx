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

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";

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

export default function Register() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

const PASSWORD_CHECKS = [
  { test: /.{8,}/,      label: "At least 8 characters"  },
  { test: /[A-Z]/,      label: "One uppercase letter"    },
  { test: /[a-z]/,      label: "One lowercase letter"    },
  { test: /\d/,         label: "One number"              },
  { test: /[@$!%*?&#]/, label: "One special character"   },
];

const STRENGTH_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];
const STRENGTH_LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];

function Field({ label, hint, children, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index, ease: [0.22, 1, 0.36, 1] }}
    >
      {label && (
        <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-2">
          {label}
          {hint && <span className="normal-case font-normal text-white/20 ml-1">{hint}</span>}
        </label>
      )}
      {children}
    </motion.div>
  );
}

const inputBase =
  "w-full bg-[#0a1a14] border text-white placeholder-white/15 py-3.5 rounded-2xl text-sm " +
  "focus:outline-none transition-all duration-200";

function inputCls(extra = "", state = "default") {
  const borders = {
    default: "border-white/8 hover:border-white/18 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/15",
    error:   "border-red-500/40 focus:border-red-500/60 focus:ring-2 focus:ring-red-500/10",
    success: "border-emerald-500/40 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10",
  };
  return `${inputBase} ${borders[state]} ${extra}`;
}

/* ── Eye toggle button — always visible regardless of input content ── */
function EyeToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
      style={{ background: "#0a1a14", color: "rgba(255,255,255,0.35)" }}
      onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
      tabIndex={-1}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );
}

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
  const [step, setStep]                     = useState(1);

  const router = useRouter();

  useEffect(() => {
    const saved = getSavedReferralCode();
    if (saved) {
      setForm(prev => ({ ...prev, referral_code: saved }));
      setShowReferral(true);
      setReferralLocked(true);
    }
  }, []);

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError("");
  };

  const passedChecks       = PASSWORD_CHECKS.filter(c => c.test.test(form.password)).length;
  const passwordsMatch     = form.password && form.password_confirmation && form.password === form.password_confirmation;
  const passwordsDontMatch = form.password_confirmation && !passwordsMatch;

  const step1Valid  = form.first_name.trim() && form.last_name.trim() && form.email.trim();
  const step2Valid  = passedChecks === PASSWORD_CHECKS.length && passwordsMatch;
  const isFormValid = step1Valid && step2Valid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError("");
    setLoading(true);

    const payload = {
      name:                  `${form.first_name.trim()} ${form.last_name.trim()}`,
      email:                 form.email.trim(),
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
        setError(errors
          ? Object.values(errors).flat().join(" · ")
          : "Validation failed. Please check your input.");
      } else {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          "Registration failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#071410] flex items-stretch relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a1f17]" />
        <div className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(circle at 30% 40%, rgba(200,135,58,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(45,122,85,0.18) 0%, transparent 55%)" }} />
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="absolute -bottom-24 -left-24 w-[480px] h-[480px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 65%)" }} />
        <div className="absolute -top-16 right-0 w-[320px] h-[320px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 65%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)", color: "#071410" }}>
              R
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {APP_NAME}
            </span>
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] mb-6"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Build real<br />
            <span style={{ color: "#C8873A" }}>wealth</span> in<br />
            Nigerian land.
          </h2>
          <p className="text-white/40 text-sm leading-relaxed max-w-xs">
            Invest in fully verified land plots across Nigeria — starting from just ₦5,000.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-5 py-12 relative">
        <div className="absolute inset-0 pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 w-[60vw] h-[60vw] rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] rounded-full opacity-8"
            style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 w-full max-w-[440px]">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)", color: "#071410" }}>
              S
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              {APP_NAME}
            </span>
          </div>

          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1.5" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Create account
            </h1>
            <p className="text-white/35 text-sm">Start your investment journey today</p>
          </motion.div>

          {/* Step indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300"
                  style={{
                    background: step >= s ? "linear-gradient(135deg,#C8873A,#E8A850)" : "rgba(255,255,255,0.06)",
                    color: step >= s ? "#071410" : "rgba(255,255,255,0.25)",
                  }}
                >
                  {step > s ? "✓" : s}
                </div>
                <span className="text-xs transition-colors"
                  style={{ color: step >= s ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)" }}>
                  {s === 1 ? "Your details" : "Set password"}
                </span>
                {s < 2 && (
                  <div className="w-8 h-px mx-1 transition-all duration-300"
                    style={{ background: step > s ? "#C8873A" : "rgba(255,255,255,0.1)" }} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                className="mb-6 p-3.5 rounded-2xl border border-red-500/25 bg-red-500/8 flex items-start gap-2.5"
              >
                <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">

              {/* Step 1 */}
              {step === 1 && (
                <motion.div key="step1"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name" index={0}>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input value={form.first_name} onChange={set("first_name")}
                          placeholder="John" autoComplete="given-name"
                          className={inputCls("pl-9 pr-3", form.first_name ? "success" : "default")} required />
                      </div>
                    </Field>
                    <Field label="Last name" index={1}>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20" size={14} />
                        <input value={form.last_name} onChange={set("last_name")}
                          placeholder="Doe" autoComplete="family-name"
                          className={inputCls("pl-9 pr-3", form.last_name ? "success" : "default")} required />
                      </div>
                    </Field>
                  </div>

                  <Field label="Email address" index={2}>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                      <input value={form.email} onChange={set("email")}
                        placeholder="you@example.com" type="email" autoComplete="email"
                        className={inputCls("pl-11 pr-4", form.email ? "success" : "default")} required />
                    </div>
                  </Field>

                  <Field index={3}>
                    {!showReferral ? (
                      <button type="button" onClick={() => setShowReferral(true)}
                        className="flex items-center gap-2 text-xs text-amber-500/60 hover:text-amber-400 transition-colors py-1">
                        <Gift size={13} /> Have a referral code?
                      </button>
                    ) : (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}>
                        <label className="block text-[11px] font-bold text-white/35 uppercase tracking-[0.12em] mb-2">
                          Referral code <span className="normal-case font-normal text-white/20">(optional)</span>
                        </label>
                        <div className="relative">
                          <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                          <input value={form.referral_code} onChange={set("referral_code")}
                            placeholder="e.g. ABC12345" autoComplete="off"
                            readOnly={referralLocked} maxLength={12}
                            className={inputCls(
                              `pl-11 pr-28 uppercase tracking-widest font-mono ${referralLocked ? "cursor-default" : ""}`,
                              referralLocked ? "success" : "default"
                            )}
                          />
                          {referralLocked && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                Applied ✓
                              </span>
                              <button type="button"
                                onClick={() => { clearSavedReferralCode(); setForm(prev => ({ ...prev, referral_code: "" })); setReferralLocked(false); }}
                                className="text-white/20 hover:text-white/50 text-[11px] transition-colors" title="Remove">
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] mt-1.5"
                          style={{ color: referralLocked ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.2)" }}>
                          {referralLocked ? "You were referred — you'll both earn a reward!" : "Get 10% off your first investment"}
                        </p>
                      </motion.div>
                    )}
                  </Field>

                  <motion.button type="button" onClick={() => step1Valid && setStep(2)}
                    disabled={!step1Valid}
                    whileHover={step1Valid ? { scale: 1.015 } : {}} whileTap={step1Valid ? { scale: 0.985 } : {}}
                    className="w-full py-4 rounded-2xl font-bold text-[#071410] flex items-center justify-center gap-2 transition-all shadow-lg text-sm mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                    Continue <ArrowRight size={15} />
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <motion.div key="step2"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-5"
                >
                  <Field label="Password" index={0}>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                      <input value={form.password} onChange={set("password")}
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        onFocus={() => setPwFocused(true)}
                        onBlur={() => setPwFocused(false)}
                        className={inputCls("pl-11 pr-12",
                          passedChecks === PASSWORD_CHECKS.length ? "success" : "default"
                        )}
                        required
                      />
                      <EyeToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
                    </div>

                    {form.password && (
                      <div className="mt-2.5">
                        <div className="flex gap-1 mb-1.5">
                          {PASSWORD_CHECKS.map((_, i) => (
                            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                              style={{ background: i < passedChecks ? STRENGTH_COLORS[passedChecks - 1] : "rgba(255,255,255,0.07)" }} />
                          ))}
                        </div>
                        <p className="text-xs transition-colors"
                          style={{ color: passedChecks > 0 ? STRENGTH_COLORS[passedChecks - 1] : "rgba(255,255,255,0.25)" }}>
                          {STRENGTH_LABELS[passedChecks - 1] || "Enter a password"}
                        </p>
                      </div>
                    )}

                    <AnimatePresence>
                      {form.password && pwFocused && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 space-y-1.5 rounded-2xl border border-white/7 bg-white/3 p-3.5"
                        >
                          {PASSWORD_CHECKS.map((check, i) => {
                            const passed = check.test.test(form.password);
                            return (
                              <li key={i} className={`flex items-center gap-2 text-xs transition-colors ${passed ? "text-emerald-400" : "text-white/25"}`}>
                                <span className="w-3 text-center text-[10px]">{passed ? "✓" : "○"}</span>
                                {check.label}
                              </li>
                            );
                          })}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </Field>

                  <Field label="Confirm password" index={1}>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                      <input value={form.password_confirmation} onChange={set("password_confirmation")}
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        className={inputCls("pl-11 pr-12",
                          passwordsMatch ? "success" : passwordsDontMatch ? "error" : "default"
                        )}
                        required
                      />
                      {/* Show checkmark or eye toggle — checkmark takes priority when matched */}
                      {passwordsMatch
                        ? <CheckCircle size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                        : <EyeToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
                      }
                    </div>
                    {passwordsDontMatch && (
                      <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
                    )}
                  </Field>

                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setStep(1)}
                      className="px-5 py-4 rounded-2xl text-sm font-semibold text-white/40 hover:text-white/70 border border-white/8 hover:border-white/18 transition-all">
                      Back
                    </button>
                    <motion.button type="submit" disabled={loading || !isFormValid}
                      whileHover={isFormValid && !loading ? { scale: 1.015 } : {}}
                      whileTap={isFormValid && !loading ? { scale: 0.985 } : {}}
                      className="flex-1 py-4 rounded-2xl font-bold text-[#071410] flex items-center justify-center gap-2 transition-all shadow-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Creating account...
                        </>
                      ) : (
                        <><span>Create Account</span><ArrowRight size={15} /></>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-white/7" />
            <span className="text-white/18 text-xs">or</span>
            <div className="flex-1 h-px bg-white/7" />
          </div>

          <p className="text-center text-sm text-white/30">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          <p className="text-center text-[11px] text-white/18 mt-5 leading-relaxed">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-white/35 transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-white/35 transition-colors">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
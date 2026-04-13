"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function SetNewPassword() {
  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const email = typeof window !== "undefined" ? localStorage.getItem("reset_email") : "";
  const otpVerified = typeof window !== "undefined" ? localStorage.getItem("otp_verified") : "";

  useEffect(() => {
    if (!email || otpVerified !== "true") {
      toast.error("Please complete the verification process first.");
      router.push("/forgot-password");
    }
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const passwordsMatch = form.password && form.password_confirmation && form.password === form.password_confirmation;
  const passwordsDontMatch = form.password_confirmation && !passwordsMatch;

  // Password strength
  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#22c55e", "#22c55e"][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (form.password !== form.password_confirmation) {
      const msg = "Passwords do not match."; setError(msg); toast.error(msg); return;
    }
    if (form.password.length < 8) {
      const msg = "Password must be at least 8 characters."; setError(msg); toast.error(msg); return;
    }

    try {
      setLoading(true);
      await api.post("/password/reset", { email, ...form });
      const successMsg = "Password reset successful! Redirecting to login...";
      setMessage(successMsg); toast.success(successMsg);
      localStorage.removeItem("reset_email");
      localStorage.removeItem("otp_verified");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to reset password.";
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
      <div className="absolute top-0 left-0 w-[30vw] h-[30vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2"> 
             {process.env.NEXT_PUBLIC_APP_NAME}
          </p>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Land Investment
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
          {/* Icon header */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-4">
              <Lock className="text-amber-500" size={26} />
            </div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Set New Password
            </h2>
            <p className="text-white/40 text-sm mt-2 text-center">
              Choose a strong password for your account
            </p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
              <CheckCircle size={15} className="mt-0.5 shrink-0" /><span>{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              <span className="mt-0.5">⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                <input
                  name="password" type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  required autoFocus
                  className="w-full bg-white/5 border border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 text-white placeholder-white/20 pl-10 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all"
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Strength bars */}
              {form.password && (
                <div className="mt-2.5">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: i <= strength ? strengthColor : "rgba(255,255,255,0.08)" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strengthColor }}>{strengthLabel}</p>
                </div>
              )}

              <p className="text-xs text-white/25 mt-1.5">Minimum 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                <input
                  name="password_confirmation" type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password_confirmation} onChange={handleChange}
                  required
                  className={`w-full bg-white/5 border hover:border-white/20 text-white placeholder-white/20 pl-10 pr-12 py-3.5 rounded-xl text-sm outline-none transition-all ${
                    passwordsDontMatch
                      ? "border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                      : passwordsMatch
                      ? "border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
                      : "border-white/10 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                />
                {/* Right icons */}
                {passwordsMatch && (
                  <CheckCircle className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-400" size={15} />
                )}
                <button
                  type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordsDontMatch && (
                <p className="text-xs text-red-400 mt-1.5">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !!passwordsDontMatch}
              className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={16} /> Saving...</>
              ) : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
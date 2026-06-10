"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, Loader2 } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const router = useRouter();

  const email = typeof window !== "undefined"
    ? localStorage.getItem("pending_email")
    : "";

  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  const handleChange = (e, idx) => {
    const val = e.target.value;
    if (/^\d?$/.test(val)) {
      const newOtp = [...otp];
      newOtp[idx] = val;
      setOtp(newOtp);
      if (val && idx < 5) inputRefs.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      inputRefs.current[5].focus();
      toast.success("Code pasted!");
    } else {
      toast.error("Please paste a valid 6-digit code");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      const m = "Please enter all 6 digits.";
      setError(m); toast.error(m); return;
    }
    setLoading(true); setError(""); setMessage("");
    try {
      await api.post("/email/verify/code", { email, verification_code: code });
      const msg = "Email verified successfully!";
      setMessage(msg); toast.success(msg);
      localStorage.removeItem("pending_email");
      setTimeout(() => router.push("/email-verified"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Invalid or expired code.";
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true); setMessage(""); setError("");
    try {
      await api.post("/email/resend-verification", { email });
      const msg = "Verification code sent!";
      setMessage(msg); toast.success(msg);
      setCooldown(60);
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend code.";
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-0 right-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-1">Sproutvest</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Land Investment
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 shadow-2xl">

          {/* Icon header */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-3">
              <MailCheck className="text-amber-500" size={24} />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white text-center"
              style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
              Verify Your Email
            </h2>
            {email && (
              <p className="text-white/60 text-sm mt-2 text-center leading-relaxed px-2">
                We sent a 6-digit code to{" "}
                <span className="text-white/70 font-semibold break-all">{email}</span>
              </p>
            )}
            <p className="text-white/25 text-xs mt-1.5">Code expires in 10 minutes</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
              <span className="shrink-0">✓</span><span>{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              <span className="shrink-0">⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            <div
              className="flex justify-center gap-2 sm:gap-2.5 mb-6"
              onPaste={handlePaste}
            >
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  autoFocus={idx === 0}
                  className={`
                    w-10 h-12 sm:w-12 sm:h-14
                    text-center rounded-xl border-2 text-base sm:text-lg font-bold
                    bg-white/5 text-white outline-none transition-all
                    ${digit
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-white/10 hover:border-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                    }
                  `}
                />
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
            >
              {loading
                ? <><Loader2 className="animate-spin" size={16} /> Verifying...</>
                : "Verify Email"
              }
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            <p className="text-sm text-white/55">
              Didn't receive the code?{" "}
              {cooldown > 0 ? (
                <span className="text-white/20 cursor-not-allowed">
                  Resend in{" "}
                  <span className="font-bold tabular-nums text-amber-500/50">{cooldown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="font-semibold text-amber-500 hover:text-amber-400 disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
                >
                  Resend Code
                </button>
              )}
            </p>

            {/* Cooldown progress bar */}
            {cooldown > 0 && (
              <div className="mt-3 w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500/40 rounded-full transition-all duration-1000"
                  style={{ width: `${(cooldown / 60) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
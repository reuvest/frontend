"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { MailCheck, ArrowLeft, Loader2 } from "lucide-react";
import api from "../../utils/api";
import toast from "react-hot-toast";

export default function ResetVerify() {
  const router = useRouter();
  const email = typeof window !== "undefined" ? localStorage.getItem("reset_email") : "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (/^[0-9]$/.test(value) || value === "") {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 5) inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
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
    setError(""); setMessage("");
    const code = otp.join("");

    if (code.length < 6) { const m = "Please enter all 6 digits."; setError(m); toast.error(m); return; }
    if (!email) { const m = "Missing email. Please go back."; setError(m); toast.error(m); return; }

    setLoading(true);
    try {
      await api.post("/password/reset/verify", { email, reset_code: code });
      localStorage.setItem("otp_verified", "true");
      const msg = "Verification successful! Redirecting...";
      setMessage(msg); toast.success(msg);
      setTimeout(() => router.push("/set-new-password"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Invalid or expired code.";
      setError(msg); toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { const m = "Missing email. Please go back."; setError(m); return; }
    setResending(true); setMessage(""); setError("");
    try {
      await api.post("/password/reset/code", { email });
      const msg = `A new code has been sent to ${email}.`;
      setMessage(msg); toast.success("New code sent!");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to resend code.";
      setError(msg); toast.error(msg);
    } finally {
      setResending(false);
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
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />

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
              <MailCheck className="text-amber-500" size={26} />
            </div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Verify Code
            </h2>
            <p className="text-white/40 text-sm mt-2 text-center leading-relaxed">
              We sent a 6-digit code to<br />
              <span className="text-white/70 font-semibold">{email || "your email"}</span>
            </p>
            <p className="text-white/25 text-xs mt-1">Code expires in 10 minutes</p>
          </div>

          {/* Messages */}
          {message && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
              <span>✓</span><span>{message}</span>
            </div>
          )}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              <span>⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            {/* OTP inputs */}
            <div className="flex justify-center gap-2.5 mb-7" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  autoFocus={index === 0}
                  className={`w-12 h-14 text-center rounded-xl border-2 text-lg font-bold bg-white/5 text-white outline-none transition-all ${
                    digit
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-400"
                      : "border-white/10 hover:border-white/25 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  }`}
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
              {loading ? (
                <><Loader2 className="animate-spin" size={16} /> Verifying...</>
              ) : "Verify Code"}
            </button>
          </form>

          {/* Resend & back */}
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-white/30">
              Didn't receive the code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="font-semibold text-amber-500 hover:text-amber-400 disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </p>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="inline-flex items-center gap-1.5 text-sm text-white/25 hover:text-white/50 transition-colors"
            >
              <ArrowLeft size={13} /> Use different email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
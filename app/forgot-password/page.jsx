"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import api from "../../utils/api";
import FormError from "../components/FormError";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage(""); setFieldErrors({});
    setLoading(true);

    try {
      const res = await api.post("/password/reset/code", { email });
      const successMessage = res.data.message || "A reset code has been sent to your email.";
      setMessage(successMessage);
      toast.success(successMessage);
      localStorage.setItem("reset_email", email);
      setTimeout(() => router.push("/reset-verify"), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Failed to send reset code.";
      setError(msg);
      toast.error(msg);
      if (err.response?.data?.errors) setFieldErrors(err.response.data.errors);
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
      <div className="absolute top-0 right-0 w-[45vw] h-[45vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[35vw] h-[35vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-2">{appname}</p>
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Land Investment
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-2xl">
          {/* Icon header */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center mb-4">
              <Mail className="text-amber-500" size={26} />
            </div>
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Forgot Password?
            </h2>
            <p className="text-white/40 text-sm mt-2 text-center leading-relaxed">
              No worries! Enter your email and we'll send you a reset code.
            </p>
          </div>

          {/* Success message */}
          {message && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-sm">
              <span className="mt-0.5">✓</span><span>{message}</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              <span className="mt-0.5">⚠</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={15} />
                <input
                  id="email" type="email" name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required autoFocus
                  className={`w-full bg-white/5 border pl-10 pr-4 py-3.5 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all ${
                    fieldErrors.email
                      ? "border-red-500/50 focus:ring-2 focus:ring-red-500/20"
                      : "border-white/10 hover:border-white/20 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20"
                  }`}
                />
              </div>
              <FormError error={fieldErrors.email} />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-[#0D1F1A] text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
            >
              {loading ? (
                <><Loader2 className="animate-spin" size={16} /> Sending Code...</>
              ) : "Send Reset Code"}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
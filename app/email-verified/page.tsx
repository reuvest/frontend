import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function EmailVerified() {
  return (
    <div
      className="min-h-screen bg-[#0D1F1A] flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}
    >
      {/* Background */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] sm:w-[60vw] sm:h-[60vw] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />

      <div className="relative z-10 w-full max-w-sm text-center">

        {/* Logo */}
        <div className="mb-6">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-600 mb-1">Sproutvest</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Land Investment
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-7 sm:p-10 shadow-2xl">

          {/* Success icon */}
          <div className="relative mx-auto mb-5 w-16 h-16 sm:w-20 sm:h-20">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="text-emerald-400" size={30} />
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>
            Email Verified!
          </h2>
          <p className="text-white/50 text-sm mb-7 leading-relaxed">
            Your email address has been successfully verified.
            You can now access your account.
          </p>

          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center py-3.5 rounded-xl font-bold text-[#0D1F1A] text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)" }}
          >
            Sign In to Your Account
          </Link>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Sproutvest";

export default function ReferralRedirect({ code }) {
  const router = useRouter();

  useEffect(() => {
    if (code) {
      try {
        localStorage.setItem(
          "referral_code",
          JSON.stringify({
            code,
            expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
          })
        );
      } catch {}
    }

    router.replace("/");
  }, [code, router]);

  return (
    <div
      className="min-h-screen bg-[#0D1F1A] flex flex-col items-center justify-center gap-5"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-base"
          style={{ background: "linear-gradient(135deg, #C8873A, #E8A850)", color: "#0D1F1A" }}
        >
          S
        </div>
        <span
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {APP_NAME}
        </span>
      </div>

      {/* Spinner */}
      <svg
        className="animate-spin h-6 w-6 text-amber-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>

      <p className="text-white/40 text-sm">Setting up your referral...</p>
    </div>
  );
}
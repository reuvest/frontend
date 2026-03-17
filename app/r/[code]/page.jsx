"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ReferralRedirect() {
  const { code } = useParams();
  const router   = useRouter();

  useEffect(() => {
    if (!code) { router.replace("/"); return; }

    // Save with 30-day expiry — same format RefCapture uses
    try {
      localStorage.setItem(
        "referral_code",
        JSON.stringify({
          code,
          expires: Date.now() + 30 * 24 * 60 * 60 * 1000,
        })
      );
    } catch {}

    router.replace("/");
  }, [code, router]);

  // Blank while redirecting
  return null;
}
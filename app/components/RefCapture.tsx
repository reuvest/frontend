"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RefCapture({ forceCode }: { forceCode?: string | null }) {
  const params = useSearchParams();

  useEffect(() => {
    const code = forceCode ?? params?.get("ref");
    if (!code) return;

    const payload = {
      code,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    try {
      localStorage.setItem("referral_code", JSON.stringify(payload));
    } catch {
      // localStorage unavailable (private browsing edge case) — silently ignore
    }
  }, [forceCode, params]);

  return null;
}

export function getSavedReferralCode(): string | null {
  try {
    const raw = localStorage.getItem("referral_code");
    if (!raw) return null;
    const { code, expires } = JSON.parse(raw);
    if (Date.now() > expires) {
      localStorage.removeItem("referral_code");
      return null;
    }
    return code ?? null;
  } catch {
    return null;
  }
}

export function clearSavedReferralCode(): void {
  try {
    localStorage.removeItem("referral_code");
  } catch {}
}
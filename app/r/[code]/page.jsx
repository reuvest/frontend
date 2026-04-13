import { Suspense } from "react";
import ReferralRedirect from "./ReferralRedirect";

// ─── Env ──────────────────────────────────────────────────────────────────────

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL  || "reu.ng";

// ─── OG Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }) {
  const { code = "" } = await params; 

  let referrerName = null;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/referrals/info/${code}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      referrerName =
        json?.data?.name ??
        json?.data?.referrer_name ??
        json?.name ??
        null;
    }
  } catch {}

  const title = referrerName
    ? `${referrerName} invited you to ${APP_NAME}`
    : `You've been invited to ${APP_NAME}`;

  const description =
    `Invest in fully verified land across Nigeria — starting from just ₦5,000. ` +
    `Join ${APP_NAME} today and start building real wealth.`;

  const ogImage = `${APP_URL}/og-referral.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${APP_URL}/r/${code}`,
      siteName: APP_NAME,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${APP_NAME} — Invest in Verified Land` }],
      type: "website",
      locale: "en_NG",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReferralLanding({ params }) {
  const { code = "" } = await params; 

  return (
    <Suspense fallback={null}>
      <ReferralRedirect code={code} />
    </Suspense>
  );
}
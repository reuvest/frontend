import { Suspense } from "react";
import RefCapture from "./components/RefCapture";
import HeroSection from "./components/home/HeroSection";
import HowItWorksSection from "./components/home/HowItWorksSection";
import ReturnsSection from "./components/home/ReturnsSection";
import WhyUsSection from "./components/home/WhyUsSection";
import FeaturedPropertiesSection from "./components/home/FeaturedPropertiesSection";
import type { FeaturedLand } from "./components/FeaturedProperties";
import LiquiditySection from "./components/home/LiquiditySection";
import ComplianceSection from "./components/home/ComplianceSection";
import FaqPageSection from "./components/home/FaqPageSection";

const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const appurl  = process.env.NEXT_PUBLIC_APP_URL  || "api.reu.ng";

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL(appurl),
  title: `${appname} — Fractional Land Investment in Nigeria from ₦5,000`,
  description:
    `Invest in fully verified land across major growth corridors in Nigeria, minimum investment from ₦5,000. ${appname} offers secure fractional land ownership, 15-30% annual appreciation, legally verified titles, and a real-time investor dashboard. Start building wealth today.`,
  keywords: [
    "fractional land investment Nigeria",
    "buy land Ogun fractional",
    "land investment from 5000 naira",
    "verified land Nigeria",
    "real estate investment Nigeria",
    "land ownership Nigeria",
    "Certificate of Occupancy Nigeria",
    "ROI land investment Nigeria",
    "Oyo land investment",
    "Ibadan land investment",
    "Abuja land plots",
    appname,
    `${appname} review`,
    `${appname} investment`,
  ],
  openGraph: {
    title: `${appname} — Fractional Land Investment in Nigeria from ₦5,000`,
    description: `Secure verified land across Nigeria from ₦5,000. legally verified titles, 15-30% projected annual appreciation, real-time portfolio dashboard. Join ${appname} today.`,
    url: appurl,
    siteName: appname,
    images: [{ url: `${appurl}/og-image.jpg`, width: 1200, height: 630, alt: `${appname} — Fractional Land Investment Nigeria` }],
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appname} — Own Verified Land in Nigeria from ₦5,000`,
    description: `Fractional land ownership, legally verified titles, 15-30% projected annual returns. Join ${appname}.`,
    images: [`${appurl}/og-image.jpg`],
  },
  alternates: { canonical: appurl },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function JsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: appname,
    url: appurl,
    logo: `${appurl}/logo.png`,
    description: `${appname} is Nigeria's trusted fractional land investment platform. Buy verified land plots from ₦5,000 per unit with full C of O documentation across Ogun, Oyo and Abuja.`,
    address: { "@type": "PostalAddress", addressLocality: "Oyo", addressRegion: "Oyo State", addressCountry: "NG" },
    areaServed: { "@type": "Country", name: "Nigeria" },
    contactPoint: {
      "@type": "ContactPoint",
      email: `hello@${appname.toLowerCase()}.com`,
      contactType: "customer service",
      availableLanguage: "English",
    },
    sameAs: [],
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the minimum investment on {appname}?",
        acceptedAnswer: { "@type": "Answer", text: "You can start investing from as little as ₦5,000. Unit prices vary by property." },
      },
      {
        "@type": "Question",
        name: "What documents prove my land ownership?",
        acceptedAnswer: { "@type": "Answer", text: "Each property is backed legally verified titles, survey plan, and deed of assignment. Digital ownership records are issued to every investor." },
      },
      {
        "@type": "Question",
        name: "What returns can I expect on land investment?",
        acceptedAnswer: { "@type": "Answer", text: "Land on the platform has historically appreciated 15-30% annually, driven by Nigeria's urbanisation and infrastructure growth. Past performance is not a guarantee of future returns." },
      },
      {
        "@type": "Question",
        name: "Can I sell my land units?",
        acceptedAnswer: { "@type": "Answer", text: "Yes. Investors can sell their fractional units back through the platform's built-in secondary market at any time, subject to available buyers." },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    </>
  );
}

// ─── ISR fetch ────────────────────────────────────────────────────────────────
const BACKEND_ROOT = (
  process.env.API_PROXY_TARGET ||
  (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "")
).replace(/\/$/, "");

async function getLands(): Promise<FeaturedLand[]> {
  if (!BACKEND_ROOT) return [];
  try {
    const res = await fetch(`${BACKEND_ROOT}/api/land`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data || json || [];
    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch {
    return [];
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Homepage() {
  const lands = await getLands();

  return (
    <>
      <JsonLd />
      <Suspense fallback={null}><RefCapture /></Suspense>

      <main className="bg-[#FDFAF5]" style={{ fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" }}>
        <HeroSection />
        <HowItWorksSection />
        <ReturnsSection />
        <WhyUsSection appname={appname} />
        {/* Ownership & Documentation, Location & Market Insights sections
            are disabled — see app/components/home/_disabled-sections-reference.jsx */}
        <FeaturedPropertiesSection lands={lands} />
        <LiquiditySection appname={appname} />
        <ComplianceSection appname={appname} />
        {/* Testimonials, CTA sections are disabled — see
            app/components/home/_disabled-sections-reference.jsx */}
        <FaqPageSection />
      </main>
    </>
  );
}
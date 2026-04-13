import { Suspense } from "react";
import Link from "next/link";
import FaqSection from "./components/FaqSection";
import FeaturedProperties from "./components/FeaturedProperties";
import RefCapture from "./components/RefCapture";
import {
  ArrowRight, CheckCircle, Shield, Zap, FileCheck,
  Users, Clock, Award, Star, TrendingUp, MapPin,
  BarChart3, Lock, FileText, RefreshCw, Landmark,
  BadgeCheck, Globe, ChevronRight,
} from "lucide-react";

const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";
const appurl  = process.env.NEXT_PUBLIC_APP_URL  || "api.reu.ng";

// ─── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL(appurl),
  title: `${appname} — Fractional Land Investment in Nigeria from ₦5,000`,
  description:
    `Invest in fully verified land across Ogun, Oyo, and Abuja from just ₦5,000 per unit. ${appname} offers secure fractional land ownership, 10-20% annual appreciation, Certificate of Occupancy-backed titles, and a real-time investor dashboard. Start building wealth today.`,
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
    description: `Secure verified land across Nigeria from ₦5,000. C of O-backed titles, 10-20% projected annual appreciation, real-time portfolio dashboard. Join ${appname} today.`,
    url: appurl,
    siteName: appname,
    images: [{ url: `${appurl}/og-image.jpg`, width: 1200, height: 630, alt: `${appname} — Fractional Land Investment Nigeria` }],
    type: "website",
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: `${appname} — Own Verified Land in Nigeria from ₦5,000`,
    description: `Fractional land ownership, C of O titles, 10-20% projected annual returns. Join ${appname}.`,
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
        acceptedAnswer: { "@type": "Answer", text: "You can start investing from as little as ₦5,000 per unit. Unit prices vary by property." },
      },
      {
        "@type": "Question",
        name: "What documents prove my land ownership?",
        acceptedAnswer: { "@type": "Answer", text: "Each property is backed by a Certificate of Occupancy (C of O), survey plan, and deed of assignment. Digital ownership records are issued to every investor." },
      },
      {
        "@type": "Question",
        name: "What returns can I expect on land investment?",
        acceptedAnswer: { "@type": "Answer", text: "Land on the platform has historically appreciated 10-20% annually, driven by Nigeria's urbanisation and infrastructure growth. Past performance is not a guarantee of future returns." },
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
async function getLands() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/land`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data || json || [];
    return Array.isArray(data) ? data.slice(0, 5) : [];
  } catch {
    return [];
  }
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-700 mb-2 block">
      {children}
    </span>
  );
}

function SectionHeading({ children, light = false }) {
  return (
    <h2
      className={`font-bold ${light ? "text-white" : "text-[#0D1F1A]"}`}
      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
    >
      {children}
    </h2>
  );
}

function StatBadge({ value, label }) {
  return (
    <div className="text-center px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
      <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Homepage() {
  const lands = await getLands();

  return (
    <>
      <JsonLd />
      <Suspense fallback={null}><RefCapture /></Suspense>

      <main className="bg-[#FDFAF5]" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

        {/* ══════════════════════════════════════════
            HERO
        ══════════════════════════════════════════ */}
        <section
          className="relative flex items-center justify-center bg-[#0D1F1A]"
          style={{ minHeight: "90vh", paddingBottom: "80px", paddingTop: "60px" }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-5%] w-[55vw] h-[55vw] rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #C8873A 0%, transparent 70%)" }} />
            <div className="absolute bottom-[-10%] right-[-5%] w-[45vw] h-[45vw] rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #2D7A55 0%, transparent 70%)" }} />
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          </div>

          <div className="relative z-10 w-full max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-bold mb-6">
              <BadgeCheck size={12} /> Fully verified land · Legally backed
            </div>

            <h1
              className="font-bold text-white mb-5 leading-[1.08] tracking-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
            >
              Invest, Own &amp; Trade Land.
              <br />
              <span style={{ color: "#C8873A" }}>Build Lasting Wealth.</span>
            </h1>

            <p
              className="text-white/55 mb-8 mx-auto leading-relaxed"
              style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.15rem)", maxWidth: "36rem" }}
            >
              Fractional land ownership across Ogun, Oyo &amp; Abuja — starting
              from just <strong className="text-white/85">₦5,000 per unit</strong>.
              Projected <strong className="text-white/85">10-20% annual appreciation</strong>.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8">
              <Link href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-105 active:scale-95 shadow-xl text-sm sm:text-base"
                style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                Start Investing
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/lands"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all text-sm sm:text-base">
                Browse Properties
              </Link>
            </div>

            {/* Social proof stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
              <StatBadge value="₦5,000" label="Min. investment" />
              <StatBadge value="10–20%" label="Projected annual ROI" />
              {/* <StatBadge value="C of O" label="Title standard" /> */}
              <StatBadge value="Multiple cities" label="Ogun · Oyo · Abuja" />
            </div>

            <div className="flex flex-wrap justify-center gap-5 text-xs text-white/35">
              {[
                [CheckCircle, "Verified Properties"],
                [Shield, "Secure Payments"],
                [Clock, "Fast Processing"],
              ].map(([Icon, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <Icon size={12} className="text-emerald-400" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0" style={{ lineHeight: 0, marginBottom: "-2px" }}>
            <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
              <path d="M0 80H1440V40C1200 0 960 20 720 28C480 36 240 56 0 40V80Z" fill="#FDFAF5" />
            </svg>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            HOW IT WORKS — investment basics
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>How It Works</SectionLabel>
              <SectionHeading>Invest in Land in 3 Simple Steps</SectionHeading>
              <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
                No complex paperwork. No large capital required. Just pick a verified property,
                choose your units, and own a piece of Nigeria's fastest-growing land market.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  step: "01",
                  icon: <BadgeCheck size={22} />,
                  title: "Choose a Verified Property",
                  desc: "Browse legally owned land plots in Ogun, Oyo and Abuja. Every listing includes full title documentation and an independent survey plan.",
                  accent: "#C8873A",
                },
                {
                  step: "02",
                  icon: <Zap size={22} />,
                  title: "Buy Fractional Units from ₦5,000",
                  desc: "Select how many units to purchase. Pay securely via bank transfer, card, or USSD. No hidden fees.",
                  accent: "#2D7A55",
                },
                {
                  step: "03",
                  icon: <TrendingUp size={22} />,
                  title: "Earn & Exit on Your Terms",
                  desc: "Track appreciation in your dashboard. Sell units on the secondary market any time, earn rental income where applicable, or hold for long-term growth.",
                  accent: "#8B5CF6",
                },
              ].map((s) => (
                <div key={s.step} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                  <span className="absolute top-4 right-5 text-5xl font-black text-stone-50" style={{ fontFamily: "'Playfair Display', serif" }}>{s.step}</span>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: `${s.accent}18`, color: s.accent }}>
                    {s.icon}
                  </div>
                  <h3 className="font-bold text-[#0D1F1A] mb-2 text-base">{s.title}</h3>
                  <p className="text-[#5C6B63] text-sm leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/register"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-600 transition-colors">
                Create your free account <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            RETURNS & ROI
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Returns & ROI</SectionLabel>
              <SectionHeading light>What Your Investment Can Earn</SectionHeading>
              <p className="text-white/40 mt-3 text-sm max-w-lg mx-auto">
                Nigeria's land market is driven by rapid urbanisation, infrastructure
                investment and rising demand in tier-1 cities.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 mb-8">
              {[
                { icon: <TrendingUp size={20} />, label: "Projected Annual Appreciation", value: "10-20%", note: "Based on market trends in Ogun, Oyo & Abuja corridors", accent: "#C8873A" },
                { icon: <BarChart3 size={20} />, label: "Sources of Return", value: "Multiple streams", note: "Land value growth + rental income on eligible plots", accent: "#2D7A55" },
                { icon: <Clock size={20} />, label: "Min. Holding Period", value: "None", note: "Sell units on the secondary market at any time", accent: "#8B5CF6" },
              ].map((r) => (
                <div key={r.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${r.accent}20`, color: r.accent }}>
                    {r.icon}
                  </div>
                  <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{r.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">{r.label}</p>
                  <p className="text-xs text-white/30 leading-relaxed">{r.note}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-white/20 max-w-lg mx-auto">
              ⚠ Projected returns are based on historical market data and are not guaranteed.
              Land investment involves risk. Please read our investment disclosure before committing funds.
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            WHY US — platform features
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-12">
              <SectionLabel>Why {appname}</SectionLabel>
              <SectionHeading>Simple. Secure. Transparent. Profitable.</SectionHeading>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { icon: <Shield size={22} />,    title: "Verified Titles",     desc: "Every plot carries a legally valid title, survey plan and deed of assignment.", accent: "#C8873A" },
                { icon: <Lock size={22} />,      title: "Secure Payments",     desc: "Bank-grade SSL, Paystack & Monnify — multiple verified gateways.", accent: "#2D7A55" },
                { icon: <BarChart3 size={22} />, title: "Live Dashboard",      desc: "Track your holdings, estimated value and ROI in real time.", accent: "#8B5CF6" },
                { icon: <Users size={22} />,     title: "Dedicated Support",   desc: "Real humans via live chat, email and WhatsApp — every step.", accent: "#C8873A" },
                { icon: <RefreshCw size={22} />, title: "Secondary Market",    desc: "Sell your units to other investors any time. No lock-in.",  accent: "#2D7A55" },
                { icon: <FileText size={22} />,  title: "Digital Certificates",desc: "Ownership records issued instantly after each purchase.",   accent: "#8B5CF6" },
                { icon: <Globe size={22} />,     title: "Multiple City Coverage",     desc: "Curated plots in Ogun, Oyo and Abuja growth corridors.",  accent: "#C8873A" },
                { icon: <Landmark size={22} />,  title: "Legal Compliance",    desc: "Aligned with Nigerian property law and FIRS requirements.",  accent: "#2D7A55" },
              ].map((f) => (
                <article key={f.title}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-100 shadow-sm text-center group hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform"
                    style={{ background: `${f.accent}18`, color: f.accent }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-[#0D1F1A] mb-1 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-[#5C6B63] text-xs sm:text-sm leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            OWNERSHIP & DOCUMENTATION
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <SectionLabel>Ownership & Documentation</SectionLabel>
                <SectionHeading light>Your Proof of Ownership Is Ironclad</SectionHeading>
                <p className="text-white/45 mt-4 text-sm leading-relaxed mb-6">
                  Every property on {appname} is backed by full legal documentation verified
                  by our in-house legal team and independent solicitors before listing.
                </p>
                <ul className="space-y-3">
                  {[
                    // ["Certificate of Occupancy (C of O)", "The gold-standard land title in Nigeria, confirming government-recognised ownership."],
                    ["Survey Plan", "Registered with the state surveyor-general, defining exact plot boundaries."],
                    // ["Deed of Assignment", "Formally transfers fractional interest to each investor on purchase."],
                    ["Digital Ownership Record", "Instant digital certificate issued to your account after every transaction."],
                    ["Title Verification Process", "Independent legal search on every property before onboarding."],
                  ].map(([title, desc]) => (
                    <li key={title} className="flex items-start gap-3">
                      <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-white">{title}</p>
                        <p className="text-xs text-white/35 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  // { icon: <FileCheck size={28} />, label: "C of O Backed", sub: "Every listing", accent: "#C8873A" },
                  { icon: <BadgeCheck size={28} />, label: "Title Verified", sub: "Pre-listing check", accent: "#2D7A55" },
                  { icon: <Lock size={28} />, label: "Legal Protection", sub: "Fractional owners", accent: "#8B5CF6" },
                  { icon: <FileText size={28} />, label: "Digital Certificate", sub: "Instant on purchase", accent: "#C8873A" },
                ].map((d) => (
                  <div key={d.label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ background: `${d.accent}20`, color: d.accent }}>
                      {d.icon}
                    </div>
                    <p className="text-sm font-bold text-white">{d.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{d.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            LOCATION & MARKET INSIGHTS
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Location & Market Insights</SectionLabel>
              <SectionHeading>Where We Invest — and Why</SectionHeading>
              <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
                {appname} focuses on high-demand corridors where infrastructure spend,
                population growth and limited land supply drive consistent appreciation.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                {
                  city: "Ogun",
                  icon: <MapPin size={18} />,
                  // areas: "Lekki · Ibeju-Lekki · Epe",
                  driver: "Agriculture, industry make Ogun land among the fastest-appreciating in Africa.",
                  growth: "12–18% avg. annual appreciation",
                  accent: "#C8873A",
                },
                {
                  city: "Oyo",
                  icon: <MapPin size={18} />,
                  areas: "Oluyole · Akala · Omi-Adio",
                  driver: "Nigeria's largest city by area with expanding ring-road infrastructure and growing middle-class demand.",
                  growth: "8–12% avg. annual appreciation",
                  accent: "#2D7A55",
                },
                {
                  city: "Abuja",
                  icon: <MapPin size={18} />,
                  areas: "Kuje · Gwagwalada · Kubwa",
                  driver: "Federal capital expansion, satellite town development and civil service housing demand sustain strong price floors.",
                  growth: "10–14% avg. annual appreciation",
                  accent: "#8B5CF6",
                },
              ].map((loc) => (
                <article key={loc.city} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="px-6 py-4 flex items-center gap-3" style={{ background: `${loc.accent}10` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${loc.accent}20`, color: loc.accent }}>
                      {loc.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0D1F1A] text-base">{loc.city}</h3>
                      <p className="text-xs text-[#5C6B63]">{loc.areas}</p>
                    </div>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-sm text-[#5C6B63] leading-relaxed mb-3">{loc.driver}</p>
                    <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: loc.accent }}>
                      <TrendingUp size={12} /> {loc.growth}
                    </div>
                    <p className="text-[10px] text-[#9CA3AF] mt-1">Projected · not guaranteed</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            FEATURED PROPERTIES
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]" aria-label="Featured land investment properties">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8 sm:mb-10 flex-wrap gap-4">
              <div>
                <SectionLabel>Handpicked</SectionLabel>
                <SectionHeading light>Featured Properties</SectionHeading>
              </div>
              <Link href="/lands"
                className="flex items-center gap-1.5 text-amber-500 hover:text-amber-400 text-sm font-semibold transition-colors">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <FeaturedProperties lands={lands} />
          </div>
        </section>

        {/* ══════════════════════════════════════════
            LIQUIDITY & EXIT OPTIONS
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Liquidity & Exit</SectionLabel>
              <SectionHeading>You're Never Locked In</SectionHeading>
              <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
                Unlike traditional real estate, your {appname} units are liquid.
                Exit when you want — on your schedule, not ours.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5">
              {[
                { icon: <RefreshCw size={22} />, title: "Secondary Marketplace", desc: "List and sell your units to other platform investors instantly — no waiting for physical property sales.", accent: "#C8873A" },
                { icon: <Clock size={22} />, title: "No Minimum Hold Period", desc: "Buy today, sell tomorrow if you need to. There's no lock-up period on any listed property.", accent: "#2D7A55" },
                { icon: <TrendingUp size={22} />, title: "Transferable Ownership", desc: "Fractional shares are fully transferable. Gifting, inheritance and portfolio consolidation are all supported.", accent: "#8B5CF6" },
              ].map((e) => (
                <div key={e.title} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm group hover:shadow-md hover:-translate-y-1 transition-all">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: `${e.accent}18`, color: e.accent }}>
                    {e.icon}
                  </div>
                  <h3 className="font-bold text-[#0D1F1A] mb-2 text-base">{e.title}</h3>
                  <p className="text-[#5C6B63] text-sm leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            REGULATORY & COMPLIANCE
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Regulatory & Compliance</SectionLabel>
              <SectionHeading light>Built on a Foundation of Trust</SectionHeading>
              <p className="text-white/40 mt-3 text-sm max-w-lg mx-auto">
                {appname} operates within Nigeria's regulatory framework so your
                investment is always on solid legal ground.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Landmark size={20} />, title: "Nigerian Property Law", desc: "Fully compliant with the Land Use Act and state land regulations.", accent: "#C8873A" },
                { icon: <FileCheck size={20} />, title: "Independent Legal Audits", desc: "All titles reviewed by registered Nigerian solicitors before listing.", accent: "#2D7A55" },
                { icon: <Shield size={20} />, title: "FIRS Compliance", desc: "Tax obligations on rental income and capital gains properly disclosed.", accent: "#8B5CF6" },
                { icon: <Lock size={20} />, title: "Secure Infrastructure", desc: "256-bit SSL, PCI-DSS compliant payment processing, SOC-2 aligned data handling.", accent: "#C8873A" },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${c.accent}20`, color: c.accent }}>
                    {c.icon}
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{c.title}</h3>
                  <p className="text-xs text-white/35 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════
            TESTIMONIALS
        ══════════════════════════════════════════ */}
        {/* <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]" aria-label="Investor testimonials">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <SectionLabel>Investors</SectionLabel>
              <SectionHeading>What They're Saying</SectionHeading>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
              {[
                {
                  name: "Chidi Okonkwo",
                  role: "Business Owner, Abuja",
                  text: "I've invested in 3 properties so far. The process was smooth, documentation was clean and the team is fully transparent about costs.",
                  rating: 5,
                  stat: "+14% portfolio growth in 12 months",
                },
                {
                  name: "Amina Bello",
                  role: "Software Engineer, Ogun",
                  text: "The fractional model made it easy to start with just ₦20,000. My land value has appreciated and I can track everything on the dashboard.",
                  rating: 5,
                  stat: "3 plots owned across 2 cities",
                },
              ].map((t, i) => (
                <blockquote key={i} className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-sm">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={13} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-[#3D4D43] leading-relaxed mb-3 text-sm italic">"{t.text}"</p>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold mb-3">
                    <TrendingUp size={10} /> {t.stat}
                  </div>
                  <footer>
                    <p className="font-bold text-[#0D1F1A] text-sm">{t.name}</p>
                    <p className="text-[#5C6B63] text-xs mt-0.5">{t.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section> */}

        {/* ══════════════════════════════════════════
            CTA
        ══════════════════════════════════════════ */}
        {/* <section className="relative py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-[35vh] opacity-15 rounded-full blur-3xl"
              style={{ background: "radial-gradient(ellipse, #C8873A 0%, transparent 70%)" }} />
          </div>
          <div className="relative z-10 max-w-xl mx-auto text-center">
            <Award size={36} className="mx-auto mb-4 text-amber-500" />
            <h2 className="font-bold text-white mb-3 leading-tight"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}>
              Ready to Build Your Wealth?
            </h2>
            <p className="text-white/45 mb-8 text-sm sm:text-base max-w-sm mx-auto">
              Join smart investors securing their future through verified land.
              Start from ₦5,000. No experience needed.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <Link href="/register"
                className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-105 shadow-xl text-sm sm:text-base"
                style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
                Start Investing <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/lands"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/10 transition-all text-sm sm:text-base">
                Browse Properties
              </Link>
            </div>
          </div>
        </section>
 */}
        {/* ══════════════════════════════════════════
            FAQ
        ══════════════════════════════════════════ */}
        <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]" aria-label="Frequently asked questions">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8 sm:mb-10">
              <SectionLabel>FAQ</SectionLabel>
              <SectionHeading>Common Questions</SectionHeading>
              <p className="text-[#5C6B63] mt-3 text-sm">
                Everything you need to know before investing.
              </p>
            </div>
            <FaqSection />
          </div>
        </section>

      </main>
    </>
  );
}
import Link from "next/link";
import { BadgeCheck, Zap, TrendingUp, ChevronRight } from "lucide-react";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

const STEPS = [
  {
    step: "01",
    icon: <BadgeCheck size={22} />,
    title: "Choose a Verified Property",
    desc: "Browse legally owned land plots in major growth corridors in Nigeria. Every listing includes full title documentation and an independent survey plan.",
    accent: "#C8873A",
  },
  {
    step: "02",
    icon: <Zap size={22} />,
    title: "Buy Fractional Units",
    desc: "Select how many units to purchase. Pay securely via the in-app wallet.",
    accent: "#2D7A55",
  },
  {
    step: "03",
    icon: <TrendingUp size={22} />,
    title: "Earn & Exit on Your Terms",
    desc: "Track appreciation in your dashboard. Sell units on the secondary market any time, earn rental income where applicable, or hold for long-term growth.",
    accent: "#8B5CF6",
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>How It Works</SectionLabel>
          <SectionHeading>Invest in Land in 3 Simple Steps</SectionHeading>
          <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
            No complex paperwork. No large capital required. Just pick a verified property,
            choose your units, and own a piece of Nigeria&apos;s fastest-growing land market.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {STEPS.map((s) => (
            <div key={s.step} className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
              <span className="absolute top-4 right-5 text-5xl font-black text-stone-300" style={{ fontFamily: "'Playfair Display', serif" }}>{s.step}</span>
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
  );
}

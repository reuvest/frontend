import { TrendingUp, BarChart3, Clock } from "lucide-react";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

const RETURNS = [
  { icon: <TrendingUp size={20} />, label: "Projected Annual Appreciation", value: "15-30%", note: "Based on market trends", accent: "#C8873A" },
  { icon: <BarChart3 size={20} />, label: "Sources of Return", value: "Multiple streams", note: "Land value growth + rental income on eligible plots", accent: "#2D7A55" },
  { icon: <Clock size={20} />, label: "Min. Holding Period", value: "None", note: "Sell units on the secondary market at any time", accent: "#8B5CF6" },
];

export default function ReturnsSection() {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>Returns & ROI</SectionLabel>
          <SectionHeading light>What Your Investment Can Earn</SectionHeading>
          <p className="text-white/60 mt-3 text-sm max-w-lg mx-auto">
            Nigeria&apos;s land market is driven by rapid urbanisation, infrastructure
            investment and rising demand in tier-1 cities.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5 mb-8">
          {RETURNS.map((r) => (
            <div key={r.label} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${r.accent}20`, color: r.accent }}>
                {r.icon}
              </div>
              <p className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{r.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-2">{r.label}</p>
              <p className="text-xs text-white/55 leading-relaxed">{r.note}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/50 max-w-lg mx-auto">
          ⚠ Projected returns are based on historical market data and are not guaranteed.
          Land investment involves risk. Please read our investment disclosure before committing funds.
        </p>
      </div>
    </section>
  );
}

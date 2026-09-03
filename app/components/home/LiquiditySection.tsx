import { RefreshCw, Clock, TrendingUp } from "lucide-react";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

const EXIT_OPTIONS = [
  { icon: <RefreshCw size={22} />, title: "Secondary Marketplace", desc: "List and sell your units to other platform investors instantly — no waiting for physical property sales.", accent: "#C8873A" },
  { icon: <Clock size={22} />, title: "No Minimum Hold Period", desc: "Buy today, sell tomorrow if you need to. There's no lock-up period on any listed property.", accent: "#2D7A55" },
  { icon: <TrendingUp size={22} />, title: "Transferable Ownership", desc: "Fractional shares are fully transferable. Gifting, inheritance and portfolio consolidation are all supported.", accent: "#8B5CF6" },
];

interface LiquiditySectionProps {
  appname: string;
}

export default function LiquiditySection({ appname }: LiquiditySectionProps) {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>Liquidity & Exit</SectionLabel>
          <SectionHeading>You&apos;re Never Locked In</SectionHeading>
          <p className="text-[#5C6B63] mt-3 text-sm max-w-lg mx-auto">
            Unlike traditional real estate, your {appname} units are liquid.
            Exit when you want — on your schedule, not ours.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {EXIT_OPTIONS.map((e) => (
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
  );
}

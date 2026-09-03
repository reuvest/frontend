import { Shield, Lock, BarChart3, Users, RefreshCw, FileText, Globe, Landmark } from "lucide-react";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

const FEATURES = [
  { icon: <Shield size={22} />,    title: "Verified Titles",       desc: "Every plot carries verified titles & documents.", accent: "#C8873A" },
  { icon: <Lock size={22} />,      title: "Secure Payments",       desc: "Bank-grade SSL - multiple gateways.", accent: "#2D7A55" },
  { icon: <BarChart3 size={22} />, title: "Live Dashboard",        desc: "Track your holdings, estimated value and ROI in real time.", accent: "#8B5CF6" },
  { icon: <Users size={22} />,     title: "Dedicated Support",     desc: "Real humans via email and WhatsApp — every step.", accent: "#C8873A" },
  { icon: <RefreshCw size={22} />, title: "Secondary Market",      desc: "Sell your units to other investors any time. No lock-in.",  accent: "#2D7A55" },
  { icon: <FileText size={22} />,  title: "Digital Certificates",  desc: "Ownership records issued instantly after each purchase.",   accent: "#8B5CF6" },
  { icon: <Globe size={22} />,     title: "Multiple City Coverage",desc: "Curated plots in major growth corridor cities in Nigeria.",  accent: "#C8873A" },
  { icon: <Landmark size={22} />,  title: "Legal Compliance",      desc: "Aligned with Nigerian property law and FIRS requirements.",  accent: "#2D7A55" },
];

interface WhyUsSectionProps {
  appname: string;
}

export default function WhyUsSection({ appname }: WhyUsSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#FDFAF5]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <SectionLabel>Why {appname}</SectionLabel>
          <SectionHeading>Simple. Secure. Transparent. Profitable.</SectionHeading>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURES.map((f) => (
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
  );
}

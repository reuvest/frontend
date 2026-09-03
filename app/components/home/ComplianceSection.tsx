import { Landmark, FileCheck, Shield, Lock } from "lucide-react";
import { SectionLabel, SectionHeading } from "./SectionPrimitives";

const COMPLIANCE_ITEMS = [
  { icon: <Landmark size={20} />, title: "Nigerian Property Law", desc: "Fully compliant with the Land Use Act and state land regulations.", accent: "#C8873A" },
  { icon: <FileCheck size={20} />, title: "Independent Legal Audits", desc: "All titles reviewed by registered Nigerian solicitors before listing.", accent: "#2D7A55" },
  { icon: <Shield size={20} />, title: "FIRS Compliance", desc: "Tax obligations on rental income and capital gains properly disclosed.", accent: "#8B5CF6" },
  { icon: <Lock size={20} />, title: "Secure Infrastructure", desc: "256-bit SSL, PCI-DSS compliant payment processing, SOC-2 aligned data handling.", accent: "#C8873A" },
];

interface ComplianceSectionProps {
  appname: string;
}

export default function ComplianceSection({ appname }: ComplianceSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-5 sm:px-10 bg-[#0D1F1A]">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <SectionLabel>Regulatory & Compliance</SectionLabel>
          <SectionHeading light>Built on a Foundation of Trust</SectionHeading>
          <p className="text-white/60 mt-3 text-sm max-w-lg mx-auto">
            {appname} operates within Nigeria&apos;s regulatory framework so your
            investment is always on solid legal ground.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COMPLIANCE_ITEMS.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `${c.accent}20`, color: c.accent }}>
                {c.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{c.title}</h3>
              <p className="text-xs hover:border-white/35 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, BadgeCheck, CheckCircle, Shield, Clock } from "lucide-react";
import { StatBadge } from "./SectionPrimitives";

export default function HeroSection() {
  return (
    <section
      className="relative flex items-center justify-center bg-[#0D1F1A]"
      style={{ minHeight: "80dvh", paddingBottom: "100px", paddingTop: "50px" }}
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs font-bold mb-6">
          <BadgeCheck size={12} />
          <span>Fully verified land · Legally backed</span>
        </div>
        <h1
          className="font-bold text-white mb-5 leading-[1.08] tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.75rem, 5.5vw, 3rem)" }}
        >
          Invest, Own &amp; Trade Land.
          <br />
          <span style={{ color: "#C8873A" }}>Land Investment, Reimagined</span>
        </h1>

        <p
          className="text-white/55 mb-8 mx-auto leading-relaxed"
          style={{ fontSize: "clamp(0.95rem, 2.2vw, 1.15rem)", maxWidth: "36rem" }}
        >
          Fractional land ownership across key cities in Nigeria — minimum investment of <strong className="text-white/85">₦5,000</strong>.
          Projected <strong className="text-white/85">15-30% annual appreciation</strong>.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-8">
          <Link href="/register"
            className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-[#0D1F1A] transition-all hover:scale-105 active:scale-95 shadow-xl text-sm sm:text-base"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
            Start Investing
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/lands"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white border border-white/20 hover:bg-white/2 transition-all text-sm sm:text-base">
            Browse Properties
          </Link>
        </div>

        {/* Social proof stats */}
        <div className="grid grid-cols-3 gap-3 max-w-2xl mx-auto mb-8">
          <StatBadge value="₦5,000" label="Min. investment" />
          <StatBadge value="15–30%" label="Projected annual ROI" />
          <StatBadge value="Multiple cities" label="Major growth corridors in Nigeria" />
        </div>

        <div className="flex flex-wrap justify-center gap-5 text-xs hover:border-white/35">
          {(
            [
              [CheckCircle, "Verified Properties"],
              [Shield, "Secure Payments"],
              [Clock, "Fast Processing"],
            ] as [typeof CheckCircle, string][]
          ).map(([Icon, label]) => (
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
  );
}

// Small presentational building blocks shared by the homepage section
// components in this folder. Pulled out of app/page.jsx during the
// monolith split (todo #5) since every section reused these three.

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-700 mb-2 block">
      {children}
    </span>
  );
}

interface SectionHeadingProps {
  children: React.ReactNode;
  light?: boolean;
}

export function SectionHeading({ children, light = false }: SectionHeadingProps) {
  return (
    <h2
      className={`font-bold ${light ? "text-white" : "text-[#0D1F1A]"}`}
      style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)" }}
    >
      {children}
    </h2>
  );
}

interface StatBadgeProps {
  value: string;
  label: string;
}

export function StatBadge({ value, label }: StatBadgeProps) {
  return (
    <div className="text-center px-2 py-3 rounded-2xl bg-white/5 border border-white/10">
      <p className="text-lg sm:text-2xl font-bold text-amber-600 leading-tight" style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}>{value}</p>
      <p className="text-[10px] sm:text-xs text-white/60 mt-0.5 leading-snug">{label}</p>
    </div>
  );
}

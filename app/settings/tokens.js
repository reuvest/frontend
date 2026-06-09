export const inputCls =
  "w-full bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/20 " +
  "rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 " +
  "focus:ring-2 focus:ring-amber-500/20 transition-all";

export const selectCls = inputCls + " appearance-none cursor-pointer";

export const labelCls =
  "block text-xs font-bold text-white/30 uppercase tracking-widest mb-2";

export const btnPrimary =
  "w-full flex items-center justify-center gap-2 font-bold text-sm px-5 py-4 rounded-xl " +
  "transition-all hover:scale-[1.01] active:scale-[0.99] shadow-sm touch-manipulation " +
  "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 text-[#0D1F1A]";
// Usage: apply btnPrimary as className, then style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}

export const btnSecondary =
  "w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/[0.01]0 border border-white/10 " +
  "text-white font-bold text-sm px-5 py-4 rounded-xl " +
  "transition-all active:scale-95 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed";

export const serif = { fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" };
export const sans  = { fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" };

// ─── Gradient helpers ───────────────────────────────────────────────
export const amberGradient = "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)";

// ─── Glass panel ────────────────────────────────────────────────────
export const glassPanel =
  "rounded-2xl border border-white/10 bg-white/5";

export const glassPanelHeader =
  "flex items-center gap-2.5 px-5 py-4 border-b border-white/5 bg-white/5";
"use client";

import { motion } from "framer-motion";
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { STEPS } from "./constants";

// ── Field wrapper ─────────────────────────────────────────────────────────────
export function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-white/30 uppercase tracking-widest mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

// ── Progress rail (desktop) ───────────────────────────────────────────────────
export function ProgressRail({ current }) {
  return (
    <div className="hidden sm:flex items-center mb-8">
      {STEPS.map((step, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <motion.div
                animate={{ scale: active ? 1.1 : 1 }}
                transition={{ duration: 0.25 }}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={{
                  background:  done ? "linear-gradient(135deg, #C8873A, #E8A850)" : active ? "transparent" : "rgba(255,255,255,0.05)",
                  borderColor: done || active ? "#C8873A" : "rgba(255,255,255,0.1)",
                  color:       done ? "#0D1F1A" : active ? "#E8A850" : "rgba(255,255,255,0.2)",
                }}
              >
                {done ? <CheckCircle size={13} /> : i + 1}
              </motion.div>
              <span className={`text-xs mt-1.5 font-semibold whitespace-nowrap ${
                active ? "text-amber-500" : done ? "text-white/40" : "text-white/15"
              }`}>
                {step}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #C8873A, #E8A850)" }}
                  animate={{ width: done ? "100%" : "0%" }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Review row ────────────────────────────────────────────────────────────────
export function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <p className="text-white/25 text-xs mb-0.5">{label}</p>
      <p className="text-white/80 text-sm font-semibold break-all">{value}</p>
    </div>
  );
}

// ── Nav buttons ───────────────────────────────────────────────────────────────
export function NavButtons({ step, totalSteps, onNext, onSubmit, onBack, submitting }) {
  const isLast = step === totalSteps - 1;
  return (
    <div className="flex items-center justify-between mt-6 pt-5 border-t border-white/10">
      {step > 0 ? (
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-sm font-semibold transition-colors py-2 px-1"
        >
          <ChevronLeft size={15} /> Back
        </button>
      ) : (
        <div />
      )}

      {!isLast ? (
        <button
          type="button"
          onClick={onNext}
          className="flex items-center justify-center gap-2 font-bold text-sm py-3.5 px-6 rounded-xl transition-all active:scale-95 touch-manipulation text-[#0D1F1A]"
          style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
        >
          Continue <ChevronRight size={15} />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-6 rounded-xl transition-all active:scale-95 touch-manipulation"
        >
          {submitting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              Submitting…
            </>
          ) : (
            <><Shield size={13} /> Submit Verification</>
          )}
        </button>
      )}
    </div>
  );
}
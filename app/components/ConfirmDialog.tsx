"use client";

import { AlertTriangle } from "lucide-react";
import { useUIStore } from "../../stores/useUIStore";

export default function ConfirmDialog() {
  const { confirmState, _resolveConfirm } = useUIStore();
  const { isOpen, title, message, confirmLabel, cancelLabel, danger } = confirmState;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-100 p-4">
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "#0D1F1A", boxShadow: "0 25px 80px rgba(0,0,0,0.6)" }}
      >
        <div className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div
              className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${
                danger ? "bg-red-500/10" : "bg-amber-500/10"
              }`}
            >
              <AlertTriangle size={16} className={danger ? "text-red-400" : "text-amber-400"} />
            </div>
            <div className="pt-1">
              {title && (
                <h2
                  className="text-lg font-bold text-white mb-1"
                  style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
                >
                  {title}
                </h2>
              )}
              <p className="text-sm text-white/60 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => _resolveConfirm(false)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 text-sm font-semibold transition-all"
            >
              {cancelLabel || "Cancel"}
            </button>
            <button
              type="button"
              onClick={() => _resolveConfirm(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                danger
                  ? "bg-red-500/90 hover:bg-red-500 text-white"
                  : "text-[#0D1F1A]"
              }`}
              style={
                danger
                  ? undefined
                  : { background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }
              }
            >
              {confirmLabel || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
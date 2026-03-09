"use client";

import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";

export default function StatusBanner({ kyc, onResubmit }) {
  const cfg = {
    pending:  {
      icon: <Clock size={16} />,
      title: "Under Review",
      body: "Your documents are being reviewed. This typically takes 1–2 business days.",
      cls: "border-amber-500/20 bg-amber-500/5 text-amber-400",
      dot: "bg-amber-500",
    },
    approved: {
      icon: <CheckCircle size={16} />,
      title: "Verified",
      body: "Identity verified. You have full access to all platform features.",
      cls: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400",
      dot: "bg-emerald-500",
    },
    rejected: {
      icon: <XCircle size={16} />,
      title: "Verification Failed",
      body: null,
      cls: "border-red-500/20 bg-red-500/5 text-red-400",
      dot: "bg-red-500",
    },
    resubmit: {
      icon: <RefreshCw size={16} />,
      title: "Resubmission Required",
      body: null,
      cls: "border-orange-500/20 bg-orange-500/5 text-orange-400",
      dot: "bg-orange-500",
    },
  };

  const c = cfg[kyc.status];
  if (!c) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border ${c.cls} p-4 mb-6`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">{c.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${c.dot}`} />
            <p className="font-bold text-xs tracking-wide uppercase">{c.title}</p>
          </div>

          {c.body && <p className="text-white/40 text-sm leading-relaxed">{c.body}</p>}

          {kyc.rejection_reason && (
            <p className="text-white/40 text-sm leading-relaxed">
              <span className="text-white/25">Reason: </span>{kyc.rejection_reason}
            </p>
          )}

          {(kyc.status === "rejected" || kyc.status === "resubmit") && (
            <button
              onClick={onResubmit}
              className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#0D1F1A] px-4 py-2 rounded-lg touch-manipulation"
              style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}
            >
              <RefreshCw size={12} /> Submit Again
            </button>
          )}

          {kyc.submission_date && (
            <p className="text-white/20 text-xs mt-2">
              Submitted{" "}
              {new Date(kyc.submission_date).toLocaleDateString("en-NG", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
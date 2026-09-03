"use client";

import { useState, useEffect } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { fetchFaqs, FaqGroups } from "../../../services/supportService";

interface FaqItem {
  id?: string | number;
  question: string;
  answer: string;
}

export default function FaqTab() {
  const [faqs, setFaqs]         = useState<FaqGroups>({});
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetchFaqs()
      .then(setFaqs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 size={20} className="text-amber-500 animate-spin" />
    </div>
  );

  const allFaqs = Object.values(faqs).flat() as FaqItem[];

  if (!allFaqs.length) return (
    <div className="flex-1 flex items-center justify-center text-white/20 text-xs">
      No FAQs available yet.
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
      {allFaqs.map((f, i) => (
        <div key={f.id ?? i} className="rounded-xl border border-white/8 overflow-hidden bg-white/3">
          <button onClick={() => setExpanded(expanded === i ? null : i)}
            className="w-full flex items-center justify-between px-3.5 py-3 text-left gap-2">
            <span className="text-xs font-semibold text-white/70 leading-snug">{f.question}</span>
            <ChevronDown size={13} className={`text-white/55 shrink-0 transition-transform ${expanded === i ? "rotate-180" : ""}`} />
          </button>
          {expanded === i && (
            <div className="px-3.5 pb-3 text-xs text-white/60 leading-relaxed border-t border-white/5 pt-2.5">
              {f.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

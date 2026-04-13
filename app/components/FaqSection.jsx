"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";

const faqs = [
  {
    q: "How do I purchase land?",
    a: "Browse available properties, select your preferred land, choose the number of units, and complete payment securely through your dashboard. Pay in full or choose flexible installment plans.",
  },
  {
    q: "Are all properties verified?",
    a: "Yes. Every property undergoes rigorous verification — we ensure all lands have proper documentation, clear titles, and are free from legal disputes before listing.",
  },
  // {
  //   q: "How long does documentation take?",
  //   a: "Once payment is completed, documentation and title transfer typically takes 2–4 weeks. Our team handles all paperwork and keeps you updated throughout.",
  // },
  {
    q: "What is the minimum investment?",
    a: "You can start with as low as ₦5,000 depending on the property. Each listing shows the price per unit so you can invest according to your budget.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState(null);

  return (
    <div className="space-y-3" role="list">
      {faqs.map((faq, i) => (
        <div key={i}
          role="listitem"
          className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="w-full flex items-center justify-between px-6 py-5 text-left font-semibold text-[#0D1F1A] hover:bg-stone-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-inset">
            <span className="pr-4 text-sm sm:text-base">{faq.q}</span>
            <ChevronRight
              size={18}
              className={`text-amber-600 shrink-0 transition-transform duration-200 ${open === i ? "rotate-90" : ""}`}
            />
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              open === i ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
            }`}>
            <p className="px-6 pb-5 text-[#5C6B63] text-sm leading-relaxed">{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const faqs = [
  {
    q: "What is REU.ng?",
    a: "REU.ng is a digital real estate platform operated by SproutVest GSE Ltd. that enables users to acquire, hold, trade, and eventually convert fractional real estate units into physical land ownership.",
  },
  {
    q: "What is the minimum amount I can start with?",
    a: "You can start investing from as little as ₦5,000. This makes real estate investment accessible to everyone, regardless of income level. The minimum investment amount for each project will be displayed on the platform.",
  },
  {
    q: "Do I own physical land immediately after buying units?",
    a: "No. Purchasing units gives you a beneficial participation interest in a property project. Physical land ownership is obtained and allocated only through the conversion process after the required unit threshold and other conditions have been satisfied.",
  },
  {
    q: "Can I convert my units into physical land?",
    a: "Yes. Once you accumulate enough units equivalent to the minimum requirement for a project and meet all applicable conditions, you may apply for conversion into physical land ownership and receive the appropriate documentation. For most projects, the minimum conversion threshold is equivalent to 300 square metres (sqm).",
  },
  {
    q: "Can I sell my units?",
    a: "Yes. Eligible units may be bought or sold on REU.ng's marketplace on a willing-buyer, willing-seller basis. There is no minimum holding period.",
  },
  {
    q: "Can I withdraw my money?",
    a: "Yes. Cash balances can be withdrawn to your verified bank account within 5–10 business days, subject to identity verification and applicable fees. If your funds are invested in units, you may first need to sell those units before withdrawing the proceeds.",
  },
  {
    q: "Is REU.ng safe?",
    a: "REU.ng employs KYC and AML procedures, property due diligence, professional legal and survey verification, secure digital platform infrastructure, regulatory compliance processes, and professional management processes to protect your investment and personal information.",
  },
  {
    q: "Are investment returns guaranteed?",
    a: "No investment returns are guaranteed. While Nigerian real estate has historically delivered strong long-term performance, actual returns vary depending on the project and market conditions. REU.ng does not guarantee any specific percentage return, profit, capital appreciation, or dividend payments.",
  },
];

export default function FaqSection() {
  const [open, setOpen] = useState(null);

  return (
    <div>
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

      <div className="mt-8 text-center">
        <Link
          href="https://reu.ng/support"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 hover:text-amber-600 transition-colors">
          View all FAQs <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
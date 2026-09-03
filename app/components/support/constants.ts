// Shared constants and Tailwind class strings used across the support
// widget tabs. Pulled out of SupportWidget.jsx during the monolith split
// (todo #5) since every tab reused these.

export const appname = process.env.NEXT_PUBLIC_APP_NAME || "REU.ng";

export const FAQ_PREVIEWS = [
  "How do I fund my wallet?",
  "How do I complete KYC?",
  "How long do withdrawals take?",
  "How do I reset my transaction PIN?",
];

export const TICKET_CATEGORIES = [
  { value: "account",    label: "Account & Profile" },
  { value: "payment",    label: "Deposits & Payments" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "kyc",        label: "KYC Verification" },
  { value: "investment", label: "Land & Investment" },
  { value: "other",      label: "Other" },
];

export const GUEST_CATEGORIES = [
  { value: "account",    label: "Account & Login" },
  { value: "payment",    label: "Payments" },
  { value: "other",      label: "General Enquiry" },
];

/* NOTE: statusCfg() previously lived in this file (SupportWidget.jsx) but
 * was never actually called anywhere in it — dead code, dropped during the
 * split. Live versions of the same helper (with the same status-badge
 * pattern) exist in app/support/page.jsx and app/dashboard/page.jsx; worth
 * consolidating into one shared util at some point rather than three
 * near-duplicate copies. */

export const inputClass =
  "w-full bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/20 " +
  "rounded-xl px-3.5 py-3 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-1 " +
  "focus:ring-amber-500/20 transition-all";

export const selectClass = inputClass + " appearance-none cursor-pointer";

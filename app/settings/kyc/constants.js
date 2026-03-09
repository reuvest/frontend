// ─── Step labels ──────────────────────────────────────────────────────────────
export const STEPS = ["Personal", "Address", "Identity", "Docs", "Liveness", "Review"];

// ─── ID types ─────────────────────────────────────────────────────────────────
export const ID_TYPES = [
  { value: "nin",             label: "National Identity Number (NIN)", numericOnly: true,  maxLen: 11 },
  { value: "drivers_license", label: "Driver's License",               numericOnly: false, maxLen: 20 },
  { value: "voters_card",     label: "Voter's Card",                   numericOnly: false, maxLen: 20 },
  { value: "passport",        label: "International Passport",         numericOnly: false, maxLen: 9  },
  { value: "bvn",             label: "Bank Verification Number (BVN)", numericOnly: true,  maxLen: 11 },
];

// ─── Nigerian states ──────────────────────────────────────────────────────────
export const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo",
  "Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa",
  "Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba",
  "Yobe","Zamfara",
];

// ─── Liveness prompts ─────────────────────────────────────────────────────────
export const LIVENESS_PROMPTS = [
  { text: "Blink slowly twice",   icon: "eye",   duration: 8 },
  { text: "Smile naturally",      icon: "smile", duration: 8 },
  { text: "Turn your head left",  icon: "left",  duration: 8 },
  { text: "Turn your head right", icon: "right", duration: 8 },
  { text: "Nod your head gently", icon: "nod",   duration: 8 },
];

// ─── Liveness detection tuning ────────────────────────────────────────────────
export const MOTION_THRESHOLDS      = { eye: 0.014, smile: 0.012, left: 0.026, right: 0.026, nod: 0.020 };
export const SAMPLE_W               = 80;
export const SAMPLE_H               = 60;
export const EMA_ALPHA              = 0.30;
export const CONFIRM_FRAMES         = 5;
export const BLIND_FRAMES           = 30;
export const STILLNESS_THRESHOLD    = 0.006;
export const STILL_CONFIRM_FRAMES   = 18;
export const MAX_RETRIES_PER_PROMPT = 2;
export const COUNTDOWN_SECS        = 10;

// ─── Shared Tailwind class strings ───────────────────────────────────────────
export const inputCls =
  "w-full bg-white/5 border border-white/10 hover:border-white/20 text-white placeholder-white/20 " +
  "rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 " +
  "focus:ring-amber-500/20 transition-all";

export const selectCls = inputCls + " appearance-none cursor-pointer";

// ─── Step-transition animation preset ────────────────────────────────────────
export const stepAnim = {
  initial:    { opacity: 0, x: 18 },
  animate:    { opacity: 1, x: 0  },
  exit:       { opacity: 0, x: -18 },
  transition: { duration: 0.22 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const formatDateDisplay = (iso) => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};
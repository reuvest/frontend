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
// These are all consumed by LivenessCheck.jsx — do not remove.
export const SAMPLE_W               = 80;
export const SAMPLE_H               = 60;

// EMA smoothing factor for motion signal (0–1; lower = smoother but slower).
export const EMA_ALPHA              = 0.25;

// How many accumulated above-threshold frames confirm a deliberate action.
export const ACCUMULATOR_NEED       = 8;

// Per-frame decay applied to the accumulator when motion drops below threshold.
export const ACCUMULATOR_DECAY      = 1.2;

// Minimum number of *consecutive* above-threshold frames required before the
// accumulator total is even considered. Prevents a single fast spike (jolt,
// head-shake, sitting down) from instantly filling the accumulator.
export const MIN_SUSTAIN_FRAMES     = 4;

// If the peak EMA during a detection window exceeds this many × the threshold,
// AND the above-threshold run lasted fewer than MIN_SUSTAIN_FRAMES frames, the
// burst is classified as a jolt and the accumulator is reset to zero.
export const JOLT_PEAK_MULTIPLIER   = 3.5;

// EMA alpha used during the active detection phase (after baseline). Lower than
// the baseline alpha so the smoothed signal is less reactive to single-frame
// jolts while still tracking genuine deliberate motion.
export const DETECTION_EMA_ALPHA    = 0.18;

// Number of frames sampled during warmup to learn the user's idle noise floor.
export const BASELINE_FRAMES        = 40;

// Multiplier over the idle baseline that counts as a "deliberate action".
// Keyed by prompt icon; _default used when no specific entry exists.
export const ACTION_MULTIPLIER      = {
  eye: 2.2, smile: 2.0, left: 2.8, right: 2.8, nod: 2.4, _default: 2.5,
};

// Minimum mean brightness (0–255) — below this the camera is dark/covered.
export const MIN_BRIGHTNESS         = 20;

// Maximum retries allowed per prompt before the check hard-fails.
export const MAX_RETRIES_PER_PROMPT = 2;

// Base countdown in seconds; LivenessCheck adds COUNTDOWN_BONUS on top.
export const COUNTDOWN_SECS        = 10;

// Extra seconds added to every countdown (effective = COUNTDOWN_SECS + this).
export const COUNTDOWN_BONUS        = 5;

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
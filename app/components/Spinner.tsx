// Shared loading-spinner primitive.

type SpinnerSize = "xs" | "sm" | "md" | "lg";
type SpinnerColor = "amber" | "red" | "purple" | "cyan" | "emerald" | "blue" | "white";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
  xs: "w-3 h-3 border",
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-10 h-10 border-2",
};

const COLOR_CLASSES: Record<SpinnerColor, string> = {
  amber:   "border-amber-500 border-t-transparent",
  red:     "border-red-400 border-t-transparent",
  purple:  "border-purple-400 border-t-transparent",
  cyan:    "border-cyan-400 border-t-transparent",
  emerald: "border-emerald-400 border-t-transparent",
  blue:    "border-blue-400 border-t-transparent",
  white:   "border-white/30 border-t-white",
};

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

/** Bare spinning ring — drop inline anywhere (buttons, table cells, etc). */
export function Spinner({ size = "md", color = "amber", className = "" }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} rounded-full animate-spin ${className}`}
    />
  );
}

interface PageSpinnerProps {
  color?: SpinnerColor;
  label?: string;
  /** Fill the full viewport (top-level page loading state) vs. just its container. */
  fullScreen?: boolean;
}

/** Centered page/section loading state — the `min-h-screen` / `py-24` wrapper pattern. */
export function PageSpinner({ color = "amber", label, fullScreen = false }: PageSpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center ${fullScreen ? "min-h-screen bg-[#0D1F1A]" : "py-24"}`}
      style={fullScreen ? { fontFamily: "var(--font-dm-sans), 'Helvetica Neue', sans-serif" } : undefined}
    >
      {label ? (
        <div className="text-center">
          <Spinner size="lg" color={color} className="mx-auto mb-4" />
          <p className="text-white/60 text-sm">{label}</p>
        </div>
      ) : (
        <Spinner size="md" color={color} />
      )}
    </div>
  );
}

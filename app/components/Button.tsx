import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

/**
 * Button
 *
 * Variants:
 *   primary  — amber gradient, dark text (CTA)
 *   secondary — bordered amber, transparent bg
 *   danger   — red border/bg, for destructive actions
 *   ghost    — no border, subtle hover
 */
export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes: Record<ButtonSize, string> = {
    sm: "px-4 py-2 text-xs",
    md: "px-5 py-3 text-sm",
    lg: "px-7 py-4 text-base",
  };

  const variants: Record<ButtonVariant, string> = {
    primary:   "text-[#0D1F1A] hover:scale-[1.02] active:scale-[0.98]",
    secondary: "text-amber-500 border border-amber-500/40 hover:border-amber-500/70 hover:bg-amber-500/10",
    danger:    "text-red-400 border border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10",
    // Fixed a malformed arbitrary-value class here: "hover:bg-white/10"
    // had a stray trailing "0" that made it an invalid Tailwind class (JIT
    // silently generates nothing for it, so the hover state never applied).
    ghost:     "text-white/50 hover:text-white hover:bg-white/2",
  };

  const primaryStyle =
    variant === "primary"
      ? { background: "linear-gradient(135deg, #C8873A, #E8A850)" }
      : undefined;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={primaryStyle}
      className={cn(base, sizes[size] ?? sizes.md, variants[variant] ?? variants.ghost, className)}
      {...props}
    >
      {loading ? (
        <>
          <div
            className={cn(
              "w-4 h-4 border-2 rounded-full animate-spin",
              variant === "primary"
                ? "border-[#0D1F1A]/30 border-t-[#0D1F1A]"
                : "border-white/20 border-t-white/70"
            )}
          />
          Loading...
        </>
      ) : children}
    </button>
  );
}
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge className fragments, resolving conflicting Tailwind utility classes
 * (e.g. `cn("px-2", condition && "px-4")` correctly keeps only "px-4",
 * where naive string concatenation would emit both and let CSS source
 * order decide the winner — usually the wrong one).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

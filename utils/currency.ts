/**
 * Currency helpers — single source of truth for Kobo ↔ Naira conversions.
 * Import from here instead of redefining per-file.
 */

/** Convert kobo (integer) to naira (float) */
export const koboToNaira = (kobo: number | string): number => Number(kobo) / 100;

/** Convert naira (float) to kobo (integer) */
export const nairaToKobo = (naira: number | string): number => Math.round(Number(naira) * 100);

/**
 * Format kobo value as a Nigerian Naira currency string.
 * e.g. 500000 → "₦5,000.00"
 */
export const formatNaira = (kobo: number | string): string =>
  koboToNaira(kobo).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Format a naira value (already divided) as currency string.
 * e.g. 5000 → "₦5,000.00"
 */
export const formatNairaValue = (naira: number | string | null | undefined): string =>
  Number(naira || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Short-form currency for dashboard stat cards.
 * e.g. 1500000 → "₦1.5M", 50000 → "₦50K"
 */
export const formatNairaShort = (naira: number | string | null | undefined): string => {
  const num = Number(naira ?? 0);
  if (num >= 1_000_000) return `₦${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `₦${(num / 1_000).toFixed(1)}K`;
  return `₦${num.toLocaleString()}`;
};
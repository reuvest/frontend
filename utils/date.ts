import { format, formatDistanceToNow, isValid } from "date-fns";

/**
 * Centralized date formatting — see todo doc item #10. Portfolio charts,
 * transaction history, KYC timestamps, and notifications were each calling
 * `new Date(x).toLocaleString(...)` / `toLocaleDateString(...)` with
 * slightly different, hand-rolled options. Import from here instead.
 *
 * All functions accept a Date, ISO string, or epoch number, and return
 * "—" for anything unparseable rather than throwing or rendering
 * "Invalid Date" in the UI.
 */

type DateInput = Date | string | number | null | undefined;

function toDate(value: DateInput): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return isValid(d) ? d : null;
}

/** e.g. "12 Aug 2026" */
export function formatDate(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yyyy") : "—";
}

/** e.g. "12 Aug 2026, 3:45 PM" */
export function formatDateTime(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, "d MMM yyyy, h:mm a") : "—";
}

/** e.g. "3:45 PM" */
export function formatTime(value: DateInput): string {
  const d = toDate(value);
  return d ? format(d, "h:mm a") : "—";
}

/** e.g. "2 hours ago", "3 days ago" — best for notifications/activity feeds. */
export function formatTimeAgo(value: DateInput): string {
  const d = toDate(value);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}
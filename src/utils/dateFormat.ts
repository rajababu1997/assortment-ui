/**
 * Centralized date utilities — powered by date-fns.
 *
 * All date formatting/parsing across the app should use these functions.
 * Tree-shakeable: only imported functions ship in the bundle.
 */

import {
  format,
  formatDistanceToNow,
  startOfDay,
  endOfDay,
  isValid,
  parseISO,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from 'date-fns';

// ── Parse helpers ────────────────────────────────────────────────────────────

/** Safely parse any date input (timestamp, ISO string, Date) into a valid Date or null. */
function toDate(value?: string | number | Date | null): Date | null {
  if (value == null || value === '') return null;
  const d = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
}

// ── Formatters ───────────────────────────────────────────────────────────────

/**
 * Full date-time: "12 Mar 2026, 11:25 AM"
 * Matches Angular tpsDateTime pipe (TPS_DATETIME_FORMAT = 'dd MMM yyyy, hh:mm a').
 * Used in tables, detail views, created/modified columns, kanban cards, mailbox.
 */
export function formatDateTime(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'dd MMM yyyy, hh:mm a');
}

/**
 * Short date: "Mar 19, 2026"
 * Used in cards, summaries.
 */
export function formatDate(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'MMM dd, yyyy');
}

/**
 * Time only: "04:30 PM"
 */
export function formatTime(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'hh:mm a');
}

/**
 * Relative time: "3m", "2h", "5d", "Mar 19"
 * Used in inbox/task cards for compact timestamps.
 */
export function formatRelativeTime(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '';
  const now = new Date();
  const mins = differenceInMinutes(now, d);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = differenceInHours(now, d);
  if (hrs < 24) return `${hrs}h`;
  const days = differenceInDays(now, d);
  if (days < 7) return `${days}d`;
  return format(d, 'MMM dd');
}

/**
 * Human-readable relative: "3 hours ago", "about 2 days ago"
 * Used in detail dialogs, comment timestamps.
 */
export function formatTimeAgo(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Comment timestamp: "Mar 19, 04:30 PM"
 * Short format for comment lists.
 */
export function formatCommentTime(value?: string | number | Date | null): string {
  const d = toDate(value);
  if (!d) return '';
  return format(d, 'MMM dd, hh:mm a');
}

// ── Epoch helpers (for API params) ───────────────────────────────────────────

/** Start of day as epoch ms — for API `from` params. */
export function toStartOfDayMs(value: string | number | Date): number {
  return startOfDay(new Date(value)).getTime();
}

/** End of day as epoch ms — for API `to` params. */
export function toEndOfDayMs(value: string | number | Date): number {
  return endOfDay(new Date(value)).getTime();
}

// ── Custom format (escape hatch) ─────────────────────────────────────────────

/**
 * Format with any date-fns pattern string.
 * @see https://date-fns.org/docs/format
 */
export function formatCustom(value: string | number | Date | null | undefined, pattern: string): string {
  const d = toDate(value);
  if (!d) return '';
  return format(d, pattern);
}

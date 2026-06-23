/**
 * Helpers for binding `Date` state to native `<input type="date|datetime-local|time">`.
 *
 * Native date inputs work in **local-time strings**, never `Date` objects:
 *   - `type="date"`           → "YYYY-MM-DD"
 *   - `type="datetime-local"` → "YYYY-MM-DDTHH:mm"
 *   - `type="time"`           → "HH:mm"
 *
 * `Date.toISOString()` returns UTC, which shifts the displayed value across
 * timezones — these helpers format/parse against the *local* timezone so what
 * the user sees in the picker matches the underlying `Date`.
 *
 * Used by every migrated form that previously rendered `primereact/calendar`.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → "YYYY-MM-DDTHH:mm" for `<input type="datetime-local">`. */
export function dateToLocalDateTimeInput(d: Date | null | undefined): string {
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Date → "YYYY-MM-DD" for `<input type="date">`. */
export function dateToLocalDateInput(d: Date | null | undefined): string {
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Date → "HH:mm" for `<input type="time">`. */
export function dateToLocalTimeInput(d: Date | null | undefined): string {
  if (!d) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parse a "YYYY-MM-DDTHH:mm" datetime-local string into a local Date. */
export function localDateTimeInputToDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse a "YYYY-MM-DD" date string into a local Date at midnight. */
export function localDateInputToDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, day] = s.split('-').map(Number);
  if (!y || !m || !day) return null;
  const d = new Date(y, m - 1, day);
  return isNaN(d.getTime()) ? null : d;
}

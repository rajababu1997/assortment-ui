/**
 * Human-readable age strings for WIP item cards.
 *
 *   < 1 min   → "just now"
 *   < 1 hour  → "Nm ago"
 *   < 1 day   → "Nh ago"
 *   else      → "Nd ago"
 */
export function fmtAge(timestampMs: number | undefined, nowMs = Date.now()): string {
  if (!timestampMs || timestampMs <= 0) return '—';
  const delta = nowMs - timestampMs;
  if (delta < 60_000) return 'just now';
  if (delta < 60 * 60_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 24 * 60 * 60_000) return `${Math.floor(delta / (60 * 60_000))}h ago`;
  return `${Math.floor(delta / (24 * 60 * 60_000))}d ago`;
}

/** Days-old as an integer; used by the "stuck > 3 days" flag. */
export function daysOld(timestampMs: number | undefined, nowMs = Date.now()): number {
  if (!timestampMs || timestampMs <= 0) return 0;
  return Math.floor((nowMs - timestampMs) / (24 * 60 * 60_000));
}

/**
 * Demo clock. Returns the operator-selected "today" so the OTB demo can
 * be shown for any target date. Falls back to Feb 15, 2026 if nothing has
 * been persisted yet. Use Date.now() directly for audit timestamps —
 * those should advance with the real wall clock.
 *
 * For React components, prefer `useDemoToday()` from `hooks/useDemoClock`
 * so the component re-renders when the operator changes the date.
 */

const DEFAULT_TODAY = new Date('2026-02-15T09:00:00').getTime();
const STORAGE_KEY = 'demo_clock_today_ms';

function read(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      if (Number.isFinite(n)) return n;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_TODAY;
}

export const clock = {
  now(): number {
    return read();
  },
  today(): Date {
    return new Date(read());
  },
};

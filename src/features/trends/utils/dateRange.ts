/**
 * Compute the two 12-month windows (TY + LY) from the demo clock. Both are
 * anchored to the end of `demoToday`'s month so all monthly buckets align.
 */

export interface YearWindow {
  from: string; // YYYY-MM inclusive
  to: string;   // YYYY-MM inclusive
}

export interface DualWindow {
  ty: YearWindow;
  ly: YearWindow;
}

const pad = (n: number): string => String(n).padStart(2, '0');

const shift = (year: number, month0: number, deltaMonths: number): { year: number; month0: number } => {
  const total = year * 12 + month0 + deltaMonths;
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 };
};

const asKey = (year: number, month0: number): string => `${year}-${pad(month0 + 1)}`;

export function computeDualWindow(demoTodayMs: number): DualWindow {
  const d = new Date(demoTodayMs);
  const y = d.getFullYear();
  const m0 = d.getMonth();

  const tyStart = shift(y, m0, -11);
  const lyEnd = shift(y, m0, -12);
  const lyStart = shift(y, m0, -23);

  return {
    ty: { from: asKey(tyStart.year, tyStart.month0), to: asKey(y, m0) },
    ly: { from: asKey(lyStart.year, lyStart.month0), to: asKey(lyEnd.year, lyEnd.month0) },
  };
}

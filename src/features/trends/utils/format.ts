export const fmtMoney = (v: number): string =>
  `₹${Math.round(v).toLocaleString('en-IN')}`;

export const fmtUnits = (v: number): string =>
  Math.round(v).toLocaleString('en-IN');

export const fmtPct = (v: number, digits = 1): string =>
  `${(v ?? 0).toFixed(digits)}%`;

export const fmtSignedPct = (v: number, digits = 1): string => {
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(digits)}%`;
};

/** Divide safely; returns 0 when denominator is 0. */
export const safeDiv = (n: number, d: number): number => (d > 0 ? n / d : 0);

/** ((current − prior) / prior) × 100; 0 when prior is 0. */
export const growthPct = (current: number, prior: number): number =>
  prior > 0 ? ((current - prior) / prior) * 100 : 0;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const monthLabel = (periodKey: string): string => {
  const m = parseInt(periodKey.slice(5, 7), 10) - 1;
  return MONTHS[m] ?? periodKey;
};

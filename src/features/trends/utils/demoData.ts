/**
 * Hard-coded Tier-3 dummies for the tabs / cards where the sales aggregate
 * doesn't yet carry the attribute (Color, Size, Store, Forecast). Numbers
 * are hand-picked to be plausible next to the real KPI data.
 */

export interface DummyColorRow {
  color: string;
  swatch: string;
  salesPct: number;
  growthVsLy: number;
  recommendation: 'Increase' | 'Maintain' | 'Reduce' | null;
}

export const DUMMY_COLORS: DummyColorRow[] = [
  { color: 'Black',      swatch: '#111827', salesPct: 21, growthVsLy: 18, recommendation: 'Increase' },
  { color: 'White',      swatch: '#f9fafb', salesPct: 18, growthVsLy: 12, recommendation: 'Increase' },
  { color: 'Navy',       swatch: '#1e3a8a', salesPct: 10, growthVsLy: 5,  recommendation: 'Maintain' },
  { color: 'Sage Green', swatch: '#84a98c', salesPct: 8,  growthVsLy: 28, recommendation: 'Increase' },
  { color: 'Beige',      swatch: '#d6c9b1', salesPct: 7,  growthVsLy: -3, recommendation: 'Maintain' },
  { color: 'Grey',       swatch: '#6b7280', salesPct: 6,  growthVsLy: 2,  recommendation: 'Maintain' },
  { color: 'Others',     swatch: '#e5e7eb', salesPct: 30, growthVsLy: 0,  recommendation: null },
];

export interface DummySizeRow {
  size: string;
  salesPct: number;
  strPct: number;
  returnsPct: number;
  recommendation: 'Increase' | 'Maintain' | 'Reduce Slightly' | 'Reduce' | null;
}

export const DUMMY_SIZES: DummySizeRow[] = [
  { size: 'XS',  salesPct: 7,  strPct: 88, returnsPct: 4.1, recommendation: 'Maintain' },
  { size: 'S',   salesPct: 22, strPct: 91, returnsPct: 3.2, recommendation: 'Increase' },
  { size: 'M',   salesPct: 34, strPct: 95, returnsPct: 2.6, recommendation: 'Increase' },
  { size: 'L',   salesPct: 20, strPct: 84, returnsPct: 3.7, recommendation: 'Maintain' },
  { size: 'XL',  salesPct: 11, strPct: 76, returnsPct: 5.0, recommendation: 'Reduce Slightly' },
  { size: 'XXL', salesPct: 6,  strPct: 61, returnsPct: 7.2, recommendation: 'Reduce' },
];

/**
 * Forecast series for the Sales Trend chart. Extends the TY line by N
 * months at a mild growth rate. Deterministic — same demo clock = same
 * forecast, no jitter that would confuse a returning viewer.
 */
export function forecastNextMonths(
  lastValue: number,
  monthsAhead: number,
  growthPerMonth = 0.02,
): number[] {
  const out: number[] = [];
  let v = lastValue;
  for (let i = 0; i < monthsAhead; i += 1) {
    v = v * (1 + growthPerMonth);
    out.push(v);
  }
  return out;
}

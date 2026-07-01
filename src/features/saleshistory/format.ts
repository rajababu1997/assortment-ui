/**
 * Number / period formatting helpers shared across every dashboard section.
 * Kept tiny + dependency-free.
 */

/** ₹1.2 Cr / ₹3.5 L / ₹4.2K / ₹420 — fashion industry shorthand. */
export function fmtMoneyCompact(value: number, currency = 'INR'): string {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : '';
  const abs = Math.abs(value);
  let body: string;
  if (abs >= 1_00_00_000) body = `${(value / 1_00_00_000).toFixed(2)} Cr`;
  else if (abs >= 1_00_000) body = `${(value / 1_00_000).toFixed(2)} L`;
  else if (abs >= 1_000) body = `${(value / 1_000).toFixed(1)}K`;
  else body = `${value.toFixed(0)}`;
  return `${symbol}${body}`;
}

/** 4,250,000 — plain unit count. */
export function fmtUnits(value: number): string {
  return Math.round(value).toLocaleString('en-IN');
}

/** 72.1% with one decimal. */
export function fmtPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Signed pct delta — "+12.3%" or "-4.1%". */
export function fmtDelta(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/** % change between current and prior. Returns 0 if prior is 0 to avoid Infinity. */
export function pctChange(current: number, prior: number): number {
  if (!prior) return 0;
  return ((current - prior) / prior) * 100;
}

/** Absolute (percentage-point) delta — for ratio metrics where pct-of-pct is wrong. */
export function ppDelta(current: number, prior: number): number {
  return current - prior;
}

/** Human "Jan 2025 → Dec 2025" from two YYYY-MM strings. */
export function fmtPeriodRange(from: string, to: string): string {
  if (from === to) return monthLabel(from);
  return `${monthLabel(from)} → ${monthLabel(to)}`;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function monthLabel(periodKey: string): string {
  const m = parseInt(periodKey.slice(5, 7), 10) - 1;
  const y = periodKey.slice(0, 4);
  return `${MONTHS[m]} ${y}`;
}

/** Direction for a delta — positive is "up", but the polarity (good vs bad)
 *  depends on the metric. STR↑ good, markdown↑ bad. */
export type DeltaPolarity = 'higher-better' | 'lower-better' | 'neutral';

export function deltaTone(delta: number, polarity: DeltaPolarity): 'good' | 'bad' | 'neutral' {
  if (Math.abs(delta) < 0.5) return 'neutral'; // ignore noise
  if (polarity === 'neutral') return 'neutral';
  if (polarity === 'higher-better') return delta > 0 ? 'good' : 'bad';
  return delta < 0 ? 'good' : 'bad';
}

/**
 * Demo historical sales dataset — 36 months × brand × category.
 *
 * Built from a deterministic seasonality curve + a tiny pseudo-random
 * noise function so the numbers are stable across renders and tabs but
 * look organic.
 *
 * Replaced in production by a real /api/v1/history?from=...&to=... feed.
 */

import { SEED_BRANDS, SEED_CATEGORIES } from './brands';

const MONTH_SEASONALITY = [
  0.85, 0.80, 0.90, 0.95, 0.95, 1.00, // Jan–Jun
  1.05, 1.05, 1.10, 1.30, 1.25, 1.20, // Jul–Dec (festive ramp)
];

const BRAND_BASE_INDEX: Record<string, number> = {
  'brand-a': 1.0,   // mid-volume
  'brand-b': 0.85,  // mid
  'brand-c': 0.55,  // premium, smaller
};

const CATEGORY_BASE_INDEX: Record<string, number> = {
  'cat-a-tops': 1.40,
  'cat-a-shirts': 1.00,
  'cat-a-dresses': 0.90,
  'cat-b-sports': 0.60,
  'cat-b-casual': 1.20,
  'cat-b-formal': 0.40,
  'cat-c-premium': 0.50,
  'cat-c-luxury': 0.30,
};

const YOY_GROWTH = 0.05; // 5%/year baseline trend

const BASE_MONTH_REVENUE = 8_500_000; // ₹85L baseline mid-month, mid-category

/** Cheap deterministic noise from a string key. Returns a number in [-1, 1]. */
function noise(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (((hash >>> 0) % 10000) / 10000) * 2 - 1;
}

export interface HistoryRow {
  brand_uuid: string;
  category_uuid: string;
  year: number;
  month: number; // 0-indexed
  net_sales: number;       // post-returns
  units_sold: number;
  markdown_amount: number;
  gross_margin_pct: number; // 0-100
  sell_through_pct: number; // 0-100
  returns_pct: number;      // 0-100
  stockout_days: number;
  forecast_error_pct: number; // signed; -ve = sales missed forecast
}

const ALL_ROWS: HistoryRow[] = generateAll();

function generateAll(): HistoryRow[] {
  const out: HistoryRow[] = [];
  const startYear = 2023;
  const monthsToGenerate = 36; // Jan 2023 → Dec 2025
  for (const cat of SEED_CATEGORIES) {
    if (!SEED_BRANDS.some((b) => b.uuid === cat.brand_uuid)) continue;
    const brandIdx = BRAND_BASE_INDEX[cat.brand_uuid] ?? 0.8;
    const catIdx = CATEGORY_BASE_INDEX[cat.uuid] ?? 0.7;

    for (let i = 0; i < monthsToGenerate; i++) {
      const year = startYear + Math.floor(i / 12);
      const month = i % 12;
      const yearsSinceStart = year - startYear;
      const seasonal = MONTH_SEASONALITY[month];
      const yoy = Math.pow(1 + YOY_GROWTH, yearsSinceStart);
      const seedKey = `${cat.brand_uuid}-${cat.uuid}-${year}-${month}`;
      const wobble = 1 + noise(seedKey + 'sales') * 0.12; // ±12%
      const net_sales = Math.round(
        BASE_MONTH_REVENUE * brandIdx * catIdx * seasonal * yoy * wobble,
      );
      const aur = 600 + (catIdx * 250) + noise(seedKey + 'aur') * 80;
      const units_sold = Math.max(50, Math.round(net_sales / aur));
      const markdown_pct = 12 + noise(seedKey + 'md') * 5; // 7–17%
      const markdown_amount = Math.round((net_sales * markdown_pct) / 100);
      const sell_through_pct = clamp(72 + noise(seedKey + 'st') * 14, 45, 95);
      const gross_margin_pct = clamp(34 + noise(seedKey + 'gm') * 6, 22, 44);
      const returns_pct = clamp(5 + noise(seedKey + 'ret') * 3, 2, 11);
      const stockout_days = Math.max(0, Math.round(2 + noise(seedKey + 'so') * 5));
      const forecast_error_pct = clamp(noise(seedKey + 'fc') * 9, -12, 12);

      out.push({
        brand_uuid: cat.brand_uuid,
        category_uuid: cat.uuid,
        year,
        month,
        net_sales,
        units_sold,
        markdown_amount,
        gross_margin_pct: round1(gross_margin_pct),
        sell_through_pct: round1(sell_through_pct),
        returns_pct: round1(returns_pct),
        stockout_days,
        forecast_error_pct: round1(forecast_error_pct),
      });
    }
  }
  return out;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ── Query helpers ────────────────────────────────────────────────────────

export function getMonthOf(brandUuid: string, categoryUuid: string, year: number, month: number): HistoryRow | null {
  return (
    ALL_ROWS.find(
      (r) =>
        r.brand_uuid === brandUuid &&
        r.category_uuid === categoryUuid &&
        r.year === year &&
        r.month === month,
    ) ?? null
  );
}

export function getCategoryMonthSeries(
  brandUuid: string,
  categoryUuid: string,
): HistoryRow[] {
  return ALL_ROWS.filter(
    (r) => r.brand_uuid === brandUuid && r.category_uuid === categoryUuid,
  ).sort((a, b) => a.year - b.year || a.month - b.month);
}

export function getBrandMonthSeries(brandUuid: string): HistoryRow[] {
  return ALL_ROWS.filter((r) => r.brand_uuid === brandUuid).sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
}

export interface PeriodAggregate {
  net_sales: number;
  units_sold: number;
  markdown_amount: number;
  markdown_pct: number;
  gross_margin_pct: number;
  sell_through_pct: number;
  returns_pct: number;
  stockout_days_avg: number;
  forecast_error_pct: number;
  sample_count: number;
}

export function aggregateMonth(rows: HistoryRow[]): PeriodAggregate {
  if (rows.length === 0) {
    return {
      net_sales: 0,
      units_sold: 0,
      markdown_amount: 0,
      markdown_pct: 0,
      gross_margin_pct: 0,
      sell_through_pct: 0,
      returns_pct: 0,
      stockout_days_avg: 0,
      forecast_error_pct: 0,
      sample_count: 0,
    };
  }
  const net_sales = rows.reduce((s, r) => s + r.net_sales, 0);
  const units_sold = rows.reduce((s, r) => s + r.units_sold, 0);
  const markdown_amount = rows.reduce((s, r) => s + r.markdown_amount, 0);
  const markdown_pct = net_sales > 0 ? (markdown_amount / net_sales) * 100 : 0;
  const avg = (key: keyof HistoryRow) =>
    rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length;
  return {
    net_sales,
    units_sold,
    markdown_amount,
    markdown_pct: round1(markdown_pct),
    gross_margin_pct: round1(avg('gross_margin_pct')),
    sell_through_pct: round1(avg('sell_through_pct')),
    returns_pct: round1(avg('returns_pct')),
    stockout_days_avg: round1(avg('stockout_days')),
    forecast_error_pct: round1(avg('forecast_error_pct')),
    sample_count: rows.length,
  };
}

interface LookupInput {
  year: number;
  month: number;
  brand_uuids?: string[];
  category_uuids?: string[];
}

/**
 * Returns rows that match the filters for a single (year, month).
 * If filters are empty, returns every row for that month.
 */
export function findRowsForMonth(input: LookupInput): HistoryRow[] {
  return ALL_ROWS.filter((r) => {
    if (r.year !== input.year || r.month !== input.month) return false;
    if (input.brand_uuids?.length && !input.brand_uuids.includes(r.brand_uuid))
      return false;
    if (
      input.category_uuids?.length &&
      !input.category_uuids.includes(r.category_uuid)
    )
      return false;
    return true;
  });
}

export function findRowsRange(
  fromYear: number,
  fromMonth: number,
  toYear: number,
  toMonth: number,
  brandUuids?: string[],
  categoryUuids?: string[],
): HistoryRow[] {
  const from = fromYear * 12 + fromMonth;
  const to = toYear * 12 + toMonth;
  return ALL_ROWS.filter((r) => {
    const idx = r.year * 12 + r.month;
    if (idx < from || idx > to) return false;
    if (brandUuids?.length && !brandUuids.includes(r.brand_uuid)) return false;
    if (categoryUuids?.length && !categoryUuids.includes(r.category_uuid))
      return false;
    return true;
  });
}

/** Best & worst sellers in a single month, ranked by net_sales. */
export function topBottomSellers(
  year: number,
  month: number,
  count = 5,
): { winners: HistoryRow[]; losers: HistoryRow[] } {
  const rows = findRowsForMonth({ year, month });
  const sorted = [...rows].sort((a, b) => b.net_sales - a.net_sales);
  return {
    winners: sorted.slice(0, count),
    losers: sorted.slice(-count).reverse(),
  };
}

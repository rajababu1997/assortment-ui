/**
 * Demo historical sales dataset with sub-dimensional slices.
 *
 * One row = (brand, category, year, month). The row carries totals plus
 * weighted distributions over MRP, cost, fit, size, color, print, fabric,
 * vendor, and cluster. Each weighted distribution sums to ≈ 1.0 and is
 * applied multiplicatively to net_sales when aggregated.
 *
 * The numbers are generated from a deterministic seasonality curve + a
 * small noise function so they're stable across renders.
 */

import { SEED_BRANDS, SEED_CATEGORIES } from '@/features/otb/mockData/brands';
import {
  CLUSTERS,
  COLORS,
  COST_BANDS,
  FABRICS,
  FITS,
  MRP_BANDS,
  PRINTS,
  SIZES,
  VENDORS,
} from './dimensions';

const MONTH_SEASONALITY = [
  0.85, 0.80, 0.90, 0.95, 0.95, 1.00,
  1.05, 1.05, 1.10, 1.30, 1.25, 1.20,
];

const BRAND_BASE_INDEX: Record<string, number> = {
  'brand-a': 1.0,
  'brand-b': 0.85,
  'brand-c': 0.55,
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

const YOY_GROWTH = 0.05;
const BASE_MONTH_REVENUE = 8_500_000;

function noise(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (((hash >>> 0) % 10000) / 10000) * 2 - 1;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

/**
 * Returns a normalized weight distribution for an array of keys, seeded so
 * the same key gets the same weight every call.
 */
function weightedDist(keys: string[], seed: string, bias?: Record<string, number>): Record<string, number> {
  const raw = keys.map((k) => {
    const base = bias?.[k] ?? 1;
    return Math.max(0.05, base + noise(`${seed}-${k}`) * 0.35);
  });
  const sum = raw.reduce((s, v) => s + v, 0);
  const out: Record<string, number> = {};
  keys.forEach((k, i) => {
    out[k] = raw[i] / sum;
  });
  return out;
}

export interface HistoryDimensionMetrics {
  share: number;            // 0–1 share of period sales
  sell_through_pct: number; // 0–100
  gross_margin_pct: number; // 0–100
  markdown_pct: number;     // 0–100
  returns_pct: number;      // 0–100
}

export interface HistoryRow {
  brand_uuid: string;
  category_uuid: string;
  year: number;
  month: number;
  net_sales: number;
  units_sold: number;
  markdown_amount: number;
  markdown_pct: number;
  gross_margin_pct: number;
  sell_through_pct: number;
  returns_pct: number;
  stockout_days: number;
  forecast_error_pct: number;

  mrp: Record<string, HistoryDimensionMetrics>;
  cost: Record<string, HistoryDimensionMetrics>;
  fit: Record<string, HistoryDimensionMetrics>;
  size: Record<string, HistoryDimensionMetrics>;
  color: Record<string, HistoryDimensionMetrics>;
  print: Record<string, HistoryDimensionMetrics>;
  fabric: Record<string, HistoryDimensionMetrics>;
  vendor: Record<string, HistoryDimensionMetrics>;
  cluster: Record<string, HistoryDimensionMetrics>;
}

function buildDimension(
  keys: string[],
  seed: string,
  baseSellThrough: number,
  baseGm: number,
  baseMarkdown: number,
  baseReturns: number,
  bias?: Record<string, number>,
): Record<string, HistoryDimensionMetrics> {
  const shares = weightedDist(keys, seed, bias);
  const out: Record<string, HistoryDimensionMetrics> = {};
  keys.forEach((k) => {
    out[k] = {
      share: shares[k],
      sell_through_pct: clamp(baseSellThrough + noise(`${seed}-st-${k}`) * 12, 40, 95),
      gross_margin_pct: clamp(baseGm + noise(`${seed}-gm-${k}`) * 8, 20, 48),
      markdown_pct: clamp(baseMarkdown + noise(`${seed}-md-${k}`) * 6, 4, 25),
      returns_pct: clamp(baseReturns + noise(`${seed}-ret-${k}`) * 3, 2, 13),
    };
  });
  return out;
}

const ALL_ROWS: HistoryRow[] = generateAll();

function generateAll(): HistoryRow[] {
  const out: HistoryRow[] = [];
  const startYear = 2023;
  const monthsToGenerate = 36;
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
      const baseSeed = `${cat.brand_uuid}-${cat.uuid}-${year}-${month}`;
      const wobble = 1 + noise(baseSeed + 'sales') * 0.12;
      const net_sales = Math.round(BASE_MONTH_REVENUE * brandIdx * catIdx * seasonal * yoy * wobble);
      const aur = 600 + catIdx * 250 + noise(baseSeed + 'aur') * 80;
      const units_sold = Math.max(50, Math.round(net_sales / aur));
      const markdown_pct = round1(clamp(12 + noise(baseSeed + 'md') * 5, 5, 22));
      const markdown_amount = Math.round((net_sales * markdown_pct) / 100);
      const sell_through_pct = round1(clamp(72 + noise(baseSeed + 'st') * 14, 45, 95));
      const gross_margin_pct = round1(clamp(34 + noise(baseSeed + 'gm') * 6, 22, 44));
      const returns_pct = round1(clamp(5 + noise(baseSeed + 'ret') * 3, 2, 11));
      const stockout_days = Math.max(0, Math.round(2 + noise(baseSeed + 'so') * 5));
      const forecast_error_pct = round1(clamp(noise(baseSeed + 'fc') * 9, -12, 12));

      // Dimensions — bias some keys to make them feel realistic
      const mrpBias =
        catIdx >= 1.0
          ? { 'mrp-499-799': 1.2, 'mrp-799-999': 1.4, 'mrp-999-1499': 1.0, 'mrp-1499+': 0.6 }
          : { 'mrp-499-799': 0.5, 'mrp-799-999': 0.8, 'mrp-999-1499': 1.3, 'mrp-1499+': 1.5 };
      const fitBias = { slim: 0.85, regular: 1.4, oversized: 1.5, relaxed: 0.6 };
      const sizeBias = { xs: 0.4, s: 1.1, m: 1.7, l: 1.4, xl: 0.9, xxl: 0.6 };
      const colorBias: Record<string, number> = {
        navy: 1.3, sage: 1.2, 'off-white': 1.1, black: 1.0, 'pastel-pink': 0.9, 'denim-blue': 1.0,
        olive: 0.8, beige: 0.9, burgundy: 0.7, mustard: 0.5, red: 0.7, teal: 0.6,
      };
      const printBias = { solid: 1.6, striped: 1.0, floral: 0.9, 'tie-dye': 0.6, check: 0.8, graphic: 0.7 };
      const fabricBias = { 'cotton-100': 1.4, 'cotton-poly': 1.2, linen: 0.6, polyester: 1.0, viscose: 0.8 };
      const vendorBias = {
        'vendor-abc': 1.4, 'vendor-xyz': 1.2, 'vendor-lmn': 1.0, 'vendor-rst': 0.9,
        'vendor-jkl': 0.8, 'vendor-fgh': 0.7, 'vendor-tuv': 0.7, 'vendor-pqr': 0.5,
      };
      const clusterBias = { metro: 1.6, 'tier-2': 1.0, online: 1.2 };

      out.push({
        brand_uuid: cat.brand_uuid,
        category_uuid: cat.uuid,
        year, month,
        net_sales, units_sold, markdown_amount, markdown_pct,
        gross_margin_pct, sell_through_pct, returns_pct,
        stockout_days, forecast_error_pct,
        mrp: buildDimension(MRP_BANDS.map((d) => d.key), baseSeed + 'mrp', 72, 33, 13, 5, mrpBias),
        cost: buildDimension(COST_BANDS.map((d) => d.key), baseSeed + 'cost', 72, 33, 13, 5),
        fit: buildDimension(FITS.map((d) => d.key), baseSeed + 'fit', 72, 34, 12, 5, fitBias),
        size: buildDimension(SIZES.map((d) => d.key), baseSeed + 'size', 72, 33, 12, 5, sizeBias),
        color: buildDimension(COLORS.map((d) => d.key), baseSeed + 'color', 72, 34, 12, 5, colorBias),
        print: buildDimension(PRINTS.map((d) => d.key), baseSeed + 'print', 72, 33, 13, 5, printBias),
        fabric: buildDimension(FABRICS.map((d) => d.key), baseSeed + 'fabric', 72, 34, 12, 5, fabricBias),
        vendor: buildDimension(VENDORS.map((d) => d.key), baseSeed + 'vendor', 72, 33, 13, 5, vendorBias),
        cluster: buildDimension(CLUSTERS.map((d) => d.key), baseSeed + 'cluster', 72, 33, 13, 5, clusterBias),
      });
    }
  }
  return out;
}

// ── Query helpers ────────────────────────────────────────────────────────

export const HISTORY_YEARS = Array.from(
  new Set(ALL_ROWS.map((r) => r.year)),
).sort((a, b) => a - b);

export const HISTORY_MIN_YEAR = HISTORY_YEARS[0];
export const HISTORY_MAX_YEAR = HISTORY_YEARS[HISTORY_YEARS.length - 1];

export interface QueryInput {
  yearFrom: number;
  monthFrom: number;
  yearTo: number;
  monthTo: number;
  brand_uuids?: string[];
  category_uuids?: string[];
  cluster_keys?: string[];
}

export function queryRows(input: QueryInput): HistoryRow[] {
  const from = input.yearFrom * 12 + input.monthFrom;
  const to = input.yearTo * 12 + input.monthTo;
  return ALL_ROWS.filter((r) => {
    const idx = r.year * 12 + r.month;
    if (idx < from || idx > to) return false;
    if (input.brand_uuids?.length && !input.brand_uuids.includes(r.brand_uuid)) return false;
    if (input.category_uuids?.length && !input.category_uuids.includes(r.category_uuid)) return false;
    return true;
  });
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

export function aggregateTotals(rows: HistoryRow[]): PeriodAggregate {
  if (rows.length === 0) {
    return {
      net_sales: 0, units_sold: 0, markdown_amount: 0, markdown_pct: 0,
      gross_margin_pct: 0, sell_through_pct: 0, returns_pct: 0,
      stockout_days_avg: 0, forecast_error_pct: 0, sample_count: 0,
    };
  }
  const totalSales = rows.reduce((s, r) => s + r.net_sales, 0);
  const totalUnits = rows.reduce((s, r) => s + r.units_sold, 0);
  const totalMarkdown = rows.reduce((s, r) => s + r.markdown_amount, 0);
  const w = (key: keyof HistoryRow) =>
    totalSales > 0
      ? rows.reduce((s, r) => s + (r[key] as number) * r.net_sales, 0) / totalSales
      : 0;
  return {
    net_sales: totalSales,
    units_sold: totalUnits,
    markdown_amount: totalMarkdown,
    markdown_pct: round1(totalSales > 0 ? (totalMarkdown / totalSales) * 100 : 0),
    gross_margin_pct: round1(w('gross_margin_pct')),
    sell_through_pct: round1(w('sell_through_pct')),
    returns_pct: round1(w('returns_pct')),
    stockout_days_avg: round1(w('stockout_days')),
    forecast_error_pct: round1(w('forecast_error_pct')),
    sample_count: rows.length,
  };
}

export interface DimensionAggregate {
  key: string;
  net_sales: number;
  share_pct: number;
  sell_through_pct: number;
  gross_margin_pct: number;
  markdown_pct: number;
  returns_pct: number;
}

/**
 * Aggregates the rows by a sub-dimension. For each dimension key, returns
 * sales-weighted averages across all rows. Useful for ranking colors,
 * vendors, fits etc. across a query.
 */
export function aggregateByDimension(
  rows: HistoryRow[],
  dimension: 'mrp' | 'cost' | 'fit' | 'size' | 'color' | 'print' | 'fabric' | 'vendor' | 'cluster',
): DimensionAggregate[] {
  const acc = new Map<string, { sales: number; st: number; gm: number; md: number; ret: number; weight: number }>();
  rows.forEach((r) => {
    const dims = r[dimension];
    Object.entries(dims).forEach(([key, m]) => {
      const cur = acc.get(key) ?? { sales: 0, st: 0, gm: 0, md: 0, ret: 0, weight: 0 };
      const sales = r.net_sales * m.share;
      cur.sales += sales;
      cur.st += m.sell_through_pct * sales;
      cur.gm += m.gross_margin_pct * sales;
      cur.md += m.markdown_pct * sales;
      cur.ret += m.returns_pct * sales;
      cur.weight += sales;
      acc.set(key, cur);
    });
  });
  const totalSales = Array.from(acc.values()).reduce((s, v) => s + v.sales, 0);
  return Array.from(acc.entries())
    .map<DimensionAggregate>(([key, v]) => ({
      key,
      net_sales: Math.round(v.sales),
      share_pct: totalSales > 0 ? round1((v.sales / totalSales) * 100) : 0,
      sell_through_pct: v.weight > 0 ? round1(v.st / v.weight) : 0,
      gross_margin_pct: v.weight > 0 ? round1(v.gm / v.weight) : 0,
      markdown_pct: v.weight > 0 ? round1(v.md / v.weight) : 0,
      returns_pct: v.weight > 0 ? round1(v.ret / v.weight) : 0,
    }))
    .sort((a, b) => b.net_sales - a.net_sales);
}

export function topBottomSellers(
  rows: HistoryRow[],
  count = 5,
): { winners: HistoryRow[]; losers: HistoryRow[] } {
  // Roll up per (brand, category)
  const map = new Map<string, HistoryRow>();
  rows.forEach((r) => {
    const key = `${r.brand_uuid}-${r.category_uuid}`;
    const cur = map.get(key);
    if (!cur) {
      map.set(key, { ...r });
    } else {
      cur.net_sales += r.net_sales;
      cur.units_sold += r.units_sold;
      // For displayed metrics keep a weighted average using sales as weight
      const totalSales = cur.net_sales || 1;
      cur.sell_through_pct = round1(
        (cur.sell_through_pct * (cur.net_sales - r.net_sales) + r.sell_through_pct * r.net_sales) / totalSales,
      );
    }
  });
  const sorted = Array.from(map.values()).sort((a, b) => b.net_sales - a.net_sales);
  return {
    winners: sorted.slice(0, count),
    losers: sorted.slice(-count).reverse(),
  };
}

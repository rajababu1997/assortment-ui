/**
 * Mock monthly history dataset kept for the OTB Release sales-history tabs.
 *
 * The original `/history` page that owned this dataset was retired (replaced
 * by `/saleshistory` on the live `/sales/*` backend). These helpers stay
 * because three OTB-release files still import them:
 *
 *   - sales-history/ChannelMixTab.tsx   (queryRows, aggregateByDimension)
 *   - sales-history/ThreeYearTab.tsx    (queryRows, aggregateTotals)
 *   - data/weeklyVelocity.ts            (queryRows)
 *
 * Numbers are synthesised deterministically from a (brand, category, year,
 * month) hash so a teammate's screen and yours render the same values during
 * demos. No persistence, no random reseeding.
 */

import { CLUSTERS } from './dimensions';

export interface HistoryRow {
  brand_uuid: string;
  category_uuid: string;
  year: number;
  /** 0-indexed month, matching `Date.prototype.getMonth()`. */
  month: number;
  net_sales: number;
  units_sold: number;
  sell_through_pct: number;
  gross_margin_pct: number;
  markdown_pct: number;
  returns_pct: number;
  /** Per-cluster split — sums to net_sales. */
  cluster_split: Record<string, number>;
}

export interface HistoryQuery {
  yearFrom: number;
  monthFrom: number;
  yearTo: number;
  monthTo: number;
  brand_uuids: string[];
  category_uuids: string[];
}

export interface HistoryAggregate {
  net_sales: number;
  units_sold: number;
  sell_through_pct: number;
  gross_margin_pct: number;
  markdown_pct: number;
  returns_pct: number;
}

export interface DimensionShare {
  key: string;
  label: string;
  net_sales: number;
  share_pct: number;
}

// ── Public API ─────────────────────────────────────────────────────────────

export function queryRows(q: HistoryQuery): HistoryRow[] {
  const out: HistoryRow[] = [];
  for (const brand of q.brand_uuids) {
    for (const cat of q.category_uuids) {
      let y = q.yearFrom;
      let m = q.monthFrom;
      while (y < q.yearTo || (y === q.yearTo && m <= q.monthTo)) {
        out.push(synthRow(brand, cat, y, m));
        m += 1;
        if (m > 11) { m = 0; y += 1; }
      }
    }
  }
  return out;
}

export function aggregateTotals(rows: HistoryRow[]): HistoryAggregate {
  if (rows.length === 0) {
    return { net_sales: 0, units_sold: 0, sell_through_pct: 0, gross_margin_pct: 0, markdown_pct: 0, returns_pct: 0 };
  }
  const net = sum(rows, (r) => r.net_sales);
  const units = sum(rows, (r) => r.units_sold);
  // Weighted by net_sales so a tiny month doesn't drag the average.
  const w = (k: keyof HistoryRow) =>
    net > 0
      ? rows.reduce((s, r) => s + (r[k] as number) * r.net_sales, 0) / net
      : 0;
  return {
    net_sales: net,
    units_sold: units,
    sell_through_pct: round1(w('sell_through_pct')),
    gross_margin_pct: round1(w('gross_margin_pct')),
    markdown_pct: round1(w('markdown_pct')),
    returns_pct: round1(w('returns_pct')),
  };
}

export function aggregateByDimension(rows: HistoryRow[], dimension: 'cluster'): DimensionShare[] {
  if (dimension !== 'cluster') return [];
  const totals = new Map<string, number>();
  for (const r of rows) {
    for (const [k, v] of Object.entries(r.cluster_split)) {
      totals.set(k, (totals.get(k) ?? 0) + v);
    }
  }
  const grand = Array.from(totals.values()).reduce((a, b) => a + b, 0) || 1;
  return CLUSTERS.map((c) => {
    const v = totals.get(c.key) ?? 0;
    return {
      key: c.key,
      label: c.label,
      net_sales: v,
      share_pct: (v / grand) * 100,
    };
  });
}

// ── Deterministic synthesis ────────────────────────────────────────────────

function synthRow(brand: string, cat: string, year: number, month: number): HistoryRow {
  const seed = `${brand}|${cat}|${year}-${month}`;
  // Seasonal hump: Sep-Nov (festive), Jul-Aug (EOSS) lift; Feb-Mar dip.
  const monthMult = SEASON_MULT[month];
  // Base scale — apparel slice ~ ₹2-15 L/month per (brand × cat).
  const baseLakhs = 2 + (hash01(`${seed}|base`) * 13);
  const netSales = Math.round(baseLakhs * 1_00_000 * monthMult);
  const asp = 400 + hash01(`${seed}|asp`) * 1800;
  const units = Math.max(20, Math.round(netSales / asp));

  // KPIs centered around realistic apparel-industry means with small wobble.
  const st = clamp(70 + (hash01(`${seed}|st`) - 0.5) * 18 + (monthMult > 1.1 ? 4 : 0), 50, 92);
  const gm = clamp(52 + (hash01(`${seed}|gm`) - 0.5) * 14, 38, 64);
  const md = clamp(14 + (hash01(`${seed}|md`) - 0.5) * 14 + (month === 6 || month === 7 ? 7 : 0), 4, 32);
  const ret = clamp(6 + (hash01(`${seed}|ret`) - 0.5) * 4, 2, 12);

  // Cluster split — weights vary by category hash so different cats tilt
  // differently online vs offline.
  const tiltOnline = hash01(`${cat}|online_tilt`);   // 0..1
  const weights: Record<string, number> = {
    metro_online:  0.18 + tiltOnline * 0.22,         // 0.18..0.40
    metro_premium: 0.20 + (1 - tiltOnline) * 0.15,   // 0.20..0.35
    tier1_offline: 0.20,
    tier2_offline: 0.18,
    tier3_offline: 0.10,
  };
  const wSum = Object.values(weights).reduce((a, b) => a + b, 0);
  const cluster_split: Record<string, number> = {};
  for (const [k, w] of Object.entries(weights)) {
    cluster_split[k] = Math.round((netSales * w) / wSum);
  }

  return {
    brand_uuid: brand,
    category_uuid: cat,
    year,
    month,
    net_sales: netSales,
    units_sold: units,
    sell_through_pct: round1(st),
    gross_margin_pct: round1(gm),
    markdown_pct: round1(md),
    returns_pct: round1(ret),
    cluster_split,
  };
}

// Indian fashion seasonality — Sep-Nov festive boom, Jul-Aug EOSS, Feb-Mar quiet.
const SEASON_MULT = [
  0.92, 0.85, 0.88,   // Jan, Feb, Mar
  0.95, 1.02, 1.08,   // Apr, May, Jun
  1.10, 1.08, 1.18,   // Jul (EOSS), Aug (EOSS), Sep (Onam/AW launch)
  1.32, 1.45, 1.20,   // Oct (Dussehra/Karwa), Nov (Diwali), Dec (year-end)
];

function hash01(s: string): number {
  // FNV-1a → number in [0, 1)
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

function sum<T>(xs: T[], f: (x: T) => number): number {
  let s = 0;
  for (const x of xs) s += f(x);
  return s;
}

/**
 * Weekly velocity layer. Synthesises week-by-week data from the monthly
 * history dataset so the Release screen can show the granularity a real
 * buyer needs (festive ramp, post-festive dip, brand-week spike).
 *
 * Each weekly cell is deterministic: same key in → same value out.
 */

import { queryRows } from '@/features/history/mock/dataset';
import { OCCASIONS } from './occasions';

const MS_PER_DAY = 86_400_000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

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

/** ISO date of the Monday on/before the given date. */
function weekStart(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dow = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - dow);
  return d;
}

function weekIsoLabel(start: Date): string {
  // Approx ISO week number based on calendar position
  const onejan = new Date(start.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((start.getTime() - onejan.getTime()) / MS_PER_DAY) + 1;
  const week = Math.ceil(dayOfYear / 7);
  return `${start.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function occasionMultiplierForWeek(weekStartMs: number): { mult: number; occasionKey?: string } {
  const weekEndMs = weekStartMs + 6 * MS_PER_DAY;
  let best = 1.0;
  let bestKey: string | undefined;
  for (const occ of OCCASIONS) {
    const oa = new Date(occ.start_iso).getTime();
    const ob = new Date(occ.end_iso).getTime();
    if (weekStartMs <= ob && oa <= weekEndMs) {
      const m = 1 + occ.expected_lift_pct / 100;
      if (m > best) {
        best = m;
        bestKey = occ.key;
      }
    }
  }
  return { mult: best, occasionKey: bestKey };
}

export interface WeeklyCell {
  iso_label: string;       // "2025-W42"
  start_iso: string;       // "2025-10-13"
  end_iso: string;         // "2025-10-19"
  brand_uuid: string;
  category_uuid: string;
  net_sales: number;
  units_sold: number;
  sell_through_pct: number;
  returns_pct: number;
  markdown_pct: number;
  occasion_key?: string;
}

interface RangeInput {
  brand_uuid: string;
  category_uuid: string;
  fromIso: string;
  toIso: string;
}

/**
 * Returns one cell per week between fromIso and toIso (inclusive) for the
 * requested brand × category. Weekly numbers are deterministic — same
 * inputs always produce the same numbers.
 */
export function getWeeklyRange(input: RangeInput): WeeklyCell[] {
  const out: WeeklyCell[] = [];
  let cursor = weekStart(new Date(input.fromIso));
  const end = new Date(input.toIso);

  while (cursor <= end) {
    const ws = cursor.getTime();
    const we = ws + 6 * MS_PER_DAY;
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const monthRows = queryRows({
      yearFrom: monthStart.getFullYear(),
      monthFrom: monthStart.getMonth(),
      yearTo: monthStart.getFullYear(),
      monthTo: monthStart.getMonth(),
      brand_uuids: [input.brand_uuid],
      category_uuids: [input.category_uuid],
    });
    const monthly = monthRows[0];
    if (monthly) {
      // 4.33 weeks per month on average — distribute base + occasion lift
      const baseWeekly = monthly.net_sales / 4.33;
      const baseUnitsWeekly = monthly.units_sold / 4.33;
      const { mult, occasionKey } = occasionMultiplierForWeek(ws);
      const wobble = 1 + noise(`${input.brand_uuid}-${input.category_uuid}-${ws}-w`) * 0.06;
      const net_sales = Math.round(baseWeekly * mult * wobble);
      const units_sold = Math.max(20, Math.round(baseUnitsWeekly * mult * wobble));
      const sell_through_pct = clamp(
        monthly.sell_through_pct + (mult > 1.2 ? 6 : mult > 1.05 ? 2 : 0) + noise(`${ws}-st`) * 3,
        45,
        96,
      );
      const returns_pct = clamp(
        monthly.returns_pct + (occasionKey?.startsWith('eoss') ? 1.5 : 0) + noise(`${ws}-ret`) * 1.5,
        2,
        13,
      );
      const markdown_pct = clamp(
        monthly.markdown_pct + (occasionKey?.startsWith('eoss') ? 7 : 0) + noise(`${ws}-md`) * 2,
        4,
        32,
      );

      out.push({
        iso_label: weekIsoLabel(cursor),
        start_iso: cursor.toISOString().slice(0, 10),
        end_iso: new Date(we).toISOString().slice(0, 10),
        brand_uuid: input.brand_uuid,
        category_uuid: input.category_uuid,
        net_sales,
        units_sold,
        sell_through_pct: Math.round(sell_through_pct * 10) / 10,
        returns_pct: Math.round(returns_pct * 10) / 10,
        markdown_pct: Math.round(markdown_pct * 10) / 10,
        occasion_key: occasionKey,
      });
    }
    cursor = new Date(ws + MS_PER_WEEK);
  }

  return out;
}

export interface WeeklyAggregate {
  net_sales: number;
  units_sold: number;
  avg_sell_through_pct: number;
  avg_returns_pct: number;
  avg_markdown_pct: number;
}

export function aggregateWeekly(cells: WeeklyCell[]): WeeklyAggregate {
  if (cells.length === 0) {
    return { net_sales: 0, units_sold: 0, avg_sell_through_pct: 0, avg_returns_pct: 0, avg_markdown_pct: 0 };
  }
  const totalSales = cells.reduce((s, c) => s + c.net_sales, 0);
  const totalUnits = cells.reduce((s, c) => s + c.units_sold, 0);
  const w = (k: keyof WeeklyCell) =>
    totalSales > 0
      ? cells.reduce((s, c) => s + ((c[k] as number) * c.net_sales), 0) / totalSales
      : 0;
  return {
    net_sales: totalSales,
    units_sold: totalUnits,
    avg_sell_through_pct: Math.round(w('sell_through_pct') * 10) / 10,
    avg_returns_pct: Math.round(w('returns_pct') * 10) / 10,
    avg_markdown_pct: Math.round(w('markdown_pct') * 10) / 10,
  };
}

export function trendPct(cells: WeeklyCell[]): number | null {
  if (cells.length < 4) return null;
  const half = Math.floor(cells.length / 2);
  const a = cells.slice(0, half).reduce((s, c) => s + c.net_sales, 0) / half;
  const b = cells.slice(half).reduce((s, c) => s + c.net_sales, 0) / (cells.length - half);
  if (a <= 0) return null;
  return ((b - a) / a) * 100;
}

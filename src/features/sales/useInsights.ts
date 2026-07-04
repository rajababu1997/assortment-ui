/**
 * Insight hooks — fetch real sales rows for a given (brand, category, period)
 * and shape them into what the editor UIs already render.
 *
 * Shapes mirror the previous mockData generators 1:1 — components don't change.
 * Numbers now come from `/sales/*` (driven by the JSON resources shipped on
 * the backend, or eventually real customer data — same code).
 */

import { useMemo } from 'react';
import type { MrpBand } from '@/features/otb/types';
import { OPTION_TYPES, SUB_TYPE_CATALOGUE, type OptionType } from '@/features/option/constants';
import { useSalesAggregate, useSalesAttribute } from './useSales';
import type {
  BandLyPerformance,
  BandOptionTypeInsights,
  OptionPlanInsights,
  SalesInsights,
  SubTypeLyPerformance,
} from './insightTypes';
import type { SalesAggregateRow, SalesAttributeRow } from './types';

// ── Period helpers ──────────────────────────────────────────────────────────

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

/** "Jan 2025" → "2025-01"; returns null if unparseable. */
export function periodLabelToKey(label: string): string | null {
  const m = label.match(/^([A-Za-z]{3,})\s+(\d{4})$/);
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase());
  if (idx < 0) return null;
  return `${m[2]}-${String(idx + 1).padStart(2, '0')}`;
}

// ── Festival hints (same calendar wording as the old mock) ──────────────────

const FESTIVAL_HINTS: Record<string, string> = {
  '01': 'Republic Day sale (Jan 22–26) lifts entry tier',
  '02': "Valentine's week boosts upper tier gifting",
  '03': 'EOSS clearance peaks — heavy markdowns end of month',
  '04': 'Summer launch: entry tier ramps up',
  '05': 'Pre-monsoon clearance pressure on upper + statement',
  '06': 'Monsoon: footfall dip, online share up',
  '07': 'Mid-year sale boosts core tier',
  '08': 'Independence Day promos push entry tier',
  '09': 'Onam + pre-festive ramp — upper tier warms up',
  '10': 'Diwali / Navratri peak — upper + statement +25%',
  '11': 'Diwali / Karwa Chauth: premium gifting wave',
  '12': 'Christmas / NYE: gifting lifts upper tier',
};

function festivalHintFor(periodKey: string | null): string | undefined {
  if (!periodKey) return undefined;
  return FESTIVAL_HINTS[periodKey.slice(5, 7)];
}

// ── Transformer: sales_aggregate rows → SalesInsights ──────────────────────

function transformValueInsights(args: {
  lyRows: SalesAggregateRow[];
  llyRows: SalesAggregateRow[];
  ly_period_label: string;
  ly_period_key: string;
  band_ids: MrpBand['id'][];
}): SalesInsights {
  const { lyRows, llyRows, ly_period_label, ly_period_key, band_ids } = args;

  const lyTotal = sumOf(lyRows, (r) => r.netSalesValue);
  const llyTotal = sumOf(llyRows, (r) => r.netSalesValue);
  const lyUnits = sumOf(lyRows, (r) => r.netSalesUnits);
  const llyUnits = sumOf(llyRows, (r) => r.netSalesUnits);

  const bands: BandLyPerformance[] = band_ids.map((id) => {
    const bandLy = lyRows.filter((r) => r.bandId === id);
    const revenue = sumOf(bandLy, (r) => r.netSalesValue);
    const units = sumOf(bandLy, (r) => r.netSalesUnits);
    const shareDen = lyTotal || 1;
    const ly_share_pct = Math.round((revenue / shareDen) * 100);
    const sell_through_pct = round1(avgWeighted(bandLy, (r) => r.strPct, (r) => r.netSalesUnits) || 0);
    const markdown_depth_pct = round1(avgWeighted(bandLy, (r) => r.markdownPct, (r) => r.netSalesValue) || 0);
    const realized_margin_pct = round1(avgWeighted(bandLy, (r) => r.gpPct, (r) => r.netSalesValue) || 0);
    const weeklyRun = units / 4.33;
    const eom = sumOf(bandLy, (r) => r.eomUnits);
    const doc_days = weeklyRun > 0 ? clamp(Math.round((eom / weeklyRun) * 7), 18, 110) : 60;

    return {
      band_id: id,
      units_sold: units,
      revenue,
      sell_through_pct: clamp(sell_through_pct, 25, 100),
      markdown_depth_pct: clamp(markdown_depth_pct, 0, 55),
      realized_margin_pct: clamp(realized_margin_pct, 35, 85),
      doc_days,
      ly_share_pct,
    };
  });

  // Profit-contribution score (same logic as the old mock generator)
  const scored = bands.map((b) => ({
    id: b.band_id,
    score: b.sell_through_pct * b.realized_margin_pct * Math.max(1, b.ly_share_pct),
  }));
  scored.sort((a, b) => b.score - a.score);

  const avgSt = bands.length
    ? Math.round(bands.reduce((s, b) => s + b.sell_through_pct, 0) / bands.length)
    : 0;

  const yoyUnits = pctChange(lyUnits, llyUnits);
  const yoyRev = pctChange(lyTotal, llyTotal);
  const lyAvgStr = avgSt;

  return {
    ly_period_label,
    ly_total_units: lyUnits,
    ly_total_revenue: lyTotal,
    yoy_units_growth_pct: round1(yoyUnits),
    yoy_revenue_growth_pct: round1(yoyRev),
    avg_sell_through_pct: avgSt,
    top_band_id: scored[0]?.id ?? band_ids[0],
    worst_band_id: scored[scored.length - 1]?.id ?? band_ids[0],
    bands,
    trends: {
      demand_index: clamp(Math.round(50 + lyAvgStr * 0.5), 30, 100),
      search_trend_pct: round1(clamp(yoyUnits, -30, 60)),
      competitor_price_delta_pct: round1(clamp(yoyRev - yoyUnits, -20, 25)),
      festival_hint: festivalHintFor(ly_period_key),
    },
  };
}

// ── Hook: Value editor insights ─────────────────────────────────────────────

export function useValueSalesInsights(args: {
  brand_uuid: string;
  category_uuid: string;
  ly_period_label: string;
  band_ids: MrpBand['id'][];
}): { data: SalesInsights | undefined; isLoading: boolean } {
  const lyKey = periodLabelToKey(args.ly_period_label);

  const ly = useSalesAggregate(
    { brand: args.brand_uuid, category: args.category_uuid, from: lyKey ?? undefined, to: lyKey ?? undefined },
    { enabled: !!lyKey },
  );

  const data = useMemo(() => {
    if (!lyKey || !ly.data) return undefined;
    // LY-only per product decision. YoY chips fall to 0/flat since there's no
    // year-before-last comparison — the transformer treats the empty LLY as
    // "no prior data" which returns 0 from pctChange().
    return transformValueInsights({
      lyRows: ly.data,
      llyRows: [],
      ly_period_label: args.ly_period_label,
      ly_period_key: lyKey,
      band_ids: args.band_ids,
    });
  }, [lyKey, ly.data, args.ly_period_label, args.band_ids]);

  return { data, isLoading: ly.isLoading };
}

// ── Hook: per-band last-year % share (replaces mockLastYearPct) ────────────

export function useValueLastYearShares(args: {
  brand_uuid: string;
  category_uuid: string;
  ly_period_label: string;
}): { shares: Record<string, number>; isLoading: boolean } {
  const key = periodLabelToKey(args.ly_period_label);
  const q = useSalesAggregate(
    { brand: args.brand_uuid, category: args.category_uuid, from: key ?? undefined, to: key ?? undefined },
    { enabled: !!key },
  );
  const shares = useMemo<Record<string, number>>(() => {
    if (!q.data || q.data.length === 0) return {};
    const total = sumOf(q.data, (r) => r.netSalesValue) || 1;
    const out: Record<string, number> = {};
    for (const r of q.data) {
      out[r.bandId] = (out[r.bandId] ?? 0) + (r.netSalesValue / total) * 100;
    }
    for (const k of Object.keys(out)) out[k] = Math.round(out[k]);
    return out;
  }, [q.data]);
  return { shares, isLoading: q.isLoading };
}

// ── Transformer: sales_attribute rows → OptionPlanInsights ─────────────────

function transformOptionInsights(args: {
  agg: SalesAggregateRow[];
  attrLy: SalesAttributeRow[];
  attrLly: SalesAttributeRow[];
  category_label: string;
  ly_period_label: string;
  ly_period_key: string;
  band_ids: MrpBand['id'][];
}): OptionPlanInsights {
  const { agg, attrLy, attrLly, category_label, ly_period_label, ly_period_key, band_ids } = args;

  const ly_total_units = sumOf(agg, (r) => r.netSalesUnits);
  const ly_total_revenue = sumOf(agg, (r) => r.netSalesValue);
  const ly_total_options = sumOf(agg, (r) => r.optionsActive);
  const ly_avg_options_per_band = band_ids.length
    ? Math.round(ly_total_options / band_ids.length)
    : ly_total_options;
  const ly_sell_through_pct = round1(avgWeighted(agg, (r) => r.strPct, (r) => r.netSalesUnits) || 0);
  const ly_realized_margin_pct = round1(avgWeighted(agg, (r) => r.gpPct, (r) => r.netSalesValue) || 0);
  const ly_return_pct = round1(
    (sumOf(agg, (r) => r.returnsUnits) / Math.max(1, sumOf(agg, (r) => r.grossSalesUnits))) * 100,
  );

  // Per (band, option_type, sub_type)
  const per_band_per_type: BandOptionTypeInsights[] = [];
  const optionTypes: OptionType[] = [
    OPTION_TYPES.FABRIC_TYPE,
    OPTION_TYPES.FIT,
    OPTION_TYPES.COMPOSITION,
  ];

  for (const band_id of band_ids) {
    for (const option_type of optionTypes) {
      const catalogue = SUB_TYPE_CATALOGUE[option_type];
      const subTypesLy = attrLy.filter((r) => r.bandId === band_id && r.optionType === option_type);
      const subTypesLly = attrLly.filter(
        (r) => r.bandId === band_id && r.optionType === option_type,
      );
      const totalUnits = sumOf(subTypesLy, (r) => r.units) || 1;
      const totalValue = sumOf(subTypesLy, (r) => r.value) || 1;

      const sub_types: SubTypeLyPerformance[] = catalogue.map((sub) => {
        const row = subTypesLy.find((r) => r.subTypeKey === sub.key);
        const llyRow = subTypesLly.find((r) => r.subTypeKey === sub.key);
        const units = row?.units ?? 0;
        const value = row?.value ?? 0;
        const lly_units = llyRow?.units ?? 0;
        const yoy_pct = pctChange(units, lly_units);
        const sell_through_pct = round1(row?.strPct ?? 0);
        const markdown_depth_pct = round1(row?.markdownPct ?? 0);
        const realized_margin_pct = round1(row?.gpPct ?? 0);
        // Return % at the band level — we don't have per-sub-type returns in mock
        const return_pct = round1(ly_return_pct);
        return {
          sub_type_key: sub.key,
          sub_type_label: sub.label,
          units,
          vol_pct: Math.round((units / totalUnits) * 100),
          rev_pct: Math.round((value / totalValue) * 100),
          sell_through_pct: clamp(sell_through_pct, 25, 100),
          markdown_depth_pct: clamp(markdown_depth_pct, 0, 55),
          realized_margin_pct: clamp(realized_margin_pct, 35, 85),
          return_pct: clamp(return_pct, 0, 30),
          yoy_pct: round1(clamp(yoy_pct, -50, 100)),
        };
      });
      per_band_per_type.push({ band_id, option_type, sub_types });
    }
  }

  // Top + bottom sub-types by YoY for trend chips (max 4)
  const allYoy = per_band_per_type.flatMap((b) =>
    b.sub_types.map((s) => ({ label: s.sub_type_label, delta_pct: s.yoy_pct })),
  );
  const dedup = new Map<string, number>();
  for (const e of allYoy) {
    const cur = dedup.get(e.label);
    dedup.set(e.label, cur === undefined ? e.delta_pct : (cur + e.delta_pct) / 2);
  }
  const trend_chips = Array.from(dedup.entries())
    .map(([label, delta_pct]) => ({ label, delta_pct: round1(delta_pct) }))
    .sort((a, b) => Math.abs(b.delta_pct) - Math.abs(a.delta_pct))
    .slice(0, 4);

  return {
    ly_period_label,
    category_label,
    ly_total_options,
    ly_total_units,
    ly_total_revenue,
    ly_avg_options_per_band,
    ly_sell_through_pct,
    ly_realized_margin_pct,
    ly_return_pct,
    trend_chips,
    festival_hint: festivalHintFor(ly_period_key),
    per_band_per_type,
  };
}

// ── Hook: Option editor insights ────────────────────────────────────────────

export function useOptionPlanInsights(args: {
  brand_uuid: string;
  category_uuid: string;
  category_label: string;
  ly_period_label: string;
  band_ids: MrpBand['id'][];
}): { data: OptionPlanInsights | undefined; isLoading: boolean } {
  const lyKey = periodLabelToKey(args.ly_period_label);

  const agg = useSalesAggregate(
    { brand: args.brand_uuid, category: args.category_uuid, from: lyKey ?? undefined, to: lyKey ?? undefined },
    { enabled: !!lyKey },
  );
  const attrLy = useSalesAttribute(
    { brand: args.brand_uuid, category: args.category_uuid, from: lyKey ?? undefined, to: lyKey ?? undefined },
    { enabled: !!lyKey },
  );

  const data = useMemo(() => {
    if (!lyKey || !agg.data || !attrLy.data) return undefined;
    // LY-only per product decision. Sub-type YoY chips fall to 0 since we no
    // longer read year-before-last data.
    return transformOptionInsights({
      agg: agg.data,
      attrLy: attrLy.data,
      attrLly: [],
      category_label: args.category_label,
      ly_period_label: args.ly_period_label,
      ly_period_key: lyKey,
      band_ids: args.band_ids,
    });
  }, [lyKey, agg.data, attrLy.data, args.category_label, args.ly_period_label, args.band_ids]);

  return { data, isLoading: agg.isLoading || attrLy.isLoading };
}

// ── Math helpers ────────────────────────────────────────────────────────────

function sumOf<T>(arr: T[], get: (t: T) => number): number {
  let s = 0;
  for (const x of arr) s += get(x);
  return s;
}

function avgWeighted<T>(arr: T[], value: (t: T) => number, weight: (t: T) => number): number {
  let num = 0;
  let den = 0;
  for (const x of arr) {
    const w = weight(x);
    num += value(x) * w;
    den += w;
  }
  return den > 0 ? num / den : 0;
}

function pctChange(latest: number, prior: number): number {
  if (prior <= 0) return 0;
  return ((latest - prior) / prior) * 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ── LastYearReference: per-band sub-type qty (as option counts) ────────────

export interface LyBandSnapshot {
  avgPerOption: number;
  optionPlanQty: number;
  fabricType:  Array<{ key: string; label: string; qty: number }>;
  fit:         Array<{ key: string; label: string; qty: number }>;
  composition: Array<{ key: string; label: string; qty: number }>;
}

/**
 * Distribute `total` across `weights` proportionally, returning integer
 * counts that sum exactly to `total`. Drift is absorbed by the largest
 * weight so dominant sub-types stay dominant after rounding.
 */
function distributeProportional(weights: number[], total: number): number[] {
  const sum = weights.reduce((s, n) => s + n, 0);
  if (sum <= 0 || total <= 0) return weights.map(() => 0);
  const qtys = weights.map((w) => Math.round((w / sum) * total));
  const drift = total - qtys.reduce((s, n) => s + n, 0);
  if (drift !== 0) {
    let maxIdx = 0;
    for (let i = 1; i < weights.length; i++) {
      if (weights[i] > weights[maxIdx]) maxIdx = i;
    }
    qtys[maxIdx] = Math.max(0, qtys[maxIdx] + drift);
  }
  return qtys;
}

export function useLastYearOptionRef(args: {
  brand_uuid: string;
  category_uuid: string;
  ly_period_label: string;
}): { data: Record<string, LyBandSnapshot> | undefined; isLoading: boolean } {
  const lyKey = periodLabelToKey(args.ly_period_label);
  const agg = useSalesAggregate(
    { brand: args.brand_uuid, category: args.category_uuid, from: lyKey ?? undefined, to: lyKey ?? undefined },
    { enabled: !!lyKey },
  );
  const attr = useSalesAttribute(
    { brand: args.brand_uuid, category: args.category_uuid, from: lyKey ?? undefined, to: lyKey ?? undefined },
    { enabled: !!lyKey },
  );

  const data = useMemo(() => {
    if (!agg.data || !attr.data) return undefined;
    const out: Record<string, LyBandSnapshot> = {};
    const bandIds = new Set<string>(agg.data.map((r) => r.bandId));
    for (const id of bandIds) {
      const aggRow = agg.data.find((r) => r.bandId === id);
      if (!aggRow) continue;
      const optionPlanQty = aggRow.optionsActive;
      const avgPerOption = optionPlanQty > 0
        ? Math.round(aggRow.netSalesUnits / optionPlanQty)
        : 0;

      const splitSubTypes = (
        optionType: OptionType,
      ): Array<{ key: string; label: string; qty: number }> => {
        const catalogue = SUB_TYPE_CATALOGUE[optionType];
        const rows = attr.data!.filter((r) => r.bandId === id && r.optionType === optionType);
        const weights = catalogue.map((s) =>
          rows.find((r) => r.subTypeKey === s.key)?.units ?? 0,
        );
        const qtys = distributeProportional(weights, optionPlanQty);
        return catalogue.map((s, i) => ({ key: s.key, label: s.label, qty: qtys[i] }));
      };

      out[id] = {
        avgPerOption,
        optionPlanQty,
        fabricType:  splitSubTypes(OPTION_TYPES.FABRIC_TYPE),
        fit:         splitSubTypes(OPTION_TYPES.FIT),
        composition: splitSubTypes(OPTION_TYPES.COMPOSITION),
      };
    }
    return out;
  }, [agg.data, attr.data]);

  return { data, isLoading: agg.isLoading || attr.isLoading };
}

// ── HistoricalSalesInsights: date-range snapshot ───────────────────────────

export interface HistoricalSnapshotRow {
  name: string;
  salesCr: number;
  /** Badge tag for the visual chip; `null` when nothing notable. */
  badge: 'best' | 'top' | 'markdown' | null;
}

export interface HistoricalSnapshotBand {
  bandId: string;
  count: number;        // optionsActive across the period
  avgUnits: number;     // netSalesUnits / optionsActive
  optionsPct: number;   // share of total options
  volumePct: number;    // share of total units sold
}

export interface HistoricalSnapshot {
  fabric:      HistoricalSnapshotRow[];
  fit:         HistoricalSnapshotRow[];
  composition: HistoricalSnapshotRow[];
  perBand:     HistoricalSnapshotBand[];
  totalOptions: number;
  totalUnits:   number;
}

/** "YYYY-MM" key from a Date. */
function dateToPeriodKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function useHistoricalSnapshot(args: {
  brand_uuid: string;
  category_uuid: string;
  from: Date | null;
  to:   Date | null;
}): { data: HistoricalSnapshot | undefined; isLoading: boolean } {
  const fromKey = args.from ? dateToPeriodKey(args.from) : undefined;
  const toKey   = args.to   ? dateToPeriodKey(args.to)   : undefined;
  const enabled = !!fromKey && !!toKey;

  const agg = useSalesAggregate(
    { brand: args.brand_uuid, category: args.category_uuid, from: fromKey, to: toKey },
    { enabled },
  );
  const attr = useSalesAttribute(
    { brand: args.brand_uuid, category: args.category_uuid, from: fromKey, to: toKey },
    { enabled },
  );

  const data = useMemo<HistoricalSnapshot | undefined>(() => {
    if (!agg.data || !attr.data) return undefined;

    const totalUnits   = agg.data.reduce((s, r) => s + r.netSalesUnits, 0);
    const totalOptions = agg.data.reduce((s, r) => s + r.optionsActive, 0);

    // Per-band rollup. Use the band ids actually present in the data.
    const bandIds = Array.from(new Set(agg.data.map((r) => r.bandId)));
    const perBand: HistoricalSnapshotBand[] = bandIds.map((id) => {
      const rows = agg.data!.filter((r) => r.bandId === id);
      const units   = rows.reduce((s, r) => s + r.netSalesUnits, 0);
      const options = rows.reduce((s, r) => s + r.optionsActive, 0);
      return {
        bandId: id,
        count: options,
        avgUnits: options > 0 ? Math.round(units / options) : 0,
        optionsPct: totalOptions > 0 ? Math.round((options / totalOptions) * 100) : 0,
        volumePct:  totalUnits   > 0 ? Math.round((units   / totalUnits)   * 100) : 0,
      };
    });

    // Sub-type rollup across all bands. Sales = `value` (₹). Markdown badge
    // fires when a sub-type's weighted markdown % exceeds an 8% threshold AND
    // it's the heaviest discounter in the group.
    const rollUp = (
      optionType: OptionType,
      topBadgeKind: 'best' | 'top',
    ): HistoricalSnapshotRow[] => {
      const catalogue = SUB_TYPE_CATALOGUE[optionType];
      const rows = attr.data!.filter((r) => r.optionType === optionType);
      const items = catalogue.map((s) => {
        const matches = rows.filter((r) => r.subTypeKey === s.key);
        const value = matches.reduce((sum, r) => sum + r.value, 0);
        const mdWeight = matches.reduce((sum, r) => sum + r.value, 0);
        const mdNum    = matches.reduce((sum, r) => sum + r.markdownPct * r.value, 0);
        const md = mdWeight > 0 ? mdNum / mdWeight : 0;
        return { name: s.label, salesCr: value / 1e7, md };
      });
      const maxSales = items.reduce((m, i) => Math.max(m, i.salesCr), 0);
      const maxMd    = items.reduce((m, i) => Math.max(m, i.md),      0);
      return items.map((i): HistoricalSnapshotRow => {
        let badge: 'best' | 'top' | 'markdown' | null = null;
        if (i.salesCr > 0 && i.salesCr === maxSales) badge = topBadgeKind;
        else if (i.md > 8 && i.md === maxMd)         badge = 'markdown';
        return { name: i.name, salesCr: i.salesCr, badge };
      });
    };

    return {
      fabric:      rollUp(OPTION_TYPES.FABRIC_TYPE,  'best'),
      fit:         rollUp(OPTION_TYPES.FIT,          'top'),
      composition: rollUp(OPTION_TYPES.COMPOSITION,  'best'),
      perBand,
      totalOptions,
      totalUnits,
    };
  }, [agg.data, attr.data]);

  return { data, isLoading: agg.isLoading || attr.isLoading };
}

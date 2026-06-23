/**
 * Sales-insights mock data — last-year performance broken down by MRP band.
 *
 * Drives the "Last year sales" section on the Value editor so the buyer can
 * see which tier moved + cleared + held margin before deciding how to split
 * this year's budget. Pure UI demo — no server fetch.
 *
 * Deterministic per `otb_code`, so the same OTB always shows the same
 * numbers. Different OTBs get different patterns (driven by a tiny hash).
 */

import type { MrpBand } from '@/features/otb/types';

export interface BandLyPerformance {
  band_id: MrpBand['id'];
  units_sold: number;
  revenue: number;
  /** % of LY allocation that cleared at full/marked-down price. */
  sell_through_pct: number;
  /** Average % discount actually applied across the units sold. */
  markdown_depth_pct: number;
  /** Margin after markdowns — the number the CFO actually cares about. */
  realized_margin_pct: number;
  /** Days of cover — proxy for how long stock sat. Lower = faster turn. */
  doc_days: number;
  /** This tier's share of LY revenue (sums to 100 across the 4 tiers). */
  ly_share_pct: number;
}

export interface SalesInsights {
  /** Label shown in the section header, e.g. "Jan 2025". */
  ly_period_label: string;
  ly_total_units: number;
  ly_total_revenue: number;
  /** YoY = LY vs LLY (last year vs the year before). +ve = growing. */
  yoy_units_growth_pct: number;
  yoy_revenue_growth_pct: number;
  /** Mean sell-through across the 4 bands. */
  avg_sell_through_pct: number;
  /** Best risk-adjusted tier (ST × margin). Surface as a green flag. */
  top_band_id: MrpBand['id'];
  /** Worst risk-adjusted tier. Surface as an amber flag. */
  worst_band_id: MrpBand['id'];
  bands: BandLyPerformance[];
  trends: {
    /** Google-trends style index — 100 = peak demand. */
    demand_index: number;
    /** Search-volume change vs LY for this brand/category combo. */
    search_trend_pct: number;
    /** + = our price > competitor avg, - = we're cheaper. */
    competitor_price_delta_pct: number;
    /** Festival / calendar driver, e.g. "Diwali boosts upper +25% LY". */
    festival_hint?: string;
  };
}

// ── Deterministic pseudo-random based on a string seed ──────────────────────

function seedFromString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pseudoRandom(seed: number): () => number {
  let state = seed || 1;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// ── Calendar-driven festival hints ──────────────────────────────────────────

function festivalHint(periodLabel: string): string | undefined {
  const lower = periodLabel.toLowerCase();
  if (lower.includes('jan')) return 'Republic Day sale (Jan 22–26) lifted entry tier +18% LY';
  if (lower.includes('feb')) return 'Valentine\'s week boosted upper tier gifting +12% LY';
  if (lower.includes('mar')) return 'EOSS clearance peaked — heavy markdowns end of month';
  if (lower.includes('apr')) return 'Summer launch: entry tier ramped up, light markdowns';
  if (lower.includes('may')) return 'Pre-monsoon clearance pressure on upper + statement';
  if (lower.includes('jun')) return 'Monsoon: footfall dip −15%, online share +20%';
  if (lower.includes('jul')) return 'Mid-year sale boosted core tier +14% LY';
  if (lower.includes('aug')) return 'Independence Day promos pushed entry tier +22% LY';
  if (lower.includes('sep')) return 'Onam + pre-festive ramp begins — upper tier warms up';
  if (lower.includes('oct')) return 'Diwali peak — upper + statement tiers +25% LY';
  if (lower.includes('nov')) return 'Diwali / Karva Chauth: premium gifting wave';
  if (lower.includes('dec')) return 'Christmas / NYE: gifting lifted upper tier +18% LY';
  return undefined;
}

// ── Generator ───────────────────────────────────────────────────────────────

/**
 * Build deterministic LY insights for one OTB row. `ly_period_label` should
 * be the LY equivalent of the editor's current period (e.g. "Jan 2025" when
 * the user is planning "Jan 2026").
 */
export function generateSalesInsights(args: {
  otb_code: string;
  ly_period_label: string;
  band_ids: MrpBand['id'][];
}): SalesInsights {
  const rand = pseudoRandom(seedFromString(args.otb_code));

  // Total LY revenue: 60L–110L range. Bigger brands/categories naturally land higher
  // but for a demo this random spread is enough.
  const baseRev = 6_000_000 + Math.floor(rand() * 5_000_000);

  // YoY swing: −12% to +22% — reflects mixed market conditions.
  const yoyUnits = Math.round((-12 + rand() * 34) * 10) / 10;
  const yoyRevenue = Math.round((yoyUnits + (rand() * 6 - 3)) * 10) / 10;

  // Typical Indian fast-fashion mix: Core dominant, Statement smallest.
  // Add a small per-OTB tilt so each row has its own personality.
  const tiltEntry = Math.round(rand() * 6 - 3);
  const tiltCore = Math.round(rand() * 6 - 3);
  const tiltUpper = Math.round(rand() * 6 - 3);
  const shareTemplate: Record<MrpBand['id'], number> = {
    entry: 28 + tiltEntry,
    core: 35 + tiltCore,
    upper: 22 + tiltUpper,
    statement: 100 - (28 + tiltEntry) - (35 + tiltCore) - (22 + tiltUpper), // rest
  };

  // Typical "anchor" avg unit price within each tier — used to back out units
  // from the revenue share. Fashion buyers think in terms of these anchors.
  const anchorPrice: Record<MrpBand['id'], number> = {
    entry: 1499,
    core: 2499,
    upper: 4999,
    statement: 7499,
  };

  // Per-tier defaults — these match real-world fashion patterns:
  //   - Entry: high ST, low markdown, decent margin
  //   - Core: balanced
  //   - Upper: lower ST, more markdown, higher margin floor
  //   - Statement: lowest ST, deepest markdowns, but highest stickered margin
  const stBase: Record<MrpBand['id'], number> = { entry: 85, core: 78, upper: 70, statement: 58 };
  const mdBase: Record<MrpBand['id'], number> = { entry: 8,  core: 14, upper: 22, statement: 32 };
  const marginBase: Record<MrpBand['id'], number> = { entry: 66, core: 72, upper: 76, statement: 80 };

  const bands: BandLyPerformance[] = args.band_ids.map((id) => {
    const sharePct = Math.max(5, shareTemplate[id]);
    const revenue = Math.round((baseRev * sharePct) / 100);
    const units = Math.max(1, Math.floor(revenue / anchorPrice[id]));

    const sell_through_pct = clamp(Math.round(stBase[id] + (rand() * 10 - 5)), 25, 100);
    const markdown_depth_pct = clamp(Math.round(mdBase[id] + (rand() * 6 - 3)), 0, 55);
    // Realized margin trails the stickered margin proportional to markdown depth.
    const realized_margin_pct = clamp(
      Math.round(marginBase[id] - markdown_depth_pct * 0.45 + (rand() * 4 - 2)),
      35,
      85,
    );
    const doc_days = clamp(Math.round(45 + (rand() * 30 - 15)), 18, 110);

    return {
      band_id: id,
      units_sold: units,
      revenue,
      sell_through_pct,
      markdown_depth_pct,
      realized_margin_pct,
      doc_days,
      ly_share_pct: sharePct,
    };
  });

  // Profit-contribution proxy: ST × realized margin × LY share.
  // Higher = bigger contribution to profit. Used to surface top/weak tiers.
  const scored = bands.map((b) => ({
    id: b.band_id,
    score: b.sell_through_pct * b.realized_margin_pct * Math.max(1, b.ly_share_pct),
  }));
  scored.sort((a, b) => b.score - a.score);

  const total_units = bands.reduce((s, b) => s + b.units_sold, 0);
  const total_revenue = bands.reduce((s, b) => s + b.revenue, 0);
  const avg_st = Math.round(bands.reduce((s, b) => s + b.sell_through_pct, 0) / bands.length);

  return {
    ly_period_label: args.ly_period_label,
    ly_total_units: total_units,
    ly_total_revenue: total_revenue,
    yoy_units_growth_pct: yoyUnits,
    yoy_revenue_growth_pct: yoyRevenue,
    avg_sell_through_pct: avg_st,
    top_band_id: scored[0].id,
    worst_band_id: scored[scored.length - 1].id,
    bands,
    trends: {
      demand_index: Math.round(55 + rand() * 40),
      search_trend_pct: Math.round((-15 + rand() * 45) * 10) / 10,
      competitor_price_delta_pct: Math.round((-8 + rand() * 16) * 10) / 10,
      festival_hint: festivalHint(args.ly_period_label),
    },
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

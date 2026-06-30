/**
 * Sales-insights mock for the Option Plan editor — UI-only, deterministic
 * per `otb_code` so the same OTB always renders the same numbers.
 *
 * Surfaces what a real fashion buyer leans on when deciding option mix:
 *
 *   Category-level
 *     - LY options launched, LY units, LY revenue, avg units / option
 *     - LY sell-through %, realized margin %, return rate %
 *     - Trend chips (top sub-types growing / declining)
 *     - Festival / event hint for the period
 *
 *   Per band, per OptionType (Fabric Type · Fit · Composition)
 *     - LY volume share % per sub-type
 *     - Per sub-type: units, vol %, rev %, ST %, MD %, margin %, return %, YoY
 *
 * Shape mirrors what a real LY-performance service would return; swapping
 * the generator for a real fetch is a one-line change in the editor.
 */

import type { MrpBand } from '@/features/otb/types';
import {
  OPTION_TYPES,
  SUB_TYPE_CATALOGUE,
  type OptionType,
  type SubTypeOption,
} from '../constants';

// ── Wire shape ────────────────────────────────────────────────────────────

export interface SubTypeLyPerformance {
  sub_type_key: string;
  sub_type_label: string;
  units: number;
  vol_pct: number;        // share of LY units within this band × option_type
  rev_pct: number;        // share of LY revenue within this band × option_type
  sell_through_pct: number;
  markdown_depth_pct: number;
  realized_margin_pct: number;
  return_pct: number;
  yoy_pct: number;        // + growing, − declining
}

export interface BandOptionTypeInsights {
  band_id: MrpBand['id'];
  option_type: OptionType;
  sub_types: SubTypeLyPerformance[];
}

export interface OptionPlanInsights {
  ly_period_label: string;     // e.g. "Jan 2025"
  category_label: string;      // e.g. "Athleisure"
  ly_total_options: number;
  ly_total_units: number;
  ly_total_revenue: number;
  ly_avg_options_per_band: number;
  ly_sell_through_pct: number;
  ly_realized_margin_pct: number;
  ly_return_pct: number;
  trend_chips: Array<{ label: string; delta_pct: number }>;
  festival_hint?: string;
  /** Performance per (band, option_type). Filter for the band/type you want. */
  per_band_per_type: BandOptionTypeInsights[];
}

// ── Seeded PRNG (Bernstein hash + LCG) ────────────────────────────────────

function seed(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

function makeRand(s: number): () => number {
  let state = s;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ── Festival hints (same calendar as value Sales Insights) ────────────────

function festivalHint(label: string): string | undefined {
  const l = label.toLowerCase();
  if (l.includes('jan')) return 'Republic Day window — entry tier moves on flash promos';
  if (l.includes('feb')) return 'Valentine\'s — upper tier gifting +12% LY';
  if (l.includes('mar')) return 'EOSS clearance — heavy markdowns end of month';
  if (l.includes('apr')) return 'Summer launch — light fabrics gain share';
  if (l.includes('may')) return 'Pre-monsoon clearance pressure on premium tiers';
  if (l.includes('jun')) return 'Monsoon — footfall dip, online share up';
  if (l.includes('jul')) return 'Mid-year sale — core tier outperforms';
  if (l.includes('aug')) return 'Independence Day promos — entry tier surge';
  if (l.includes('sep')) return 'Onam + pre-festive — upper tier warms up';
  if (l.includes('oct')) return 'Diwali peak — upper + statement +25% LY';
  if (l.includes('nov')) return 'Diwali / Karva Chauth — premium gifting wave';
  if (l.includes('dec')) return 'Christmas / NYE — gifting lifts upper tier';
  return undefined;
}

// ── Generator ─────────────────────────────────────────────────────────────

/**
 * Build deterministic LY insights for one OTB row. `bandIds` is the set of
 * bands to score (skips bands not configured for the category).
 */
export function generateOptionPlanInsights(args: {
  otb_code: string;
  ly_period_label: string;
  category_label: string;
  band_ids: MrpBand['id'][];
}): OptionPlanInsights {
  const rand = makeRand(seed(args.otb_code));

  const lyTotalOptions = 30 + Math.floor(rand() * 35);                 // 30..64
  const lyTotalUnits = 4_000 + Math.floor(rand() * 5_000);             // 4k..9k
  const lyTotalRevenue = 6_000_000 + Math.floor(rand() * 5_000_000);   // 60L..110L
  const lyST = clamp(Math.round(72 + (rand() * 16 - 8)), 55, 90);      // ~72±8
  const lyMargin = clamp(Math.round(68 + (rand() * 10 - 5)), 55, 80);
  const lyReturn = round1(clamp(2.4 + (rand() * 1.6 - 0.8), 1.0, 4.5));

  const trends: OptionPlanInsights['trend_chips'] = [
    { label: 'Linen',       delta_pct: round1(20 + rand() * 20) },     // +20..+40
    { label: 'Slim Fit',    delta_pct: round1(-25 + rand() * 15) },    // -25..-10
    { label: 'Checks',      delta_pct: round1(10 + rand() * 18) },
    { label: 'Polyester',   delta_pct: round1(-15 + rand() * 10) },
    { label: 'Plain',       delta_pct: round1(-2 + rand() * 6) },
  ];

  const perBandPerType: BandOptionTypeInsights[] = [];
  for (const bandId of args.band_ids) {
    perBandPerType.push(
      makeTypeBlock(bandId, OPTION_TYPES.FABRIC_TYPE,
        SUB_TYPE_CATALOGUE[OPTION_TYPES.FABRIC_TYPE], rand),
      makeTypeBlock(bandId, OPTION_TYPES.FIT,
        SUB_TYPE_CATALOGUE[OPTION_TYPES.FIT], rand),
      makeTypeBlock(bandId, OPTION_TYPES.COMPOSITION,
        SUB_TYPE_CATALOGUE[OPTION_TYPES.COMPOSITION], rand),
    );
  }

  return {
    ly_period_label: args.ly_period_label,
    category_label: args.category_label,
    ly_total_options: lyTotalOptions,
    ly_total_units: lyTotalUnits,
    ly_total_revenue: lyTotalRevenue,
    ly_avg_options_per_band: Math.max(1, Math.round(lyTotalOptions / Math.max(1, args.band_ids.length))),
    ly_sell_through_pct: lyST,
    ly_realized_margin_pct: lyMargin,
    ly_return_pct: lyReturn,
    trend_chips: trends,
    festival_hint: festivalHint(args.ly_period_label),
    per_band_per_type: perBandPerType,
  };
}

/**
 * Build one (band, option_type) block. Volume shares sum to 100; ST/margin/
 * return rates wobble around realistic tier-specific anchors.
 */
function makeTypeBlock(
  bandId: MrpBand['id'],
  optionType: OptionType,
  subTypes: SubTypeOption[],
  rand: () => number,
): BandOptionTypeInsights {
  const n = subTypes.length;

  // Volume shares — tilt the first sub-type slightly for personality.
  const raw = subTypes.map((_, i) => (i === 0 ? 1.4 : 1.0) + rand() * 0.6);
  const total = raw.reduce((s, x) => s + x, 0);
  const sharesRaw = raw.map((r) => (r / total) * 100);
  // Round to whole %, then fix drift on the last element.
  const rounded = sharesRaw.map((s) => Math.round(s));
  const drift = 100 - rounded.reduce((s, x) => s + x, 0);
  rounded[rounded.length - 1] += drift;

  // Per-band ST/margin anchors mirroring fashion patterns.
  const stAnchor:     Record<MrpBand['id'], number> = { entry: 85, core: 78, upper: 70, statement: 58 };
  const mdAnchor:     Record<MrpBand['id'], number> = { entry: 8,  core: 14, upper: 22, statement: 32 };
  const marginAnchor: Record<MrpBand['id'], number> = { entry: 66, core: 72, upper: 76, statement: 80 };
  const returnAnchor: Record<MrpBand['id'], number> = { entry: 2.0, core: 2.6, upper: 3.4, statement: 4.0 };

  const subs: SubTypeLyPerformance[] = subTypes.map((st, i) => {
    const volPct = rounded[i];
    // Sub-types within an OptionType deviate slightly from band anchors so the
    // buyer sees that not all sub-types perform the same.
    const stDelta = rand() * 14 - 7;
    const mdDelta = rand() * 10 - 5;
    const marginDelta = rand() * 8 - 4;
    const retDelta = rand() * 2 - 1;
    const yoy = round1(-15 + rand() * 35); // -15..+20

    return {
      sub_type_key: st.key,
      sub_type_label: st.label,
      units: Math.max(10, Math.round(volPct * 10 + rand() * 50)),
      vol_pct: volPct,
      rev_pct: clamp(Math.round(volPct + (rand() * 6 - 3)), 0, 100),
      sell_through_pct: clamp(Math.round(stAnchor[bandId] + stDelta), 25, 98),
      markdown_depth_pct: clamp(Math.round(mdAnchor[bandId] + mdDelta), 0, 55),
      realized_margin_pct: clamp(Math.round(marginAnchor[bandId] + marginDelta), 35, 88),
      return_pct: round1(clamp(returnAnchor[bandId] + retDelta, 0.5, 7.5)),
      yoy_pct: yoy,
    };
  });

  return { band_id: bandId, option_type: optionType, sub_types: subs };
}

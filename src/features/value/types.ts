/**
 * Value Plan domain types — in-session, Redux-backed (no persistence).
 *
 * One ValuePlan per released OTB row, keyed by `otb_code`. The category's
 * 4 paired MRP × cost bands come from master data (see
 * `mockData/brands.ts`); the BandAllocation rows below carry only the
 * buyer's decisions.
 */

import type { VpState } from './constants';
import type { MrpBand } from '@/features/otb/types';

export interface ValuePlan {
  /** FK to the released OTB row this plan is splitting. */
  otb_code: string;
  /** Period · brand · category — copied at init so downstream consumers
   *  don't need to re-resolve through the annual plan. */
  period_key: string;
  brand_uuid: string;
  category_uuid: string;
  /** OTB budget at the last edit. Used to detect staleness if the parent
   *  OTB is re-released with a different value (see VALUE_PLAN_SPEC.md). */
  budget_snapshot: number;
  state: VpState;
  /** Exactly 4 rows, ordered cheapest → most expensive (entry → statement). */
  bands: BandAllocation[];
  created_at: number;
  submitted_at?: number;
  approved_at?: number;
}

export interface BandAllocation {
  band_id: MrpBand['id'];   // 'entry' | 'core' | 'upper' | 'statement'
  budget_pct: number;        // 0-100; Σ must = 100 at submit
  avg_mrp: number;           // clamped to band's mrp_min/mrp_max
  avg_cost: number;          // clamped to band's cost_min/cost_max
}

/**
 * Decorated view of a released OTB row used by the Value Plan dashboard.
 * Joins annual-plan row data + the band definitions + the (optional) VP.
 */
export interface ReleasedOtbRow {
  otb_code: string;
  period_key: string;
  period_label: string;
  brand_uuid: string;
  brand_name: string;
  category_uuid: string;
  category_name: string;
  budget: number;           // calcOtb(row) at lock time
  released_at: number;
  released_by?: string;
}

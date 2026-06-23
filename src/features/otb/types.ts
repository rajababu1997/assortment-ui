/**
 * OTB Planning domain types — in-session, Redux-backed (no persistence).
 */

import type { OtbState } from './constants';

export interface Brand {
  uuid: string;
  code: string;
  name: string;
}

export interface Category {
  uuid: string;
  brand_uuid: string;
  code: string;
  name: string;
  /**
   * Paired MRP × cost bands for downstream Value-Plan work. Always 4
   * ordered cheapest → most expensive. Cost range is keyed to the MRP
   * range (one cost band per MRP band) so the buyer enters a single
   * %-split per band instead of two independent splits.
   */
  bands: MrpBand[];
}

/**
 * One row in a category's price-cost cascade. Used by Value Plan (Step 2)
 * to let the Buyer split a released OTB ceiling across price tiers, and
 * to surface the implied margin against the cost range of each tier.
 */
export interface MrpBand {
  id: 'entry' | 'core' | 'upper' | 'statement';
  label: string;
  mrp_min: number;
  /** `null` = open-ended top (e.g. "1799+"). */
  mrp_max: number | null;
  cost_min: number;
  cost_max: number;
}

/**
 * A period is a logical planning slot derived from setup (cycle + horizon).
 * `key` is stable across renders ("2026-04", "2026-W14", "2026-Q1").
 */
export interface Period {
  key: string;
  label: string;
  index: number;
  start_iso: string;
  end_iso: string;
  lock_deadline_iso: string;
}

export interface OtbRow {
  row_id: string;
  /**
   * Human-readable, period-scoped business identifier for this OTB row.
   * Format: `OTB-{periodKey}-{categoryCode}` — e.g. `OTB-2026-04-ZARA-WTOP`.
   * Uniqueness: one code per (period_key, brand_uuid, category_uuid).
   * Stable from creation; survives edits to the numeric fields. The backend
   * is the eventual source of truth — see `OTB_CODE_SPEC.md`.
   */
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  planned_sales: number;
  markdowns: number;
  eom_inventory: number;
  bom_inventory: number;
  on_order: number;
}

export interface PeriodPlan {
  period_key: string;
  state: OtbState;
  rows: OtbRow[];
  baseline_rows?: OtbRow[];
  locked_at?: number;
  locked_by?: string;
  skipped_at?: number;
}

export interface AnnualPlan {
  /**
   * Deterministic business id, derived from `plan_start_iso` + `plan_end_iso`.
   * Format: `AP-YYYYMMDD-YYYYMMDD`. Uniqueness scope: per tenant.
   * Two plans with identical (start, end) collapse to the same id — re-init
   * is idempotent. See utils/planId.ts.
   */
  plan_id: string;
  /** Display name, e.g. "FY 2026-27", "CY 2026", or a date-range fallback. */
  name: string;
  state: OtbState;
  /**
   * Total budget covering the entire planning horizon. Σ of all OTB rows
   * across all periods must stay ≤ this value at Submit time.
   * Set at plan creation (was previously in Setup as `annual_budget`).
   */
  overall_budget: number;
  /**
   * Calendar date this plan's first period starts on, ISO YYYY-MM-DD.
   * Was previously `Company.fiscal_year_start` in Setup. Moved here so
   * each plan can pick its own start (e.g. Apr 1 2026 for FY26, or a
   * shorter off-cycle replan) without re-running Setup.
   */
  plan_start_iso: string;
  /** Calendar date the last period ends on, ISO YYYY-MM-DD. */
  plan_end_iso: string;
  created_at: number;
  /** Stamp of Submit (which flips the plan directly to APPROVED). */
  approved_at?: number;
  periods: Record<string, PeriodPlan>;
}

export interface MockActuals {
  period_key: string;
  planned_sales: number;
  actual_sales: number;
  planned_markdowns: number;
  actual_markdowns: number;
  planned_sell_through_pct: number;
  actual_sell_through_pct: number;
  planned_eom: number;
  actual_eom: number;
  insight: string;
}

export function calcOtb(row: Pick<OtbRow, 'planned_sales' | 'markdowns' | 'eom_inventory' | 'bom_inventory' | 'on_order'>): number {
  return row.planned_sales + row.markdowns + row.eom_inventory - row.bom_inventory - row.on_order;
}

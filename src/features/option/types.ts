/**
 * Option Plan domain types — UI side (snake_case).
 *
 * Two layers:
 *   - Editor model (OptionPlan + bands + lines + comments) — Redux-backed
 *     in-session draft state, hydrated from the server on page load.
 *   - List-view row (OptionPlanRow) — what /option/all renders. Joined
 *     server-side with parent plan + OTB row context.
 */

import type { MrpBand } from '@/features/otb/types';
import type { OpAction, OpState, OptionType } from './constants';

export interface OptionLine {
  /** Sub-grid coordinate within a band. */
  option_type: OptionType;
  sub_type_key: string;
  sub_type_label: string;
  qty: number;
}

export interface OptionBand {
  band_id: MrpBand['id']; // 'entry' | 'core' | 'upper' | 'statement'
  /** Buyer-typed input. Floor to whole number; 0 = parked. */
  avg_production_qty_per_option: number;
  /** Server-derived: floor(production_qty / avg_per_option). Echoed on read. */
  option_plan_qty: number;
  /** Server-derived: floor(band_budget / vp.avg_cost). Echoed for KPI strip. */
  production_qty_snapshot: number;
  lines: OptionLine[];
}

export interface OptionComment {
  uuid?: string;
  round_no: number;
  author_role?: string;       // BUYER / DESIGNER / ADMIN (or null at service layer)
  author_user_id?: string;
  author_name?: string;       // Decorated server-side from the user table
  action: OpAction;
  body?: string;
  created_time?: number;
}

export interface OptionPlan {
  uuid?: string;
  plan_uuid: string;
  period_key: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  budget_snapshot: number;
  state: OpState;
  current_round_no: number;
  bands: OptionBand[];
  comments: OptionComment[];
  submitted_at?: number;
  approved_at?: number;
  created_at?: number;
  modified_time?: number;
}

/** One row in the /option/all table. Server-decorated with parent context. */
export interface OptionPlanRow {
  plan_id: string;
  plan_name?: string;
  plan_start_iso: string;
  plan_end_iso: string;
  period_key: string;
  period_start_iso?: string;
  period_end_iso?: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  budget_snapshot: number;
  current_budget: number;
  is_stale: boolean;
  state: OpState;
  current_round_no: number;
  submitted_at?: number;
  approved_at?: number;
  modified_time?: number;
  bands: OptionBand[];
  comment_count: number;
  last_comment_body?: string;
  last_comment_author_role?: string;
}

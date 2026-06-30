/**
 * Types for the OTB lifecycle layer: the All-OTBs grid + per-OTB detail page.
 * Mirrors the server DTOs (OtbRowView / OtbRowDetailView / OtbLifecycleEvent)
 * in snake_case so the rest of the frontend stays consistent.
 */

import type { OpState } from '../../option/constants';
import type { OptionBand, OptionComment } from '../../option/types';
import type { VpState } from '../../value/constants';
import type { BandAllocation } from '../../value/types';

export type LifecycleState =
  | 'planned'
  | 'released'
  | 'value_planned'
  | 'option_planned'
  | 'final_approved';

export interface OtbRowView {
  plan_id: string;
  plan_name?: string;
  plan_start_iso?: string;
  plan_end_iso?: string;
  period_key: string;
  period_start_iso?: string;
  period_end_iso?: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  otb_amount: number;
  lifecycle_state: LifecycleState;
  vp_state?: VpState;
  op_state?: OpState;
  op_current_round_no?: number;
  planned_at?: number;
  released_at?: number;
  vp_approved_at?: number;
  op_approved_at?: number;
  final_approved_at?: number;
  final_approved_by?: string;
  final_approval_note?: string;
  modified_time?: number;
}

export interface OtbLifecycleEvent {
  uuid?: string;
  plan_uuid: string;
  otb_code: string;
  from_state?: LifecycleState;
  to_state: LifecycleState;
  event_at: number;
  event_by?: string;
  event_by_role?: string;
  note?: string;
  created_time?: number;
}

/** OTB row baseline + lifecycle fields — surfaced on the detail page. */
export interface OtbRowBaseline {
  uuid?: string;
  plan_uuid: string;
  period_key: string;
  brand_uuid: string;
  category_uuid: string;
  otb_code: string;
  planned_sales: number;
  markdowns: number;
  eom_inventory: number;
  bom_inventory: number;
  on_order: number;
  baseline_planned_sales?: number;
  baseline_markdowns?: number;
  baseline_eom_inventory?: number;
  baseline_bom_inventory?: number;
  baseline_on_order?: number;
  lifecycle_state: LifecycleState;
  final_approved_at?: number;
  final_approved_by?: string;
  final_approval_note?: string;
  otb_amount: number;
}

export interface ValuePlanDetail {
  uuid?: string;
  state: VpState;
  budget_snapshot: number;
  submitted_at?: number;
  approved_at?: number;
  bands: BandAllocation[];
}

export interface OptionPlanDetail {
  uuid?: string;
  state: OpState;
  budget_snapshot: number;
  current_round_no: number;
  submitted_at?: number;
  approved_at?: number;
  bands: OptionBand[];
  comments: OptionComment[];
}

export interface OtbRowDetailView {
  summary: OtbRowView;
  row: OtbRowBaseline;
  value_plan?: ValuePlanDetail;
  option_plan?: OptionPlanDetail;
  timeline: OtbLifecycleEvent[];
}

/**
 * OTB lifecycle API — All-OTBs grid + detail page + Final Approval.
 *
 * Server returns camelCase DTOs; we map to snake_case at the boundary so the
 * rest of the frontend stays consistent.
 */

import { invokeService } from '@/services/invokeService';
import { API_CONFIG } from '@/constants/apiConfig';
import type { OpState } from '../../option/constants';
import type { OptionType } from '../../option/constants';
import type { VpState } from '../../value/constants';
import type {
  LifecycleState,
  OtbLifecycleEvent,
  OtbRowBaseline,
  OtbRowDetailView,
  OtbRowView,
  ValuePlanDetail,
  OptionPlanDetail,
} from './types';

// ── Wire shapes ──────────────────────────────────────────────────────────

interface OtbRowViewWire {
  planUuid: string;
  planName?: string;
  planStartIso?: string;
  planEndIso?: string;
  periodKey: string;
  periodStartIso?: string;
  periodEndIso?: string;
  otbCode: string;
  brandUuid: string;
  categoryUuid: string;
  otbAmount?: number;
  lifecycleState: LifecycleState;
  vpState?: VpState;
  opState?: OpState;
  opCurrentRoundNo?: number;
  plannedAt?: number;
  releasedAt?: number;
  vpApprovedAt?: number;
  opApprovedAt?: number;
  finalApprovedAt?: number;
  finalApprovedBy?: string;
  finalApprovalNote?: string;
  modifiedTime?: number;
}

interface OtbLifecycleEventWire {
  uuid?: string;
  planUuid: string;
  otbCode: string;
  fromState?: LifecycleState;
  toState: LifecycleState;
  eventAt: number;
  eventBy?: string;
  eventByRole?: string;
  note?: string;
  createdTime?: number;
}

interface OtbRowBaselineWire {
  uuid?: string;
  planUuid: string;
  periodKey: string;
  brandUuid: string;
  categoryUuid: string;
  otbCode: string;
  plannedSales?: number;
  markdowns?: number;
  eomInventory?: number;
  bomInventory?: number;
  onOrder?: number;
  baselinePlannedSales?: number;
  baselineMarkdowns?: number;
  baselineEomInventory?: number;
  baselineBomInventory?: number;
  baselineOnOrder?: number;
  lifecycleState: LifecycleState;
  finalApprovedAt?: number;
  finalApprovedBy?: string;
  finalApprovalNote?: string;
  otbAmount?: number;
}

interface ValuePlanBandWire {
  bandId: 'entry' | 'core' | 'upper' | 'statement';
  budgetPct?: number;
  avgMrp?: number;
  avgCost?: number;
}

interface ValuePlanWire {
  uuid?: string;
  state: VpState;
  budgetSnapshot?: number;
  submittedAt?: number;
  approvedAt?: number;
  bands?: ValuePlanBandWire[];
}

interface OptionPlanLineWire {
  optionType: OptionType;
  subTypeKey: string;
  subTypeLabel: string;
  qty?: number;
}

interface OptionPlanBandWire {
  bandId: 'entry' | 'core' | 'upper' | 'statement';
  avgProductionQtyPerOption?: number;
  optionPlanQty?: number;
  productionQtySnapshot?: number;
  lines?: OptionPlanLineWire[];
}

interface OptionPlanCommentWire {
  uuid?: string;
  roundNo?: number;
  authorRole?: string;
  authorUserId?: string;
  authorName?: string;
  action: 'save_draft' | 'submit' | 'approve' | 'request_revisions' | 'note';
  body?: string;
  createdTime?: number;
}

interface OptionPlanWire {
  uuid?: string;
  state: OpState;
  budgetSnapshot?: number;
  currentRoundNo?: number;
  submittedAt?: number;
  approvedAt?: number;
  bands?: OptionPlanBandWire[];
  comments?: OptionPlanCommentWire[];
}

interface OtbRowDetailWire {
  summary: OtbRowViewWire;
  row: OtbRowBaselineWire;
  valuePlan?: ValuePlanWire;
  optionPlan?: OptionPlanWire;
  timeline?: OtbLifecycleEventWire[];
}

// ── Mappers ──────────────────────────────────────────────────────────────

const fromWireRow = (w: OtbRowViewWire): OtbRowView => ({
  plan_id: w.planUuid,
  plan_name: w.planName,
  plan_start_iso: w.planStartIso,
  plan_end_iso: w.planEndIso,
  period_key: w.periodKey,
  period_start_iso: w.periodStartIso,
  period_end_iso: w.periodEndIso,
  otb_code: w.otbCode,
  brand_uuid: w.brandUuid,
  category_uuid: w.categoryUuid,
  otb_amount: w.otbAmount ?? 0,
  lifecycle_state: w.lifecycleState,
  vp_state: w.vpState,
  op_state: w.opState,
  op_current_round_no: w.opCurrentRoundNo,
  planned_at: w.plannedAt,
  released_at: w.releasedAt,
  vp_approved_at: w.vpApprovedAt,
  op_approved_at: w.opApprovedAt,
  final_approved_at: w.finalApprovedAt,
  final_approved_by: w.finalApprovedBy,
  final_approval_note: w.finalApprovalNote,
  modified_time: w.modifiedTime,
});

const fromWireEvent = (w: OtbLifecycleEventWire): OtbLifecycleEvent => ({
  uuid: w.uuid,
  plan_uuid: w.planUuid,
  otb_code: w.otbCode,
  from_state: w.fromState,
  to_state: w.toState,
  event_at: w.eventAt,
  event_by: w.eventBy,
  event_by_role: w.eventByRole,
  note: w.note,
  created_time: w.createdTime,
});

const fromWireBaseline = (w: OtbRowBaselineWire): OtbRowBaseline => ({
  uuid: w.uuid,
  plan_uuid: w.planUuid,
  period_key: w.periodKey,
  brand_uuid: w.brandUuid,
  category_uuid: w.categoryUuid,
  otb_code: w.otbCode,
  planned_sales: w.plannedSales ?? 0,
  markdowns: w.markdowns ?? 0,
  eom_inventory: w.eomInventory ?? 0,
  bom_inventory: w.bomInventory ?? 0,
  on_order: w.onOrder ?? 0,
  baseline_planned_sales: w.baselinePlannedSales,
  baseline_markdowns: w.baselineMarkdowns,
  baseline_eom_inventory: w.baselineEomInventory,
  baseline_bom_inventory: w.baselineBomInventory,
  baseline_on_order: w.baselineOnOrder,
  lifecycle_state: w.lifecycleState,
  final_approved_at: w.finalApprovedAt,
  final_approved_by: w.finalApprovedBy,
  final_approval_note: w.finalApprovalNote,
  otb_amount: w.otbAmount ?? 0,
});

const fromWireVp = (w: ValuePlanWire): ValuePlanDetail => ({
  uuid: w.uuid,
  state: w.state,
  budget_snapshot: w.budgetSnapshot ?? 0,
  submitted_at: w.submittedAt,
  approved_at: w.approvedAt,
  bands: (w.bands ?? []).map((b) => ({
    band_id: b.bandId,
    budget_pct: b.budgetPct ?? 0,
    avg_mrp: b.avgMrp ?? 0,
    avg_cost: b.avgCost ?? 0,
  })),
});

const fromWireOp = (w: OptionPlanWire): OptionPlanDetail => ({
  uuid: w.uuid,
  state: w.state,
  budget_snapshot: w.budgetSnapshot ?? 0,
  current_round_no: w.currentRoundNo ?? 1,
  submitted_at: w.submittedAt,
  approved_at: w.approvedAt,
  bands: (w.bands ?? []).map((b) => ({
    band_id: b.bandId,
    avg_production_qty_per_option: b.avgProductionQtyPerOption ?? 0,
    option_plan_qty: b.optionPlanQty ?? 0,
    production_qty_snapshot: b.productionQtySnapshot ?? 0,
    lines: (b.lines ?? []).map((l) => ({
      option_type: l.optionType,
      sub_type_key: l.subTypeKey,
      sub_type_label: l.subTypeLabel,
      qty: l.qty ?? 0,
    })),
  })),
  comments: (w.comments ?? []).map((c) => ({
    uuid: c.uuid,
    round_no: c.roundNo ?? 1,
    author_role: c.authorRole,
    author_user_id: c.authorUserId,
    author_name: c.authorName,
    action: c.action,
    body: c.body,
    created_time: c.createdTime,
  })),
});

const fromWireDetail = (w: OtbRowDetailWire): OtbRowDetailView => ({
  summary: fromWireRow(w.summary),
  row: fromWireBaseline(w.row),
  value_plan: w.valuePlan ? fromWireVp(w.valuePlan) : undefined,
  option_plan: w.optionPlan ? fromWireOp(w.optionPlan) : undefined,
  timeline: (w.timeline ?? []).map(fromWireEvent),
});

// ── Public API ───────────────────────────────────────────────────────────

export const otbLifecycleApi = {
  list: async (fromIso?: string, toIso?: string): Promise<OtbRowView[]> => {
    if (!fromIso && !toIso) {
      const wire = await invokeService<OtbRowViewWire[]>(API_CONFIG.otb.lifecycleAll);
      return wire.map(fromWireRow);
    }
    const wire = await invokeService<OtbRowViewWire[]>(
      API_CONFIG.otb.lifecycleAllRange,
      { from: fromIso || '_', to: toIso || '_' },
    );
    return wire.map(fromWireRow);
  },

  detail: async (planId: string, otbCode: string): Promise<OtbRowDetailView | null> => {
    const wire = await invokeService<OtbRowDetailWire | null>(
      API_CONFIG.otb.lifecycleDetail,
      { planId, otbCode },
    );
    return wire ? fromWireDetail(wire) : null;
  },

  timeline: async (planId: string, otbCode: string): Promise<OtbLifecycleEvent[]> => {
    const wire = await invokeService<OtbLifecycleEventWire[]>(
      API_CONFIG.otb.lifecycleTimeline,
      { planId, otbCode },
    );
    return wire.map(fromWireEvent);
  },

  finalApprove: async (
    planId: string,
    otbCode: string,
    note?: string,
  ): Promise<OtbRowBaseline> => {
    const wire = await invokeService<OtbRowBaselineWire>(
      API_CONFIG.otb.lifecycleFinalApprove,
      { planId, otbCode },
      { note },
    );
    return fromWireBaseline(wire);
  },
};

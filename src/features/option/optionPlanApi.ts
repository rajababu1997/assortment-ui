/**
 * Option Plan API — Step 3 server persistence.
 *
 * Backend stores OP header + bands + lines + append-only comment thread.
 * The frontend keeps an in-session draft in `optionPlanSlice`; hydration
 * from the server happens on page mount via the TanStack hooks.
 */

import { invokeService } from '@/services/invokeService';
import { API_CONFIG } from '@/constants/apiConfig';
import type {
  OptionBand,
  OptionComment,
  OptionLine,
  OptionPlan,
  OptionPlanRow,
} from './types';
import type { OpAction, OpState, OptionType } from './constants';

// ── Backend wire shapes (camelCase, Domain audit columns) ────────────────

interface OtbOptionPlanLineWire {
  uuid?: string;
  optionType: OptionType;
  subTypeKey: string;
  subTypeLabel: string;
  qty: number;
}

interface OtbOptionPlanBandWire {
  uuid?: string;
  bandId: OptionBand['band_id'];
  avgProductionQtyPerOption: number;
  optionPlanQty: number;
  productionQtySnapshot: number;
  lines?: OtbOptionPlanLineWire[];
}

interface OtbOptionPlanCommentWire {
  uuid?: string;
  roundNo: number;
  authorRole?: string;
  authorUserId?: string;
  authorName?: string;
  action: OpAction;
  body?: string;
  createdTime?: number;
}

interface OtbOptionPlanWire {
  uuid?: string;
  planUuid: string;
  periodKey: string;
  otbCode: string;
  brandUuid: string;
  categoryUuid: string;
  budgetSnapshot: number;
  state: OpState;
  currentRoundNo: number;
  submittedAt?: number;
  approvedAt?: number;
  createdTime?: number;
  modifiedTime?: number;
  bands?: OtbOptionPlanBandWire[];
  comments?: OtbOptionPlanCommentWire[];
}

interface OptionPlanRowWire {
  uuid?: string;
  planUuid: string;
  planName?: string;
  planStartIso: string;
  planEndIso: string;
  periodKey: string;
  periodStartIso?: string;
  periodEndIso?: string;
  otbCode: string;
  brandUuid: string;
  categoryUuid: string;
  budgetSnapshot: number;
  currentBudget: number;
  state: OpState;
  currentRoundNo: number;
  submittedAt?: number;
  approvedAt?: number;
  modifiedTime?: number;
  bands?: OtbOptionPlanBandWire[];
  commentCount?: number;
  lastCommentBody?: string;
  lastCommentAuthorRole?: string;
}

// ── Mappers ──────────────────────────────────────────────────────────────

const toWireLine = (l: OptionLine): OtbOptionPlanLineWire => ({
  optionType: l.option_type,
  subTypeKey: l.sub_type_key,
  subTypeLabel: l.sub_type_label,
  qty: l.qty,
});

const fromWireLine = (w: OtbOptionPlanLineWire): OptionLine => ({
  option_type: w.optionType,
  sub_type_key: w.subTypeKey,
  sub_type_label: w.subTypeLabel,
  qty: w.qty ?? 0,
});

const toWireBand = (b: OptionBand): OtbOptionPlanBandWire => ({
  bandId: b.band_id,
  avgProductionQtyPerOption: b.avg_production_qty_per_option,
  optionPlanQty: b.option_plan_qty,
  productionQtySnapshot: b.production_qty_snapshot,
  lines: b.lines.map(toWireLine),
});

const fromWireBand = (w: OtbOptionPlanBandWire): OptionBand => ({
  band_id: w.bandId,
  avg_production_qty_per_option: w.avgProductionQtyPerOption ?? 0,
  option_plan_qty: w.optionPlanQty ?? 0,
  production_qty_snapshot: w.productionQtySnapshot ?? 0,
  lines: (w.lines ?? []).map(fromWireLine),
});

const fromWireComment = (w: OtbOptionPlanCommentWire): OptionComment => ({
  uuid: w.uuid,
  round_no: w.roundNo ?? 1,
  author_role: w.authorRole,
  author_user_id: w.authorUserId,
  author_name: w.authorName,
  action: w.action,
  body: w.body,
  created_time: w.createdTime,
});

const fromWire = (w: OtbOptionPlanWire): OptionPlan => ({
  uuid: w.uuid,
  plan_uuid: w.planUuid,
  period_key: w.periodKey,
  otb_code: w.otbCode,
  brand_uuid: w.brandUuid,
  category_uuid: w.categoryUuid,
  budget_snapshot: w.budgetSnapshot ?? 0,
  state: w.state,
  current_round_no: w.currentRoundNo ?? 1,
  bands: (w.bands ?? []).map(fromWireBand),
  comments: (w.comments ?? []).map(fromWireComment),
  submitted_at: w.submittedAt,
  approved_at: w.approvedAt,
  created_at: w.createdTime,
  modified_time: w.modifiedTime,
});

const fromWireRow = (w: OptionPlanRowWire): OptionPlanRow => ({
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
  budget_snapshot: w.budgetSnapshot ?? 0,
  current_budget: w.currentBudget ?? 0,
  is_stale: (w.currentBudget ?? 0) !== (w.budgetSnapshot ?? 0),
  state: w.state,
  current_round_no: w.currentRoundNo ?? 1,
  submitted_at: w.submittedAt,
  approved_at: w.approvedAt,
  modified_time: w.modifiedTime,
  bands: (w.bands ?? []).map(fromWireBand),
  comment_count: w.commentCount ?? 0,
  last_comment_body: w.lastCommentBody,
  last_comment_author_role: w.lastCommentAuthorRole,
});

// ── Public API ───────────────────────────────────────────────────────────

export interface SaveBody {
  action: OpAction;
  budget_snapshot?: number;
  /** Required for REQUEST_REVISIONS (5..2000 chars). Optional for SUBMIT/APPROVE. */
  comment?: string;
  bands?: OptionBand[];
}

export const optionPlanApi = {
  /** All OPs for the tenant — drives /option/all. `_` = no bound on either side. */
  list: async (fromIso?: string, toIso?: string): Promise<OptionPlanRow[]> => {
    if (!fromIso && !toIso) {
      const wire = await invokeService<OptionPlanRowWire[]>(API_CONFIG.otb.optionAll);
      return wire.map(fromWireRow);
    }
    const wire = await invokeService<OptionPlanRowWire[]>(
      API_CONFIG.otb.optionAllRange,
      { from: fromIso || '_', to: toIso || '_' },
    );
    return wire.map(fromWireRow);
  },

  byPlan: async (planId: string): Promise<OptionPlan[]> => {
    const wire = await invokeService<OtbOptionPlanWire[]>(
      API_CONFIG.otb.optionByPlan,
      { planId },
    );
    return wire.map(fromWire);
  },

  byOtbCode: async (planId: string, otbCode: string): Promise<OptionPlan | null> => {
    const wire = await invokeService<OtbOptionPlanWire | null>(
      API_CONFIG.otb.optionByOtbCode,
      { planId, otbCode },
    );
    return wire ? fromWire(wire) : null;
  },

  save: async (planId: string, otbCode: string, body: SaveBody): Promise<OptionPlan> => {
    const wire = await invokeService<OtbOptionPlanWire>(
      API_CONFIG.otb.optionSave,
      { planId, otbCode },
      {
        action: body.action,
        budgetSnapshot: body.budget_snapshot,
        comment: body.comment,
        bands: body.bands?.map(toWireBand),
      },
    );
    return fromWire(wire);
  },

  /** Free-form NOTE on the conversation thread — doesn't change state. */
  addNote: async (planId: string, otbCode: string, body: string): Promise<OptionComment> => {
    const wire = await invokeService<OtbOptionPlanCommentWire>(
      API_CONFIG.otb.optionAddNote,
      { planId, otbCode },
      { body },
    );
    return fromWireComment(wire);
  },

  /** Returns true if every released OTB in (planId, periodKey) has an APPROVED VP. */
  isMonthReady: async (planId: string, periodKey: string): Promise<boolean> =>
    invokeService<boolean>(API_CONFIG.otb.optionMonthReady, { planId, periodKey }),

  delete: async (planId: string, otbCode: string): Promise<void> => {
    await invokeService(API_CONFIG.otb.optionDelete, { planId, otbCode });
  },
};

/**
 * Value Plan API — Phase 5 server persistence.
 *
 * Server stores VP header (one row per released OTB code) + 4 bands. The
 * frontend keeps an in-session edit buffer in `valuePlanSlice` and hydrates
 * from `useApiValuePlans` on page mount.
 */

import { invokeService } from '@/services/invokeService';
import { API_CONFIG } from '@/constants/apiConfig';
import type { BandAllocation, ValuePlan } from './types';
import type { VpState } from './constants';

// ── Backend wire shapes (camelCase, Domain audit columns) ────────────

interface OtbValuePlanBandWire {
  uuid?: string;
  bandId: BandAllocation['band_id'];
  budgetPct: number;
  avgMrp: number;
  avgCost: number;
}

interface OtbValuePlanWire {
  uuid?: string;
  planUuid: string;
  periodKey: string;
  otbCode: string;
  brandUuid: string;
  categoryUuid: string;
  budgetSnapshot: number;
  state: VpState;
  submittedAt?: number;
  approvedAt?: number;
  createdTime?: number;
  modifiedTime?: number;
  bands?: OtbValuePlanBandWire[];
}

/** Decorated row for the All-VPs table (server joins parent plan + OTB row). */
export interface ValuePlanRowWire {
  uuid?: string;
  planUuid: string;
  planName?: string;
  planStartIso: string;
  planEndIso: string;
  periodKey: string;
  /** Period start (ISO YYYY-MM-DD) — derived server-side from period_key. */
  periodStartIso?: string;
  periodEndIso?: string;
  otbCode: string;
  brandUuid: string;
  categoryUuid: string;
  budgetSnapshot: number;
  currentBudget: number;
  state: VpState;
  submittedAt?: number;
  approvedAt?: number;
  modifiedTime?: number;
  bands?: OtbValuePlanBandWire[];
}

/** UI shape for one row in the All-VPs table. Brand/category names are
 *  resolved client-side via useBrandCategoryLookup. */
export interface ValuePlanRow {
  plan_id: string;
  plan_name?: string;
  plan_start_iso: string;
  plan_end_iso: string;
  period_key: string;
  /** Period boundaries derived server-side from period_key. */
  period_start_iso?: string;
  period_end_iso?: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  budget_snapshot: number;
  current_budget: number;
  is_stale: boolean;
  state: VpState;
  submitted_at?: number;
  approved_at?: number;
  modified_time?: number;
  bands: BandAllocation[];
}

// ── Mappers ─────────────────────────────────────────────────────────

const toWireBand = (b: BandAllocation): OtbValuePlanBandWire => ({
  bandId: b.band_id,
  budgetPct: b.budget_pct,
  avgMrp: b.avg_mrp,
  avgCost: b.avg_cost,
});

const fromWireBand = (w: OtbValuePlanBandWire): BandAllocation => ({
  band_id: w.bandId,
  budget_pct: w.budgetPct ?? 0,
  avg_mrp: w.avgMrp ?? 0,
  avg_cost: w.avgCost ?? 0,
});

const fromWire = (w: OtbValuePlanWire): ValuePlan => ({
  otb_code: w.otbCode,
  period_key: w.periodKey,
  brand_uuid: w.brandUuid,
  category_uuid: w.categoryUuid,
  budget_snapshot: w.budgetSnapshot ?? 0,
  state: w.state,
  bands: (w.bands ?? []).map(fromWireBand),
  created_at: w.createdTime ?? 0,
  submitted_at: w.submittedAt,
  approved_at: w.approvedAt,
});

const fromWireRow = (w: ValuePlanRowWire): ValuePlanRow => ({
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
  submitted_at: w.submittedAt,
  approved_at: w.approvedAt,
  modified_time: w.modifiedTime,
  bands: (w.bands ?? []).map(fromWireBand),
});

// ── Public API ───────────────────────────────────────────────────────

export const valuePlanApi = {
  /**
   * All VPs for the tenant — drives the All-VPs table. Optional `fromIso` /
   * `toIso` (YYYY-MM-DD) constrain the rows to VPs whose period overlaps
   * the range. When either is omitted the server uses `_` as "no bound".
   */
  list: async (fromIso?: string, toIso?: string): Promise<ValuePlanRow[]> => {
    if (!fromIso && !toIso) {
      const wire = await invokeService<ValuePlanRowWire[]>(API_CONFIG.otb.valueAll);
      return wire.map(fromWireRow);
    }
    const wire = await invokeService<ValuePlanRowWire[]>(
      API_CONFIG.otb.valueAllRange,
      { from: fromIso || '_', to: toIso || '_' },
    );
    return wire.map(fromWireRow);
  },

  /** All VPs under one annual plan — drives dashboard hydration. */
  byPlan: async (planId: string): Promise<ValuePlan[]> => {
    const wire = await invokeService<OtbValuePlanWire[]>(
      API_CONFIG.otb.valueByPlan,
      { planId },
    );
    return wire.map(fromWire);
  },

  byOtbCode: async (planId: string, otbCode: string): Promise<ValuePlan | null> => {
    const wire = await invokeService<OtbValuePlanWire | null>(
      API_CONFIG.otb.valueByOtbCode,
      { planId, otbCode },
    );
    return wire ? fromWire(wire) : null;
  },

  save: async (
    planId: string,
    otbCode: string,
    body: { state: VpState; budget_snapshot: number; bands: BandAllocation[] },
  ): Promise<ValuePlan> => {
    const wire = await invokeService<OtbValuePlanWire>(
      API_CONFIG.otb.valueSave,
      { planId, otbCode },
      {
        state: body.state,
        budgetSnapshot: body.budget_snapshot,
        bands: body.bands.map(toWireBand),
      },
    );
    return fromWire(wire);
  },

  delete: async (planId: string, otbCode: string): Promise<void> => {
    await invokeService(API_CONFIG.otb.valueDelete, { planId, otbCode });
  },
};

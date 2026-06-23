/**
 * Annual Plan API — Phase 2 server persistence.
 *
 * Backend stores plan metadata + period skeletons. OTB rows are still
 * in Redux for Phase 2 (rows land server-side in Phase 3).
 */

import { invokeService } from '@/services/invokeService';
import { API_CONFIG } from '@/constants/apiConfig';
import type { AnnualPlan, OtbRow, PeriodPlan } from './types';
import { calcOtb } from './types';
import type { OtbState } from './constants';

// ── Backend wire shapes (camelCase, Domain audit columns) ────────────

interface OtbRowWire {
  uuid?: string;
  brandUuid: string;
  categoryUuid: string;
  otbCode: string;
  plannedSales?: number;
  markdowns?: number;
  eomInventory?: number;
  bomInventory?: number;
  onOrder?: number;
  /** Baseline snapshot — server populates on first APPROVED save and
   *  preserves across re-edits. Null while the parent plan is DRAFT. */
  baselinePlannedSales?: number | null;
  baselineMarkdowns?: number | null;
  baselineEomInventory?: number | null;
  baselineBomInventory?: number | null;
  baselineOnOrder?: number | null;
  /** Derived total — visible in payload + response. Server ignores on input. */
  otbAmount?: number;
}

interface PeriodPlanWire {
  uuid?: string;
  planUuid?: string;
  periodKey: string;
  state: OtbState;
  lockedAt?: number;
  lockedBy?: string;
  skippedAt?: number;
  rows?: OtbRowWire[];
}

interface AnnualPlanWire {
  uuid: string;
  name?: string;
  state: OtbState;
  overallBudget: number;
  planStartIso: string;
  planEndIso: string;
  approvedAt?: number;
  createdTime?: number;
  modifiedTime?: number;
  periods?: PeriodPlanWire[];
}

// ── Mappers ─────────────────────────────────────────────────────────

const toWireRow = (r: OtbRow): OtbRowWire => ({
  brandUuid: r.brand_uuid,
  categoryUuid: r.category_uuid,
  otbCode: r.otb_code,
  plannedSales: r.planned_sales,
  markdowns: r.markdowns,
  eomInventory: r.eom_inventory,
  bomInventory: r.bom_inventory,
  onOrder: r.on_order,
  otbAmount: calcOtb(r),
});

const fromWireRow = (w: OtbRowWire, periodKey: string): OtbRow => ({
  row_id: w.uuid ?? `${periodKey}-${w.brandUuid}-${w.categoryUuid}`,
  otb_code: w.otbCode,
  brand_uuid: w.brandUuid,
  category_uuid: w.categoryUuid,
  planned_sales: w.plannedSales ?? 0,
  markdowns: w.markdowns ?? 0,
  eom_inventory: w.eomInventory ?? 0,
  bom_inventory: w.bomInventory ?? 0,
  on_order: w.onOrder ?? 0,
});

const toWirePeriod = (p: PeriodPlan): PeriodPlanWire => ({
  periodKey: p.period_key,
  state: p.state,
  lockedAt: p.locked_at,
  lockedBy: p.locked_by,
  skippedAt: p.skipped_at,
  rows: (p.rows ?? []).map(toWireRow),
});

const fromWirePeriod = (w: PeriodPlanWire): PeriodPlan => {
  const rows = (w.rows ?? []).map((r) => fromWireRow(r, w.periodKey));
  // Reconstruct PeriodPlan.baseline_rows from the inlined baseline_* columns
  // — only when the server actually has baselines (i.e. plan has been
  // APPROVED at least once). Each baseline row carries the same shape as a
  // regular OtbRow but with the snapshot values; OtbRowTable renders them
  // as the read-only "Planned" half of the Planned-vs-Actual split.
  const wireRows = w.rows ?? [];
  const hasBaseline = wireRows.some((r) => r.baselinePlannedSales != null);
  const baseline_rows = hasBaseline
    ? wireRows.map((r, i): OtbRow => ({
        row_id: rows[i].row_id,
        otb_code: r.otbCode,
        brand_uuid: r.brandUuid,
        category_uuid: r.categoryUuid,
        planned_sales: r.baselinePlannedSales ?? 0,
        markdowns: r.baselineMarkdowns ?? 0,
        eom_inventory: r.baselineEomInventory ?? 0,
        bom_inventory: r.baselineBomInventory ?? 0,
        on_order: r.baselineOnOrder ?? 0,
      }))
    : undefined;
  return {
    period_key: w.periodKey,
    state: w.state,
    rows,
    baseline_rows,
    locked_at: w.lockedAt,
    locked_by: w.lockedBy,
    skipped_at: w.skippedAt,
  };
};

const toWire = (plan: AnnualPlan): AnnualPlanWire => ({
  uuid: plan.plan_id,
  name: plan.name,
  state: plan.state,
  overallBudget: plan.overall_budget,
  planStartIso: plan.plan_start_iso,
  planEndIso: plan.plan_end_iso,
  approvedAt: plan.approved_at,
  periods: Object.values(plan.periods).map(toWirePeriod),
});

const fromWire = (w: AnnualPlanWire): AnnualPlan => ({
  plan_id: w.uuid,
  name: w.name ?? '',
  state: w.state,
  overall_budget: w.overallBudget ?? 0,
  plan_start_iso: w.planStartIso,
  plan_end_iso: w.planEndIso,
  approved_at: w.approvedAt,
  created_at: w.createdTime ?? 0,
  periods: (w.periods ?? []).reduce<Record<string, PeriodPlan>>((acc, p) => {
    acc[p.periodKey] = fromWirePeriod(p);
    return acc;
  }, {}),
});

// ── Public API ───────────────────────────────────────────────────────

export const annualPlanApi = {
  list: async (): Promise<AnnualPlan[]> => {
    const wire = await invokeService<AnnualPlanWire[]>(API_CONFIG.otb.planAll);
    return wire.map(fromWire);
  },

  get: async (planId: string): Promise<AnnualPlan | null> => {
    const wire = await invokeService<AnnualPlanWire | null>(
      API_CONFIG.otb.planByUid,
      { uuid: planId },
    );
    return wire ? fromWire(wire) : null;
  },

  save: async (plan: AnnualPlan): Promise<AnnualPlan> => {
    const wire = await invokeService<AnnualPlanWire>(
      API_CONFIG.otb.planCreate,
      undefined,
      toWire(plan),
    );
    return fromWire(wire);
  },

  update: async (
    planId: string,
    fields: Partial<Pick<AnnualPlan, 'name' | 'overall_budget' | 'state'>>,
  ): Promise<void> => {
    await invokeService(API_CONFIG.otb.planUpdate, { uuid: planId }, {
      ...(fields.name !== undefined && { name: fields.name }),
      ...(fields.overall_budget !== undefined && { overallBudget: fields.overall_budget }),
      ...(fields.state !== undefined && { state: fields.state }),
    });
  },

  delete: async (planId: string): Promise<void> => {
    await invokeService(API_CONFIG.otb.planDelete, { uuid: planId });
  },

  /**
   * Lock (release) a period. `rows` is optional — pass adjusted values when
   * re-releasing with updated numbers. Returns the freshly-locked period.
   */
  lockPeriod: async (
    planId: string,
    periodKey: string,
    rows?: OtbRow[],
  ): Promise<PeriodPlan> => {
    const wire = await invokeService<PeriodPlanWire>(
      API_CONFIG.otb.periodLock,
      { planId, periodKey },
      { rows: rows ? rows.map(toWireRow) : null },
    );
    return fromWirePeriod(wire);
  },

  /** Skip a period (terminal). */
  skipPeriod: async (planId: string, periodKey: string): Promise<PeriodPlan> => {
    const wire = await invokeService<PeriodPlanWire>(
      API_CONFIG.otb.periodSkip,
      { planId, periodKey },
      {},
    );
    return fromWirePeriod(wire);
  },
};

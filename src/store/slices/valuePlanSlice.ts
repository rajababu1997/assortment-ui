/**
 * Value Plan Redux slice — in-session state, no persistence.
 * One ValuePlan per released OTB row, keyed by `otb_code`.
 *
 * State machine: DRAFT → SUBMITTED → APPROVED. Submit flips straight to
 * APPROVED (no separate approval step, mirroring Step 1). Approved plans
 * can be re-edited and re-submitted at any time.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { VP_STATES } from '@/features/value/constants';
import type { BandAllocation, ValuePlan } from '@/features/value/types';

interface ValuePlanState {
  /** All value plans across all released OTB rows, keyed by otb_code. */
  plans: Record<string, ValuePlan>;
}

const initialState: ValuePlanState = {
  plans: {},
};

interface InitPayload {
  otb_code: string;
  period_key: string;
  brand_uuid: string;
  category_uuid: string;
  budget: number;
  bands: BandAllocation[];   // default split, computed by caller
}

interface SetBandPctPayload {
  otb_code: string;
  band_id: BandAllocation['band_id'];
  pct: number;               // pre-clamped by UI
}

interface SetBandMrpPayload {
  otb_code: string;
  band_id: BandAllocation['band_id'];
  value: number;             // pre-clamped by UI
}

interface SetBandCostPayload {
  otb_code: string;
  band_id: BandAllocation['band_id'];
  value: number;             // pre-clamped by UI
}

interface SetAllBandsPayload {
  otb_code: string;
  bands: BandAllocation[];
}

const valuePlanSlice = createSlice({
  name: 'valuePlan',
  initialState,
  reducers: {
    /** Idempotent: re-init with same otb_code is a no-op (avoids stomping
     *  on a draft the buyer has already started). */
    initValuePlan(state, action: PayloadAction<InitPayload>) {
      const p = action.payload;
      if (state.plans[p.otb_code]) return;
      state.plans[p.otb_code] = {
        otb_code: p.otb_code,
        period_key: p.period_key,
        brand_uuid: p.brand_uuid,
        category_uuid: p.category_uuid,
        budget_snapshot: p.budget,
        state: VP_STATES.DRAFT,
        bands: p.bands,
        created_at: Date.now(),
      };
    },

    setBandPct(state, action: PayloadAction<SetBandPctPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      const band = plan.bands.find((b) => b.band_id === action.payload.band_id);
      if (!band) return;
      band.budget_pct = action.payload.pct;
    },

    setBandMrp(state, action: PayloadAction<SetBandMrpPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      const band = plan.bands.find((b) => b.band_id === action.payload.band_id);
      if (!band) return;
      band.avg_mrp = action.payload.value;
    },

    setBandCost(state, action: PayloadAction<SetBandCostPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      const band = plan.bands.find((b) => b.band_id === action.payload.band_id);
      if (!band) return;
      band.avg_cost = action.payload.value;
    },

    /** Bulk replacement — used by "Reset to default" and "Use last-year split". */
    setAllBands(state, action: PayloadAction<SetAllBandsPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      plan.bands = action.payload.bands;
    },

    submitValuePlan(state, action: PayloadAction<{ otb_code: string }>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      plan.state = VP_STATES.APPROVED;
      plan.submitted_at = Date.now();
      plan.approved_at = Date.now();
    },

    /** Called when the parent OTB is re-released with a different budget.
     *  Updates the snapshot so UI can flag the plan as stale. */
    syncValuePlanBudget(
      state,
      action: PayloadAction<{ otb_code: string; new_budget: number }>,
    ) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      plan.budget_snapshot = action.payload.new_budget;
    },

    resetValuePlan(state, action: PayloadAction<{ otb_code: string }>) {
      delete state.plans[action.payload.otb_code];
    },

    /** Wipe everything — used when the underlying annual plan is discarded. */
    resetAllValuePlans(state) {
      state.plans = {};
    },

    /** Replace the in-memory map from a server fetch. Server is the source
     *  of truth on load; subsequent edits flow through the band reducers. */
    hydrateValuePlans(state, action: PayloadAction<ValuePlan[]>) {
      const next: Record<string, ValuePlan> = {};
      for (const vp of action.payload) {
        next[vp.otb_code] = vp;
      }
      state.plans = next;
    },

    /** Merge a single VP into the cache — used after a server save so the
     *  editor + dashboards see fresh state without a full refetch. */
    upsertValuePlan(state, action: PayloadAction<ValuePlan>) {
      state.plans[action.payload.otb_code] = action.payload;
    },
  },
});

export const {
  initValuePlan,
  setBandPct,
  setBandMrp,
  setBandCost,
  setAllBands,
  submitValuePlan,
  syncValuePlanBudget,
  resetValuePlan,
  resetAllValuePlans,
  hydrateValuePlans,
  upsertValuePlan,
} = valuePlanSlice.actions;

export default valuePlanSlice.reducer;

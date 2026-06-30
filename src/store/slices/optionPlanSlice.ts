/**
 * Option Plan Redux slice — in-session draft state, no persistence.
 * One OptionPlan per OTB row, keyed by `otb_code`.
 *
 * Lifecycle mirrors the backend:
 *   DRAFT → SUBMITTED → (APPROVED | REVISIONS_REQUESTED → SUBMITTED …)
 * The slice only carries client-side mutations between hydration and save.
 * Server is authoritative — `hydrateOptionPlans` / `upsertOptionPlan` push
 * server truth back into the cache after every read/save.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OptionBand, OptionLine, OptionPlan } from '@/features/option/types';
import type { OptionType } from '@/features/option/constants';

interface OptionPlanState {
  plans: Record<string, OptionPlan>;
}

const initialState: OptionPlanState = {
  plans: {},
};

interface SetBandAvgPayload {
  otb_code: string;
  band_id: OptionBand['band_id'];
  avg_production_qty_per_option: number;
}

interface SetLineQtyPayload {
  otb_code: string;
  band_id: OptionBand['band_id'];
  option_type: OptionType;
  sub_type_key: string;
  sub_type_label: string;
  qty: number;
}

interface SetBandDerivedPayload {
  otb_code: string;
  band_id: OptionBand['band_id'];
  option_plan_qty: number;
  production_qty_snapshot: number;
}

const findBand = (plan: OptionPlan, bandId: OptionBand['band_id']) =>
  plan.bands.find((b) => b.band_id === bandId);

const optionPlanSlice = createSlice({
  name: 'optionPlan',
  initialState,
  reducers: {
    setBandAvgPerOption(state, action: PayloadAction<SetBandAvgPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      const band = findBand(plan, action.payload.band_id);
      if (!band) return;
      band.avg_production_qty_per_option = action.payload.avg_production_qty_per_option;
    },

    /** Client-side echo of server's derived values — used after save() so the
     *  editor immediately reflects the new option_plan_qty before refetch. */
    setBandDerived(state, action: PayloadAction<SetBandDerivedPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      const band = findBand(plan, action.payload.band_id);
      if (!band) return;
      band.option_plan_qty = action.payload.option_plan_qty;
      band.production_qty_snapshot = action.payload.production_qty_snapshot;
    },

    setLineQty(state, action: PayloadAction<SetLineQtyPayload>) {
      const plan = state.plans[action.payload.otb_code];
      if (!plan) return;
      const band = findBand(plan, action.payload.band_id);
      if (!band) return;
      const existing = band.lines.find(
        (l) =>
          l.option_type === action.payload.option_type &&
          l.sub_type_key === action.payload.sub_type_key,
      );
      if (existing) {
        existing.qty = action.payload.qty;
        existing.sub_type_label = action.payload.sub_type_label;
        return;
      }
      const next: OptionLine = {
        option_type: action.payload.option_type,
        sub_type_key: action.payload.sub_type_key,
        sub_type_label: action.payload.sub_type_label,
        qty: action.payload.qty,
      };
      band.lines.push(next);
    },

    resetOptionPlan(state, action: PayloadAction<{ otb_code: string }>) {
      delete state.plans[action.payload.otb_code];
    },

    resetAllOptionPlans(state) {
      state.plans = {};
    },

    /** Replace the in-memory map from a server fetch. Server is the source
     *  of truth on load; subsequent edits flow through the band reducers. */
    hydrateOptionPlans(state, action: PayloadAction<OptionPlan[]>) {
      const next: Record<string, OptionPlan> = {};
      for (const op of action.payload) {
        next[op.otb_code] = op;
      }
      state.plans = next;
    },

    /** Merge a single OP into the cache — used after a server save so the
     *  editor + dashboards see fresh state without a full refetch. */
    upsertOptionPlan(state, action: PayloadAction<OptionPlan>) {
      state.plans[action.payload.otb_code] = action.payload;
    },
  },
});

export const {
  setBandAvgPerOption,
  setBandDerived,
  setLineQty,
  resetOptionPlan,
  resetAllOptionPlans,
  hydrateOptionPlans,
  upsertOptionPlan,
} = optionPlanSlice.actions;

export default optionPlanSlice.reducer;

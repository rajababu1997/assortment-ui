/**
 * OTB Planning Redux slice — in-session state, no persistence.
 * A browser refresh wipes every plan.
 *
 * Multi-plan model: any number of `AnnualPlan`s co-exist, keyed by
 * `plan_id` (= `AP-YYYYMMDD-YYYYMMDD`). The UI picks which plan a screen
 * is operating on via URL params; the slice never holds a single "active
 * plan" — that would conflict with multi-tab usage. See utils/planId.ts.
 *
 * Per-plan state machine: DRAFT → APPROVED → IN_PROGRESS → LOCKED + SKIPPED.
 * Submit flips the plan straight to APPROVED (no separate approval step).
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { OTB_STATES } from '@/features/otb/constants';
import {
  buildPlanId,
  buildPlanName,
} from '@/features/otb/utils/planId';
import type { AnnualPlan, OtbRow, PeriodPlan } from '@/features/otb/types';

interface OtbState {
  /** Every annual plan, keyed by plan_id. */
  plans: Record<string, AnnualPlan>;
}

const initialState: OtbState = {
  plans: {},
};

interface InitPlanPayload {
  plan_start_iso: string;
  plan_end_iso: string;
  period_keys: string[];
}

interface SetBudgetPayload {
  plan_id: string;
  value: number;
}

interface SetPlanStartPayload {
  plan_id: string;
  plan_start_iso: string;
  plan_end_iso: string;
  period_keys: string[];
}

interface SetRowsPayload {
  plan_id: string;
  period_key: string;
  rows: OtbRow[];
}

interface AdjustRowsPayload {
  plan_id: string;
  period_key: string;
  rows: OtbRow[];
}

interface SubmitAnnualPayload {
  plan_id: string;
}

interface StartReleasePayload {
  plan_id: string;
  period_key: string;
}

interface LockPeriodPayload {
  plan_id: string;
  period_key: string;
  locked_by: string;
}

interface SkipPeriodPayload {
  plan_id: string;
  period_key: string;
}

interface ResetAnnualPayload {
  plan_id: string;
}

const otbSlice = createSlice({
  name: 'otb',
  initialState,
  reducers: {
    /** Idempotent: re-init for the same (start, end) is a no-op. */
    initAnnualPlan(state, action: PayloadAction<InitPlanPayload>) {
      const { plan_start_iso, plan_end_iso, period_keys } = action.payload;
      const plan_id = buildPlanId(plan_start_iso, plan_end_iso);
      if (state.plans[plan_id]) return;
      const periods: Record<string, PeriodPlan> = {};
      period_keys.forEach((key) => {
        periods[key] = { period_key: key, state: OTB_STATES.DRAFT, rows: [] };
      });
      state.plans[plan_id] = {
        plan_id,
        name: buildPlanName(plan_start_iso, plan_end_iso),
        state: OTB_STATES.DRAFT,
        overall_budget: 0,
        plan_start_iso,
        plan_end_iso,
        created_at: Date.now(),
        periods,
      };
    },

    setOverallBudget(state, action: PayloadAction<SetBudgetPayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      plan.overall_budget = Math.max(0, action.payload.value);
    },

    /**
     * Re-base the plan onto a different start date. Caller computes new
     * periods upstream and threads them in along with the new end date.
     * Note: this changes the plan's identity — the slice deletes the old
     * entry and writes the new id.
     */
    setPlanStart(state, action: PayloadAction<SetPlanStartPayload>) {
      const oldPlan = state.plans[action.payload.plan_id];
      if (!oldPlan) return;
      if (oldPlan.state !== OTB_STATES.DRAFT) return;

      const newId = buildPlanId(action.payload.plan_start_iso, action.payload.plan_end_iso);
      const periods: Record<string, PeriodPlan> = {};
      action.payload.period_keys.forEach((key) => {
        periods[key] = oldPlan.periods[key] ?? {
          period_key: key,
          state: OTB_STATES.DRAFT,
          rows: [],
        };
      });

      if (newId === action.payload.plan_id) {
        oldPlan.plan_start_iso = action.payload.plan_start_iso;
        oldPlan.plan_end_iso = action.payload.plan_end_iso;
        oldPlan.periods = periods;
        return;
      }

      delete state.plans[action.payload.plan_id];
      state.plans[newId] = {
        ...oldPlan,
        plan_id: newId,
        name: buildPlanName(action.payload.plan_start_iso, action.payload.plan_end_iso),
        plan_start_iso: action.payload.plan_start_iso,
        plan_end_iso: action.payload.plan_end_iso,
        periods,
      };
    },

    setPeriodRows(state, action: PayloadAction<SetRowsPayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      const period = plan.periods[action.payload.period_key];
      if (!period) return;
      period.rows = action.payload.rows;
    },

    /**
     * Submit-for-final-baseline. Flips the plan and every DRAFT period to
     * APPROVED in one shot, snapshots the rows as the baseline, and stamps
     * approved_at. There is no intermediate SUBMITTED state.
     */
    submitAnnualPlan(state, action: PayloadAction<SubmitAnnualPayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      plan.state = OTB_STATES.APPROVED;
      plan.approved_at = Date.now();
      Object.values(plan.periods).forEach((p) => {
        if (p.state === OTB_STATES.DRAFT) {
          p.state = OTB_STATES.APPROVED;
          p.baseline_rows = p.rows.map((r) => ({ ...r }));
        }
      });
    },

    startRelease(state, action: PayloadAction<StartReleasePayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      const period = plan.periods[action.payload.period_key];
      if (!period || period.state !== OTB_STATES.APPROVED) return;
      period.state = OTB_STATES.IN_PROGRESS;
    },

    adjustPeriodRows(state, action: PayloadAction<AdjustRowsPayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      const period = plan.periods[action.payload.period_key];
      if (!period) return;
      period.rows = action.payload.rows;
    },

    lockPeriod(state, action: PayloadAction<LockPeriodPayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      const period = plan.periods[action.payload.period_key];
      if (!period) return;
      period.state = OTB_STATES.LOCKED;
      period.locked_at = Date.now();
      period.locked_by = action.payload.locked_by;
    },

    skipPeriod(state, action: PayloadAction<SkipPeriodPayload>) {
      const plan = state.plans[action.payload.plan_id];
      if (!plan) return;
      const period = plan.periods[action.payload.period_key];
      if (!period) return;
      period.state = OTB_STATES.SKIPPED;
      period.skipped_at = Date.now();
    },

    /** Delete a single annual plan. */
    resetAnnualPlan(state, action: PayloadAction<ResetAnnualPayload>) {
      delete state.plans[action.payload.plan_id];
    },

    /** Wipe every plan — used by Setup reset. */
    resetAllAnnualPlans(state) {
      state.plans = {};
    },

    /**
     * Merge plans loaded from the server into the store. Server-side plans
     * overwrite same-id local copies (server is authoritative); local-only
     * plans (e.g. unsaved drafts created in this session) are preserved.
     */
    hydrateAnnualPlans(state, action: PayloadAction<AnnualPlan[]>) {
      for (const plan of action.payload) {
        state.plans[plan.plan_id] = plan;
      }
    },
  },
});

export const {
  initAnnualPlan,
  setOverallBudget,
  setPlanStart,
  setPeriodRows,
  submitAnnualPlan,
  startRelease,
  adjustPeriodRows,
  lockPeriod,
  skipPeriod,
  resetAnnualPlan,
  resetAllAnnualPlans,
  hydrateAnnualPlans,
} = otbSlice.actions;

export default otbSlice.reducer;

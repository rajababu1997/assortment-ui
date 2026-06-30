/**
 * Hooks that join Setup config + OTB Redux state into the shapes the
 * Planning screens need (periods, totals, current-up period, etc.).
 *
 * Multi-plan note: every hook here works against ONE annual plan at a
 * time, identified by `plan_id`. When called with no `plan_id`, hooks
 * fall back to "the first plan in the map" — that lets legacy screens
 * built before the multi-plan refactor keep working until step 5 threads
 * `plan_id` explicitly from URL params.
 */

import { useMemo } from 'react';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { SETUP_FORM_DEFAULTS } from '@/features/setup/form/setup-form.model';
import { getCompanyId } from '@/constants/setupKeys';
import { environment } from '@/config/environment';
import { OTB_STATES } from './constants';
import { generatePeriods } from './utils/periods';
import { calcOtb } from './types';
import type { AnnualPlan, Period, PeriodPlan } from './types';
import type { Company, ReleaseConfig, TimeConfig } from '@/features/setup/types';

// OTB Setup is hidden from the menu and the values are constants. Build the
// Company / TimeConfig / ReleaseConfig once at module load from
// SETUP_FORM_DEFAULTS so every consumer gets a stable, synchronous answer —
// no React Query, no localStorage bootstrap, no spinner.
const STATIC_COMPANY_ID = getCompanyId();
const STATIC_TIMESTAMP = '2026-01-01T00:00:00.000Z';

const STATIC_COMPANY: Company = {
  id: STATIC_COMPANY_ID,
  // Name comes from VITE_COMPANY_NAME so different builds can ship under
  // different brand names without a code change.
  name: environment.companyName,
  base_currency: SETUP_FORM_DEFAULTS.base_currency,
  status: 'configured',
  created_at: STATIC_TIMESTAMP,
  updated_at: STATIC_TIMESTAMP,
};

const STATIC_TIME_CONFIG: TimeConfig = {
  company_id: STATIC_COMPANY_ID,
  planning_horizon_months: SETUP_FORM_DEFAULTS.planning_horizon_months,
  lead_time_days: SETUP_FORM_DEFAULTS.lead_time_days,
  planning_cycle: SETUP_FORM_DEFAULTS.planning_cycle,
  allow_mid_planning: SETUP_FORM_DEFAULTS.allow_mid_planning,
  updated_at: STATIC_TIMESTAMP,
};

const STATIC_RELEASE_CONFIG: ReleaseConfig = {
  company_id: STATIC_COMPANY_ID,
  lock_deadline_days_before: SETUP_FORM_DEFAULTS.lock_deadline_days_before,
  release_day_of_week: SETUP_FORM_DEFAULTS.release_day_of_week,
  updated_at: STATIC_TIMESTAMP,
};

export function useSetupConfig() {
  return {
    isLoading: false,
    company: STATIC_COMPANY,
    timeConfig: STATIC_TIME_CONFIG,
    releaseConfig: STATIC_RELEASE_CONFIG,
  };
}

/** Every plan in the store, in deterministic order (earliest start first). */
export function useAllPlans(): AnnualPlan[] {
  // Select the stable record from the store, then derive the sorted array
  // in a useMemo. Sorting/spreading inside the selector itself returns a
  // new reference on every call, which trips react-redux's equality check
  // and causes infinite re-renders.
  const plans = useAppSelector((s) => s.otb.plans);
  return useMemo(
    () =>
      Object.values(plans).sort((a, b) =>
        a.plan_start_iso.localeCompare(b.plan_start_iso),
      ),
    [plans],
  );
}

/**
 * Resolve a single annual plan.
 *
 *   useAnnualPlan('AP-20260401-20270331')  // specific plan by id
 *   useAnnualPlan()                         // first plan (legacy fallback)
 */
export function useAnnualPlan(planId?: string): AnnualPlan | null {
  // Same memoization pattern as useAllPlans — pull the stable record out
  // of the store, then sort outside the selector so react-redux's identity
  // check stays stable across re-renders.
  const plans = useAppSelector((s) => s.otb.plans);
  return useMemo(() => {
    if (planId) return plans[planId] ?? null;
    const list = Object.values(plans);
    if (list.length === 0) return null;
    return list
      .slice()
      .sort((a, b) => a.plan_start_iso.localeCompare(b.plan_start_iso))[0];
  }, [plans, planId]);
}

/**
 * Periods derived from a specific annual plan + setup config.
 * Returns [] when there's no plan yet — the planner must create one first.
 */
export function usePeriods(planId?: string): Period[] {
  const { timeConfig, releaseConfig } = useSetupConfig();
  const annual = useAnnualPlan(planId);
  return useMemo(() => {
    if (!timeConfig || !releaseConfig || !annual?.plan_start_iso) return [];
    return generatePeriods({
      plan_start_iso: annual.plan_start_iso,
      planning_horizon_months: timeConfig.planning_horizon_months,
      planning_cycle: timeConfig.planning_cycle,
      lock_deadline_days_before: releaseConfig.lock_deadline_days_before,
      release_day_of_week: releaseConfig.release_day_of_week,
    });
  }, [annual?.plan_start_iso, timeConfig, releaseConfig]);
}

/**
 * Compute periods for a given start date without touching the slice.
 * Used by Annual Creation when the planner picks a Plan start date and
 * we need the new period keys to feed into `initAnnualPlan` / `setPlanStart`.
 */
export function usePreviewPeriods(planStartIso: string | null): Period[] {
  const { timeConfig, releaseConfig } = useSetupConfig();
  return useMemo(() => {
    if (!timeConfig || !releaseConfig || !planStartIso) return [];
    return generatePeriods({
      plan_start_iso: planStartIso,
      planning_horizon_months: timeConfig.planning_horizon_months,
      planning_cycle: timeConfig.planning_cycle,
      lock_deadline_days_before: releaseConfig.lock_deadline_days_before,
      release_day_of_week: releaseConfig.release_day_of_week,
    });
  }, [planStartIso, timeConfig, releaseConfig]);
}

export function usePeriodPlan(
  periodKey: string | undefined,
  planId?: string,
): PeriodPlan | null {
  const annual = useAnnualPlan(planId);
  return useMemo(() => {
    if (!annual || !periodKey) return null;
    return annual.periods[periodKey] ?? null;
  }, [annual, periodKey]);
}

export function periodTotal(plan: PeriodPlan | undefined | null): number {
  if (!plan) return 0;
  return plan.rows.reduce((sum, r) => sum + calcOtb(r), 0);
}

export function annualTotal(periods: Record<string, PeriodPlan> | undefined): number {
  if (!periods) return 0;
  return Object.values(periods).reduce((sum, p) => sum + periodTotal(p), 0);
}

export function useNextUpPeriod(planId?: string): Period | null {
  const periods = usePeriods(planId);
  const annual = useAnnualPlan(planId);
  return useMemo(() => {
    if (!annual) return null;
    return (
      periods.find((p) => {
        const plan = annual.periods[p.key];
        return plan && plan.state !== OTB_STATES.LOCKED && plan.state !== OTB_STATES.SKIPPED;
      }) ?? null
    );
  }, [periods, annual]);
}

export { useAppDispatch };

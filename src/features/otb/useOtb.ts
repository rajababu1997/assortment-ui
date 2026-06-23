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
import { useAllConfigs } from '@/features/setup/useSetup';
import { OTB_STATES } from './constants';
import { generatePeriods } from './utils/periods';
import { calcOtb } from './types';
import type { AnnualPlan, Period, PeriodPlan } from './types';

export function useSetupConfig() {
  const { data, isLoading } = useAllConfigs();
  return {
    isLoading,
    company: data?.company ?? null,
    timeConfig: data?.timeConfig ?? null,
    releaseConfig: data?.releaseConfig ?? null,
  };
}

/** Every plan in the store, in deterministic order (earliest start first). */
export function useAllPlans(): AnnualPlan[] {
  return useAppSelector((s) => {
    const list = Object.values(s.otb.plans);
    return [...list].sort((a, b) => a.plan_start_iso.localeCompare(b.plan_start_iso));
  });
}

/**
 * Resolve a single annual plan.
 *
 *   useAnnualPlan('AP-20260401-20270331')  // specific plan by id
 *   useAnnualPlan()                         // first plan (legacy fallback)
 */
export function useAnnualPlan(planId?: string): AnnualPlan | null {
  return useAppSelector((s) => {
    if (planId) return s.otb.plans[planId] ?? null;
    const list = Object.values(s.otb.plans);
    if (list.length === 0) return null;
    // Sort so "first" is deterministic — earliest start wins.
    return [...list].sort((a, b) => a.plan_start_iso.localeCompare(b.plan_start_iso))[0];
  });
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

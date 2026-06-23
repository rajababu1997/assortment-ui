/**
 * Hooks that join Setup config + Annual OTB plan + Value Plan slice into
 * the shapes the Value-Planning screens need.
 */

import { useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { OTB_STATES } from '@/features/otb/constants';
import { useAnnualPlan, usePeriods } from '@/features/otb/useOtb';
import { calcOtb } from '@/features/otb/types';
// import { findBrand, findCategory } from '@/features/otb/mockData/brands'; // ← swapped to API
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import type { ReleasedOtbRow, ValuePlan } from './types';

/** All Value Plans, keyed by otb_code. */
export function useAllValuePlans(): Record<string, ValuePlan> {
  return useAppSelector((s) => s.valuePlan.plans);
}

/** Single Value Plan for one OTB row, or null. */
export function useValuePlan(otbCode: string | undefined): ValuePlan | null {
  return useAppSelector((s) =>
    otbCode ? s.valuePlan.plans[otbCode] ?? null : null,
  );
}

/**
 * Every OTB row that has been released (period state = LOCKED) for one
 * annual plan. This is the universe Value Plan operates on — one row in,
 * one ValuePlan out. Scope to a specific plan via `planId`; when omitted
 * falls back to the legacy first-plan resolution.
 */
export function useReleasedOtbRows(planId?: string): ReleasedOtbRow[] {
  const annual = useAnnualPlan(planId);
  const periods = usePeriods(planId);
  const { findBrand, findCategory } = useBrandCategoryLookup();
  return useMemo(() => {
    if (!annual) return [];
    const out: ReleasedOtbRow[] = [];
    for (const p of periods) {
      const plan = annual.periods[p.key];
      if (!plan || plan.state !== OTB_STATES.LOCKED) continue;
      for (const row of plan.rows) {
        const brand = findBrand(row.brand_uuid);
        const cat = findCategory(row.category_uuid);
        out.push({
          otb_code: row.otb_code,
          period_key: p.key,
          period_label: p.label,
          brand_uuid: row.brand_uuid,
          brand_name: brand?.name ?? row.brand_uuid,
          category_uuid: row.category_uuid,
          category_name: cat?.name ?? row.category_uuid,
          budget: calcOtb(row),
          released_at: plan.locked_at ?? 0,
          released_by: plan.locked_by,
        });
      }
    }
    return out;
  }, [annual, periods, findBrand, findCategory]);
}

/**
 * One row's current OTB budget — searches across every annual plan in the
 * store, so the editor can still find the row by `otb_code` even if the
 * user opened it via a bookmarked URL with no plan-id context.
 */
export function useCurrentOtbBudget(otbCode: string | undefined): number | null {
  const allPlans = useAppSelector((s) => s.otb.plans);
  return useMemo(() => {
    if (!otbCode) return null;
    for (const annual of Object.values(allPlans)) {
      for (const periodKey of Object.keys(annual.periods)) {
        const period = annual.periods[periodKey];
        const row = period.rows.find((r) => r.otb_code === otbCode);
        if (row) return calcOtb(row);
      }
    }
    return null;
  }, [allPlans, otbCode]);
}

export { useAppDispatch };

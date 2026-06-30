/**
 * Selectors + composite queries for the Option Plan screens.
 *
 * Mirrors `useValue.ts` — joins Annual OTB + Value Plan + Option Plan slices
 * into the shapes the editor / review / dashboard screens need.
 */

import { useMemo } from 'react';
import { useAppSelector } from '@/hooks/useAppSelector';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { OTB_STATES } from '@/features/otb/constants';
import { useAnnualPlan, usePeriods } from '@/features/otb/useOtb';
import { calcOtb } from '@/features/otb/types';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { VP_STATES } from '@/features/value/constants';
import { useAllValuePlans } from '@/features/value/useValue';
import type { OptionPlan } from './types';

export function useAllOptionPlans(): Record<string, OptionPlan> {
  return useAppSelector((s) => s.optionPlan.plans);
}

export function useOptionPlan(otbCode: string | undefined): OptionPlan | null {
  return useAppSelector((s) =>
    otbCode ? s.optionPlan.plans[otbCode] ?? null : null,
  );
}

/**
 * Decorated rows for the Option Plan dashboard — one per released OTB whose
 * Value Plan has been APPROVED. Anything not yet APPROVED is filtered out
 * because the editor refuses to open without an approved VP anyway.
 */
export interface OptionPlanCandidate {
  otb_code: string;
  period_key: string;
  period_label: string;
  brand_uuid: string;
  brand_name: string;
  category_uuid: string;
  category_name: string;
  budget: number;
  released_at: number;
  released_by?: string;
}

export function useOptionPlanCandidates(planId?: string): OptionPlanCandidate[] {
  const annual = useAnnualPlan(planId);
  const periods = usePeriods(planId);
  const { findBrand, findCategory } = useBrandCategoryLookup();
  const valuePlans = useAllValuePlans();
  return useMemo(() => {
    if (!annual) return [];
    const out: OptionPlanCandidate[] = [];
    for (const p of periods) {
      const plan = annual.periods[p.key];
      if (!plan || plan.state !== OTB_STATES.LOCKED) continue;
      for (const row of plan.rows) {
        const vp = valuePlans[row.otb_code];
        if (!vp || vp.state !== VP_STATES.APPROVED) continue;
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
  }, [annual, periods, valuePlans, findBrand, findCategory]);
}

export { useAppDispatch };

/**
 * TanStack hooks for Value Plan persistence.
 *   - useApiAllValuePlanRows — decorated list for the All-VPs table screen.
 *   - useApiValuePlansForPlan — hydration for the dashboard / plans-list.
 *   - useSaveValuePlan / useDeleteValuePlan — write mutations.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { valuePlanApi } from './valuePlanApi';
import type { BandAllocation, ValuePlan } from './types';
import type { VpState } from './constants';

const ALL_KEY = ['otb', 'value', 'all'] as const;
const PLAN_KEY = (planId: string) => ['otb', 'value', 'plan', planId] as const;

/**
 * Decorated list of every VP under the tenant — drives /value/all.
 * Optional `fromIso` / `toIso` push the date filter to the server; the
 * cache key includes them so each range gets its own slot.
 */
export const useApiAllValuePlanRows = (fromIso?: string, toIso?: string) =>
  useQuery({
    queryKey: [...ALL_KEY, fromIso ?? '_', toIso ?? '_'] as const,
    queryFn: () => valuePlanApi.list(fromIso, toIso),
    staleTime: 30 * 1000,
  });

/** VPs for one annual plan — drives dashboard / editor hydration. */
export const useApiValuePlansForPlan = (planId: string | undefined) =>
  useQuery({
    queryKey: planId ? PLAN_KEY(planId) : ['otb', 'value', 'plan', 'none'],
    queryFn: () => (planId ? valuePlanApi.byPlan(planId) : Promise.resolve<ValuePlan[]>([])),
    enabled: !!planId,
    staleTime: 30 * 1000,
  });

interface SaveArgs {
  planId: string;
  otbCode: string;
  state: VpState;
  budget_snapshot: number;
  bands: BandAllocation[];
}

export const useSaveValuePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: SaveArgs) =>
      valuePlanApi.save(args.planId, args.otbCode, {
        state: args.state,
        budget_snapshot: args.budget_snapshot,
        bands: args.bands,
      }),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ALL_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY(args.planId) });
    },
  });
};

export const useDeleteValuePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { planId: string; otbCode: string }) =>
      valuePlanApi.delete(args.planId, args.otbCode),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ALL_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY(args.planId) });
    },
  });
};

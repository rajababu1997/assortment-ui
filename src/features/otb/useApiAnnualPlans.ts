/**
 * TanStack hooks for Annual Plan persistence.
 * - Query: `useApiAnnualPlans` — list from server.
 * - Mutations: save / update / delete — invalidate the list on success.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { annualPlanApi } from './annualPlanApi';
import type { AnnualPlan, OtbRow } from './types';

const LIST_KEY = ['otb', 'plans'] as const;

export const useApiAnnualPlans = () =>
  useQuery({
    queryKey: LIST_KEY,
    queryFn: () => annualPlanApi.list(),
    staleTime: 30 * 1000,
  });

export const useSaveAnnualPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: AnnualPlan) => annualPlanApi.save(plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

export const useDeleteAnnualPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => annualPlanApi.delete(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

export const useLockPeriod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { planId: string; periodKey: string; rows?: OtbRow[] }) =>
      annualPlanApi.lockPeriod(args.planId, args.periodKey, args.rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

export const useSkipPeriod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { planId: string; periodKey: string }) =>
      annualPlanApi.skipPeriod(args.planId, args.periodKey),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
};

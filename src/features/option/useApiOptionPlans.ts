/**
 * TanStack hooks for Option Plan persistence.
 *   - useApiAllOptionPlanRows — decorated list for the /option/all table.
 *   - useApiOptionPlansForPlan — hydration for the dashboard / plans-list.
 *   - useApiOptionPlan — single OP for the editor / review screen.
 *   - useSaveOptionPlan / useAddOptionNote / useDeleteOptionPlan — mutations.
 *   - useApiMonthReady — month-gate query for dashboard CTA.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { optionPlanApi, type SaveBody } from './optionPlanApi';
import type { OptionPlan } from './types';

const ALL_KEY = ['otb', 'option', 'all'] as const;
const PLAN_KEY = (planId: string) => ['otb', 'option', 'plan', planId] as const;
const ROW_KEY = (planId: string, otbCode: string) =>
  ['otb', 'option', 'row', planId, otbCode] as const;
const MONTH_READY_KEY = (planId: string, periodKey: string) =>
  ['otb', 'option', 'month-ready', planId, periodKey] as const;

export const useApiAllOptionPlanRows = (
  fromIso?: string,
  toIso?: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [...ALL_KEY, fromIso ?? '_', toIso ?? '_'] as const,
    queryFn: () => optionPlanApi.list(fromIso, toIso),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });

export const useApiOptionPlansForPlan = (planId: string | undefined) =>
  useQuery({
    queryKey: planId ? PLAN_KEY(planId) : ['otb', 'option', 'plan', 'none'],
    queryFn: () => (planId ? optionPlanApi.byPlan(planId) : Promise.resolve<OptionPlan[]>([])),
    enabled: !!planId,
    staleTime: 30 * 1000,
  });

export const useApiOptionPlan = (
  planId: string | undefined,
  otbCode: string | undefined,
) =>
  useQuery({
    queryKey: planId && otbCode ? ROW_KEY(planId, otbCode) : ['otb', 'option', 'row', 'none'],
    queryFn: () =>
      planId && otbCode
        ? optionPlanApi.byOtbCode(planId, otbCode)
        : Promise.resolve<OptionPlan | null>(null),
    enabled: !!planId && !!otbCode,
    staleTime: 30 * 1000,
  });

export const useApiMonthReady = (
  planId: string | undefined,
  periodKey: string | undefined,
) =>
  useQuery({
    queryKey:
      planId && periodKey
        ? MONTH_READY_KEY(planId, periodKey)
        : ['otb', 'option', 'month-ready', 'none'],
    queryFn: () =>
      planId && periodKey
        ? optionPlanApi.isMonthReady(planId, periodKey)
        : Promise.resolve(false),
    enabled: !!planId && !!periodKey,
    staleTime: 30 * 1000,
  });

interface SaveArgs extends SaveBody {
  planId: string;
  otbCode: string;
}

export const useSaveOptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, otbCode, ...body }: SaveArgs) =>
      optionPlanApi.save(planId, otbCode, body),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ALL_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY(args.planId) });
      qc.invalidateQueries({ queryKey: ROW_KEY(args.planId, args.otbCode) });
    },
  });
};

export const useAddOptionNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { planId: string; otbCode: string; body: string }) =>
      optionPlanApi.addNote(args.planId, args.otbCode, args.body),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ROW_KEY(args.planId, args.otbCode) });
    },
  });
};

export const useDeleteOptionPlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { planId: string; otbCode: string }) =>
      optionPlanApi.delete(args.planId, args.otbCode),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ALL_KEY });
      qc.invalidateQueries({ queryKey: PLAN_KEY(args.planId) });
      qc.invalidateQueries({ queryKey: ROW_KEY(args.planId, args.otbCode) });
    },
  });
};

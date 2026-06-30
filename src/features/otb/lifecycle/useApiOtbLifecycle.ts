/**
 * TanStack hooks for the OTB lifecycle layer.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { otbLifecycleApi } from './otbLifecycleApi';
import type { OtbRowDetailView, OtbRowView } from './types';

const ALL_KEY = ['otb', 'lifecycle', 'all'] as const;
const DETAIL_KEY = (planId: string, otbCode: string) =>
  ['otb', 'lifecycle', 'detail', planId, otbCode] as const;

export const useApiAllOtbRows = (
  fromIso?: string,
  toIso?: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: [...ALL_KEY, fromIso ?? '_', toIso ?? '_'] as const,
    queryFn: () => otbLifecycleApi.list(fromIso, toIso),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
  });

export const useApiOtbDetail = (
  planId: string | undefined,
  otbCode: string | undefined,
) =>
  useQuery<OtbRowDetailView | null>({
    queryKey: planId && otbCode ? DETAIL_KEY(planId, otbCode) : ['otb', 'lifecycle', 'detail', 'none'],
    queryFn: () =>
      planId && otbCode
        ? otbLifecycleApi.detail(planId, otbCode)
        : Promise.resolve<OtbRowDetailView | null>(null),
    enabled: !!planId && !!otbCode,
    staleTime: 30 * 1000,
  });

export const useFinalApproveOtb = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { planId: string; otbCode: string; note?: string }) =>
      otbLifecycleApi.finalApprove(args.planId, args.otbCode, args.note),
    onSuccess: (_data, args) => {
      qc.invalidateQueries({ queryKey: ALL_KEY });
      qc.invalidateQueries({ queryKey: DETAIL_KEY(args.planId, args.otbCode) });
    },
  });
};

/** Type re-exports to keep imports tidy. */
export type { OtbRowView, OtbRowDetailView };

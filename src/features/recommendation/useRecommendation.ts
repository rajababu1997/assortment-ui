/**
 * Recommendation hooks — wrappers over TanStack `useMutation` so each
 * recommender is fired on a button click rather than on mount.
 *
 * Why mutation rather than query: we explicitly DON'T want the engine to
 * auto-load when an editor mounts (per the v1 UX decision — "button-driven,
 * never auto-load"). Mutations give the buyer explicit `mutate()` control,
 * pending state, and a fresh response every time they click Suggest.
 */

import { useMutation } from '@tanstack/react-query';
import { recommendationApi } from './api';
import type {
  AnnualRecommendation,
  OptionPlanRecommendation,
  ValuePlanRecommendation,
} from './types';

export const useAnnualRecommendation = () =>
  useMutation<AnnualRecommendation, Error, { planUuid: string; growthPct?: number }>({
    mutationFn: ({ planUuid, growthPct }) => recommendationApi.annual(planUuid, growthPct),
  });

export const useValueRecommendation = () =>
  useMutation<ValuePlanRecommendation, Error, { planUuid: string; otbCode: string }>({
    mutationFn: ({ planUuid, otbCode }) => recommendationApi.value(planUuid, otbCode),
  });

export const useOptionRecommendation = () =>
  useMutation<OptionPlanRecommendation, Error, { planUuid: string; otbCode: string }>({
    mutationFn: ({ planUuid, otbCode }) => recommendationApi.option(planUuid, otbCode),
  });

/**
 * Recommendation API — thin wrappers around `invokeService`. Each endpoint
 * is fetched on-demand (via React Query mutation, not a query) because the
 * buyer triggers it with a button click; we don't want to auto-fire.
 */

import { API_CONFIG } from '@/constants/apiConfig';
import { invokeService } from '@/services/invokeService';
import type {
  AnnualRecommendation,
  OptionPlanRecommendation,
  ValuePlanRecommendation,
} from './types';

export const recommendationApi = {
  annual: async (planUuid: string): Promise<AnnualRecommendation> =>
    invokeService<AnnualRecommendation>(API_CONFIG.recommendation.annual, { planUuid }),

  value: async (planUuid: string, otbCode: string): Promise<ValuePlanRecommendation> =>
    invokeService<ValuePlanRecommendation>(
      API_CONFIG.recommendation.value,
      { planUuid, otbCode },
    ),

  option: async (planUuid: string, otbCode: string): Promise<OptionPlanRecommendation> =>
    invokeService<OptionPlanRecommendation>(
      API_CONFIG.recommendation.option,
      { planUuid, otbCode },
    ),
};

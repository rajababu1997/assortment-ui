/**
 * Sales API — thin wrappers around `invokeService` for the `/sales/*` endpoints.
 *
 * All query params are pruned of `undefined` so the URL stays clean.
 */

import { API_CONFIG } from '@/constants/apiConfig';
import { invokeService } from '@/services/invokeService';
import type {
  AttributeFilter,
  MonthlyTrendPoint,
  SalesAggregateRow,
  SalesAttributeRow,
  SalesCalendarEvent,
  SalesFilter,
  SalesKpiSummary,
} from './types';

type QueryDict = Record<string, string | number | boolean>;

/**
 * Prune undefined/null/empty values and serialize arrays as comma-separated
 * strings. The backend's `?brand=A,B,C` shape is parsed back into a list at
 * the REST layer, so multi-brand / multi-category filters round-trip cleanly.
 */
const prune = (input: Record<string, unknown>): QueryDict => {
  const out: QueryDict = {};
  for (const [k, v] of Object.entries(input)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v)) {
      const joined = (v as unknown[]).filter((x) => x !== undefined && x !== null && x !== '').join(',');
      if (joined.length > 0) out[k] = joined;
      continue;
    }
    out[k] = v as string | number | boolean;
  }
  return out;
};

export const salesApi = {
  aggregate: async (filter: SalesFilter = {}): Promise<SalesAggregateRow[]> =>
    invokeService<SalesAggregateRow[]>(
      API_CONFIG.sales.aggregate,
      undefined,
      undefined,
      prune(filter as Record<string, unknown>),
    ),

  attribute: async (filter: AttributeFilter = {}): Promise<SalesAttributeRow[]> =>
    invokeService<SalesAttributeRow[]>(
      API_CONFIG.sales.attribute,
      undefined,
      undefined,
      prune(filter as Record<string, unknown>),
    ),

  kpi: async (filter: SalesFilter = {}): Promise<SalesKpiSummary> =>
    invokeService<SalesKpiSummary>(
      API_CONFIG.sales.kpi,
      undefined,
      undefined,
      prune(filter as Record<string, unknown>),
    ),

  monthly: async (filter: SalesFilter = {}): Promise<MonthlyTrendPoint[]> =>
    invokeService<MonthlyTrendPoint[]>(
      API_CONFIG.sales.monthly,
      undefined,
      undefined,
      prune(filter as Record<string, unknown>),
    ),

  calendar: async (country: string, year: number): Promise<SalesCalendarEvent[]> =>
    invokeService<SalesCalendarEvent[]>(
      API_CONFIG.sales.calendar,
      undefined,
      undefined,
      { country, year },
    ),

  calendarYears: async (country: string): Promise<number[]> =>
    invokeService<number[]>(
      API_CONFIG.sales.calendarYears,
      undefined,
      undefined,
      { country },
    ),
};

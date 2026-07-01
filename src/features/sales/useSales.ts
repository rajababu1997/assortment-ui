/**
 * TanStack Query hooks for sales data — used by dashboards and (in Phase 2)
 * the recommendation engine's "Suggest with AI" buttons.
 *
 * Each hook is `enabled` only when the filter is meaningful (at minimum
 * one of brand/category/from set), so dropping a Suggest button on a
 * still-loading editor doesn't fire wasted requests.
 */

import { useQuery } from '@tanstack/react-query';
import { salesApi } from './salesApi';
import type {
  AttributeFilter,
  MonthlyTrendPoint,
  SalesAggregateRow,
  SalesAttributeRow,
  SalesCalendarEvent,
  SalesFilter,
  SalesKpiSummary,
} from './types';

const SALES_KEY = ['sales'] as const;

// A filter "has any" constraint if any of its fields is set; arrays count as
// set only when non-empty. Used to skip the query entirely when the user
// hasn't picked anything yet — saves a useless full-tenant fetch on mount.
const hasAny = (f: SalesFilter): boolean => {
  const setStr = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v.length > 0 : !!v;
  return setStr(f.brand) || setStr(f.category) || !!f.band || !!f.from || !!f.to;
};

export const useSalesAggregate = (filter: SalesFilter = {}, opts: { enabled?: boolean } = {}) =>
  useQuery<SalesAggregateRow[]>({
    queryKey: [...SALES_KEY, 'aggregate', filter],
    queryFn: () => salesApi.aggregate(filter),
    enabled: (opts.enabled ?? true) && hasAny(filter),
    staleTime: 5 * 60 * 1000,                                 // mock data — cache aggressively
  });

export const useSalesAttribute = (filter: AttributeFilter = {}, opts: { enabled?: boolean } = {}) =>
  useQuery<SalesAttributeRow[]>({
    queryKey: [...SALES_KEY, 'attribute', filter],
    queryFn: () => salesApi.attribute(filter),
    enabled: (opts.enabled ?? true) && hasAny(filter),
    staleTime: 5 * 60 * 1000,
  });

export const useSalesKpi = (filter: SalesFilter = {}, opts: { enabled?: boolean } = {}) =>
  useQuery<SalesKpiSummary>({
    queryKey: [...SALES_KEY, 'kpi', filter],
    queryFn: () => salesApi.kpi(filter),
    enabled: opts.enabled ?? true,                            // empty filter is valid for "tenant total"
    staleTime: 5 * 60 * 1000,
  });

export const useSalesMonthly = (filter: SalesFilter = {}, opts: { enabled?: boolean } = {}) =>
  useQuery<MonthlyTrendPoint[]>({
    queryKey: [...SALES_KEY, 'monthly', filter],
    queryFn: () => salesApi.monthly(filter),
    enabled: (opts.enabled ?? true) && hasAny(filter),
    staleTime: 5 * 60 * 1000,
  });

export const useSalesCalendar = (country: string, year: number | undefined) =>
  useQuery<SalesCalendarEvent[]>({
    queryKey: [...SALES_KEY, 'calendar', country, year],
    queryFn: () => salesApi.calendar(country, year as number),
    enabled: Boolean(year),
    staleTime: 60 * 60 * 1000,                                // calendar barely changes
  });

export const useSalesCalendarYears = (country: string) =>
  useQuery<number[]>({
    queryKey: [...SALES_KEY, 'calendar', 'years', country],
    queryFn: () => salesApi.calendarYears(country),
    staleTime: 60 * 60 * 1000,
  });

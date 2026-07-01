/**
 * URL-synced filter state for the Sales History dashboard.
 *
 * Why URL: every chart / KPI / heat-map on this page uses the same filter.
 * Putting it in the URL means a screenshot URL is a real "saved view", the
 * back button works as expected, and copy-paste into Slack lands the
 * teammate on the exact same slice.
 *
 * The filter object is intentionally flat — flat is easy to serialise,
 * easy to diff, easy to test.
 *
 * "Today" here is the real system clock, NOT the demo clock. Sales History
 * is about actual historical data — the demo clock is for OTB workflows.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface DashboardFilters {
  brands: string[];          // brand_uuid[]
  categories: string[];      // category_uuid[]
  /** YYYY-MM inclusive. */
  from: string;
  /** YYYY-MM inclusive. */
  to: string;
  /** Show event ribbons on time-series charts? */
  showEvents: boolean;
}

function defaultFromTo(todayMs: number): { from: string; to: string } {
  // Default = full LAST calendar year (per user spec).
  // Today = 2026-06 → defaults to 2025-01..2025-12.
  const lastYear = new Date(todayMs).getFullYear() - 1;
  return { from: `${lastYear}-01`, to: `${lastYear}-12` };
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

export interface UseDashboardFiltersResult {
  filters: DashboardFilters;
  /** Partial update — only sets the fields that are passed. */
  setFilters: (patch: Partial<DashboardFilters>) => void;
  /** Add a value to a multi-select dimension; no-op if already present. */
  toggle: (
    dim: 'brands' | 'categories',
    value: string,
  ) => void;
  /** Reset everything to defaults. */
  reset: () => void;
  /** Earliest selectable month — bounded by what mock data ships (2024-01). */
  minPeriod: string;
  /** Latest selectable month — last day of the previous complete calendar year. */
  maxPeriod: string;
}

/** Earliest period the mock data ships. Update if MockSalesGenerator changes. */
const MIN_PERIOD = '2024-01';

export function useDashboardFilters(): UseDashboardFiltersResult {
  const [params, setParams] = useSearchParams();
  const todayMs = Date.now();
  const dflt = defaultFromTo(todayMs);
  // No data after last completed calendar year — clamp here so date pickers
  // and the URL can't escape the available window.
  const maxPeriod = `${new Date(todayMs).getFullYear() - 1}-12`;
  const minPeriod = MIN_PERIOD;

  const rawFrom = params.get('from') || dflt.from;
  const rawTo = params.get('to') || dflt.to;
  const filters: DashboardFilters = useMemo(
    () => ({
      brands: parseList(params.get('brand')),
      categories: parseList(params.get('category')),
      from: clampPeriod(rawFrom, minPeriod, maxPeriod),
      to: clampPeriod(rawTo, minPeriod, maxPeriod),
      showEvents: params.get('events') === '1',
    }),
    [params, rawFrom, rawTo, minPeriod, maxPeriod],
  );

  const setFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const next = new URLSearchParams(params);
      if (patch.brands !== undefined) writeList(next, 'brand', patch.brands);
      if (patch.categories !== undefined) writeList(next, 'category', patch.categories);
      if (patch.from !== undefined) next.set('from', patch.from);
      if (patch.to !== undefined) next.set('to', patch.to);
      if (patch.showEvents !== undefined) {
        if (patch.showEvents) next.set('events', '1');
        else next.delete('events');
      }
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const toggle = useCallback(
    (dim: 'brands' | 'categories', value: string) => {
      const current = filters[dim] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setFilters({ [dim]: next } as Partial<DashboardFilters>);
    },
    [filters, setFilters],
  );

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  return { filters, setFilters, toggle, reset, minPeriod, maxPeriod };
}

function clampPeriod(value: string, min: string, max: string): string {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function writeList(p: URLSearchParams, key: string, values: string[]) {
  if (values.length === 0) p.delete(key);
  else p.set(key, values.join(','));
}

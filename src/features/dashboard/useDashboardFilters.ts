/**
 * URL-synced filter state for the OTB Dashboard.
 *
 * Date defaults: `from` = current month, `to` = current month + 3.
 * The 3-month forward window matches typical apparel vendor lead times
 * and the buyer's active "what am I planning right now" zone. Items
 * stuck > 3 days old override this filter and stay visible regardless
 * (see `passesRowFilters` in `useDashboardSections.ts` and
 * `passesFilters` in `useWipItems.ts`).
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDemoToday } from '@/hooks/useDemoClock';

/** Kept for typing WipItem.planType — no longer surfaced as a filter. */
export type PlanType = 'annual' | 'value' | 'option';

export interface DashboardFilters {
  brands: string[];           // brand_uuid[]
  categories: string[];       // category_uuid[]
  /** Inclusive lower bound (YYYY-MM). Undefined = no lower bound. */
  from?: string;
  /** Inclusive upper bound (YYYY-MM). Undefined = no upper bound. */
  to?: string;
}

export interface UseDashboardFiltersResult {
  filters: DashboardFilters;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  toggle: (dim: 'brands' | 'categories', value: string) => void;
  reset: () => void;
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value.split(',').filter(Boolean);
}

function parsePeriod(value: string | null): string | undefined {
  if (!value) return undefined;
  // Accept YYYY-MM or YYYY-MM-DD (full ISO) — keep only the YYYY-MM prefix.
  return /^\d{4}-\d{2}/.test(value) ? value.slice(0, 7) : undefined;
}

export interface DashboardDefaults {
  from: string;
  to: string;
}

/**
 * Fixed default window: Oct 2025 → Jan 2026. Anchored to the season the
 * demo data actually covers so the buyer sees populated widgets on first
 * load instead of an empty "no rows in range" state.
 *
 * `todayMs` is kept in the signature so callers can start passing a
 * rolling-window value later without a refactor.
 */
export function computeDefaultRange(_todayMs: number): DashboardDefaults {
  return { from: '2025-10', to: '2026-01' };
}

export function useDashboardFilters(): UseDashboardFiltersResult & { defaults: DashboardDefaults } {
  const [params, setParams] = useSearchParams();
  const todayMs = useDemoToday();
  const defaults = useMemo(() => computeDefaultRange(todayMs), [todayMs]);

  const filters: DashboardFilters = useMemo(() => ({
    brands: parseList(params.get('brand')),
    categories: parseList(params.get('category')),
    // When URL has no override, fall through to the buyer-friendly default.
    from: parsePeriod(params.get('from')) ?? defaults.from,
    to: parsePeriod(params.get('to')) ?? defaults.to,
  }), [params, defaults]);

  const setFilters = useCallback(
    (patch: Partial<DashboardFilters>) => {
      const next = new URLSearchParams(params);
      if (patch.brands !== undefined) writeList(next, 'brand', patch.brands);
      if (patch.categories !== undefined) writeList(next, 'category', patch.categories);
      if (patch.from !== undefined) writePeriod(next, 'from', patch.from);
      if (patch.to !== undefined) writePeriod(next, 'to', patch.to);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const toggle = useCallback(
    (dim: 'brands' | 'categories', value: string) => {
      const current = filters[dim] as string[];
      const exists = current.includes(value);
      const nextList = exists ? current.filter((v) => v !== value) : [...current, value];
      setFilters({ [dim]: nextList } as Partial<DashboardFilters>);
    },
    [filters, setFilters],
  );

  const reset = useCallback(() => {
    setParams(new URLSearchParams(), { replace: true });
  }, [setParams]);

  return { filters, setFilters, toggle, reset, defaults };
}

function writeList(p: URLSearchParams, key: string, values: string[]) {
  if (values.length === 0) p.delete(key);
  else p.set(key, values.join(','));
}

function writePeriod(p: URLSearchParams, key: string, value: string | undefined) {
  if (!value) p.delete(key);
  else p.set(key, value);
}

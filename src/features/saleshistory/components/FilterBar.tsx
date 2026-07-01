/**
 * Sticky filter bar — the only place users change what they're looking at.
 *
 * Layout: single horizontal row that wraps on narrow viewports. Each
 * control owns its own state inside the URL via `useDashboardFilters`.
 *
 * Period range uses the project's `DatePicker` primitive (same widget the
 * OTB pages use). The dashboard aggregates monthly, so we store / read
 * `YYYY-MM` in the URL and bridge to `YYYY-MM-DD` only at the picker
 * boundary — whatever day the user picks gets snapped to its month.
 */

import { useMemo } from 'react';
import { Filter, RotateCcw, Sparkles } from 'lucide-react';
import { DatePicker, MultiSelect } from '@/components/primitives';
import { useApiBrands, useApiCategories } from '@/features/otb/useOtbMaster';
import type { DashboardFilters } from '../useDashboardFilters';

interface BrandOption { uuid: string; name: string }
// Note: the master-data Category uses `brand_uuid` (snake_case) — matches
// the wire shape from `otbMasterApi`. Don't change to camelCase here or
// the brand → category cascade will silently stop narrowing.
interface CategoryOption { uuid: string; name: string; brand_uuid?: string }

export function FilterBar({
  filters,
  setFilters,
  reset,
  minPeriod,
  maxPeriod,
}: {
  filters: DashboardFilters;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  reset: () => void;
  minPeriod: string;
  maxPeriod: string;
}) {
  const { data: brands = [] } = useApiBrands() as { data?: BrandOption[] };
  const { data: categories = [] } = useApiCategories() as { data?: CategoryOption[] };

  // Categories filter — cascade by selected brands when any are picked.
  const categoryOptions = useMemo(() => {
    const list = filters.brands.length === 0
      ? categories
      : categories.filter((c) => !c.brand_uuid || filters.brands.includes(c.brand_uuid));
    return list.map((c) => ({ value: c.uuid, label: c.name }));
  }, [categories, filters.brands]);

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.uuid, label: b.name })),
    [brands],
  );

  const hasAny =
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.showEvents;

  return (
    <div
      className="flex flex-wrap items-end gap-2 border-b px-3 py-2.5"
      style={{
        background: 'var(--color-surface-alt, #f8fafc)',
        borderColor: 'var(--color-divider)',
      }}
    >
      {/* Brand — multi-select; backend accepts ?brand=A,B,C */}
      <FilterField icon={<Filter size={12} />} label="Brand" minWidth={220}>
        <MultiSelect<string>
          placeholder="All brands"
          value={filters.brands}
          onChange={(next) => setFilters({ brands: next })}
          options={brandOptions}
          searchable
        />
      </FilterField>

      {/* Category — multi-select; cascades by brand selection */}
      <FilterField label="Category" minWidth={240}>
        <MultiSelect<string>
          placeholder="All categories"
          value={filters.categories}
          onChange={(next) => setFilters({ categories: next })}
          options={categoryOptions}
          searchable
        />
      </FilterField>

      {/* Period from */}
      <FilterField label="From" minWidth={170}>
        <DatePicker
          value={periodToDateStr(filters.from)}
          minDate={periodToDateStr(minPeriod)}
          maxDate={periodToDateStr(filters.to)}
          placeholder="Start month"
          onChange={(iso) => {
            if (iso) setFilters({ from: iso.slice(0, 7) });
          }}
        />
      </FilterField>

      {/* Period to */}
      <FilterField label="To" minWidth={170}>
        <DatePicker
          value={periodToDateStr(filters.to)}
          minDate={periodToDateStr(filters.from)}
          maxDate={periodToDateStr(maxPeriod)}
          placeholder="End month"
          onChange={(iso) => {
            if (iso) setFilters({ to: iso.slice(0, 7) });
          }}
        />
      </FilterField>

      {/* Show events toggle */}
      <FilterField label="Events" minWidth={130}>
        <button
          type="button"
          onClick={() => setFilters({ showEvents: !filters.showEvents })}
          className="flex h-8 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-colors"
          style={{
            background: filters.showEvents ? 'rgba(96,165,250,0.10)' : 'var(--color-surface)',
            color: filters.showEvents ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderColor: filters.showEvents ? 'rgba(96,165,250,0.40)' : 'var(--color-divider)',
          }}
        >
          <Sparkles size={11} />
          {filters.showEvents ? 'Calendar on' : 'Calendar off'}
        </button>
      </FilterField>

      {/* Reset (only visible when something is dirty) */}
      {hasAny && (
        <div className="flex h-8 items-end self-end">
          <button
            type="button"
            onClick={reset}
            className="flex h-8 items-center gap-1 rounded-md border px-2 text-[11px] font-medium"
            style={{
              borderColor: 'var(--color-divider)',
              color: 'var(--color-text-tertiary)',
              background: 'var(--color-surface)',
            }}
          >
            <RotateCcw size={11} /> Reset
          </button>
        </div>
      )}
    </div>
  );
}

// `YYYY-MM` → `YYYY-MM-01`. The DatePicker speaks full ISO dates; we pin
// to day 1 so the picker can render and so min/max bounds work correctly.
function periodToDateStr(period: string): string {
  return `${period}-01`;
}

// ── Small helper — one label + control with consistent spacing ──────────

function FilterField({
  label,
  icon,
  minWidth,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  minWidth: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1" style={{ minWidth }}>
      <label
        className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.10em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

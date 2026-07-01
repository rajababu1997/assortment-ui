/**
 * Dashboard filter row — brand · category · period range.
 *
 * Defaults to no filter (show everything). The buyer narrows when they
 * want a specific window — typical use is "next 3 months" while actively
 * planning, or "current quarter" for variance review.
 *
 * Brand → category cascade is identical to the saleshistory pattern.
 */

import { useMemo } from 'react';
import { CalendarRange, Filter, RotateCcw } from 'lucide-react';
import { DatePicker, MultiSelect } from '@/components/primitives';
import { useApiBrands, useApiCategories } from '@/features/otb/useOtbMaster';
import type { DashboardFilters } from '../useDashboardFilters';

interface BrandOption { uuid: string; name: string }
// Categories arrive snake_case from `otbMasterApi`. Keep the name as-is so
// the brand → category cascade keeps working.
interface CategoryOption { uuid: string; name: string; brand_uuid?: string }

export function FilterBar({
  filters,
  setFilters,
  reset,
  hasActiveFilters,
}: {
  filters: DashboardFilters;
  setFilters: (patch: Partial<DashboardFilters>) => void;
  reset: () => void;
  hasActiveFilters: boolean;
}) {
  const { data: brands = [] } = useApiBrands() as { data?: BrandOption[] };
  const { data: categories = [] } = useApiCategories() as { data?: CategoryOption[] };

  const brandOptions = useMemo(
    () => brands.map((b) => ({ value: b.uuid, label: b.name })),
    [brands],
  );

  const categoryOptions = useMemo(() => {
    const list = filters.brands.length === 0
      ? categories
      : categories.filter((c) => !c.brand_uuid || filters.brands.includes(c.brand_uuid));
    return list.map((c) => ({ value: c.uuid, label: c.name }));
  }, [categories, filters.brands]);

  return (
    <div
      className="flex flex-wrap items-end gap-2 border-b px-3 py-2.5"
      style={{
        background: 'var(--color-surface-alt, #f8fafc)',
        borderColor: 'var(--color-divider)',
      }}
    >
      <Field icon={<Filter size={12} />} label="Brand" minWidth={220}>
        <MultiSelect<string>
          placeholder="All brands"
          value={filters.brands}
          onChange={(next) => setFilters({ brands: next })}
          options={brandOptions}
          searchable
        />
      </Field>

      <Field label="Category" minWidth={240}>
        <MultiSelect<string>
          placeholder="All categories"
          value={filters.categories}
          onChange={(next) => setFilters({ categories: next })}
          options={categoryOptions}
          searchable
        />
      </Field>

      <Field icon={<CalendarRange size={12} />} label="From month" minWidth={170}>
        <DatePicker
          value={filters.from ? `${filters.from}-01` : null}
          placeholder="No lower bound"
          maxDate={filters.to ? `${filters.to}-01` : undefined}
          onChange={(iso) => setFilters({ from: iso ? iso.slice(0, 7) : undefined })}
        />
      </Field>

      <Field label="To month" minWidth={170}>
        <DatePicker
          value={filters.to ? `${filters.to}-01` : null}
          placeholder="No upper bound"
          minDate={filters.from ? `${filters.from}-01` : undefined}
          onChange={(iso) => setFilters({ to: iso ? iso.slice(0, 7) : undefined })}
        />
      </Field>

      {hasActiveFilters && (
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

function Field({
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

/**
 * Universal chrome filter bar. Compare-mode toggle + anchor month/year
 * picker + brand / category / cluster filters.
 */

import { MultiSelect, SegmentedControl, Select } from '@/components/primitives';
import { SEED_BRANDS, SEED_CATEGORIES } from '@/features/otb/mockData/brands';
import { CLUSTERS, COMPARE_MODES, type CompareMode } from '../mock/dimensions';
import type { HistoryFilters } from '../useHistoryFilters';

interface Props {
  filters: HistoryFilters;
  minYear: number;
  maxYear: number;
  onChange: (next: HistoryFilters) => void;
}

const MONTH_OPTIONS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
].map((label, i) => ({ value: i, label }));

const BRAND_OPTIONS = SEED_BRANDS.map((b) => ({ value: b.uuid, label: b.name }));
const CATEGORY_OPTIONS = SEED_CATEGORIES.map((c) => ({ value: c.uuid, label: c.name }));
const CLUSTER_OPTIONS = CLUSTERS.map((c) => ({ value: c.key, label: c.label }));
const COMPARE_OPTIONS = COMPARE_MODES.map((m) => ({ value: m.key, label: m.label }));

export function FilterBar({ filters, minYear, maxYear, onChange }: Props) {
  const yearOptions = [];
  for (let y = minYear; y <= maxYear; y++) yearOptions.push({ value: y, label: String(y) });

  const set = <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Anchor month
          </label>
          <div className="flex gap-2">
            <div className="w-[110px]">
              <Select<number>
                value={filters.anchorMonth}
                onChange={(v) => v != null && set('anchorMonth', v)}
                options={MONTH_OPTIONS}
              />
            </div>
            <div className="w-[100px]">
              <Select<number>
                value={filters.anchorYear}
                onChange={(v) => v != null && set('anchorYear', v)}
                options={yearOptions}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
            Compare against
          </label>
          <SegmentedControl<CompareMode>
            value={filters.compareMode}
            onChange={(v) => set('compareMode', v)}
            options={COMPARE_OPTIONS}
            size="sm"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <MultiSelect<string>
            label="Brands"
            placeholder="All brands"
            value={filters.brand_uuids}
            onChange={(next) => set('brand_uuids', next)}
            options={BRAND_OPTIONS}
            searchable={false}
          />
        </div>
        <div className="flex-1 min-w-[220px]">
          <MultiSelect<string>
            label="Categories"
            placeholder="All categories"
            value={filters.category_uuids}
            onChange={(next) => set('category_uuids', next)}
            options={CATEGORY_OPTIONS}
            searchable={CATEGORY_OPTIONS.length > 6}
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <MultiSelect<string>
            label="Cluster"
            placeholder="All clusters"
            value={filters.cluster_keys}
            onChange={(next) => set('cluster_keys', next)}
            options={CLUSTER_OPTIONS}
            searchable={false}
          />
        </div>
      </div>
    </div>
  );
}

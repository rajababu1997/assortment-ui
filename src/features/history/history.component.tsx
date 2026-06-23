/**
 * Standalone Sales History dashboard. Hosts the four lenses (Overview,
 * MRP & Cost, Fit & Size, Style & Vendors) under the universal chrome
 * filter bar.
 */

import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, Tabs } from '@/components/primitives';
import { useSetupConfig } from '@/features/otb/useOtb';
import type { BaseCurrency } from '@/features/setup/types';
import { FilterBar } from './chrome/FilterBar';
import { useHistoryFilters } from './useHistoryFilters';
import { OverviewLens } from './lenses/OverviewLens';
import { MrpCostLens } from './lenses/MrpCostLens';
import { FitSizeLens } from './lenses/FitSizeLens';
import { StyleVendorLens } from './lenses/StyleVendorLens';
import { COMPARE_MODES } from './mock/dimensions';

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function HistoryPage() {
  const { company } = useSetupConfig();
  const currency: BaseCurrency = company?.base_currency ?? 'INR';
  const filterState = useHistoryFilters();
  const [activeLens, setActiveLens] = useState('overview');

  const compareLabel = useMemo(() => buildCompareLabel(filterState.filters), [filterState.filters]);

  const lensItems = [
    {
      key: 'overview',
      label: 'Overview',
      content: (
        <div className="pt-3">
          <OverviewLens
            filters={filterState.filters}
            compareRows={filterState.compareRows}
            trailingRows={filterState.trailingRows}
            compareLabel={compareLabel}
            currency={currency}
          />
        </div>
      ),
    },
    {
      key: 'mrp-cost',
      label: 'MRP & Cost',
      content: (
        <div className="pt-3">
          <MrpCostLens compareRows={filterState.compareRows} compareLabel={compareLabel} currency={currency} />
        </div>
      ),
    },
    {
      key: 'fit-size',
      label: 'Fit & Size',
      content: (
        <div className="pt-3">
          <FitSizeLens compareRows={filterState.compareRows} compareLabel={compareLabel} currency={currency} />
        </div>
      ),
    },
    {
      key: 'style-vendor',
      label: 'Style & Vendors',
      content: (
        <div className="pt-3">
          <StyleVendorLens compareRows={filterState.compareRows} compareLabel={compareLabel} currency={currency} />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={20} className="text-[var(--color-primary)]" />
            <h1 className="text-2xl font-semibold">Sales History</h1>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Use the lenses below to anchor every planning decision in last-cycle performance.
            Numbers are <em>demo-stubbed</em> — replaced by the sales + inventory feed in production.
          </p>
        </div>
      </div>

      <Card>
        <div className="p-4">
          <FilterBar
            filters={filterState.filters}
            minYear={filterState.minYear}
            maxYear={filterState.maxYear}
            onChange={filterState.setFilters}
          />
        </div>
      </Card>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-xs text-[var(--color-text-secondary)]">
          Anchor: <strong>{MONTH_LABELS[filterState.filters.anchorMonth]} {filterState.filters.anchorYear}</strong> ·
          {' '}
          Compare against <strong>{compareLabel}</strong>
        </div>
        <div className="text-[10px] text-[var(--color-text-tertiary)]">
          Showing {filterState.compareRows.length} rows aggregated from the demo dataset.
        </div>
      </div>

      <Tabs
        items={lensItems}
        activeKey={activeLens}
        onChange={setActiveLens}
        variant="line"
      />
    </div>
  );
}

function buildCompareLabel(filters: ReturnType<typeof useHistoryFilters>['filters']): string {
  const mode = COMPARE_MODES.find((m) => m.key === filters.compareMode);
  if (!mode) return 'last cycle';
  if (filters.compareMode === 'ly-same-month') {
    return `${MONTH_LABELS[filters.anchorMonth]} ${filters.anchorYear - 1}`;
  }
  if (filters.compareMode === 'rolling-12') {
    return `last 12 months ending ${MONTH_LABELS[filters.anchorMonth]} ${filters.anchorYear}`;
  }
  return `3-year avg of ${MONTH_LABELS[filters.anchorMonth]}`;
}

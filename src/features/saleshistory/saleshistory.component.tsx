/**
 * Sales History — the analytics home for finance, buyers, designers,
 * and brand managers. One filter bar, eight headline KPIs, then a
 * scrollable column of focused sections.
 *
 * Mounts at `/saleshistory`.
 */

import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Filter, Monitor } from 'lucide-react';
import { useApiBrands, useApiCategories } from '@/features/otb/useOtbMaster';
import { useDashboardFilters } from './useDashboardFilters';
import { FilterBar } from './components/FilterBar';
import { KpiStrip } from './components/KpiStrip';
import { TrendChartSection } from './components/TrendChartSection';
import { TopBrandsCategoriesSection } from './components/TopBrandsCategoriesSection';
import { CategoryParetoSection } from './components/CategoryParetoSection';
import { CategoryPerformanceSection } from './components/CategoryPerformanceSection';
import { BandMixSection } from './components/BandMixSection';
import { TopMoversSection } from './components/TopMoversSection';
import { DiscountDepthSection } from './components/DiscountDepthSection';
import { ReturnsByCategorySection } from './components/ReturnsByCategorySection';
import { SubTypeTabsSection } from './components/SubTypeTabsSection';
import { MockSubTypeTabsSection } from './components/MockSubTypeTabsSection';
import { AnomalyBanner } from './components/AnomalyBanner';

export default function SalesHistoryPage() {
  const { filters, setFilters, reset, minPeriod, maxPeriod } = useDashboardFilters();
  const wide = useViewportAtLeast(900);

  if (!wide) {
    return <NarrowScreenNotice />;
  }

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
                border: '1px solid rgba(96,165,250,0.22)',
                color: 'var(--color-primary)',
              }}
            >
              <BarChart3 size={14} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Sales History
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {filters.from} → {filters.to}
              </p>
            </div>
          </div>
          <ActiveFilterChips filters={filters} />
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────── */}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          reset={reset}
          minPeriod={minPeriod}
          maxPeriod={maxPeriod}
        />

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          <AnomalyBanner filters={filters} />
          <KpiStrip filters={filters} />
          <TopBrandsCategoriesSection filters={filters} />
          <TrendChartSection filters={filters} />
          <CategoryParetoSection filters={filters} />
          <CategoryPerformanceSection filters={filters} />
          <BandMixSection filters={filters} />
          <TopMoversSection filters={filters} setFilters={setFilters} />
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <DiscountDepthSection filters={filters} />
            <ReturnsByCategorySection filters={filters} />
          </div>
          <SubTypeTabsSection filters={filters} />
          <MockSubTypeTabsSection filters={filters} />
        </div>
      </div>
    </div>
  );
}

// ── Active filter chips ────────────────────────────────────────────────────
// Visible confirmation that the filter took effect — pops a small chip next
// to the page title each time the user picks a brand or category. Makes the
// dashboard's filtering behavior obvious instead of relying on the user to
// notice subtle KPI movements.

interface NameOpt { uuid: string; name: string }

function ActiveFilterChips({ filters }: { filters: ReturnType<typeof useDashboardFilters>['filters'] }) {
  const { data: brands = [] } = useApiBrands() as { data?: NameOpt[] };
  const { data: categories = [] } = useApiCategories() as { data?: NameOpt[] };

  const chips = useMemo(() => {
    const brandMap = new Map(brands.map((b) => [b.uuid, b.name]));
    const catMap = new Map(categories.map((c) => [c.uuid, c.name]));
    const out: { label: string; value: string }[] = [];
    for (const uuid of filters.brands) out.push({ label: 'Brand', value: brandMap.get(uuid) ?? uuid.slice(0, 6) });
    for (const uuid of filters.categories) out.push({ label: 'Category', value: catMap.get(uuid) ?? uuid.slice(0, 6) });
    return out;
  }, [filters.brands, filters.categories, brands, categories]);

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Filter size={11} style={{ color: 'var(--color-text-tertiary)' }} />
      {chips.map((c) => (
        <span
          key={`${c.label}-${c.value}`}
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: 'rgba(96,165,250,0.10)',
            borderColor: 'rgba(96,165,250,0.35)',
            color: 'var(--color-primary)',
          }}
          title={`Filtered by ${c.label}`}
        >
          <span
            className="text-[9.5px] uppercase tracking-wider"
            style={{ opacity: 0.7 }}
          >
            {c.label}
          </span>
          {c.value}
        </span>
      ))}
    </div>
  );
}

// ── Viewport guard ─────────────────────────────────────────────────────────

function useViewportAtLeast(px: number): boolean {
  const [ok, setOk] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth >= px,
  );
  useEffect(() => {
    const onResize = () => setOk(window.innerWidth >= px);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [px]);
  return ok;
}

function NarrowScreenNotice() {
  return (
    <div className="flex h-full w-full items-center justify-center p-6">
      <div
        className="flex max-w-md flex-col items-center gap-3 rounded-xl border p-6 text-center"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-divider)',
        }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
        >
          <Monitor size={20} style={{ color: 'var(--color-primary)' }} />
        </div>
        <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Open on a larger screen
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          The Sales History dashboard is designed for tablets and laptops. Phone
          layouts don't do the merch numbers justice — open this on a 900&nbsp;px
          wide display or larger.
        </p>
      </div>
    </div>
  );
}

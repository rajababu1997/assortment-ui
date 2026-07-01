/**
 * Top movers + Top laggards — what's accelerating vs decelerating
 * in the (brand × category) grid?
 *
 * "Recent" = last third of the selected period, "Prior" = first third.
 * Anything in between is the transition zone and not used for the calc —
 * gives a cleaner signal than first-vs-last month, which is too noisy.
 *
 * Pure netSalesValue based — units & GM can lag pricing changes, but
 * revenue swings show real demand inflection.
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import { useApiBrands, useApiCategories } from '@/features/otb/useOtbMaster';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

interface NameOpt { uuid: string; name: string }

interface MoverRow {
  key: string;
  brandUuid: string;
  categoryUuid: string;
  brandName: string;
  categoryName: string;
  recentValue: number;
  priorValue: number;
  pctChange: number;
  monthly: number[];          // for sparkline
}

export function TopMoversSection({
  filters,
  setFilters,
}: {
  filters: DashboardFilters;
  setFilters: (patch: Partial<DashboardFilters>) => void;
}) {
  const { data: rows = [], isLoading } = useSalesAggregate({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });
  const { data: brands = [] } = useApiBrands() as { data?: NameOpt[] };
  const { data: categories = [] } = useApiCategories() as { data?: NameOpt[] };

  const { movers, laggards, periodCount } = useMemo(
    () => computeMovers(rows, brands, categories, filters.from, filters.to),
    [rows, brands, categories, filters.from, filters.to],
  );

  const drillInto = (m: MoverRow) =>
    setFilters({ brands: [m.brandUuid], categories: [m.categoryUuid] });

  return (
    <section
      className="flex flex-col rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Top movers &amp; laggards
          </h3>
          <SectionInfoButton title="Top movers & laggards">
            <p>What's accelerating and what's slowing down across your brand × category mix.</p>
            <p className="mt-2">
              Your selected date range is divided into thirds. The <strong>last third</strong> is compared against the
              <strong> first third</strong> and brand × category combinations are ranked by their % change in Net Sales.
            </p>
            <p className="mt-3">
              Very small slices are excluded so the signal isn't drowned out by noise — a small slice doubling
              looks impressive but isn't actionable.
            </p>
            <p className="mt-3"><strong>Click any row</strong> to drill the whole dashboard into that brand and category.</p>
            <p className="mt-3">
              The sparkline next to each row shows monthly values across the full selected period alongside the % change.
              At least 3 months of data are needed for this view to populate.
            </p>
          </SectionInfoButton>
        </div>
        <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          last-third vs first-third of period
        </div>
      </header>

      {isLoading ? (
        <Empty>Loading movers…</Empty>
      ) : periodCount < 3 ? (
        <Empty>Pick a period of at least 3 months to see movers.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
          <MoverList
            title="Accelerating"
            icon={<TrendingUp size={12} style={{ color: '#15803d' }} />}
            rows={movers}
            tone="good"
            onDrill={drillInto}
          />
          <MoverList
            title="Decelerating"
            icon={<TrendingDown size={12} style={{ color: '#b91c1c' }} />}
            rows={laggards}
            tone="bad"
            onDrill={drillInto}
          />
        </div>
      )}
    </section>
  );
}

function MoverList({
  title,
  icon,
  rows,
  tone,
  onDrill,
}: {
  title: string;
  icon: React.ReactNode;
  rows: MoverRow[];
  tone: 'good' | 'bad';
  onDrill: (m: MoverRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <Header title={title} icon={icon} />
        <Empty>Not enough data.</Empty>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Header title={title} icon={icon} />
      {rows.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => onDrill(r)}
          className="grid grid-cols-[1fr_56px_64px] items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="min-w-0">
            <div
              className="truncate text-[12px] font-semibold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {r.brandName} <span style={{ color: 'var(--color-text-tertiary)' }}>·</span> {r.categoryName}
            </div>
            <div
              className="mt-0.5 text-[10.5px] tabular-nums"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {fmtMoneyCompact(r.recentValue)} recent
            </div>
          </div>
          <Sparkline values={r.monthly} tone={tone} />
          <div className="flex items-center justify-end gap-0.5 text-[12px] font-semibold tabular-nums"
            style={{ color: tone === 'good' ? '#15803d' : '#b91c1c' }}
          >
            {r.pctChange > 0 ? '+' : ''}{r.pctChange.toFixed(0)}%
            <ArrowRight size={10} style={{ color: 'var(--color-text-tertiary)' }} />
          </div>
        </button>
      ))}
    </div>
  );
}

function Header({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-wider"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {icon}
      {title}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-[140px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {children}
    </div>
  );
}

function Sparkline({ values, tone }: { values: number[]; tone: 'good' | 'bad' }) {
  if (values.length < 2) return <div />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 56;
  const h = 18;
  const step = w / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }}>
      <polyline
        points={pts} fill="none"
        stroke={tone === 'good' ? '#15803d' : '#b91c1c'}
        strokeWidth={1.4} strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Aggregation ────────────────────────────────────────────────────────────

function computeMovers(
  rows: SalesAggregateRow[],
  brands: NameOpt[],
  categories: NameOpt[],
  from: string,
  to: string,
): { movers: MoverRow[]; laggards: MoverRow[]; periodCount: number } {
  const brandMap = new Map(brands.map((b) => [b.uuid, b.name]));
  const catMap = new Map(categories.map((c) => [c.uuid, c.name]));
  const months = enumerateMonths(from, to);
  const periodCount = months.length;

  if (periodCount < 3) return { movers: [], laggards: [], periodCount };

  const third = Math.floor(periodCount / 3);
  const priorWindow = new Set(months.slice(0, third));
  const recentWindow = new Set(months.slice(periodCount - third));

  // Per-(brand × category) accumulator
  const grouped = new Map<string, {
    brandUuid: string;
    categoryUuid: string;
    prior: number;
    recent: number;
    monthly: Map<string, number>;
  }>();

  for (const r of rows) {
    const k = `${r.brandUuid}|${r.categoryUuid}`;
    const cur = grouped.get(k) ?? {
      brandUuid: r.brandUuid,
      categoryUuid: r.categoryUuid,
      prior: 0, recent: 0,
      monthly: new Map(),
    };
    if (priorWindow.has(r.periodKey)) cur.prior += r.netSalesValue;
    if (recentWindow.has(r.periodKey)) cur.recent += r.netSalesValue;
    cur.monthly.set(r.periodKey, (cur.monthly.get(r.periodKey) ?? 0) + r.netSalesValue);
    grouped.set(k, cur);
  }

  // Build rows with a minimum-volume floor — a noisy slice with ₹1L jumping
  // to ₹2L is +100% but not interesting. Use median recent revenue as the floor.
  const allRecent = Array.from(grouped.values()).map((g) => g.recent).sort((a, b) => a - b);
  const floor = allRecent[Math.floor(allRecent.length / 2)] ?? 0;

  const rowsBuilt: MoverRow[] = Array.from(grouped.entries())
    .filter(([, g]) => g.prior > 0 && g.recent >= floor * 0.5)
    .map(([k, g]) => ({
      key: k,
      brandUuid: g.brandUuid,
      categoryUuid: g.categoryUuid,
      brandName: brandMap.get(g.brandUuid) ?? g.brandUuid.slice(0, 6),
      categoryName: catMap.get(g.categoryUuid) ?? g.categoryUuid.slice(0, 6),
      recentValue: g.recent,
      priorValue: g.prior,
      pctChange: ((g.recent - g.prior) / g.prior) * 100,
      monthly: months.map((m) => g.monthly.get(m) ?? 0),
    }));

  const sorted = [...rowsBuilt].sort((a, b) => b.pctChange - a.pctChange);
  return {
    movers: sorted.slice(0, 5),
    laggards: sorted.slice(-5).reverse(),
    periodCount,
  };
}

function enumerateMonths(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

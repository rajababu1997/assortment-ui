/**
 * Top 5 Brands + Top 5 Categories — quick "who's winning" landing widget.
 *
 * Intentionally ignores the brand/category filter — the buyer wants the
 * tenant-wide leaderboard regardless of what they have narrowed to. Only
 * the date range applies.
 *
 * Each row: rank + name + share bar + Net Sales + share% + units. Sorted
 * desc by net sales.
 */

import { useMemo } from 'react';
import { Crown, Tags } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import { useApiBrands, useApiCategories } from '@/features/otb/useOtbMaster';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtUnits, fmtPct } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

interface NameOpt { uuid: string; name: string }

interface TopRow {
  id: string;
  name: string;
  netSales: number;
  units: number;
  sharePct: number;
}

export function TopBrandsCategoriesSection({ filters }: { filters: DashboardFilters }) {
  // Period-only — brand/category filters are intentionally NOT passed so
  // this widget always shows the tenant-wide top 5 regardless of which
  // slice the buyer has narrowed to.
  const { data: rows = [], isLoading } = useSalesAggregate({
    from: filters.from,
    to: filters.to,
  });
  const { data: brands = [] } = useApiBrands() as { data?: NameOpt[] };
  const { data: categories = [] } = useApiCategories() as { data?: NameOpt[] };

  const topBrands = useMemo(
    () => aggregateTopN(rows, 'brandUuid', brands, 5),
    [rows, brands],
  );
  const topCategories = useMemo(
    () => aggregateTopN(rows, 'categoryUuid', categories, 5),
    [rows, categories],
  );

  return (
    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
      <LeaderCard
        title="Top 5 Brands"
        subtitle="by net sales · period total"
        icon={<Crown size={14} style={{ color: '#f59e0b' }} />}
        rows={topBrands}
        loading={isLoading}
        firstColLabel="Brand"
        info={
          <>
            <p>Your top 5 brands ranked by <strong>Net Sales</strong> for the selected date range.</p>
            <p className="mt-2">
              This leaderboard always shows your overall top performers across the business — it doesn't narrow when you
              filter by brand or category in the other widgets, so you always keep a clear view of where the revenue is
              concentrated.
            </p>
            <p className="mt-2">Each row shows rank, brand, a share bar, Net Sales, Share % of total, and Units sold.</p>
          </>
        }
      />
      <LeaderCard
        title="Top 5 Categories"
        subtitle="by net sales · period total"
        icon={<Tags size={14} style={{ color: 'var(--color-primary)' }} />}
        rows={topCategories}
        loading={isLoading}
        firstColLabel="Category"
        info={
          <>
            <p>Your top 5 categories ranked by <strong>Net Sales</strong> for the selected date range.</p>
            <p className="mt-2">
              Like the brand leaderboard, this card always shows your overall top categories regardless of which brand or
              category you've drilled into elsewhere. Useful for keeping perspective on where the business sits.
            </p>
            <p className="mt-2">Each row shows rank, category, a share bar, Net Sales, Share % of total, and Units sold.</p>
          </>
        }
      />
    </div>
  );
}

function LeaderCard({
  title,
  subtitle,
  icon,
  rows,
  loading,
  firstColLabel,
  info,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  rows: TopRow[];
  loading: boolean;
  firstColLabel: string;
  info?: React.ReactNode;
}) {
  const max = rows[0]?.netSales ?? 0;
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
          {icon}
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            {title}
          </h3>
          {info && <SectionInfoButton title={title}>{info}</SectionInfoButton>}
        </div>
        <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          {subtitle}
        </div>
      </header>

      {loading ? (
        <Empty>Loading leaders…</Empty>
      ) : rows.length === 0 ? (
        <Empty>No data in this period.</Empty>
      ) : (
        <div className="flex flex-col gap-1 p-3">
          <div
            className="grid grid-cols-[28px_1fr_110px_70px_70px] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <div>#</div>
            <div>{firstColLabel}</div>
            <div className="text-right">Net Sales</div>
            <div className="text-right">Share</div>
            <div className="text-right">Units</div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.id}
              className="grid grid-cols-[28px_1fr_110px_70px_70px] items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[var(--color-surface-alt,#f8fafc)]"
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold tabular-nums"
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                    : 'var(--color-surface-alt, #f1f5f9)',
                  color: i === 0 ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                {i + 1}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className="truncate text-[12px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {r.name}
                </div>
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-surface-alt, #f1f5f9)', minWidth: 40 }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${max > 0 ? (r.netSales / max) * 100 : 0}%`,
                      background: 'linear-gradient(90deg, #60a5fa, #2176ff)',
                    }}
                  />
                </div>
              </div>
              <div className="text-right text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                {fmtMoneyCompact(r.netSales)}
              </div>
              <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtPct(r.sharePct)}
              </div>
              <div className="text-right text-[12px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                {fmtUnits(r.units)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-[180px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {children}
    </div>
  );
}

function aggregateTopN(
  rows: SalesAggregateRow[],
  groupBy: 'brandUuid' | 'categoryUuid',
  lookup: NameOpt[],
  n: number,
): TopRow[] {
  const tot = new Map<string, { netSales: number; units: number }>();
  for (const r of rows) {
    const id = r[groupBy];
    const cur = tot.get(id) ?? { netSales: 0, units: 0 };
    cur.netSales += r.netSalesValue;
    cur.units += r.netSalesUnits;
    tot.set(id, cur);
  }
  const nameMap = new Map(lookup.map((l) => [l.uuid, l.name]));
  const totalNet = Array.from(tot.values()).reduce((a, b) => a + b.netSales, 0);
  return Array.from(tot.entries())
    .map(([id, v]) => ({
      id,
      name: nameMap.get(id) ?? id.slice(0, 8),
      netSales: v.netSales,
      units: v.units,
      sharePct: totalNet > 0 ? (v.netSales / totalNet) * 100 : 0,
    }))
    .sort((a, b) => b.netSales - a.netSales)
    .slice(0, n);
}

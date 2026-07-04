/**
 * Category-wise Performance — full server-data table.
 *
 * Rolls the (period × brand × category × band) sales aggregate up to one
 * row per category. Respects all filters (brands / categories / from-to).
 */

import { useMemo } from 'react';
import { Grid2X2 } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import { useApiCategories } from '@/features/otb/useOtbMaster';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtUnits, fmtPct } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

interface NameOpt { uuid: string; name: string }

interface Row {
  uuid: string;
  name: string;
  netSales: number;
  units: number;
  gpPct: number;
  strPct: number;
  markdownPct: number;
}

export function CategoryPerformanceSection({ filters }: { filters: DashboardFilters }) {
  const tyFilter = useMemo(() => ({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  }), [filters]);

  const tyAgg = useSalesAggregate(tyFilter);
  const { data: categories = [] } = useApiCategories() as { data?: NameOpt[] };
  const nameByUuid = useMemo(
    () => new Map(categories.map((c) => [c.uuid, c.name] as const)),
    [categories],
  );

  const rows = useMemo<Row[]>(() => {
    const tyMap = rollupByCategory(tyAgg.data ?? []);
    const out: Row[] = [];
    for (const [uuid, t] of tyMap) {
      const netSales = t.netSalesValue;
      const gpPct = t.netSalesValue > 0 ? (t.gpValue / t.netSalesValue) * 100 : 0;
      const markdownPct = t.grossSalesValue > 0 ? (t.markdownValue / t.grossSalesValue) * 100 : 0;
      const strPct = t.grossSalesUnits + t.eomUnits > 0
        ? (t.grossSalesUnits / (t.grossSalesUnits + t.eomUnits)) * 100
        : 0;
      out.push({
        uuid,
        name: nameByUuid.get(uuid) ?? uuid.slice(0, 6),
        netSales,
        units: t.netSalesUnits,
        gpPct,
        strPct,
        markdownPct,
      });
    }
    return out.sort((a, b) => b.netSales - a.netSales);
  }, [tyAgg.data, nameByUuid]);

  const isLoading = tyAgg.isLoading;

  return (
    <section
      className="flex flex-col rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center justify-between gap-2 rounded-t-xl border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <Grid2X2 size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Category-wise Performance
          </h3>
          <SectionInfoButton title="Category-wise Performance">
            <p>
              Every category in the filtered slice, rolled up from the sales aggregate.
            </p>
            <p className="mt-2"><strong>Columns:</strong></p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><strong>Net Sales</strong> and <strong>Units</strong> — for the current window.</li>
              <li><strong>GM%</strong> — weighted gross margin (gpValue ÷ netSalesValue).</li>
              <li><strong>Sell-Through</strong> — season STR, computed from gross units and ending inventory.</li>
              <li><strong>Markdown%</strong> — markdown value ÷ gross sales value; goes red above 15%.</li>
            </ul>
            <p className="mt-2">Brand / category filters apply.</p>
          </SectionInfoButton>
        </div>
        <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          {rows.length} categories · {filters.from} → {filters.to}
        </div>
      </header>

      {isLoading ? (
        <div className="p-4">
          <div
            className="h-[240px] animate-pulse rounded-md"
            style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
          />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex h-[180px] items-center justify-center text-[12px]"
          style={{ color: 'var(--color-text-tertiary)' }}>
          No category sales in this slice.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-tertiary)' }}
              >
                <Th align="left">Category</Th>
                <Th>Net Sales</Th>
                <Th>Units</Th>
                <Th>GM %</Th>
                <Th>Sell-Through</Th>
                <Th>Markdown %</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.uuid} className="border-b last:border-b-0 hover:bg-[var(--color-surface-alt,#f8fafc)]"
                  style={{ borderColor: 'var(--color-divider)' }}>
                  <Td align="left">
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {r.name}
                    </span>
                  </Td>
                  <Td>{fmtMoneyCompact(r.netSales)}</Td>
                  <Td>{fmtUnits(r.units)}</Td>
                  <Td>{fmtPct(r.gpPct)}</Td>
                  <Td>{fmtPct(r.strPct)}</Td>
                  <Td>
                    <span style={{ color: r.markdownPct > 15 ? '#b91c1c' : 'var(--color-text-secondary)' }}>
                      {fmtPct(r.markdownPct)}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── Rollup / helpers ───────────────────────────────────────────────────────

interface Bucket {
  netSalesValue: number;
  netSalesUnits: number;
  grossSalesValue: number;
  grossSalesUnits: number;
  markdownValue: number;
  gpValue: number;
  eomUnits: number;
}

function rollupByCategory(rows: SalesAggregateRow[]): Map<string, Bucket> {
  const m = new Map<string, Bucket>();
  // STR needs LAST period's EOM per (brand × cat) slice — otherwise summing
  // EOM across months collapses the metric. Track the latest periodKey per
  // slice and only fold that row's EOM into the bucket.
  const lastPeriod = new Map<string, string>();
  const eomBySlice = new Map<string, { uuid: string; eom: number }>();

  for (const r of rows) {
    const b = m.get(r.categoryUuid) ?? {
      netSalesValue: 0, netSalesUnits: 0,
      grossSalesValue: 0, grossSalesUnits: 0,
      markdownValue: 0, gpValue: 0, eomUnits: 0,
    };
    b.netSalesValue += r.netSalesValue;
    b.netSalesUnits += r.netSalesUnits;
    b.grossSalesValue += r.grossSalesValue;
    b.grossSalesUnits += r.grossSalesUnits;
    b.markdownValue += r.markdownValue;
    b.gpValue += r.gpValue;
    m.set(r.categoryUuid, b);

    const sliceKey = `${r.brandUuid}|${r.categoryUuid}`;
    const lp = lastPeriod.get(sliceKey);
    if (!lp || r.periodKey > lp) {
      lastPeriod.set(sliceKey, r.periodKey);
      eomBySlice.set(sliceKey, { uuid: r.categoryUuid, eom: r.eomUnits });
    }
  }
  for (const { uuid, eom } of eomBySlice.values()) {
    const b = m.get(uuid);
    if (b) b.eomUnits += eom;
  }
  return m;
}

// ── Small UI atoms ─────────────────────────────────────────────────────────

function Th({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className="px-3 py-2 text-[10.5px] font-semibold uppercase tracking-[0.10em]"
      style={{ textAlign: align }}
    >
      {children}
    </th>
  );
}
function Td({ children, align = 'right' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td
      className="px-3 py-2 tabular-nums"
      style={{ textAlign: align, color: 'var(--color-text-secondary)' }}
    >
      {children}
    </td>
  );
}

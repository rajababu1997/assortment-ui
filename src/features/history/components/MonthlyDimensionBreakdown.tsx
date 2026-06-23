/**
 * "What did each last month look like?" table — rows are months,
 * columns are brands or categories ordered by their total contribution.
 *
 * Cells carry both the money value and a heat-tone background so the
 * pattern jumps out without a separate chart.
 */

import { useMemo } from 'react';
import { findBrand, findCategory, SEED_BRANDS, SEED_CATEGORIES } from '@/features/otb/mockData/brands';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { HistoryRow } from '../mock/dataset';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  rows: HistoryRow[];
  dimension: 'brand' | 'category';
  numMonths?: number;
  anchorYear: number;
  anchorMonth: number;
  currency: BaseCurrency;
  title: string;
  subtitle?: string;
}

export function MonthlyDimensionBreakdown({
  rows,
  dimension,
  numMonths = 12,
  anchorYear,
  anchorMonth,
  currency,
  title,
  subtitle,
}: Props) {
  const monthRange = useMemo(() => {
    const out: Array<{ year: number; month: number; key: string; label: string }> = [];
    const anchorIdx = anchorYear * 12 + anchorMonth;
    for (let i = numMonths - 1; i >= 0; i--) {
      const idx = anchorIdx - i;
      const y = Math.floor(idx / 12);
      const m = ((idx % 12) + 12) % 12;
      out.push({
        year: y,
        month: m,
        key: `${y}-${m}`,
        label: `${MONTH_LABELS[m]} ${String(y).slice(2)}`,
      });
    }
    return out;
  }, [anchorYear, anchorMonth, numMonths]);

  const { columns, matrix, rowTotals, colTotals, maxCell } = useMemo(() => {
    const cells = new Map<string, number>(); // monthKey-dimKey → sales
    const totalByDim = new Map<string, number>();
    const totalByMonth = new Map<string, number>();
    const present = new Set<string>();
    let max = 0;

    for (const r of rows) {
      const monthKey = `${r.year}-${r.month}`;
      if (!monthRange.some((m) => m.key === monthKey)) continue;
      const dimKey = dimension === 'brand' ? r.brand_uuid : r.category_uuid;
      present.add(dimKey);
      const k = `${monthKey}-${dimKey}`;
      const next = (cells.get(k) ?? 0) + r.net_sales;
      cells.set(k, next);
      totalByDim.set(dimKey, (totalByDim.get(dimKey) ?? 0) + r.net_sales);
      totalByMonth.set(monthKey, (totalByMonth.get(monthKey) ?? 0) + r.net_sales);
      if (next > max) max = next;
    }

    const taxonomy = dimension === 'brand' ? SEED_BRANDS : SEED_CATEGORIES;
    const cols = taxonomy
      .map((t) => ({
        key: t.uuid,
        label: t.name,
        secondary:
          dimension === 'category'
            ? findBrand((t as { brand_uuid?: string }).brand_uuid ?? '')?.name
            : undefined,
        total: totalByDim.get(t.uuid) ?? 0,
      }))
      .filter((c) => present.has(c.key))
      .sort((a, b) => b.total - a.total);

    const mat = monthRange.map((m) =>
      cols.map((c) => cells.get(`${m.key}-${c.key}`) ?? 0),
    );

    return {
      columns: cols,
      matrix: mat,
      rowTotals: monthRange.map((m) => totalByMonth.get(m.key) ?? 0),
      colTotals: cols.map((c) => c.total),
      maxCell: max,
    };
  }, [rows, monthRange, dimension]);

  const safeMax = Math.max(maxCell, 1);

  return (
    <div className="rounded border border-[var(--color-divider)]">
      <div className="px-3 py-2 border-b border-[var(--color-divider)] flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {subtitle && (
            <div className="text-[10px] text-[var(--color-text-tertiary)]">{subtitle}</div>
          )}
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {numMonths} months · {columns.length} {dimension === 'brand' ? 'brands' : 'categories'}
        </span>
      </div>

      {columns.length === 0 ? (
        <div className="p-4 text-xs text-[var(--color-text-tertiary)] italic">
          No data in the selected filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] text-left border-b border-[var(--color-divider)]">
                <th className="py-2 px-3 font-medium w-[90px] sticky left-0 bg-[var(--color-bg-base)] z-10">
                  Month
                </th>
                {columns.map((c) => (
                  <th key={c.key} className="py-2 px-2 font-medium text-right whitespace-nowrap">
                    <div>{c.label}</div>
                    {c.secondary && (
                      <div className="text-[9px] text-[var(--color-text-tertiary)] font-normal">
                        {c.secondary}
                      </div>
                    )}
                  </th>
                ))}
                <th className="py-2 px-2 font-semibold text-right whitespace-nowrap text-[var(--color-text-primary)] border-l border-[var(--color-divider)]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {monthRange.map((m, rowIdx) => (
                <tr key={m.key} className="border-b border-[var(--color-divider)] last:border-b-0">
                  <td className="py-1.5 px-3 font-medium sticky left-0 bg-[var(--color-bg-base)] z-10 whitespace-nowrap">
                    {m.label}
                  </td>
                  {matrix[rowIdx].map((value, colIdx) => {
                    const intensity = value / safeMax;
                    const bg = `rgba(59,130,246,${(0.04 + intensity * 0.55).toFixed(3)})`;
                    return (
                      <td
                        key={colIdx}
                        className="py-1.5 px-2 text-right tabular-nums whitespace-nowrap"
                        style={{ backgroundColor: bg }}
                      >
                        {value > 0 ? fmtMoneyCompact(value, currency) : '—'}
                      </td>
                    );
                  })}
                  <td className="py-1.5 px-2 text-right tabular-nums font-medium border-l border-[var(--color-divider)] whitespace-nowrap">
                    {rowTotals[rowIdx] > 0 ? fmtMoneyCompact(rowTotals[rowIdx], currency) : '—'}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-[var(--color-divider)] bg-[var(--color-bg-subtle)] font-semibold">
                <td className="py-1.5 px-3 sticky left-0 bg-[var(--color-bg-subtle)] z-10">Total</td>
                {colTotals.map((t, i) => (
                  <td key={i} className="py-1.5 px-2 text-right tabular-nums whitespace-nowrap">
                    {t > 0 ? fmtMoneyCompact(t, currency) : '—'}
                  </td>
                ))}
                <td className="py-1.5 px-2 text-right tabular-nums border-l border-[var(--color-divider)] whitespace-nowrap">
                  {fmtMoneyCompact(
                    rowTotals.reduce((s, v) => s + v, 0),
                    currency,
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

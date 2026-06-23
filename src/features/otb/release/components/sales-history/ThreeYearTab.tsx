/**
 * 3-year same-period side-by-side. Reads monthly totals for the period
 * across the last three years.
 */

import { useMemo } from 'react';
import { aggregateTotals, queryRows } from '@/features/history/mock/dataset';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';

interface Props {
  brand_uuid: string;
  category_uuid: string;
  periodStartIso: string;
  periodEndIso: string;
  currency: BaseCurrency;
}

export function ThreeYearTab({ brand_uuid, category_uuid, periodStartIso, periodEndIso, currency }: Props) {
  const stats = useMemo(() => {
    const start = new Date(periodStartIso);
    const end = new Date(periodEndIso);
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const years = [start.getFullYear() - 1, start.getFullYear() - 2, start.getFullYear() - 3];
    return years.map((y) => ({
      year: y,
      agg: aggregateTotals(
        queryRows({
          yearFrom: y,
          monthFrom: startMonth,
          yearTo: y,
          monthTo: endMonth,
          brand_uuids: [brand_uuid],
          category_uuids: [category_uuid],
        }),
      ),
    }));
  }, [brand_uuid, category_uuid, periodStartIso, periodEndIso]);

  const sortedByYear = [...stats].sort((a, b) => a.year - b.year);
  const cagrPct = useMemo(() => {
    if (sortedByYear.length < 2) return null;
    const first = sortedByYear[0].agg.net_sales;
    const last = sortedByYear[sortedByYear.length - 1].agg.net_sales;
    if (first <= 0) return null;
    const n = sortedByYear.length - 1;
    return ((Math.pow(last / first, 1 / n) - 1) * 100);
  }, [sortedByYear]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded border border-[var(--color-divider)]">
        <div className="px-3 py-2 border-b border-[var(--color-divider)] text-sm font-semibold">
          Same period · last 3 years
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-tertiary)] text-left border-b border-[var(--color-divider)]">
              <th className="py-2 px-3 font-medium">Year</th>
              <th className="py-2 px-2 font-medium text-right">Net sales</th>
              <th className="py-2 px-2 font-medium text-right">Units</th>
              <th className="py-2 px-2 font-medium text-right">ST %</th>
              <th className="py-2 px-2 font-medium text-right">GM %</th>
              <th className="py-2 px-2 font-medium text-right">Markdown</th>
              <th className="py-2 px-2 font-medium text-right">Returns</th>
            </tr>
          </thead>
          <tbody>
            {sortedByYear.map((s) => (
              <tr key={s.year} className="border-b border-[var(--color-divider)] last:border-b-0">
                <td className="py-1.5 px-3 font-medium">{s.year}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{fmtMoneyCompact(s.agg.net_sales, currency)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{s.agg.units_sold.toLocaleString('en-IN')}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{s.agg.sell_through_pct.toFixed(0)}%</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{s.agg.gross_margin_pct.toFixed(1)}%</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{s.agg.markdown_pct.toFixed(1)}%</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{s.agg.returns_pct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-[var(--color-text-secondary)]">
        {cagrPct == null
          ? 'Not enough history to compute CAGR.'
          : `3-yr CAGR ≈ ${cagrPct >= 0 ? '+' : ''}${cagrPct.toFixed(1)}%. ${
              Math.abs(cagrPct) < 2 ? 'Flat trend.' : cagrPct > 0 ? 'Steady growth — trust the anchor.' : 'Multi-year softening — buy cautiously.'
            }`}
      </div>
    </div>
  );
}

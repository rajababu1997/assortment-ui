/**
 * Compact brand × month heat-strip for the comparison year. Each row is
 * a brand-category; each cell is a month coloured by relative net sales.
 *
 * Click a row → emits the (brand_uuid, category_uuid) so the parent can
 * focus that pair in the rest of the panel.
 */

import { useMemo } from 'react';
import { findBrand, findCategory, SEED_CATEGORIES } from '../../mockData/brands';
import { getCategoryMonthSeries } from '../../mockData/historicalSales';

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

interface Props {
  comparisonYear: number;
  highlightMonth: number;
}

export function BrandHeatmap({ comparisonYear, highlightMonth }: Props) {
  const rows = useMemo(() => {
    return SEED_CATEGORIES.map((cat) => {
      const series = getCategoryMonthSeries(cat.brand_uuid, cat.uuid).filter(
        (r) => r.year === comparisonYear,
      );
      const max = Math.max(1, ...series.map((s) => s.net_sales));
      return {
        brand_uuid: cat.brand_uuid,
        category_uuid: cat.uuid,
        cells: series.map((s) => ({
          month: s.month,
          intensity: s.net_sales / max,
          value: s.net_sales,
        })),
      };
    });
  }, [comparisonYear]);

  return (
    <div className="rounded border border-[var(--color-divider)] p-3">
      <div className="text-xs font-semibold mb-2">
        Sales heat-map · {comparisonYear}
      </div>
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-[var(--color-text-tertiary)]">
            <th className="text-left font-normal pr-2 w-[140px]">Brand · Category</th>
            {MONTH_LABELS.map((m, i) => (
              <th
                key={i}
                className={`font-normal text-center ${
                  i === highlightMonth ? 'text-[var(--color-primary)] font-semibold' : ''
                }`}
              >
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const brand = findBrand(row.brand_uuid);
            const cat = findCategory(row.category_uuid);
            return (
              <tr key={`${row.brand_uuid}-${row.category_uuid}`}>
                <td className="pr-2 py-1 truncate text-[11px]">
                  <span className="text-[var(--color-text-tertiary)]">
                    {brand?.name?.[6] ?? brand?.name ?? '—'}
                  </span>{' '}
                  <span>{cat?.name ?? '—'}</span>
                </td>
                {row.cells.map((c) => {
                  const opacity = 0.15 + c.intensity * 0.75;
                  const ring =
                    c.month === highlightMonth
                      ? 'outline outline-1 outline-[var(--color-primary)]'
                      : '';
                  return (
                    <td key={c.month} className="text-center px-0.5">
                      <div
                        className={`mx-auto h-3 w-full rounded-sm ${ring}`}
                        style={{ backgroundColor: `rgba(59,130,246,${opacity})` }}
                        title={`${MONTH_LABELS[c.month]} ${comparisonYear} · ₹${c.value.toLocaleString('en-IN')}`}
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

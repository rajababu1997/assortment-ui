/**
 * Reusable weekly-cell table. Rows = weeks; cells colour by relative
 * sales. Occasion weeks get a coloured badge.
 */

import { fmtMoneyCompact } from '@/features/otb/utils/format';
import { OCCASIONS } from '../../data/occasions';
import type { BaseCurrency } from '@/features/setup/types';
import type { WeeklyCell } from '../../data/weeklyVelocity';

interface Props {
  cells: WeeklyCell[];
  currency: BaseCurrency;
  emptyMessage?: string;
}

export function WeeklyTable({ cells, currency, emptyMessage }: Props) {
  if (cells.length === 0) {
    return (
      <div className="text-xs text-[var(--color-text-tertiary)] italic py-3">
        {emptyMessage ?? 'No data in this range.'}
      </div>
    );
  }
  const max = Math.max(...cells.map((c) => c.net_sales), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-[var(--color-text-tertiary)] text-left border-b border-[var(--color-divider)]">
            <th className="py-2 px-3 font-medium">Week</th>
            <th className="py-2 px-2 font-medium text-right">Units</th>
            <th className="py-2 px-2 font-medium text-right">Net sales</th>
            <th className="py-2 px-2 font-medium text-right">ST %</th>
            <th className="py-2 px-2 font-medium text-right">Returns</th>
            <th className="py-2 px-2 font-medium text-right">Markdown</th>
            <th className="py-2 px-2 font-medium">Note</th>
          </tr>
        </thead>
        <tbody>
          {cells.map((c, i) => {
            const occ = c.occasion_key ? OCCASIONS.find((o) => o.key === c.occasion_key) : undefined;
            const opacity = 0.04 + (c.net_sales / max) * 0.55;
            const bg = `rgba(59,130,246,${opacity.toFixed(3)})`;
            return (
              <tr
                key={`${c.iso_label}-${i}`}
                className="border-b border-[var(--color-divider)] last:border-b-0"
                style={{ backgroundColor: bg }}
              >
                <td className="py-1.5 px-3 whitespace-nowrap font-medium">
                  <div>{c.iso_label}</div>
                  <div className="text-[9px] text-[var(--color-text-tertiary)] font-normal">
                    {formatRange(c.start_iso, c.end_iso)}
                  </div>
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">{c.units_sold.toLocaleString('en-IN')}</td>
                <td className="py-1.5 px-2 text-right tabular-nums font-medium">
                  {fmtMoneyCompact(c.net_sales, currency)}
                </td>
                <td className="py-1.5 px-2 text-right tabular-nums">{c.sell_through_pct.toFixed(0)}%</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{c.returns_pct.toFixed(1)}%</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{c.markdown_pct.toFixed(0)}%</td>
                <td className="py-1.5 px-2">
                  {occ && (
                    <span className="inline-block px-1.5 py-0.5 text-[9px] rounded bg-[var(--color-primary)] text-white">
                      {occ.label}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatRange(startIso: string, endIso: string): string {
  const a = new Date(startIso);
  const b = new Date(endIso);
  return `${a.getDate()} ${MONTH_LABELS[a.getMonth()]} – ${b.getDate()} ${MONTH_LABELS[b.getMonth()]}`;
}

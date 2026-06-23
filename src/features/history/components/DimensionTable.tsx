/**
 * Tabular view of a dimension aggregate (MRP bands, fits, colors, …).
 * Highlights amber / red on out-of-band metrics.
 */

import type { BaseCurrency } from '@/features/setup/types';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { DimensionAggregate } from '../mock/dataset';
import type { DimensionItem } from '../mock/dimensions';

interface Props {
  rows: DimensionAggregate[];
  taxonomy: DimensionItem[];
  currency: BaseCurrency;
  title: string;
  subtitle?: string;
  /** When set, clicking a row emits the dimension key. */
  onSelect?: (key: string) => void;
}

export function DimensionTable({ rows, taxonomy, currency, title, subtitle, onSelect }: Props) {
  const label = (key: string) => taxonomy.find((d) => d.key === key)?.label ?? key;
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
          {rows.length} {rows.length === 1 ? 'row' : 'rows'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-tertiary)] text-left border-b border-[var(--color-divider)]">
              <th className="py-2 px-3 font-medium">Item</th>
              <th className="py-2 px-2 font-medium text-right">Share</th>
              <th className="py-2 px-2 font-medium text-right">Net sales</th>
              <th className="py-2 px-2 font-medium text-right">ST %</th>
              <th className="py-2 px-2 font-medium text-right">GM %</th>
              <th className="py-2 px-2 font-medium text-right">MD %</th>
              <th className="py-2 px-2 font-medium text-right">Returns</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.key}
                className={`border-b border-[var(--color-divider)] last:border-b-0 ${
                  idx % 2 === 1 ? 'bg-[var(--color-bg-subtle)]' : ''
                } ${onSelect ? 'cursor-pointer hover:bg-[var(--color-bg-hover)]' : ''}`}
                onClick={() => onSelect?.(r.key)}
              >
                <td className="py-1.5 px-3 font-medium">{label(r.key)}</td>
                <td className="py-1.5 px-2 text-right tabular-nums">{r.share_pct.toFixed(0)}%</td>
                <td className="py-1.5 px-2 text-right tabular-nums">
                  {fmtMoneyCompact(r.net_sales, currency)}
                </td>
                <td className={`py-1.5 px-2 text-right tabular-nums ${tone(r.sell_through_pct, 'st')}`}>
                  {r.sell_through_pct.toFixed(0)}%
                </td>
                <td className={`py-1.5 px-2 text-right tabular-nums ${tone(r.gross_margin_pct, 'gm')}`}>
                  {r.gross_margin_pct.toFixed(0)}%
                </td>
                <td className={`py-1.5 px-2 text-right tabular-nums ${tone(r.markdown_pct, 'md')}`}>
                  {r.markdown_pct.toFixed(0)}%
                </td>
                <td className={`py-1.5 px-2 text-right tabular-nums ${tone(r.returns_pct, 'ret')}`}>
                  {r.returns_pct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function tone(value: number, metric: 'st' | 'gm' | 'md' | 'ret'): string {
  if (metric === 'st') {
    return value >= 80 ? 'text-[var(--color-success)]' : value < 60 ? 'text-[var(--color-danger)]' : '';
  }
  if (metric === 'gm') {
    return value >= 35 ? 'text-[var(--color-success)]' : value < 28 ? 'text-[var(--color-danger)]' : '';
  }
  if (metric === 'md') {
    return value > 18 ? 'text-[var(--color-danger)]' : value <= 10 ? 'text-[var(--color-success)]' : '';
  }
  return value > 8 ? 'text-[var(--color-danger)]' : '';
}

/**
 * Top winners + bottom losers for the comparison month. Each row shows
 * brand × category, net sales, and sell-through.
 */

import { findBrand, findCategory } from '../../mockData/brands';
import { fmtMoneyCompact } from '../../utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { HistoryRow } from '../../mockData/historicalSales';

interface Props {
  winners: HistoryRow[];
  losers: HistoryRow[];
  currency: BaseCurrency;
}

export function WinnersLosersList({ winners, losers, currency }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card title="Top sellers" tone="success" rows={winners} currency={currency} />
      <Card title="Underperformers" tone="danger" rows={losers} currency={currency} />
    </div>
  );
}

function Card({
  title,
  tone,
  rows,
  currency,
}: {
  title: string;
  tone: 'success' | 'danger';
  rows: HistoryRow[];
  currency: BaseCurrency;
}) {
  const dotClass =
    tone === 'success' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-danger)]';
  return (
    <div className="rounded border border-[var(--color-divider)] p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
        <span className="text-xs font-semibold">{title}</span>
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-[var(--color-text-tertiary)] italic">No data</div>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((r) => {
            const brand = findBrand(r.brand_uuid);
            const cat = findCategory(r.category_uuid);
            return (
              <li
                key={`${r.brand_uuid}-${r.category_uuid}`}
                data-brand={r.brand_uuid}
                data-category={r.category_uuid}
                className="flex items-center justify-between gap-2 text-xs cursor-pointer hover:bg-[var(--color-bg-subtle)] rounded px-1 -mx-1 py-0.5"
                title="Click to add this brand × category to the active OTB tab"
              >
                <span className="truncate">
                  <span className="font-medium">{brand?.name ?? '—'}</span>
                  <span className="text-[var(--color-text-tertiary)]"> · </span>
                  <span>{cat?.name ?? '—'}</span>
                </span>
                <span className="text-right whitespace-nowrap">
                  <div className="font-medium">{fmtMoneyCompact(r.net_sales, currency)}</div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)]">
                    ST {r.sell_through_pct.toFixed(0)}%
                  </div>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

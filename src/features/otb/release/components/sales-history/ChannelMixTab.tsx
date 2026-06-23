/**
 * Channel + cluster mix tab. Reads cluster shares for the LY same period
 * vs the trailing 90 days so the buyer sees whether channel tilt has
 * shifted (online up, offline down etc.).
 */

import { useMemo } from 'react';
import { aggregateByDimension, queryRows } from '@/features/history/mock/dataset';
import { CLUSTERS } from '@/features/history/mock/dimensions';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';

interface Props {
  brand_uuid: string;
  category_uuid: string;
  periodStartIso: string;
  todayMs: number;
  currency: BaseCurrency;
}

export function ChannelMixTab({
  brand_uuid, category_uuid, periodStartIso, todayMs, currency,
}: Props) {
  const lyRows = useMemo(() => {
    const start = new Date(periodStartIso);
    return queryRows({
      yearFrom: start.getFullYear() - 1,
      monthFrom: start.getMonth(),
      yearTo: start.getFullYear() - 1,
      monthTo: start.getMonth(),
      brand_uuids: [brand_uuid],
      category_uuids: [category_uuid],
    });
  }, [brand_uuid, category_uuid, periodStartIso]);

  const trailingRows = useMemo(() => {
    const today = new Date(todayMs);
    const past = new Date(today);
    past.setDate(past.getDate() - 90);
    return queryRows({
      yearFrom: past.getFullYear(),
      monthFrom: past.getMonth(),
      yearTo: today.getFullYear(),
      monthTo: today.getMonth(),
      brand_uuids: [brand_uuid],
      category_uuids: [category_uuid],
    });
  }, [brand_uuid, category_uuid, todayMs]);

  const lyMix = useMemo(() => aggregateByDimension(lyRows, 'cluster'), [lyRows]);
  const recentMix = useMemo(() => aggregateByDimension(trailingRows, 'cluster'), [trailingRows]);

  const rows = useMemo(() => {
    return CLUSTERS.map((c) => {
      const ly = lyMix.find((r) => r.key === c.key);
      const recent = recentMix.find((r) => r.key === c.key);
      const lyShare = ly?.share_pct ?? 0;
      const recentShare = recent?.share_pct ?? 0;
      return {
        key: c.key,
        label: c.label,
        lyShare,
        recentShare,
        delta: recentShare - lyShare,
        lySales: ly?.net_sales ?? 0,
        recentSales: recent?.net_sales ?? 0,
      };
    });
  }, [lyMix, recentMix]);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded border border-[var(--color-divider)]">
        <div className="px-3 py-2 border-b border-[var(--color-divider)] text-sm font-semibold">
          Channel / cluster mix shift
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-tertiary)] text-left border-b border-[var(--color-divider)]">
              <th className="py-2 px-3 font-medium">Channel</th>
              <th className="py-2 px-2 font-medium text-right">LY same month share</th>
              <th className="py-2 px-2 font-medium text-right">Last 90 days share</th>
              <th className="py-2 px-2 font-medium text-right">Δ</th>
              <th className="py-2 px-2 font-medium text-right">Last 90d sales</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const toneClass =
                r.delta >= 3 ? 'text-[var(--color-success)]'
                : r.delta <= -3 ? 'text-[var(--color-danger)]'
                : '';
              return (
                <tr key={r.key} className="border-b border-[var(--color-divider)] last:border-b-0">
                  <td className="py-1.5 px-3 font-medium">{r.label}</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{r.lyShare.toFixed(0)}%</td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{r.recentShare.toFixed(0)}%</td>
                  <td className={`py-1.5 px-2 text-right tabular-nums ${toneClass}`}>
                    {r.delta > 0 ? '+' : ''}{r.delta.toFixed(0)} pp
                  </td>
                  <td className="py-1.5 px-2 text-right tabular-nums">{fmtMoneyCompact(r.recentSales, currency)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-[var(--color-text-secondary)] italic">
        Use the channel tilt to set EOM landing strategy: rising online share → more goes to DC; rising offline → push into stores earlier.
      </div>
    </div>
  );
}

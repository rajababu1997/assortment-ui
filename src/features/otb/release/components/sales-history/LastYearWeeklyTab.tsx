/**
 * LY same period · weekly. Shows weekly cells for the period one year
 * before the current Release period.
 */

import { useMemo } from 'react';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import type { BaseCurrency } from '@/features/setup/types';
import { aggregateWeekly, getWeeklyRange } from '../../data/weeklyVelocity';
import { WeeklyTable } from './WeeklyTable';
import { fmtMoneyCompact } from '@/features/otb/utils/format';

interface Props {
  brand_uuid: string;
  category_uuid: string;
  periodStartIso: string;
  periodEndIso: string;
  currency: BaseCurrency;
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function shiftYear(iso: string, years: number): string {
  const d = new Date(iso);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function LastYearWeeklyTab({
  brand_uuid, category_uuid, periodStartIso, periodEndIso, currency,
}: Props) {
  const lyStartIso = shiftYear(periodStartIso, -1);
  const lyEndIso = shiftYear(periodEndIso, -1);

  const cells = useMemo(
    () => getWeeklyRange({ brand_uuid, category_uuid, fromIso: lyStartIso, toIso: lyEndIso }),
    [brand_uuid, category_uuid, lyStartIso, lyEndIso],
  );
  const agg = useMemo(() => aggregateWeekly(cells), [cells]);

  const peakWeek = cells.reduce<typeof cells[number] | null>(
    (best, c) => (best == null || c.net_sales > best.net_sales ? c : best),
    null,
  );

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (peakWeek) {
      const d = new Date(peakWeek.start_iso);
      out.push({
        tone: 'positive',
        message: `Peak week LY: ${MONTH_LABELS[d.getMonth()]} ${d.getDate()} with ${fmtMoneyCompact(peakWeek.net_sales, currency)} (${peakWeek.units_sold.toLocaleString('en-IN')} units). Make sure stock lands before that date.`,
      });
    }
    if (agg.avg_markdown_pct >= 17) {
      out.push({ tone: 'warning', message: `LY markdown ran hot at ${agg.avg_markdown_pct.toFixed(1)}%. Don't repeat the over-buy.` });
    }
    if (agg.avg_sell_through_pct >= 82) {
      out.push({ tone: 'positive', message: `LY sell-through was ${agg.avg_sell_through_pct.toFixed(0)}% — period is structurally strong, comfortable to repeat or grow.` });
    }
    return out.slice(0, 3);
  }, [peakWeek, agg, currency]);

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[11px] text-[var(--color-text-secondary)]">
        Showing <strong>{lyStartIso}</strong> → <strong>{lyEndIso}</strong>, one year before the current release period.
      </div>
      <AiInsightPanel insights={insights} />
      <WeeklyTable cells={cells} currency={currency} />
    </div>
  );
}

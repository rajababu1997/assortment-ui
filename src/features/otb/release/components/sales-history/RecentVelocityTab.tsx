/**
 * "Recent 90 days" sub-tab. Pulls weekly cells for the brand-category
 * ending at the demo clock's today.
 */

import { useMemo } from 'react';
import { AiInsightPanel, type Insight } from '@/features/otb/components/dashboard/AiInsightPanel';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import { aggregateWeekly, getWeeklyRange, trendPct } from '../../data/weeklyVelocity';
import { WeeklyTable } from './WeeklyTable';

interface Props {
  brand_uuid: string;
  category_uuid: string;
  todayMs: number;
  currency: BaseCurrency;
}

export function RecentVelocityTab({ brand_uuid, category_uuid, todayMs, currency }: Props) {
  const cells = useMemo(() => {
    const today = new Date(todayMs);
    const start = new Date(today);
    start.setDate(start.getDate() - 90);
    return getWeeklyRange({
      brand_uuid,
      category_uuid,
      fromIso: start.toISOString().slice(0, 10),
      toIso: today.toISOString().slice(0, 10),
    });
  }, [brand_uuid, category_uuid, todayMs]);

  const agg = useMemo(() => aggregateWeekly(cells), [cells]);
  const trend = useMemo(() => trendPct(cells), [cells]);

  const insights = useMemo<Insight[]>(() => {
    const out: Insight[] = [];
    if (trend != null) {
      if (trend >= 8) {
        out.push({ tone: 'positive', message: `Velocity is heating up (+${trend.toFixed(1)}% from first half to second half). Lean in.` });
      } else if (trend <= -8) {
        out.push({ tone: 'warning', message: `Velocity is cooling (${trend.toFixed(1)}%). Don't extrapolate last year — buy smaller.` });
      } else {
        out.push({ tone: 'info', message: `Velocity is steady (${trend > 0 ? '+' : ''}${trend.toFixed(1)}%). Last year is a reasonable anchor.` });
      }
    }
    if (agg.avg_returns_pct >= 8) {
      out.push({ tone: 'warning', message: `Returns rate at ${agg.avg_returns_pct.toFixed(1)}% — net demand is lower than gross. Trim the buy.` });
    }
    if (agg.avg_markdown_pct >= 18) {
      out.push({ tone: 'warning', message: `Markdown ran at ${agg.avg_markdown_pct.toFixed(1)}% — we cleared by discounting, not by demand.` });
    }
    return out.slice(0, 3);
  }, [agg, trend]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Kpi label="Units sold (90d)" value={agg.units_sold.toLocaleString('en-IN')} />
        <Kpi label="Net sales (90d)" value={fmtMoneyCompact(agg.net_sales, currency)} />
        <Kpi label="Avg ST" value={`${agg.avg_sell_through_pct.toFixed(0)}%`} />
        <Kpi
          label="Velocity trend"
          value={trend == null ? '—' : `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`}
          tone={trend == null ? 'neutral' : trend >= 0 ? 'success' : 'danger'}
        />
      </div>
      <AiInsightPanel insights={insights} />
      <WeeklyTable cells={cells} currency={currency} />
    </div>
  );
}

function Kpi({
  label, value, tone = 'neutral',
}: { label: string; value: string; tone?: 'success' | 'danger' | 'neutral' }) {
  const toneClass =
    tone === 'success' ? 'text-[var(--color-success)]'
      : tone === 'danger' ? 'text-[var(--color-danger)]'
      : '';
  return (
    <div className="rounded border border-[var(--color-divider)] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${toneClass}`}>{value}</div>
    </div>
  );
}

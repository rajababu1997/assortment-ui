/**
 * Top-of-panel KPI strip — 4 anchor numbers for the historical lens.
 *
 * Each card pairs the headline value (last year same period) with a
 * relative reading (YoY delta or a benchmark tag).
 */

import type { BaseCurrency } from '@/features/setup/types';
import { fmtMoneyCompact } from '../../utils/format';

interface Props {
  currency: BaseCurrency;
  netSalesLY: number;
  yoyDeltaPct: number | null;
  markdownPct: number;
  sellThroughPct: number;
  grossMarginPct: number;
}

export function HistoryKpiStrip({
  currency,
  netSalesLY,
  yoyDeltaPct,
  markdownPct,
  sellThroughPct,
  grossMarginPct,
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <Kpi
        label="Last year net sales"
        value={fmtMoneyCompact(netSalesLY, currency)}
        sub={
          yoyDeltaPct == null
            ? '—'
            : `${yoyDeltaPct >= 0 ? '+' : ''}${yoyDeltaPct.toFixed(1)}% YoY`
        }
        tone={yoyDeltaPct == null ? 'neutral' : yoyDeltaPct >= 0 ? 'success' : 'danger'}
      />
      <Kpi
        label="Markdown %"
        value={`${markdownPct.toFixed(1)}%`}
        sub={markdownPct > 15 ? 'High' : markdownPct < 10 ? 'Low' : 'Normal'}
        tone={markdownPct > 15 ? 'danger' : markdownPct < 10 ? 'success' : 'neutral'}
      />
      <Kpi
        label="Sell-through"
        value={`${sellThroughPct.toFixed(0)}%`}
        sub={sellThroughPct >= 80 ? 'Strong' : sellThroughPct < 65 ? 'Weak' : 'OK'}
        tone={sellThroughPct >= 80 ? 'success' : sellThroughPct < 65 ? 'danger' : 'neutral'}
      />
      <Kpi
        label="Gross margin"
        value={`${grossMarginPct.toFixed(1)}%`}
        sub={grossMarginPct >= 35 ? 'Healthy' : grossMarginPct < 28 ? 'Thin' : 'OK'}
        tone={grossMarginPct >= 35 ? 'success' : grossMarginPct < 28 ? 'danger' : 'neutral'}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: 'success' | 'danger' | 'neutral';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--color-success)]'
      : tone === 'danger'
        ? 'text-[var(--color-danger)]'
        : 'text-[var(--color-text-secondary)]';
  return (
    <div className="rounded border border-[var(--color-divider)] p-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
        {label}
      </div>
      <div className="text-sm font-semibold mt-0.5">{value}</div>
      <div className={`text-[11px] mt-0.5 ${toneClass}`}>{sub}</div>
    </div>
  );
}

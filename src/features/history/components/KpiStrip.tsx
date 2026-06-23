/**
 * Compare-vs-anchor KPI strip. Anchor = the period the planner is
 * working on; compare = whichever historical window the chrome picked.
 */

import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { PeriodAggregate } from '../mock/dataset';

interface Props {
  currency: BaseCurrency;
  compare: PeriodAggregate;
  compareLabel: string;
  yoyDeltaPct: number | null;
}

export function KpiStrip({ currency, compare, compareLabel, yoyDeltaPct }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      <Kpi
        label={`Net sales · ${compareLabel}`}
        value={fmtMoneyCompact(compare.net_sales, currency)}
        sub={yoyDeltaPct == null ? '—' : `${yoyDeltaPct >= 0 ? '+' : ''}${yoyDeltaPct.toFixed(1)}% YoY`}
        tone={yoyDeltaPct == null ? 'neutral' : yoyDeltaPct >= 0 ? 'success' : 'danger'}
      />
      <Kpi
        label="Units sold"
        value={compare.units_sold.toLocaleString('en-IN')}
        sub={`${compare.sample_count} samples`}
      />
      <Kpi
        label="Sell-through"
        value={`${compare.sell_through_pct.toFixed(0)}%`}
        sub={compare.sell_through_pct >= 80 ? 'Strong' : compare.sell_through_pct < 65 ? 'Weak' : 'OK'}
        tone={compare.sell_through_pct >= 80 ? 'success' : compare.sell_through_pct < 65 ? 'danger' : 'neutral'}
      />
      <Kpi
        label="Gross margin"
        value={`${compare.gross_margin_pct.toFixed(1)}%`}
        sub={compare.gross_margin_pct >= 35 ? 'Healthy' : compare.gross_margin_pct < 28 ? 'Thin' : 'OK'}
        tone={compare.gross_margin_pct >= 35 ? 'success' : compare.gross_margin_pct < 28 ? 'danger' : 'neutral'}
      />
      <Kpi
        label="Markdown"
        value={`${compare.markdown_pct.toFixed(1)}%`}
        sub={compare.markdown_pct > 15 ? 'High' : compare.markdown_pct < 10 ? 'Low' : 'Normal'}
        tone={compare.markdown_pct > 15 ? 'danger' : compare.markdown_pct < 10 ? 'success' : 'neutral'}
      />
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub: string;
  tone?: 'success' | 'danger' | 'neutral';
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
      <div className="text-base font-semibold mt-0.5">{value}</div>
      <div className={`text-[11px] mt-0.5 ${toneClass}`}>{sub}</div>
    </div>
  );
}

/**
 * 8 headline KPIs — the first thing anyone opening the dashboard sees.
 *
 * Each tile = current value + sparkline of the last N months for that
 * metric. Polarity is encoded per metric so a "good" sparkline tone is
 * emerald and a "bad" trend is rose.
 */

import { useMemo } from 'react';
import { useSalesAggregate, useSalesKpi, useSalesMonthly } from '@/features/sales/useSales';
import {
  fmtMoneyCompact,
  fmtPct,
  fmtUnits,
  type DeltaPolarity,
} from '../format';
import { computeSeasonStr } from '../strUtils';
import { type DashboardFilters } from '../useDashboardFilters';

export function KpiStrip({ filters }: { filters: DashboardFilters }) {
  const filterArgs = useMemo(() => ({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  }), [filters]);

  const kpi = useSalesKpi(filterArgs);
  const monthly = useSalesMonthly(filterArgs);
  // Pull aggregate rows so STR can be recomputed correctly across the
  // multi-period range — the backend's strPct sums EOM across months which
  // collapses the headline towards 50%. See strUtils.ts.
  const aggregate = useSalesAggregate(filterArgs);

  const cur = kpi.data;
  const seasonStr = useMemo(
    () => computeSeasonStr(aggregate.data ?? []),
    [aggregate.data],
  );

  return (
    <section
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7"
    >
      <KpiTile
        label="Net Sales"
        value={cur ? fmtMoneyCompact(cur.netSalesValue) : '—'}
        polarity="higher-better"
        spark={monthly.data?.map((m) => m.netSalesValue) ?? []}
        loading={kpi.isLoading}
      />
      <KpiTile
        label="Units"
        value={cur ? fmtUnits(cur.netSalesUnits) : '—'}
        polarity="higher-better"
        spark={monthly.data?.map((m) => m.netSalesUnits) ?? []}
        loading={kpi.isLoading}
      />
      <KpiTile
        label="Gross Margin"
        value={cur ? fmtPct(cur.gpPct) : '—'}
        polarity="higher-better"
        spark={monthly.data?.map((m) => m.gpPct) ?? []}
        loading={kpi.isLoading}
      />
      <KpiTile
        label="Sell-through"
        value={cur ? fmtPct(seasonStr) : '—'}
        polarity="higher-better"
        spark={[]}
        loading={kpi.isLoading || aggregate.isLoading}
      />
      <KpiTile
        label="Markdown"
        value={cur ? fmtPct(cur.markdownPct) : '—'}
        polarity="lower-better"
        spark={monthly.data?.map((m) => m.markdownPct) ?? []}
        loading={kpi.isLoading}
      />
      <KpiTile
        label="Returns"
        value={cur ? fmtPct(cur.returnsPct) : '—'}
        polarity="lower-better"
        spark={[]}
        loading={kpi.isLoading}
      />
      <KpiTile
        label="Stockout days"
        value={cur ? `${cur.stockoutDaysTotal}` : '—'}
        polarity="lower-better"
        spark={[]}
        loading={kpi.isLoading}
      />
    </section>
  );
}

// ── Single tile ────────────────────────────────────────────────────────────

interface KpiTileProps {
  label: string;
  value: string;
  polarity: DeltaPolarity;
  spark: number[];
  loading?: boolean;
}

function KpiTile({ label, value, polarity, spark, loading }: KpiTileProps) {
  const tone = sparkTone(spark, polarity);
  return (
    <div
      className="flex flex-col gap-1 rounded-lg border px-3 py-2.5"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
      }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-[0.10em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </div>
      <div
        className="text-[20px] font-semibold leading-tight tabular-nums"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {loading ? <span style={{ opacity: 0.4 }}>—</span> : value}
      </div>
      <Sparkline values={spark} tone={tone} />
    </div>
  );
}

// Decide sparkline colour from its first→last direction + metric polarity.
function sparkTone(values: number[], polarity: DeltaPolarity): 'good' | 'bad' | 'neutral' {
  if (values.length < 2 || polarity === 'neutral') return 'neutral';
  const delta = values[values.length - 1] - values[0];
  if (Math.abs(delta) < 0.0001) return 'neutral';
  const up = delta > 0;
  if (polarity === 'higher-better') return up ? 'good' : 'bad';
  return up ? 'bad' : 'good';
}

// ── Tiny SVG sparkline (no library) ─────────────────────────────────────────

function Sparkline({ values, tone }: { values: number[]; tone: 'good' | 'bad' | 'neutral' }) {
  if (values.length < 2) {
    return <div style={{ height: 18 }} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 18;
  const stepX = w / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * stepX).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`)
    .join(' ');
  const stroke = tone === 'good' ? '#15803d' : tone === 'bad' ? '#b91c1c' : 'var(--color-primary)';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: h }}>
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

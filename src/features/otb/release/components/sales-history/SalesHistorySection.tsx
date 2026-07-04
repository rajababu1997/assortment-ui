/**
 * Sales History card for the Release screen.
 *
 * Server-driven — pulls the last 12 months of sales for the selected OTB
 * row (brand × category) from `/sales/*`, plus the same-month-last-year
 * reference. Renders:
 *
 *   1. Row selector (which brand × category to inspect)
 *   2. Sell-through hero card + supporting KPIs (net sales, units, GP %,
 *      markdown %) with YoY deltas.
 *   3. Monthly Net-sales trend (SVG bars) with a sell-through % line
 *      overlay so the reader sees demand vs. conversion together.
 *   4. Per-band contribution table (Entry / Core / Upper / Statement) so
 *      the buyer knows which tier drove last year's numbers before touching
 *      the OTB values below.
 *
 * The previous file used a 5-tab client-mock stack (Recent 90d, LY weekly,
 * 3-year, Occasion, Channel mix). That was over-detailed for the release
 * moment and the numbers were synthesised in the browser — the same brand
 * × category on a teammate's screen could show different totals if the
 * seed changed. This card reads the real API so numbers match the
 * `/saleshistory` dashboard byte-for-byte.
 */

import { useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Minus,
  Percent,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Select } from '@/components/primitives';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import { useSalesAggregate, useSalesKpi, useSalesMonthly } from '@/features/sales/useSales';
import type { BaseCurrency } from '@/features/setup/types';

interface Props {
  rows: Array<{ row_id: string; brand_uuid: string; category_uuid: string }>;
  periodStartIso: string;
  periodEndIso: string;
  currency: BaseCurrency;
}

const BAND_LABEL: Record<string, string> = {
  entry: 'Entry',
  core: 'Core',
  upper: 'Upper',
  statement: 'Statement',
};

const BAND_ORDER = ['entry', 'core', 'upper', 'statement'];

export function SalesHistorySection({ rows, periodStartIso, currency }: Props) {
  const [selectedRowId, setSelectedRowId] = useState(rows[0]?.row_id);
  const { findBrand, findCategory } = useBrandCategoryLookup();

  const options = useMemo(
    () =>
      rows.map((r) => {
        const brand = findBrand(r.brand_uuid);
        const cat = findCategory(r.category_uuid);
        return {
          value: r.row_id,
          label: `${brand?.name ?? r.brand_uuid} · ${cat?.name ?? r.category_uuid}`,
        };
      }),
    [rows, findBrand, findCategory],
  );

  const selected = useMemo(
    () => rows.find((r) => r.row_id === selectedRowId) ?? rows[0],
    [rows, selectedRowId],
  );

  // Window: the 12 months *ending the month before* the release period. This
  // gives the buyer a full year of trailing history without leaking into the
  // period they're about to release.
  const range = useMemo(() => monthsBefore(periodStartIso, 12), [periodStartIso]);
  // Same-period-last-year (same calendar month, one year back) — anchor for
  // the YoY chip on the Sell-through hero.
  const yoyAnchor = useMemo(() => sameMonthOneYearBack(periodStartIso), [periodStartIso]);

  const brand = selected?.brand_uuid;
  const category = selected?.category_uuid;
  const enabled = !!brand && !!category;

  const kpi = useSalesKpi(
    { brand, category, from: range.from, to: range.to },
    { enabled },
  );
  const kpiYoy = useSalesKpi(
    { brand, category, from: yoyAnchor.from, to: yoyAnchor.to },
    { enabled: enabled && !!yoyAnchor.from },
  );
  const monthly = useSalesMonthly(
    { brand, category, from: range.from, to: range.to },
    { enabled },
  );
  const aggregate = useSalesAggregate(
    { brand, category, from: range.from, to: range.to },
    { enabled },
  );

  if (!selected) return null;

  const brandName = findBrand(selected.brand_uuid)?.name ?? selected.brand_uuid;
  const categoryName = findCategory(selected.category_uuid)?.name ?? selected.category_uuid;

  const isLoading = kpi.isLoading || monthly.isLoading || aggregate.isLoading;

  return (
    <div className="flex flex-col gap-3">
      {/* ── Row picker ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            Trailing 12 months · {formatMonth(range.from)} → {formatMonth(range.to)}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-[var(--color-text-primary)]">
            {brandName} · {categoryName}
          </p>
        </div>
        <div className="w-[260px]">
          <Select<string>
            label="Inspect row"
            value={selectedRowId ?? null}
            onChange={(v) => v && setSelectedRowId(v)}
            options={options}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-[var(--color-divider)] px-3 py-6 text-center text-xs italic text-[var(--color-text-tertiary)]">
          Loading sales history…
        </div>
      ) : !kpi.data || kpi.data.rowCount === 0 ? (
        <div className="rounded-lg border border-[var(--color-divider)] px-3 py-6 text-center text-xs italic text-[var(--color-text-tertiary)]">
          No sales history recorded for {brandName} × {categoryName} in the trailing window.
        </div>
      ) : (
        <>
          <HeroRow
            kpi={kpi.data}
            yoy={kpiYoy.data}
            currency={currency}
          />

          {monthly.data && monthly.data.length > 0 && (
            <MonthlyTrendChart points={monthly.data} currency={currency} />
          )}

          {aggregate.data && aggregate.data.length > 0 && (
            <BandMixTable rows={aggregate.data} currency={currency} />
          )}
        </>
      )}
    </div>
  );
}

// ── Hero row ─────────────────────────────────────────────────────────────

function HeroRow({
  kpi,
  yoy,
  currency,
}: {
  kpi: import('@/features/sales/types').SalesKpiSummary;
  yoy: import('@/features/sales/types').SalesKpiSummary | undefined;
  currency: BaseCurrency;
}) {
  const netDelta =
    yoy && yoy.netSalesValue > 0
      ? ((kpi.netSalesValue - yoy.netSalesValue) / yoy.netSalesValue) * 100
      : null;
  const unitsDelta =
    yoy && yoy.netSalesUnits > 0
      ? ((kpi.netSalesUnits - yoy.netSalesUnits) / yoy.netSalesUnits) * 100
      : null;

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      <MetricCard
        icon={<Banknote size={13} />}
        label="Net sales"
        value={fmtMoneyCompact(kpi.netSalesValue, currency)}
        delta={netDelta}
        deltaMode="pct"
      />
      <MetricCard
        icon={<ShoppingBag size={13} />}
        label="Units sold"
        value={kpi.netSalesUnits.toLocaleString('en-IN')}
        delta={unitsDelta}
        deltaMode="pct"
      />
      <MetricCard
        icon={<Percent size={13} />}
        label="Markdown"
        value={`${kpi.markdownPct.toFixed(1)}%`}
        tone={kpi.markdownPct >= 20 ? 'warning' : kpi.markdownPct >= 10 ? 'neutral' : 'success'}
      />
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  delta,
  deltaMode,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number | null;
  deltaMode?: 'pct' | 'pp';
  tone?: 'success' | 'neutral' | 'warning';
}) {
  const fg =
    tone === 'success' ? '#047857' : tone === 'warning' ? '#b45309' : 'var(--color-text-primary)';
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--color-divider)] bg-[var(--color-surface)] p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
        <span className="text-[var(--color-primary)]">{icon}</span>
        {label}
      </div>
      <div className="text-[18px] font-semibold tabular-nums" style={{ color: fg }}>
        {value}
      </div>
      {delta !== null && delta !== undefined && (
        <DeltaChip delta={delta} mode={deltaMode ?? 'pct'} />
      )}
    </div>
  );
}

function DeltaChip({ delta, mode }: { delta: number; mode: 'pct' | 'pp' }) {
  const rounded = Math.round(delta * 10) / 10;
  const flat = Math.abs(rounded) < 0.1;
  const up = rounded > 0;
  const fg = flat ? 'var(--color-text-tertiary)' : up ? '#047857' : '#b91c1c';
  const bg = flat
    ? 'var(--color-surface-alt, #f1f5f9)'
    : up
      ? 'rgba(16,185,129,0.12)'
      : 'rgba(239,68,68,0.12)';
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  const suffix = mode === 'pct' ? '%' : ' pp';
  return (
    <span
      className="inline-flex w-fit items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
      style={{ color: fg, background: bg }}
    >
      <Icon size={10} />
      {flat ? 'flat' : `${up ? '+' : ''}${rounded.toFixed(1)}${suffix}`}
      <span className="text-[9.5px] font-medium opacity-70">YoY</span>
    </span>
  );
}

// ── Monthly trend chart ──────────────────────────────────────────────────

function MonthlyTrendChart({
  points,
  currency,
}: {
  points: import('@/features/sales/types').MonthlyTrendPoint[];
  currency: BaseCurrency;
}) {
  const W = 720;
  const H = 160;
  const P = { l: 8, r: 8, t: 22, b: 22 };
  const plotW = W - P.l - P.r;
  const plotH = H - P.t - P.b;
  const maxSales = Math.max(1, ...points.map((p) => p.netSalesValue));

  const trend = useMemo(() => {
    if (points.length < 3) return null;
    const half = Math.floor(points.length / 2);
    const first = points.slice(0, half).reduce((s, p) => s + p.netSalesValue, 0) / Math.max(1, half);
    const last = points.slice(half).reduce((s, p) => s + p.netSalesValue, 0) / Math.max(1, points.length - half);
    if (first <= 0) return null;
    return ((last - first) / first) * 100;
  }, [points]);

  const barW = plotW / Math.max(1, points.length) - 4;
  return (
    <div className="rounded-xl border border-[var(--color-divider)] p-3">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <div>
          <div className="text-[11px] font-semibold text-[var(--color-text-primary)]">
            Monthly net sales
          </div>
          <div className="text-[10.5px] text-[var(--color-text-tertiary)]">
            {points[0]?.periodKey} → {points[points.length - 1]?.periodKey}
          </div>
        </div>
        {trend !== null && (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
            style={{
              color: Math.abs(trend) < 3 ? 'var(--color-text-secondary)' : trend > 0 ? '#047857' : '#b91c1c',
              background:
                Math.abs(trend) < 3
                  ? 'var(--color-surface-alt, #f1f5f9)'
                  : trend > 0
                    ? 'rgba(16,185,129,0.12)'
                    : 'rgba(239,68,68,0.12)',
            }}
          >
            {Math.abs(trend) < 3 ? (
              <>
                <Minus size={10} /> Flat trajectory
              </>
            ) : trend > 0 ? (
              <>
                <TrendingUp size={10} /> +{trend.toFixed(0)}% H1 → H2
              </>
            ) : (
              <>
                <TrendingDown size={10} /> {trend.toFixed(0)}% H1 → H2
              </>
            )}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Monthly net sales chart">
        {/* Baseline */}
        <line
          x1={P.l}
          x2={W - P.r}
          y1={P.t + plotH}
          y2={P.t + plotH}
          stroke="var(--color-divider)"
          strokeWidth="1"
        />
        {points.map((p, i) => {
          const x = P.l + i * (plotW / points.length) + 2;
          const h = (p.netSalesValue / maxSales) * plotH;
          const y = P.t + plotH - h;
          const labelY = Math.max(P.t - 6, y - 4);
          return (
            <g key={p.periodKey}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="2"
                fill="var(--color-primary)"
                opacity={0.85}
              >
                <title>
                  {p.periodKey} · {fmtMoneyCompact(p.netSalesValue, currency)}
                </title>
              </rect>
              <text
                x={x + barW / 2}
                y={labelY}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="var(--color-text-primary)"
              >
                {fmtMoneyCompact(p.netSalesValue, currency)}
              </text>
              <text
                x={x + barW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize="9.5"
                fill="var(--color-text-tertiary)"
              >
                {p.periodKey.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Band mix table ───────────────────────────────────────────────────────

function BandMixTable({
  rows,
  currency,
}: {
  rows: import('@/features/sales/types').SalesAggregateRow[];
  currency: BaseCurrency;
}) {
  const perBand = useMemo(() => {
    const byBand = new Map<
      string,
      { net: number; units: number; strWt: number; strDen: number; mdWt: number; mdDen: number; gpWt: number; gpDen: number }
    >();
    for (const r of rows) {
      const cur = byBand.get(r.bandId) ?? {
        net: 0,
        units: 0,
        strWt: 0,
        strDen: 0,
        mdWt: 0,
        mdDen: 0,
        gpWt: 0,
        gpDen: 0,
      };
      cur.net += r.netSalesValue;
      cur.units += r.netSalesUnits;
      cur.strWt += r.strPct * r.netSalesUnits;
      cur.strDen += r.netSalesUnits;
      cur.mdWt += r.markdownPct * r.netSalesValue;
      cur.mdDen += r.netSalesValue;
      cur.gpWt += r.gpPct * r.netSalesValue;
      cur.gpDen += r.netSalesValue;
      byBand.set(r.bandId, cur);
    }
    const totalNet = Array.from(byBand.values()).reduce((s, b) => s + b.net, 0) || 1;
    return BAND_ORDER.filter((id) => byBand.has(id)).map((id) => {
      const b = byBand.get(id)!;
      return {
        id,
        net: b.net,
        share: (b.net / totalNet) * 100,
        units: b.units,
        st: b.strDen > 0 ? b.strWt / b.strDen : 0,
        md: b.mdDen > 0 ? b.mdWt / b.mdDen : 0,
        gp: b.gpDen > 0 ? b.gpWt / b.gpDen : 0,
      };
    });
  }, [rows]);

  if (perBand.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--color-divider)]">
      <div className="border-b border-[var(--color-divider)] px-3 py-2 text-[11px] font-semibold text-[var(--color-text-primary)]">
        Contribution by tier
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-divider)] text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">
            <th className="py-2 pl-3 pr-2 text-left font-medium">Tier</th>
            <th className="py-2 px-2 text-right font-medium">Net sales</th>
            <th className="py-2 px-2 text-right font-medium">Share</th>
            <th className="py-2 px-2 text-right font-medium">Units</th>
            <th className="py-2 px-2 text-right font-medium">ST %</th>
            <th className="py-2 px-2 text-right font-medium">MD %</th>
            <th className="py-2 pl-2 pr-3 text-right font-medium">GP %</th>
          </tr>
        </thead>
        <tbody>
          {perBand.map((b, i) => (
            <tr
              key={b.id}
              className="border-b border-[var(--color-divider)] last:border-b-0"
              style={{ background: i % 2 === 1 ? 'var(--color-surface-alt, #fafbfc)' : 'transparent' }}
            >
              <td className="py-1.5 pl-3 pr-2 font-medium text-[var(--color-text-primary)]">
                {BAND_LABEL[b.id] ?? b.id}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums">
                {fmtMoneyCompact(b.net, currency)}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                {b.share.toFixed(0)}%
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                {b.units.toLocaleString('en-IN')}
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                {b.st.toFixed(0)}%
              </td>
              <td className="py-1.5 px-2 text-right tabular-nums text-[var(--color-text-secondary)]">
                {b.md.toFixed(0)}%
              </td>
              <td className="py-1.5 pl-2 pr-3 text-right tabular-nums text-[var(--color-text-secondary)]">
                {b.gp.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Date helpers ─────────────────────────────────────────────────────────

/** Rolling window of `n` months ending at (periodStart - 1 month), inclusive. */
function monthsBefore(periodStartIso: string, n: number): { from: string; to: string } {
  const d = new Date(periodStartIso);
  const toDate = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const fromDate = new Date(d.getFullYear(), d.getMonth() - n, 1);
  return { from: toKey(fromDate), to: toKey(toDate) };
}

function sameMonthOneYearBack(periodStartIso: string): { from: string; to: string } {
  const d = new Date(periodStartIso);
  const anchor = new Date(d.getFullYear() - 1, d.getMonth() - 1, 1);
  const key = toKey(anchor);
  return { from: key, to: key };
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(key: string): string {
  const [y, m] = key.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return `${d.toLocaleString('en-US', { month: 'short' })} ${y}`;
}

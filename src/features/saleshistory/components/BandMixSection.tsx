/**
 * Band mix donut + per-band stat strip.
 *
 * The donut answers "where is the money coming from across price bands?".
 * The right-hand strip drills into each band's quality — STR / GM / MD —
 * so the buyer can spot e.g. "Statement is 12% of revenue but 22% MD".
 */

import { useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtPct, fmtUnits } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

type BandKey = 'entry' | 'core' | 'upper' | 'statement';
const BAND_ORDER: BandKey[] = ['entry', 'core', 'upper', 'statement'];
const BAND_LABEL: Record<BandKey, string> = {
  entry: 'Entry',
  core: 'Core',
  upper: 'Upper',
  statement: 'Statement',
};
const BAND_COLOR: Record<BandKey, string> = {
  entry:     '#22d3ee',  // cyan — accessible, value
  core:      '#0ea5e9',  // sky — workhorse
  upper:     '#6366f1',  // indigo — aspirational
  statement: '#a855f7',  // purple — premium
};

interface BandSummary {
  bandId: BandKey;
  netSalesValue: number;
  netSalesUnits: number;
  gpPct: number;
  markdownPct: number;
  strPct: number;
  sharePct: number;
  /** Lowest avgMrp seen across rows in this band — entry-point of the price ladder. */
  mrpMin: number;
  /** Highest avgMrp seen — ceiling. Together they give the band's MRP range. */
  mrpMax: number;
}

export function BandMixSection({ filters }: { filters: DashboardFilters }) {
  const [hovered, setHovered] = useState<BandKey | null>(null);

  const { data: rows = [], isLoading } = useSalesAggregate({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });

  const summaries = useMemo(() => aggregateByBand(rows), [rows]);
  const totalValue = summaries.reduce((a, b) => a + b.netSalesValue, 0);

  return (
    <section
      className="flex flex-col rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <Layers size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Band mix
          </h3>
          <SectionInfoButton title="Band mix">
            <p>Revenue distribution across the four <strong>price bands</strong> — <em>Entry → Core → Upper → Statement</em>.</p>
            <p className="mt-2">
              The donut shows each band's share of <strong>Net Sales</strong>. The strip on the right adds per-band detail.
              Hover any slice to highlight its row.
            </p>
            <p className="mt-3"><strong>Each band row shows:</strong></p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li><strong>MRP range</strong> — the lowest and highest MRP across products selling in this band.</li>
              <li><strong>Net Sales</strong> and <strong>Share %</strong> of the period total.</li>
              <li><strong>GM%</strong> — Gross Margin: profit after cost of goods, as a percentage of Net Sales.</li>
              <li><strong>MD%</strong> — Markdown depth: discount given away, as a percentage of Gross Sales.</li>
              <li><strong>STR%</strong> — Sell-Through: units sold ÷ (units sold + units still on the shelf at period end).</li>
            </ul>
            <p className="mt-3">All filters apply.</p>
          </SectionInfoButton>
        </div>
        <div className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          Net sales share across price bands
        </div>
      </header>

      {isLoading || totalValue === 0 ? (
        <EmptyState loading={isLoading} />
      ) : (
        <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[300px_1fr]">
          <Donut
            summaries={summaries}
            total={totalValue}
            hovered={hovered}
            onHover={setHovered}
          />
          <BandStatGrid
            summaries={summaries}
            hovered={hovered}
            onHover={setHovered}
          />
        </div>
      )}
    </section>
  );
}

// ── Donut ──────────────────────────────────────────────────────────────────

function Donut({
  summaries,
  total,
  hovered,
  onHover,
}: {
  summaries: BandSummary[];
  total: number;
  hovered: BandKey | null;
  onHover: (b: BandKey | null) => void;
}) {
  const size = 280;
  const r = 112;
  const rInner = 78;
  const cx = size / 2;
  const cy = size / 2;

  let cumPct = 0;
  const arcs = summaries.map((s) => {
    const start = cumPct;
    cumPct += s.sharePct;
    return { ...s, start, end: cumPct };
  });

  return (
    <div className="flex flex-col items-center justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
        {arcs.map((a) => {
          const isHovered = hovered === a.bandId;
          return (
            <path
              key={a.bandId}
              d={annularSliceD(cx, cy, r, rInner, a.start, a.end)}
              fill={BAND_COLOR[a.bandId]}
              opacity={hovered && !isHovered ? 0.35 : 1}
              stroke="var(--color-surface)"
              strokeWidth={1.5}
              style={{ cursor: 'pointer', transition: 'opacity 120ms' }}
              onMouseEnter={() => onHover(a.bandId)}
              onMouseLeave={() => onHover(null)}
            >
              <title>{BAND_LABEL[a.bandId]} · {fmtPct(a.sharePct)} · {fmtMoneyCompact(a.netSalesValue)}</title>
            </path>
          );
        })}
        {/* Center label */}
        <text
          x={cx} y={cy - 8}
          fontSize={11}
          textAnchor="middle"
          fill="var(--color-text-tertiary)"
          style={{ textTransform: 'uppercase', letterSpacing: '0.10em' }}
        >
          Total
        </text>
        <text
          x={cx} y={cy + 12}
          fontSize={14}
          fontWeight={600}
          textAnchor="middle"
          fill="var(--color-text-primary)"
          fontFamily="inherit"
        >
          {fmtMoneyCompact(total)}
        </text>
      </svg>
    </div>
  );
}

// ── Stat grid — one row per band ───────────────────────────────────────────

function BandStatGrid({
  summaries,
  hovered,
  onHover,
}: {
  summaries: BandSummary[];
  hovered: BandKey | null;
  onHover: (b: BandKey | null) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Column headers */}
      <div
        className="grid grid-cols-[120px_repeat(5,minmax(0,1fr))] items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <div>Band</div>
        <div className="text-right">Net Sales</div>
        <div className="text-right">Share</div>
        <div className="text-right">GM%</div>
        <div className="text-right">MD%</div>
        <div className="text-right">STR%</div>
      </div>
      {summaries.map((s) => {
        const isHovered = hovered === s.bandId;
        const dim = hovered && !isHovered;
        return (
          <div
            key={s.bandId}
            className="grid grid-cols-[120px_repeat(5,minmax(0,1fr))] items-center gap-2 rounded-md border px-2 py-1.5"
            style={{
              borderColor: isHovered ? BAND_COLOR[s.bandId] : 'var(--color-divider)',
              background: isHovered ? `${BAND_COLOR[s.bandId]}10` : 'transparent',
              opacity: dim ? 0.6 : 1,
              transition: 'background 120ms, border-color 120ms, opacity 120ms',
            }}
            onMouseEnter={() => onHover(s.bandId)}
            onMouseLeave={() => onHover(null)}
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 10, height: 10, borderRadius: 3,
                  background: BAND_COLOR[s.bandId],
                  flexShrink: 0,
                }}
              />
              <div className="min-w-0">
                <div
                  className="truncate text-[12px] font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {BAND_LABEL[s.bandId]}
                </div>
                <div
                  className="text-[10px] tabular-nums"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  MRP {s.mrpMin > 0 ? `${fmtMrp(s.mrpMin)}–${fmtMrp(s.mrpMax)}` : '—'} · {fmtUnits(s.netSalesUnits)} u
                </div>
              </div>
            </div>
            <div className="text-right text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {fmtMoneyCompact(s.netSalesValue)}
            </div>
            <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              {fmtPct(s.sharePct)}
            </div>
            <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: '#15803d' }}>
              {fmtPct(s.gpPct)}
            </div>
            <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: '#b91c1c' }}>
              {fmtPct(s.markdownPct)}
            </div>
            <div className="text-right text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
              {fmtPct(s.strPct)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div
      className="flex h-[200px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {loading ? 'Loading band mix…' : 'No sales in this slice.'}
    </div>
  );
}

// ── Aggregation ────────────────────────────────────────────────────────────

function aggregateByBand(rows: SalesAggregateRow[]): BandSummary[] {
  // Sum the value-based fields per band, then derive ratios from the sums
  // (a proper weighted average — not the wrong "mean of row pcts").
  const totals = new Map<BandKey, {
    netSalesValue: number;
    netSalesUnits: number;
    grossSalesValue: number;
    grossSalesUnits: number;
    markdownValue: number;
    gpValue: number;
    mrpMin: number;
    mrpMax: number;
  }>();

  // STR needs the LAST period's EOM per (brand × cat × band) slice — see
  // strUtils.ts for the why. Track latest-period row per slice here so the
  // band-level STR rolls up correctly.
  const lastEomBySlice = new Map<string, { band: BandKey; eom: number }>();
  const lastPeriodBySlice = new Map<string, string>();

  for (const r of rows) {
    const band = r.bandId as BandKey;
    if (!BAND_ORDER.includes(band)) continue;
    const cur = totals.get(band) ?? {
      netSalesValue: 0, netSalesUnits: 0,
      grossSalesValue: 0, grossSalesUnits: 0,
      markdownValue: 0, gpValue: 0,
      mrpMin: Infinity, mrpMax: 0,
    };
    cur.netSalesValue += r.netSalesValue;
    cur.netSalesUnits += r.netSalesUnits;
    cur.grossSalesValue += r.grossSalesValue;
    cur.grossSalesUnits += r.grossSalesUnits;
    cur.markdownValue += r.markdownValue;
    cur.gpValue += r.gpValue;
    if (r.avgMrp > 0) {
      if (r.avgMrp < cur.mrpMin) cur.mrpMin = r.avgMrp;
      if (r.avgMrp > cur.mrpMax) cur.mrpMax = r.avgMrp;
    }
    totals.set(band, cur);

    const sliceKey = `${r.brandUuid}|${r.categoryUuid}|${r.bandId}`;
    const lp = lastPeriodBySlice.get(sliceKey);
    if (!lp || r.periodKey > lp) {
      lastPeriodBySlice.set(sliceKey, r.periodKey);
      lastEomBySlice.set(sliceKey, { band, eom: r.eomUnits });
    }
  }

  // Sum last-period EOMs into each band so we can compute the season STR.
  const lastEomByBand = new Map<BandKey, number>();
  for (const { band, eom } of lastEomBySlice.values()) {
    lastEomByBand.set(band, (lastEomByBand.get(band) ?? 0) + eom);
  }

  const totalNet = Array.from(totals.values()).reduce((a, b) => a + b.netSalesValue, 0) || 1;

  return BAND_ORDER.map((band) => {
    const t = totals.get(band) ?? {
      netSalesValue: 0, netSalesUnits: 0,
      grossSalesValue: 0, grossSalesUnits: 0,
      markdownValue: 0, gpValue: 0,
      mrpMin: 0, mrpMax: 0,
    };
    const lastEom = lastEomByBand.get(band) ?? 0;
    return {
      bandId: band,
      netSalesValue: t.netSalesValue,
      netSalesUnits: t.netSalesUnits,
      gpPct: t.netSalesValue > 0 ? (t.gpValue / t.netSalesValue) * 100 : 0,
      markdownPct: t.grossSalesValue > 0 ? (t.markdownValue / t.grossSalesValue) * 100 : 0,
      strPct:
        t.grossSalesUnits + lastEom > 0
          ? (t.grossSalesUnits / (t.grossSalesUnits + lastEom)) * 100
          : 0,
      sharePct: (t.netSalesValue / totalNet) * 100,
      mrpMin: Number.isFinite(t.mrpMin) ? t.mrpMin : 0,
      mrpMax: t.mrpMax,
    };
  });
}

// Compact rupee for MRP labels — "₹500", "₹1.2K", "₹12K".
function fmtMrp(value: number): string {
  if (value <= 0) return '—';
  if (value >= 1000) return `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;
  return `₹${Math.round(value)}`;
}

// ── SVG annular slice helper ───────────────────────────────────────────────
// Builds a donut wedge from `pctStart`..`pctEnd` (both 0..100).

function annularSliceD(
  cx: number, cy: number,
  rOuter: number, rInner: number,
  pctStart: number, pctEnd: number,
): string {
  const a0 = (pctStart / 100) * Math.PI * 2 - Math.PI / 2;
  const a1 = (pctEnd / 100) * Math.PI * 2 - Math.PI / 2;
  const largeArc = pctEnd - pctStart > 50 ? 1 : 0;
  const x0o = cx + rOuter * Math.cos(a0);
  const y0o = cy + rOuter * Math.sin(a0);
  const x1o = cx + rOuter * Math.cos(a1);
  const y1o = cy + rOuter * Math.sin(a1);
  const x0i = cx + rInner * Math.cos(a1);
  const y0i = cy + rInner * Math.sin(a1);
  const x1i = cx + rInner * Math.cos(a0);
  const y1i = cy + rInner * Math.sin(a0);
  return [
    `M ${x0o} ${y0o}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x1o} ${y1o}`,
    `L ${x0i} ${y0i}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1i} ${y1i}`,
    'Z',
  ].join(' ');
}

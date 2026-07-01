/**
 * Sales & Orders by Product Category — the "where does the money live?"
 * chart.
 *
 * Pareto-style combo:
 *   - Bars  (left axis, INR)   = net sales per category, sorted desc
 *   - Line  (right axis, count)= order count per category, same X order
 *
 * The shape (long tail line falling fast) tells the merch team how
 * concentrated the assortment is — if 80% of revenue comes from 3
 * categories, the planning effort should sit there.
 */

import { useMemo, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { useSalesAggregate } from '@/features/sales/useSales';
import { useApiCategories } from '@/features/otb/useOtbMaster';
import type { SalesAggregateRow } from '@/features/sales/types';
import { fmtMoneyCompact, fmtUnits } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import type { DashboardFilters } from '../useDashboardFilters';

const ITEMS_PER_ORDER = 1.8;
const MAX_BARS = 10;

interface NameOpt { uuid: string; name: string }
interface CatRow {
  uuid: string;
  name: string;
  sales: number;
  orders: number;
}

export function CategoryParetoSection({ filters }: { filters: DashboardFilters }) {
  const { data: rows = [], isLoading } = useSalesAggregate({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  });
  const { data: cats = [] } = useApiCategories() as { data?: NameOpt[] };

  const ranked = useMemo(() => aggregateByCategory(rows, cats), [rows, cats]);
  const shown = ranked.slice(0, MAX_BARS);

  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <LayoutGrid size={14} style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Sales &amp; Orders by Category
          </h3>
          <SectionInfoButton title="Sales & Orders by Category">
            <p>Your categories ranked by net sales — bars sorted high to low, with the order line following the same order.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Bars (left ₹ axis)</strong>: net sales for each category.</li>
              <li><strong>Line (right axis)</strong>: orders for the same category.</li>
            </ul>
            <p className="mt-3">All filters apply. Top {10} categories shown.</p>
            <p className="mt-3">
              A steep drop (the first 1–2 categories carry most revenue) means your assortment is concentrated and planning
              effort should focus there. A gentler curve means revenue is well distributed across categories.
            </p>
          </SectionInfoButton>
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 12, height: 8, borderRadius: 2, background: 'var(--color-primary)' }} />
            Sum of Amount
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ display: 'inline-block', width: 14, height: 2, background: '#f97316', borderRadius: 1 }} />
            Count of Orders
          </span>
        </div>
      </header>

      {isLoading ? (
        <Empty>Loading category breakdown…</Empty>
      ) : shown.length === 0 ? (
        <Empty>No category data in this period.</Empty>
      ) : (
        <div className="px-2 py-3">
          <ParetoCanvas rows={shown} />
        </div>
      )}
    </section>
  );
}

// ── Canvas ─────────────────────────────────────────────────────────────────

function ParetoCanvas({ rows }: { rows: CatRow[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const W = 1000;
  const H = 340;
  const padL = 56;
  const padR = 56;
  const padT = 16;
  const padB = 76;          // room for diagonal category labels
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const N = rows.length;
  const slotW = plotW / Math.max(1, N);
  const barW = Math.max(10, slotW * 0.62);

  const salesMax = Math.max(1, ...rows.map((r) => r.sales));
  const ordersMax = Math.max(1, ...rows.map((r) => r.orders));
  const ySales = (v: number) => padT + plotH - (v / salesMax) * plotH;
  const yOrders = (v: number) => padT + plotH - (v / ordersMax) * plotH;
  const xCenter = (i: number) => padL + slotW * (i + 0.5);

  const ticks = 4;
  const salesTicks = Array.from({ length: ticks + 1 }, (_, i) => (salesMax * i) / ticks);
  const ordersTicks = Array.from({ length: ticks + 1 }, (_, i) => (ordersMax * i) / ticks);

  const linePts = rows.map((r, i) => `${xCenter(i)},${yOrders(r.orders)}`).join(' ');

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const viewBoxX = (xPx / rect.width) * W;
    if (viewBoxX < padL || viewBoxX > W - padR) { setHoveredIdx(null); return; }
    const idx = Math.floor((viewBoxX - padL) / slotW);
    setHoveredIdx(Math.max(0, Math.min(N - 1, idx)));
  };

  const hovered = hoveredIdx !== null ? rows[hoveredIdx] : null;
  const tooltipXPercent = hoveredIdx !== null ? (xCenter(hoveredIdx) / W) * 100 : 0;

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: H, display: 'block' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {salesTicks.map((v, i) => (
          <g key={`sl-${i}`}>
            <line
              x1={padL} x2={W - padR}
              y1={ySales(v)} y2={ySales(v)}
              stroke="var(--color-divider)" strokeWidth={0.6}
            />
            <text
              x={padL - 6} y={ySales(v) + 4}
              textAnchor="end" fontSize={12}
              fill="var(--color-text-tertiary)"
            >
              {fmtTick(v)}
            </text>
          </g>
        ))}
        {ordersTicks.map((v, i) => (
          <text
            key={`or-${i}`}
            x={W - padR + 6} y={yOrders(v) + 4}
            textAnchor="start" fontSize={12}
            fill="#c2410c"
          >
            {fmtCountTick(v)}
          </text>
        ))}

        {/* Bars */}
        {rows.map((r, i) => {
          const h = padT + plotH - ySales(r.sales);
          return (
            <rect
              key={r.uuid}
              x={xCenter(i) - barW / 2}
              y={ySales(r.sales)}
              width={barW}
              height={Math.max(0, h)}
              fill="url(#catBarGrad)"
              rx={2}
            />
          );
        })}
        <defs>
          <linearGradient id="catBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2176ff" />
          </linearGradient>
        </defs>

        {/* Line */}
        <polyline
          points={linePts}
          fill="none"
          stroke="#f97316"
          strokeWidth={2.2}
          strokeLinejoin="round"
          pointerEvents="none"
        />
        {rows.map((r, i) => (
          <circle
            key={`pt-${r.uuid}`}
            cx={xCenter(i)} cy={yOrders(r.orders)}
            r={3} fill="#f97316"
            pointerEvents="none"
          />
        ))}

        {/* Hover crosshair */}
        {hoveredIdx !== null && (
          <line
            x1={xCenter(hoveredIdx)} x2={xCenter(hoveredIdx)}
            y1={padT} y2={padT + plotH}
            stroke="var(--color-text-tertiary)" strokeWidth={1}
            strokeDasharray="3,3" opacity={0.6}
            pointerEvents="none"
          />
        )}

        {/* Category labels — rotated to fit longer names */}
        {rows.map((r, i) => (
          <text
            key={`xl-${r.uuid}`}
            x={xCenter(i)} y={padT + plotH + 14}
            fontSize={11}
            fill="var(--color-text-tertiary)"
            textAnchor="end"
            transform={`rotate(-30 ${xCenter(i)} ${padT + plotH + 14})`}
            pointerEvents="none"
          >
            {r.name}
          </text>
        ))}
      </svg>

      {hovered && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border shadow-md"
          style={{
            left: `${tooltipXPercent}%`,
            top: 8,
            background: 'var(--color-surface)',
            borderColor: 'var(--color-divider)',
            minWidth: 200,
          }}
        >
          <div className="px-3 py-1.5">
            <div
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {hovered.name}
            </div>
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2 text-[12px] tabular-nums">
                <span style={{ color: 'var(--color-primary)' }}>● Sum of Amount</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {fmtMoneyCompact(hovered.sales)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[12px] tabular-nums">
                <span style={{ color: '#f97316' }}>● Count of Orders</span>
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {fmtUnits(hovered.orders)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex h-[240px] items-center justify-center text-[12px]"
      style={{ color: 'var(--color-text-tertiary)' }}
    >
      {children}
    </div>
  );
}

function aggregateByCategory(rows: SalesAggregateRow[], cats: NameOpt[]): CatRow[] {
  const tot = new Map<string, { sales: number; units: number }>();
  for (const r of rows) {
    const cur = tot.get(r.categoryUuid) ?? { sales: 0, units: 0 };
    cur.sales += r.netSalesValue;
    cur.units += r.netSalesUnits;
    tot.set(r.categoryUuid, cur);
  }
  const nameMap = new Map(cats.map((c) => [c.uuid, c.name]));
  return Array.from(tot.entries())
    .map(([uuid, v]) => ({
      uuid,
      name: nameMap.get(uuid) ?? uuid.slice(0, 8),
      sales: v.sales,
      orders: Math.round(v.units / ITEMS_PER_ORDER),
    }))
    .sort((a, b) => b.sales - a.sales);
}

function fmtTick(v: number): string {
  if (v >= 1_00_00_000) return `₹${Math.round(v / 1_00_00_000)} Cr`;
  if (v >= 1_00_000)    return `₹${Math.round(v / 1_00_000)} L`;
  if (v >= 1_000)       return `₹${Math.round(v / 1_000)}K`;
  return `₹${Math.round(v)}`;
}

function fmtCountTick(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${Math.round(v / 1_000)}K`;
  return `${Math.round(v)}`;
}

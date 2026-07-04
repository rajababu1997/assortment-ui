/**
 * Monthly Orders & Sales Trend — the dashboard's main trend widget.
 *
 * Combo chart:
 *   - Bars (left Y-axis, INR) = monthly net sales
 *   - Line (right Y-axis, count) = monthly order count
 *
 * Order count is derived from `netSalesUnits / 1.8` — Indian apparel
 * basket sizes hover around 1.6–2.0 items per order, so this proxy is
 * close enough to feel real while we wait for the backend to return a
 * true `orderCount`.
 *
 * Calendar overlay (dashed verticals + bottom ribbons + colored dots)
 * stays on the same toggle as before. Hover anywhere to drop a crosshair
 * with a combined tooltip (sales + orders + any events that month).
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useSalesMonthly, useSalesCalendar } from '@/features/sales/useSales';
import type { MonthlyTrendPoint, SalesCalendarEvent } from '@/features/sales/types';
import { fmtMoneyCompact, fmtUnits, monthLabel } from '../format';
import { HEADER_BG } from './cardStyle';
import { SectionInfoButton } from './SectionInfoButton';
import { type DashboardFilters } from '../useDashboardFilters';

const EVENT_COLOR: Record<SalesCalendarEvent['category'], string> = {
  festival: '#dc2626',
  sale:     '#f59e0b',
  marriage: '#a855f7',
  season:   '#0ea5e9',
  national: '#64748b',
  school:   '#10b981',
  brand:    '#475569',
};

/** Indian apparel basket: ~1.8 items per order. Adjust here if the
 *  backend ever returns a real `orderCount` and we deprecate this proxy. */
const ITEMS_PER_ORDER = 1.8;

export function TrendChartSection({ filters }: { filters: DashboardFilters }) {
  const [collapsed, setCollapsed] = useState(false);

  const filterArgs = useMemo(() => ({
    brand: filters.brands,
    category: filters.categories,
    from: filters.from,
    to: filters.to,
  }), [filters]);

  const cur = useSalesMonthly(filterArgs);

  const years = useMemo(() => uniqueYears(filters.from, filters.to), [filters.from, filters.to]);
  const yearA = useSalesCalendar('IN', years[0]);
  const yearB = useSalesCalendar('IN', years[1]);
  const events = useMemo(() => [
    ...(yearA.data ?? []),
    ...(yearB.data ?? []),
  ], [yearA.data, yearB.data]);

  const series = useMemo(
    () => buildSeries(cur.data ?? [], filters.from, filters.to),
    [cur.data, filters.from, filters.to],
  );

  return (
    <section
      className="rounded-xl border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
      }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: HEADER_BG }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            Monthly Orders &amp; Sales Trend
            {filters.showEvents && (
              <span
                className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{ background: 'rgba(96,165,250,0.10)', color: 'var(--color-primary)' }}
              >
                <Sparkles size={10} /> events on
              </span>
            )}
          </button>
          <SectionInfoButton title="Monthly Orders & Sales Trend">
          <p>Month-by-month sales and order activity for the selected period.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><strong>Bars (left ₹ axis)</strong> — <em>Sum of Amount</em>: net sales per month.</li>
            <li><strong>Line (right axis)</strong> — <em>Count of Orders</em>: orders placed each month.</li>
          </ul>
          <p className="mt-3">All filters apply — brand, category, and date range.</p>
          <p className="mt-3">
            Toggle <strong>Calendar</strong> in the filter bar to overlay festivals, sale windows, wedding seasons and other event markers. Single-day events show as colored dots at the top of dashed verticals; multi-day events show as faint ribbons along the bottom.
          </p>
          <p className="mt-3">
            <strong>Hover anywhere</strong> on the chart to see that month's sales amount, order count, and any active calendar events.
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

      {!collapsed && (
        <div className="px-2 py-3">
          <TrendCanvas
            series={series}
            events={filters.showEvents ? events : []}
          />

          {filters.showEvents && events.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3 px-2">
              {(['festival', 'sale', 'marriage', 'season', 'national', 'school', 'brand'] as const).map((c) => (
                <span key={c} className="flex items-center gap-1.5 text-[11px]"
                  style={{ color: 'var(--color-text-tertiary)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: EVENT_COLOR[c] }} />
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ── Canvas — pure SVG combo chart ──────────────────────────────────────────

interface SeriesPoint {
  periodKey: string;
  sales: number;
  orders: number;
}

function TrendCanvas({
  series, events,
}: {
  series: SeriesPoint[];
  events: SalesCalendarEvent[];
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Layout
  const W = 1000;
  const H = 320;
  const padL = 56;            // INR labels are wider than count labels
  const padR = 56;            // room for the right-side orders axis
  const padT = 44;            // headroom for event dashed-line markers
  const padB = 56;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const N = series.length;
  const slotW = plotW / Math.max(1, N);
  const barW = Math.max(8, slotW * 0.62);

  // Y-scales — independent for sales (left, INR) and orders (right, count)
  const salesMax = Math.max(1, ...series.map((s) => s.sales));
  const ordersMax = Math.max(1, ...series.map((s) => s.orders));
  const ySales = (v: number) => padT + plotH - (v / salesMax) * plotH;
  const yOrders = (v: number) => padT + plotH - (v / ordersMax) * plotH;

  // X centres of each month slot
  const xCenter = (i: number) => padL + slotW * (i + 0.5);

  const ticks = 4;
  const salesTicks = Array.from({ length: ticks + 1 }, (_, i) => (salesMax * i) / ticks);
  const ordersTicks = Array.from({ length: ticks + 1 }, (_, i) => (ordersMax * i) / ticks);

  const linePts = series.map((s, i) => `${xCenter(i)},${yOrders(s.orders)}`).join(' ');

  // Mouse → nearest series index
  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const viewBoxX = (xPx / rect.width) * W;
    if (viewBoxX < padL || viewBoxX > W - padR) {
      setHoveredIdx(null);
      return;
    }
    const idx = Math.floor((viewBoxX - padL) / slotW);
    setHoveredIdx(Math.max(0, Math.min(N - 1, idx)));
  };

  const hovered = hoveredIdx !== null ? series[hoveredIdx] : null;
  const tooltipXPercent = hoveredIdx !== null ? (xCenter(hoveredIdx) / W) * 100 : 0;
  const hoveredEvents = hovered
    ? events.filter((e) => e.start.slice(0, 7) === hovered.periodKey)
    : [];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: H, display: 'block' }}
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {/* Gridlines + left Y labels (sales) */}
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
              fontFamily="inherit"
            >
              {fmtTick(v)}
            </text>
          </g>
        ))}

        {/* Right Y labels (orders) */}
        {ordersTicks.map((v, i) => (
          <text
            key={`or-${i}`}
            x={W - padR + 6} y={yOrders(v) + 4}
            textAnchor="start" fontSize={12}
            fill="#c2410c"
            fontFamily="inherit"
          >
            {fmtCountTick(v)}
          </text>
        ))}

        {/* Event range ribbons at the bottom */}
        {events
          .filter((e) => e.start.slice(0, 7) !== e.end.slice(0, 7))
          .map((evt) => {
            const startIdx = series.findIndex((s) => s.periodKey === evt.start.slice(0, 7));
            const endIdx = series.findIndex((s) => s.periodKey === evt.end.slice(0, 7));
            if (startIdx < 0 && endIdx < 0) return null;
            const i0 = Math.max(0, startIdx < 0 ? 0 : startIdx);
            const i1 = Math.min(N - 1, endIdx < 0 ? N - 1 : endIdx);
            return (
              <rect
                key={evt.id}
                x={xCenter(i0) - slotW / 2} y={padT + plotH - 4}
                width={(i1 - i0) * slotW + slotW} height={4}
                fill={EVENT_COLOR[evt.category]} opacity={0.28}
                rx={2}
              >
                <title>{evt.name} · {evt.start} → {evt.end}</title>
              </rect>
            );
          })}

        {/* Single-day event markers — dashed vertical + colored dot at top.
            Tooltip on hover shows the event name + date + lift. */}
        {events
          .filter((e) => e.start.slice(0, 7) === e.end.slice(0, 7) && (e.liftPercent ?? 0) >= 15)
          .map((evt) => {
            const idx = series.findIndex((s) => s.periodKey === evt.start.slice(0, 7));
            if (idx < 0) return null;
            const day = parseInt(evt.start.slice(8, 10), 10);
            const dayOffset = (day - 1) / 30;
            const x = padL + slotW * (idx + dayOffset);
            return (
              <g key={evt.id}>
                <line
                  x1={x} x2={x}
                  y1={padT} y2={padT + plotH}
                  stroke={EVENT_COLOR[evt.category]} strokeWidth={1} strokeDasharray="2,2"
                  opacity={0.5}
                />
                <circle
                  cx={x} cy={padT - 6} r={4}
                  fill={EVENT_COLOR[evt.category]}
                  stroke="var(--color-surface)" strokeWidth={1.5}
                >
                  <title>{evt.name} · {evt.start}{evt.liftPercent ? ` · +${evt.liftPercent}% lift` : ''}</title>
                </circle>
              </g>
            );
          })}

        {/* Bars — Net Sales */}
        {series.map((s, i) => {
          const h = padT + plotH - ySales(s.sales);
          return (
            <rect
              key={s.periodKey}
              x={xCenter(i) - barW / 2}
              y={ySales(s.sales)}
              width={barW}
              height={Math.max(0, h)}
              fill="url(#salesBarGrad)"
              rx={2}
            />
          );
        })}
        <defs>
          <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2176ff" />
          </linearGradient>
        </defs>

        {/* Orders line on right axis */}
        <polyline
          points={linePts}
          fill="none"
          stroke="#f97316"
          strokeWidth={2.2}
          strokeLinejoin="round"
          pointerEvents="none"
        />
        {series.map((s, i) => (
          <circle
            key={`pt-${s.periodKey}`}
            cx={xCenter(i)} cy={yOrders(s.orders)}
            r={3} fill="#f97316"
            pointerEvents="none"
          />
        ))}

        {/* Hover crosshair */}
        {hoveredIdx !== null && (
          <g pointerEvents="none">
            <line
              x1={xCenter(hoveredIdx)} x2={xCenter(hoveredIdx)}
              y1={padT} y2={padT + plotH}
              stroke="var(--color-text-tertiary)" strokeWidth={1}
              strokeDasharray="3,3" opacity={0.6}
            />
          </g>
        )}

        {/* X-axis month labels */}
        {series.map((s, i) => (
          <text
            key={`xl-${s.periodKey}`}
            x={xCenter(i)} y={padT + plotH + 20}
            fontSize={12}
            fill="var(--color-text-tertiary)"
            textAnchor="middle"
            pointerEvents="none"
          >
            {monthLabel(s.periodKey).split(' ')[0]}
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
            maxWidth: 280,
          }}
        >
          <div className="border-b px-3 py-1.5" style={{ borderColor: 'var(--color-divider)' }}>
            <div
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {monthLabel(hovered.periodKey)}
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
          {hoveredEvents.length > 0 && (
            <div className="flex flex-col gap-1 px-3 py-1.5">
              <div
                className="text-[9.5px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Events this month
              </div>
              {hoveredEvents.map((evt) => (
                <div key={evt.id} className="flex items-baseline gap-1.5">
                  <span
                    style={{
                      width: 7, height: 7, borderRadius: 2,
                      background: EVENT_COLOR[evt.category],
                      flexShrink: 0, marginTop: 4,
                    }}
                  />
                  <div className="min-w-0">
                    <div
                      className="text-[11px] font-medium leading-tight"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {evt.name}
                    </div>
                    {evt.liftPercent !== undefined && (
                      <div
                        className="text-[10px] tabular-nums"
                        style={{ color: EVENT_COLOR[evt.category], fontWeight: 600 }}
                      >
                        +{evt.liftPercent}% lift
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function buildSeries(
  cur: MonthlyTrendPoint[],
  from: string,
  to: string,
): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  const months = enumerateMonths(from, to);
  const curMap = new Map(cur.map((m) => [m.periodKey, m]));
  for (const periodKey of months) {
    const c = curMap.get(periodKey);
    const units = c?.netSalesUnits ?? 0;
    out.push({
      periodKey,
      sales: c?.netSalesValue ?? 0,
      orders: Math.round(units / ITEMS_PER_ORDER),
    });
  }
  return out;
}

function enumerateMonths(from: string, to: string): string[] {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const out: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  return out;
}

function uniqueYears(from: string, to: string): [number, number] {
  const fy = Number(from.slice(0, 4));
  const ty = Number(to.slice(0, 4));
  return [fy, ty === fy ? fy : ty];
}

function fmtTick(v: number): string {
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function fmtCountTick(v: number): string {
  return Math.round(v).toLocaleString('en-IN');
}

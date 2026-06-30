/**
 * Historical Sales Insights — category-level LY snapshot rendered above the
 * Option Allocation area in the buyer editor.
 *
 * Sections (when expanded):
 *   1. Date range picker (Go / Reset)
 *   2. Volume & Option Sell Data — KPI tiles + volume-tier breakdown
 *   3. Fabric Type / Fit / Composition performance (2-column grid)
 *   4. Top Selling Articles (full width)
 *
 * Collapsed by default — the buyer toggles it on when they want the
 * snapshot. Data is mocked; the picker scales it deterministically by the
 * range length so the buyer sees "this would be a 90-day slice" etc.
 */

import { useMemo, useState } from 'react';
import {
  Award,
  BarChart3,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Crown,
  Layers3,
  Package,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button, DatePicker } from '@/components/primitives';
import type { MrpBand } from '@/features/otb/types';

interface Props {
  categoryLabel: string;
  /** Display label only (e.g. "LY Jan 2025"). Picker controls the actual range. */
  periodLabel: string;
  /** MRP bands of the category — drives the per-band volume breakdown. */
  categoryBands: MrpBand[];
  /** Default from/to. Falls back to last calendar year if not provided. */
  defaultFrom?: Date;
  defaultTo?: Date;
}

// ── Base mock data (full-year shape) ───────────────────────────────────────

const FABRIC_BASE = [
  { name: 'Plain',   salesCr: 8.4, badge: 'best' as const },
  { name: 'Printed', salesCr: 5.2, badge: null },
  { name: 'Checks',  salesCr: 3.0, badge: null },
  { name: 'Strips',  salesCr: 1.6, badge: 'markdown' as const },
];

const FIT_BASE = [
  { name: 'Regular Fit', salesCr: 11.8, badge: 'top' as const },
  { name: 'Slim Fit',    salesCr: 6.4,  badge: null },
];

const COMPOSITION_BASE = [
  { name: '100% Cotton',    salesCr: 12.4, badge: 'best' as const },
  { name: '100% Polyester', salesCr: 5.8,  badge: null },
];

interface ArticleBase {
  code: string;
  name: string;
  fabric: string;
  fit: string;
  comp: string;
  salesL: number;
}

const TOP_ARTICLES_BASE: ArticleBase[] = [
  { code: 'ATH-001', name: 'Performance Tee', fabric: 'Plain',   fit: 'Regular Fit', comp: '100% Cotton',    salesL: 42 },
  { code: 'ATH-014', name: 'Active Tee',      fabric: 'Printed', fit: 'Regular Fit', comp: '100% Cotton',    salesL: 39 },
  { code: 'ATH-027', name: 'Runner Tee',      fabric: 'Plain',   fit: 'Regular Fit', comp: '100% Cotton',    salesL: 35 },
  { code: 'ATH-033', name: 'Training Tee',    fabric: 'Checks',  fit: 'Slim Fit',    comp: '100% Polyester', salesL: 31 },
  { code: 'ATH-040', name: 'Gym Tee',         fabric: 'Printed', fit: 'Regular Fit', comp: '100% Cotton',    salesL: 29 },
];

// Per-MRP-band volume mix. The buyer's mental model is "how did each price
// tier sell" — so we map options/volume/avg-units by band id. Percentages
// are normalised at render time across whichever bands the category has.
const PER_BAND_MOCK: Record<
  MrpBand['id'],
  { optionsPct: number; volumePct: number; avgUnits: number }
> = {
  entry:     { optionsPct: 22, volumePct: 32, avgUnits: 3200 },
  core:      { optionsPct: 38, volumePct: 44, avgUnits: 2400 },
  upper:     { optionsPct: 26, volumePct: 18, avgUnits: 1400 },
  statement: { optionsPct: 14, volumePct:  6, avgUnits:  900 },
};

const BAND_ORDER: Record<MrpBand['id'], number> = {
  entry: 0, core: 1, upper: 2, statement: 3,
};

function fmtMrpRange(b: MrpBand): string {
  const min = (b.mrp_min ?? 0).toLocaleString('en-IN');
  if (b.mrp_max == null) return `₹${min}+`;
  return `₹${min} – ₹${b.mrp_max.toLocaleString('en-IN')}`;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function defaultLyRange(): { from: Date; to: Date } {
  const today = new Date();
  const lyYear = today.getFullYear() - 1;
  return { from: new Date(lyYear, 0, 1), to: new Date(lyYear, 11, 31) };
}

function rangeDays(from: Date | null, to: Date | null): number {
  if (!from || !to) return 365;
  const ms = to.getTime() - from.getTime();
  if (ms <= 0) return 365;
  return Math.max(1, Math.round(ms / 86_400_000) + 1);
}

const fmtCr = (n: number) => `₹${n.toFixed(1)} Cr`;
const fmtL  = (n: number) => `₹${Math.round(n)} L`;
const fmtUnits = (n: number) => n.toLocaleString('en-IN');
const fmtDate = (d: Date | null) =>
  !d ? '—' : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

// ── Component ──────────────────────────────────────────────────────────────

export function HistoricalSalesInsights({
  categoryLabel, periodLabel, categoryBands,
  defaultFrom, defaultTo,
}: Props) {
  // Collapsed by default — buyer expands when they want the snapshot.
  const [open, setOpen] = useState(false);

  const seed = useMemo(() => defaultLyRange(), []);
  const initFrom = defaultFrom ?? seed.from;
  const initTo = defaultTo ?? seed.to;

  // Pending = picker display state; applied = data scoping state.
  // Go promotes pending → applied (mirrors the All Plans table pattern).
  const [pendingFrom, setPendingFrom] = useState<Date | null>(initFrom);
  const [pendingTo, setPendingTo] = useState<Date | null>(initTo);
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(initFrom);
  const [appliedTo, setAppliedTo] = useState<Date | null>(initTo);

  // Scale mock numbers by the applied range vs full year. 1.0 = full year.
  const scale = useMemo(() => rangeDays(appliedFrom, appliedTo) / 365, [appliedFrom, appliedTo]);

  const fabricRows      = useMemo(() => FABRIC_BASE.map((r)      => ({ ...r, salesCr: r.salesCr * scale })), [scale]);
  const fitRows         = useMemo(() => FIT_BASE.map((r)         => ({ ...r, salesCr: r.salesCr * scale })), [scale]);
  const compositionRows = useMemo(() => COMPOSITION_BASE.map((r) => ({ ...r, salesCr: r.salesCr * scale })), [scale]);
  const topArticles     = useMemo(() => TOP_ARTICLES_BASE.map((a) => ({ ...a, salesL: a.salesL * scale })), [scale]);

  // Per-MRP-band rows. Sort by canonical band order so the table reads
  // cheapest → most expensive. Normalise % across the bands the category
  // actually has (e.g. if a category has only entry+core+upper, the share
  // % still sums to 100).
  const bandRows = useMemo(() => {
    const present = [...categoryBands].sort(
      (a, b) => (BAND_ORDER[a.id] ?? 99) - (BAND_ORDER[b.id] ?? 99),
    );
    const optionsPctRaw = present.map((b) => PER_BAND_MOCK[b.id]?.optionsPct ?? 0);
    const volumePctRaw  = present.map((b) => PER_BAND_MOCK[b.id]?.volumePct  ?? 0);
    const optionsSum = optionsPctRaw.reduce((s, n) => s + n, 0) || 1;
    const volumeSum  = volumePctRaw.reduce((s, n) => s + n, 0) || 1;

    // Total options baseline = 48; scales with the date range.
    const TOTAL_OPTIONS_BASE = 48;
    const totalOptions = Math.max(present.length, Math.round(TOTAL_OPTIONS_BASE * scale));

    let assigned = 0;
    return present.map((b, i) => {
      const optionsPct = Math.round((optionsPctRaw[i] / optionsSum) * 100);
      const volumePct  = Math.round((volumePctRaw[i]  / volumeSum)  * 100);
      // Distribute totalOptions proportionally; let last row absorb rounding drift.
      const count = i === present.length - 1
        ? Math.max(0, totalOptions - assigned)
        : Math.max(0, Math.round((optionsPctRaw[i] / optionsSum) * totalOptions));
      assigned += count;
      const avgUnits = Math.round((PER_BAND_MOCK[b.id]?.avgUnits ?? 0) * scale);
      return {
        bandId: b.id,
        label: b.label,
        range: fmtMrpRange(b),
        count,
        avgUnits,
        optionsPct,
        volumePct,
      };
    });
  }, [categoryBands, scale]);

  // KPI tiles derive from the same per-band data.
  const volume = useMemo(() => {
    const totalOptions = bandRows.reduce((s, r) => s + r.count, 0);
    const totalUnits = bandRows.reduce((s, r) => s + r.count * r.avgUnits, 0);
    const avgPerOption = totalOptions > 0 ? Math.round(totalUnits / totalOptions) : 0;
    const top = bandRows.reduce(
      (best, r) => (r.volumePct > best.volumePct ? r : best),
      bandRows[0] ?? { volumePct: 0, label: '—', avgUnits: 0 },
    );
    return {
      totalOptions,
      totalUnits,
      avgPerOption,
      topBandLabel: top?.label ?? '—',
      topBandUnits: top?.avgUnits ?? 0,
    };
  }, [bandRows]);

  const dateFilterDirty =
    (pendingFrom?.getTime() ?? null) !== (appliedFrom?.getTime() ?? null) ||
    (pendingTo?.getTime() ?? null)   !== (appliedTo?.getTime() ?? null);

  const applyDateFilter = () => {
    setAppliedFrom(pendingFrom);
    setAppliedTo(pendingTo);
  };
  const resetDateFilter = () => {
    setPendingFrom(initFrom);
    setPendingTo(initTo);
    setAppliedFrom(initFrom);
    setAppliedTo(initTo);
  };

  return (
    <section className="flex-none shrink-0 rounded-lg border border-slate-200 bg-white">
      {/* Header — click to toggle */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={`flex w-full cursor-pointer flex-wrap items-center gap-3 px-4 py-3 hover:bg-slate-50 ${open ? 'border-b border-slate-200' : ''}`}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
          <BarChart3 size={14} />
        </span>
        <div className="leading-tight">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
            Historical Sales Insights
          </h2>
          <p className="text-xs text-slate-500">
            {categoryLabel} · {periodLabel} · {fmtDate(appliedFrom)} → {fmtDate(appliedTo)}
          </p>
        </div>
        <span className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {open && (
        <div className="flex flex-col gap-5 px-4 py-4">
          {/* Date range picker */}
          <div
            className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <CalendarRange size={13} />
              Range
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                From
              </label>
              <DatePicker value={pendingFrom} onChange={(v) => setPendingFrom(v ? new Date(v) : null)} />
            </div>
            <div className="min-w-[160px] flex-1">
              <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                To
              </label>
              <DatePicker value={pendingTo} onChange={(v) => setPendingTo(v ? new Date(v) : null)} />
            </div>
            <Button variant="primary" size="sm" leftIcon={<Search size={13} />}
              onClick={applyDateFilter} disabled={!dateFilterDirty}
              title={dateFilterDirty ? 'Apply date filter' : 'No pending changes'}>
              Go
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={13} />}
              onClick={resetDateFilter}>
              Reset
            </Button>
          </div>

          {/* ── 1. Volume & Option Sell Data ────────────────────────── */}
          <Subsection icon={<Package size={13} />} title="Volume & Option Sell Data">
            <div className="flex flex-col gap-3">
              {/* KPI tiles */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <KpiTile icon={<Layers3 size={13} />}     label="Options Launched"   value={`${volume.totalOptions}`}    tone="indigo" />
                <KpiTile icon={<ShoppingBag size={13} />} label="Total Units Sold"   value={fmtUnits(volume.totalUnits)} tone="blue" />
                <KpiTile icon={<TrendingUp size={13} />}  label="Avg Units / Option" value={fmtUnits(volume.avgPerOption)} tone="emerald" />
                <KpiTile icon={<Crown size={13} />}       label="Top MRP Band"       value={volume.topBandLabel}         tone="amber" />
              </div>

              {/* Per-MRP-band breakdown */}
              <PerfTable
                columns={['MRP Band', 'Price Range', 'Options', 'Avg Units / Option', 'Share of Volume']}
                rows={bandRows.map((r) => {
                  const topShare = Math.max(...bandRows.map((x) => x.volumePct));
                  return {
                    key: r.bandId,
                    cells: [
                      <span className="font-medium capitalize text-slate-900">{r.label}</span>,
                      <span className="text-slate-600">{r.range}</span>,
                      <span className="tabular-nums text-slate-900">{r.count}</span>,
                      <span className="tabular-nums text-slate-900">{fmtUnits(r.avgUnits)}</span>,
                      <ShareCell value={r.volumePct} highlight={r.volumePct === topShare} />,
                    ],
                  };
                })}
              />
              <p className="text-[10.5px] italic text-slate-500">
                Reading: <strong>{volume.topBandLabel}</strong> drove the largest share of LY
                volume in this category. Use this to bias option counts toward the bands that
                actually move.
              </p>
            </div>
          </Subsection>

          {/* ── 2. Fabric Type / Fit / Composition (2-col grid) ─────── */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Subsection icon={<Sparkles size={13} />} title="Fabric Type Performance">
              <PerfTable
                columns={['Fabric Type', 'Sales', '']}
                rows={fabricRows.map((r) => ({
                  key: r.name,
                  cells: [
                    <span className="font-medium text-slate-900">{r.name}</span>,
                    <span className="tabular-nums font-semibold text-slate-900">{fmtCr(r.salesCr)}</span>,
                    <RowBadge type={r.badge} />,
                  ],
                }))}
              />
            </Subsection>

            <Subsection icon={<TrendingUp size={13} />} title="Fit Performance">
              <PerfTable
                columns={['Fit', 'Sales', '']}
                rows={fitRows.map((r) => ({
                  key: r.name,
                  cells: [
                    <span className="font-medium text-slate-900">{r.name}</span>,
                    <span className="tabular-nums font-semibold text-slate-900">{fmtCr(r.salesCr)}</span>,
                    <RowBadge type={r.badge} />,
                  ],
                }))}
              />
            </Subsection>

            <Subsection icon={<Award size={13} />} title="Fabric Composition Performance">
              <PerfTable
                columns={['Composition', 'Sales', '']}
                rows={compositionRows.map((r) => ({
                  key: r.name,
                  cells: [
                    <span className="font-medium text-slate-900">{r.name}</span>,
                    <span className="tabular-nums font-semibold text-slate-900">{fmtCr(r.salesCr)}</span>,
                    <RowBadge type={r.badge} />,
                  ],
                }))}
              />
            </Subsection>
          </div>

          {/* ── 3. Top Selling Articles ─────────────────────────────── */}
          <Subsection icon={<Crown size={13} />} title="Top Selling Articles">
            <PerfTable
              columns={['Code', 'Article', 'Fabric', 'Fit', 'Composition', 'Sales']}
              rows={topArticles.map((a) => ({
                key: a.code,
                cells: [
                  <span className="font-mono text-xs tabular-nums text-slate-600">{a.code}</span>,
                  <span className="font-medium text-slate-900">{a.name}</span>,
                  <span className="text-slate-700">{a.fabric}</span>,
                  <span className="text-slate-700">{a.fit}</span>,
                  <span className="text-slate-700">{a.comp}</span>,
                  <span className="tabular-nums font-semibold text-slate-900">{fmtL(a.salesL)}</span>,
                ],
              }))}
            />
          </Subsection>
        </div>
      )}
    </section>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Subsection({
  icon, title, children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-600">
          {icon}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function KpiTile({
  icon, label, value, tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: 'indigo' | 'blue' | 'emerald' | 'amber';
}) {
  const tones = {
    indigo:  { bg: 'bg-indigo-50',  fg: 'text-indigo-700',  border: 'border-indigo-100' },
    blue:    { bg: 'bg-blue-50',    fg: 'text-blue-700',    border: 'border-blue-100' },
    emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-700', border: 'border-emerald-100' },
    amber:   { bg: 'bg-amber-50',   fg: 'text-amber-700',   border: 'border-amber-100' },
  };
  const t = tones[tone];
  return (
    <div className={`rounded-md border ${t.border} ${t.bg} px-3 py-2`}>
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        <span className={t.fg}>{icon}</span>
        {label}
      </div>
      <div className={`mt-1 text-base font-bold tabular-nums ${t.fg}`}>{value}</div>
    </div>
  );
}

function PerfTable({
  columns, rows,
}: {
  columns: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 text-[10.5px] uppercase tracking-wider text-slate-500">
          <tr>
            {columns.map((c, i) => (
              <th key={c + i} className="px-3 py-1.5 text-left font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-slate-100 hover:bg-slate-50/60">
              {r.cells.map((cell, i) => (
                <td key={i} className="px-3 py-1.5">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShareCell({ value, highlight }: { value: number; highlight: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`absolute inset-y-0 left-0 ${highlight ? 'bg-indigo-500' : 'bg-slate-400'}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`tabular-nums font-semibold ${highlight ? 'text-indigo-700' : 'text-slate-700'}`}>
        {value}%
      </span>
    </div>
  );
}

function RowBadge({ type }: { type: 'best' | 'top' | 'markdown' | null }) {
  if (!type) return null;
  const palettes = {
    best:     { bg: 'bg-emerald-100', fg: 'text-emerald-700', icon: <TrendingUp size={10} />,   label: 'Best Seller' },
    top:      { bg: 'bg-blue-100',    fg: 'text-blue-700',    icon: <Crown size={10} />,        label: 'Top Performer' },
    markdown: { bg: 'bg-red-100',     fg: 'text-red-700',     icon: <TrendingDown size={10} />, label: 'Highest Markdown' },
  };
  const p = palettes[type];
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.bg} ${p.fg}`}>
      {p.icon}
      {p.label}
    </span>
  );
}

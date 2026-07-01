/**
 * Historical Sales Insights — category-level snapshot rendered above the
 * Option Allocation area in the buyer editor.
 *
 * Sections (when expanded):
 *   1. Date range picker (Go / Reset)
 *   2. Volume & Option Sell Data — KPI tiles + per-band breakdown
 *   3. Fabric Type / Fit / Composition performance (2-column grid)
 *
 * Data is fetched from `/sales/aggregate` + `/sales/attribute` via
 * `useHistoricalSnapshot`, scoped to (brand, category, picker range).
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
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Button, DatePicker } from '@/components/primitives';
import type { MrpBand } from '@/features/otb/types';
import { useHistoricalSnapshot } from '@/features/sales/useInsights';

interface Props {
  categoryLabel: string;
  /** Display label only (e.g. "LY Jan 2025"). Picker controls the actual range. */
  periodLabel: string;
  /** MRP bands of the category — drives the per-band row order. */
  categoryBands: MrpBand[];
  brandUuid: string;
  categoryUuid: string;
  /** Default from/to. Falls back to last calendar year if not provided. */
  defaultFrom?: Date;
  defaultTo?: Date;
}

const BAND_ORDER: Record<MrpBand['id'], number> = {
  entry: 0, core: 1, upper: 2, statement: 3,
};

function fmtMrpRange(b: MrpBand): string {
  const min = (b.mrp_min ?? 0).toLocaleString('en-IN');
  if (b.mrp_max == null) return `₹${min}+`;
  return `₹${min} – ₹${b.mrp_max.toLocaleString('en-IN')}`;
}

function defaultLyRange(): { from: Date; to: Date } {
  const today = new Date();
  const lyYear = today.getFullYear() - 1;
  return { from: new Date(lyYear, 0, 1), to: new Date(lyYear, 11, 31) };
}

const fmtCr = (n: number) => `₹${n.toFixed(1)} Cr`;
const fmtUnits = (n: number) => n.toLocaleString('en-IN');
const fmtDate = (d: Date | null) =>
  !d ? '—' : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });

export function HistoricalSalesInsights({
  categoryLabel, periodLabel, categoryBands,
  brandUuid, categoryUuid,
  defaultFrom, defaultTo,
}: Props) {
  const [open, setOpen] = useState(false);

  const seed = useMemo(() => defaultLyRange(), []);
  const initFrom = defaultFrom ?? seed.from;
  const initTo = defaultTo ?? seed.to;

  // Pending = picker display state; applied = data scoping state.
  const [pendingFrom, setPendingFrom] = useState<Date | null>(initFrom);
  const [pendingTo,   setPendingTo]   = useState<Date | null>(initTo);
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(initFrom);
  const [appliedTo,   setAppliedTo]   = useState<Date | null>(initTo);

  const { data: snapshot, isLoading } = useHistoricalSnapshot({
    brand_uuid: brandUuid,
    category_uuid: categoryUuid,
    from: appliedFrom,
    to: appliedTo,
  });

  // Order per-band rows by canonical band order, restricted to the bands
  // the category actually has so the labels/ranges line up correctly.
  const bandRows = useMemo(() => {
    if (!snapshot) return [];
    const present = [...categoryBands].sort(
      (a, b) => (BAND_ORDER[a.id] ?? 99) - (BAND_ORDER[b.id] ?? 99),
    );
    return present.map((b) => {
      const row = snapshot.perBand.find((p) => p.bandId === b.id);
      return {
        bandId: b.id,
        label: b.label,
        range: fmtMrpRange(b),
        count: row?.count ?? 0,
        avgUnits: row?.avgUnits ?? 0,
        optionsPct: row?.optionsPct ?? 0,
        volumePct: row?.volumePct ?? 0,
      };
    });
  }, [snapshot, categoryBands]);

  const volume = useMemo(() => {
    const totalOptions = snapshot?.totalOptions ?? 0;
    const totalUnits   = snapshot?.totalUnits ?? 0;
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
    };
  }, [snapshot, bandRows]);

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

          {isLoading && (
            <p className="text-xs text-slate-500">Loading historical sales…</p>
          )}

          {!isLoading && snapshot && volume.totalOptions === 0 && (
            <p className="text-xs italic text-slate-500">
              No sales data found for this brand × category in the selected range.
            </p>
          )}

          {!isLoading && snapshot && volume.totalOptions > 0 && (
            <>
              {/* ── 1. Volume & Option Sell Data ────────────────────────── */}
              <Subsection icon={<Package size={13} />} title="Volume & Option Sell Data">
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <KpiTile icon={<Layers3 size={13} />}     label="Options Launched"   value={`${volume.totalOptions}`}    tone="indigo" />
                    <KpiTile icon={<Sparkles size={13} />}    label="Total Units Sold"   value={fmtUnits(volume.totalUnits)} tone="blue" />
                    <KpiTile icon={<TrendingUp size={13} />}  label="Avg Units / Option" value={fmtUnits(volume.avgPerOption)} tone="emerald" />
                    <KpiTile icon={<Crown size={13} />}       label="Top MRP Band"       value={volume.topBandLabel}         tone="amber" />
                  </div>

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
                    Reading: <strong>{volume.topBandLabel}</strong> drove the largest share of
                    volume in this category for the selected range. Use this to bias option counts
                    toward the bands that actually move.
                  </p>
                </div>
              </Subsection>

              {/* ── 2. Fabric Type / Fit / Composition (2-col grid) ─────── */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Subsection icon={<Sparkles size={13} />} title="Fabric Type Performance">
                  <PerfTable
                    columns={['Fabric Type', 'Sales', '']}
                    rows={snapshot.fabric.map((r) => ({
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
                    rows={snapshot.fit.map((r) => ({
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
                    rows={snapshot.composition.map((r) => ({
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
            </>
          )}
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

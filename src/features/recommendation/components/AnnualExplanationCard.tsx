/**
 * Annual per-row "Why AI" card. Matches the year-over-year mock:
 *
 *   ┌────────────────────────────────────────────────┐
 *   │ YEAR-OVER-YEAR · OTB · PUMA-ATHL · Jan 2026     │
 *   │ LAST YEAR  [+11% ▲]  THIS YEAR                  │
 *   │ ₹3.5 Cr              ₹3.4 Cr                    │
 *   │ [bar LY]                                        │
 *   │ [bar TY]                                        │
 *   │ Allocated ₹3.4 Cr · 0.7% of ₹500 Cr plan        │
 *   │ [New Year +15%] [Winter EOSS +35%] [Wedding +40%]│
 *   │ [ ▾ Show 8-field detail ]                       │
 *   └────────────────────────────────────────────────┘
 *
 * Detail grid (expandable) covers all 8 LY fields the buyer requested:
 * MRP Value sales, Net sales, Sale volume, Category volume, GP %,
 * Product cost, Markdown, Sell thru — each with a TY value and the
 * derived delta. Fields the engine doesn't project at Annual level
 * (MRP/Cost/GP/Sell-thru) render TY = LY with a "flat*" note.
 */

import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Minus } from 'lucide-react';
import { fmtMoney } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { AnnualLySnapshot, RecommendedAnnualRow } from '../types';

interface Props {
  row: RecommendedAnnualRow;
  currency: BaseCurrency;
  planTotal: number;
}

export function AnnualExplanationCard({ row, currency, planTotal }: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const ly = row.lySnapshot;
  const tyOtb = row.recommendedOtbAmount;
  // Prefer the full LY OTB the backend now sends; fall back to the
  // netSales+markdown approximation for older responses.
  const lyOtb = ly ? (ly.lyOtb && ly.lyOtb > 0 ? ly.lyOtb : computeLyOtbFromSnapshot(ly)) : 0;
  const otbDelta = lyOtb > 0 ? ((tyOtb - lyOtb) / lyOtb) * 100 : 0;
  const maxBar = Math.max(lyOtb, tyOtb, 1);
  const lyPct = (lyOtb / maxBar) * 100;
  const tyPct = (tyOtb / maxBar) * 100;
  const planSharePct = planTotal > 0 ? (tyOtb * 100) / planTotal : 0;

  return (
    <div>
      {/* Big number comparison */}
      <div className="grid grid-cols-3 items-center gap-3 px-3 pt-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
            Last year
          </div>
          <div className="mt-1 text-[22px] font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {fmtMoney(lyOtb, currency)}
          </div>
          {ly && (
            <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {formatLyPeriod(row.periodKey)} actual
            </div>
          )}
        </div>
        <div className="flex justify-center">
          <YoYPill delta={otbDelta} />
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            This year
          </div>
          <div className="mt-1 text-[22px] font-bold tabular-nums" style={{ color: 'var(--color-primary)' }}>
            {fmtMoney(tyOtb, currency)}
          </div>
          <div className="mt-0.5 text-[10.5px]" style={{ color: 'var(--color-primary)', opacity: 0.85 }}>
            {formatTyPeriod(row.periodKey)} plan
          </div>
        </div>
      </div>

      {/* Bars */}
      <div className="mt-3 flex flex-col gap-1.5 px-3">
        <BarRow label={`LY ${lyYear(row.periodKey)}`} pct={lyPct}
          valueLabel={fmtMoney(lyOtb, currency)}
          color="var(--color-text-tertiary)" />
        <BarRow label={`TY ${tyYear(row.periodKey)}`} pct={tyPct}
          valueLabel={fmtMoney(tyOtb, currency)}
          color="var(--color-primary)" />
      </div>

      {/* Footer strip — allocation + calendar chips */}
      <div className="mt-3 border-t px-3 py-2.5" style={{ borderColor: 'var(--color-divider)' }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[11.5px]">
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Allocated <strong style={{ color: 'var(--color-text-primary)' }}>
              {fmtMoney(tyOtb, currency)}
            </strong> · {planSharePct.toFixed(1)}% of {fmtMoney(planTotal, currency)} plan
          </div>
          {row.thisLiftPct != null && Math.abs(row.thisLiftPct) > 0.001 && (
            <div className="text-[10.5px] italic" style={{ color: 'var(--color-text-tertiary)' }}>
              Calendar-shifted to {tyYear(row.periodKey)} dates
            </div>
          )}
        </div>
        {row.activeEventNames && row.activeEventNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {row.activeEventNames.map((name, i) => (
              <EventChip key={`${name}-${i}`} label={name} />
            ))}
          </div>
        )}
      </div>

      {/* LY → TY change breakdown. Adapts content:
          - If calendar shifted (≥3pp): shows calendar delta line
          - If overall budget scaled: shows budget delta line + why-note
          Hides only when LY→TY delta is negligible (nothing to explain). */}
      {Math.abs(tyOtb - lyOtb) >= 1000 && (
        <CalendarLiftStrip
          thisLiftPct={row.thisLiftPct ?? 0}
          lyLiftPct={ly?.lyLiftPct ?? 0}
          lyOtb={lyOtb}
          tyOtb={tyOtb}
          eventNames={row.activeEventNames ?? []}
          currency={currency}
        />
      )}

      {/* Expandable 8-field detail */}
      {ly && (
        <div className="border-t" style={{ borderColor: 'var(--color-divider)' }}>
          <button
            type="button"
            onClick={() => setDetailOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-[11.5px] font-medium transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span>{detailOpen ? 'Hide' : 'Show'} detail</span>
            {detailOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {detailOpen && <DetailGrid ly={ly} row={row} currency={currency} />}
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────

function YoYPill({ delta }: { delta: number }) {
  const flat = Math.abs(delta) < 0.5;
  const up = delta > 0;
  const rounded = Math.round(delta * 10) / 10;
  const fg = flat ? 'var(--color-text-tertiary)' : up ? '#047857' : '#b91c1c';
  const bg = flat
    ? 'var(--color-surface-alt, #f1f5f9)'
    : up
      ? 'rgba(16,185,129,0.14)'
      : 'rgba(239,68,68,0.14)';
  const Icon = flat ? Minus : up ? ArrowUp : ArrowDown;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tabular-nums"
      style={{ color: fg, background: bg }}
    >
      <Icon size={11} />
      {flat ? 'flat' : `${up ? '+' : ''}${rounded.toFixed(1)}%`}
    </span>
  );
}

function BarRow({
  label,
  pct,
  valueLabel,
  color,
}: {
  label: string;
  pct: number;
  valueLabel: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[10.5px] tabular-nums">
      <span className="w-14 shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="w-16 shrink-0 text-right font-semibold" style={{ color: 'var(--color-text-primary)' }}>
        {valueLabel}
      </span>
    </div>
  );
}

/**
 * Calendar-lift strip. Splits the LY → TY delta into:
 *   1. Calendar delta — how much stronger (or weaker) TY's calendar is vs LY's
 *   2. Budget delta   — how much the buyer's chosen overall budget scaled every row
 *
 * The two sum to the actual LY → TY change, regardless of sign.
 *
 * Math (mirrors the backend event-shift):
 *   baseline       = lyOtb / (1 + lyLiftFraction)            // pure baseline demand
 *   calendarDelta  = baseline × (thisLift − lyLift)          // change in event intensity
 *   totalDelta     = tyOtb − lyOtb
 *   budgetDelta    = totalDelta − calendarDelta              // residual = budget scaling
 */
function CalendarLiftStrip({
  thisLiftPct,
  lyLiftPct,
  lyOtb,
  tyOtb,
  eventNames,
  currency,
}: {
  thisLiftPct: number;   // fraction, e.g. 0.211 = +21.1%
  lyLiftPct: number;     // percentage, e.g. 3.6 = +3.6%
  lyOtb: number;
  tyOtb: number;
  eventNames: string[];
  currency: BaseCurrency;
}) {
  const thisLiftFraction = thisLiftPct;
  const lyLiftFraction = lyLiftPct / 100;
  const baseline = lyLiftFraction > -1 ? lyOtb / (1 + lyLiftFraction) : lyOtb;
  const calendarExtra = Math.round(baseline * (thisLiftFraction - lyLiftFraction));
  const totalDelta = tyOtb - lyOtb;
  const budgetExtra = totalDelta - calendarExtra;
  const eventLabel = eventNames.length > 0 ? eventNames.join(', ') : 'active calendar events';

  // Thresholds match the backend's own calendar_shift emission threshold (3pp).
  const calendarShifted = Math.abs(thisLiftFraction - lyLiftFraction) >= 0.03;
  const budgetScaled = Math.abs(budgetExtra) > 1000;

  // Derive the row's effective budget-scale factor to explain "why". Because
  // scaleFactor = overallBudget / Σ shifted is the same across every row, any
  // one row's derivation gives ≈ the plan-wide number.
  const withCalendarNoScale = baseline * (1 + thisLiftFraction);
  const scaleFactor = withCalendarNoScale > 0 ? tyOtb / withCalendarNoScale : 1;
  const budgetGrowthPct = (scaleFactor - 1) * 100;

  const heading = calendarShifted
    ? budgetScaled
      ? 'Calendar + budget breakdown'
      : 'Calendar lift'
    : 'Budget scaling';

  return (
    <div
      className="border-t px-3 py-2.5 text-[11.5px]"
      style={{
        borderColor: 'var(--color-divider)',
        background: 'color-mix(in srgb, var(--color-primary) 5%, var(--color-surface))',
      }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {heading}
      </div>
      {calendarShifted ? (
        <div className="mt-1 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
          This month:{' '}
          <strong style={{ color: 'var(--color-primary)' }}>
            +{(thisLiftFraction * 100).toFixed(1)}%
          </strong>{' '}
          event lift ({eventLabel}).
          <br />
          LY same month:{' '}
          <strong style={{ color: 'var(--color-text-primary)' }}>
            +{lyLiftPct.toFixed(1)}%
          </strong>{' '}
          event lift.
        </div>
      ) : (
        <div className="mt-1 leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
          Calendar is flat vs LY same month — no event-driven change to explain.
        </div>
      )}
      <div className="mt-2 flex flex-col gap-0.5 text-[11px] tabular-nums">
        {calendarShifted && (
          <BreakdownRow
            label={
              calendarExtra >= 0
                ? 'Calendar delta (TY calendar stronger)'
                : 'Calendar delta (TY calendar weaker)'
            }
            amount={calendarExtra}
            currency={currency}
            highlight
          />
        )}
        {budgetScaled && (
          <BreakdownRow
            label={`Budget ${budgetExtra >= 0 ? 'growth' : 'shrinkage'} scaling (~${budgetGrowthPct >= 0 ? '+' : ''}${budgetGrowthPct.toFixed(1)}%)`}
            amount={budgetExtra}
            currency={currency}
            highlight={!calendarShifted}
          />
        )}
        <div
          className="mt-1 flex items-baseline justify-between border-t pt-1"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <span
            className="text-[10.5px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Net LY → TY change
          </span>
          <SignedAmount amount={totalDelta} currency={currency} bold />
        </div>
      </div>
      {budgetScaled && (
        <div
          className="mt-1.5 text-[10.5px] italic"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Every row scaled by ~{budgetGrowthPct >= 0 ? '+' : ''}{budgetGrowthPct.toFixed(1)}% because your overall budget is{' '}
          {budgetGrowthPct >= 0 ? 'higher' : 'lower'} than LY total.
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  label,
  amount,
  currency,
  highlight,
}: {
  label: string;
  amount: number;
  currency: BaseCurrency;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between">
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <SignedAmount amount={amount} currency={currency} highlight={highlight} />
    </div>
  );
}

function SignedAmount({
  amount,
  currency,
  highlight,
  bold,
}: {
  amount: number;
  currency: BaseCurrency;
  highlight?: boolean;
  bold?: boolean;
}) {
  const sign = amount >= 0 ? '+' : '−';
  const color = highlight
    ? 'var(--color-primary)'
    : amount >= 0
      ? '#047857'
      : '#b91c1c';
  return (
    <span
      className={bold ? 'font-bold' : 'font-semibold'}
      style={{ color }}
    >
      {sign}
      {fmtMoney(Math.abs(amount), currency)}
    </span>
  );
}

function EventChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
      style={{
        background: 'rgba(16,185,129,0.12)',
        color: '#047857',
      }}
    >
      {label}
    </span>
  );
}

function DetailGrid({
  ly,
  row,
  currency,
}: {
  ly: AnnualLySnapshot;
  row: RecommendedAnnualRow;
  currency: BaseCurrency;
}) {
  // Derive TY inferred values where engine doesn't project them explicitly.
  const salesScaleFactor = ly.netSales > 0 ? row.plannedSales / ly.netSales : 1;
  const tyMrpValueSales = Math.round(ly.mrpValueSales * salesScaleFactor);
  const tySaleVolume = Math.round(ly.saleVolume * salesScaleFactor);
  const tyCategoryVolume = Math.round(ly.categoryVolume * salesScaleFactor);

  const rows: Array<{ label: string; ly: string; ty: string; delta?: number; flat?: boolean }> = [
    {
      label: 'MRP Value sales',
      ly: fmtMoney(ly.mrpValueSales, currency),
      ty: fmtMoney(tyMrpValueSales, currency),
      delta: pctDelta(tyMrpValueSales, ly.mrpValueSales),
    },
    {
      label: 'Net sales',
      ly: fmtMoney(ly.netSales, currency),
      ty: fmtMoney(row.plannedSales, currency),
      delta: pctDelta(row.plannedSales, ly.netSales),
    },
    {
      label: 'Sale volume',
      ly: `${ly.saleVolume.toLocaleString('en-IN')} u`,
      ty: `${tySaleVolume.toLocaleString('en-IN')} u`,
      delta: pctDelta(tySaleVolume, ly.saleVolume),
    },
    {
      label: 'Category volume',
      ly: `${ly.categoryVolume.toLocaleString('en-IN')} u`,
      ty: `${tyCategoryVolume.toLocaleString('en-IN')} u`,
      delta: pctDelta(tyCategoryVolume, ly.categoryVolume),
    },
    { label: 'GP %', ly: `${ly.gpPct.toFixed(1)}%`, ty: `${ly.gpPct.toFixed(1)}%`, flat: true },
    {
      label: 'Product cost',
      ly: `₹${ly.productCost.toLocaleString('en-IN')}`,
      ty: `₹${ly.productCost.toLocaleString('en-IN')}`,
      flat: true,
    },
    {
      label: 'Markdown',
      ly: fmtMoney(ly.markdown, currency),
      ty: fmtMoney(row.markdowns, currency),
      delta: pctDelta(row.markdowns, ly.markdown),
    },
  ];

  return (
    <div className="px-3 pb-3 pt-1">
      <table className="w-full text-[11px] tabular-nums">
        <thead>
          <tr className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
            <th className="pb-1 pt-1.5 text-left font-semibold">Metric</th>
            <th className="pb-1 pt-1.5 text-right font-semibold">Last year</th>
            <th className="pb-1 pt-1.5 text-right font-semibold">This year</th>
            <th className="pb-1 pt-1.5 text-right font-semibold">Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t" style={{ borderColor: 'var(--color-divider)' }}>
              <td className="py-1.5 pr-2" style={{ color: 'var(--color-text-secondary)' }}>{r.label}</td>
              <td className="py-1.5 pr-2 text-right" style={{ color: 'var(--color-text-primary)' }}>{r.ly}</td>
              <td className="py-1.5 pr-2 text-right" style={{ color: 'var(--color-text-primary)' }}>{r.ty}</td>
              <td className="py-1.5 pl-2 text-right">
                {r.flat ? (
                  <span style={{ color: 'var(--color-text-tertiary)' }}>flat*</span>
                ) : (
                  <DeltaText delta={r.delta ?? 0} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeltaText({ delta }: { delta: number }) {
  const rounded = Math.round(delta * 10) / 10;
  const flat = Math.abs(rounded) < 0.1;
  if (flat) return <span style={{ color: 'var(--color-text-tertiary)' }}>flat</span>;
  const up = rounded > 0;
  const fg = up ? '#047857' : '#b91c1c';
  return (
    <span style={{ color: fg }}>
      {up ? '+' : ''}{rounded.toFixed(1)}%
    </span>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────

function computeLyOtbFromSnapshot(ly: AnnualLySnapshot): number {
  // OTB = netSales + markdown + eom - bom. Snapshot only carries netSales +
  // markdown, so approximate as `netSales + markdown` for the drawer header.
  // Small under-count vs. engine's internal computeHistoricalOtb, acceptable
  // for a display-only comparison chip.
  return ly.netSales + ly.markdown;
}

function pctDelta(ty: number, ly: number): number {
  if (ly <= 0) return 0;
  return ((ty - ly) / ly) * 100;
}

/** "2026-01" → "Jan 2025" — the LY equivalent period label. */
function formatLyPeriod(periodKey: string): string {
  const [y, m] = periodKey.split('-');
  const d = new Date(parseInt(y, 10) - 1, parseInt(m, 10) - 1, 1);
  return `${d.toLocaleString('en-US', { month: 'short' })} ${parseInt(y, 10) - 1}`;
}

/** "2026-01" → "Jan 2026". */
function formatTyPeriod(periodKey: string): string {
  const [y, m] = periodKey.split('-');
  const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
  return `${d.toLocaleString('en-US', { month: 'short' })} ${y}`;
}

function lyYear(periodKey: string): number {
  return parseInt(periodKey.split('-')[0], 10) - 1;
}

function tyYear(periodKey: string): number {
  return parseInt(periodKey.split('-')[0], 10);
}

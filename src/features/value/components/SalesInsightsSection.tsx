/**
 * Last-year sales insights for the Value editor. Surfaces the data a buyer
 * actually uses to decide tier allocation:
 *
 *   - Aggregate KPIs (units, revenue, YoY growth, avg sell-through)
 *   - Per-tier performance card grid (ST %, markdown %, realized margin, DOC)
 *   - Top / weak tier flags so the buyer can spot the obvious moves
 *   - Calendar + competitor trend chips for context
 *
 * The data is mocked (UI-only) and deterministic per OTB code — see
 * `mockData/salesInsights.ts`. The shape mirrors what a real sales-history
 * service would return; swapping to a real API later is a one-line change.
 */

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Banknote,
  CalendarHeart,
  Compass,
  Percent,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { MrpBand } from '@/features/otb/types';
import type { BandLyPerformance, SalesInsights } from '../mockData/salesInsights';

const BAND_LABEL: Record<MrpBand['id'], string> = {
  entry:     'Entry',
  core:      'Core',
  upper:     'Upper',
  statement: 'Statement',
};

export function SalesInsightsSection({
  insights,
  currency,
  bandMaster,
}: {
  insights: SalesInsights;
  currency: BaseCurrency;
  bandMaster: Record<MrpBand['id'], MrpBand>;
}) {
  return (
    <section
      className="flex shrink-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div
        className="flex items-start justify-between gap-3 border-b px-3.5 py-2.5"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            <Activity size={13} />
          </span>
          <div className="leading-tight">
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Last year sales — {insights.ly_period_label}
            </h2>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Use this as the anchor for max-profit tier allocation
            </p>
          </div>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          demo data
        </span>
      </div>

      {/* ── KPI strip (aggregate numbers) ──────────────────────────────────── */}
      <div
        className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface)',
        }}
      >
        <KpiTile
          icon={<ShoppingBag size={13} />}
          label="Units sold"
          value={insights.ly_total_units.toLocaleString()}
          delta={insights.yoy_units_growth_pct}
        />
        <KpiTile
          icon={<Banknote size={13} />}
          label="Revenue"
          value={fmtMoneyCompact(insights.ly_total_revenue, currency)}
          delta={insights.yoy_revenue_growth_pct}
        />
        <KpiTile
          icon={<Percent size={13} />}
          label="Avg sell-through"
          value={`${insights.avg_sell_through_pct}%`}
          tone={insights.avg_sell_through_pct >= 75 ? 'success' : insights.avg_sell_through_pct >= 60 ? 'neutral' : 'warning'}
        />
        <KpiTile
          icon={<Trophy size={13} />}
          label="Top tier"
          value={BAND_LABEL[insights.top_band_id]}
          tone="success"
          hint="Highest profit contribution last year"
        />
        <KpiTile
          icon={<AlertTriangle size={13} />}
          label="Weak tier"
          value={BAND_LABEL[insights.worst_band_id]}
          tone="warning"
          hint="Underperformed on sell-through × margin"
        />
      </div>

      {/* ── Per-band performance grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 p-3 md:grid-cols-4">
        {insights.bands.map((b) => (
          <BandPerformanceCard
            key={b.band_id}
            band={b}
            master={bandMaster[b.band_id]}
            currency={currency}
            isTop={b.band_id === insights.top_band_id}
            isWorst={b.band_id === insights.worst_band_id}
          />
        ))}
      </div>

      {/* ── Trend / calendar chips ─────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-2 border-t px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <span
          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <Sparkles size={11} /> Demand signals
        </span>
        {insights.trends.festival_hint && (
          <TrendChip
            icon={<CalendarHeart size={11} />}
            text={insights.trends.festival_hint}
            tone="accent"
          />
        )}
        <TrendChip
          icon={<Search size={11} />}
          text={`Search ${insights.trends.search_trend_pct >= 0 ? '+' : ''}${insights.trends.search_trend_pct}% YoY`}
          tone={insights.trends.search_trend_pct >= 5 ? 'success' : insights.trends.search_trend_pct <= -5 ? 'warning' : 'neutral'}
        />
        <TrendChip
          icon={<Compass size={11} />}
          text={
            insights.trends.competitor_price_delta_pct > 0
              ? `Competitor ${insights.trends.competitor_price_delta_pct}% cheaper`
              : `We're ${Math.abs(insights.trends.competitor_price_delta_pct)}% cheaper than competitors`
          }
          tone={insights.trends.competitor_price_delta_pct > 0 ? 'warning' : 'success'}
        />
        <TrendChip
          icon={<Activity size={11} />}
          text={`Demand index ${insights.trends.demand_index}/100`}
          tone="neutral"
        />
      </div>
    </section>
  );
}

// ── KPI tile ────────────────────────────────────────────────────────────────

type Tone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

const TONE_MAP: Record<Tone, { bg: string; border: string; iconBg: string; fg: string }> = {
  neutral: {
    bg: 'var(--color-surface)',
    border: 'var(--color-divider)',
    iconBg: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
    fg: 'var(--color-text-primary)',
  },
  accent: {
    bg: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
    border: 'color-mix(in srgb, var(--color-primary) 30%, var(--color-divider))',
    iconBg: 'color-mix(in srgb, var(--color-primary) 16%, transparent)',
    fg: 'var(--color-primary)',
  },
  success: {
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.35)',
    iconBg: 'rgba(16,185,129,0.16)',
    fg: '#047857',
  },
  warning: {
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.35)',
    iconBg: 'rgba(245,158,11,0.16)',
    fg: '#b45309',
  },
  danger: {
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.35)',
    iconBg: 'rgba(239,68,68,0.16)',
    fg: '#b91c1c',
  },
};

function KpiTile({
  icon,
  label,
  value,
  delta,
  tone = 'neutral',
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta?: number;
  tone?: Tone;
  hint?: string;
}) {
  // Auto-tone from delta direction when no explicit tone given.
  const effectiveTone: Tone = tone !== 'neutral'
    ? tone
    : delta !== undefined
      ? delta >= 2 ? 'success' : delta <= -2 ? 'warning' : 'neutral'
      : 'neutral';
  const palette = TONE_MAP[effectiveTone];
  return (
    <div
      className="flex min-w-[150px] items-center gap-2 rounded-lg border px-2.5 py-1.5"
      style={{ background: palette.bg, borderColor: palette.border }}
      title={hint}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: palette.iconBg, color: palette.fg }}
      >
        {icon}
      </span>
      <div className="min-w-0 leading-tight">
        <div
          className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {label}
        </div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-[13px] font-bold tabular-nums" style={{ color: palette.fg }}>
            {value}
          </span>
          {delta !== undefined && (
            <span
              className="inline-flex items-center text-[10px] font-semibold tabular-nums"
              style={{ color: delta >= 0 ? '#047857' : '#b45309' }}
            >
              {delta >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Per-band performance card ───────────────────────────────────────────────

function BandPerformanceCard({
  band,
  master,
  currency,
  isTop,
  isWorst,
}: {
  band: BandLyPerformance;
  master: MrpBand | undefined;
  currency: BaseCurrency;
  isTop: boolean;
  isWorst: boolean;
}) {
  // Color-code key metrics so the buyer can scan at a glance.
  const stTone: 'success' | 'neutral' | 'danger' =
    band.sell_through_pct >= 75 ? 'success' : band.sell_through_pct >= 60 ? 'neutral' : 'danger';
  const marginTone: 'success' | 'neutral' | 'danger' =
    band.realized_margin_pct >= 70 ? 'success' : band.realized_margin_pct >= 60 ? 'neutral' : 'danger';
  const mdTone: 'success' | 'neutral' | 'danger' =
    band.markdown_depth_pct <= 15 ? 'success' : band.markdown_depth_pct <= 28 ? 'neutral' : 'danger';

  const accent = isTop
    ? 'rgba(16,185,129,0.45)'
    : isWorst
      ? 'rgba(245,158,11,0.45)'
      : 'var(--color-divider)';
  const flagBg = isTop ? 'rgba(16,185,129,0.14)' : isWorst ? 'rgba(245,158,11,0.14)' : null;
  const flagFg = isTop ? '#047857' : isWorst ? '#b45309' : null;

  const mrpRange = master
    ? master.mrp_max == null
      ? `₹${(master.mrp_min ?? 0).toLocaleString()}+`
      : `₹${(master.mrp_min ?? 0).toLocaleString()}–${master.mrp_max.toLocaleString()}`
    : '';

  return (
    <div
      className="flex flex-col rounded-lg border p-2.5"
      style={{ borderColor: accent, background: 'var(--color-surface)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {BAND_LABEL[band.band_id]}
          </span>
          {isTop && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-semibold"
              style={{ background: flagBg!, color: flagFg! }}
            >
              <Trophy size={9} /> Top
            </span>
          )}
          {isWorst && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-px text-[9px] font-semibold"
              style={{ background: flagBg!, color: flagFg! }}
            >
              <AlertTriangle size={9} /> Weak
            </span>
          )}
        </div>
        <span
          className="text-[10px] font-semibold tabular-nums"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {band.ly_share_pct}% share
        </span>
      </div>
      <div
        className="mt-0.5 truncate text-[10px] tabular-nums"
        style={{ color: 'var(--color-text-tertiary)' }}
        title={mrpRange}
      >
        {mrpRange}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
        <PerfStat label="Units" value={band.units_sold.toLocaleString()} />
        <PerfStat label="Revenue" value={fmtMoneyCompact(band.revenue, currency)} />
        <PerfStat
          label="Sell-thru"
          value={`${band.sell_through_pct}%`}
          tone={stTone}
        />
        <PerfStat
          label="Markdown"
          value={`${band.markdown_depth_pct}%`}
          tone={mdTone}
        />
        <PerfStat
          label="Margin"
          value={`${band.realized_margin_pct}%`}
          tone={marginTone}
        />
        <PerfStat label="DOC" value={`${band.doc_days}d`} />
      </div>
    </div>
  );
}

function PerfStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const fg =
    tone === 'success' ? '#047857' : tone === 'danger' ? '#b91c1c' : 'var(--color-text-primary)';
  return (
    <div className="flex items-baseline justify-between">
      <span
        className="text-[9.5px] font-semibold uppercase tracking-[0.1em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </span>
      <span className="text-[11.5px] font-semibold tabular-nums" style={{ color: fg }}>
        {value}
      </span>
    </div>
  );
}

// ── Trend chip ──────────────────────────────────────────────────────────────

function TrendChip({
  icon,
  text,
  tone = 'neutral',
}: {
  icon: React.ReactNode;
  text: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning';
}) {
  const palette =
    tone === 'success'
      ? { bg: 'rgba(16,185,129,0.12)', fg: '#047857' }
      : tone === 'warning'
        ? { bg: 'rgba(245,158,11,0.14)', fg: '#b45309' }
        : tone === 'accent'
          ? { bg: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', fg: 'var(--color-primary)' }
          : { bg: 'var(--color-surface)', fg: 'var(--color-text-secondary)' };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
      style={{
        background: palette.bg,
        color: palette.fg,
        border: tone === 'neutral' ? '1px solid var(--color-divider)' : undefined,
      }}
    >
      {icon}
      {text}
    </span>
  );
}

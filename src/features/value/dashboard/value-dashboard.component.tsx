/**
 * Value Plan dashboard — single-card layout matching the OTB dashboard.
 *
 *   ┌── Header (title · company · row counts) ────────────────────────┐
 *   │── Info strip (Released · Planned · Approved · Avg margin)       │
 *   │── Body (scrollable list grouped by period)                      │
 *   │   └── PeriodGroup → ReleasedOtbCard × N                         │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Empty state: when no annual plan or no period released, points the
 * planner back at Step 1.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAnnualPlan, usePeriods } from '@/features/otb/useOtb';
import { useApiValuePlansForPlan } from '../useApiValuePlans';
import { hydrateValuePlans } from '@/store/slices/valuePlanSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  Edit3,
  Layers,
  PackageSearch,
  Percent,
  Sparkles,
  Table as TableIcon,
  TrendingUp,
} from 'lucide-react';
import { Button, Dialog, SpinnerCenter } from '@/components/primitives';
import { AllValuePlansTable } from '../all-plans/AllValuePlansTable';
import { useSetupConfig } from '@/features/otb/useOtb';
import { fmtMoney, fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import { StateBadge } from '../components/StateBadge';
import { useAllValuePlans, useReleasedOtbRows } from '../useValue';
import { VP_STATES, type VpState } from '../constants';
import { planAvgMargin } from '../utils/calc';
import type { ReleasedOtbRow, ValuePlan } from '../types';

export default function ValueDashboardPage() {
  const navigate = useNavigate();
  const { planId } = useParams<{ planId: string }>();
  const dispatch = useAppDispatch();
  const { company, isLoading } = useSetupConfig();
  const annual = useAnnualPlan(planId);
  const periods = usePeriods(planId);
  const rows = useReleasedOtbRows(planId);
  const plans = useAllValuePlans();
  const { isLoading: masterLoading } = useBrandCategoryLookup();

  // Drives the per-period "View bands" dialog. `null` = closed.
  // We carry the period's start/end dates so the dialog can seed the
  // date filter (and the server-side range query) for exactly that month.
  const [viewPeriod, setViewPeriod] = useState<
    { key: string; label: string; from: Date; to: Date } | null
  >(null);

  // Hydrate VPs from server so refresh / deep-link keeps state accurate.
  const apiVps = useApiValuePlansForPlan(planId);
  useEffect(() => {
    if (apiVps.data) dispatch(hydrateValuePlans(apiVps.data));
  }, [apiVps.data, dispatch]);

  // ── Aggregates ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const released = rows.length;
    let planned = 0;
    let approved = 0;
    let marginSum = 0;
    let marginCount = 0;
    for (const r of rows) {
      const p = plans[r.otb_code];
      if (!p) continue;
      planned += 1;
      if (p.state === VP_STATES.APPROVED) approved += 1;
      marginSum += planAvgMargin(p);
      marginCount += 1;
    }
    const todo = released - planned;
    const avgMargin = marginCount > 0 ? marginSum / marginCount : 0;
    return { released, planned, approved, todo, avgMargin };
  }, [rows, plans]);

  // ── Group by period (preserving release order via period_key sort) ────
  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; rows: ReleasedOtbRow[] }>();
    for (const r of rows) {
      const bucket = map.get(r.period_key) ?? { label: r.period_label, rows: [] };
      bucket.rows.push(r);
      map.set(r.period_key, bucket);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ key, ...val }));
  }, [rows]);

  if (isLoading || masterLoading || apiVps.isLoading || !company) {
    return <SpinnerCenter />;
  }

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/value')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to Value Plans"
            >
              <Layers size={14} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {annual?.name ? `Value Planning · ${annual.name}` : 'Value Planning'}
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name} · Step 2 · split released OTB budgets across price tiers
              </p>
            </div>
          </div>
        </div>

        {/* ── Info strip ─────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <InfoTile
            icon={<PackageSearch size={13} />}
            label="OTBs released"
            value={String(totals.released)}
            tone="accent"
          />
          <InfoTile
            icon={<Edit3 size={13} />}
            label="Planned"
            value={String(totals.planned)}
            tone={totals.planned > 0 ? 'success' : 'muted'}
          />
          <InfoTile
            icon={<CircleDashed size={13} />}
            label="Awaiting plan"
            value={String(totals.todo)}
            tone={totals.todo > 0 ? 'warning' : 'success'}
          />
          <InfoTile
            icon={<CheckCircle2 size={13} />}
            label="Approved"
            value={String(totals.approved)}
            tone={totals.approved > 0 ? 'success' : 'muted'}
          />
          <div className="ml-auto flex flex-wrap items-stretch gap-2">
            <InfoTile
              icon={<TrendingUp size={13} />}
              label="Avg margin"
              value={totals.planned > 0 ? `${totals.avgMargin.toFixed(1)}%` : '—'}
              tone={totals.planned > 0 ? 'success' : 'muted'}
            />
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {totals.released === 0 ? (
            <EmptyState onGoOtb={() => navigate('/otb')} />
          ) : (
            grouped.map((group) => (
              <PeriodGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                plans={plans}
                currency={company.base_currency}
                onOpen={(code) => navigate(`/value/${planId}/${code}`)}
                onViewBands={() => {
                  // Look up the period's actual date boundaries so the
                  // dialog can pre-filter to exactly that month/week/quarter.
                  const p = periods.find((pp) => pp.key === group.key);
                  if (!p) return;
                  setViewPeriod({
                    key: group.key,
                    label: group.label,
                    from: new Date(p.start_iso),
                    to: new Date(p.end_iso),
                  });
                }}
              />
            ))
          )}
        </div>
      </div>

      <Dialog
        open={viewPeriod !== null}
        onClose={() => setViewPeriod(null)}
        title={
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {viewPeriod ? `${viewPeriod.label} · all bands` : ''}
          </span>
        }
        size="full"
        bodyEdge
      >
        {viewPeriod && (
          <AllValuePlansTable
            compactHeader
            height="calc(100vh - 120px)"
            fixedPlanId={planId}
            fixedPeriodKey={viewPeriod.key}
            defaultDateRange={{ from: viewPeriod.from, to: viewPeriod.to }}
            onOpenRow={(pId, otbCode) => {
              setViewPeriod(null);
              navigate(`/value/${pId}/${otbCode}`);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

// ── PeriodGroup ────────────────────────────────────────────────────────────

function PeriodGroup({
  label,
  rows,
  plans,
  currency,
  onOpen,
  onViewBands,
}: {
  label: string;
  rows: ReleasedOtbRow[];
  plans: Record<string, ValuePlan>;
  currency: BaseCurrency;
  onOpen: (otbCode: string) => void;
  onViewBands: () => void;
}) {
  const planned = rows.filter((r) => plans[r.otb_code]).length;
  const approved = rows.filter((r) => plans[r.otb_code]?.state === VP_STATES.APPROVED).length;
  // Only show the table-view button when at least one OTB has VP data —
  // otherwise the dialog would open to an empty grid.
  const hasAnyVp = planned > 0;
  return (
    <section
      className="flex shrink-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      {/* Group header */}
      <div
        className="flex items-center justify-between gap-2 border-b px-3.5 py-2.5"
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
            <CalendarRange size={13} />
          </span>
          <div className="leading-tight">
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </h2>
            <p className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {rows.length} {rows.length === 1 ? 'row' : 'rows'} · {planned} planned · {approved} approved
            </p>
          </div>
        </div>
        {hasAnyVp && (
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<TableIcon size={12} />}
            onClick={onViewBands}
            title={`See every band entered for ${label} in one table`}
          >
            View bands
          </Button>
        )}
      </div>

      {/* Row grid */}
      <div className="grid grid-cols-1 gap-2 p-2 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <ReleasedOtbCard
            key={row.otb_code}
            row={row}
            plan={plans[row.otb_code]}
            currency={currency}
            onOpen={() => onOpen(row.otb_code)}
          />
        ))}
      </div>
    </section>
  );
}

// ── ReleasedOtbCard ────────────────────────────────────────────────────────

function ReleasedOtbCard({
  row,
  plan,
  currency,
  onOpen,
}: {
  row: ReleasedOtbRow;
  plan: ValuePlan | undefined;
  currency: BaseCurrency;
  onOpen: () => void;
}) {
  const status: VpState | 'todo' = plan?.state ?? 'todo';
  const margin = plan ? planAvgMargin(plan) : null;

  const palette = STATUS_PALETTE[status];
  const Icon = palette.icon;
  const cta = status === VP_STATES.APPROVED ? 'Edit' : status === VP_STATES.DRAFT ? 'Continue' : 'Plan';
  const isStale =
    plan !== undefined && plan.budget_snapshot !== row.budget;

  return (
    <div
      className="group flex flex-col gap-2 rounded-lg border p-2.5 transition-shadow hover:shadow-sm"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      {/* Top row — otb code + state badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div
            className="truncate font-mono text-[10.5px] tabular-nums"
            style={{ color: 'var(--color-text-tertiary)' }}
            title={row.otb_code}
          >
            {row.otb_code}
          </div>
          <div
            className="mt-0.5 truncate text-[13px] font-semibold leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {row.brand_name} · {row.category_name}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {status === 'todo' ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: palette.bg, color: palette.fg }}
            >
              <Icon size={11} /> Todo
            </span>
          ) : (
            <StateBadge state={status} />
          )}
          {isStale && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(245,158,11,0.14)', color: '#b45309' }}
              title="OTB budget has changed since this plan was last edited"
            >
              <Sparkles size={10} /> Stale
            </span>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--color-divider)' }}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <Stat label="Budget" value={fmtMoneyCompact(row.budget, currency)} />
          {margin !== null && (
            <Stat
              label="Margin"
              value={`${margin.toFixed(1)}%`}
              icon={<Percent size={9} />}
              tone={margin < 60 ? 'danger' : 'success'}
            />
          )}
        </div>
        <Button
          size="sm"
          variant={status === VP_STATES.APPROVED ? 'secondary' : 'primary'}
          rightIcon={<ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />}
          onClick={onOpen}
        >
          {cta}
        </Button>
      </div>
    </div>
  );
}

const STATUS_PALETTE: Record<
  VpState | 'todo',
  { icon: typeof CircleDashed; bg: string; fg: string }
> = {
  todo: {
    icon: CircleDashed,
    bg: 'var(--color-surface-alt, #f1f5f9)',
    fg: 'var(--color-text-tertiary)',
  },
  draft: { icon: Edit3,        bg: 'rgba(245,158,11,0.14)', fg: '#b45309' },
  submitted: { icon: Edit3,    bg: 'rgba(96,165,250,0.14)', fg: '#1d4ed8' },
  approved: { icon: CheckCircle2, bg: 'rgba(16,185,129,0.14)', fg: '#047857' },
};

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ onGoOtb }: { onGoOtb: () => void }) {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
          color: 'var(--color-primary)',
        }}
      >
        <Layers size={20} strokeWidth={1.8} />
      </span>
      <div className="max-w-md">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          No OTB rows released yet
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Value Plans split a released OTB row across price tiers. Release at least one period in
          Step 1 to unlock this screen.
        </p>
      </div>
      <Button variant="primary" rightIcon={<ArrowRight size={13} />} onClick={onGoOtb}>
        Go to OTB Planning
      </Button>
    </div>
  );
}

// ── Tiny presentational helpers ───────────────────────────────────────────

type Tone = 'neutral' | 'muted' | 'accent' | 'success' | 'warning' | 'danger';

const TONE: Record<Tone, { bg: string; border: string; iconBg: string; fg: string }> = {
  neutral: {
    bg: 'var(--color-surface)',
    border: 'var(--color-divider)',
    iconBg: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
    fg: 'var(--color-text-primary)',
  },
  muted: {
    bg: 'var(--color-surface)',
    border: 'var(--color-divider)',
    iconBg: 'var(--color-surface-alt, #f1f5f9)',
    fg: 'var(--color-text-secondary)',
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

function InfoTile({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: Tone;
}) {
  const palette = TONE[tone];
  return (
    <div
      className="flex min-w-[140px] items-center gap-2 rounded-lg border px-2.5 py-1.5"
      style={{ background: palette.bg, borderColor: palette.border }}
    >
      {icon && (
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: palette.iconBg, color: palette.fg }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <div
          className="text-[9.5px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {label}
        </div>
        <div className="mt-0.5 text-[12px] font-semibold tabular-nums" style={{ color: palette.fg }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const fg = tone === 'success' ? '#047857' : tone === 'danger' ? '#b91c1c' : 'var(--color-text-primary)';
  return (
    <div className="inline-flex items-baseline gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold tabular-nums" style={{ color: fg }}>
        {icon}{value}
      </span>
    </div>
  );
}

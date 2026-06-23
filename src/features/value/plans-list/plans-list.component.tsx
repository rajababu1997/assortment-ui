/**
 * Value Plans list — top-level landing for `/value`. Mirrors the OTB plans
 * list: one card per annual plan, showing value-planning progress (how
 * many released rows, planned, approved). Drill-down → `/value/:planId`
 * shows that plan's released rows grouped by period.
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  Layers,
  ListChecks,
  PackageSearch,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button, SpinnerCenter } from '@/components/primitives';
import { OTB_STATES } from '@/features/otb/constants';
import { useAllPlans, useSetupConfig } from '@/features/otb/useOtb';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { hydrateValuePlans } from '@/store/slices/valuePlanSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fmtMoneyCompact, fmtDate } from '@/features/otb/utils/format';
import type { AnnualPlan } from '@/features/otb/types';
import type { BaseCurrency } from '@/features/setup/types';
import { useAllValuePlans } from '../useValue';
import { useApiAllValuePlanRows } from '../useApiValuePlans';
import { VP_STATES } from '../constants';
import { planAvgMargin } from '../utils/calc';
import type { ValuePlan } from '../types';

export default function ValuePlansListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { company, isLoading } = useSetupConfig();
  const plans = useAllPlans();
  const valuePlans = useAllValuePlans();

  // Hydrate annual plans + value plans on landing so the cards reflect
  // server state (and survive hard refresh).
  const apiAnnual = useApiAnnualPlans();
  useEffect(() => {
    if (apiAnnual.data && apiAnnual.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiAnnual.data));
    }
  }, [apiAnnual.data, dispatch]);

  const apiVps = useApiAllValuePlanRows();
  useEffect(() => {
    if (!apiVps.data) return;
    // The All-VPs decorated rows include enough to reconstruct ValuePlan
    // objects for the in-session cache.
    const synth: ValuePlan[] = apiVps.data.map((r) => ({
      otb_code: r.otb_code,
      period_key: r.period_key,
      brand_uuid: r.brand_uuid,
      category_uuid: r.category_uuid,
      budget_snapshot: r.budget_snapshot,
      state: r.state,
      bands: r.bands,
      created_at: r.modified_time ?? 0,
      submitted_at: r.submitted_at,
      approved_at: r.approved_at,
    }));
    dispatch(hydrateValuePlans(synth));
  }, [apiVps.data, dispatch]);

  // ── Per-plan VP stats (released / planned / approved / margin) ─────────
  const planStats = useMemo(
    () => plans.map((plan) => deriveStats(plan, valuePlans)),
    [plans, valuePlans],
  );

  // ── Aggregates for the info strip ──────────────────────────────────────
  const totals = useMemo(() => {
    let totalPlans = plans.length;
    let plansWithRows = 0;
    let plansComplete = 0;
    let marginSum = 0;
    let marginCount = 0;
    for (const s of planStats) {
      if (s.releasedCount > 0) plansWithRows += 1;
      if (s.isComplete) plansComplete += 1;
      if (s.avgMargin > 0) {
        marginSum += s.avgMargin;
        marginCount += 1;
      }
    }
    const avgMargin = marginCount > 0 ? marginSum / marginCount : 0;
    return { totalPlans, plansWithRows, plansComplete, avgMargin };
  }, [planStats, plans.length]);

  if (isLoading || apiAnnual.isLoading || apiVps.isLoading || !company) {
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
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
                border: '1px solid rgba(96,165,250,0.22)',
                color: 'var(--color-primary)',
              }}
            >
              <Layers size={14} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Value Planning
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name} · Step 2 · pick a year to plan released OTB rows
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ListChecks size={13} />}
            onClick={() => navigate('/value/all')}
          >
            All Value Plans
          </Button>
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
            label="Plans"
            value={String(totals.totalPlans)}
            tone="accent"
          />
          <InfoTile
            icon={<CalendarRange size={13} />}
            label="With released rows"
            value={String(totals.plansWithRows)}
            tone={totals.plansWithRows > 0 ? 'success' : 'muted'}
          />
          <InfoTile
            icon={<CheckCircle2 size={13} />}
            label="Fully planned"
            value={String(totals.plansComplete)}
            tone={totals.plansComplete > 0 ? 'success' : 'muted'}
          />
          <div className="ml-auto flex flex-wrap items-stretch gap-2">
            <InfoTile
              icon={<TrendingUp size={13} />}
              label="Avg margin"
              value={totals.avgMargin > 0 ? `${totals.avgMargin.toFixed(1)}%` : '—'}
              tone={totals.avgMargin > 0 ? 'success' : 'muted'}
            />
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {totals.totalPlans === 0 ? (
            <EmptyHero onGoOtb={() => navigate('/otb')} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {planStats.map((s) => (
                <PlanCard
                  key={s.plan.plan_id}
                  stats={s}
                  currency={company.base_currency}
                  onOpenValue={() => navigate(`/value/${s.plan.plan_id}`)}
                  onOpenOtb={() => navigate(`/otb/${s.plan.plan_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Per-plan stats ─────────────────────────────────────────────────────────

interface PlanVpStats {
  plan: AnnualPlan;
  releasedCount: number;       // # released OTB rows
  plannedCount: number;        // # rows with any ValuePlan
  approvedCount: number;       // # rows with an APPROVED ValuePlan
  totalBudget: number;         // Σ released-row OTB ceilings
  avgMargin: number;           // mean of plan-level avg margin across all VPs
  isComplete: boolean;
}

function deriveStats(plan: AnnualPlan, vps: Record<string, ValuePlan>): PlanVpStats {
  let releasedCount = 0;
  let plannedCount = 0;
  let approvedCount = 0;
  let totalBudget = 0;
  let marginSum = 0;
  let marginCount = 0;

  for (const period of Object.values(plan.periods)) {
    if (period.state !== OTB_STATES.LOCKED) continue;
    for (const row of period.rows) {
      releasedCount += 1;
      totalBudget +=
        row.planned_sales +
        row.markdowns +
        row.eom_inventory -
        row.bom_inventory -
        row.on_order;
      const vp = vps[row.otb_code];
      if (vp) {
        plannedCount += 1;
        if (vp.state === VP_STATES.APPROVED) approvedCount += 1;
        const m = planAvgMargin(vp);
        if (m > 0) {
          marginSum += m;
          marginCount += 1;
        }
      }
    }
  }

  const avgMargin = marginCount > 0 ? marginSum / marginCount : 0;
  const isComplete = releasedCount > 0 && approvedCount === releasedCount;

  return { plan, releasedCount, plannedCount, approvedCount, totalBudget, avgMargin, isComplete };
}

// ── PlanCard ───────────────────────────────────────────────────────────────

function PlanCard({
  stats,
  currency,
  onOpenValue,
  onOpenOtb,
}: {
  stats: PlanVpStats;
  currency: BaseCurrency;
  onOpenValue: () => void;
  onOpenOtb: () => void;
}) {
  const { plan, releasedCount, plannedCount, approvedCount, totalBudget, avgMargin, isComplete } =
    stats;
  const progressPct = releasedCount === 0 ? 0 : Math.round((approvedCount / releasedCount) * 100);

  // Cards with zero released rows surface a "release OTBs first" hint
  const noReleases = releasedCount === 0;

  return (
    <div
      className="group flex flex-col gap-3 overflow-hidden rounded-xl border p-3 transition-shadow hover:shadow-md"
      style={{
        borderColor: isComplete ? 'rgba(16,185,129,0.45)' : 'var(--color-divider)',
        background: noReleases ? 'var(--color-surface-alt, #f8fafc)' : 'var(--color-surface)',
        opacity: noReleases ? 0.85 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2
              className="truncate text-[15px] font-bold leading-tight"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {plan.name}
            </h2>
            {isComplete && <Sparkles size={12} style={{ color: '#047857' }} />}
          </div>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {fmtDate(plan.plan_start_iso)} → {fmtDate(plan.plan_end_iso)}
          </p>
          <p
            className="mt-1 font-mono text-[9.5px] tabular-nums"
            style={{ color: 'var(--color-text-tertiary)' }}
            title={plan.plan_id}
          >
            {plan.plan_id}
          </p>
        </div>
        {isComplete ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(16,185,129,0.14)', color: '#047857' }}
          >
            <CheckCircle2 size={11} /> Complete
          </span>
        ) : noReleases ? (
          <span
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-divider)' }}
          >
            <CircleDashed size={11} /> No releases
          </span>
        ) : null}
      </div>

      {/* Progress bar (only when there are released rows) */}
      {!noReleases && (
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>Plan progress</span>
            <span className="tabular-nums">
              {approvedCount} / {releasedCount} approved
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                  : 'linear-gradient(90deg, #60a5fa, #2176ff)',
              }}
            />
          </div>
          <div
            className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] tabular-nums"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <span>{plannedCount} drafted</span>
            <span>·</span>
            <span>{releasedCount - plannedCount} todo</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="mt-auto flex items-end justify-between gap-2 border-t pt-2"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <Stat label="Budget" value={totalBudget > 0 ? fmtMoneyCompact(totalBudget, currency) : '—'} />
          {avgMargin > 0 && (
            <Stat label="Margin" value={`${avgMargin.toFixed(1)}%`} tone={avgMargin < 60 ? 'danger' : 'success'} />
          )}
        </div>
        {noReleases ? (
          <Button
            size="sm"
            variant="secondary"
            rightIcon={<ArrowRight size={11} />}
            onClick={onOpenOtb}
            title="Release at least one OTB period for this plan first"
          >
            OTB
          </Button>
        ) : (
          <Button
            size="sm"
            variant={isComplete ? 'secondary' : 'primary'}
            rightIcon={<ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />}
            onClick={onOpenValue}
          >
            Open
          </Button>
        )}
      </div>
    </div>
  );
}

// ── EmptyHero — no plans at all ────────────────────────────────────────────

function EmptyHero({ onGoOtb }: { onGoOtb: () => void }) {
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
          No OTB plans yet
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Value Plans split released OTB rows across price tiers. Create an OTB plan first, then
          release at least one period.
        </p>
      </div>
      <Button variant="primary" rightIcon={<ArrowRight size={13} />} onClick={onGoOtb}>
        Go to OTB Planning
      </Button>
    </div>
  );
}

// ── Presentational helpers (info tile / stat) ─────────────────────────────

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
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'danger';
}) {
  const fg = tone === 'success' ? '#047857' : tone === 'danger' ? '#b91c1c' : 'var(--color-text-primary)';
  return (
    <div className="inline-flex items-baseline gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: fg }}>
        {value}
      </span>
    </div>
  );
}

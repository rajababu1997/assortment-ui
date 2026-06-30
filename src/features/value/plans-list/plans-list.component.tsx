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
  CheckCircle2,
  CircleDashed,
  Layers,
  ListChecks,
  Sparkles,
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

  // Date range = union of every annual plan window. Sending a bounded range
  // (rather than calling `/otb/value/all` unbounded) lets the server's
  // date-overlap filter narrow the result set to VPs the page might display
  // — cheaper round-trip, and surfaces the date scope in the network panel.
  const vpDateRange = useMemo(() => {
    if (plans.length === 0) return null;
    let from = plans[0].plan_start_iso;
    let to = plans[0].plan_end_iso;
    for (const p of plans) {
      if (p.plan_start_iso < from) from = p.plan_start_iso;
      if (p.plan_end_iso > to) to = p.plan_end_iso;
    }
    return { from, to };
  }, [plans]);

  const apiVps = useApiAllValuePlanRows(
    vpDateRange?.from,
    vpDateRange?.to,
    { enabled: !!vpDateRange },
  );
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

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {plans.length === 0 ? (
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
      className="group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
      style={{
        borderColor: isComplete ? 'rgba(16,185,129,0.45)' : 'var(--color-divider)',
        background: noReleases ? 'var(--color-surface-alt, #f8fafc)' : 'var(--color-surface)',
        opacity: noReleases ? 0.85 : 1,
      }}
    >
      {/* Soft-blue header — year, status, (no delete here; value plans can't be removed at the plan level) */}
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          background:
            'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.10))',
          borderColor: 'rgba(96,165,250,0.22)',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <h2
            className="truncate text-[15px] font-bold leading-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {plan.name}
          </h2>
          {isComplete && <Sparkles size={12} style={{ color: '#047857' }} />}
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

      {/* Body — date range + highlighted plan-id chip + progress + footer */}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {fmtDate(plan.plan_start_iso)} → {fmtDate(plan.plan_end_iso)}
          </p>
          {/* Plan id chip — highlighted (matches OTB Plans card styling). */}
          <span
            className="mt-1.5 inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10.5px] font-semibold tabular-nums"
            style={{
              background: 'color-mix(in srgb, var(--color-primary) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--color-primary) 28%, var(--color-divider))',
              color: 'var(--color-primary)',
            }}
            title={plan.plan_id}
          >
            {plan.plan_id}
          </span>
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

// ── Presentational helpers ────────────────────────────────────────────────

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

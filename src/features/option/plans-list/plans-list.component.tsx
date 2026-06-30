/**
 * Option Plans list — top-level landing for `/option`.
 *
 * One card per annual plan, showing option-planning progress derived from
 * three signals: VP-approved candidates (= eligible OTBs), Option Plans on
 * file (any state), and APPROVED Option Plans. The "Continue" CTA opens the
 * per-plan dashboard at `/option/:planId`.
 *
 * Eligibility chain reminder:
 *   OTB row LOCKED  →  Value Plan APPROVED  →  Option Plan eligible
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  Layers3,
  ListChecks,
  PackageCheck,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { Button, SpinnerCenter } from '@/components/primitives';
import { OTB_STATES } from '@/features/otb/constants';
import { useAllPlans, useSetupConfig } from '@/features/otb/useOtb';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { hydrateValuePlans } from '@/store/slices/valuePlanSlice';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { fmtDate } from '@/features/otb/utils/format';
import { VP_STATES } from '@/features/value/constants';
import { useAllValuePlans } from '@/features/value/useValue';
import { useApiAllValuePlanRows } from '@/features/value/useApiValuePlans';
import type { ValuePlan } from '@/features/value/types';
import type { AnnualPlan } from '@/features/otb/types';
import { useApiAllOptionPlanRows } from '../useApiOptionPlans';
import { OP_STATES } from '../constants';
import type { OptionPlanRow } from '../types';

export default function OptionPlansListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { company, isLoading } = useSetupConfig();
  const plans = useAllPlans();
  const valuePlans = useAllValuePlans();

  const apiAnnual = useApiAnnualPlans();
  useEffect(() => {
    if (apiAnnual.data && apiAnnual.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiAnnual.data));
    }
  }, [apiAnnual.data, dispatch]);

  // Compute the full span across every annual plan so the VP + OP list calls
  // are date-bounded (avoids the unbounded /all endpoint). The queries below
  // are gated on this so they only fire after annual plans resolve.
  const span = useMemo(() => {
    const data = apiAnnual.data ?? [];
    if (data.length === 0) return null;
    let minStart: string | null = null;
    let maxEnd: string | null = null;
    for (const p of data) {
      if (!minStart || p.plan_start_iso < minStart) minStart = p.plan_start_iso;
      if (!maxEnd   || p.plan_end_iso   > maxEnd)   maxEnd   = p.plan_end_iso;
    }
    return minStart && maxEnd ? { from: minStart, to: maxEnd } : null;
  }, [apiAnnual.data]);

  // Hydrate VPs so eligibility (= VP-approved) is computed from server truth.
  // Gated on span so we never fire the unbounded /all variant from this screen.
  const apiVps = useApiAllValuePlanRows(span?.from, span?.to, { enabled: !!span });
  useEffect(() => {
    if (!apiVps.data) return;
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

  // Option plans across the tenant — keyed by (plan_id, otb_code) for join.
  const apiOps = useApiAllOptionPlanRows(span?.from, span?.to, { enabled: !!span });
  const opsByKey = useMemo(() => {
    const m = new Map<string, OptionPlanRow>();
    (apiOps.data ?? []).forEach((r) => m.set(`${r.plan_id}:${r.otb_code}`, r));
    return m;
  }, [apiOps.data]);

  const planStats = useMemo(
    () => plans.map((plan) => deriveStats(plan, valuePlans, opsByKey)),
    [plans, valuePlans, opsByKey],
  );

  const totals = useMemo(() => {
    let plansComplete = 0;
    let totalEligible = 0;
    let totalStarted = 0;
    let totalApproved = 0;
    let totalAwaiting = 0;
    for (const s of planStats) {
      if (s.isComplete) plansComplete += 1;
      totalEligible += s.eligibleCount;
      totalStarted += s.startedCount;
      totalApproved += s.approvedCount;
      totalAwaiting += s.submittedCount;
    }
    return {
      totalPlans: plans.length,
      plansComplete,
      totalEligible,
      totalStarted,
      totalApproved,
      totalAwaiting,
    };
  }, [planStats, plans.length]);

  // Spin until everything we render against is on hand. apiVps/apiOps are
  // disabled until `span` resolves, so check for actual data presence (not
  // just `isLoading`) — a disabled query never reports `isLoading=true`.
  const waitingForData =
    isLoading ||
    apiAnnual.isLoading ||
    !company ||
    (!!span && (!apiVps.data || !apiOps.data));
  if (waitingForData) return <SpinnerCenter />;

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        {/* Header */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(244,114,182,0.18))',
                border: '1px solid rgba(167,139,250,0.22)',
                color: 'var(--color-primary)',
              }}
            >
              <PackageCheck size={14} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Option Planning
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name} · Step 3 · split each category into Fabric / Fit / Composition options
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ListChecks size={13} />}
            onClick={() => navigate('/option/all')}
          >
            All Option Plans
          </Button>
        </div>

        {/* Info strip */}
        <div
          className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <InfoTile icon={<Layers3 size={13} />} label="Plans" value={String(totals.totalPlans)} tone="accent" />
          <InfoTile icon={<CalendarRange size={13} />} label="Eligible OTBs" value={String(totals.totalEligible)}
            tone={totals.totalEligible > 0 ? 'accent' : 'muted'} />
          <InfoTile icon={<ScrollText size={13} />} label="Started" value={String(totals.totalStarted)}
            tone={totals.totalStarted > 0 ? 'info' : 'muted'} />
          <InfoTile icon={<CircleDashed size={13} />} label="In review" value={String(totals.totalAwaiting)}
            tone={totals.totalAwaiting > 0 ? 'warning' : 'muted'} />
          <InfoTile icon={<CheckCircle2 size={13} />} label="Approved" value={String(totals.totalApproved)}
            tone={totals.totalApproved > 0 ? 'success' : 'muted'} />
          <div className="ml-auto flex items-stretch gap-2">
            <InfoTile icon={<Sparkles size={13} />} label="Fully complete" value={String(totals.plansComplete)}
              tone={totals.plansComplete > 0 ? 'success' : 'muted'} />
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {totals.totalPlans === 0 ? (
            <EmptyHero onGoOtb={() => navigate('/otb')} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {planStats.map((s) => (
                <PlanCard
                  key={s.plan.plan_id}
                  stats={s}
                  onOpen={() => navigate(`/option/${s.plan.plan_id}`)}
                  onOpenValue={() => navigate(`/value/${s.plan.plan_id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Stats derivation ───────────────────────────────────────────────────────

interface PlanOpStats {
  plan: AnnualPlan;
  /** Released OTB rows whose Value Plan is APPROVED — these can start Option Planning. */
  eligibleCount: number;
  /** Subset of eligible: an Option Plan exists in any state. */
  startedCount: number;
  /** Subset of eligible: state == DRAFT. */
  draftCount: number;
  /** Subset of eligible: state == SUBMITTED — designer review queue. */
  submittedCount: number;
  /** Subset of eligible: state == REVISIONS_REQUESTED — back at the buyer. */
  revisionsCount: number;
  /** Subset of eligible: state == APPROVED. */
  approvedCount: number;
  isComplete: boolean;
}

function deriveStats(
  plan: AnnualPlan,
  vps: Record<string, ValuePlan>,
  opsByKey: Map<string, OptionPlanRow>,
): PlanOpStats {
  let eligibleCount = 0;
  let startedCount = 0;
  let draftCount = 0;
  let submittedCount = 0;
  let revisionsCount = 0;
  let approvedCount = 0;

  for (const period of Object.values(plan.periods)) {
    if (period.state !== OTB_STATES.LOCKED) continue;
    for (const row of period.rows) {
      const vp = vps[row.otb_code];
      if (!vp || vp.state !== VP_STATES.APPROVED) continue;
      eligibleCount += 1;

      const op = opsByKey.get(`${plan.plan_id}:${row.otb_code}`);
      if (!op) continue;
      startedCount += 1;
      if (op.state === OP_STATES.DRAFT) draftCount += 1;
      else if (op.state === OP_STATES.SUBMITTED) submittedCount += 1;
      else if (op.state === OP_STATES.REVISIONS_REQUESTED) revisionsCount += 1;
      else if (op.state === OP_STATES.APPROVED) approvedCount += 1;
    }
  }

  const isComplete = eligibleCount > 0 && approvedCount === eligibleCount;
  return {
    plan, eligibleCount, startedCount, draftCount,
    submittedCount, revisionsCount, approvedCount, isComplete,
  };
}

// ── Card ────────────────────────────────────────────────────────────────────

function PlanCard({
  stats, onOpen, onOpenValue,
}: {
  stats: PlanOpStats;
  onOpen: () => void;
  onOpenValue: () => void;
}) {
  const { plan, eligibleCount, startedCount, draftCount, submittedCount,
    revisionsCount, approvedCount, isComplete } = stats;
  const progressPct = eligibleCount === 0 ? 0 : Math.round((approvedCount / eligibleCount) * 100);
  const noEligible = eligibleCount === 0;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
      style={{
        borderColor: isComplete ? 'rgba(16,185,129,0.45)' : 'var(--color-divider)',
        background: noEligible ? 'var(--color-surface-alt, #f8fafc)' : 'var(--color-surface)',
        opacity: noEligible ? 0.85 : 1,
      }}
    >
      {/* Soft-blue header — year + complete/waiting status pill */}
      <div
        className="flex items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          background:
            'linear-gradient(135deg, rgba(96,165,250,0.12), rgba(167,139,250,0.10))',
          borderColor: 'rgba(96,165,250,0.22)',
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="truncate text-[15px] font-bold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
            {plan.name}
          </h2>
          {isComplete && <Sparkles size={12} style={{ color: '#047857' }} />}
        </div>
        {isComplete ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'rgba(16,185,129,0.14)', color: '#047857' }}>
            <CheckCircle2 size={11} /> Complete
          </span>
        ) : noEligible ? (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ background: 'var(--color-surface)', color: 'var(--color-text-tertiary)', border: '1px solid var(--color-divider)' }}>
            <CircleDashed size={11} /> Waiting on Value
          </span>
        ) : null}
      </div>

      {/* Body — date range + highlighted plan-id chip + progress + footer */}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {fmtDate(plan.plan_start_iso)} → {fmtDate(plan.plan_end_iso)}
          </p>
          {/* Plan id chip — same primary-tinted styling as OTB / Value cards */}
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

      {!noEligible && (
        <div>
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>Option plan progress</span>
            <span className="tabular-nums">{approvedCount} / {eligibleCount} approved</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #34d399, #10b981)'
                  : 'linear-gradient(90deg, #a78bfa, #f472b6)',
              }}
            />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
            <span>{draftCount} draft</span>
            <span>·</span>
            <span>{submittedCount} in review</span>
            {revisionsCount > 0 && (
              <>
                <span>·</span>
                <span style={{ color: '#b45309' }}>{revisionsCount} revisions</span>
              </>
            )}
            <span>·</span>
            <span>{Math.max(0, eligibleCount - startedCount)} todo</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--color-divider)' }}>
        <Stat label="Eligible" value={String(eligibleCount)} />
        {noEligible ? (
          <Button size="sm" variant="secondary" rightIcon={<ArrowRight size={11} />} onClick={onOpenValue}>
            Approve Value first
          </Button>
        ) : (
          <Button
            size="sm"
            variant={isComplete ? 'secondary' : 'primary'}
            rightIcon={<ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />}
            onClick={onOpen}
          >
            {isComplete ? 'View' : 'Open'}
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}

function EmptyHero({ onGoOtb }: { onGoOtb: () => void }) {
  return (
    <div
      className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(244,114,182,0.18))',
          color: 'var(--color-primary)',
        }}>
        <PackageCheck size={20} strokeWidth={1.8} />
      </span>
      <div className="max-w-md">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          No OTB plans yet
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Option Plans split released-and-value-approved OTBs into Fabric / Fit / Composition mixes.
          Create an OTB plan first, release at least one period, then approve its Value Plan.
        </p>
      </div>
      <Button variant="primary" rightIcon={<ArrowRight size={13} />} onClick={onGoOtb}>
        Go to OTB Planning
      </Button>
    </div>
  );
}

// ── Presentational helpers (info tile / stat) ──────────────────────────────

type Tone = 'neutral' | 'muted' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

const TONE: Record<Tone, { bg: string; border: string; iconBg: string; fg: string }> = {
  neutral: { bg: 'var(--color-surface)', border: 'var(--color-divider)',
    iconBg: 'color-mix(in srgb, var(--color-primary) 10%, transparent)', fg: 'var(--color-text-primary)' },
  muted:   { bg: 'var(--color-surface)', border: 'var(--color-divider)',
    iconBg: 'var(--color-surface-alt, #f1f5f9)', fg: 'var(--color-text-secondary)' },
  accent:  { bg: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
    border: 'color-mix(in srgb, var(--color-primary) 30%, var(--color-divider))',
    iconBg: 'color-mix(in srgb, var(--color-primary) 16%, transparent)', fg: 'var(--color-primary)' },
  info:    { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.35)',
    iconBg: 'rgba(59,130,246,0.16)', fg: '#1d4ed8' },
  success: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.35)',
    iconBg: 'rgba(16,185,129,0.16)', fg: '#047857' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.35)',
    iconBg: 'rgba(245,158,11,0.16)', fg: '#b45309' },
  danger:  { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.35)',
    iconBg: 'rgba(239,68,68,0.16)', fg: '#b91c1c' },
};

function InfoTile({ icon, label, value, tone = 'neutral' }: { icon?: React.ReactNode; label: string; value: string; tone?: Tone }) {
  const palette = TONE[tone];
  return (
    <div className="flex min-w-[140px] items-center gap-2 rounded-lg border px-2.5 py-1.5"
      style={{ background: palette.bg, borderColor: palette.border }}>
      {icon && (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: palette.iconBg, color: palette.fg }}>{icon}</span>
      )}
      <div className="min-w-0 leading-tight">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--color-text-tertiary)' }}>
          {label}
        </div>
        <div className="mt-0.5 text-[12px] font-semibold tabular-nums" style={{ color: palette.fg }}>{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-baseline gap-1">
      <span className="text-[9.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

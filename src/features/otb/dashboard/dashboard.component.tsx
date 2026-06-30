/**
 * OTB Planning Dashboard — landing page for the module.
 *
 * Layout mirrors the isetinal_ui convention used on /setup:
 *   - Outer page = `h-full w-full flex-col`
 *   - One main card uses `flex-1 min-h-0` to fill the viewport
 *   - Header + config strip live inside the card top
 *   - Only the body section scrolls — never the whole window
 */

import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CalendarRange,
  CheckCircle2,
  Clock4,
  Eye,
  Flame,
  Layers,
  LayoutDashboard,
  Lock,
  PlayCircle,
  Plus,
  RotateCcw,
  Sparkles,
  SkipForward,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, Card, DatePicker, SpinnerCenter } from '@/components/primitives';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useDemoToday } from '@/hooks/useDemoClock';
import { resetDemoToday, setDemoToday } from '@/store/slices/demoClockSlice';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { useApiAnnualPlans } from '../useApiAnnualPlans';
import { useSetupConfig, usePeriods, useAnnualPlan, annualTotal, periodTotal } from '../useOtb';
import { fmtDate, fmtMoney } from '../utils/format';
import { daysBetween } from '../utils/periods';
import { LEAD_TIME_LOCK_BUFFER_DAYS, OTB_STATES } from '../constants';
import { StateBadge } from '../components/StateBadge';
import type { Period } from '../types';

export default function OtbDashboardPage() {
  const apiPlans = useApiAnnualPlans();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Hydrate Redux from server so a hard refresh on this URL still finds the plan.
  useEffect(() => {
    if (apiPlans.data && apiPlans.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiPlans.data));
    }
  }, [apiPlans.data, dispatch]);
  const { planId } = useParams<{ planId: string }>();
  const { isLoading, company, timeConfig, releaseConfig } = useSetupConfig();
  const leadTimeDays = timeConfig?.lead_time_days ?? 0;
  const periods = usePeriods(planId);
  const annual = useAnnualPlan(planId);
  const todayMs = useDemoToday();

  if (isLoading || apiPlans.isLoading) {
    return <SpinnerCenter />;
  }

  if (!company || !timeConfig || !releaseConfig) {
    return (
      <div className="flex h-full w-full flex-col p-1">
        <div
          className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border p-6 shadow-sm"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        >
          <Card className="max-w-md">
            <div className="flex flex-col gap-3 p-5">
              <h2 className="text-base font-semibold">OTB Setup not complete</h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Finish the OTB Setup before creating an annual plan.
              </p>
              <div>
                <Button variant="primary" onClick={() => navigate('/setup')}>
                  Go to OTB Setup
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const allocated = annualTotal(annual?.periods);
  const overallBudget = annual?.overall_budget ?? 0;
  const remaining = Math.max(0, overallBudget - allocated);
  const allocatedPct = overallBudget > 0 ? Math.min(100, Math.round((allocated / overallBudget) * 100)) : 0;
  const totalRows = annual ? Object.values(annual.periods).reduce((sum, p) => sum + p.rows.length, 0) : 0;

  // A plan only "exists" for the dashboard once the planner has submitted.
  // While it's still DRAFT, dashboard shows the empty hero so the user isn't
  // confused by partially-filled period cards leaking out of the editor.
  const hasSubmittedPlan = !!annual && annual.state !== OTB_STATES.DRAFT;
  const hasDraft = !!annual && annual.state === OTB_STATES.DRAFT;
  const draftHasContent = hasDraft && (overallBudget > 0 || totalRows > 0);

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        {/* ── Header (inside card) ───────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5 md:px-4"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/otb')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to OTB Plans"
            >
              <LayoutDashboard size={14} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                {annual?.name ?? 'OTB Planning'}
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name}
                {annual?.plan_start_iso && <> · Plan starting {fmtDate(annual.plan_start_iso)}</>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
                Today
              </span>
              <div className="w-[160px]">
                <DatePicker
                  value={new Date(todayMs)}
                  onChange={(iso) => {
                    const next = new Date(iso).getTime();
                    if (Number.isFinite(next)) dispatch(setDemoToday(next));
                  }}
                />
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw size={12} />}
              onClick={() => dispatch(resetDemoToday())}
              title="Reset to the default demo date (Feb 15, 2026)"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* ── Body: Annual plan pinned, Periods grid scrolls inside ────── */}
        <div className={`flex min-h-0 flex-1 flex-col ${hasSubmittedPlan ? 'gap-3 px-3 py-3 md:px-4' : ''}`}>
          {!hasSubmittedPlan ? (
            <EmptyHero
              onCreate={() =>
                navigate(annual ? `/otb/${annual.plan_id}/annual` : '/otb/annual')
              }
              hasDraft={draftHasContent}
              draftRowCount={totalRows}
              draftBudgetSet={overallBudget > 0}
            />
          ) : (
            <>
              {/* Annual plan summary — single-row layout with inset progress bar */}
              <div
                className="rounded-xl border px-4 py-3"
                style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  {/* Left — identity */}
                  <div className="flex min-w-0 items-center gap-2">
                    <Layers size={14} style={{ color: 'var(--color-primary)' }} />
                    <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                      Annual Plan
                    </h2>
                    <StateBadge state={annual.state} />
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      · {totalRows} rows / {periods.length} periods
                    </span>
                  </div>

                  {/* Middle — amounts */}
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                      {fmtMoney(allocated, company.base_currency)}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      of {overallBudget > 0 ? fmtMoney(overallBudget, company.base_currency) : '—'}
                    </span>
                    {overallBudget > 0 && (
                      <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
                        · {fmtMoney(remaining, company.base_currency)} left
                      </span>
                    )}
                  </div>

                  {/* Right — % chip + action */}
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                      style={{
                        background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {overallBudget > 0 ? `${allocatedPct}% allocated` : 'No budget set'}
                    </span>
                    <Button variant="secondary" size="sm" onClick={() => navigate(`/otb/${annual.plan_id}/annual`)}>
                      View Plan
                    </Button>
                  </div>
                </div>

                {/* Inset progress bar */}
                <div
                  className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-alt, #f1f5f9))' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${allocatedPct}%`,
                      background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                    }}
                  />
                </div>
              </div>

              {/* Periods grid */}
              <PeriodsGrid
                planId={annual?.plan_id ?? planId}
                periods={periods}
                currency={company.base_currency}
                todayMs={todayMs}
                leadTimeDays={leadTimeDays}
                onOpen={(periodKey) => navigate(`/otb/${annual?.plan_id ?? planId}/release/${periodKey}`)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function EmptyHero({
  onCreate,
  hasDraft,
  draftRowCount,
  draftBudgetSet,
}: {
  onCreate: () => void;
  hasDraft: boolean;
  draftRowCount: number;
  draftBudgetSet: boolean;
}) {
  const eyebrow = hasDraft ? 'Draft in progress' : 'Get started';
  const headline = hasDraft ? 'Pick up where you left off.' : 'Create your annual OTB plan.';
  const description = hasDraft
    ? `You have an unsaved draft${draftBudgetSet ? ' with a budget set' : ''}${draftRowCount > 0 ? ` and ${draftRowCount} OTB row${draftRowCount === 1 ? '' : 's'} added` : ''}. Resume to finish and submit.`
    : 'Set the overall budget, pick a plan start date, and we cascade it into per-period OTBs across brands and categories.';
  const ctaLabel = hasDraft ? 'Resume planning' : 'Create Annual Plan';

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden p-8 md:p-12 lg:p-14"
      style={{
        backgroundImage:
          // Dark gradient overlay on the left fades into the photo on the right.
          `linear-gradient(90deg, rgba(10,14,26,0.96) 0%, rgba(10,14,26,0.78) 38%, rgba(10,14,26,0.35) 68%, rgba(10,14,26,0.05) 100%), url('/assests/otbCreatrbg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Subtle brand glow blended into the dark side */}
      <span
        aria-hidden
        className="pointer-events-none absolute -left-16 top-1/4 h-64 w-64 rounded-full opacity-40 blur-3xl"
        style={{
          background: hasDraft
            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
            : 'linear-gradient(135deg, #60a5fa, #a78bfa)',
        }}
      />

      <div className="relative max-w-lg">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm"
          style={{
            borderColor: hasDraft ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.18)',
            background: hasDraft ? 'rgba(251,191,36,0.10)' : 'rgba(255,255,255,0.06)',
            color: hasDraft ? '#fcd34d' : '#93c5fd',
          }}
        >
          <Sparkles size={11} /> {eyebrow}
        </span>
        <h2 className="mt-3 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
          {headline}
        </h2>
        <p className="mt-3 max-w-md text-sm text-slate-300 md:text-base">
          {description}
        </p>

        {!hasDraft && (
          <ul className="mt-5 flex flex-col gap-2 text-sm text-slate-200">
            <FeatureBullet>Budget cascade across 12 periods</FeatureBullet>
            <FeatureBullet>Brand × Category multi-select</FeatureBullet>
            <FeatureBullet>Per-period release & re-release workflow</FeatureBullet>
          </ul>
        )}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onCreate}
            className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
            style={{
              background: hasDraft
                ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                : 'linear-gradient(135deg, #2176ff 0%, #a78bfa 100%)',
              boxShadow: hasDraft
                ? '0 8px 28px -8px rgba(245, 158, 11, 0.55)'
                : '0 8px 28px -8px rgba(96, 165, 250, 0.55)',
            }}
          >
            {hasDraft ? <ArrowRight size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}
      />
      <span>{children}</span>
    </li>
  );
}

// ── Periods grid ────────────────────────────────────────────────────────────

const GRID_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const GRID_ITEM = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] } },
};

function PeriodsGrid({
  planId,
  periods,
  currency,
  todayMs,
  leadTimeDays,
  onOpen,
}: {
  planId: string | undefined;
  periods: Period[];
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  todayMs: number;
  leadTimeDays: number;
  onOpen: (periodKey: string) => void;
}) {
  const annual = useAnnualPlan(planId);

  const lockedCount = periods.filter((p) => {
    const plan = annual?.periods[p.key];
    return plan?.state === OTB_STATES.LOCKED;
  }).length;
  const skippedCount = periods.filter((p) => {
    const plan = annual?.periods[p.key];
    return plan?.state === OTB_STATES.SKIPPED;
  }).length;
  const openCount = periods.length - lockedCount - skippedCount;

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border"
      style={{
        background: 'var(--color-surface-alt, #f8fafc)',
        borderColor: 'var(--color-divider)',
      }}
    >
      {/* Section header */}
      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
              border: '1px solid rgba(96,165,250,0.22)',
              color: 'var(--color-primary)',
            }}
          >
            <CalendarRange size={14} strokeWidth={2} />
          </span>
          <div>
            <h2 className="text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              Periods
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
              {periods.length} total in the planning horizon
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <CountChip color="#2176ff" bg="rgba(96,165,250,0.14)" label="Open" value={openCount} />
          <CountChip color="#059669" bg="rgba(16,185,129,0.14)" label="Released" value={lockedCount} />
          <CountChip color="#64748b" bg="rgba(148,163,184,0.18)" label="Skipped" value={skippedCount} />
        </div>
      </div>

      <motion.div
        variants={GRID_CONTAINER}
        initial="hidden"
        animate="visible"
        className="grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-3 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {periods.map((p) => (
          <PeriodCard
            key={p.key}
            planId={planId}
            period={p}
            currency={currency}
            todayMs={todayMs}
            leadTimeDays={leadTimeDays}
            onOpen={() => onOpen(p.key)}
          />
        ))}
      </motion.div>
    </div>
  );
}

function CountChip({ color, bg, label, value }: { color: string; bg: string; label: string; value: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: bg, color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: color }}
      />
      {label}
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}

// State-tinted color palette for the period cards.
const STATE_PALETTE: Record<string, { accent: string; iconBg: string; iconFg: string; icon: LucideIcon }> = {
  [OTB_STATES.DRAFT]: {
    accent: 'linear-gradient(180deg, #94a3b8, #64748b)',
    iconBg: 'rgba(148,163,184,0.14)',
    iconFg: '#475569',
    icon: Calendar,
  },
  [OTB_STATES.SUBMITTED]: {
    accent: 'linear-gradient(180deg, #60a5fa, #2176ff)',
    iconBg: 'rgba(96,165,250,0.16)',
    iconFg: '#2176ff',
    icon: Calendar,
  },
  [OTB_STATES.APPROVED]: {
    accent: 'linear-gradient(180deg, #60a5fa, #a78bfa)',
    iconBg: 'rgba(96,165,250,0.16)',
    iconFg: '#2176ff',
    icon: Calendar,
  },
  [OTB_STATES.IN_PROGRESS]: {
    accent: 'linear-gradient(180deg, #fbbf24, #f59e0b)',
    iconBg: 'rgba(245,158,11,0.18)',
    iconFg: '#b45309',
    icon: PlayCircle,
  },
  [OTB_STATES.LOCKED]: {
    accent: 'linear-gradient(180deg, #34d399, #059669)',
    iconBg: 'rgba(16,185,129,0.16)',
    iconFg: '#059669',
    icon: Lock,
  },
  [OTB_STATES.SKIPPED]: {
    accent: 'linear-gradient(180deg, #cbd5e1, #94a3b8)',
    iconBg: 'rgba(148,163,184,0.14)',
    iconFg: '#64748b',
    icon: SkipForward,
  },
};

function PeriodCard({
  planId,
  period,
  currency,
  todayMs,
  leadTimeDays,
  onOpen,
}: {
  planId: string | undefined;
  period: Period;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  todayMs: number;
  leadTimeDays: number;
  onOpen: () => void;
}) {
  const annual = useAnnualPlan(planId);
  const plan = annual?.periods[period.key];
  if (!plan) return null;

  const total = periodTotal(plan);
  const days = daysBetween(period.lock_deadline_iso, todayMs);
  const overdue = days < 0;
  const urgent = days >= 0 && days <= 3;

  const daysToStart = daysBetween(period.start_iso, todayMs);
  const open = plan.state !== OTB_STATES.LOCKED && plan.state !== OTB_STATES.SKIPPED;
  const insideLeadTime = open && daysToStart < leadTimeDays - LEAD_TIME_LOCK_BUFFER_DAYS;

  const canRelease =
    annual?.state === OTB_STATES.APPROVED &&
    (plan.state === OTB_STATES.APPROVED || plan.state === OTB_STATES.IN_PROGRESS);

  const palette = STATE_PALETTE[plan.state] ?? STATE_PALETTE[OTB_STATES.DRAFT];
  const Icon = palette.icon;

  // Pulse on overdue / urgent / past-lead-time cards
  const shouldPulse = open && (overdue || insideLeadTime);

  return (
    <motion.div
      variants={GRID_ITEM}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="group relative flex flex-col gap-2.5 overflow-hidden rounded-xl border p-3 transition-shadow hover:shadow-md"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: palette.iconBg, color: palette.iconFg }}
          >
            <Icon size={14} strokeWidth={2} />
            {shouldPulse && (
              <span
                aria-hidden
                className="absolute -right-0.5 -top-0.5 flex h-2 w-2"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style={{ background: 'var(--color-danger)' }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: 'var(--color-danger)' }} />
              </span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
              {period.label}
            </p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              {plan.rows.length} {plan.rows.length === 1 ? 'OTB' : 'OTBs'}
            </p>
          </div>
        </div>
        <StateBadge state={plan.state} />
      </div>

      {/* Status line */}
      <div className="text-[11px] leading-snug" style={{ color: 'var(--color-text-secondary)' }}>
        {plan.state === OTB_STATES.LOCKED ? (
          <span className="inline-flex items-center gap-1" style={{ color: '#059669' }}>
            <CheckCircle2 size={11} />
            Released {plan.locked_at ? fmtDate(new Date(plan.locked_at).toISOString()) : ''} · re-releasable
          </span>
        ) : plan.state === OTB_STATES.SKIPPED ? (
          <span className="inline-flex items-center gap-1" style={{ color: 'var(--color-text-tertiary)' }}>
            <SkipForward size={11} /> Skipped — terminal
          </span>
        ) : (
          <div className="flex flex-col gap-0.5">
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} style={{ color: 'var(--color-text-tertiary)' }} />
              Release by {fmtDate(period.lock_deadline_iso)}
            </span>
            <span
              className="inline-flex items-center gap-1 font-medium"
              style={{ color: overdue ? '#dc2626' : urgent ? '#b45309' : 'var(--color-text-secondary)' }}
            >
              {overdue ? <Flame size={11} /> : urgent ? <AlertTriangle size={11} /> : <Clock4 size={11} />}
              {overdue ? `${Math.abs(days)} days overdue` : `${days} days remaining`}
            </span>
            {insideLeadTime && (
              <span className="inline-flex items-center gap-1 font-medium" style={{ color: '#dc2626' }}>
                <AlertTriangle size={11} /> past lead time — skip only
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: amount + action */}
      <div className="mt-auto flex items-end justify-between gap-2 border-t pt-2" style={{ borderColor: 'var(--color-divider)' }}>
        <div>
          <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Period total
          </p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {fmtMoney(total, currency)}
          </p>
        </div>
        {canRelease ? (
          <Button
            variant="primary"
            size="sm"
            rightIcon={<ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />}
            onClick={onOpen}
          >
            Release / View
          </Button>
        ) : plan.state === OTB_STATES.LOCKED ? (
          <Button variant="secondary" size="sm" onClick={onOpen}>
            Re-release / View
          </Button>
        ) : plan.state === OTB_STATES.SKIPPED ? (
          <Button variant="secondary" size="sm" leftIcon={<Eye size={11} />} onClick={onOpen}>
            View
          </Button>
        ) : (
          <span className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            —
          </span>
        )}
      </div>
    </motion.div>
  );
}


/**
 * Periodic Release flow — single-card layout matching /setup, /otb and
 * /otb/annual. Outer shell: full-height card with header attached inside,
 * a sticky info strip, scrollable body holding the three sections, and a
 * footer with Skip / Release actions.
 *
 * Re-release: once a period is released (state = LOCKED), the planner can
 * still edit its values and re-release. The lead-time gate that blocks the
 * *first* release does not apply to a re-release. Only SKIPPED is terminal.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  Clock,
  Layers,
  LineChart,
  ListChecks,
  Send,
  SkipForward,
} from 'lucide-react';
import { Alert, Button, ConfirmDialog, SpinnerCenter } from '@/components/primitives';
import { toast } from '@/lib/toast';
import { useDemoToday } from '@/hooks/useDemoClock';
import {
  periodTotal,
  useAnnualPlan,
  useAppDispatch,
  usePeriods,
  useSetupConfig,
} from '../useOtb';
import { lockPeriod, skipPeriod, startRelease } from '@/store/slices/otbSlice';
import { LEAD_TIME_LOCK_BUFFER_DAYS, OTB_STATES } from '../constants';
import { fmtDate, fmtMoney, fmtPct } from '../utils/format';
import { daysBetween } from '../utils/periods';
import { getMockActuals } from '../mockData/actuals';
import { PeriodEditor } from '../components/PeriodEditor';
import { StateBadge } from '../components/StateBadge';
import { calcOtb } from '../types';
import type { Period, PeriodPlan } from '../types';
import { SalesHistorySection } from './components/sales-history/SalesHistorySection';
import { useAllValuePlans } from '@/features/value/useValue';
import { VP_STATES } from '@/features/value/constants';
// import { findBrand, findCategory } from '../mockData/brands'; // ← swapped to API
import { useBrandCategoryLookup } from '../useOtbMaster';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useApiAnnualPlans, useLockPeriod, useSkipPeriod } from '../useApiAnnualPlans';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';

const DEMO_USER = 'Demo User';

export default function OtbReleasePage() {
  const { planId, periodKey } = useParams<{ planId: string; periodKey: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { company, timeConfig, isLoading } = useSetupConfig();
  const periods = usePeriods(planId);
  const { findBrand, findCategory, isLoading: masterLoading } = useBrandCategoryLookup();
  const isAdmin = useIsAdmin();
  const annual = useAnnualPlan(planId);
  const apiPlans = useApiAnnualPlans();
  const lockMutation = useLockPeriod();
  const skipMutation = useSkipPeriod();
  // Hydrate Redux from server so a hard refresh on this URL still finds
  // the plan + its current period states.
  useEffect(() => {
    if (apiPlans.data && apiPlans.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiPlans.data));
    }
  }, [apiPlans.data, dispatch]);
  const todayMs = useDemoToday();
  const valuePlans = useAllValuePlans();
  const backToPlanDashboard = planId ? `/otb/${planId}` : '/otb';

  const period = useMemo(() => periods.find((p) => p.key === periodKey), [periods, periodKey]);
  const previousPeriod = useMemo(() => {
    if (!period) return null;
    if (period.index <= 0) return null;
    return periods[period.index - 1] ?? null;
  }, [period, periods]);
  const plan = annual && periodKey ? annual.periods[periodKey] : null;

  const [confirmLock, setConfirmLock] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);

  if (isLoading || apiPlans.isLoading || masterLoading) {
    return <SpinnerCenter />;
  }

  if (!company || !timeConfig || !period || !plan || !annual) {
    return (
      <div className="flex h-full w-full flex-col p-1">
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border shadow-sm"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Period not found.
          </p>
          <Button variant="secondary" leftIcon={<ArrowLeft size={13} />} onClick={() => navigate(backToPlanDashboard)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // SKIPPED is terminal — values cannot be edited.
  // LOCKED (released) is editable for re-release UNTIL the buyer has
  // started Value Planning on any row of this period. Once that handover
  // happens, the OTB inputs lock down so the planner can't tug values out
  // from under the buyer's plan.
  const alreadyReleased = plan.state === OTB_STATES.LOCKED;
  const anyVpStarted =
    alreadyReleased &&
    plan.rows.some((r) => valuePlans[r.otb_code] !== undefined);
  const readonly = plan.state === OTB_STATES.SKIPPED || anyVpStarted || !isAdmin;
  const days = daysBetween(period.lock_deadline_iso, todayMs);
  const overdue = days < 0;

  const daysToStart = daysBetween(period.start_iso, todayMs);
  const leadTimeThreshold = timeConfig.lead_time_days - LEAD_TIME_LOCK_BUFFER_DAYS;
  // Lead-time gate only applies to the *first* release. Once a period has
  // been released at least once, the planner can re-release at any time.
  const insideLeadTime =
    !readonly && !alreadyReleased && daysToStart < leadTimeThreshold;
  const leadTimeShortfall = leadTimeThreshold - daysToStart;

  const blockingPrior = readonly ? null : findBlockingPriorPeriod(periods, annual.periods, period);

  const handleStartRelease = () => {
    if (plan.state === OTB_STATES.APPROVED) {
      dispatch(startRelease({ plan_id: annual.plan_id, period_key: period.key }));
    }
  };

  const handleRelease = async () => {
    if (blockingPrior) {
      toast.error(`Release or skip ${blockingPrior.label} first`);
      setConfirmLock(false);
      return;
    }
    if (insideLeadTime) {
      toast.error(
        `Cannot release — ${period.label} starts in ${daysToStart} day${daysToStart === 1 ? '' : 's'}, inside the ${timeConfig.lead_time_days}-day lead time (${LEAD_TIME_LOCK_BUFFER_DAYS}-day buffer applied)`,
      );
      setConfirmLock(false);
      return;
    }
    if (plan.rows.length === 0) {
      toast.error('No rows to release');
      setConfirmLock(false);
      return;
    }
    setConfirmLock(false);
    try {
      // Server-first: send adjusted rows + state transition in one call.
      // Redux only flips after success so the page never shows a half-released state.
      await lockMutation.mutateAsync({
        planId: annual.plan_id,
        periodKey: period.key,
        rows: plan.rows,
      });
      dispatch(lockPeriod({ plan_id: annual.plan_id, period_key: period.key, locked_by: DEMO_USER }));
      toast.success(`${period.label} ${alreadyReleased ? 're-released' : 'released'}`);
      navigate(backToPlanDashboard);
    } catch (err) {
      toast.error('Release failed on server — try again');
      // eslint-disable-next-line no-console
      console.error('[release] lock error', err);
    }
  };

  const handleSkip = async () => {
    setConfirmSkip(false);
    try {
      await skipMutation.mutateAsync({ planId: annual.plan_id, periodKey: period.key });
      dispatch(skipPeriod({ plan_id: annual.plan_id, period_key: period.key }));
      toast.success(`${period.label} skipped`);
      navigate(backToPlanDashboard);
    } catch (err) {
      toast.error('Skip failed on server — try again');
      // eslint-disable-next-line no-console
      console.error('[release] skip error', err);
    }
  };

  const total = periodTotal(plan);
  const baseline = plan.baseline_rows
    ? plan.baseline_rows.reduce((s, r) => s + calcOtb(r), 0)
    : null;
  const lockDisabled = !!blockingPrior || insideLeadTime || plan.rows.length === 0;

  // Tone for the days-remaining chip
  const daysTone =
    readonly || overdue
      ? 'danger'
      : days <= 3
        ? 'warning'
        : 'neutral';

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
              onClick={() => navigate(backToPlanDashboard)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Release OTB of {formatPeriodLong(period.start_iso)}
              </h1>
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {company.name} · {fmtDate(period.start_iso)} → {fmtDate(period.end_iso)} ·{' '}
                {plan.rows.length} {plan.rows.length === 1 ? 'OTB row' : 'OTB rows'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alreadyReleased && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Layers size={13} />}
                rightIcon={<ArrowRight size={11} />}
                onClick={() => navigate(`/value/${annual.plan_id}`)}
                title="Open Value Planning — Step 2 (Buyer)"
              >
                Plan Value
              </Button>
            )}
            <StateBadge state={plan.state} />
          </div>
        </div>

        {/* ── Info strip — release-by · days · lead-time · totals ──────── */}
        <div
          className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <InfoTile
            icon={<CalendarRange size={13} />}
            label="Period"
            value={`${fmtDate(period.start_iso)} → ${fmtDate(period.end_iso)}`}
          />
          {readonly ? (
            <InfoTile
              icon={<ClipboardCheck size={13} />}
              label="Skipped"
              value={
                plan.skipped_at ? new Date(plan.skipped_at).toLocaleDateString() : 'Terminal'
              }
              tone="muted"
            />
          ) : (
            <>
              {alreadyReleased && (
                <InfoTile
                  icon={<ClipboardCheck size={13} />}
                  label="Last released"
                  value={`${plan.locked_at ? new Date(plan.locked_at).toLocaleDateString() : '—'}${
                    plan.locked_by ? ` · ${plan.locked_by}` : ''
                  }`}
                  tone="accent"
                />
              )}
              <InfoTile
                icon={<Send size={13} />}
                label={alreadyReleased ? 'Next release by' : 'Release by'}
                value={fmtDate(period.lock_deadline_iso)}
              />
              <InfoTile
                icon={<Clock size={13} />}
                label={overdue ? 'Overdue' : 'Days left'}
                value={
                  overdue
                    ? `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`
                    : `${days} day${days === 1 ? '' : 's'}`
                }
                tone={daysTone}
              />
              <InfoTile
                icon={<AlertTriangle size={13} />}
                label="Period starts"
                value={
                  daysToStart < 0
                    ? `${Math.abs(daysToStart)}d ago`
                    : `in ${daysToStart} day${daysToStart === 1 ? '' : 's'}`
                }
                tone={insideLeadTime ? 'danger' : 'muted'}
              />
            </>
          )}
          <div className="ml-auto flex flex-wrap items-stretch gap-2">
            <InfoTile
              icon={<LineChart size={13} />}
              label="Period total"
              value={fmtMoney(total, company.base_currency)}
              tone="accent"
            />
            {baseline !== null && (
              <InfoTile
                label="Baseline"
                value={fmtMoney(baseline, company.base_currency)}
                tone="muted"
              />
            )}
          </div>
        </div>

        {/* ── Body — scrollable sections ────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {blockingPrior && (
            <div className="shrink-0">
              <Alert severity="warning">
                You must release or skip <strong>{blockingPrior.label}</strong> before releasing this period.
              </Alert>
            </div>
          )}

          {insideLeadTime && (
            <div className="shrink-0">
              <Alert severity="danger">
                <strong>Lead-time window missed.</strong> {period.label} starts in{' '}
                {daysToStart < 0
                  ? `${Math.abs(daysToStart)} day${Math.abs(daysToStart) === 1 ? '' : 's'} (already started)`
                  : `${daysToStart} day${daysToStart === 1 ? '' : 's'}`}
                , past the {timeConfig.lead_time_days}-day lead time (with a {LEAD_TIME_LOCK_BUFFER_DAYS}-day buffer)
                {leadTimeShortfall > 0 && <> — short by {leadTimeShortfall} day{leadTimeShortfall === 1 ? '' : 's'}</>}
                . Orders placed now would arrive after the period begins, so this period cannot be released for the first time — skip it instead.
              </Alert>
            </div>
          )}

          {alreadyReleased && !anyVpStarted && (
            <div className="shrink-0">
              <Alert severity="info">
                <strong>{period.label} has already been released.</strong> Edits below will replace the released values when you re-release.
              </Alert>
            </div>
          )}

          {anyVpStarted && (
            <div className="shrink-0">
              <Alert severity="success">
                <strong>Handed over to Buyer.</strong> Value Planning has started — OTB values are locked. Continue at{' '}
                <button
                  type="button"
                  onClick={() => navigate(`/value/${annual.plan_id}`)}
                  className="underline hover:opacity-80"
                  style={{ color: 'inherit' }}
                >
                  Value Planning
                </button>
                .
              </Alert>
            </div>
          )}

          {/* Section 1 — Previous-period actuals */}
          <SectionShell
            icon={<ClipboardCheck size={13} />}
            title="Previous-period actuals"
            subtitle={
              previousPeriod
                ? `Showing actuals for ${previousPeriod.label} (the period before ${period.label}).`
                : `${period.label} is the first period in the planning horizon — no previous-period actuals to show.`
            }
            badge="demo-stubbed"
          >
            {previousPeriod ? (
              <ActualsTable currency={company.base_currency} periodKey={previousPeriod.key} />
            ) : (
              <div
                className="py-2 text-sm italic"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                First period — no prior actuals available.
              </div>
            )}
          </SectionShell>

          {/* Section 2 — Sales history */}
          {plan.rows.length > 0 && (
            <div className="shrink-0">
              <SalesHistorySection
                rows={plan.rows}
                periodStartIso={period.start_iso}
                periodEndIso={period.end_iso}
                currency={company.base_currency}
              />
            </div>
          )}

          {/* Section 3 — Adjust OTB values */}
          <SectionShell
            icon={<ListChecks size={13} />}
            title="Adjust OTB values"
            subtitle={
              plan.state === OTB_STATES.SKIPPED
                ? 'This period was skipped — values are read-only.'
                : anyVpStarted
                  ? 'Buyer has started Value Planning — OTB values are locked. Discard the Value Plan to re-edit.'
                  : alreadyReleased
                    ? 'Edit cells below and click Re-release to publish a new version.'
                    : plan.state === OTB_STATES.APPROVED
                      ? 'Click any cell below to adjust. Baseline values from the approved annual plan are shown for comparison.'
                      : undefined
            }
            // Adjust block hosts its own card-shaped editor; remove extra padding
            bodyPadded={false}
          >
            <div onFocusCapture={handleStartRelease}>
              <PeriodEditor
                planId={annual.plan_id}
                periodKey={period.key}
                currency={company.base_currency}
                mode={readonly ? 'readonly' : 'adjust'}
                showPicker={false}
              />
            </div>
          </SectionShell>

          {/* Section 4 — Value Plans (Step 2) — only after release */}
          {alreadyReleased && plan.rows.length > 0 && (
            <SectionShell
              icon={<Layers size={13} />}
              title="Step 2 · Value Plans"
              subtitle="Plan the MRP × cost cascade for each released OTB row. One Value Plan per row."
              badge="step 2"
            >
              <ValuePlanLauncher
                rows={plan.rows}
                onOpen={(code) => navigate(`/value/${annual.plan_id}/${code}`)}
              />
            </SectionShell>
          )}
        </div>

        {/* ── Footer — totals + Skip / Release ──────────────────────────── */}
        {!readonly && (
          <div
            className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5"
            style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <FooterStat
                label="Period total"
                value={fmtMoney(total, company.base_currency)}
                tone="accent"
              />
              {baseline !== null && (
                <FooterStat
                  label="Baseline"
                  value={fmtMoney(baseline, company.base_currency)}
                  tone="muted"
                />
              )}
              <FooterStat label="Rows" value={String(plan.rows.length)} tone="muted" />
            </div>
            <div className="flex items-center gap-2.5">
              {lockDisabled && (
                <span
                  className="inline-flex items-center gap-1 text-[11px]"
                  style={{ color: 'var(--color-warning, #b45309)' }}
                >
                  {plan.rows.length === 0
                    ? 'Add at least one row to enable Release'
                    : insideLeadTime
                      ? 'Inside lead-time window — Skip is the only option'
                      : 'Release or skip prior period first'}
                </span>
              )}
              {!alreadyReleased && (
                <Button
                  variant="secondary"
                  leftIcon={<SkipForward size={14} />}
                  onClick={() => setConfirmSkip(true)}
                  disabled={skipMutation.isPending || lockMutation.isPending}
                >
                  {skipMutation.isPending ? 'Skipping…' : 'Skip Period'}
                </Button>
              )}
              <Button
                variant="primary"
                leftIcon={<Send size={14} />}
                disabled={lockDisabled || lockMutation.isPending || skipMutation.isPending}
                onClick={() => setConfirmLock(true)}
                title={insideLeadTime ? 'Inside lead-time window — skip this period instead' : undefined}
              >
                {lockMutation.isPending
                  ? `${alreadyReleased ? 'Re-releasing' : 'Releasing'} ${period.label}…`
                  : alreadyReleased
                    ? `Re-release ${period.label}`
                    : `Release ${period.label}`}
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmLock}
        onClose={() => setConfirmLock(false)}
        onConfirm={handleRelease}
        title={alreadyReleased ? `Re-release ${period.label}?` : `Release ${period.label}?`}
        description={
          alreadyReleased
            ? 'Your edits will replace the previously released values. Downstream consumers (orders, exports, dashboards) will pick up the new version.'
            : 'These values become the released targets for the period. You can still edit and re-release later if the plan changes.'
        }
        confirmLabel={alreadyReleased ? `Re-release ${period.label}` : `Release ${period.label}`}
      />

      <ConfirmDialog
        open={confirmSkip}
        onClose={() => setConfirmSkip(false)}
        onConfirm={handleSkip}
        title={`Skip ${period.label}?`}
        description="Skipped periods are terminal — they cannot be revived later."
        confirmLabel="Skip"
        variant="danger"
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

type Tone = 'neutral' | 'muted' | 'accent' | 'warning' | 'danger';

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
      style={{
        background: palette.bg,
        borderColor: palette.border,
      }}
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
        <div
          className="mt-0.5 text-[12px] font-semibold tabular-nums"
          style={{ color: palette.fg }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function SectionShell({
  icon,
  title,
  subtitle,
  badge,
  bodyPadded = true,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: string;
  bodyPadded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="flex shrink-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      <div
        className="flex items-start justify-between gap-3 border-b px-3.5 py-2.5"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
              style={{
                background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                color: 'var(--color-primary)',
              }}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0 leading-tight">
            <h2
              className="text-[13px] font-semibold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {title}
            </h2>
            {subtitle && (
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {badge && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-divider)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className={bodyPadded ? 'p-3.5' : ''}>{children}</div>
    </section>
  );
}

function FooterStat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  const fg =
    tone === 'accent'
      ? 'var(--color-primary)'
      : tone === 'muted'
        ? 'var(--color-text-secondary)'
        : 'var(--color-text-primary)';
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.12em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums" style={{ color: fg }}>
        {value}
      </span>
    </div>
  );
}

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

function ActualsTable({ currency, periodKey }: { currency: 'INR' | 'USD' | 'EUR' | 'GBP'; periodKey: string }) {
  const actuals = useMemo(() => getMockActuals(periodKey), [periodKey]);
  const rows = [
    { label: 'Sales', planned: actuals.planned_sales, actual: actuals.actual_sales },
    { label: 'Markdowns', planned: actuals.planned_markdowns, actual: actuals.actual_markdowns },
    {
      label: 'Sell-through %',
      planned: actuals.planned_sell_through_pct,
      actual: actuals.actual_sell_through_pct,
      isPct: true,
    },
    { label: 'EOM Inventory', planned: actuals.planned_eom, actual: actuals.actual_eom },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs"
              style={{
                color: 'var(--color-text-secondary)',
                background: 'var(--color-surface-alt, #f1f5f9)',
              }}
            >
              <th className="py-2 pl-3 pr-3 font-medium">Metric</th>
              <th className="py-2 px-2 font-medium text-right">Planned</th>
              <th className="py-2 px-2 font-medium text-right">Actual</th>
              <th className="py-2 pl-2 pr-3 font-medium text-right">Variance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const variance = r.planned === 0 ? 0 : ((r.actual - r.planned) / r.planned) * 100;
              const tone =
                Math.abs(variance) >= 10
                  ? 'text-[var(--color-danger)]'
                  : Math.abs(variance) >= 5
                    ? 'text-[var(--color-warning)]'
                    : 'text-[var(--color-text-secondary)]';
              return (
                <tr
                  key={r.label}
                  className="border-b border-[var(--color-divider)] last:border-b-0"
                  style={{ background: i % 2 === 1 ? 'var(--color-surface-alt, #fafbfc)' : 'transparent' }}
                >
                  <td className="py-2 pl-3 pr-3">{r.label}</td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {r.isPct ? `${r.planned}%` : fmtMoney(r.planned, currency)}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    {r.isPct ? `${r.actual}%` : fmtMoney(r.actual, currency)}
                  </td>
                  <td className={`py-2 pl-2 pr-3 text-right tabular-nums ${tone}`}>{fmtPct(variance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div
        className="rounded-md border px-3 py-2 text-xs italic"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {actuals.insight}
      </div>
    </div>
  );
}

/** "2026-04-01" → "April 2026". Used for the release-page H1 to read more
 *  naturally than the short `period.label` ("Apr 2026"). */
function formatPeriodLong(startIso: string): string {
  const d = new Date(startIso);
  return `${d.toLocaleString('en-US', { month: 'long' })} ${d.getFullYear()}`;
}

/**
 * Mini-launcher rendered inside the release page once a period is locked.
 * Lists every row + its Value-Plan status with a single CTA per row. This
 * is the temporary entry point into Step 2 until the /value dashboard
 * ships in the next step.
 */
function ValuePlanLauncher({
  rows,
  onOpen,
}: {
  rows: import('../types').OtbRow[];
  onOpen: (otbCode: string) => void;
}) {
  const valuePlans = useAllValuePlans();
  const { findBrand, findCategory } = useBrandCategoryLookup();
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((row) => {
        const brand = findBrand(row.brand_uuid);
        const cat = findCategory(row.category_uuid);
        const vp = valuePlans[row.otb_code];
        const status = vp?.state ?? null;
        const cta =
          status === VP_STATES.APPROVED ? 'Edit' : status === VP_STATES.DRAFT ? 'Continue' : 'Plan';
        const chipBg =
          status === VP_STATES.APPROVED
            ? 'rgba(16,185,129,0.14)'
            : status === VP_STATES.DRAFT
              ? 'rgba(245,158,11,0.14)'
              : 'var(--color-surface-alt, #f1f5f9)';
        const chipFg =
          status === VP_STATES.APPROVED
            ? '#047857'
            : status === VP_STATES.DRAFT
              ? '#b45309'
              : 'var(--color-text-tertiary)';
        return (
          <div
            key={row.row_id}
            className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
            style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
          >
            <div className="min-w-0">
              <div
                className="truncate font-mono text-[10.5px] tabular-nums"
                style={{ color: 'var(--color-text-tertiary)' }}
                title={row.otb_code}
              >
                {row.otb_code}
              </div>
              <div className="mt-0.5 truncate text-[12px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {brand?.name ?? '—'} · {cat?.name ?? '—'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: chipBg, color: chipFg }}
              >
                {status ?? 'todo'}
              </span>
              <Button
                size="sm"
                variant={status === VP_STATES.APPROVED ? 'secondary' : 'primary'}
                rightIcon={<ArrowRight size={11} />}
                onClick={() => onOpen(row.otb_code)}
              >
                {cta}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function findBlockingPriorPeriod(
  periods: Period[],
  plans: Record<string, PeriodPlan>,
  current: Period,
): Period | null {
  for (const p of periods) {
    if (p.index >= current.index) break;
    const plan = plans[p.key];
    if (!plan) continue;
    if (plan.state !== OTB_STATES.LOCKED && plan.state !== OTB_STATES.SKIPPED) {
      return p;
    }
  }
  return null;
}

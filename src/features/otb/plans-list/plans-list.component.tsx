/**
 * OTB Plans list — top-level landing for `/otb`. Lists every annual plan
 * in the store with summary stats, lets the user open one, or create a
 * new one. Drill-down goes to `/otb/:planId` (the existing dashboard).
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  Lock,
  PackageSearch,
  Plus,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trash2,
  Wallet,
} from 'lucide-react';
import { Button, ConfirmDialog, DatePicker, SpinnerCenter } from '@/components/primitives';
import { useDemoToday } from '@/hooks/useDemoClock';
import { resetDemoToday, setDemoToday } from '@/store/slices/demoClockSlice';
import { fmtMoney, fmtMoneyCompact, fmtDate } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import { OTB_STATES } from '../constants';
import { useAllPlans, useAppDispatch, useSetupConfig } from '../useOtb';
import { annualTotal } from '../useOtb';
import { hydrateAnnualPlans, resetAnnualPlan } from '@/store/slices/otbSlice';
import { StateBadge } from '../components/StateBadge';
import type { AnnualPlan } from '../types';
import { useApiAnnualPlans, useDeleteAnnualPlan } from '../useApiAnnualPlans';
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function OtbPlansListPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { company, isLoading } = useSetupConfig();
  const plans = useAllPlans();
  const todayMs = useDemoToday();
  const apiPlans = useApiAnnualPlans();
  const deletePlan = useDeleteAnnualPlan();
  const isAdmin = useIsAdmin();
  const [pendingDeletion, setPendingDeletion] = useState<AnnualPlan | null>(null);

  const handleDelete = async (plan: AnnualPlan) => {
    const id = plan.plan_id;
    dispatch(resetAnnualPlan({ plan_id: id }));
    try {
      await deletePlan.mutateAsync(id);
    } catch (err) {
      // Plan may not exist on server (purely-local draft) — silently ignore.
      // eslint-disable-next-line no-console
      console.warn('[plans-list] delete on server skipped:', err);
    }
    setPendingDeletion(null);
  };

  // Sweep zombie drafts on mount — plans created accidentally by visiting
  // `/otb/annual` and backing out before entering anything. A draft with
  // no budget and no rows carries no user intent, so it's safe to remove.
  useEffect(() => {
    for (const p of plans) {
      if (p.state !== OTB_STATES.DRAFT) continue;
      if (p.overall_budget > 0) continue;
      const hasRows = Object.values(p.periods).some((pp) => pp.rows.length > 0);
      if (!hasRows) dispatch(resetAnnualPlan({ plan_id: p.plan_id }));
    }
    // Run only on first mount — the list re-renders after each dispatch
    // and we don't want to sweep plans the user actively creates after
    // visiting this page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydrate Redux from server whenever the API list refreshes — so a draft
  // saved in a previous session (different browser, cleared localStorage,
  // another device) loads transparently. Local-only plans are preserved.
  useEffect(() => {
    if (apiPlans.data && apiPlans.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiPlans.data));
    }
  }, [apiPlans.data, dispatch]);

  // ── Aggregates ─────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const total = plans.length;
    let draft = 0;
    let approved = 0;
    let complete = 0;
    for (const p of plans) {
      const periodList = Object.values(p.periods);
      const closed = periodList.filter(
        (pp) => pp.state === OTB_STATES.LOCKED || pp.state === OTB_STATES.SKIPPED,
      ).length;
      const isComplete = periodList.length > 0 && closed === periodList.length;
      if (p.state === OTB_STATES.DRAFT) draft += 1;
      else if (isComplete) complete += 1;
      else approved += 1;
    }
    return { total, draft, approved, complete };
  }, [plans]);

  if (isLoading || apiPlans.isLoading || !company) {
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
              <CalendarRange size={14} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                OTB Plans
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name} · pick a year to plan or release
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Demo-clock control — lets the user pretend "today" is some past
                or future date, so back-dated plans can be released and
                released-period statuses look authentic during demos. */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
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
              title="Reset to the default demo date"
            >
              Reset
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={13} />}
                onClick={() => navigate('/otb/annual')}
              >
                New plan
              </Button>
            )}
          </div>
        </div>

        {/* ── Info strip ─────────────────────────────────────────────────── */}
        {/* <div
          className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <InfoTile
            icon={<PackageSearch size={13} />}
            label="Plans"
            value={String(totals.total)}
            tone="accent"
          />
          <InfoTile
            icon={<CircleDashed size={13} />}
            label="Draft"
            value={String(totals.draft)}
            tone={totals.draft > 0 ? 'warning' : 'muted'}
          />
          <InfoTile
            icon={<CalendarRange size={13} />}
            label="In progress"
            value={String(totals.approved)}
            tone={totals.approved > 0 ? 'success' : 'muted'}
          />
          <InfoTile
            icon={<CheckCircle2 size={13} />}
            label="Complete"
            value={String(totals.complete)}
            tone={totals.complete > 0 ? 'success' : 'muted'}
          />
          <InfoTile
            icon={<PackageSearch size={13} />}
            label="On server"
            value={
              apiPlans.isLoading
                ? '…'
                : apiPlans.error
                  ? 'err'
                  : String(apiPlans.data?.length ?? 0)
            }
            tone="muted"
          />
        </div> */}

        {/* ── Body ──────────────────────────────────────────────────────── */}
        {/* When EmptyHero is the body, drop the surrounding padding so the
            wallpaper sits flush against the card border (edge-to-edge feel). */}
        <div
          className={
            totals.total === 0 && !apiPlans.isLoading && !apiPlans.error
              ? 'flex min-h-0 flex-1 flex-col overflow-y-auto'
              : 'flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4'
          }
        >
          {apiPlans.isLoading ? (
            <div className="flex min-h-[240px] flex-1 items-center justify-center">
              <SpinnerCenter label="Loading plans…" />
            </div>
          ) : apiPlans.error ? (
            <div
              className="flex min-h-[240px] flex-1 items-center justify-center text-sm"
              style={{ color: 'var(--color-danger, #dc2626)' }}
            >
              Couldn't load plans from server. Check your connection and refresh.
            </div>
          ) : totals.total === 0 ? (
            <EmptyHero
              onCreate={isAdmin ? () => navigate('/otb/annual') : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {plans.map((p) => (
                <PlanCard
                  key={p.plan_id}
                  plan={p}
                  currency={company.base_currency}
                  onOpen={() => navigate(`/otb/${p.plan_id}`)}
                  onDelete={isAdmin ? () => setPendingDeletion(p) : undefined}
                />
              ))}
              {isAdmin && <CreateCard onCreate={() => navigate('/otb/annual')} />}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeletion !== null}
        onClose={() => setPendingDeletion(null)}
        onConfirm={() => pendingDeletion && handleDelete(pendingDeletion)}
        title={`Delete plan ${pendingDeletion?.name ?? ''}?`}
        description={
          'This permanently wipes the plan, all its periods, and every OTB row. ' +
          'You can recreate the same year afterwards for a fresh demo.'
        }
        confirmLabel="Delete"
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PlanCard
// ══════════════════════════════════════════════════════════════════════════

function PlanCard({
  plan,
  currency,
  onOpen,
  onDelete,
}: {
  plan: AnnualPlan;
  currency: BaseCurrency;
  onOpen: () => void;
  onDelete?: () => void;
}) {
  const periodList = Object.values(plan.periods);
  const totalPeriods = periodList.length;
  const locked = periodList.filter((p) => p.state === OTB_STATES.LOCKED).length;
  const skipped = periodList.filter((p) => p.state === OTB_STATES.SKIPPED).length;
  const closed = locked + skipped;
  const progressPct = totalPeriods === 0 ? 0 : Math.round((closed / totalPeriods) * 100);

  const allocated = annualTotal(plan.periods);
  const isComplete = totalPeriods > 0 && closed === totalPeriods;
  const isDraft = plan.state === OTB_STATES.DRAFT;

  return (
    <div
      className="group flex flex-col overflow-hidden rounded-xl border transition-shadow hover:shadow-md"
      style={{
        borderColor: isComplete ? 'rgba(16,185,129,0.45)' : 'var(--color-divider)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Soft-blue header — year, status, delete */}
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
        <div className="flex shrink-0 items-center gap-1.5">
          <StateBadge state={plan.state} />
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--color-text-tertiary)] transition-colors hover:bg-[rgba(239,68,68,0.1)] hover:text-[var(--color-danger,#dc2626)]"
              title={`Delete ${plan.name}`}
              aria-label={`Delete ${plan.name}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Body — date range + OTB id (highlighted) + progress + budget */}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div>
          <p className="text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
            {fmtDate(plan.plan_start_iso)} → {fmtDate(plan.plan_end_iso)}
          </p>
          {/* Plan id chip — highlighted so the deterministic OTB key is
              scannable at a glance (it's the value used in URLs / API calls). */}
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

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
          <span>Release progress</span>
          <span className="tabular-nums">
            {closed} / {totalPeriods}
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
        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-[10px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
          <span className="inline-flex items-center gap-1">
            <Lock size={9} style={{ color: '#047857' }} /> {locked} released
          </span>
          {skipped > 0 && (
            <span className="inline-flex items-center gap-1">
              <SkipForward size={9} /> {skipped} skipped
            </span>
          )}
        </div>
      </div>

      {/* Budget + open */}
      <div
        className="mt-auto flex items-end justify-between gap-2 border-t pt-2"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            <Wallet size={9} /> {isDraft ? 'Budget' : 'Allocated'}
          </div>
          <div className="mt-0.5 text-sm font-bold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {isDraft && plan.overall_budget > 0
              ? fmtMoney(plan.overall_budget, currency)
              : allocated > 0
                ? fmtMoneyCompact(allocated, currency)
                : '—'}
          </div>
        </div>
        <Button
          variant={isComplete ? 'secondary' : 'primary'}
          size="sm"
          rightIcon={<ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />}
          onClick={onOpen}
        >
          Open
        </Button>
      </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CreateCard — sits at the end of the plan grid as a primary call-to-action
// ══════════════════════════════════════════════════════════════════════════

function CreateCard({ onCreate }: { onCreate: () => void }) {
  return (
    <button
      type="button"
      onClick={onCreate}
      className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(96,165,250,0.16), rgba(167,139,250,0.16))',
          color: 'var(--color-primary)',
        }}
      >
        <Plus size={18} strokeWidth={2.2} />
      </span>
      <div className="text-center">
        <div className="text-[13px] font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Create new plan
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: 'var(--color-text-tertiary)' }}>
          Start an OTB cycle for a new fiscal year
        </div>
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// EmptyHero — shown when there are no plans at all
// ══════════════════════════════════════════════════════════════════════════

function EmptyHero({ onCreate }: { onCreate?: () => void }) {
  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden p-8 md:p-12 lg:p-14"
      style={{
        backgroundImage:
          // Dark gradient overlay on the left fades into the photo on the right
          // — matches the empty-hero treatment used on the OTB dashboard.
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
        style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)' }}
      />

      <div className="relative max-w-lg">
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm"
          style={{
            borderColor: 'rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.06)',
            color: '#93c5fd',
          }}
        >
          <Sparkles size={11} /> Get started
        </span>
        <h2 className="mt-3 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
          Create your annual OTB plan.
        </h2>
        <p className="mt-3 max-w-md text-sm text-slate-300 md:text-base">
          Each plan covers one fiscal period (or any custom date window). Pick a year and start
          date, set the overall budget, then release periods over the year as the cycle rolls
          out.
        </p>

        <ul className="mt-5 flex flex-col gap-2 text-sm text-slate-200">
          <FeatureBullet>Brand × Category cascade across 12 periods</FeatureBullet>
          <FeatureBullet>Per-period release &amp; re-release workflow</FeatureBullet>
        </ul>

        {onCreate ? (
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreate}
              className="group inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #2176ff 0%, #a78bfa 100%)',
                boxShadow: '0 8px 28px -8px rgba(96, 165, 250, 0.55)',
              }}
            >
              <Plus size={14} strokeWidth={2} />
              Create your first plan
            </button>
          </div>
        ) : (
          <p className="mt-7 text-sm text-slate-400">
            No plans yet — ask your admin to create one.
          </p>
        )}
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

// ── Info tile (shared shape) ───────────────────────────────────────────────

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
      className="flex min-w-[120px] items-center gap-2 rounded-lg border px-2.5 py-1.5"
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

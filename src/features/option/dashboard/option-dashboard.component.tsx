/**
 * Option Plan dashboard — `/option/:planId`. Shows every released-and-value-
 * approved OTB in the plan, grouped by period (month). The per-row CTA
 * adapts to the current Option Plan state:
 *
 *   no OP yet                 → Start
 *   DRAFT                     → Continue
 *   REVISIONS_REQUESTED       → Revise
 *   SUBMITTED                 → Review (designer entry-point)
 *   APPROVED                  → View
 *
 * Per-period header surfaces month-level progress (eligible / approved) and
 * a "month-ready" badge if every eligible OTB has an APPROVED OP — that's
 * the gate Phase 5 will use to unlock Article Creation downstream.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  ClipboardCheck,
  Layers,
  ListChecks,
  Lock,
  MessageSquare,
  PackageCheck,
  PenLine,
  PlayCircle,
  RotateCcw,
  ScrollText,
  Search,
} from 'lucide-react';
import { Button, SpinnerCenter } from '@/components/primitives';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAnnualPlan, usePeriods, useSetupConfig } from '@/features/otb/useOtb';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { fmtMoneyCompact } from '@/features/otb/utils/format';
import { useApiValuePlansForPlan } from '@/features/value/useApiValuePlans';
import { hydrateValuePlans } from '@/store/slices/valuePlanSlice';
import { useAllValuePlans } from '@/features/value/useValue';
import { VP_STATES } from '@/features/value/constants';
import { useApiOptionPlansForPlan } from '../useApiOptionPlans';
import { hydrateOptionPlans } from '@/store/slices/optionPlanSlice';
import { OP_STATES, type OpState } from '../constants';
import { StateBadge } from '../components/StateBadge';
import type { OptionPlan } from '../types';

export default function OptionDashboardPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { company, isLoading: setupLoading } = useSetupConfig();
  const annualQ = useApiAnnualPlans();
  const vpQ = useApiValuePlansForPlan(planId);
  const opQ = useApiOptionPlansForPlan(planId);
  const { findBrand, findCategory, isLoading: masterLoading } = useBrandCategoryLookup();

  useEffect(() => {
    if (annualQ.data) dispatch(hydrateAnnualPlans(annualQ.data));
  }, [annualQ.data, dispatch]);
  useEffect(() => {
    if (vpQ.data) dispatch(hydrateValuePlans(vpQ.data));
  }, [vpQ.data, dispatch]);
  useEffect(() => {
    if (opQ.data) dispatch(hydrateOptionPlans(opQ.data));
  }, [opQ.data, dispatch]);

  const annual = useAnnualPlan(planId);
  const periods = usePeriods(planId);
  const vps = useAllValuePlans();

  const opsByOtb = useMemo(() => {
    const m = new Map<string, OptionPlan>();
    (opQ.data ?? []).forEach((op) => m.set(op.otb_code, op));
    return m;
  }, [opQ.data]);

  if (setupLoading || annualQ.isLoading || vpQ.isLoading || opQ.isLoading || masterLoading || !company) {
    return <SpinnerCenter />;
  }

  if (!annual) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="rounded-xl border p-6 text-center" style={{ borderColor: 'var(--color-divider)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Annual plan not found.</p>
          <Button variant="secondary" leftIcon={<ArrowLeft size={13} />} onClick={() => navigate('/option')} className="mt-3">
            Back to Option Planning
          </Button>
        </div>
      </div>
    );
  }

  // Build per-period sections — surface every released OTB so the buyer can
  // see what's blocking option planning, even when the Value Plan is still
  // pending. Month-gate (all VPs APPROVED for the period) is enforced at
  // the section level, not by row filtering.
  const sections: PeriodSection[] = periods
    .map((p) => buildSection(p.key, p.label, annual, vps, opsByOtb, findBrand, findCategory))
    .filter((s) => s.rows.length > 0);

  const totals = sections.reduce(
    (acc, s) => {
      const monthReady = s.rows.length > 0 && s.rows.every((r) => r.vp_approved);
      return {
        released:    acc.released    + s.rows.length,
        vpPending:   acc.vpPending   + s.rows.filter((r) => !r.vp_approved).length,
        periodsLocked: acc.periodsLocked + (monthReady ? 0 : 1),
        started:     acc.started     + s.rows.filter((r) => r.op).length,
        review:      acc.review      + s.rows.filter((r) => r.op?.state === OP_STATES.SUBMITTED).length,
        approved:    acc.approved    + s.rows.filter((r) => r.op?.state === OP_STATES.APPROVED).length,
        revisions:   acc.revisions   + s.rows.filter((r) => r.op?.state === OP_STATES.REVISIONS_REQUESTED).length,
      };
    },
    { released: 0, vpPending: 0, periodsLocked: 0, started: 0, review: 0, approved: 0, revisions: 0 },
  );

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
            <button
              type="button"
              onClick={() => navigate('/option')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to Option Planning"
            >
              <ArrowLeft size={14} />
            </button>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(244,114,182,0.18))',
                border: '1px solid rgba(167,139,250,0.22)',
                color: 'var(--color-primary)',
              }}>
              <PackageCheck size={14} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                Option Planning · {annual.name}
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name} · Step 3 · {sections.length} period{sections.length === 1 ? '' : 's'} released
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<ListChecks size={13} />}
            onClick={() => navigate('/option/all')}>
            All Option Plans
          </Button>
        </div>

        {/* Info strip */}
        <div className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
          style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface-alt, #f8fafc)' }}>
          <InfoTile icon={<Layers size={13} />}        label="Released OTBs" value={String(totals.released)} tone="accent" />
          {totals.vpPending > 0 && (
            <InfoTile icon={<AlertTriangle size={13} />} label="Value pending" value={String(totals.vpPending)} tone="warning" />
          )}
          {totals.periodsLocked > 0 && (
            <InfoTile icon={<Lock size={13} />}          label="Periods locked" value={String(totals.periodsLocked)} tone="warning" />
          )}
          <InfoTile icon={<ScrollText size={13} />}    label="Started"  value={String(totals.started)}  tone={totals.started > 0 ? 'info' : 'muted'} />
          {totals.revisions > 0 && (
            <InfoTile icon={<RotateCcw size={13} />}    label="Revisions" value={String(totals.revisions)} tone="warning" />
          )}
          <InfoTile icon={<CircleDashed size={13} />}  label="In review" value={String(totals.review)} tone={totals.review > 0 ? 'warning' : 'muted'} />
          <InfoTile icon={<CheckCircle2 size={13} />}  label="Approved" value={String(totals.approved)} tone={totals.approved > 0 ? 'success' : 'muted'} />
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {sections.length === 0 ? (
            <EmptyHero onGoValue={() => navigate(`/value/${planId}`)} />
          ) : (
            sections.map((s) => (
              <PeriodSectionView
                key={s.key}
                section={s}
                currency={company.base_currency}
                onOpenRow={(otbCode) => navigate(`/option/${planId}/${otbCode}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Per-period section construction ────────────────────────────────────────

interface DashboardRow {
  otb_code: string;
  brand_name: string;
  category_name: string;
  budget: number;
  /** Effective VP state for the row — drives the "Approve Value first" gate. */
  vp_state: string | null;
  vp_approved: boolean;
  op: OptionPlan | null;
  is_stale: boolean;
}

interface PeriodSection {
  key: string;
  label: string;
  rows: DashboardRow[];
}

function buildSection(
  key: string, label: string,
  annual: NonNullable<ReturnType<typeof useAnnualPlan>>,
  vps: Record<string, ValuePlanLike>,
  opsByOtb: Map<string, OptionPlan>,
  findBrand: (u: string) => { name?: string } | undefined,
  findCategory: (u: string) => { name?: string } | undefined,
): PeriodSection {
  const period = annual.periods[key];
  const rows: DashboardRow[] = [];
  if (!period) return { key, label, rows };
  for (const r of period.rows) {
    const vp = vps[r.otb_code] ?? null;
    const op = opsByOtb.get(r.otb_code) ?? null;
    const liveBudget =
      r.planned_sales + r.markdowns + r.eom_inventory - r.bom_inventory - r.on_order;
    const vpApproved = vp?.state === VP_STATES.APPROVED;
    rows.push({
      otb_code: r.otb_code,
      brand_name: findBrand(r.brand_uuid)?.name ?? r.brand_uuid,
      category_name: findCategory(r.category_uuid)?.name ?? r.category_uuid,
      budget: liveBudget,
      vp_state: vp?.state ?? null,
      vp_approved: vpApproved,
      op,
      is_stale: op != null && liveBudget !== (op.budget_snapshot ?? vp?.budget_snapshot ?? 0),
    });
  }
  return { key, label, rows };
}

// Loose typing — we only touch a few VP fields here.
interface ValuePlanLike {
  state: string;
  budget_snapshot: number;
}

// ── Period section view ────────────────────────────────────────────────────

function PeriodSectionView({
  section, currency, onOpenRow,
}: {
  section: PeriodSection;
  currency: import('@/features/setup/types').BaseCurrency;
  onOpenRow: (otbCode: string) => void;
}) {
  const released = section.rows.length;
  const vpPending = section.rows.filter((r) => !r.vp_approved).length;
  const vpApprovedCount = released - vpPending;
  const opApproved = section.rows.filter((r) => r.op?.state === OP_STATES.APPROVED).length;
  const opSubmitted = section.rows.filter((r) => r.op?.state === OP_STATES.SUBMITTED).length;

  /** Month-gate: every released OTB must have an APPROVED Value Plan before
   *  option planning unlocks for the period. */
  const monthReady = released > 0 && vpPending === 0;
  const monthComplete = monthReady && opApproved === released;

  // Solid Tailwind colours — no CSS-var indirection. The state palette drives
  // the right-side pill only; the row keeps a neutral border so it doesn't
  // compete visually with the pill for status signalling.
  const pillClass = monthComplete ? 'bg-emerald-100 text-emerald-700'
    : monthReady ? 'bg-blue-100 text-blue-700'
    : 'bg-amber-100 text-amber-800';
  const pillIcon = monthComplete ? <CheckCircle2 size={12} />
    : monthReady ? <ClipboardCheck size={12} />
    : <Lock size={12} />;
  const pillLabel = monthComplete ? 'Complete'
    : monthReady ? 'Ready'
    : `Locked · ${vpPending} pending`;

  // Collapsed by default — page lists 12 periods and the user can expand the
  // one they care about. Drives the chevron icon + body visibility below.
  const [open, setOpen] = useState(false);

  return (
    <section className="flex-none shrink-0 rounded-lg border border-slate-200 bg-white">
      {/* Header strip — clickable to toggle expand/collapse */}
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
        <span className={`inline-flex h-8 min-w-[48px] items-center justify-center rounded-md text-xs font-bold uppercase tracking-wider ${pillClass}`}>
          {section.label.replace(/\s+\d{4}$/, '')}
        </span>
        <h3 className="text-sm font-semibold text-slate-900">
          {section.label}
        </h3>

        <div className="flex flex-1 flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="rounded bg-slate-100 px-2 py-0.5">
            {released} categor{released === 1 ? 'y' : 'ies'}
          </span>
          <span className={`rounded px-2 py-0.5 ${vpApprovedCount === released ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            Value approved <strong className="tabular-nums">{vpApprovedCount}/{released}</strong>
          </span>
          <span className={`rounded px-2 py-0.5 ${opApproved === released && monthReady ? 'bg-emerald-50 text-emerald-700' : monthReady ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
            Option approved <strong className="tabular-nums">{opApproved}/{released}</strong>
          </span>
          {opSubmitted > 0 && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700">
              {opSubmitted} in review
            </span>
          )}
        </div>

        <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${pillClass}`}>
          {pillIcon}
          {pillLabel}
        </span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>

      {/* Body — only when expanded */}
      {open && (
        <>
          {!monthReady && (
            <div className="flex items-start gap-2 border-b border-slate-200 bg-amber-50 px-4 py-2 text-xs text-amber-900">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>
                Approve {vpPending} more Value Plan{vpPending === 1 ? '' : 's'} for
                <strong> {section.label}</strong> to unlock option planning.
              </span>
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Brand · Category</th>
                <th className="px-4 py-2 text-left font-semibold">OTB Code</th>
                <th className="px-4 py-2 text-right font-semibold">Budget</th>
                <th className="px-4 py-2 text-left font-semibold">Value Planning Status</th>
                <th className="px-4 py-2 text-left font-semibold">Option Planning Status</th>
                <th className="px-4 py-2 text-right font-semibold">Round</th>
                <th className="px-4 py-2 text-right font-semibold">Comments</th>
                <th className="px-4 py-2 text-right font-semibold" />
              </tr>
            </thead>
            <tbody>
              {section.rows.map((r) => (
                <RowView
                  key={r.otb_code}
                  row={r}
                  currency={currency}
                  monthReady={monthReady}
                  onOpen={() => onOpenRow(r.otb_code)}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

function RowView({
  row, currency, monthReady, onOpen,
}: {
  row: DashboardRow;
  currency: import('@/features/setup/types').BaseCurrency;
  monthReady: boolean;
  onOpen: () => void;
}) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-2 text-slate-900">
        <div className="font-medium">{row.brand_name}</div>
        <div className="text-xs text-slate-500">{row.category_name}</div>
      </td>
      <td className="px-4 py-2 font-mono text-xs tabular-nums text-slate-600">
        {row.otb_code}
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-slate-900">
        {fmtMoneyCompact(row.budget, currency)}
        {row.is_stale && <div className="text-[10px] text-amber-700">stale snapshot</div>}
      </td>
      <td className="px-4 py-2">
        <ValueStatePill state={row.vp_state} approved={row.vp_approved} />
      </td>
      <td className="px-4 py-2">
        {row.op ? <StateBadge state={row.op.state} /> : <NotStartedPill />}
      </td>
      <td className="px-4 py-2 text-right tabular-nums text-slate-600">
        {row.op ? row.op.current_round_no : '—'}
      </td>
      <td className="px-4 py-2 text-right">
        {row.op && row.op.comments.length > 0 ? (
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
            <MessageSquare size={11} />
            {row.op.comments.length}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        <RowCta row={row} monthReady={monthReady} onOpen={onOpen} />
      </td>
    </tr>
  );
}

function RowCta({
  row, onOpen,
}: {
  row: DashboardRow;
  /** Kept on the prop bag for caller compatibility; no longer used in the
   *  CTA logic. The old "all VPs in the period must be APPROVED" month
   *  gate has been dropped — each row is now actionable as soon as its
   *  own VP is APPROVED, independent of siblings. */
  monthReady: boolean;
  onOpen: () => void;
}) {
  // Row's own VP not approved → no action; the row's state column already
  // explains why. Buyer navigates to Value Planning via the sidebar.
  if (!row.vp_approved) {
    return <span className="text-xs text-slate-400">—</span>;
  }
  const cta = optionCta(row.op?.state);
  return (
    <Button size="sm" variant={cta.variant} leftIcon={cta.icon} rightIcon={<ArrowRight size={11} />}
      onClick={onOpen}>
      {cta.label}
    </Button>
  );
}

function ValueStatePill({ state, approved }: { state: string | null; approved: boolean }) {
  if (approved) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider"
        style={{ background: 'rgba(16,185,129,0.14)', color: '#047857' }}>
        <CheckCircle2 size={10} /> Approved
      </span>
    );
  }
  if (!state) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px]"
        style={{
          background: 'rgba(245,158,11,0.16)', color: '#b45309',
          border: '1px solid rgba(245,158,11,0.4)',
        }}>
        <CircleDashed size={10} /> Not planned
      </span>
    );
  }
  const label = state === 'submitted' ? 'Submitted' : state === 'draft' ? 'Draft' : state;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px]"
      style={{
        background: 'rgba(245,158,11,0.16)', color: '#b45309',
        border: '1px solid rgba(245,158,11,0.4)',
      }}>
      <AlertTriangle size={10} /> {label}
    </span>
  );
}

function NotStartedPill() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px]"
      style={{
        background: 'var(--color-surface-alt, #f1f5f9)',
        color: 'var(--color-text-tertiary)',
        border: '1px solid var(--color-divider)',
      }}>
      <CircleDashed size={10} /> Not started
    </span>
  );
}

function optionCta(state: OpState | undefined): {
  label: string;
  variant: 'primary' | 'secondary';
  icon: React.ReactNode;
} {
  if (!state) return { label: 'Start',    variant: 'primary',   icon: <PlayCircle size={11} /> };
  switch (state) {
    case OP_STATES.DRAFT:               return { label: 'Continue', variant: 'primary',   icon: <PenLine size={11} /> };
    case OP_STATES.REVISIONS_REQUESTED: return { label: 'Revise',   variant: 'primary',   icon: <RotateCcw size={11} /> };
    case OP_STATES.SUBMITTED:           return { label: 'Review',   variant: 'primary',   icon: <Search size={11} /> };
    case OP_STATES.APPROVED:            return { label: 'View',     variant: 'secondary', icon: <CheckCircle2 size={11} /> };
  }
}

function EmptyHero({ onGoValue }: { onGoValue: () => void }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-6 text-center"
      style={{ borderColor: 'var(--color-divider)' }}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(244,114,182,0.18))',
          color: 'var(--color-primary)',
        }}>
        <PackageCheck size={20} strokeWidth={1.8} />
      </span>
      <div className="max-w-md">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Nothing eligible yet
        </h3>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Option Plans need an APPROVED Value Plan to start. Approve at least one Value Plan for this annual plan first.
        </p>
      </div>
      <Button variant="primary" rightIcon={<ArrowRight size={13} />} onClick={onGoValue}>
        Go to Value Planning
      </Button>
    </div>
  );
}

// ── Presentational helpers (re-defined locally to keep the file standalone) ─

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

/**
 * Value Plan editor — single-card layout matching /setup, /otb,
 * /otb/annual and /otb/release.
 *
 *   ┌── Header (back · title · status badge) ─────────────────────────┐
 *   │── Info strip (budget · allocated · remaining · margin · units · revenue)│
 *   │── Body                                                          │
 *   │   ├── Optional staleness / over-budget alerts                  │
 *   │   ├── Allocation bar (100% stacked, color-coded by band)       │
 *   │   └── 4 band cards (entry/core/upper/statement)                │
 *   │── Footer (Σ % · Reset · Save Draft · Submit)                    │
 *   └─────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Coins,
  LineChart,
  Package,
  RotateCcw,
  Save,
  Send,
  Table as TableIcon,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Alert, Button, Dialog, NumberInput, Slider, SpinnerCenter } from '@/components/primitives';
import { useDemoToday } from '@/hooks/useDemoClock';
import { FashionCalendar } from '@/components/calendar';
import { AllValuePlansTable } from '../all-plans/AllValuePlansTable';
import { toast } from '@/lib/toast';
import { usePeriods, useSetupConfig } from '@/features/otb/useOtb';
// import { findCategory } from '@/features/otb/mockData/brands'; // ← swapped to API
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { fmtMoney, fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { MrpBand } from '@/features/otb/types';

import { StateBadge } from '../components/StateBadge';
import {
  useAppDispatch,
  useCurrentOtbBudget,
  useReleasedOtbRows,
  useValuePlan,
} from '../useValue';
import {
  initValuePlan,
  setAllBands,
  setBandCost,
  setBandMrp,
  setBandPct,
  syncValuePlanBudget,
  upsertValuePlan,
} from '@/store/slices/valuePlanSlice';
import { useApiValuePlansForPlan, useSaveValuePlan } from '../useApiValuePlans';
import { useApiOptionPlan } from '@/features/option/useApiOptionPlans';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { useCanEditValuePlan } from '@/hooks/useCanEditValuePlan';
import { validateHard } from '../utils/hardValidation';
import { SOFT_LIMITS, TOTAL_PCT, VP_STATES } from '../constants';
import {
  bandBudget,
  bandMargin,
  bandRevenue,
  bandUnits,
  clampCost,
  clampMrp,
  defaultBandsForCategory,
  planAllocatedPct,
  planAvgMargin,
  planTotalRevenue,
  planTotalUnits,
} from '../utils/calc';
import { bandWarnings } from '../utils/validation';
import { mockLastYearPct } from '../mockData/lastYearSplit';
import { generateSalesInsights } from '../mockData/salesInsights';
import { SalesInsightsSection } from '../components/SalesInsightsSection';
import type { BandAllocation, ValuePlan } from '../types';

// ── Band visual palette — single blue for all bands. The bands are
// already differentiated by their price range chip; using 4 colors added
// noise without information.
const BAND_PALETTE = {
  accent: '#60a5fa',
  bg:     'rgba(96,165,250,0.10)',
  fg:     '#1d4ed8',
  chipBg: 'rgba(96,165,250,0.16)',
};

// Backend `@JsonInclude(NON_NULL)` omits keys whose DB value is null, so any
// of mrp_min / mrp_max / cost_min / cost_max may arrive as undefined (in
// addition to the legitimate `mrp_max: null` for open-ended top bands).
// These helpers absorb both shapes and never throw on missing fields.
function formatMrpRange(master: MrpBand, sep = '–'): string {
  const min = (master.mrp_min ?? 0).toLocaleString();
  if (master.mrp_max == null) return `₹${min}+`;
  return `₹${min}${sep}₹${master.mrp_max.toLocaleString()}`;
}

function formatCostRange(master: MrpBand): string {
  const min = (master.cost_min ?? 0).toLocaleString();
  const max = (master.cost_max ?? 0).toLocaleString();
  return `₹${min} – ₹${max}`;
}

/**
 * "Jan 2026" → "Jan 2025". Used to label the LY sales section without
 * needing a separate year input. Falls back to the original string if the
 * trailing 4-digit year can't be parsed (e.g. unusual cycle labels).
 */
function shiftPeriodLabelBackOneYear(label: string): string {
  const m = label.match(/^(.*?)(\d{4})\s*$/);
  if (!m) return label;
  const year = parseInt(m[2], 10);
  if (!Number.isFinite(year)) return label;
  return `${m[1].trim()} ${year - 1}`;
}

export default function ValuePlanEditorPage() {
  const { planId, otbCode } = useParams<{ planId: string; otbCode: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { company, isLoading } = useSetupConfig();
  const releasedRows = useReleasedOtbRows(planId);
  const plan = useValuePlan(otbCode);
  const currentBudget = useCurrentOtbBudget(otbCode);
  const canEdit = useCanEditValuePlan();
  // Lock the editor whenever an Option Plan exists for this OTB — editing
  // the VP after that would silently invalidate the OP's derived qty math.
  // Any OP state (DRAFT/SUBMITTED/REVISIONS_REQUESTED/APPROVED) triggers
  // the lock; only "no OP yet" leaves the VP editable.
  const { data: existingOp } = useApiOptionPlan(planId, otbCode);
  const lockedByOp = !!existingOp;
  const backToPlanList = planId ? `/value/${planId}` : '/value';

  // Hydrate annual plans + VPs from server so a hard refresh on this URL
  // still finds the released OTB row and any existing VP. Otherwise
  // `useReleasedOtbRows` returns [] and the page flashes "row not found".
  const apiAnnual = useApiAnnualPlans();
  useEffect(() => {
    if (apiAnnual.data && apiAnnual.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiAnnual.data));
    }
  }, [apiAnnual.data, dispatch]);

  const apiVps = useApiValuePlansForPlan(planId);
  useEffect(() => {
    if (!apiVps.data) return;
    const match = apiVps.data.find((vp) => vp.otb_code === otbCode);
    if (match) dispatch(upsertValuePlan(match));
  }, [apiVps.data, otbCode, dispatch]);

  const otbRow = useMemo(
    () => releasedRows.find((r) => r.otb_code === otbCode),
    [releasedRows, otbCode],
  );
  const { findCategory, isLoading: masterLoading } = useBrandCategoryLookup();

  // Default range for the "View all" dialog: 2-month window starting from
  // this OTB's period (so the buyer sees their period + the next one).
  const periodsForPlan = usePeriods(planId);
  const allTableDefaultRange = useMemo(() => {
    if (!otbRow) return null;
    const p = periodsForPlan.find((pp) => pp.key === otbRow.period_key);
    if (!p) return null;
    const from = new Date(p.start_iso);
    const to = new Date(from.getFullYear(), from.getMonth() + 2, 0); // last day of (month + 1)
    return { from, to };
  }, [periodsForPlan, otbRow]);
  const category = otbRow ? findCategory(otbRow.category_uuid) : null;

  // Auto-init plan from defaults the first time the buyer lands here —
  // only after the server hydration finishes (so we don't stomp existing data).
  useEffect(() => {
    if (!otbCode || !otbRow || !category) return;
    if (plan) return;
    if (apiVps.isLoading) return;
    dispatch(
      initValuePlan({
        otb_code: otbCode,
        period_key: otbRow.period_key,
        brand_uuid: otbRow.brand_uuid,
        category_uuid: otbRow.category_uuid,
        budget: otbRow.budget,
        bands: defaultBandsForCategory(category),
      }),
    );
  }, [otbCode, otbRow, category, plan, apiVps.isLoading, dispatch]);

  if (
    isLoading ||
    !company ||
    apiVps.isLoading ||
    apiAnnual.isLoading ||
    masterLoading
  ) {
    return <SpinnerCenter />;
  }

  if (!otbRow || !category) {
    return (
      <div className="flex h-full w-full flex-col p-1">
        <div
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border shadow-sm"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            OTB row not found or not yet released.
          </p>
          <Button variant="secondary" leftIcon={<ArrowLeft size={13} />} onClick={() => navigate(backToPlanList)}>
            Back to Value Plans
          </Button>
        </div>
      </div>
    );
  }

  if (!plan) {
    // Plan is being initialized in the effect above; render nothing this tick.
    return null;
  }

  return (
    <EditorShell
      plan={plan}
      planId={planId!}
      otbRow={otbRow}
      category={category}
      currency={company.base_currency}
      currentBudget={currentBudget}
      readonly={!canEdit || lockedByOp}
      lockedByOp={lockedByOp}
      allTableDefaultRange={allTableDefaultRange}
      onBack={() => navigate(backToPlanList)}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Editor shell — pulled into its own function so the conditional rendering
// above stays small and TS narrows the props for the inner component.
// ══════════════════════════════════════════════════════════════════════════

function EditorShell({
  plan,
  planId,
  otbRow,
  category,
  currency,
  currentBudget,
  readonly,
  lockedByOp,
  allTableDefaultRange,
  onBack,
}: {
  plan: ValuePlan;
  planId: string;
  otbRow: { period_label: string; brand_name: string; category_name: string; budget: number };
  category: { name: string; bands: MrpBand[] };
  currency: BaseCurrency;
  currentBudget: number | null;
  readonly: boolean;
  lockedByOp: boolean;
  allTableDefaultRange: { from: Date; to: Date } | null;
  onBack: () => void;
}) {
  const dispatch = useAppDispatch();
  const saveMutation = useSaveValuePlan();
  const navigate = useNavigate();
  const [allTableOpen, setAllTableOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayMs = useDemoToday();

  // ── Derived values ────────────────────────────────────────────────────
  const allocatedPct = planAllocatedPct(plan);
  const allocatedAmount = Math.round((plan.budget_snapshot * allocatedPct) / 100);
  const remaining = plan.budget_snapshot - allocatedAmount;
  const avgMargin = planAvgMargin(plan);
  const totalUnits = planTotalUnits(plan);
  const totalRevenue = planTotalRevenue(plan);

  const allocationValid = allocatedPct === TOTAL_PCT;
  const isStale = currentBudget !== null && currentBudget !== plan.budget_snapshot;

  // Lookup table: band master data keyed by band_id
  const bandMaster = useMemo(() => {
    const m: Record<MrpBand['id'], MrpBand> = {} as Record<MrpBand['id'], MrpBand>;
    for (const b of category.bands) m[b.id] = b;
    return m;
  }, [category]);

  // Last-year sales insights — deterministic per OTB code. The LY label is
  // the current period rolled back by one year (e.g. "Jan 2026" → "Jan 2025"),
  // because that's what the buyer compares against.
  const salesInsights = useMemo(
    () =>
      generateSalesInsights({
        otb_code: plan.otb_code,
        ly_period_label: shiftPeriodLabelBackOneYear(otbRow.period_label),
        band_ids: category.bands.map((b) => b.id),
      }),
    [plan.otb_code, otbRow.period_label, category.bands],
  );

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleSetPct = (bandId: MrpBand['id'], pct: number) => {
    if (readonly) return;
    const clamped = Math.max(0, Math.min(TOTAL_PCT, pct));
    dispatch(setBandPct({ otb_code: plan.otb_code, band_id: bandId, pct: clamped }));
  };

  const handleSetMrp = (bandId: MrpBand['id'], value: number) => {
    if (readonly) return;
    const master = bandMaster[bandId];
    dispatch(setBandMrp({ otb_code: plan.otb_code, band_id: bandId, value: clampMrp(value, master) }));
  };

  const handleSetCost = (bandId: MrpBand['id'], value: number) => {
    if (readonly) return;
    const master = bandMaster[bandId];
    dispatch(setBandCost({ otb_code: plan.otb_code, band_id: bandId, value: clampCost(value, master) }));
  };

  const handleResetDefaults = () => {
    if (readonly) return;
    dispatch(setAllBands({ otb_code: plan.otb_code, bands: defaultBandsForCategory(category as never) }));
    toast.success('Cleared — all bands reset to 0%');
  };

  const handleSyncBudget = () => {
    if (currentBudget === null) return;
    dispatch(syncValuePlanBudget({ otb_code: plan.otb_code, new_budget: currentBudget }));
    toast.success('Synced to latest OTB budget');
  };

  const handleSaveDraft = async () => {
    try {
      const saved = await saveMutation.mutateAsync({
        planId,
        otbCode: plan.otb_code,
        state: VP_STATES.DRAFT,
        budget_snapshot: plan.budget_snapshot,
        bands: plan.bands,
      });
      dispatch(upsertValuePlan(saved));
      toast.success('Draft saved');
      onBack();
    } catch (err) {
      toast.error('Save failed on server — try again');
      // eslint-disable-next-line no-console
      console.error('[value-editor] save draft error', err);
    }
  };

  const handleSubmit = async () => {
    // Mirror server hard validation client-side so the buyer gets immediate
    // feedback before the round-trip. Server is the final authority.
    const errors = validateHard(plan.bands, bandMaster);
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return;
    }
    try {
      const saved = await saveMutation.mutateAsync({
        planId,
        otbCode: plan.otb_code,
        state: VP_STATES.APPROVED,
        budget_snapshot: plan.budget_snapshot,
        bands: plan.bands,
      });
      dispatch(upsertValuePlan(saved));
      toast.success(
        plan.state === VP_STATES.APPROVED ? 'Value Plan re-approved' : 'Value Plan approved',
      );
      onBack();
    } catch (err) {
      toast.error('Submit failed on server — try again');
      // eslint-disable-next-line no-console
      console.error('[value-editor] submit error', err);
    }
  };

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
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to Value Plans"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <h1
                className="flex items-center gap-2 text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Value Plan
                <span
                  className="font-mono text-[11px] tabular-nums"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {plan.otb_code}
                </span>
              </h1>
              <p
                className="mt-0.5 text-xs"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {otbRow.brand_name} · {otbRow.category_name} · {otbRow.period_label}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CalendarDays size={13} />}
              onClick={() => setCalendarOpen(true)}
              title="Festivals, sale windows, marriage season & collection drops"
            >
              Calendar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<TableIcon size={13} />}
              onClick={() => setAllTableOpen(true)}
              title="View every Value Plan band across all annual plans"
            >
              View all
            </Button>
            <StateBadge state={plan.state} />
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
            icon={<Wallet size={13} />}
            label="OTB Budget"
            value={fmtMoney(plan.budget_snapshot, currency)}
            tone="accent"
          />
          <InfoTile
            icon={<Banknote size={13} />}
            label="Allocated"
            value={`${fmtMoneyCompact(allocatedAmount, currency)} · ${allocatedPct}%`}
            tone={allocationValid ? 'success' : 'danger'}
          />
          <InfoTile
            icon={<Coins size={13} />}
            label="Remaining"
            value={fmtMoney(remaining, currency)}
            tone={remaining === 0 ? 'success' : remaining < 0 ? 'danger' : 'warning'}
          />
          <div className="ml-auto flex flex-wrap items-stretch gap-2">
            <InfoTile
              icon={<TrendingUp size={13} />}
              label="Avg margin"
              value={`${avgMargin.toFixed(1)}%`}
              tone={avgMargin < SOFT_LIMITS.MIN_MARGIN_PCT ? 'danger' : 'success'}
            />
            <InfoTile
              icon={<Package size={13} />}
              label="Total units"
              value={totalUnits.toLocaleString()}
              tone="muted"
            />
            <InfoTile
              icon={<LineChart size={13} />}
              label="Revenue"
              value={fmtMoneyCompact(totalRevenue, currency)}
              tone="muted"
            />
          </div>
        </div>

        {/* ── Body — alerts, bar, band cards ─────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {lockedByOp && (
            <div className="shrink-0">
              <Alert severity="warning">
                <strong>Read-only.</strong> An Option Plan has been started for this
                OTB — Value Plan inputs are locked to keep the OP's derived qty math
                consistent. Delete the Option Plan if you need to revise band allocations.
              </Alert>
            </div>
          )}

          {isStale && (
            <div className="shrink-0">
              <Alert severity="warning">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    <strong>OTB budget changed</strong> — was{' '}
                    {fmtMoney(plan.budget_snapshot, currency)}, now{' '}
                    {fmtMoney(currentBudget!, currency)}. Re-confirm before submit.
                  </span>
                  <Button size="sm" variant="secondary" onClick={handleSyncBudget}>
                    Sync to {fmtMoneyCompact(currentBudget!, currency)}
                  </Button>
                </div>
              </Alert>
            </div>
          )}

          {remaining < 0 && (
            <div className="shrink-0">
              <Alert severity="danger">
                Over-allocated by {fmtMoney(-remaining, currency)} — reduce a band's %.
              </Alert>
            </div>
          )}

          {/* Last-year sales insights — drives the buyer's tier-mix call */}
          <SalesInsightsSection
            insights={salesInsights}
            currency={currency}
            bandMaster={bandMaster}
          />

          {/* Allocation bar */}
          <div className="shrink-0">
            <AllocationBar plan={plan} bandMaster={bandMaster} />
          </div>

          {/* 4 band cards — 1 col on mobile, 2 per row from lg+ */}
          <div className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-2">
            {plan.bands.map((band) => {
              const master = bandMaster[band.band_id];
              if (!master) return null;
              return (
                <BandCard
                  key={band.band_id}
                  band={band}
                  master={master}
                  budget={plan.budget_snapshot}
                  currency={currency}
                  lastYearPct={mockLastYearPct(plan.category_uuid, band.band_id)}
                  onPctChange={(v) => handleSetPct(band.band_id, v)}
                  onMrpChange={(v) => handleSetMrp(band.band_id, v)}
                  onCostChange={(v) => handleSetCost(band.band_id, v)}
                  readonly={readonly}
                />
              );
            })}
          </div>
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: allocationValid ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                color: allocationValid ? '#047857' : '#b91c1c',
              }}
            >
              {allocationValid ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              {allocationValid
                ? 'Budget fully allocated (100%)'
                : allocatedPct < TOTAL_PCT
                  ? `${allocatedPct}% allocated · ${TOTAL_PCT - allocatedPct}% still to assign`
                  : `${allocatedPct}% allocated · ${allocatedPct - TOTAL_PCT}% over budget`}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            {lockedByOp ? (
              <span
                className="text-[11px]"
                style={{ color: '#b45309' }}
                title="Option Plan exists — VP can no longer be modified. Delete the OP if you need to revise the VP."
              >
                Read-only — Option Plan in progress
              </span>
            ) : readonly ? (
              <span
                className="text-[11px]"
                style={{ color: 'var(--color-text-tertiary)' }}
                title="Read-only — only ADMIN or BUYER roles can edit Value Plans"
              >
                Read-only — ADMIN / BUYER role required
              </span>
            ) : null}
            {/* Action buttons hidden when locked by OP — VP is committed at
                that point and nothing the buyer types here can change. */}
            {!lockedByOp && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RotateCcw size={12} />}
                  onClick={handleResetDefaults}
                  disabled={readonly || saveMutation.isPending}
                  title="Clear all bands back to 0% (MRP/cost kept at band midpoints)"
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Save size={13} />}
                  onClick={handleSaveDraft}
                  disabled={readonly || saveMutation.isPending}
                  title="Save and come back later"
                >
                  {saveMutation.isPending ? 'Saving…' : 'Save Draft'}
                </Button>
                <Button
                  variant="primary"
                  leftIcon={<Send size={13} />}
                  disabled={readonly || !allocationValid || saveMutation.isPending}
                  onClick={handleSubmit}
                >
                  {saveMutation.isPending
                    ? 'Submitting…'
                    : plan.state === VP_STATES.APPROVED
                      ? 'Re-approve'
                      : 'Submit'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Dialog
        open={allTableOpen}
        onClose={() => setAllTableOpen(false)}
        title={
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            All Value Plans
          </span>
        }
        size="full"
        bodyEdge
      >
        <AllValuePlansTable
          compactHeader
          height="calc(100vh - 120px)"
          defaultDateRange={allTableDefaultRange ?? undefined}
          onOpenRow={(planId, otbCode) => {
            setAllTableOpen(false);
            navigate(`/value/${planId}/${otbCode}`);
          }}
        />
      </Dialog>

      {/* Fashion-planning calendar — same one used on the OTB Annual planning
          screen. Year is derived from the OTB period label, falling back to
          the demo "today" if the label can't be parsed. */}
      <Dialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Fashion Planning Calendar"
        description="Festivals, sale windows, marriage season, climate cycles & collection drops — use this to align your Value Plan to the year's revenue peaks."
        size="full"
      >
        <div className="p-2">
          <FashionCalendar
            year={
              parseInt(otbRow.period_label.match(/\d{4}/)?.[0] ?? '', 10) ||
              new Date(todayMs).getFullYear()
            }
            highlightDate={new Date(todayMs).toISOString().slice(0, 10)}
          />
        </div>
      </Dialog>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

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

function AllocationBar({
  plan,
  bandMaster,
}: {
  plan: ValuePlan;
  bandMaster: Record<MrpBand['id'], MrpBand>;
}) {
  const totalAllocated = plan.bands.reduce((s, b) => s + b.budget_pct, 0);
  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          Budget allocation
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {plan.bands.map((b) => {
            const master = bandMaster[b.band_id];
            const range = master ? formatMrpRange(master) : '';
            return (
              <span
                key={b.band_id}
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <span style={{ color: BAND_PALETTE.fg }}>{b.budget_pct}%</span>
                <span style={{ color: 'var(--color-text-tertiary)' }}> ({range})</span>
              </span>
            );
          })}
        </div>
      </div>
      <div className="flex h-7 w-full" role="img" aria-label="Budget allocation by band">
        {plan.bands.map((b, idx) => {
          const master = bandMaster[b.band_id];
          if (b.budget_pct <= 0) return null;
          const range = master ? formatMrpRange(master) : '';
          // Alternating subtle shades of the same blue so adjacent segments
          // can still be told apart without resorting to multiple hues.
          const shade = idx % 2 === 0 ? BAND_PALETTE.accent : '#3b82f6';
          return (
            <div
              key={b.band_id}
              className="flex items-center justify-center overflow-hidden text-[10px] font-bold text-white"
              style={{
                width: `${b.budget_pct}%`,
                background: shade,
                borderRight: '1px solid rgba(255,255,255,0.55)',
              }}
              title={`${b.budget_pct}% (${range})`}
            >
              {b.budget_pct >= 12
                ? `${b.budget_pct}% (${range})`
                : b.budget_pct >= 6
                  ? `${b.budget_pct}%`
                  : ''}
            </div>
          );
        })}
        {totalAllocated < TOTAL_PCT && (
          <div
            className="flex items-center justify-center text-[10px] font-medium"
            style={{
              width: `${TOTAL_PCT - totalAllocated}%`,
              background: 'repeating-linear-gradient(45deg, rgba(148,163,184,0.18), rgba(148,163,184,0.18) 6px, transparent 6px, transparent 12px)',
              color: 'var(--color-text-tertiary)',
            }}
          >
            unallocated
          </div>
        )}
      </div>
    </div>
  );
}

function BandCard({
  band,
  master,
  budget,
  currency,
  lastYearPct,
  onPctChange,
  onMrpChange,
  onCostChange,
  readonly,
}: {
  band: BandAllocation;
  master: MrpBand;
  budget: number;
  currency: BaseCurrency;
  lastYearPct: number;
  onPctChange: (v: number) => void;
  onMrpChange: (v: number) => void;
  onCostChange: (v: number) => void;
  readonly: boolean;
}) {
  const palette = BAND_PALETTE;
  const amount = bandBudget(band, budget);
  const units = bandUnits(band, budget);
  const revenue = bandRevenue(band, budget);
  const margin = bandMargin(band);
  const lowMargin = margin < SOFT_LIMITS.MIN_MARGIN_PCT;
  const warnings = bandWarnings(band);

  const mrpRange = formatMrpRange(master, ' – ');
  const costRange = formatCostRange(master);
  const lyDelta = band.budget_pct - lastYearPct;

  return (
    <section
      className="flex shrink-0 flex-col overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      {/* Card header — MRP + Cost as paired chips on the left, %/₹ on the right */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-3.5 py-2.5"
        style={{ borderColor: 'var(--color-divider)', background: palette.bg }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[14px] font-extrabold tabular-nums"
            style={{
              background: palette.chipBg,
              color: palette.fg,
              border: `1px solid ${palette.accent}40`,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">MRP</span>
            {mrpRange}
          </span>
          <span
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-bold tabular-nums"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-divider)',
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Cost
            </span>
            {costRange}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold tabular-nums"
            style={{ background: palette.chipBg, color: palette.fg }}
          >
            {band.budget_pct}%
          </span>
          <span
            className="rounded-md border px-2 py-1 text-[11px] font-semibold tabular-nums"
            style={{
              borderColor: 'var(--color-divider)',
              color: 'var(--color-text-primary)',
              background: 'var(--color-surface)',
            }}
          >
            {fmtMoney(amount, currency)}
          </span>
        </div>
      </div>

      {/* Inputs row */}
      <div className="grid grid-cols-1 gap-3 px-3.5 py-3 md:grid-cols-3">
        {/* % budget */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              % of budget
            </label>
            <button
              type="button"
              onClick={() => onPctChange(lastYearPct)}
              disabled={readonly}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[9.5px] font-semibold tabular-nums transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: 'var(--color-surface-alt, #f1f5f9)', color: 'var(--color-text-secondary)' }}
              title={`Use last-year split (${lastYearPct}%)`}
            >
              LY {lastYearPct}%
              {lyDelta !== 0 && (
                <span style={{ color: lyDelta > 0 ? '#047857' : '#b45309' }}>
                  {lyDelta > 0 ? `+${lyDelta}` : lyDelta}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Slider
                value={band.budget_pct}
                onChange={(v) => onPctChange(v)}
                min={0}
                max={TOTAL_PCT}
                step={1}
                disabled={readonly}
              />
            </div>
            <div className="w-20">
              <NumberInput
                value={band.budget_pct}
                onChange={(v) => onPctChange(v ?? 0)}
                min={0}
                max={TOTAL_PCT}
                step={1}
                showButtons={false}
                disabled={readonly}
              />
            </div>
          </div>
        </div>

        {/* Avg MRP */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Avg MRP ({currency})
          </label>
          <NumberInput
            value={band.avg_mrp}
            onChange={(v) => onMrpChange(v ?? master.mrp_min)}
            min={master.mrp_min}
            max={master.mrp_max ?? undefined}
            step={50}
            showButtons={false}
            disabled={readonly}
          />
        </div>

        {/* Avg cost */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Avg cost ({currency})
          </label>
          <NumberInput
            value={band.avg_cost}
            onChange={(v) => onCostChange(v ?? master.cost_min)}
            min={master.cost_min}
            max={master.cost_max}
            step={10}
            showButtons={false}
            disabled={readonly}
          />
        </div>
      </div>

      {/* Derived footer strip */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t px-3.5 py-2"
        style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface-alt, #f8fafc)' }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <DerivedStat label="Units" value={units.toLocaleString()} />
          <DerivedStat label="Revenue" value={fmtMoney(revenue, currency)} />
          <DerivedStat
            label="Margin"
            value={`${margin.toFixed(1)}%`}
            tone={lowMargin ? 'danger' : 'success'}
          />
        </div>
        {warnings.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {warnings.map((w, i) => {
              const isDanger = w.tone === 'danger';
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{
                    background: isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.14)',
                    color: isDanger ? '#b91c1c' : '#b45309',
                  }}
                >
                  <AlertTriangle size={10} />
                  {w.message}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function DerivedStat({
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


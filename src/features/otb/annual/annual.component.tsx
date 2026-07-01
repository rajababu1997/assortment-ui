/**
 * Annual OTB Creation — single-card layout matching /setup and /otb.
 *
 *   ┌── Header (back · title · history · status) ──────────────────────┐
 *   │── Step 1 strip (start date · budget · allocation meter · auto-fill)│
 *   │── Period chip strip (horizontal · active period highlighted)      │
 *   │── Body (PeriodEditor for the active period; scrolls)              │
 *   │── Footer (totals · Submit Annual Plan)                            │
 *   └───────────────────────────────────────────────────────────────────┘
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileSpreadsheet,
  ListPlus,
  Save,
  Send,
  Upload,
  Wallet,
  Wand2,
  X,
} from 'lucide-react';
import { FashionCalendar } from '@/components/calendar';
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  DatePicker,
  Dialog,
  Drawer,
  FileUpload,
  NumberInput,
  Select,
} from '@/components/primitives';
import { toast } from '@/lib/toast';
import { useDemoToday } from '@/hooks/useDemoClock';
import { generateAutoFilledRows } from '../utils/autofill';
import { HistoricalLensPanel } from '../components/dashboard/HistoricalLensPanel';
import {
  annualTotal,
  periodTotal,
  useAllPlans,
  useAnnualPlan,
  useAppDispatch,
  usePeriods,
  usePreviewPeriods,
  useSetupConfig,
} from '../useOtb';
import {
  initAnnualPlan,
  resetAnnualPlan,
  setOverallBudget,
  setPeriodRows,
  setPlanStart,
  submitAnnualPlan,
} from '@/store/slices/otbSlice';
import { fmtMoney, fmtMoneyCompact } from '../utils/format';
import { calcOtb } from '../types';
import { OTB_STATES } from '../constants';
import { generatePeriods } from '../utils/periods';
import { PeriodEditor } from '../components/PeriodEditor';
import { buildOtbCode } from '../utils/otbCode';
import { buildPlanId, derivePlanEndIso } from '../utils/planId';
import { useApiBrands, useApiCategories, useBrandCategoryLookup } from '../useOtbMaster';
import { useApiAnnualPlans, useDeleteAnnualPlan, useSaveAnnualPlan } from '../useApiAnnualPlans';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useAnnualRecommendation } from '@/features/recommendation/useRecommendation';
import { SuggestButton } from '@/features/recommendation/components/SuggestButton';
import { WhyAiButton } from '@/features/recommendation/components/WhyAiButton';
import { ExplanationDrawer, type SectionedExplanation } from '@/features/recommendation/components/ExplanationDrawer';
import type { AnnualRecommendation } from '@/features/recommendation/types';

export default function OtbAnnualPage() {
  const { data: apiBrands = [] } = useApiBrands();      // prefetch for picker + autofill
  const { data: apiCategories = [] } = useApiCategories(); // prefetch for autofill
  const { findCategory } = useBrandCategoryLookup();
  const savePlan = useSaveAnnualPlan();
  const deletePlan = useDeleteAnnualPlan();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
  const apiPlans = useApiAnnualPlans();
  // Hydrate Redux from server so drafts saved elsewhere load transparently.
  useEffect(() => {
    if (apiPlans.data && apiPlans.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiPlans.data));
    }
  }, [apiPlans.data, dispatch]);
  // `planId` is set on `/otb/:planId/annual` (editing an existing plan);
  // absent on `/otb/annual` (creating a new plan).
  const { planId } = useParams<{ planId: string }>();
  const isCreating = !planId;
  // Non-admins are read-only. Block create entirely; allow view of existing plan.
  useEffect(() => {
    if (!isAdmin && isCreating) navigate('/otb', { replace: true });
  }, [isAdmin, isCreating, navigate]);
  const { company, timeConfig, releaseConfig, isLoading } = useSetupConfig();
  const allPlans = useAllPlans();
  // When `planId` is absent, `useAnnualPlan` would fall back to "first
  // plan" — wrong for create-new mode, where we want a fresh slate. So
  // we null it out explicitly and let the auto-init effect below pick
  // the next free year and redirect to `/otb/:planId/annual`.
  const resolvedPlan = useAnnualPlan(planId);
  const annual = isCreating ? null : resolvedPlan;
  const todayMs = useDemoToday();
  const [activeKey, setActiveKey] = useState<string | undefined>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  // ── AI Suggest ───────────────────────────────────────────────────────────
  const recMut = useAnnualRecommendation();
  const [rec, setRec] = useState<AnnualRecommendation | null>(null);
  const [recGeneratedAt, setRecGeneratedAt] = useState<number | null>(null);
  const [recDrawerOpen, setRecDrawerOpen] = useState(false);

  // Default plan start: Jan 1 of the NEXT calendar year (planners think one
  // year ahead — if "today" lands in 2024, the default plan is for 2025).
  // Skip further forward if that year already has a plan.
  const defaultPlanStartIso = useMemo(() => {
    const today = new Date(todayMs);
    const base = today.getFullYear() + 1;
    for (let offset = 0; offset < 10; offset += 1) {
      const y = base + offset;
      const start = `${y}-01-01`;
      const alreadyExists = allPlans.some(
        (p) => p.plan_start_iso.slice(0, 7) === start.slice(0, 7),
      );
      if (!alreadyExists) return start;
    }
    return `${base}-01-01`;
  }, [todayMs, allPlans]);

  // When no plan exists yet (create-new mode), the Year / Plan start
  // pickers operate on this local state so we can preview the year
  // without persisting anything in the slice. The plan only gets minted
  // on the first *meaningful* edit (budget, auto-fill, add row, submit).
  const [pendingStartIso, setPendingStartIso] = useState<string | null>(null);
  const planStartIso = annual?.plan_start_iso ?? pendingStartIso ?? defaultPlanStartIso;
  const previewPeriods = usePreviewPeriods(planStartIso);
  const periods = usePeriods(annual?.plan_id);
  const activePeriods = annual ? periods : previewPeriods;

  /** Mint the plan for the currently-previewed window and switch the URL
   *  to its id-scoped path. Returns the new plan_id so the caller can
   *  immediately dispatch their follow-up action against it. Idempotent
   *  if the window already has a plan. */
  const ensurePlan = (): string => {
    if (annual) return annual.plan_id;
    const newEnd = derivePlanEndIso(previewPeriods);
    const newId = buildPlanId(planStartIso, newEnd);
    dispatch(
      initAnnualPlan({
        plan_start_iso: planStartIso,
        plan_end_iso: newEnd,
        period_keys: previewPeriods.map((p) => p.key),
      }),
    );
    if (isCreating) {
      navigate(`/otb/${newId}/annual`, { replace: true });
    }
    return newId;
  };

  useEffect(() => {
    if (!activeKey && activePeriods.length > 0) setActiveKey(activePeriods[0].key);
  }, [activeKey, activePeriods]);

  const allocated = useMemo(() => annualTotal(annual?.periods), [annual]);
  const overallBudget = annual?.overall_budget ?? 0;
  const budgetSet = overallBudget > 0;
  const overBudget = budgetSet ? allocated > overallBudget : false;
  const hasAnyRow = !!annual && Object.values(annual.periods).some((p) => p.rows.length > 0);
  const allocatedPct = budgetSet ? Math.min(100, Math.round((allocated / overallBudget) * 100)) : 0;
  const periodsWithRows = annual ? Object.values(annual.periods).filter((p) => p.rows.length > 0).length : 0;
  // Submit requires EVERY period to have at least one row — partial plans
  // should be saved as draft, not submitted.
  const allPeriodsHaveRows =
    !!annual &&
    Object.values(annual.periods).length > 0 &&
    Object.values(annual.periods).every((p) => p.rows.length > 0);

  // Derived values — computed unconditionally so hook order stays stable
  // across re-renders, even on the loading / not-set-up / approved branches.
  const activePeriod = activePeriods.find((p) => p.key === activeKey) ?? activePeriods[0];
  const activePlan = activePeriod && annual ? annual.periods[activePeriod.key] : null;
  const activeSelectedPairs = useMemo(
    () =>
      activePlan
        ? activePlan.rows.map((r) => ({ brand_uuid: r.brand_uuid, category_uuid: r.category_uuid }))
        : [],
    [activePlan],
  );
  const activeDraftSales = useMemo(
    () => activePlan?.rows.reduce((sum, r) => sum + r.planned_sales, 0) ?? 0,
    [activePlan],
  );

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center text-sm">Loading…</div>;
  }

  if (!company || !timeConfig || !releaseConfig) {
    return (
      <div className="flex h-full w-full flex-col p-1">
        <div
          className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border p-6"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        >
          <Card className="max-w-md">
            <div className="p-5">
              <p className="text-sm">Finish OTB Setup first.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Post-submit summary view
  if (annual && annual.state !== OTB_STATES.DRAFT) {
    return (
      <ApprovedView
        currency={company.base_currency}
        annualTotalValue={allocated}
        onBack={() => navigate(`/otb/${annual.plan_id}`)}
        onReset={async () => {
          const id = annual.plan_id;
          dispatch(resetAnnualPlan({ plan_id: id }));
          try {
            await deletePlan.mutateAsync(id);
          } catch (err) {
            // Plan may simply not exist on server yet (e.g. unsubmitted draft) — ignore.
            // eslint-disable-next-line no-console
            console.warn('[annual] delete on server skipped:', err);
          }
        }}
      />
    );
  }

  /**
   * One-click annual plan generation.
   *
   *   1. If the grid is empty, populate every (brand × category × period) cell
   *      with the deterministic autofill skeleton so the backend has rows
   *      to recommend against.
   *   2. Persist that grid to the server (the recommender reads rows from
   *      the DB, not from Redux).
   *   3. Call the AI recommender.
   *   4. Overwrite every row's 5 buyer fields with the recommended values.
   *
   * Already-typed cells are replaced — the user is told that up-front via
   * the confirm dialog.
   */
  const handleSuggest = async () => {
    if (!budgetSet) {
      toast.error('Set an overall budget first');
      return;
    }
    if (apiBrands.length === 0 || apiCategories.length === 0) {
      toast.error('Brands and categories are still loading — try again in a moment');
      return;
    }

    // Confirm overwrite if the user already has values
    const hasEntries = annual && Object.values(annual.periods).some((p) =>
      p.rows.some((r) =>
        r.planned_sales > 0 || r.markdowns > 0 || r.eom_inventory > 0 ||
        r.bom_inventory > 0 || r.on_order > 0,
      ),
    );
    if (hasEntries && !window.confirm(
      'This will replace existing values across every brand × category × month with AI-generated suggestions. Continue?',
    )) return;

    const planId = ensurePlan();

    try {
      // ── Step 1: build a full (brand × category × period) grid ──────────
      const seededByPeriod = generateAutoFilledRows({
        periods: activePeriods,
        overallBudget,
        brands: apiBrands,
        categories: apiCategories,
      });
      Object.entries(seededByPeriod).forEach(([periodKey, rows]) => {
        dispatch(setPeriodRows({ plan_id: planId, period_key: periodKey, rows }));
      });

      // ── Step 2: persist the seeded grid so the recommender can read it ─
      // Build the snapshot inline — Redux dispatch above hasn't flushed yet
      // when we send to the server, so we have to construct the plan manually.
      const planToSave = annual
        ? {
            ...annual,
            plan_id: planId,
            periods: Object.fromEntries(
              Object.entries(annual.periods).map(([k, p]) => [
                k,
                { ...p, rows: seededByPeriod[k] ?? p.rows },
              ]),
            ),
          }
        : null;
      if (planToSave) {
        await savePlan.mutateAsync(planToSave);
      }

      // ── Step 3: ask the recommender for AI values ──────────────────────
      const result = await recMut.mutateAsync({ planUuid: planId });
      setRec(result);
      // Stamp the moment the rec was generated so the "Why this plan?"
      // button can show "Generated N min ago". Session-only — clears on
      // reload, by design (per the storage-size discussion).
      setRecGeneratedAt(Date.now());

      // ── Step 4: overwrite every row's 5 fields with the AI values ──────
      // Index by (period, brand, category) so the lookup is O(1) per row.
      const recIndex = new Map(
        result.rows.map((rr) => [`${rr.periodKey}|${rr.brandUuid}|${rr.categoryUuid}`, rr]),
      );
      Object.entries(seededByPeriod).forEach(([periodKey, rows]) => {
        const updated = rows.map((row) => {
          const recRow = recIndex.get(`${periodKey}|${row.brand_uuid}|${row.category_uuid}`);
          if (!recRow) return row;
          return {
            ...row,
            planned_sales: Number(recRow.plannedSales),
            markdowns: Number(recRow.markdowns),
            eom_inventory: Number(recRow.eomInventory),
            bom_inventory: Number(recRow.bomInventory),
            on_order: Number(recRow.onOrder),
          };
        });
        dispatch(setPeriodRows({ plan_id: planId, period_key: periodKey, rows: updated }));
      });
      const filledPeriods = Object.keys(seededByPeriod).length;
      toast.success(
        `Auto-planned ${result.rows.length} rows across ${filledPeriods} periods`,
      );
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[annual] auto-plan failed', err);
      toast.error('Could not generate plan — try again');
    }
  };

  const handleSubmit = async () => {
    if (!budgetSet) return toast.error('Enter the overall budget before submitting');
    if (!allPeriodsHaveRows) {
      const total = annual ? Object.values(annual.periods).length : 0;
      return toast.error(
        `All periods must have OTB rows before submitting (${periodsWithRows}/${total} filled). ` +
          'Save as Draft if you want to come back later.',
      );
    }
    if (!validateRows(annual!)) return toast.error('Some rows have invalid values — check Sales and EOM');
    if (overBudget) {
      return toast.error(
        `Allocated exceeds overall budget by ${fmtMoney(allocated - overallBudget, company.base_currency)}`,
      );
    }
    try {
      // Server-first: persist with state=APPROVED. Local Redux only flips
      // after the API succeeds, so the user never sees the ApprovedView
      // flash between submit-click and navigation.
      // Also cascade every period DRAFT → APPROVED — otherwise the Release
      // button on the dashboard never appears.
      const approvedPeriods = Object.fromEntries(
        Object.entries(annual!.periods).map(([k, p]) => [
          k,
          p.state === OTB_STATES.DRAFT ? { ...p, state: OTB_STATES.APPROVED } : p,
        ]),
      );
      await savePlan.mutateAsync({
        ...annual!,
        state: OTB_STATES.APPROVED,
        periods: approvedPeriods,
      });
      dispatch(submitAnnualPlan({ plan_id: annual!.plan_id }));
      navigate('/otb');
      toast.success('Annual plan submitted');
    } catch (err) {
      toast.error('Server save failed — try again');
      // eslint-disable-next-line no-console
      console.error('[annual] save error', err);
    }
  };

  const handlePlanStartChange = (iso: string) => {
    const target = `${iso.slice(0, 7)}-01`;
    // No plan yet — preview-only mode. Update local pending state so the
    // Year selector and date picker reflect the change without polluting
    // the slice with empty draft plans.
    if (!annual) {
      setPendingStartIso(target);
      setActiveKey(undefined);
      return;
    }
    if (annual.state !== OTB_STATES.DRAFT) return;
    if (target === annual.plan_start_iso) return;
    const next = generatePeriods({
      plan_start_iso: target,
      planning_horizon_months: timeConfig.planning_horizon_months,
      planning_cycle: timeConfig.planning_cycle,
      lock_deadline_days_before: releaseConfig.lock_deadline_days_before,
      release_day_of_week: releaseConfig.release_day_of_week,
    });
    dispatch(setPlanStart({
      plan_id: annual.plan_id,
      plan_start_iso: target,
      plan_end_iso: derivePlanEndIso(next),
      period_keys: next.map((p) => p.key),
    }));
    setActiveKey(next[0]?.key);
  };

  const submitDisabled = overBudget || !allPeriodsHaveRows || !budgetSet;

  const handleSaveDraft = async () => {
    if (!budgetSet && !hasAnyRow) {
      toast.error('Nothing to save yet — set a budget or add at least one OTB row');
      return;
    }
    const parts: string[] = [];
    if (budgetSet) parts.push('budget');
    if (hasAnyRow) parts.push(`${Object.values(annual!.periods).reduce((s, p) => s + p.rows.length, 0)} rows`);
    try {
      // Persist to server as DRAFT — same endpoint as Submit, different state.
      // Idempotent: subsequent saves overwrite (delete-and-reinsert rows).
      await savePlan.mutateAsync({ ...annual!, state: OTB_STATES.DRAFT });
      toast.success(`Draft saved · ${parts.join(' · ')}`);
    } catch (err) {
      toast.error('Saved locally but server save failed — check Network tab');
      // eslint-disable-next-line no-console
      console.error('[annual] save draft error', err);
    }
    navigate('/otb');
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
              onClick={() => navigate('/otb')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                Create Annual Plan
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {company.name} · {activePeriods.length} {timeConfig.planning_cycle} periods · {periodsWithRows} with rows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SuggestButton
              loading={recMut.isPending || savePlan.isPending}
              hasResult={!!rec}
              onClick={handleSuggest}
              label="Auto-Plan"
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<BarChart3 size={12} />}
              onClick={() => setHistoryOpen(true)}
              title="See last-year performance for this period"
            >
              History
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CalendarDays size={12} />}
              onClick={() => setCalendarOpen(true)}
              title="Festivals, sale windows, marriage season & collection drops"
            >
              Calendar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload size={12} />}
              onClick={() => setImportOpen(true)}
              title="Import OTB rows from a CSV file"
            >
              Import CSV
            </Button>
            {rec && recGeneratedAt && (
              <WhyAiButton
                generatedAtMs={recGeneratedAt}
                onClick={() => setRecDrawerOpen(true)}
              />
            )}
          </div>
        </div>

        {/* ── Step 1 strip — date · budget · meter · auto-fill ───────── */}
        <div
          className="flex flex-wrap items-end gap-3 border-b px-4 py-3"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <div className="flex flex-col gap-1 min-w-[140px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Year
            </label>
            <Select<string>
              value={String(new Date(planStartIso).getFullYear())}
              onChange={(year) => {
                if (!year) return;
                // Switch the plan start to Jan 1 of the picked year (calendar year);
                // handlePlanStartChange already takes care of rekeying the plan.
                handlePlanStartChange(`${year}-01-01`);
              }}
              options={yearOptions(todayMs)}
            />
          </div>
          <div className="flex flex-col gap-1 min-w-[170px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Plan start
            </label>
            <DatePicker value={planStartIso} onChange={(iso) => handlePlanStartChange(iso)} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Overall budget ({company.base_currency})
            </label>
            <NumberInput
              value={overallBudget || null}
              onChange={(v) => {
                const id = ensurePlan();
                dispatch(setOverallBudget({ plan_id: id, value: v ?? 0 }));
              }}
              min={0}
              step={1000000}
              placeholder="e.g. 100000000"
              showButtons={false}
              disabled={!isAdmin}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
            <label className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
              Allocation
            </label>
            <BudgetMeter
              budgetSet={budgetSet}
              allocatedPct={allocatedPct}
              overBudget={overBudget}
              allocated={allocated}
              budget={overallBudget}
              currency={company.base_currency}
            />
          </div>
        </div>

        {/* ── Period chip strip ─────────────────────────────────────────── */}
        <div
          className="flex shrink-0 items-center gap-2 overflow-x-auto border-b px-3 py-2.5"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
            Periods
          </span>
          {activePeriods.map((p, idx) => {
            const plan = annual?.periods[p.key];
            const total = plan ? periodTotal(plan) : 0;
            const rowsCount = plan?.rows.length ?? 0;
            const isActive = p.key === activeKey;
            const hasRows = rowsCount > 0;
            const palette = QUARTER_PALETTE[Math.floor(idx / 3) % QUARTER_PALETTE.length];

            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setActiveKey(p.key)}
                className="group relative shrink-0 overflow-hidden rounded-lg border text-left transition-all hover:-translate-y-px"
                style={{
                  background: isActive ? palette.activeBg : palette.idleBg,
                  borderColor: isActive ? palette.borderActive : palette.borderIdle,
                  boxShadow: isActive ? `0 6px 18px -10px ${palette.shadow}` : 'none',
                }}
              >
                {/* Top accent stripe colored by quarter */}
                <span
                  aria-hidden
                  className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ background: palette.accent, opacity: isActive ? 1 : 0.6 }}
                />

                <div className="flex items-center gap-2 px-2.5 pt-2 pb-1.5">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
                    style={{
                      background: isActive ? palette.iconBgActive : palette.iconBgIdle,
                      color: isActive ? palette.iconFgActive : palette.iconFgIdle,
                    }}
                  >
                    {hasRows ? <CheckCircle2 size={12} strokeWidth={2.4} /> : <Circle size={12} strokeWidth={2.4} />}
                  </span>
                  <div className="leading-tight">
                    <div
                      className="text-xs font-semibold"
                      style={{ color: isActive ? palette.titleActive : 'var(--color-text-primary)' }}
                    >
                      {p.label}
                    </div>
                    <div className="mt-0.5 text-[10px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
                      {rowsCount} {rowsCount === 1 ? 'OTB' : 'OTBs'} · {fmtMoneyCompact(total, company.base_currency)}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <motion.span
                    layoutId="active-period-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                    style={{ background: palette.accent }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body — active period editor ───────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {overBudget && (
            <Alert severity="danger">
              Allocated ({fmtMoney(allocated, company.base_currency)}) exceeds overall budget (
              {fmtMoney(overallBudget, company.base_currency)}) by{' '}
              {fmtMoney(allocated - overallBudget, company.base_currency)}.
            </Alert>
          )}

          {activePeriod && annual && (
            <motion.div
              key={activePeriod.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div
                className="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{
                  background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                  color: 'var(--color-primary)',
                }}
              >
                <ListPlus size={11} /> Editing · {activePeriod.label}
              </div>
              <PeriodEditor
                planId={annual.plan_id}
                periodKey={activePeriod.key}
                currency={company.base_currency}
                mode={isAdmin ? 'create' : 'readonly'}
              />
            </motion.div>
          )}
          {activePeriod && !annual && (
            <div
              className="rounded-xl border border-dashed px-4 py-6 text-center text-sm"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-tertiary)' }}
            >
              Set an overall budget above to start adding brand × category rows for{' '}
              <strong style={{ color: 'var(--color-text-secondary)' }}>{activePeriod.label}</strong>.
            </div>
          )}
        </div>

        {/* ── Footer — totals + Submit ──────────────────────────────────── */}
        <div
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <FooterStat
              label="Allocated"
              value={fmtMoney(allocated, company.base_currency)}
              tone={overBudget ? 'down' : 'neutral'}
            />
            <FooterStat
              label="Budget"
              value={budgetSet ? fmtMoney(overallBudget, company.base_currency) : '—'}
              tone="accent"
            />
            <FooterStat
              label="Remaining"
              value={budgetSet ? fmtMoney(overallBudget - allocated, company.base_currency) : '—'}
              tone={overBudget ? 'down' : 'up'}
            />
          </div>
          <div className="flex items-center gap-2.5">
            {!budgetSet ? (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: 'var(--color-warning, #b45309)' }}
              >
                Set an overall budget to enable Submit
              </span>
            ) : !allPeriodsHaveRows ? (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: 'var(--color-warning, #b45309)' }}
              >
                Fill OTB rows in all periods to enable Submit ({periodsWithRows}/{Object.values(annual?.periods ?? {}).length})
              </span>
            ) : overBudget ? (
              <span
                className="inline-flex items-center gap-1 text-[11px]"
                style={{ color: 'var(--color-danger, #dc2626)' }}
              >
                Allocated exceeds overall budget
              </span>
            ) : null}
            {isAdmin && (
              <>
                <Button
                  variant="secondary"
                  leftIcon={<Save size={13} />}
                  onClick={handleSaveDraft}
                  title="Keep your work as a draft and come back later"
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  rightIcon={<Send size={13} />}
                  disabled={submitDisabled || savePlan.isPending}
                  onClick={handleSubmit}
                >
                  {savePlan.isPending ? 'Submitting…' : 'Submit Annual Plan'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>


      <Drawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Historical lens · ${activePeriod?.label ?? ''}`}
        side="right"
        width={480}
      >
        <div className="p-4">
          {activePeriod ? (
            <HistoricalLensPanel
              periodStartIso={activePeriod.start_iso}
              selectedPairs={activeSelectedPairs}
              plannerDraftSales={activeDraftSales}
              currency={company.base_currency}
              onSelectPair={(brandUuid, categoryUuid) => {
                if (!annual || !activePeriod) return;
                const current = annual.periods[activePeriod.key];
                if (!current) return;
                if (current.rows.some((r) => r.brand_uuid === brandUuid && r.category_uuid === categoryUuid)) {
                  toast.success('Already added to this tab');
                  return;
                }
                const category = findCategory(categoryUuid);
                const newRow = {
                  row_id: `${activePeriod.key}-${brandUuid}-${categoryUuid}`,
                  otb_code: category ? buildOtbCode(activePeriod.key, category) : `OTB-${activePeriod.key}-PENDING`,
                  brand_uuid: brandUuid,
                  category_uuid: categoryUuid,
                  planned_sales: 0,
                  markdowns: 0,
                  eom_inventory: 0,
                  bom_inventory: 0,
                  on_order: 0,
                };
                dispatch(setPeriodRows({ plan_id: annual.plan_id, period_key: activePeriod.key, rows: [...current.rows, newRow] }));
                toast.success('Added to this tab — fill in the values');
              }}
            />
          ) : (
            <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              No period selected.
            </div>
          )}
        </div>
      </Drawer>

      {/* Calendar dialog — fashion-planning year view */}
      <Dialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Fashion Planning Calendar"
        description="Festivals, sale windows, marriage season, climate cycles & collection drops — use this to align your OTB to the year's revenue peaks."
        size="full"
      >
        <div className="p-2">
          <FashionCalendar
            year={new Date(planStartIso).getFullYear()}
            highlightDate={new Date(todayMs).toISOString().slice(0, 10)}
          />
        </div>
      </Dialog>

      {/* Import CSV dialog — demo-only file picker, no parsing yet */}
      <Dialog
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          setImportFile(null);
        }}
        title="Import OTB Plan from CSV"
        description="Upload a CSV with brand, category and planned OTB values. We'll merge it into the current draft."
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setImportOpen(false);
                setImportFile(null);
              }}
              leftIcon={<X size={13} />}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!importFile}
              leftIcon={<FileSpreadsheet size={13} />}
              onClick={() => {
                toast.success(`Imported ${importFile?.name ?? 'CSV'} (demo — no rows added)`);
                setImportOpen(false);
                setImportFile(null);
              }}
            >
              Import
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 p-4">
          <FileUpload
            value={importFile}
            onChange={setImportFile}
            accept=".csv,text/csv"
            maxSize={5 * 1024 * 1024}
            hint="Drop a CSV file here or click to browse. Max 5 MB."
          />
          <div
            className="rounded-lg border px-3 py-2 text-xs"
            style={{
              borderColor: 'var(--color-divider)',
              background: 'var(--color-surface-alt, #f8fafc)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <strong style={{ color: 'var(--color-text-primary)' }}>Expected columns:</strong>{' '}
            <code className="text-[11px]">period, brand, category, planned_sales, markdowns, eom_inventory, bom_inventory, on_order</code>
          </div>
        </div>
      </Dialog>

      {/* AI explanation drawer — opens after Suggest applies */}
      <ExplanationDrawer
        open={recDrawerOpen}
        onClose={() => setRecDrawerOpen(false)}
        title="Why these annual allocations"
        overall={rec?.summary}
        sections={
          rec?.rows.map((r): SectionedExplanation => ({
            title: `${r.periodKey} · ${r.otbCode ?? `${r.brandUuid.slice(0, 6)}…/${r.categoryUuid.slice(0, 6)}…`}`,
            subtitle: `OTB ${fmtMoneyCompact(r.recommendedOtbAmount, company.base_currency)}`,
            explanation: r.explanation,
          })) ?? []
        }
      />
    </div>
  );
}

// ── Quarter color palette — cycles every 3 periods (Apr-Jun, Jul-Sep, etc.) ─

interface PeriodPalette {
  accent: string;        // top stripe + active underline
  idleBg: string;        // bg when not active
  activeBg: string;      // bg when active
  borderIdle: string;
  borderActive: string;
  shadow: string;
  iconBgIdle: string;
  iconBgActive: string;
  iconFgIdle: string;
  iconFgActive: string;
  titleActive: string;
}

const QUARTER_PALETTE: PeriodPalette[] = [
  {
    // Q1 — sky blue
    accent:         'linear-gradient(90deg, #60a5fa, #38bdf8)',
    idleBg:         'var(--color-surface)',
    activeBg:       'linear-gradient(135deg, rgba(96,165,250,0.14), rgba(56,189,248,0.10))',
    borderIdle:     'var(--color-divider)',
    borderActive:   'rgba(96,165,250,0.45)',
    shadow:         'rgba(96,165,250,0.45)',
    iconBgIdle:     'rgba(96,165,250,0.12)',
    iconBgActive:   'linear-gradient(135deg, #60a5fa, #38bdf8)',
    iconFgIdle:     '#2176ff',
    iconFgActive:   '#fff',
    titleActive:    '#1d4ed8',
  },
  {
    // Q2 — violet
    accent:         'linear-gradient(90deg, #a78bfa, #c084fc)',
    idleBg:         'var(--color-surface)',
    activeBg:       'linear-gradient(135deg, rgba(167,139,250,0.16), rgba(192,132,252,0.10))',
    borderIdle:     'var(--color-divider)',
    borderActive:   'rgba(167,139,250,0.50)',
    shadow:         'rgba(167,139,250,0.45)',
    iconBgIdle:     'rgba(167,139,250,0.14)',
    iconBgActive:   'linear-gradient(135deg, #a78bfa, #c084fc)',
    iconFgIdle:     '#7c3aed',
    iconFgActive:   '#fff',
    titleActive:    '#6d28d9',
  },
  {
    // Q3 — teal / emerald
    accent:         'linear-gradient(90deg, #34d399, #10b981)',
    idleBg:         'var(--color-surface)',
    activeBg:       'linear-gradient(135deg, rgba(52,211,153,0.16), rgba(16,185,129,0.10))',
    borderIdle:     'var(--color-divider)',
    borderActive:   'rgba(52,211,153,0.50)',
    shadow:         'rgba(16,185,129,0.45)',
    iconBgIdle:     'rgba(16,185,129,0.14)',
    iconBgActive:   'linear-gradient(135deg, #34d399, #10b981)',
    iconFgIdle:     '#059669',
    iconFgActive:   '#fff',
    titleActive:    '#047857',
  },
  {
    // Q4 — warm coral / amber
    accent:         'linear-gradient(90deg, #fb923c, #f59e0b)',
    idleBg:         'var(--color-surface)',
    activeBg:       'linear-gradient(135deg, rgba(251,146,60,0.16), rgba(245,158,11,0.10))',
    borderIdle:     'var(--color-divider)',
    borderActive:   'rgba(251,146,60,0.50)',
    shadow:         'rgba(251,146,60,0.45)',
    iconBgIdle:     'rgba(251,146,60,0.16)',
    iconBgActive:   'linear-gradient(135deg, #fb923c, #f59e0b)',
    iconFgIdle:     '#b45309',
    iconFgActive:   '#fff',
    titleActive:    '#92400e',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────

function BudgetMeter({
  budgetSet,
  allocatedPct,
  overBudget,
  allocated,
  budget,
  currency,
}: {
  budgetSet: boolean;
  allocatedPct: number;
  overBudget: boolean;
  allocated: number;
  budget: number;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
}) {
  if (!budgetSet) {
    return (
      <div
        className="flex h-[38px] items-center gap-2 rounded-lg border px-3 text-xs"
        style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-tertiary)' }}
      >
        <Wallet size={12} />
        Set a budget to begin
      </div>
    );
  }
  const color = overBudget ? '#dc2626' : '#2176ff';
  const fillBg = overBudget
    ? 'linear-gradient(90deg, #ef4444, #f97316)'
    : 'linear-gradient(90deg, #60a5fa, #a78bfa)';
  return (
    <div
      className="flex h-[38px] flex-col justify-center rounded-lg border px-3"
      style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
    >
      <div className="flex items-baseline justify-between text-[11px]">
        <span className="tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
          {fmtMoneyCompact(allocated, currency)}{' '}
          <span style={{ color: 'var(--color-text-tertiary)' }}>of {fmtMoneyCompact(budget, currency)}</span>
        </span>
        <span className="font-semibold tabular-nums" style={{ color }}>
          {allocatedPct}%
        </span>
      </div>
      <div
        className="mt-1 h-1 w-full overflow-hidden rounded-full"
        style={{ background: 'color-mix(in srgb, var(--color-primary) 10%, transparent)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(100, allocatedPct)}%`, background: fillBg }}
        />
      </div>
    </div>
  );
}

function FooterStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'up' | 'down' | 'accent' | 'neutral';
}) {
  const color =
    tone === 'up' ? '#059669' : tone === 'down' ? '#dc2626' : tone === 'accent' ? 'var(--color-primary)' : 'var(--color-text-primary)';
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>
      <span className="font-semibold tabular-nums" style={{ color }}>
        {value}
      </span>
    </span>
  );
}

function ApprovedView({
  currency,
  annualTotalValue,
  onBack,
  onReset,
}: {
  currency: 'INR' | 'USD' | 'EUR' | 'GBP';
  annualTotalValue: number;
  onBack: () => void;
  onReset: () => void;
}) {
  const annual = useAnnualPlan();
  if (!annual) return null;

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        <div
          className="flex items-center justify-between gap-3 border-b px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-alt,#f8fafc)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
              title="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <h1 className="text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              Annual Plan
            </h1>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          <Card>
            <div className="flex flex-col gap-2 p-5">
              <Row label="Status" value={annual.state} />
              <Row label="Allocated" value={fmtMoney(annualTotalValue, currency)} />
              <Row label="Periods" value={String(Object.keys(annual.periods).length)} />
              {annual.approved_at && (
                <Row label="Submitted at" value={new Date(annual.approved_at).toLocaleString()} />
              )}
            </div>
          </Card>
          <Alert severity="success">
            Annual plan is locked as the baseline. Use the Dashboard to release individual periods.
          </Alert>
        </div>
        <div
          className="flex shrink-0 items-center justify-end gap-2 border-t px-4 py-2.5"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <Button variant="secondary" onClick={onBack}>
            Back to Dashboard
          </Button>
          <Button variant="danger" onClick={onReset}>
            Reset Plan (demo)
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex justify-between gap-4 border-b py-1.5 text-sm last:border-b-0"
      style={{ borderColor: 'var(--color-divider)' }}
    >
      <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** Year picker options centred on the demo clock — three years back, three
 *  ahead. Lets a buyer create plans for past years for the demo without
 *  fiddling with the date picker. Labels are just the year (2026, 2025…). */
function yearOptions(todayMs: number): { value: string; label: string }[] {
  const baseYear = new Date(todayMs).getFullYear();
  const years: number[] = [];
  for (let offset = -3; offset <= 3; offset += 1) years.push(baseYear + offset);
  return years.map((y) => ({ value: String(y), label: String(y) }));
}

function validateRows(annual: NonNullable<ReturnType<typeof useAnnualPlan>>): boolean {
  for (const period of Object.values(annual.periods)) {
    for (const row of period.rows) {
      if (row.planned_sales <= 0) return false;
      if (row.eom_inventory <= 0) return false;
      if (row.bom_inventory < 0 || row.on_order < 0 || row.markdowns < 0) return false;
      if (calcOtb(row) < 0) return false;
    }
  }
  return true;
}

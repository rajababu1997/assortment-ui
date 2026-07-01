/**
 * Option Plan editor — buyer screen.
 *
 *   ┌── Header (back · title · state badge · round) ───────────────────┐
 *   │── Revision banner (only when REVISIONS_REQUESTED)               │
 *   │── Conversation thread (collapsible)                             │
 *   │── Category KPI strip + trend chips + festival hint              │
 *   │── 4 band sections (entry · core · upper · statement)            │
 *   │     · KPI row · Avg/option input · derived Option Plan Qty      │
 *   │     · SalesInsightsPanel (collapsible)                          │
 *   │     · 3 SubGrids (Fabric Type · Fit · Composition)              │
 *   │── Sticky footer (validation summary · Save Draft · Submit)     │
 *   └─────────────────────────────────────────────────────────────────┘
 *
 * Editable when state ∈ {DRAFT, REVISIONS_REQUESTED}. SUBMITTED / APPROVED
 * states render the same body in read-only mode.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Layers3,
  RotateCcw,
  Save,
  Send,
  Sparkles,
} from 'lucide-react';
import { Button, Dialog, NumberInput, SpinnerCenter } from '@/components/primitives';
import { toast } from '@/lib/toast';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useDemoToday } from '@/hooks/useDemoClock';
import { FashionCalendar } from '@/components/calendar';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useSetupConfig, usePeriods } from '@/features/otb/useOtb';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { fmtMoney, fmtMoneyCompact } from '@/features/otb/utils/format';
// `fmtMoney` is used inside BandSection's MiniKpi; `fmtMoneyCompact` in the header info strip.
import { useApiValuePlansForPlan } from '@/features/value/useApiValuePlans';
import { hydrateValuePlans } from '@/store/slices/valuePlanSlice';
import { useValuePlan } from '@/features/value/useValue';
import { VP_STATES } from '@/features/value/constants';
import type { MrpBand } from '@/features/otb/types';

import { StateBadge } from '../components/StateBadge';
import { RevisionBanner } from '../components/RevisionBanner';
import { ConversationThread } from '../components/ConversationThread';
import { HistoricalSalesInsights } from '../components/HistoricalSalesInsights';
import { LastYearReference } from '../components/LastYearReference';
import { SubGrid } from '../components/SubGrid';
import { ReviewActionModal } from '../components/ReviewActionModal';
import {
  useApiOptionPlan,
  useSaveOptionPlan,
} from '../useApiOptionPlans';
import {
  OP_ACTIONS,
  OP_STATES,
  OPTION_TYPES,
  REVISION_COMMENT_MAX,
  REVISION_COMMENT_MIN,
  type OptionType,
} from '../constants';
import {
  calcOptionPlanQty,
  calcProductionQty,
} from '../utils/calc';
import { validateHard } from '../utils/hardValidation';
import { useOptionPlanInsights } from '@/features/sales/useInsights';
import type { OptionPlanInsights } from '@/features/sales/insightTypes';
import { useOptionRecommendation } from '@/features/recommendation/useRecommendation';
import { SuggestButton } from '@/features/recommendation/components/SuggestButton';
import { WhyAiButton } from '@/features/recommendation/components/WhyAiButton';
import { ExplanationDrawer, type SectionedExplanation } from '@/features/recommendation/components/ExplanationDrawer';
import type { OptionPlanRecommendation } from '@/features/recommendation/types';
import type { OptionBand, OptionLine, OptionPlan } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

const BAND_ORDER: MrpBand['id'][] = ['entry', 'core', 'upper', 'statement'];

function shiftPeriodLabelBackOneYear(label: string): string {
  const m = label.match(/^(.*?)(\d{4})\s*$/);
  if (!m) return label;
  const year = parseInt(m[2], 10);
  if (!Number.isFinite(year)) return label;
  return `${m[1].trim()} ${year - 1}`;
}

function formatRange(b: MrpBand): string {
  const min = (b.mrp_min ?? 0).toLocaleString();
  if (b.mrp_max == null) return `₹${min}+`;
  return `₹${min}–₹${b.mrp_max.toLocaleString()}`;
}

/** Build the seed bands when no OP exists yet — one entry per category band
 *  (whether or not VP allocated to it), so all 4 are visible in the UI. */
function seedFromVp(
  categoryBands: MrpBand[],
  vpBands: { band_id: MrpBand['id']; budget_pct: number; avg_cost: number }[],
  vpBudget: number,
): OptionBand[] {
  return categoryBands
    .slice()
    .sort((a, b) => BAND_ORDER.indexOf(a.id) - BAND_ORDER.indexOf(b.id))
    .map((cb) => {
      const vp = vpBands.find((b) => b.band_id === cb.id);
      const productionQty = vp ? calcProductionQty(vpBudget, {
        band_id: vp.band_id,
        budget_pct: vp.budget_pct,
        avg_mrp: 0,
        avg_cost: vp.avg_cost,
      }) : 0;
      return {
        band_id: cb.id,
        avg_production_qty_per_option: 0,
        option_plan_qty: 0,
        production_qty_snapshot: productionQty,
        lines: [],
      };
    });
}

// ══════════════════════════════════════════════════════════════════════════
// Page
// ══════════════════════════════════════════════════════════════════════════

export default function OptionPlanEditorPage() {
  const { planId, otbCode } = useParams<{ planId: string; otbCode: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { company, isLoading: setupLoading } = useSetupConfig();
  const annualQ = useApiAnnualPlans();
  const vpQ = useApiValuePlansForPlan(planId);
  const opQ = useApiOptionPlan(planId, otbCode);
  const { findCategory, isLoading: masterLoading } = useBrandCategoryLookup();
  const periods = usePeriods(planId);
  const vp = useValuePlan(otbCode);
  const saveMut = useSaveOptionPlan();

  // Hydrate redux on data arrival.
  useEffect(() => {
    if (annualQ.data && annualQ.data.length > 0) dispatch(hydrateAnnualPlans(annualQ.data));
  }, [annualQ.data, dispatch]);
  useEffect(() => {
    if (vpQ.data) dispatch(hydrateValuePlans(vpQ.data));
  }, [vpQ.data, dispatch]);

  if (
    setupLoading || annualQ.isLoading || vpQ.isLoading || opQ.isLoading || masterLoading || !company
  ) {
    return <SpinnerCenter />;
  }

  if (!vp || vp.state !== VP_STATES.APPROVED) {
    return (
      <Stranded
        title="Value Plan not approved"
        body="Approve the matching Value Plan before planning options for this OTB."
        onBack={() => navigate(`/option/${planId}`)}
      />
    );
  }

  const category = findCategory(vp.category_uuid);
  if (!category) {
    return (
      <Stranded
        title="Category not found"
        body="Category master data is missing for this OTB."
        onBack={() => navigate(`/option/${planId}`)}
      />
    );
  }

  const period = periods.find((p) => p.key === vp.period_key);
  const periodLabel = period?.label ?? vp.period_key;

  return (
    <EditorShell
      planId={planId!}
      otbCode={otbCode!}
      op={opQ.data ?? null}
      vpBudget={vp.budget_snapshot}
      vpBands={vp.bands.map((b) => ({
        band_id: b.band_id,
        budget_pct: b.budget_pct,
        avg_cost: b.avg_cost,
      }))}
      brandUuid={vp.brand_uuid}
      categoryUuid={vp.category_uuid}
      categoryName={category.name}
      categoryBands={category.bands}
      periodLabel={periodLabel}
      currency={company.base_currency}
      onBack={() => navigate(`/option/${planId}`)}
      saving={saveMut.isPending}
      onSave={async (action, bands, comment) => {
        try {
          await saveMut.mutateAsync({
            planId: planId!,
            otbCode: otbCode!,
            action,
            budget_snapshot: vp.budget_snapshot,
            comment,
            bands,
          });
          const successMessage: Record<string, string> = {
            [OP_ACTIONS.SAVE_DRAFT]: 'Draft saved',
            [OP_ACTIONS.SUBMIT]: 'Submitted to designer for review',
            [OP_ACTIONS.APPROVE]: 'Option Plan approved',
            [OP_ACTIONS.REQUEST_REVISIONS]: 'Sent back to buyer for revisions',
          };
          toast.success(successMessage[action] ?? 'Saved');
          // On a successful action, leave the editor and drop the user back
          // on the per-plan dashboard so they can see the period roll-up
          // update (counts shift, badges re-tint) and pick the next OTB.
          navigate(`/option/${planId}`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Save failed';
          toast.error(msg);
          throw e;
        }
      }}
    />
  );
}

function Stranded({ title, body, onBack }: { title: string; body: string; onBack: () => void }) {
  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border shadow-sm"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {title}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{body}</p>
        <Button variant="secondary" leftIcon={<ArrowLeft size={13} />} onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Editor shell — owns the draft state. Replaces draft from server on every
// successful save so derived qty / option_plan_qty stay authoritative.
// ══════════════════════════════════════════════════════════════════════════

interface ShellProps {
  planId: string;
  otbCode: string;
  op: OptionPlan | null;
  vpBudget: number;
  vpBands: Array<{ band_id: MrpBand['id']; budget_pct: number; avg_cost: number }>;
  brandUuid: string;
  categoryUuid: string;
  categoryName: string;
  categoryBands: MrpBand[];
  periodLabel: string;
  currency: string;
  onBack: () => void;
  saving: boolean;
  onSave: (
    action: typeof OP_ACTIONS[keyof typeof OP_ACTIONS],
    bands: OptionBand[],
    comment?: string,
  ) => Promise<void>;
}

function EditorShell(props: ShellProps) {
  const {
    op, vpBudget, vpBands, brandUuid, categoryUuid, categoryName, categoryBands,
    periodLabel, otbCode, planId, onBack, saving, onSave,
  } = props;

  const editable = !op || op.state === OP_STATES.DRAFT || op.state === OP_STATES.REVISIONS_REQUESTED;
  const reviewing = op?.state === OP_STATES.SUBMITTED;
  // Role-gate the footer actions. Admin sees everything; buyer + designer
  // both can edit/submit drafts (designer was previously read-only on
  // editable states — relaxed per request so designers can iterate too).
  // Designer + admin retain the review actions when the OP is SUBMITTED.
  const { isAdmin, isBuyer, isDesigner, rawRoles } = useUserRoles();
  const canDoBuyerActions = (isAdmin || isBuyer || isDesigner) && editable;
  // Buyers never get Approve / Request Revisions — those are designer-only.
  // We check the raw role list (not the convenience `isBuyer`, which includes
  // admins) so a real admin without a buyer role still keeps the review actions.
  const hasBuyerRole = rawRoles.some((r) => r.includes('buyer'));
  const canDoDesignerActions = (isAdmin || isDesigner) && reviewing && !hasBuyerRole;
  // Designer may edit during review and approve with new values — the backend
  // persists the bands sent alongside APPROVE in that case.
  const writable = canDoBuyerActions || canDoDesignerActions;
  const [modal, setModal] = useState<null | 'approve' | 'revisions'>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayMs = useDemoToday();

  // ── AI Suggest ───────────────────────────────────────────────────────────
  const recMut = useOptionRecommendation();
  const [rec, setRec] = useState<OptionPlanRecommendation | null>(null);
  const [recGeneratedAt, setRecGeneratedAt] = useState<number | null>(null);
  const [recDrawerOpen, setRecDrawerOpen] = useState(false);

  // ── Draft state. Hydrate from OP if present, else seed from VP.
  const [draft, setDraft] = useState<OptionBand[]>(() =>
    op ? cloneBands(op.bands, categoryBands) : seedFromVp(categoryBands, vpBands, vpBudget),
  );
  useEffect(() => {
    if (op) setDraft(cloneBands(op.bands, categoryBands));
  }, [op, categoryBands]);

  // ── Derive production_qty + option_plan_qty live (server confirms on save).
  const enrichedDraft = useMemo<OptionBand[]>(() => {
    return draft.map((band) => {
      const vp = vpBands.find((v) => v.band_id === band.band_id);
      const productionQty = calcProductionQty(vpBudget, vp ? {
        band_id: vp.band_id,
        budget_pct: vp.budget_pct,
        avg_mrp: 0,
        avg_cost: vp.avg_cost,
      } : undefined);
      return {
        ...band,
        production_qty_snapshot: productionQty,
        option_plan_qty: calcOptionPlanQty(productionQty, band.avg_production_qty_per_option),
      };
    });
  }, [draft, vpBands, vpBudget]);

  // ── Sales Insights — fetched from `/sales/*`. Same data the dashboard
  // reads. Returns `undefined` while in flight; downstream consumers
  // already accept the undefined case (see HistoricalSalesInsights props).
  const { data: insights } = useOptionPlanInsights({
    brand_uuid: brandUuid,
    category_uuid: categoryUuid,
    category_label: categoryName,
    ly_period_label: shiftPeriodLabelBackOneYear(periodLabel),
    band_ids: categoryBands.map((b) => b.id),
  });

  // ── Mutation handlers (state setters).
  const setBandAvg = (bandId: MrpBand['id'], val: number) => {
    if (!writable) return;
    setDraft((prev) =>
      prev.map((b) => (b.band_id === bandId ? { ...b, avg_production_qty_per_option: val } : b)),
    );
  };
  const setLine = (bandId: MrpBand['id'], optionType: OptionType, key: string, label: string, qty: number) => {
    if (!writable) return;
    setDraft((prev) =>
      prev.map((b) => {
        if (b.band_id !== bandId) return b;
        const others = b.lines.filter((l) => !(l.option_type === optionType && l.sub_type_key === key));
        const next: OptionLine = { option_type: optionType, sub_type_key: key, sub_type_label: label, qty };
        return { ...b, lines: qty > 0 ? [...others, next] : others };
      }),
    );
  };

  // ── Suggest handler — replaces draft bands with AI-recommended ones.
  const handleSuggest = async () => {
    const hasEntries = draft.some(
      (b) => (b.avg_production_qty_per_option ?? 0) > 0 || b.lines.some((l) => (l.qty ?? 0) > 0),
    );
    if (hasEntries && !window.confirm(
      'This will replace your current entries with system suggestions. Continue?',
    )) return;
    try {
      const result = await recMut.mutateAsync({ planUuid: planId, otbCode });
      setRec(result);
      setRecGeneratedAt(Date.now());
      // Map recommended bands → draft OptionBand[]. Categories that didn't
      // get a recommendation keep their existing draft entries (preserves
      // 0% bands).
      const next: OptionBand[] = categoryBands.map((master) => {
        const r = result.bands.find((rb) => rb.bandId === master.id);
        const existing = draft.find((b) => b.band_id === master.id);
        if (!r) return existing ?? {
          band_id: master.id,
          avg_production_qty_per_option: 0,
          option_plan_qty: 0,
          production_qty_snapshot: 0,
          lines: [],
        };
        return {
          band_id: master.id,
          avg_production_qty_per_option: r.avgProductionQtyPerOption,
          option_plan_qty: Number(r.optionPlanQty),
          production_qty_snapshot: Number(r.productionQtySnapshot),
          lines: r.lines.map((l) => ({
            option_type: l.optionType,
            sub_type_key: l.subTypeKey,
            sub_type_label: l.subTypeLabel,
            qty: Number(l.qty),
          })),
        };
      });
      setDraft(next);
      toast.success('System suggestions applied — review and edit any field.');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[option-editor] suggest failed', err);
      toast.error('Could not generate suggestions — try again');
    }
  };

  // ── Validation. Reused for the footer summary + Submit gate.
  //
  // "Must-fill" bands = the ones the Value Plan allocated budget_pct > 0 to.
  // Driving it off VP (not the buyer's own derived option_plan_qty) ensures
  // an empty option-plan form blocks Submit even before the buyer types
  // anything in. Bands with no VP budget remain locked / zero-only.
  const mustFillBandIds = useMemo(
    () =>
      new Set(
        vpBands
          .filter((v) => (v.budget_pct ?? 0) > 0)
          .map((v) => v.band_id),
      ),
    [vpBands],
  );
  const errors = useMemo(
    () => validateHard(enrichedDraft, mustFillBandIds),
    [enrichedDraft, mustFillBandIds],
  );
  const canSubmit = editable && errors.length === 0 && !saving;

  // ── Save handlers.
  const submitDraft = async () => {
    await onSave(OP_ACTIONS.SAVE_DRAFT, enrichedDraft.map(stripDerived));
  };
  const submitSubmit = async () => {
    if (errors.length > 0) {
      toast.error(errors[0].message);
      return;
    }
    await onSave(OP_ACTIONS.SUBMIT, enrichedDraft.map(stripDerived));
  };

  // Footer content extracted so the same JSX renders inside the scrollable
  // card without sticky-positioning gotchas.
  const footerContent = (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
      <div className="flex items-center gap-2 text-xs">
        {reviewing ? (
          errors.length === 0 ? (
            <span className="text-emerald-700">
              All checks pass — round {op?.current_round_no ?? 1} ready to approve.
            </span>
          ) : (
            <span className="text-amber-700">
              {errors.length} issue{errors.length > 1 ? 's' : ''} blocking approval · round{' '}
              {op?.current_round_no ?? 1}
            </span>
          )
        ) : errors.length === 0 ? (
          <span className="text-emerald-700">
            {editable ? 'All checks pass — ready to submit.' : 'Approved.'}
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {canDoBuyerActions && (
          <>
            <Button variant="secondary" size="sm" leftIcon={<Save size={13} />} disabled={saving} onClick={submitDraft}>
              Save Draft
            </Button>
            <Button variant="primary" size="sm" leftIcon={<Send size={13} />} disabled={!canSubmit} onClick={submitSubmit}>
              Submit to Designer
            </Button>
          </>
        )}
        {canDoDesignerActions && (
          <>
            <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={13} />} disabled={saving}
              onClick={() => setModal('revisions')}>
              Request Revisions
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckCircle2 size={13} />}
              disabled={saving || errors.length > 0}
              title={errors.length > 0 ? errors[0].message : undefined}
              onClick={() => setModal('approve')}
            >
              Approve
            </Button>
          </>
        )}
        {!editable && !reviewing && (
          <span className="text-xs text-slate-500">Read-only · approved</span>
        )}
        {/* Role mismatch: OP needs an action but logged-in user can't perform it. */}
        {editable && !canDoBuyerActions && (
          <span className="text-xs text-slate-500">Read-only · buyer action required</span>
        )}
        {reviewing && !canDoDesignerActions && (
          <span className="text-xs text-slate-500">Read-only · designer action required</span>
        )}
      </div>
    </div>
  );

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
              title="Back to Option Planning"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <h1
                className="flex items-center gap-2 text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Option Plan
                <span className="font-mono text-[11px] tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
                  {otbCode}
                </span>
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {categoryName} · {periodLabel}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            {writable && isBuyer && (
              <SuggestButton
                loading={recMut.isPending}
                hasResult={!!rec}
                onClick={handleSuggest}
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CalendarDays size={13} />}
              onClick={() => setCalendarOpen(true)}
              title="Festivals, sale windows, marriage season & collection drops"
            >
              Calendar
            </Button>
            <span>Round {op?.current_round_no ?? 1}</span>
            {op ? <StateBadge state={op.state} /> : (
              <span className="rounded-full px-2 py-0.5" style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}>
                Not started
              </span>
            )}
            {rec && recGeneratedAt && (
              <WhyAiButton
                generatedAtMs={recGeneratedAt}
                onClick={() => setRecDrawerOpen(true)}
              />
            )}
          </div>
        </div>

        {/* ── Info strip ─────────────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-stretch gap-2 border-b px-3 py-2.5"
          style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface-alt, #f8fafc)' }}
        >
          <InfoTileLite icon={<Layers3 size={13} />} label="OTB Budget" value={fmtMoneyCompact(vpBudget, 'INR')} tone="accent" />
          <InfoTileLite
            icon={<Layers3 size={13} />}
            label="Active bands"
            value={String(enrichedDraft.filter((b) => (b.option_plan_qty ?? 0) > 0).length)}
            tone="info"
          />
          <InfoTileLite
            icon={<Layers3 size={13} />}
            label="Total options"
            value={String(enrichedDraft.reduce((s, b) => s + (b.option_plan_qty ?? 0), 0))}
            tone="info"
          />
          {errors.length > 0 ? (
            <InfoTileLite icon={<Layers3 size={13} />} label="Validation" value={`${errors.length} issue${errors.length > 1 ? 's' : ''}`} tone="danger" />
          ) : (
            <InfoTileLite icon={<Layers3 size={13} />} label="Validation" value="Ready" tone="success" />
          )}
        </div>

        {/* ── Body — scrollable ──────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
          {op?.state === OP_STATES.REVISIONS_REQUESTED && (
            <RevisionBanner comments={op.comments} />
          )}

          <ConversationThread comments={op?.comments ?? []} />

          <HistoricalSalesInsights
            categoryLabel={categoryName}
            periodLabel={`LY ${insights?.ly_period_label ?? ''}`}
            categoryBands={categoryBands}
            brandUuid={brandUuid}
            categoryUuid={categoryUuid}
          />

          {/* Band sections */}
          <div className="flex flex-col gap-3">
            {enrichedDraft.map((band) => {
              const meta = categoryBands.find((cb) => cb.id === band.band_id);
              const vp = vpBands.find((v) => v.band_id === band.band_id);
              const inactive = !vp || (vp.budget_pct ?? 0) <= 0;
              return (
                <BandSection
                  key={band.band_id}
                  band={band}
                  master={meta!}
                  inactive={inactive}
                  vpPct={vp?.budget_pct ?? 0}
                  vpAvgCost={vp?.avg_cost ?? 0}
                  vpBudget={vpBudget}
                  insights={insights}
                  readOnly={!writable || inactive}
                  brandUuid={brandUuid}
                  categoryUuid={categoryUuid}
                  onChangeAvgPerOption={(v) => setBandAvg(band.band_id, v)}
                  onChangeLineQty={(ot, k, l, q) => setLine(band.band_id, ot, k, l, q)}
                />
              );
            })}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="border-t" style={{ borderColor: 'var(--color-divider)' }}>
          {footerContent}
        </div>
      </div>

      <ReviewActionModal
        open={modal === 'approve'}
        requireComment={false}
        title="Approve Option Plan"
        description="The buyer can proceed to article creation once approved. You can leave an optional note."
        confirmLabel="Approve plan"
        confirmTone="primary"
        busy={saving}
        onCancel={() => setModal(null)}
        onConfirm={async (comment) => {
          // Send the (possibly designer-edited) bands so the server persists
          // them as part of the APPROVE transition. Backend re-validates.
          await onSave(OP_ACTIONS.APPROVE, enrichedDraft.map(stripDerived), comment);
          setModal(null);
        }}
      />
      <ReviewActionModal
        open={modal === 'revisions'}
        requireComment
        title="Request Revisions"
        description="Tell the buyer what to change. They'll see this as a pinned banner on their next visit."
        confirmLabel="Send back to buyer"
        confirmTone="warning"
        busy={saving}
        onCancel={() => setModal(null)}
        onConfirm={async (comment) => {
          await onSave(OP_ACTIONS.REQUEST_REVISIONS, [], comment);
          setModal(null);
        }}
      />

      {/* Fashion-planning calendar — same one used on OTB Annual planning.
          Year is derived from the OTB period label, falling back to demo "today". */}
      <Dialog
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="Fashion Planning Calendar"
        description="Festivals, sale windows, marriage season, climate cycles & collection drops — use this to align your Option Plan to the year's revenue peaks."
        size="full"
      >
        <div className="p-2">
          <FashionCalendar
            year={
              parseInt(periodLabel.match(/\d{4}/)?.[0] ?? '', 10) ||
              new Date(todayMs).getFullYear()
            }
            highlightDate={new Date(todayMs).toISOString().slice(0, 10)}
          />
        </div>
      </Dialog>

      {/* AI explanation drawer — opens after Suggest applies */}
      <ExplanationDrawer
        open={recDrawerOpen}
        onClose={() => setRecDrawerOpen(false)}
        title={`Why these option allocations — ${otbCode}`}
        overall={rec?.summary}
        sections={
          rec?.bands.map((b): SectionedExplanation => ({
            title: `${b.bandId.toUpperCase()} · ${b.optionPlanQty} options`,
            subtitle: `${b.productionQtySnapshot.toLocaleString()} units · ${b.avgProductionQtyPerOption.toLocaleString()} per option`,
            explanation: b.explanation,
          })) ?? []
        }
      />
    </div>
  );
}

// Strip server-derived fields before sending — backend recomputes them.
function stripDerived(b: OptionBand): OptionBand {
  return {
    band_id: b.band_id,
    avg_production_qty_per_option: b.avg_production_qty_per_option,
    option_plan_qty: 0, // server will fill
    production_qty_snapshot: 0, // server will fill
    lines: b.lines.filter((l) => (l.qty ?? 0) > 0),
  };
}

// Make sure every category band is represented in the draft — keeps the UI
// rendering all 4 sections even if the server returned only a subset.
function cloneBands(opBands: OptionBand[], categoryBands: MrpBand[]): OptionBand[] {
  return categoryBands
    .slice()
    .sort((a, b) => BAND_ORDER.indexOf(a.id) - BAND_ORDER.indexOf(b.id))
    .map((cb) => {
      const existing = opBands.find((b) => b.band_id === cb.id);
      if (existing) return { ...existing, lines: existing.lines.map((l) => ({ ...l })) };
      return {
        band_id: cb.id,
        avg_production_qty_per_option: 0,
        option_plan_qty: 0,
        production_qty_snapshot: 0,
        lines: [],
      };
    });
}

// ══════════════════════════════════════════════════════════════════════════
// Info tile — small tinted pill used in the editor's top info strip
// ══════════════════════════════════════════════════════════════════════════

type TileTone = 'accent' | 'info' | 'success' | 'warning' | 'danger' | 'muted';

const TILE_TONE: Record<TileTone, { bg: string; fg: string; iconBg: string }> = {
  accent:  { bg: 'bg-indigo-50',  fg: 'text-indigo-700',  iconBg: 'bg-indigo-100' },
  info:    { bg: 'bg-blue-50',    fg: 'text-blue-700',    iconBg: 'bg-blue-100' },
  success: { bg: 'bg-emerald-50', fg: 'text-emerald-700', iconBg: 'bg-emerald-100' },
  warning: { bg: 'bg-amber-50',   fg: 'text-amber-700',   iconBg: 'bg-amber-100' },
  danger:  { bg: 'bg-red-50',     fg: 'text-red-700',     iconBg: 'bg-red-100' },
  muted:   { bg: 'bg-slate-50',   fg: 'text-slate-700',   iconBg: 'bg-slate-100' },
};

function InfoTileLite({
  icon, label, value, tone = 'muted',
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  tone?: TileTone;
}) {
  const t = TILE_TONE[tone];
  return (
    <div className={`flex min-w-[140px] items-center gap-2 rounded-lg border border-transparent ${t.bg} px-2.5 py-1.5`}>
      {icon && (
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${t.iconBg} ${t.fg}`}>
          {icon}
        </span>
      )}
      <div className="min-w-0 leading-tight">
        <div className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          {label}
        </div>
        <div className={`mt-0.5 text-xs font-semibold tabular-nums ${t.fg}`}>{value}</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// One band section (range)
// ══════════════════════════════════════════════════════════════════════════

interface BandSectionProps {
  band: OptionBand;
  master: MrpBand;
  inactive: boolean;
  vpPct: number;
  vpAvgCost: number;
  vpBudget: number;
  insights: OptionPlanInsights | undefined;
  readOnly: boolean;
  brandUuid: string;
  categoryUuid: string;
  onChangeAvgPerOption: (v: number) => void;
  onChangeLineQty: (ot: OptionType, key: string, label: string, qty: number) => void;
}

function BandSection({
  band, master, inactive, vpPct, vpAvgCost, vpBudget, insights, readOnly,
  brandUuid, categoryUuid,
  onChangeAvgPerOption, onChangeLineQty,
}: BandSectionProps) {
  const bandBudget = Math.round((vpBudget * vpPct) / 100);

  return (
    <section
      className="rounded-xl border"
      style={{
        background: inactive ? 'rgba(148,163,184,0.06)' : 'var(--color-surface)',
        borderColor: 'var(--color-divider)',
        opacity: inactive ? 0.75 : 1,
      }}
    >
      {/* Range header */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2.5"
        style={{
          borderColor: 'var(--color-divider)',
          background: inactive ? 'transparent' : 'var(--color-surface-alt, #f8fafc)',
        }}
      >
        <div className="leading-tight">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
            {master.label} · {formatRange(master)}
          </div>
          {inactive && (
            <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--color-text-tertiary)' }}>
              Not allocated this period
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MiniKpi
            label="Budget"
            value={vpPct > 0 ? `${fmtMoney(bandBudget, 'INR')} · ${vpPct}%` : '—'}
            highlight
          />
          <MiniKpi label="Avg cost" value={vpAvgCost > 0 ? fmtMoney(vpAvgCost, 'INR') : '—'} />
          <MiniKpi label="Production Qty" value={band.production_qty_snapshot.toLocaleString()} />
          <MiniKpi label="Option Plan Qty" value={band.option_plan_qty.toLocaleString()} highlight />
        </div>
      </div>

      {/* Input row — label + input inline, single row */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b px-3.5 py-2"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <div className="flex items-center gap-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
            Average production qty
            <span className="ml-0.5 text-red-600">*</span>
          </label>
          <div style={{ width: 140 }}>
            <NumberInput
              value={band.avg_production_qty_per_option || null}
              onChange={(v) => onChangeAvgPerOption(Math.max(0, Math.floor(v ?? 0)))}
              min={0}
              step={10}
              disabled={readOnly}
              suffix="units"
            />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
            Option plan qty
          </label>
          <span className="text-[20px] font-semibold leading-none" style={{ color: 'var(--color-primary)' }}>
            {band.option_plan_qty.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Last year reference hidden — engine's avg/option floor and zero-history
          sub-type rules make the LY comparison misleading for premium bands.
          Re-enable when the engine's per-band rules are tuned. */}

      {/* Sub-grids */}
      <div className="grid grid-cols-1 gap-3 px-3.5 py-3 lg:grid-cols-3">
        {([OPTION_TYPES.FABRIC_TYPE, OPTION_TYPES.FIT, OPTION_TYPES.COMPOSITION] as const).map((ot) => (
          <SubGrid
            key={ot}
            band={band}
            optionType={ot}
            cap={band.option_plan_qty}
            readOnly={readOnly}
            onChange={(k, l, q) => onChangeLineQty(ot, k, l, q)}
          />
        ))}
      </div>
    </section>
  );
}

function MiniKpi({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-md border px-2.5 py-1.5"
      style={{
        borderColor: 'var(--color-divider)',
        background: highlight ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'var(--color-surface-alt, #fafbfc)',
      }}
    >
      <span
        className="text-[10.5px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {label}
      </span>
      <span
        className="text-[14px] font-semibold tabular-nums"
        style={{ color: highlight ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

// Local guard against accidentally exporting the comment-window constants
// without using them somewhere — keeps the lint happy.
void REVISION_COMMENT_MIN;
void REVISION_COMMENT_MAX;

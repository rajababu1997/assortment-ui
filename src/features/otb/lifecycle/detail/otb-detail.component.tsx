/**
 * OTB Detail page — `/otb/:planId/:otbCode/detail`.
 *
 *   ┌── Header (back · OTB code · lifecycle badge · brand · category) ──┐
 *   │── OTB KPI strip (amount · period dates · plan)                   │
 *   │── Stage strip (5 cards · Planned → … → Final)                    │
 *   │── Final Approve banner (when OPTION_PLANNED)                     │
 *   │── Value Plan summary card                                         │
 *   │── Option Plan summary card                                        │
 *   │── Audit log (chronological timeline)                              │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Source of truth: `GET /otb/lifecycle/{planId}/{otbCode}/detail` returns
 * the whole bundle in one round-trip. Final-approve mutation invalidates
 * the same cache key so the page rerenders without a navigate.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck2,
  Layers3,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button, SpinnerCenter } from '@/components/primitives';
import { toast } from '@/lib/toast';
import { useSetupConfig } from '@/features/otb/useOtb';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { fmtMoney } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { MrpBand } from '@/features/otb/types';
import {
  OPTION_TYPES,
  OPTION_TYPE_LABELS,
  OP_STATE_LABELS,
  SUB_TYPE_CATALOGUE,
  type OptionType,
} from '../../../option/constants';
import { ConversationThread } from '../../../option/components/ConversationThread';
import { VP_STATE_LABELS } from '../../../value/constants';
import {
  useApiOtbDetail,
  useFinalApproveOtb,
} from '../useApiOtbLifecycle';
import { LIFECYCLE_STATES } from '../constants';
import { LifecycleBadge } from '../components/LifecycleBadge';
import { StageStrip } from '../components/StageStrip';
import { TimelineStrip } from '../components/TimelineStrip';
import { FinalApproveModal } from '../components/FinalApproveModal';
import type { OtbRowBaseline, OptionPlanDetail, ValuePlanDetail } from '../types';

export default function OtbDetailPage() {
  const navigate = useNavigate();
  const { planId, otbCode } = useParams<{ planId: string; otbCode: string }>();
  const { company } = useSetupConfig();
  const { findBrand, findCategory } = useBrandCategoryLookup();
  const { data, isLoading, isFetching, refetch } = useApiOtbDetail(planId, otbCode);
  const finalApprove = useFinalApproveOtb();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading || !data || !planId || !otbCode) {
    return <SpinnerCenter />;
  }

  const { summary, value_plan: vp, option_plan: op, timeline } = data;
  const brand = findBrand(summary.brand_uuid);
  const category = findCategory(summary.category_uuid);
  const currency = (company?.base_currency ?? 'INR') as BaseCurrency;
  const canFinalise = summary.lifecycle_state === LIFECYCLE_STATES.OPTION_PLANNED;

  const onFinalApprove = async (note?: string) => {
    try {
      await finalApprove.mutateAsync({ planId, otbCode, note });
      toast.success('OTB final-approved');
      setModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to finalise';
      toast.error(msg);
    }
  };

  return (
    <div className="flex h-full w-full flex-col p-1">
      <div
        className="flex h-full flex-col overflow-hidden rounded-2xl border"
        style={{ borderColor: 'var(--color-divider)', background: 'var(--color-surface)' }}
      >
        {/* Header */}
        <header
          className="flex items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <button
            type="button"
            onClick={() => navigate('/otb/all')}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
            aria-label="Back"
          >
            <ArrowLeft size={15} />
          </button>
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <h1 className="text-[15px] font-semibold text-slate-900">{summary.otb_code}</h1>
            <LifecycleBadge state={summary.lifecycle_state} />
            <span className="text-[12px] text-slate-500">
              {brand?.name ?? summary.brand_uuid} · {category?.name ?? summary.category_uuid} · {summary.period_key}
            </span>
          </div>
          {canFinalise && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<ShieldCheck size={13} />}
              onClick={() => setModalOpen(true)}
            >
              Final approve
            </Button>
          )}
          {/* Manual refresh — bypasses TanStack's 30s staleTime so the
              timeline + stage cards update right after an external action
              (VP approve, OP approve, lifecycle event from another tab). */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Refresh"
            title={isFetching ? 'Refreshing…' : 'Refresh data'}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </header>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
          {/* KPI strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
            <Kpi label="OTB amount" value={fmtMoney(summary.otb_amount, currency)} />
            <Kpi label="Plan" value={summary.plan_name ?? summary.plan_id} />
            <Kpi
              label="Period"
              value={
                summary.period_start_iso && summary.period_end_iso
                  ? `${summary.period_start_iso} → ${summary.period_end_iso}`
                  : summary.period_key
              }
            />
            <Kpi
              label="Released"
              value={summary.released_at ? new Date(summary.released_at).toLocaleDateString() : '—'}
            />
            <Kpi
              label="Last modified"
              value={summary.modified_time ? new Date(summary.modified_time).toLocaleString() : '—'}
            />
          </div>

          {/* Stage strip */}
          <StageStrip summary={summary} />

          {/* OTB inputs (Step 1) — what the buyer typed during annual plan setup */}
          <OtbInputsSection row={data.row} currency={currency} />

          {/* Final approval banner */}
          {summary.lifecycle_state === LIFECYCLE_STATES.FINAL_APPROVED && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={13} />
                Finalised on {summary.final_approved_at ? new Date(summary.final_approved_at).toLocaleString() : '—'}
              </div>
              {summary.final_approval_note && (
                <div className="mt-1 italic">“{summary.final_approval_note}”</div>
              )}
            </div>
          )}

          {/* VP — Step 2 inputs */}
          <SummaryCard
            title="Value Plan"
            Icon={FileCheck2}
            empty={!vp}
            emptyLabel="No Value Plan yet."
          >
            {vp && (
              <ValuePlanSection
                vp={vp}
                currency={currency}
                categoryBands={category?.bands ?? []}
              />
            )}
          </SummaryCard>

          {/* OP — Step 3 inputs */}
          <SummaryCard
            title="Option Plan"
            Icon={Layers3}
            empty={!op}
            emptyLabel="No Option Plan yet."
          >
            {op && (
              <OptionPlanSection
                op={op}
                currency={currency}
                categoryBands={category?.bands ?? []}
              />
            )}
          </SummaryCard>

          {/* Conversation thread (OP comments) */}
          {op && op.comments.length > 0 && (
            <ConversationThread comments={op.comments} />
          )}

          {/* Audit log */}
          <TimelineStrip events={timeline} />
        </div>
      </div>

      <FinalApproveModal
        open={modalOpen}
        busy={finalApprove.isPending}
        onCancel={() => setModalOpen(false)}
        onConfirm={onFinalApprove}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px]">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">{value}</span>
    </span>
  );
}

interface SummaryCardProps {
  title: string;
  Icon: typeof Layers3;
  empty: boolean;
  emptyLabel: string;
  children?: React.ReactNode;
}

function SummaryCard({ title, Icon, empty, emptyLabel, children }: SummaryCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <Icon size={14} className="text-slate-500" />
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">{title}</h3>
      </header>
      <div className="px-3 py-2">
        {empty ? (
          <span className="text-[12px] italic text-slate-500">{emptyLabel}</span>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

// ── OTB Inputs (Step 1) ─────────────────────────────────────────────────

function OtbInputsSection({ row, currency }: { row: OtbRowBaseline; currency: BaseCurrency }) {
  const cells: Array<{ key: keyof OtbRowBaseline; baselineKey: keyof OtbRowBaseline; label: string }> = [
    { key: 'planned_sales', baselineKey: 'baseline_planned_sales', label: 'Planned sales' },
    { key: 'markdowns',     baselineKey: 'baseline_markdowns',     label: 'Markdowns' },
    { key: 'eom_inventory', baselineKey: 'baseline_eom_inventory', label: 'EOM inventory' },
    { key: 'bom_inventory', baselineKey: 'baseline_bom_inventory', label: 'BOM inventory' },
    { key: 'on_order',      baselineKey: 'baseline_on_order',      label: 'On order' },
  ];
  const hasAnyBaseline = cells.some((c) => row[c.baselineKey] != null);

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <header className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
        <FileCheck2 size={14} className="text-slate-500" />
        <h3 className="text-[12px] font-semibold uppercase tracking-wider text-slate-600">OTB inputs</h3>
        <span className="ml-auto text-[11px] text-slate-500">Step 1 · buyer values</span>
      </header>
      <div className="overflow-x-auto px-3 py-2">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-1 pr-3 font-semibold">Field</th>
              <th className="py-1 pr-3 text-right font-semibold tabular-nums">Current</th>
              {hasAnyBaseline && (
                <th className="py-1 pr-3 text-right font-semibold tabular-nums">Baseline (at approval)</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cells.map((c) => {
              const current = row[c.key] as number | undefined;
              const baseline = row[c.baselineKey] as number | undefined;
              const drift = baseline != null && current != null && current !== baseline;
              return (
                <tr key={c.key}>
                  <td className="py-1 pr-3 text-slate-700">{c.label}</td>
                  <td className={`py-1 pr-3 text-right tabular-nums ${drift ? 'font-semibold text-amber-700' : 'text-slate-900'}`}>
                    {fmtMoney(current ?? 0, currency)}
                  </td>
                  {hasAnyBaseline && (
                    <td className="py-1 pr-3 text-right tabular-nums text-slate-500">
                      {baseline != null ? fmtMoney(baseline, currency) : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
            <tr className="border-t border-slate-200">
              <td className="py-1 pr-3 font-semibold text-slate-900">OTB amount (derived)</td>
              <td className="py-1 pr-3 text-right font-semibold tabular-nums text-slate-900">
                {fmtMoney(row.otb_amount, currency)}
              </td>
              {hasAnyBaseline && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Value Plan section (Step 2) ────────────────────────────────────────

function ValuePlanSection({
  vp,
  currency,
  categoryBands,
}: {
  vp: ValuePlanDetail;
  currency: BaseCurrency;
  categoryBands: MrpBand[];
}) {
  const budget = vp.budget_snapshot;
  const byId = new Map(categoryBands.map((b) => [b.id, b] as const));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-slate-700">
        <Kpi label="State" value={VP_STATE_LABELS[vp.state] ?? vp.state} />
        <Kpi label="Budget snapshot" value={fmtMoney(budget, currency)} />
        <Kpi label="Approved" value={vp.approved_at ? new Date(vp.approved_at).toLocaleDateString() : '—'} />
        <Kpi label="Bands" value={`${vp.bands.length}`} />
      </div>
      {vp.bands.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-1 pr-3 font-semibold">MRP range</th>
                <th className="py-1 pr-3 font-semibold">Cost range</th>
                <th className="py-1 pr-3 text-right font-semibold tabular-nums">Budget %</th>
                <th className="py-1 pr-3 text-right font-semibold tabular-nums">Band budget</th>
                <th className="py-1 pr-3 text-right font-semibold tabular-nums">Avg MRP</th>
                <th className="py-1 pr-3 text-right font-semibold tabular-nums">Avg cost</th>
                <th className="py-1 pr-3 text-right font-semibold tabular-nums">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vp.bands.map((b) => {
                const master = byId.get(b.band_id);
                const bandBudget = Math.floor((budget * (b.budget_pct ?? 0)) / 100);
                const margin = b.avg_mrp > 0 ? ((b.avg_mrp - b.avg_cost) / b.avg_mrp) * 100 : 0;
                return (
                  <tr key={b.band_id}>
                    <td className="py-1 pr-3 font-semibold text-slate-900">{fmtMrpRange(master, currency)}</td>
                    <td className="py-1 pr-3 text-slate-700">{fmtCostRange(master, currency)}</td>
                    <td className="py-1 pr-3 text-right tabular-nums text-slate-900">{b.budget_pct}%</td>
                    <td className="py-1 pr-3 text-right tabular-nums text-slate-900">{fmtMoney(bandBudget, currency)}</td>
                    <td className="py-1 pr-3 text-right tabular-nums text-slate-900">{fmtMoney(b.avg_mrp, currency)}</td>
                    <td className="py-1 pr-3 text-right tabular-nums text-slate-900">{fmtMoney(b.avg_cost, currency)}</td>
                    <td className="py-1 pr-3 text-right tabular-nums text-slate-900">{margin.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function fmtMrpRange(b: MrpBand | undefined, currency: BaseCurrency): string {
  if (!b) return '—';
  const min = fmtMoney(b.mrp_min, currency);
  if (b.mrp_max == null) return `${min}+`;
  return `${min} – ${fmtMoney(b.mrp_max, currency)}`;
}

function fmtCostRange(b: MrpBand | undefined, currency: BaseCurrency): string {
  if (!b) return '—';
  return `${fmtMoney(b.cost_min, currency)} – ${fmtMoney(b.cost_max, currency)}`;
}

// ── Option Plan section (Step 3) ───────────────────────────────────────

function OptionPlanSection({
  op,
  currency,
  categoryBands,
}: {
  op: OptionPlanDetail;
  currency: BaseCurrency;
  categoryBands: MrpBand[];
}) {
  const byId = new Map(categoryBands.map((b) => [b.id, b] as const));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-slate-700">
        <Kpi label="State" value={OP_STATE_LABELS[op.state] ?? op.state} />
        <Kpi label="Round" value={`#${op.current_round_no}`} />
        <Kpi label="Approved" value={op.approved_at ? new Date(op.approved_at).toLocaleDateString() : '—'} />
        <Kpi label="Bands" value={`${op.bands.length}`} />
        <Kpi
          label="Total options"
          value={`${op.bands.reduce((s, b) => s + (b.option_plan_qty ?? 0), 0)}`}
        />
      </div>

      {op.bands.map((band) => {
        const master = byId.get(band.band_id);
        return (
        <div
          key={band.band_id}
          className="rounded-lg border border-slate-200 bg-slate-50/40"
        >
          <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-200 bg-blue-50 px-3 py-1.5 text-[12px] text-blue-900">
            <span className="font-semibold">{fmtMrpRange(master, currency)}</span>
            <span className="text-blue-700/70">· Cost {fmtCostRange(master, currency)}</span>
            <Kpi label="Avg/option" value={`${band.avg_production_qty_per_option}`} />
            <Kpi label="Production qty" value={`${band.production_qty_snapshot}`} />
            <Kpi label="Option plan qty" value={`${band.option_plan_qty}`} />
          </header>
          <div className="flex flex-col divide-y divide-slate-100 px-3 py-1">
            {([OPTION_TYPES.FABRIC_TYPE, OPTION_TYPES.FIT, OPTION_TYPES.COMPOSITION] as OptionType[]).map((ot) => {
              const linesForType = band.lines.filter((l) => l.option_type === ot);
              const sum = linesForType.reduce((s, l) => s + (l.qty ?? 0), 0);
              const catalogue = SUB_TYPE_CATALOGUE[ot];
              return (
                <div key={ot} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
                  <span className="min-w-[100px] text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">
                    {OPTION_TYPE_LABELS[ot]}
                  </span>
                  {catalogue.map((st) => {
                    const line = linesForType.find((l) => l.sub_type_key === st.key);
                    const qty = line?.qty ?? 0;
                    return (
                      <span
                        key={st.key}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] tabular-nums"
                        style={{ border: '1px solid #e2e8f0' }}
                      >
                        <span className="text-slate-700">{st.label}</span>
                        <span className={`font-semibold ${qty > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{qty}</span>
                      </span>
                    );
                  })}
                  <span className="ml-auto text-[10.5px] tabular-nums text-slate-500">
                    Total {sum} / {band.option_plan_qty}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}

/**
 * All Option Plans — `/option/all`. Flat, server-paged table of every OP
 * across the tenant, joined with parent plan + OTB context.
 *
 * Filters:
 *   - Brand · Category · State (instant client-side, slot system)
 *   - Date range (from / to with Go button — only fires the API on Go,
 *     so the displayed dates can never drift from the data being shown)
 *
 * Default range = last full month → current month last day (60-ish days
 * around "now"), so first paint always shows actionable rows for the demo
 * clock without the user having to pick dates.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  PackageCheck,
  PenLine,
  RotateCcw,
  Search,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, DatePicker, SpinnerCenter } from '@/components/primitives';
import { TpsDataTable } from '@/components/tps-data-table';
import type { ColumnConfig, FilterSlotConfig } from '@/components/tps-data-table';
import { useDemoToday } from '@/hooks/useDemoClock';
import { useSetupConfig } from '@/features/otb/useOtb';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { fmtMoney } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import { useApiAllOptionPlanRows } from '../useApiOptionPlans';
import {
  OP_STATES,
  OP_STATE_LABELS,
  type OpState,
} from '../constants';
import { StateBadge } from '../components/StateBadge';
import type { OptionPlanRow } from '../types';

interface TableRow {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_window: string;
  period: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  brand_name: string;
  category_name: string;
  budget_snapshot: number;
  current_budget: number;
  is_stale: boolean;
  state: OpState;
  state_label: string;
  current_round_no: number;
  comment_count: number;
  last_comment_role?: string;
  last_comment_body?: string;
  modified_time: number;
  /** Band-row specifics — each row is one band of the OP. */
  band_id: 'entry' | 'core' | 'upper' | 'statement';
  /** Sortable: takes mrp_min as the numeric key. */
  mrp_min: number;
  mrp_range_label: string;
  avg_per_option: number;
  option_plan_qty: number;
  production_qty: number;
}

export default function OptionAllPlansPage() {
  const navigate = useNavigate();
  const { company, isLoading } = useSetupConfig();
  const {
    findBrand, findCategory,
    brands, categories,
    isLoading: masterLoading,
  } = useBrandCategoryLookup();
  const todayMs = useDemoToday();

  const defaultDateRange = useMemo(() => {
    const today = new Date(todayMs);
    const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from, to };
  }, [todayMs]);

  // Split state — pending (display) vs applied (API). Go button promotes.
  const [pendingFrom, setPendingFrom] = useState<Date | null>(defaultDateRange.from);
  const [pendingTo, setPendingTo] = useState<Date | null>(defaultDateRange.to);
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(defaultDateRange.from);
  const [appliedTo, setAppliedTo] = useState<Date | null>(defaultDateRange.to);

  useEffect(() => {
    setPendingFrom(defaultDateRange.from);
    setPendingTo(defaultDateRange.to);
    setAppliedFrom(defaultDateRange.from);
    setAppliedTo(defaultDateRange.to);
  }, [defaultDateRange.from, defaultDateRange.to]);

  const fromIso = appliedFrom ? toIso(appliedFrom) : undefined;
  const toIsoStr = appliedTo ? toIso(appliedTo) : undefined;
  const { data, isLoading: rowsLoading } = useApiAllOptionPlanRows(fromIso, toIsoStr);

  const dateFilterDirty =
    (pendingFrom?.getTime() ?? null) !== (appliedFrom?.getTime() ?? null) ||
    (pendingTo?.getTime() ?? null) !== (appliedTo?.getTime() ?? null);

  const applyDateFilter = () => {
    setAppliedFrom(pendingFrom);
    setAppliedTo(pendingTo);
  };
  const clearDateFilter = () => {
    setPendingFrom(null);
    setPendingTo(null);
    setAppliedFrom(null);
    setAppliedTo(null);
  };

  const [filters, setFilters] = useState<Record<string, unknown>>({});

  const rows: TableRow[] = useMemo(() => {
    if (!data) return [];
    // Flatten: one row per (OTB, band). The MRP range comes from the
    // category's master bands — fall back to band_id if the master is
    // somehow missing (data integrity issue).
    const out: TableRow[] = [];
    for (const op of data) {
      const brand = findBrand(op.brand_uuid);
      const cat = findCategory(op.category_uuid);
      const masterById = new Map(
        (cat?.bands ?? []).map((b) => [b.id, b] as const),
      );
      for (const band of op.bands) {
        const master = masterById.get(band.band_id);
        const rangeLabel = master
          ? master.mrp_max == null
            ? `₹${(master.mrp_min ?? 0).toLocaleString()}+`
            : `₹${(master.mrp_min ?? 0).toLocaleString()} – ₹${master.mrp_max.toLocaleString()}`
          : band.band_id;
        out.push({
          id: `${op.plan_id}/${op.otb_code}/${band.band_id}`,
          plan_id: op.plan_id,
          plan_name: op.plan_name ?? op.plan_id,
          plan_window: `${op.plan_start_iso} → ${op.plan_end_iso}`,
          period: op.period_key,
          otb_code: op.otb_code,
          brand_uuid: op.brand_uuid,
          category_uuid: op.category_uuid,
          brand_name: brand?.name ?? op.brand_uuid,
          category_name: cat?.name ?? op.category_uuid,
          budget_snapshot: op.budget_snapshot,
          current_budget: op.current_budget,
          is_stale: op.is_stale,
          state: op.state,
          state_label: OP_STATE_LABELS[op.state] ?? op.state,
          current_round_no: op.current_round_no,
          comment_count: op.comment_count,
          last_comment_role: op.last_comment_author_role,
          last_comment_body: op.last_comment_body,
          modified_time: op.modified_time ?? 0,
          band_id: band.band_id,
          mrp_min: master?.mrp_min ?? 0,
          mrp_range_label: rangeLabel,
          avg_per_option: band.avg_production_qty_per_option ?? 0,
          option_plan_qty: band.option_plan_qty ?? 0,
          production_qty: band.production_qty_snapshot ?? 0,
        });
      }
    }
    return out;
  }, [data, findBrand, findCategory]);

  const filtered = useMemo(() => {
    const brandUuid = filters.brand_uuid as string | undefined;
    const categoryUuid = filters.category_uuid as string | undefined;
    const state = filters.state as OpState | undefined;
    return rows.filter((r) => {
      if (brandUuid && r.brand_uuid !== brandUuid) return false;
      if (categoryUuid && r.category_uuid !== categoryUuid) return false;
      if (state && r.state !== state) return false;
      return true;
    });
  }, [rows, filters]);

  const columns: ColumnConfig<TableRow>[] = useMemo(() => {
    const currency = (company?.base_currency ?? 'INR') as BaseCurrency;
    return [
      { field: 'otb_code', header: 'OTB Code', copyable: true, minWidth: 260, cardRole: 'title' },
      { field: 'brand_name', header: 'Brand', minWidth: 110 },
      { field: 'category_name', header: 'Category', minWidth: 130 },
      { field: 'period', header: 'Period', minWidth: 90 },
      { field: 'plan_name', header: 'Annual Plan', minWidth: 130 },
      {
        field: 'current_budget', header: `Budget (${currency})`, align: 'left', minWidth: 140,
        valueFormatter: (v: number) => fmtMoney(v ?? 0, currency),
      },
      { field: 'mrp_range_label', header: 'MRP Range', minWidth: 160 },
      { field: 'avg_per_option', header: 'Avg/Option', align: 'left', minWidth: 100 },
      { field: 'production_qty', header: 'Production Qty', align: 'left', minWidth: 120 },
      { field: 'option_plan_qty', header: 'Options', align: 'left', minWidth: 90 },
      {
        field: 'state', header: 'State', minWidth: 150,
        render: (_value: OpState, row: TableRow) => <StateBadge state={row.state} />,
        cardRole: 'badge',
      },
      { field: 'current_round_no', header: 'Round', align: 'left', minWidth: 70 },
      {
        field: 'comment_count', header: 'Comments', align: 'left', minWidth: 130,
        render: (_v: number, row: TableRow) => {
          if (row.comment_count === 0) return <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>;
          return (
            <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
              <span className="font-semibold">{row.comment_count}</span>
              {row.last_comment_role && (
                <span style={{ color: 'var(--color-text-tertiary)' }}>· {row.last_comment_role}</span>
              )}
            </span>
          );
        },
      },
    ];
  }, [company?.base_currency]);

  const filterSlots: FilterSlotConfig[] = useMemo(
    () => [
      {
        type: 'singleSelect', field: 'brand_uuid', label: 'Brand',
        placeholder: 'All brands', clearable: true,
        options: brands.map((b) => ({ label: b.name, value: b.uuid })),
      },
      {
        type: 'singleSelect', field: 'category_uuid', label: 'Category',
        placeholder: 'All categories', clearable: true,
        options: categories.map((c) => ({ label: c.name, value: c.uuid })),
      },
      {
        type: 'singleSelect', field: 'state', label: 'State',
        placeholder: 'All states', clearable: true,
        options: [
          { label: OP_STATE_LABELS[OP_STATES.DRAFT],               value: OP_STATES.DRAFT },
          { label: OP_STATE_LABELS[OP_STATES.SUBMITTED],           value: OP_STATES.SUBMITTED },
          { label: OP_STATE_LABELS[OP_STATES.REVISIONS_REQUESTED], value: OP_STATES.REVISIONS_REQUESTED },
          { label: OP_STATE_LABELS[OP_STATES.APPROVED],            value: OP_STATES.APPROVED },
        ],
      },
    ],
    [brands, categories],
  );

  if (isLoading || rowsLoading || masterLoading || !company) {
    return <SpinnerCenter />;
  }

  return (
    <div className="flex h-full w-full flex-col gap-2 p-1">
      {/* Date filter bar */}
      <div className="flex flex-wrap items-end gap-2 rounded-lg border px-3 py-2"
        style={{ background: 'var(--color-surface-alt, #f8fafc)', borderColor: 'var(--color-divider)' }}>
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-text-tertiary)' }}>
            From date
          </label>
          <DatePicker value={pendingFrom} onChange={(v) => setPendingFrom(v ? new Date(v) : null)} />
        </div>
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: 'var(--color-text-tertiary)' }}>
            To date
          </label>
          <DatePicker value={pendingTo} onChange={(v) => setPendingTo(v ? new Date(v) : null)} />
        </div>
        <Button variant="primary" size="sm" leftIcon={<Search size={13} />}
          onClick={applyDateFilter} disabled={!dateFilterDirty}
          title={dateFilterDirty ? 'Apply date filter' : 'No pending changes'}>
          Go
        </Button>
        <Button variant="secondary" size="sm" leftIcon={<RotateCcw size={13} />}
          onClick={clearDateFilter}
          disabled={!appliedFrom && !appliedTo && !pendingFrom && !pendingTo}>
          Clear
        </Button>
      </div>

      <TpsDataTable<TableRow>
        rowIdField="id"
        header="All Option Plans"
        headerIcon={PackageCheck}
        headerDescription={`${company.name} · every Option Plan across all annual plans`}
        showBackIcon
        onBack={() => navigate('/option')}
        data={filtered}
        columns={columns}
        filterSlots={filterSlots}
        onFilterChange={setFilters}
        tableKey="dt-option-all"
        showColumnToggle
        height="calc(100vh - 200px)"
        emptyMessage="No Option Plans match the filter — try widening the date range or pick a different state."
        entityName="Option Plan"
        actions={[
          {
            type: 'continue', label: 'Continue', icon: PenLine, severity: 'info',
            visible: (r) => r.state === OP_STATES.DRAFT,
          },
          {
            type: 'review', label: 'Review', icon: Search, severity: 'warning',
            visible: (r) => r.state === OP_STATES.SUBMITTED,
          },
          {
            type: 'revise', label: 'Revise', icon: RotateCcw, severity: 'warning',
            visible: (r) => r.state === OP_STATES.REVISIONS_REQUESTED,
          },
          {
            type: 'view', label: 'View', icon: CheckCircle2, severity: 'success',
            visible: (r) => r.state === OP_STATES.APPROVED,
          },
        ]}
        onAction={(_type, row) => {
          navigate(`/option/${row.plan_id}/${row.otb_code}`);
        }}
      />
    </div>
  );
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

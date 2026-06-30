/**
 * All OTBs — `/otb/all`. Flat grid of every OTB row under the tenant joined
 * with parent plan / period dates / linked VP & OP states / final-approval
 * marker.
 *
 * Filters:
 *   - Brand · Category · Lifecycle state (instant client-side)
 *   - Date range with Go button (only fires the API on Go so displayed
 *     dates never drift from the data being shown)
 *
 * Default range = last full month → current month last day, same as the
 * VP/OP "all" pages.
 *
 * Row actions: every row gets View detail; OPTION_PLANNED rows additionally
 * surface Final Approve. The actual approve modal lives on the detail page —
 * the grid CTA just deep-links there.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Eye,
  ListChecks,
  RotateCcw,
  Search,
  ShieldCheck,
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
import { OP_STATE_LABELS } from '../../../option/constants';
import { VP_STATE_LABELS } from '../../../value/constants';
import { useApiAllOtbRows } from '../useApiOtbLifecycle';
import { LIFECYCLE_LABELS, LIFECYCLE_STATES } from '../constants';
import type { LifecycleState, OtbRowView } from '../types';
import { LifecycleBadge } from '../components/LifecycleBadge';

interface TableRow {
  id: string;
  plan_id: string;
  plan_name: string;
  period_key: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  brand_name: string;
  category_name: string;
  otb_amount: number;
  lifecycle_state: LifecycleState;
  vp_label: string;
  op_label: string;
  final_by?: string;
  final_at?: number;
  modified_time: number;
}

export default function OtbAllRowsPage() {
  const navigate = useNavigate();
  const { company, isLoading } = useSetupConfig();
  const {
    findBrand, findCategory,
    brands, categories,
    isLoading: masterLoading,
  } = useBrandCategoryLookup();
  const todayMs = useDemoToday();

  // Default range = Jan 1 → Dec 31 of the current (demo) year, so the grid
  // shows the full fiscal year by default instead of just a couple of months.
  const defaultDateRange = useMemo(() => {
    const year = new Date(todayMs).getFullYear();
    return {
      from: new Date(year, 0, 1),
      to: new Date(year, 11, 31),
    };
  }, [todayMs]);

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
  const { data, isLoading: rowsLoading } = useApiAllOtbRows(fromIso, toIsoStr);

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
    return data.map((r: OtbRowView) => {
      const brand = findBrand(r.brand_uuid);
      const cat = findCategory(r.category_uuid);
      return {
        id: `${r.plan_id}/${r.otb_code}`,
        plan_id: r.plan_id,
        plan_name: r.plan_name ?? r.plan_id,
        period_key: r.period_key,
        otb_code: r.otb_code,
        brand_uuid: r.brand_uuid,
        category_uuid: r.category_uuid,
        brand_name: brand?.name ?? r.brand_uuid,
        category_name: cat?.name ?? r.category_uuid,
        otb_amount: r.otb_amount,
        lifecycle_state: r.lifecycle_state,
        vp_label: r.vp_state ? VP_STATE_LABELS[r.vp_state] : '—',
        op_label: r.op_state ? OP_STATE_LABELS[r.op_state] : '—',
        final_by: r.final_approved_by,
        final_at: r.final_approved_at,
        modified_time: r.modified_time ?? 0,
      };
    });
  }, [data, findBrand, findCategory]);

  const filtered = useMemo(() => {
    const brandUuid = filters.brand_uuid as string | undefined;
    const categoryUuid = filters.category_uuid as string | undefined;
    const lifecycle = filters.lifecycle_state as LifecycleState | undefined;
    return rows.filter((r) => {
      if (brandUuid && r.brand_uuid !== brandUuid) return false;
      if (categoryUuid && r.category_uuid !== categoryUuid) return false;
      if (lifecycle && r.lifecycle_state !== lifecycle) return false;
      return true;
    });
  }, [rows, filters]);

  const columns: ColumnConfig<TableRow>[] = useMemo(() => {
    const currency = (company?.base_currency ?? 'INR') as BaseCurrency;
    return [
      { field: 'otb_code', header: 'OTB Code', copyable: true, minWidth: 260, cardRole: 'title' },
      { field: 'brand_name', header: 'Brand', minWidth: 110 },
      { field: 'category_name', header: 'Category', minWidth: 130 },
      { field: 'period_key', header: 'Period', minWidth: 90 },
      { field: 'plan_name', header: 'Annual Plan', minWidth: 130 },
      {
        field: 'otb_amount', header: `OTB Amount (${currency})`, align: 'left', minWidth: 150,
        valueFormatter: (v: number) => fmtMoney(v ?? 0, currency),
      },
      {
        field: 'lifecycle_state', header: 'Lifecycle', minWidth: 150,
        render: (_value: LifecycleState, row: TableRow) => (
          <LifecycleBadge state={row.lifecycle_state} />
        ),
        cardRole: 'badge',
      },
      { field: 'vp_label', header: 'Value Plan', minWidth: 110 },
      { field: 'op_label', header: 'Option Plan', minWidth: 110 },
      {
        field: 'final_at', header: 'Finalised', minWidth: 130,
        render: (_v, row) =>
          row.final_at ? (
            <span className="text-[12px]" style={{ color: 'var(--color-text-secondary)' }}>
              {new Date(row.final_at).toLocaleDateString()}
            </span>
          ) : (
            <span style={{ color: 'var(--color-text-tertiary)' }}>—</span>
          ),
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
        type: 'singleSelect', field: 'lifecycle_state', label: 'Lifecycle',
        placeholder: 'All stages', clearable: true,
        options: [
          { label: LIFECYCLE_LABELS[LIFECYCLE_STATES.PLANNED],        value: LIFECYCLE_STATES.PLANNED },
          { label: LIFECYCLE_LABELS[LIFECYCLE_STATES.RELEASED],       value: LIFECYCLE_STATES.RELEASED },
          { label: LIFECYCLE_LABELS[LIFECYCLE_STATES.VALUE_PLANNED],  value: LIFECYCLE_STATES.VALUE_PLANNED },
          { label: LIFECYCLE_LABELS[LIFECYCLE_STATES.OPTION_PLANNED], value: LIFECYCLE_STATES.OPTION_PLANNED },
          { label: LIFECYCLE_LABELS[LIFECYCLE_STATES.FINAL_APPROVED], value: LIFECYCLE_STATES.FINAL_APPROVED },
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
        header="All OTBs"
        headerIcon={ListChecks}
        headerDescription={`${company.name} · every OTB row across all annual plans`}
        data={filtered}
        columns={columns}
        filterSlots={filterSlots}
        onFilterChange={setFilters}
        tableKey="dt-otb-all"
        showColumnToggle
        height="calc(100vh - 200px)"
        emptyMessage="No OTBs match the filter — try widening the date range or pick a different stage."
        entityName="OTB"
        actions={[
          {
            type: 'view', label: 'View', icon: Eye, severity: 'info',
            visible: () => true,
          },
          {
            type: 'finalApprove', label: 'Final Approve', icon: ShieldCheck, severity: 'success',
            visible: (r) => r.lifecycle_state === LIFECYCLE_STATES.OPTION_PLANNED,
          },
        ]}
        onAction={(_type, row) => {
          navigate(`/otb/${row.plan_id}/${row.otb_code}/detail`);
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

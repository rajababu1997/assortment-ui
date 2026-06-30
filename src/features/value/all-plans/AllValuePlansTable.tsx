/**
 * Reusable "All Value Plans" table. Hydrates from `useApiAllValuePlanRows`,
 * flattens one row per (OTB × MRP band), and renders the generic
 * `TpsDataTable` with brand / category filters.
 *
 * The date filter is **lifted out** of the table's slot system and rendered
 * above the table as two controlled `DatePicker` components + a Go button.
 * Two pieces of state separate "what the user typed" from "what hit the API":
 *
 *   - `pendingFrom` / `pendingTo`  → drives the visible date pickers
 *   - `appliedFrom` / `appliedTo`  → drives the API query and the table data
 *
 * The user clicks **Go** to promote pending → applied. The API call only
 * fires on Go (not on every keystroke or date selection), so the display
 * never drifts from the data being shown.
 *
 * Used by:
 *   - `/value/all` page (the dedicated screen)
 *   - The "View all" dialog launched from the Value editor
 *   - The dashboard's per-period "View bands" dialog (date pickers hidden
 *     because `fixedPlanId` is set — defaultDateRange still seeds applied state)
 */

import { useMemo, useState } from 'react';
import { ArrowRight, Layers, RotateCcw, Search } from 'lucide-react';
import { Button, DatePicker, SpinnerCenter } from '@/components/primitives';
import { TpsDataTable } from '@/components/tps-data-table';
import type { ColumnConfig, FilterSlotConfig } from '@/components/tps-data-table';
import { useSetupConfig } from '@/features/otb/useOtb';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { fmtMoney, fmtMoneyCompact } from '@/features/otb/utils/format';
import type { BaseCurrency } from '@/features/setup/types';
import type { MrpBand } from '@/features/otb/types';
import { useApiAllValuePlanRows } from '../useApiValuePlans';
import { VP_STATE_LABELS, type VpState } from '../constants';
import { bandBudget, bandMargin, bandRevenue } from '../utils/calc';
import type { ValuePlanRow } from '../valuePlanApi';

const BAND_LABEL: Record<MrpBand['id'], string> = {
  entry:     'Entry',
  core:      'Core',
  upper:     'Upper',
  statement: 'Statement',
};

const BAND_ORDER: Record<MrpBand['id'], number> = {
  entry: 0, core: 1, upper: 2, statement: 3,
};

export interface AllValuePlansTableProps {
  /** AG-Grid container height (CSS value). Defaults to viewport-aware string. */
  height?: string;
  /** Show the back arrow on the table header. Provide `onBack` to wire it. */
  showBackIcon?: boolean;
  onBack?: () => void;
  /** Per-row open action — called with (plan_id, otb_code). Omit to hide the action column. */
  onOpenRow?: (planId: string, otbCode: string) => void;
  /** Slim header — drops the title + description so only the toolbar
   *  (search, filters, refresh) renders. Used when embedded in a dialog
   *  that already carries its own title. */
  compactHeader?: boolean;
  /** Restrict the rows to a single annual plan (hides the date picker bar). */
  fixedPlanId?: string;
  /** Restrict the rows to a single period within the plan (e.g. "2026-01"). */
  fixedPeriodKey?: string;
  /** Seed both pending + applied date state on mount. Drives the initial
   *  API call. User can still edit via the date pickers (when shown). */
  defaultDateRange?: { from: Date; to: Date };
}

interface TableRow {
  id: string;
  plan_id: string;
  plan_name: string;
  plan_window: string;
  plan_start_iso: string;
  plan_end_iso: string;
  period: string;
  otb_code: string;
  brand_uuid: string;
  category_uuid: string;
  brand_name: string;
  category_name: string;
  otb_budget: number;

  band_id: MrpBand['id'];
  band_label: string;
  mrp_range: string;
  cost_range: string;
  avg_mrp: number;
  avg_cost: number;
  band_pct: number;
  band_amount: number;
  band_revenue: number;
  band_margin: number;

  is_stale: boolean;
  state: VpState;
  state_label: string;
  modified_time: number;
}

export function AllValuePlansTable({
  height = 'calc(100vh - 140px)',
  showBackIcon = false,
  onBack,
  onOpenRow,
  compactHeader = false,
  fixedPlanId,
  fixedPeriodKey,
  defaultDateRange,
}: AllValuePlansTableProps) {
  const { company, isLoading } = useSetupConfig();
  const { findBrand, findCategory, brands, categories, isLoading: masterLoading } = useBrandCategoryLookup();

  // Brand + category filter state still flows through the table's slot
  // system (instant apply is fine for cheap client-side filtering).
  const [filters, setFilters] = useState<Record<string, unknown>>({});

  // Date filter — split into pending (display) and applied (API). The Go
  // button promotes pending → applied. Seeded from defaultDateRange so the
  // initial API call respects the caller's intent (60-day default, period
  // dialog, etc.) without the user having to click Go first.
  const [pendingFrom, setPendingFrom] = useState<Date | null>(defaultDateRange?.from ?? null);
  const [pendingTo, setPendingTo] = useState<Date | null>(defaultDateRange?.to ?? null);
  const [appliedFrom, setAppliedFrom] = useState<Date | null>(defaultDateRange?.from ?? null);
  const [appliedTo, setAppliedTo] = useState<Date | null>(defaultDateRange?.to ?? null);

  const fromIso = appliedFrom ? toIso(appliedFrom) : undefined;
  const toIsoStr = appliedTo ? toIso(appliedTo) : undefined;
  const { data, isLoading: vpLoading } = useApiAllValuePlanRows(fromIso, toIsoStr);

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

  const dateFilterDirty =
    (pendingFrom?.getTime() ?? null) !== (appliedFrom?.getTime() ?? null) ||
    (pendingTo?.getTime() ?? null) !== (appliedTo?.getTime() ?? null);

  const rows: TableRow[] = useMemo(() => {
    if (!data) return [];
    const out: TableRow[] = [];
    for (const vp of data as ValuePlanRow[]) {
      const brand = findBrand(vp.brand_uuid);
      const cat = findCategory(vp.category_uuid);
      const masterByBand: Record<string, MrpBand | undefined> = {};
      for (const b of cat?.bands ?? []) masterByBand[b.id] = b;

      const ordered = [...vp.bands].sort(
        (a, b) => (BAND_ORDER[a.band_id] ?? 99) - (BAND_ORDER[b.band_id] ?? 99),
      );

      for (const band of ordered) {
        const master = masterByBand[band.band_id];
        out.push({
          id: `${vp.plan_id}/${vp.otb_code}/${band.band_id}`,
          plan_id: vp.plan_id,
          plan_name: vp.plan_name ?? vp.plan_id,
          plan_window: `${vp.plan_start_iso} → ${vp.plan_end_iso}`,
          plan_start_iso: vp.plan_start_iso,
          plan_end_iso: vp.plan_end_iso,
          period: vp.period_key,
          otb_code: vp.otb_code,
          brand_uuid: vp.brand_uuid,
          category_uuid: vp.category_uuid,
          brand_name: brand?.name ?? vp.brand_uuid,
          category_name: cat?.name ?? vp.category_uuid,
          otb_budget: vp.budget_snapshot,

          band_id: band.band_id,
          band_label: BAND_LABEL[band.band_id] ?? band.band_id,
          mrp_range: master ? formatMrpRange(master) : '—',
          cost_range: master ? formatCostRange(master) : '—',
          avg_mrp: band.avg_mrp ?? 0,
          avg_cost: band.avg_cost ?? 0,
          band_pct: band.budget_pct ?? 0,
          band_amount: bandBudget(band, vp.budget_snapshot),
          band_revenue: bandRevenue(band, vp.budget_snapshot),
          band_margin: bandMargin(band),

          is_stale: vp.is_stale,
          state: vp.state,
          state_label: VP_STATE_LABELS[vp.state] ?? vp.state,
          modified_time: vp.modified_time ?? 0,
        });
      }
    }
    return out;
  }, [data, findBrand, findCategory]);

  const filtered: TableRow[] = useMemo(() => {
    const brandUuid = filters.brand_uuid as string | undefined;
    const categoryUuid = filters.category_uuid as string | undefined;
    return rows.filter((r) => {
      if (fixedPlanId && r.plan_id !== fixedPlanId) return false;
      if (fixedPeriodKey && r.period !== fixedPeriodKey) return false;
      if (brandUuid && r.brand_uuid !== brandUuid) return false;
      if (categoryUuid && r.category_uuid !== categoryUuid) return false;
      return true;
    });
  }, [rows, filters, fixedPlanId, fixedPeriodKey]);

  const columns: ColumnConfig<TableRow>[] = useMemo(() => {
    const currency = (company?.base_currency ?? 'INR') as BaseCurrency;
    return [
      { field: 'otb_code', header: 'OTB Code', copyable: true, minWidth: 260, cardRole: 'title' },
      { field: 'brand_name', header: 'Brand', minWidth: 110 },
      { field: 'category_name', header: 'Category', minWidth: 130 },
      { field: 'period', header: 'Period', minWidth: 90 },
      { field: 'mrp_range', header: 'MRP Range', minWidth: 130 },
      {
        field: 'avg_mrp', header: 'Avg MRP', align: 'left', minWidth: 110,
        valueFormatter: (v: number) => fmtMoney(v ?? 0, currency),
      },
      { field: 'cost_range', header: 'Cost Range', minWidth: 130 },
      {
        field: 'avg_cost', header: 'Avg Cost', align: 'left', minWidth: 110,
        valueFormatter: (v: number) => fmtMoney(v ?? 0, currency),
      },
      {
        field: 'band_pct', header: 'Range %', align: 'left', minWidth: 120,
        valueFormatter: (v: number) => `${v ?? 0}%`,
      },
      {
        field: 'band_amount', header: 'Allocated', align: 'left', minWidth: 120,
        valueFormatter: (v: number) => fmtMoneyCompact(v ?? 0, currency),
      },
      {
        field: 'band_margin', header: 'Margin', align: 'left', minWidth: 100,
        valueFormatter: (v: number) => `${(v ?? 0).toFixed(1)}%`,
      },
      {
        field: 'otb_budget', header: 'OTB Budget', align: 'left', minWidth: 120,
        valueFormatter: (v: number) => fmtMoneyCompact(v ?? 0, currency),
      },
      { field: 'state_label', header: 'State', minWidth: 100 },
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
    ],
    [brands, categories],
  );

  if (isLoading || vpLoading || masterLoading || !company) {
    return <SpinnerCenter />;
  }

  // The date-picker bar is only useful when the table spans multiple plans.
  // When the dashboard pins to one period (fixedPlanId set), `defaultDateRange`
  // alone seeds the applied state and the bar is hidden.
  const showDateBar = !fixedPlanId;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {showDateBar && (
        <div
          className="flex flex-wrap items-end gap-2 rounded-lg border px-3 py-2"
          style={{
            background: 'var(--color-surface-alt, #f8fafc)',
            borderColor: 'var(--color-divider)',
          }}
        >
          <div className="min-w-[180px] flex-1">
            <label
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              From date
            </label>
            <DatePicker
              value={pendingFrom}
              onChange={(v) => setPendingFrom(v ? new Date(v) : null)}
            />
          </div>
          <div className="min-w-[180px] flex-1">
            <label
              className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em]"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              To date
            </label>
            <DatePicker
              value={pendingTo}
              onChange={(v) => setPendingTo(v ? new Date(v) : null)}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Search size={13} />}
            onClick={applyDateFilter}
            disabled={!dateFilterDirty}
            title={dateFilterDirty ? 'Apply date filter' : 'No pending changes'}
          >
            Go
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={13} />}
            onClick={clearDateFilter}
            disabled={!appliedFrom && !appliedTo && !pendingFrom && !pendingTo}
          >
            Clear
          </Button>
        </div>
      )}

      <TpsDataTable<TableRow>
        rowIdField="id"
        header={compactHeader ? undefined : 'All Value Plans'}
        headerIcon={compactHeader ? undefined : Layers}
        headerDescription={
          compactHeader ? undefined : `${company.name} · every Value Plan band across all annual plans`
        }
        showBackIcon={showBackIcon}
        onBack={onBack}
        data={filtered}
        columns={columns}
        filterSlots={filterSlots}
        onFilterChange={setFilters}
        tableKey="dt-value-all"
        showColumnToggle
        height={height}
        emptyMessage="No Value Plans yet — release some OTBs and start planning"
        entityName="Band"
        actions={onOpenRow ? [{ type: 'open', label: 'Open', icon: ArrowRight, severity: 'info' }] : []}
        onAction={(type, row) => {
          if (type === 'open' && onOpenRow) onOpenRow(row.plan_id, row.otb_code);
        }}
      />
    </div>
  );
}

// Backend `@JsonInclude(NON_NULL)` drops null fields from the wire, so
// mrp_max/cost_max may arrive as undefined. `== null` catches both.
function formatMrpRange(master: MrpBand): string {
  const min = (master.mrp_min ?? 0).toLocaleString();
  if (master.mrp_max == null) return `₹${min}+`;
  return `₹${min} – ₹${master.mrp_max.toLocaleString()}`;
}

function formatCostRange(master: MrpBand): string {
  const min = (master.cost_min ?? 0).toLocaleString();
  const max = master.cost_max == null ? '∞' : master.cost_max.toLocaleString();
  return `₹${min} – ₹${max}`;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

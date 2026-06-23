/**
 * Reusable period editor: picker + table. Used by both Annual Creation
 * and the Release flow (read-only or editable depending on mode).
 */

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Info, Maximize2, Table2 } from 'lucide-react';
import { Dialog } from '@/components/primitives';
import { useAnnualPlan, useAppDispatch } from '../useOtb';
import { setPeriodRows, adjustPeriodRows } from '@/store/slices/otbSlice';
import { BrandCategoryPicker } from './BrandCategoryPicker';
import { OtbRowTable } from './OtbRowTable';
import type { OtbRow } from '../types';
import type { BaseCurrency } from '@/features/setup/types';
import { buildOtbCode } from '../utils/otbCode';
import { useBrandCategoryLookup } from '../useOtbMaster';

interface Props {
  /** Which annual plan to operate against — required in the multi-plan
   *  world. Without it the editor would fall back to "first plan" and
   *  render rows from the wrong year. */
  planId: string;
  periodKey: string;
  currency: BaseCurrency;
  mode: 'create' | 'adjust' | 'readonly';
  showPicker?: boolean;
  /** Cap on the OtbRowTable's internal scroll height. Pass `null` to
   *  disable the nested scroll so the page's body scroll handles it
   *  (used by the Release flow, where the page already scrolls). */
  tableMaxHeight?: number | null;
}

const DEFAULTS = {
  planned_sales: 0,
  markdowns: 0,
  eom_inventory: 0,
  bom_inventory: 0,
  on_order: 0,
};

// Leaves room for the full-screen Dialog's title/description bar and the
// body's vertical padding so the rest of the viewport is the table's own
// scroll area (header stays pinned at top).
const EXPANDED_DIALOG_TABLE_MAX_HEIGHT = 'calc(100vh - 200px)';

export function PeriodEditor({ planId, periodKey, currency, mode, showPicker = true, tableMaxHeight }: Props) {
  const dispatch = useAppDispatch();
  const annual = useAnnualPlan(planId);
  const plan = annual?.periods[periodKey];
  const [tableExpanded, setTableExpanded] = useState(false);
  const { findCategory } = useBrandCategoryLookup();

  const selected = useMemo(
    () =>
      plan?.rows.map((r) => ({ brand_uuid: r.brand_uuid, category_uuid: r.category_uuid })) ?? [],
    [plan?.rows],
  );

  if (!plan || !annual) return null;
  const disabled = mode === 'readonly';

  const handlePickerChange = (pairs: { brand_uuid: string; category_uuid: string }[]) => {
    const next: OtbRow[] = pairs.map((p) => {
      const existing = plan.rows.find(
        (r) => r.brand_uuid === p.brand_uuid && r.category_uuid === p.category_uuid,
      );
      if (existing) return existing;
      const category = findCategory(p.category_uuid);
      return {
        row_id: `${periodKey}-${p.brand_uuid}-${p.category_uuid}`,
        otb_code: category ? buildOtbCode(periodKey, category) : `OTB-${periodKey}-PENDING`,
        brand_uuid: p.brand_uuid,
        category_uuid: p.category_uuid,
        ...DEFAULTS,
      };
    });
    dispatch(setPeriodRows({ plan_id: planId, period_key: periodKey, rows: next }));
  };

  const handleRowsChange = (rows: OtbRow[]) => {
    if (mode === 'create') {
      dispatch(setPeriodRows({ plan_id: planId, period_key: periodKey, rows }));
    } else if (mode === 'adjust') {
      dispatch(adjustPeriodRows({ plan_id: planId, period_key: periodKey, rows }));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {showPicker && (
        <div
          className="overflow-hidden rounded-xl border"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
        >
          <BrandCategoryPicker
            selected={selected}
            onChange={handlePickerChange}
            disabled={disabled}
          />
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
      >
        {/* Attached header strip — matches the main page card header pattern */}
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2"
          style={{
            borderColor: 'var(--color-divider)',
            background: 'var(--color-surface-alt, #f8fafc)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
              style={{
                background: 'linear-gradient(135deg, rgba(96,165,250,0.18), rgba(167,139,250,0.18))',
                border: '1px solid rgba(96,165,250,0.22)',
                color: 'var(--color-primary)',
              }}
            >
              <Table2 size={12} strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              OTB Values
            </span>
            {plan.rows.length > 0 && (
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider tabular-nums"
                style={{
                  background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
                  color: 'var(--color-primary)',
                }}
              >
                {plan.rows.length} {plan.rows.length === 1 ? 'row' : 'rows'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {plan.rows.length > 0 && (
              <button
                type="button"
                onClick={() => setTableExpanded(true)}
                className="inline-flex items-center gap-1 rounded-md border bg-[var(--color-surface)] px-2 py-1 text-[11px] font-medium transition-colors hover:bg-[var(--color-surface-alt,#f1f5f9)]"
                style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-secondary)' }}
                title="Open table in a wide dialog"
              >
                <Maximize2 size={11} /> Expand
              </button>
            )}
            <FormulaHelp />
          </div>
        </div>

        {/* Body — tight padding so the table sits flush with the card border */}
        <div className="p-1">
          <OtbRowTable
            rows={plan.rows}
            baseline={mode === 'adjust' ? plan.baseline_rows : undefined}
            currency={currency}
            disabled={disabled}
            onChange={handleRowsChange}
            maxHeight={tableMaxHeight}
          />
        </div>
      </div>

      <Dialog
        open={tableExpanded}
        onClose={() => setTableExpanded(false)}
        title="OTB Values"
        description={`${plan.rows.length} ${plan.rows.length === 1 ? 'row' : 'rows'} · scroll inside the table to view all`}
        size="full"
      >
        <div className="p-1">
          {/* Cap the table to viewport so its sticky header stays pinned
              while the rows scroll inside the dialog (instead of the
              dialog body scrolling and dragging the header out of view). */}
          <OtbRowTable
            rows={plan.rows}
            baseline={mode === 'adjust' ? plan.baseline_rows : undefined}
            currency={currency}
            disabled={disabled}
            onChange={handleRowsChange}
            maxHeight={EXPANDED_DIALOG_TABLE_MAX_HEIGHT}
          />
        </div>
      </Dialog>
    </div>
  );
}

function FormulaHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
      >
        <Info size={12} />
        How OTB is calculated
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 w-full rounded border border-[var(--color-divider)] bg-[var(--color-bg-subtle)] p-3 text-xs">
          <div className="font-medium mb-1">Formula</div>
          <code className="block bg-[var(--color-bg-base)] rounded px-2 py-1 mb-3 text-[12px]">
            OTB = (Planned Sales + Planned Markdowns + Planned EOM Inventory) − (BOM Inventory + Pending Delivery)
          </code>
          <ul className="flex flex-col gap-1.5 text-[var(--color-text-secondary)]">
            <li>
              <strong className="text-[var(--color-text-primary)]">Planned Sales</strong> — how much
              revenue we expect to make this period.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Planned Markdowns</strong> — money
              set aside for discounts, promotions, and shrinkage during the period.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Planned End of Month Inventory</strong> —
              how much stock we want left over at the end of the period, so shelves aren't empty going
              into the next one.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Beginning of Month Inventory</strong> —
              stock we already have sitting in the warehouse on day 1 of the period (this is free,
              so it reduces what we need to buy).
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Pending Delivery</strong> — stock
              already ordered from a factory but not yet delivered (also already accounted for).
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

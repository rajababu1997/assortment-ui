/**
 * OTB row table.
 *
 * Two render modes:
 *   - Create mode (no `baseline`): one row per OtbRow, all 5 fields editable.
 *   - Adjust mode (with `baseline`): two rows per OtbRow —
 *       Row 1: "Planned" — read-only values from the approved baseline.
 *       Row 2: "Adjusted" — editable values; Δ% column comes from this row.
 *     Each (Planned + Adjusted) pair shares an alternating background
 *     so the planner can see at a glance which two rows belong together.
 *
 * Styling: sticky sky-blue header, bordered cells, zebra rows, internal
 * vertical scroll via `maxHeight` so the header stays visible.
 */

import { Fragment } from 'react';
import { NumberInput } from '@/components/primitives';
// import { findBrand, findCategory } from '../mockData/brands'; // ← swapped to API
import { useBrandCategoryLookup } from '../useOtbMaster';
import { fmtMoney } from '../utils/format';
import { calcOtb } from '../types';
import { VARIANCE_ALERT_THRESHOLD_PCT, VARIANCE_WARN_THRESHOLD_PCT } from '../constants';
import type { BaseCurrency } from '@/features/setup/types';
import type { OtbRow } from '../types';

interface Props {
  rows: OtbRow[];
  baseline?: OtbRow[];
  currency: BaseCurrency;
  disabled?: boolean;
  onChange: (rows: OtbRow[]) => void;
  /** Cap on the scroll container's height; defaults to 380 px. Accepts a
   *  CSS length string (e.g. `'calc(100vh - 200px)'`) for viewport-based
   *  sizing inside dialogs. Pass null to disable. */
  maxHeight?: number | string | null;
}

const FIELDS: Array<{ key: keyof Pick<OtbRow, 'planned_sales' | 'markdowns' | 'eom_inventory' | 'bom_inventory' | 'on_order'>; label: string }> = [
  { key: 'planned_sales', label: 'Planned Sales' },
  { key: 'markdowns', label: 'Planned Markdowns' },
  { key: 'eom_inventory', label: 'Planned End of Month Inventory' },
  { key: 'bom_inventory', label: 'Beginning of Month Inventory' },
  { key: 'on_order', label: 'Pending Delivery' },
];

// ── Style tokens (match TpsDataTable header look) ───────────────────────────

const HEADER_BG = '#f1f5f9'; // light gray — distinct from white cells and zebra rows
const HEADER_FG = '#7b8699'; // same muted blue-gray as ag-grid header
const HEADER_BORDER = 'var(--color-divider)';
const CELL_BORDER = '1px solid var(--color-divider)';
const ZEBRA_BG = '#eef2f7'; // a touch darker than --color-surface-alt for clearer striping

function HeaderLabel({ label, currency }: { label: string; currency: string }) {
  return (
    <div className="flex flex-col gap-0.5 items-center">
      <span className="text-[11px] font-semibold leading-tight" style={{ color: HEADER_FG }}>
        {label}
      </span>
      <span className="text-[10px] font-normal" style={{ color: 'var(--color-text-tertiary)' }}>
        (in {currency})
      </span>
    </div>
  );
}

export function OtbRowTable({ rows, baseline, currency, disabled, onChange, maxHeight = 380 }: Props) {
  const { findBrand, findCategory } = useBrandCategoryLookup();
  if (rows.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed py-6 text-center text-sm"
        style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-tertiary)' }}
      >
        Pick at least one brand × category above to add rows.
      </div>
    );
  }

  const isSplit = !!baseline;

  const updateField = (rowId: string, field: typeof FIELDS[number]['key'], value: number | null) => {
    onChange(rows.map((r) => (r.row_id === rowId ? { ...r, [field]: value ?? 0 } : r)));
  };

  const findBaseline = (rowId: string) => baseline?.find((b) => b.row_id === rowId);

  // Common header cell style — sticky, compact, centered, neutral palette.
  const headerCellStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    background: HEADER_BG,
    borderBottom: `1px solid ${HEADER_BORDER}`,
    borderRight: CELL_BORDER,
    textAlign: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  };

  return (
    <div
      className="overflow-auto rounded-lg border"
      style={{
        borderColor: 'var(--color-divider)',
        maxHeight: maxHeight ?? undefined,
      }}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="px-2 align-middle" style={{ ...headerCellStyle, minWidth: 180 }}>
              <span className="text-[11px] font-semibold" style={{ color: HEADER_FG }}>
                OTB Code
              </span>
            </th>
            <th className="px-2 align-middle" style={headerCellStyle}>
              <span className="text-[11px] font-semibold" style={{ color: HEADER_FG }}>
                Brand
              </span>
            </th>
            <th className="px-2 align-middle" style={headerCellStyle}>
              <span className="text-[11px] font-semibold" style={{ color: HEADER_FG }}>
                Category
              </span>
            </th>
            {isSplit && (
              <th className="px-2 align-middle" style={headerCellStyle}>
                <span className="text-[11px] font-semibold" style={{ color: HEADER_FG }}>
                  Values
                </span>
              </th>
            )}
            {FIELDS.map((f) => (
              <th
                key={f.key}
                className="px-1.5 align-middle"
                style={{ ...headerCellStyle, minWidth: 130, maxWidth: 160 }}
              >
                <HeaderLabel label={f.label} currency={currency} />
              </th>
            ))}
            <th
              className="px-1.5 align-middle"
              style={{ ...headerCellStyle, minWidth: 130 }}
            >
              <HeaderLabel label="OTB" currency={currency} />
            </th>
            {isSplit && (
              <th className="px-2 align-middle" style={headerCellStyle}>
                <span className="text-[11px] font-semibold" style={{ color: HEADER_FG }}>
                  Δ vs baseline
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, rowIdx) => {
            const brand = findBrand(r.brand_uuid);
            const cat = findCategory(r.category_uuid);
            const otb = calcOtb(r);
            const bRow = findBaseline(r.row_id);
            const bOtb = bRow ? calcOtb(bRow) : null;
            const deltaPct = bOtb && bOtb !== 0 ? ((otb - bOtb) / bOtb) * 100 : null;
            const deltaTone =
              deltaPct == null
                ? ''
                : Math.abs(deltaPct) >= VARIANCE_ALERT_THRESHOLD_PCT
                  ? 'text-[var(--color-danger)]'
                  : Math.abs(deltaPct) >= VARIANCE_WARN_THRESHOLD_PCT
                    ? 'text-[var(--color-warning)]'
                    : 'text-[var(--color-text-secondary)]';

            const rowBg = rowIdx % 2 === 1 ? ZEBRA_BG : 'transparent';
            const cellBase: React.CSSProperties = {
              borderTop: CELL_BORDER,
              borderRight: CELL_BORDER,
              background: rowBg,
            };

            if (isSplit && bRow) {
              return (
                <Fragment key={r.row_id}>
                  {/* Planned (read-only) row */}
                  <tr>
                    <td
                      className="whitespace-nowrap px-2 py-2 align-middle font-mono text-[11px] tabular-nums"
                      style={{ ...cellBase, color: 'var(--color-text-secondary)' }}
                      rowSpan={2}
                      title={r.otb_code}
                    >
                      {r.otb_code}
                    </td>
                    <td
                      className="whitespace-nowrap px-2 py-2 align-middle font-medium"
                      style={cellBase}
                      rowSpan={2}
                    >
                      {brand?.name ?? '—'}
                    </td>
                    <td
                      className="whitespace-nowrap px-2 py-2 align-middle"
                      style={cellBase}
                      rowSpan={2}
                    >
                      {cat?.name ?? '—'}
                    </td>
                    <td
                      className="whitespace-nowrap px-2 py-2 text-xs italic"
                      style={{ ...cellBase, color: 'var(--color-text-secondary)' }}
                    >
                      Planned
                    </td>
                    {FIELDS.map((f) => (
                      <td
                        key={f.key}
                        className="whitespace-nowrap px-2 py-2 text-right tabular-nums"
                        style={{ ...cellBase, color: 'var(--color-text-secondary)' }}
                      >
                        {fmtMoney(bRow[f.key], currency)}
                      </td>
                    ))}
                    <td
                      className="whitespace-nowrap px-2 py-2 text-right font-medium"
                      style={{ ...cellBase, color: 'var(--color-text-secondary)' }}
                    >
                      {bOtb != null ? fmtMoney(bOtb, currency) : '—'}
                    </td>
                    <td
                      className="px-2 py-2 text-right text-xs"
                      style={{ ...cellBase, color: 'var(--color-text-tertiary)' }}
                    >
                      —
                    </td>
                  </tr>
                  {/* Adjusted (editable) row */}
                  <tr>
                    <td
                      className="whitespace-nowrap px-2 py-2 text-xs italic"
                      style={{ ...cellBase, color: 'var(--color-text-secondary)' }}
                    >
                      Adjusted
                    </td>
                    {FIELDS.map((f) => (
                      <td key={f.key} className="px-1 py-1.5" style={{ ...cellBase, minWidth: 110 }}>
                        <NumberInput
                          value={r[f.key]}
                          onChange={(v) => updateField(r.row_id, f.key, v)}
                          min={0}
                          step={100000}
                          showButtons={false}
                          disabled={disabled}
                        />
                      </td>
                    ))}
                    <td
                      className={`whitespace-nowrap px-2 py-2 text-right font-medium ${otb < 0 ? 'text-[var(--color-danger)]' : ''}`}
                      style={cellBase}
                    >
                      {fmtMoney(otb, currency)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-2 py-2 text-right text-xs ${deltaTone}`}
                      style={cellBase}
                    >
                      {deltaPct == null ? '—' : `${deltaPct >= 0 ? '+' : ''}${deltaPct.toFixed(1)}%`}
                    </td>
                  </tr>
                </Fragment>
              );
            }

            // Single row — create mode
            return (
              <tr key={r.row_id}>
                <td
                  className="whitespace-nowrap px-2 py-2 font-mono text-[11px] tabular-nums"
                  style={{ ...cellBase, color: 'var(--color-text-secondary)' }}
                  title={r.otb_code}
                >
                  {r.otb_code}
                </td>
                <td className="whitespace-nowrap px-2 py-2 font-medium" style={cellBase}>
                  {brand?.name ?? '—'}
                </td>
                <td className="whitespace-nowrap px-2 py-2" style={cellBase}>
                  {cat?.name ?? '—'}
                </td>
                {FIELDS.map((f) => (
                  <td key={f.key} className="px-1 py-1.5" style={{ ...cellBase, minWidth: 110 }}>
                    <NumberInput
                      value={r[f.key]}
                      onChange={(v) => updateField(r.row_id, f.key, v)}
                      min={0}
                      step={100000}
                      showButtons={false}
                      disabled={disabled}
                    />
                  </td>
                ))}
                <td
                  className={`whitespace-nowrap px-2 py-2 text-right font-medium ${otb < 0 ? 'text-[var(--color-danger)]' : ''}`}
                  style={cellBase}
                >
                  {fmtMoney(otb, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

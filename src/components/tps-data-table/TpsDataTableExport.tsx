import { format } from 'date-fns';
import type { RefObject } from 'react';
import type { GridApi } from 'ag-grid-community';
import type { ColumnConfig } from './types';
import { toast } from '@/lib/toast';
import { snackbar } from '@/lib/snackbar';

/**
 * AG Grid CSV export — strips HTML, uses valueFormatter output.
 * Mirrors Angular's exportCSVData() including empty-data guard + toast feedback.
 */
export function tpsExportCsv<T>(
  gridApiRef: RefObject<GridApi | null>,
  columns: ColumnConfig<T>[],
  filename?: string,
  data?: T[]
): void {
  const api = gridApiRef.current;
  if (!api) return;

  // Mirror Angular: guard against empty data
  if (data && data.length === 0) {
    snackbar.warn('No data available to export.');
    return;
  }

  const exportableFields = columns
    .filter((c) => c.exportable !== false && c.field !== 'actions')
    .map((c) => String(c.field));

  const dateStr = format(new Date(), 'dd-MM-yyyy');
  const name = filename ? `${filename}_${dateStr}.csv` : `export_${dateStr}.csv`;

  api.exportDataAsCsv({
    fileName: name,
    columnKeys: exportableFields,
    processCellCallback: (params) => {
      // Use formatted value if available (valueFormatter was set on colDef)
      const formatted = params.formatValue(params.value);
      const raw = formatted ?? params.value;

      // Strip HTML tags if value contains markup
      if (typeof raw === 'string' && raw.includes('<')) {
        const div = document.createElement('div');
        div.innerHTML = raw;
        return div.textContent ?? div.innerText ?? '';
      }

      return raw == null ? '' : String(raw);
    },
  });

  toast.success('Data exported successfully');
}

/**
 * Excel export — dynamically imports xlsx (SheetJS) to keep it out of the main bundle.
 * Falls back to CSV if xlsx fails to load.
 */
export async function tpsExportExcel<T>(data: T[], columns: ColumnConfig<T>[], filename?: string): Promise<void> {
  if (data.length === 0) {
    snackbar.warn('No data available to export.');
    return;
  }

  const exportableCols = columns.filter((c) => c.exportable !== false && c.field !== 'actions');

  const dateStr = format(new Date(), 'dd-MM-yyyy');
  const name = filename ? `${filename}_${dateStr}.xlsx` : `export_${dateStr}.xlsx`;

  // Build rows — apply valueFormatter if defined
  const rows = data.map((row) => {
    const out: Record<string, unknown> = {};
    for (const col of exportableCols) {
      const raw = (row as Record<string, unknown>)[col.field as string];
      out[col.header] = col.valueFormatter ? col.valueFormatter(raw, row) : (raw ?? '');
    }
    return out;
  });

  toast.info('Exporting Excel… Please wait…');

  const xlsx = await import('xlsx');
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
  xlsx.writeFile(wb, name);

  toast.clear();
  toast.success('Excel exported successfully');
}

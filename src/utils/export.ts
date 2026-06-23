/**
 * Data export utilities — CSV and Excel export.
 *
 * Ported from Angular CommonService.saveAsCSVFile + TpsTable.exportCSVData.
 * Uses dynamic xlsx import for tree-shaking (xlsx is ~430KB).
 */

import { toast } from '@/lib/toast';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportColumn {
  /** Column header text */
  header: string;
  /** Field key on data object */
  field: string;
  /** Optional value formatter */
  formatter?: (_value: unknown, _row: Record<string, unknown>) => string;
  /** Skip this column in export */
  hide?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDateSuffix(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

function stripHtml(html?: string): string {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent ?? '';
}

function buildExportRows(data: Record<string, unknown>[], columns: ExportColumn[]): Record<string, string>[] {
  const visibleCols = columns.filter((c) => !c.hide);

  return data.map((row) => {
    const exportRow: Record<string, string> = {};
    for (const col of visibleCols) {
      const raw = row[col.field];
      if (col.formatter) {
        exportRow[col.header] = col.formatter(raw, row);
      } else if (typeof raw === 'string' && raw.includes('<')) {
        exportRow[col.header] = stripHtml(raw);
      } else {
        exportRow[col.header] = raw != null ? String(raw) : '';
      }
    }
    return exportRow;
  });
}

// ── CSV Export ────────────────────────────────────────────────────────────────

/**
 * Export data to CSV and trigger browser download.
 *
 * @param data      Array of row objects
 * @param columns   Column definitions (header + field mapping)
 * @param fileName  Base filename (date suffix auto-appended)
 */
export function exportToCsv(data: Record<string, unknown>[], columns: ExportColumn[], fileName: string): void {
  if (data.length === 0) {
    toast.error('No data available to download.');
    return;
  }

  toast.info('Exporting data... Please wait...');

  const rows = buildExportRows(data, columns);
  const headers = columns.filter((c) => !c.hide).map((c) => c.header);

  // Build CSV string
  const csvLines: string[] = [headers.join(',')];
  for (const row of rows) {
    const line = headers.map((h) => {
      const val = row[h] ?? '';
      // Escape quotes and wrap in quotes if contains comma/newline/quote
      if (val.includes(',') || val.includes('\n') || val.includes('"')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvLines.push(line.join(','));
  }

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `${fileName}_export_${getDateSuffix()}.csv`);

  toast.success('Export completed successfully');
}

// ── Excel Export ──────────────────────────────────────────────────────────────

/**
 * Export data to Excel (.xlsx) and trigger browser download.
 * Dynamically imports xlsx for tree-shaking.
 *
 * @param data      Array of row objects
 * @param columns   Column definitions
 * @param fileName  Base filename (date suffix auto-appended)
 * @param sheetName Sheet name (default: "data")
 */
export async function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExportColumn[],
  fileName: string,
  sheetName = 'data'
): Promise<void> {
  if (data.length === 0) {
    toast.error('No data available to download.');
    return;
  }

  toast.info('Exporting data... Please wait...');

  const rows = buildExportRows(data, columns);
  const xlsx = await import('xlsx');

  const worksheet = xlsx.utils.json_to_sheet(rows);
  const workbook = {
    Sheets: { [sheetName]: worksheet },
    SheetNames: [sheetName],
  };
  const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, `${fileName}_export_${getDateSuffix()}.xlsx`);

  toast.success('Export completed successfully');
}

// ── Download trigger ─────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

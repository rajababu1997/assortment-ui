import { Loader2 } from '@/constants/icons';
import { Inbox, MoreVertical } from 'lucide-react';
import { useState, useMemo, useTransition, useEffect } from 'react';
import { Tag, Pagination } from '@/components/primitives';
import { TpsDataTableCardActions } from './TpsDataTableCardActions';
import type { ColumnConfig, ActionConfig } from './types';

interface DataTableCardListProps<T> {
  data: T[];
  columns: ColumnConfig<T>[];
  actions?: ActionConfig<T>[];
  onAction?: (type: string, row: T) => void;
  emptyMessage?: string;
  searchText?: string;
  defaultPageSize?: number;
  pageSizes?: number[];
}

export function TpsDataTableCardList<T extends object>({
  data,
  columns,
  actions = [],
  onAction = () => {},
  emptyMessage = 'No data available.',
  searchText = '',
  defaultPageSize = 15,
  pageSizes = [10, 15, 20, 50],
}: DataTableCardListProps<T>) {
  const [selectedRow, setSelectedRow] = useState<T | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [isPending, startTransition] = useTransition();

  const titleCol = columns.find((c) => c.cardRole === 'title');
  const badgeCol = columns.find((c) => c.cardRole === 'badge');
  const metaCols = columns.filter((c) => c.cardRole === 'meta');

  const getValue = (col: ColumnConfig<T>, row: T): string => {
    const raw = (row as any)[col.field as string];
    return col.valueFormatter ? col.valueFormatter(raw, row) : raw == null ? '' : String(raw);
  };

  const searchIndex = useMemo(
    () =>
      data.map((row) =>
        columns.map((col) => getValue(col, row)).join('\t').toLowerCase(),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, columns],
  );

  const [filteredIndices, setFilteredIndices] = useState<number[]>(() =>
    Array.from({ length: data.length }, (_, i) => i),
  );

  useEffect(() => {
    const term = searchText.trim().toLowerCase();
    startTransition(() => {
      if (!term) {
        setFilteredIndices(Array.from({ length: data.length }, (_, i) => i));
      } else {
        const matched: number[] = [];
        for (let i = 0; i < searchIndex.length; i++) {
          if (searchIndex[i].includes(term)) matched.push(i);
        }
        setFilteredIndices(matched);
      }
      setPage(1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, searchIndex]);

  const totalFiltered = filteredIndices.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const first = (page - 1) * pageSize;
  const pageIndices = filteredIndices.slice(first, first + pageSize);

  if (totalFiltered === 0 && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-4" style={{ background: 'var(--color-surface-alt)' }}>
        <Inbox size={16} strokeWidth={2} className="text-4xl" />
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          {searchText ? 'No results match your search.' : emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ background: 'var(--color-surface-alt)' }}>
        {isPending && (
          <div className="flex items-center justify-center gap-2 py-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            <Loader2 className="animate-spin pi-spinner" size={16} />
            Searching…
          </div>
        )}

        <div className={`flex flex-col gap-4 px-4 pt-4 pb-4 ${isPending ? 'opacity-60' : ''}`}>
          {pageIndices.map((dataIdx) => {
            const row = data[dataIdx];
            const rowKey = (row as any).id ?? dataIdx;
            const visibleActions = actions.filter(
              (a) => a.visible == null || a.visible(row),
            );
            const detailCols = columns.filter(
              (c) => c !== titleCol && c.field !== 'actions',
            );

            return (
              <div
                key={rowKey}
                className="group relative overflow-hidden rounded-2xl border transition-all active:scale-[0.99]"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-divider)',
                  boxShadow: 'var(--shadow-md)',
                }}
              >
                {/* HERO BLOCK */}
                <div
                  className="relative flex items-start gap-3 px-5 pt-4 pb-3.5 border-b"
                  style={{ background: 'var(--color-surface-alt)', borderColor: 'var(--color-divider)' }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-0 right-0 h-[3px]"
                    style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-700))' }}
                  />

                  <div className="flex-1 min-w-0">
                    {titleCol ? (
                      <>
                        <span
                          className="block text-[0.6rem] font-semibold uppercase tracking-[0.12em] leading-none mb-1.5"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {titleCol.header}
                        </span>
                        <p className="font-bold text-[1.1rem] leading-[1.15] truncate tracking-[-0.01em]"
                          style={{ color: 'var(--color-text)' }}>
                          {getValue(titleCol, row) || '—'}
                        </p>
                      </>
                    ) : null}
                  </div>

                  {badgeCol && (
                    <div className="shrink-0 pt-0.5">
                      <Tag label={getValue(badgeCol, row)} />
                    </div>
                  )}

                  {visibleActions.length > 0 && (
                    <button
                      className="shrink-0 -mt-1 -mr-2 flex items-center justify-center w-8 h-8 rounded-full border"
                      style={{
                        background: 'transparent',
                        borderColor: 'var(--color-border)',
                        cursor: 'pointer',
                        color: 'var(--color-text-tertiary)',
                        transition: 'background 0.15s',
                      }}
                      aria-label="Row actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRow(row);
                        setActionsOpen(true);
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-hover)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <MoreVertical size={12} strokeWidth={2} />
                    </button>
                  )}
                </div>

                {/* DETAIL BLOCK */}
                {detailCols.length + metaCols.length > 0 && (
                  <div className="px-5 py-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
                    {[...detailCols, ...metaCols].map((col) => {
                      const val = getValue(col, row);
                      return (
                        <div key={String(col.field)} className="min-w-0">
                          <span
                            className="block text-[0.6rem] font-semibold uppercase tracking-[0.1em] leading-none mb-1"
                            style={{ color: 'var(--color-text-tertiary)' }}
                          >
                            {col.header}
                          </span>
                          <p
                            className="text-[0.82rem] truncate leading-tight"
                            style={{ color: val ? 'var(--color-text)' : 'var(--color-text-tertiary)', fontWeight: val ? 600 : 400 }}
                          >
                            {val || '—'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className="px-4 py-3" style={{ background: 'var(--color-surface-alt)' }}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              pageSize={pageSize}
              pageSizeOptions={pageSizes}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
              totalRecords={totalFiltered}
            />
          </div>
        )}

        <p
          className="text-[0.7rem] text-center pt-2 pb-3 px-4"
          style={{ color: 'var(--color-text-tertiary)', background: 'var(--color-surface-alt)' }}
        >
          {first + 1}–{Math.min(first + pageSize, totalFiltered)} of {totalFiltered}
          {searchText && ` (filtered from ${data.length})`}
        </p>
      </div>

      <TpsDataTableCardActions
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        row={selectedRow}
        actions={actions}
        onAction={onAction}
      />
    </>
  );
}

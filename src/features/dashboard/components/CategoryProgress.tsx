/**
 * Category Progress — bar chart of completion % per (brand × category).
 * Sorted by lowest progress first so lagging categories rise to the top.
 */

import { ListChecks } from 'lucide-react';
import type { CategoryProgressRow } from '../useDashboardSections';

interface Props {
  rows: CategoryProgressRow[];
  isLoading: boolean;
  totalCategories: number;
  completed: number;
  pending: number;
}

export function CategoryProgress({ rows, isLoading, totalCategories, completed, pending }: Props) {
  return (
    <section
      className="rounded-xl border"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
    >
      <header
        className="flex flex-wrap items-center justify-between gap-2 rounded-t-xl border-b px-3 py-2"
        style={{
          borderColor: 'var(--color-divider)',
          background: 'linear-gradient(90deg, rgba(96,165,250,0.12), rgba(167,139,250,0.06))',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{
              background: 'rgba(96,165,250,0.12)',
              color: 'var(--color-primary)',
            }}
          >
            <ListChecks size={12} />
          </span>
          <h3
            className="text-[12px] font-semibold uppercase tracking-[0.10em]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Category Progress
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] tabular-nums"
          style={{ color: 'var(--color-text-tertiary)' }}>
          <span><b style={{ color: 'var(--color-text-primary)' }}>{totalCategories}</b> total</span>
          <span><b style={{ color: '#047857' }}>{completed}</b> done</span>
          <span><b style={{ color: '#b45309' }}>{pending}</b> pending</span>
        </div>
      </header>

      <div className="flex flex-col gap-1.5 px-3 py-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-8 animate-pulse rounded-md"
              style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
            />
          ))
        ) : rows.length === 0 ? (
          <p className="text-[11.5px] italic" style={{ color: 'var(--color-text-tertiary)' }}>
            No category data yet.
          </p>
        ) : (
          rows.map((r) => {
            const color =
              r.pct >= 80 ? '#16a34a'
              : r.pct >= 50 ? '#f59e0b'
              : '#ef4444';
            return (
              <div key={`${r.brandUuid}:${r.categoryUuid}`} className="flex items-center gap-3">
                <div className="w-[160px] shrink-0 truncate">
                  <div
                    className="truncate text-[12px] font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {r.categoryName}
                  </div>
                  <div
                    className="truncate text-[10.5px]"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    {r.brandName}
                  </div>
                </div>
                <div
                  className="relative h-3 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'var(--color-surface-alt, #f1f5f9)' }}
                >
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${r.pct}%`, background: color }}
                  />
                </div>
                <span
                  className="w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums"
                  style={{ color }}
                >
                  {r.pct}%
                </span>
                <span
                  className="w-16 shrink-0 text-right text-[10.5px] tabular-nums"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {r.completed}/{r.total}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

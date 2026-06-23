import clsx from 'clsx';
import {
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import styles from './Pagination.module.css';
import type { PaginationProps } from './Pagination.types';

function buildPageRange(page: number, total: number, siblings: number): (number | '…')[] {
  if (total <= siblings + 4) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const left  = Math.max(2, page - siblings);
  const right = Math.min(total - 1, page + siblings);
  const pages: (number | '…')[] = [1];
  if (left > 2) pages.push('…');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('…');
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  totalPages,
  onChange,
  showJumpers = true,
  siblingCount = 1,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  totalRecords,
  className,
}: PaginationProps) {
  if (totalPages <= 0) return null;

  const pageRange = buildPageRange(page, totalPages, siblingCount);

  const rangeStart = pageSize ? (page - 1) * pageSize + 1 : null;
  const rangeEnd   = pageSize ? Math.min(page * pageSize, totalRecords ?? page * pageSize) : null;

  return (
    <nav aria-label="Pagination" className={clsx(styles.root, className)}>
      {/* Record summary */}
      {totalRecords !== undefined && rangeStart !== null && (
        <span className={styles.summary}>
          {rangeStart}–{rangeEnd} of {totalRecords}
        </span>
      )}

      {/* Page buttons */}
      <div className={styles.controls}>
        {showJumpers && (
          <button
            type="button"
            className={clsx(styles.btn, styles.navBtn)}
            onClick={() => onChange(1)}
            disabled={page === 1}
            aria-label="First page"
          >
            <ChevronsLeft strokeWidth={1.8} />
          </button>
        )}

        <button
          type="button"
          className={clsx(styles.btn, styles.navBtn)}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft strokeWidth={1.8} />
        </button>

        {pageRange.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onChange(p)}
              className={clsx(styles.btn, p === page && styles.btnActive)}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={clsx(styles.btn, styles.navBtn)}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight strokeWidth={1.8} />
        </button>

        {showJumpers && (
          <button
            type="button"
            className={clsx(styles.btn, styles.navBtn)}
            onClick={() => onChange(totalPages)}
            disabled={page === totalPages}
            aria-label="Last page"
          >
            <ChevronsRight strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* Page size selector */}
      {pageSize !== undefined && onPageSizeChange && (
        <div className={styles.sizeSelector}>
          <span>Rows per page</span>
          <select
            className={styles.sizeSelect}
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Rows per page"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { GridApi } from 'ag-grid-community';
import styles from './TpsDataTablePagination.module.css';

interface PaginationState {
  currentPage: number; // 0-indexed
  totalPages: number;
  pageSize: number;
  totalRows: number;
}

interface Props {
  api: GridApi | null;
  entityName?: string;
  entityNamePlural?: string;
}

export function TpsDataTablePagination({ api, entityName = 'item', entityNamePlural }: Props) {
  const [pageInfo, setPageInfo] = useState<PaginationState>({
    currentPage: 0,
    totalPages: 1,
    pageSize: 20,
    totalRows: 0,
  });

  const updatePageInfo = useCallback(() => {
    if (!api) return;
    setPageInfo({
      currentPage: api.paginationGetCurrentPage(),
      totalPages: api.paginationGetTotalPages(),
      pageSize: api.paginationGetPageSize(),
      totalRows: api.paginationGetRowCount(),
    });
  }, [api]);

  useEffect(() => {
    if (!api) return;
    updatePageInfo();
    api.addEventListener('paginationChanged', updatePageInfo);
    return () => {
      if (!api.isDestroyed()) {
        api.removeEventListener('paginationChanged', updatePageInfo);
      }
    };
  }, [api, updatePageInfo]);

  const { currentPage, totalPages, pageSize, totalRows } = pageInfo;
  const isFirstPage = currentPage === 0;
  const isLastPage = currentPage >= totalPages - 1;

  const start = totalRows === 0 ? 0 : currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalRows);
  const plural = entityNamePlural ?? `${entityName.toLowerCase()}s`;
  const label =
    totalRows === 0
      ? `No ${plural}`
      : `Showing ${start}–${end} of ${totalRows} ${totalRows === 1 ? entityName.toLowerCase() : plural}`;

  return (
    <div className={styles.root}>
      <span className={styles.label}>{label}</span>

      <div className={styles.controls}>
        <div className={styles.navGroup}>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => api?.paginationGoToFirstPage()}
            disabled={isFirstPage}
            title="First page"
          >
            <ChevronsLeft size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={styles.navBtn}
            onClick={() => api?.paginationGoToPreviousPage()}
            disabled={isFirstPage}
            title="Previous page"
          >
            <ChevronLeft size={15} strokeWidth={1.5} />
          </button>
        </div>

        <span className={styles.pageLabel}>{currentPage + 1} / {totalPages}</span>

        <div className={styles.navGroup}>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnForward}`}
            onClick={() => api?.paginationGoToNextPage()}
            disabled={isLastPage}
            title="Next page"
          >
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navBtnForward}`}
            onClick={() => api?.paginationGoToLastPage()}
            disabled={isLastPage}
            title="Last page"
          >
            <ChevronsRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface PaginationProps {
  /** Current page (1-based). */
  page: number;
  /** Total number of pages. */
  totalPages: number;
  onChange: (page: number) => void;
  /** Show first/last jump buttons. Default: true */
  showJumpers?: boolean;
  /** Max page buttons shown (excluding first/last/ellipsis). Default: 5 */
  siblingCount?: number;
  /** Optional page-size selector. */
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  /** Total record count — shown as "1–20 of 240". */
  totalRecords?: number;
  className?: string;
}

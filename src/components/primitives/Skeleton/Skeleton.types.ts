export type SkeletonVariant = 'text' | 'rect' | 'circle';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  /** Width — any CSS value or number (px). Default: '100%' */
  width?: string | number;
  /** Height — any CSS value or number (px). Default depends on variant */
  height?: string | number;
  /** Repeat N skeleton rows (text variant only). */
  lines?: number;
  className?: string;
}

import type { ReactNode } from 'react';

export type BadgeSeverity = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';

export interface BadgeProps {
  /** Content to show inside the badge (number or string). */
  value?: number | string;
  /** When true, shows a small dot with no text. */
  dot?: boolean;
  severity?: BadgeSeverity;
  /** Max number shown before "+". Default: 99 */
  max?: number;
  /** Element the badge is anchored to (renders badge in top-right corner). */
  children?: ReactNode;
  /** When false the badge is hidden. Default: true */
  visible?: boolean;
  className?: string;
}

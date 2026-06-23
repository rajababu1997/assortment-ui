import type { ReactNode } from 'react';

export type DividerOrientation = 'horizontal' | 'vertical';
export type DividerAlign = 'start' | 'center' | 'end';

export interface DividerProps {
  /** Orientation. Default `horizontal`. */
  orientation?: DividerOrientation;
  /** Alignment of optional label (horizontal only). Default `center`. */
  align?: DividerAlign;
  /** Optional label rendered inside the divider (horizontal only). */
  children?: ReactNode;
  /** Extra class on the root. */
  className?: string;
}

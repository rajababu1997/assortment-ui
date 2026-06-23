import { useMemo } from 'react';
import { useWindowSize } from 'usehooks-ts';
import type { ColumnConfig, Breakpoint } from '../types';
import { BREAKPOINT_PX } from '../types';

/**
 * Filters the columns array based on current window width and each column's
 * hideBelow prop. Re-computes only when window width crosses a breakpoint boundary
 * or when the columns array reference changes.
 */
export function useTpsResponsiveColumns<T>(columns: ColumnConfig<T>[]): ColumnConfig<T>[] {
  const { width = 1280 } = useWindowSize();

  return useMemo(() => {
    return columns.filter((col) => {
      if (!col.hideBelow) return true;
      const threshold = BREAKPOINT_PX[col.hideBelow as Breakpoint];
      return width >= threshold;
    });
  }, [columns, width]);
}

/**
 * Returns true when the current viewport is below the 'md' breakpoint (768px).
 * Used to switch between AG Grid view and mobile card list.
 */
export function useTpsIsMobile(): boolean {
  const { width = 1280 } = useWindowSize();
  return width < BREAKPOINT_PX.md;
}

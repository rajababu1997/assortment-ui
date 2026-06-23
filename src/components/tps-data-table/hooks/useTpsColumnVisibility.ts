import { useState, useCallback } from 'react';
import type { ColumnConfig } from '../types';

/**
 * Manages column visibility as local page state — all columns visible by default.
 * Resets on navigation. No localStorage persistence.
 */
export function useTpsColumnVisibility<T>(
  _columns: ColumnConfig<T>[],
  _tableKey?: string,
): {
  hiddenFields: Set<string>;
  toggleField: (field: string) => void;
  showAll: () => void;
  isVisible: (field: string) => boolean;
} {
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());

  const toggleField = useCallback((field: string) => {
    setHiddenFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  const showAll = useCallback(() => {
    setHiddenFields(new Set());
  }, []);

  const isVisible = useCallback(
    (field: string) => !hiddenFields.has(field),
    [hiddenFields],
  );

  return { hiddenFields, toggleField, showAll, isVisible };
}

import { useState, useCallback, useRef, useEffect } from 'react';
import type { DataTableState } from '../types';

export interface UseDataTableStateReturn extends DataTableState {
  setSearchText: (text: string) => void;
  deferredSearchText: string;
  openFilterDrawer: () => void;
  closeFilterDrawer: () => void;
  setDrawerFilters: (filters: Record<string, any>) => void;
  clearDrawerFilters: () => void;
  setActiveColumnFilters: (filters: Record<string, any>) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

/**
 * Core state machine for DataTable.
 * Manages: global search, filter drawer open/close, drawer filter values,
 * and column filter state (synced from AG Grid onFilterChanged event).
 */
export function useTpsDataTableState(): UseDataTableStateReturn {
  const [searchText, setSearchTextRaw] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [drawerFilters, setDrawerFiltersRaw] = useState<Record<string, any>>({});
  const [activeColumnFilters, setActiveColumnFiltersRaw] = useState<Record<string, any>>({});

  // Debounced search text — AG Grid quickFilterText is expensive on large datasets (20k+ rows),
  // so we debounce to avoid blocking the main thread on every keystroke.
  // 500ms on mobile (slower CPUs, touch keyboards), 300ms on desktop.
  const [deferredSearchText, setDeferredSearchText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const setSearchText = useCallback((text: string) => {
    setSearchTextRaw(text); // update input immediately (responsive typing)
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDeferredSearchText(text), isMobile ? 500 : 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const openFilterDrawer = useCallback(() => {
    setFilterDrawerOpen(true);
  }, []);

  const closeFilterDrawer = useCallback(() => {
    setFilterDrawerOpen(false);
  }, []);

  const setDrawerFilters = useCallback((filters: Record<string, any>) => {
    setDrawerFiltersRaw(filters);
  }, []);

  const clearDrawerFilters = useCallback(() => {
    setDrawerFiltersRaw({});
  }, []);

  const setActiveColumnFilters = useCallback((filters: Record<string, any>) => {
    setActiveColumnFiltersRaw(filters);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTextRaw('');
    clearTimeout(debounceRef.current);
    setDeferredSearchText('');
    setDrawerFiltersRaw({});
    setActiveColumnFiltersRaw({});
  }, []);

  const hasActiveFilters =
    searchText.length > 0 ||
    Object.keys(drawerFilters).some((k) => drawerFilters[k] != null && drawerFilters[k] !== '') ||
    Object.keys(activeColumnFilters).length > 0;

  return {
    searchText,
    deferredSearchText,
    filterDrawerOpen,
    drawerFilters,
    activeColumnFilters,
    setSearchText,
    openFilterDrawer,
    closeFilterDrawer,
    setDrawerFilters,
    clearDrawerFilters,
    setActiveColumnFilters,
    clearAllFilters,
    hasActiveFilters,
  };
}

/**
 * Universal-chrome filter state for the History feature.
 *
 * Encapsulates the comparison mode, anchor month, brand/category/cluster
 * filters, and exposes a derived query for the dataset.
 */

import { useMemo, useState } from 'react';
import { HISTORY_MAX_YEAR, HISTORY_MIN_YEAR, queryRows, type HistoryRow } from './mock/dataset';
import type { CompareMode } from './mock/dimensions';

interface Range {
  yearFrom: number;
  monthFrom: number;
  yearTo: number;
  monthTo: number;
}

export interface HistoryFilters {
  compareMode: CompareMode;
  anchorYear: number;
  anchorMonth: number;
  brand_uuids: string[];
  category_uuids: string[];
  cluster_keys: string[];
}

export function useHistoryFilters(initialAnchor?: { year: number; month: number }) {
  const [filters, setFilters] = useState<HistoryFilters>({
    compareMode: 'ly-same-month',
    anchorYear: initialAnchor?.year ?? HISTORY_MAX_YEAR,
    anchorMonth: initialAnchor?.month ?? 3,
    brand_uuids: [],
    category_uuids: [],
    cluster_keys: [],
  });

  /** The range that produces the comparison aggregate, given the mode. */
  const compareRange = useMemo<Range>(
    () => buildCompareRange(filters.compareMode, filters.anchorYear, filters.anchorMonth),
    [filters.compareMode, filters.anchorYear, filters.anchorMonth],
  );

  /** Always one anchor-month window — useful for "current vs compare" deltas. */
  const anchorRange = useMemo<Range>(
    () => ({
      yearFrom: filters.anchorYear,
      monthFrom: filters.anchorMonth,
      yearTo: filters.anchorYear,
      monthTo: filters.anchorMonth,
    }),
    [filters.anchorYear, filters.anchorMonth],
  );

  /** Trailing 24-month range — drives sparklines + heat-maps. */
  const trailingRange = useMemo<Range>(() => {
    const idx = filters.anchorYear * 12 + filters.anchorMonth;
    const from = idx - 23;
    return {
      yearFrom: Math.floor(from / 12),
      monthFrom: ((from % 12) + 12) % 12,
      yearTo: filters.anchorYear,
      monthTo: filters.anchorMonth,
    };
  }, [filters.anchorYear, filters.anchorMonth]);

  const compareRows: HistoryRow[] = useMemo(
    () =>
      queryRows({
        ...compareRange,
        brand_uuids: filters.brand_uuids,
        category_uuids: filters.category_uuids,
      }),
    [compareRange, filters.brand_uuids, filters.category_uuids],
  );

  const anchorRows: HistoryRow[] = useMemo(
    () =>
      queryRows({
        ...anchorRange,
        brand_uuids: filters.brand_uuids,
        category_uuids: filters.category_uuids,
      }),
    [anchorRange, filters.brand_uuids, filters.category_uuids],
  );

  const trailingRows: HistoryRow[] = useMemo(
    () =>
      queryRows({
        ...trailingRange,
        brand_uuids: filters.brand_uuids,
        category_uuids: filters.category_uuids,
      }),
    [trailingRange, filters.brand_uuids, filters.category_uuids],
  );

  return {
    filters,
    setFilters,
    compareRange,
    anchorRange,
    trailingRange,
    compareRows,
    anchorRows,
    trailingRows,
    minYear: HISTORY_MIN_YEAR,
    maxYear: HISTORY_MAX_YEAR,
  };
}

function buildCompareRange(mode: CompareMode, anchorYear: number, anchorMonth: number): Range {
  switch (mode) {
    case 'ly-same-month':
      return {
        yearFrom: anchorYear - 1,
        monthFrom: anchorMonth,
        yearTo: anchorYear - 1,
        monthTo: anchorMonth,
      };
    case 'rolling-12': {
      const startIdx = anchorYear * 12 + anchorMonth - 11;
      return {
        yearFrom: Math.floor(startIdx / 12),
        monthFrom: ((startIdx % 12) + 12) % 12,
        yearTo: anchorYear,
        monthTo: anchorMonth,
      };
    }
    case 'three-year-avg':
      return {
        yearFrom: anchorYear - 3,
        monthFrom: anchorMonth,
        yearTo: anchorYear - 1,
        monthTo: anchorMonth,
      };
  }
}

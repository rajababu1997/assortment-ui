/**
 * Central data hook for the Trend Intelligence page. Pulls Last-Year and
 * This-Year sales across four backend endpoints (KPI, aggregate, monthly,
 * attribute) with the demo-clock-derived 12-month windows, and returns a
 * single derived object the page components consume directly.
 *
 * No filters are exposed on the page — the whole tenant is fetched.
 */

import { useMemo } from 'react';
import { useDemoToday } from '@/hooks/useDemoClock';
import {
  useSalesAggregate,
  useSalesAttribute,
  useSalesKpi,
  useSalesMonthly,
} from '@/features/sales/useSales';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import type {
  SalesAggregateRow,
  SalesAttributeRow,
  SalesKpiSummary,
  MonthlyTrendPoint,
} from '@/features/sales/types';
import { computeDualWindow, type DualWindow } from './utils/dateRange';
import { growthPct, safeDiv } from './utils/format';

export interface KpiSet {
  netSales: number;
  netSalesUnits: number;
  gpPct: number;
  strPct: number;
  markdownPct: number;
  inventoryValue: number;
  weeksCover: number;
  inventoryTurn: number;
}

export interface CategoryPerf {
  categoryUuid: string;
  name: string;
  netSales: number;
  netSalesUnits: number;
  gpPct: number;
  strPct: number;
  growthVsLy: number;
}

export interface AttributePerf {
  key: string;
  label: string;
  salesPct: number;
  gpPct: number;
  growthVsLy: number;
  strPct: number;
}

export interface UseTrendDataResult {
  isLoading: boolean;
  window: DualWindow;
  ty: KpiSet;
  ly: KpiSet;
  monthly: MonthlyTrendPoint[];   // TY monthly (buckets already sorted asc)
  monthlyLy: MonthlyTrendPoint[]; // LY monthly aligned by month index
  categories: CategoryPerf[];
  fabricTypes: AttributePerf[];
  fits: AttributePerf[];
  compositions: AttributePerf[];
}

const zeroKpi = (): KpiSet => ({
  netSales: 0, netSalesUnits: 0, gpPct: 0, strPct: 0, markdownPct: 0,
  inventoryValue: 0, weeksCover: 0, inventoryTurn: 0,
});

const kpiFrom = (
  kpi: SalesKpiSummary | undefined,
  rows: SalesAggregateRow[],
): KpiSet => {
  if (!kpi) return zeroKpi();
  const inventoryValue = rows.reduce((s, r) => s + r.eomValue, 0);
  const weeksCoverAvg = rows.length
    ? rows.reduce((s, r) => s + r.weeksCover, 0) / rows.length
    : 0;
  // Turn = annualised COGS ÷ average inventory. Approximate: cogs / eomValue
  // (single snapshot). Not precisely "turn" but close enough as a directional
  // metric for the buyer.
  const inventoryTurn = safeDiv(kpi.cogsValue, inventoryValue);
  return {
    netSales: kpi.netSalesValue,
    netSalesUnits: kpi.netSalesUnits,
    gpPct: kpi.gpPct,
    strPct: kpi.strPct,
    markdownPct: kpi.markdownPct,
    inventoryValue,
    weeksCover: weeksCoverAvg,
    inventoryTurn,
  };
};

/** Roll up a (period × brand × cat × band) aggregate to per-category KPIs. */
const rollupCategories = (
  tyRows: SalesAggregateRow[],
  lyRows: SalesAggregateRow[],
  nameFn: (uuid: string) => string,
): CategoryPerf[] => {
  interface Bucket {
    net: number; units: number; gpVal: number; grossUnits: number; eomUnits: number;
  }
  const build = (rows: SalesAggregateRow[]): Map<string, Bucket> => {
    const m = new Map<string, Bucket>();
    for (const r of rows) {
      const b = m.get(r.categoryUuid) ?? { net: 0, units: 0, gpVal: 0, grossUnits: 0, eomUnits: 0 };
      b.net += r.netSalesValue;
      b.units += r.netSalesUnits;
      b.gpVal += r.gpValue;
      b.grossUnits += r.grossSalesUnits;
      b.eomUnits += r.eomUnits;
      m.set(r.categoryUuid, b);
    }
    return m;
  };
  const tyMap = build(tyRows);
  const lyMap = build(lyRows);

  return Array.from(tyMap.entries())
    .map(([uuid, t]) => {
      const l = lyMap.get(uuid);
      return {
        categoryUuid: uuid,
        name: nameFn(uuid),
        netSales: t.net,
        netSalesUnits: t.units,
        gpPct: safeDiv(t.gpVal, t.net) * 100,
        strPct: safeDiv(t.grossUnits, t.grossUnits + t.eomUnits) * 100,
        growthVsLy: growthPct(t.net, l?.net ?? 0),
      };
    })
    .sort((a, b) => b.netSales - a.netSales);
};

/** Group attribute rows by subTypeKey → share %, growth vs LY, gp%, str%. */
const rollupAttribute = (
  tyRows: SalesAttributeRow[],
  lyRows: SalesAttributeRow[],
  filterType: 'fabric_type' | 'fit' | 'composition',
  labelize: (key: string) => string,
): AttributePerf[] => {
  interface Bucket { value: number; gpVal: number; strSum: number; strCount: number; }
  const build = (rows: SalesAttributeRow[]): Map<string, Bucket> => {
    const m = new Map<string, Bucket>();
    for (const r of rows) {
      if (r.optionType !== filterType) continue;
      const b = m.get(r.subTypeKey) ?? { value: 0, gpVal: 0, strSum: 0, strCount: 0 };
      b.value += r.value;
      b.gpVal += r.gpValue;
      b.strSum += r.strPct;
      b.strCount += 1;
      m.set(r.subTypeKey, b);
    }
    return m;
  };
  const tyMap = build(tyRows);
  const lyMap = build(lyRows);
  const total = Array.from(tyMap.values()).reduce((s, b) => s + b.value, 0);

  return Array.from(tyMap.entries())
    .map(([key, t]) => {
      const l = lyMap.get(key);
      return {
        key,
        label: labelize(key),
        salesPct: safeDiv(t.value, total) * 100,
        gpPct: safeDiv(t.gpVal, t.value) * 100,
        growthVsLy: growthPct(t.value, l?.value ?? 0),
        strPct: t.strCount > 0 ? t.strSum / t.strCount : 0,
      };
    })
    .sort((a, b) => b.salesPct - a.salesPct);
};

/** LY buckets in chronological order so they can be overlaid on TY by index. */
const sortMonthly = (rows: MonthlyTrendPoint[]): MonthlyTrendPoint[] =>
  rows.slice().sort((a, b) => a.periodKey.localeCompare(b.periodKey));

/** Prettify snake_case subTypeKeys — "cotton_lycra" → "Cotton Lycra". */
const humanize = (k: string): string =>
  k.split(/[_\s-]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function useTrendData(): UseTrendDataResult {
  const todayMs = useDemoToday();
  const window = useMemo(() => computeDualWindow(todayMs), [todayMs]);
  const { findCategory } = useBrandCategoryLookup();

  const tyFilter = { from: window.ty.from, to: window.ty.to };
  const lyFilter = { from: window.ly.from, to: window.ly.to };

  const tyKpi = useSalesKpi(tyFilter);
  const lyKpi = useSalesKpi(lyFilter);
  const tyAgg = useSalesAggregate(tyFilter);
  const lyAgg = useSalesAggregate(lyFilter);
  const tyMonthly = useSalesMonthly(tyFilter);
  const lyMonthly = useSalesMonthly(lyFilter);
  const tyAttr = useSalesAttribute(tyFilter);
  const lyAttr = useSalesAttribute(lyFilter);

  const isLoading =
    tyKpi.isLoading || lyKpi.isLoading ||
    tyAgg.isLoading || lyAgg.isLoading ||
    tyMonthly.isLoading || lyMonthly.isLoading ||
    tyAttr.isLoading || lyAttr.isLoading;

  return useMemo(() => {
    const tyRows = tyAgg.data ?? [];
    const lyRows = lyAgg.data ?? [];
    const tyAttrRows = tyAttr.data ?? [];
    const lyAttrRows = lyAttr.data ?? [];

    const nameOf = (uuid: string): string => findCategory(uuid)?.name ?? uuid.slice(0, 6);

    return {
      isLoading,
      window,
      ty: kpiFrom(tyKpi.data, tyRows),
      ly: kpiFrom(lyKpi.data, lyRows),
      monthly: sortMonthly(tyMonthly.data ?? []),
      monthlyLy: sortMonthly(lyMonthly.data ?? []),
      categories: rollupCategories(tyRows, lyRows, nameOf),
      fabricTypes: rollupAttribute(tyAttrRows, lyAttrRows, 'fabric_type', humanize),
      fits: rollupAttribute(tyAttrRows, lyAttrRows, 'fit', humanize),
      compositions: rollupAttribute(tyAttrRows, lyAttrRows, 'composition', humanize),
    };
  }, [
    isLoading, window,
    tyKpi.data, lyKpi.data,
    tyAgg.data, lyAgg.data,
    tyMonthly.data, lyMonthly.data,
    tyAttr.data, lyAttr.data,
    findCategory,
  ]);
}

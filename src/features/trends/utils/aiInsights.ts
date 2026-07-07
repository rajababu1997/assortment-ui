/**
 * Rule-based insight generator. Consumes the trend data and returns 8
 * headline insights the buyer sees at the top of the page. No ML —
 * deterministic thresholds on the real aggregates so anything the strip
 * says maps to a number the buyer can trace in the tables below.
 */

import type {
  AttributePerf,
  CategoryPerf,
  UseTrendDataResult,
} from '../useTrendData';
import { growthPct } from './format';

export type InsightTone = 'positive' | 'warning' | 'neutral' | 'info';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
  metric?: string;
}

const topBy = <T,>(rows: T[], key: (r: T) => number): T | undefined =>
  rows.length ? rows.reduce((best, r) => (key(r) > key(best) ? r : best)) : undefined;

const worstBy = <T,>(rows: T[], key: (r: T) => number): T | undefined =>
  rows.length ? rows.reduce((worst, r) => (key(r) < key(worst) ? r : worst)) : undefined;

/**
 * Build the 8 insight strip. Order is fixed so the buyer's eye lands on
 * consistent slots across visits:
 *   1. Top-growth fit          2. Top-GP composition
 *   3. Sales KPI overview      4. Top revenue category
 *   5. Growth headline         6. Top-growth fabric
 *   7. Recommend action        8. Under-performing tail
 */
export function buildInsights(data: UseTrendDataResult): Insight[] {
  const out: Insight[] = [];

  const topFit = topBy(data.fits, (f) => f.growthVsLy);
  if (topFit) {
    out.push({
      id: 'fit-growth',
      tone: 'positive',
      title: topFit.label,
      detail: `grew by ${Math.round(topFit.growthVsLy)}% vs LY in volume`,
      metric: 'Fit',
    });
  }

  const topGpComp = topBy(data.compositions, (c) => c.gpPct);
  if (topGpComp) {
    out.push({
      id: 'comp-gp',
      tone: 'positive',
      title: topGpComp.label,
      detail: `generated highest GP ${Math.round(topGpComp.gpPct)}%`,
      metric: 'Composition',
    });
  }

  out.push({
    id: 'sales-headline',
    tone: 'info',
    title: 'Net sales',
    detail: `${Math.round(growthPct(data.ty.netSales, data.ly.netSales))}% growth vs last year`,
    metric: 'Overall',
  });

  const topCat = topBy(data.categories, (c) => c.netSales);
  const totalCatSales = data.categories.reduce((s, c) => s + c.netSales, 0);
  if (topCat && totalCatSales > 0) {
    const share = Math.round((topCat.netSales / totalCatSales) * 100);
    out.push({
      id: 'cat-top',
      tone: 'positive',
      title: topCat.name,
      detail: `contributed ${share}% of total sales`,
      metric: 'Category',
    });
  }

  const topFabric = topBy(data.fabricTypes, (f) => f.growthVsLy);
  if (topFabric && topFabric.growthVsLy > 0) {
    out.push({
      id: 'fabric-growth',
      tone: 'positive',
      title: topFabric.label,
      detail: `demand up ${Math.round(topFabric.growthVsLy)}% — buy more next season`,
      metric: 'Fabric',
    });
  }

  //const strDelta = data.ty.strPct - data.ly.strPct;
  // out.push({
  //   id: 'str-headline',
  //   tone: strDelta >= 0 ? 'positive' : 'warning',
  //   title: 'Sell-through',
  //   detail: strDelta >= 0
  //     ? `up ${strDelta.toFixed(1)}pp — inventory clearing faster`
  //     : `down ${Math.abs(strDelta).toFixed(1)}pp — review buys`,
  //   metric: 'Overall',
  // });

  const bestGrowthCat = topBy(data.categories, (c) => c.growthVsLy);
  if (bestGrowthCat && bestGrowthCat.growthVsLy > 10) {
    out.push({
      id: 'cat-growth',
      tone: 'positive',
      title: bestGrowthCat.name,
      detail: `recommend increasing buying by ${Math.round(bestGrowthCat.growthVsLy)}%`,
      metric: 'Recommend',
    });
  }

  const worstFit = worstBy(data.fits, (f) => f.growthVsLy);
  if (worstFit && worstFit.growthVsLy < 0) {
    out.push({
      id: 'fit-tail',
      tone: 'warning',
      title: worstFit.label,
      detail: `reduce by ${Math.abs(Math.round(worstFit.growthVsLy))}% — low performance`,
      metric: 'Fit',
    });
  } else {
    const worstComp = worstBy(data.compositions, (c) => c.gpPct);
    if (worstComp) {
      out.push({
        id: 'comp-tail',
        tone: 'warning',
        title: worstComp.label,
        detail: `GP ${Math.round(worstComp.gpPct)}% — trim or renegotiate`,
        metric: 'Composition',
      });
    }
  }

  return out.slice(0, 8);
}

/** Recommendation chip logic used by tables — hierarchical thresholds. */
export function classifyAttribute(a: AttributePerf): 'Increase' | 'Maintain' | 'Reduce' {
  if (a.growthVsLy >= 10 && a.gpPct >= 60) return 'Increase';
  if (a.growthVsLy <= -5 || a.gpPct < 55) return 'Reduce';
  return 'Maintain';
}

export function classifyCategory(c: CategoryPerf): 'Increase' | 'Maintain' | 'Reduce' {
  if (c.growthVsLy >= 10) return 'Increase';
  if (c.growthVsLy <= -5) return 'Reduce';
  return 'Maintain';
}

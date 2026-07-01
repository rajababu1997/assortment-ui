/**
 * Sell-through math — computed correctly across multi-period ranges.
 *
 * The naive formula
 *     sum(soldUnits) / (sum(soldUnits) + sum(eomUnits))
 * looks right but isn't: each month's EOM IS next month's BOM, so summing
 * EOM across the range counts the same stock multiple times and drives
 * STR towards the 50% range no matter how good the business is.
 *
 * The correct multi-period formula uses only the LAST period's EOM per
 * inventory slice — that's the stock actually still on the shelf at
 * season end:
 *
 *     STR = sum(soldUnits) / (sum(soldUnits) + sum_over_slices(last_EOM))
 *
 * An "inventory slice" is a (brand × category × band) combination — each
 * one has its own ending stock that we contribute exactly once.
 */

import type { SalesAggregateRow } from '@/features/sales/types';

export function computeSeasonStr(rows: SalesAggregateRow[]): number {
  if (rows.length === 0) return 0;

  // Per (brand × category × band) — find the latest period in the range
  // and remember just that row's EOM.
  const lastEomBySlice = new Map<string, number>();
  const lastPeriodBySlice = new Map<string, string>();
  for (const r of rows) {
    const k = `${r.brandUuid}|${r.categoryUuid}|${r.bandId}`;
    const lp = lastPeriodBySlice.get(k);
    if (!lp || r.periodKey > lp) {
      lastPeriodBySlice.set(k, r.periodKey);
      lastEomBySlice.set(k, r.eomUnits);
    }
  }

  let totalSold = 0;
  for (const r of rows) totalSold += r.grossSalesUnits;
  let totalLastEom = 0;
  for (const e of lastEomBySlice.values()) totalLastEom += e;

  const denom = totalSold + totalLastEom;
  return denom > 0 ? (totalSold / denom) * 100 : 0;
}

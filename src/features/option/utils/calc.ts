/**
 * Client-side derivations for the Option Plan editor. Mirrors the server's
 * `computeProductionQty` / `computeOptionPlanQty` so the buyer sees live
 * numbers before save — server confirms on the next round-trip.
 */

import type { BandAllocation } from '@/features/value/types';
import type { OptionBand, OptionLine } from '../types';
import type { OptionType } from '../constants';

/** floor(band_budget / vp.avg_cost). 0 when band has 0% allocation or no cost. */
export function calcProductionQty(vpBudget: number, vpBand: BandAllocation | undefined): number {
  if (!vpBand) return 0;
  const pct = vpBand.budget_pct ?? 0;
  const cost = vpBand.avg_cost ?? 0;
  if (pct <= 0 || cost <= 0) return 0;
  const bandBudget = (vpBudget * pct) / 100;
  return Math.max(0, Math.floor(bandBudget / cost));
}

/**
 * How many distinct options the band can fund.
 *
 * Business rule: if the band has any real budget (positive productionQty +
 * positive avgPerOption), guarantee at least ONE option — a "hero SKU."
 * Historically this was a plain floor, which produced 0 whenever
 * `avgPerOption > productionQty` (e.g. premium bands with borderline
 * budgets). That 0 confused buyers because they had allocated real ₹ to
 * the band via VP, yet the AI recommended "zero options." At-least-one
 * matches how planners actually reason about premium tiers.
 */
export function calcOptionPlanQty(productionQty: number, avgPerOption: number): number {
  if (productionQty <= 0 || avgPerOption <= 0) return 0;
  return Math.max(1, Math.floor(productionQty / avgPerOption));
}

/** Σ qty for one (band, option_type) — used by the SubGrid subtotal chip. */
export function subGridTotal(band: Pick<OptionBand, 'lines'>, optionType: OptionType): number {
  return band.lines
    .filter((l) => l.option_type === optionType)
    .reduce((s, l) => s + (l.qty ?? 0), 0);
}

/** Remaining option slots in a sub-grid (negative = over-allocated). */
export function subGridRemaining(
  band: Pick<OptionBand, 'lines' | 'option_plan_qty'>,
  optionType: OptionType,
): number {
  return (band.option_plan_qty ?? 0) - subGridTotal(band, optionType);
}

/** Per-band totals across all 3 dimensions — feeds the band header chip. */
export function bandSubGridStatus(band: OptionBand): {
  byType: Record<OptionType, { sum: number; remaining: number }>;
  allValid: boolean;
} {
  const types: OptionType[] = ['fabric_type', 'fit', 'composition'];
  const byType = {} as Record<OptionType, { sum: number; remaining: number }>;
  let allValid = true;
  for (const ot of types) {
    const sum = subGridTotal(band, ot);
    const remaining = (band.option_plan_qty ?? 0) - sum;
    byType[ot] = { sum, remaining };
    // Valid when at least 1 line and sum within [1, option_plan_qty]
    if ((band.option_plan_qty ?? 0) > 0 && (sum < 1 || sum > band.option_plan_qty)) {
      allValid = false;
    }
  }
  return { byType, allValid };
}

/** Group lines for a (band, option_type) into a key→qty map for sub-grid render. */
export function lineMap(
  lines: OptionLine[],
  optionType: OptionType,
): Record<string, OptionLine> {
  const out: Record<string, OptionLine> = {};
  for (const l of lines) {
    if (l.option_type === optionType) out[l.sub_type_key] = l;
  }
  return out;
}

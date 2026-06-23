/**
 * Pure math for Value Plan rows. None of these mutate state; all derive
 * from (BandAllocation, parent MRP band, OTB budget). UI and the slice
 * both consume these — having one place to change formulas matters when
 * margin definitions evolve.
 */

import type { BandAllocation, ValuePlan } from '../types';
import type { Category, MrpBand } from '@/features/otb/types';
import { DEFAULT_SPLIT } from '../constants';

/** ₹ allocated to this band = budget × pct / 100. */
export function bandBudget(band: BandAllocation, totalBudget: number): number {
  return Math.round((totalBudget * band.budget_pct) / 100);
}

/** Units the band can buy at the chosen avg cost. */
export function bandUnits(band: BandAllocation, totalBudget: number): number {
  if (band.avg_cost <= 0) return 0;
  return Math.floor(bandBudget(band, totalBudget) / band.avg_cost);
}

/** Revenue these units will generate at the chosen avg MRP. */
export function bandRevenue(band: BandAllocation, totalBudget: number): number {
  return bandUnits(band, totalBudget) * band.avg_mrp;
}

/** Gross margin % implied by avg MRP vs avg cost (band-level). */
export function bandMargin(band: BandAllocation): number {
  if (band.avg_mrp <= 0) return 0;
  return ((band.avg_mrp - band.avg_cost) / band.avg_mrp) * 100;
}

/** Σ of band % across the plan. Validates against TOTAL_PCT at submit. */
export function planAllocatedPct(plan: ValuePlan): number {
  return plan.bands.reduce((s, b) => s + b.budget_pct, 0);
}

/** Σ of allocated ₹ across the plan. Should equal budget when pct sums to 100. */
export function planAllocatedAmount(plan: ValuePlan): number {
  return plan.bands.reduce((s, b) => s + bandBudget(b, plan.budget_snapshot), 0);
}

/** Total units buyer is committing to across all bands. */
export function planTotalUnits(plan: ValuePlan): number {
  return plan.bands.reduce((s, b) => s + bandUnits(b, plan.budget_snapshot), 0);
}

/** Total revenue across all bands at the chosen MRPs. */
export function planTotalRevenue(plan: ValuePlan): number {
  return plan.bands.reduce((s, b) => s + bandRevenue(b, plan.budget_snapshot), 0);
}

/** Weighted average margin across all bands (revenue-weighted, not unit-weighted). */
export function planAvgMargin(plan: ValuePlan): number {
  const revenue = planTotalRevenue(plan);
  if (revenue <= 0) return 0;
  const spend = planAllocatedAmount(plan);
  return ((revenue - spend) / revenue) * 100;
}

/** Midpoint of a MRP band, or `mrp_min × 1.4` if the band is open-ended.
 *  `== null` catches both null AND undefined — the backend's
 *  @JsonInclude(NON_NULL) drops `mrp_max` from the wire when the DB value
 *  is null, so the open-ended top band arrives as `undefined`, not `null`. */
export function midpointMrp(band: MrpBand): number {
  const min = band.mrp_min ?? 0;
  if (band.mrp_max == null) return Math.round(min * 1.4);
  return Math.round((min + band.mrp_max) / 2);
}

/** Midpoint of the band's cost range. */
export function midpointCost(band: MrpBand): number {
  const min = band.cost_min ?? 0;
  const max = band.cost_max ?? min;
  return Math.round((min + max) / 2);
}

/** Clamp `value` into the band's MRP range. */
export function clampMrp(value: number, band: MrpBand): number {
  const min = band.mrp_min ?? 0;
  const max = band.mrp_max ?? Math.max(min, value);
  return Math.max(min, Math.min(value, max));
}

/** Clamp `value` into the band's cost range. */
export function clampCost(value: number, band: MrpBand): number {
  const min = band.cost_min ?? 0;
  const max = band.cost_max ?? Math.max(min, value);
  return Math.max(min, Math.min(value, max));
}

/** Default BandAllocation[] for a category: DEFAULT_SPLIT % + midpoint MRP & cost. */
export function defaultBandsForCategory(category: Category): BandAllocation[] {
  return category.bands.map((band) => ({
    band_id: band.id,
    budget_pct: DEFAULT_SPLIT[band.id],
    avg_mrp: midpointMrp(band),
    avg_cost: midpointCost(band),
  }));
}

/**
 * Hard validation — the rules the server enforces on APPROVED submit.
 * Mirrored client-side so the buyer gets immediate feedback before the
 * round-trip. Server is final authority.
 *
 *   1. At least one band present (buyer may park all budget in a single tier)
 *   2. No duplicate band_id
 *   3. Σ budget_pct = 100 across the bands that ARE present
 *   4. Per non-zero band: avg_mrp ∈ [mrp_min, mrp_max ?? +∞]
 *   5. Per non-zero band: avg_cost ∈ [cost_min, cost_max]
 *   6. Per non-zero band: avg_cost < avg_mrp (non-negative margin)
 *
 * Zero-pct bands are persisted but exempt from range checks — no money is
 * being spent there.
 */

import type { MrpBand } from '@/features/otb/types';
import type { BandAllocation } from '../types';
import { TOTAL_PCT } from '../constants';

export interface HardValidationError {
  code:
    | 'bands_empty'
    | 'bands_duplicate'
    | 'pct_sum_invalid'
    | 'mrp_out_of_range'
    | 'cost_out_of_range'
    | 'margin_negative'
    | 'band_master_missing';
  message: string;
}

export function validateHard(
  bands: BandAllocation[],
  masterByBandId: Record<MrpBand['id'], MrpBand>,
): HardValidationError[] {
  const errors: HardValidationError[] = [];

  if (bands.length === 0) {
    errors.push({
      code: 'bands_empty',
      message: 'At least one band must be allocated',
    });
    return errors;
  }

  const ids = bands.map((b) => b.band_id);
  if (new Set(ids).size !== ids.length) {
    errors.push({
      code: 'bands_duplicate',
      message: 'Each band tier may appear at most once',
    });
  }

  const pctSum = bands.reduce((s, b) => s + (b.budget_pct ?? 0), 0);
  if (pctSum !== TOTAL_PCT) {
    errors.push({
      code: 'pct_sum_invalid',
      message: `Σ % must equal ${TOTAL_PCT} (got ${pctSum})`,
    });
  }

  for (const band of bands) {
    // Skip range checks on zero-pct bands — no money being spent there.
    if ((band.budget_pct ?? 0) === 0) continue;

    const master = masterByBandId[band.band_id];
    if (!master) {
      errors.push({
        code: 'band_master_missing',
        message: `${band.band_id}: master band definition missing`,
      });
      continue;
    }
    const mrpMax = master.mrp_max ?? Number.POSITIVE_INFINITY;
    if (band.avg_mrp < master.mrp_min || band.avg_mrp > mrpMax) {
      errors.push({
        code: 'mrp_out_of_range',
        message: `${band.band_id}: MRP ${band.avg_mrp} out of [${master.mrp_min}, ${master.mrp_max ?? '∞'}]`,
      });
    }
    if (band.avg_cost < master.cost_min || band.avg_cost > master.cost_max) {
      errors.push({
        code: 'cost_out_of_range',
        message: `${band.band_id}: cost ${band.avg_cost} out of [${master.cost_min}, ${master.cost_max}]`,
      });
    }
    if (band.avg_cost >= band.avg_mrp) {
      errors.push({
        code: 'margin_negative',
        message: `${band.band_id}: cost (${band.avg_cost}) must be less than MRP (${band.avg_mrp})`,
      });
    }
  }

  return errors;
}

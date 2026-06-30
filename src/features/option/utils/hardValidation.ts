/**
 * Hard validation — gates the buyer's Submit and the designer's Approve.
 *
 * "Must-fill" bands come from the Value Plan: any band where the VP
 * allocated budget_pct > 0 has to be filled out in the Option Plan. We
 * don't derive that from the buyer's own option_plan_qty (which is 0
 * until they enter avg per option), otherwise an empty form would pass.
 *
 * Per must-fill band:
 *   - avg_production_qty_per_option > 0
 *   - For each of the 3 OptionTypes: at least one line present
 *   - No duplicate sub_type_key within an OptionType
 *   - Σ qty per OptionType ∈ [1, option_plan_qty]
 *   - All qty ≥ 0
 *
 * Bands NOT in must-fill (VP gave them 0%) cannot carry positive qty.
 */

import type { OptionBand } from '../types';
import { OPTION_TYPES, type OptionType } from '../constants';

export interface OpValidationError {
  code:
    | 'bands_empty'
    | 'bands_duplicate'
    | 'no_active_band'
    | 'band_unfilled'
    | 'avg_per_option_required'
    | 'option_type_missing'
    | 'sub_type_duplicate'
    | 'sub_type_sum_invalid'
    | 'qty_negative'
    | 'inactive_band_has_qty';
  band_id?: OptionBand['band_id'];
  option_type?: OptionType;
  message: string;
}

const TYPES: OptionType[] = [OPTION_TYPES.FABRIC_TYPE, OPTION_TYPES.FIT, OPTION_TYPES.COMPOSITION];

export function validateHard(
  bands: OptionBand[],
  mustFillBandIds: ReadonlySet<OptionBand['band_id']> = new Set(),
): OpValidationError[] {
  const errors: OpValidationError[] = [];
  if (bands.length === 0) {
    errors.push({ code: 'bands_empty', message: 'At least one band must be provided' });
    return errors;
  }
  const ids = bands.map((b) => b.band_id);
  if (new Set(ids).size !== ids.length) {
    errors.push({ code: 'bands_duplicate', message: 'Each band tier may appear at most once' });
  }

  let hasFilledBand = false;
  for (const band of bands) {
    const opq = band.option_plan_qty ?? 0;
    const mustFill = mustFillBandIds.has(band.band_id);

    if (!mustFill) {
      // VP didn't allocate budget to this band — buyer must leave it empty.
      if (band.lines.some((l) => (l.qty ?? 0) > 0)) {
        errors.push({
          code: 'inactive_band_has_qty',
          band_id: band.band_id,
          message: `${band.band_id}: 0-budget band cannot carry option qty`,
        });
      }
      continue;
    }

    // VP allocated budget → this band must be fully filled.
    const avg = band.avg_production_qty_per_option ?? 0;
    const totalQty = band.lines.reduce((s, l) => s + (l.qty ?? 0), 0);
    if (avg <= 0 && totalQty <= 0) {
      errors.push({
        code: 'band_unfilled',
        band_id: band.band_id,
        message: `${band.band_id}: enter values — this band has Value Plan budget`,
      });
      continue;
    }

    hasFilledBand = true;
    if (avg <= 0) {
      errors.push({
        code: 'avg_per_option_required',
        band_id: band.band_id,
        message: `${band.band_id}: enter avg production qty per option`,
      });
    }

    for (const ot of TYPES) {
      const subset = band.lines.filter((l) => l.option_type === ot);
      if (subset.length === 0) {
        errors.push({
          code: 'option_type_missing',
          band_id: band.band_id,
          option_type: ot,
          message: `${band.band_id} / ${ot}: at least one entry required`,
        });
        continue;
      }
      const keys = subset.map((l) => l.sub_type_key);
      if (new Set(keys).size !== keys.length) {
        errors.push({
          code: 'sub_type_duplicate',
          band_id: band.band_id,
          option_type: ot,
          message: `${band.band_id} / ${ot}: duplicate sub-type`,
        });
      }
      for (const l of subset) {
        if ((l.qty ?? 0) < 0) {
          errors.push({
            code: 'qty_negative',
            band_id: band.band_id,
            option_type: ot,
            message: `${band.band_id} / ${ot} / ${l.sub_type_key}: qty cannot be negative`,
          });
        }
      }
      const sum = subset.reduce((s, l) => s + (l.qty ?? 0), 0);
      if (opq <= 0) {
        // avg_per_option missing → opq derives to 0; the avg error already
        // covers it. Skip the [1..opq] check to avoid a confusing double
        // error pointing at the same root cause.
        if (sum < 1) {
          errors.push({
            code: 'sub_type_sum_invalid',
            band_id: band.band_id,
            option_type: ot,
            message: `${band.band_id} / ${ot}: enter at least one qty`,
          });
        }
      } else if (sum < 1 || sum > opq) {
        errors.push({
          code: 'sub_type_sum_invalid',
          band_id: band.band_id,
          option_type: ot,
          message: `${band.band_id} / ${ot}: total qty = ${sum}, must be between 1 and ${opq}`,
        });
      }
    }
  }

  if (mustFillBandIds.size > 0 && !hasFilledBand) {
    errors.push({ code: 'no_active_band', message: 'Fill at least one band with Value Plan budget' });
  }
  return errors;
}

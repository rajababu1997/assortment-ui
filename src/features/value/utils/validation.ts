/**
 * Soft validation checks for Value Plan. These never block submit — they
 * surface as colored chips on the editor so the buyer can deliberately
 * override or course-correct.
 */

import { SOFT_LIMITS } from '../constants';
import { bandMargin } from './calc';
import type { BandAllocation, ValuePlan } from '../types';

export type WarningTone = 'warning' | 'danger';

export interface SoftWarning {
  tone: WarningTone;
  message: string;
}

/** Per-band soft checks. Returns 0..N warnings. */
export function bandWarnings(band: BandAllocation): SoftWarning[] {
  const warnings: SoftWarning[] = [];
  const margin = bandMargin(band);
  if (margin > 0 && margin < SOFT_LIMITS.MIN_MARGIN_PCT) {
    warnings.push({ tone: 'danger', message: `Margin ${margin.toFixed(1)}% below target` });
  }
  if (band.band_id === 'entry' && band.budget_pct < SOFT_LIMITS.MIN_ENTRY_PCT) {
    warnings.push({ tone: 'warning', message: `Thin entry-tier (${band.budget_pct}%)` });
  }
  if (band.band_id === 'statement' && band.budget_pct > SOFT_LIMITS.MAX_STATEMENT_PCT) {
    warnings.push({ tone: 'warning', message: `Heavy premium skew (${band.budget_pct}%)` });
  }
  return warnings;
}

/** Plan-level rollup — used by the info-strip warnings chip. */
export function planWarningCount(plan: ValuePlan): { danger: number; warning: number } {
  let danger = 0;
  let warning = 0;
  for (const b of plan.bands) {
    for (const w of bandWarnings(b)) {
      if (w.tone === 'danger') danger += 1;
      else warning += 1;
    }
  }
  return { danger, warning };
}

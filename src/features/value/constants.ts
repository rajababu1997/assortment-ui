/**
 * Value Plan state machine + display labels.
 *
 * Value Plan is Step 2 in the Assortment Planning pipeline. One Value Plan
 * exists per released OTB row, keyed by `otb_code`. The buyer can re-edit
 * and re-submit even after APPROVED — mirrors the post-release editability
 * we wired into Step 1.
 */

export const VP_STATES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
} as const;

export type VpState = (typeof VP_STATES)[keyof typeof VP_STATES];

export const VP_STATE_LABELS: Record<VpState, string> = {
  [VP_STATES.DRAFT]: 'Draft',
  [VP_STATES.SUBMITTED]: 'Submitted',
  [VP_STATES.APPROVED]: 'Approved',
};

export const VP_STATE_TONES: Record<VpState, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  [VP_STATES.DRAFT]: 'neutral',
  [VP_STATES.SUBMITTED]: 'info',
  [VP_STATES.APPROVED]: 'success',
};

/** Σ of band % must equal exactly this value at submit time. */
export const TOTAL_PCT = 100;

/** Soft thresholds — never block submit, only surface as warning chips. */
export const SOFT_LIMITS = {
  MIN_MARGIN_PCT: 60,         // below → red "Below margin target"
  MAX_STATEMENT_PCT: 25,      // above → amber "Heavy premium skew"
  MIN_ENTRY_PCT: 15,          // below → amber "Thin entry-tier"
} as const;

/** Initial split applied when a Value Plan is first created.
 *  All zero — the buyer allocates manually; we don't presume any tier mix.
 *  Used by `defaultBandsForCategory` and the editor's Reset button. */
export const DEFAULT_SPLIT: Record<'entry' | 'core' | 'upper' | 'statement', number> = {
  entry: 0,
  core: 0,
  upper: 0,
  statement: 0,
};

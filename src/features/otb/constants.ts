/**
 * OTB Planning state machine + display labels.
 */

export const OTB_STATES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  IN_PROGRESS: 'in_progress',
  LOCKED: 'locked',
  SKIPPED: 'skipped',
} as const;

export type OtbState = (typeof OTB_STATES)[keyof typeof OTB_STATES];

export const OTB_STATE_LABELS: Record<OtbState, string> = {
  [OTB_STATES.DRAFT]: 'Draft',
  [OTB_STATES.SUBMITTED]: 'Submitted',
  [OTB_STATES.APPROVED]: 'Approved',
  [OTB_STATES.IN_PROGRESS]: 'In progress',
  [OTB_STATES.LOCKED]: 'Released',
  [OTB_STATES.SKIPPED]: 'Skipped',
};

export const OTB_STATE_TONES: Record<OtbState, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  [OTB_STATES.DRAFT]: 'neutral',
  [OTB_STATES.SUBMITTED]: 'info',
  [OTB_STATES.APPROVED]: 'info',
  [OTB_STATES.IN_PROGRESS]: 'warning',
  [OTB_STATES.LOCKED]: 'success',
  [OTB_STATES.SKIPPED]: 'danger',
};

export const VARIANCE_WARN_THRESHOLD_PCT = 5;
export const VARIANCE_ALERT_THRESHOLD_PCT = 10;

/** Buffer subtracted from `lead_time_days` when deciding if a period is
 *  still releasable for the first time. Doesn't apply to re-releases of an
 *  already-released period — see release.component.tsx. */
export const LEAD_TIME_LOCK_BUFFER_DAYS = 5;

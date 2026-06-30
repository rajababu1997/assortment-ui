/**
 * Lifecycle-stage labels and ordering. The 5 stages are the columns of the
 * detail page's stage strip and the source of truth for the All-OTBs grid's
 * lifecycle column.
 */

import type { LifecycleState } from './types';

export const LIFECYCLE_STATES = {
  PLANNED: 'planned',
  RELEASED: 'released',
  VALUE_PLANNED: 'value_planned',
  OPTION_PLANNED: 'option_planned',
  FINAL_APPROVED: 'final_approved',
} as const;

export const LIFECYCLE_ORDER: LifecycleState[] = [
  'planned',
  'released',
  'value_planned',
  'option_planned',
  'final_approved',
];

export const LIFECYCLE_LABELS: Record<LifecycleState, string> = {
  planned: 'Planned',
  released: 'Released',
  value_planned: 'Value Planned',
  option_planned: 'Option Planned',
  final_approved: 'Final Approved',
};

/** Reached / unreached check using LIFECYCLE_ORDER. */
export const lifecycleReached = (
  current: LifecycleState,
  target: LifecycleState,
): boolean => LIFECYCLE_ORDER.indexOf(current) >= LIFECYCLE_ORDER.indexOf(target);

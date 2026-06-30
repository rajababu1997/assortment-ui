/**
 * Option Plan state machine + catalogues.
 *
 * Step 3 of the Assortment Planning pipeline. One Option Plan per OTB row
 * (= per category × period). The buyer breaks the OTB budget across the 4
 * MRP bands and, for each band, splits the resulting option count across
 * Fabric Type / Fit / Composition. The designer reviews — approves or sends
 * back with a required comment.
 *
 * The Fabric / Fit / Composition catalogues are GLOBAL (per the brief): the
 * same set surfaces for every category. Edit here to change what the buyer
 * can pick from; the backend just persists the sub_type_key + label sent.
 */

export const OP_STATES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  REVISIONS_REQUESTED: 'revisions_requested',
  APPROVED: 'approved',
} as const;

export type OpState = (typeof OP_STATES)[keyof typeof OP_STATES];

export const OP_STATE_LABELS: Record<OpState, string> = {
  [OP_STATES.DRAFT]: 'Draft',
  [OP_STATES.SUBMITTED]: 'In Review',
  [OP_STATES.REVISIONS_REQUESTED]: 'Revisions Requested',
  [OP_STATES.APPROVED]: 'Approved',
};

export const OP_STATE_TONES: Record<
  OpState,
  'neutral' | 'info' | 'success' | 'warning' | 'danger'
> = {
  [OP_STATES.DRAFT]: 'neutral',
  [OP_STATES.SUBMITTED]: 'info',
  [OP_STATES.REVISIONS_REQUESTED]: 'warning',
  [OP_STATES.APPROVED]: 'success',
};

/** Save / transition verbs. Mirrors backend `OptionPlanAction`. */
export const OP_ACTIONS = {
  SAVE_DRAFT: 'save_draft',
  SUBMIT: 'submit',
  APPROVE: 'approve',
  REQUEST_REVISIONS: 'request_revisions',
  NOTE: 'note',
} as const;

export type OpAction = (typeof OP_ACTIONS)[keyof typeof OP_ACTIONS];

/** The three sub-grid dimensions. Mirrors backend `OptionType`. */
export const OPTION_TYPES = {
  FABRIC_TYPE: 'fabric_type',
  FIT: 'fit',
  COMPOSITION: 'composition',
} as const;

export type OptionType = (typeof OPTION_TYPES)[keyof typeof OPTION_TYPES];

export const OPTION_TYPE_LABELS: Record<OptionType, string> = {
  [OPTION_TYPES.FABRIC_TYPE]: 'Fabric Type',
  [OPTION_TYPES.FIT]: 'Fit',
  [OPTION_TYPES.COMPOSITION]: 'Composition',
};

export interface SubTypeOption {
  key: string;   // snake_case, sent to backend as sub_type_key
  label: string; // display label
}

/**
 * GLOBAL catalogue — every category sees the same options. Keep keys stable
 * (they're the persisted identifier); labels can change freely.
 */
export const SUB_TYPE_CATALOGUE: Record<OptionType, SubTypeOption[]> = {
  [OPTION_TYPES.FABRIC_TYPE]: [
    { key: 'plain',   label: 'Plain' },
    { key: 'printed', label: 'Printed' },
    { key: 'checks',  label: 'Checks' },
    { key: 'strips',  label: 'Strips' },
  ],
  [OPTION_TYPES.FIT]: [
    { key: 'slim_fit',    label: 'Slim Fit' },
    { key: 'regular_fit', label: 'Regular Fit' },
  ],
  [OPTION_TYPES.COMPOSITION]: [
    { key: 'cotton_100',    label: '100% Cotton' },
    { key: 'polyester_100', label: '100% Polyester' },
    { key: 'linen_100',     label: '100% Linen' },
    { key: 'blend',         label: 'Blend' },
  ],
};

/** REQUEST_REVISIONS comment length window (matches backend guard). */
export const REVISION_COMMENT_MIN = 5;
export const REVISION_COMMENT_MAX = 2000;

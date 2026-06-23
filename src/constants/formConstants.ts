/**
 * Form constants — field types, validation patterns, form modes, field lengths.
 * Mirrors Angular FORM_CONTROL_TYPES + FORM_FIELDS_CONSTANTS_VALUES from tps-enum-constants.ts.
 */

import type { FieldType } from '@/components/tps-form/tpsFormInterfaceTypes';

// ── Field Types ────────────────────────────────────────────────────────────
export const FIELD_TYPES: Record<string, FieldType> = {
  TEXT: 'text',
  NUMBER: 'number',
  PASSWORD: 'password',
  TEXTAREA: 'textarea',
  SINGLE_SELECT: 'single-select',
  MULTI_SELECT: 'multi-select',
  RADIO: 'radio',
  CHECKBOX: 'checkbox',
  DATE: 'date',
  TOGGLE_SWITCH: 'toggle-switch',
  SLIDER: 'slider',
  TOGGLE_BUTTON: 'toggle-button',
  SELECTED_BUTTON: 'selected-button',
  SEGMENTED_CONTROL: 'segmented-control',
  TEXT_SEARCH: 'text-search',
  MULTI_FORM_FIELD: 'multi-form-field',
} as const;

// ── Validation Patterns ────────────────────────────────────────────────────
export const VALIDATION_PATTERNS = {
  ALPHA: '^[a-zA-Z]+$',
  ALPHA_WITH_SPACE: '^[a-zA-Z ]+$',
  ALPHA_NUMERIC: '^[a-zA-Z0-9]+$',
  ALPHA_NUMERIC_WITH_SPACE: '^[a-zA-Z0-9 ]+$',
  NUMERIC: '^[0-9]+$',
  FLOAT: '^[0-9.]+$',
  EMAIL: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  MULTIPLE_EMAIL: '^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})(,\\s*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})*$',
  IP_ADDRESS: '^(?:[0-9]{1,3}\\.){3}[0-9]{1,3}$',
  LATITUDE: '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$',
  LONGITUDE: '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$',
  URL: '^https?:\\/\\/[^\\s/$.?#].[^\\s]*$',
} as const;

// ── Form Modes ─────────────────────────────────────────────────────────────
export const FORM_MODES = {
  CREATE: 'create',
  EDIT: 'edit',
  VIEW: 'view',
} as const;
export type DialogMode = typeof FORM_MODES[keyof typeof FORM_MODES];

// ── Common Lengths ─────────────────────────────────────────────────────────
export const FIELD_LENGTHS = {
  PHONE: 10,
  TEXTAREA: 500,
  NAME: 255,
  SHORT_TEXT: 100,
} as const;

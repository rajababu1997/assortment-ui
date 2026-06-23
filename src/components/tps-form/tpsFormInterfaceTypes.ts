import type { UseFormReturn } from 'react-hook-form';
import type { LucideIcon } from 'lucide-react';

// ── Field Types ────────────────────────────────────────────────────────────
// Maps to Angular FORM_CONTROL_TYPES enum
export type FieldType =
  | 'text'
  | 'number'
  | 'password'
  | 'textarea'
  | 'single-select'
  | 'multi-select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'toggle-switch'
  | 'slider'
  | 'toggle-button'
  | 'selected-button'
  | 'segmented-control'
  | 'text-search'
  | 'multi-form-field';

// ── Validation Rules ───────────────────────────────────────────────────────
// Maps to Angular FORM_VALIDATION_TYPES + rules object
export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

// ── Field Option ───────────────────────────────────────────────────────────
export interface FieldOption {
  label: string;
  value: any;
  raw?: any;
  disabled?: boolean;
}

// ── Field Schema ───────────────────────────────────────────────────────────
// Typed version of Angular form model field descriptor
export interface FieldSchema {
  type: FieldType;
  label: string;
  placeholder?: string;
  value?: any;
  disabled?: boolean;
  show?: boolean;
  options?: FieldOption[];
  rules?: ValidationRules;
  section?: string;
  sectionIcon?: LucideIcon;
  /** Section icon color: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'purple' */
  sectionColor?: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'purple';
  /** Allow the section to be collapsed/expanded */
  sectionCollapsible?: boolean;
  /** Start the section collapsed (progressive disclosure for optional sections) */
  sectionDefaultCollapsed?: boolean;
  /** Optional description shown below the section title */
  sectionDescription?: string;
  tooltip?: string;
  hint?: string;
  /** AI context hint — shown as a gradient chip below the field (e.g. "AI will analyze this stream") */
  aiHint?: string;
  /** Mark the section as AI-powered — shows an "AI" badge next to section title */
  sectionAiPowered?: boolean;
  onChange?: (value: any) => void;
  colSpan?: 1 | 2;
  // Number field extras
  prefix?: string;
  suffix?: string;
  minFractionDigits?: number;
  maxFractionDigits?: number;
  // Date field extras
  showTime?: boolean;
  minDate?: Date;
  maxDate?: Date;
  // Textarea extras
  rows?: number;
  // Text field extras
  showInUpperCase?: boolean;
  inputType?: 'text' | 'email' | 'tel' | 'url' | 'password';
  // Select extras
  editable?: boolean;
  filter?: boolean;
  // SegmentedControl extras
  segmentedVariant?: 'primary' | 'cyan' | 'solid';
  // Multi-form-field (nested repeating rows)
  controls?: FormSchema;
}

// ── Form Schema ────────────────────────────────────────────────────────────
// Replaces Angular Record<string, any> model — keys are field names
export type FormSchema = Record<string, FieldSchema>;

// ── Form Mode ──────────────────────────────────────────────────────────────
export type FormMode = 'create' | 'edit' | 'view';

// ── Form Layout ────────────────────────────────────────────────────────────
export type FormLayout = 'row' | 'column';

// ── Resolved Field ─────────────────────────────────────────────────────────
// FieldSchema enriched with its key name — used internally by DynamicForm
export interface ResolvedField extends FieldSchema {
  fieldName: string;
}

// ── Field Component Props ──────────────────────────────────────────────────
// Shared contract every field component receives
export interface FieldProps {
  field: ResolvedField;
  form: UseFormReturn<any>;
  layout: FormLayout;
  mode: FormMode;
}

// ── useFormFactory Options ─────────────────────────────────────────────────
export interface FormFactoryOptions {
  mode: FormMode;
}

// ── useFormFactory Return ──────────────────────────────────────────────────
export interface FormFactoryReturn {
  form: UseFormReturn<any>;
  fields: ResolvedField[];
  setOptions: (fieldName: string, options: FieldOption[]) => void;
  setControlOptions: (fieldName: string, controlName: string, options: FieldOption[]) => void;
  showControl: (fieldName: string, controlName: string, visible: boolean) => void;
  showField: (fieldName: string, visible: boolean) => void;
  setFieldRules: (fieldName: string, rules: ValidationRules) => void;
  populateForm: (data: Record<string, any>) => void;
  toPayload: () => Record<string, any>;
}

import type { ReactNode, MutableRefObject } from 'react';
import type { Control, FieldValues, UseFormReturn } from 'react-hook-form';
import type { ZodTypeAny } from 'zod';

export type FormMode = 'create' | 'edit' | 'view';

export type FieldOption<V extends string | number = string> = {
  value: V;
  label: string;
  disabled?: boolean;
};

type BaseFieldProps = {
  name: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  /** Auto-disable this field when mode matches one of these (e.g. ['edit'] locks `code` on edit). */
  disabledIn?: FormMode[];
  /** Show field — boolean or predicate on current form values. Default: true. */
  show?: boolean | ((_values: Record<string, unknown>) => boolean);
  /** Span in a 2-column grid. Default: 1. Sections always span full width. */
  colSpan?: 1 | 2;
  placeholder?: string;
  helperText?: string;
  /** Optional tooltip shown on an info icon next to the label. */
  info?: string;
};

export type TextFieldSchema = BaseFieldProps & {
  type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'search';
  maxLength?: number;
  minLength?: number;
  clearable?: boolean;
  autoComplete?: string;
};

export type DateFieldSchema = BaseFieldProps & {
  type: 'date' | 'time' | 'datetime-local';
  /** ISO date string min (YYYY-MM-DD). */
  min?: string;
  /** ISO date string max (YYYY-MM-DD). */
  max?: string;
};

export type DatePickerFieldSchema = BaseFieldProps & {
  type: 'datepicker';
  showTime?: boolean;
  minDate?: string | Date;
  maxDate?: string | Date;
};

export type FileFieldSchema = BaseFieldProps & {
  type: 'file';
  accept?: string;
  maxSize?: number;
  preview?: boolean;
  previewHeight?: number;
  /** External preview URL to show when no File is selected (e.g. existing server image). */
  previewUrl?: string | null;
  /** Show a loading skeleton while the external preview is being fetched. */
  previewLoading?: boolean;
  hint?: string;
};

export type TextareaFieldSchema = BaseFieldProps & {
  type: 'textarea';
  rows?: number;
  maxLength?: number;
  autosize?: boolean;
};

export type NumberFieldSchema = BaseFieldProps & {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  prefix?: string;
  suffix?: string;
  showButtons?: boolean;
};

export type SelectFieldSchema = BaseFieldProps & {
  type: 'select';
  options: FieldOption[];
  /** Show ✕ to clear the selection. Defaults to true. Set false to suppress. */
  clearable?: boolean;
};

export type MultiSelectFieldSchema = BaseFieldProps & {
  type: 'multiselect';
  options: FieldOption[];
  searchable?: boolean;
  maxChips?: number;
};

export type CheckboxFieldSchema = BaseFieldProps & {
  type: 'checkbox';
  /** Text shown next to the checkbox (falls back to `label` when omitted). */
  checkboxLabel?: string;
};

export type SwitchFieldSchema = BaseFieldProps & {
  type: 'switch';
  description?: string;
};

export type RadioFieldSchema = BaseFieldProps & {
  type: 'radio';
  options: FieldOption[];
  orientation?: 'horizontal' | 'vertical';
};

export type SectionSchema = {
  type: 'section';
  /** Section identifier (for React key stability). Optional. */
  name?: string;
  label: string;
  icon?: ReactNode;
  /** Hide this section (and its logical group) conditionally. */
  show?: boolean | ((_values: Record<string, unknown>) => boolean);
};

export interface CustomFieldContext<T extends FieldValues = FieldValues> {
  control: Control<T>;
  form: UseFormReturn<T>;
  mode: FormMode;
  values: Record<string, unknown>;
  disabled: boolean;
}

export type CustomFieldSchema = BaseFieldProps & {
  type: 'custom';
  render: (_ctx: CustomFieldContext) => ReactNode;
};

export type FieldSchema =
  | TextFieldSchema
  | DateFieldSchema
  | DatePickerFieldSchema
  | FileFieldSchema
  | TextareaFieldSchema
  | NumberFieldSchema
  | SelectFieldSchema
  | MultiSelectFieldSchema
  | CheckboxFieldSchema
  | SwitchFieldSchema
  | RadioFieldSchema
  | SectionSchema
  | CustomFieldSchema;

export type FormSchema = FieldSchema[];

export interface PrimitiveFormProps<T extends FieldValues = FieldValues> {
  /** Schema describing fields in render order. */
  schema: FormSchema;
  /** Zod validation schema. If omitted, no validation runs. */
  validation?: ZodTypeAny;
  /** Current mode — controls default disabled state. `view` disables all fields. */
  mode: FormMode;
  /** Initial form values. The form resets to these whenever they change. */
  defaultValues: Partial<T>;
  /** Number of grid columns. Default 1. Sections always span full width. */
  columns?: 1 | 2;
  /** Label placement per field.
   *  - `'top'` (default): label stacked above input.
   *  - `'left'`: label on left, input on right (≥768px). Below 768px it re-stacks. */
  labelPlacement?: 'top' | 'left';
  /** Row-label tuning. Only used when `labelPlacement === 'left'`.
   *  All values accept any CSS length (`160px`, `14rem`, `20%`, etc.).
   *  - `labelWidth`    — fixed label column width (default `160px`).
   *  - `inputMaxWidth` — caps how wide inputs stretch (default `520px`).
   *  - `rowGap`        — gap between label and input (default `12px`).
   */
  rowLabelOptions?: {
    labelWidth?: string;
    inputMaxWidth?: string;
    rowGap?: string;
  };
  /** ID attribute on the `<form>` — link external submit buttons with `form={id}`. */
  formId?: string;
  /** Called with validated values on submit. Return a promise to await. */
  onSubmit?: (_values: T) => void | Promise<void>;
  /** Notified on every form change with the full current values + name of the changed field. */
  onChange?: (_values: Partial<T>, _changedField: string | null) => void;
  /** Called whenever the form's overall validity changes. */
  onValidityChange?: (_isValid: boolean) => void;
  /** Exposes the underlying react-hook-form instance for imperative control. */
  formRef?: MutableRefObject<UseFormReturn<T> | null>;
  className?: string;
}

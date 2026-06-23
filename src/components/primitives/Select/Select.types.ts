import type { ReactNode } from 'react';

export interface SelectOption<V extends string | number = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface SelectProps<V extends string | number = string> {
  label?: string;
  value: V | null;
  onChange: (_value: V) => void;
  options: SelectOption<V>[];
  placeholder?: string;
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  className?: string;
  renderOption?: (_option: SelectOption<V>) => ReactNode;
  /** Force search box. Auto-enabled when options > 5 */
  searchable?: boolean;
  /** Tooltip text shown on an info icon next to the label. */
  infoText?: string;
  /** Show ✕ button to clear the selection. Calls onClear when clicked. */
  clearable?: boolean;
  /** Called when the clear button is clicked. */
  onClear?: () => void;
}

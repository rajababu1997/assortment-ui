import type { ReactNode } from 'react';

export interface MultiSelectOption<V extends string | number = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps<V extends string | number = string> {
  label?: string;
  value: V[];
  onChange: (_value: V[]) => void;
  options: MultiSelectOption<V>[];
  placeholder?: string;
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
  required?: boolean;
  /** Show a search box inside the panel. Default: true when options > 7 */
  searchable?: boolean;
  /** Max chips shown before "+N more" chip. Default: 3 */
  maxChips?: number;
  id?: string;
  className?: string;
  /** Tooltip text shown on an info icon next to the label. */
  infoText?: string;
  /** Custom renderer for each option row in the dropdown panel. Falls back to opt.label. */
  renderOption?: (_opt: MultiSelectOption<V>, _isChecked: boolean) => ReactNode;
}

import type { InputHTMLAttributes } from 'react';

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'number' | 'date' | 'time' | 'datetime-local';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size' | 'type'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  type?: InputType;
  /** Show clear button when value is non-empty. Default: true */
  clearable?: boolean;
  /** Tooltip text shown on an info icon next to the label. */
  infoText?: string;
  /** Wrapper class name (applied to root, not input) */
  className?: string;
}

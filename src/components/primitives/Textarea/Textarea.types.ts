import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** Visible rows. Default: 4 */
  rows?: number;
  /** When true, autosize to content. Overrides `rows`. Default: false */
  autosize?: boolean;
  /** Max rows when autosize is true. Default: 10 */
  maxRows?: number;
  /** Show a char counter "n / max" below the field. */
  maxLength?: number;
  className?: string;
  /** Tooltip text shown on an info icon next to the label. */
  infoText?: string;
}

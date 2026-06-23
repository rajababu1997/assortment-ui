export interface NumberInputProps {
  label?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  error?: string;
  hasError?: boolean;
  disabled?: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  /** Decimal places to display. Default: 0 (integer) */
  precision?: number;
  /** Prefix text rendered inside the field (e.g. "$"). */
  prefix?: string;
  /** Suffix text rendered inside the field (e.g. "kg"). */
  suffix?: string;
  /** Show increment/decrement spinner buttons. Default: true */
  showButtons?: boolean;
  id?: string;
  className?: string;
  /** Tooltip text shown on an info icon next to the label. */
  infoText?: string;
}

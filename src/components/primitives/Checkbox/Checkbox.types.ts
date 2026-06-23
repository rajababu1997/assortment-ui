export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** Indeterminate state (visually dash). */
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  id?: string;
  /** Position of the label relative to the box. Default: 'right' */
  labelSide?: 'left' | 'right';
  className?: string;
}

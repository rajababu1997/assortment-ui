export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /** Optional description shown below the label. */
  description?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  id?: string;
  /** Position of the label relative to the toggle. Default: 'right' */
  labelSide?: 'left' | 'right';
  className?: string;
}

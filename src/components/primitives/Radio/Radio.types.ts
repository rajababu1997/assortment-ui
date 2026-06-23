export interface RadioOption<V extends string = string> {
  value: V;
  label: string;
  disabled?: boolean;
}

export interface RadioProps<V extends string = string> {
  /** Name attribute shared across options in the group. */
  name: string;
  value: V | null;
  onChange: (value: V) => void;
  options: RadioOption<V>[];
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  /** Layout of the radio options. Default: 'vertical' */
  orientation?: 'vertical' | 'horizontal';
  className?: string;
  /** Tooltip text shown on an info icon next to the group label. */
  infoText?: string;
}

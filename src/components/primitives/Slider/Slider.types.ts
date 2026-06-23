export interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  onChangeEnd?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Show current value as a tooltip bubble above the thumb. */
  showValue?: boolean;
  /** Format displayed value (when showValue=true). */
  valueFormatter?: (v: number) => string;
  ariaLabel?: string;
  className?: string;
}

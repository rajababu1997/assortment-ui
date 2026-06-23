import clsx from 'clsx';
import styles from './Slider.module.css';
import type { SliderProps } from './Slider.types';

export function Slider({
  value,
  onChange,
  onChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  showValue = false,
  valueFormatter,
  ariaLabel,
  className,
}: SliderProps) {
  const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;
  const display = valueFormatter ? valueFormatter(value) : String(value);

  return (
    <div className={clsx(styles.root, className)} style={{ ['--progress' as any]: `${progress}%` }}>
      {showValue && <span className={styles.valueBubble}>{display}</span>}
      <input
        type="range"
        className={styles.input}
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseUp={() => onChangeEnd?.(value)}
        onTouchEnd={() => onChangeEnd?.(value)}
        onKeyUp={() => onChangeEnd?.(value)}
      />
    </div>
  );
}

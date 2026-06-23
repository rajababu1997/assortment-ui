import clsx from 'clsx';
import styles from './SelectButton.module.css';
import type { SelectButtonProps } from './SelectButton.types';

const sizeClass = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
};

export function SelectButton<T extends string | number>({
  options,
  value,
  onChange,
  multiple = false,
  allowUnselect = false,
  size = 'md',
  fullWidth = false,
  disabled = false,
  ariaLabel,
  className,
}: SelectButtonProps<T>) {
  const selectedSet = new Set<T>(
    multiple
      ? Array.isArray(value) ? value : []
      : value != null ? [value as T] : [],
  );

  const handleClick = (opt: T) => {
    if (multiple) {
      const next = new Set(selectedSet);
      next.has(opt) ? next.delete(opt) : next.add(opt);
      onChange(Array.from(next));
    } else {
      if (selectedSet.has(opt)) {
        if (allowUnselect) onChange(null);
      } else {
        onChange(opt);
      }
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={clsx(styles.group, sizeClass[size], fullWidth && styles.fullWidth, className)}
    >
      {options.map((opt) => {
        const isSelected = selectedSet.has(opt.value);
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={disabled || opt.disabled}
            aria-pressed={isSelected}
            className={clsx(styles.button, isSelected && styles.selected)}
            onClick={() => handleClick(opt.value)}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

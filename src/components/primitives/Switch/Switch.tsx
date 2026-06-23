import { useId } from 'react';
import clsx from 'clsx';
import styles from './Switch.module.css';
import type { SwitchProps } from './Switch.types';

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  required,
  error,
  id,
  labelSide = 'right',
  className,
}: SwitchProps) {
  const reactId = useId();
  const inputId = id ?? `switch-${reactId}`;

  return (
    <div className={clsx(styles.root, className)}>
      <label
        className={clsx(
          styles.row,
          disabled && styles.rowDisabled,
          labelSide === 'left' && styles.rowLabelLeft,
        )}
        htmlFor={inputId}
      >
        <input
          type="checkbox"
          role="switch"
          id={inputId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          aria-checked={checked}
          aria-invalid={!!error}
          className={styles.input}
        />

        <span
          className={clsx(
            styles.track,
            checked && styles.trackChecked,
            error && styles.trackError,
          )}
          aria-hidden
        >
          <span className={clsx(styles.thumb, checked && styles.thumbChecked)} />
        </span>

        {(label || description) && (
          <span className={styles.textGroup}>
            {label && (
              <span className={styles.label}>
                {label}
                {required && <span className={styles.required} aria-hidden>*</span>}
              </span>
            )}
            {description && (
              <span className={styles.description}>{description}</span>
            )}
          </span>
        )}
      </label>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

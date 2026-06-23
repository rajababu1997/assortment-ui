import { useEffect, useId, useRef } from 'react';
import clsx from 'clsx';
import styles from './Checkbox.module.css';
import type { CheckboxProps } from './Checkbox.types';

export function Checkbox({
  checked,
  onChange,
  label,
  indeterminate = false,
  disabled = false,
  required,
  error,
  id,
  labelSide = 'right',
  className,
}: CheckboxProps) {
  const reactId = useId();
  const inputId = id ?? `checkbox-${reactId}`;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

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
          ref={inputRef}
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-checked={indeterminate ? 'mixed' : checked}
          className={styles.input}
        />

        <span
          className={clsx(
            styles.box,
            checked && !indeterminate && styles.boxChecked,
            indeterminate && styles.boxIndeterminate,
            error && styles.boxError,
          )}
          aria-hidden
        >
          {indeterminate ? (
            <span className={styles.dashIcon} />
          ) : checked ? (
            <svg viewBox="0 0 12 12" className={styles.checkIcon} fill="none" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1.5,6 4.5,9 10.5,3" />
            </svg>
          ) : null}
        </span>

        {label && (
          <span className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-hidden>*</span>}
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

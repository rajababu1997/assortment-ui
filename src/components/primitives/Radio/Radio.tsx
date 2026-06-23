import { useId } from 'react';
import clsx from 'clsx';
import { Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import field from '../_shared/field.module.css';
import styles from './Radio.module.css';
import type { RadioOption, RadioProps } from './Radio.types';

export function Radio<V extends string = string>({
  name,
  value,
  onChange,
  options,
  label,
  error,
  disabled = false,
  required,
  orientation = 'vertical',
  infoText,
  className,
}: RadioProps<V>) {
  const reactId = useId();

  return (
    <fieldset className={clsx(styles.root, className)} style={{ border: 'none', padding: 0, margin: 0 }}>
      {label && (
        <legend className={styles.groupLabel}>
          {label}
          {required && <span className={styles.required} aria-hidden>*</span>}
          {infoText && (
            <Tooltip portal content={infoText} placement="top">
              <span className={field.infoIcon}><Info aria-hidden /></span>
            </Tooltip>
          )}
        </legend>
      )}

      <div className={clsx(styles.options, orientation === 'horizontal' && styles.optionsHorizontal)}>
        {options.map((opt: RadioOption<V>, i) => {
          const optId = `${reactId}-${name}-${i}`;
          const isChecked = opt.value === value;
          const isDisabled = disabled || opt.disabled;

          return (
            <label
              key={String(opt.value)}
              htmlFor={optId}
              className={clsx(styles.option, isDisabled && styles.optionDisabled)}
            >
              <input
                type="radio"
                id={optId}
                name={name}
                value={String(opt.value)}
                checked={isChecked}
                onChange={() => onChange(opt.value)}
                disabled={isDisabled}
                aria-invalid={!!error}
                className={styles.input}
              />

              <span
                className={clsx(
                  styles.circle,
                  isChecked && styles.circleChecked,
                  error && styles.circleError,
                )}
                aria-hidden
              >
                {isChecked && <span className={styles.dot} />}
              </span>

              <span className={styles.label}>{opt.label}</span>
            </label>
          );
        })}
      </div>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}
    </fieldset>
  );
}

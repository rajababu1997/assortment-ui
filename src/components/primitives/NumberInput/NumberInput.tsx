import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronDown, Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import field from '../_shared/field.module.css';
import styles from './NumberInput.module.css';
import type { NumberInputProps } from './NumberInput.types';

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = '0',
      error,
      hasError = false,
      disabled = false,
      required,
      min,
      max,
      step = 1,
      precision = 0,
      prefix,
      suffix,
      showButtons = true,
      infoText,
      id,
      className,
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `numInput-${reactId}`;
    const errorId = `${inputId}-error`;

    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);

    const clamp = (v: number) => {
      let next = v;
      if (min !== undefined) next = Math.max(min, next);
      if (max !== undefined) next = Math.min(max, next);
      return parseFloat(next.toFixed(precision));
    };

    const handleChange = (raw: string) => {
      if (raw === '' || raw === '-') { onChange(null); return; }
      const parsed = parseFloat(raw);
      if (isNaN(parsed)) return;
      onChange(clamp(parsed));
    };

    const step_ = (dir: 1 | -1) => {
      const current = value ?? 0;
      onChange(clamp(current + dir * step));
      innerRef.current?.focus();
    };

    const atMin = min !== undefined && (value ?? -Infinity) <= min;
    const atMax = max !== undefined && (value ?? Infinity) >= max;

    const displayValue = value === null || value === undefined ? '' : String(value);

    return (
      <div className={clsx(field.root, className)}>
        {label && (
          <label htmlFor={inputId} className={field.label}>
            {label}
            {required && <span className={field.required} aria-hidden>*</span>}
            {infoText && (
              <Tooltip portal content={infoText} placement="top">
                <span className={field.infoIcon}><Info aria-hidden /></span>
              </Tooltip>
            )}
          </label>
        )}

        <div
          className={clsx(
            field.container,
            (error || hasError) && field.containerError,
            disabled && field.containerDisabled,
          )}
        >
          {prefix && <span className={styles.affix}>{prefix}</span>}

          <input
            ref={innerRef}
            id={inputId}
            type="number"
            value={displayValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            min={min}
            max={max}
            step={step}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={styles.inputEl}
          />

          {suffix && <span className={styles.affix}>{suffix}</span>}

          {showButtons && (
            <>
              <span className={styles.divider} aria-hidden />
              <span className={styles.steppers}>
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled || atMax}
                  onClick={() => step_(1)}
                  aria-label="Increment"
                  className={styles.stepBtn}
                >
                  <ChevronUp className={styles.stepIcon} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled || atMin}
                  onClick={() => step_(-1)}
                  aria-label="Decrement"
                  className={styles.stepBtn}
                >
                  <ChevronDown className={styles.stepIcon} strokeWidth={2} />
                </button>
              </span>
            </>
          )}
        </div>

        {error && (
          <div id={errorId} className={field.errorMessage} role="alert">
            {error}
          </div>
        )}
      </div>
    );
  },
);

NumberInput.displayName = 'NumberInput';

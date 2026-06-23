import { forwardRef, useId, useRef, useImperativeHandle, useState } from 'react';
import clsx from 'clsx';
import { X, Eye, EyeOff, Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import field from '../_shared/field.module.css';
import styles from './Input.module.css';
import type { InputProps } from './Input.types';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = 'Text here',
      error,
      disabled = false,
      required,
      type = 'text',
      clearable = true,
      infoText,
      id,
      className,
      onFocus,
      onBlur,
      ...rest
    },
    ref,
  ) => {
    const reactId = useId();
    const inputId = id ?? `input-${reactId}`;
    const errorId = `${inputId}-error`;

    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, []);

    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);
    const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const showClear = clearable && !isPassword && !!value && !disabled;

    const handleClear = () => {
      onChange('');
      innerRef.current?.focus();
    };

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
            error && field.containerError,
            disabled && field.containerDisabled,
          )}
        >
          <input
            ref={innerRef}
            id={inputId}
            type={resolvedType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            onFocus={onFocus}
            onBlur={onBlur}
            className={styles.input}
            {...rest}
          />

          {isPassword && !disabled && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={styles.clearButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword
                ? <EyeOff className={styles.clearIcon} strokeWidth={1.6} aria-hidden />
                : <Eye className={styles.clearIcon} strokeWidth={1.6} aria-hidden />
              }
            </button>
          )}

          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              className={styles.clearButton}
              aria-label="Clear input"
              tabIndex={-1}
            >
              <X className={styles.clearIcon} strokeWidth={1.6} aria-hidden />
            </button>
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

Input.displayName = 'Input';

import { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import clsx from 'clsx';
import { Info } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import field from '../_shared/field.module.css';
import styles from './Textarea.module.css';
import type { TextareaProps } from './Textarea.types';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      value,
      onChange,
      placeholder = 'Text here',
      error,
      disabled = false,
      required,
      rows = 4,
      autosize = false,
      maxRows = 10,
      maxLength,
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
    const taId = id ?? `textarea-${reactId}`;
    const errorId = `${taId}-error`;

    const innerRef = useRef<HTMLTextAreaElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement, []);

    useEffect(() => {
      if (!autosize) return;
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      const maxHeight = lineHeight * maxRows;
      const next = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${next}px`;
    }, [value, autosize, maxRows]);

    const showCounter = typeof maxLength === 'number';
    const len = value.length;

    return (
      <div className={clsx(field.root, className)}>
        {label && (
          <label htmlFor={taId} className={field.label}>
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
            styles.container,
            error && styles.containerError,
            disabled && styles.containerDisabled,
          )}
        >
          <textarea
            ref={innerRef}
            id={taId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={autosize ? 1 : rows}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            onFocus={onFocus}
            onBlur={onBlur}
            className={clsx(styles.textarea, autosize && styles.textareaAutosize)}
            {...rest}
          />
        </div>

        {(showCounter || error) && (
          <div className={clsx(styles.footer, error && styles.footerError)}>
            {error && (
              <div id={errorId} className={field.errorMessage} role="alert">
                {error}
              </div>
            )}
            {showCounter && (
              <span className={styles.counter}>
                {len} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

import { forwardRef } from 'react';
import clsx from 'clsx';
import field from '../_shared/field.module.css';
import styles from './Button.module.css';
import type { ButtonProps } from './Button.types';

const variantClass = {
  primary: styles.variantPrimary,
  secondary: styles.variantSecondary,
  ghost: styles.variantGhost,
  danger: styles.variantDanger,
  success: styles.variantSuccess,
} as const;

const sizeClass = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
} as const;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      iconOnly = false,
      type = 'button',
      label,
      className,
      children,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const btn = (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={clsx(
          styles.button,
          variantClass[variant],
          sizeClass[size],
          fullWidth && styles.fullWidth,
          iconOnly && styles.iconOnly,
          loading && styles.loading,
          className
        )}
        {...rest}
      >
        {leftIcon && !loading && !iconOnly && (
          <span className={styles.icon} aria-hidden>
            {leftIcon}
          </span>
        )}
        <span className={styles.label}>{children}</span>
        {rightIcon && !loading && !iconOnly && (
          <span className={styles.icon} aria-hidden>
            {rightIcon}
          </span>
        )}
        {loading && <span className={styles.spinner} aria-hidden />}
      </button>
    );

    if (label !== undefined) {
      return (
        <div className={field.root}>
          <span className={field.label}>{label}</span>
          {btn}
        </div>
      );
    }

    return btn;
  }
);

Button.displayName = 'Button';

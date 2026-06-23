import clsx from 'clsx';
import styles from './Badge.module.css';
import type { BadgeProps } from './Badge.types';

const severityClass = {
  primary: styles.severityPrimary,
  danger: styles.severityDanger,
  success: styles.severitySuccess,
  warning: styles.severityWarning,
  info: styles.severityInfo,
  default: styles.severityDefault,
};

export function Badge({
  value,
  dot = false,
  severity = 'danger',
  max = 99,
  children,
  visible = true,
  className,
}: BadgeProps) {
  if (!visible) return <>{children}</>;

  const displayValue = () => {
    if (dot) return null;
    if (value === undefined || value === null) return null;
    if (typeof value === 'number' && value > max) return `${max}+`;
    return value;
  };

  const badgeEl = (
    <span
      className={clsx(
        styles.badge,
        severityClass[severity],
        dot && styles.dot,
        children && styles.anchored,
        children && dot && styles.dotAnchored,
        className,
      )}
      aria-label={typeof value === 'number' ? `${value} notifications` : undefined}
    >
      {displayValue()}
    </span>
  );

  if (children) {
    return (
      <span className={styles.anchor}>
        {children}
        {badgeEl}
      </span>
    );
  }

  return badgeEl;
}

import clsx from 'clsx';
import styles from './ProgressBar.module.css';
import type { ProgressBarProps } from './ProgressBar.types';

const severityClass = {
  primary: styles.severityPrimary,
  success: styles.severitySuccess,
  warning: styles.severityWarning,
  danger:  styles.severityDanger,
  info:    styles.severityInfo,
};

export function ProgressBar({
  value,
  height = 8,
  severity = 'primary',
  showLabel = false,
  striped = false,
  label = 'Progress',
  className,
}: ProgressBarProps) {
  const isIndeterminate = value === undefined || value === null;
  const clamped = isIndeterminate ? 0 : Math.min(100, Math.max(0, value));

  return (
    <div className={clsx(styles.root, className)}>
      {showLabel && !isIndeterminate && (
        <div className={styles.labelRow}>{clamped}%</div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={isIndeterminate ? undefined : clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className={styles.track}
        style={{ height }}
      >
        <div
          className={clsx(
            styles.fill,
            severityClass[severity],
            striped && styles.striped,
            isIndeterminate && styles.indeterminate,
          )}
          style={{ width: isIndeterminate ? '40%' : `${clamped}%` }}
        />
      </div>
    </div>
  );
}

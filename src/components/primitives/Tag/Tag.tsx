import clsx from 'clsx';
import styles from './Tag.module.css';
import type { TagProps } from './Tag.types';

const severityClass = {
  default: styles.severityDefault,
  primary: styles.severityPrimary,
  secondary: styles.severitySecondary,
  success: styles.severitySuccess,
  warning: styles.severityWarning,
  danger: styles.severityDanger,
  info: styles.severityInfo,
};

export function Tag({ label, severity = 'default', dot = false, icon, className }: TagProps) {
  return (
    <span className={clsx(styles.tag, severityClass[severity], className)}>
      {dot && <span className={styles.dot} aria-hidden />}
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      {label}
    </span>
  );
}

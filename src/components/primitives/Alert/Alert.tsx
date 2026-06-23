import clsx from 'clsx';
import { Info, CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';
import styles from './Alert.module.css';
import type { AlertProps } from './Alert.types';

const DEFAULT_ICONS = {
  info: <Info strokeWidth={1.8} />,
  success: <CheckCircle strokeWidth={1.8} />,
  warning: <AlertTriangle strokeWidth={1.8} />,
  danger: <XCircle strokeWidth={1.8} />,
};

const severityClass = {
  info: styles.severityInfo,
  success: styles.severitySuccess,
  warning: styles.severityWarning,
  danger: styles.severityDanger,
};

export function Alert({
  severity = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  icon,
  className,
}: AlertProps) {
  return (
    <div role="alert" className={clsx(styles.alert, severityClass[severity], className)}>
      <span className={styles.iconWrap} aria-hidden>
        {icon ?? DEFAULT_ICONS[severity]}
      </span>

      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {children && <p className={styles.message}>{children}</p>}
      </div>

      {dismissible && (
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <X />
        </button>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';

export type AlertSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface AlertProps {
  severity?: AlertSeverity;
  title?: ReactNode;
  children?: ReactNode;
  /** Show a dismiss (×) button. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Custom icon — overrides the default severity icon. */
  icon?: ReactNode;
  className?: string;
}

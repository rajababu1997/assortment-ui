import type { ReactNode } from 'react';

export type TagSeverity = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';

export interface TagProps {
  label: ReactNode;
  severity?: TagSeverity;
  /** Show a colored dot before the label. */
  dot?: boolean;
  /** Icon before the label (e.g. a Lucide element). */
  icon?: ReactNode;
  className?: string;
}

import type { ReactNode } from 'react';

export interface TabItem {
  key: string;
  label: ReactNode;
  /** Optional icon rendered before the label. */
  icon?: ReactNode;
  /** Count or short label shown as a chip after the tab label. */
  badge?: number | string;
  /** When true, the tab is shown but not selectable. */
  disabled?: boolean;
  /** Content panel rendered when this tab is active. */
  content: ReactNode;
}

export type TabsVariant = 'line' | 'pill';

export interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  variant?: TabsVariant;
  className?: string;
  /** Class applied to the tab content panel wrapper. */
  panelClassName?: string;
  /** Class applied to the tablist element. */
  tablistClassName?: string;
  /** Inline style for the tablist element (e.g. custom padding). */
  tablistStyle?: React.CSSProperties;
}

import type { ReactNode } from 'react';

export type MenuPlacement = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

export type MenuItemVariant = 'default' | 'danger';

export interface MenuItemConfig {
  type?: 'item';
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  variant?: MenuItemVariant;
  onClick: () => void;
}

export interface MenuDividerConfig {
  type: 'divider';
  id?: string;
}

export interface MenuHeaderConfig {
  type: 'header';
  id?: string;
  label: ReactNode;
}

export type MenuItem = MenuItemConfig | MenuDividerConfig | MenuHeaderConfig;

export interface MenuProps {
  /** The element that opens the menu when clicked. Must be focusable (button, etc.). */
  trigger: ReactNode;
  items: MenuItem[];
  placement?: MenuPlacement;
  /** Min-width of the menu panel in px. Default 180. */
  minWidth?: number;
  /** Close menu after an item is activated. Default true. */
  closeOnSelect?: boolean;
  className?: string;
  /** Label announced for screen readers. */
  ariaLabel?: string;
}

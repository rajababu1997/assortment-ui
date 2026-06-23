import type { ReactNode } from 'react';

export type DrawerSide = 'left' | 'right';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  side?: DrawerSide;
  /** Width of the drawer panel. Default: '400px' */
  width?: string | number;
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
  className?: string;
}

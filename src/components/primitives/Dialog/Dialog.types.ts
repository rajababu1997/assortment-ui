import type { ReactNode } from 'react';

export type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Optional subtitle below the title. */
  description?: ReactNode;
  /** Dialog body content. */
  children?: ReactNode;
  /** Footer content — typically action buttons. */
  footer?: ReactNode;
  size?: DialogSize;
  /** Close when clicking the backdrop. Default: true */
  closeOnBackdrop?: boolean;
  /** Show the × close button in the header. Default: true */
  showCloseButton?: boolean;
  className?: string;
  /** Extra class applied to the scrollable body wrapper (e.g. to remove padding for edge-to-edge content). */
  bodyClassName?: string;
  /** Remove padding and overflow from body — for edge-to-edge layouts (e.g. full-height wizard). */
  bodyEdge?: boolean;
}

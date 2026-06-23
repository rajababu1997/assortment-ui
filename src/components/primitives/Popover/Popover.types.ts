import type { ReactNode } from 'react';

export type PopoverPlacement =
  | 'top-start'
  | 'top-end'
  | 'top'
  | 'bottom-start'
  | 'bottom-end'
  | 'bottom'
  | 'left'
  | 'right';

export interface PopoverProps {
  /** Trigger element. Wrapped in a focusable span; the consumer provides the visible button/icon. */
  trigger: ReactNode;
  /** Popover body content. */
  children: ReactNode;

  /** Controlled open state. If omitted, component is uncontrolled. */
  open?: boolean;
  /** Fires when open state changes (controlled or uncontrolled). */
  onOpenChange?: (open: boolean) => void;
  /** Initial open state (uncontrolled only). */
  defaultOpen?: boolean;

  placement?: PopoverPlacement;
  /** Pixel gap between trigger and panel. Default 8. */
  offset?: number;
  /** Minimum width of the panel in px. Default 220. */
  minWidth?: number;
  /** Maximum width of the panel in px. Default 360. */
  maxWidth?: number;

  /** Close when clicking outside the panel. Default true. */
  closeOnOutsideClick?: boolean;
  /** Close when Escape is pressed. Default true. */
  closeOnEscape?: boolean;

  /** Accessible label for the popover panel. */
  ariaLabel?: string;

  /** Class applied to the panel (not the trigger). */
  panelClassName?: string;
  /** Class applied to the trigger wrapper. */
  className?: string;
}

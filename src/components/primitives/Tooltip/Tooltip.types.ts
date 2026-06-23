import type { CSSProperties, ReactNode } from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** The element that triggers the tooltip. */
  children: ReactNode;
  /** Tooltip text content. Pass null/undefined to disable. */
  content: ReactNode;
  placement?: TooltipPlacement;
  /** Delay before showing (ms). Default: 400 */
  delay?: number;
  /** Max width in px. Default: 240 */
  maxWidth?: number;
  /** Render via createPortal to document.body so the bubble escapes any
   *  ancestor `overflow:hidden` (e.g. inside AG Grid cells). Default: false */
  portal?: boolean;
  className?: string;
  /** Extra styles applied to the trigger wrapper span (e.g. display:block for full-width). */
  wrapStyle?: CSSProperties;
}

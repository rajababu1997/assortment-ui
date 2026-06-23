import type { ReactNode } from 'react';
import type { DialogSize } from '../Dialog';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  /** Optional leading icon rendered next to the title (e.g., <TriangleAlert />). */
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Confirm-button + icon tint. Default 'primary'. */
  variant?: ConfirmVariant;
  /** Disables the confirm button and shows a spinner. */
  loading?: boolean;
  /** Close behaviour when clicking the backdrop. Default true. */
  closeOnBackdrop?: boolean;
  size?: DialogSize;
}

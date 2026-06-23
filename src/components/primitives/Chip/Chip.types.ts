import type { ReactNode } from 'react';

export interface ChipProps {
  label: ReactNode;
  /** Icon rendered before the label. */
  icon?: ReactNode;
  /** When provided, renders a remove (×) button and calls onRemove when clicked. */
  onRemove?: () => void;
  disabled?: boolean;
  /** Makes the chip clickable as a filter/toggle. */
  onClick?: () => void;
  /** Visually selected state (used when chip acts as a toggle filter). */
  selected?: boolean;
  className?: string;
}

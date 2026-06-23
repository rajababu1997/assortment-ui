import type { ReactNode } from 'react';

export interface SelectButtonOption<T = string | number> {
  label: ReactNode;
  value: T;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface SelectButtonProps<T = string | number> {
  options: SelectButtonOption<T>[];
  value: T | T[] | null | undefined;
  onChange: (value: T | T[] | null) => void;
  /** Allow multiple selection. Default false. */
  multiple?: boolean;
  /** Allow unselecting to produce null (single mode). Default false. */
  allowUnselect?: boolean;
  /** Size. Default md. */
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to fill container width. */
  fullWidth?: boolean;
  /** Disable entire group. */
  disabled?: boolean;
  /** aria-label for the group. */
  ariaLabel?: string;
  className?: string;
}

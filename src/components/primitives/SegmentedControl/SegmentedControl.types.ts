import type { ReactNode } from 'react';

export interface SegmentedOption<T extends string | number = string> {
  value: T;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string | number = string> {
  options: SegmentedOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  /** Gradient variant: 'primary' (blue) | 'cyan' (cyan→blue) | 'solid' */
  variant?: 'primary' | 'cyan' | 'solid';
  className?: string;
  ariaLabel?: string;
}

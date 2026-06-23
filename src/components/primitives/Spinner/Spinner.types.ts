export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SpinnerProps {
  size?: SpinnerSize;
  /** Accessible label for screen readers. Default: 'Loading' */
  label?: string;
  className?: string;
}

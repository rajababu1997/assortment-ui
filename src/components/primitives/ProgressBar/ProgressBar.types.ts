export type ProgressBarSeverity = 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface ProgressBarProps {
  /** Value 0–100. Omit for indeterminate animation. */
  value?: number;
  /** Height of the bar in px. Default: 8 */
  height?: number;
  severity?: ProgressBarSeverity;
  /** Show percentage label inside/above the bar. Default: false */
  showLabel?: boolean;
  /** Animated stripe overlay on the filled portion. Default: false */
  striped?: boolean;
  /** Accessible label. Default: 'Progress' */
  label?: string;
  className?: string;
}

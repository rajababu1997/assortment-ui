import clsx from 'clsx';
import styles from './Spinner.module.css';
import type { SpinnerProps } from './Spinner.types';

const sizeClass = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

export function Spinner({ size = 'md', label = 'Loading', className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className={clsx(styles.spinner, sizeClass[size], className)} />
  );
}

/** Centered spinner filling its container — use for page/section loading states. */
export function SpinnerCenter({ size = 'lg', label }: Pick<SpinnerProps, 'size' | 'label'>) {
  return (
    <div className={styles.wrap}>
      <Spinner size={size} label={label} />
    </div>
  );
}

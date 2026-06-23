import clsx from 'clsx';
import styles from './Divider.module.css';
import type { DividerProps } from './Divider.types';

export function Divider({
  orientation = 'horizontal',
  align = 'center',
  children,
  className,
}: DividerProps) {
  if (orientation === 'vertical') {
    return <span role="separator" aria-orientation="vertical" className={clsx(styles.vertical, className)} />;
  }

  if (!children) {
    return <hr className={clsx(styles.rule, className)} />;
  }

  const alignClass =
    align === 'start' ? styles.alignStart : align === 'end' ? styles.alignEnd : undefined;

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={clsx(styles.horizontal, styles.hasLabel, alignClass, className)}
    >
      <span className={styles.label}>{children}</span>
    </div>
  );
}

import clsx from 'clsx';
import styles from './Card.module.css';
import type { CardProps } from './Card.types';

const elevationClass = {
  flat: styles.elevationFlat,
  raised: styles.elevationRaised,
  sunken: styles.elevationSunken,
};

export function Card({
  elevation = 'raised',
  header,
  footer,
  noPadding = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        styles.card,
        elevationClass[elevation],
        noPadding && styles.noPadding,
        className,
      )}
      {...rest}
    >
      {header && <div className={styles.header}>{header}</div>}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </div>
  );
}

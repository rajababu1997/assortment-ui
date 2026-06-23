import clsx from 'clsx';
import styles from './Skeleton.module.css';
import type { SkeletonProps } from './Skeleton.types';

const variantClass = {
  text: styles.variantText,
  rect: styles.variantRect,
  circle: styles.variantCircle,
};

const defaultHeight = {
  text: 14,
  rect: 120,
  circle: 40,
};

export function Skeleton({
  variant = 'text',
  width = '100%',
  height,
  lines,
  className,
}: SkeletonProps) {
  const w = typeof width === 'number' ? `${width}px` : width;
  const h = typeof height === 'number'
    ? `${height}px`
    : height ?? `${defaultHeight[variant]}px`;

  if (variant === 'text' && lines && lines > 1) {
    return (
      <div className={clsx(styles.lines, className)} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className={clsx(styles.skeleton, variantClass.text)}
            style={{ width: w, height: h }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={clsx(styles.skeleton, variantClass[variant], className)}
      style={{ width: w, height: h, display: 'block' }}
    />
  );
}

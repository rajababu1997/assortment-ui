import { Children, useState } from 'react';
import clsx from 'clsx';
import { User } from 'lucide-react';
import styles from './Avatar.module.css';
import type { AvatarGroupProps, AvatarProps } from './Avatar.types';

const sizeClass = {
  xs: styles.sizeXs,
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const statusClass = {
  online:  styles.statusOnline,
  offline: styles.statusOffline,
  busy:    styles.statusBusy,
  away:    styles.statusAway,
};

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  return (
    <span className={clsx(styles.wrap, sizeClass[size], className)}>
      <span
        className={clsx(
          styles.avatar,
          sizeClass[size],
          shape === 'circle' ? styles.shapeCircle : styles.shapeSquare,
        )}
        title={name}
        aria-label={alt ?? name}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt ?? name ?? ''}
            className={styles.img}
            onError={() => setImgError(true)}
          />
        ) : initials ? (
          initials
        ) : (
          <User className={styles.fallbackIcon} strokeWidth={1.5} aria-hidden />
        )}
      </span>

      {status && (
        <span
          className={clsx(styles.status, statusClass[status])}
          aria-label={status}
          title={status}
        />
      )}
    </span>
  );
}

export function AvatarGroup({ max = 4, size = 'md', className, children }: AvatarGroupProps) {
  const all = Children.toArray(children);
  const visible = all.slice(0, max);
  const overflow = all.length - max;

  return (
    <span className={clsx(styles.group, className)}>
      {visible}
      {overflow > 0 && (
        <span
          className={clsx(styles.wrap, sizeClass[size])}
          title={`+${overflow} more`}
        >
          <span
            className={clsx(
              styles.avatar,
              styles.overflowBadge,
              sizeClass[size],
              styles.shapeCircle,
            )}
          >
            +{overflow}
          </span>
        </span>
      )}
    </span>
  );
}

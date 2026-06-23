import clsx from 'clsx';
import { X } from 'lucide-react';
import styles from './Chip.module.css';
import type { ChipProps } from './Chip.types';

export function Chip({
  label,
  icon,
  onRemove,
  disabled = false,
  onClick,
  selected = false,
  className,
}: ChipProps) {
  const isClickable = !!onClick && !disabled;

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) onRemove?.();
  };

  return (
    <span
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-pressed={isClickable ? selected : undefined}
      aria-disabled={disabled || undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      className={clsx(
        styles.chip,
        isClickable && styles.clickable,
        selected && styles.selected,
        disabled && styles.disabled,
        className,
      )}
    >
      {icon && <span className={styles.icon} aria-hidden>{icon}</span>}
      <span className={styles.label}>{label}</span>
      {onRemove && !disabled && (
        <button
          type="button"
          className={styles.removeBtn}
          onClick={handleRemove}
          aria-label={`Remove ${typeof label === 'string' ? label : ''}`}
          tabIndex={-1}
        >
          <X />
        </button>
      )}
    </span>
  );
}

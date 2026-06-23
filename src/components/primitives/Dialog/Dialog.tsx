import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import styles from './Dialog.module.css';
import type { DialogProps } from './Dialog.types';

const sizeClass = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
  full: styles.sizeFull,
};

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  className,
  bodyClassName,
  bodyEdge = false,
}: DialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  /* Lock body scroll while open */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  /* ESC key */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  /* Focus first focusable element on open */
  useEffect(() => {
    if (!open || !cardRef.current) return;
    const focusable = cardRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    (focusable[0] ?? cardRef.current)?.focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={styles.overlay}
        aria-hidden
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Card */}
      <div className={styles.panel} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div
          ref={cardRef}
          className={clsx(styles.card, sizeClass[size], className)}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          {(title || showCloseButton) && (
            <div className={styles.header}>
              <div className={styles.headerText}>
                {title && <h2 className={styles.title}>{title}</h2>}
                {description && <p className={styles.description}>{description}</p>}
              </div>
              {showCloseButton && (
                <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close dialog">
                  <X strokeWidth={1.8} />
                </button>
              )}
            </div>
          )}

          {children && <div className={clsx(styles.body, bodyEdge && styles.bodyEdge, bodyClassName)}>{children}</div>}

          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </>,
    document.body,
  );
}

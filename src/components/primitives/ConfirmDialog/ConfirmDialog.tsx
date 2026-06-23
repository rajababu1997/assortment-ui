import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { Button } from '../Button';
import type { ButtonVariant } from '../Button';
import styles from './ConfirmDialog.module.css';
import type { ConfirmDialogProps, ConfirmVariant } from './ConfirmDialog.types';

const confirmButtonVariant: Record<ConfirmVariant, ButtonVariant> = {
  danger: 'danger',
  warning: 'primary',
  primary: 'primary',
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Ok',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading: loadingProp,
  closeOnBackdrop = true,
}: ConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const loading = loadingProp ?? internalLoading;
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose, loading]);

  useEffect(() => {
    if (!open || !cardRef.current) return;
    const focusable = cardRef.current.querySelectorAll<HTMLElement>(
      'button:not(:disabled)',
    );
    focusable[focusable.length - 1]?.focus();
  }, [open]);

  const handleConfirm = async () => {
    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try { await result; } finally { setInternalLoading(false); }
    }
  };

  if (!open) return null;

  return createPortal(
    <>
      <div
        className={styles.overlay}
        aria-hidden
        onClick={closeOnBackdrop && !loading ? onClose : undefined}
      />
      <div className={styles.panel} role="dialog" aria-modal="true">
        <div ref={cardRef} className={styles.card} tabIndex={-1}>
          <div className={styles.content}>
            <div className={styles.titleWrap}>
              <h2 className={styles.title}>{title}</h2>
              {description && <p className={styles.description}>{description}</p>}
            </div>
            <div className={styles.footer}>
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                disabled={loading}
                className={styles.cancelBtn}
              >
                {cancelLabel}
              </Button>
              <Button
                variant={confirmButtonVariant[variant]}
                size="md"
                onClick={handleConfirm}
                loading={loading}
                className={clsx(
                  variant === 'danger' ? styles.dangerBtn : styles.confirmBtn,
                )}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

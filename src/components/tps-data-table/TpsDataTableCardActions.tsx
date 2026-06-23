import { createPortal } from 'react-dom';
import { Button } from '@/components/primitives';
import { useConfirmDialog } from '@/components/ui/ConfirmationDialog';
import type { ActionConfig } from './types';

interface DataTableCardActionsProps<T> {
  open: boolean;
  onClose: () => void;
  row: T | null;
  actions: ActionConfig<T>[];
  onAction: (type: string, row: T) => void;
}

const severityToVariant: Record<string, 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'> = {
  danger: 'danger',
  success: 'success',
  info: 'ghost',
  warning: 'secondary',
  secondary: 'secondary',
};

export function TpsDataTableCardActions<T>({
  open,
  onClose,
  row,
  actions,
  onAction,
}: DataTableCardActionsProps<T>) {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  if (!row) return null;

  const visibleActions = actions.filter(
    (a) => a.visible == null || a.visible(row),
  );

  const handleAction = async (action: ActionConfig<T>) => {
    onClose();
    if (action.confirmMessage) {
      const ok = await confirm(action.confirmMessage, 'Confirm');
      if (ok) onAction(action.type, row!);
    } else {
      onAction(action.type, row!);
    }
  };

  return (
    <>
      <ConfirmDialog />
      {open && createPortal(
        <>
          <div
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'var(--color-overlay)',
              backdropFilter: 'blur(2px)',
              zIndex: 300,
            }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--color-surface)',
            borderTopLeftRadius: 16, borderTopRightRadius: 16,
            border: '1px solid var(--color-divider)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 301,
            padding: '16px 16px 32px',
          }}>
            <div style={{
              width: 40, height: 4, borderRadius: 2,
              background: 'var(--color-border)',
              margin: '0 auto 16px',
            }} />
            <p style={{
              fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--color-text)', marginBottom: 12,
            }}>
              Actions
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleActions.length === 0 ? (
                <p style={{ fontSize: '0.875rem', textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '16px 0' }}>
                  No actions available.
                </p>
              ) : (
                visibleActions.map((action) => {
                  const isDisabled = action.disabled?.(row) ?? false;
                  const variant = action.severity ? (severityToVariant[action.severity] ?? 'secondary') : 'secondary';
                  return (
                    <Button
                      key={action.type}
                      variant={variant}
                      fullWidth
                      disabled={isDisabled}
                      leftIcon={action.icon ? <i className={`pi ${action.icon}`} style={{ fontSize: '0.9rem' }} /> : undefined}
                      onClick={() => handleAction(action)}
                      style={{ minHeight: 44 }}
                    >
                      {action.label}
                    </Button>
                  );
                })
              )}

              <Button variant="ghost" fullWidth onClick={onClose} style={{ minHeight: 44 }}>
                Cancel
              </Button>
            </div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}

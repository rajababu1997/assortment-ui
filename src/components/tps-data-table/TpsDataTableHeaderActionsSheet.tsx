import { createPortal } from 'react-dom';
import { Button} from '@/components/primitives';
import type { ToolbarActionConfig } from './types';

interface HeaderActionsSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  actions: ToolbarActionConfig[];
}

export function TpsDataTableHeaderActionsSheet({
  open,
  onClose,
  title,
  actions,
}: HeaderActionsSheetProps) {
  if (!open) return null;

  const primaryActions = actions.filter((a) => a.primary);
  const secondaryActions = actions.filter((a) => a.secondary);
  const otherActions = actions.filter((a) => !a.primary && !a.secondary);
  const ordered = [...primaryActions, ...secondaryActions, ...otherActions];

  const handleClick = (action: ToolbarActionConfig) => {
    onClose();
    action.command();
  };

  return createPortal(
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
          {title ? `${title} actions` : 'Actions'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ordered.length === 0 ? (
            <p style={{ fontSize: '0.875rem', textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '16px 0' }}>
              No actions available.
            </p>
          ) : (
            ordered.map((action) => {
              const isPrimary = !!action.primary;
              const Icon = action.icon;
              const leftIcon = action.svgIcon
                ? <img src={`/assets/svg/${action.svgIcon}.svg`} style={{ width: '1rem', height: '1rem' }} alt="" />
                : Icon ? <Icon size={14} strokeWidth={2} /> : undefined;

              return (
                <Button
                  key={action.label}
                  variant={isPrimary ? 'primary' : 'secondary'}
                  fullWidth
                  leftIcon={leftIcon}
                  onClick={() => handleClick(action)}
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
  );
}

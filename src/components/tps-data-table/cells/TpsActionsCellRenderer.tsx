import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { Tooltip} from '@/components/primitives';
import { useConfirmDialog } from '@/components/ui/ConfirmationDialog';
import type { ICellRendererParams } from 'ag-grid-community';
import type { ActionConfig, ActionCellContext } from '../types';

const MAX_VISIBLE = 2;

interface ActionsCellParams extends ICellRendererParams {
  context: ActionCellContext;
}

// Premium severity palette — tinted bg + matching border + saturated icon
const severityPalette: Record<string, { bg: string; bgHover: string; border: string; icon: string }> = {
  danger:    { bg: 'var(--color-danger-50)',   bgHover: 'var(--color-danger-100)',   border: 'var(--color-danger-200)',   icon: 'var(--color-danger-600)'   },
  success:   { bg: 'var(--color-success-50)',  bgHover: 'var(--color-success-100)',  border: 'var(--color-success-200)',  icon: 'var(--color-success-600)'  },
  warning:   { bg: 'var(--color-warning-50)',  bgHover: 'var(--color-warning-100)',  border: 'var(--color-warning-200)',  icon: 'var(--color-warning-600)'  },
  info:      { bg: 'var(--color-info-50)',     bgHover: 'var(--color-info-100)',     border: 'var(--color-info-200)',     icon: 'var(--color-info-600)'     },
  secondary: { bg: 'var(--color-neutral-50)',  bgHover: 'var(--color-neutral-100)',  border: 'var(--color-neutral-200)',  icon: 'var(--color-neutral-600)'  },
};

const iconBtnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 8,
  cursor: 'pointer', flexShrink: 0,
  transition: 'background 150ms cubic-bezier(0.4,0,0.2,1), border-color 150ms, transform 150ms, box-shadow 150ms',
};

function makeButtonStyle(palette: { bg: string; border: string; icon: string }, disabled: boolean): React.CSSProperties {
  return {
    ...iconBtnBase,
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    color: '#8190A5',
    opacity: disabled ? 0.45 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  };
}

function TpsActionsCellRenderer(params: ActionsCellParams) {
  const overflowBtnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const row = params.data;
  const { actions, onAction } = params.context ?? { actions: [], onAction: () => {} };

  const visibleActions: ActionConfig[] = (actions ?? []).filter(
    (a) => a.visible == null || a.visible(row),
  );

  const mainActions = visibleActions.slice(0, MAX_VISIBLE);
  const overflowActions = visibleActions.slice(MAX_VISIBLE);

  const handleAction = async (action: ActionConfig) => {
    setMenuOpen(false);
    if (action.confirmMessage) {
      const ok = await confirm(action.confirmMessage, 'Confirm');
      if (ok) onAction(action.type, row);
    } else {
      onAction(action.type, row);
    }
  };

  const openOverflowMenu = () => {
    const rect = overflowBtnRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ x: rect.right, y: rect.bottom + 4 });
    setMenuOpen(true);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          overflowBtnRef.current && !overflowBtnRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '100%' }}>
      <ConfirmDialog />

      {mainActions.map((action) => {
        const isDisabled = action.disabled?.(row) ?? false;
        const severity = action.severity || 'secondary';
        const palette = severityPalette[severity] ?? severityPalette.secondary;
        return (
          <Tooltip key={action.type} content={action.label} placement="top" portal>
            <button
              style={makeButtonStyle(palette, isDisabled)}
              disabled={isDisabled}
              onClick={() => handleAction(action)}
              aria-label={action.label}
              onMouseEnter={(e) => {
                if (isDisabled) return;
                e.currentTarget.style.background = palette.bgHover;
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(15,25,37,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = palette.bg;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(0) scale(0.96)'; }}
              onMouseUp={(e) => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            >
              <action.icon size={13} color="#8190A5" strokeWidth={2.5} />
            </button>
          </Tooltip>
        );
      })}

      {overflowActions.length > 0 && (
        <>
          <button
            ref={overflowBtnRef}
            onClick={openOverflowMenu}
            title="More actions"
            aria-label="More actions"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            style={makeButtonStyle(severityPalette.secondary, false)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = severityPalette.secondary.bgHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(15,25,37,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = severityPalette.secondary.bg;
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <MoreVertical size={13} color="#8190A5" strokeWidth={2.5} />
          </button>

          {menuOpen && createPortal(
            <div
              ref={menuRef}
              role="menu"
              className="tps-action-menu"
              style={{
                position: 'fixed',
                left: menuPos.x,
                top: menuPos.y,
                transform: 'translateX(-100%)',
                minWidth: 220,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-divider)',
                borderRadius: 12,
                boxShadow: '0 12px 32px -8px rgba(15,25,37,0.18), 0 4px 12px -2px rgba(15,25,37,0.08)',
                zIndex: 9999,
                padding: 6,
                overflow: 'hidden',
                backdropFilter: 'blur(8px)',
                animation: 'tpsActionMenuIn 160ms cubic-bezier(0.16,1,0.3,1)',
              }}
            >
              {overflowActions.map((action) => {
                const isDisabled = action.disabled?.(row) ?? false;
                return (
                  <button
                    key={action.type}
                    role="menuitem"
                    disabled={isDisabled}
                    onClick={() => handleAction(action)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      width: '100%', padding: '8px 10px',
                      background: 'transparent', border: 'none', borderRadius: 8,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '0.8125rem', fontWeight: 500,
                      color: '#29313C',
                      opacity: isDisabled ? 0.5 : 1,
                      transition: 'background 140ms cubic-bezier(0.4,0,0.2,1)',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (isDisabled) return;
                      e.currentTarget.style.background = 'var(--color-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (isDisabled) return;
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                      }}
                    >
                      <action.icon size={13} color="#8190A5" strokeWidth={2.5} />
                    </span>
                    <span style={{ flex: 1 }}>{action.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
        </>
      )}
    </div>
  );
}

export default TpsActionsCellRenderer;

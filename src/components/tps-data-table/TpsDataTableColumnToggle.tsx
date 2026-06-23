import { useEffect, useRef, useState } from 'react';
import { LayoutGrid } from 'lucide-react';
import { Checkbox, Tooltip } from '@/components/primitives';
import type { ColumnConfig } from './types';

interface DataTableColumnToggleProps<T> {
  columns: ColumnConfig<T>[];
  hiddenFields: Set<string>;
  onToggle: (_field: string) => void;
  onShowAll: () => void;
}

export function TpsDataTableColumnToggle<T>({
  columns,
  hiddenFields,
  onToggle,
  onShowAll,
}: DataTableColumnToggleProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const toggleableColumns = columns.filter((c) => c.field !== 'actions' && c.header !== 'Actions');
  const hiddenCount = toggleableColumns.filter((c) => hiddenFields.has(String(c.field))).length;
  const visibleCount = toggleableColumns.length - hiddenCount;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <Tooltip content="Toggle columns" placement="bottom">
        <button
          aria-label="Toggle column visibility"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            width: 38,
            height: 36,
            padding: '0 10px',
            borderRadius: 8,
            border: '1px solid #D2DBE6',
            background: open ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent',
            color: open ? 'var(--color-primary)' : '#596A81',
            cursor: 'pointer',
            position: 'relative',
            opacity: 1,
            transition: 'background 150ms, border-color 150ms, color 150ms, transform 150ms, box-shadow 150ms',
          }}
          onMouseEnter={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'var(--color-hover)';
              e.currentTarget.style.color = 'var(--color-primary)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--color-text-secondary)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }
          }}
        >
          <LayoutGrid size={15} />
          {hiddenCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                minWidth: 14,
                height: 14,
                borderRadius: 9999,
                background: 'var(--color-warning)',
                color: 'white',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
                padding: '0 2px',
              }}
            >
              {hiddenCount}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            width: 220,
            zIndex: 200,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-divider)',
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text)',
              }}
            >
              Columns
            </span>
            {hiddenCount > 0 && (
              <button
                onClick={onShowAll}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-primary)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontWeight: 'var(--font-weight-medium)',
                }}
              >
                Show all
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {toggleableColumns.map((col) => {
              const field = String(col.field);
              const visible = !hiddenFields.has(field);
              const isLastVisible = visible && visibleCount === 1;
              return (
                <label
                  key={field}
                  title={isLastVisible ? 'At least one column must be visible' : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 2px',
                    cursor: isLastVisible ? 'not-allowed' : 'pointer',
                    userSelect: 'none',
                    fontSize: 'var(--font-size-sm)',
                    color: isLastVisible ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                    borderRadius: 4,
                    opacity: isLastVisible ? 0.5 : 1,
                  }}
                >
                  <Checkbox
                    checked={visible}
                    disabled={isLastVisible}
                    onChange={() => !isLastVisible && onToggle(field)}
                  />
                  {col.header}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

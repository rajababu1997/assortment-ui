import { useState, useCallback, type CSSProperties } from 'react';
import { Tooltip } from '@/components/primitives';
import { useConfirmDialog } from './ConfirmationDialog';
import type { EnrichedFile } from '@/utils/fileUtils';

export interface TpsFileListProps {
  files: EnrichedFile[];
  onDelete: (file: EnrichedFile) => void;
  onView?: (file: EnrichedFile) => void;
  showViewToggle?: boolean;
  defaultView?: 'grid' | 'list';
}

const iconBtnStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: '50%',
  border: 'none', background: 'transparent',
  cursor: 'pointer', flexShrink: 0,
  transition: 'background 0.15s',
};

function IconButton({
  icon, tooltip, onClick, color,
}: { icon: string; tooltip: string; onClick: () => void; color?: string }) {
  return (
    <Tooltip content={tooltip} placement="bottom">
      <button
        type="button"
        onClick={onClick}
        style={{ ...iconBtnStyle, color: color ?? 'var(--color-text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        aria-label={tooltip}
      >
        <i className={`pi ${icon}`} style={{ fontSize: '0.85rem' }} />
      </button>
    </Tooltip>
  );
}

export function TpsFileList({
  files,
  onDelete,
  onView,
  showViewToggle = true,
  defaultView = 'grid',
}: TpsFileListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(defaultView);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const handleDelete = useCallback(async (file: EnrichedFile) => {
    const ok = await confirm(
      `Are you sure you want to delete "${file.name}"?`,
      'Confirm Delete',
    );
    if (ok) onDelete(file);
  }, [confirm, onDelete]);

  return (
    <div className="flex flex-col gap-2">
      <ConfirmDialog />

      {showViewToggle && files.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--color-text-secondary)]">
            {files.length} file{files.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1">
            <IconButton
              icon="th-large"
              tooltip="Grid view"
              onClick={() => setViewMode('grid')}
              color={viewMode === 'grid' ? 'var(--color-info)' : undefined}
            />
            <IconButton
              icon="list"
              tooltip="List view"
              onClick={() => setViewMode('list')}
              color={viewMode === 'list' ? 'var(--color-info)' : undefined}
            />
          </div>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map((file, idx) => (
            <FileCard key={file.uuid ?? `${file.name}-${idx}`} file={file} onDelete={handleDelete} onView={onView} />
          ))}
        </div>
      )}

      {viewMode === 'list' && (
        <div style={{ overflow: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem',
            background: 'var(--color-surface)',
          }}>
            <thead>
              <tr style={{ background: 'var(--color-surface-alt)', borderBottom: '1px solid var(--color-divider)' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '3rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '12rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Modified</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '6rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Size</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', width: '6rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((row, idx) => (
                <tr
                  key={row.uuid ?? `${row.name}-${idx}`}
                  style={{
                    borderBottom: '1px solid var(--color-divider)',
                    background: idx % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-alt)',
                  }}
                >
                  <td style={{ padding: '8px 12px' }}>
                    <i className={`pi ${row.icon}`} style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }} />
                  </td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text)' }}>{row.name}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{row.modifiedOn ?? ''}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>{row.size}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="flex gap-1">
                      {row.category === 'image' && row.src && (
                        <IconButton icon="eye" tooltip="View" onClick={() => onView?.(row)} color="var(--color-info)" />
                      )}
                      <IconButton icon="trash" tooltip="Delete" onClick={() => handleDelete(row)} color="var(--color-danger)" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FileCard({ file, onDelete, onView }: {
  file: EnrichedFile;
  onDelete: (f: EnrichedFile) => void;
  onView?: (f: EnrichedFile) => void;
}) {
  return (
    <div className="flex flex-col rounded-lg border overflow-hidden transition-shadow"
      style={{
        borderColor: 'var(--color-divider)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        className="flex items-center justify-center h-32 overflow-hidden"
        style={{ background: 'var(--color-surface-alt)' }}
      >
        {file.category === 'image' && file.src ? (
          <img
            src={file.src}
            alt={file.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <i className={`pi ${file.icon}`} style={{ fontSize: '2.5rem', color: 'var(--color-text-secondary)' }} />
        )}
      </div>

      <div className="p-2 flex flex-col gap-1">
        <span
          className="text-xs font-medium truncate"
          style={{ color: 'var(--color-text)' }}
          title={file.name}
        >
          {file.name}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{file.size}</span>
      </div>

      <div className="flex items-center justify-end gap-1 px-2 pb-2">
        {file.category === 'image' && file.src && onView && (
          <IconButton icon="eye" tooltip="View" onClick={() => onView(file)} color="var(--color-info)" />
        )}
        <IconButton icon="trash" tooltip="Delete" onClick={() => onDelete(file)} color="var(--color-danger)" />
      </div>
    </div>
  );
}

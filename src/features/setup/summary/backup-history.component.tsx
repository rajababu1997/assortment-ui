/**
 * Backup history list — shows the last 5 backup snapshots with Restore action.
 */

import { useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import { Button, Card, ConfirmDialog } from '@/components/primitives';
import { useBackupHistory, useRestoreBackup } from '../useSetup';

export function BackupHistoryCard() {
  const { data: backups = [], isLoading } = useBackupHistory();
  const restoreMutation = useRestoreBackup();
  const [target, setTarget] = useState<string | null>(null);

  return (
    <Card>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[var(--color-primary)]">
            <History size={16} strokeWidth={2} />
          </span>
          <h3 className="text-base font-semibold">Backup History</h3>
        </div>

        {isLoading ? (
          <div className="text-sm text-[var(--color-text-tertiary)]">Loading…</div>
        ) : backups.length === 0 ? (
          <div className="text-sm text-[var(--color-text-tertiary)]">
            No backups yet. Click <span className="font-medium">Backup Now</span> to create one.
          </div>
        ) : (
          <ul className="flex flex-col">
            {backups.map((b) => (
              <li
                key={b.backup_id}
                className="flex items-center justify-between gap-3 py-2 border-b border-[var(--color-divider)] last:border-b-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{fmtDate(b.timestamp)}</span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">{b.backup_id}</span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<RotateCcw size={12} strokeWidth={2} />}
                  onClick={() => setTarget(b.backup_id)}
                >
                  Restore
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() => {
          if (target) restoreMutation.mutate(target);
          setTarget(null);
        }}
        title="Restore this backup?"
        description="This will overwrite the current configuration with the snapshot. The current state will NOT be auto-backed-up first."
        confirmLabel="Restore"
        variant="warning"
      />
    </Card>
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

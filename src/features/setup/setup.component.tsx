/**
 * Setup entry — single full-height card containing the OTB configuration form.
 *
 * Layout follows the isetinal_ui convention:
 *   - Outer page is `h-full w-full flex-col`
 *   - One main card uses `flex-1 min-h-0` to fill the viewport
 *   - PageHeader lives inside the card (icon pill + title + actions + divider)
 *   - Only the card's content area scrolls — never the whole window
 *
 * On first run the form starts from defaults; once saved, the same form
 * re-renders pre-populated for in-place editing. There is no separate
 * summary view.
 */

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, Save as SaveIcon, Sliders, Upload } from 'lucide-react';
import { Button, ConfirmDialog } from '@/components/primitives';
import { queryKeys } from '@/constants/queryKeys';
import { subscribe as subscribeStorage } from '@/lib/localStorageDb';
import {
  useAllConfigs,
  useClearAllData,
  useCreateBackup,
  useExportConfig,
  useSetupProgress,
} from './useSetup';
import { SetupForm } from './form/setup-form.component';
import { StorageStatusCard } from './summary/storage-status.component';
import { BackupHistoryCard } from './summary/backup-history.component';
import { ImportConfigDialog } from './summary/import-dialog.component';

const HOURLY_MS = 60 * 60 * 1000;
const OTB_KEY_PREFIX = 'otb_';

export default function SetupPage() {
  const queryClient = useQueryClient();
  const { data: progress, isLoading: progressLoading } = useSetupProgress();
  const { data: configs, isLoading: configsLoading } = useAllConfigs();
  const backupMutation = useCreateBackup();
  const exportMutation = useExportConfig();
  const clearMutation = useClearAllData();

  const [confirmClear, setConfirmClear] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    if (progress?.status !== 'completed') return;
    const id = window.setInterval(() => backupMutation.mutate(), HOURLY_MS);
    return () => window.clearInterval(id);
  }, [progress?.status, backupMutation]);

  useEffect(() => {
    return subscribeStorage((key) => {
      if (!key.startsWith(OTB_KEY_PREFIX)) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.all });
    });
  }, [queryClient]);

  const loading = progressLoading || configsLoading;
  const company = configs?.company ?? null;
  const timeConfig = configs?.timeConfig ?? null;
  const releaseConfig = configs?.releaseConfig ?? null;
  const isEdit = !!company;

  return (
    <div className="flex h-full w-full flex-col p-2 md:p-3">
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-sm"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-divider)',
        }}
      >
        {/* ── Header (inside the card) ───────────────────────────────────── */}
        <div
          className="flex flex-wrap items-start justify-between gap-3 border-b px-3 py-2.5 md:px-4"
          style={{ borderColor: 'var(--color-divider)' }}
        >
          <div className="flex items-start gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #6e8df0))',
                color: 'var(--color-primary-contrast)',
              }}
            >
              <Sliders size={16} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h1
                className="text-base font-semibold leading-tight"
                style={{ color: 'var(--color-text-primary)' }}
              >
                OTB Setup
              </h1>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {isEdit
                  ? `Last updated ${fmtDate(progress?.updated_at)} — edit any field and save.`
                  : 'Configure the company, time period, and release window. Everything saves in one shot.'}
              </p>
            </div>
          </div>
          {isEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<SaveIcon size={12} strokeWidth={2} />}
                loading={backupMutation.isPending}
                onClick={() => backupMutation.mutate()}
              >
                Backup
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Download size={12} strokeWidth={2} />}
                loading={exportMutation.isPending}
                onClick={() => exportMutation.mutate()}
              >
                Export
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Upload size={12} strokeWidth={2} />}
                onClick={() => setImportOpen(true)}
              >
                Import
              </Button>
            </div>
          )}
        </div>

        {/* ── Body — form fills the remaining height, scrolls internally ── */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Loading configuration…
          </div>
        ) : (
          <SetupForm
            company={company}
            timeConfig={timeConfig}
            releaseConfig={releaseConfig}
            adminToolingSlot={
              isEdit ? (
                <div className="flex flex-col gap-4 border-t pt-5" style={{ borderColor: 'var(--color-divider)' }}>
                  <StorageStatusCard />
                  <BackupHistoryCard />
                  <div className="pt-1">
                    <Button variant="danger" size="sm" onClick={() => setConfirmClear(true)}>
                      Clear all data
                    </Button>
                  </div>
                </div>
              ) : null
            }
          />
        )}
      </div>

      <ImportConfigDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <ConfirmDialog
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          clearMutation.mutate();
          setConfirmClear(false);
        }}
        title="Clear all configuration?"
        description="This wipes the company, all configs, progress, and backups. There is no undo."
        confirmLabel="Clear all"
        variant="danger"
      />
    </div>
  );
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

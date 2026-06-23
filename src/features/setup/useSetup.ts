/**
 * OTB Setup feature hooks — queries + mutations over LocalStorage.
 *
 * Pattern mirrors `isetinal_ui/admin/persons/usePersons.ts`:
 *   - Each domain entity has its own `useQuery` reading from configStorage
 *   - Mutations call configStorage, then invalidate the relevant query keys
 *   - All toasts + logging happen here (UI code stays thin)
 *
 * Cross-tab sync: see `src/features/setup/setup.component.tsx` — it installs a
 * single `subscribe()` on mount that invalidates affected queries.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/constants/queryKeys';
import { toast } from '@/lib/toast';
import { logger } from '@/lib/logger';
import {
  ValidationError,
  clearAllData,
  createBackup,
  downloadExport,
  exportConfig,
  getStorageStatus,
  importConfig,
  listBackups,
  loadAllConfigs,
  loadCompany,
  loadSetupProgress,
  restoreBackup,
  submitWizard,
} from '@/services/configStorage';
import type {
  BackupSnapshot,
  Company,
  ExportBundle,
  ReleaseConfig,
  SetupProgress,
  TimeConfig,
  WizardFormValues,
} from './types';

// ── Queries ──────────────────────────────────────────────────────────────────

export function useCompany() {
  return useQuery({
    queryKey: queryKeys.setup.company(),
    queryFn: async () => loadCompany(),
  });
}

export function useSetupProgress() {
  return useQuery({
    queryKey: queryKeys.setup.progress(),
    queryFn: async () => loadSetupProgress(),
  });
}

export function useAllConfigs() {
  return useQuery({
    queryKey: queryKeys.setup.all,
    queryFn: async () => loadAllConfigs(),
  });
}

export function useBackupHistory() {
  return useQuery({
    queryKey: queryKeys.setup.backups(),
    queryFn: async () => listBackups(),
  });
}

export function useStorageStatus() {
  return useQuery({
    queryKey: queryKeys.setup.storage(),
    queryFn: async () => getStorageStatus(),
  });
}

// ── Mutation: atomic wizard Submit ───────────────────────────────────────────

export function useSubmitWizard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: WizardFormValues) => {
      submitWizard(values);
      return loadAllConfigs();
    },
    onSuccess: () => {
      toast.success('Configuration saved');
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.all });
    },
    onError: (error) => {
      if (error instanceof ValidationError) {
        error.errors.forEach((e) => toast.error(`Step ${e.step}: ${e.message}`));
      } else {
        logger.error('Submit wizard failed', { error });
        toast.error('Failed to save configuration');
      }
    },
  });
}

// ── Mutations: backup + export/import ────────────────────────────────────────

export function useCreateBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => createBackup(),
    onSuccess: () => {
      toast.success('Backup created');
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.backups() });
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.storage() });
    },
    onError: (error) => {
      logger.error('Backup failed', { error });
      toast.error('Failed to create backup');
    },
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (backupId: string) => restoreBackup(backupId),
    onSuccess: () => {
      toast.success('Backup restored');
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.all });
    },
    onError: (error) => {
      logger.error('Restore failed', { error });
      toast.error('Failed to restore backup');
    },
  });
}

export function useExportConfig() {
  return useMutation({
    mutationFn: async () => {
      downloadExport();
      return exportConfig();
    },
    onSuccess: () => toast.success('Configuration exported'),
    onError: (error) => {
      logger.error('Export failed', { error });
      toast.error('Failed to export configuration');
    },
  });
}

export function useImportConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bundle: unknown) => importConfig(bundle),
    onSuccess: () => {
      toast.success('Configuration imported');
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.all });
    },
    onError: (error) => {
      logger.error('Import failed', { error });
      const message = error instanceof Error ? error.message : 'Failed to import configuration';
      toast.error(message);
    },
  });
}

export function useClearAllData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => clearAllData(),
    onSuccess: () => {
      toast.success('All data cleared');
      queryClient.invalidateQueries({ queryKey: queryKeys.setup.all });
    },
    onError: (error) => {
      logger.error('Clear data failed', { error });
      toast.error('Failed to clear data');
    },
  });
}

// ── Re-exports for component consumers ───────────────────────────────────────

export type { BackupSnapshot, Company, ExportBundle, ReleaseConfig, SetupProgress, TimeConfig };

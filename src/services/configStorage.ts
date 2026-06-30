/**
 * Domain service for the OTB Setup feature.
 *
 * Wraps `localStorageDb` with OTB-specific keys, atomic Submit, cross-step
 * validation, export/import, and backup management.
 *
 * Single-tenant assumption: company id is derived from `environment.tenantUid`,
 * so callers never pass it; this module reads it from `getCompanyId()`.
 */

import { environment } from '@/config/environment';
import {
  SETUP_KEY_CONFIG,
  SETUP_KEY_BACKUP_HISTORY,
  SETUP_BACKUP_HISTORY_LIMIT,
  SETUP_SCHEMA_VERSION,
  allSetupKeys,
  getCompanyId,
  releaseConfigKey,
  setupProgressKey,
  timeConfigKey,
} from '@/constants/setupKeys';
import {
  configureLocalStorageDb,
  getItem,
  getStorageUsageBytes,
  removeItem,
  setItem,
  setMany,
  LOCAL_STORAGE_QUOTA_BYTES,
} from '@/lib/localStorageDb';
import type {
  BackupHistory,
  BackupSnapshot,
  Company,
  ExportBundle,
  OtbConfigRoot,
  ReleaseConfig,
  SetupProgress,
  TimeConfig,
  WizardFormValues,
} from '@/features/setup/types';
import { SETUP_FORM_DEFAULTS } from '@/features/setup/form/setup-form.model';

// ── One-time setup: register schema version + migrations ─────────────────────

configureLocalStorageDb({
  currentVersion: SETUP_SCHEMA_VERSION,
  migrations: {
    // Future migrations register here, e.g.:
    // '1.0.0': (data) => upgradeFrom_1_0_0_to_1_1_0(data),
  },
});

// ── Root config (companies list singleton) ───────────────────────────────────

function readRoot(): OtbConfigRoot {
  return (
    getItem<OtbConfigRoot>(SETUP_KEY_CONFIG) ?? {
      app_version: SETUP_SCHEMA_VERSION,
      companies: [],
      active_company_id: null,
      last_backup: null,
    }
  );
}

function writeRoot(root: OtbConfigRoot): void {
  setItem(SETUP_KEY_CONFIG, root);
}

export function loadCompany(): Company | null {
  const root = readRoot();
  const id = root.active_company_id ?? getCompanyId();
  return root.companies.find((c) => c.id === id) ?? null;
}

export function loadAllConfigs() {
  const companyId = getCompanyId();
  let company = loadCompany();
  let timeConfig = getItem<TimeConfig>(timeConfigKey(companyId));
  let releaseConfig = getItem<ReleaseConfig>(releaseConfigKey(companyId));
  let setupProgress = getItem<SetupProgress>(setupProgressKey(companyId));

  // Auto-bootstrap setup with the hardcoded demo defaults when nothing has
  // been persisted yet. OTB Setup is hidden from the menu in this build, so
  // a fresh tenant (cleared localStorage / new browser) would otherwise be
  // stuck on every page that gates on `!company`.
  if (!company || !timeConfig || !releaseConfig) {
    submitWizard(SETUP_FORM_DEFAULTS);
    company = loadCompany();
    timeConfig = getItem<TimeConfig>(timeConfigKey(companyId));
    releaseConfig = getItem<ReleaseConfig>(releaseConfigKey(companyId));
    setupProgress = getItem<SetupProgress>(setupProgressKey(companyId));
  }

  return { company, timeConfig, releaseConfig, setupProgress };
}

export function loadSetupProgress(): SetupProgress | null {
  return getItem<SetupProgress>(setupProgressKey(getCompanyId()));
}

// ── Wizard: atomic Submit ────────────────────────────────────────────────────

/**
 * Persist all configs + company + progress in one atomic batch.
 * Either everything lands or nothing does.
 */
export function submitWizard(values: WizardFormValues): void {
  const companyId = getCompanyId();
  const now = new Date().toISOString();

  // Validate cross-step rules before writing.
  const errors = validateAcrossSteps(values);
  if (errors.length > 0) {
    throw new ValidationError(errors);
  }

  const existingRoot = readRoot();
  const existingCompany = existingRoot.companies.find((c) => c.id === companyId);

  const company: Company = {
    id: companyId,
    name: values.name,
    base_currency: values.base_currency,
    status: 'configured',
    created_at: existingCompany?.created_at ?? now,
    updated_at: now,
  };

  const root: OtbConfigRoot = {
    app_version: SETUP_SCHEMA_VERSION,
    companies: [...existingRoot.companies.filter((c) => c.id !== companyId), company],
    active_company_id: companyId,
    last_backup: existingRoot.last_backup,
  };

  const timeConfig: TimeConfig = {
    company_id: companyId,
    planning_horizon_months: values.planning_horizon_months,
    lead_time_days: values.lead_time_days,
    planning_cycle: values.planning_cycle,
    allow_mid_planning: values.allow_mid_planning,
    updated_at: now,
  };

  const releaseConfig: ReleaseConfig = {
    company_id: companyId,
    lock_deadline_days_before: values.lock_deadline_days_before,
    release_day_of_week: values.release_day_of_week,
    updated_at: now,
  };

  const progress: SetupProgress = {
    company_id: companyId,
    status: 'completed',
    submitted_at: now,
    updated_at: now,
  };

  setMany([
    [SETUP_KEY_CONFIG, root],
    [timeConfigKey(companyId), timeConfig],
    [releaseConfigKey(companyId), releaseConfig],
    [setupProgressKey(companyId), progress],
  ]);
}

// ── Per-step saves (post-Submit edit mode) ───────────────────────────────────

export function saveCompany(patch: Partial<Pick<Company, 'name' | 'base_currency'>>): Company {
  const companyId = getCompanyId();
  const root = readRoot();
  const existing = root.companies.find((c) => c.id === companyId);
  if (!existing) throw new Error('Cannot edit company before initial Submit');
  const now = new Date().toISOString();
  const updated: Company = { ...existing, ...patch, updated_at: now };
  writeRoot({
    ...root,
    companies: [...root.companies.filter((c) => c.id !== companyId), updated],
  });
  bumpProgress();
  return updated;
}

export function saveTimeConfig(patch: Omit<TimeConfig, 'company_id' | 'updated_at'>): TimeConfig {
  const companyId = getCompanyId();
  // Cross-step check: shortening lead time must not invalidate the saved lock deadline.
  // Constraint: lock_deadline_days_before < lead_time_days (lock must happen within the runway).
  const existingRelease = getItem<ReleaseConfig>(releaseConfigKey(companyId));
  if (existingRelease && existingRelease.lock_deadline_days_before >= patch.lead_time_days) {
    throw new ValidationError([
      {
        step: 2,
        field: 'lead_time_days',
        message: `Lead time (${patch.lead_time_days}d) is no longer greater than the saved lock deadline (${existingRelease.lock_deadline_days_before}d). The lock must happen within the planning runway. Edit Step 3 to bring the deadline closer to execution, or pick a longer lead time.`,
      },
    ]);
  }
  const next: TimeConfig = {
    company_id: companyId,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  setItem(timeConfigKey(companyId), next);
  bumpProgress();
  return next;
}

export function saveReleaseConfig(patch: Omit<ReleaseConfig, 'company_id' | 'updated_at'>): ReleaseConfig {
  const companyId = getCompanyId();
  const existingTime = getItem<TimeConfig>(timeConfigKey(companyId));
  if (existingTime && patch.lock_deadline_days_before >= existingTime.lead_time_days) {
    throw new ValidationError([
      {
        step: 3,
        field: 'lock_deadline_days_before',
        message: `Lock deadline (${patch.lock_deadline_days_before}d) must be less than the lead time (${existingTime.lead_time_days}d). The lock is a milestone WITHIN the planning runway, not at the start.`,
      },
    ]);
  }
  const next: ReleaseConfig = {
    company_id: companyId,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  setItem(releaseConfigKey(companyId), next);
  bumpProgress();
  return next;
}

function bumpProgress(): void {
  const companyId = getCompanyId();
  const existing = getItem<SetupProgress>(setupProgressKey(companyId));
  const now = new Date().toISOString();
  setItem(setupProgressKey(companyId), {
    company_id: companyId,
    status: existing?.status ?? 'completed',
    submitted_at: existing?.submitted_at ?? now,
    updated_at: now,
  });
}

// ── Cross-step validation ────────────────────────────────────────────────────

export interface CrossStepError {
  step: number;
  field: string;
  message: string;
}

export class ValidationError extends Error {
  readonly errors: CrossStepError[];
  constructor(errors: CrossStepError[]) {
    super(errors.map((e) => `Step ${e.step}: ${e.message}`).join('; '));
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export function validateAcrossSteps(v: WizardFormValues): CrossStepError[] {
  const errors: CrossStepError[] = [];
  // Lead time (in months) must be < planning horizon.
  if (v.lead_time_days / 30 > v.planning_horizon_months) {
    errors.push({
      step: 2,
      field: 'lead_time_days',
      message: `Lead time (${v.lead_time_days}d) exceeds planning horizon (${v.planning_horizon_months}mo).`,
    });
  }
  // Reading-B rule: lock is a milestone within the planning runway.
  if (v.lock_deadline_days_before >= v.lead_time_days) {
    errors.push({
      step: 3,
      field: 'lock_deadline_days_before',
      message: `Lock deadline (${v.lock_deadline_days_before}d) must be less than the lead time (${v.lead_time_days}d).`,
    });
  }
  return errors;
}

// ── Export / Import ──────────────────────────────────────────────────────────

export function exportConfig(): ExportBundle {
  const company = loadCompany();
  if (!company) throw new Error('No configured company to export');
  const companyId = getCompanyId();
  return {
    schema_version: SETUP_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    company,
    time_config: getItem<TimeConfig>(timeConfigKey(companyId)),
    release_config: getItem<ReleaseConfig>(releaseConfigKey(companyId)),
    setup_progress: getItem<SetupProgress>(setupProgressKey(companyId)),
  };
}

export function downloadExport(): void {
  const bundle = exportConfig();
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  a.href = url;
  a.download = `otb_config_${bundle.company.name.replace(/\s+/g, '_')}_${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importConfig(bundle: unknown): Company {
  const parsed = parseExportBundle(bundle);
  const companyId = getCompanyId();
  const company: Company = { ...parsed.company, id: companyId, updated_at: new Date().toISOString() };
  const root = readRoot();

  const entries: Array<[string, unknown]> = [
    [
      SETUP_KEY_CONFIG,
      {
        ...root,
        companies: [...root.companies.filter((c) => c.id !== companyId), company],
        active_company_id: companyId,
      },
    ],
  ];
  if (parsed.time_config) entries.push([timeConfigKey(companyId), { ...parsed.time_config, company_id: companyId }]);
  if (parsed.release_config) entries.push([releaseConfigKey(companyId), { ...parsed.release_config, company_id: companyId }]);
  if (parsed.setup_progress) entries.push([setupProgressKey(companyId), { ...parsed.setup_progress, company_id: companyId }]);

  setMany(entries);
  return company;
}

function parseExportBundle(input: unknown): ExportBundle {
  if (typeof input !== 'object' || input === null) throw new Error('Invalid import file: not an object');
  const bundle = input as Partial<ExportBundle>;
  if (!bundle.schema_version) throw new Error('Invalid import file: missing schema_version');
  if (!bundle.company || typeof bundle.company !== 'object') throw new Error('Invalid import file: missing company');
  return bundle as ExportBundle;
}

// ── Backups ──────────────────────────────────────────────────────────────────

export function listBackups(): BackupSnapshot[] {
  return getItem<BackupHistory>(SETUP_KEY_BACKUP_HISTORY)?.backups ?? [];
}

export function createBackup(): BackupSnapshot {
  const companyId = getCompanyId();
  const now = new Date();
  const snapshot: BackupSnapshot = {
    backup_id: `backup-${now.toISOString().replace(/[:.]/g, '-')}`,
    timestamp: now.toISOString(),
    data: Object.fromEntries(
      allSetupKeys(companyId)
        .filter((k) => k !== SETUP_KEY_BACKUP_HISTORY)
        .map((key) => [key, getItem(key)]),
    ),
  };
  const existing = listBackups();
  const next: BackupHistory = {
    version: SETUP_SCHEMA_VERSION,
    backups: [snapshot, ...existing].slice(0, SETUP_BACKUP_HISTORY_LIMIT),
  };
  setItem(SETUP_KEY_BACKUP_HISTORY, next);

  // Mirror onto the root for the "last_backup" summary on the dashboard card.
  const root = readRoot();
  writeRoot({ ...root, last_backup: snapshot.timestamp });

  return snapshot;
}

export function restoreBackup(backupId: string): void {
  const snapshot = listBackups().find((b) => b.backup_id === backupId);
  if (!snapshot) throw new Error(`Backup ${backupId} not found`);
  const entries: Array<[string, unknown]> = Object.entries(snapshot.data).filter(([, v]) => v !== null);
  setMany(entries);
}

// ── Storage status (for dashboard) ───────────────────────────────────────────

export function getStorageStatus() {
  return {
    usedBytes: getStorageUsageBytes(),
    quotaBytes: LOCAL_STORAGE_QUOTA_BYTES,
    lastBackup: readRoot().last_backup,
  };
}

// ── Clear all OTB data (Danger Zone) ─────────────────────────────────────────

export function clearAllData(): void {
  for (const key of allSetupKeys(getCompanyId())) {
    removeItem(key);
  }
}

// ── Re-export for convenience ────────────────────────────────────────────────

export { getCompanyId };
export const tenantUid = environment.tenantUid;

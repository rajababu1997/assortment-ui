/**
 * LocalStorage keys for the OTB Setup feature.
 *
 * Single-tenant deployment: company id is derived from `environment.tenantUid`,
 * so per-company keys use that as the suffix.
 */

import { environment } from '@/config/environment';

export const SETUP_SCHEMA_VERSION = '1.0.0';

const PREFIX = 'otb_';

/** Master config (companies list + active company id). One key for the whole app. */
export const SETUP_KEY_CONFIG = `${PREFIX}config_v1`;

/** Backup history — single array of up to 5 snapshots, FIFO. */
export const SETUP_KEY_BACKUP_HISTORY = `${PREFIX}backup_history`;

/** Backup retention. */
export const SETUP_BACKUP_HISTORY_LIMIT = 5;

/** Per-company key builders. The company id is the tenant uid in single-tenant mode. */
export function timeConfigKey(companyId: string): string {
  return `${PREFIX}time_config_${companyId}`;
}

export function releaseConfigKey(companyId: string): string {
  return `${PREFIX}release_config_${companyId}`;
}

export function setupProgressKey(companyId: string): string {
  return `${PREFIX}setup_progress_${companyId}`;
}

/** All keys that belong to a single company (used for export, delete, backup snapshots). */
export function allCompanyKeys(companyId: string): readonly string[] {
  return [
    timeConfigKey(companyId),
    releaseConfigKey(companyId),
    setupProgressKey(companyId),
  ];
}

/** All keys that the OTB setup feature owns (used for full export and Clear All Data). */
export function allSetupKeys(companyId: string): readonly string[] {
  return [SETUP_KEY_CONFIG, SETUP_KEY_BACKUP_HISTORY, ...allCompanyKeys(companyId)];
}

/** Derive the single-tenant company id from the deployment-baked tenant uid. */
export function getCompanyId(): string {
  return environment.tenantUid;
}

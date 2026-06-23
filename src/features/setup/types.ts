/**
 * OTB Setup domain types.
 *
 * Persisted in LocalStorage; each interface maps 1:1 to a storage key
 * (see `constants/setupKeys.ts`).
 */

export type BaseCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export type PlanningCycle = 'weekly' | 'monthly' | 'quarterly';

export type CompanyStatus = 'draft' | 'configured';

export type DayOfWeek = 'any' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type SetupStatus = 'not_started' | 'completed';

// ── Master record: companies list (singleton list in single-tenant) ──────────

export interface Company {
  id: string;
  name: string;
  base_currency: BaseCurrency;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface OtbConfigRoot {
  app_version: string;
  companies: Company[];
  active_company_id: string | null;
  last_backup: string | null;
}

// ── Per-company configs ──────────────────────────────────────────────────────

export interface TimeConfig {
  company_id: string;
  planning_horizon_months: number;
  lead_time_days: number;
  planning_cycle: PlanningCycle;
  allow_mid_planning: boolean;
  updated_at: string;
}

export interface ReleaseConfig {
  company_id: string;
  /** Days before the execution month that the OTB must be locked.
   *  Must be < TimeConfig.lead_time_days — the lock is a milestone WITHIN the
   *  planning runway, not at the start. The gap (lead_time - lock_deadline) is
   *  the time the vendor has after lock to produce. */
  lock_deadline_days_before: number;
  release_day_of_week: DayOfWeek;
  updated_at: string;
}

// ── Progress / lifecycle ─────────────────────────────────────────────────────

export interface SetupProgress {
  company_id: string;
  status: SetupStatus;
  submitted_at: string | null;
  updated_at: string;
}

// ── Backups ──────────────────────────────────────────────────────────────────

export interface BackupSnapshot {
  backup_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface BackupHistory {
  version: string;
  backups: BackupSnapshot[];
}

// ── Wizard-mode aggregate (held in memory by useForm; never persisted) ───────

export interface WizardFormValues {
  // Step 1 — Company
  name: string;
  base_currency: BaseCurrency;
  // Step 2 — Time
  planning_horizon_months: number;
  lead_time_days: number;
  planning_cycle: PlanningCycle;
  allow_mid_planning: boolean;
  // Step 3 — Release
  lock_deadline_days_before: number;
  release_day_of_week: DayOfWeek;
}

// ── Export bundle shape (round-trips through Export/Import) ──────────────────

export interface ExportBundle {
  schema_version: string;
  exported_at: string;
  company: Company;
  time_config: TimeConfig | null;
  release_config: ReleaseConfig | null;
  setup_progress: SetupProgress | null;
}

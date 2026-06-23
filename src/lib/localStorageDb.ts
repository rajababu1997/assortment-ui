/**
 * Typed LocalStorage wrapper for the OTB Setup feature.
 *
 * Responsibilities:
 *  - JSON serialize / parse with type safety
 *  - Schema-version envelope so a future migration runner can upgrade old data
 *  - Multi-key atomic writes via `setMany` (best-effort: rolls back on quota error)
 *  - Cross-tab change notifications via the native `storage` event
 *  - Storage quota probe for the dashboard
 *
 * Versioning model: every value is wrapped as `{ v: SCHEMA_VERSION, data: T }`.
 * `migrations` is keyed by *current stored version*; each migration produces
 * the next version's shape. The runner walks them until it reaches CURRENT.
 */

import { logger } from '@/lib/logger';

interface Envelope<T> {
  v: string;
  data: T;
}

export type Migration = (raw: unknown) => unknown;

export interface LocalStorageDbConfig {
  currentVersion: string;
  /** Migrations keyed by the *from* version. E.g. { '0.9.0': fn } upgrades 0.9.0 → currentVersion. */
  migrations?: Record<string, Migration>;
}

let config: LocalStorageDbConfig = { currentVersion: '1.0.0' };

export function configureLocalStorageDb(next: LocalStorageDbConfig): void {
  config = next;
}

// ── Read ─────────────────────────────────────────────────────────────────────

export function getItem<T>(key: string): T | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch (error) {
    logger.error('localStorageDb getItem failed', { key, error });
    return null;
  }
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error('localStorageDb parse failed', { key, error });
    return null;
  }

  // Legacy (non-envelope) values: treat as current version.
  if (!isEnvelope(parsed)) {
    return parsed as T;
  }

  return runMigrations<T>(key, parsed);
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return typeof value === 'object' && value !== null && 'v' in value && 'data' in value;
}

function runMigrations<T>(key: string, envelope: Envelope<unknown>): T {
  let current = envelope;
  const seen = new Set<string>();
  while (current.v !== config.currentVersion) {
    if (seen.has(current.v)) {
      logger.error('localStorageDb migration loop detected', { key, version: current.v });
      return current.data as T;
    }
    seen.add(current.v);
    const migrate = config.migrations?.[current.v];
    if (!migrate) {
      logger.warn('localStorageDb no migration available; using stored data as-is', {
        key,
        from: current.v,
        to: config.currentVersion,
      });
      return current.data as T;
    }
    const nextData = migrate(current.data);
    // Migrations are expected to bump the version to the next step; we re-envelope
    // with currentVersion because we have no intermediate version map. If multi-step
    // migrations are needed later, return `{ v, data }` from the migration fn.
    current = { v: config.currentVersion, data: nextData };
  }
  return current.data as T;
}

// ── Write ────────────────────────────────────────────────────────────────────

export function setItem<T>(key: string, value: T): void {
  const envelope: Envelope<T> = { v: config.currentVersion, data: value };
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch (error) {
    logger.error('localStorageDb setItem failed', { key, error });
    throw error;
  }
}

export function removeItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    logger.error('localStorageDb removeItem failed', { key, error });
  }
}

/**
 * Best-effort atomic write across multiple keys.
 * On failure (e.g. quota), restores prior snapshots for already-written keys.
 */
export function setMany(entries: Array<[string, unknown]>): void {
  const prior: Array<[string, string | null]> = entries.map(([key]) => [key, window.localStorage.getItem(key)]);
  const written: string[] = [];
  try {
    for (const [key, value] of entries) {
      const envelope: Envelope<unknown> = { v: config.currentVersion, data: value };
      window.localStorage.setItem(key, JSON.stringify(envelope));
      written.push(key);
    }
  } catch (error) {
    logger.error('localStorageDb setMany failed; rolling back', { written, error });
    for (const [key, prev] of prior) {
      if (!written.includes(key)) continue;
      if (prev === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, prev);
    }
    throw error;
  }
}

// ── Cross-tab subscription ───────────────────────────────────────────────────

export type StorageListener = (key: string) => void;

/**
 * Subscribe to LocalStorage changes from *other* tabs.
 * Returns an unsubscribe function. Same-tab writes do NOT fire `storage` events
 * (callers should invalidate their own caches directly after a write).
 */
export function subscribe(listener: StorageListener): () => void {
  const handler = (event: StorageEvent) => {
    if (event.storageArea !== window.localStorage) return;
    if (event.key === null) return;
    listener(event.key);
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// ── Quota helpers ────────────────────────────────────────────────────────────

/** Rough byte size of *all* LocalStorage for this origin. */
export function getStorageUsageBytes(): number {
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key === null) continue;
    const value = window.localStorage.getItem(key) ?? '';
    // Rough: 2 bytes per UTF-16 code unit for both key and value.
    total += (key.length + value.length) * 2;
  }
  return total;
}

/** Conservative LocalStorage cap across major browsers. Used for UI display only. */
export const LOCAL_STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;

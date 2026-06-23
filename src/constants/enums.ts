/**
 * Domain enums & option lists — ported from Angular:
 *   core/constants/enum-constants.ts
 *   shared/constants/tps-enum-constants.ts
 *
 * Pattern: `as const` objects + derived union types (no TS enum).
 * All option lists (for form dropdowns) reference enum values — never raw strings.
 */

// ── HTTP Status ────────────────────────────────────────────────────────────
export const HTTP_STATUS = {
    SUCCESS: 200,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
} as const;
export type HttpStatus = typeof HTTP_STATUS[keyof typeof HTTP_STATUS];

/** Check if API response code equals a status — handles string/number mismatch (API returns "200" not 200) */
export function isHttpSuccess(code: unknown): boolean {
  return String(code) === String(HTTP_STATUS.SUCCESS);
}

// ── API Types (HTTP Methods) ───────────────────────────────────────────────
export const API_TYPES = {
    DELETE: 'DELETE',
    GET: 'GET',
    PATCH: 'PATCH',
    POST: 'POST',
    PUT: 'PUT',
} as const;
export type ApiType = typeof API_TYPES[keyof typeof API_TYPES];

// ── Table Action Types ─────────────────────────────────────────────────────
export const TABLE_ACTION_TYPES = {
    ACTIVATE: 'ACTIVATE',
    ANALYTICS: 'ANALYTICS',
    APPROVE: 'APPROVE',
    CREATE: 'CREATE',
    DEACTIVATE: 'DEACTIVATE',
    DELETE: 'DELETE',
    EDIT: 'EDIT',
    PIN_DROP: 'PIN_DROP',
    VIEW: 'VIEW',
} as const;
export type TableActionType = typeof TABLE_ACTION_TYPES[keyof typeof TABLE_ACTION_TYPES];

// ── Role ───────────────────────────────────────────────────────────────────
export const ROLE = {
    ADMIN: 'ADMIN',
    AGENCY: 'AGENCY',
    AUDITOR: 'AUDITOR',
    FACTORY: 'FACTORY',
    LAB: 'LAB',
    OPERATIONS: 'OPERATIONS',
    SELLER: 'SELLER',
    VENDOR: 'VENDOR',
} as const;
export type Role = typeof ROLE[keyof typeof ROLE];

export const ROLE_LIST = [
    { label: 'Admin', value: ROLE.ADMIN },
] as const;

// ── Severity ───────────────────────────────────────────────────────────────
export const SEVERITY = {
    URGENT: 1,
    CRITICAL: 2,
    MAJOR: 3,
    MINOR: 4,
} as const;
export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

export const SEVERITY_TEXT = {
    URGENT: 'Urgent',
    CRITICAL: 'Critical',
    MAJOR: 'Major',
    MINOR: 'Minor',
} as const;
export type SeverityText = typeof SEVERITY_TEXT[keyof typeof SEVERITY_TEXT];

export const SEVERITY_LIST = [
    { label: SEVERITY_TEXT.URGENT,   value: SEVERITY_TEXT.URGENT },
    { label: SEVERITY_TEXT.CRITICAL, value: SEVERITY_TEXT.CRITICAL },
    { label: SEVERITY_TEXT.MAJOR,    value: SEVERITY_TEXT.MAJOR },
    { label: SEVERITY_TEXT.MINOR,    value: SEVERITY_TEXT.MINOR },
] as const;

// ── Priority ───────────────────────────────────────────────────────────────
export const PRIORITY = {
    HIGH: '1',
    MEDIUM: '2',
    LOW: '3',
} as const;
export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

export const PRIORITY_LIST = [
    { label: 'High',   value: PRIORITY.HIGH },
    { label: 'Medium', value: PRIORITY.MEDIUM },
    { label: 'Low',    value: PRIORITY.LOW },
] as const;

// ── Speed ──────────────────────────────────────────────────────────────────
export const SPEED = {
    RANGE_40_50: '40_50',
    RANGE_50_60: '50_60',
    GT_60: 'GT_60',
} as const;
export type Speed = typeof SPEED[keyof typeof SPEED];

export const SPEED_LIST = [
    { label: '40 - 50',      value: SPEED.RANGE_40_50 },
    { label: '50 - 60',      value: SPEED.RANGE_50_60 },
    { label: 'More than 60', value: SPEED.GT_60 },
] as const;

// ── Vehicle Status ─────────────────────────────────────────────────────────
export const VEHICLE_STATUS = {
    BLACKLISTED: 0,
    WHITELISTED: 1,
} as const;
export type VehicleStatus = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];

// ── Drone State ────────────────────────────────────────────────────────────
/**
 * DroneState — matches Kotlin backend DroneState object constants.
 *
 * Workflow order: STARTED → LAUNCHED → INSPECTION_DONE → COMPLETED
 * Exceptional: ABORTED | UNKNOWN
 */
export const DRONE_STATE = {
    ABORTED: 'ABORTED',
    COMPLETED: 'PLAN-COMPLETED',
    INSPECTION_DONE: 'INSPECTION-DONE',
    LAUNCHED: 'LAUNCHED',
    STARTED: 'STARTED',
    UNKNOWN: 'UNKNOWN',
} as const;
export type DroneState = typeof DRONE_STATE[keyof typeof DRONE_STATE];

export const DRONE_STATE_LIST = [
    { label: 'Started',         value: DRONE_STATE.STARTED,         order: 0 },
    { label: 'Launched',        value: DRONE_STATE.LAUNCHED,        order: 1 },
    { label: 'Inspection Done', value: DRONE_STATE.INSPECTION_DONE, order: 2 },
    { label: 'Completed',       value: DRONE_STATE.COMPLETED,       order: 3 },
    { label: 'Aborted',         value: DRONE_STATE.ABORTED,         order: -1 },
    { label: 'Unknown',         value: DRONE_STATE.UNKNOWN,         order: -1 },
] as const;

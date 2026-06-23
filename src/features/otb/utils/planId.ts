/**
 * Annual Plan identity helpers.
 *
 * `plan_id` is the deterministic business identifier for an annual plan,
 * keyed on the full date window:
 *
 *     AP-{YYYYMMDD start}-{YYYYMMDD end}
 *
 * Examples:
 *     AP-20260401-20270331  (FY 2026-27, Indian FY)
 *     AP-20260101-20261231  (CY 2026)
 *     AP-20260701-20260930  (Q3 26 replanning, 3-month)
 *
 * Uniqueness model: two plans with identical (start, end) collapse to the
 * same id, so `initAnnualPlan` is idempotent. Two plans with different
 * horizons (e.g. 6-month vs 12-month starting the same date) get different
 * ids. Cycle (monthly / weekly / quarterly) is a property of the plan, not
 * part of its identity — picking the same window twice and only switching
 * cycle is treated as "switch to existing plan".
 */

import type { Period } from '../types';

/** Build `plan_id` from start + end ISO dates. */
export function buildPlanId(plan_start_iso: string, plan_end_iso: string): string {
  return `AP-${compactIso(plan_start_iso)}-${compactIso(plan_end_iso)}`;
}

/** Human-readable display name for the plan.
 *
 *   Apr-start + 12 months  → "2026"            (plain year, start year wins)
 *   Jan-start + 12 months  → "2026"            (plain year)
 *   anything else          → "Apr 2026 → Sep 2026"  (date-range fallback)
 */
export function buildPlanName(plan_start_iso: string, plan_end_iso: string): string {
  const start = new Date(plan_start_iso);
  const end = new Date(plan_end_iso);
  const isFy =
    start.getMonth() === 3 &&        // April
    end.getMonth() === 2 &&          // March
    end.getFullYear() === start.getFullYear() + 1;
  if (isFy) return String(start.getFullYear());
  const isCy =
    start.getMonth() === 0 &&        // January
    end.getMonth() === 11 &&         // December
    end.getFullYear() === start.getFullYear();
  if (isCy) return String(start.getFullYear());
  return `${fmtMonth(start)} → ${fmtMonth(end)}`;
}

/** Last day of the last period — the plan's calendar end. */
export function derivePlanEndIso(periods: Period[]): string {
  if (periods.length === 0) return '';
  return periods[periods.length - 1].end_iso.slice(0, 10);
}

// ── internals ──────────────────────────────────────────────────────────────

function compactIso(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

function fmtMonth(d: Date): string {
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;
}

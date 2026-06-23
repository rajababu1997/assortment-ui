/**
 * Period generation. Derives the planning periods from:
 * - plan_start_iso (where the planner's year begins, from AnnualPlan)
 * - cycle + horizon (from Setup TimeConfig)
 * - lock_deadline_days_before + release day (from Setup ReleaseConfig)
 */

import type { Period } from '../types';
import type { DayOfWeek, PlanningCycle } from '@/features/setup/types';

interface GenerateInput {
  /** ISO YYYY-MM-DD — the first day of the plan's first period. */
  plan_start_iso: string;
  planning_horizon_months: number;
  planning_cycle: PlanningCycle;
  lock_deadline_days_before: number;
  release_day_of_week: DayOfWeek;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW_INDEX: Record<DayOfWeek, number | null> = {
  any: null,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

export function generatePeriods(input: GenerateInput): Period[] {
  const planStart = new Date(input.plan_start_iso);
  const monthsHorizon = input.planning_horizon_months;

  switch (input.planning_cycle) {
    case 'monthly':
      return generateMonthly(planStart, monthsHorizon, input);
    case 'quarterly':
      return generateQuarterly(planStart, monthsHorizon, input);
    case 'weekly':
      return generateWeekly(planStart, monthsHorizon, input);
  }
}

function snapToDow(date: Date, dow: DayOfWeek): Date {
  const idx = DOW_INDEX[dow];
  if (idx == null) return date;
  const d = new Date(date);
  while (d.getDay() !== idx) d.setDate(d.getDate() - 1);
  return d;
}

function lockDeadline(start: Date, daysBefore: number, dow: DayOfWeek): Date {
  const raw = new Date(start);
  raw.setDate(raw.getDate() - daysBefore);
  return snapToDow(raw, dow);
}

function generateMonthly(planStart: Date, horizon: number, input: GenerateInput): Period[] {
  const out: Period[] = [];
  for (let i = 0; i < horizon; i++) {
    const start = new Date(planStart.getFullYear(), planStart.getMonth() + i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
    const lock = lockDeadline(start, input.lock_deadline_days_before, input.release_day_of_week);
    out.push({
      key,
      label: `${MONTH_LABELS[start.getMonth()]} ${start.getFullYear()}`,
      index: i,
      start_iso: start.toISOString(),
      end_iso: end.toISOString(),
      lock_deadline_iso: lock.toISOString(),
    });
  }
  return out;
}

function generateQuarterly(planStart: Date, monthsHorizon: number, input: GenerateInput): Period[] {
  const out: Period[] = [];
  const quarters = Math.ceil(monthsHorizon / 3);
  for (let i = 0; i < quarters; i++) {
    const start = new Date(planStart.getFullYear(), planStart.getMonth() + i * 3, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
    const key = `${start.getFullYear()}-Q${i + 1}`;
    const lock = lockDeadline(start, input.lock_deadline_days_before, input.release_day_of_week);
    out.push({
      key,
      label: `Q${i + 1} FY${String(planStart.getFullYear()).slice(2)}`,
      index: i,
      start_iso: start.toISOString(),
      end_iso: end.toISOString(),
      lock_deadline_iso: lock.toISOString(),
    });
  }
  return out;
}

function generateWeekly(planStart: Date, monthsHorizon: number, input: GenerateInput): Period[] {
  const out: Period[] = [];
  const totalDays = Math.round(monthsHorizon * 30.44);
  const weeks = Math.ceil(totalDays / 7);
  for (let i = 0; i < weeks; i++) {
    const start = new Date(planStart);
    start.setDate(start.getDate() + i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const key = `${start.getFullYear()}-W${String(i + 1).padStart(2, '0')}`;
    const lock = lockDeadline(start, input.lock_deadline_days_before, input.release_day_of_week);
    out.push({
      key,
      label: `Wk ${i + 1} (${MONTH_LABELS[start.getMonth()]} ${start.getDate()})`,
      index: i,
      start_iso: start.toISOString(),
      end_iso: end.toISOString(),
      lock_deadline_iso: lock.toISOString(),
    });
  }
  return out;
}

export function daysBetween(fromIso: string, toMs: number): number {
  const ms = new Date(fromIso).getTime() - toMs;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

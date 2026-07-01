/**
 * Derives the top-of-page KPIs, pipeline funnel counts, and aging histogram
 * from the same data sources `useWipItems` consumes. Splitting the
 * computation keeps the dashboard page free of inline math and makes each
 * visualization unit-testable in isolation.
 */

import { useMemo } from 'react';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { useApiAllOtbRows } from '@/features/otb/lifecycle/useApiOtbLifecycle';
import { useAllPlans } from '@/features/otb/useOtb';
import { useDemoToday } from '@/hooks/useDemoClock';
import { OTB_STATES } from '@/features/otb/constants';
import { daysOld } from './utils/age';
import type { DashboardFilters } from './useDashboardFilters';
import type { OtbRowView } from '@/features/otb/lifecycle/types';

export interface KpiSnapshot {
  totalWip: number;
  stuck: number;
  /** ₹ value of OTB across released + final-approved rows (already committed). */
  committed: number;
  /** ₹ total annual budget across all plans. */
  totalBudget: number;
  /** committed / totalBudget — 0..1. */
  utilization: number;
}

export interface FunnelStage {
  key: 'draft' | 'review' | 'revisions' | 'approved' | 'released' | 'final';
  label: string;
  count: number;
}

export interface AgingBucket {
  key: '0-1' | '1-3' | '3-7' | '7+';
  label: string;
  count: number;
  /** True for buckets that signal stuck work. */
  stuck: boolean;
}

export interface DashboardKpis {
  snapshot: KpiSnapshot;
  funnel: FunnelStage[];
  aging: AgingBucket[];
  isLoading: boolean;
}

const STUCK_DAYS = 3;

export function useDashboardKpis(filters: DashboardFilters): DashboardKpis {
  const apiAnnual = useApiAnnualPlans();
  const plans = useAllPlans();
  const nowMs = useDemoToday();

  const dateRange = useMemo(() => {
    if (plans.length === 0) return null;
    let from = plans[0].plan_start_iso;
    let to = plans[0].plan_end_iso;
    for (const p of plans) {
      if (p.plan_start_iso < from) from = p.plan_start_iso;
      if (p.plan_end_iso > to) to = p.plan_end_iso;
    }
    return { from, to };
  }, [plans]);

  const otbRowsQ = useApiAllOtbRows(
    dateRange?.from,
    dateRange?.to,
    { enabled: !!dateRange },
  );

  return useMemo<DashboardKpis>(() => {
    const annualPlans = apiAnnual.data ?? [];
    const allRows = otbRowsQ.data ?? [];

    const rows = allRows.filter((r) => passesRowFilters(r, filters, nowMs));

    // ── Pipeline funnel ────────────────────────────────────────────────
    let draftN = 0, reviewN = 0, revisionsN = 0, approvedN = 0, releasedN = 0, finalN = 0;

    // Annual plan stage (draft/submitted only — approved+ is per-row from here).
    for (const plan of annualPlans) {
      if (plan.state === OTB_STATES.DRAFT) draftN++;
      else if (plan.state === OTB_STATES.SUBMITTED) reviewN++;
    }

    // Per-row stage.
    for (const row of rows) {
      if (row.op_state === 'revisions_requested') revisionsN++;
      else if (row.op_state === 'draft' || row.vp_state === 'draft') draftN++;
      else if (row.op_state === 'submitted' || row.vp_state === 'submitted') reviewN++;
      else if (row.op_state === 'approved' && !row.final_approved_at) approvedN++;
      else if (row.lifecycle_state === 'released' && !row.vp_state) draftN++; // awaiting VP
      else if (row.vp_state === 'approved' && !row.op_state) draftN++;       // awaiting OP

      // Independent dimensions — a row can be both 'released' and in a
      // later stage. Track these separately so the funnel reads top-down.
      if (row.lifecycle_state === 'released' || row.lifecycle_state === 'final_approved') {
        releasedN++;
      }
      if (row.lifecycle_state === 'final_approved') {
        finalN++;
      }
    }

    const funnel: FunnelStage[] = [
      { key: 'draft', label: 'Draft', count: draftN },
      { key: 'review', label: 'In review', count: reviewN },
      { key: 'revisions', label: 'Revisions', count: revisionsN },
      { key: 'approved', label: 'Approved', count: approvedN },
      { key: 'released', label: 'Released', count: releasedN },
      { key: 'final', label: 'Final approved', count: finalN },
    ];

    // ── KPI snapshot ───────────────────────────────────────────────────
    const totalWip = draftN + reviewN + revisionsN + approvedN;
    const now = Date.now();
    let stuck = 0;
    for (const row of rows) {
      if (row.lifecycle_state === 'final_approved') continue;
      // Stuck = the row's own modified_time is old AND it's still in a WIP state.
      const inWip = (row.vp_state && row.vp_state !== 'approved') ||
        (row.op_state && row.op_state !== 'approved') ||
        (row.op_state === 'approved' && !row.final_approved_at);
      if (inWip && daysOld(row.modified_time, now) > STUCK_DAYS) stuck++;
    }
    for (const plan of annualPlans) {
      if (plan.state !== OTB_STATES.DRAFT && plan.state !== OTB_STATES.SUBMITTED) continue;
      const stamp = plan.approved_at ?? plan.created_at;
      if (daysOld(stamp, now) > STUCK_DAYS) stuck++;
    }

    let committed = 0;
    let totalBudget = 0;
    for (const row of rows) {
      if (row.lifecycle_state === 'released' || row.lifecycle_state === 'final_approved') {
        committed += row.otb_amount;
      }
    }
    for (const plan of annualPlans) totalBudget += plan.overall_budget ?? 0;
    const utilization = totalBudget > 0 ? committed / totalBudget : 0;

    // ── Aging histogram ────────────────────────────────────────────────
    const aging: AgingBucket[] = [
      { key: '0-1', label: '< 1 day', count: 0, stuck: false },
      { key: '1-3', label: '1–3 days', count: 0, stuck: false },
      { key: '3-7', label: '3–7 days', count: 0, stuck: true },
      { key: '7+', label: '> 7 days', count: 0, stuck: true },
    ];
    for (const row of rows) {
      if (row.lifecycle_state === 'final_approved') continue;
      const inWip = (row.vp_state && row.vp_state !== 'approved') ||
        (row.op_state && row.op_state !== 'approved') ||
        (row.op_state === 'approved' && !row.final_approved_at);
      if (!inWip) continue;
      const d = daysOld(row.modified_time, now);
      if (d < 1) aging[0].count++;
      else if (d < 3) aging[1].count++;
      else if (d < 7) aging[2].count++;
      else aging[3].count++;
    }
    for (const plan of annualPlans) {
      if (plan.state !== OTB_STATES.DRAFT && plan.state !== OTB_STATES.SUBMITTED) continue;
      const stamp = plan.approved_at ?? plan.created_at;
      const d = daysOld(stamp, now);
      if (d < 1) aging[0].count++;
      else if (d < 3) aging[1].count++;
      else if (d < 7) aging[2].count++;
      else aging[3].count++;
    }

    return {
      snapshot: { totalWip, stuck, committed, totalBudget, utilization },
      funnel,
      aging,
      isLoading: apiAnnual.isLoading || otbRowsQ.isLoading,
    };
  }, [apiAnnual.data, apiAnnual.isLoading, otbRowsQ.data, otbRowsQ.isLoading, filters, nowMs]);
}

const STUCK_DAYS_FILTER = 3;

function passesRowFilters(row: OtbRowView, filters: DashboardFilters, nowMs: number): boolean {
  if (filters.brands.length > 0 && !filters.brands.includes(row.brand_uuid)) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(row.category_uuid)) return false;
  // Stuck items override the date filter — same rule as the other sections.
  const isStuck =
    row.lifecycle_state !== 'final_approved' &&
    daysOld(row.modified_time, nowMs) > STUCK_DAYS_FILTER;
  if (isStuck) return true;
  if (filters.from && row.period_key < filters.from) return false;
  if (filters.to && row.period_key > filters.to) return false;
  return true;
}

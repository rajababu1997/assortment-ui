/**
 * Plan-derived data hooks for the bigger dashboard sections.
 *
 * Why one file instead of many: every hook reads from the same upstream
 * (`useApiAnnualPlans`, `useApiAllOtbRows`). Co-locating them prevents
 * duplicate queries and keeps the heavy filter logic next to its
 * consumers.
 */

import { useMemo } from 'react';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { useApiAllOtbRows } from '@/features/otb/lifecycle/useApiOtbLifecycle';
import { useApiAllOptionPlanRows } from '@/features/option/useApiOptionPlans';
import { useAllPlans } from '@/features/otb/useOtb';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { useDemoToday } from '@/hooks/useDemoClock';
import { OTB_STATES, type OtbState } from '@/features/otb/constants';
import { daysOld, fmtAge } from './utils/age';
import type { DashboardFilters } from './useDashboardFilters';
import type { LifecycleState, OtbRowView } from '@/features/otb/lifecycle/types';
import type { OptionPlanRow } from '@/features/option/types';

// ── Shared upstream query ───────────────────────────────────────────────────

function useDashboardData(filters: DashboardFilters) {
  const apiAnnual = useApiAnnualPlans();
  const plans = useAllPlans();
  const todayMs = useDemoToday();

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

  const optionRowsQ = useApiAllOptionPlanRows(
    dateRange?.from,
    dateRange?.to,
    { enabled: !!dateRange },
  );

  const allRows = otbRowsQ.data ?? [];
  const optionRows = optionRowsQ.data ?? [];
  const annualPlans = apiAnnual.data ?? [];

  const filteredRows = useMemo(
    () => allRows.filter((r) => passesRowFilters(r, filters, todayMs)),
    [allRows, filters, todayMs],
  );

  return {
    annualPlans,
    allRows,
    optionRows,
    filteredRows,
    isLoading: apiAnnual.isLoading || otbRowsQ.isLoading,
  };
}

const STUCK_DAYS_FILTER = 3;

function passesRowFilters(row: OtbRowView, filters: DashboardFilters, nowMs: number): boolean {
  if (filters.brands.length > 0 && !filters.brands.includes(row.brand_uuid)) return false;
  if (filters.categories.length > 0 && !filters.categories.includes(row.category_uuid)) return false;
  // Stuck items override the date filter so overdue work doesn't fall
  // outside the buyer's forward window.
  const isStuck =
    row.lifecycle_state !== 'final_approved' &&
    daysOld(row.modified_time, nowMs) > STUCK_DAYS_FILTER;
  if (isStuck) return true;
  if (filters.from && row.period_key < filters.from) return false;
  if (filters.to && row.period_key > filters.to) return false;
  return true;
}

// ── 1. OTB Status Table ─────────────────────────────────────────────────────

export interface StatusRow {
  state: OtbState | LifecycleState | 'vp_pending' | 'op_pending' | 'op_revisions';
  label: string;
  count: number;
  tone: 'neutral' | 'info' | 'warning' | 'success' | 'danger';
}

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  in_progress: 'In progress',
  locked: 'Locked',
  skipped: 'Skipped',
  planned: 'Planned',
  released: 'Released',
  value_planned: 'Value Planned',
  option_planned: 'Option Planned',
  final_approved: 'Final Approved',
  vp_pending: 'Value Plan pending',
  op_pending: 'Option Plan pending',
  op_revisions: 'Revisions needed',
};

export function useStatusBreakdown(filters: DashboardFilters): {
  rows: StatusRow[];
  isLoading: boolean;
} {
  const { filteredRows, isLoading } = useDashboardData(filters);

  const rows = useMemo<StatusRow[]>(() => {
    const counts: Record<string, number> = {
      planned: 0,
      released: 0,
      value_planned: 0,
      option_planned: 0,
      final_approved: 0,
      vp_pending: 0,
      op_pending: 0,
      op_revisions: 0,
    };
    for (const r of filteredRows) {
      counts[r.lifecycle_state] = (counts[r.lifecycle_state] ?? 0) + 1;
      if (r.vp_state === 'submitted') counts.vp_pending++;
      if (r.op_state === 'submitted') counts.op_pending++;
      if (r.op_state === 'revisions_requested') counts.op_revisions++;
    }
    return [
      { state: 'planned', label: STATE_LABELS.planned, count: counts.planned, tone: 'neutral' },
      { state: 'released', label: STATE_LABELS.released, count: counts.released, tone: 'info' },
      { state: 'value_planned', label: STATE_LABELS.value_planned, count: counts.value_planned, tone: 'info' },
      { state: 'option_planned', label: STATE_LABELS.option_planned, count: counts.option_planned, tone: 'info' },
      { state: 'final_approved', label: STATE_LABELS.final_approved, count: counts.final_approved, tone: 'success' },
      { state: 'vp_pending', label: STATE_LABELS.vp_pending, count: counts.vp_pending, tone: 'warning' },
      { state: 'op_pending', label: STATE_LABELS.op_pending, count: counts.op_pending, tone: 'warning' },
      { state: 'op_revisions', label: STATE_LABELS.op_revisions, count: counts.op_revisions, tone: 'danger' },
    ];
  }, [filteredRows]);

  return { rows, isLoading };
}

// ── 2. Planning Pipeline (5 stages) ─────────────────────────────────────────

export interface PipelineStage {
  key: 'otb' | 'value' | 'option' | 'design' | 'release';
  label: string;
  complete: number;
  total: number;
  /** Status tone — green when on track (>= 67%), amber (>= 33%), red (<33%). */
  tone: 'success' | 'warning' | 'danger' | 'neutral';
  /** OTB amount rolled up for rows that have passed this stage. */
  value?: number;
  /** Σ production_qty_snapshot across OP bands. Only set for option/design. */
  volume?: number;
  /** Σ option_plan_qty across OP bands. Only set for option/design. */
  option?: number;
}

export function usePlanningPipeline(filters: DashboardFilters): {
  stages: PipelineStage[];
  isLoading: boolean;
} {
  const { filteredRows, optionRows, isLoading } = useDashboardData(filters);

  const stages = useMemo<PipelineStage[]>(() => {
    const total = filteredRows.length;
    if (total === 0) {
      return [
        { key: 'otb', label: 'OTB Planning', complete: 0, total: 0, tone: 'neutral', value: 0 },
        { key: 'value', label: 'Value Planning', complete: 0, total: 0, tone: 'neutral', value: 0 },
        { key: 'option', label: 'Option Planning', complete: 0, total: 0, tone: 'neutral', value: 0, volume: 0, option: 0 },
        { key: 'design', label: 'Design Review', complete: 0, total: 0, tone: 'neutral', value: 0, volume: 0, option: 0 },
        { key: 'release', label: 'Ready To Release', complete: 0, total: 0, tone: 'neutral' },
      ];
    }

    // Index OP rows by otb_code for a cheap join inside the funnel loop.
    const opByCode = new Map<string, OptionPlanRow>();
    for (const op of optionRows) opByCode.set(op.otb_code, op);

    // OTB row "complete" at each stage. A row passing a later stage implies
    // earlier stages are done — so counts read top-down as a funnel.
    let otbC = 0, valC = 0, optC = 0, desC = 0, relC = 0;
    let otbV = 0, valV = 0, optV = 0, desV = 0;
    let optVol = 0, optOpt = 0, desVol = 0, desOpt = 0;

    for (const r of filteredRows) {
      const pastOtb = r.lifecycle_state === 'released'
        || r.lifecycle_state === 'value_planned'
        || r.lifecycle_state === 'option_planned'
        || r.lifecycle_state === 'final_approved';
      const pastValue = r.vp_state === 'approved' || !!r.op_state || r.lifecycle_state === 'final_approved';
      const pastOption = r.op_state === 'submitted'
        || r.op_state === 'revisions_requested'
        || r.op_state === 'approved'
        || r.lifecycle_state === 'final_approved';
      const pastDesign = r.op_state === 'approved' || r.lifecycle_state === 'final_approved';
      const pastRelease = r.lifecycle_state === 'final_approved';

      if (pastOtb) { otbC++; otbV += r.otb_amount; }
      if (pastValue) { valC++; valV += r.otb_amount; }
      if (pastOption) {
        optC++;
        optV += r.otb_amount;
        const op = opByCode.get(r.otb_code);
        if (op) {
          for (const b of op.bands) {
            optVol += b.production_qty_snapshot || 0;
            optOpt += b.option_plan_qty || 0;
          }
        }
      }
      if (pastDesign) {
        desC++;
        desV += r.otb_amount;
        const op = opByCode.get(r.otb_code);
        if (op) {
          for (const b of op.bands) {
            desVol += b.production_qty_snapshot || 0;
            desOpt += b.option_plan_qty || 0;
          }
        }
      }
      if (pastRelease) relC++;
    }

    return [
      mkStage('otb', 'OTB Planning', otbC, total, { value: otbV }),
      mkStage('value', 'Value Planning', valC, total, { value: valV }),
      mkStage('option', 'Option Planning', optC, total, { value: optV, volume: optVol, option: optOpt }),
      mkStage('design', 'Design Review', desC, total, { value: desV, volume: desVol, option: desOpt }),
      mkStage('release', 'Ready To Release', relC, total),
    ];
  }, [filteredRows, optionRows]);

  return { stages, isLoading };
}

function mkStage(
  key: PipelineStage['key'],
  label: string,
  complete: number,
  total: number,
  extras?: { value?: number; volume?: number; option?: number },
): PipelineStage {
  const ratio = total > 0 ? complete / total : 0;
  const tone: PipelineStage['tone'] =
    ratio >= 0.67 ? 'success'
    : ratio >= 0.33 ? 'warning'
    : 'danger';
  return { key, label, complete, total, tone, ...extras };
}

// ── 3. Release Timeline ────────────────────────────────────────────────────

export interface TimelineMonth {
  /** YYYY-MM */
  key: string;
  label: string;
  totalRows: number;
  releasedRows: number;
  finalApprovedRows: number;
  /** Dominant state across this month's rows (used for the badge color). */
  state: 'final' | 'released' | 'in_progress' | 'planned' | 'not_started';
}

export function useReleaseTimeline(filters: DashboardFilters): {
  months: TimelineMonth[];
  year: number;
  isLoading: boolean;
} {
  const { annualPlans, filteredRows, isLoading } = useDashboardData(filters);

  const year = useMemo(() => {
    if (annualPlans.length === 0) return new Date().getFullYear();
    // Pick the earliest plan's start year as anchor.
    const first = annualPlans
      .map((p) => p.plan_start_iso)
      .sort()[0];
    return parseInt(first.slice(0, 4), 10);
  }, [annualPlans]);

  const months = useMemo<TimelineMonth[]>(() => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const all = labels.map((label, i) => {
      const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
      const monthRows = filteredRows.filter((r) => r.period_key === monthKey);
      const total = monthRows.length;
      const released = monthRows.filter((r) =>
        r.lifecycle_state === 'released' ||
        r.lifecycle_state === 'value_planned' ||
        r.lifecycle_state === 'option_planned' ||
        r.lifecycle_state === 'final_approved',
      ).length;
      const finalApproved = monthRows.filter((r) =>
        r.lifecycle_state === 'final_approved',
      ).length;

      let state: TimelineMonth['state'];
      if (total === 0) state = 'not_started';
      else if (finalApproved === total) state = 'final';
      else if (released === total) state = 'released';
      else if (released > 0) state = 'in_progress';
      else state = 'planned';

      return {
        key: monthKey,
        label,
        totalRows: total,
        releasedRows: released,
        finalApprovedRows: finalApproved,
        state,
      };
    });
    // When a date range is set on the dashboard, narrow the timeline so
    // empty months in the planning year don't clutter the strip.
    if (!filters.from && !filters.to) return all;
    return all.filter((m) => {
      if (filters.from && m.key < filters.from) return false;
      if (filters.to && m.key > filters.to) return false;
      return true;
    });
  }, [filteredRows, year, filters.from, filters.to]);

  return { months, year, isLoading };
}

// ── 4. Category Progress ───────────────────────────────────────────────────

export interface CategoryProgressRow {
  brandUuid: string;
  categoryUuid: string;
  brandName: string;
  categoryName: string;
  total: number;
  completed: number;
  pct: number;
}

export function useCategoryProgress(filters: DashboardFilters): {
  rows: CategoryProgressRow[];
  totalCategories: number;
  completed: number;
  pending: number;
  isLoading: boolean;
} {
  const { filteredRows, isLoading } = useDashboardData(filters);
  const { findBrand, findCategory } = useBrandCategoryLookup();

  const rows = useMemo<CategoryProgressRow[]>(() => {
    const map = new Map<string, CategoryProgressRow>();
    for (const r of filteredRows) {
      const key = `${r.brand_uuid}:${r.category_uuid}`;
      const existing = map.get(key);
      const isCompleted = r.lifecycle_state === 'final_approved';
      if (existing) {
        existing.total++;
        if (isCompleted) existing.completed++;
      } else {
        const brand = findBrand(r.brand_uuid);
        const category = findCategory(r.category_uuid);
        map.set(key, {
          brandUuid: r.brand_uuid,
          categoryUuid: r.category_uuid,
          brandName: brand?.name ?? r.brand_uuid.slice(0, 6),
          categoryName: category?.name ?? r.category_uuid.slice(0, 6),
          total: 1,
          completed: isCompleted ? 1 : 0,
          pct: 0,
        });
      }
    }
    const list = Array.from(map.values()).map((r) => ({
      ...r,
      pct: r.total > 0 ? Math.round((r.completed / r.total) * 100) : 0,
    }));
    // Sort by lowest progress first — lagging categories surface to the top.
    list.sort((a, b) => a.pct - b.pct);
    return list;
  }, [filteredRows, findBrand, findCategory]);

  const totalCategories = rows.length;
  const completed = rows.filter((r) => r.pct === 100).length;
  const pending = totalCategories - completed;

  return { rows, totalCategories, completed, pending, isLoading };
}

// ── 5. Approval Status ─────────────────────────────────────────────────────

export interface ApprovalGroup {
  key: 'design_review' | 'category_head' | 'returned';
  label: string;
  description: string;
  count: number;
}

export function useApprovalStatus(filters: DashboardFilters): {
  groups: ApprovalGroup[];
  isLoading: boolean;
} {
  const { filteredRows, isLoading } = useDashboardData(filters);

  const groups = useMemo<ApprovalGroup[]>(() => {
    let designReview = 0;
    let categoryHead = 0;
    let returned = 0;
    for (const r of filteredRows) {
      if (r.vp_state === 'submitted' || r.op_state === 'submitted') designReview++;
      if (r.op_state === 'approved' && !r.final_approved_at) categoryHead++;
      if (r.op_state === 'revisions_requested') returned++;
    }
    return [
      {
        key: 'design_review',
        label: 'Waiting on Design Review',
        description: 'Plans submitted to designer',
        count: designReview,
      },
      {
        key: 'category_head',
        label: 'Waiting on Category Head',
        description: 'Approved by designer, pending final release',
        count: categoryHead,
      },
      {
        key: 'returned',
        label: 'Returned for changes',
        description: 'Designer requested revisions',
        count: returned,
      },
    ];
  }, [filteredRows]);

  return { groups, isLoading };
}

// ── 6. OTB Budget Summary (snapshot) ────────────────────────────────────────

export interface OtbBudgetSummary {
  totalAnnual: number;
  released: number;
  remaining: number;
  utilizationPct: number;
  optionPlansPending: number;
  designReviewPending: number;
  approvalPending: number;
  totalCategories: number;
  completedCategories: number;
  pendingCategories: number;
}

export function useOtbBudgetSummary(filters: DashboardFilters): {
  data: OtbBudgetSummary;
  isLoading: boolean;
} {
  const { annualPlans, filteredRows, isLoading } = useDashboardData(filters);
  const cat = useCategoryProgress(filters);
  const approvals = useApprovalStatus(filters);

  const data = useMemo<OtbBudgetSummary>(() => {
    let totalAnnual = 0;
    for (const p of annualPlans) totalAnnual += p.overall_budget ?? 0;
    let released = 0;
    let optionPlansPending = 0;
    for (const r of filteredRows) {
      if (r.lifecycle_state === 'released'
        || r.lifecycle_state === 'value_planned'
        || r.lifecycle_state === 'option_planned'
        || r.lifecycle_state === 'final_approved') {
        released += r.otb_amount;
      }
      // OPs not yet existing or in draft → pending to fill out.
      if (!r.op_state || r.op_state === 'draft' || r.op_state === 'revisions_requested') {
        if (r.vp_state === 'approved' || r.op_state) optionPlansPending++;
      }
    }
    const remaining = Math.max(0, totalAnnual - released);
    const utilizationPct = totalAnnual > 0 ? released / totalAnnual : 0;
    return {
      totalAnnual,
      released,
      remaining,
      utilizationPct,
      optionPlansPending,
      designReviewPending: approvals.groups.find((g) => g.key === 'design_review')?.count ?? 0,
      approvalPending: approvals.groups.find((g) => g.key === 'category_head')?.count ?? 0,
      totalCategories: cat.totalCategories,
      completedCategories: cat.completed,
      pendingCategories: cat.pending,
    };
  }, [annualPlans, filteredRows, approvals.groups, cat]);

  return { data, isLoading };
}

// ── 7. Recent Activities ───────────────────────────────────────────────────

export interface ActivityItem {
  key: string;
  whenMs: number;
  whenLabel: string;
  actorRole: 'buyer' | 'designer' | 'admin' | 'system';
  action: string;
  subject: string;
  href: string;
}

export function useRecentActivities(filters: DashboardFilters): {
  items: ActivityItem[];
  isLoading: boolean;
} {
  const { filteredRows, isLoading } = useDashboardData(filters);
  const { findBrand, findCategory } = useBrandCategoryLookup();

  const items = useMemo<ActivityItem[]>(() => {
    const now = Date.now();
    const out: ActivityItem[] = [];
    for (const r of filteredRows) {
      const brand = findBrand(r.brand_uuid)?.name ?? '';
      const cat = findCategory(r.category_uuid)?.name ?? '';
      const subject = [brand, cat, formatPeriodKey(r.period_key)]
        .filter(Boolean).join(' · ');
      const href = `/otb/${r.plan_id}/${r.otb_code}/detail`;
      const push = (
        whenMs: number | undefined,
        actorRole: ActivityItem['actorRole'],
        action: string,
        suffix?: string,
      ) => {
        if (!whenMs) return;
        out.push({
          key: `${r.otb_code}:${action}:${whenMs}`,
          whenMs,
          whenLabel: fmtAge(whenMs, now),
          actorRole,
          action,
          subject: suffix ? `${subject} · ${suffix}` : subject,
          href,
        });
      };
      push(r.planned_at, 'buyer', 'Annual planned');
      push(r.released_at, 'buyer', 'OTB released');
      push(r.vp_approved_at, 'designer', 'Value Plan approved');
      push(r.op_approved_at, 'designer', 'Option Plan approved');
      push(r.final_approved_at, 'admin', 'Final approved');
    }
    out.sort((a, b) => b.whenMs - a.whenMs);
    return out.slice(0, 10);
  }, [filteredRows, findBrand, findCategory]);

  return { items, isLoading };
}

// ── 8. Pending Tasks (Buyer-action subset of WIP) ───────────────────────────

export interface PendingTask {
  key: string;
  title: string;
  subtitle: string;
  bucket: 'today' | 'overdue' | 'waiting';
  daysOld: number;
  href: string;
}

export function usePendingTasks(filters: DashboardFilters): {
  tasks: PendingTask[];
  isLoading: boolean;
} {
  const { filteredRows, isLoading } = useDashboardData(filters);
  const { findBrand, findCategory } = useBrandCategoryLookup();

  const tasks = useMemo<PendingTask[]>(() => {
    const now = Date.now();
    const out: PendingTask[] = [];
    for (const r of filteredRows) {
      // Skip if buyer has no action.
      const buyerAction =
        r.vp_state === 'draft' ||
        r.op_state === 'draft' ||
        r.op_state === 'revisions_requested' ||
        (r.vp_state === 'approved' && !r.op_state) ||
        (r.lifecycle_state === 'released' && !r.vp_state);
      if (!buyerAction) continue;

      const d = daysOld(r.modified_time, now);
      let bucket: PendingTask['bucket'] = 'today';
      let titlePrefix = '';
      if (r.op_state === 'revisions_requested') {
        titlePrefix = 'Address revisions';
        bucket = d > 3 ? 'overdue' : 'today';
      } else if (r.op_state === 'draft') {
        titlePrefix = 'Complete Option Plan';
        bucket = d > 3 ? 'overdue' : 'today';
      } else if (r.vp_state === 'draft') {
        titlePrefix = 'Complete Value Plan';
        bucket = d > 3 ? 'overdue' : 'today';
      } else if (r.vp_state === 'approved' && !r.op_state) {
        titlePrefix = 'Start Option Plan';
        bucket = 'today';
      } else if (r.lifecycle_state === 'released' && !r.vp_state) {
        titlePrefix = 'Start Value Plan';
        bucket = 'today';
      } else {
        titlePrefix = 'Continue';
      }
      const brand = findBrand(r.brand_uuid)?.name ?? '';
      const cat = findCategory(r.category_uuid)?.name ?? '';
      const href = r.op_state || r.vp_state === 'approved'
        ? `/option/${r.plan_id}/${r.otb_code}`
        : `/value/${r.plan_id}/${r.otb_code}`;
      out.push({
        key: r.otb_code,
        title: `${titlePrefix} · ${cat || r.otb_code}`,
        subtitle: [brand, formatPeriodKey(r.period_key), `${d}d old`]
          .filter(Boolean).join(' · '),
        bucket,
        daysOld: d,
        href,
      });
    }
    // Sort overdue first, then by age.
    out.sort((a, b) => {
      if (a.bucket !== b.bucket) {
        const order = { overdue: 0, today: 1, waiting: 2 };
        return order[a.bucket] - order[b.bucket];
      }
      return b.daysOld - a.daysOld;
    });
    return out.slice(0, 8);
  }, [filteredRows, findBrand, findCategory]);

  return { tasks, isLoading };
}

// ── Period helper ───────────────────────────────────────────────────────────

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatPeriodKey(periodKey: string): string {
  if (!periodKey || periodKey.length < 7) return periodKey;
  const year = periodKey.slice(0, 4);
  const idx = parseInt(periodKey.slice(5, 7), 10) - 1;
  if (idx < 0 || idx > 11) return periodKey;
  return `${MONTH_LABELS[idx]} ${year}`;
}

// Suppress unused warnings when the constants module isn't otherwise used.
export const _UNUSED_STATES = OTB_STATES;

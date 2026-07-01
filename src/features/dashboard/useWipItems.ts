/**
 * Derives the WIP queue from server data:
 *   - Annual plans in draft/submitted state
 *   - OTB rows with vp_state / op_state needing attention
 *
 * Bucket model:
 *   drafts     → buyer to continue or start the next step
 *   review     → designer (or whoever can approve) needs to act
 *   revisions  → buyer to address designer's comments
 *   ready      → all approvals done, awaiting release / final approval
 *
 * Final-approved rows are NOT WIP — excluded from every bucket.
 */

import { useMemo } from 'react';
import { useApiAnnualPlans } from '@/features/otb/useApiAnnualPlans';
import { useApiAllOtbRows } from '@/features/otb/lifecycle/useApiOtbLifecycle';
import { useBrandCategoryLookup } from '@/features/otb/useOtbMaster';
import { useAllPlans } from '@/features/otb/useOtb';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { hydrateAnnualPlans } from '@/store/slices/otbSlice';
import { useEffect } from 'react';
import { OTB_STATES } from '@/features/otb/constants';
import type { OtbRowView } from '@/features/otb/lifecycle/types';
import type { AnnualPlan } from '@/features/otb/types';
import { daysOld, fmtAge } from './utils/age';
import type { DashboardFilters, PlanType } from './useDashboardFilters';

export type WipBucket = 'drafts' | 'review' | 'revisions' | 'ready';

export interface WipItem {
  /** Stable React key. */
  key: string;
  planType: PlanType;
  bucket: WipBucket;
  /** Short title — plan/OTB code. */
  title: string;
  /** Secondary line — brand · category · period. Empty for plan-level items. */
  subtitle: string;
  brandUuid?: string;
  categoryUuid?: string;
  /** YYYY-MM for OTB-row items; undefined for plan-level items. */
  periodKey?: string;
  modifiedMs?: number;
  ageLabel: string;
  isStuck: boolean;
  /** Where the action button navigates. */
  href: string;
  actionLabel: string;
}

export interface WipBuckets {
  drafts: WipItem[];
  review: WipItem[];
  revisions: WipItem[];
  ready: WipItem[];
}

const EMPTY_BUCKETS: WipBuckets = { drafts: [], review: [], revisions: [], ready: [] };

const STUCK_DAYS = 3;

export interface UseWipItemsResult {
  buckets: WipBuckets;
  totalCount: number;
  isLoading: boolean;
  isError: boolean;
  /** True only when there are zero plans AT ALL (vs zero WIP items). */
  noPlansAtAll: boolean;
}

export function useWipItems(filters: DashboardFilters): UseWipItemsResult {
  // Hydrate Redux from server so `useAllPlans()` returns the date window we
  // need to bound the lifecycle query. Mirrors the landing page pattern.
  const dispatch = useAppDispatch();
  const apiAnnual = useApiAnnualPlans();
  useEffect(() => {
    if (apiAnnual.data && apiAnnual.data.length > 0) {
      dispatch(hydrateAnnualPlans(apiAnnual.data));
    }
  }, [apiAnnual.data, dispatch]);
  const plans = useAllPlans();

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

  const { findBrand, findCategory } = useBrandCategoryLookup();

  const buckets = useMemo<WipBuckets>(() => {
    const allPlans = apiAnnual.data ?? [];
    const allRows = otbRowsQ.data ?? [];
    if (allPlans.length === 0 && allRows.length === 0) return EMPTY_BUCKETS;

    const now = Date.now();
    const out: WipBuckets = { drafts: [], review: [], revisions: [], ready: [] };

    // Annual-Plan-level items (only when the plan itself is in a WIP state).
    for (const plan of allPlans) {
      const item = annualPlanToItem(plan, now);
      if (!item) continue;
      if (!passesFilters(item, filters)) continue;
      out[item.bucket].push(item);
    }

    // OTB-row-level items.
    for (const row of allRows) {
      const item = otbRowToItem(row, now, findBrand, findCategory);
      if (!item) continue;
      if (!passesFilters(item, filters)) continue;
      out[item.bucket].push(item);
    }

    // Sort oldest first within each bucket — visibility prevents stuck items
    // from getting buried below freshly-touched ones.
    for (const k of Object.keys(out) as WipBucket[]) {
      out[k].sort((a, b) => (a.modifiedMs ?? 0) - (b.modifiedMs ?? 0));
    }
    return out;
  }, [apiAnnual.data, otbRowsQ.data, filters, findBrand, findCategory]);

  const totalCount = buckets.drafts.length + buckets.review.length +
    buckets.revisions.length + buckets.ready.length;
  const noPlansAtAll = (apiAnnual.data?.length ?? 0) === 0
    && (otbRowsQ.data?.length ?? 0) === 0
    && !apiAnnual.isLoading
    && !otbRowsQ.isLoading;

  return {
    buckets,
    totalCount,
    isLoading: apiAnnual.isLoading || otbRowsQ.isLoading,
    isError: apiAnnual.isError || otbRowsQ.isError,
    noPlansAtAll,
  };
}

// ── Item constructors ───────────────────────────────────────────────────────

function annualPlanToItem(plan: AnnualPlan, now: number): WipItem | null {
  let bucket: WipBucket;
  let actionLabel: string;
  if (plan.state === OTB_STATES.DRAFT) {
    bucket = 'drafts';
    actionLabel = 'Continue';
  } else if (plan.state === OTB_STATES.SUBMITTED) {
    bucket = 'review';
    actionLabel = 'Review';
  } else {
    return null; // approved / in_progress / locked / skipped — not WIP at plan level
  }
  const modifiedMs = plan.approved_at ?? plan.created_at;
  const d = daysOld(modifiedMs, now);
  return {
    key: `annual:${plan.plan_id}`,
    planType: 'annual',
    bucket,
    title: plan.name || plan.plan_id,
    subtitle: `${plan.plan_start_iso.slice(0, 10)} → ${plan.plan_end_iso.slice(0, 10)}`,
    modifiedMs,
    ageLabel: fmtAge(modifiedMs, now),
    isStuck: d > STUCK_DAYS,
    href: `/otb/${plan.plan_id}/annual`,
    actionLabel,
  };
}

function otbRowToItem(
  row: OtbRowView,
  now: number,
  findBrand: (uuid: string) => { name: string } | undefined,
  findCategory: (uuid: string) => { name: string } | undefined,
): WipItem | null {
  // Final-approved rows are not WIP.
  if (row.lifecycle_state === 'final_approved') return null;

  let bucket: WipBucket | null = null;
  let planType: PlanType = 'value';
  let actionLabel = 'Continue';
  let href = '';
  // Most-relevant timestamp = whichever state we landed in.
  let modifiedMs: number | undefined = row.modified_time;

  // OP states take precedence — once an Option Plan exists, it's the active
  // sub-stage of this OTB regardless of VP state.
  if (row.op_state === 'revisions_requested') {
    bucket = 'revisions';
    planType = 'option';
    actionLabel = 'Address revisions';
    href = `/option/${row.plan_id}/${row.otb_code}`;
  } else if (row.op_state === 'draft') {
    bucket = 'drafts';
    planType = 'option';
    actionLabel = 'Continue';
    href = `/option/${row.plan_id}/${row.otb_code}`;
  } else if (row.op_state === 'submitted') {
    bucket = 'review';
    planType = 'option';
    actionLabel = 'Review';
    href = `/option/${row.plan_id}/${row.otb_code}`;
  } else if (row.op_state === 'approved' && !row.final_approved_at) {
    bucket = 'ready';
    planType = 'option';
    actionLabel = 'Final approve';
    modifiedMs = row.op_approved_at ?? modifiedMs;
    href = `/otb/${row.plan_id}/${row.otb_code}/detail`;
  } else if (row.vp_state === 'submitted') {
    bucket = 'review';
    planType = 'value';
    actionLabel = 'Review';
    href = `/value/${row.plan_id}/${row.otb_code}`;
  } else if (row.vp_state === 'draft') {
    bucket = 'drafts';
    planType = 'value';
    actionLabel = 'Continue';
    href = `/value/${row.plan_id}/${row.otb_code}`;
  } else if (row.vp_state === 'approved' && !row.op_state) {
    bucket = 'drafts';
    planType = 'option';
    actionLabel = 'Start Option Plan';
    modifiedMs = row.vp_approved_at ?? modifiedMs;
    href = `/option/${row.plan_id}/${row.otb_code}`;
  } else if (row.lifecycle_state === 'released' && !row.vp_state) {
    bucket = 'drafts';
    planType = 'value';
    actionLabel = 'Start Value Plan';
    modifiedMs = row.released_at ?? modifiedMs;
    href = `/value/${row.plan_id}/${row.otb_code}`;
  }

  if (!bucket) return null;

  const brand = findBrand(row.brand_uuid);
  const category = findCategory(row.category_uuid);
  const subtitleParts = [
    brand?.name,
    category?.name,
    formatPeriodKey(row.period_key),
  ].filter(Boolean);

  const d = daysOld(modifiedMs, now);
  return {
    key: `otb:${row.plan_id}:${row.otb_code}:${planType}`,
    planType,
    bucket,
    title: row.otb_code,
    subtitle: subtitleParts.join(' · '),
    brandUuid: row.brand_uuid,
    categoryUuid: row.category_uuid,
    periodKey: row.period_key,
    modifiedMs,
    ageLabel: fmtAge(modifiedMs, now),
    isStuck: d > STUCK_DAYS,
    href,
    actionLabel,
  };
}

// ── Filter logic ────────────────────────────────────────────────────────────

function passesFilters(item: WipItem, filters: DashboardFilters): boolean {
  if (filters.brands.length > 0) {
    if (!item.brandUuid || !filters.brands.includes(item.brandUuid)) return false;
  }
  if (filters.categories.length > 0) {
    if (!item.categoryUuid || !filters.categories.includes(item.categoryUuid)) return false;
  }
  // Stuck items override the date filter — overdue work should never go
  // invisible just because it sits outside the buyer's forward window.
  if (item.isStuck) return true;
  // Date range applies to OTB-row items only (they carry period_key);
  // Annual-plan items don't get date-filtered because they cover the whole
  // plan window.
  if ((filters.from || filters.to) && item.periodKey) {
    if (filters.from && item.periodKey < filters.from) return false;
    if (filters.to && item.periodKey > filters.to) return false;
  }
  return true;
}

// "2026-01" → "Jan 2026". Used in WIP item subtitles.
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatPeriodKey(periodKey: string): string {
  if (!periodKey || periodKey.length < 7) return periodKey;
  const year = periodKey.slice(0, 4);
  const monthIdx = parseInt(periodKey.slice(5, 7), 10) - 1;
  if (monthIdx < 0 || monthIdx > 11) return periodKey;
  return `${MONTH_LABELS[monthIdx]} ${year}`;
}
